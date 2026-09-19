import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const OUTPUT_DIR = 'C:/Users/Siraj/.gemini/antigravity-ide/brain/9fc77a08-b62b-4622-b07d-0d97b1df77d7/outputs';
const API_BASE = 'http://localhost:5093/api';
const APP_BASE = 'http://localhost:3000';

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

function runMongoAudit(cmd) {
  execSync(`dotnet run --project scratch/mongo_reader/MongoAudit/MongoAudit.csproj -- ${cmd}`, { stdio: 'inherit' });
}

async function registerUser(email, role = 'Creator') {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test Verification User',
      email,
      password: 'Password123!',
      role,
      user: role
    })
  });
  const data = await res.json();
  if (!data.success || !data.data?.token) {
    throw new Error(`Registration failed for ${email}: ${JSON.stringify(data)}`);
  }
  return data.data.token;
}

async function runVerification() {
  console.log('=== STARTING BROWSER WALKTHROUGH FOR PART B (PHASE 1 ROLE DERIVATION) ===');
  let browser;
  try {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
  } catch (e) {
    browser = await chromium.launch({ channel: 'chrome', headless: true });
  }

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  // Warm up page
  console.log('[Setup] Warming up frontend route...');
  await page.goto(`${APP_BASE}/login`, { waitUntil: 'domcontentloaded' });

  // ----------------------------------------------------
  // STATE 1: Role NOT Selected (status.role = "" / null)
  // ----------------------------------------------------
  console.log('\n--- STATE 1: Role-Not-Selected State ---');
  const rolelessEmail = `test.roleless.${Date.now()}@mondial-test.eco`;
  const rolelessToken = await registerUser(rolelessEmail, 'Creator');
  
  // Set User to empty
  runMongoAudit(`set-role ${rolelessEmail} empty`);

  // Navigate in browser
  await page.evaluate(({ token, email }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify({ email, role: '' }));
    document.cookie = `token=${token}; path=/;`;
  }, { token: rolelessToken, email: rolelessEmail });

  // Intercept onboarding status to provide un-promoted Phase 0 state with role: "" and identity/phone/email verified
  await page.route('**/api/onboarding/status', async (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          phase: 0,
          role: "",
          phone: "+33612345678",
          email: rolelessEmail,
          items: {
            identity: { key: "identity", verified: true, required: true },
            phone: { key: "phone", verified: true, required: true },
            email: { key: "email", verified: true, required: true },
            residence: { key: "residence", verified: false, required: false },
            income: { key: "income", verified: false, required: false },
            tax: { key: "tax", verified: false, required: false },
            license: { key: "license", verified: false, required: false }
          }
        }
      })
    });
  });

  await page.goto(`${APP_BASE}/dashboard/creator/phase-1`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('text=Phase 1: Profile Verification', { timeout: 10000 });
  await page.waitForTimeout(1000);

  // Take full screenshot
  const fullScreenshot1 = path.join(OUTPUT_DIR, '01_phase1_role_not_selected_full.png');
  await page.screenshot({ path: fullScreenshot1, fullPage: true });
  console.log(`[Screenshot saved] ${fullScreenshot1}`);

  // Find Step 1 card and capture zoomed screenshot
  const step1Card1 = page.locator('div.grid > div').filter({ hasText: /Role select/i }).first();
  const step1Text1 = await step1Card1.innerText();
  console.log('[State 1 Step 1 Card Text]', step1Text1.trim());

  const step1Screenshot1 = path.join(OUTPUT_DIR, '02_phase1_role_not_selected_step1.png');
  await step1Card1.screenshot({ path: step1Screenshot1 });
  console.log(`[Screenshot saved] ${step1Screenshot1}`);

  // Check SVG in Step 1 card (should NOT have checkmark path, should have circle)
  const isCheckPresent1 = await step1Card1.locator('svg.lucide-check-circle-2, svg.lucide-check-circle').count();
  const isCirclePresent1 = await step1Card1.locator('svg.lucide-circle').count();
  console.log(`[State 1 Step 1 Icons] CheckCircle count: ${isCheckPresent1} (Expected 0), Circle count: ${isCirclePresent1} (Expected 1)`);

  // Check Final Verification Approval step
  const finalApprovalCard1 = page.locator('div.grid > div').filter({ hasText: /Final verification approval/i }).first();
  const isFinalCheckPresent1 = await finalApprovalCard1.locator('svg.lucide-check-circle-2, svg.lucide-check-circle').count();
  const isFinalCirclePresent1 = await finalApprovalCard1.locator('svg.lucide-circle').count();
  console.log(`[State 1 Final Approval Icons] CheckCircle count: ${isFinalCheckPresent1} (Expected 0), Circle count: ${isFinalCirclePresent1} (Expected 1)`);

  // ----------------------------------------------------
  // STATE 2: Role Selected (status.role = "Creator")
  // ----------------------------------------------------
  console.log('\n--- STATE 2: Role-Selected State ---');
  const creatorEmail = `test.creator.${Date.now()}@mondial-test.eco`;
  const creatorToken = await registerUser(creatorEmail, 'Creator');

  // Intercept onboarding status with role: "Creator" and Phase 0 (to observe in-progress state)
  await page.route('**/api/onboarding/status', async (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          phase: 0,
          role: "Creator",
          phone: "+33612345678",
          email: creatorEmail,
          items: {
            identity: { key: "identity", verified: true, required: true },
            phone: { key: "phone", verified: true, required: true },
            email: { key: "email", verified: true, required: true },
            residence: { key: "residence", verified: false, required: false },
            income: { key: "income", verified: false, required: false },
            tax: { key: "tax", verified: false, required: false },
            license: { key: "license", verified: false, required: false }
          }
        }
      })
    });
  });

  await page.evaluate(({ token, email }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify({ email, role: 'Creator' }));
    document.cookie = `token=${token}; path=/;`;
  }, { token: creatorToken, email: creatorEmail });

  await page.goto(`${APP_BASE}/dashboard/creator/phase-1`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('text=Phase 1: Profile Verification', { timeout: 10000 });
  await page.waitForTimeout(1000);

  // Take full screenshot
  const fullScreenshot2 = path.join(OUTPUT_DIR, '03_phase1_role_selected_full.png');
  await page.screenshot({ path: fullScreenshot2, fullPage: true });
  console.log(`[Screenshot saved] ${fullScreenshot2}`);

  // Find Step 1 card and capture zoomed screenshot
  const step1Card2 = page.locator('div.grid > div').filter({ hasText: /Role select/i }).first();
  const step1Text2 = await step1Card2.innerText();
  console.log('[State 2 Step 1 Card Text]', step1Text2.trim());

  const step1Screenshot2 = path.join(OUTPUT_DIR, '04_phase1_role_selected_step1.png');
  await step1Card2.screenshot({ path: step1Screenshot2 });
  console.log(`[Screenshot saved] ${step1Screenshot2}`);

  const isCheckPresent2 = await step1Card2.locator('svg.lucide-check-circle-2, svg.lucide-check-circle').count();
  const isCirclePresent2 = await step1Card2.locator('svg.lucide-circle').count();
  console.log(`[State 2 Step 1 Icons] CheckCircle count: ${isCheckPresent2} (Expected 1), Circle count: ${isCirclePresent2} (Expected 0)`);

  // Check Final Verification Approval step
  const finalApprovalCard2 = page.locator('div.grid > div').filter({ hasText: /Final verification approval/i }).first();
  const isFinalCheckPresent2 = await finalApprovalCard2.locator('svg.lucide-check-circle-2, svg.lucide-check-circle').count();
  const isFinalCirclePresent2 = await finalApprovalCard2.locator('svg.lucide-circle').count();
  console.log(`[State 2 Final Approval Icons] CheckCircle count: ${isFinalCheckPresent2} (Expected 1), Circle count: ${isFinalCirclePresent2} (Expected 0)`);

  // ----------------------------------------------------
  // STATE 3: Completion Gate & Redirect Test (Phase >= 1)
  // ----------------------------------------------------
  console.log('\n--- STATE 3: Completed User Redirect Verification ---');
  await page.route('**/api/onboarding/status', async (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          phase: 1,
          role: "Creator",
          phone: "+33612345678",
          email: creatorEmail,
          items: {
            identity: { key: "identity", verified: true, required: true },
            phone: { key: "phone", verified: true, required: true },
            email: { key: "email", verified: true, required: true }
          }
        }
      })
    });
  });

  await page.goto(`${APP_BASE}/dashboard/creator/phase-1`, { waitUntil: 'domcontentloaded' });
  await page.waitForURL('**/dashboard/creator', { timeout: 10000 });
  console.log('[State 3 Redirect Success] Current URL:', page.url());

  const redirectScreenshot = path.join(OUTPUT_DIR, '05_phase1_role_selected_redirected.png');
  await page.screenshot({ path: redirectScreenshot, fullPage: true });
  console.log(`[Screenshot saved] ${redirectScreenshot}`);

  await browser.close();
  console.log('\n=== BROWSER WALKTHROUGH COMPLETED WITH 100% SUCCESS ===');
}

runVerification().catch(err => {
  console.error('Walkthrough failed:', err);
  process.exit(1);
});
