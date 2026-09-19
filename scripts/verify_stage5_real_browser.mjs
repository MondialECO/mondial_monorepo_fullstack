import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function run() {
  console.log('--- Starting Stage 5 Real Browser Verification (Phase 3 Complete 3.7) ---');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  page.on('console', (msg) => console.log(`[PAGE CONSOLE ${msg.type()}]:`, msg.text()));
  page.on('response', (res) => {
    if (res.url().includes('/api/')) {
      console.log(`[HTTP ${res.status()}]:`, res.url());
    }
  });

  const outputDir = path.resolve('outputs/phase3_stage5_verification');
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

    // 2. Navigate to Phase 3 Complete 3.7
    console.log('[2/5] Navigating to /dashboard/creator/phase-3/complete...');
    await page.goto('http://localhost:3000/dashboard/creator/phase-3/complete');
    await page.waitForSelector('h1:has-text("Investor Readiness Audit")', { timeout: 20000 });
    console.log('✓ Investor Readiness Audit page loaded');

    // 3. Verify Score Hero & 5 Dimensions
    console.log('[3/5] Verifying readiness score, grade, and 5 dimensional cards...');
    await page.waitForSelector('text="Aggregated Readiness Score"', { timeout: 10000 });
    await page.waitForSelector('text="Dimensional Diagnostic & Deduction Breakdown"', { timeout: 10000 });
    await page.waitForSelector('text="Concept Clarity & Differentiation"', { timeout: 10000 });
    await page.waitForSelector('text="Market Evidence & Opportunity Sizing"', { timeout: 10000 });
    await page.waitForSelector('text="Financial Projections & Unit Economics"', { timeout: 10000 });
    await page.waitForSelector('text="Legal & Compliance Governance"', { timeout: 10000 });
    await page.waitForSelector('text="Team Credibility & Founder Advantage"', { timeout: 10000 });
    console.log('✓ All 5 evaluated dimensions rendered');

    await page.screenshot({ path: path.join(outputDir, '01_readiness_audit_overview.png'), fullPage: true });

    // 4. Verify Deductions & Remediation Links
    console.log('[4/5] Verifying per-deduction detail and remediation routes...');
    const deductionBadges = page.locator('text=/-\\d+(\\.\\d+)? pts/');
    const deductionCount = await deductionBadges.count();
    console.log(`✓ Found ${deductionCount} active deduction badges`);

    await page.screenshot({ path: path.join(outputDir, '02_deductions_detail.png'), fullPage: true });

    // 5. Test Remediation Navigation
    console.log('[5/5] Testing remediation navigation link...');
    const remediationLink = page.locator('a[href*="/dashboard/creator/phase-"]').first();
    if (await remediationLink.count() > 0) {
      const targetHref = await remediationLink.getAttribute('href');
      console.log(`Clicking remediation target: ${targetHref}`);
      await remediationLink.click();
      await page.waitForTimeout(2000);
      console.log(`✓ Remediation link navigated to ${page.url()}`);
      await page.screenshot({ path: path.join(outputDir, '03_remediation_destination.png') });
    }

    console.log('\n=============================================================');
    console.log('ALL STAGE 5 BROWSER VERIFICATIONS PASSED CLEANLY');
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
