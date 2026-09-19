import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = 'C:/Users/Siraj/.gemini/antigravity-ide/brain/9fc77a08-b62b-4622-b07d-0d97b1df77d7/outputs';
const APP_BASE = 'http://localhost:3000';

async function captureCroppedScreenshots() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // 1. STATE 1: Role Not Selected
  await page.route('**/api/onboarding/status', async (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          phase: 0,
          role: "",
          phone: "+33612345678",
          email: "test.roleless@mondial-test.eco",
          items: {
            identity: { key: "identity", verified: true, required: true },
            phone: { key: "phone", verified: true, required: true },
            email: { key: "email", verified: true, required: true }
          }
        }
      })
    });
  });

  await page.goto(`${APP_BASE}/login`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    localStorage.setItem('token', 'fake-jwt');
    localStorage.setItem('user', JSON.stringify({ email: 'test.roleless@mondial-test.eco', role: '' }));
    document.cookie = 'token=fake-jwt; path=/;';
  });

  await page.goto(`${APP_BASE}/dashboard/creator/phase-1`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('text=Phase 1: Profile Verification', { timeout: 10000 });
  await page.waitForTimeout(1000);

  const grid1 = page.locator('div.grid.grid-cols-1.sm\\:grid-cols-2').first();
  const file1 = path.join(OUTPUT_DIR, '02_phase1_role_not_selected_step1.png');
  await grid1.screenshot({ path: file1 });
  console.log(`Saved ${file1}`);

  // 2. STATE 2: Role Selected (Creator)
  await page.unroute('**/api/onboarding/status');
  await page.route('**/api/onboarding/status', async (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          phase: 0,
          role: "Creator",
          phone: "+33612345678",
          email: "test.creator@mondial-test.eco",
          items: {
            identity: { key: "identity", verified: true, required: true },
            phone: { key: "phone", verified: true, required: true },
            email: { key: "email", verified: true, required: true }
          }
        }
      })
    });
  });

  await page.goto(`${APP_BASE}/dashboard/creator/phase-1`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('text=Phase 1: Profile Verification', { timeout: 10000 });
  await page.waitForTimeout(1000);

  const grid2 = page.locator('div.grid.grid-cols-1.sm\\:grid-cols-2').first();
  const file2 = path.join(OUTPUT_DIR, '04_phase1_role_selected_step1.png');
  await grid2.screenshot({ path: file2 });
  console.log(`Saved ${file2}`);

  await browser.close();
}

captureCroppedScreenshots().catch(console.error);
