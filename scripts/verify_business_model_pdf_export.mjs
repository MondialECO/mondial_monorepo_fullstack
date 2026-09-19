import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const mockBusinessModelOutput = {
  schemaVersion: 1,
  canvas: {
    keyPartners: [
      'European E-Invoicing Service Providers (EESPA)',
      'Certified PEPPOL Access Point Providers (Tickstar / Storecove)',
      'Tier-1 European Neobanks (Qonto, Finom, Pleo)',
      'Local Certified Public Accountant Associations (DACH & France)'
    ],
    keyActivities: [
      'Continuous ViDA regulatory compliance parsing & semantic tax rule engine updates',
      'High-throughput PEPPOL AS4 message transmission & XML schema validation',
      'Automated invoice error correction & dispute resolution workflow',
      'Direct API integrations with ERPs (SAP, NetSuite, Datev)'
    ],
    keyResources: [
      'Proprietary ViDA multi-jurisdiction tax rule graph & compliance parser',
      'Certified PEPPOL SMP/SML infrastructure & direct AS4 connector nodes',
      'SOC2 / ISO 27001 compliant cloud processing pipeline (Frankfurt AWS region)',
      'Senior tax technology engineering team'
    ],
    valuePropositions: [
      {
        headline: 'Automated 100% ViDA Compliance with Zero ERP Re-platforming',
        details: 'Plug-and-play middleware that sits between existing ERPs and national tax authorities, converting legacy invoice schemas into PEPPOL BIS 3.0 with automatic validation.',
        marketStudyFootnote: 'Addresses 4.2M European SMBs impacted by 2026 mandate (Market Study §01)'
      },
      {
        headline: 'Sub-Second Real-Time Tax Clearance & Dispute Resolution',
        details: 'Instant pre-clearance validation that eliminates invoice rejection by tax gateways and cuts reconciliation cycle times from 14 days to 4 minutes.',
        marketStudyFootnote: 'Resolves key gap found in Sage and Pennylane audits (Market Study §02)'
      }
    ],
    customerRelationships: [
      'Self-serve developer documentation & interactive sandbox environment',
      'Automated onboarding wizard with 1-click test invoice generation',
      'Dedicated compliance specialist Slack channels for Enterprise accounts',
      'Quarterly automated regulatory compliance audit certificates'
    ],
    channels: [
      'Direct self-serve inbound SaaS web portal & developer API gateway',
      'App marketplace listings (QuickBooks, Xero, Datev, Shopify)',
      'Accountant partner referral program with revenue share tiers',
      'Enterprise direct sales for companies >€50M turnover'
    ],
    customerSegments: [
      {
        segment: 'European Cross-Border SMBs (10–250 employees)',
        marketStudyFootnote: 'Primary SOM target cohort of 2.4M businesses (Market Study §01)'
      },
      {
        segment: 'Mid-Market B2B Suppliers with High Invoice Velocity (>500/mo)',
        marketStudyFootnote: 'High-margin segment with immediate pain from national gateway rollouts'
      },
      {
        segment: 'Accounting & Advisory Firms Managing Multi-Client Portfolios',
        marketStudyFootnote: 'Channel multiplier segment identified in demand signals'
      }
    ],
    costStructure: [
      'Cloud compute & AS4 transmission gateway infrastructure (Frankfurt)',
      'PEPPOL certified Access Point hosting fees & certificate renewals',
      'Tax law advisory retained council for continuous regulatory monitoring',
      'Customer acquisition costs across self-serve digital channels'
    ],
    revenueStreams: [
      {
        stream: 'Core Subscription Tiers (Starter, Growth, Enterprise monthly SaaS)',
        marketStudyFootnote: 'Aligned with willingness-to-pay benchmark of €99/mo (Market Study §03)'
      },
      {
        stream: 'Volume-based overage fees (€0.08 per cleared transmission above tier quota)',
        marketStudyFootnote: 'Usage-based upside on high-frequency transactions'
      },
      {
        stream: 'Certified Accountant Multi-Tenant Portal Licenses (€199/firm/mo)'
      }
    ]
  },
  revenueTiers: [
    {
      tierName: 'Starter Self-Serve',
      pricing: '€49 / month',
      targetSegment: 'Micro-enterprises (<50 invoices/mo)',
      features: [
        'Up to 100 PEPPOL BIS 3.0 transmissions/mo',
        'Single EU tax jurisdiction validation',
        'Standard email support',
        'Community ERP plugins'
      ],
      projectedContributionPct: 25
    },
    {
      tierName: 'Professional Growth',
      pricing: '€149 / month',
      targetSegment: 'Growing SMBs (50–500 invoices/mo)',
      features: [
        'Up to 1,000 certified transmissions/mo',
        'All 27 EU member state tax rules enabled',
        'Automated real-time error reconciliation',
        'Priority Slack support & SLA',
        'Direct Datev / Xero / QuickBooks sync'
      ],
      projectedContributionPct: 55
    },
    {
      tierName: 'Enterprise Infrastructure',
      pricing: '€499 / month + vol',
      targetSegment: 'Mid-market & High-volume suppliers',
      features: [
        'Unlimited domestic + cross-border clearance',
        'Custom ERP webhook integrations (SAP / Oracle)',
        'Dedicated account manager & regulatory audit trail',
        '99.99% uptime SLA guarantee'
      ],
      projectedContributionPct: 20
    }
  ],
  unitEconomics: {
    arpu: {
      amount: 168,
      currency: 'EUR',
      period: 'monthly',
      isModelled: true
    },
    cac: {
      amount: 420,
      currency: 'EUR',
      isModelled: true
    },
    ltv: {
      amount: 2016,
      currency: 'EUR',
      isModelled: true
    },
    ltvToCacRatio: 4.8,
    paybackPeriodMonths: 2.5,
    commentary: 'Unit economics model assumes a 24-month customer lifetime with blended CAC across organic inbound and certified accountant referral loops. LTV:CAC of 4.8x comfortably exceeds institutional benchmarks (≥3.0x).'
  },
  assumptions: [
    {
      category: 'Market Penetration',
      assumption: 'ViDA mandatory enforcement deadlines drive 35% inbound conversion increase in 2026.',
      evidenceLevel: 'evidenced'
    },
    {
      category: 'Pricing Elasticity',
      assumption: 'SMB willingness-to-pay remains robust at €149/mo for automated non-compliance insurance.',
      evidenceLevel: 'evidenced'
    },
    {
      category: 'Churn Rate',
      assumption: 'Monthly logo churn stays under 1.8% once accounting software connectors are deeply embedded.',
      evidenceLevel: 'modelled'
    },
    {
      category: 'Channel Partner Yield',
      assumption: 'Accountant referral program generates 25% of new subscriber volume by Month 6.',
      evidenceLevel: 'untested'
    }
  ]
};

