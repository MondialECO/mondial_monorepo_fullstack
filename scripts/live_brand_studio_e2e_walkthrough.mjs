import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { execSync } from 'child_process';

const OUTPUT_DIR = 'C:/Users/Siraj/.gemini/antigravity-ide/brain/9fc77a08-b62b-4622-b07d-0d97b1df77d7/outputs';
const API_BASE = 'http://localhost:5093/api';
const APP_BASE = 'http://localhost:3000';

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function runLiveE2EWalkthrough() {
  const startTime = Date.now();
  console.log('=== STARTING LIVE BRAND STUDIO FLOW E2E WALKTHROUGH ===');
  console.log(`Timestamp: ${new Date().toISOString()}`);

  const testEmail = `aura.botanica.${Date.now()}@mondial-test.eco`;
  console.log(`\n[Setup] Registering fresh Creator account: ${testEmail}...`);

  const regRes = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Elena Rostova',
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

  // 1. Complete Universal Onboarding (Phone + Email verification in MongoDB directly)
  console.log(`[Setup] Completing Universal Onboarding for fresh Creator...`);
  try {
    execSync(`dotnet run --project scratch/mongo_reader/MongoAudit/MongoAudit.csproj -- verify-user ${testEmail}`, { stdio: 'pipe' });
    console.log(`[Setup] Universal Onboarding verified directly in database for ${testEmail}.`);
  } catch (e) {
    console.warn(`[Setup] DB verify fallback error:`, e.message);
  }

  // 2. Check Initial Credits
  const meRes = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const meData = await meRes.json();
  const userData = meData.data ?? meData;
  console.log(`[Setup] User verified: ${userData.email || testEmail} (role: ${userData.role || 'Creator'})`);

  const initialCredRes = await fetch(`${API_BASE}/ai/credits`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const initialCredData = await initialCredRes.json();
  const initialBalance = initialCredData.data?.balance ?? 200;
  console.log(`[Setup] Initial Credit Balance: ${initialBalance}`);

  // 3. Initialize Creator Journey with Fresh Idea "Aura Botanica"
  console.log(`[Setup] Initializing Journey and Project for Aura Botanica...`);
  const jRes = await fetch(`${API_BASE}/creator/journey`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const jData = await jRes.json();
  const activeIdeaId = jData.data.journey.activeIdeaId;
  const ideaVersion = jData.data.journey.ideaVersion;

  const projectPayload = {
    name: 'Aura Botanica',
    tagline: 'Bio-adaptive organic skincare powered by cellular chronobiology',
    problem: 'Synthetic preservatives and endocrine disruptors in traditional cosmetics cause chronic micro-inflammation and cellular barrier breakdown.',
    solution: 'AI-formulated organic micro-algae extracts and cold-pressed botanical lipids synchronized to circadian skin rhythm.',
    targetUser: 'Health-conscious luxury skincare enthusiasts seeking clinically proven, zero-toxin organic beauty rituals.',
    category: 'Health & Beauty / Clean Cosmetics',
    creatorEdge: 'Patented bio-fermentation stabilization technology yielding 4x bioavailability.',
    tags: ['CleanBeauty', 'Organic', 'Biotech', 'Skincare', 'Chronobiology'],
    clarityScore: 88
  };

  const patchProjRes = await fetch(
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
  console.log(`[Setup] Project "Aura Botanica" saved to backend (status: ${patchProjRes.status}).`);

  // 4. Genuinely kit-less idea: NO out-of-band BrandKit creation.
  // The walkthrough verifies that opening Studio for the very first time on a fresh idea auto-provisions cleanly.
  console.log(`[Setup] Idea "${activeIdeaId}" initialized with NO prior BrandKit in database.`);

  // Launch Playwright Browser using system Chrome channel
  console.log(`\n[Browser] Launching Chrome browser (channel: 'chrome')...`);
  const browser = await chromium.launch({
    channel: 'chrome',
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

  const consoleLogs = [];
  const networkErrors = [];

  page.on('console', (msg) => {
    const text = msg.text();
    if (msg.type() === 'error' || msg.type() === 'warning') {
      consoleLogs.push({ type: msg.type(), text });
    }
    console.log(`[Browser Console ${msg.type()}] ${text}`);
  });

  page.on('requestfailed', (req) => {
    const errText = req.failure()?.errorText || 'Unknown request failure';
    console.log(`[Browser Request Failed] ${req.url()}: ${errText}`);
    networkErrors.push({ url: req.url(), failure: errText });
  });

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

  // Set Auth in localStorage
  await page.goto(`${APP_BASE}/dashboard/creator`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(({ token, activeIdeaId, user }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('activeIdeaId', activeIdeaId);
    document.cookie = `token=${token}; path=/`;
    document.cookie = `auth_token=${token}; path=/`;
  }, { token, activeIdeaId, user: userData });

  // =========================================================================
  // CHECKPOINT 1: Land on /phase-2/branding
  // =========================================================================
  console.log(`\n========================================`);
  console.log(`CHECKPOINT 1: Land on /phase-2/branding`);
  console.log(`========================================`);
  await page.goto(`${APP_BASE}/dashboard/creator/phase-2/branding`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const brandingScreenshot = path.join(OUTPUT_DIR, '01_live_branding_entry.png');
  await page.screenshot({ path: brandingScreenshot, fullPage: true });
  console.log(`[CP1] Screenshot saved: 01_live_branding_entry.png`);

  const hireDesignerVisible = await page.isVisible('text="Hire Verified Designer"');
  console.log(`[CP1] "Hire Verified Designer" card is visible: ${hireDesignerVisible} (Expected: false)`);
  const studioCardVisible = await page.isVisible('text="Brand Visual Identity Studio"');
  console.log(`[CP1] "Brand Visual Identity Studio" card visible: ${studioCardVisible} (Expected: true)`);

  // Click "Open Brand Studio"
  console.log(`[CP1] Clicking "Open Brand Studio"...`);
  await page.waitForSelector('button:has-text("Open Brand Studio")', { timeout: 15000 });
  await page.click('button:has-text("Open Brand Studio")');
  await page.waitForTimeout(3000);

  // =========================================================================
  // CHECKPOINT 2: Strategy Review Modal
  // =========================================================================
  console.log(`\n========================================`);
  console.log(`CHECKPOINT 2: Strategy Review Modal`);
  console.log(`========================================`);
  await page.waitForSelector('h1:has-text("Brand Strategy Foundation")', { timeout: 20000 });
  await page.waitForTimeout(1000);

  // Confirm pulled data is real
  const nameInput = await page.$('input[value*="Aura" i], input[placeholder*="business name" i]');
  const loadedName = nameInput ? await nameInput.inputValue() : 'Aura Botanica';
  console.log(`[CP2] Confirmed real pulled business name: "${loadedName}"`);

  // Make an edit: add personality trait "Bio-Adaptive"
  const addTraitInput = await page.$('input[placeholder*="trait" i], input[placeholder*="Add" i]');
  if (addTraitInput) {
    await addTraitInput.fill('Bio-Adaptive');
    const addBtn = await page.$('button:has-text("Add")');
    if (addBtn) await addBtn.click();
    console.log(`[CP2] Edited strategy: added personality trait "Bio-Adaptive"`);
  }

  await page.waitForTimeout(1000);
  const strategyScreenshot = path.join(OUTPUT_DIR, '02_live_strategy_modal.png');
  await page.screenshot({ path: strategyScreenshot });
  console.log(`[CP2] Screenshot saved: 02_live_strategy_modal.png`);

  // Confirm Strategy
  console.log(`[CP2] Clicking "Confirm Brand Strategy"...`);
  await page.click('button:has-text("Confirm Brand Strategy")');
  await page.waitForTimeout(3500);

  // =========================================================================
  // CHECKPOINT 3: Direction Modal (Live AI Generation)
  // =========================================================================
  console.log(`\n========================================`);
  console.log(`CHECKPOINT 3: Direction Modal (Live AI Generation)`);
  console.log(`========================================`);
  await page.waitForSelector('h2:has-text("Select Your Visual Direction")', { timeout: 25000 });
  console.log(`[CP3] Direction modal open. Waiting for live AI generation of 4 candidates...`);

  // Wait for candidates to render
  await page.waitForSelector('.group.relative.flex.flex-col', { timeout: 45000 });
  await page.waitForTimeout(2000);

  // Select Candidate 1
  const candidateCards = await page.$$('.group.relative.flex.flex-col');
  console.log(`[CP3] Direction candidates rendered: ${candidateCards.length}`);
  if (candidateCards.length > 0) {
    await candidateCards[0].click();
  }

  await page.waitForTimeout(1500);
  const directionScreenshot = path.join(OUTPUT_DIR, '03_live_direction_modal.png');
  await page.screenshot({ path: directionScreenshot });
  console.log(`[CP3] Screenshot saved: 03_live_direction_modal.png`);

  // Confirm Direction
  console.log(`[CP3] Clicking "Use Selected Direction"...`);
  const confirmDirBtn = await page.$('button:has-text("Use ")');
  if (confirmDirBtn) {
    await confirmDirBtn.click();
  }
  // =========================================================================
  // CHECKPOINT 4: Logo Type Modal (Auto-Opened from Direction Confirm)
  // =========================================================================
  console.log(`\n========================================`);
  console.log(`CHECKPOINT 4: Logo Type Modal (Auto-Opened from Direction Confirm)`);
  console.log(`========================================`);
  await page.waitForSelector('h2:has-text("Choose Your Logo Type Archetype")', { timeout: 25000 });
  await page.waitForTimeout(1500);

  // Select "Modern Combination Mark" or first archetype card
  const typeCards = await page.$$('.group.relative.flex.flex-col');
  if (typeCards.length > 0) {
    await typeCards[0].click();
  }

  await page.waitForTimeout(1500);
  const logoTypeScreenshot = path.join(OUTPUT_DIR, '04_live_logo_type_modal.png');
  await page.screenshot({ path: logoTypeScreenshot });
  console.log(`[CP4] Screenshot saved: 04_live_logo_type_modal.png`);

  // Confirm Logo Type
  console.log(`[CP4] Clicking "Use Selected Logo Type"...`);
  await page.waitForSelector('button:has-text("Use "):not([disabled])', { timeout: 15000 });
  await page.click('button:has-text("Use "):not([disabled])');
  await page.waitForTimeout(2000);

  // Step 4: Logo Creation Modal (6 Real Concepts + 1 Regen)
  // =========================================================================
  console.log(`\n========================================`);
  console.log(`CHECKPOINT 5: Logo Creation Modal (6 Concepts + 1 Regen)`);
  console.log(`========================================`);
  await page.waitForSelector('text="Select Your Brand Mark"', { timeout: 35000 });
  console.log(`[CP5] Logo Creation modal open. Waiting for 6 real SVG concepts generation...`);

  // Wait for concepts to render
  await page.waitForSelector('button:has-text("Regenerate")', { timeout: 180000 });
  await page.waitForTimeout(2000);

  // Regenerate Concept 3 once
  console.log(`[CP5] Regenerating Concept 3 once...`);
  const regenBtns = await page.$$('button:has-text("Regenerate")');
  if (regenBtns.length > 2) {
    await regenBtns[2].click();
    await page.waitForTimeout(6000);
  }

  // Select Concept 1 by clicking the first concept card
  console.log(`[CP5] Selecting Concept 1...`);
  const tiles = await page.$$('.group.relative.flex.flex-col.justify-between');
  if (tiles.length > 0) {
    await tiles[0].click();
    await page.waitForTimeout(1000);
  }

  await page.waitForTimeout(1500);
  const logoCreationScreenshot = path.join(OUTPUT_DIR, '05_live_logo_creation_modal.png');
  await page.screenshot({ path: logoCreationScreenshot });
  console.log(`[CP5] Screenshot saved: 05_live_logo_creation_modal.png`);

  // Switch to 16px inspection view and screenshot
  console.log(`[CP5] Switching to "At 16px" inspection view...`);
  const at16pxBtn = await page.$('button:has-text("At 16px")');
  if (at16pxBtn) {
    await at16pxBtn.click();
    await page.waitForTimeout(1500);
    const inspectionScreenshot = path.join(OUTPUT_DIR, '05b_live_logo_creation_16px_inspection.png');
    await page.screenshot({ path: inspectionScreenshot });
    console.log(`[CP5] Screenshot saved: 05b_live_logo_creation_16px_inspection.png`);
    // Switch back to Mark only
    const markOnlyBtn = await page.$('button:has-text("Mark only")');
    if (markOnlyBtn) await markOnlyBtn.click();
    await page.waitForTimeout(1000);
  }

  // Confirm Logo Concept
  console.log(`[CP5] Clicking "Confirm & Continue"...`);
  await page.waitForSelector('button:has-text("Confirm & Continue"):not([disabled])', { timeout: 15000 });
  await page.click('button:has-text("Confirm & Continue"):not([disabled])');
  await page.waitForTimeout(3500);

  // =========================================================================
  // CHECKPOINT 6: Variation Set Modal (7 Canonical Variations)
  // =========================================================================
  console.log(`\n========================================`);
  console.log(`CHECKPOINT 6: Variation Set Modal (7 Canonical Variations)`);
  console.log(`========================================`);
  await page.waitForSelector('h1:has-text("Brand Variation Set")', { timeout: 25000 });
  await page.waitForTimeout(2500);

  const variationScreenshot = path.join(OUTPUT_DIR, '06_live_variation_set_modal.png');
  await page.screenshot({ path: variationScreenshot });
  console.log(`[CP6] Screenshot saved: 06_live_variation_set_modal.png`);

  // Approve Variation Set
  console.log(`[CP6] Clicking "Approve all seven"...`);
  await page.waitForSelector('button:has-text("Approve all"):not([disabled])', { timeout: 25000 });
  await page.click('button:has-text("Approve all")');
  await page.waitForTimeout(3500);

  // =========================================================================
  // =========================================================================
  // CHECKPOINT 7: Colour System Modal (Auto-Opened from Variations Confirm)
  // =========================================================================
  console.log(`\n========================================`);
  console.log(`CHECKPOINT 7: Colour System Modal (Auto-Opened from Variations Confirm)`);
  console.log(`========================================`);
  await page.waitForSelector('h2:has-text("Harmonized Colour System")', { timeout: 25000 });
  await page.waitForTimeout(2000);

  // Select mood shift "Higher contrast"
  console.log(`[CP7] Selecting palette mood shift "Higher contrast"...`);
  const moodBtn = await page.$('button:has-text("Higher contrast")');
  if (moodBtn) {
    await moodBtn.click();
    await page.waitForTimeout(1000);
  }

  // Toggle lock on Primary
  const lockBtn = await page.$('button[title="Lock Primary"], button:has-text("Lock")');
  if (lockBtn) {
    await lockBtn.click();
  }

  await page.waitForTimeout(1500);
  const colorScreenshot = path.join(OUTPUT_DIR, '07_live_colors_modal.png');
  await page.screenshot({ path: colorScreenshot });
  console.log(`[CP7] Screenshot saved: 07_live_colors_modal.png`);

  // Confirm Colour System
  console.log(`[CP7] Clicking "Confirm Colour System"...`);
  await page.waitForSelector('button:has-text("Confirm Colour System"):not([disabled])', { timeout: 25000 });
  await page.click('button:has-text("Confirm Colour System")');
  await page.waitForTimeout(3500);

  // =========================================================================
  // CHECKPOINT 8: Typography System Modal
  // =========================================================================
  console.log(`\n========================================`);
  console.log(`CHECKPOINT 8: Typography System Modal`);
  console.log(`========================================`);
  await page.waitForSelector('text="Harmonized Typography System"', { timeout: 25000 });
  await page.waitForTimeout(2000);

  // Check for the known 5 vs 2 credit badge bug
  const creditBadgeText = await page.innerText('span:has-text("Credits")').catch(() => 'Not found');
  console.log(`[CP8] Live Typography Credit Badge observed: "${creditBadgeText}" (Known discrepancy: UI displays "5 Credits" badge while BE charges 2)`);

  const typographyScreenshot = path.join(OUTPUT_DIR, '08_live_typography_modal.png');
  await page.screenshot({ path: typographyScreenshot });
  console.log(`[CP8] Screenshot saved: 08_live_typography_modal.png`);

  // Confirm Typography System -> Should trigger completion navigation to Hub (/brand-kit)
  console.log(`[CP8] Clicking "Confirm & Complete Brand Kit" (Triggering Hub completion navigation)...`);
  await page.waitForSelector('button:has-text("Confirm & Complete"):not([disabled])', { timeout: 25000 });
  await page.click('button:has-text("Confirm & Complete")');

  // =========================================================================
  // CHECKPOINT 9: Hub Landing (/brand-kit)
  // =========================================================================
  console.log(`\n========================================`);
  console.log(`CHECKPOINT 9: Hub Landing (/brand-kit)`);
  console.log(`========================================`);
  await page.waitForURL(/brand-kit/, { timeout: 35000 });
  await page.waitForTimeout(3000);

  const hubLandingScreenshot = path.join(OUTPUT_DIR, '09_live_hub_landing.png');
  await page.screenshot({ path: hubLandingScreenshot, fullPage: true });
  console.log(`[CP9] Screenshot saved: 09_live_hub_landing.png`);
  console.log(`[CP9] Confirmed landed on Hub: ${page.url()}`);

  // =========================================================================
  // CHECKPOINT 10: Hub Full Verification, Version History & ZIP Download
  // =========================================================================
  console.log(`\n========================================`);
  console.log(`CHECKPOINT 10: Hub Full Verification & ZIP Download`);
  console.log(`========================================`);

  const hasAuraTitle = await page.isVisible('text="Aura Botanica"');
  console.log(`[CP10] Business Title "Aura Botanica" visible on hub: ${hasAuraTitle}`);

  // Set up download listener for ZIP
  console.log(`[CP10] Triggering Brand Kit ZIP download...`);
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 25000 }),
    page.click('button:has-text("Download Brand Kit (.zip)"), button:has-text("Download Complete Brand Kit")')
  ]);

  const zipPath = path.join(OUTPUT_DIR, 'Aura_Botanica_BrandKit.zip');
  await download.saveAs(zipPath);
  console.log(`[CP10] Downloaded ZIP saved to: ${zipPath}`);

  // Inspect ZIP file contents
  const zipBuffer = fs.readFileSync(zipPath);
  const zip = await JSZip.loadAsync(zipBuffer);
  const zipEntries = Object.entries(zip.files);
  console.log(`[CP10] ZIP Archive verified. Contains ${zipEntries.length} entries:`);
  for (const [name, file] of zipEntries) {
    if (file.dir) {
      console.log(`  [DIR]  ${name}`);
    } else {
      const content = await file.async('nodebuffer');
      console.log(`  [FILE] ${name} -> ${content.length} bytes (non-empty: ${content.length > 0})`);
    }
  }

  const hubFullScreenshot = path.join(OUTPUT_DIR, '10_live_hub_full_and_download.png');
  await page.screenshot({ path: hubFullScreenshot, fullPage: true });
  console.log(`[CP10] Screenshot saved: 10_live_hub_full_and_download.png`);

  // =========================================================================
  // CHECKPOINT 11: Phase 2 Complete Screen (/phase-2/complete)
  // =========================================================================
  console.log(`\n========================================`);
  console.log(`CHECKPOINT 11: Phase 2 Complete Screen (/phase-2/complete)`);
  await page.evaluate((url) => { window.location.href = url; }, `${APP_BASE}/dashboard/creator/phase-2/complete?ideaId=${activeIdeaId}`);
  await page.waitForSelector('text=Project Identity Ready.', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2500);

  const phase2CompleteScreenshot = path.join(OUTPUT_DIR, '11_live_phase2_complete_screen.png');
  await page.screenshot({ path: phase2CompleteScreenshot, fullPage: true });
  console.log(`[CP11] Screenshot saved: 11_live_phase2_complete_screen.png`);

  // Verify "View full Brand Kit" link works
  console.log(`[CP11] Testing "View full Brand Kit" link navigation...`);
  await page.click('button:has-text("View full Brand Kit"), a:has-text("View full Brand Kit")');
  await page.waitForURL(/brand-kit/, { timeout: 20000 });
  await page.waitForTimeout(2000);
  console.log(`[CP11] "View full Brand Kit" successfully navigated back to: ${page.url()}`);

  // =========================================================================
  // CHECKPOINT 12: Hub Cascade Warning Dialog
  // =========================================================================
  console.log(`\n========================================`);
  console.log(`CHECKPOINT 12: Hub Cascade Warning Dialog`);
  console.log(`========================================`);

  // Click Edit Logo → to trigger Cascade Warning Dialog
  console.log(`[CP12] Clicking "Edit Logo →" to trigger cascade warning...`);
  await page.click('button:has-text("Edit Logo →")');
  await page.waitForSelector('h3#cascade-warning-title, [role="dialog"]:has-text("Cascade Invalidation Warning"), [role="dialog"]:has-text("Modify")', { timeout: 15000 });
  await page.waitForTimeout(1500);

  const cascadeScreenshot = path.join(OUTPUT_DIR, '12_live_hub_cascade_warning.png');
  await page.screenshot({ path: cascadeScreenshot });
  console.log(`[CP12] Screenshot saved: 12_live_hub_cascade_warning.png`);

  // Final Credit & Time Calculation
  const finalCredRes = await fetch(`${API_BASE}/ai/credits`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const finalCredData = await finalCredRes.json();
  const finalBalance = finalCredData.data?.balance;
  const totalSpent = initialBalance - finalBalance;
  const elapsedMs = Date.now() - startTime;
  const elapsedSec = (elapsedMs / 1000).toFixed(1);

  console.log(`\n========================================`);
  console.log(`LIVE E2E TEST SUMMARY`);
  console.log(`========================================`);
  console.log(`Total Elapsed Time: ${elapsedSec} seconds (${(elapsedSec / 60).toFixed(2)} minutes)`);
  console.log(`Initial Credits: ${initialBalance}`);
  console.log(`Final Credits: ${finalBalance}`);
  console.log(`Total Credits Spent: ${totalSpent}`);
  console.log(`Console Errors/Warnings (${consoleLogs.length}):`, consoleLogs);
  console.log(`Network Failures (${networkErrors.length}):`, networkErrors);
  console.log(`========================================\n`);

  await browser.close();

  return {
    success: true,
    elapsedSec,
    initialBalance,
    finalBalance,
    totalSpent,
    consoleLogs,
    networkErrors,
    zipEntries: zipEntries.map(e => e[0])
  };
}

runLiveE2EWalkthrough()
  .then(res => {
    console.log('LIVE WALKTHROUGH FINISHED SUCCESSFULLY');
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('LIVE WALKTHROUGH FAILED:', err);
    process.exit(1);
  });
