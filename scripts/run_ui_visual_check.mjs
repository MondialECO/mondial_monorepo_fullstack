import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1200 }
  });

  // Inject token in localStorage
  await context.addInitScript(() => {
    localStorage.setItem('token', 'mock-creator-token');
    localStorage.setItem('user', JSON.stringify({
      id: 'creator_123',
      name: 'Elena Rostova',
      email: 'creator@mondial.eco',
      role: 'CREATOR',
      roles: ['CREATOR'],
      onboardingPhase: 3,
      onboarding: { phase: 3 }
    }));
  });

  // Mock API routes
  await context.route('**/*', async (route) => {
    const url = route.request().url();
    if (!url.includes('.js') && !url.includes('.css') && !url.includes('.svg') && !url.includes('.woff') && !url.includes('/_next/')) {
      console.log('Intercepted:', url);
    }

    if (url.includes('/auth/refresh-token') || url.includes('/auth/refresh')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { token: 'mock-creator-token' }
        })
      });
    }

    if (url.includes('/auth/me')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'creator_123',
            name: 'Elena Rostova',
            email: 'creator@mondial.eco',
            role: 'CREATOR',
            roles: ['CREATOR'],
            onboardingPhase: 3,
            onboarding: { phase: 3 },
            Onboarding: { phase: 3 }
          }
        })
      });
    }

    if (url.includes('/profile/me') || url.includes('/profile')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'creator_123',
            name: 'Elena Rostova',
            quickStart: {
              completed: true,
              completedAt: '2026-09-01T00:00:00.000Z'
            }
          }
        })
      });
    }

    if (url.includes('/api/creator/journey/active-idea') || url.includes('/api/creator/ideas/active')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { ideaId: 'idea-123' }
        })
      });
    }

    if (url.includes('/api/creator/journey') && !url.includes('section-12')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: {
          'x-creator-idea-version': '1',
        },
        body: JSON.stringify({
          success: true,
          data: {
            journey: {
              id: 'journey-123',
              userId: 'creator_123',
              businessIdeaId: 'idea-123',
              activeIdeaId: 'idea-123',
              ideaVersion: 1,
              currentPhase: 3,
              currentStep: 6,
              project: {
                name: 'AutoInvoice AI',
                problem: 'SMB accounts teams waste 15+ hours weekly manually reviewing invoices.',
                solution: 'AutoInvoice AI automates document intake, reconciliation, and validation.',
                targetUser: 'Accounting teams & service agencies',
                country: 'France',
                category: 'B2B SaaS platform',
                sector: 'Fintech'
              },
              phase3Data: {
                businessPlanSessionId: 'bp-123',
                clarifierSessionId: 'clarifier-123',
                forecastSessionId: 'fc-123',
                formationGenerator: {
                  selectedType: 'SASU',
                  founderEquity: 100,
                  plannedRole: 'President',
                  youHave: [{ label: 'Full-stack Engineering' }, { label: 'Product Architecture' }],
                  youNeed: [{ label: 'Tax Legal Counsel' }, { label: 'B2B Outbound Sales' }]
                }
              }
            },
            computedStatus: {
              phase1: { status: 'completed', currentStep: 1 },
              phase2: { status: 'completed', currentStep: 12 },
              phase3: { status: 'in_progress', currentStep: 6 },
              phase4: { status: 'locked', currentStep: 1 },
              phase5: { status: 'locked', currentStep: 1 },
              phase6: { status: 'locked', currentStep: 1 }
            }
          }
        })
      });
    }

    if (url.includes('business-plan-section-12')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            summary: 'French legal roadmap: SASU corporate registration with Greffe, GDPR compliant records, and e-invoicing mandate preparation.',
            isPotentiallyOutdated: false,
            statutoryRequirements: [
              { title: 'Commercial Court Registration (RCS)' },
              { title: 'Corporate Bank Account & Capital Deposit' },
              { title: 'GDPR Processing Register (CNIL)' }
            ]
          }
        })
      });
    }

    if (url.includes('/ai/credits/balance') || url.includes('/credits')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            balance: 150,
            costs: { BusinessPlan: 25, BusinessPlanSectionRewrite: 5 }
          }
        })
      });
    }

    if (url.includes('/ai/business-plan/bp-123') || url.includes('/business-plan/bp-123')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            sessionId: 'bp-123',
            status: 'Completed',
            currentVersion: 1,
            output: {
              executiveSummary: {
                overview: 'AutoInvoice AI is an AI-powered financial workflow platform founded in France designed to eliminate manual invoice entry for growing SMBs and digital service firms.\n\nThe venture connects incoming mail, accounting portals, and validation workflows into a unified ledger with zero human transcription.',
                valueProposition: 'Automated 3-way matching and OCR reconciliation eliminating 90% of accounts payable overhead.',
                highlights: ['French e-invoicing compliance ready', 'Zero-setup accounting portal sync', 'Sub-second document parsing']
              },
              problemSolution: {
                problem: 'European service businesses receive hundreds of supplier invoices each month across disconnected email attachments and supplier portals, spending over 15 hours weekly on manual data entry and reconciliation errors.',
                solution: 'AutoInvoice AI provides an intelligent, continuous ingestion engine that automates document validation, extracts structured accounting records, and syncs directly with French regulatory accounting frameworks.'
              },
              marketAnalysis: {
                overview: 'The European accounts payable and invoice automation market is transitioning rapidly due to mandatory B2B electronic invoicing legislation.',
                targetSegments: ['Boutique service agencies (10-50 FTE)', 'Independent accounting firms across France'],
                marketSizeQualitative: 'High urgency driven by upcoming statutory e-invoicing compliance across European SMBs.',
                trends: ['Mandatory B2B e-invoicing laws', 'Integration of generative validation engines']
              },
              competitorAnalysis: {
                overview: 'The market consists of legacy enterprise ERPs with heavy setup costs and fragmented point tools with limited local statutory compliance.',
                competitors: [
                  {
                    name: 'Legacy Enterprise ERPs',
                    positioning: 'High-cost ERP accounting suites',
                    strengths: ['Deep enterprise breadth'],
                    weaknesses: ['Complex onboarding', 'Expensive licensing'],
                    ourAdvantage: 'Lightweight setup with purpose-built French compliance'
                  },
                  {
                    name: 'Generic Spreadsheets & Email',
                    positioning: 'Manual ad-hoc coordination',
                    strengths: ['Zero software cost'],
                    weaknesses: ['High error rate', 'No audit trail'],
                    ourAdvantage: 'Fully automated parsing with verified audit logging'
                  }
                ]
              },
              revenueModel: {
                summary: 'Tiered subscription software model based on monthly invoice processing volume and connected team seats.',
                revenueStreams: [
                  { name: 'Growth SaaS Tier', description: 'Up to 500 invoices/month for SMBs' },
                  { name: 'Agency Pro Tier', description: 'Unlimited reconciliation for multi-client agencies' }
                ],
                pricingStrategy: 'Usage-indexed monthly recurring subscriptions',
                keyMetrics: ['MRR Growth', 'Net Revenue Retention', 'Gross Margin > 80%']
              },
              goToMarket: {
                strategy: 'Direct outbound outreach and product-led trials targeting French accounting advisors and boutique digital agencies.',
                channels: ['Direct outbound to boutique agencies', 'Accounting firm referral partnerships'],
                phases: [
                  { name: 'Phase 1: Founder Pilots', description: '20 initial French SMB test accounts' },
                  { name: 'Phase 2: Self-Serve Rollout', description: 'Public launch with instant onboarding' }
                ]
              },
              operationsPlan: {
                overview: 'Cloud-native architecture operating on ISO-certified European infrastructure with automated CI/CD and strict tenant isolation.',
                keyActivities: ['Model fine-tuning', 'Accounting API connectors', 'Statutory compliance audits'],
                resources: ['European cloud hosting', 'OCR processing pipelines'],
                milestones: [
                  { title: 'Closed Beta', description: 'Complete 20 customer pilot tests with 99% accuracy', timeframe: 'Month 1-3' },
                  { title: 'Commercial Release', description: 'Launch paid self-serve tiers across France', timeframe: 'Month 4-6' },
                  { title: 'EU Expansion', description: 'Deploy localized compliance connectors for DACH & Benelux', timeframe: 'Month 7-12' }
                ]
              },
              risks: [
                {
                  category: 'Regulatory Timelines',
                  description: 'Adjustments in French national e-invoicing enforcement schedules',
                  likelihood: 'medium',
                  impact: 'medium',
                  mitigation: 'Build modular connectors adaptable to shifting statutory specs'
                },
                {
                  category: 'Adoption Inertia',
                  description: 'SMBs hesitant to switch away from established manual workflows',
                  likelihood: 'low',
                  impact: 'high',
                  mitigation: 'Offer 14-day zero-risk trial with instant sample invoice proof-of-value'
                }
              ]
            }
          }
        })
      });
    }

    if (url.includes('/ai/forecast') || url.includes('/forecast')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            output: {
              revenueForecast: {
                currency: 'EUR',
                monthly: [
                  { month: 1, amount: 15000 },
                  { month: 12, amount: 45000 },
                  { month: 13, amount: 65000 },
                  { month: 24, amount: 120000 },
                  { month: 25, amount: 150000 },
                  { month: 36, amount: 280000 }
                ]
              },
              costForecast: {
                currency: 'EUR',
                monthly: [
                  { month: 1, fixedCosts: 12000, variableCosts: 2000 },
                  { month: 12, fixedCosts: 18000, variableCosts: 4000 },
                  { month: 13, fixedCosts: 25000, variableCosts: 8000 },
                  { month: 24, fixedCosts: 35000, variableCosts: 15000 },
                  { month: 25, fixedCosts: 50000, variableCosts: 25000 },
                  { month: 36, fixedCosts: 70000, variableCosts: 40000 }
                ]
              },
              breakEvenAnalysis: { breakEvenMonth: 8 }
            }
          }
        })
      });
    }

    if (url.includes('/idea-clarifier/clarifier-123') || url.includes('/clarifier/clarifier-123')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            sessionId: 'clarifier-123',
            status: 'Completed',
            output: {
              problemDefinition: {
                statement: 'European service businesses receive hundreds of supplier invoices each month across disconnected email attachments and supplier portals, spending over 15 hours weekly on manual data entry and reconciliation errors.',
                painPoints: ['Manual invoice entry consumes 15+ hours weekly', 'High rate of duplicate payment errors']
              },
              proposedSolution: {
                summary: 'AutoInvoice AI provides an intelligent, continuous ingestion engine that automates document validation, extracts structured accounting records, and syncs directly with French regulatory accounting frameworks.',
                valueProposition: 'End-to-end automated invoice reconciliation in seconds.'
              },
              targetAudience: {
                primarySegment: 'Accounting teams & service agencies',
                sizeQualitative: 'Over 200,000 SMBs across France'
              }
            }
          }
        })
      });
    }

    if (url.includes(':5093') || url.includes('/api/')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: {} })
      });
    }

    // Default passthrough for static assets
    await route.continue();
  });

  const page = await context.newPage();
  console.log('Navigating to http://localhost:3000/dashboard/creator/phase-3/business-plan?ideaId=idea-123 ...');
  
  await page.goto('http://localhost:3000/dashboard/creator/phase-3/business-plan?ideaId=idea-123', {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });

  console.log('Current URL:', page.url());
  
  // Wait for the business plan flow to render
  await page.waitForSelector('text=Your business plan', { timeout: 15000 });
  console.log('Found "Your business plan" heading!');

  // Take top overview screenshot
  await page.screenshot({ path: 'scripts/ui_render_top.png', fullPage: false });
  console.log('Saved scripts/ui_render_top.png');

  // Scroll to Chapter 02 (Problem & Solution) and screenshot
  const ch2 = page.locator('#chapter-02');
  if (await ch2.count() > 0) {
    await ch2.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'scripts/ui_render_chapter_02_problem_solution.png', fullPage: false });
    console.log('Saved scripts/ui_render_chapter_02_problem_solution.png');

    const ch2Text = await ch2.innerText();
    console.log('\n--- CHAPTER 02 RENDERED TEXT ---');
    console.log(ch2Text);
  }

  // Scroll to Chapter 07 (Financial Plan) and screenshot
  const ch7 = page.locator('#chapter-07');
  if (await ch7.count() > 0) {
    await ch7.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'scripts/ui_render_chapter_07_financials.png', fullPage: false });
    console.log('Saved scripts/ui_render_chapter_07_financials.png');

    const ch7Text = await ch7.innerText();
    console.log('\n--- CHAPTER 07 RENDERED TEXT ---');
    console.log(ch7Text);
  }

  // Full page screenshot
  await page.screenshot({ path: 'scripts/ui_render_fullpage.png', fullPage: true });
  console.log('Saved scripts/ui_render_fullpage.png');

  await browser.close();
}

main().catch(err => {
  console.error('Error running UI check:', err);
  process.exit(1);
});
