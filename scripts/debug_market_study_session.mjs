import { chromium } from '@playwright/test';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  await context.route('**/*', async (route) => {
    const url = route.request().url();
    if (url.includes('5093') || url.includes('/api/')) {
      console.log(`[NET REQ] ${route.request().method()} ${url}`);
    }

    if (url.includes('5093') && url.includes('/api/creator/journey')) {
      console.log('>>> [INTERCEPTED JOURNEY]');
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'OK',
          data: {
            journey: {
              currentStep: '3.1',
              status: 'Active',
              activeIdeaId: 'mock-idea-123',
              ideaVersion: 1,
              project: {
                marketGap: 'Existing supply chain carbon tools require 6-month enterprise onboarding with no automated ESG calculation.',
                sector: 'CleanTech Logistics',
                geography: 'Europe',
              },
              phase2Data: { clarifierSessionId: '6aabb285140ccaba4306156a' },
              phase3Data: {
                marketStudySessionId: '6aabb285140ccaba4306156d',
                clarifierSessionId: '6aabb285140ccaba4306156a',
              },
            },
            computedStatus: {
              unlockedStep: '3.1',
              phase: 3,
            },
          },
        }),
      });
    }

    if (url.includes('5093') && url.includes('/api/ai/market-study/')) {
      console.log('>>> [INTERCEPTED MARKET STUDY]');
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'OK',
          data: {
            sessionId: '6aabb285140ccaba4306156d',
            status: 'Completed',
            currentVersion: 1,
            output: {
              schemaVersion: 1,
              marketSizing: {
                tam: { value: 1000000000, label: 'TAM Label', derivation: 'TAM Derivation' },
                sam: { value: 200000000, label: 'SAM Label', derivation: 'SAM Derivation' },
                som: { value: 20000000, label: 'SOM Label', derivation: 'SOM Derivation' },
                methodology: 'Triangulated methodology',
              },
              competitorLandscape: {
                directCompetitors: [{ name: 'Test Comp', segment: 'Test Segment' }],
                indirectCompetitors: [],
              },
              demandSignals: [],
              sizingRisks: [],
              marketGapValidation: { primaryGap: 'Test Gap', validationRationale: 'Rationale' },
            },
            updatedAt: '2026-09-18T11:30:00Z',
          },
        }),
      });
    }

    return route.continue();
  });

  const page = await context.newPage();
  page.on('console', msg => console.log(`[PAGE LOG ${msg.type()}]:`, msg.text()));

  await page.goto('http://localhost:3000/login');
  await page.fill('input[type="email"]', 'demo.creator@mondial.local');
  await page.fill('input[type="password"]', 'DemoP@ss1');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard/**', { timeout: 15000 });

  await page.goto('http://localhost:3000/dashboard/creator/phase-3/market-study');
  await page.waitForTimeout(4000);

  const h1s = await page.$$eval('h1, h2, h3', els => els.map(e => e.innerText));
  console.log('Headings:', h1s);

  await page.screenshot({ path: 'outputs/debug_market_study_probe.png', fullPage: true });
  await browser.close();
}

run().catch(console.error);
