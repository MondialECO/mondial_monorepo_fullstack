import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('Logging in...');
  await page.goto('http://localhost:3000/login');
  await page.waitForSelector('input[type="email"]', { timeout: 15000 });
  await page.fill('input[type="email"]', 'demo.creator@mondial.local');
  await page.fill('input[type="password"]', 'DemoP@ss1');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard/**', { timeout: 15000 });

  console.log('Navigating to Brand Studio...');
  await page.goto('http://localhost:3000/dashboard/creator/phase-2/brand-studio');
  await page.waitForTimeout(3000);

  // Take screenshot of current studio state
  await page.screenshot({ path: 'outputs/02_brand_studio_view.png', fullPage: true });
  console.log('Brand studio view captured');

  await browser.close();
})();