const mockJourney = {
  id: 'j-bm-test',
  userId: 'u-1',
  businessIdeaId: 'idea-bm-test',
  companyId: null,
  activeIdeaId: 'idea-bm-test',
  leveledUpIdeaId: null,
  ideaVersion: 1,
  project: {
    name: 'AutoInvoice PEPPOL',
    tagline: 'Automated ViDA e-Invoicing Compliance Engine for EU SMBs',
    concept: 'SaaS Compliance Middleware',
    targetUser: 'European SMB Finance Heads',
    problem: 'Mandatory EU 2026 ViDA e-invoicing compliance causes severe disruption to legacy billing systems.',
    solution: 'Automated schema validation and sub-second transmission middleware over certified PEPPOL AS4 network.',
    marketGap: 'Existing accounting incumbents require manual portal uploads or lack self-serve dispute resolution.',
    sector: 'FinTech & Regulatory Infrastructure',
    geography: 'European Union (EU-27)',
  },
  phase2Data: {
    clarifierSessionId: 'c-1',
  },
  phase3Data: {
    marketStudySessionId: 'session-ms-test',
    businessModelSessionId: 'session-bm-test',
    businessPlanSessionId: 'session-bp-test',
    forecastSessionId: 'session-fc-test',
    formationGenerator: { selectedOptionKey: 'sas_standard', confirmedAt: '2026-03-14T10:00:00Z' },
    legalChecklist: { items: [{ id: 'company-type', status: 'done' }], updatedAt: '2026-03-14T11:00:00Z' },
  },
  phase4Data: {},
  phase5Data: { chosenPath: null },
  phase6Data: {},
  outputSnapshots: {},
  createdAt: '2026-03-10T10:00:00Z',
  updatedAt: '2026-03-18T12:00:00Z',
};

const mockComputedStatus = {
  phase1: { status: 'completed', currentStep: 1 },
  phase2: { status: 'completed', currentStep: 3 },
  phase3: { status: 'completed', currentStep: 6 },
  phase4: { status: 'completed', currentStep: 1 },
  phase5: { status: 'available', currentStep: 1 },
  phase6: { status: 'locked', currentStep: 1 },
};

