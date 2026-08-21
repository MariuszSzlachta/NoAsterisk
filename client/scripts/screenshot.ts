/* eslint-disable no-console */
/**
 * Visual screenshot tool for FE development.
 * Logs in as admin, navigates to specified page, takes a screenshot.
 *
 * Usage:
 *   npx tsx scripts/screenshot.ts /dashboard
 *   npx tsx scripts/screenshot.ts /settings output.png
 *   npx tsx scripts/screenshot.ts /transactions --width=1920 --height=1080
 *
 * Requirements:
 *   - Backend running (npm run start:pg in server/)
 *   - Frontend running (npm run dev in client/)
 *   - Playwright browsers installed (npx playwright install chromium)
 *   - ADMIN_EMAIL + ADMIN_PASSWORD in client/.env (gitignored)
 */
import 'dotenv/config';
import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5173';
const EMAIL = process.env.ADMIN_EMAIL;
const PASSWORD = process.env.ADMIN_PASSWORD;

if (!EMAIL || !PASSWORD) {
  console.error('Missing ADMIN_EMAIL or ADMIN_PASSWORD env vars.');
  console.error('Set them in client/.env or pass inline:');
  console.error('  ADMIN_EMAIL=admin@budget.local ADMIN_PASSWORD=... npx tsx scripts/screenshot.ts /dashboard');
  process.exit(1);
}
const OUTPUT_DIR = path.resolve(__dirname, '../playwright-report/screenshots');

interface Options {
  pagePath: string;
  outputFile: string;
  width: number;
  height: number;
  fullPage: boolean;
}

const parseArgs = (): Options => {
  const args = process.argv.slice(2);
  let pagePath = '/dashboard';
  let outputFile = '';
  let width = 1440;
  let height = 900;
  let fullPage = false;

  for (const arg of args) {
    if (arg.startsWith('--width=')) {
      width = Number(arg.split('=')[1]);
    } else if (arg.startsWith('--height=')) {
      height = Number(arg.split('=')[1]);
    } else if (arg === '--full') {
      fullPage = true;
    } else if (arg.startsWith('/')) {
      pagePath = arg;
    } else if (!arg.startsWith('--')) {
      outputFile = arg;
    }
  }

  if (!outputFile) {
    const name = pagePath.replace(/\//g, '-').replace(/^-/, '') || 'index';
    outputFile = path.join(OUTPUT_DIR, `${name}.png`);
  }

  return { pagePath, outputFile, width, height, fullPage };
};

const main = async (): Promise<void> => {
  const opts = parseArgs();

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: opts.width, height: opts.height },
  });
  const page = await context.newPage();

  // Navigate to login
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });

  // Fill and submit login form
  await page.fill('input[name="email"], input[type="email"]', EMAIL);
  await page.fill('input[name="password"], input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');

  // Wait for navigation away from login
  await page.waitForURL((url) => !url.pathname.includes('/login'), {
    timeout: 10000,
  });

  // Navigate to target page using SPA-friendly approach (token is in-memory, page.goto would lose it)
  if (opts.pagePath !== '/dashboard' && opts.pagePath !== '/') {
    await page.evaluate((targetPath) => {
      // React Router listens to popstate — update URL and dispatch
      window.history.pushState(null, '', targetPath);
      window.dispatchEvent(new PopStateEvent('popstate', { state: null }));
    }, opts.pagePath);
    await page.waitForTimeout(2000);
    await page.waitForLoadState('networkidle');
  } else {
    await page.waitForLoadState('networkidle');
  }

  // Small delay for animations to settle
  await page.waitForTimeout(500);

  // Ensure output directory exists
  const { mkdir } = await import('fs/promises');
  await mkdir(path.dirname(opts.outputFile), { recursive: true });

  // Take screenshot
  await page.screenshot({
    path: opts.outputFile,
    fullPage: opts.fullPage,
  });

  await browser.close();

  console.log(`✓ Screenshot saved: ${opts.outputFile}`);
  console.log(`  Page: ${opts.pagePath}`);
  console.log(`  Viewport: ${opts.width}x${opts.height}`);
};

main().catch((err: unknown) => {
  console.error('Screenshot failed:', err);
  process.exit(1);
});
