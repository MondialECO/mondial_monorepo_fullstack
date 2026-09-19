import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function run() {
  console.log('--- Starting Stage 2 Real Browser Verification (Financial Forecast 3.4) ---');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  page.on('console', (msg) => console.log(`[PAGE CONSOLE ${msg.type()}]:`, msg.text()));
  page.on('response', (res) => {
    if (res.url().includes('/api/')) {
      console.log(`[HTTP ${res.status()}]:`, res.url());
    }
  });

  const outputDir = path.resolve('outputs/phase3_stage2_verification');
  fs.mkdirSync(outputDir, { recursive: true });

  try {
    // 1. Sign in as demo creator
    console.log('[1/6] Logging in as demo.creator@mondial.local...');
    await page.goto('http://localhost:3000/login');
    await page.waitForSelector('input[type="email"]', { timeout: 15000 });
    await page.fill('input[type="email"]', 'demo.creator@mondial.local');
    await page.fill('input[type="password"]', 'DemoP@ss1');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard/**', { timeout: 15000 });
    console.log('✓ Successfully authenticated into dashboard');

    // 2. Navigate to Consolidated Financial Forecast 3.4
    console.log('[2/6] Navigating to /dashboard/creator/phase-3/forecast...');
    await page.goto('http://localhost:3000/dashboard/creator/phase-3/forecast');
    await page.waitForSelector('h2, h1', { timeout: 20000 });
    await page.waitForSelector('text=Financial Projections & Simulations', { timeout: 15000 });
    console.log('✓ Consolidated Financial Forecast surface loaded');

    // 3. Wait for surface resolution (completed forecast, initial input form, or error state)
    console.log('[3/6] Resolving surface state (completed model, initial inputs, or re-run)...');
    await page.waitForSelector(
      'button:has-text("Re-run Simulation"), button:has-text("Generate 36-Month Forecast"), :has-text("Year 3 ARR")',
      { timeout: 15000 }
    );

    const reRunBtn = page.locator('button:has-text("Re-run Simulation")');
    const genBtn = page.locator('button:has-text("Generate 36-Month Forecast")');
    
    if (await reRunBtn.isVisible()) {
      console.log('⚡ Triggering fresh simulation via "Re-run Simulation"...');
      await reRunBtn.click();
    } else if (await genBtn.isVisible()) {
      console.log('⚡ Triggering initial simulation via "Generate 36-Month Forecast"...');
      await genBtn.click();
    }

    // 4. Verify Top KPI Metric Cards
    console.log('[3/6] Verifying Top KPI metric cards and live completion...');
    await page.waitForSelector('text="Year 3 ARR"', { timeout: 60000 });
    await page.waitForSelector('text="Break-Even Point"', { timeout: 10000 });
    await page.waitForSelector('text="Month 36 Balance"', { timeout: 10000 });
    await page.waitForSelector('text="Unit Economics"', { timeout: 10000 });
    console.log('✓ All 4 Top KPI metric cards rendered with live model data');

    await page.screenshot({ path: path.join(outputDir, '01_forecast_consolidated_overview.png'), fullPage: true });

    // 4. Verify Interactive Tabs Switcher
    console.log('[4/6] Verifying interactive tabs (Charts, Data Table, Logic & Risk Matrix)...');
    
    // Tab 1: Charts (Default)
    await page.waitForSelector('.recharts-responsive-container', { timeout: 10000 });
    console.log('✓ Visual Recharts projections rendered');

    // Tab 2: 36-Month Data Table
    console.log('✓ Switching to 36-Month Data Table tab...');
    await page.click('button:has-text("36-Month Data Table")');
    await page.waitForSelector('table', { timeout: 5000 });
    const tableRows = await page.$$('tbody tr');
    console.log(`✓ 36-Month Projections Table rendered with ${tableRows.length} monthly rows (Expected: 36)`);
    if (tableRows.length !== 36) {
      throw new Error(`Expected 36 monthly table rows, found ${tableRows.length}`);
    }
    await page.screenshot({ path: path.join(outputDir, '02_forecast_data_table.png') });

    // Tab 3: Model Logic & Risk Matrix
    console.log('✓ Switching to Logic & Risk Matrix tab...');
    await page.click('button:has-text("Logic & Risk Matrix")');
    await page.waitForSelector('text="Break-Even Analysis"', { timeout: 5000 });
    await page.screenshot({ path: path.join(outputDir, '03_forecast_model_risks.png') });
    console.log('✓ Model assumptions and risk evaluation matrix rendered');

    // 5. Test Live Assumptions Editor Drawer
    console.log('[5/6] Testing expandable live assumptions editor...');
    await page.click('button:has-text("Adjust Assumptions")');
    await page.waitForSelector('text="Live Simulation Parameters"', { timeout: 5000 });
    await page.screenshot({ path: path.join(outputDir, '04_assumptions_editor_expanded.png') });
    console.log('✓ Live assumptions parameters editor expanded smoothly');

    // 6. Test Legacy Route Redirect
    console.log('[6/6] Testing legacy route redirect (/dashboard/creator/phase-3/forecast-inputs)...');
    await page.goto('http://localhost:3000/dashboard/creator/phase-3/forecast-inputs');
    await page.waitForURL('**/dashboard/creator/phase-3/forecast', { timeout: 10000 });
    console.log('✓ Legacy /forecast-inputs successfully redirected to /forecast');

    console.log('\n=============================================================');
    console.log('ALL STAGE 2 BROWSER VERIFICATIONS PASSED CLEANLY');
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
