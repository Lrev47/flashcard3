// src/features/topics/controllers/topicController.js

import topicService from '../services/topicService.js';
import cardService from '../../flashCards/services/cardService.js';
import { createAndExpandDeck, expandTopicFurther } from '../AiApis/topicGeneration.js';
import { generateFlashcardsForTopic } from '../../flashCards/AiApis/cardGeneration.js';

/* ---------------------------------------------------------------------------
 *  BASIC TOPIC CRUD HANDLERS
 * ------------------------------------------------------------------------- */

/**
 * GET /topics
 */
export async function getAllTopicsHandler(req, res) {
  try {
    const topics = await topicService.findMany();
    return res.status(200).json({
      message: 'Fetched all topics successfully',
      data: topics,
    });
  } catch (error) {
    console.error('[topicController] Error fetching topics:', error);
    return res.status(500).json({
      message: 'Error fetching topics',
      error,
    });
  }
}

/**
 * GET /topics/:topicId
 */
export async function getTopicByIdHandler(req, res) {
  try {
    const { topicId } = req.params;
    if (!topicId) {
      return res.status(400).json({ message: 'Please provide a topicId in the URL' });
    }
    const topic = await topicService.findById(topicId);
    if (!topic) {
      return res.status(404).json({
        message: `Topic not found with ID ${topicId}`,
      });
    }
    return res.status(200).json({
      message: `Fetched topic ${topicId}`,
      data: topic,
    });
  } catch (error) {
    console.error('[topicController] Error fetching topic by ID:', error);
    return res.status(500).json({
      message: 'Error fetching topic',
      error,
    });
  }
}

/**
 * POST /topics
 */
export async function createTopicHandler(req, res) {
  try {
    const { name, overview, parentTopicId } = req.body;
    if (!name) {
      return res.status(400).json({
        message: 'Please provide a topic name.',
      });
    }
    const newTopic = await topicService.createTopic({
      name,
      overview,
      parentTopicId,
    });
    return res.status(201).json({
      message: 'Topic created successfully',
      data: newTopic,
    });
  } catch (error) {
    console.error('[topicController] Error creating topic:', error);
    return res.status(500).json({
      message: 'Error creating topic',
      error,
    });
  }
}

/**
 * PUT /topics/:topicId
 */
export async function updateTopicHandler(req, res) {
  try {
    const { topicId } = req.params;
    const updates = req.body;
    if (!topicId) {
      return res.status(400).json({
        message: 'Please provide a topicId in the URL',
      });
    }
    const updatedTopic = await topicService.updateTopic(topicId, updates);

    return res.status(200).json({
      message: `Topic ${topicId} updated successfully`,
      data: updatedTopic,
    });
  } catch (error) {
    console.error('[topicController] Error updating topic:', error);
    return res.status(500).json({
      message: 'Error updating topic',
      error,
    });
  }
}

/**
 * DELETE /topics/:topicId
 */
export async function deleteTopicHandler(req, res) {
  try {
    const { topicId } = req.params;
    if (!topicId) {
      return res.status(400).json({
        message: 'Please provide a topicId in the URL',
      });
    }
    await topicService.deleteTopic(topicId);
    return res.status(200).json({
      message: `Topic ${topicId} deleted successfully`,
    });
  } catch (error) {
    console.error('[topicController] Error deleting topic:', error);
    return res.status(500).json({
      message: 'Error deleting topic',
      error,
    });
  }
}

/* ---------------------------------------------------------------------------
 *  TOPIC OPERATIONS (HIERARCHY, AI-DRIVEN, ETC.)
 * ------------------------------------------------------------------------- */

/**
 * GET /topics/:topicId/ancestors
 */
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
    console.error('[topicController] Error fetching ancestor topic IDs:', error);
    return res.status(500).json({
      message: 'Error fetching ancestor topic IDs',
      error,
    });
  }
}

/**
 * GET /topics/:topicId/cards
 */
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
    console.error('[topicController] Error fetching all cards for topic + subtopics:', error);
    return res.status(500).json({
      message: 'Error fetching all cards for topic + subtopics',
      error,
    });
  }
}

/**
 * POST /topics/generateHierarchy
 */
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

    // 1) Creates a new deck for the "topicName", plus subtopics
    const { deck, parentTopic } = await createAndExpandDeck(topicName, userId);

    // 2) Generate flashcards for the newly created parentTopic
    await generateFlashcardsForTopic(parentTopic, userName || 'Anonymous');

    return res.status(201).json({
      message: 'Deck and topic hierarchy successfully generated.',
      deck,
      parentTopic,
    });
  } catch (error) {
    console.error('[topicController] Error generating deck + topic hierarchy:', error);
    return res.status(500).json({
      message: 'Error generating deck + topic hierarchy',
      error,
    });
  }
}

/**
 * POST /topics/expandFurther
 */
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
    console.error('[topicController] Error expanding topic further:', error);
    return res.status(500).json({
      message: 'Error performing additional expansion round',
      error,
    });
  }
}

export default {
  getAllTopicsHandler,
  getTopicByIdHandler,
  createTopicHandler,
  updateTopicHandler,
  deleteTopicHandler,
  getAllAncestorTopicIdsHandler,
  getAllCardsForTopicAndSubtopics,
  generateTopicHierarchyHandler,
  expandTopicFurtherHandler,
};
