// src/features/jobPostings/services/jobPostingService.js

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Creates a new job posting.
 * @param {Object} data - The job posting data.
 * @returns {Promise<Object>} The newly created job posting record.
 */
async function createJobPosting(data) {
  try {
    const newJobPosting = await prisma.jobPosting.create({
      data: {
        userId: data.userId,
        initalListing: data.initalListing,
        companyName: data.companyName,
        jobTitle: data.jobTitle,
        jobDescription: data.jobDescription,
      },
    });
    return newJobPosting;
  } catch (error) {
    throw new Error(`Error creating job posting: ${error.message}`);
  }
}

/**
 * Retrieves a specific job posting by its ID.
 * @param {string} jobPostingId - The ID of the job posting.
 * @returns {Promise<Object|null>} The job posting record or null if not found.
 */
async function getJobPostingById(jobPostingId) {
  try {
    const jobPosting = await prisma.jobPosting.findUnique({
      where: { id: jobPostingId },
    });
    return jobPosting;
  } catch (error) {
    throw new Error(`Error retrieving job posting by ID: ${error.message}`);
  }
}

/**
 * Retrieves all job postings associated with a particular user.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<Array>} An array of job postings.
 */
async function getJobPostingsByUserId(userId) {
  try {
    const jobPostings = await prisma.jobPosting.findMany({
      where: { userId },
    });
    return jobPostings;
  } catch (error) {
    throw new Error(`Error retrieving job postings by user ID: ${error.message}`);
  }
}

/**
 * Retrieves all job postings (for admin or debugging).
 * @returns {Promise<Array>} An array of all job postings in the database.
 */
async function getAllJobPostings() {
  try {
    const jobPostings = await prisma.jobPosting.findMany();
    return jobPostings;
  } catch (error) {
    throw new Error(`Error retrieving all job postings: ${error.message}`);
  }
}

/**
 * Updates an existing job posting.
 * @param {string} jobPostingId - The ID of the job posting to update.
 * @param {Object} data - The updated job posting data.
 * @returns {Promise<Object>} The updated job posting record.
 */
async function updateJobPosting(jobPostingId, data) {
  try {
    const updatedJobPosting = await prisma.jobPosting.update({
      where: { id: jobPostingId },
      data: {
        userId: data.userId,
        initalListing: data.initalListing,
        companyName: data.companyName,
        jobTitle: data.jobTitle,
        jobDescription: data.jobDescription,
      },
    });
    return updatedJobPosting;
  } catch (error) {
    throw new Error(`Error updating job posting: ${error.message}`);
  }
}

/**
 * Deletes a job posting by its ID.
 * @param {string} jobPostingId - The ID of the job posting to delete.
 * @returns {Promise<Object>} The deleted job posting record.
 */
async function deleteJobPosting(jobPostingId) {
  try {
    const deletedJobPosting = await prisma.jobPosting.delete({
      where: { id: jobPostingId },
    });
    return deletedJobPosting;
  } catch (error) {
    throw new Error(`Error deleting job posting: ${error.message}`);
  }
}

export default {
  createJobPosting,
  getJobPostingById,
  getJobPostingsByUserId,
  getAllJobPostings,
  updateJobPosting,
  deleteJobPosting,
};
