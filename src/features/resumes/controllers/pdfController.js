// src/features/resumes/controllers/pdfController.js

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import ejs from 'ejs';

import { generatePDF } from '../services/pdfGenerator.js';
import resumeService from '../services/resumeService.js';
import tailoredResumeService from '../services/tailoredResumeService.js';

// For __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Dynamically determine the EJS template path based on templateName.
 * If the file doesn't exist, fallback to "template1.ejs".
 */
function getTemplatePath(templateName = 'template1') {
  const templatesDir = path.join(__dirname, '../templates');
  let candidatePath = path.join(templatesDir, `${templateName}.ejs`);
  
  // Check if the template file exists; if not, fallback to template1
  if (!fs.existsSync(candidatePath)) {
    console.warn(
      `Template "${templateName}.ejs" not found. Falling back to "template1.ejs".`
    );
    candidatePath = path.join(templatesDir, 'template1.ejs');
  }
  
  return candidatePath;
}

/**
 * ================================
 *   BASE RESUME FUNCTIONS
 * ================================
 */

/**
 * 1) PREVIEW BASE RESUME: 
 * Fetch the Resume (and its relations) and render a chosen EJS template into HTML.
 *
 * Expects:
 * - req.query.recordId: the ID of the Resume
 * - req.query.templateName: name of the EJS file (without ".ejs"), e.g. "template1"
 */
export async function previewBaseResume(req, res) {
  try {
    const { recordId, templateName = 'template1' } = req.query;

    if (!recordId) {
      return res.status(400).json({ error: 'Missing recordId parameter' });
    }

    // Fetch the base resume data
    const resumeData = await resumeService.getResumeById(recordId);
    if (!resumeData) {
      return res.status(404).json({ error: `No resume found with ID: ${recordId}` });
    }

    // Determine which EJS file to use
    const templatePath = getTemplatePath(templateName);

    // Render EJS into an HTML string
    const htmlContent = await ejs.renderFile(templatePath, { resumeData });

    // Send the rendered HTML as the response (Preview in browser)
    return res.status(200).send(htmlContent);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * 2) GENERATE BASE RESUME PDF:
 * Fetch the Resume data, then generate a PDF from the chosen EJS template.
 *
 * Expects:
 * - req.query.recordId: the ID of the Resume
 * - req.query.templateName: name of the EJS file (without ".ejs")
 */
export async function generateBaseResumePDF(req, res) {
  try {
    const { recordId, templateName = 'template1' } = req.query;

    if (!recordId) {
      return res.status(400).json({ error: 'Missing recordId parameter' });
    }

    // Fetch the base resume data
    const resumeData = await resumeService.getResumeById(recordId);
    if (!resumeData) {
      return res.status(404).json({ error: `No resume found with ID: ${recordId}` });
    }

    // Determine which EJS file to use
    const templatePath = getTemplatePath(templateName);

    // Generate PDF using pdfGenerator
    const pdfBuffer = await generatePDF(
      templatePath,
      { resumeData },
      {
        launchOptions: {
          // e.g. executablePath: '/usr/bin/chromium-browser',
        },
        pdfOptions: {
          format: 'Letter',
          printBackground: true,
        },
      }
    );

    // Respond with the PDF (as attachment)
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="base-resume.pdf"');
    return res.send(pdfBuffer);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * ================================
 *   TAILORED RESUME FUNCTIONS
 * ================================
 */

/**
 * 3) PREVIEW TAILORED RESUME:
 * Fetch the TailoredResume (and its relations) and render a chosen EJS template into HTML.
 *
 * Expects:
 * - req.query.recordId: the ID of the TailoredResume
 * - req.query.templateName: name of the EJS file (without ".ejs")
 */
export async function previewTailoredResume(req, res) {
  try {
    const { recordId, templateName = 'template1' } = req.query;

    if (!recordId) {
      return res.status(400).json({ error: 'Missing recordId parameter' });
    }

    // Fetch the tailored resume data
    const tailoredData = await tailoredResumeService.getTailoredResumeById(recordId);
    if (!tailoredData) {
      return res.status(404).json({ error: `No tailored resume found with ID: ${recordId}` });
    }

    // Determine which EJS file to use
    const templatePath = getTemplatePath(templateName);

    // Render EJS into an HTML string
    const htmlContent = await ejs.renderFile(templatePath, { resumeData: tailoredData });

    // Send the rendered HTML as the response (Preview in browser)
    return res.status(200).send(htmlContent);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * 4) GENERATE TAILORED RESUME PDF:
 * Fetch the TailoredResume data, then generate a PDF from the chosen EJS template.
 *
 * Expects:
 * - req.query.recordId: the ID of the TailoredResume
 * - req.query.templateName: name of the EJS file (without ".ejs")
 */
export async function generateTailoredResumePDF(req, res) {
  try {
    const { recordId, templateName = 'template1' } = req.query;

    if (!recordId) {
      return res.status(400).json({ error: 'Missing recordId parameter' });
    }

    // Fetch the tailored resume data
    const tailoredData = await tailoredResumeService.getTailoredResumeById(recordId);
    if (!tailoredData) {
      return res.status(404).json({ error: `No tailored resume found with ID: ${recordId}` });
    }

    // Determine which EJS file to use
    const templatePath = getTemplatePath(templateName);

    // Generate PDF using pdfGenerator
    const pdfBuffer = await generatePDF(
      templatePath,
      { resumeData: tailoredData },
      {
        launchOptions: {
          // e.g. executablePath: '/usr/bin/chromium-browser',
        },
        pdfOptions: {
          format: 'Letter',
          printBackground: true,
        },
      }
    );

    // Respond with the PDF (as attachment)
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="tailored-resume.pdf"');
    return res.send(pdfBuffer);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