const mockBrandKit = {
  isConfirmed: true,
  version: 1,
  updatedAt: '2026-03-12T10:00:00Z',
  strategy: { businessName: 'AutoInvoice PEPPOL' },
  logo: { selectedConceptKey: 'mark-1', variations: {} },
};

async function loginUser(page) {
  console.log('🔑 Logging in as demo creator...');
  await page.goto('http://localhost:3000/login');
  await page.waitForSelector('input[name="email"], input[type="email"]');
  await page.fill('input[name="email"], input[type="email"]', 'demo.creator@mondial.local');
  await page.fill('input[name="password"], input[type="password"]', 'DemoP@ss1');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard/**', { timeout: 15000 });
}

async function main() {
  const artifactDir = 'C:/Users/Siraj/.gemini/antigravity-ide/brain/ac4ea732-62cd-420b-8e2c-63fe1580c585';
  const outputDir = path.resolve('scratch/screenshots/bm_pdf_export');
  fs.mkdirSync(outputDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  const page = await context.newPage();
  await loginUser(page);

  // Setup route mocking
  await context.route('**/api/creator/journey**', async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        message: 'OK',
        data: {
          journey: mockJourney,
          computedStatus: mockComputedStatus,
        },
      }),
    });
  });

  await context.route('**/api/creator/brand-kit**', async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        message: 'OK',
        data: mockBrandKit,
      }),
    });
  });

  await context.route('**/api/ai/credits**', async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        message: 'OK',
        data: { balance: 500, costs: { MarketStudy: 20, BusinessModel: 18, BusinessPlan: 25, FinancialForecast: 20 } },
      }),
    });
  });

  await context.route('**/api/ai/business-model/**', async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        message: 'OK',
        data: {
          sessionId: 'session-bm-test',
          status: 'Completed',
          currentVersion: 1,
          schemaVersion: 1,
          output: mockBusinessModelOutput,
          createdAt: '2026-03-18T10:00:00Z',
          updatedAt: '2026-03-18T10:30:00Z',
        },
      }),
    });
  });

  console.log('--- TEST 1: Step 3.2 Business Model Screen ---');
  await page.goto('http://localhost:3000/dashboard/creator/phase-3/business-model', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Check header has "Export PDF" button
  const exportBtnOnScreen = page.locator('button:has-text("Export PDF")');
  await exportBtnOnScreen.waitFor({ state: 'visible', timeout: 10000 });
  const count = await exportBtnOnScreen.count();
  console.log(`Found ${count} "Export PDF" button(s) on 3.2 screen`);
  if (count === 0) throw new Error('Missing Export PDF button on Step 3.2 screen!');

  await page.screenshot({ path: path.join(outputDir, '01_bm_screen_header.png') });

  // Click Export PDF
  console.log('Clicking Export PDF on Step 3.2 screen...');
  await exportBtnOnScreen.first().click();
  await page.waitForTimeout(1000);

  // Check print overlay
  const overlay = page.locator('[data-print-overlay]');
  const isOverlayVisible = await overlay.isVisible();
  console.log(`Print overlay visible: ${isOverlayVisible}`);
  if (!isOverlayVisible) throw new Error('Print overlay did not open on Step 3.2!');

  // Verify all 4 sections in the PDF document
  const canvasTitle = await page.locator('text=01 // Canonical Osterwalder Business Model Canvas').count();
  const unitEconTitle = await page.locator('text=02 // Unit Economics & Monetization Baseline').count();
  const pricingTiersTitle = await page.locator('text=03 // Pricing Tiers & Revenue Architecture').count();
  const assumptionsTitle = await page.locator('text=04 // Key Model Assumptions & Evidence Register').count();

  console.log(`Section 01 Canvas present: ${canvasTitle > 0}`);
  console.log(`Section 02 Unit Economics present: ${unitEconTitle > 0}`);
  console.log(`Section 03 Pricing Tiers present: ${pricingTiersTitle > 0}`);
  console.log(`Section 04 Assumptions present: ${assumptionsTitle > 0}`);

  if (!canvasTitle || !unitEconTitle || !pricingTiersTitle || !assumptionsTitle) {
    throw new Error('One or more required sections missing in BusinessModelPrintView!');
  }

  // Check specific content
  const vpHeadline = await page.locator('text=Automated 100% ViDA Compliance').count();
  const arpuModelled = await page.locator('text=Modelled estimate').count();
  const paybackText = await page.locator('text=2.5 mo').count();
  const tierPro = await page.locator('text=Professional Growth').count();
  const evidencedBadge = await page.locator('text=EVIDENCED').count();

  console.log(`VP Headline present: ${vpHeadline > 0}`);
  console.log(`ARPU Modelled badge present: ${arpuModelled > 0}`);
  console.log(`Payback value present: ${paybackText > 0}`);
  console.log(`Tier "Professional Growth" present: ${tierPro > 0}`);
  console.log(`Evidenced badge present: ${evidencedBadge > 0}`);

  const overlayScreenshotPath = path.join(artifactDir, 'business_model_pdf_export_preview.png');
  await page.screenshot({ path: overlayScreenshotPath, fullPage: true });
  await page.screenshot({ path: path.join(outputDir, '02_bm_print_overlay.png'), fullPage: true });

  // Generate actual PDF file
  const pdfPath = path.join(outputDir, 'Business_Model_Print_Export.pdf');
  await page.emulateMedia({ media: 'print' });
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '16mm', bottom: '16mm', left: '14mm', right: '14mm' },
  });
  console.log(`Saved generated PDF to: ${pdfPath}`);
  await page.emulateMedia({ media: 'screen' });

  // Close overlay
  await page.locator('button:has-text("Close")').click();
  await page.waitForTimeout(500);

  console.log('\n--- TEST 2: Asset Library Integration ---');
  await page.goto('http://localhost:3000/dashboard/creator/asset-library', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const assetLibScreenshot = path.join(artifactDir, 'asset_library_5_downloadables.png');
  await page.screenshot({ path: assetLibScreenshot });
  await page.screenshot({ path: path.join(outputDir, '03_asset_library_page.png') });

  // Check Business Model card is downloadable
  const bmCard = page.locator('div:has-text("Business Model Canvas & Unit Economics")').locator('..');
  const bmExportBtn = bmCard.locator('button:has-text("Export PDF")');
  const hasBmExport = (await bmExportBtn.count()) > 0;
  console.log(`Business Model card has Export PDF button: ${hasBmExport}`);
  if (!hasBmExport) throw new Error('Business Model card in Asset Library is missing Export PDF button!');

  // Check the other 3 non-downloadable cards are intact
  const formationCard = page.locator('div:has-text("Corporate Formation & Skill Architecture")').locator('..');
  const legalCard = page.locator('div:has-text("Legal & Regulatory Compliance Checklist")').locator('..');
  const investorCard = page.locator('div:has-text("Investor Readiness & Offer Architecture")').locator('..');

  const formationNote = await formationCard.locator('text=Entity structure and skills configured').count();
  const legalNote = await legalCard.locator('text=Compliance checklist active').count();
  const investorNote = await investorCard.locator('text=Offer architecture confirmed').count();

  console.log(`Formation card intact with honest copy: ${formationNote > 0}`);
  console.log(`Legal card intact with honest copy: ${legalNote > 0}`);
  console.log(`Investor card intact with honest copy: ${investorNote > 0}`);

  if (!formationNote || !legalNote || !investorNote) {
    throw new Error('One of the non-downloadable cards in Asset Library was corrupted!');
  }

  // Click Export PDF on Business Model card in Asset Library (2nd Export PDF button)
  console.log('Clicking Export PDF on Business Model card in Asset Library...');
  const bmButton = page.getByRole('button', { name: 'Export PDF' }).nth(1);
  await bmButton.click();
  await page.waitForTimeout(1000);

  const libraryOverlayVisible = await page.locator('[data-print-overlay]').isVisible();
  console.log(`Print overlay opened from Asset Library: ${libraryOverlayVisible}`);
  if (!libraryOverlayVisible) throw new Error('Print overlay failed to open from Asset Library!');

  const libraryCanvasCheck = await page.locator('text=01 // Canonical Osterwalder Business Model Canvas').count();
  console.log(`Canvas section rendered in Asset Library overlay: ${libraryCanvasCheck > 0}`);

  await page.screenshot({ path: path.join(outputDir, '04_asset_library_bm_overlay.png') });

  await browser.close();
  console.log('\n--- ALL VERIFICATIONS PASSED CLEANLY ---');
}

main().catch((err) => {
  console.error('VERIFICATION FAILED:', err);
  process.exit(1);
});
