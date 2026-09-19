import { chromium } from 'playwright';

async function fetchRealKit() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('http://localhost:3000/login');
  await page.waitForSelector('input[name="email"], input[type="email"]');
  await page.fill('input[name="email"], input[type="email"]', 'demo.creator@mondial.local');
  await page.fill('input[name="password"], input[type="password"]', 'DemoP@ss1');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard/**', { timeout: 15000 });

  // Get active journey and activeIdeaId
  const journeyData = await page.evaluate(async () => {
    const res = await fetch('/api/creator/journey');
    return res.json();
  });
  console.log('Journey Active Idea ID:', journeyData.data?.journey?.activeIdeaId);

  // Fetch brand kit with and without activeIdeaId
  const kitData = await page.evaluate(async (ideaId) => {
    const url = ideaId 
      ? `/api/creator/journey/phase2/brand-kit?ideaId=${encodeURIComponent(ideaId)}`
      : '/api/creator/journey/phase2/brand-kit';
    const res = await fetch(url);
    const json = await res.json();
    return { status: res.status, ok: res.ok, json };
  }, journeyData.data?.journey?.activeIdeaId);

  console.log('Brand Kit fetch status:', kitData.status, kitData.ok);
  console.log('Brand Kit Data:\n', JSON.stringify(kitData.json, null, 2));

  await browser.close();
}

fetchRealKit().catch(console.error);
