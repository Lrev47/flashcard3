// src/features/flashCards/controllers/cardController.js
import cardService from '../services/cardService.js';
import topicService from '../../topics/services/topicService.js';

// AI / generation imports
import {
  generateMoreCardsForTopic,
  generateCardsForAllPendingTopics,
  generateFlashcardsForTopic
} from '../AiApis/cardGeneration.js';
import { docAllCards } from '../AiApis/detailedExplinationGeneration.js';
import { createAndExpandDeck } from '../../topics/AiApis/topicGeneration.js';

// QR code utility import
import { generateAllMissingQRCodes, generateCardQRCode } from '../utils/qrCodeGeneration.js'; 


import pLimit from 'p-limit'; // used inside generateAllMissingQRCodes

/* ===========================================================================
   1) BASIC CARD CRUD
   ========================================================================== */

/**
 * GET /cards/:cardId
 */
export async function getCardByIdHandler(req, res) {
  try {
    const { cardId } = req.params;
    if (!cardId) {
      return res.status(400).json({
        message: 'Please provide a cardId in the URL',
      });
    }

    const card = await cardService.findById(cardId);
    if (!card) {
      return res.status(404).json({
        message: `No card found with ID ${cardId}`,
      });
    }

    return res.status(200).json({
      message: `Fetched card ${cardId} successfully`,
      data: card,
    });
  } catch (error) {
    console.error('[cardController] Error fetching card by ID:', error);
    return res.status(500).json({
      message: 'Error fetching card by ID',
      error,
    });
  }
}

/**
 * GET /cards
 */
export async function getAllCardsHandler(req, res) {
  try {
    const cards = await cardService.findAll();
    return res.status(200).json({
      message: 'Fetched all cards successfully',
      data: cards,
    });
  } catch (error) {
    console.error('[cardController] Error fetching all cards:', error);
    return res.status(500).json({
      message: 'Error fetching all cards',
      error,
    });
  }
}

/**
 * POST /cards
 */
export async function createCardHandler(req, res) {
  try {
    const {
      authorName,
      question,
      answer,
      difficulty,
      answerType,
      resources,
      examples,
      topicId,
      documentId,
    } = req.body;

    if (!authorName || !question || !answer) {
      return res.status(400).json({
        message: 'authorName, question, and answer are required.',
      });
    }

    // If you pass an `explanationData` param, you could do so here as second arg
    const newCard = await cardService.create({
      authorName,
      question,
      answer,
      difficulty,
      answerType,
      resources,
      examples,
      topicId,
      documentId,
    });

    return res.status(201).json({
      message: 'Card created successfully',
      data: newCard,
    });
  } catch (error) {
    console.error('[cardController] Error creating card:', error);
    return res.status(500).json({
      message: 'Error creating card',
      error,
    });
  }
}

/**
 * PUT /cards/:cardId
 */
export async function updateCardHandler(req, res) {
  try {
    const { cardId } = req.params;
    const updates = req.body;
    if (!cardId) {
      return res.status(400).json({
        message: 'Please provide a cardId in the URL',
      });
    }

    const updatedCard = await cardService.update(cardId, updates);
    return res.status(200).json({
      message: `Card ${cardId} updated successfully`,
      data: updatedCard,
    });
  } catch (error) {
    console.error('[cardController] Error updating card:', error);
    return res.status(500).json({
      message: 'Error updating card',
      error,
    });
  }
}

/**
 * DELETE /cards/:cardId
 */
export async function deleteCardHandler(req, res) {
  try {
    const { cardId } = req.params;
    if (!cardId) {
      return res.status(400).json({
        message: 'Please provide a cardId in the URL',
      });
    }

    await cardService.remove(cardId);
    return res.status(200).json({
      message: `Card ${cardId} deleted successfully`,
    });
  } catch (error) {
    console.error('[cardController] Error deleting card:', error);
    return res.status(500).json({
      message: 'Error deleting card',
      error,
    });
  }
}

/* ===========================================================================
   2) CARD QUERIES (TOPIC, DESCENDANTS, DECK, DOCUMENT, etc.)
   ========================================================================== */

/**
 * GET /cards/topic/:topicId
 */
export async function getCardsByTopicHandler(req, res) {
  try {
    const { topicId } = req.params;
    if (!topicId) {
      return res.status(400).json({
        message: 'Please provide a topicId.',
      });
    }
    const cards = await cardService.findByTopicId(topicId);
    return res.status(200).json({
      message: `Fetched cards for topic ${topicId}`,
      data: cards,
    });
  } catch (error) {
    console.error('[cardController] Error fetching cards by topic:', error);
    return res.status(500).json({
      message: 'Error fetching cards by topic',
      error,
    });
  }
}

