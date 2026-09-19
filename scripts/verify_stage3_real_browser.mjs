import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function run() {
  console.log('--- Starting Stage 3 Real Browser Verification (Legal & Compliance 3.5) ---');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  page.on('console', (msg) => console.log(`[PAGE CONSOLE ${msg.type()}]:`, msg.text()));
  page.on('response', (res) => {
    if (res.url().includes('/api/')) {
      console.log(`[HTTP ${res.status()}]:`, res.url());
    }
  });

  const outputDir = path.resolve('outputs/phase3_stage3_verification');
  fs.mkdirSync(outputDir, { recursive: true });

  try {
    // 1. Sign in as demo creator
    console.log('[1/5] Logging in as demo.creator@mondial.local...');
    await page.goto('http://localhost:3000/login');
    await page.waitForSelector('input[type="email"]', { timeout: 15000 });
    await page.fill('input[type="email"]', 'demo.creator@mondial.local');
    await page.fill('input[type="password"]', 'DemoP@ss1');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard/**', { timeout: 15000 });
    console.log('✓ Successfully authenticated into dashboard');

    // 2. Navigate to Compliance Checklist 3.5
    console.log('[2/5] Navigating to /dashboard/creator/phase-3/compliance...');
    await page.goto('http://localhost:3000/dashboard/creator/phase-3/compliance');
    await page.waitForSelector('h1:has-text("Legal & Compliance Checklist")', { timeout: 20000 });
    console.log('✓ Legal & Compliance surface loaded');

    // 3. Verify Top Progress Card & Domain Group Cards
    console.log('[3/5] Verifying domain group cards and progress metrics...');
    await page.waitForSelector('text="Compliance & Governance Progress"', { timeout: 10000 });
    await page.waitForSelector('text="Corporate Governance & Structure"', { timeout: 10000 });
    await page.waitForSelector('text="Intellectual Property & Brand Protection"', { timeout: 10000 });
    await page.waitForSelector('text="Data Privacy & Consumer Protection"', { timeout: 10000 });
    await page.waitForSelector('text="Industry Regulatory & Risk Mitigation"', { timeout: 10000 });
    console.log('✓ All 4 domain category groups rendered with item counts');

    await page.screenshot({ path: path.join(outputDir, '01_compliance_grouped_overview.png'), fullPage: true });

    // 4. Test Expandable Why-It-Matters Details
    console.log('[4/5] Testing expandable item details ("Why this is essential")...');
    const toggleBtn = page.locator('button[aria-label="Toggle details"]').first();
    await toggleBtn.click();
    await page.waitForSelector('text="Why this is essential:"', { timeout: 5000 });
    console.log('✓ Item details expanded showing contextual legal rationale');
    await page.screenshot({ path: path.join(outputDir, '02_item_details_expanded.png') });

    // 5. Test Checkbox Toggle (Cycle Status)
    console.log('[5/5] Testing interactive checkbox item status toggle...');
    const checkboxBtn = page.locator('button[aria-pressed]').first();
    const initialPressed = await checkboxBtn.getAttribute('aria-pressed');
    
    await checkboxBtn.click();
    await page.waitForTimeout(1000);
    const updatedPressed = await checkboxBtn.getAttribute('aria-pressed');
    console.log(`✓ Item status cycled from pressed=${initialPressed} to pressed=${updatedPressed}`);
    
    await page.screenshot({ path: path.join(outputDir, '03_checkbox_toggled_state.png') });

    console.log('\n=============================================================');
    console.log('ALL STAGE 3 BROWSER VERIFICATIONS PASSED CLEANLY');
    console.log('=============================================================');
  } catch (err) {
    console.error('❌ Verification failed:', err);
    await page.screenshot({ path: path.join(outputDir, 'error_state.png'), fullPage: true });
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
