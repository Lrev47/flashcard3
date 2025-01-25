import cardService from './cardService.js';

const previewService = {
  async fetchCardWithTopic(cardId) {
    const card = await cardService.findById(cardId);
    return card;
  },
};

export default previewService;
