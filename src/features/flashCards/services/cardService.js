// src/features/flashCards/services/cardService.js

import prisma from '../../../config/prismaClient.js';
import topicService from '../../topics/services/topicService.js';

/**
 * A reusable "select" object so we're consistent in all queries.
 * This ensures the fields you want (and any others) are always returned.
 */
const cardSelect = {
  id: true,
  authorName: true,
  question: true,
  qrCodeUrl: true,
  documentId: true,
  answer: true,
  answerType: true,
  examples: true,
  resources: true,
  DetailesGenerated: true,
  isVerified: true,
  createdAt: true,
  updatedAt: true,

  // Include relational data
  topic: true,
  document: true,

  // For explanation, select the explanation itself + blocks
  explanation: {
    select: {
      id: true,
      title: true,
      createdAt: true,
      updatedAt: true,
      blocks: {
        select: {
          id: true,
          explanationId: true,
          blockType: true,
          blockTitle: true,
          content: true,
          order: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  },
};

const cardService = {
  /* ---------------------------------------------------------------------------
   *  1. BASIC CARD CRUD
   * ------------------------------------------------------------------------- */

  /**
   * Create a new card (with optional explanation).
   */
  async create(cardData, explanationData = null) {
    if (explanationData) {
      return prisma.card.create({
        data: {
          ...cardData,
          explanation: {
            create: {
              title: explanationData.title || null,
              blocks: explanationData.blocks
                ? {
                    create: explanationData.blocks.map((block) => ({
                      blockType: block.blockType,
                      content: block.content,
                      order: block.order ?? 0,
                      blockTitle: block.blockTitle ?? null,
                    })),
                  }
                : undefined,
            },
          },
        },
        select: cardSelect,
      });
    }

    // Otherwise, create a card with no explanation
    return prisma.card.create({
      data: cardData,
      select: cardSelect,
    });
  },

  /**
   * Find a card by its ID.
   */
  async findById(id) {
    return prisma.card.findUnique({
      where: { id },
      select: cardSelect,
    });
  },

  /**
   * Update a card by its ID. (Doesn't automatically handle explanation changes.)
   */
  async update(id, data) {
    return prisma.card.update({
      where: { id },
      data,
      select: cardSelect,
    });
  },

  /**
   * Delete a card by its ID.
   * Returns the deleted card with the fields/relations you've selected.
   */
  async remove(id) {
    return prisma.card.delete({
      where: { id },
      select: cardSelect,
    });
  },

  /* ---------------------------------------------------------------------------
   *  2. QUERIES BY TOPIC, DECK, & DOCUMENT
   * ------------------------------------------------------------------------- */

  /**
   * Find all cards (includes topic, document, explanation).
   */
  async findAll() {
    return prisma.card.findMany({
      select: cardSelect,
    });
  },

  /**
   * Find cards by a specific topicId.
   */
  async findByTopicId(topicId) {
    return prisma.card.findMany({
      where: { topicId },
      select: cardSelect,
    });
  },

  /**
   * Recursively find all cards under a parent topic and its subtopics.
   */
  async findAllByParentTopicIdIncludeSubtopics(parentTopicId) {
    console.log('[findAllByParentTopicIdIncludeSubtopics] parentTopicId=', parentTopicId);

    const allTopicIds = await topicService.findAllDescendantTopicIds(parentTopicId);
    console.log('[findAllByParentTopicIdIncludeSubtopics] allTopicIds=', allTopicIds);

    const results = await prisma.card.findMany({
      where: { topicId: { in: allTopicIds } },
      select: cardSelect,
    });
    console.log(`[findAllByParentTopicIdIncludeSubtopics] returning ${results.length} cards...`);
    return results;
  },

  /**
   * Find all cards associated with a Deck by referencing the deck's topic (and subtopics).
   */
  async findCardsByDeckId(deckId) {
    console.log('[findCardsByDeckId] deckId=', deckId);
    const deck = await prisma.deck.findUnique({
      where: { id: deckId },
      select: { topicId: true },
    });

    console.log('[findCardsByDeckId] deck=', deck);

    if (!deck) {
      throw new Error(`Deck not found with ID ${deckId}`);
    }
    if (!deck.topicId) {
      console.log('[findCardsByDeckId] deck.topicId is null => returning []');
      return [];
    }

    const cards = await this.findAllByParentTopicIdIncludeSubtopics(deck.topicId);
    console.log(`[findCardsByDeckId] found ${cards.length} cards by topicId=`, deck.topicId);
    return cards;
  },

  /**
   * Find all cards for a given documentId (document-based).
   */
  async findByDocumentId(documentId) {
    return prisma.card.findMany({
      where: { documentId },
      select: cardSelect,
    });
  },

  /**
   * Generic filter. E.g. { isEnhanced: false }
   */
  async findMany(whereClause) {
    return prisma.card.findMany({
      where: whereClause,
      select: cardSelect,
    });
  },

  /**
   * Find cards that are not enhanced (isEnhanced == null or false).
   */
  async findAllNotEnhanced() {
    return prisma.card.findMany({
      where: {
        OR: [{ isEnhanced: null }, { isEnhanced: false }],
      },
      select: cardSelect,
    });
  },

  /**
   * Find cards that have no explanation (explanation == null).
   */
  async findAllWithoutExplanation() {
    return prisma.card.findMany({
      where: { explanation: null },
      select: cardSelect,
    });
  },

  /**
   * Find all cards where DetailesGenerated == null
   */
  async findAllWhereDetailesGeneratedIsNull() {
    return prisma.card.findMany({
      where: {
        DetailesGenerated: null,
      },
      select: cardSelect,
    });
  },

  /* ---------------------------------------------------------------------------
   *  3. EXPLANATION & BLOCK OPERATIONS
   * ------------------------------------------------------------------------- */

  /**
   * Upsert (create or update) the explanation for a card.
   */
  async upsertExplanation(cardId, explanationData) {
    // We upsert the explanation, but also return the entire card object 
    // (with the fields we want) by re-querying the card afterwards.
    await prisma.detailedExplanation.upsert({
      where: { cardId },
      create: {
        cardId,
        title: explanationData.title || null,
        blocks: {
          create: explanationData.blocks?.map((b) => ({
            blockType: b.blockType,
            blockTitle: b.blockTitle ?? null,
            content: b.content,
            order: b.order ?? 0,
          })),
        },
      },
      update: {
        title: explanationData.title || null,
        blocks: {
          deleteMany: {},
          create: explanationData.blocks?.map((b) => ({
            blockType: b.blockType,
            blockTitle: b.blockTitle ?? null,
            content: b.content,
            order: b.order ?? 0,
          })),
        },
      },
    });

    // Return the updated card with the newly upserted explanation
    return prisma.card.findUnique({
      where: { id: cardId },
      select: cardSelect,
    });
  },

  /**
   * Remove (delete) the explanation (and blocks) for a given card, if it exists.
   */
  async removeExplanation(cardId) {
    const existingExp = await prisma.detailedExplanation.findUnique({
      where: { cardId },
      include: { blocks: true },
    });
    if (!existingExp) return null;

    // Delete all blocks
    await prisma.explanationBlock.deleteMany({
      where: { explanationId: existingExp.id },
    });

    // Delete the explanation
    await prisma.detailedExplanation.delete({
      where: { cardId },
    });

    // Return the card now that its explanation is removed
    return prisma.card.findUnique({
      where: { id: cardId },
      select: cardSelect,
    });
  },

  /**
   * Add a single new block to the existing explanation of a card.
   */
  async addExplanationBlock(cardId, blockData) {
    const explanation = await prisma.detailedExplanation.findUnique({
      where: { cardId },
    });
    if (!explanation) {
      throw new Error(`No explanation found for card ${cardId}`);
    }

    await prisma.explanationBlock.create({
      data: {
        explanationId: explanation.id,
        blockType: blockData.blockType,
        blockTitle: blockData.blockTitle ?? null,
        content: blockData.content || '',
        order: blockData.order ?? 0,
      },
    });

    // Return the updated card with the new block in explanation
    return prisma.card.findUnique({
      where: { id: cardId },
      select: cardSelect,
    });
  },
};

export default cardService;
