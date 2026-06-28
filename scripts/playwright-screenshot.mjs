#!/usr/bin/env node
/**
 * Playwright Screenshot Tool for Visual Verification
 *
 * Usage:
 *   node scripts/playwright-screenshot.mjs <path> [options]
 *
 * Examples:
 *   node scripts/playwright-screenshot.mjs /dashboard
 *   node scripts/playwright-screenshot.mjs /dashboard --name kpi-section
 *   node scripts/playwright-screenshot.mjs /import --viewport 1440x900
 *   node scripts/playwright-screenshot.mjs /dashboard --dark --light
 *   node scripts/playwright-screenshot.mjs /dashboard --selector ".kpi-grid"
 *   node scripts/playwright-screenshot.mjs /dashboard --full-page
 *   node scripts/playwright-screenshot.mjs /dashboard --wait 2000
 *
 * Options:
 *   --name <name>        Screenshot filename (default: derived from path)
 *   --viewport <WxH>     Viewport size (default: 1280x720)
 *   --wait <ms>          Wait after load (default: 500)
 *   --selector <css>     Screenshot specific element only
 *   --full-page          Capture full scrollable page
 *   --dark               Take dark mode screenshot (default)
 *   --light              Take light mode screenshot
 *   --base-url <url>     Base URL (default: http://localhost:5173)
 *   --no-headless        Show browser (debug)
 */

import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help') {
  console.log(`
Usage: node scripts/playwright-screenshot.mjs <path> [options]

  <path>               URL path to screenshot (e.g., /dashboard)
  --name <name>        Screenshot filename (default: derived from path)
  --viewport <WxH>     Viewport size (default: 1280x720)
  --wait <ms>          Wait after load (default: 500)
  --selector <css>     Screenshot specific element only
  --full-page          Capture full scrollable page
  --dark               Take dark mode screenshot (default)
  --light              Take light mode screenshot
  --base-url <url>     Base URL (default: http://localhost:5173)
  --no-headless        Show browser (debug)
`);
  process.exit(0);
}

// Parse arguments
const urlPath = args[0].startsWith('/') ? args[0] : `/${args[0]}`;

const getArg = (flag) => {
  const idx = args.indexOf(flag);
  return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : undefined;
};
const hasFlag = (flag) => args.includes(flag);

const name = getArg('--name') || urlPath.replace(/\//g, '-').replace(/^-/, '') || 'page';
const viewportStr = getArg('--viewport') || '1280x720';
const [width, height] = viewportStr.split('x').map(Number);
const waitMs = parseInt(getArg('--wait') || '500', 10);
const selector = getArg('--selector');
const fullPage = hasFlag('--full-page');
const baseUrl = getArg('--base-url') || 'http://localhost:5173';
const headless = !hasFlag('--no-headless');

// Determine which themes to capture
const wantDark = hasFlag('--dark');
const wantLight = hasFlag('--light');
const themes = [];
if (wantDark) themes.push('dark');
if (wantLight) themes.push('light');
if (themes.length === 0) themes.push('dark'); // default

// Ensure output directory
const outDir = resolve(process.cwd(), 'temp/screenshots');
mkdirSync(outDir, { recursive: true });

async function takeScreenshot() {
  const browser = await chromium.launch({ headless });
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();

  const url = `${baseUrl}${urlPath}`;
  console.log(`→ Navigating to ${url}`);

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
  } catch (e) {
    // Fallback: try domcontentloaded if networkidle times out
    console.warn(`  networkidle timed out, falling back to domcontentloaded`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
  }

  if (waitMs > 0) {
    await page.waitForTimeout(waitMs);
  }

  const results = [];

  for (const theme of themes) {
    // Set theme class on <html>
    await page.evaluate((t) => {
      document.documentElement.classList.remove('dark', 'light');
      document.documentElement.classList.add(t);
    }, theme);

    // Brief wait for CSS variables to apply
    await page.waitForTimeout(100);

    const suffix = themes.length > 1 ? `-${theme}` : '';
    const filename = `${name}${suffix}.png`;
    const filepath = join(outDir, filename);

    if (selector) {
      const element = await page.$(selector);
      if (!element) {
        console.error(`  ✗ Selector "${selector}" not found on page`);
        continue;
      }
      await element.screenshot({ path: filepath });
    } else {
      await page.screenshot({ path: filepath, fullPage });
    }

    console.log(`  ✓ ${filepath}`);
    results.push(filepath);
  }

  await browser.close();

  if (results.length === 0) {
    console.error('\n✗ No screenshots captured');
    process.exit(1);
  }

  console.log(`\n✓ Done. ${results.length} screenshot(s) saved to temp/screenshots/`);
  console.log('  To verify: read the image file(s) above');
}

takeScreenshot().catch((err) => {
  console.error(`\n✗ Screenshot failed: ${err.message}`);
  console.error('  Is the dev server running? Try: cd client && npx vite &');
  process.exit(1);
});
