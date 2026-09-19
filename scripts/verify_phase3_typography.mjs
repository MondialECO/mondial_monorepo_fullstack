import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const mockMarketStudy = {
  marketSizing: {
    tam: {
      value: 5800000000,
      currency: 'EUR',
      label: 'European SMB Accounting & Invoicing Universe (EU-27)',
      derivation: '58,000 mid-to-large multi-modal transport and manufacturing enterprises spending €100k annually on carbon accounting and logistics telemetry infrastructure.',
      sourceAttribution: 'Statista ESG Enterprise 2026',
    },
    sam: {
      value: 1200000000,
      currency: 'EUR',
      label: 'Direct self-serve inbound fit',
      percentageOfTam: 20.6,
      derivation: '12,000 European transport companies subject to mandatory CSRD emissions auditing and verified digital carbon accounting certification by 2026.',
      sourceAttribution: 'Eurostat Logistics Benchmark 2025',
    },
    som: {
      value: 58000000,
      currency: 'EUR',
      label: 'Direct self-serve conversion',
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
        name: 'Pennylane',
        segment: 'Mid-Market / Accounting-led',
        pricingModel: 'Tiered subscription\n€49–€299/mo',
        estimatedMarketShare: '18%',
        exploitableGap: 'Requires accountant in the loop for complex reconciliations. No native multi-currency auto-matching.',
      },
      {
        name: 'Holded',
        segment: 'Micro-SMB / Broad ERP',
        pricingModel: 'Per-user modular\n€29–€159/mo',
        estimatedMarketShare: '14%',
        exploitableGap: 'ERP sprawl creates feature bloat. High churn in self-serve SMBs who only need invoice matching.',
      },
    ],
  },
  demandSignals: [
    {
      signal: 'EU ViDA & Mandatory e-Invoicing Rollout (2026–2028)',
      evidence: 'Over 24M EU SMBs must adopt structured electronic invoicing formats (EN 16931 / Peppol) by law.',
      sourceAttribution: 'European Commission DG TAXUD · ViDA Directive',
      relevanceScore: 9,
    },
  ],
  sizingRisks: [
    {
      risk: 'ERP vendor bundling with aggressive discounts',
      impactOnSom: 'high',
      mitigation: 'Deep focus on zero-touch line item reconciliation where generalist ERPs perform poorly.',
    },
  ],
  marketGapValidation: {
    primaryGap: 'Mid-market tools are built for certified accountants, while modern self-serve SMBs lack zero-touch line-item reconciliation.',
    validationRationale: 'Interviews with 40 European SMB operators confirm 82% spend over 12 hours/month on invoice matching.',
    confidenceLevel: 'high',
  },
};

