// src/features/topics/AiApis/topicGeneration.js

import OpenAI from 'openai'; 
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';
import topicService from '../services/topicService.js'; 
import prisma from '../../../config/prismaClient.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SubtopicsObjectSchema = z.object({
  subtopics: z.array(z.string()),
});

let apiCallCount = 0;
const MAX_API_CALLS = 365;
const MAX_SUBTOPICS = 12;

/**
 * condenseUserGoalToDeckName(userGoal)
 * Creates a concise deck title from a user's messy input.
 */
async function condenseUserGoalToDeckName(userGoal) {
  try {
    const systemPrompt = `
      You are a specialized assistant that takes a user's lengthy or messy topic request
      and produces a concise, clear deck title (one short phrase).

      Example input: "I want to learn the basics of Node.js + Express and testing"
      Example output: "Node.js & Express Foundations"

      The userGoal is: "${userGoal}"

      Return your answer in JSON:
      {
        "deckTitle": "Short, concise phrase..."
      }
    `;
    const DeckTitleSchema = z.object({ deckTitle: z.string() });

    const completion = await openai.beta.chat.completions.parse({
      model: 'gpt-4o-mini-2024-07-18',
      messages: [{ role: 'system', content: systemPrompt }],
      response_format: zodResponseFormat(DeckTitleSchema, 'deckTitle'),
      temperature: 0.7,
      max_tokens: 100,
    });

    const assistantMsg = completion.choices[0].message;
    if (assistantMsg.refusal) {
      console.warn('[condenseUserGoalToDeckName] The model refused.', assistantMsg.refusal);
      return userGoal;
    }
    const parsed = assistantMsg.parsed;
    return parsed.deckTitle || userGoal;
  } catch (err) {
    console.error('[condenseUserGoalToDeckName] Error:', err);
    return userGoal;
  }
}

/**
 * createAndExpandDeck(userGoal, userId)
 * Creates a new deck with a condensed title,
 * then creates a parentTopic, and expands subtopics for that topic.
 */
export async function createAndExpandDeck(userGoal, userId) {
  apiCallCount = 0;

  // 1) Condense user goal to a short deck title
  const condensedTitle = await condenseUserGoalToDeckName(userGoal);

  // 2) Create a parent topic for this userGoal
  const parentTopic = await topicService.createTopic({
    name: userGoal,
    overview: null,
    parentTopicId: null,
  });

  // 3) Create deck that references this new parentTopic
  const isPublic = !userId;
  const deck = await prisma.deck.create({
    data: {
      name: condensedTitle,
      isPublic,
      userId: userId || null,
      topicId: parentTopic.id,
    },
  });

  // 4) Expand subtopics for the newly created parentTopic
  await expandSubtopicsForTopic(parentTopic);

  return { deck, parentTopic };
}

/**
 * expandSubtopicsForTopic(parentTopic)
 * Expand subtopics in up to 3 rounds, each round generating up to 3 new subtopics per leaf.
 */
async function expandSubtopicsForTopic(parentTopic) {
  let totalSubtopicsCreated = 0;
  apiCallCount = 0;

  const allSubtopics = new Set([parentTopic.name]);
  let currentTopicsToExpand = [parentTopic];

  for (let round = 1; round <= 3; round++) {
    console.log(`\n=== Round #${round} ===`);
    const newlyFoundTopics = [];

    for (const topicObj of currentTopicsToExpand) {
      if (apiCallCount >= MAX_API_CALLS) {
        console.log(`Reached the max number of API calls (${MAX_API_CALLS}), stopping.`);
        break;
      }
      apiCallCount++;

      // Generate subtopics for current topic
      const subtopics = await generateSubtopics(topicObj.name, Array.from(allSubtopics));

      for (const subName of subtopics) {
        if (totalSubtopicsCreated >= MAX_SUBTOPICS) {
          console.log(`Reached the max subtopic limit of ${MAX_SUBTOPICS}. Stopping.`);
          break;
        }

        if (!allSubtopics.has(subName)) {
          allSubtopics.add(subName);

          // Create a new subtopic record
          const newSubtopic = await topicService.createTopic({
            name: subName,
            overview: null,
            parentTopicId: topicObj.id,
          });
          newlyFoundTopics.push(newSubtopic);

          totalSubtopicsCreated++;
          console.log(
            `Created subtopic: "${subName}" under parent "${topicObj.name}". 
             Total subtopics so far: ${totalSubtopicsCreated}`
          );
        }
      }

      if (totalSubtopicsCreated >= MAX_SUBTOPICS) break;
      if (apiCallCount >= MAX_API_CALLS) break;
    }

    if (newlyFoundTopics.length === 0 || totalSubtopicsCreated >= MAX_SUBTOPICS) {
      console.log(`Stopping early in round #${round}.`);
      break;
    }

    currentTopicsToExpand = newlyFoundTopics;
  }
}

