import { generateCardQRCode } from '../utils/qrCodeGeneration.js';
import cardService from '../services/cardService.js';
import pLimit from 'p-limit';

export async function generateAllMissingQRCodes() {
  const cards = await cardService.findMany({ qrCodeGenerated: null });
  if (!cards.length) {
    console.log('[generateAllMissingQRCodes] All cards already have QR codes.');
    return 0;
  }

  console.log(`[generateAllMissingQRCodes] Found ${cards.length} card(s) without QR codes.`);
  
  const limit = pLimit(100);
  const updatePromises = cards.map(card => limit(async () => {
    try {
      const qrCodeDataUrl = await generateCardQRCode(card.id);
      await cardService.update(card.id, {
        qrCodeUrl: qrCodeDataUrl,
        qrCodeGenerated: true,
      });
      console.log(`[generateAllMissingQRCodes] Generated QR for card ID: ${card.id}`);
    } catch (err) {
      console.error(`[generateAllMissingQRCodes] Error processing card ID: ${card.id}`, err);
    }
  }));

  await Promise.all(updatePromises);
  return cards.length; 
}

export async function getCardQRCodeHandler(req, res) {
  try {
    const { cardId } = req.params;
    if (!cardId) {
      return res.status(400).json({ message: 'Card ID is required.' });
    }

    const qrCodeDataUrl = await generateCardQRCode(cardId);
    return res.status(200).json({ qrCode: qrCodeDataUrl });
  } catch (error) {
    console.error('Error in getCardQRCodeHandler:', error);
    return res.status(500).json({ message: 'Failed to generate QR code', error });
  }
}

export async function generateMissingQRCodesHandler(req, res) {
  try {
    const updatedCount = await generateAllMissingQRCodes();
    if (updatedCount === 0) {
      return res.status(200).json({ message: 'All cards already have QR codes.' });
    }
    return res.status(200).json({ message: `Generated QR codes for ${updatedCount} card(s).` });
  } catch (error) {
    console.error('[qrCodeController] Error generating missing QR codes:', error);
    return res.status(500).json({ message: 'Error generating missing QR codes', error });
  }
}