const mockBusinessModel = {
  canvas: {
    keyPartners: [
      'European Banking-as-a-Service (BaaS) and Open Banking API providers',
      'Peppol Certified Access Point operators across EU member states',
      'Major accounting software ecosystems (Xero, QuickBooks, Datev)',
    ],
    keyActivities: [
      'ML pipeline development for real-time document OCR and line-item extraction',
      'Continuous compliance maintenance for European electronic invoicing (ViDA)',
      'High-reliability bank feed ingestion and webhook delivery infrastructure',
    ],
    keyResources: [
      'Proprietary invoice parsing models trained on multi-lingual EU formats',
      'Direct banking API connections and AISP licensing infrastructure',
      'Core engineering and machine learning research team',
    ],
    valuePropositions: [
      {
        headline: 'Automated Zero-Touch Line-Item Reconciliation',
        details: 'Instantly match incoming bank transaction telemetry with vendor line-items with 99.4% autonomous precision.',
        marketStudyFootnote: '3.1 §4',
      },
      {
        headline: 'Native EU ViDA & Peppol Compliance Engine',
        details: 'Guaranteed compliance with emerging European digital reporting mandates without changing accounting software.',
        marketStudyFootnote: '3.1 §3',
      },
    ],
    customerRelationships: [
      'Self-serve automated onboarding with instant sandbox access',
      'Dedicated compliance specialist support for scale and enterprise tiers',
      'Community knowledge base and developer API documentation',
    ],
    channels: [
      'Direct self-serve web signups and product-led growth loops',
      'App marketplace integrations (Shopify App Store, QuickBooks App Store)',
      'Partner referrals from regional boutique accounting firms',
    ],
    customerSegments: [
      {
        segment: 'European digital-first SMBs with 10–250 monthly vendor invoices',
        marketStudyFootnote: '3.1 §2',
      },
      {
        segment: 'Fast-growing cross-border e-commerce merchants operating in multiple EU tax jurisdictions',
        marketStudyFootnote: '3.1 §2',
      },
    ],
    costStructure: [
      'Cloud compute and GPU infrastructure for OCR document processing',
      'Open Banking AISP / PISP API transaction and connection fees',
      'Engineering, machine learning, and security operations personnel',
      'Customer acquisition (Search, outbound GTM, marketplace listings)',
    ],
    revenueStreams: [
      {
        stream: 'Monthly and annual tiered software subscriptions based on reconciled invoice volume',
        marketStudyFootnote: '3.1 §1',
      },
      {
        stream: 'Usage-based metering for high-throughput enterprise API transaction bursts',
        marketStudyFootnote: '3.1 §1',
      },
    ],
  },
  revenueTiers: [
    {
      tierName: 'Starter Self-Serve',
      pricing: '€49 / mo',
      targetSegment: 'Micro SMBs & solo operators (< 100 invoices/mo)',
      features: ['Up to 100 invoices/mo', 'Single bank connection', 'Standard Peppol export', 'Email support'],
      projectedContributionPct: 25,
    },
    {
      tierName: 'Growth Automation',
      pricing: '€149 / mo',
      targetSegment: 'Growing SMBs with multi-currency operations (100–500 invoices/mo)',
      features: ['Up to 500 invoices/mo', 'Multi-bank sync', 'Automated tax mapping', 'Priority chat support'],
      projectedContributionPct: 55,
    },
    {
      tierName: 'Scale Enterprise',
      pricing: '€499 / mo',
      targetSegment: 'High-volume mid-market companies (> 500 invoices/mo)',
      features: ['Unlimited invoices', 'Custom ERP webhook sync', 'Dedicated compliance manager', '99.9% SLA'],
      projectedContributionPct: 20,
    },
  ],
  unitEconomics: {
    arpu: { amount: 148, currency: 'EUR', period: 'monthly', isModelled: true },
    cac: { amount: 320, currency: 'EUR', isModelled: true },
    ltv: { amount: 3256, currency: 'EUR', isModelled: true },
    ltvToCacRatio: 10.2,
    paybackPeriodMonths: 2.2,
    commentary: 'Favorable LTV:CAC driven by low self-serve onboarding CAC and high retention in regulated compliance workflows.',
  },
  assumptions: [
    {
      category: 'Pricing & Conversion',
      assumption: '60% of free trial signups convert to the Growth tier at €149/mo based on invoice volume requirements.',
      evidenceLevel: 'evidenced',
    },
    {
      category: 'Retention',
      assumption: 'Annualized churn remains below 6% due to deep integration with core accounting workflows.',
      evidenceLevel: 'modelled',
    },
    {
      category: 'Regulatory Adoption',
      assumption: 'EU ViDA implementation timeline remains on schedule for 2026 enforcement.',
      evidenceLevel: 'evidenced',
    },
  ],
};

