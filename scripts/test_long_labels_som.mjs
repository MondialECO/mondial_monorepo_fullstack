import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const mockLongLabelsStudy = {
  schemaVersion: 1,
  marketSizing: {
    tam: {
      value: 5800000000,
      currency: 'EUR',
      label: 'Global Enterprise Supply Chain Intelligence & Automated ESG Accounting Universe (EU-27 & Tier-1 Global Corridors)',
      derivation: '58,000 mid-to-large multi-modal transport and manufacturing enterprises spending €100k annually on carbon accounting and logistics telemetry infrastructure.',
      sourceAttribution: 'Statista ESG Enterprise 2026',
    },
    sam: {
      value: 1200000000,
      currency: 'EUR',
      label: 'European Regulated Freight Forwarders & Cross-Border Logistics Service Providers Subject to Mandatory CSRD Directives',
      percentageOfTam: 20.6,
      derivation: '12,000 European transport companies subject to mandatory CSRD emissions auditing and verified digital carbon accounting certification by 2026.',
      sourceAttribution: 'Eurostat Logistics Benchmark 2025',
    },
    som: {
      value: 58000000,
      currency: 'EUR',
      label: 'Initial Beachhead (France, Germany & DACH High-Density Multimodal Shippers with Existing EDI Infrastructure)',
      percentageOfSam: 4.8,
      derivation: '580 high-density target accounts onboarded across the initial 24-month direct outbound sales motion with verified 48-hour API deployment SLAs.',
      sourceAttribution: 'Internal Bottom-Up GTM Runway Model',
    },
    methodology: 'Triangulated bottom-up cohort ramp model cross-referenced against top-down Eurostat logistics census telemetry.',
  },
  competitorLandscape: {
    summary: 'Incumbents offer siloed legacy ERP extensions lacking automated real-time API integrations.',
    directCompetitors: [
      {
        name: 'EcoLogistics Pro',
        segment: 'Enterprise / Global Tier 1',
        pricingModel: 'Annual Enterprise SaaS (€85k/yr)',
        estimatedMarketShare: '34%',
        strengths: ['Deep ERP integration with SAP', 'Global brand footprint'],
        weaknesses: ['9-month implementation cycles', 'No developer API'],
        exploitableGap: 'Lacks automated API-driven carbon estimation and instant onboarding.',
        sourceAttribution: 'Gartner Magic Quadrant 2026',
      },
    ],
    indirectCompetitors: [],
  },
  demandSignals: [
    {
      signal: 'EU CSRD Directive Enforcement',
      evidence: 'Over 50,000 EU companies legally mandated to track verified supply chain emissions by 2026.',
      sourceAttribution: 'European Commission Official Directive',
      relevanceScore: 9,
    },
  ],
  sizingRisks: [
    {
      risk: 'Carrier telematics integration friction',
      impactOnSom: 'high',
      mitigation: 'Provide pre-built universal API webhooks and standard CSV dropboxes.',
    },
  ],
  marketGapValidation: {
    primaryGap: 'Zero-configuration real-time carbon audit engine for mid-market freight forwarders',
    validationRationale: '30 founder discovery interviews confirmed immediate willingness to pay for instant compliance verification without custom ERP engineering.',
    confidenceLevel: 'high',
  },
};

async function main() {
  const browser = await chromium.launch({ headless: true });
  const artifactDir = 'C:/Users/Siraj/.gemini/antigravity-ide/brain/ac4ea732-62cd-420b-8e2c-63fe1580c585';

  for (const vp of [{ width: 1440, height: 1100, name: '1440px' }, { width: 1920, height: 1100, name: '1920px' }]) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });

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
              output: mockLongLabelsStudy,
              updatedAt: '2026-09-18T11:30:00Z',
            },
          }),
        });
      }

      return route.continue();
    });

    const page = await context.newPage();

    // Authenticate
    await page.goto('http://localhost:3000/login');
    await page.waitForSelector('input[type="email"]', { timeout: 15000 });
    await page.fill('input[type="email"]', 'demo.creator@mondial.local');
    await page.fill('input[type="password"]', 'DemoP@ss1');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard/**', { timeout: 15000 });

    // Navigate to market-study
    await page.goto('http://localhost:3000/dashboard/creator/phase-3/market-study');
    await page.waitForSelector('text=MARKET SIZING FUNNEL', { timeout: 15000 });
    await page.waitForTimeout(800);

    const funnelLocator = page.locator('text=MARKET SIZING FUNNEL').locator('xpath=ancestor::div[contains(@class, "rounded-xl")][1]');
    
    // Light funnel screenshot
    const funnelLightPath = path.join(artifactDir, `funnel_long_labels_${vp.name}_light.png`);
    if (await funnelLocator.count() > 0) {
      await funnelLocator.first().screenshot({ path: funnelLightPath });
    }

    // Dark funnel screenshot
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    await page.waitForTimeout(400);
    const funnelDarkPath = path.join(artifactDir, `funnel_long_labels_${vp.name}_dark.png`);
    if (await funnelLocator.count() > 0) {
      await funnelLocator.first().screenshot({ path: funnelDarkPath });
    }

    if (vp.name === '1440px') {
      // Export PDF overlay test
      console.log('Testing Export PDF overlay...');
      await page.evaluate(() => document.documentElement.classList.remove('dark'));
      await page.waitForTimeout(300);
      await page.click('button:has-text("Export PDF")');
      await page.waitForSelector('text=Print / Save as PDF', { timeout: 10000 });
      await page.waitForTimeout(800);
      const pdfPreviewPath = path.join(artifactDir, 'market_study_pdf_export_preview.png');
      await page.screenshot({ path: pdfPreviewPath, fullPage: true });
      console.log('✓ PDF Export preview screenshot saved:', pdfPreviewPath);
    }

    await context.close();
  }

  await browser.close();
  console.log('Capture complete!');
}

main().catch(console.error);
