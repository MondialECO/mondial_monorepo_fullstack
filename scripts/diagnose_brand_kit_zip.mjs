import { chromium } from 'playwright';
import JSZip from 'jszip';
import fs from 'fs';
import path from 'path';

async function diagnose() {
  console.log('=== STARTING DIAGNOSTIC INVESTIGATION ===\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Login
  console.log('1. Authenticating as demo creator...');
  await page.goto('http://localhost:3000/login');
  await page.waitForSelector('input[name="email"], input[type="email"]');
  await page.fill('input[name="email"], input[type="email"]', 'demo.creator@mondial.local');
  await page.fill('input[name="password"], input[type="password"]', 'DemoP@ss1');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard/**', { timeout: 15000 });

  // 1. Inspect live BrandKit payload from API in the running system
  console.log('\n2. Fetching real BrandKit from backend API via browser context...');
  const brandKitData = await page.evaluate(async () => {
    try {
      const res = await fetch('/api/creator/brand-kit', { credentials: 'include' });
      const json = await res.json();
      return { ok: res.ok, status: res.status, data: json };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  });

  console.log('BrandKit API response status:', brandKitData.status);
  const kit = brandKitData.data?.data || brandKitData.data;
  console.log('BrandKit logo object:', JSON.stringify(kit?.logo, null, 2));

  // Check variations
  const variations = kit?.logo?.variations || {};
  console.log(`Variations found: ${Object.keys(variations).length}`);
  for (const [k, v] of Object.entries(variations)) {
    console.log(`- Variation [${k}]: svgUri="${v?.svgUri}", pngUri="${v?.pngUri}"`);
  }

  // 2. Test Asset Library ZIP download in browser
  console.log('\n3. Testing ZIP download from /dashboard/creator/asset-library...');
  await page.goto('http://localhost:3000/dashboard/creator/asset-library');
  await page.waitForTimeout(2000);

  const assetLibZipBtn = page.locator('button:has-text("Download ZIP")');
  let assetLibFiles = [];
  if (await assetLibZipBtn.count() > 0) {
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 15000 }),
      assetLibZipBtn.first().click(),
    ]);

    const downloadPath = await download.path();
    const zipBuffer = fs.readFileSync(downloadPath);
    const zip = await JSZip.loadAsync(zipBuffer);
    assetLibFiles = Object.keys(zip.files);
    console.log('Files inside Asset Library ZIP:', assetLibFiles);
  } else {
    console.log('No "Download ZIP" button found in Asset Library!');
  }

  // 3. Test Brand Studio screen ZIP download in browser
  console.log('\n4. Testing ZIP download from /dashboard/creator/phase-2/brand-kit...');
  await page.goto('http://localhost:3000/dashboard/creator/phase-2/brand-kit');
  await page.waitForTimeout(2000);

  const brandStudioZipBtn = page.locator('button:has-text("Download Kit (.ZIP)"), button:has-text("Download ZIP"), button:has-text("Download Brand Kit")');
  let brandStudioFiles = [];
  if (await brandStudioZipBtn.count() > 0) {
    const [download2] = await Promise.all([
      page.waitForEvent('download', { timeout: 15000 }),
      brandStudioZipBtn.first().click(),
    ]);

    const downloadPath2 = await download2.path();
    const zipBuffer2 = fs.readFileSync(downloadPath2);
    const zip2 = await JSZip.loadAsync(zipBuffer2);
    brandStudioFiles = Object.keys(zip2.files);
    console.log('Files inside Brand Studio Hub ZIP:', brandStudioFiles);
  } else {
    console.log('No Download button found in Brand Studio screen!');
  }

  // 4. Test VariationSetModal ZIP download if modal exists
  console.log('\n5. Checking VariationSetModal ZIP if accessible...');
  const openVariationsBtn = page.locator('button:has-text("Open in Studio"), a:has-text("Open in Studio"), button:has-text("Edit in Studio")');
  console.log('Studio edit buttons count:', await openVariationsBtn.count());

  // 5. Test raw fetch behavior in browser context for each variation URL
  console.log('\n6. Testing exact fetch behavior in browser for each variation URL...');
  const fetchResults = await page.evaluate(async (vars) => {
    const results = [];
    for (const [k, v] of Object.entries(vars)) {
      const uri = v.svgUri;
      if (!uri) {
        results.push({ key: k, uri: null, reason: 'no svgUri' });
        continue;
      }
      
      const testUrls = [
        { label: 'raw', url: uri },
        { label: 'origin-prepended (5093)', url: `http://localhost:5093${uri.startsWith('/') ? '' : '/'}${uri}` },
        { label: 'origin-prepended (3000)', url: `http://localhost:3000${uri.startsWith('/') ? '' : '/'}${uri}` },
      ];

      for (const t of testUrls) {
        try {
          const res = await fetch(t.url);
          const text = await res.text();
          results.push({
            key: k,
            label: t.label,
            url: t.url,
            status: res.status,
            ok: res.ok,
            contentType: res.headers.get('content-type'),
            textPreview: text.slice(0, 80),
            hasSvgTag: text.includes('<svg'),
          });
        } catch (e) {
          results.push({
            key: k,
            label: t.label,
            url: t.url,
            error: e.message,
          });
        }
      }
    }
    return results;
  }, variations);

  console.log('Fetch test results:\n', JSON.stringify(fetchResults, null, 2));

  await browser.close();
  console.log('\n=== DIAGNOSIS COMPLETE ===');
}

diagnose().catch(console.error);
