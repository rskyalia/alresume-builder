/**
 * PDF Generator Script
 *
 * Converts an HTML file to PDF using Puppeteer (headless Chrome).
 * Called as a Node.js subprocess by Laravel's PDFService.
 *
 * Usage:
 *   node scripts/pdf-generator.js --input=/path/to/file.html --output=/path/to/output.pdf
 *
 * Arguments:
 *   --input   Absolute path to the input HTML file (file:// protocol will be used)
 *   --output  Absolute path where the output PDF will be written
 */

import puppeteer from 'puppeteer';
import { createRequire } from 'module';

// Use createRequire to load minimist (CommonJS module) in ESM context
const require = createRequire(import.meta.url);
const minimist = require('minimist');

const args = minimist(process.argv.slice(2));

if (!args.input || !args.output) {
    console.error('Error: --input and --output arguments are required.');
    console.error('Usage: node scripts/pdf-generator.js --input=/path/to/file.html --output=/path/to/output.pdf');
    process.exit(1);
}

(async () => {
    let browser;
    try {
        browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'], // Required for Railway/Docker environments
        });

        const page = await browser.newPage();

        // Use file:// protocol to load local HTML file
        await page.goto(`file://${args.input}`, { waitUntil: 'networkidle0' });

        await page.pdf({
            path: args.output,
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20mm',
                bottom: '20mm',
                left: '15mm',
                right: '15mm',
            },
        });

        console.log(`PDF generated successfully: ${args.output}`);
    } catch (error) {
        console.error('Error generating PDF:', error.message);
        process.exit(1);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
})();