/**
 * GET /cards/topic/:topicId/descendants
 */
export async function getAllDescendantCardsHandler(req, res) {
  try {
    const { topicId } = req.params;
    if (!topicId) {
      return res.status(400).json({
        message: 'Please provide a topicId.',
      });
    }

    const cards = await cardService.findAllByParentTopicIdIncludeSubtopics(topicId);
    return res.status(200).json({
      message: `Fetched cards for topic ${topicId} + subtopics`,
      data: cards,
    });
  } catch (error) {
    console.error('[cardController] Error fetching descendant cards:', error);
    return res.status(500).json({
      message: 'Error fetching descendant cards',
      error,
    });
  }
}

/**
 * GET /cards/deck/:deckId
 */
export async function getCardsByDeckIdHandler(req, res) {
  try {
    const { deckId } = req.params;
    if (!deckId) {
      return res.status(400).json({
        message: 'Please provide a deckId.',
      });
    }
    const cards = await cardService.findCardsByDeckId(deckId);
    return res.status(200).json({
      message: `Fetched cards for deck ${deckId}`,
      data: cards,
    });
  } catch (error) {
    console.error('[cardController] Error fetching cards by deck:', error);
    return res.status(500).json({
      message: 'Error fetching cards by deck',
      error,
    });
  }
}

/**
 * GET /cards/document/:documentId
 */
export async function getCardsByDocumentIdHandler(req, res) {
  try {
    const { documentId } = req.params;
    if (!documentId) {
      return res.status(400).json({
        message: 'Please provide a documentId.',
      });
    }
    const cards = await cardService.findByDocumentId(documentId);
    return res.status(200).json({
      message: `Fetched cards for document ${documentId}`,
      data: cards,
    });
  } catch (error) {
    console.error('[cardController] Error fetching cards by document:', error);
    return res.status(500).json({
      message: 'Error fetching cards by document',
      error,
    });
  }
}

/* ===========================================================================
   3) EXPLANATION & BLOCK OPERATIONS
   ========================================================================== */

/**
 * POST /cards/:cardId/explanation
 * Upsert the explanation for a card.
 */
export async function upsertCardExplanationHandler(req, res) {
  try {
    const { cardId } = req.params;
    if (!cardId) {
      return res.status(400).json({ message: 'Please provide cardId in URL.' });
    }

    const explanationData = req.body; 
    // e.g. { title: "Some Title", blocks: [{ blockType, blockTitle, content, order }, ...] }

    const updatedExp = await cardService.upsertExplanation(cardId, explanationData);
    return res.status(200).json({
      message: `Explanation updated/created for card ${cardId}`,
      data: updatedExp,
    });
  } catch (error) {
    console.error('[cardController] Error upserting explanation:', error);
    return res.status(500).json({
      message: 'Error updating/creating explanation',
      error,
    });
  }
}

/**
 * DELETE /cards/:cardId/explanation
 * Removes the explanation (and blocks) for a card.
 */
export async function removeCardExplanationHandler(req, res) {
  try {
    const { cardId } = req.params;
    if (!cardId) {
      return res.status(400).json({ message: 'Please provide cardId in URL.' });
    }

    const result = await cardService.removeExplanation(cardId);
    if (!result) {
      return res.status(404).json({ message: `No explanation found for card ${cardId}` });
    }
    return res.status(200).json({
      message: `Explanation for card ${cardId} removed.`,
      data: result,
    });
  } catch (error) {
    console.error('[cardController] Error removing explanation:', error);
    return res.status(500).json({
      message: 'Error removing explanation',
      error,
    });
  }
}

/**
 * POST /cards/:cardId/explanation/block
 * Adds a single new block to the existing explanation of a card.
 */
export async function addCardExplanationBlockHandler(req, res) {
  try {
    const { cardId } = req.params;
    if (!cardId) {
      return res.status(400).json({ message: 'Please provide cardId in URL.' });
    }

    const blockData = req.body; // e.g. { blockType, blockTitle, content, order }

    const newBlock = await cardService.addExplanationBlock(cardId, blockData);
    return res.status(201).json({
      message: `New block added to card ${cardId}'s explanation.`,
      data: newBlock,
    });
  } catch (error) {
    console.error('[cardController] Error adding explanation block:', error);
    return res.status(500).json({
      message: 'Error adding explanation block',
      error,
    });
  }
}

/* ===========================================================================
   4) AI / GENERATION OPERATIONS
   ========================================================================== */

/**
 * POST /cards/generateMore/:topicId
 * Generates additional cards for a given topic.
 */
