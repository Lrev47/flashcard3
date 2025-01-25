import prisma from '../../../config/prismaClient.js';

const topicService = {
 
  async findMany() {
    return prisma.topic.findMany({
      include: {
        cards: true,
        subTopics: true,
        parentTopic: true,
      },
    });
  },

  async createTopic(data) {
    return prisma.topic.create({
      data,
      include: {
        parentTopic: true,
        subTopics: true,
      },
    });
  },

  async update(id, data) {
    return prisma.topic.update({
      where: { id },
      data,
      include: {
        parentTopic: true,
        subTopics: true,
      },
    });
  },

  async deleteTopic(id) {
    return prisma.topic.delete({
      where: { id },
    });
  },

  async findManyByCardsGeneratedNull() {
    return prisma.topic.findMany({
      where: { cardsGenerated: null },
    });
  },

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

  async findLeafTopicsByParentId(parentTopicId) {
    const allDescIds = await this.findAllDescendantTopicIds(parentTopicId);
    return prisma.topic.findMany({
      where: {
        id: { in: allDescIds },
        subTopics: {
          none: {},
        },
      },
      include: {
        parentTopic: true,
        subTopics: true,
      },
    });
  },
};

export default topicService;
