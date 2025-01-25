import cardService from '../services/cardService.js';

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

export async function createCardHandler(req, res) {
  try {
    const {
      authorName,
      question,
      answer,
      difficulty,
      answerType,
      detailedExplanation,
      resources,
      examples,
      topicId,
    } = req.body;

    if (!authorName || !question || !answer) {
      return res.status(400).json({
        message: 'authorName, question, and answer are required.',
      });
    }

    const newCard = await cardService.create({
      authorName,
      question,
      answer,
      difficulty,
      answerType,
      detailedExplanation,
      resources,
      examples,
      topicId,
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
