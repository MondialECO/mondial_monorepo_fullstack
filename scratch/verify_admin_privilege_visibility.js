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
  console.log('ADMIN PRIVILEGE VISIBILITY E2E VERIFICATION');
  console.log('================================================================\n');

  // 1. Auth
  console.log('--- Step 1: Authentication ---');
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

  // 2. Playwright UI
  console.log('\n--- Step 2: Playwright UI Verification ---');
  const browser = await chromium.launch({ headless: true });

  try {
    // ─── A. Normal Admin ───
    console.log('  [Normal Admin]');
    const adminCtx = await browser.newContext();
    const adminPage = await adminCtx.newPage();

    await adminPage.goto(`${FRONTEND_URL}/login`, { waitUntil: 'domcontentloaded' });
    await adminPage.fill('input[name="email"], input[type="email"]', 'demo.admin@mondial.local');
    await adminPage.fill('input[name="password"], input[type="password"]', 'DemoP@ss1');
    await adminPage.click('button[type="submit"]');
    await adminPage.waitForURL('**/dashboard/**', { timeout: 10000 });
    await adminPage.waitForTimeout(1000);

    // Navigate to Users directory
    await adminPage.goto(`${FRONTEND_URL}/dashboard/admin/users`, { waitUntil: 'domcontentloaded' });
    await adminPage.waitForSelector('table tbody tr', { timeout: 10000 });
    await adminPage.waitForTimeout(1000);
    const adminUsersContent = await adminPage.content();

    assert(!adminUsersContent.includes('demo.superadmin@mondial.local'), 'Admin Users: SuperAdmin email NOT visible');
    assert(adminUsersContent.includes('User Management'), 'Admin Users: Page renders correctly');

    // Check role filter options
    const roleOptions = await adminPage.$$eval('select option', (opts) => opts.map((o) => o.textContent.trim()));
    assert(!roleOptions.includes('SuperAdmin'), 'Admin Users: SuperAdmin role filter option NOT present');
    assert(!roleOptions.includes('Admin'), 'Admin Users: Admin role filter option NOT present');
    assert(roleOptions.includes('Creator'), 'Admin Users: Creator role filter option present');
    assert(roleOptions.includes('Entrepreneur'), 'Admin Users: Entrepreneur role filter option present');

    // Search for SuperAdmin
    const searchInput = await adminPage.$('input[placeholder*="Search"]');
    if (searchInput) {
      await searchInput.fill('demo.superadmin');
      await adminPage.waitForTimeout(1500);
      const searchContent = await adminPage.content();
      const hasSuperAdminResult = searchContent.includes('demo.superadmin@mondial.local');
      assert(!hasSuperAdminResult, 'Admin Search: SuperAdmin NOT in search results');
    }

    // Clear search and look for admin user being visible
    if (searchInput) {
      await searchInput.fill('');
      await adminPage.waitForTimeout(1000);
    }

    // Direct URL to SuperAdmin user detail
    // Get the SuperAdmin user ID first via API
    const usersRes = await request({
      path: '/api/admin/users?search=demo.superadmin',
      headers: { Authorization: `Bearer ${superToken}` },
    });
    const superAdminUserId = usersRes.data?.items?.[0]?.userId;
    if (superAdminUserId) {
      await adminPage.goto(`${FRONTEND_URL}/dashboard/admin/users/${superAdminUserId}`, {
        waitUntil: 'domcontentloaded',
      });
      await adminPage.waitForTimeout(2000);
      const detailContent = await adminPage.content();
      const hasAccessDenied = detailContent.includes('Access Denied');
      const noProfileDetails = !detailContent.includes('Account Identity');
      assert(hasAccessDenied, 'Admin Direct SuperAdmin URL: Access Denied shown');
      assert(noProfileDetails, 'Admin Direct SuperAdmin URL: No profile details rendered');
    } else {
      console.log('  [SKIP] Could not find SuperAdmin user ID for direct URL test');
    }

    await adminCtx.close();

    // ─── B. SuperAdmin ───
    console.log('\n  [SuperAdmin]');
    const superCtx = await browser.newContext();
    const superPage = await superCtx.newPage();

    await superPage.goto(`${FRONTEND_URL}/login`, { waitUntil: 'domcontentloaded' });
    await superPage.fill('input[name="email"], input[type="email"]', 'demo.superadmin@mondial.local');
    await superPage.fill('input[name="password"], input[type="password"]', 'DemoP@ss1');
    await superPage.click('button[type="submit"]');
    await superPage.waitForURL('**/dashboard/**', { timeout: 10000 });
    await superPage.waitForTimeout(1000);

    // Navigate to Users directory
    await superPage.goto(`${FRONTEND_URL}/dashboard/admin/users`, { waitUntil: 'networkidle' });
    await superPage.waitForSelector('table tbody tr', { timeout: 10000 });
    await superPage.waitForTimeout(2000);
    const superUsersContent = await superPage.content();

    assert(superUsersContent.includes('demo.superadmin@mondial.local'), 'SuperAdmin Users: SuperAdmin email visible');
    assert(superUsersContent.includes('SuperAdmin'), 'SuperAdmin Users: SuperAdmin role badge visible');

    // Check role filter options
    const superRoleOptions = await superPage.$$eval('select option', (opts) => opts.map((o) => o.textContent.trim()));
    assert(superRoleOptions.includes('SuperAdmin'), 'SuperAdmin Users: SuperAdmin role filter option present');
    assert(superRoleOptions.includes('Admin'), 'SuperAdmin Users: Admin role filter option present');

    // Search for SuperAdmin
    const superSearchInput = await superPage.$('input[placeholder*="Search"]');
    if (superSearchInput) {
      await superSearchInput.fill('demo.superadmin');
      await superPage.waitForTimeout(2000);
      const superSearchContent = await superPage.content();
      assert(superSearchContent.includes('demo.superadmin@mondial.local'), 'SuperAdmin Search: SuperAdmin visible in search results');

      // Search for demo.admin
      await superSearchInput.fill('demo.admin');
      await superPage.waitForTimeout(2000);
      const adminSearchContent = await superPage.content();
      assert(adminSearchContent.includes('demo.admin@mondial.local'), 'SuperAdmin Search: Admin visible in search results');
    }

    // SuperAdmin user detail
    if (superAdminUserId) {
      await superPage.goto(`${FRONTEND_URL}/dashboard/admin/users/${superAdminUserId}`, {
        waitUntil: 'domcontentloaded',
      });
      await superPage.waitForTimeout(2000);
      const superDetailContent = await superPage.content();
      assert(!superDetailContent.includes('Access Denied'), 'SuperAdmin Detail: No Access Denied');
      assert(superDetailContent.includes('demo.superadmin@mondial.local'), 'SuperAdmin Detail: Profile rendered');
    }

    await superCtx.close();
  } finally {
    await browser.close();
  }

  console.log('\n================================================================');
  console.log(`FINAL RESULT: ${passed} PASSED / ${failed} FAILED`);
  console.log('================================================================');
  if (failed > 0) process.exit(1);
}

run().catch((err) => { console.error(err); process.exit(1); });
