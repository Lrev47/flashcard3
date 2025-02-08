// src/features/resumes/routes/resumeRoutes.js

import express from 'express';
import resumeController from '../controllers/resumeController.js';
import jobPostingController from '../../jobPostings/controllers/jobPostingController.js';
import tailoredResumeController from '../../tailoredResumes/controllers/tailoredResumeController.js';

const router = express.Router();

/* ----------------- Resume Routes ----------------- */

// Create a new resume
router.post('/', resumeController.createResume);

// Get all resumes
router.get('/', resumeController.getAllResumes);

// Get a specific resume by its ID
router.get('/:resumeId', resumeController.getResumeById);

// Update a resume by its ID
router.put('/:resumeId', resumeController.updateResume);

// Delete a resume by its ID
router.delete('/:resumeId', resumeController.deleteResume);

// Get all resumes for a specific user
router.get('/user/:userId', resumeController.getResumesByUserId);

/* ----------------- Job Posting Routes ----------------- */

// Create a new job posting
router.post('/job-postings', jobPostingController.createJobPosting);

// Get all job postings
router.get('/job-postings', jobPostingController.getAllJobPostings);

// Get a specific job posting by ID
router.get('/job-postings/:jobPostingId', jobPostingController.getJobPostingById);

// Update a job posting by its ID
router.put('/job-postings/:jobPostingId', jobPostingController.updateJobPosting);

// Delete a job posting by its ID
router.delete('/job-postings/:jobPostingId', jobPostingController.deleteJobPosting);

// Get all job postings for a specific user
router.get('/job-postings/user/:userId', jobPostingController.getJobPostingsByUserId);

/* ----------------- Tailored Resume Routes ----------------- */

// Create a new tailored resume
router.post('/tailored-resumes', tailoredResumeController.createTailoredResume);

// Get all tailored resumes
router.get('/tailored-resumes', tailoredResumeController.getAllTailoredResumes);

// Get a specific tailored resume by ID
router.get('/tailored-resumes/:tailoredResumeId', tailoredResumeController.getTailoredResumeById);

// Update a tailored resume by ID
router.put('/tailored-resumes/:tailoredResumeId', tailoredResumeController.updateTailoredResume);

// Delete a tailored resume by ID
router.delete('/tailored-resumes/:tailoredResumeId', tailoredResumeController.deleteTailoredResume);

// Get all tailored resumes by user
router.get('/tailored-resumes/user/:userId', tailoredResumeController.getTailoredResumesByUserId);

// Get all tailored resumes by job posting
router.get(
  '/tailored-resumes/job-postings/:jobPostingId',
  tailoredResumeController.getTailoredResumesByJobPostingId
);

// Get all tailored resumes by user and job posting
router.get(
  '/tailored-resumes/user/:userId/job-postings/:jobPostingId',
  tailoredResumeController.getTailoredResumesByUserIdAndJobPostingId
);

export default router;
