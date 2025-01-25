import { createAndExpandDeck } from '../AiApis/topicGeneration.js';
import { generateFlashcardsForTopic, generateCardsForAllPendingTopics } from '../AiApis/cardGeneration.js';
import { docAllCards } from '../AiApis/detailedExplinationGeneration.js';
import { generateAllMissingQRCodes } from '../controllers/qrCodeController.js';

export async function masterGenerateHandler(req, res) {
  try {
    const { topicName } = req.body;
    if (!topicName) {
      return res.status(400).json({
        message: 'Please provide a topicName in the request body.'
      });
    }

    console.log("[masterGenerate] Starting master generation for topic:", topicName);

    let userId = null;
    let userName = 'public';
    if (req.user) {
      userId = req.user.userId;
      userName = req.user.name || 'public';
    }

    const { deck, parentTopic } = await createAndExpandDeck(topicName, userId);
    console.log("[masterGenerate] Deck + parent topic created:", { deck, parentTopic });

    await generateFlashcardsForTopic(parentTopic, userName);
    console.log("[masterGenerate] Flashcards generated for the parent topic:", parentTopic.name);

    await generateCardsForAllPendingTopics(userName);
    console.log("[masterGenerate] Flashcards generated for all pending topics.");

    await docAllCards();
    console.log("[masterGenerate] Detailed explanations generated for all flashcards.");

    const missingQRCount = await generateAllMissingQRCodes();
    console.log(`[masterGenerate] Missing QR codes generated for ${missingQRCount} card(s).`);

    const finalMessage = `Master generation complete. Created deck '${deck.name}' and subtopics, flashcards, docs, plus ${missingQRCount} new QR code(s).`;

    return res.status(200).json({
      message: finalMessage,
      data: { deck, parentTopic }
    });
  } catch (error) {
    console.error("[masterGenerate] Error during generation process:", error);
    return res.status(500).json({
      message: "Error in master generation process",
      error
    });
  }
}
