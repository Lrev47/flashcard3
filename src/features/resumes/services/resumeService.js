// src/features/resumes/services/resumeService.js

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Creates a new resume with all attached data.
 * @param {Object} data - The resume data, including attached sub-model arrays.
 * @returns {Promise<Object>} The newly created resume record with nested models included.
 */
async function createResume(data) {
  try {
    // Fallback userId if none provided
    const userId = data.userId || 'test-user-id';

    // 1. Make sure the user actually exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error(
        `No user found with ID "${userId}". Please create the user first or pass a valid user ID.`
      );
    }

    const newResume = await prisma.resume.create({
      data: {
        // Connect to the existing user record
        user: {
          connect: {
            id: userId,
          },
        },
        name: data.name,
        city: data.city,
        state: data.state,
        zip: data.zip,
        phone: data.phone,
        email: data.email,
        linkedinUrl: data.linkedinUrl,
        githubUrl: data.githubUrl,
        summary: data.summary,
        // Sub-models
        education: {
          create: data.education || [],
        },
        experiences: {
          create: data.experiences || [],
        },
        projects: {
          create: data.projects || [],
        },
        skillGroups: {
          create: data.skillGroups || [],
        },
        achievements: {
          create: data.achievements || [],
        },
        certifications: {
          create: data.certifications || [],
        },
        languages: {
          create: data.languages || [],
        },
        volunteerExperiences: {
          create: data.volunteerExperiences || [],
        },
        references: {
          create: data.references || [],
        },
      },
      include: {
        education: true,
        experiences: true,
        projects: true,
        skillGroups: true,
        achievements: true,
        certifications: true,
        languages: true,
        volunteerExperiences: true,
        references: true,
      },
    });

    return newResume;
  } catch (error) {
    throw new Error(`Error creating resume: ${error.message}`);
  }
}

/**
 * Retrieves a specific resume by its ID.
 * @param {string} resumeId - The ID of the resume.
 * @returns {Promise<Object|null>} The resume record (with nested models) or null if not found.
 */
async function getResumeById(resumeId) {
  try {
    const resume = await prisma.resume.findUnique({
      where: { id: resumeId },
      include: {
        education: true,
        experiences: true,
        projects: true,
        skillGroups: true,
        achievements: true,
        certifications: true,
        languages: true,
        volunteerExperiences: true,
        references: true,
      },
    });

    return resume;
  } catch (error) {
    throw new Error(`Error retrieving resume by ID: ${error.message}`);
  }
}

/**
 * Retrieves all resumes associated with a particular user.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<Array>} An array of resumes (each with nested models).
 */
async function getResumesByUserId(userId) {
  try {
    const resumes = await prisma.resume.findMany({
      where: { userId },
      include: {
        education: true,
        experiences: true,
        projects: true,
        skillGroups: true,
        achievements: true,
        certifications: true,
        languages: true,
        volunteerExperiences: true,
        references: true,
      },
    });

    return resumes;
  } catch (error) {
    throw new Error(`Error retrieving resumes by user ID: ${error.message}`);
  }
}

/**
 * Retrieves all resumes (usually for admin or debugging).
 * @returns {Promise<Array>} An array of resumes (with nested models).
 */
async function getAllResumes() {
  try {
    const resumes = await prisma.resume.findMany({
      include: {
        education: true,
        experiences: true,
        projects: true,
        skillGroups: true,
        achievements: true,
        certifications: true,
        languages: true,
        volunteerExperiences: true,
        references: true,
      },
    });
    return resumes;
  } catch (error) {
    throw new Error(`Error retrieving all resumes: ${error.message}`);
  }
}

/**
 * Updates an existing resume (and replaces attached data).
 * This approach deletes all existing attached sub-model records for the resume
 * then recreates them from the provided arrays in `data`.
 * @param {string} resumeId - The ID of the resume to update.
 * @param {Object} data - The updated resume data, including sub-model arrays.
 * @returns {Promise<Object>} The updated resume record with nested models included.
 */
async function updateResume(resumeId, data) {
  try {
    // Fallback userId if none provided
    const userId = data.userId || 'test-user-id';

    // 1. Make sure the user actually exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error(
        `No user found with ID "${userId}". Please create the user first or pass a valid user ID.`
      );
    }

    const updatedResume = await prisma.resume.update({
      where: { id: resumeId },
      data: {
        user: {
          connect: {
            id: userId,
          },
        },
        name: data.name,
        city: data.city,
        state: data.state,
        zip: data.zip,
        phone: data.phone,
        email: data.email,
        linkedinUrl: data.linkedinUrl,
        githubUrl: data.githubUrl,
        summary: data.summary,
        // For each sub-model, remove existing records then recreate from data arrays.
        education: {
          deleteMany: {},
          create: data.education || [],
        },
        experiences: {
          deleteMany: {},
          create: data.experiences || [],
        },
        projects: {
          deleteMany: {},
          create: data.projects || [],
        },
        skillGroups: {
          deleteMany: {},
          create: data.skillGroups || [],
        },
        achievements: {
          deleteMany: {},
          create: data.achievements || [],
        },
        certifications: {
          deleteMany: {},
          create: data.certifications || [],
        },
        languages: {
          deleteMany: {},
          create: data.languages || [],
        },
        volunteerExperiences: {
          deleteMany: {},
          create: data.volunteerExperiences || [],
        },
        references: {
          deleteMany: {},
          create: data.references || [],
        },
      },
      include: {
        education: true,
        experiences: true,
        projects: true,
        skillGroups: true,
        achievements: true,
        certifications: true,
        languages: true,
        volunteerExperiences: true,
        references: true,
      },
    });

    return updatedResume;
  } catch (error) {
    throw new Error(`Error updating resume: ${error.message}`);
  }
}

/**
 * Deletes a resume by its ID.
 * This will also remove attached sub-model records due to cascade behavior in Prisma.
 * @param {string} resumeId - The ID of the resume to delete.
 * @returns {Promise<Object>} The deleted resume record.
 */
async function deleteResume(resumeId) {
  try {
    const deletedResume = await prisma.resume.delete({
      where: { id: resumeId },
    });
    return deletedResume;
  } catch (error) {
    throw new Error(`Error deleting resume: ${error.message}`);
  }
}

export default {
  createResume,
  getResumeById,
  getResumesByUserId,
  getAllResumes,
  updateResume,
  deleteResume,
};
