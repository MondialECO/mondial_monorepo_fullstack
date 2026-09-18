import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const mockFreshStudy = {
  schemaVersion: 1,
  marketSizing: {
    tam: {
      value: 5800000000,
      currency: 'EUR',
      label: 'Global Enterprise Supply Chain Intelligence',
      derivation: '58,000 mid-to-large enterprises spending €100k annually on carbon accounting and logistics telemetry.',
      sourceAttribution: 'Statista ESG Enterprise 2026',
    },
    sam: {
      value: 2600000000,
      currency: 'EUR',
      label: 'European Regulated Freight Forwarders',
      percentageOfTam: 44.8,
      derivation: '26,000 European transport companies subject to mandatory CSRD emissions auditing.',
      sourceAttribution: 'Eurostat Logistics Benchmark 2025',
    },
    som: {
      value: 284000000,
      currency: 'EUR',
      label: 'Initial Beachhead (France & DACH Multimodal Shippers)',
      percentageOfSam: 10.9,
      derivation: '2,840 target shippers onboarded across the initial 24-month direct sales motion.',
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
      {
        name: 'GreenFreight Cloud',
        segment: 'Mid-Market Logistics Providers',
        pricingModel: 'Per-shipment usage fee (€1.20/load)',
        estimatedMarketShare: '18%',
        strengths: ['Fast self-serve onboarding', 'Simple UI'],
        weaknesses: ['Limited scope 3 calculation fidelity'],
        exploitableGap: 'Does not support multimodal rail/sea freight telemetry.',
        sourceAttribution: 'Logistics Tech Report 2026',
      },
      {
        name: 'LegacyShipper Audit',
        // Backward-compatibility demonstration: segment deliberately omitted
        pricingModel: 'Per-seat desktop license (€150/mo)',
        estimatedMarketShare: '11%',
        strengths: ['Low upfront cost'],
        weaknesses: ['Manual file export', 'No cloud sync'],
        exploitableGap: 'Requires manual spreadsheet upload for every consignment.',
        sourceAttribution: 'Industry Review 2025',
      },
    ],
    indirectCompetitors: [
      {
        name: 'In-House Excel Models',
        substituteApproach: 'Manual calculation using DEFRA/GHG Protocol coefficient spreadsheets',
        threatLevel: 'medium',
      },
      {
        name: 'Generic Accounting ERPs',
        substituteApproach: 'Broad financial ledger modules with unverified carbon approximations',
        threatLevel: 'low',
      },
    ],
  },
  demandSignals: [
    {
      signal: 'EU CSRD Directive Enforcement',
      evidence: 'Over 50,000 EU companies legally mandated to track verified supply chain emissions by 2026.',
      sourceAttribution: 'European Commission Official Directive',
      relevanceScore: 9,
    },
    {
      signal: 'Freight Forwarder RFP Mandates',
      evidence: '82% of European corporate procurement RFPs now require verified carbon telemetry.',
      sourceAttribution: 'Supply Chain Executive Survey 2026',
      relevanceScore: 8,
    },
  ],
  sizingRisks: [
    {
      risk: 'Carrier telematics integration friction',
      impactOnSom: 'high',
      mitigation: 'Provide pre-built universal API webhooks and standard CSV dropboxes.',
    },
    {
      risk: 'Shifting regional emission calculation standards',
      impactOnSom: 'medium',
      mitigation: 'Implement dynamic calculation rules engine adhering to GLEC and ISO 14083.',
    },
  ],
  marketGapValidation: {
    primaryGap: 'Zero-configuration real-time carbon audit engine for mid-market freight forwarders',
    validationRationale: '30 founder discovery interviews confirmed immediate willingness to pay for instant compliance verification without custom ERP engineering.',
    confidenceLevel: 'high',
  },
};

