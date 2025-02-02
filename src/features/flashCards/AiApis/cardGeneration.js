// src/features/flashCards/AiApis/cardGeneration.js

import OpenAI from 'openai';
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';
import cardService from '../services/cardService.js';
import topicService from '../../topics/services/topicService.js';
import pLimit from 'p-limit';

const limit = pLimit(100);

// 1. Zod schemas for AI card generation
const SingleAICardSchema = z
  .object({
    question: z.string(),
    answer: z.string(),
    answerType: z.enum(['NONE', 'CODE_SNIPPET', 'FLOWCHART', 'DIAGRAM']),
    codeSnippet: z.string().optional(),
  })
  .strict();

const AICardObjectSchema = z.object({
  cards: z.array(SingleAICardSchema),
}).strict();

// 2. OpenAI Setup
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 3. Main Functions

/**
 * generateFlashcardsForTopic(topic, authorName)
 * Creates 1-10 new flashcards for a topic, sets topic.cardsGenerated = "YES".
 */
export async function generateFlashcardsForTopic(topic, authorName = null) {
  console.log(`\n[cardGeneration] generateFlashcardsForTopic => Topic name: ${topic.name}, ID: ${topic.id}`);

  let parentTopicName = '';
  if (topic.parentTopicId) {
    console.log(`[cardGeneration] Topic has parentTopicId: ${topic.parentTopicId}. Fetching parent...`);
    const parent = await topicService.findById(topic.parentTopicId);
    parentTopicName = parent?.name || '';
    console.log(`[cardGeneration] Parent topic name: ${parentTopicName}`);
  }

  const systemMessage = `
    You are an AI that generates flashcards for the topic "${topic.name}"
    in the context of its parent topic "${parentTopicName || 'none'}".

    Requirements:
    1) Generate between 1 and 10 flashcards in total.
    2) Each flashcard must have ONLY:
       - question
       - answer
       - answerType (NONE, CODE_SNIPPET, FLOWCHART, DIAGRAM)
       - codeSnippet (string, if code)
    3) If answerType is CODE_SNIPPET, put only the code snippet in 'codeSnippet'.

    Output:
    {
      "cards": [
        {
          "question": "...",
          "answer": "...",
          "answerType": "...",
          "codeSnippet": "..."
        }
      ]
    }
  `;

  try {
    const completion = await openai.beta.chat.completions.parse({
      model: 'gpt-4o-mini-2024-07-18',
      messages: [{ role: 'system', content: systemMessage }],
      response_format: zodResponseFormat(AICardObjectSchema, 'cards'),
      temperature: 0.7,
      max_tokens: 5000,
    });

    const assistantMessage = completion.choices[0].message;
    if (assistantMessage.refusal) {
      console.warn(`[cardGeneration] Model refused to generate cards for topic: ${topic.name}`);
      return;
    }

    const parsedData = assistantMessage.parsed;
    if (!Array.isArray(parsedData.cards)) {
      console.warn(`[cardGeneration] No valid cards array found for topic ${topic.name}.`);
      return;
    }

    // Limit to 10
    let aiCards = parsedData.cards;
    if (aiCards.length > 10) {
      aiCards = aiCards.slice(0, 10);
    }

    const createPromises = aiCards.map((card) => {
      const newCard = {
        question: card.question,
        answer: card.answer,
        answerType: card.answerType || 'NONE',
        topicId: topic.id,
        examples: card.answerType === 'CODE_SNIPPET' && card.codeSnippet
          ? { code: card.codeSnippet }
          : undefined,
        authorName: authorName || null,
      };
      return cardService.create(newCard);
    });

    await Promise.all(createPromises);

    // Mark this topic as having generated cards
    await topicService.updateTopic(topic.id, { cardsGenerated: 'YES' });

    console.log(`[cardGeneration] Done generating flashcards for topic: "${topic.name}".`);
  } catch (error) {
    console.error(`[cardGeneration] Error generating flashcards for topic ${topic.name}:`, error);
  }
}

/**
 * generateCardsForAllPendingTopics(authorName)
 * Finds all topics with `cardsGenerated = null` and calls generateFlashcardsForTopic on each.
 */
