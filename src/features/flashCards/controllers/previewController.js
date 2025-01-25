import previewService from '../services/previewService.js';
import cardService from '../services/cardService.js'; 

function generateMockCards(count = 16) {
  const arr = [];
  for (let i = 0; i < count; i++) {
    arr.push({
      id: `mock-card-${i + 1}`,
      question: `Mock question #${i + 1}?`,
      answer: `Mock answer #${i + 1}. This is some answer text you can style.`,
      difficulty: i % 3 === 0 ? 'EASY' : i % 3 === 1 ? 'MEDIUM' : 'HARD',
      answerType: 'NONE', 
      authorName: 'Mock Author',
      qrCodeUrl: null,
      topic: { name: `MockTopic${Math.floor(i / 4) + 1}` },
      examples: {}, 
    });
  }
  return arr;
}

export async function previewCardHandler(req, res) {
  try {
    const { cardId, style = 'CardStyle1', side = 'front', mock } = req.query;
  
    let card;
    if (mock === 'true') {
      const mockCards = generateMockCards(16);
      card = mockCards[0];
      if (!card) {
        return res.status(404).send('Mock cards are empty');
      }
    } else {
      if (!cardId) {
        return res.status(400).send('Missing cardId param (or use ?mock=true)');
      }
      card = await previewService.fetchCardWithTopic(cardId);
      if (!card) {
        return res.status(404).send(`Card not found with ID: ${cardId}`);
      }
    }

    const parentTopicName = card.topic ? card.topic.name : '';

    const templatePath = `CardStyles/${style}/${side}.ejs`;

    return res.render(templatePath, {
      card,
      parentTopicName
    });
  } catch (error) {
    console.error('[previewCardHandler] Error:', error);
    return res.status(500).send('An error occurred while previewing the card');
  }
}

export async function previewDeckHandler(req, res) {
  try {
    const { topicId, style = 'CardStyle1', printable = 'printable1', mock } = req.query;
    console.log('DEBUG style =>', style);

    let cards = [];
    if (mock === 'true') {
      cards = generateMockCards(16);
    } else {
      if (!topicId) {
        return res.status(400).send('Missing topicId param (or use ?mock=true)');
      }

      cards = await cardService.findAllByParentTopicIdIncludeSubtopics(topicId);
      if (!cards || cards.length === 0) {
        return res.status(404).send('No cards found for this topic');
      }
    }

    const processedCards = cards.map(c => ({
      ...c,
      parentTopicName: c.topic ? c.topic.name : ''
    }));

    const templatePath = `PrintableTemplates/${printable}.ejs`;

    return res.render(templatePath, {
      cards: processedCards,
      style
    });
  } catch (error) {
    console.error('[previewDeckHandler] Error:', error);
    return res.status(500).send('An error occurred while previewing the deck');
  }
}
