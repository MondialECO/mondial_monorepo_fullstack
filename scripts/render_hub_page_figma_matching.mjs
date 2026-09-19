import { chromium } from 'playwright';
import { execSync } from 'child_process';
import fs from 'fs';

const API_BASE = 'http://localhost:5093/api';
const APP_BASE = 'http://localhost:3000';

async function registerUser(email, role = 'Creator') {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Hub Test User',
      email,
      password: 'Password123!',
      role,
      user: role,
    }),
  });
  const data = await res.json();
  if (!data.success || !data.data?.token) {
    throw new Error(`Registration failed: ${JSON.stringify(data)}`);
  }
  return data.data.token;
}

async function createAndCompleteBrandKit(token) {
  // 1. Create initial kit
  const createRes = await fetch(`${API_BASE}/creator/journey/phase2/brand-kit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  const createData = await createRes.json();
  console.log('Brand Kit Initialized:', createData.success);

  // 2. Patch Strategy
  await fetch(`${API_BASE}/creator/journey/phase2/brand-kit/strategy`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      businessName: 'AutoInvoice',
      concept: 'Automated invoicing and payment chasing for freelance teams.',
      targetAudience: 'Freelancers and 2-10 person agencies who bill hourly.',
      industry: 'FinTech SaaS',
      positioning: 'The invoicing tool that does the awkward follow-up for you.',
      personalityTraits: ['Direct', 'Calm', 'Practical', 'Modern', 'Trustworthy'],
      confirmedAt: new Date().toISOString(),
    }),
  });

  // 3. Generate logo concepts
  await fetch(`${API_BASE}/creator/journey/phase2/brand-kit/logo/generate-concepts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  // 4. Derive variations
  await fetch(`${API_BASE}/creator/journey/phase2/brand-kit/logo/derive-variations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
}

async function main() {
  const testEmail = `hub.user.${Date.now()}@mondial-test.eco`;
  console.log(`Registering test user: ${testEmail}`);
  const token = await registerUser(testEmail, 'Creator');

  console.log(`Promoting test user onboarding in DB...`);
  execSync(`dotnet run --project scratch/mongo_reader/MongoAudit/MongoAudit.csproj -- promote-user ${testEmail}`, { stdio: 'inherit' });

  console.log(`Seeding brand kit via API...`);
  await createAndCompleteBrandKit(token);

  const browser = await chromium.launch({
    headless: true,
    channel: 'msedge',
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 2600 },
    deviceScaleFactor: 2,
    colorScheme: 'light',
  });

  const page = await context.newPage();

  // Set Auth
  await page.goto(`${APP_BASE}/login`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(({ token, email }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify({ email, role: 'Creator', roles: ['Creator'], onboardingPhase: 1 }));
    localStorage.setItem('mondial_creator_progress_draft', JSON.stringify({
      activeIdeaId: 'mock-idea-1',
      journeyState: {
        phase1: { status: 'completed', currentStep: 1, completedSteps: [1] },
        phase2: { status: 'completed', currentStep: 6, completedSteps: [1, 2, 3, 4, 5, 6] },
        phase3: { status: 'locked', currentStep: 1, completedSteps: [] },
      },
      project: {
        exists: true,
        projectId: 'mock-proj-1',
        name: 'AutoInvoice',
      }
    }));
    document.cookie = `token=${token}; path=/;`;
  }, { token, email: testEmail });

  // Navigate to brand-kit hub
  console.log('Navigating to Brand Kit Hub...');
  await page.goto(`${APP_BASE}/dashboard/creator/phase-2/brand-kit`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  fs.mkdirSync('outputs', { recursive: true });

  console.log('Capturing Light Mode 1440px...');
  await page.screenshot({ path: 'outputs/01_brand_kit_hub_1440_light.png', fullPage: true });

  console.log('Capturing Dark Mode 1440px...');
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'outputs/02_brand_kit_hub_1440_dark.png', fullPage: true });

  console.log('Capturing 1920px Viewport...');
  await page.setViewportSize({ width: 1920, height: 2600 });
  await page.emulateMedia({ colorScheme: 'light' });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'outputs/03_brand_kit_hub_1920_light.png', fullPage: true });

  await browser.close();
  console.log('Successfully captured Brand Kit Hub screenshots!');
}

main().catch(console.error);
