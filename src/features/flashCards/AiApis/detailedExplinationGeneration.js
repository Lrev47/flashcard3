import OpenAI from 'openai';
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';
import cardService from '../services/cardService.js';
import topicService from '../services/topicService.js';
import pLimit from 'p-limit';

const DetailedExplanationSchema = z.object({
  detailedExplanation: z.string(),
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const limit = pLimit(50);

export async function docAllCards() {
  console.log('[detailedExplinationGeneration] Fetching cards where detailedExplanation = null...');
  const cards = await cardService.findMany({ detailedExplanation: null });
  console.log(`[detailedExplinationGeneration] Found ${cards.length} card(s) needing an explanation. Generating...`);

  const promises = cards.map(card => limit(() => docSingleCard(card)));
  await Promise.all(promises);

  console.log('[detailedExplinationGeneration] Done generating explanations for all cards.');
  return { message: `Generated explanations for ${cards.length} cards.` };
}

async function docSingleCard(card) {
  console.log(`\n[detailedExplinationGeneration] docSingleCard => card ID: ${card.id}, question: "${card.question}"`);

  let subtopicName = '';
  let parentTopicName = '';
  if (card.topic) {
    subtopicName = card.topic.name || '';
    if (card.topic.parentTopicId) {
      const parentTopic = await topicService.findById(card.topic.parentTopicId);
      parentTopicName = parentTopic?.name || '';
    }
  }

  let examplesStr = '';
  if (card.examples && card.examples.code) {
    examplesStr = String(card.examples.code);
  }

  const systemMessage = `
    You have the following data:
    - question: "${card.question}"
    - answer: "${card.answer}"
    - examples: "${examplesStr}"
    - subtopic: "${subtopicName}"
    - parent topic: "${parentTopicName}"

    Create a verbose, organized, in-depth explanation for this Q/A,
    in **Markdown** format, to help the user understand thoroughly.

    Return your result in JSON like:
    {
      "detailedExplanation": "...(your markdown text)..."
    }

    No extra fields beyond "detailedExplanation".
    The user wants the explanation in pure markdown to show on a website.
  `;

  try {
    const completion = await openai.beta.chat.completions.parse({
      model: 'gpt-4o-mini-2024-07-18',
      messages: [{ role: 'system', content: systemMessage }],
      response_format: zodResponseFormat(DetailedExplanationSchema, 'detailedExplanation'),
      temperature: 0.7,
      max_tokens: 5000,
    });

    const assistantMessage = completion.choices[0].message;
    if (assistantMessage.refusal) {
      console.warn(`[detailedExplinationGeneration] Model refused to generate doc for card ID: ${card.id}.`);
      return;
    }

    const parsed = assistantMessage.parsed;
    console.log(`[detailedExplinationGeneration] card ID: ${card.id}, doc result =>`, parsed);

    const updates = {
      detailedExplanation: parsed.detailedExplanation,
    };

    console.log(`[detailedExplinationGeneration] Updating card ID: ${card.id} with new detailedExplanation...`);
    await cardService.update(card.id, updates);
  } catch (error) {
    console.error(`[detailedExplinationGeneration] Error generating explanation for card ID: ${card.id}:`, error);
  }
}
