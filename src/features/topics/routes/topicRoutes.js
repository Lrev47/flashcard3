// src/features/topics/routes/topicRoutes.js
import { Router } from 'express';
import {
  // BASIC CRUD
  getAllTopicsHandler,
  getTopicByIdHandler,
  createTopicHandler,
  updateTopicHandler,
  deleteTopicHandler,

  // TOPIC OPERATIONS
  getAllAncestorTopicIdsHandler,
  getAllCardsForTopicAndSubtopics,
  generateTopicHierarchyHandler,
  expandTopicFurtherHandler,
} from '../controllers/topicController.js';

const router = Router();

/* ===========================================================================
   1) BASIC TOPIC CRUD
   ========================================================================== */

router.get('/', getAllTopicsHandler);         // GET /topics
router.post('/', createTopicHandler);         // POST /topics

router.get('/:topicId', getTopicByIdHandler); // GET /topics/:topicId
router.put('/:topicId', updateTopicHandler);  // PUT /topics/:topicId
router.delete('/:topicId', deleteTopicHandler); // DELETE /topics/:topicId

/* ===========================================================================
   2) TOPIC OPERATIONS
   ========================================================================== */
router.get('/:topicId/ancestors', getAllAncestorTopicIdsHandler);    // GET /topics/:topicId/ancestors
router.get('/:topicId/cards', getAllCardsForTopicAndSubtopics);       // GET /topics/:topicId/cards
router.post('/generateHierarchy', generateTopicHierarchyHandler);      // POST /topics/generateHierarchy
router.post('/expandFurther', expandTopicFurtherHandler);             // POST /topics/expandFurther

export default router;
