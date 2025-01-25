import topicService from '../services/topicService.js';

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

export async function updateTopicHandler(req, res) {
  try {
    const { topicId } = req.params;
    const updates = req.body;
    if (!topicId) {
      return res.status(400).json({
        message: 'Please provide a topicId in the URL',
      });
    }
    const updatedTopic = await topicService.update(topicId, updates);
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
