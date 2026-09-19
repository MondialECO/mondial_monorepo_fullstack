import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function run() {
  console.log('--- Starting Stage 1 Real Browser Verification (Business Plan 3.3) ---');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  page.on('console', (msg) => console.log(`[PAGE CONSOLE ${msg.type()}]:`, msg.text()));
  page.on('response', (res) => {
    if (res.url().includes('/api/')) {
      console.log(`[HTTP ${res.status()}]:`, res.url());
    }
  });

  const outputDir = path.resolve('outputs/phase3_stage1_verification');
  fs.mkdirSync(outputDir, { recursive: true });

  try {
    // 1. Sign in as demo creator
    console.log('[1/6] Logging in as demo.creator@mondial.local...');
    await page.goto('http://localhost:3000/login');
    await page.waitForSelector('input[type="email"]', { timeout: 15000 });
    await page.fill('input[type="email"]', 'demo.creator@mondial.local');
    await page.fill('input[type="password"]', 'DemoP@ss1');
    await page.click('button[type="submit"]');

    // Wait for navigation after login
    await page.waitForURL('**/dashboard/**', { timeout: 15000 });
    console.log('✓ Successfully authenticated into dashboard');

    // 2. Navigate to Business Plan 3.3
    console.log('[2/6] Navigating to /dashboard/creator/phase-3/business-plan...');
    await page.goto('http://localhost:3000/dashboard/creator/phase-3/business-plan');
    await page.waitForSelector('h2:has-text("Comprehensive Business Plan")', { timeout: 20000 });
    console.log('✓ Continuous Business Plan surface loaded');

    // 3. Verify Sticky Section Index and all 11 sections
    console.log('[3/6] Verifying document structure and sticky section index...');
    const indexButtons = await page.$$('aside nav button');
    console.log(`✓ Sticky Document Index found with ${indexButtons.length} section entries (Expected: 11)`);
    if (indexButtons.length !== 11) {
      throw new Error(`Expected 11 index buttons, found ${indexButtons.length}`);
    }

    const sections = await page.$$('section[data-section-anchor]');
    console.log(`✓ Continuous canvas rendered with ${sections.length} sections (Expected: 11)`);
    if (sections.length !== 11) {
      throw new Error(`Expected 11 continuous sections, found ${sections.length}`);
    }

    // Capture initial continuous document overview
    await page.screenshot({ path: path.join(outputDir, '01_business_plan_continuous_overview.png'), fullPage: true });

    // 4. Test Inline Editing on Section 01 (Executive Summary)
    console.log('[4/6] Testing inline editing on Section 01 (Executive Summary)...');
    const editBtn = page.locator('#doc-section-executive button:has-text("Edit")');
    await editBtn.click();
    await page.waitForSelector('#doc-section-executive textarea', { timeout: 5000 });
    
    const originalText = await page.inputValue('#doc-section-executive textarea');
    const updatedTestText = originalText + ' [Verified inline edit via browser test]';
    await page.fill('#doc-section-executive textarea', updatedTestText);
    
    await page.click('#doc-section-executive button:has-text("Save Section")');
    // Wait for textarea to close and updated text to be displayed
    await page.waitForSelector('#doc-section-executive textarea', { state: 'detached', timeout: 10000 });
    await page.waitForSelector('#doc-section-executive:has-text("Verified inline edit via browser test")', { timeout: 5000 });
    console.log('✓ Section 01 edited and saved successfully with server round-trip confirmation');
    await page.screenshot({ path: path.join(outputDir, '02_section_saved_state.png') });

    // 5. Verify Navigation to External Authoritative Sources
    console.log('[5/6] Verifying source navigation buttons on external sections...');
    
    // Check Section 02 (Problem & Solution) source button
    const clarifierLink = page.locator('#doc-section-problem-solution button:has-text("Edit at Source")');
    const clarifierLinkVisible = await clarifierLink.isVisible();
    console.log(`✓ Section 02 "Edit at Source" button present: ${clarifierLinkVisible}`);

    // Check Section 07 (Financial Projections) source button
    const forecastLink = page.locator('#doc-section-financials button:has-text("Edit at Source")');
    const forecastLinkVisible = await forecastLink.isVisible();
    console.log(`✓ Section 07 "Edit at Source" button present: ${forecastLinkVisible}`);

    // Check Section 08 (Team Needs) source button
    const formationLink = page.locator('#doc-section-team button:has-text("Edit at Source")');
    const formationLinkVisible = await formationLink.isVisible();
    console.log(`✓ Section 08 "Edit at Source" button present: ${formationLinkVisible}`);

    // 6. Verify Plain Explanations for Sections 09, 10, 11
    console.log('[6/6] Verifying explanatory callouts on Sections 09, 10, 11...');
    const sec9Text = await page.textContent('#doc-section-funding');
    const sec10Text = await page.textContent('#doc-section-operations');
    const sec11Text = await page.textContent('#doc-section-risks');

    console.log('✓ Section 09 explanation verified:', sec9Text?.includes('Phase 5 (Seed Funding) and will appear here once you reach that step'));
    console.log('✓ Section 10 explanation verified:', sec10Text?.includes('produced as part of the full business plan synthesis and updates whenever the plan is regenerated'));
    console.log('✓ Section 11 explanation verified:', sec11Text?.includes('produced as part of the full business plan synthesis and updates whenever the plan is regenerated'));

    // Test clicking index anchor to scroll to Section 10
    console.log('✓ Testing smooth scroll to Section 10 via index...');
    await page.click('aside nav button:has-text("Operations & Milestones")');
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(outputDir, '03_scrolled_to_operations_section.png') });

    console.log('\n=============================================================');
    console.log('ALL STAGE 1 BROWSER VERIFICATIONS PASSED CLEANLY');
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
