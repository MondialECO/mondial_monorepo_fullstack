import { chromium } from 'playwright';
import path from 'path';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:3000/profile/sirajul9550gmail-com...');
  await page.goto('http://localhost:3000/profile/sirajul9550gmail-com', { waitUntil: 'domcontentloaded', timeout: 45000 });

  // Wait for profile content to render
  await page.waitForSelector('text=Sirajul SD', { timeout: 15000 });

  const textContent = await page.content();

  const results = {
    nameRendered: textContent.includes('Sirajul SD'),
    headlineRendered: textContent.includes('WordPress Developer | Logo Designer | Business Services'),
    skillsFound: ['WordPress', 'Brand Identity', 'Business Consulting', 'Business Documentation', 'Business Plans']
      .filter(s => textContent.includes(s)),
    fiverrExpRendered: textContent.includes('Fiverr') || textContent.includes('Freelancer'),
    dhakaEduRendered: textContent.includes('Dhaka University') || textContent.includes('B.Sc in CSE'),
    bioRendered: textContent.includes('helping businesses, entrepreneurs, startups'),
  };

  console.log('Verification Results:', JSON.stringify(results, null, 2));

  const screenshotPath = 'sp_profile_rendered.png';
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log('Screenshot saved to', screenshotPath);

  await browser.close();
}

main().catch(err => {
  console.error('Error during verification:', err);
  process.exit(1);
});
