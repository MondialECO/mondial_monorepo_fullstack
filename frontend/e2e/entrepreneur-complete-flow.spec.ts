import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const ENTREPRENEUR_URL = `${BASE_URL}/dashboard/entrepreneur`;

// Performance tracking
interface PageMetrics {
  name: string;
  url: string;
  loadTime: number;
  firstContentfulPaint?: number;
  domContentLoaded?: number;
  navigationTime?: number;
}

const metrics: PageMetrics[] = [];

async function trackPageMetrics(page: any, name: string, url: string) {
  const navigationTiming = await page.evaluate(() => {
    const timing = performance.getEntriesByType('navigation')[0] as any;
    return {
      navigationStart: timing.navigationStart,
      domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
      loadComplete: timing.loadEventEnd - timing.navigationStart,
    };
  });

  const paintEntries = await page.evaluate(() => {
    const paints = performance.getEntriesByType('paint');
    return {
      fcp: paints.find((p: any) => p.name === 'first-contentful-paint')?.startTime || 0,
    };
  });

  metrics.push({
    name,
    url,
    loadTime: navigationTiming.loadComplete,
    firstContentfulPaint: paintEntries.fcp,
    domContentLoaded: navigationTiming.domContentLoaded,
    navigationTime: navigationTiming.loadComplete,
  });
}

