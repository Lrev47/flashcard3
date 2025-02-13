// src/routes.js

import express from 'express';
import cardRoutes from './features/flashCards/routes/cardRoutes.js';
import topicRoutes from './features/topics/routes/topicRoutes.js';
import userRoutes from './features/users/routes/userRoutes.js';
import resumeRoutes from './features/resumes/routes/resumeRoutes.js'
import { optionalAuthMiddleware } from './middleware/authMiddleware.js';


const router = express.Router();

router.use('/users', userRoutes);

router.use('/cards', optionalAuthMiddleware, cardRoutes);

router.use('/topics', topicRoutes);

router.use('/resumes', optionalAuthMiddleware, resumeRoutes);

export default router;
