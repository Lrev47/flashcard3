// src/features/flashCards/services/pdfGenerator.js
import ejs from 'ejs';
import path from 'path';
import puppeteer from 'puppeteer';

/**
 * generatePDF(templatePath, data, [puppeteerOptions])
 * Renders an EJS file at `templatePath` using `data`, then launches Puppeteer
 * to turn the resulting HTML into a PDF (Buffer).
 */
export async function generatePDF(templatePath, data = {}, puppeteerOptions = {}) {
  // 1) Render EJS template into an HTML string
  const htmlString = await ejs.renderFile(templatePath, data, { async: true });

  // 2) Launch Puppeteer
  const browser = await puppeteer.launch({
    headless: 'new', 
    // or { headless: true } if you want a truly headless environment
    ...puppeteerOptions.launchOptions,
  });
  const page = await browser.newPage();

  // 3) Set the page content
  await page.setContent(htmlString, { waitUntil: 'networkidle0' });

  // 4) Generate the PDF
  const pdfBuffer = await page.pdf({
    format: 'Letter',       // or 'A4' or whatever you want
    printBackground: true,  // ensures CSS backgrounds are printed
    ...puppeteerOptions.pdfOptions,
  });

  await browser.close();
  return pdfBuffer;
}
