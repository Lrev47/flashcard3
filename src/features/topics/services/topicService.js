// src/features/topics/services/topicService.js
import prisma from '../../../config/prismaClient.js';

/**
 * topicService
 *
 * Handles all database operations for the Topic model,
 * including hierarchical queries (descendants, ancestors, leaves).
 */
const topicService = {
  // --------------------------------------------------------------------------
  // 1. CREATE
  // --------------------------------------------------------------------------
  /**
   * Create a new Topic record.
   * @param {Object} data - The data to create a Topic with.
   * @returns {Promise<Object>}
   */
  async createTopic(data) {
    return prisma.topic.create({
      data,
      include: {
        parentTopic: true,
        subTopics: true,
      },
    });
  },

  // --------------------------------------------------------------------------
  // 2. READ (FIND)
  // --------------------------------------------------------------------------
  /**
   * Find all Topic records, including subTopics, parentTopic, and cards.
   * @returns {Promise<Array>}
   */
  async findMany() {
    return prisma.topic.findMany({
      include: {
        cards: true,
        subTopics: true,
        parentTopic: true,
      },
    });
  },

  /**
   * Find a single Topic by its ID.
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    return prisma.topic.findUnique({
      where: { id },
      include: {
        parentTopic: true,
        subTopics: true,
        cards: true,
      },
    });
  },

  /**
   * Alternate method if you want a different name or slight variations.
   */
  async findUniqueWithSubtopics(id) {
    return prisma.topic.findUnique({
      where: { id },
      include: {
        subTopics: true,
        parentTopic: true,
        cards: true,
      },
    });
  },

  /**
   * Finds all Topics where `cardsGenerated = null`.
   * (You must have a `cardsGenerated` field in the Topic model.)
   */
  async findManyByCardsGeneratedNull() {
    return prisma.topic.findMany({
      where: { cardsGenerated: null },
    });
  },

  /**
   * Example: Return all root Topics (parentTopicId = null).
   */
  async findRootTopics() {
    return prisma.topic.findMany({
      where: { parentTopicId: null },
      include: {
        subTopics: true,
      },
    });
  },

  // --------------------------------------------------------------------------
  // 3. UPDATE
  // --------------------------------------------------------------------------
  /**
   * Update a Topic by its ID.
   */
  async updateTopic(id, data) {
    return prisma.topic.update({
      where: { id },
      data,
      include: {
        parentTopic: true,
        subTopics: true,
      },
    });
  },

  // --------------------------------------------------------------------------
  // 4. DELETE
  // --------------------------------------------------------------------------
  /**
   * Delete a Topic by its ID.
   */
  async deleteTopic(id) {
    return prisma.topic.delete({
      where: { id },
    });
  },

  /**
   * (Optional) A helper to delete a Topic and all of its descendants.
   * BFS approach example.
   */
  async deleteTopicAndDescendants(id) {
    // 1) Gather all descendant IDs
    const allDescIds = await this.findAllDescendantTopicIds(id);
    allDescIds.push(id);

    // 2) Delete them all
    await prisma.topic.deleteMany({
      where: { id: { in: allDescIds } },
    });
    return { deletedTopics: allDescIds };
  },

  // --------------------------------------------------------------------------
  // 5. HIERARCHY QUERIES
  // --------------------------------------------------------------------------
  /**
   * BFS to find all descendant IDs under `parentTopicId`.
   * Returns an array including the original parentTopicId.
   */
  async findAllDescendantTopicIds(parentTopicId) {
    const allIds = [parentTopicId];
    const queue = [parentTopicId];

    while (queue.length > 0) {
      const currentId = queue.shift();
      const children = await prisma.topic.findMany({
        where: { parentTopicId: currentId },
        select: { id: true },
      });

      for (const child of children) {
        allIds.push(child.id);
        queue.push(child.id);
      }
    }

    return allIds;
  },

  /**
   * Traces upward from child to parent, collecting ancestor IDs.
   */
  async findAllAncestorTopicIds(childTopicId) {
    const ancestors = [];
    let currentId = childTopicId;

    while (currentId) {
      const currentTopic = await prisma.topic.findUnique({
        where: { id: currentId },
        select: { parentTopicId: true },
      });

      if (!currentTopic || !currentTopic.parentTopicId) {
        break;
      }
      ancestors.push(currentTopic.parentTopicId);
      currentId = currentTopic.parentTopicId;
    }

    return ancestors;
  },

  /**
   * Return 'leaf' topics in a subtree: i.e. topics that have no subTopics.
   */
  async findLeafTopicsByParentId(parentTopicId) {
    const allDescIds = await this.findAllDescendantTopicIds(parentTopicId);
    return prisma.topic.findMany({
      where: {
        id: { in: allDescIds },
        subTopics: { none: {} }, // Means no subtopics
      },
      include: {
        parentTopic: true,
        subTopics: true,
      },
    });
  },
};

export default topicService;
