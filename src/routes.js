import express from 'express';
import cardRoutes from './features/flashCards/routes/cardRoutes.js';
import topicRoutes from './features/topics/routes/topicRoutes.js';
import { optionalAuthMiddleware } from './middleware/authMiddleware.js';
import userRoutes from './features/users/routes/userRoutes.js'

const router = express.Router();


router.use('/users', userRoutes);
router.use('/cards', cardRoutes);
router.use('/topics', topicRoutes);


export default router;