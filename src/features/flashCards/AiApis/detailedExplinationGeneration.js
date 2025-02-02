// src/features/flashCards/AiApis/detailedExplinationGeneration.js

import OpenAI from 'openai';
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';
import cardService from '../services/cardService.js';
import topicService from '../../topics/services/topicService.js';
import pLimit from 'p-limit';

/**
 * We want a JSON object:
 * {
 *   "title": "string",
 *   "blocks": [
 *     {
 *       "blockTitle": "short heading",
 *       "content": "comprehensive text",
 *       "order": 1
 *     },
 *     ... total 5 blocks
 *   ]
 * }
 *
 * Because OpenAI’s JSON schema does NOT allow "min"/"max" or "minLength"/"maxLength",
 * we define a "loose" schema for OpenAI, then do stricter local validation.
 */

// 1) Looser schema for OpenAI
const ExplanationBlocksOpenAISchema = z.object({
  title: z.string(),
  blocks: z.array(
    z.object({
      blockTitle: z.string(),
      content: z.string(),
      // No min(1)/max(5) for 'order' in the schema we send to OpenAI
      order: z.number().int()
    })
  )
});

// 2) Stricter local schema if we want to ensure 5 blocks, etc.
const ExplanationBlocksStrictSchema = z.object({
  title: z.string().nonempty(),
  blocks: z
    .array(
      z.object({
        blockTitle: z.string().nonempty(),
        content: z.string().nonempty(),
        order: z.number().int().min(1).max(5)
      })
    )
    .length(5)
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const limit = pLimit(50);

/* ---------------------------------------------------------------------------
 * docAllCards()
 * Now we look for cards where `DetailesGenerated == null`.
 * For each such card, we generate an explanation, store it, and then
 * update `DetailesGenerated` to "YES".
 * ------------------------------------------------------------------------- */
export async function docAllCards() {
  console.log('[detailedExplanationGeneration] Fetching cards where DetailesGenerated == null...');
  const cards = await cardService.findAllWhereDetailesGeneratedIsNull();

  console.log(
    `[detailedExplanationGeneration] Found ${cards.length} card(s) needing detail generation. Generating...`
  );

  const promises = cards.map((card) => limit(() => docSingleCard(card)));
  await Promise.all(promises);

  console.log('[detailedExplanationGeneration] Done generating explanations for all cards.');
  return { message: `Generated explanations for ${cards.length} cards.` };
}

/* ---------------------------------------------------------------------------
 * docAllCardsByTopicAndSubtopics(topicId)
 * (If you still want to do it by topic, you can combine logic:
 *  filter by subtopics + detailesGenerated == null, etc.)
 * ------------------------------------------------------------------------- */
export async function docAllCardsByTopicAndSubtopics(topicId) {
  console.log(`[detailedExplanationGeneration] Fetching all cards under topic ${topicId} + subtopics...`);
  const allCards = await cardService.findAllByParentTopicIdIncludeSubtopics(topicId);

  // Filter out only those that have DetailesGenerated == null
  const missingExpCards = allCards.filter((card) => card.DetailesGenerated == null);

  console.log(
    `[detailedExplanationGeneration] Found ${missingExpCards.length} card(s) needing explanation under topic ${topicId}. Generating...`
  );

  const promises = missingExpCards.map((card) => limit(() => docSingleCard(card)));
  await Promise.all(promises);

  console.log(`[detailedExplanationGeneration] Done generating explanations for topic ${topicId} + subtopics.`);
  return { message: `Generated explanations for ${missingExpCards.length} cards under topic ${topicId}.` };
}

/* ---------------------------------------------------------------------------
 * docSingleCard(card)
 * Takes a single card object, prompts the AI to produce a structured explanation,
 * then upserts that into the DB. Finally, sets DetailesGenerated = "YES".
 * ------------------------------------------------------------------------- */
async function docSingleCard(card) {
  try {
    console.log(`[detailedExplanationGeneration] docSingleCard => card ID: ${card.id}, question: "${card.question}"`);

    // Gather subtopic & parent
    let subtopicName = '';
    let parentTopicName = '';
    if (card.topic) {
      subtopicName = card.topic.name || '';
      if (card.topic.parentTopicId) {
        const parentTopic = await topicService.findById(card.topic.parentTopicId);
        parentTopicName = parentTopic?.name || '';
      }
    }

    // If we have code examples
    let examplesStr = '';
    if (card.examples && card.examples.code) {
      examplesStr = String(card.examples.code);
    }

    // Compose system message
    const systemMessage = `
      You have the following data:
      - question: "${card.question}"
      - answer: "${card.answer}"
      - examples: "${examplesStr}"
      - subtopic: "${subtopicName}"
      - parent topic: "${parentTopicName}"

      Create a comprehensive explanation for this Q/A in JSON form:
      {
        "title": "short descriptive title based on the question",
        "blocks": [
          {
            "blockTitle": "heading for this block",
            "content": "the in-depth explanation text",
            "order": 1
          },
          ...
          // exactly 5 total blocks, with orders 1..5
        ]
      }

      - No extra fields beyond "title" and "blocks".
      - blockTitle is a heading label, block content is plain text.
      - Must have exactly 5 blocks, each with unique order from 1 to 5.
      - Do not use markdown or special formatting in the content.
    `;

    // 1) First pass: parse with the "looser" schema for OpenAI
    const completion = await openai.beta.chat.completions.parse({
      model: 'gpt-4o-mini-2024-07-18', // Example model name
      messages: [{ role: 'system', content: systemMessage }],
      response_format: zodResponseFormat(ExplanationBlocksOpenAISchema, 'explanationBlocks'),
      temperature: 0.7,
      max_tokens: 3000
    });

    const assistantMessage = completion.choices[0].message;
    if (assistantMessage.refusal) {
      console.warn(`[detailedExplanationGeneration] Model refused for card ID: ${card.id}.`);
      return;
    }

    // 2) Second pass: parse with "strict" schema (enforce 5 blocks, etc.)
    const parsed = ExplanationBlocksStrictSchema.parse(assistantMessage.parsed);
    console.log(`[detailedExplanationGeneration] card ID: ${card.id}, doc result =>`, parsed);

    // Derive blockType from blockTitle (IMAGE, VIDEO, or TEXT) if relevant
    const blocks = parsed.blocks.map((b) => {
      let blockType = 'TEXT';
      const titleUpper = b.blockTitle.toUpperCase();
      if (titleUpper.includes('IMAGE')) {
        blockType = 'IMAGE';
      } else if (titleUpper.includes('VIDEO')) {
        blockType = 'VIDEO';
      }
      return {
        blockType,
        blockTitle: b.blockTitle,
        content: b.content,
        order: b.order
      };
    });

    // Upsert into DB
    const explanationData = {
      title: parsed.title,
      blocks
    };
    await cardService.upsertExplanation(card.id, explanationData);

    // 3) Mark the Card as having details generated
    await cardService.update(card.id, {
      DetailesGenerated: 'YES'
    });

    console.log(`[detailedExplanationGeneration] Explanation stored, and DetailesGenerated set to "YES" for card ${card.id}.`);
  } catch (error) {
    console.error(`[detailedExplanationGeneration] Error generating explanation for card ${card.id}:`, error);
  }
}