/**
 * generateSubtopics(topicContext, existingSubtopics)
 * Return exactly 3 new subtopics (or fewer if no more are found).
 */
async function generateSubtopics(topicContext, existingSubtopics) {
  const noDupesList = existingSubtopics.length
    ? `These subtopics have already been considered:\n- ${existingSubtopics.join('\n- ')}\n`
    : `No subtopics have been considered yet.\n`;

  const systemMessage = `
    You are an AI that creates subtopics for flashcards and learning purposes.
    The user wants to create flashcards about: "${topicContext}"

    Keep the subtopics strictly focused on the fundamental aspects of "${topicContext}".
    Avoid overly advanced or tangential topics.
    Keep the scope small and relevant to the user’s stated goal.
    Only provide exactly 3 new subtopics that would be useful for building flashcards.
    
    ${noDupesList}
    
    Return your answer in JSON:
    {
      "subtopics": [ "subtopic A", "subtopic B", "subtopic C" ]
    }

    If there are no new subtopics to add, respond with:
    {
      "subtopics": []
    }
  `;

  try {
    const completion = await openai.beta.chat.completions.parse({
      model: 'gpt-4o-mini-2024-07-18',
      messages: [{ role: 'system', content: systemMessage }],
      response_format: zodResponseFormat(SubtopicsObjectSchema, 'subtopics'),
      temperature: 0.7,
      max_tokens: 150,
    });

    const assistantMessage = completion.choices[0].message;
    if (assistantMessage.refusal) {
      console.warn('The model refused to generate subtopics:', assistantMessage.refusal);
      return [];
    }

    const parsedData = assistantMessage.parsed;
    if (!Array.isArray(parsedData.subtopics)) {
      console.warn('No valid subtopics array found, returning empty array');
      return [];
    }

    return parsedData.subtopics;
  } catch (error) {
    console.error('OpenAI API error or parse error:', error);
    return [];
  }
}

/**
 * expandTopicFurther(parentTopicId, alreadySubtopics)
 * Additional subtopic expansions for leaf nodes under a parent topic.
 */
export async function expandTopicFurther(parentTopicId, alreadySubtopics = []) {
  if (apiCallCount >= MAX_API_CALLS) {
    console.log(`Reached the max number of API calls (${MAX_API_CALLS}), cannot expand further.`);
    return [];
  }

  const parentTopic = await topicService.findById(parentTopicId);
  if (!parentTopic) {
    console.warn('No topic found with given parentTopicId:', parentTopicId);
    return [];
  }

  const allSubtopics = new Set([parentTopic.name, ...alreadySubtopics]);

  // Find leaf topics under the parent
  const leafTopics = await topicService.findLeafTopicsByParentId(parentTopicId);
  if (leafTopics.length === 0) {
    console.log(`No leaf topics found under parent #${parentTopicId}, nothing to expand.`);
    return [];
  }

  const newlyFoundTopics = [];

  for (const leaf of leafTopics) {
    if (apiCallCount >= MAX_API_CALLS) break;
    apiCallCount++;

    const subtopics = await generateSubtopics(leaf.name, Array.from(allSubtopics));
    for (const subName of subtopics) {
      if (!allSubtopics.has(subName)) {
        allSubtopics.add(subName);

        const newSubtopic = await topicService.createTopic({
          name: subName,
          overview: null,
          parentTopicId: leaf.id,
        });
        newlyFoundTopics.push(newSubtopic);

        console.log(`Created subtopic: ${subName}, parentID => ${leaf.id}`);
      }
    }
  }

  return newlyFoundTopics;
}
