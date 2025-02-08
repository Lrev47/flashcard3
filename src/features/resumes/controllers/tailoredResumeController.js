// src/features/tailoredResumes/controllers/tailoredResumeController.js

import tailoredResumeService from '../services/tailoredResumeService.js';

/**
 * Controller to create a new TailoredResume and its sub-models.
 * Expects the data in req.body.
 */
async function createTailoredResume(req, res) {
  try {
    const data = req.body;
    const newTailoredResume = await tailoredResumeService.createTailoredResume(data);
    return res.status(201).json(newTailoredResume);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Controller to retrieve a specific TailoredResume by ID (with nested sub-models).
 * Expects tailoredResumeId in req.params or req.query.
 */
async function getTailoredResumeById(req, res) {
  try {
    const { tailoredResumeId } = req.params; // or from req.query
    if (!tailoredResumeId) {
      return res.status(400).json({ error: 'Missing tailoredResumeId parameter' });
    }

    const tailoredResume = await tailoredResumeService.getTailoredResumeById(tailoredResumeId);
    if (!tailoredResume) {
      return res.status(404).json({ error: 'TailoredResume not found' });
    }

    return res.status(200).json(tailoredResume);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Controller to retrieve all TailoredResumes in the system.
 * Typically for admin or debugging.
 */
async function getAllTailoredResumes(req, res) {
  try {
    const tailoredResumes = await tailoredResumeService.getAllTailoredResumes();
    return res.status(200).json(tailoredResumes);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Controller to retrieve all TailoredResumes by userId.
 * Expects userId in req.params or req.query.
 */
async function getTailoredResumesByUserId(req, res) {
  try {
    const { userId } = req.params; // or from req.query
    if (!userId) {
      return res.status(400).json({ error: 'Missing userId parameter' });
    }

    const tailoredResumes = await tailoredResumeService.getTailoredResumesByUserId(userId);
    return res.status(200).json(tailoredResumes);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Controller to retrieve all TailoredResumes by jobPostingId.
 * Expects jobPostingId in req.params or req.query.
 */
async function getTailoredResumesByJobPostingId(req, res) {
  try {
    const { jobPostingId } = req.params; // or from req.query
    if (!jobPostingId) {
      return res.status(400).json({ error: 'Missing jobPostingId parameter' });
    }

    const tailoredResumes = await tailoredResumeService.getTailoredResumesByJobPostingId(jobPostingId);
    return res.status(200).json(tailoredResumes);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Controller to retrieve TailoredResumes by both userId and jobPostingId.
 * Expects userId, jobPostingId in req.params or req.query.
 */
async function getTailoredResumesByUserIdAndJobPostingId(req, res) {
  try {
    const { userId, jobPostingId } = req.params; // or from req.query
    if (!userId || !jobPostingId) {
      return res
        .status(400)
        .json({ error: 'Missing userId and/or jobPostingId parameter(s)' });
    }

    const tailoredResumes = await tailoredResumeService.getTailoredResumesByUserIdAndJobPostingId(
      userId,
      jobPostingId
    );
    return res.status(200).json(tailoredResumes);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Controller to update an existing TailoredResume (with its sub-models).
 * Expects tailoredResumeId in req.params or req.query, updated data in req.body.
 */
async function updateTailoredResume(req, res) {
  try {
    const { tailoredResumeId } = req.params; // or from req.query
    if (!tailoredResumeId) {
      return res.status(400).json({ error: 'Missing tailoredResumeId parameter' });
    }

    const data = req.body;
    const updatedTailoredResume = await tailoredResumeService.updateTailoredResume(
      tailoredResumeId,
      data
    );
    return res.status(200).json(updatedTailoredResume);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Controller to delete a TailoredResume by its ID.
 * Expects tailoredResumeId in req.params or req.query.
 */
async function deleteTailoredResume(req, res) {
  try {
    const { tailoredResumeId } = req.params; // or from req.query
    if (!tailoredResumeId) {
      return res.status(400).json({ error: 'Missing tailoredResumeId parameter' });
    }

    const deletedTailoredResume = await tailoredResumeService.deleteTailoredResume(tailoredResumeId);
    return res.status(200).json(deletedTailoredResume);
  } catch (error) {
    return res.status(500).json({ error: error.message });
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
