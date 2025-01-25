import express from 'express';
import { getCardQRCodeHandler, generateMissingQRCodesHandler } from '../controllers/qrCodeController.js';

const router = express.Router();

router.get('/:cardId', getCardQRCodeHandler);
router.post('/generate-missing', generateMissingQRCodesHandler);

export default router;
