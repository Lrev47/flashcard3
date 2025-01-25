import prisma from '../../../config/prismaClient.js';
import topicService from './topicService.js';

const cardService = {
  async findAll() {
    return prisma.card.findMany({
      include: {
        topic: true,
        tags: true,
      },
    });
  },

  async findByTopicId(topicId) {
    return prisma.card.findMany({
      where: { topicId },
      include: {
        topic: true,
        tags: true,
      },
    });
  },

  async findAllByParentTopicIdIncludeSubtopics(parentTopicId) {
    const allTopicIds = await topicService.findAllDescendantTopicIds(parentTopicId);
    return prisma.card.findMany({
      where: {
        topicId: { in: allTopicIds },
      },
      include: {
        topic: true,
        tags: true,
      },
    });
  },

  async findById(id) {
    return prisma.card.findUnique({
      where: { id },
      include: {
        topic: true,
        tags: true,
      },
    });
  },

  async create(data) {
    return prisma.card.create({
      data,
      include: {
        topic: true,
        tags: true,
      },
    });
  },

  async update(id, data) {
    return prisma.card.update({
      where: { id },
      data,
      include: {
        topic: true,
        tags: true,
      },
    });
  },

  async remove(id) {
    return prisma.card.delete({
      where: { id },
    });
  },

  async findAllNotEnhanced() {
    return prisma.card.findMany({
      where: { isEnhanced: null },
      include: {
        topic: true,
        tags: true,
      },
    });
  },

  async findMany(whereClause) {
    return prisma.card.findMany({
      where: whereClause,
      include: {
        topic: true,
        tags: true,
      },
    });
  },

  async findAllWithoutExplanation() {
    return prisma.card.findMany({
      where: { detailedExplanation: null },
      include: {
        topic: true,
        tags: true,
      },
    });
  },
};

export default cardService;
