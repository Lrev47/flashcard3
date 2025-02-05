// src/features/flashCards/controllers/pdfController.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import hljs from 'highlight.js';
import ejs from 'ejs';                   // so we can renderFile in the controller
import cardService from '../services/cardService.js';
import { generatePDF } from '../services/pdfGenerator.js';

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
      // auto-detect language (you could force 'javascript' or 'bash')
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

    // 1) Fetch real card data from DB
    const cards = await cardService.findCardsByDeckId(deckId);

    // 2) Load highlight setup (theme + function)
    const { themeCSS, highlightCode } = getHighlightSetup();

    // 3) Prepare data for EJS
    const ejsData = {
      style: styleName,
      cards,
      themeCSS,
      highlightCode,
    };

    // 4) Generate PDF (Puppeteer)
    const pdfBuffer = await generatePDF(templatePath, ejsData, {
      pdfOptions: {
        format: 'Letter',
        printBackground: true, // important if you want color backgrounds
      },
      launchOptions: { headless: true },
    });

    // 5) Send PDF
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

    // 1) Fetch real card data
    const cards = await cardService.findCardsByDeckId(deckId);

    // 2) highlight.js setup
    const { themeCSS, highlightCode } = getHighlightSetup();

    // 3) Render EJS to HTML
    const htmlString = await ejs.renderFile(templatePath, {
      style: styleName,
      cards,
      themeCSS,
      highlightCode,
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

    // 1) Fetch real card data
    const cards = await cardService.findCardsByDeckId(deckId);

    // 2) highlight.js setup
    const { themeCSS, highlightCode } = getHighlightSetup();

    // 3) Prepare data for EJS
    const ejsData = {
      style: styleName,
      cards,
      themeCSS,
      highlightCode,
    };

    // 4) Generate PDF
    const pdfBuffer = await generatePDF(templatePath, ejsData, {
      pdfOptions: {
        format: 'Letter',
        printBackground: true,
      },
      launchOptions: { headless: true },
    });

    // 5) Return test.pdf
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

    // 1) Fetch real card data
    const cards = await cardService.findCardsByDeckId(deckId);

    // 2) highlight.js setup
    const { themeCSS, highlightCode } = getHighlightSetup();

    // 3) Render EJS for test preview
    const htmlString = await ejs.renderFile(templatePath, {
      style: styleName,
      cards,
      themeCSS,
      highlightCode,
    });

    res.setHeader('Content-Type', 'text/html');
    return res.send(htmlString);

  } catch (error) {
    console.error(error);
    return res.status(500).send('Error generating test preview');
  }
}
