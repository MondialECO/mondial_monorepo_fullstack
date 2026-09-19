import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const outputDir = 'C:/Users/Siraj/.gemini/antigravity-ide/brain/9fc77a08-b62b-4622-b07d-0d97b1df77d7/outputs';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function capture() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  console.log('Navigating to brand studio...');
  try {
    await page.goto('http://localhost:3000/dashboard/creator/phase-2/brand-studio', {
      waitUntil: 'networkidle',
      timeout: 15000,
    });
    await page.waitForTimeout(1000);

    // Click on Direction in top bar or trigger direction modal
    const directionStepBtn = page.locator('button:has-text("Direction")').first();
    if (await directionStepBtn.isVisible()) {
      await directionStepBtn.click();
      await page.waitForTimeout(1000);
    }

    await page.screenshot({
      path: path.join(outputDir, '02_live_direction_modal_figma_node_57012_9066.png'),
      fullPage: false,
    });
    console.log('Captured 02_live_direction_modal_figma_node_57012_9066.png');
  } catch (err) {
    console.error('Capture error:', err.message);
  } finally {
    await browser.close();
  }
}

capture();
