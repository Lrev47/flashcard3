// src/features/flashCards/utils/qrCodeGeneration.js

import QRCode from 'qrcode';
import cardService from '../services/cardService.js'; // so we can update Card in DB

/**
 * Generate a single QR code DataURL for a given card ID.
 */
export async function generateCardQRCode(cardId) {
  // E.g. "http://127.0.0.1:5173/cards/<cardId>" or something similar
  const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:5173';
  const fullUrl = `${baseUrl}/cards/${cardId}`;

  try {
    const qrCodeDataUrl = await QRCode.toDataURL(fullUrl);
    return qrCodeDataUrl;
  } catch (error) {
    console.error('[qrCodeGeneration] Error generating QR code:', error);
    throw error;
  }
}

/**
 * Generate QR codes for all cards that don't have them (qrCodeGenerated == null or false).
 * Returns how many cards were updated.
 */
export async function generateAllMissingQRCodes() {
  // 1) Find all cards missing a QR code
  const missingQrCards = await cardService.findMany({
    OR: [{ qrCodeGenerated: null }, { qrCodeGenerated: false }]
  });

  if (!missingQrCards.length) {
    console.log('[qrCodeGeneration] No cards missing QR codes.');
    return 0;
  }

  console.log(`[qrCodeGeneration] Found ${missingQrCards.length} card(s) missing QR codes. Generating now...`);
  
  let updateCount = 0;
  for (const card of missingQrCards) {
    try {
      // 2) Generate the QR code DataURL
      const qrCodeDataUrl = await generateCardQRCode(card.id);

      // 3) Update the card in DB with the new QR code + mark as generated
      await cardService.update(card.id, {
        qrCodeUrl: qrCodeDataUrl,
        qrCodeGenerated: true
      });

      updateCount++;
    } catch (err) {
      console.error(`[qrCodeGeneration] Error generating QR for card ${card.id}:`, err);
      // Continue with next card
    }
  }

  console.log(`[qrCodeGeneration] Finished generating codes for ${updateCount} card(s).`);
  return updateCount;
}
