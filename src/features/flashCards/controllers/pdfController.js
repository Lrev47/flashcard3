// src/features/flashCards/controllers/pdfController.js

import path from 'path';
import { fileURLToPath } from 'url';
import { generatePDF } from '../services/pdfGenerator.js';
import cardService from '../services/cardService.js';

/**
 * GET /cards/:topicId/pdf
 * Generate a printable PDF of flashcards for a given topic (+ subtopics).
 * Query params:
 *   ?layout=layout1
 *   &style=design1
 */
export async function generateFlashcardsPDFHandler(req, res) {
  try {
    const { topicId } = req.params;
    const layoutName = req.query.layout || 'layout1';
    const styleName = req.query.style || 'design1';

    if (!topicId) {
      return res.status(400).json({ message: 'Please provide a topicId in the URL.' });
    }

    // 1) Gather cards for that topic and subtopics
    const cards = await cardService.findAllByParentTopicIdIncludeSubtopics(topicId);
    if (!cards.length) {
      return res.status(404).json({ message: 'No cards found for this topic or its subtopics.' });
    }

    // 2) Build the path to the layout e.g. layout1.ejs
    // We'll assume your file is at /flashCards/templates/layouts/layout1.ejs
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const templatePath = path.join(
      __dirname,
      '..',            // up to controllers
      'templates',
      'layouts',
      `${layoutName}.ejs`,
    );

    // 3) Prepare data for EJS
    // style = 'design1' to pick the correct design
    // cards = array of card objects
    const ejsData = {
      style: styleName,
      cards,
    };

    // 4) Generate PDF
    const pdfBuffer = await generatePDF(templatePath, ejsData, {
      pdfOptions: { format: 'Letter' },
      launchOptions: { headless: true },  // or 'new' in puppeteer v20
    });

    // 5) Return the PDF as a download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${layoutName}-${styleName}.pdf"`);
    return res.send(pdfBuffer);

  } catch (error) {
    console.error('[pdfController] Error generating flashcards PDF:', error);
    return res.status(500).json({ message: 'Error generating PDF', error });
  }
}


/**
 * GET /cards/preview?layout=layout1&style=design1
 * Renders the EJS in plain HTML so the user can "preview" what it looks like
 * before actually downloading the PDF. This is optional, but can help.
 */
export async function previewFlashcardsHTMLHandler(req, res) {
  try {
    const { topicId } = req.params;
    const layoutName = req.query.layout || 'layout1';
    const styleName = req.query.style || 'design1';

    // We can just re-use the same data logic from above,
    // or in a real scenario you might pass some dummy data or test cards.

    if (!topicId) {
      return res.status(400).send('No topicId provided.');
    }

    const cards = await cardService.findAllByParentTopicIdIncludeSubtopics(topicId);
    if (!cards.length) {
      return res.status(404).send('No cards found for this topic or its subtopics.');
    }

    // Manually render the EJS to an HTML string and send it
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const templatePath = path.join(__dirname, '..', 'templates', 'layouts', `${layoutName}.ejs`);

    // Import ejs directly here
    const ejs = await import('ejs');
    const htmlString = await ejs.renderFile(templatePath, { style: styleName, cards }, { async: true });

    // Send as plain HTML
    res.setHeader('Content-Type', 'text/html');
    res.send(htmlString);

  } catch (error) {
    console.error('[pdfController] Error previewing flashcards HTML:', error);
    res.status(500).send('Error generating preview');
  }
}
