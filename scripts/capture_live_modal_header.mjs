import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const OUTPUT_DIR = 'C:/Users/Siraj/.gemini/antigravity-ide/brain/9fc77a08-b62b-4622-b07d-0d97b1df77d7/outputs';
const API_BASE = 'http://localhost:5093/api';
const APP_BASE = 'http://localhost:3000';

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function main() {
  console.log('=== CAPTURING LIVE MODAL HEADERS ===');
  
  const testEmail = `creator.header.${Date.now()}@mondial-test.eco`;
  console.log(`[Setup] Registering fresh Creator account: ${testEmail}...`);

  const regRes = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test Creator',
      email: testEmail,
      password: 'Password123!',
      role: 'Creator',
      user: 'Creator'
    })
  });

  const regData = await regRes.json();
  if (!regData.success || !regData.data?.token) {
    throw new Error(`Registration failed: ${JSON.stringify(regData)}`);
  }
  const token = regData.data.token;
  console.log(`[Setup] Account registered. Token received.`);

  // Complete Universal Onboarding via MongoAudit
  console.log(`[Setup] Completing Universal Onboarding for fresh Creator...`);
  try {
    execSync(`dotnet run --project scratch/mongo_reader/MongoAudit/MongoAudit.csproj -- verify-user ${testEmail}`, { stdio: 'pipe' });
    console.log(`[Setup] Universal Onboarding verified directly in database for ${testEmail}.`);
  } catch (e) {
    console.warn(`[Setup] DB verify fallback error:`, e.message);
  }

  // Get user details
  const meRes = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const meData = await meRes.json();
  const userData = meData.data ?? meData;

  // Initialize Journey & Project
  const jRes = await fetch(`${API_BASE}/creator/journey`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const jData = await jRes.json();
  const activeIdeaId = jData.data.journey.activeIdeaId;
  const ideaVersion = jData.data.journey.ideaVersion;

  const projectPayload = {
    name: 'Aura Botanica',
    tagline: 'Bio-adaptive organic skincare powered by cellular chronobiology',
    category: 'Sustainable Agriculture & Bio-Tech',
    marketSector: 'Organic Bio-Nutrient Skincare & Wellness',
    targetAudience: 'Conscious consumers seeking clinically backed botanical formulations.',
    valueProposition: 'Pure cellular botanical actives stabilized with organic fermentation.',
    monetizationModel: 'D2C subscription & premium salon distribution',
    creatorEdge: 'Patented bio-fermentation stabilization technology yielding 4x bioavailability.',
    tags: ['CleanBeauty', 'Organic', 'Biotech', 'Skincare', 'Chronobiology'],
    clarityScore: 88
  };

  await fetch(
    `${API_BASE}/creator/journey/project?ideaId=${activeIdeaId}&expectedVersion=${ideaVersion}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(projectPayload)
    }
  );

  console.log(`[Browser] Launching Edge browser (channel: 'msedge')...`);
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2
  });

  const page = await context.newPage();
  page.setDefaultNavigationTimeout(60000);
  page.setDefaultTimeout(60000);

  await context.addCookies([
    { name: 'token', value: token, domain: 'localhost', path: '/' },
    { name: 'auth_token', value: token, domain: 'localhost', path: '/' },
  ]);

  await context.addInitScript(({ token, activeIdeaId, user }) => {
    window.localStorage.setItem('token', token);
    window.localStorage.setItem('user', JSON.stringify(user));
    window.localStorage.setItem('activeIdeaId', activeIdeaId);
    document.cookie = `token=${token}; path=/`;
    document.cookie = `auth_token=${token}; path=/`;
  }, { token, activeIdeaId, user: userData });

  // Pre-seed auth into page
  await page.goto(`${APP_BASE}/dashboard/creator`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(({ token, activeIdeaId, user }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('activeIdeaId', activeIdeaId);
    document.cookie = `token=${token}; path=/`;
    document.cookie = `auth_token=${token}; path=/`;
  }, { token, activeIdeaId, user: userData });

  // Navigate to Branding Hub
  console.log(`[Navigating] Loading /phase-2/branding...`);
  await page.goto(`${APP_BASE}/dashboard/creator/phase-2/branding`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Click Open Brand Studio
  console.log(`[Studio] Opening Brand Studio...`);
  await page.waitForSelector('button:has-text("Open Brand Studio")', { timeout: 15000 });
  await page.click('button:has-text("Open Brand Studio")');
  await page.waitForTimeout(2500);

  // 1. Strategy Modal (Step 1 of 6)
  await page.waitForSelector('h1:has-text("Brand Strategy Foundation")', { timeout: 20000 });
  await page.waitForTimeout(1000);
  const stratScreenshot = path.join(OUTPUT_DIR, '01_live_strategy_modal.png');
  await page.screenshot({ path: stratScreenshot });
  console.log(`Captured: 01_live_strategy_modal.png`);

  // Confirm Strategy to open Direction Modal (Step 2 of 6)
  console.log(`[Confirming] Strategy Foundation...`);
  await page.click('button:has-text("Confirm Brand Strategy")');
  await page.waitForTimeout(3000);

  // 2. Direction Modal (Step 2 of 6)
  console.log(`[Direction] Waiting for Direction modal header and content...`);
  await page.waitForSelector('h2:has-text("Select Your Visual Direction")', { timeout: 25000 });
  await page.waitForTimeout(1500);

  const directionScreenshot = path.join(OUTPUT_DIR, '02_live_direction_modal.png');
  await page.screenshot({ path: directionScreenshot });
  console.log(`Captured: 02_live_direction_modal.png`);

  // Wait for candidates to render and select candidate 1
  await page.waitForSelector('.group.relative.flex.flex-col', { timeout: 45000 });
  await page.waitForTimeout(1500);
  const candidateCards = await page.$$('.group.relative.flex.flex-col');
  if (candidateCards.length > 0) {
    await candidateCards[0].click();
  }
  await page.waitForTimeout(1000);

  // Confirm Direction to reach Logo Type modal (Step 3 of 6)
  const confirmDirBtn = await page.$('button:has-text("Use ")');
  if (confirmDirBtn) {
    await confirmDirBtn.click();
    await page.waitForTimeout(2000);
  }

  // 3. Logo Type Modal (Step 3 of 6)
  await page.waitForSelector('h2:has-text("Choose Your Logo Type Archetype")', { timeout: 25000 });
  await page.waitForTimeout(1000);
  const logoTypeScreenshot = path.join(OUTPUT_DIR, '03_live_logotype_modal.png');
  await page.screenshot({ path: logoTypeScreenshot });
  console.log(`Captured: 03_live_logotype_modal.png`);

  // Select Archetype 1 and Confirm
  const typeCards = await page.$$('.group.relative.flex.flex-col');
  if (typeCards.length > 0) {
    await typeCards[0].click();
    await page.waitForTimeout(500);
  }
  const confirmTypeBtn = await page.$('button:has-text("Use ")');
  if (confirmTypeBtn) {
    await confirmTypeBtn.click();
    await page.waitForTimeout(3000);
  }

  // 4. Logo Creation Modal (Step 4 of 6)
  console.log(`[LogoCreation] Waiting for Logo Creation modal...`);
  await page.waitForSelector('h1:has-text("Select Your Brand Mark")', { timeout: 35000 });
  await page.waitForSelector('button:has-text("Regenerate")', { timeout: 180000 });
  await page.waitForTimeout(1500);
  const logoCreationScreenshot = path.join(OUTPUT_DIR, '04_live_logocreation_modal.png');
  await page.screenshot({ path: logoCreationScreenshot });
  console.log(`Captured: 04_live_logocreation_modal.png`);

  // Select Concept 1
  const conceptTiles = await page.$$('.group.relative.flex.flex-col.justify-between');
  if (conceptTiles.length > 0) {
    await conceptTiles[0].click();
    await page.waitForTimeout(1000);
  }
  // Confirm Concept
  const confirmConceptBtn = await page.$('button:has-text("Confirm & Continue")');
  if (confirmConceptBtn) {
    await confirmConceptBtn.click();
    await page.waitForTimeout(3000);
  }

  // 5. Variations Modal (Step 4 of 6 · Variations)
  console.log(`[Variations] Waiting for Variations modal...`);
  await page.waitForSelector('h1:has-text("Brand Variation Set")', { timeout: 25000 });
  await page.waitForTimeout(1000);
  const varScreenshot = path.join(OUTPUT_DIR, '05_live_variations_modal.png');
  await page.screenshot({ path: varScreenshot });
  console.log(`Captured: 05_live_variations_modal.png`);

  // Approve Variations to proceed to Colours
  const approveVarsBtn = await page.$('button:has-text("Approve all seven"), button:has-text("Approve")');
  if (approveVarsBtn) {
    await approveVarsBtn.click();
    await page.waitForTimeout(3000);
  }

  // 6. Colour System Modal (Step 5 of 6)
  console.log(`[Colours] Waiting for Colour System modal...`);
  await page.waitForSelector('h2:has-text("Harmonized Colour System")', { timeout: 25000 });
  await page.waitForTimeout(1500);
  const colorScreenshot = path.join(OUTPUT_DIR, '06_live_colors_modal.png');
  await page.screenshot({ path: colorScreenshot });
  console.log(`Captured: 06_live_colors_modal.png`);

  // Confirm Colours to proceed to Typography (Step 6 of 6)
  const confirmColorsBtn = await page.$('button:has-text("Confirm Colour System"), button:has-text("Confirm")');
  if (confirmColorsBtn) {
    await confirmColorsBtn.click();
    await page.waitForTimeout(3000);
  }

  // 7. Typography Modal (Step 6 of 6)
  console.log(`[Typography] Waiting for Typography modal...`);
  await page.waitForSelector('h2:has-text("Calibrate Typographic Hierarchy")', { timeout: 25000 });
  await page.waitForTimeout(1500);
  const typoScreenshot = path.join(OUTPUT_DIR, '07_live_typography_modal.png');
  await page.screenshot({ path: typoScreenshot });
  console.log(`Captured: 07_live_typography_modal.png`);

  await browser.close();
  console.log('=== SCREENSHOT CAPTURE COMPLETE ===');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
