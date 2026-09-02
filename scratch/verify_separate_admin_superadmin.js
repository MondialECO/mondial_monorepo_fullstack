const http = require('http');
const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:5093';

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(options.path, BASE_URL);
    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    };

    const req = http.request(reqOptions, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = body ? JSON.parse(body) : null;
        } catch (e) {
          parsed = body;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: parsed
        });
      });
    });

    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function requestWithRetry(options, data = null, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await request(options, data);
      if (res.statusCode >= 500 && attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 1000));
        continue;
      }
      return res;
    } catch (e) {
      if (attempt === maxRetries) throw e;
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

const results = {
  passed: 0,
  failed: 0,
  details: {}
};

function assert(condition, testName, meta = {}) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    results.passed++;
    results.details[testName] = { status: 'PASS', ...meta };
  } else {
    console.error(`  [FAIL] ${testName}`, meta);
    results.failed++;
    results.details[testName] = { status: 'FAIL', ...meta };
  }
}

async function main() {
  console.log('================================================================');
  console.log('MONDIAL ECO — SEPARATE ADMIN & SUPERADMIN SEEDED USERS TEST');
  console.log('================================================================\n');

  // Step 1: Login with demo.superadmin and demo.admin
  console.log('--- Step 1: Separate Account Authentication ---');
  const superLogin = await requestWithRetry({ method: 'POST', path: '/api/auth/login' }, {
    email: 'demo.superadmin@mondial.local',
    password: 'DemoP@ss1'
  });
  assert(superLogin.statusCode === 200, 'SuperAdmin (demo.superadmin@mondial.local) login 200 OK');
  const superToken = superLogin.data?.data?.token || superLogin.data?.token;
  const superUser = superLogin.data?.data?.user || superLogin.data?.user;
  const superHeaders = { 'Authorization': `Bearer ${superToken}` };

  const adminLogin = await requestWithRetry({ method: 'POST', path: '/api/auth/login' }, {
    email: 'demo.admin@mondial.local',
    password: 'DemoP@ss1'
  });
  assert(adminLogin.statusCode === 200, 'Normal Admin (demo.admin@mondial.local) login 200 OK');
  const adminToken = adminLogin.data?.data?.token || adminLogin.data?.token;
  const adminUser = adminLogin.data?.data?.user || adminLogin.data?.user;
  const adminHeaders = { 'Authorization': `Bearer ${adminToken}` };

  // Step 2: Separate user IDs and Role assertions
  console.log('\n--- Step 2: Database Record & Role Separation ---');
  console.log(`  SuperAdmin ID: ${superUser?.id}, Email: ${superUser?.email}, Roles: [${(superUser?.roles || []).join(', ')}]`);
  console.log(`  Normal Admin ID: ${adminUser?.id}, Email: ${adminUser?.email}, Roles: [${(adminUser?.roles || []).join(', ')}]`);

  assert(superUser?.id !== adminUser?.id, 'SuperAdmin and Admin have separate distinct user IDs');
  assert((superUser?.roles || []).includes('SuperAdmin'), 'SuperAdmin account owns SuperAdmin role');
  assert(!(superUser?.roles || []).includes('Admin'), 'SuperAdmin account does NOT require/own Admin role');
  assert((adminUser?.roles || []).includes('Admin'), 'Normal Admin account owns Admin role');
  assert(!(adminUser?.roles || []).includes('SuperAdmin'), 'Normal Admin account does NOT own SuperAdmin role');

  // Step 3: SuperAdmin Endpoint Matrix (without Admin role)
  console.log('\n--- Step 3: SuperAdmin Endpoint Access (SuperAdmin role alone) ---');
  const superEndpoints = [
    { path: '/api/admin/users', name: 'List Users' },
    { path: '/api/admin/verifications/summary', name: 'Verifications Summary' },
    { path: '/api/admin/commerce/summary', name: 'Commerce Summary' },
    { path: '/api/admin/marketplace/summary', name: 'Marketplace Summary' },
    { path: '/api/admin/reports', name: 'Reports' },
    { path: '/api/admin/audit', name: 'Audit Logs' },
    { path: '/api/admin/system/overview', name: 'System Overview' },
    { path: '/api/admin/system/controls', name: 'Platform Controls' }
  ];

  for (const ep of superEndpoints) {
    const res = await requestWithRetry({ path: ep.path, headers: superHeaders });
    assert(res.statusCode === 200, `SuperAdmin -> GET ${ep.path} (${ep.name}) returns 200 (Got ${res.statusCode})`);
  }

  // Step 4: Normal Admin Endpoint Matrix
  console.log('\n--- Step 4: Normal Admin Endpoint Access & Restriction Matrix ---');
  const adminAllowedEndpoints = [
    { path: '/api/admin/users', name: 'List Users' },
    { path: '/api/admin/verifications/summary', name: 'Verifications Summary' },
    { path: '/api/admin/commerce/summary', name: 'Commerce Summary' },
    { path: '/api/admin/marketplace/summary', name: 'Marketplace Summary' },
    { path: '/api/admin/reports', name: 'Reports' },
    { path: '/api/admin/audit', name: 'Audit Logs' },
    { path: '/api/admin/system/overview', name: 'System Overview' }
  ];

  for (const ep of adminAllowedEndpoints) {
    const res = await requestWithRetry({ path: ep.path, headers: adminHeaders });
    assert(res.statusCode === 200, `Normal Admin -> GET ${ep.path} (${ep.name}) returns 200 (Got ${res.statusCode})`);
  }

  // Normal Admin Platform Controls blocked
  const adminControlsRes = await requestWithRetry({ path: '/api/admin/system/controls', headers: adminHeaders });
  assert(adminControlsRes.statusCode === 403, `Normal Admin -> GET /api/admin/system/controls is 403 Forbidden (Got ${adminControlsRes.statusCode})`);

  // Step 5: Privilege Separation & Protection
  console.log('\n--- Step 5: Privilege Separation & SuperAdmin Protection ---');
  // Normal Admin attempts to assign Admin
  const adminAssignAdmin = await requestWithRetry({
    method: 'POST',
    path: `/api/admin/users/${superUser.id}/roles/add`,
    headers: adminHeaders
  }, { role: 'Admin' });
  assert(adminAssignAdmin.statusCode === 403, 'Normal Admin assigning Admin role -> 403 Forbidden');

  // Normal Admin attempts to assign SuperAdmin
  const adminAssignSuper = await requestWithRetry({
    method: 'POST',
    path: `/api/admin/users/${adminUser.id}/roles/add`,
    headers: adminHeaders
  }, { role: 'SuperAdmin' });
  assert(adminAssignSuper.statusCode === 403, 'Normal Admin assigning SuperAdmin role -> 403 Forbidden');

  // Normal Admin attempts to remove SuperAdmin from SuperAdmin
  const adminRemoveSuper = await requestWithRetry({
    method: 'POST',
    path: `/api/admin/users/${superUser.id}/roles/remove`,
    headers: adminHeaders
  }, { role: 'SuperAdmin' });
  assert(adminRemoveSuper.statusCode === 403, 'Normal Admin removing SuperAdmin role -> 403 Forbidden');

  // Normal Admin attempts to suspend SuperAdmin
  const adminSuspendSuper = await requestWithRetry({
    method: 'POST',
    path: '/api/admin/disable-login',
    headers: adminHeaders
  }, { userId: superUser.id, reason: 'Unauthorized test' });
  assert(adminSuspendSuper.statusCode === 403, 'Normal Admin suspending SuperAdmin -> 403 Forbidden');

  // Last SuperAdmin protection
  const removeLastSuperRes = await requestWithRetry({
    method: 'POST',
    path: `/api/admin/users/${superUser.id}/roles/remove`,
    headers: superHeaders
  }, { role: 'SuperAdmin' });
  assert(removeLastSuperRes.statusCode === 409, `SuperAdmin removing last SuperAdmin returns 409 Conflict (Got ${removeLastSuperRes.statusCode})`);

  // Step 6: User Directory Inspection
  console.log('\n--- Step 6: User Directory Inspection for Two Separate Records ---');
  const searchAdminRes = await requestWithRetry({ path: `/api/admin/users?search=${encodeURIComponent('demo.admin@mondial.local')}`, headers: superHeaders });
  const searchSuperRes = await requestWithRetry({ path: `/api/admin/users?search=${encodeURIComponent('demo.superadmin@mondial.local')}`, headers: superHeaders });

  const foundAdmin = (searchAdminRes.data?.items || searchAdminRes.data?.data?.items || [])[0];
  const foundSuper = (searchSuperRes.data?.items || searchSuperRes.data?.data?.items || [])[0];

  assert(!!foundAdmin, 'User directory contains demo.admin@mondial.local');
  assert(!!foundSuper, 'User directory contains demo.superadmin@mondial.local');
  assert(foundAdmin?.userId !== foundSuper?.userId, 'Directory confirms distinct user records');
  assert((foundAdmin?.roles || []).includes('Admin') && !(foundAdmin?.roles || []).includes('SuperAdmin'), 'Directory confirms demo.admin has Admin and NOT SuperAdmin');
  assert((foundSuper?.roles || []).includes('SuperAdmin') && !(foundSuper?.roles || []).includes('Admin'), 'Directory confirms demo.superadmin has SuperAdmin and NOT Admin');

  // Step 7: Playwright UI Walkthrough for Both Roles
  console.log('\n--- Step 7: Playwright UI Walkthrough (Admin & SuperAdmin) ---');
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (e) {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
  }

  const context = await browser.newContext();
  const page = await context.newPage();

  // Test 1: Login as Normal Admin
  console.log('  Testing Normal Admin login in browser...');
  await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
  await page.fill('input[type="email"], input[name="email"]', 'demo.admin@mondial.local');
  await page.fill('input[type="password"], input[name="password"]', 'DemoP@ss1');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard/admin**', { timeout: 15000 });
  await page.waitForSelector('main', { timeout: 15000 });

  const adminBody = await page.innerText('body');
  assert(!adminBody.includes('Something went wrong'), 'Normal Admin /dashboard/admin renders cleanly without error boundary');
  assert(adminBody.includes('Platform Operations Center'), 'Normal Admin sees Platform Operations Center');

  // Open AccountMenu and verify role label
  await page.click('button[aria-label="Open account menu"]');
  await page.waitForSelector('[role="menu"]', { timeout: 5000 });
  const adminMenuText = await page.innerText('[role="menu"]');
  assert(adminMenuText.includes('Admin') && !adminMenuText.includes('SuperAdmin'), 'Normal Admin account menu displays Admin badge');

  // Normal Admin direct access to controls
  await page.goto('http://localhost:3000/dashboard/admin/system/controls', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(600);
  const adminControlsBody = await page.innerText('body');
  assert(adminControlsBody.includes('Access Denied') || adminControlsBody.includes('SuperAdmin'), 'Normal Admin direct /controls shows clean Access Denied');

  // Test 2: Login as SuperAdmin
  console.log('  Testing SuperAdmin login in browser...');
  await context.clearCookies();
  await page.evaluate(() => localStorage.clear());

  await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
  await page.fill('input[type="email"], input[name="email"]', 'demo.superadmin@mondial.local');
  await page.fill('input[type="password"], input[name="password"]', 'DemoP@ss1');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard/admin**', { timeout: 15000 });
  await page.waitForSelector('main', { timeout: 15000 });

  const superBody = await page.innerText('body');
  assert(!superBody.includes('Something went wrong'), 'SuperAdmin /dashboard/admin renders cleanly without error boundary');
  assert(superBody.includes('Platform Operations Center'), 'SuperAdmin sees Platform Operations Center');

  // Open AccountMenu and verify role label
  await page.click('button[aria-label="Open account menu"]');
  await page.waitForSelector('[role="menu"]', { timeout: 5000 });
  const superMenuText = await page.innerText('[role="menu"]');
  assert(superMenuText.includes('SuperAdmin'), 'SuperAdmin account menu displays SuperAdmin badge');

  // SuperAdmin direct access to controls
  await page.goto('http://localhost:3000/dashboard/admin/system/controls', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(600);
  const superControlsBody = await page.innerText('body');
  assert(!superControlsBody.includes('Something went wrong') && (superControlsBody.includes('Platform') || superControlsBody.includes('Registration')), 'SuperAdmin direct /controls renders interactive platform controls');

  await browser.close();

  console.log('\n================================================================');
  console.log(`FINAL RESULT: ${results.passed} PASSED / ${results.failed} FAILED`);
  console.log('================================================================');

  if (results.failed > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
