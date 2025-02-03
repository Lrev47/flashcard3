// src/features/flashCards/routes/cardRoutes.js
import { Router } from 'express';
import {
  // 1) BASIC CARD CRUD
  getAllCardsHandler,
  getCardByIdHandler,
  createCardHandler,
  updateCardHandler,
  deleteCardHandler,

  // 2) CARD QUERIES
  getCardsByTopicHandler,
  getAllDescendantCardsHandler,
  getCardsByDeckIdHandler,
  getCardsByDocumentIdHandler,

  // 3) EXPLANATION
  upsertCardExplanationHandler,
  removeCardExplanationHandler,
  addCardExplanationBlockHandler,

  // 4) AI / GENERATION
  generateMoreCardsHandler,
  generateCardsHandler,
  docAllCardsHandler,
  masterGenerateHandler,

  // 5) QR CODE
  getCardQRCodeHandler,
  generateMissingQRCodesHandler,
} from '../controllers/cardController.js';


// NEW imports for PDF preview & generation
import {
   generateFlashcardsPDFHandler,
   previewFlashcardsHTMLHandler,
 } from '../controllers/pdfController.js';

const router = Router();

/* ===========================================================================
   1) BASIC CARD CRUD
   ========================================================================== */
router.get('/', getAllCardsHandler);    // GET /cards
router.post('/', createCardHandler);    // POST /cards

/* ===========================================================================
   2) CARD QUERIES
   ========================================================================== */
router.get('/topic/:topicId', getCardsByTopicHandler);                    
router.get('/topic/:topicId/descendants', getAllDescendantCardsHandler);  
router.get('/deck/:deckId', getCardsByDeckIdHandler);                     
router.get('/document/:documentId', getCardsByDocumentIdHandler);         

/* ===========================================================================
   5) QR CODE (specific card param)
   ========================================================================== */
router.get('/:cardId/qrCode', getCardQRCodeHandler);                       // GET /cards/:cardId/qrCode

/* ===========================================================================
   3) EXPLANATION & BLOCK OPERATIONS
   ========================================================================== */
router.post('/:cardId/explanation', upsertCardExplanationHandler);         
router.delete('/:cardId/explanation', removeCardExplanationHandler);       
router.post('/:cardId/explanation/block', addCardExplanationBlockHandler);

/* ===========================================================================
   1b) BASIC CARD CRUD (by ID)
   ========================================================================== */
router.get('/:cardId', getCardByIdHandler);        
router.put('/:cardId', updateCardHandler);         
router.delete('/:cardId', deleteCardHandler);      

/* ===========================================================================
   5b) QR CODE (missing)
   ========================================================================== */
router.post('/qrCode/missing', generateMissingQRCodesHandler);

/* ===========================================================================
   4) AI / GENERATION
   ========================================================================== */
router.post('/generateMore/:topicId', generateMoreCardsHandler);
router.post('/generate', generateCardsHandler);
router.post('/docAll', docAllCardsHandler);
router.post('/masterGenerate', masterGenerateHandler);

/* ===========================================================================
   6) PDF GENERATION (by deckId)
   ========================================================================== */
// e.g. GET /cards/DECK123/pdf?layout=layout1&style=design1
router.get('/:deckId/pdf', generateFlashcardsPDFHandler);

// e.g. GET /cards/DECK123/preview?layout=layout1&style=design1
router.get('/:deckId/preview', previewFlashcardsHTMLHandler);

export default router;