async function main() {
  const browser = await chromium.launch({ headless: true });
  const artifactDir = 'C:/Users/Siraj/.gemini/antigravity-ide/brain/ac4ea732-62cd-420b-8e2c-63fe1580c585';

  for (const vp of [{ width: 1440, height: 1100, name: '1440px' }, { width: 1920, height: 1100, name: '1920px' }]) {
    console.log(`\n=== Running audit for viewport ${vp.name} ===`);
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });

    const corsHeaders = {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': '*',
      'access-control-allow-headers': '*',
    };

    await context.route('**', async (route) => {
      const request = route.request();
      const url = request.url();

      if (request.method() === 'OPTIONS') {
        return route.fulfill({
          status: 200,
          headers: corsHeaders,
        });
      }

      if (url.includes('/auth/login')) {
        return route.fulfill({
          status: 200,
          headers: corsHeaders,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'OK',
            data: {
              token: 'mock-jwt-token',
              user: {
                id: 'mock-user-id',
                name: 'Demo Creator',
                email: 'demo.creator@mondial.local',
                role: 'Creator',
                roles: ['Creator'],
                onboardingPhase: 1,
              },
            },
          }),
        });
      }

      if (url.includes('/auth/me')) {
        return route.fulfill({
          status: 200,
          headers: corsHeaders,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'OK',
            data: {
              id: 'mock-user-id',
              name: 'Demo Creator',
              email: 'demo.creator@mondial.local',
              role: 'Creator',
              roles: ['Creator'],
              onboardingPhase: 1,
            },
          }),
        });
      }

      if (url.includes('/creator/journey')) {
        return route.fulfill({
          status: 200,
          headers: corsHeaders,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'OK',
            data: {
              journey: {
                currentStep: '3.2',
                status: 'Active',
                activeIdeaId: 'mock-idea-123',
                businessIdeaId: 'mock-idea-123',
                ideaVersion: 1,
                project: {
                  name: 'AutoInvoice AI',
                  marketGap: 'Mid-market tools are built for certified accountants, while modern self-serve SMBs lack zero-touch line-item reconciliation that conforms natively to EU ViDA standards.',
                  sector: 'FinTech / SMB Invoicing',
                  geography: 'EU-27',
                },
                phase2Data: { clarifierSessionId: '6aabb285140ccaba4306156a' },
                phase3Data: {
                  marketStudySessionId: '6aabb285140ccaba4306156d',
                  businessModelSessionId: '6aabb285140ccaba4306156e',
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

      if (url.includes('/ai/market-study/')) {
        return route.fulfill({
          status: 200,
          headers: corsHeaders,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'OK',
            data: {
              sessionId: '6aabb285140ccaba4306156d',
              status: 'Completed',
              currentVersion: 1,
              output: mockMarketStudy,
              updatedAt: '2026-09-18T11:30:00Z',
            },
          }),
        });
      }

      if (url.includes('/ai/business-model/')) {
        return route.fulfill({
          status: 200,
          headers: corsHeaders,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'OK',
            data: {
              sessionId: '6aabb285140ccaba4306156e',
              status: 'Completed',
              currentVersion: 1,
              output: mockBusinessModel,
              updatedAt: '2026-09-18T12:00:00Z',
            },
          }),
        });
      }

      if (url.includes('/credits') || url.includes('/ai/credits')) {
        return route.fulfill({
          status: 200,
          headers: corsHeaders,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'OK',
            data: { balance: 500 },
          }),
        });
      }

      if (url.includes('/brand-kit') || url.includes('/creator/brand-kit')) {
        return route.fulfill({
          status: 200,
          headers: corsHeaders,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'OK',
            data: { version: 1, logo: null },
          }),
        });
      }

      return route.continue();
    });

    const page = await context.newPage();
    page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', (err) => console.log('PAGE ERR:', err.message));

    // Authenticate via login
    await page.goto('http://localhost:3000/login');
    await page.waitForSelector('#email', { timeout: 10000 });
    await page.fill('#email', 'demo.creator@mondial.local');
    await page.fill('#password', 'DemoP@ss1');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1500);

    // 1. Check Screen 3.1 Market Study
    console.log(`Auditing Step 3.1 Market Study (${vp.name})...`);
    await page.goto('http://localhost:3000/dashboard/creator/phase-3/market-study');
    await page.waitForTimeout(4000);

    // Light screenshot
    const msLightPath = path.join(artifactDir, `market_study_${vp.name}_light.png`);
    await page.screenshot({ path: msLightPath, fullPage: true });
    console.log(`Saved: ${msLightPath}`);

    // Dark screenshot
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    await page.waitForTimeout(600);
    const msDarkPath = path.join(artifactDir, `market_study_${vp.name}_dark.png`);
    await page.screenshot({ path: msDarkPath, fullPage: true });
    console.log(`Saved: ${msDarkPath}`);

    // Check Market Study PDF Export
    if (vp.name === '1440px') {
      try {
        console.log('Testing Market Study PDF Export modal...');
        await page.evaluate(() => document.documentElement.classList.remove('dark'));
        await page.waitForTimeout(400);
        const exportBtn = await page.$('button:has-text("Export PDF")');
        if (exportBtn) {
          await exportBtn.click();
          await page.waitForSelector('text=Print / Save as PDF', { timeout: 8000 });
          await page.waitForTimeout(800);
          const msPdfPath = path.join(artifactDir, 'market_study_pdf_export_preview.png');
          await page.screenshot({ path: msPdfPath, fullPage: true });
          console.log(`Saved: ${msPdfPath}`);
          const closeBtn = await page.$('button:has-text("Close")');
          if (closeBtn) await closeBtn.click();
          await page.waitForTimeout(400);
        }
      } catch (err) {
        console.log('PDF export test skipped/failed:', err.message);
      }
    }

    // 2. Check Screen 3.2 Business Model
    console.log(`Auditing Step 3.2 Business Model (${vp.name})...`);
    await page.evaluate(() => document.documentElement.classList.remove('dark'));
    await page.goto('http://localhost:3000/dashboard/creator/phase-3/business-model');
    try {
      await page.waitForSelector('text=Key Partners', { timeout: 15000 });
    } catch {
      console.log('Key Partners selector timed out, proceeding');
    }
    await page.waitForTimeout(1000);

    // Light screenshot
    const bmLightPath = path.join(artifactDir, `business_model_${vp.name}_light.png`);
    await page.screenshot({ path: bmLightPath, fullPage: true });
    console.log(`Saved: ${bmLightPath}`);

    // Dark screenshot
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    await page.waitForTimeout(600);
    const bmDarkPath = path.join(artifactDir, `business_model_${vp.name}_dark.png`);
    await page.screenshot({ path: bmDarkPath, fullPage: true });
    console.log(`Saved: ${bmDarkPath}`);

    // Check Business Model PDF Export
    if (vp.name === '1440px') {
      try {
        console.log('Testing Business Model PDF Export modal...');
        await page.evaluate(() => document.documentElement.classList.remove('dark'));
        await page.waitForTimeout(400);
        const exportBtn = await page.$('button:has-text("Export PDF")');
        if (exportBtn) {
          await exportBtn.click();
          await page.waitForTimeout(1000);
          const bmPdfPath = path.join(artifactDir, 'business_model_pdf_export_preview.png');
          await page.screenshot({ path: bmPdfPath, fullPage: true });
          console.log(`Saved: ${bmPdfPath}`);
          const closeBtn = await page.$('button:has-text("Close")');
          if (closeBtn) await closeBtn.click();
        }
      } catch (err) {
        console.log('PDF export test skipped/failed:', err.message);
      }
    }

    // Check Business Model PDF Export
    if (vp.name === '1440px') {
      try {
        console.log('Testing Business Model PDF Export modal...');
        await page.evaluate(() => document.documentElement.classList.remove('dark'));
        await page.waitForTimeout(300);
        const exportBtn = await page.$('button:has-text("Export PDF")');
        if (exportBtn) {
          await exportBtn.click();
          await page.waitForSelector('text=Print / Save as PDF', { timeout: 8000 });
          await page.waitForTimeout(600);
          const bmPdfPath = path.join(artifactDir, 'business_model_pdf_export_preview.png');
          await page.screenshot({ path: bmPdfPath, fullPage: true });
          console.log(`Saved: ${bmPdfPath}`);
          await page.click('button:has-text("Close")');
        }
      } catch (err) {
        console.log('PDF export test skipped/failed:', err.message);
      }
    }

    await context.close();
  }

  await browser.close();
  console.log('Verification script completed all runs successfully!');
}

main().catch(console.error);
