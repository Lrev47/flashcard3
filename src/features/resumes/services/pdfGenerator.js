import ejs from 'ejs';
import puppeteer from 'puppeteer';

/**
 * generatePDF(templatePath, data, [puppeteerOptions])
 * Renders an EJS file at `templatePath` using `data`,
 * then launches Puppeteer to turn the resulting HTML into a PDF (Buffer).
 */
export async function generatePDF(templatePath, data = {}, puppeteerOptions = {}) {
  // 1) Render EJS template into an HTML string
  // Remove `async: true` unless you need it:
  const htmlString = await ejs.renderFile(templatePath, data);

  // 2) Launch Puppeteer
  const browser = await puppeteer.launch({
    headless: 'new',
    ...puppeteerOptions.launchOptions,
  });
  const page = await browser.newPage();

  // 3) Set the page content
  await page.setContent(htmlString, { waitUntil: 'networkidle0' });

  // 4) Generate the PDF
  const pdfBuffer = await page.pdf({
    format: 'Letter',
    printBackground: true,
    ...puppeteerOptions.pdfOptions,
  });

  await browser.close();
  return pdfBuffer;
}
