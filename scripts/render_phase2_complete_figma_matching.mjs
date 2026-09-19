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
      name: 'Phase 2 Test User',
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
  const testEmail = `p2complete.user.${Date.now()}@mondial-test.eco`;
  console.log(`Registering test user: ${testEmail}`);
  const token = await registerUser(testEmail, 'Creator');

  console.log(`Promoting test user onboarding in DB...`);
  try {
    execSync(`dotnet run --project scratch/mongo_reader/MongoAudit/MongoAudit.csproj -- promote-user ${testEmail}`, { stdio: 'inherit' });
  } catch (e) {
    console.warn('DB promotion warning:', e.message);
  }

  console.log(`Seeding brand kit via API...`);
  await createAndCompleteBrandKit(token);

  const browser = await chromium.launch({
    headless: true,
    channel: 'msedge',
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 1400 },
    deviceScaleFactor: 2,
    colorScheme: 'light',
  });

  const page = await context.newPage();

  // Intercept journey API
  await page.route('**/api/creator/journey*', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Journey loaded',
          data: {
            journey: {
              activeIdeaId: 'mock-idea-1',
              project: {
                exists: true,
                projectId: 'mock-proj-1',
                name: 'AutoInvoice',
                industry: 'FinTech SaaS',
                tagline: 'Automated invoicing and payment chasing for freelance teams.',
                problem: 'Chasing late payments costs time and strains client relationships.',
                solution: 'The invoicing tool that does the awkward follow-up for you.',
                targetAudience: 'Freelancers and 2-10 person agencies who bill hourly.',
                positioning: 'The invoicing tool that does the awkward follow-up for you.',
              },
              journeyState: {
                phase1: { status: 'completed', currentStep: 1, completedSteps: [1] },
                phase2: { status: 'completed', currentStep: 6, completedSteps: [1, 2, 3, 4, 5, 6] },
                phase3: { status: 'available', currentStep: 1, completedSteps: [] },
                phase4: { status: 'locked', currentStep: 1, completedSteps: [] },
                phase5: { status: 'locked', currentStep: 1, completedSteps: [], selectedPath: null },
                phase6: { status: 'locked', currentStep: 1, completedSteps: [] },
              },
            },
            computedStatus: {
              phase1: { status: 'completed', currentStep: 1, completedSteps: [1] },
              phase2: { status: 'completed', currentStep: 6, completedSteps: [1, 2, 3, 4, 5, 6] },
              phase3: { status: 'available', currentStep: 1, completedSteps: [] },
              phase4: { status: 'locked', currentStep: 1, completedSteps: [] },
              phase5: { status: 'locked', currentStep: 1, completedSteps: [] },
              phase6: { status: 'locked', currentStep: 1, completedSteps: [] },
            },
          },
        }),
      });
    } else {
      await route.continue();
    }
  });

  // Set Auth and local draft cache before first load
  await page.goto(`${APP_BASE}/login`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(({ token, email }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify({ email, role: 'Creator', roles: ['Creator'], onboardingPhase: 1 }));
    localStorage.setItem('mondial_creator_progress_draft', JSON.stringify({
      activeIdeaId: 'mock-idea-1',
      journeyState: {
        phase1: { status: 'completed', currentStep: 1, completedSteps: [1] },
        phase2: { status: 'completed', currentStep: 6, completedSteps: [1, 2, 3, 4, 5, 6] },
        phase3: { status: 'available', currentStep: 1, completedSteps: [] },
        phase4: { status: 'locked', currentStep: 1, completedSteps: [] },
        phase5: { status: 'locked', currentStep: 1, completedSteps: [], selectedPath: null },
        phase6: { status: 'locked', currentStep: 1, completedSteps: [] },
      },
      project: {
        exists: true,
        projectId: 'mock-proj-1',
        name: 'AutoInvoice',
        industry: 'FinTech SaaS',
        tagline: 'Automated invoicing and payment chasing for freelance teams.',
        problem: 'Chasing late payments costs time and strains client relationships.',
        solution: 'The invoicing tool that does the awkward follow-up for you.',
        targetAudience: 'Freelancers and 2-10 person agencies who bill hourly.',
        positioning: 'The invoicing tool that does the awkward follow-up for you.',
      }
    }));
    sessionStorage.setItem('creator_workspace_idea_id', 'mock-idea-1');
    document.cookie = `token=${token}; path=/;`;
  }, { token, email: testEmail });

  // Navigate to phase-2 complete
  console.log('Navigating to Phase 2 Complete page...');
  await page.goto(`${APP_BASE}/dashboard/creator/phase-2/complete?idea=mock-idea-1`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  fs.mkdirSync('outputs', { recursive: true });

  console.log('Capturing Light Mode 1440px...');
  await page.screenshot({ path: 'outputs/01_phase2_complete_1440_light.png', fullPage: true });

  console.log('Capturing Dark Mode 1440px...');
  await page.evaluate(() => {
    document.documentElement.classList.add('dark');
  });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'outputs/02_phase2_complete_1440_dark.png', fullPage: true });

  console.log('Capturing 1920px Viewport Light...');
  await page.setViewportSize({ width: 1920, height: 1400 });
  await page.evaluate(() => {
    document.documentElement.classList.remove('dark');
  });
  await page.emulateMedia({ colorScheme: 'light' });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'outputs/03_phase2_complete_1920_light.png', fullPage: true });

  console.log('Capturing 1920px Viewport Dark...');
  await page.evaluate(() => {
    document.documentElement.classList.add('dark');
  });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'outputs/04_phase2_complete_1920_dark.png', fullPage: true });

  await browser.close();
  console.log('Successfully captured Phase 2 Complete screenshots!');
}

main().catch(console.error);