export async function generateMoreCardsHandler(req, res) {
  try {
    const { topicId } = req.params;
    const { additionalCount = 5 } = req.body;

    if (!topicId) {
      return res.status(400).json({
        message: 'Please provide a topicId in the request parameters.',
      });
    }

    const topic = await topicService.findById(topicId);
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    const newCards = await generateMoreCardsForTopic(topic, additionalCount);
    return res.status(201).json({
      message: `${newCards.length} additional card(s) generated for topic: ${topic.name}.`,
      data: newCards,
    });
  } catch (error) {
    console.error('[cardOperationsController] Error generating more cards:', error);
    return res.status(500).json({
      message: 'Error generating more cards',
      error,
    });
  }
}

/**
 * POST /cards/generate
 * Generates cards for all pending topics.
 */
export async function generateCardsHandler(req, res) {
  try {
    const result = await generateCardsForAllPendingTopics();
    return res.status(201).json({
      message: 'Card generation process complete',
      data: result,
    });
  } catch (error) {
    console.error('[cardOperationsController] Error generating cards:', error);
    return res.status(500).json({
      message: 'Error generating cards',
      error,
    });
  }
}

/**
 * POST /cards/docAll
 * Generate detailed explanations for all cards (docAllCards).
 */
export async function docAllCardsHandler(req, res) {
  try {
    const result = await docAllCards();
    return res.status(200).json({
      message: 'Detailed explanations generation complete',
      data: result,
    });
  } catch (error) {
    console.error('[cardOperationsController] Error documenting cards:', error);
    return res.status(500).json({
      message: 'Error generating detailed explanations',
      error,
    });
  }
}

/**
 * POST /cards/masterGenerate
 * Combines multiple operations: create deck+topic, generate flashcards, docs, etc.
 */
export async function masterGenerateHandler(req, res) {
  try {
    const { topicName } = req.body;
    if (!topicName) {
      return res.status(400).json({
        message: 'Please provide a topicName in the request body.',
      });
    }

    console.log('[masterGenerate] Starting master generation for topic:', topicName);

    let userId = null;
    let userName = 'public';
    if (req.user) {
      userId = req.user.userId;
      userName = req.user.name || 'public';
    }

    // 1) Create deck & parent topic
    const { deck, parentTopic } = await createAndExpandDeck(topicName, userId);
    console.log('[masterGenerate] Deck + parent topic created:', { deck, parentTopic });

    // 2) Generate flashcards for that topic
    await generateFlashcardsForTopic(parentTopic, userName);
    console.log('[masterGenerate] Flashcards generated for the parent topic:', parentTopic.name);

    // 3) Generate cards for all pending topics
    await generateCardsForAllPendingTopics(userName);
    console.log('[masterGenerate] Flashcards generated for all pending topics.');

    // 4) Generate detailed explanations
    await docAllCards();
    console.log('[masterGenerate] Detailed explanations generated for all flashcards.');

    // 5) Generate missing QR codes
    const missingQRCount = await generateAllMissingQRCodes();
    console.log(`[masterGenerate] Missing QR codes generated for ${missingQRCount} card(s).`);

    const finalMessage = `Master generation complete. Created deck '${deck.name}' and subtopics, flashcards, docs, plus ${missingQRCount} new QR code(s).`;

    return res.status(200).json({
      message: finalMessage,
      data: { deck, parentTopic },
    });
  } catch (error) {
    console.error('[masterGenerate] Error during generation process:', error);
    return res.status(500).json({
      message: 'Error in master generation process',
      error,
    });
  }
}

/* ===========================================================================
   5) QR CODE OPERATIONS
   ========================================================================== */

/**
 * GET /cards/:cardId/qrCode
 * Generate a QR code for a single card (on the fly).
 */
export async function getCardQRCodeHandler(req, res) {
  try {
    const { cardId } = req.params;
    if (!cardId) {
      return res.status(400).json({ message: 'Card ID is required.' });
    }

    // Create the QR code (DataURL) on the fly
    const qrCodeDataUrl = await generateCardQRCode(cardId);
    return res.status(200).json({ qrCode: qrCodeDataUrl });
  } catch (error) {
    console.error('[cardController] Error in getCardQRCodeHandler:', error);
    return res.status(500).json({ message: 'Failed to generate QR code', error });
  }
}

/**
 * POST /cards/qrCode/missing
 * Generate QR codes for all cards missing them.
 */
export async function generateMissingQRCodesHandler(req, res) {
  try {
    const updatedCount = await generateAllMissingQRCodes();
    if (updatedCount === 0) {
      return res.status(200).json({ message: 'All cards already have QR codes.' });
    }
    return res.status(200).json({ message: `Generated QR codes for ${updatedCount} card(s).` });
  } catch (error) {
    console.error('[cardController] Error generating missing QR codes:', error);
    return res.status(500).json({ message: 'Error generating missing QR codes', error });
  }
}