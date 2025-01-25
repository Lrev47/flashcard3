import OpenAI from 'openai';
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';
import cardService from '../services/cardService.js'; 
import topicService from '../services/topicService.js';
import pLimit from 'p-limit';

const limit = pLimit(100);

const SingleAICardSchema = z
  .object({
    question: z.string(),
    answer: z.string(),
    answerType: z.enum(['NONE', 'CODE_SNIPPET', 'FLOWCHART', 'DIAGRAM']),
    codeSnippet: z.string().optional(),
  })
  .strict();

const AICardObjectSchema = z
  .object({
    cards: z.array(SingleAICardSchema),
  })
  .strict();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateFlashcardsForTopic(topic, authorName = null) {
  console.log(`\n[cardGeneration] generateFlashcardsForTopic => Topic name: ${topic.name}, ID: ${topic.id}`);

  let parentTopicName = '';
  if (topic.parentTopicId) {
    console.log(`[cardGeneration] Topic has a parentTopicId: ${topic.parentTopicId}. Fetching parent...`);
    const parent = await topicService.findById(topic.parentTopicId);
    parentTopicName = parent?.name || '';
    console.log(`[cardGeneration] Parent topic name: ${parentTopicName}`);
  }

  const systemMessage = `
    You are an AI that generates flashcards for the topic "${topic.name}" 
    in the context of its parent topic "${parentTopicName || 'none'}".

    Requirements:
    1) Generate between 1 and 10 flashcards in total.
    2) Each flashcard must address a core knowledge point of "${topic.name}" 
       without repeating the same question.
    3) Each flashcard must have ONLY these fields:
       - question (string)
       - answer (string)
       - answerType (NONE, CODE_SNIPPET, FLOWCHART, DIAGRAM)
       - codeSnippet (string, optional)
    4) If answerType is CODE_SNIPPET, provide ONLY the relevant code snippet 
       in codeSnippet as plain text. No extra commentary.

    Final JSON Output:
    {
      "cards": [
        {
          "question": "...",
          "answer": "...",
          "answerType": "NONE | CODE_SNIPPET | FLOWCHART | DIAGRAM",
          "codeSnippet": "...or empty if not a code snippet..."
        }
      ]
    }
    No extra fields beyond these!
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
      console.warn(`[cardGeneration] Model refused to generate cards for topic ${topic.name}`);
      return;
    }

    const parsedData = assistantMessage.parsed;
    if (!Array.isArray(parsedData.cards)) {
      console.warn(`[cardGeneration] No valid cards array found for topic ${topic.name}.`);
      return;
    }

    let aiCards = parsedData.cards;
    if (aiCards.length > 10) {
      aiCards = aiCards.slice(0, 10);
    }

    const createPromises = aiCards.map(card => {
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

    await topicService.update(topic.id, { cardsGenerated: 'YES' });
    console.log(`[cardGeneration] Done generating flashcards for topic: "${topic.name}".`);
  } catch (error) {
    console.error(`[cardGeneration] Error generating flashcards for topic ${topic.name}:`, error);
  }
}

export async function generateCardsForAllPendingTopics(authorName = null) {
  console.log('\n[cardGeneration] generateCardsForAllPendingTopics => Looking for topics with cardsGenerated = null...');
  const topics = await topicService.findManyByCardsGeneratedNull();
  console.log(`[cardGeneration] Found ${topics.length} topic(s) needing flashcards generation.`);

  const promises = topics.map(topic => limit(() => generateFlashcardsForTopic(topic, authorName)));
  await Promise.all(promises);
  console.log('[cardGeneration] All pending flashcards generation tasks completed.');
  return { message: `Generated flashcards for ${topics.length} topics.` };
}

export async function generateMoreCardsForTopic(topic, additionalCount = 5, authorName = null) {
  console.log(`\n[cardGeneration] generateMoreCardsForTopic => Topic: "${topic.name}" (ID: ${topic.id})`);
  console.log(`[cardGeneration] We want ${additionalCount} *new* cards for this topic.`);

  const existingCards = await cardService.findByTopicId(topic.id);
  const existingQuestions = existingCards.map(c => c.question.trim());

  let parentTopicName = '';
  if (topic.parentTopicId) {
    const parent = await topicService.findById(topic.parentTopicId);
    parentTopicName = parent?.name || '';
  }

  const systemMessage = `
    You are an AI that generates *additional* flashcards for the topic "${topic.name}"
    in the context of its parent topic "${parentTopicName || 'none'}".

    We already have these questions (avoid duplicates):
    - ${existingQuestions.join('\n- ')}

    Generate exactly ${additionalCount} new flashcards that do not repeat any of the above questions.
    Each flashcard must have ONLY these fields:
      - question
      - answer
      - answerType (NONE, CODE_SNIPPET, FLOWCHART, DIAGRAM)
      - codeSnippet (string, optional if code snippet)

    If you choose CODE_SNIPPET, provide ONLY the relevant code snippet in codeSnippet as plain text.

    Return JSON:
    {
      "cards": [
        { "question": "...", "answer": "...", "answerType": "...", "codeSnippet": "..." }
      ]
    }
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
      console.warn(`[cardGeneration] Model refused to generate additional cards for topic: ${topic.name}`);
      return [];
    }

    const parsedData = assistantMessage.parsed;
    if (!Array.isArray(parsedData.cards)) {
      console.warn(`[cardGeneration] No valid "cards" array found for "${topic.name}".`);
      return [];
    }

    const createPromises = parsedData.cards.map(card => {
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
    console.log(`[cardGeneration] Created ${createdCards.length} additional cards for topic "${topic.name}".`);
    return createdCards;
  } catch (error) {
    console.error(`[cardGeneration] Error generating additional flashcards for "${topic.name}":`, error);
    return [];
  }
}
