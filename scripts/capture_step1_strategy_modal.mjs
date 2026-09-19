import { chromium } from 'playwright';
import path from 'path';
import { execSync } from 'child_process';

const API_BASE = 'http://localhost:5093/api';
const APP_BASE = 'http://localhost:3000';
const OUTPUT_DIR = 'C:/Users/Siraj/.gemini/antigravity-ide/brain/9fc77a08-b62b-4622-b07d-0d97b1df77d7';

async function registerUser(email, role = 'Creator') {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test Creator User',
      email,
      password: 'Password123!',
      role,
      user: role
    })
  });
  const data = await res.json();
  if (!data.success || !data.data?.token) {
    throw new Error(`Registration failed: ${JSON.stringify(data)}`);
  }
  return data.data.token;
}

async function main() {
  const testEmail = `strategy.modal.${Date.now()}@mondial-test.eco`;
  console.log(`Registering test user: ${testEmail}`);
  const token = await registerUser(testEmail, 'Creator');

  console.log(`Promoting test user onboarding phase in DB...`);
  execSync(`dotnet run --project scratch/mongo_reader/MongoAudit/MongoAudit.csproj -- promote-user ${testEmail}`, { stdio: 'inherit' });

  const browser = await chromium.launch({
    headless: true,
    channel: 'msedge',
  });

  const viewports = [
    { width: 1440, height: 960, name: '1440' },
    { width: 1920, height: 1080, name: '1920' },
  ];

  for (const vp of viewports) {
    // Light mode
    {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        colorScheme: 'light',
      });
      const page = await context.newPage();

      await page.goto(`${APP_BASE}/login`, { waitUntil: 'domcontentloaded' });
      await page.evaluate(({ token, email }) => {
        localStorage.setItem('theme', 'light');
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify({ email, role: 'Creator', roles: ['Creator'], onboardingPhase: 1 }));
        localStorage.setItem('mondial_creator_progress_draft', JSON.stringify({
          activeIdeaId: 'mock-idea-1',
          journeyState: {
            phase1: { status: 'completed', currentStep: 1, completedSteps: [1] },
            phase2: { status: 'in_progress', currentStep: 4, completedSteps: [1, 2, 3] },
            phase3: { status: 'locked', currentStep: 1, completedSteps: [] },
            phase4: { status: 'locked', currentStep: 1, completedSteps: [] },
            phase5: { status: 'locked', currentStep: 1, completedSteps: [], selectedPath: null },
            phase6: { status: 'locked', currentStep: 1, completedSteps: [] },
          },
          project: {
            exists: true,
            projectId: 'mock-proj-1',
            name: 'AutoInvoice',
            branding: {
              logoType: 'ai',
            }
          }
        }));
        document.cookie = `token=${token}; path=/;`;
      }, { token, email: testEmail });

      await page.route('**/api/creator/brand-kit/**', async (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              ideaId: 'mock-idea-1',
              status: 'draft',
              currentStep: 1,
              version: 1,
              strategy: {
                businessName: 'AutoInvoice',
                nameDisplayForm: 'AutoInvoice',
                concept: {
                  value: 'Automated invoicing and payment chasing for freelance teams.',
                  provenance: 'stated',
                },
                targetAudience: {
                  value: 'Freelancers and 2-10 person agencies who bill hourly and hate chasing late payments.',
                  provenance: 'stated',
                },
                industry: {
                  value: 'FinTech SaaS',
                  provenance: 'stated',
                },
                positioning: {
                  value: 'The invoicing tool that does the awkward follow-up for you.',
                  provenance: 'stated',
                },
                personalityTraits: ['Direct', 'Calm', 'Practical', 'Modern', 'Trustworthy'],
                avoidList: ['Cliché padlocks', 'Generic shields'],
                tonePosition: 'balanced',
                firstAppearance: 'invoice',
                confirmedAt: null,
              }
            }
          })
        });
      });

      await page.goto(`${APP_BASE}/dashboard/creator/phase-2/brand-studio`, {
        waitUntil: 'domcontentloaded',
      });

      await page.waitForTimeout(1500);
      const openBtn = page.locator('button, div').filter({ hasText: /Review Brand Strategy|Strategy/i }).first();
      if (await openBtn.isVisible()) {
        await openBtn.click();
      }

      await page.waitForSelector('text=Confirm your brand strategy', { timeout: 15000 });
      await page.waitForTimeout(1000);

      const screenshotPath = path.join(OUTPUT_DIR, `strategy_step1_${vp.name}_light.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`Saved ${screenshotPath}`);
      await context.close();
    }

    // Dark mode
    {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        colorScheme: 'dark',
      });
      const page = await context.newPage();

      await page.goto(`${APP_BASE}/login`, { waitUntil: 'domcontentloaded' });
      await page.evaluate(({ token, email }) => {
        localStorage.setItem('theme', 'dark');
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify({ email, role: 'Creator', roles: ['Creator'], onboardingPhase: 1 }));
        localStorage.setItem('mondial_creator_progress_draft', JSON.stringify({
          activeIdeaId: 'mock-idea-1',
          journeyState: {
            phase1: { status: 'completed', currentStep: 1, completedSteps: [1] },
            phase2: { status: 'in_progress', currentStep: 4, completedSteps: [1, 2, 3] },
            phase3: { status: 'locked', currentStep: 1, completedSteps: [] },
            phase4: { status: 'locked', currentStep: 1, completedSteps: [] },
            phase5: { status: 'locked', currentStep: 1, completedSteps: [], selectedPath: null },
            phase6: { status: 'locked', currentStep: 1, completedSteps: [] },
          },
          project: {
            exists: true,
            projectId: 'mock-proj-1',
            name: 'AutoInvoice',
            branding: {
              logoType: 'ai',
            }
          }
        }));
        document.cookie = `token=${token}; path=/;`;
      }, { token, email: testEmail });

      await page.route('**/api/creator/brand-kit/**', async (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              ideaId: 'mock-idea-1',
              status: 'draft',
              currentStep: 1,
              version: 1,
              strategy: {
                businessName: 'AutoInvoice',
                nameDisplayForm: 'AutoInvoice',
                concept: {
                  value: 'Automated invoicing and payment chasing for freelance teams.',
                  provenance: 'stated',
                },
                targetAudience: {
                  value: 'Freelancers and 2-10 person agencies who bill hourly and hate chasing late payments.',
                  provenance: 'stated',
                },
                industry: {
                  value: 'FinTech SaaS',
                  provenance: 'stated',
                },
                positioning: {
                  value: 'The invoicing tool that does the awkward follow-up for you.',
                  provenance: 'stated',
                },
                personalityTraits: ['Direct', 'Calm', 'Practical', 'Modern', 'Trustworthy'],
                avoidList: ['Cliché padlocks', 'Generic shields'],
                tonePosition: 'balanced',
                firstAppearance: 'invoice',
                confirmedAt: null,
              }
            }
          })
        });
      });

      await page.goto(`${APP_BASE}/dashboard/creator/phase-2/brand-studio`, {
        waitUntil: 'domcontentloaded',
      });

      await page.evaluate(() => {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      });

      await page.waitForTimeout(1500);
      const openBtn = page.locator('button, div').filter({ hasText: /Review Brand Strategy|Strategy/i }).first();
      if (await openBtn.isVisible()) {
        await openBtn.click();
      }

      await page.waitForSelector('text=Confirm your brand strategy', { timeout: 15000 });
      await page.waitForTimeout(1000);

      const screenshotPath = path.join(OUTPUT_DIR, `strategy_step1_${vp.name}_dark.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`Saved ${screenshotPath}`);
      await context.close();
    }
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
