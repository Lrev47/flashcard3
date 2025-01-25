import express from 'express';
import {
  getAllTopicsHandler,
  getTopicByIdHandler,
  createTopicHandler,
  updateTopicHandler,
  deleteTopicHandler
} from '../controllers/topicController.js';

import {
  getAllAncestorTopicIdsHandler,
  getAllCardsForTopicAndSubtopics,
  generateTopicHierarchyHandler,
  expandTopicFurtherHandler
} from '../controllers/topicOperationsController.js';

const router = express.Router();

router.get('/:topicId/ancestors', getAllAncestorTopicIdsHandler);
router.get('/:topicId/all-cards', getAllCardsForTopicAndSubtopics);
router.post('/generate', generateTopicHierarchyHandler);
router.post('/expand-further', expandTopicFurtherHandler);
router.get('/', getAllTopicsHandler);
router.get('/:topicId', getTopicByIdHandler);
router.post('/', createTopicHandler);
router.patch('/:topicId', updateTopicHandler);
router.delete('/:topicId', deleteTopicHandler);

export default router;
