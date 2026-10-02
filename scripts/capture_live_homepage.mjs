import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/Siraj/.gemini/antigravity-ide/brain/31c0fc5a-846e-481d-a72f-a262941defc2';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2
  });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:3000 ...');
  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 15000 });
  } catch (e) {
    console.log('Network idle timeout, proceeding with current state');
  }

  // Take full page screenshot
  const fullScreenshotPath = path.join(ARTIFACT_DIR, 'live_rendered_homepage.png');
  await page.screenshot({ path: fullScreenshotPath, fullPage: true });
  console.log('✓ Saved live full-page screenshot to:', fullScreenshotPath);

  await browser.close();
}

main().catch(console.error);
