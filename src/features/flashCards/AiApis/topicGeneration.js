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
    const DeckTitleSchema = z.object({
      deckTitle: z.string(),
    });

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

export async function createAndExpandDeck(userGoal, userId) {
  apiCallCount = 0;


  const condensedTitle = await condenseUserGoalToDeckName(userGoal);

  const parentTopic = await topicService.createTopic({
    name: userGoal,
    overview: null,
    parentTopicId: null,
  });

  const isPublic = !userId;
  const deck = await prisma.deck.create({
    data: {
      name: condensedTitle,
      isPublic,
      userId: userId || null,
      topicId: parentTopic.id,
    },
  });

  await expandSubtopicsForTopic(parentTopic);

 
  return { deck, parentTopic };
}

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

      
      const subtopics = await generateSubtopics(topicObj.name, Array.from(allSubtopics));

      
      for (const subName of subtopics) {
        if (totalSubtopicsCreated >= MAX_SUBTOPICS) {
          console.log(`Reached the max subtopic limit of ${MAX_SUBTOPICS}. Stopping further expansions.`);
          break;
        }

        if (!allSubtopics.has(subName)) {
          allSubtopics.add(subName);

         
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

      if (totalSubtopicsCreated >= MAX_SUBTOPICS) {
        console.log(`No more subtopics will be created in this round.`);
        break;
      }

      if (apiCallCount >= MAX_API_CALLS) {
        console.log(`Reached the max number of API calls (${MAX_API_CALLS}), stopping.`);
        break;
      }
    }

    if (newlyFoundTopics.length === 0 || totalSubtopicsCreated >= MAX_SUBTOPICS) {
      console.log(`Stopping early in round #${round}.`);
      break;
    }

    currentTopicsToExpand = newlyFoundTopics;
  }
}

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
    
    Return your answer in the following JSON format:
    {
      "subtopics": [ "subtopic A", "subtopic B", "subtopic C" ]
    }

    If there are no new subtopics to add (i.e., the user already has everything),
    respond with:
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
