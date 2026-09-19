import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const mockFreshStudy = {
  schemaVersion: 1,
  marketSizing: {
    tam: {
      value: 4200000000,
      currency: 'EUR',
      label: 'European SMB Accounting & Invoicing Universe (EU-27)',
      derivation: 'Eurostat SBS 2025: 4.2M European SMBs spending ~€1,000/yr on compliance and accounting software.',
      sourceAttribution: 'Eurostat SBS 2025',
    },
    sam: {
      value: 1880000000,
      currency: 'EUR',
      label: 'Direct self-serve inbound fit',
      percentageOfTam: 44.8,
      derivation: 'EU-27 only, SMB segment filtering with automated digital workflow readiness.',
      sourceAttribution: 'Mondial sector benchmark',
    },
    som: {
      value: 204000000,
      currency: 'EUR',
      label: 'Direct self-serve conversion',
      percentageOfSam: 10.9,
      derivation: 'Self-serve GTM capture cap, 3-yr horizon targeting 2.4M EU SMBs.',
      sourceAttribution: 'Internal Cohort Model',
    },
    methodology: 'Triangulated bottom-up cohort ramp model cross-referenced against top-down Eurostat logistics census telemetry.',
  },
  competitorLandscape: {
    directCompetitors: [
      {
        name: 'Sage Cloud Accounting',
        segment: 'Incumbent suite',
        pricingModel: 'Per-seat tiered monthly',
        estimatedMarketShare: '31%',
        exploitableGap: 'No automated dispute resolution or self-serve API',
      },
      {
        name: 'Pennylane',
        segment: 'Mid-market invoicing',
        pricingModel: 'Hybrid subscription + vol',
        estimatedMarketShare: '12%',
        exploitableGap: 'Accountant-centric; heavy onboarding overhead for SMBs',
      },
    ],
    indirectCompetitors: [
      {
        name: 'In-House Excel Models',
        substituteApproach: 'Manual spreadsheets with error-prone reconciliation',
        threatLevel: 'medium',
      }
    ],
  },
  demandSignals: [
    {
      signal: 'B2B mandatory e-invoicing search volume (EU)',
      evidence: 'Google Trends Fintech Index, EU-wide Q4 2025',
      sourceAttribution: 'Google Trends',
    },
  ],
  sizingRisks: [
    {
      risk: 'Regulatory timeline slippage in member-state transpositions',
      impactOnSom: 'high',
      mitigation: 'Monitor transposition deadlines across member states.',
    },
  ],
  marketGapValidation: {
    founderGapHypothesis: 'Mid-market tools are built for certified accountants, while modern self-serve SMBs lack zero-touch line-item reconciliation that conforms natively to EU ViDA standards.',
    validationSummary: 'Validated against Q4 competitor feature audits. Existing suites demand manual human validation workflows and charge enterprise tiers for bi-directional PEPPOL gateway integration.',
    confidenceLevel: 'high',
  },
};

async function main() {
  const browser = await chromium.launch({ headless: true });
  const artifactDir = 'C:/Users/Siraj/.gemini/antigravity-ide/brain/ac4ea732-62cd-420b-8e2c-63fe1580c585';

  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });

  await context.route('**/*', async (route) => {
    const url = route.request().url();

    if (url.includes('/api/creator/journey')) {
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
                name: 'AutoInvoice',
                marketGap: 'Existing accounting tools lack automated reconciliation.',
                sector: 'FinTech / SMB Accounting',
                geography: 'EU-27',
              },
              phase2Data: { clarifierSessionId: '6aabb285140ccaba4306156a' },
              phase3Data: {
                marketStudySessionId: '6aabb285140ccaba4306156d',
                clarifierSessionId: '6aabb285140ccaba4306156a',
              },
            },
            computedStatus: {
              phase1: { status: 'completed', currentStep: 1 },
              phase2: { status: 'completed', currentStep: 3 },
              phase3: { status: 'in_progress', currentStep: 1 },
              phase4: { status: 'locked', currentStep: 1 },
              phase5: { status: 'locked', currentStep: 1 },
              phase6: { status: 'locked', currentStep: 1 },
            },
          },
        }),
      });
    }

    if (url.includes('/api/ai/market-study/')) {
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
            output: mockFreshStudy,
            updatedAt: '2026-03-14T11:30:00Z',
          },
        }),
      });
    }

    return route.continue();
  });

  const page = await context.newPage();

  // Authenticate
  await page.goto('http://localhost:3000/login');
  try {
    await page.waitForSelector('input[type="email"]', { timeout: 4000 });
    await page.fill('input[type="email"]', 'demo.creator@mondial.local');
    await page.fill('input[type="password"]', 'DemoP@ss1');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard/**', { timeout: 15000 });
  } catch (e) {
    console.log('Already logged in or bypassed login');
  }

  // Navigate to market-study
  await page.goto('http://localhost:3000/dashboard/creator/phase-3/market-study');
  await page.waitForSelector('text=MARKET SIZING FUNNEL', { timeout: 15000 });
  await page.waitForTimeout(1000);

  // Click "Export PDF" button
  console.log('Clicking "Export PDF" button...');
  await page.click('button:has-text("Export PDF")');

  await page.waitForSelector('text=Print / Save as PDF', { timeout: 5000 });
  await page.waitForTimeout(800);

  // Capture screenshot of print preview overlay
  const printPreviewPath = path.join(artifactDir, 'market_study_pdf_export_preview.png');
  await page.screenshot({ path: printPreviewPath, fullPage: true });
  console.log('Saved PDF print preview screenshot:', printPreviewPath);

  await browser.close();
}

main().catch(console.error);
