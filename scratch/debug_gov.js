const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('http://localhost:3000/login');
  await page.fill('input[type="email"]', 'demo.superadmin@mondial.local');
  await page.fill('input[type="password"]', 'DemoP@ss1');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard/**', { timeout: 10000 });

  await page.goto('http://localhost:3000/dashboard/admin/governance', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const text = await page.innerText('body');
  console.log('Body text sample:');
  console.log(text.slice(0, 400));

  await browser.close();
})().catch(console.error);