test.describe('🚀 Entrepreneur Complete Flow - Phase 2 & Phase 3', () => {
  test.beforeEach(async ({ page }) => {
    // Reset state
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  // ============================================================================
  // PHASE 2: COMPANY VERIFICATION
  // ============================================================================

  test('✅ PHASE 2 STEP 1: Navigate to Legal Identity form', async ({ page }) => {
    const testName = 'Phase 2 Step 1 - Legal Identity';
    const testUrl = `${ENTREPRENEUR_URL}/phase-2/step-1`;

    const startTime = Date.now();
    await page.goto(testUrl);
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    // Verify page elements
    await expect(page.locator('text=Legal Identity')).toBeVisible();
    await expect(page.locator('input[name="companyName"]')).toBeVisible();
    await expect(page.locator('button:has-text("Next: Document Upload")')).toBeVisible();

    metrics.push({
      name: testName,
      url: testUrl,
      loadTime,
      navigationTime: loadTime,
    });

    console.log(`✅ ${testName}: ${loadTime}ms`);
  });

  test('✅ PHASE 2 STEP 1: Fill and submit Legal Identity form', async ({ page }) => {
    await page.goto(`${ENTREPRENEUR_URL}/phase-2/step-1`);
    await page.waitForLoadState('networkidle');

    // Fill form
    const startTime = Date.now();
    await page.fill('input[name="companyName"]', 'TechCorp Global Inc');
    await page.fill('input[name="registrationNumber"]', '123-456-789-012');
    await page.selectOption('select[name="legalForm"]', 'SAS / SASU');
    await page.fill('input[name="incorporationDate"]', '2022-03-15');
    await page.selectOption('select[name="countryOfRegistration"]', 'France');
    await page.fill('textarea[name="registeredAddress"]', '123 Tech Street, Paris, 75001 France');
    await page.fill('input[name="industryCode"]', '62.01Z');

    // Click Next
    await page.click('button:has-text("Next: Document Upload")');
    await page.waitForURL(`${ENTREPRENEUR_URL}/phase-2/step-2`);
    const formTime = Date.now() - startTime;

    metrics.push({
      name: 'Phase 2 Step 1 - Form Submission',
      url: `${ENTREPRENEUR_URL}/phase-2/step-1`,
      loadTime: formTime,
      navigationTime: formTime,
    });

    console.log(`✅ Phase 2 Step 1 Form: ${formTime}ms`);

    // Verify we're on step 2
    await expect(page.locator('text=Required Documentation')).toBeVisible();
  });

  test('✅ PHASE 2 STEP 2: Navigate to Document Upload page', async ({ page }) => {
    const testName = 'Phase 2 Step 2 - Document Upload';
    const testUrl = `${ENTREPRENEUR_URL}/phase-2/step-2`;

    const startTime = Date.now();
    await page.goto(testUrl);
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    // Verify page elements
    await expect(page.locator('text=Required Documentation')).toBeVisible();
    await expect(page.locator('text=KBIS (Company Registry)')).toBeVisible();
    await expect(page.locator('button:has-text("Upload")')).toBeVisible();

    metrics.push({
      name: testName,
      url: testUrl,
      loadTime,
      navigationTime: loadTime,
    });

    console.log(`✅ ${testName}: ${loadTime}ms`);
  });

  test('✅ PHASE 2 STEP 2: Upload documents and proceed to Step 3', async ({ page }) => {
    // Setup: Complete Step 1 first
    await page.goto(`${ENTREPRENEUR_URL}/phase-2/step-1`);
    await page.waitForLoadState('networkidle');

    await page.fill('input[name="companyName"]', 'DocTest Corp');
    await page.fill('input[name="registrationNumber"]', '111-222-333');
    await page.selectOption('select[name="legalForm"]', 'SARL / EURL');
    await page.fill('input[name="incorporationDate"]', '2023-06-20');
    await page.selectOption('select[name="countryOfRegistration"]', 'France');
    await page.fill('textarea[name="registeredAddress"]', '456 Doc Street, Lyon, 69000 France');
    await page.fill('input[name="industryCode"]', '72.19Z');

    await page.click('button:has-text("Next: Document Upload")');
    await page.waitForURL(`${ENTREPRENEUR_URL}/phase-2/step-2`);

    // Now upload documents
    const startTime = Date.now();
    const uploadButtons = await page.locator('button:has-text("Upload")').all();

    for (const button of uploadButtons) {
      await button.click();
    }

    // Verify all uploaded
    await expect(page.locator('text=✓ Uploaded')).toHaveCount(4);

    // Click Next
    await page.click('button:has-text("Next: Ownership & KYC")');
    await page.waitForURL(`${ENTREPRENEUR_URL}/phase-2/step-3`);
    const uploadTime = Date.now() - startTime;

    metrics.push({
      name: 'Phase 2 Step 2 - Document Upload & Submit',
      url: `${ENTREPRENEUR_URL}/phase-2/step-2`,
      loadTime: uploadTime,
      navigationTime: uploadTime,
    });

    console.log(`✅ Phase 2 Step 2 Upload: ${uploadTime}ms`);

    // Verify we're on step 3
    await expect(page.locator('text=Ownership & KYC')).toBeVisible();
  });

  test('✅ PHASE 2 STEP 3: Navigate to Ownership & KYC page', async ({ page }) => {
    const testName = 'Phase 2 Step 3 - Ownership & KYC';
    const testUrl = `${ENTREPRENEUR_URL}/phase-2/step-3`;

    const startTime = Date.now();
    await page.goto(testUrl);
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    // Verify page elements
    await expect(page.locator('text=Ownership & KYC')).toBeVisible();
    await expect(page.locator('text=John Smith')).toBeVisible();
    await expect(page.locator('button:has-text("Verify")')).toBeVisible();

    metrics.push({
      name: testName,
      url: testUrl,
      loadTime,
      navigationTime: loadTime,
    });

    console.log(`✅ ${testName}: ${loadTime}ms`);
  });

  test('✅ PHASE 2 STEP 3: Verify owners and proceed to Step 4', async ({ page }) => {
    // Setup steps 1-2 first
    await page.goto(`${ENTREPRENEUR_URL}/phase-2/step-1`);
    await page.waitForLoadState('networkidle');

    await page.fill('input[name="companyName"]', 'OwnerTest Corp');
    await page.fill('input[name="registrationNumber"]', '444-555-666');
    await page.selectOption('select[name="legalForm"]', 'SA');
    await page.fill('input[name="incorporationDate"]', '2021-01-10');
    await page.selectOption('select[name="countryOfRegistration"]', 'France');
    await page.fill('textarea[name="registeredAddress"]', '789 Owner Lane, Marseille, 13000 France');
    await page.fill('input[name="industryCode"]', '69.10Z');

    await page.click('button:has-text("Next: Document Upload")');
    await page.waitForURL(`${ENTREPRENEUR_URL}/phase-2/step-2`);

    const uploadButtons = await page.locator('button:has-text("Upload")').all();
    for (const button of uploadButtons) {
      await button.click();
    }

    await page.click('button:has-text("Next: Ownership & KYC")');
    await page.waitForURL(`${ENTREPRENEUR_URL}/phase-2/step-3`);

    // Now verify owners
    const startTime = Date.now();
    const verifyButtons = await page.locator('button:has-text("Verify")').all();

    for (const button of verifyButtons) {
      await button.click();
    }

    // Check verified
    await expect(page.locator('text=✓ Verified')).toHaveCount(2);

    // Click Next
    await page.click('button:has-text("Next: Financial Preview")');
    await page.waitForURL(`${ENTREPRENEUR_URL}/phase-2/step-4`);
    const verifyTime = Date.now() - startTime;

    metrics.push({
      name: 'Phase 2 Step 3 - Owner Verification',
      url: `${ENTREPRENEUR_URL}/phase-2/step-3`,
      loadTime: verifyTime,
      navigationTime: verifyTime,
    });

    console.log(`✅ Phase 2 Step 3 Verify: ${verifyTime}ms`);

    // Verify we're on step 4
    await expect(page.locator('text=Financial Preview')).toBeVisible();
  });

  test('✅ PHASE 2 STEP 4: Navigate to Financial Preview page', async ({ page }) => {
    const testName = 'Phase 2 Step 4 - Financial Preview';
    const testUrl = `${ENTREPRENEUR_URL}/phase-2/step-4`;

    const startTime = Date.now();
    await page.goto(testUrl);
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    // Verify page elements
    await expect(page.locator('text=Financial Preview')).toBeVisible();
    await expect(page.locator('text=$2.5M')).toBeVisible();
    await expect(page.locator('button:has-text("Complete Phase")')).toBeVisible();

    metrics.push({
      name: testName,
      url: testUrl,
      loadTime,
      navigationTime: loadTime,
    });

    console.log(`✅ ${testName}: ${loadTime}ms`);
  });

  test('✅ PHASE 2 STEP 4: Complete Phase 2 and return to overview', async ({ page }) => {
    // Full setup through step 4
    await page.goto(`${ENTREPRENEUR_URL}/phase-2/step-1`);
    await page.waitForLoadState('networkidle');

    // Step 1
    await page.fill('input[name="companyName"]', 'CompleteTest Corp');
    await page.fill('input[name="registrationNumber"]', '777-888-999');
    await page.selectOption('select[name="legalForm"]', 'SARL / EURL');
    await page.fill('input[name="incorporationDate"]', '2020-05-05');
    await page.selectOption('select[name="countryOfRegistration"]', 'France');
    await page.fill('textarea[name="registeredAddress"]', '999 Complete St, Toulouse, 31000 France');
    await page.fill('input[name="industryCode"]', '80.10Z');
    await page.click('button:has-text("Next: Document Upload")');
    await page.waitForURL(`${ENTREPRENEUR_URL}/phase-2/step-2`);

    // Step 2
    const uploadButtons1 = await page.locator('button:has-text("Upload")').all();
    for (const button of uploadButtons1) {
      await button.click();
    }
    await page.click('button:has-text("Next: Ownership & KYC")');
    await page.waitForURL(`${ENTREPRENEUR_URL}/phase-2/step-3`);

    // Step 3
    const verifyButtons = await page.locator('button:has-text("Verify")').all();
    for (const button of verifyButtons) {
      await button.click();
    }
    await page.click('button:has-text("Next: Financial Preview")');
    await page.waitForURL(`${ENTREPRENEUR_URL}/phase-2/step-4`);

    // Step 4 - Complete
    const startTime = Date.now();
    await page.click('button:has-text("Complete Phase")');
    await page.waitForURL(`${ENTREPRENEUR_URL}`);
    const completeTime = Date.now() - startTime;

    metrics.push({
      name: 'Phase 2 Step 4 - Phase Completion',
      url: `${ENTREPRENEUR_URL}/phase-2/step-4`,
      loadTime: completeTime,
      navigationTime: completeTime,
    });

    console.log(`✅ Phase 2 Complete: ${completeTime}ms`);

    // Verify we're back at overview
    await expect(page.locator('text=Entrepreneur Dashboard')).toBeVisible();
  });

  // ============================================================================
  // PHASE 3: FINANCIAL VALUATION
  // ============================================================================

  test('✅ PHASE 3 STEP 1: Navigate to Revenue Input page', async ({ page }) => {
    const testName = 'Phase 3 Step 1 - Revenue Input';
    const testUrl = `${ENTREPRENEUR_URL}/phase-3/step-1`;

    const startTime = Date.now();
    await page.goto(testUrl);
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    // Verify page elements
    await expect(page.locator('text=Revenue Input')).toBeVisible();
    await expect(page.locator('text=Quarterly Revenue')).toBeVisible();
    await expect(page.locator('input[placeholder="0.00"]')).toBeVisible();
    await expect(page.locator('button:has-text("Recalculate")')).toBeVisible();

    metrics.push({
      name: testName,
      url: testUrl,
      loadTime,
      navigationTime: loadTime,
    });

    console.log(`✅ ${testName}: ${loadTime}ms`);
  });

  test('✅ PHASE 3 STEP 1: Enter revenue data and view chart', async ({ page }) => {
    await page.goto(`${ENTREPRENEUR_URL}/phase-3/step-1`);
    await page.waitForLoadState('networkidle');

    const startTime = Date.now();

    // Fill quarterly revenue
    const inputs = await page.locator('input[placeholder="0.00"]').all();
    await inputs[0].fill('50000');
    await inputs[1].fill('75000');
    await inputs[2].fill('100000');
    await inputs[3].fill('150000');

    // Click Recalculate
    await page.click('button:has-text("Recalculate")');

    // Wait for chart to update
    await page.waitForTimeout(500);

    const dataTime = Date.now() - startTime;

    // Verify chart elements
    await expect(page.locator('text=Q1')).toBeVisible();
    await expect(page.locator('text=Q2')).toBeVisible();
    await expect(page.locator('text=Q3')).toBeVisible();
    await expect(page.locator('text=Q4')).toBeVisible();

    metrics.push({
      name: 'Phase 3 Step 1 - Revenue Data Entry',
      url: `${ENTREPRENEUR_URL}/phase-3/step-1`,
      loadTime: dataTime,
      navigationTime: dataTime,
    });

    console.log(`✅ Phase 3 Revenue Entry: ${dataTime}ms`);
  });

  // ============================================================================
  // NAVIGATION & RESPONSIVENESS
  // ============================================================================

  test('✅ Navigation: Quick sequential page loads', async ({ page }) => {
    const pages = [
      { name: 'Dashboard', url: `${ENTREPRENEUR_URL}` },
      { name: 'Phase 2', url: `${ENTREPRENEUR_URL}/phase-2` },
      { name: 'Phase 3', url: `${ENTREPRENEUR_URL}/phase-3` },
    ];

    for (const pageInfo of pages) {
      const startTime = Date.now();
      await page.goto(pageInfo.url);
      await page.waitForLoadState('domcontentloaded');
      const loadTime = Date.now() - startTime;

      metrics.push({
        name: `Quick Nav - ${pageInfo.name}`,
        url: pageInfo.url,
        loadTime,
        navigationTime: loadTime,
      });

      console.log(`✅ ${pageInfo.name} Load: ${loadTime}ms`);
    }
  });
});

// ============================================================================
// PERFORMANCE REPORT
// ============================================================================

test.afterAll(async () => {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║          ENTREPRENEUR FLOW - PERFORMANCE REPORT                ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('\n📊 PAGE LOAD METRICS:\n');

  let totalTime = 0;
  let pageCount = 0;

  // Group by section
  const phase2Pages = metrics.filter(m => m.name.includes('Phase 2'));
  const phase3Pages = metrics.filter(m => m.name.includes('Phase 3'));
  const navigationPages = metrics.filter(m => m.name.includes('Quick Nav'));

  if (phase2Pages.length > 0) {
    console.log('🏢 PHASE 2 - COMPANY VERIFICATION:');
    phase2Pages.forEach(m => {
      console.log(`   ${m.name.padEnd(45)} ${m.loadTime}ms`);
      totalTime += m.loadTime;
      pageCount++;
    });
    const avg = Math.round(phase2Pages.reduce((sum, m) => sum + m.loadTime, 0) / phase2Pages.length);
    console.log(`   Average Phase 2 Load Time: ${avg}ms\n`);
  }

  if (phase3Pages.length > 0) {
    console.log('💰 PHASE 3 - FINANCIAL VALUATION:');
    phase3Pages.forEach(m => {
      console.log(`   ${m.name.padEnd(45)} ${m.loadTime}ms`);
      totalTime += m.loadTime;
      pageCount++;
    });
    const avg = Math.round(phase3Pages.reduce((sum, m) => sum + m.loadTime, 0) / phase3Pages.length);
    console.log(`   Average Phase 3 Load Time: ${avg}ms\n`);
  }

  if (navigationPages.length > 0) {
    console.log('🔄 NAVIGATION & SEQUENTIAL LOADS:');
    navigationPages.forEach(m => {
      console.log(`   ${m.name.padEnd(45)} ${m.loadTime}ms`);
      totalTime += m.loadTime;
      pageCount++;
    });
    const avg = Math.round(navigationPages.reduce((sum, m) => sum + m.loadTime, 0) / navigationPages.length);
    console.log(`   Average Navigation Load Time: ${avg}ms\n`);
  }

  console.log('╔════════════════════════════════════════════════════════════════╗');
  const overallAvg = Math.round(totalTime / pageCount);
  console.log(`║ Total Pages Tested: ${pageCount}`.padEnd(64) + '║');
  console.log(`║ Overall Average Load Time: ${overallAvg}ms`.padEnd(64) + '║');
  console.log(`║ Total Time: ${totalTime}ms`.padEnd(64) + '║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('\n✅ All tests completed!\n');
});
