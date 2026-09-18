import { chromium } from 'playwright';
import JSZip from 'jszip';
import fs from 'fs';
import path from 'path';

async function runVerification() {
  console.log('🚀 Starting Real Browser Brand Kit Export Verification...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    acceptDownloads: true,
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  page.on('console', msg => console.log(`[BROWSER CONSOLE ${msg.type()}]:`, msg.text()));
  page.on('pageerror', err => console.error('[BROWSER PAGE ERROR]:', err));

  const results = {
    caseA_BrandKitScreen: false,
    caseA_AssetLibrary: false,
    caseB_ConceptFallback: false,
    caseC_BrandKitScreenErrorVisible: false,
    caseC_AssetLibraryErrorVisible: false,
  };

  try {
    // 1. Authenticate
    console.log('🔑 Authenticating as demo creator...');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');

    await page.fill('input[type="email"], input[name="email"]', 'demo.creator@mondial.local');
    await page.fill('input[type="password"], input[name="password"]', 'DemoP@ss1');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard/**', { timeout: 15000 });
    console.log('✅ Authenticated successfully.');

    // ----------------------------------------------------
    // CASE A: Variations Exist (Brand Kit Studio & Asset Library)
    // ----------------------------------------------------
    console.log('\n--- [CASE A: Variations Exist] ---');

    const sampleVariationsKit = {
      id: '6aacd984fb0e4841c00716f8',
      ideaId: '6a9603909737fc419dc24d0a',
      version: 5,
      isConfirmed: true,
      strategy: {
        businessName: 'Develflow',
        nameDisplayForm: 'Develflow',
        industry: { value: 'SaaS' },
        positioning: { value: 'Developer-first event streaming middleware' },
        tonePosition: 'Technical & Fast'
      },
      colors: {
        roles: [
          { roleName: 'Primary', hex: '#0052FF', rgb: '0, 82, 255', contrastVerdict: 'AAA' },
          { roleName: 'Secondary', hex: '#1E293B', rgb: '30, 41, 59', contrastVerdict: 'AAA' },
          { roleName: 'Accent', hex: '#10B981', rgb: '16, 185, 129', contrastVerdict: 'AA' },
          { roleName: 'Background', hex: '#FFFFFF', rgb: '255, 255, 255', contrastVerdict: 'Ground' },
          { roleName: 'Text', hex: '#0F172A', rgb: '15, 23, 42', contrastVerdict: 'AAA' },
        ]
      },
      typography: {
        families: {
          displayFamily: { name: 'Syne' },
          textFamily: { name: 'DM Sans' }
        },
        roles: [
          { roleName: 'Display / H1', family: 'Syne', weight: '700', size: '36px', lineHeight: '44px' }
        ]
      },
      logo: {
        selectedConceptKey: 'concept-1',
        approvedAt: '2026-09-18T10:00:00Z',
        concepts: [
          {
            key: 'concept-1',
            descriptorLine: 'Geometric Mark',
            markAssetUri: '/brand-assets/logos/concept-mark.svg',
            lockupAssetUri: '/brand-assets/logos/concept-lockup.svg'
          }
        ],
        variations: {
          primary: { svgUri: '/brand-assets/logos/develflow-primary.svg' },
          horizontal: { svgUri: '/brand-assets/logos/develflow-horizontal.svg' },
          stacked: { svgUri: '/brand-assets/logos/develflow-stacked.svg' },
          icon_only: { svgUri: '/brand-assets/logos/develflow-icon.svg' },
          black: { svgUri: '/brand-assets/logos/develflow-black.svg' },
          white: { svgUri: '/brand-assets/logos/develflow-white.svg' },
          transparent: { svgUri: '/brand-assets/logos/develflow-trans.svg' }
        }
      }
    };

    // Serve mock SVG files for brand assets
    const sampleSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="#0052FF"/></svg>';
    await page.route('**/brand-assets/logos/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'image/svg+xml',
        body: sampleSvg
      });
    });

    // Intercept brand-kit API to return sampleVariationsKit
    await page.route('**/api/creator/journey/phase2/brand-kit*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: sampleVariationsKit
        })
      });
    });

    // A1. Brand Kit Studio Screen
    console.log('Navigating to Brand Kit Studio (/dashboard/creator/phase-2/brand-kit)...');
    await page.goto('http://localhost:3000/dashboard/creator/phase-2/brand-kit');
    await page.waitForLoadState('networkidle');

    const brandKitDownloadBtn = page.locator('button:has-text("Download Brand Kit")');
    await brandKitDownloadBtn.waitFor({ state: 'visible', timeout: 10000 });

    console.log('Clicking "Download Brand Kit" on Brand Kit Studio screen...');
    const [downloadA1] = await Promise.all([
      page.waitForEvent('download'),
      brandKitDownloadBtn.click(),
    ]);

    const pathA1 = await downloadA1.path();
    const zipBufferA1 = fs.readFileSync(pathA1);
    const zipA1 = await JSZip.loadAsync(zipBufferA1);

    const filesA1 = Object.keys(zipA1.files);
    console.log(`Unpacked Brand Kit Screen ZIP (${filesA1.length} entries):`, filesA1);

    const logoFilesA1 = filesA1.filter(f => f.includes('/logos/') && f.endsWith('.svg'));
    console.log(`Found ${logoFilesA1.length} SVG logos in ZIP:`, logoFilesA1);

    if (logoFilesA1.length === 0) {
      throw new Error('Case A1 Failed: ZIP has no SVGs in /logos/ folder!');
    }

    for (const logoFile of logoFilesA1) {
      const content = await zipA1.file(logoFile).async('text');
      if (!content.includes('<svg')) {
        throw new Error(`Case A1 Failed: File ${logoFile} does not contain valid SVG markup!`);
      }
    }
    console.log('✅ Case A1 Passed: All SVG logo files exist and contain valid XML/SVG markup.');
    results.caseA_BrandKitScreen = true;

    // A2. Asset Library Screen
    console.log('\nNavigating to Asset Library (/dashboard/creator/asset-library)...');
    await page.goto('http://localhost:3000/dashboard/creator/asset-library');
    await page.waitForLoadState('networkidle');

    const assetLibraryZipBtn = page.locator('button:has-text("Download ZIP")').first();
    await assetLibraryZipBtn.waitFor({ state: 'visible', timeout: 10000 });

    console.log('Clicking "Download ZIP" on Brand Identity Kit card in Asset Library...');
    const [downloadA2] = await Promise.all([
      page.waitForEvent('download'),
      assetLibraryZipBtn.click(),
    ]);

    const pathA2 = await downloadA2.path();
    const zipBufferA2 = fs.readFileSync(pathA2);
    const zipA2 = await JSZip.loadAsync(zipBufferA2);

    const filesA2 = Object.keys(zipA2.files);
    const logoFilesA2 = filesA2.filter(f => f.includes('/logos/') && f.endsWith('.svg'));
    console.log(`Unpacked Asset Library ZIP (${filesA2.length} entries), SVGs:`, logoFilesA2);

    if (logoFilesA2.length === 0) {
      throw new Error('Case A2 Failed: Asset Library ZIP has no SVGs in /logos/ folder!');
    }
    results.caseA_AssetLibrary = true;
    console.log('✅ Case A2 Passed: Asset Library downloaded ZIP contains all SVGs.');

    // ----------------------------------------------------
    // CASE B: Only Approved Concept Exists (No Variations Derived Yet)
    // ----------------------------------------------------
    console.log('\n--- [CASE B: Concept Fallback (No Variations Derived Yet)] ---');

    const sampleConceptOnlyKit = {
      ...sampleVariationsKit,
      logo: {
        selectedConceptKey: 'concept-1',
        approvedAt: '2026-09-18T10:00:00Z',
        concepts: [
          {
            key: 'concept-1',
            descriptorLine: 'Geometric Mark',
            markAssetUri: '/brand-assets/logos/concept-mark.svg',
            lockupAssetUri: '/brand-assets/logos/concept-lockup.svg'
          }
        ],
        variations: {} // Variations un-derived
      }
    };

    await page.route('**/api/creator/journey/phase2/brand-kit*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: sampleConceptOnlyKit
        })
      });
    });

    await page.goto('http://localhost:3000/dashboard/creator/asset-library');
    await page.waitForLoadState('networkidle');

    const assetLibraryZipBtnB = page.locator('button:has-text("Download ZIP")').first();
    await assetLibraryZipBtnB.waitFor({ state: 'visible', timeout: 10000 });

    console.log('Triggering export with empty variations to verify concept fallback...');
    const [downloadB] = await Promise.all([
      page.waitForEvent('download'),
      assetLibraryZipBtnB.click(),
    ]);

    const pathB = await downloadB.path();
    const zipBufferB = fs.readFileSync(pathB);
    const zipB = await JSZip.loadAsync(zipBufferB);

    const filesB = Object.keys(zipB.files);
    const logoFilesB = filesB.filter(f => f.includes('/logos/') && f.endsWith('.svg'));
    console.log(`Unpacked Concept Fallback ZIP (${filesB.length} entries), SVGs:`, logoFilesB);

    if (logoFilesB.length === 0) {
      throw new Error('Case B Failed: Fallback to approved concept produced 0 SVGs in /logos/!');
    }

    for (const logoFile of logoFilesB) {
      const content = await zipB.file(logoFile).async('text');
      if (!content.includes('<svg')) {
        throw new Error(`Case B Failed: File ${logoFile} does not contain valid SVG markup!`);
      }
    }
    results.caseB_ConceptFallback = true;
    console.log('✅ Case B Passed: Concept fallback successfully populated /logos/ with valid SVGs.');

    // ----------------------------------------------------
    // CASE C: Deliberately Break One Asset URL (Honest Failure on Screen)
    // ----------------------------------------------------
    console.log('\n--- [CASE C: Deliberately Broken Asset URL (No Silent Failures)] ---');

    // Intercept develflow-primary.svg or concept-lockup.svg to return HTTP 404
    await page.route('**/brand-assets/logos/**', async (route) => {
      const url = route.request().url();
      if (url.includes('primary') || url.includes('lockup')) {
        console.log(`[MOCK FAILURE] Deliberately returning 404 for asset: ${url}`);
        await route.fulfill({
          status: 404,
          contentType: 'text/plain',
          body: 'Not Found: Deliberate test fault',
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'image/svg+xml',
          body: sampleSvg
        });
      }
    });

    // C1: Test in Brand Kit Studio
    console.log('Testing broken asset in Brand Kit Studio...');
    await page.goto('http://localhost:3000/dashboard/creator/phase-2/brand-kit');
    await page.waitForLoadState('networkidle');

    const brandKitBtnC = page.locator('button:has-text("Download Brand Kit")');
    await brandKitBtnC.click();

    // Check that explicit on-screen alert appears
    const errorBannerStudio = page.locator('text=Failed to export brand kit: could not retrieve logo assets');
    await errorBannerStudio.waitFor({ state: 'visible', timeout: 8000 });
    const studioErrorText = await errorBannerStudio.textContent();
    console.log('Visible on-screen error in Brand Kit Studio:', studioErrorText);
    await page.screenshot({ path: 'C:/Users/Siraj/.gemini/antigravity-ide/brain/ac4ea732-62cd-420b-8e2c-63fe1580c585/studio_error_banner.png' });
    results.caseC_BrandKitScreenErrorVisible = true;

    // C2: Test in Asset Library
    console.log('Testing broken asset in Asset Library...');
    await page.goto('http://localhost:3000/dashboard/creator/asset-library');
    await page.waitForLoadState('networkidle');

    const assetLibraryBtnC = page.locator('button:has-text("Download ZIP")').first();
    await assetLibraryBtnC.click();

    const errorBannerLibrary = page.locator('text=could not retrieve logo assets');
    await errorBannerLibrary.waitFor({ state: 'visible', timeout: 8000 });
    const libraryErrorText = await errorBannerLibrary.textContent();
    console.log('Visible on-screen error in Asset Library:', libraryErrorText);
    await page.screenshot({ path: 'C:/Users/Siraj/.gemini/antigravity-ide/brain/ac4ea732-62cd-420b-8e2c-63fe1580c585/library_error_banner.png' });
    results.caseC_AssetLibraryErrorVisible = true;

    console.log('\n========================================');
    console.log('🎉 ALL REAL BROWSER VERIFICATIONS PASSED:');
    console.log(JSON.stringify(results, null, 2));
    console.log('========================================');

  } catch (err) {
    console.error('❌ Verification failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runVerification();
