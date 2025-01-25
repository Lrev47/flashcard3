import express from 'express';
import cardRoutes from './features/flashCards/routes/cardRoutes.js';
import topicRoutes from './features/flashCards/routes/topicRoutes.js';
import { masterGenerateHandler } from './features/flashCards/controllers/masterGenerate.js';
import qrCodeRoutes from './features/flashCards/routes/previewRoutes.js';
import previewRoutes from './features/flashCards/routes/previewRoutes.js'; 
import { optionalAuthMiddleware } from './middleware/authMiddleware.js';
import userRoutes from './features/users/routes/userRoutes.js'

const router = express.Router();


router.use('/users', userRoutes);
router.use('/cards', cardRoutes);
router.use('/topics', topicRoutes);
router.post('/master/generate', optionalAuthMiddleware, masterGenerateHandler);
router.use('/qr', qrCodeRoutes);
router.use('/preview', previewRoutes);

export default router;