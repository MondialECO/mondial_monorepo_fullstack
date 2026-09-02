const http = require('http');
const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:5093';
const FRONTEND_URL = 'http://localhost:3000';

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(options.path, BASE_URL);
    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    };
    const req = http.request(reqOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        let parsed = null;
        try { parsed = body ? JSON.parse(body) : null; } catch { parsed = body; }
        resolve({ statusCode: res.statusCode, data: parsed });
      });
    });
    req.on('error', reject);
    if (data) req.write(typeof data === 'string' ? data : JSON.stringify(data));
    req.end();
  });
}

async function run() {
  let passed = 0;
  let failed = 0;
  function assert(condition, message) {
    if (condition) { console.log(`  [PASS] ${message}`); passed++; }
    else { console.error(`  [FAIL] ${message}`); failed++; }
  }

  console.log('================================================================');
  console.log('SUPERADMIN AUDIT & GOVERNANCE PRIVILEGE VISIBILITY E2E');
  console.log('================================================================\n');

  // Step 1: Auth & generate audit logs
  console.log('--- Step 1: Authentication & Seed Audit Activity ---');
  const adminLogin = await request({ method: 'POST', path: '/api/auth/login' }, {
    email: 'demo.admin@mondial.local', password: 'DemoP@ss1',
  });
  assert(adminLogin.statusCode === 200, 'Normal Admin login (200)');
  const adminToken = adminLogin.data?.data?.token || adminLogin.data?.token;

  const superLogin = await request({ method: 'POST', path: '/api/auth/login' }, {
    email: 'demo.superadmin@mondial.local', password: 'DemoP@ss1',
  });
  assert(superLogin.statusCode === 200, 'SuperAdmin login (200)');
  const superToken = superLogin.data?.data?.token || superLogin.data?.token;

  // Step 2: Browser E2E
  console.log('\n--- Step 2: Browser E2E Verification ---');
  const browser = await chromium.launch({ headless: true });

  try {
    // ─── A. Normal Admin ───
    console.log('  [Normal Admin]');
    const adminCtx = await browser.newContext();
    const adminPage = await adminCtx.newPage();

    await adminPage.goto(`${FRONTEND_URL}/login`, { waitUntil: 'domcontentloaded' });
    await adminPage.fill('input[type="email"]', 'demo.admin@mondial.local');
    await adminPage.fill('input[type="password"]', 'DemoP@ss1');
    await adminPage.click('button[type="submit"]');
    await adminPage.waitForURL('**/dashboard/**', { timeout: 10000 });

    // Open /dashboard/admin/audit
    await adminPage.goto(`${FRONTEND_URL}/dashboard/admin/audit`, { waitUntil: 'networkidle' });
    await adminPage.waitForSelector('table tbody tr', { timeout: 10000 });
    await adminPage.waitForTimeout(2000);

    const adminAuditContent = await adminPage.content();
    assert(!adminAuditContent.includes('demo.superadmin@mondial.local'), 'Admin Audit: SuperAdmin actor email NOT visible');
    assert(adminAuditContent.includes('Admin Audit Trail'), 'Admin Audit: Header renders');

    // Search for SuperAdmin actor in Audit
    const searchInput = await adminPage.$('input[placeholder*="Search action"]');
    if (searchInput) {
      await searchInput.fill('demo.superadmin');
      const submitBtn = await adminPage.$('form button[type="submit"]');
      if (submitBtn) await submitBtn.click();
      else await searchInput.press('Enter');
      await adminPage.waitForTimeout(2000);

      const searchContent = await adminPage.content();
      const hasSuperAdmin = searchContent.includes('demo.superadmin@mondial.local');
      assert(!hasSuperAdmin, 'Admin Audit Search: SuperAdmin NOT found in search results');
    }

    // Open /dashboard/admin/governance
    await adminPage.goto(`${FRONTEND_URL}/dashboard/admin/governance`, { waitUntil: 'networkidle' });
    await adminPage.waitForTimeout(2000);

    const adminGovContent = await adminPage.content();
    assert(!adminGovContent.includes('by demo.superadmin@mondial.local'), 'Admin Governance: SuperAdmin live feed events NOT visible');
    assert(adminGovContent.includes('Platform Governance'), 'Admin Governance: Hub renders');

    await adminCtx.close();

    // ─── B. SuperAdmin ───
    console.log('\n  [SuperAdmin]');
    const superCtx = await browser.newContext();
    const superPage = await superCtx.newPage();

    await superPage.goto(`${FRONTEND_URL}/login`, { waitUntil: 'domcontentloaded' });
    await superPage.fill('input[type="email"]', 'demo.superadmin@mondial.local');
    await superPage.fill('input[type="password"]', 'DemoP@ss1');
    await superPage.click('button[type="submit"]');
    await superPage.waitForURL('**/dashboard/**', { timeout: 10000 });

    // Open /dashboard/admin/audit
    await superPage.goto(`${FRONTEND_URL}/dashboard/admin/audit`, { waitUntil: 'networkidle' });
    await superPage.waitForSelector('table tbody tr', { timeout: 10000 });
    await superPage.waitForTimeout(2000);

    const superAuditContent = await superPage.content();
    assert(superAuditContent.includes('demo.superadmin@mondial.local'), 'SuperAdmin Audit: SuperAdmin audit entries visible');
    assert(superAuditContent.includes('Admin Audit Trail'), 'SuperAdmin Audit: Header renders');

    // Open detail modal for first log
    const viewButtons = await superPage.$$('table tbody tr button:has-text("View")');
    if (viewButtons.length > 0) {
      await viewButtons[0].click();
      await superPage.waitForTimeout(500);
      const modalContent = await superPage.content();
      assert(modalContent.includes('Audit Event Payload'), 'SuperAdmin Detail Modal: Opens successfully');
      // close modal
      const closeBtn = await superPage.$('button:has-text("Close")');
      if (closeBtn) await closeBtn.click();
    }

    // Open /dashboard/admin/governance
    await superPage.goto(`${FRONTEND_URL}/dashboard/admin/governance`, { waitUntil: 'networkidle' });
    await superPage.waitForTimeout(2000);

    const superGovContent = await superPage.content();
    assert(superGovContent.includes('Platform Governance'), 'SuperAdmin Governance: Hub renders');
    assert(superGovContent.includes('by demo.superadmin@mondial.local'), 'SuperAdmin Governance: SuperAdmin live feed events visible');

    await superCtx.close();
  } finally {
    await browser.close();
  }

  console.log('\n================================================================');
  console.log(`FINAL RESULT: ${passed} PASSED / ${failed} FAILED`);
  console.log('================================================================');
  if (failed > 0) process.exit(1);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
