import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('Frontend Stability - Critical Route Audit', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage to ensure fresh state
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  // ============================================================================
  // PUBLIC ROUTES
  // ============================================================================

  test('Public - Home page loads', async ({ page }) => {
    const errors: string[] = [];
    const violations: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState('networkidle');

    // Should not show error boundary
    const errorBoundary = page.locator('text=Error').first();
    expect(errorBoundary).not.toBeVisible();

    // Should have navigation
    const nav = page.locator('nav');
    expect(nav).toBeVisible();

    const criticalErrors = errors.filter((e) => !e.includes('favicon'));
    expect(criticalErrors.length).toBe(0);
  });

  // ============================================================================
  // DASHBOARD - GENERAL
  // ============================================================================

  test('Dashboard - Root redirects correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    // Should redirect to login or entrepreneur dashboard
    const url = page.url();
    expect(url).toMatch(/login|entrepreneur|dashboard/);
  });

  test('Dashboard - Entrepreneur overview loads', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto(`${BASE_URL}/dashboard/entrepreneur`);
    await page.waitForLoadState('networkidle');

    // Should not show error boundary
    const errorBoundary = page.locator('text=Error');
    expect(errorBoundary).not.toBeVisible();

    // Should have phase information
    const phases = page.locator('text=Phase').first();
    expect(phases).toBeVisible();

    const criticalErrors = errors.filter((e) => !e.includes('favicon'));
    expect(criticalErrors.length).toBe(0);
  });

  // ============================================================================
  // PHASE 2 - MAIN PAGE
  // ============================================================================

  test('Phase 2 - Main page loads without crash', async ({ page }) => {
    const errors: string[] = [];
    const logs: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
        console.error('❌ Console Error:', msg.text());
      }
      if (msg.text().includes('ReferenceError')) {
        logs.push(msg.text());
      }
    });

    await page.goto(`${BASE_URL}/dashboard/entrepreneur/phase-2`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // No error boundary
    const errorBoundary = page.locator('text=Error');
    expect(errorBoundary).not.toBeVisible();

    // Should show step cards
    const stepCards = page.locator('text=Legal Identity');
    await expect(stepCards.first()).toBeVisible();

    // Progress bar visible
    const progressBar = page.locator('.h-4.bg-gradient-to-r').first();
    expect(progressBar).toBeVisible();

    // Check for ReferenceError specifically
    const refErrors = errors.filter((e) => e.includes('ReferenceError'));
    console.log(`✅ No ReferenceError found (${refErrors.length})`);
    expect(refErrors.length).toBe(0);

    const criticalErrors = errors.filter((e) => !e.includes('favicon'));
    expect(criticalErrors.length).toBe(0);
  });

  // ============================================================================
  // PHASE 2 - STEP 1 (CRITICAL - Where crash occurred)
  // ============================================================================

  test('Phase 2 Step 1 - Loads without ReferenceError', async ({ page }) => {
    const errors: string[] = [];
    const pageErrors: { message: string; lineNumber: number }[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    page.on('pageerror', (err) => {
      pageErrors.push({
        message: err.message,
        lineNumber: err.stack ? parseInt(err.stack.split(':').pop() || '0') : 0,
      });
    });

    await page.goto(`${BASE_URL}/dashboard/entrepreneur/phase-2/step-1`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    console.log(`Page errors: ${pageErrors.length}`);
    pageErrors.forEach((err) => {
      console.log(`  - ${err.message}`);
    });

    // CRITICAL CHECK: No ReferenceError about nextValidationError
    const refErrors = errors.filter(
      (e) => e.includes('nextValidationError') || e.includes('ReferenceError')
    );
    console.log(`✅ nextValidationError not causing crash`);
    expect(refErrors.length).toBe(0);

    // Should not show error boundary
    const errorBoundary = page.locator('text=Error');
    expect(errorBoundary).not.toBeVisible();

    // Form should be visible
    const form = page.locator('form').first();
    await expect(form).toBeVisible();

    // Company name input should exist
    const companyInput = page.locator('input[name="companyName"]');
    await expect(companyInput).toBeVisible();

    // Next button should be visible
    const nextButton = page.locator('button:has-text("Next")').first();
    await expect(nextButton).toBeVisible();

    // Save draft button should be visible
    const saveDraftButton = page.locator('button:has-text("Save Draft")');
    await expect(saveDraftButton).toBeVisible();

    // Back button should be visible
    const backButton = page.locator('button:has-text("Back")');
    await expect(backButton).toBeVisible();
  });

  test('Phase 2 Step 1 - Form submission flow', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/entrepreneur/phase-2/step-1`);
    await page.waitForLoadState('networkidle');

    // Fill form
    await page.fill('input[name="companyName"]', 'Test Company');
    await page.fill('input[name="registrationNumber"]', '123 456 789');
    await page.selectOption('select[name="legalForm"]', 'SAS / SASU');
    await page.fill('input[name="incorporationDate"]', '2024-01-01');
    await page.selectOption('select[name="countryOfRegistration"]', 'France');
    await page.fill('textarea[name="registeredAddress"]', '123 Main St');
    await page.fill('input[name="industryCode"]', '90.875');

    // Click Next button
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);

    // Should navigate to step-2
    const url = page.url();
    expect(url).toContain('step-2');
  });

  test('Phase 2 Step 1 - Save Draft works', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/entrepreneur/phase-2/step-1`);
    await page.waitForLoadState('networkidle');

    // Fill one field
    await page.fill('input[name="companyName"]', 'Draft Test Company');

    // Click Save Draft
    await page.click('button:has-text("Save Draft")');
    await page.waitForTimeout(700);

    // Should show "✓ Saved" feedback
    const savedText = page.locator('button:has-text("✓ Saved")');
    expect(savedText).toBeVisible();
  });

  // ============================================================================
  // PHASE 2 - STEP 2
  // ============================================================================

  test('Phase 2 Step 2 - Loads without crash', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto(`${BASE_URL}/dashboard/entrepreneur/phase-2/step-2`);
    await page.waitForLoadState('networkidle');

    // No error boundary
    const errorBoundary = page.locator('text=Error');
    expect(errorBoundary).not.toBeVisible();

    // Should show document list
    const docList = page.locator('text=KBIS');
    await expect(docList).toBeVisible();

    // Upload buttons visible
    const uploadButton = page.locator('button:has-text("Upload")').first();
    await expect(uploadButton).toBeVisible();

    const criticalErrors = errors.filter((e) => !e.includes('favicon'));
    expect(criticalErrors.length).toBe(0);
  });

  // ============================================================================
  // PHASE 2 - STEP 3
  // ============================================================================

  test('Phase 2 Step 3 - Loads without crash', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto(`${BASE_URL}/dashboard/entrepreneur/phase-2/step-3`);
    await page.waitForLoadState('networkidle');

    // No error boundary
    const errorBoundary = page.locator('text=Error');
    expect(errorBoundary).not.toBeVisible();

    // Should show owner list
    const ownerList = page.locator('text=Smith');
    await expect(ownerList).toBeVisible();

    const criticalErrors = errors.filter((e) => !e.includes('favicon'));
    expect(criticalErrors.length).toBe(0);
  });

  // ============================================================================
  // PHASE 2 - STEP 4
  // ============================================================================

  test('Phase 2 Step 4 - Loads without crash', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto(`${BASE_URL}/dashboard/entrepreneur/phase-2/step-4`);
    await page.waitForLoadState('networkidle');

    // No error boundary
    const errorBoundary = page.locator('text=Error');
    expect(errorBoundary).not.toBeVisible();

    // Should show financial info
    const financialText = page.locator('text=Financial');
    await expect(financialText).toBeVisible();

    const criticalErrors = errors.filter((e) => !e.includes('favicon'));
    expect(criticalErrors.length).toBe(0);
  });

  // ============================================================================
  // ROUTE GUARD VERIFICATION
  // ============================================================================

  test('Route Guard - Cannot access Step 4 before Step 1 complete', async ({ page }) => {
    // Try to access step-4 directly
    await page.goto(`${BASE_URL}/dashboard/entrepreneur/phase-2/step-4`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);

    // Should redirect to step-1
    const url = page.url();
    expect(url).toContain('step-1');
  });

  // ============================================================================
  // RESPONSIVE DESIGN TESTS
  // ============================================================================

  test('Mobile - Phase 2 Step 1 responsive (375x812)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    await page.goto(`${BASE_URL}/dashboard/entrepreneur/phase-2/step-1`);
    await page.waitForLoadState('networkidle');

    // Form should be visible
    const form = page.locator('form').first();
    await expect(form).toBeVisible();

    // No horizontal overflow
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalScroll).toBe(false);

    // Buttons clickable
    const nextButton = page.locator('button:has-text("Next")').first();
    expect(nextButton).toBeVisible();
    expect(nextButton).toBeEnabled();
  });

  test('Desktop - Phase 2 Step 1 responsive (1920x1080)', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    await page.goto(`${BASE_URL}/dashboard/entrepreneur/phase-2/step-1`);
    await page.waitForLoadState('networkidle');

    // Form should be visible
    const form = page.locator('form').first();
    await expect(form).toBeVisible();

    // No horizontal overflow
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalScroll).toBe(false);

    // All elements visible
    const sidebar = page.locator('aside').first();
    expect(sidebar).toBeVisible();
  });

  // ============================================================================
  // ERROR STATE HANDLING
  // ============================================================================

  test('Phase 2 Step 1 - Shows validation error when required fields missing', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/entrepreneur/phase-2/step-1`);
    await page.waitForLoadState('networkidle');

    // Click Next without filling form
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(500);

    // Should show validation error
    const errorMessage = page.locator('text=required|required field');
    await expect(errorMessage.first()).toBeVisible();
  });

  // ============================================================================
  // CONSOLE ERROR SUMMARY
  // ============================================================================

  test('All critical routes - Zero ReferenceError crashes', async ({ page }) => {
    const routesToTest = [
      `${BASE_URL}/dashboard/entrepreneur/phase-2`,
      `${BASE_URL}/dashboard/entrepreneur/phase-2/step-1`,
      `${BASE_URL}/dashboard/entrepreneur/phase-2/step-2`,
      `${BASE_URL}/dashboard/entrepreneur/phase-2/step-3`,
      `${BASE_URL}/dashboard/entrepreneur/phase-2/step-4`,
    ];

    const allErrors: { route: string; errors: string[] }[] = [];

    for (const route of routesToTest) {
      const errors: string[] = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text());
      });

      await page.goto(route);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      const refErrors = errors.filter((e) => e.includes('ReferenceError'));
      if (refErrors.length > 0) {
        allErrors.push({
          route,
          errors: refErrors,
        });
      }

      // Clear listeners for next iteration
      page.removeAllListeners('console');
    }

    console.log(`✅ Tested ${routesToTest.length} routes`);
    if (allErrors.length > 0) {
      console.log(`❌ Found ReferenceErrors:`);
      allErrors.forEach((item) => {
        console.log(`  ${item.route}: ${item.errors.join(', ')}`);
      });
    } else {
      console.log(`✅ All routes clear of ReferenceErrors`);
    }

    expect(allErrors.length).toBe(0);
  });
});
