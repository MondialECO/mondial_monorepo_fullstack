import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('Logging in as demo creator...');
  await page.goto('http://localhost:3000/login');
  await page.waitForSelector('input[type="email"]', { timeout: 15000 });
  await page.fill('input[type="email"]', 'demo.creator@mondial.local');
  await page.fill('input[type="password"]', 'DemoP@ss1');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard/**', { timeout: 15000 });

  // 1. Verify Concept Name page
  console.log('1. Navigating to concept-name...');
  await page.goto('http://localhost:3000/dashboard/creator/phase-2/concept-name');
  await page.waitForTimeout(2000);
  const sublineText = await page.locator('text=5 name ideas generated from your concept description').textContent();
  const headingText = await page.locator('text=SUGGESTED NAMES').textContent();
  console.log('✓ Concept Name Subline:', sublineText);
  console.log('✓ Concept Name Section Heading:', headingText);
  await page.screenshot({ path: 'outputs/01_concept_name_honest_labels.png', fullPage: true });

  // 2. Verify Formation page (Step 3.6)
  console.log('2. Navigating to formation generator...');
  await page.goto('http://localhost:3000/dashboard/creator/phase-3/formation');
  await page.waitForTimeout(2000);
  const recHeader = await page.locator('h3:has-text("Recommendation Engine Inputs & Reasoning")').textContent();
  console.log('✓ Formation Recommendation Header:', recHeader);
  await page.screenshot({ path: 'outputs/02_formation_honest_labels.png', fullPage: true });

  // 3. Verify Compliance page (Step 3.5)
  console.log('3. Navigating to legal compliance...');
  await page.goto('http://localhost:3000/dashboard/creator/phase-3/compliance');
  await page.waitForTimeout(2000);
  const templateBadge = await page.locator('text=Standard Template').first().textContent();
  console.log('✓ Compliance Template Badge:', templateBadge);
  await page.screenshot({ path: 'outputs/03_compliance_honest_labels.png', fullPage: true });

  await browser.close();
  console.log('All real browser verifications passed cleanly!');
})();
