import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Creates a new TailoredResume with all its nested sub-models.
 * @param {Object} data - The TailoredResume data, including sub-model arrays.
 * @returns {Promise<Object>} The newly created TailoredResume record (with nested sub-models).
 */
async function createTailoredResume(data) {
  try {
    const newTailoredResume = await prisma.tailoredResume.create({
      data: {
        userId: data.userId,
        resumeId: data.resumeId,
        jobPostingId: data.jobPostingId,
        name: data.name,
        city: data.city,
        state: data.state,
        zip: data.zip,
        phone: data.phone,
        email: data.email,
        linkedinUrl: data.linkedinUrl,
        githubUrl: data.githubUrl,
        summary: data.summary,
        content: data.content,

        // Sub-models
        tailoredEducation: {
          create: data.tailoredEducation || [],
        },
        tailoredExperiences: {
          create: data.tailoredExperiences || [],
        },
        tailoredProjects: {
          create: data.tailoredProjects || [],
        },
        tailoredSkillGroups: {
          create: data.tailoredSkillGroups || [],
        },
        tailoredAchievements: {
          create: data.tailoredAchievements || [],
        },
        tailoredCertifications: {
          create: data.tailoredCertifications || [],
        },
        tailoredLanguages: {
          create: data.tailoredLanguages || [],
        },
        tailoredVolunteerExperiences: {
          create: data.tailoredVolunteerExperiences || [],
        },
        tailoredReferences: {
          create: data.tailoredReferences || [],
        },
      },
      include: {
        tailoredEducation: true,
        tailoredExperiences: true,
        tailoredProjects: true,
        tailoredSkillGroups: true,
        tailoredAchievements: true,
        tailoredCertifications: true,
        tailoredLanguages: true,
        tailoredVolunteerExperiences: true,
        tailoredReferences: true,
        // You can also include the related "resume" or "jobPosting" if needed:
        // resume: true,
        // jobPosting: true,
      },
    });

    return newTailoredResume;
  } catch (error) {
    throw new Error(`Error creating tailored resume: ${error.message}`);
  }
}

/**
 * Retrieves a specific TailoredResume by its ID (with nested sub-models).
 * @param {string} tailoredResumeId - The ID of the TailoredResume.
 * @returns {Promise<Object|null>} The TailoredResume record (with nested models) or null if not found.
 */
async function getTailoredResumeById(tailoredResumeId) {
  try {
    const tailoredResume = await prisma.tailoredResume.findUnique({
      where: { id: tailoredResumeId },
      include: {
        tailoredEducation: true,
        tailoredExperiences: true,
        tailoredProjects: true,
        tailoredSkillGroups: true,
        tailoredAchievements: true,
        tailoredCertifications: true,
        tailoredLanguages: true,
        tailoredVolunteerExperiences: true,
        tailoredReferences: true,
      },
    });
    return tailoredResume;
  } catch (error) {
    throw new Error(`Error retrieving tailored resume by ID: ${error.message}`);
  }
}

/**
 * Retrieves all TailoredResumes (usually for admin or debugging).
 * @returns {Promise<Array>} An array of TailoredResumes (with nested models).
 */
async function getAllTailoredResumes() {
  try {
    const tailoredResumes = await prisma.tailoredResume.findMany({
      include: {
        tailoredEducation: true,
        tailoredExperiences: true,
        tailoredProjects: true,
        tailoredSkillGroups: true,
        tailoredAchievements: true,
        tailoredCertifications: true,
        tailoredLanguages: true,
        tailoredVolunteerExperiences: true,
        tailoredReferences: true,
      },
    });
    return tailoredResumes;
  } catch (error) {
    throw new Error(`Error retrieving all tailored resumes: ${error.message}`);
  }
}

/**
 * Retrieves all TailoredResumes for a given user.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<Array>} An array of TailoredResumes matching the user.
 */
async function getTailoredResumesByUserId(userId) {
  try {
    const tailoredResumes = await prisma.tailoredResume.findMany({
      where: { userId },
      include: {
        tailoredEducation: true,
        tailoredExperiences: true,
        tailoredProjects: true,
        tailoredSkillGroups: true,
        tailoredAchievements: true,
        tailoredCertifications: true,
        tailoredLanguages: true,
        tailoredVolunteerExperiences: true,
        tailoredReferences: true,
      },
    });
    return tailoredResumes;
  } catch (error) {
    throw new Error(`Error retrieving tailored resumes by user ID: ${error.message}`);
  }
}

/**
 * Retrieves all TailoredResumes for a given job posting.
 * @param {string} jobPostingId - The ID of the job posting.
 * @returns {Promise<Array>} An array of TailoredResumes matching the job posting.
 */
