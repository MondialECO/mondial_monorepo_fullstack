import { chromium } from 'playwright';
import axios from 'axios';
import JSZip from 'jszip';
import fs from 'fs';

async function testFullStudioWorkflow() {
  console.log('=== RUNNING COMPLETE BRAND STUDIO FLOW ===\n');

  const loginRes = await axios.post('http://localhost:5093/api/auth/login', {
    email: 'demo.creator@mondial.local',
    password: 'DemoP@ss1'
  });
  const token = loginRes.data?.data?.token || loginRes.data?.token;
  const headers = { Authorization: `Bearer ${token}` };

  const journeyRes = await axios.get('http://localhost:5093/api/creator/journey', { headers });
  const activeIdeaId = journeyRes.data?.data?.journey?.activeIdeaId;
  console.log('Active idea:', activeIdeaId);

  // 1. Open studio & confirm strategy
  console.log('1. Strategy step...');
  await axios.post('http://localhost:5093/api/creator/journey/phase2/brand-kit/open-studio', null, { headers, params: { ideaId: activeIdeaId } });
  const kitRes1 = await axios.patch('http://localhost:5093/api/creator/journey/phase2/brand-kit/strategy', {
    businessName: 'Develflow',
    nameDisplayForm: 'Develflow',
    confirmedAt: new Date().toISOString()
  }, { headers, params: { ideaId: activeIdeaId } });

  // 2. Generate and select direction
  console.log('2. Direction step...');
  const dirGen = await axios.post('http://localhost:5093/api/creator/journey/phase2/brand-kit/direction/generate', null, {
    headers, params: { ideaId: activeIdeaId, expectedVersion: kitRes1.data?.data?.version }
  });
  const dirKey = dirGen.data?.data?.direction?.candidates?.[0]?.key || 'dir_1';
  const kitRes2 = await axios.patch('http://localhost:5093/api/creator/journey/phase2/brand-kit/direction', {
    selectedDirectionKey: dirKey,
    selectedAt: new Date().toISOString()
  }, { headers, params: { ideaId: activeIdeaId, expectedVersion: dirGen.data?.data?.version } });

  // 3. Generate logo concepts
  console.log('3. Logo concepts step...');
  const logoGen = await axios.post('http://localhost:5093/api/creator/journey/phase2/brand-kit/logo/generate-concepts', null, {
    headers, params: { ideaId: activeIdeaId, expectedVersion: kitRes2.data?.data?.version }
  });
  const concept = logoGen.data?.data?.logo?.concepts?.[0];
  console.log('Generated concept:', concept?.key, 'Mark:', concept?.markAssetUri, 'Lockup:', concept?.lockupAssetUri);

  // 4. Approve concept & derive variations
  console.log('4. Approving concept & deriving variations...');
  const kitRes3 = await axios.patch('http://localhost:5093/api/creator/journey/phase2/brand-kit/logo', {
    selectedConceptKey: concept?.key,
    approvedAt: new Date().toISOString()
  }, { headers, params: { ideaId: activeIdeaId, expectedVersion: logoGen.data?.data?.version } });

  const deriveRes = await axios.post('http://localhost:5093/api/creator/journey/phase2/brand-kit/logo/derive-variations', null, {
    headers, params: { ideaId: activeIdeaId, expectedVersion: kitRes3.data?.data?.version }
  });

  const fullKit = deriveRes.data?.data;
  console.log('\n=== REAL DERIVED VARIATIONS IN DATABASE ===');
  for (const [k, v] of Object.entries(fullKit?.logo?.variations || {})) {
    console.log(`- [${k}]: svgUri="${v.svgUri}", pngUri="${v.pngUri}"`);
  }

  // 5. Test browser execution
  console.log('\n=== TESTING BROWSER EXECUTION ON REAL COMPLETED BRAND KIT ===');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Login
  await page.goto('http://localhost:3000/login');
  await page.fill('input[name="email"], input[type="email"]', 'demo.creator@mondial.local');
  await page.fill('input[name="password"], input[type="password"]', 'DemoP@ss1');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard/**', { timeout: 15000 });

  // Evaluate fetch from browser page
  const browserFetch = await page.evaluate(async (variations) => {
    const out = [];
    for (const [k, v] of Object.entries(variations)) {
      const uri = v.svgUri;
      const tests = [
        { label: 'Raw Relative', url: uri },
        { label: 'Port 5093 (Backend)', url: `http://localhost:5093${uri}` },
        { label: 'Port 3000 (Frontend)', url: `http://localhost:3000${uri}` },
      ];
      for (const t of tests) {
        try {
          const res = await fetch(t.url);
          const text = await res.text();
          out.push({
            key: k,
            type: t.label,
            url: t.url,
            status: res.status,
            ok: res.ok,
            contentType: res.headers.get('content-type'),
            hasSvgTag: text.includes('<svg'),
            bodySnippet: text.slice(0, 120),
          });
        } catch (e) {
          out.push({ key: k, type: t.label, url: t.url, error: e.message });
        }
      }
    }
    return out;
  }, fullKit?.logo?.variations || {});

  console.log('\n--- BROWSER FETCH TEST RESULTS ---');
  for (const r of browserFetch) {
    console.log(`[${r.key} - ${r.type}] -> Status: ${r.status}, OK: ${r.ok}, Type: ${r.contentType}, hasSvg: ${r.hasSvgTag}`);
    if (r.error) console.log(`   Error: ${r.error}`);
    if (!r.hasSvgTag && r.bodySnippet) console.log(`   Body: ${r.bodySnippet}`);
  }

  // 6. Test Asset Library ZIP download
  console.log('\n--- TESTING ZIP DOWNLOAD FROM /dashboard/creator/asset-library ---');
  await page.goto('http://localhost:3000/dashboard/creator/asset-library');
  await page.waitForTimeout(2000);

  const assetLibZipBtn = page.locator('button:has-text("Download ZIP")');
  if (await assetLibZipBtn.count() > 0) {
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 10000 }),
      assetLibZipBtn.first().click(),
    ]);
    const dlPath = await download.path();
    const zip = await JSZip.loadAsync(fs.readFileSync(dlPath));
    console.log('Asset Library ZIP files:');
    for (const [filename, file] of Object.entries(zip.files)) {
      const size = file._data ? file._data.uncompressedSize : 0;
      console.log(`  - ${filename} (dir: ${file.dir}, size: ${size})`);
    }
  } else {
    console.log('Asset library Download ZIP button not found!');
  }

  // 7. Test Brand Studio screen ZIP download
  console.log('\n--- TESTING ZIP DOWNLOAD FROM /dashboard/creator/phase-2/brand-kit ---');
  await page.goto('http://localhost:3000/dashboard/creator/phase-2/brand-kit');
  await page.waitForTimeout(2000);

  const studioZipBtn = page.locator('button:has-text("Download Brand Kit"), button:has-text("Download Kit (.ZIP)"), button:has-text("Download ZIP")');
  if (await studioZipBtn.count() > 0) {
    const [download2] = await Promise.all([
      page.waitForEvent('download', { timeout: 10000 }),
      studioZipBtn.first().click(),
    ]);
    const dlPath2 = await download2.path();
    const zip2 = await JSZip.loadAsync(fs.readFileSync(dlPath2));
    console.log('Brand Studio ZIP files:');
    for (const [filename, file] of Object.entries(zip2.files)) {
      const size = file._data ? file._data.uncompressedSize : 0;
      console.log(`  - ${filename} (dir: ${file.dir}, size: ${size})`);
    }
  } else {
    console.log('Brand Studio Download button not found!');
  }

  await browser.close();
  console.log('\n=== COMPLETED DIAGNOSTIC SUITE ===');
}

testFullStudioWorkflow().catch(console.error);
