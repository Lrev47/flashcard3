// src/features/resumes/controllers/pdfController.js

import path from 'path';
import { fileURLToPath } from 'url';
import { generatePDF } from '../services/pdfGenerator.js';
import resumeService from '../services/resumeService.js';
import tailoredResumeService from '../../tailoredResumes/services/tailoredResumeService.js';
import ejs from 'ejs';

// For __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Utility to pick the correct EJS template path based on templateName.
 * Adjust the filenames/folder structure as needed.
 */
function getTemplatePath(templateName) {
  // For example: "template1" -> /path/to/template1.ejs
  // Ensure your template files actually match these names.
  const templatesDir = path.join(__dirname, '../templates');
  switch (templateName) {
    case 'template1':
      return path.join(templatesDir, 'template1.ejs');
    case 'template2':
      return path.join(templatesDir, 'template2.ejs');
    case 'template3':
      return path.join(templatesDir, 'template3.ejs');
    default:
      // If you want a default, or handle an error if templateName is invalid
      return path.join(templatesDir, 'template1.ejs');
  }
}

/**
 * Fetches data from either the Resume or TailoredResume service
 * based on the type ("resume" or "tailored") and recordId.
 */
async function fetchResumeData(type, recordId) {
  if (type === 'tailored') {
    return tailoredResumeService.getTailoredResumeById(recordId);
  } else {
    // Default to regular resume
    return resumeService.getResumeById(recordId);
  }
}

/**
 * PREVIEW: Renders the chosen EJS template as HTML for a quick preview.
 * 
 * Expects:
 * - req.query.type         -> "resume" or "tailored" (defaults to "resume")
 * - req.query.templateName -> "template1", "template2", or "template3" 
 * - req.query.recordId     -> The ID of the Resume or TailoredResume
 */
export async function previewTemplate(req, res) {
  try {
    const { type = 'resume', templateName = 'template1', recordId } = req.query;

    if (!recordId) {
      return res.status(400).json({ error: 'Missing recordId parameter' });
    }

    // 1) Fetch the data from DB
    const resumeData = await fetchResumeData(type, recordId);
    if (!resumeData) {
      return res.status(404).json({ error: `No ${type} resume found with ID: ${recordId}` });
    }

    // 2) Determine which EJS file to use
    const templatePath = getTemplatePath(templateName);

    // 3) Render EJS into an HTML string
    const htmlContent = await ejs.renderFile(templatePath, { resumeData });

    // 4) Send the rendered HTML as the response (Preview)
    return res.status(200).send(htmlContent);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * DOWNLOAD: Generates a PDF from the chosen EJS template.
 * 
 * Expects:
 * - req.query.type         -> "resume" or "tailored" (defaults to "resume")
 * - req.query.templateName -> "template1", "template2", or "template3"
 * - req.query.recordId     -> The ID of the Resume or TailoredResume
 */
export async function generateResumePDF(req, res) {
  try {
    const { type = 'resume', templateName = 'template1', recordId } = req.query;

    if (!recordId) {
      return res.status(400).json({ error: 'Missing recordId parameter' });
    }

    // 1) Fetch the data from DB
    const resumeData = await fetchResumeData(type, recordId);
    if (!resumeData) {
      return res.status(404).json({ error: `No ${type} resume found with ID: ${recordId}` });
    }

    // 2) Determine which EJS file to use
    const templatePath = getTemplatePath(templateName);

    // 3) Generate PDF using pdfGenerator
    //    We pass { resumeData } as the data object for the EJS file
    const pdfBuffer = await generatePDF(templatePath, { resumeData }, {
      // Optional puppeteerOptions
      launchOptions: {
        // e.g. executablePath: '/usr/bin/chromium-browser',
      },
      pdfOptions: {
        format: 'Letter',
        printBackground: true,
        // margin: { top: '1in', bottom: '1in' },
      },
    });

    // 4) Respond with the PDF (inline or attachment)
    // Setting as an attachment download with a filename:
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${type}-resume.pdf"`);
    return res.send(pdfBuffer);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
