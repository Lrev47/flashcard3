// src/features/flashCards/services/cardService.js

import prisma from '../../../config/prismaClient.js';
import topicService from '../../topics/services/topicService.js';

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
        include: {
          topic: true,
          document: true,
          explanation: { include: { blocks: true } },
        },
      });
    }

    // Otherwise, create a card with no explanation
    return prisma.card.create({
      data: cardData,
      include: {
        topic: true,
        document: true,
        explanation: { include: { blocks: true } },
      },
    });
  },

  /**
   * Find a card by its ID.
   */
  async findById(id) {
    return prisma.card.findUnique({
      where: { id },
      include: {
        topic: true,
        document: true,
        explanation: { include: { blocks: true } },
      },
    });
  },

  /**
   * Update a card by its ID. (Doesn't automatically handle explanation changes.)
   */
  async update(id, data) {
    return prisma.card.update({
      where: { id },
      data,
      include: {
        topic: true,
        document: true,
        explanation: { include: { blocks: true } },
      },
    });
  },

  /**
   * Delete a card by its ID.
   */
  async remove(id) {
    return prisma.card.delete({
      where: { id },
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
      include: {
        topic: true,
        document: true,
        explanation: { include: { blocks: true } },
      },
    });
  },

  /**
   * Find cards by a specific topicId.
   */
  async findByTopicId(topicId) {
    return prisma.card.findMany({
      where: { topicId },
      include: {
        topic: true,
        document: true,
        explanation: { include: { blocks: true } },
      },
    });
  },

  /**
   * Recursively find all cards under a parent topic and its subtopics.
   */
  async findAllByParentTopicIdIncludeSubtopics(parentTopicId) {
    const allTopicIds = await topicService.findAllDescendantTopicIds(parentTopicId);

    return prisma.card.findMany({
      where: { topicId: { in: allTopicIds } },
      include: {
        topic: true,
        document: true,
        explanation: { include: { blocks: true } },
      },
    });
  },

  /**
   * Find all cards associated with a Deck by referencing the deck's topic (and subtopics).
   */
  async findCardsByDeckId(deckId) {
    const deck = await prisma.deck.findUnique({
      where: { id: deckId },
      select: { topicId: true },
    });
    if (!deck) throw new Error(`Deck not found with ID ${deckId}`);
    if (!deck.topicId) return [];

    return this.findAllByParentTopicIdIncludeSubtopics(deck.topicId);
  },

  /**
   * Find all cards for a given documentId (document-based).
   */
  async findByDocumentId(documentId) {
    return prisma.card.findMany({
      where: { documentId },
      include: {
        topic: true,
        document: true,
        explanation: { include: { blocks: true } },
      },
    });
  },

  /**
   * Generic filter. E.g. { isEnhanced: false }
   */
  async findMany(whereClause) {
    return prisma.card.findMany({
      where: whereClause,
      include: {
        topic: true,
        document: true,
        explanation: { include: { blocks: true } },
      },
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
      include: {
        topic: true,
        document: true,
        explanation: { include: { blocks: true } },
      },
    });
  },

  /**
   * Find cards that have no explanation (explanation == null).
   * (You can still use this if you need it.)
   */
  async findAllWithoutExplanation() {
    return prisma.card.findMany({
      where: { explanation: null },
      include: {
        topic: true,
        document: true,
      },
    });
  },

  /**
   * Find all cards where DetailesGenerated == null
   * (the new condition for generating explanations).
   */
  async findAllWhereDetailesGeneratedIsNull() {
    return prisma.card.findMany({
      where: {
        DetailesGenerated: null
      },
      include: {
        topic: true,
        document: true
      }
    });
  },

  /* ---------------------------------------------------------------------------
   *  3. EXPLANATION & BLOCK OPERATIONS
   * ------------------------------------------------------------------------- */

  /**
   * Upsert (create or update) the explanation for a card.
   */
  async upsertExplanation(cardId, explanationData) {
    return prisma.detailedExplanation.upsert({
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
      include: {
        blocks: true,
        card: true,
      },
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

    await prisma.explanationBlock.deleteMany({
      where: { explanationId: existingExp.id },
    });

    return prisma.detailedExplanation.delete({
      where: { cardId },
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
    return prisma.explanationBlock.create({
      data: {
        explanationId: explanation.id,
        blockType: blockData.blockType,
        blockTitle: blockData.blockTitle ?? null,
        content: blockData.content || '',
        order: blockData.order ?? 0,
      },
    });
  },
};

export default cardService;