async function getTailoredResumesByJobPostingId(jobPostingId) {
  try {
    const tailoredResumes = await prisma.tailoredResume.findMany({
      where: { jobPostingId },
      include: {
        tailoredEducation: true,
        tailoredExperiences: true,
        tailoredProjects: true,
        tailoredSkillGroups: true,
        tailoredAchievements: true,
        tailoredCertifications: true,
        tailoredLanguages: true,
        tailoredVolunteerExperiences: true,
        tailoredReferences: true,
      },
    });
    return tailoredResumes;
  } catch (error) {
    throw new Error(`Error retrieving tailored resumes by job posting ID: ${error.message}`);
  }
}

/**
 * Retrieves all TailoredResumes for a given user and specific job posting.
 * @param {string} userId - The ID of the user.
 * @param {string} jobPostingId - The ID of the job posting.
 * @returns {Promise<Array>} Matching TailoredResumes array (could be multiple).
 */
async function getTailoredResumesByUserIdAndJobPostingId(userId, jobPostingId) {
  try {
    const tailoredResumes = await prisma.tailoredResume.findMany({
      where: {
        userId,
        jobPostingId,
      },
      include: {
        tailoredEducation: true,
        tailoredExperiences: true,
        tailoredProjects: true,
        tailoredSkillGroups: true,
        tailoredAchievements: true,
        tailoredCertifications: true,
        tailoredLanguages: true,
        tailoredVolunteerExperiences: true,
        tailoredReferences: true,
      },
    });
    return tailoredResumes;
  } catch (error) {
    throw new Error(
      `Error retrieving tailored resumes by user ID and job posting ID: ${error.message}`
    );
  }
}

/**
 * Updates an existing TailoredResume (and replaces attached data).
 * This approach deletes all existing sub-model records for the TailoredResume,
 * then recreates them from the arrays in `data`.
 * @param {string} tailoredResumeId - The ID of the TailoredResume to update.
 * @param {Object} data - The updated TailoredResume data (including sub-model arrays).
 * @returns {Promise<Object>} The updated TailoredResume record (with nested sub-models).
 */
async function updateTailoredResume(tailoredResumeId, data) {
  try {
    const updatedTailoredResume = await prisma.tailoredResume.update({
      where: { id: tailoredResumeId },
      data: {
        userId: data.userId,
        resumeId: data.resumeId,
        jobPostingId: data.jobPostingId,
        name: data.name,
        city: data.city,
        state: data.state,
        zip: data.zip,
        phone: data.phone,
        email: data.email,
        linkedinUrl: data.linkedinUrl,
        githubUrl: data.githubUrl,
        summary: data.summary,
        content: data.content,

        // Sub-models: remove existing, recreate from new data
        tailoredEducation: {
          deleteMany: {},
          create: data.tailoredEducation || [],
        },
        tailoredExperiences: {
          deleteMany: {},
          create: data.tailoredExperiences || [],
        },
        tailoredProjects: {
          deleteMany: {},
          create: data.tailoredProjects || [],
        },
        tailoredSkillGroups: {
          deleteMany: {},
          create: data.tailoredSkillGroups || [],
        },
        tailoredAchievements: {
          deleteMany: {},
          create: data.tailoredAchievements || [],
        },
        tailoredCertifications: {
          deleteMany: {},
          create: data.tailoredCertifications || [],
        },
        tailoredLanguages: {
          deleteMany: {},
          create: data.tailoredLanguages || [],
        },
        tailoredVolunteerExperiences: {
          deleteMany: {},
          create: data.tailoredVolunteerExperiences || [],
        },
        tailoredReferences: {
          deleteMany: {},
          create: data.tailoredReferences || [],
        },
      },
      include: {
        tailoredEducation: true,
        tailoredExperiences: true,
        tailoredProjects: true,
        tailoredSkillGroups: true,
        tailoredAchievements: true,
        tailoredCertifications: true,
        tailoredLanguages: true,
        tailoredVolunteerExperiences: true,
        tailoredReferences: true,
      },
    });

    return updatedTailoredResume;
  } catch (error) {
    throw new Error(`Error updating tailored resume: ${error.message}`);
  }
}

/**
 * Deletes a TailoredResume by its ID (and its attached sub-models due to cascade).
 * @param {string} tailoredResumeId - The ID of the TailoredResume to delete.
 * @returns {Promise<Object>} The deleted TailoredResume record.
 */
async function deleteTailoredResume(tailoredResumeId) {
  try {
    const deletedTailoredResume = await prisma.tailoredResume.delete({
      where: { id: tailoredResumeId },
    });
    return deletedTailoredResume;
  } catch (error) {
    throw new Error(`Error deleting tailored resume: ${error.message}`);
  }
}

export default {
  createTailoredResume,
  getTailoredResumeById,
  getAllTailoredResumes,
  getTailoredResumesByUserId,
  getTailoredResumesByJobPostingId,
  getTailoredResumesByUserIdAndJobPostingId,
  updateTailoredResume,
  deleteTailoredResume,
};
