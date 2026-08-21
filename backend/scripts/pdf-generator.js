import puppeteer from 'puppeteer';
import { createRequire } from 'module';
import { existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const require = createRequire(import.meta.url);
const minimist = require('minimist');
const args = minimist(process.argv.slice(2));

if (!args.input || !args.output) {
    console.error('Error: --input and --output arguments are required.');
    process.exit(1);
}

// Find Chrome executable
function findChrome() {
    const candidates = [
        join(homedir(), '.cache/puppeteer/chrome/win64-152.0.7977.42/chrome-win64/chrome.exe'),
        join(homedir(), '.cache/puppeteer/chrome/win64-131.0.6778.264/chrome-win64/chrome.exe'),
        'C:/Program Files/Google/Chrome/Application/chrome.exe',
        'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    ];
    for (const p of candidates) {
        if (existsSync(p)) return p;
    }
    return null;
}

(async () => {
    let browser;
    try {
        const chromePath = findChrome();
        const launchOptions = {
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
            headless: true,
        };
        if (chromePath) {
            launchOptions.executablePath = chromePath;
            console.log('Using Chrome:', chromePath);
        }

        browser = await puppeteer.launch(launchOptions);
        const page = await browser.newPage();

        await page.goto(`file:///${args.input.replace(/\\/g, '/')}`, { waitUntil: 'networkidle0', timeout: 30000 });

        await page.pdf({
            path: args.output,
            format: 'A4',
            printBackground: true,
            margin: { top: '15mm', bottom: '15mm', left: '12mm', right: '12mm' },
        });

        console.log('PDF generated: ' + args.output);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    } finally {
        if (browser) await browser.close();
    }
})();
