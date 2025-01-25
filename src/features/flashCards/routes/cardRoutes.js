import express from 'express';
import {
  getCardByIdHandler,
  getAllCardsHandler,
  getCardsByTopicHandler,
  getAllDescendantCardsHandler,
  createCardHandler,
  updateCardHandler,
  deleteCardHandler
} from '../controllers/cardController.js';

import {
  generateMoreCardsHandler,
  generateCardsHandler,
  docAllCardsHandler
} from '../controllers/cardOperationsController.js';

const router = express.Router();

router.post('/:topicId/generate-more', generateMoreCardsHandler);
router.post('/generate', generateCardsHandler);
router.post('/docs', docAllCardsHandler);
router.get('/topic/:topicId/all-subtopics', getAllDescendantCardsHandler);
router.get('/topic/:topicId', getCardsByTopicHandler);
router.get('/', getAllCardsHandler);
router.get('/:cardId', getCardByIdHandler);
router.post('/', createCardHandler);
router.patch('/:cardId', updateCardHandler);
router.delete('/:cardId', deleteCardHandler);

export default router;
