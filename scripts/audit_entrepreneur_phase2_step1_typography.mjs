import { chromium } from '@playwright/test';
import fs from 'fs';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  // Set mock localStorage for auth
  await context.addInitScript(() => {
    const mockUser = {
      id: 'user_ent_123',
      name: 'Elena Rostova',
      email: 'elena@mondial.eco',
      role: 'ENTREPRENEUR',
      roles: ['ENTREPRENEUR'],
      onboardingPhase: 2,
    };
    localStorage.setItem('token', 'mock-jwt-token');
    localStorage.setItem('auth_token', 'mock-jwt-token');
    localStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('mondial_token', 'mock-jwt-token');
  });

  await context.route('**/*', async (route) => {
    const url = route.request().url();
    if (!url.includes('/_next/') && !url.includes('.ico') && !url.includes('.png')) {
      console.log('REQUEST URL:', route.request().method(), url);
    }

    if (url.includes('/auth/me')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'user_ent_123',
            name: 'Elena Rostova',
            email: 'elena@mondial.eco',
            role: 'ENTREPRENEUR',
            roles: ['ENTREPRENEUR'],
            onboarding: { phase: 2 },
          },
        }),
      });
    }

    if (url.includes('/entrepreneur/progress') || url.includes('/current-phase') || url.includes('/progress')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          companyId: 'comp_123',
          currentPhase: 2,
          currentStep: 1,
          completedPhases: [1],
          completedSteps: [],
          phaseData: {
            __companyId: 'comp_123',
          },
        }),
      });
    }

    if (url.includes('/companies')) {
      if (url.includes('my') || url.endsWith('/companies') || url.endsWith('/companies/')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: 'comp_123',
                _id: 'comp_123',
                companyName: 'Verdant Bio-Packaging SAS',
                industry: 'Sustainable Packaging',
                legalStructure: 'SAS',
                currentPhase: 2,
                isActive: true,
              },
            ],
          }),
        });
      }

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          id: 'comp_123',
          _id: 'comp_123',
          companyName: 'Verdant Bio-Packaging SAS',
          legalName: 'Verdant Bio-Packaging SAS',
          registrationNumber: '98765432100012',
          legalStructure: 'SAS',
          incorporationDate: '2023-04-15',
          country: 'France',
          registeredAddress: '14 Rue de la Paix, 75002 Paris',
          nafCode: '22.22Z',
          currentPhase: 2,
          isActive: true,
        }),
      });
    }

    if (url.includes('/ai/credits')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            balance: 450,
            lifetimeGranted: 500,
            lifetimeSpent: 50,
          },
        }),
      });
    }

    return route.continue();
  });

  const page = await context.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  console.log('Navigating to http://localhost:3000/dashboard/entrepreneur/phase-2/step-1 ...');
  await page.goto('http://localhost:3000/dashboard/entrepreneur/phase-2/step-1', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  console.log('Current page URL:', page.url());
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log('Page body snippet:', bodyText.substring(0, 300));

  // Take screenshot for visual inspection
  const screenshotPath = 'C:/Users/Siraj/.gemini/antigravity-ide/brain/ac4ea732-62cd-420b-8e2c-63fe1580c585/entrepreneur_phase2_step1_rendered.png';
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Saved screenshot to ${screenshotPath}`);

  // Collect text nodes and inputs computed styles
  const analysis = await page.evaluate(() => {
    const nodes = [];

    // 1. Text nodes
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let current;

    while ((current = walker.nextNode())) {
      const text = current.textContent.trim();
      if (!text) continue;
      const el = current.parentElement;
      if (!el) continue;

      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;

      nodes.push({
        type: 'text',
        text: text.length > 60 ? text.substring(0, 57) + '...' : text,
        tagName: el.tagName.toLowerCase(),
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        fontFamily: style.fontFamily,
        lineHeight: style.lineHeight,
        letterSpacing: style.letterSpacing,
        textTransform: style.textTransform,
        color: style.color,
        className: el.className || '',
        containerWidth: Math.round(rect.width),
      });
    }

    // 2. Input and Textarea elements
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach((input) => {
      const style = window.getComputedStyle(input);
      const rect = input.getBoundingClientRect();
      nodes.push({
        type: 'input',
        text: `[Input: ${input.name || input.id || input.placeholder || input.type}] val="${input.value}"`,
        tagName: input.tagName.toLowerCase(),
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        fontFamily: style.fontFamily,
        lineHeight: style.lineHeight,
        letterSpacing: style.letterSpacing,
        textTransform: style.textTransform,
        color: style.color,
        className: input.className || '',
        containerWidth: Math.round(rect.width),
      });
    });

    const mainCard = document.querySelector('.bg-card');
    const infoPanel = document.querySelector('.bg-secondary');
    const pageContainer = document.querySelector('.max-w-\\[1072px\\]');

    const layout = {
      pageContainerWidth: pageContainer ? Math.round(pageContainer.getBoundingClientRect().width) : null,
      mainCardWidth: mainCard ? Math.round(mainCard.getBoundingClientRect().width) : null,
      infoPanelWidth: infoPanel ? Math.round(infoPanel.getBoundingClientRect().width) : null,
    };

    return { nodes, layout };
  });

  console.log('\n================ AUDIT SUMMARY ================');
  console.log(`Total visible text & input nodes: ${analysis.nodes.length}`);
  console.log('Layout dimensions:', JSON.stringify(analysis.layout, null, 2));

  const sizeMap = {};
  const familyMap = {};
  const roleBreakdown = [];

  for (const node of analysis.nodes) {
    sizeMap[node.fontSize] = (sizeMap[node.fontSize] || 0) + 1;
    familyMap[node.fontFamily] = (familyMap[node.fontFamily] || 0) + 1;
    roleBreakdown.push({
      size: node.fontSize,
      weight: node.fontWeight,
      family: node.fontFamily.split(',')[0].replace(/['"]/g, ''),
      transform: node.textTransform,
      tag: node.tagName,
      text: node.text,
      cls: node.className.slice(0, 45),
    });
  }

  console.log('\n--- FONT SIZE COUNTS ---');
  console.table(sizeMap);

  console.log('\n--- FONT FAMILY COUNTS ---');
  console.table(familyMap);

  console.log('\n--- COMPLETE NODE ROSTER ---');
  console.table(roleBreakdown);

  await browser.close();
}

main().catch(console.error);
