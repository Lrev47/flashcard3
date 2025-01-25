import cardService from '../services/cardService.js';
import topicService from '../services/topicService.js';
import { createAndExpandDeck, expandTopicFurther } from '../AiApis/topicGeneration.js';
import { generateFlashcardsForTopic } from '../AiApis/cardGeneration.js';

export async function getAllAncestorTopicIdsHandler(req, res) {
  try {
    const { topicId } = req.params;
    if (!topicId) {
      return res.status(400).json({
        message: 'Please provide a topicId in the URL.',
      });
    }

    const ancestorIds = await topicService.findAllAncestorTopicIds(topicId);
    return res.status(200).json({
      message: `Ancestor topic IDs for topic ${topicId}`,
      data: ancestorIds,
    });
  } catch (error) {
    console.error('[topicOperationsController] Error fetching ancestor topic IDs:', error);
    return res.status(500).json({
      message: 'Error fetching ancestor topic IDs',
      error,
    });
  }
}

export async function getAllCardsForTopicAndSubtopics(req, res) {
  try {
    const { topicId } = req.params;
    if (!topicId) {
      return res.status(400).json({
        message: 'Please provide a topicId in the URL.',
      });
    }

    const allCards = await cardService.findAllByParentTopicIdIncludeSubtopics(topicId);

    if (!allCards || allCards.length === 0) {
      return res.status(404).json({
        message: `No cards found for topic ${topicId} or its subtopics.`,
      });
    }

    return res.status(200).json({
      message: `Cards for topic ${topicId} + subtopics.`,
      data: allCards,
    });
  } catch (error) {
    console.error('[topicOperationsController] Error fetching all cards for topic + subtopics:', error);
    return res.status(500).json({
      message: 'Error fetching all cards for topic + subtopics',
      error,
    });
  }
}

export async function generateTopicHierarchyHandler(req, res) {
  try {
    const { topicName } = req.body;
    if (!topicName) {
      return res.status(400).json({
        message: 'Please provide a topicName in the request body.',
      });
    }

    let userId = null;
    let userName = null;
    if (req.user) {
      userId = req.user.userId;
      userName = req.user.name; 
    }

    const { deck, parentTopic } = await createAndExpandDeck(topicName, userId);

    await generateFlashcardsForTopic(parentTopic, userName || 'Anonymous');

    return res.status(201).json({
      message: 'Deck and topic hierarchy successfully generated.',
      deck,
      parentTopic,
    });
  } catch (error) {
    console.error('[topicOperationsController] Error generating deck + topic hierarchy:', error);
    return res.status(500).json({
      message: 'Error generating deck + topic hierarchy',
      error,
    });
  }
}

export async function expandTopicFurtherHandler(req, res) {
  try {
    const { parentTopicId, existingSubtopics = [] } = req.body;
    if (!parentTopicId) {
      return res.status(400).json({
        message: 'Please provide a parentTopicId in the request body.',
      });
    }

    const newSubtopics = await expandTopicFurther(parentTopicId, existingSubtopics);
    return res.status(201).json({
      message: 'Additional round of subtopics generated.',
      data: newSubtopics,
    });
  } catch (error) {
    console.error('[topicOperationsController] Error expanding topic further:', error);
    return res.status(500).json({
      message: 'Error performing additional expansion round',
      error,
    });
  }
}
