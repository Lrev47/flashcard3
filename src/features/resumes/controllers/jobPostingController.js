// src/features/jobPostings/controllers/jobPostingController.js

import jobPostingService from '../services/jobPostingService.js';

/**
 * Creates a new job posting.
 * Expects job posting data in req.body.
 */
async function createJobPosting(req, res) {
  try {
    const data = req.body;
    const newJobPosting = await jobPostingService.createJobPosting(data);
    return res.status(201).json(newJobPosting);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Retrieves a specific job posting by ID.
 * Expects jobPostingId in req.params or req.query.
 */
async function getJobPostingById(req, res) {
  try {
    const { jobPostingId } = req.params; // or from req.query
    if (!jobPostingId) {
      return res.status(400).json({ error: 'Missing jobPostingId parameter' });
    }

    const jobPosting = await jobPostingService.getJobPostingById(jobPostingId);
    if (!jobPosting) {
      return res.status(404).json({ error: 'Job posting not found' });
    }

    return res.status(200).json(jobPosting);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Retrieves all job postings for a particular user.
 * Expects userId in req.params or req.query.
 */
async function getJobPostingsByUserId(req, res) {
  try {
    const { userId } = req.params; // or from req.query
    if (!userId) {
      return res.status(400).json({ error: 'Missing userId parameter' });
    }

    const jobPostings = await jobPostingService.getJobPostingsByUserId(userId);
    return res.status(200).json(jobPostings);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Retrieves all job postings in the database.
 * Generally for admin or debugging.
 */
async function getAllJobPostings(req, res) {
  try {
    const jobPostings = await jobPostingService.getAllJobPostings();
    return res.status(200).json(jobPostings);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Updates an existing job posting.
 * Expects jobPostingId in req.params or req.query, updated data in req.body.
 */
async function updateJobPosting(req, res) {
  try {
    const { jobPostingId } = req.params; // or from req.query
    if (!jobPostingId) {
      return res.status(400).json({ error: 'Missing jobPostingId parameter' });
    }

    const data = req.body;
    const updatedJobPosting = await jobPostingService.updateJobPosting(jobPostingId, data);
    return res.status(200).json(updatedJobPosting);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Deletes a job posting by its ID.
 * Expects jobPostingId in req.params or req.query.
 */
async function deleteJobPosting(req, res) {
  try {
    const { jobPostingId } = req.params; // or from req.query
    if (!jobPostingId) {
      return res.status(400).json({ error: 'Missing jobPostingId parameter' });
    }

    const deletedJobPosting = await jobPostingService.deleteJobPosting(jobPostingId);
    return res.status(200).json(deletedJobPosting);
  } catch (error) {
    return res.status(500).json({ error: error.message });
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
