import { chromium } from 'playwright';

async function testAuth() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('1. Going to login...');
  await page.goto('http://localhost:3000/login');
  await page.waitForSelector('input[name="email"], input[type="email"]');
  await page.fill('input[name="email"], input[type="email"]', 'demo.creator@mondial.local');
  await page.fill('input[name="password"], input[type="password"]', 'DemoP@ss1');
  await page.click('button[type="submit"]');
  console.log('2. Submitted login form, waiting for dashboard URL...');
  await page.waitForURL('**/dashboard/**', { timeout: 15000 });
  console.log('3. Dashboard loaded! URL:', page.url());

  console.log('4. Navigating to /dashboard/creator/asset-library...');
  await page.goto('http://localhost:3000/dashboard/creator/asset-library');
  await page.waitForTimeout(2000);
  console.log('5. Asset Library URL:', page.url());
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log('6. Body text:\n', bodyText.slice(0, 600));

  await browser.close();
}

testAuth();
