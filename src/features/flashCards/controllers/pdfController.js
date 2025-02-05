// src/features/flashCards/controllers/pdfController.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import hljs from 'highlight.js';
import ejs from 'ejs';
import cardService from '../services/cardService.js';
import { generatePDF } from '../services/pdfGenerator.js';

import prisma from '../../../config/prismaClient.js';

/**
 * Helper: load theme CSS + define highlight function
 */
function getHighlightSetup() {
  let themeCSS = '';
  try {
    // Adjust if you want a different .css file in highlight.js/styles/
    const themePath = path.join(
      process.cwd(),
      'node_modules',
      'highlight.js',
      'styles',
      'monokai.css'
    );
    themeCSS = fs.readFileSync(themePath, 'utf8');
  } catch (err) {
    console.error('Error reading highlight.js theme file:', err);
  }

  function highlightCode(codeString) {
    try {
      // auto-detect language
      const result = hljs.highlightAuto(codeString);
      return result.value;
    } catch (error) {
      return codeString; // fallback
    }
  }

  return { themeCSS, highlightCode };
}

/**
 * GET /cards/:deckId/pdf?layout=layout1&style=design1
 */
export async function generateFlashcardsPDFHandler(req, res) {
  try {
    const { deckId } = req.params;
    const layoutName = req.query.layout || 'layout1';
    const styleName = req.query.style || 'design1';

    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const templatePath = path.join(
      __dirname,
      '..',
      'templates',
      'layouts',
      `${layoutName}.ejs`
    );

    // 1) Fetch the deck to get deckName
    const deck = await prisma.deck.findUnique({
      where: { id: deckId },
      select: { name: true },
    });
    const deckName = deck ? deck.name : 'No deck name found';

    // 2) Fetch real card data from DB
    const cards = await cardService.findCardsByDeckId(deckId);

    // 3) Load highlight setup (theme + function)
    const { themeCSS, highlightCode } = getHighlightSetup();

    // 4) Prepare data for EJS
    const ejsData = {
      style: styleName,
      cards,
      themeCSS,
      highlightCode,
      deckName, // Pass deck name here
    };

    // 5) Generate PDF
    const pdfBuffer = await generatePDF(templatePath, ejsData, {
      pdfOptions: {
        format: 'Letter',
        printBackground: true,
      },
      launchOptions: { headless: true },
    });

    // 6) Send PDF
    res.writeHead(200, {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="flashcards.pdf"',
      'Content-Length': pdfBuffer.length,
    });
    return res.end(pdfBuffer);

  } catch (error) {
    console.error(error);
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

    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const templatePath = path.join(
      __dirname,
      '..',
      'templates',
      'layouts',
      `${layoutName}.ejs`
    );

    // 1) Fetch the deck to get deckName
    const deck = await prisma.deck.findUnique({
      where: { id: deckId },
      select: { name: true },
    });
    const deckName = deck ? deck.name : 'No deck name found';

    // 2) Fetch real card data
    const cards = await cardService.findCardsByDeckId(deckId);

    // 3) highlight.js setup
    const { themeCSS, highlightCode } = getHighlightSetup();

    // 4) Render EJS to HTML
    const htmlString = await ejs.renderFile(templatePath, {
      style: styleName,
      cards,
      themeCSS,
      highlightCode,
      deckName, // Pass deck name here
    });

    res.setHeader('Content-Type', 'text/html');
    return res.send(htmlString);

  } catch (error) {
    console.error(error);
    return res.status(500).send('Error generating preview');
  }
}

/**
 * GET /cards/:deckId/testPdf?layout=layout1&style=design1
 * Modified to only take the first 8 cards for a test print.
 */
export async function generateFlashcardsTestPDFHandler(req, res) {
  try {
    const { deckId } = req.params;
    const layoutName = req.query.layout || 'layout1';
    const styleName = req.query.style || 'design1';

    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const templatePath = path.join(
      __dirname,
      '..',
      'templates',
      'layouts',
      `${layoutName}.ejs`
    );

    // 1) Fetch deck name
    const deck = await prisma.deck.findUnique({
      where: { id: deckId },
      select: { name: true },
    });
    const deckName = deck ? deck.name : 'No deck name found';

    // 2) Fetch real card data, but limit to 8 for testing
    let cards = await cardService.findCardsByDeckId(deckId);
    cards = cards.slice(0, 8);

    // 3) highlight.js setup
    const { themeCSS, highlightCode } = getHighlightSetup();

    // 4) Prepare data for EJS
    const ejsData = {
      style: styleName,
      cards,
      themeCSS,
      highlightCode,
      deckName,
    };

    // 5) Generate PDF
    const pdfBuffer = await generatePDF(templatePath, ejsData, {
      pdfOptions: {
        format: 'Letter',
        printBackground: true,
      },
      launchOptions: { headless: true },
    });

    // 6) Return test.pdf
    res.writeHead(200, {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="test.pdf"',
      'Content-Length': pdfBuffer.length,
    });
    return res.end(pdfBuffer);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error generating test PDF', error });
  }
}

/**
 * GET /cards/:deckId/testPreview?layout=layout1&style=design1
 * Modified to only preview the first 8 cards for a test.
 */
export async function previewFlashcardsTestHTMLHandler(req, res) {
  try {
    const { deckId } = req.params;
    const layoutName = req.query.layout || 'layout1';
    const styleName = req.query.style || 'design1';

    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const templatePath = path.join(
      __dirname,
      '..',
      'templates',
      'layouts',
      `${layoutName}.ejs`
    );

    // 1) Fetch deck name
    const deck = await prisma.deck.findUnique({
      where: { id: deckId },
      select: { name: true },
    });
    const deckName = deck ? deck.name : 'No deck name found';

    // 2) Fetch real card data, but only first 8
    let cards = await cardService.findCardsByDeckId(deckId);
    cards = cards.slice(0, 8);

    // 3) highlight.js setup
    const { themeCSS, highlightCode } = getHighlightSetup();

    // 4) Render EJS for test preview
    const htmlString = await ejs.renderFile(templatePath, {
      style: styleName,
      cards,
      themeCSS,
      highlightCode,
      deckName,
    });

    res.setHeader('Content-Type', 'text/html');
    return res.send(htmlString);

  } catch (error) {
    console.error(error);
    return res.status(500).send('Error generating test preview');
  }
}
