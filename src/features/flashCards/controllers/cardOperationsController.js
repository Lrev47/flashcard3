import { generateMoreCardsForTopic, generateCardsForAllPendingTopics } from '../AiApis/cardGeneration.js';
import { docAllCards } from '../AiApis/detailedExplinationGeneration.js';
import topicService from '../services/topicService.js';

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
