// resumeController.js
import resumeService from '../services/resumeService.js';

/**
 * Controller for creating a new resume (and all attached data).
 * Expects resume data in req.body.
 */
async function createResume(req, res) {
  try {
    // If the user is logged in (req.user is defined), use their ID; otherwise use a test ID
    const userId = req.user ? req.user.id : 'test-user-id';

    // Merge the determined userId into the request body
    const data = { ...req.body, userId };

    const newResume = await resumeService.createResume(data);
    return res.status(201).json(newResume);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Controller for retrieving a specific resume by its ID.
 * Expects resume ID in req.params.resumeId or req.query.resumeId.
 */
async function getResumeById(req, res) {
  try {
    const { resumeId } = req.params; // or const { resumeId } = req.query;
    if (!resumeId) {
      return res.status(400).json({ error: 'Missing resumeId parameter' });
    }

    const resume = await resumeService.getResumeById(resumeId);

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    return res.status(200).json(resume);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Controller for retrieving all resumes for a particular user.
 * Expects userId in req.params.userId or req.query.userId.
 */
async function getResumesByUserId(req, res) {
  try {
    const { userId } = req.params; // or const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'Missing userId parameter' });
    }

    const resumes = await resumeService.getResumesByUserId(userId);
    return res.status(200).json(resumes);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Controller for retrieving all resumes in the database.
 * Generally for admin or debugging; use with caution in production.
 */
async function getAllResumes(req, res) {
  try {
    const resumes = await resumeService.getAllResumes();
    return res.status(200).json(resumes);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Controller for updating an existing resume (and all attached data).
 * Expects resumeId in req.params.resumeId or req.query.resumeId,
 * and updated resume data in req.body.
 */
async function updateResume(req, res) {
  try {
    const { resumeId } = req.params; // or const { resumeId } = req.query;
    if (!resumeId) {
      return res.status(400).json({ error: 'Missing resumeId parameter' });
    }

    // If the user is logged in, use their ID; otherwise use a test ID
    const userId = req.user ? req.user.id : 'test-user-id';

    // Merge the determined userId into the request body
    const data = { ...req.body, userId };

    const updatedResume = await resumeService.updateResume(resumeId, data);
    return res.status(200).json(updatedResume);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Controller for deleting a resume by its ID.
 * Expects resumeId in req.params.resumeId or req.query.resumeId.
 */
async function deleteResume(req, res) {
  try {
    const { resumeId } = req.params; // or const { resumeId } = req.query;
    if (!resumeId) {
      return res.status(400).json({ error: 'Missing resumeId parameter' });
    }

    const deletedResume = await resumeService.deleteResume(resumeId);
    return res.status(200).json(deletedResume);
  } catch (error) {
    return res.status(500).json({ error: error.message });
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
