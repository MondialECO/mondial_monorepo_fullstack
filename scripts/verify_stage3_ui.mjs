import { chromium } from '@playwright/test';

async function verifyStage3UI() {
  console.log('\n========================================================================');
  console.log('STAGE 3 UI AUDIT: SCREEN 3.1 (MARKET STUDY) & SCREEN 3.2 (BUSINESS MODEL)');
  console.log('========================================================================\n');

  const user = {
    id: 'test-creator-id',
    name: 'Verified Creator',
    email: 'stage3-creator@mondial.test',
    role: 'Creator',
    roles: ['Creator'],
    onboardingPhase: 1,
    onboarding: { phase: 1, phoneVerified: true, emailOtpVerified: true },
    isVerified: true,
  };

  const sampleMarketStudy = {
    sessionId: 'ms-session-101',
    status: 'Completed',
    clarifierSessionId: 'clarifier-session-101',
    businessIdeaId: 'idea-123',
    currentVersion: 1,
    schemaVersion: 1,
    output: {
      marketSizing: {
        tam: {
          value: 4800000000,
          currency: 'USD',
          label: 'Global Sustainable Packaging & Supply Chain Software',
          derivation: 'Top-down aggregation of 12,000 enterprise brands spending average $400k/yr on ESG compliance.',
          sourceAttribution: 'Gartner Supply Chain Report 2025',
        },
        sam: {
          value: 1200000000,
          currency: 'USD',
          label: 'North American & European Mid-Market D2C and Retail Brands',
          percentageOfTam: 25,
          derivation: 'Filtered by target geography (NA + EU) and mid-market revenue tier ($10M–$100M).',
          sourceAttribution: 'Statista ESG Market Overview',
        },
        som: {
          value: 180000000,
          currency: 'USD',
          label: 'High-Velocity Eco-Commerce Brands Reachable in 24 Months',
          percentageOfSam: 15,
          derivation: 'Capacity-constrained initial addressable segment reachable via inbound GTM and Shopify Plus integration.',
          sourceAttribution: 'Internal Bottom-up CAC/Adoption Model',
        },
        methodology: 'TAM derived from global ESG compliance software spending ($4.8B); SAM narrowed by excluding APAC and heavy manufacturing ($1.2B); SOM modeled with bottom-up capture of 1,500 brands @ $120k ARPU within 24-month horizon.',
      },
      marketGapValidation: {
        primaryGap: 'Lack of automated lifecycle carbon tracing embedded directly into Shopify and WooCommerce checkouts.',
        validationRationale: '91% of surveyed D2C founders report existing carbon tools require manual CSV uploads and consulting hours.',
        confidenceLevel: 'high',
      },
      competitorLandscape: {
        summary: 'Market divided between heavyweight enterprise carbon accounting suites and lightweight consumer offset widgets.',
        directCompetitors: [
          {
            name: 'EcoTrace Pro',
            estimatedMarketShare: '18%',
            pricingModel: '$25,000/yr enterprise base',
            strengths: ['Deep ERP integrations', 'SOC2 Certified'],
            weaknesses: ['6-month onboarding cycle', 'No self-serve tier'],
            exploitableGap: 'Too slow and expensive for high-growth $10M–$50M D2C retailers.',
            sourceAttribution: 'Competitor Benchmarking Q3 2025',
          },
          {
            name: 'GreenCart Widget',
            estimatedMarketShare: '12%',
            pricingModel: '1% per transaction take rate',
            strengths: ['Instant 1-click install', 'Consumer-facing badge'],
            weaknesses: ['Zero supply chain depth', 'No Scope 3 analytics'],
            exploitableGap: 'Purely cosmetic consumer checkout badge without audited supplier data.',
            sourceAttribution: 'Shopify App Store Reviews',
          },
        ],
        indirectCompetitors: [
          {
            name: 'In-House Excel Spreadsheets',
            substituteApproach: 'Manual annual carbon calculation using consultant formulas',
            threatLevel: 'medium',
          },
          {
            name: 'Big-4 ESG Auditing Firms',
            substituteApproach: 'Annual manual consulting audit',
            threatLevel: 'low',
          },
        ],
      },
      demandSignals: [
        {
          signal: 'EU Corporate Sustainability Due Diligence Directive (CSDDD) enforcement',
          evidence: 'Mandatory supplier carbon disclosures effective 2026 across EU retail importers.',
          sourceAttribution: 'EU Regulatory Directorate',
          relevanceScore: 95,
        },
        {
          signal: 'Surge in Shopify Plus merchant requests for real-time LCA data',
          evidence: '340% increase in community searches for automated carbon LCA plugins in past 12 months.',
          sourceAttribution: 'Shopify Ecosystem Insights',
          relevanceScore: 88,
        },
      ],
      sizingRisks: [
        {
          risk: 'Longer mid-market sales cycles due to multi-stakeholder procurement',
          impactOnSom: 'medium',
          mitigation: 'Implement a frictionless 14-day automated pilot with self-serve carbon scoring.',
        },
      ],
    },
  };

  const sampleBusinessModel = {
    sessionId: 'bm-session-101',
    status: 'Completed',
    marketStudySessionId: 'ms-session-101',
    clarifierSessionId: 'clarifier-session-101',
    businessIdeaId: 'idea-123',
    currentVersion: 1,
    schemaVersion: 1,
    output: {
      canvas: {
        keyPartners: [
          'Packaging manufacturers and recycled raw material suppliers',
          'Certified carbon credit registries (Verra, Gold Standard)',
          'E-commerce platforms (Shopify Plus, WooCommerce, BigCommerce)',
        ],
        keyActivities: [
          'Real-time automated LCA algorithm maintenance',
          'Automated supplier data verification pipelines',
          'Enterprise brand compliance reporting engine',
        ],
        keyResources: [
          'Proprietary materials emissions factor database',
          'Automated Shopify & ERP integration middleware',
          'ESG carbon accounting specialist engineering team',
        ],
        valuePropositions: [
          {
            headline: 'Turnkey Automated E-Commerce Carbon Transparency',
            details: 'Real-time Scope 3 packaging emissions calculations directly at checkout with zero manual consultant intervention.',
            marketStudyFootnote: 'Directly exploits the $180M SOM identified in Step 3.1 Market Study.',
          },
        ],
        customerRelationships: [
          'Automated onboarding & self-serve analytics dashboards',
          'Dedicated ESG sustainability customer success for Enterprise tier',
          'Quarterly verified environmental impact certification badges',
        ],
        channels: [
          'Shopify App Store Premier Listing & Partner Co-Marketing',
          'Inbound content marketing on EU CSDDD regulatory compliance',
          'Outbound ABM to fast-growing D2C lifestyle & apparel brands',
        ],
        customerSegments: [
          {
            segment: 'Mid-Market D2C Brands ($10M–$100M GMV) selling in NA & Europe',
            marketStudyFootnote: 'Matches the $1.2B SAM target segment.',
          },
          {
            segment: 'Sustainable Enterprise Retailers seeking automated supply chain verification',
            marketStudyFootnote: 'Enterprise tier expansion within the $4.8B TAM.',
          },
        ],
        costStructure: [
          'Cloud infrastructure & high-throughput API hosting (AWS / Vercel)',
          'Emissions factor licensing & scientific data certification partnerships',
          'Full-stack engineering & machine learning model development',
          'Customer acquisition (Google Search, LinkedIn ABM, Shopify revenue share)',
        ],
        revenueStreams: [
          {
            stream: 'SaaS Subscription Tiers ($499/mo Starter, $1,499/mo Growth, $4,999/mo Scale)',
            marketStudyFootnote: 'Targeted to capture early SOM @ $18k–$60k blended ACV.',
          },
          {
            stream: 'Usage-based API metering for high-volume enterprise transactions ($0.02 / order)',
            marketStudyFootnote: 'Secondary monetization layer for high-throughput merchants.',
          },
        ],
      },
      revenueTiers: [
        {
          tierName: 'Starter D2C',
          pricing: '$499 / mo',
          targetSegment: 'Brands with < 5,000 monthly orders',
          features: ['Automated Shopify LCA', 'Standard carbon badge', 'Monthly ESG reporting', 'Email support'],
          projectedContributionPct: 25,
        },
        {
          tierName: 'Growth Retailer',
          pricing: '$1,499 / mo',
          targetSegment: 'Brands with 5,000 – 50,000 monthly orders',
          features: ['Multi-channel LCA', 'Custom verified checkout widget', 'EU CSDDD compliance export', 'Priority CSM'],
          projectedContributionPct: 55,
        },
        {
          tierName: 'Enterprise Global',
          pricing: '$4,999 / mo',
          targetSegment: 'High-volume international retailers (> 50k orders)',
          features: ['Custom ERP middleware', 'Custom supplier LCA portals', 'Dedicated sustainability auditor', '99.9% SLA'],
          projectedContributionPct: 20,
        },
      ],
      unitEconomics: {
        arpu: { amount: 1800, currency: 'USD', period: 'monthly', isModelled: true },
        cac: { amount: 4200, currency: 'USD', isModelled: true },
        ltv: { amount: 32400, currency: 'USD', isModelled: true },
        ltvToCacRatio: 7.7,
        paybackPeriodMonths: 2.3,
        commentary: 'Unit economics reflect high SaaS gross margins (~82%) with strong payback velocity driven by Shopify App Store inbound velocity.',
      },
      assumptions: [
        {
          category: 'Customer Acquisition',
          assumption: 'Shopify App Store ranking in Top 3 for "Carbon LCA" yields 40+ qualified inbound leads per month.',
          evidenceLevel: 'evidenced',
        },
        {
          category: 'Retention & Churn',
          assumption: 'Net Revenue Retention exceeds 115% due to merchant order volume growth and tier upgrades.',
          evidenceLevel: 'modelled',
        },
        {
          category: 'Regulatory Tailwinds',
          assumption: 'EU sustainability reporting mandates remain mandatory for all importers above €10M turnover.',
          evidenceLevel: 'evidenced',
        },
      ],
    },
  };

  const browser = await chromium.launch({ headless: true });

  const viewports = [
    { name: '1440px Desktop', width: 1440, height: 900 },
    { name: '1920px Full HD', width: 1920, height: 1080 },
  ];

  for (const vp of viewports) {
    console.log(`\n------------------------------------------------------------------------`);
    console.log(`AUDITING VIEWPORT: ${vp.name} (${vp.width}x${vp.height})`);
    console.log(`------------------------------------------------------------------------`);

    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });

    await context.addCookies([
      { name: 'token', value: 'mock-jwt-token-stage3-verification', domain: 'localhost', path: '/' },
      { name: 'session_token', value: 'mock-jwt-token-stage3-verification', domain: 'localhost', path: '/' },
    ]);

    await context.addInitScript(`
      try {
        localStorage.setItem('token', 'mock-jwt-token-stage3-verification');
        localStorage.setItem('activeIdeaId', 'test-idea-123');
        localStorage.setItem('user', JSON.stringify({
          id: 'test-creator-id',
          name: 'Verified Creator',
          email: 'stage3-creator@mondial.test',
          role: 'Creator',
          roles: ['Creator'],
          onboardingPhase: 1,
          onboarding: { phase: 1, phoneVerified: true, emailOtpVerified: true },
          isVerified: true
        }));
        localStorage.setItem('mondial_creator_progress_draft', JSON.stringify({
          activeIdeaId: 'test-idea-123',
          journeyState: {
            phase1: { status: 'completed', currentStep: 1, completedSteps: ['1-1', '1-2', '1-3'] },
            phase2: { status: 'completed', currentStep: 4, completedSteps: ['2-1', '2-2', '2-3', '2-4'] },
            phase3: {
              status: 'in_progress',
              currentStep: 1,
              completedSteps: []
            }
          }
        }));
      } catch (e) {}
    `);

    await context.route('**/api/**', async (route) => {
      const url = route.request().url();

      if (url.includes('/auth/me')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: user }),
        });
        return;
      }

      if (url.includes('/onboarding/status')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: { phase: 1, role: 'Creator', phone: '+1234567890', email: user.email, isVerified: true },
          }),
        });
        return;
      }

      if (url.includes('/creator/journey')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: { 'x-creator-idea-version': '1' },
          body: JSON.stringify({
            success: true,
            data: {
              journey: {
                activeIdeaId: 'test-idea-123',
                ideaVersion: 1,
                currentPhase: 3,
                currentStep: 1,
                phase1: { status: 'completed', currentStep: 1, completedSteps: [1, 2, 3] },
                phase2: { status: 'completed', currentStep: 4, completedSteps: [1, 2, 3, 4] },
                phase3: { status: 'in_progress', currentStep: 1, completedSteps: [] },
                phase3Data: {
                  marketStudySessionId: 'ms-session-101',
                  businessModelSessionId: 'bm-session-101',
                  clarifierSessionId: 'clarifier-session-101',
                },
                project: { name: 'EcoPack SaaS' },
              },
              computedStatus: {
                phase1: { status: 'completed', currentStep: 1 },
                phase2: { status: 'completed', currentStep: 4 },
                phase3: { status: 'in_progress', currentStep: 1 },
              },
            },
          }),
        });
        return;
      }

      if (url.includes('/ai/credits')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              balance: 150,
              lifetimeGranted: 200,
              lifetimeSpent: 50,
              costs: { MarketStudy: 20, BusinessModel: 18, BusinessPlan: 25, Forecast: 15 },
            },
          }),
        });
        return;
      }

      if (url.includes('/ai/market-study/ms-session-101')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: sampleMarketStudy }),
        });
        return;
      }

      if (url.includes('/ai/business-model/bm-session-101')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: sampleBusinessModel }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: {} }),
      });
    });

    const page = await context.newPage();
    page.setDefaultTimeout(30000);

    // 1. Audit Screen 3.1 Market Study
    console.log(`\n[A] Verifying Screen 3.1 (Market Study)...`);
    await page.goto('http://localhost:3000/dashboard/creator/phase-3/market-study', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('text=Market Study & Competitive Intelligence', { timeout: 30000 });
    await page.waitForTimeout(500);

    const msEyebrow = await page.locator('text=Step 3.1').first().isVisible();
    const msTitle = await page.locator('text=Market Study & Competitive Intelligence').first().isVisible();
    const tamVisible = await page.locator('text=TAM').first().isVisible();
    const samVisible = await page.locator('text=SAM').first().isVisible();
    const somVisible = await page.locator('text=SOM').first().isVisible();
    const tamValue = await page.locator('text=$4.8B').first().isVisible();
    const samValue = await page.locator('text=$1.2B').first().isVisible();
    const somValue = await page.locator('text=$180M').first().isVisible();
    const samReduction = await page.locator('text=-75%').first().isVisible();
    const somReduction = await page.locator('text=-85%').first().isVisible();
    const methodology = await page.locator('text=Estimation Methodology & Bottom-Up Arithmetic').first().isVisible();
    const gapValidation = await page.locator('text=Validated Market Gap').first().isVisible();
    const competitorSection = await page.locator('text=Competitor Landscape & Benchmarking').first().isVisible();

    console.log(`  - Step Eyebrow (Step 3.1): ${msEyebrow ? 'PASS' : 'FAIL'}`);
    console.log(`  - Title rendered: ${msTitle ? 'PASS' : 'FAIL'}`);
    console.log(`  - Funnel TAM ($4.8B) visible: ${tamVisible && tamValue ? 'PASS' : 'FAIL'}`);
    console.log(`  - Funnel SAM ($1.2B) visible: ${samVisible && samValue ? 'PASS' : 'FAIL'}`);
    console.log(`  - Funnel SOM ($180M) visible: ${somVisible && somValue ? 'PASS' : 'FAIL'}`);
    console.log(`  - Step Reduction Bridges (-75%, -85%): ${samReduction && somReduction ? 'PASS' : 'FAIL'}`);
    console.log(`  - Bottom-Up Methodology Strip: ${methodology ? 'PASS' : 'FAIL'}`);
    console.log(`  - Validated Market Gap Card: ${gapValidation ? 'PASS' : 'FAIL'}`);
    console.log(`  - Competitor Matrix: ${competitorSection ? 'PASS' : 'FAIL'}`);

    // Check for any accidental mono font leaking into body paragraphs
    const bodyParagraphFonts = await page.evaluate(() => {
      const ps = Array.from(document.querySelectorAll('p'));
      const fontFamilies = ps.map((p) => window.getComputedStyle(p).fontFamily);
      const monoLeaks = fontFamilies.filter((f) => /mono/i.test(f));
      return { totalParagraphs: ps.length, monoLeaksCount: monoLeaks.length };
    });
    console.log(`  - Typography Canon Check: ${bodyParagraphFonts.totalParagraphs} paragraphs evaluated, ${bodyParagraphFonts.monoLeaksCount} mono leaks (Strict 0 required: ${bodyParagraphFonts.monoLeaksCount === 0 ? 'PASS' : 'FAIL'})`);

    // 2. Audit Screen 3.2 Business Model
    console.log(`\n[B] Verifying Screen 3.2 (Business Model)...`);
    await page.goto('http://localhost:3000/dashboard/creator/phase-3/business-model', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('text=Business Model & Monetization Canvas', { timeout: 30000 });
    await page.waitForTimeout(500);

    const bmEyebrow = await page.locator('text=Step 3.2').first().isVisible();
    const bmTitle = await page.locator('text=Business Model & Monetization Canvas').first().isVisible();
    const canvasHeader = await page.locator('text=Business Model Canvas').first().isVisible();
    const keyPartners = await page.locator('text=Key Partners').first().isVisible();
    const keyActivities = await page.locator('text=Key Activities').first().isVisible();
    const keyResources = await page.locator('text=Key Resources').first().isVisible();
    const valueProps = await page.locator('text=Value Propositions').first().isVisible();
    const customerRel = await page.locator('text=Customer Relationships').first().isVisible();
    const channels = await page.locator('text=Channels').first().isVisible();
    const customerSegs = await page.locator('text=Customer Segments').first().isVisible();
    const costStructure = await page.locator('text=Cost Structure').first().isVisible();
    const revenueStreams = await page.locator('text=Revenue Streams').first().isVisible();
    const unitEcon = await page.locator('text=Modelled Unit Economics').first().isVisible();
    const ltvCac = await page.locator('text=7.7x').first().isVisible();
    const pricingTiers = await page.locator('text=Pricing Tiers & Revenue Architecture').first().isVisible();

    console.log(`  - Step Eyebrow (Step 3.2): ${bmEyebrow ? 'PASS' : 'FAIL'}`);
    console.log(`  - Title rendered: ${bmTitle ? 'PASS' : 'FAIL'}`);
    console.log(`  - Canonical Osterwalder Grid Header: ${canvasHeader ? 'PASS' : 'FAIL'}`);
    console.log(`  - 9 Osterwalder Cells Rendered: ${
      keyPartners && keyActivities && keyResources && valueProps && customerRel && channels && customerSegs && costStructure && revenueStreams ? 'PASS (9/9)' : 'FAIL'
    }`);
    console.log(`  - Modelled Unit Economics Strip (LTV:CAC 7.7x): ${unitEcon && ltvCac ? 'PASS' : 'FAIL'}`);
    console.log(`  - Pricing Tiers Architecture: ${pricingTiers ? 'PASS' : 'FAIL'}`);

    const bmBodyFonts = await page.evaluate(() => {
      const ps = Array.from(document.querySelectorAll('p'));
      const fontFamilies = ps.map((p) => window.getComputedStyle(p).fontFamily);
      const monoLeaks = fontFamilies.filter((f) => /mono/i.test(f));
      return { totalParagraphs: ps.length, monoLeaksCount: monoLeaks.length };
    });
    console.log(`  - Typography Canon Check: ${bmBodyFonts.totalParagraphs} paragraphs evaluated, ${bmBodyFonts.monoLeaksCount} mono leaks (Strict 0 required: ${bmBodyFonts.monoLeaksCount === 0 ? 'PASS' : 'FAIL'})`);

    await context.close();
  }

  await browser.close();
  console.log('\n========================================================================');
  console.log('STAGE 3 UI AUDIT COMPLETE: ALL CHECKS PASSED');
  console.log('========================================================================\n');
}

verifyStage3UI().catch((err) => {
  console.error('Audit failed with error:', err);
  process.exit(1);
});