async function run() {
  console.log('--- Starting Market Study Step 3.1 Visual Verification ---');
  const browser = await chromium.launch({ headless: true });
  const outputDir = path.resolve('outputs/market_study_redesign');
  fs.mkdirSync(outputDir, { recursive: true });

  const artifactDir = 'C:/Users/Siraj/.gemini/antigravity-ide/brain/ac4ea732-62cd-420b-8e2c-63fe1580c585';

  const viewports = [
    { name: '1440px', width: 1440, height: 950 },
    { name: '1920px', width: 1920, height: 1080 },
  ];

  for (const vp of viewports) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });

    await context.route('**/*', async (route) => {
      const url = route.request().url();

      if (url.includes('5093') && url.includes('/api/creator/journey')) {
        console.log('>>> [API INTERCEPT] journey:', url);
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

      if (url.includes('5093') && url.includes('/api/ai/market-study/')) {
        console.log('>>> [API INTERCEPT] market-study detail:', url);
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
              updatedAt: '2026-09-18T11:30:00Z',
            },
          }),
        });
      }

      return route.continue();
    });

    const page = await context.newPage();

    // 1. Sign in as demo creator
    console.log(`[Viewport ${vp.name}] Authenticating as demo creator...`);
    await page.goto('http://localhost:3000/login');
    await page.waitForSelector('input[type="email"]', { timeout: 15000 });
    await page.fill('input[type="email"]', 'demo.creator@mondial.local');
    await page.fill('input[type="password"]', 'DemoP@ss1');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard/**', { timeout: 15000 });

    // 1. Light Theme
    console.log(`[Viewport ${vp.name}] Loading Market Study Step 3.1 (Light)...`);
    await page.goto('http://localhost:3000/dashboard/creator/phase-3/market-study');
    await page.waitForSelector('text=MARKET SIZING FUNNEL', { timeout: 15000 });
    await page.waitForSelector('text="EcoLogistics Pro"', { timeout: 10000 });
    await page.waitForTimeout(800);

    const lightPath = path.join(outputDir, `market_study_step31_${vp.name}_light.png`);
    await page.screenshot({ path: lightPath, fullPage: true });
    console.log(`✓ Light theme screenshot saved: ${lightPath}`);

    // Capture funnel area specifically
    const funnelLocator = page.locator('text=MARKET SIZING FUNNEL').locator('xpath=ancestor::div[@data-slot="card"]');
    const funnelLightPath = path.join(outputDir, `market_study_funnel_${vp.name}_light.png`);
    if (await funnelLocator.count() > 0) {
      await funnelLocator.first().screenshot({ path: funnelLightPath });
      console.log(`✓ Funnel Light screenshot saved: ${funnelLightPath}`);
    }

    if (vp.name === '1440px') {
      fs.copyFileSync(lightPath, path.join(artifactDir, 'market_study_1440_light.png'));
      if (fs.existsSync(funnelLightPath)) {
        fs.copyFileSync(funnelLightPath, path.join(artifactDir, 'market_study_funnel_1440_light.png'));
      }
    }

    // 2. Dark Theme
    console.log(`[Viewport ${vp.name}] Switching to Dark Theme...`);
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
    await page.waitForTimeout(600);

    const darkPath = path.join(outputDir, `market_study_step31_${vp.name}_dark.png`);
    await page.screenshot({ path: darkPath, fullPage: true });
    console.log(`✓ Dark theme screenshot saved: ${darkPath}`);

    const funnelDarkPath = path.join(outputDir, `market_study_funnel_${vp.name}_dark.png`);
    if (await funnelLocator.count() > 0) {
      await funnelLocator.first().screenshot({ path: funnelDarkPath });
      console.log(`✓ Funnel Dark screenshot saved: ${funnelDarkPath}`);
    }

    if (vp.name === '1440px') {
      fs.copyFileSync(darkPath, path.join(artifactDir, 'market_study_1440_dark.png'));
      if (fs.existsSync(funnelDarkPath)) {
        fs.copyFileSync(funnelDarkPath, path.join(artifactDir, 'market_study_funnel_1440_dark.png'));
      }
    }

    await context.close();
  }

  // 3. Extreme Case Verification (SOM = 0.8%, SAM = 12%)
  console.log('[Extreme Case] Testing SOM at 0.8% and SAM at 12%...');
  const extremeContext = await browser.newContext({ viewport: { width: 1440, height: 950 } });
  const extremeStudy = {
    ...mockFreshStudy,
    marketSizing: {
      ...mockFreshStudy.marketSizing,
      tam: {
        value: 100000000000,
        currency: 'EUR',
        label: 'Global Heavy Logistics',
        derivation: '100B global market ceiling across heavy multimodal freight.',
      },
      sam: {
        value: 12000000000,
        currency: 'EUR',
        label: 'European Regulated Freight Forwarders',
        percentageOfTam: 12,
        derivation: '12,000 transport operators in EU CSRD regulatory scope.',
      },
      som: {
        value: 800000000, // 0.8% of TAM
        currency: 'EUR',
        label: 'Beachhead EU Sustainable Shippers',
        percentageOfSam: 6.7,
        derivation: '800 key enterprise logistics accounts onboarded within 24 months.',
      },
    },
  };

  await extremeContext.route('**/*', async (route) => {
    const url = route.request().url();
    if (url.includes('5093') && url.includes('/api/creator/journey')) {
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

    if (url.includes('5093') && url.includes('/api/ai/market-study/')) {
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
            output: extremeStudy,
            updatedAt: '2026-09-18T11:30:00Z',
          },
        }),
      });
    }

    return route.continue();
  });

  const extPage = await extremeContext.newPage();
  await extPage.goto('http://localhost:3000/login');
  await extPage.waitForSelector('input[type="email"]');
  await extPage.fill('input[type="email"]', 'demo.creator@mondial.local');
  await extPage.fill('input[type="password"]', 'DemoP@ss1');
  await extPage.click('button[type="submit"]');
  await extPage.waitForURL('**/dashboard/**', { timeout: 15000 });

  await extPage.goto('http://localhost:3000/dashboard/creator/phase-3/market-study');
  await extPage.waitForSelector('text=MARKET SIZING FUNNEL', { timeout: 15000 });
  await extPage.waitForTimeout(600);

  const extremeLightPath = path.join(outputDir, 'market_study_funnel_extreme_1440_light.png');
  const extFunnelLocator = extPage.locator('text=MARKET SIZING FUNNEL').locator('xpath=ancestor::div[@data-slot="card"]');
  if (await extFunnelLocator.count() > 0) {
    await extFunnelLocator.first().screenshot({ path: extremeLightPath });
    console.log(`✓ Extreme case light screenshot saved: ${extremeLightPath}`);
    fs.copyFileSync(extremeLightPath, path.join(artifactDir, 'market_study_funnel_extreme_1440_light.png'));
  }

  await extPage.evaluate(() => {
    document.documentElement.classList.add('dark');
  });
  await extPage.waitForTimeout(600);

  const extremeDarkPath = path.join(outputDir, 'market_study_funnel_extreme_1440_dark.png');
  if (await extFunnelLocator.count() > 0) {
    await extFunnelLocator.first().screenshot({ path: extremeDarkPath });
    console.log(`✓ Extreme case dark screenshot saved: ${extremeDarkPath}`);
    fs.copyFileSync(extremeDarkPath, path.join(artifactDir, 'market_study_funnel_extreme_1440_dark.png'));
  }

  await extremeContext.close();

  await browser.close();
  console.log('--- Visual Verification Completed Successfully ---');
}

run().catch((err) => {
  console.error('Visual verification failed:', err);
  process.exit(1);
});
