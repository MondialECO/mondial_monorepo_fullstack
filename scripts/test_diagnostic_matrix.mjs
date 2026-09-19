import { chromium } from 'playwright';
import JSZip from 'jszip';
import fs from 'fs';
import path from 'path';

async function testDiagnosticMatrix() {
  console.log('=== RUNNING DIAGNOSTIC TEST MATRIX ===\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Test 1: Check backend static file server & CORS for /brand-assets/*
  console.log('1. Testing backend static asset endpoint directly...');
  const testResults = await page.evaluate(async () => {
    const urlsToTest = [
      'http://localhost:5093/brand-assets/logos/test.svg',
      'http://localhost:3000/brand-assets/logos/test.svg',
      'http://localhost:5093/api/creator/journey/phase2/brand-kit',
    ];
    const resList = [];
    for (const u of urlsToTest) {
      try {
        const r = await fetch(u);
        resList.push({
          url: u,
          status: r.status,
          ok: r.ok,
          type: r.headers.get('content-type'),
          cors: r.headers.get('access-control-allow-origin'),
        });
      } catch (e) {
        resList.push({ url: u, error: e.message });
      }
    }
    return resList;
  });
  console.log('Direct fetch probe:\n', JSON.stringify(testResults, null, 2));

  // Test 2: Test exportBrandKitZip behavior with different SVG URI types
  console.log('\n2. Testing exportBrandKitZip execution across different asset types...');
  await page.goto('http://localhost:3000/login');
  await page.fill('input[name="email"], input[type="email"]', 'demo.creator@mondial.local');
  await page.fill('input[name="password"], input[type="password"]', 'DemoP@ss1');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard/**', { timeout: 15000 });

  // Navigate to asset library
  await page.goto('http://localhost:3000/dashboard/creator/asset-library');
  await page.waitForTimeout(1000);

  // Evaluate the export function directly inside the browser
  const zipTest = await page.evaluate(async () => {
    // Import or test the export logic
    const { exportBrandKitZip } = await import('/_next/static/chunks/src_lib_brand-kit-export_ts.js').catch(() => ({}));
    return { hasExport: typeof exportBrandKitZip === 'function' };
  });

  console.log('Browser module check:', zipTest);

  await browser.close();
}

testDiagnosticMatrix().catch(console.error);
