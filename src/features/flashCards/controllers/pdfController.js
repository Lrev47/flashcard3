// src/features/flashCards/controllers/pdfController.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import hljs from 'highlight.js';
import ejs from 'ejs';

import prisma from '../../../config/prismaClient.js';
import cardService from '../services/cardService.js';
import { generatePDF } from '../services/pdfGenerator.js';

/**
 * Helper: load theme CSS + define highlight function
 */
function getHighlightSetup() {
  let themeCSS = '';
  try {
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
      const result = hljs.highlightAuto(codeString);
      return result.value;
    } catch (error) {
      return codeString; // fallback
    }
  }

  return { themeCSS, highlightCode };
}

/**
 * Utility: Builds file/folder names for layout, card, design
 * from query params (size, orientation, design).
 */
function buildTemplatePaths(size, orientation, design) {
  /*
    For size='3x5', orientation='portrait', design='design1' =>

    layoutFile   = "layout-3x5.ejs"
    cardFile     = "card-3x5.ejs"
    designFolder = "designs/portrait/design1"

    Then EJS can do "../designs/portrait/design1/front.ejs"
  */
  const layoutFile = `layout-${size}.ejs`;
  const cardFile = `card-${size}.ejs`;

  return {
    layoutFile,
    cardFolder: path.join('cards', orientation),
    cardFile,
    // orientation subfolder if your designs are stored like "designs/portrait/design1"
    designFolder: path.join('designs', orientation, design),
  };
}

/* --------------------------------------------------------------------------
   1) PREVIEW
   GET /cards/:deckId/previewLayout2?size=3x5&orientation=portrait&design=design1
   -------------------------------------------------------------------------- */
export async function previewLayoutHandler(req, res) {
  try {
    const { deckId } = req.params;
    const {
      size = '3x5',
      orientation = 'portrait',
      design = 'design1',
      cardIndex: cardIndexParam,
    } = req.query;

    // 1) Deck name
    const deck = await prisma.deck.findUnique({
      where: { id: deckId },
      select: { name: true },
    });
    const deckName = deck ? deck.name : 'Untitled Deck';

    // 2) Cards
    let cards = await cardService.findCardsByDeckId(deckId);

    // If single cardIndex is requested
    if (cardIndexParam !== undefined) {
      const idx = parseInt(cardIndexParam, 10);
      cards = cards[idx] ? [cards[idx]] : [];
    }

    // 3) Paths
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const { layoutFile, cardFolder, cardFile, designFolder } = buildTemplatePaths(
      size,
      orientation,
      design
    );
    const layoutPath = path.join(__dirname, '..', 'templates', 'layouts', layoutFile);

    // 4) highlight.js setup
    const { themeCSS, highlightCode } = getHighlightSetup();

    // 5) Render EJS
    const htmlString = await ejs.renderFile(layoutPath, {
      deckName,
      cards,
      orientation,
      size,
      design,
      themeCSS,
      highlightCode,
      cardFolder,
      cardFile,
      designFolder,
    });

    // 6) Return HTML
    res.setHeader('Content-Type', 'text/html');
    return res.send(htmlString);

  } catch (error) {
    console.error('[previewLayoutHandler] Error:', error);
    return res.status(500).send('Error generating custom layout preview');
  }
}

/* --------------------------------------------------------------------------
   2) PDF
   GET /cards/:deckId/pdfLayout2?size=3x5&orientation=portrait&design=design1
   -------------------------------------------------------------------------- */
export async function generatePDFHandler(req, res) {
  try {
    const { deckId } = req.params;
    const {
      size = '3x5',
      orientation = 'portrait',
      design = 'design1',
      cardIndex: cardIndexParam,
    } = req.query;

    // 1) Deck name
    const deck = await prisma.deck.findUnique({
      where: { id: deckId },
      select: { name: true },
    });
    const deckName = deck ? deck.name : 'Untitled Deck';

    // 2) Cards
    let cards = await cardService.findCardsByDeckId(deckId);

    // If single cardIndex is requested
    if (cardIndexParam !== undefined) {
      const idx = parseInt(cardIndexParam, 10);
      cards = cards[idx] ? [cards[idx]] : [];
    }

    // 3) Paths
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const { layoutFile, cardFolder, cardFile, designFolder } = buildTemplatePaths(
      size,
      orientation,
      design
    );
    const layoutPath = path.join(__dirname, '..', 'templates', 'layouts', layoutFile);

    // 4) highlight.js setup
    const { themeCSS, highlightCode } = getHighlightSetup();

    // 5) EJS data
    const ejsData = {
      deckName,
      cards,
      orientation,
      size,
      design,
      themeCSS,
      highlightCode,
      cardFolder,
      cardFile,
      designFolder,
    };

    // 6) Generate PDF
    const pdfBuffer = await generatePDF(layoutPath, ejsData, {
      pdfOptions: {
        format: 'Letter',
        printBackground: true,
        margin: { top: '0in', right: '0in', bottom: '0in', left: '0in' },
      },
      launchOptions: { headless: true },
    });

    // 7) Return PDF
    const outputFilename = `flashcards-${size}-${orientation}-${design}.pdf`;
    res.writeHead(200, {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${outputFilename}"`,
      'Content-Length': pdfBuffer.length,
    });
    return res.end(pdfBuffer);

  } catch (error) {
    console.error('[generatePDFHandler] Error:', error);
    return res.status(500).json({
      message: 'Error generating custom layout PDF',
      error,
    });
  }
}
