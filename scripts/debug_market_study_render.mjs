import { chromium } from '@playwright/test';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto('http://localhost:3000/login');
  await page.fill('input[type="email"]', 'demo.creator@mondial.local');
  await page.fill('input[type="password"]', 'DemoP@ss1');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard/**', { timeout: 15000 });

  await page.goto('http://localhost:3000/dashboard/creator/phase-3/market-study');
  await page.waitForTimeout(3000);

  const html = await page.content();
  console.log('--- Page Title & H1s ---');
  const h1s = await page.$$eval('h1', els => els.map(e => e.innerText));
  console.log('H1 elements:', h1s);

  const h2s = await page.$$eval('h2, h3', els => els.map(e => e.innerText));
  console.log('H2/H3 elements:', h2s);

  console.log('URL:', page.url());
  await page.screenshot({ path: 'outputs/debug_market_study.png', fullPage: true });
  await browser.close();
}

run().catch(console.error);