export async function generateCardsForAllPendingTopics(authorName = null) {
  console.log('[cardGeneration] Looking for topics where cardsGenerated=null...');
  const topics = await topicService.findManyByCardsGeneratedNull();
  console.log(`[cardGeneration] Found ${topics.length} topic(s) needing flashcards.`);

  const promises = topics.map((topic) => limit(() => generateFlashcardsForTopic(topic, authorName)));
  await Promise.all(promises);

  console.log('[cardGeneration] All pending flashcards generation tasks completed.');
  return { message: `Generated flashcards for ${topics.length} topics.` };
}

/**
 * generateCardsForAllPendingTopicsInSubtree(parentTopicId, authorName)
 * - Gathers all descendant topics plus the parent
 * - Filters to those with cardsGenerated=null
 * - Generates flashcards for each
 */
export async function generateCardsForAllPendingTopicsInSubtree(parentTopicId, authorName = null) {
  console.log(`[cardGeneration] Descendant topics for parent ID: ${parentTopicId}...`);
  const allDescIds = await topicService.findAllDescendantTopicIds(parentTopicId);
  allDescIds.push(parentTopicId);

  // Find topics in that subtree with cardsGenerated=null
  const topicsInSubtree = await topicService.findMany({
    where: {
      id: { in: allDescIds },
      cardsGenerated: null,
    },
  });

  console.log(`[cardGeneration] Found ${topicsInSubtree.length} subtree topics needing flashcards.`);

  const promises = topicsInSubtree.map((topic) => limit(() => generateFlashcardsForTopic(topic, authorName)));
  await Promise.all(promises);

  console.log('[cardGeneration] Subtree-based flashcards generation done.');
  return { message: `Generated flashcards for ${topicsInSubtree.length} topics in the subtree.` };
}

/**
 * generateMoreCardsForTopic(topic, additionalCount, authorName)
 * Asks AI for additional (non-duplicate) flashcards.
 */
export async function generateMoreCardsForTopic(topic, additionalCount = 5, authorName = null) {
  console.log(`\n[cardGeneration] generateMoreCardsForTopic => Topic: "${topic.name}" (ID: ${topic.id})`);
  console.log(`[cardGeneration] We want ${additionalCount} *new* cards.`);

  const existingCards = await cardService.findByTopicId(topic.id);
  const existingQuestions = existingCards.map((c) => c.question.trim());

  let parentTopicName = '';
  if (topic.parentTopicId) {
    const parent = await topicService.findById(topic.parentTopicId);
    parentTopicName = parent?.name || '';
  }

  const systemMessage = `
    You are an AI generating *additional* flashcards for "${topic.name}"
    (parent: "${parentTopicName || 'none'}").

    Already have these questions:
    - ${existingQuestions.join('\n- ')}

    Generate exactly ${additionalCount} new flashcards with no duplicates.
    Each card: { question, answer, answerType, codeSnippet? }
  `;

  try {
    const completion = await openai.beta.chat.completions.parse({
      model: 'gpt-4o-mini-2024-07-18',
      messages: [{ role: 'system', content: systemMessage }],
      response_format: zodResponseFormat(AICardObjectSchema, 'cards'),
      temperature: 0.7,
      max_tokens: 3000,
    });

    const assistantMessage = completion.choices[0].message;
    if (assistantMessage.refusal) {
      console.warn(`[cardGeneration] Model refused additional cards for topic: ${topic.name}`);
      return [];
    }

    const parsedData = assistantMessage.parsed;
    if (!Array.isArray(parsedData.cards)) {
      console.warn(`[cardGeneration] No valid "cards" array found for: ${topic.name}.`);
      return [];
    }

    const createPromises = parsedData.cards.map((card) => {
      return cardService.create({
        question: card.question,
        answer: card.answer,
        answerType: card.answerType || 'NONE',
        topicId: topic.id,
        examples: card.answerType === 'CODE_SNIPPET' && card.codeSnippet
          ? { code: card.codeSnippet }
          : undefined,
        authorName: authorName || null,
      });
    });
    const createdCards = await Promise.all(createPromises);
    console.log(`[cardGeneration] Created ${createdCards.length} additional cards for "${topic.name}".`);
    return createdCards;
  } catch (error) {
    console.error(`[cardGeneration] Error generating additional flashcards for "${topic.name}":`, error);
    return [];
  }
}
