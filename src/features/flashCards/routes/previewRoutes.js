import express from 'express';
import {
  previewCardHandler,
  previewDeckHandler
} from '../controllers/previewController.js';

const router = express.Router();

router.get('/card', previewCardHandler);
router.get('/deck', previewDeckHandler);

export default router;
