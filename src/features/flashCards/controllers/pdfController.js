// src/features/flashCards/controllers/pdfController.js

import path from 'path';
import { fileURLToPath } from 'url';
import { generatePDF } from '../services/pdfGenerator.js';
import cardService from '../services/cardService.js';

/**
 * GET /cards/:deckId/pdf
 */
export async function generateFlashcardsPDFHandler(req, res) {
  try {
    const { deckId } = req.params;
    const layoutName = req.query.layout || 'layout1';
    const styleName = req.query.style || 'design1';

    console.log('\n[generateFlashcardsPDFHandler] START => deckId:', deckId, ' layout:', layoutName, ' style:', styleName);

    if (!deckId) {
      return res.status(400).json({ message: 'Please provide a deckId in the URL.' });
    }

    // 1) Gather cards
    const cards = await cardService.findCardsByDeckId(deckId);
    console.log(`[generateFlashcardsPDFHandler] cards.length = ${cards.length}`);
    cards.forEach((c, i) => {
      console.log(` - card[${i}] id=${c.id}, question=${c.question}`);
      // Log if there's a promise somewhere
      Object.keys(c).forEach((key) => {
        if (typeof c[key] === 'object' && c[key] !== null && typeof c[key].then === 'function') {
          console.log(`   *** WARNING: card[${i}].${key} is a PROMISE!`, c[key]);
        }
      });
    });

    if (!cards.length) {
      return res.status(404).json({ message: `No cards found for deck ID: ${deckId}` });
    }

    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const templatePath = path.join(__dirname, '..', 'templates', 'layouts', `${layoutName}.ejs`);

    // 2) EJS data
    const ejsData = {
      style: styleName,
      cards,
    };

    console.log('[generateFlashcardsPDFHandler] templatePath:', templatePath);

    // 3) Generate PDF
    const pdfBuffer = await generatePDF(templatePath, ejsData, {
      pdfOptions: { format: 'Letter' },
      launchOptions: { headless: true },
    });

    // 4) Return PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="deck-${deckId}-${layoutName}-${styleName}.pdf"`);
    return res.send(pdfBuffer);

  } catch (error) {
    console.error('[pdfController] Error generating flashcards PDF by Deck:', error);
    return res.status(500).json({ message: 'Error generating PDF', error });
  }
}


/**
 * GET /cards/:deckId/preview?layout=layout1&style=design1
 */
export async function previewFlashcardsHTMLHandler(req, res) {
  try {
    const { deckId } = req.params;
    const layoutName = req.query.layout || 'layout1';
    const styleName = req.query.style || 'design1';

    console.log('\n[previewFlashcardsHTMLHandler] START => deckId:', deckId, ' layout:', layoutName, ' style:', styleName);

    if (!deckId) {
      return res.status(400).send('No deckId provided.');
    }

    // 1) Gather cards
    const cards = await cardService.findCardsByDeckId(deckId);
    console.log(`[previewFlashcardsHTMLHandler] cards.length = ${cards.length}`);
    cards.forEach((c, i) => {
      console.log(` - card[${i}] id=${c.id}, question=${c.question}`);
      // Check if any property is a promise
      Object.keys(c).forEach((key) => {
        if (typeof c[key] === 'object' && c[key] !== null && typeof c[key].then === 'function') {
          console.log(`   *** WARNING: card[${i}].${key} is a PROMISE!`, c[key]);
        }
      });
    });

    if (!cards.length) {
      return res.status(404).send(`No cards found for deck ID: ${deckId}`);
    }

    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const templatePath = path.join(__dirname, '..', 'templates', 'layouts', `${layoutName}.ejs`);
    console.log('[previewFlashcardsHTMLHandler] templatePath:', templatePath);

    // 2) Render EJS
    const ejs = await import('ejs');
    const htmlString = await ejs.renderFile(templatePath, { style: styleName, cards }, { async: true });

    console.log('[previewFlashcardsHTMLHandler] EJS render complete. Sending HTML...');

    res.setHeader('Content-Type', 'text/html');
    return res.send(htmlString);

  } catch (error) {
    console.error('[pdfController] Error previewing flashcards HTML by Deck:', error);
    return res.status(500).send('Error generating preview');
  }
}
