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

async function run() {
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  console.log('================================================================');
  console.log('SUPERADMIN-ONLY SYSTEM & OPERATIONS VERIFICATION SUITE');
  console.log('================================================================\n');

  // 1. Auth Tokens
  console.log('--- Step 1: Authentication & Token Acquisition ---');
  const superLogin = await request({ method: 'POST', path: '/api/auth/login' }, {
    email: 'demo.superadmin@mondial.local',
    password: 'DemoP@ss1'
  });
  assert(superLogin.statusCode === 200, 'SuperAdmin login successful (200)');
  const superToken = superLogin.data?.data?.token || superLogin.data?.token;
  const superHeaders = { 'Authorization': `Bearer ${superToken}` };

  const adminLogin = await request({ method: 'POST', path: '/api/auth/login' }, {
    email: 'demo.admin@mondial.local',
    password: 'DemoP@ss1'
  });
  assert(adminLogin.statusCode === 200, 'Normal Admin login successful (200)');
  const adminToken = adminLogin.data?.data?.token || adminLogin.data?.token;
  const adminHeaders = { 'Authorization': `Bearer ${adminToken}` };

  const creatorLogin = await request({ method: 'POST', path: '/api/auth/login' }, {
    email: 'demo.creator@mondial.local',
    password: 'DemoP@ss1'
  });
  assert(creatorLogin.statusCode === 200, 'Demo Creator login successful (200)');
  const creatorToken = creatorLogin.data?.data?.token || creatorLogin.data?.token;
  const creatorHeaders = { 'Authorization': `Bearer ${creatorToken}` };

  // 2. System APIs Privilege Separation Matrix
  console.log('\n--- Step 2: System APIs Privilege Separation (SuperAdmin vs Admin vs Other) ---');
  const systemEndpoints = [
    { name: 'Overview', path: '/api/admin/system/overview' },
    { name: 'Health', path: '/api/admin/system/health' },
    { name: 'Job Stats', path: '/api/admin/system/jobs/stats' },
    { name: 'Recurring Jobs', path: '/api/admin/system/jobs/recurring' },
    { name: 'Notification Stats', path: '/api/admin/system/notifications/stats' },
    { name: 'Notification Logs', path: '/api/admin/system/notifications/logs' },
    { name: 'Queues', path: '/api/admin/system/queues' },
    { name: 'Controls', path: '/api/admin/system/controls' },
    { name: 'Environment', path: '/api/admin/system/environment' }
  ];

  for (const ep of systemEndpoints) {
    // SuperAdmin
    const sRes = await request({ path: ep.path, headers: superHeaders });
    assert(sRes.statusCode === 200, `SuperAdmin -> GET ${ep.path} (${ep.name}) is 200 OK (Got ${sRes.statusCode})`);

    // Normal Admin
    const aRes = await request({ path: ep.path, headers: adminHeaders });
    assert(aRes.statusCode === 403, `Normal Admin -> GET ${ep.path} (${ep.name}) is 403 Forbidden (Got ${aRes.statusCode})`);

    // Creator
    const cRes = await request({ path: ep.path, headers: creatorHeaders });
    assert(cRes.statusCode === 403, `Creator -> GET ${ep.path} (${ep.name}) is 403 Forbidden (Got ${cRes.statusCode})`);

    // Anonymous
    const anonRes = await request({ path: ep.path });
    assert(anonRes.statusCode === 401, `Anonymous -> GET ${ep.path} (${ep.name}) is 401 Unauthorized (Got ${anonRes.statusCode})`);
  }

  // 3. Normal Admin Retained Modules (Regression)
  console.log('\n--- Step 3: Normal Admin Retained Access to Business Modules ---');
  const adminEndpoints = [
    { name: 'Users List', path: '/api/admin/users' },
    { name: 'Verifications Summary', path: '/api/admin/verifications/summary' },
    { name: 'Commerce Summary', path: '/api/admin/commerce/summary' },
    { name: 'Marketplace Summary', path: '/api/admin/marketplace/summary' },
    { name: 'Reports', path: '/api/admin/reports' },
    { name: 'Audit Logs', path: '/api/admin/audit' },
  ];

  for (const ep of adminEndpoints) {
    const aRes = await request({ path: ep.path, headers: adminHeaders });
    assert(aRes.statusCode === 200, `Normal Admin -> GET ${ep.path} (${ep.name}) is 200 OK (Got ${aRes.statusCode})`);

    const sRes = await request({ path: ep.path, headers: superHeaders });
    assert(sRes.statusCode === 200, `SuperAdmin -> GET ${ep.path} (${ep.name}) is 200 OK (Got ${sRes.statusCode})`);
  }

  // 4. Playwright UI Walkthrough
  console.log('\n--- Step 4: Playwright UI Walkthrough & Sidebar Verification ---');
  const browser = await chromium.launch({ headless: true });

  try {
    // A. Normal Admin UI Verification
    console.log('  [Normal Admin UI]');
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();

    let adminSystemApiRequests = 0;
    adminPage.on('request', req => {
      if (req.url().includes('/api/admin/system')) {
        adminSystemApiRequests++;
      }
    });

    await adminPage.goto(`${FRONTEND_URL}/login`, { waitUntil: 'domcontentloaded' });
    await adminPage.fill('input[name="email"], input[type="email"]', 'demo.admin@mondial.local');
    await adminPage.fill('input[name="password"], input[type="password"]', 'DemoP@ss1');
    await adminPage.click('button[type="submit"]');
    await adminPage.waitForTimeout(1500);

    // Verify Admin Root loads cleanly
    await adminPage.goto(`${FRONTEND_URL}/dashboard/admin`, { waitUntil: 'domcontentloaded' });
    await adminPage.waitForTimeout(1000);
    const adminRootText = await adminPage.content();
    assert(!adminRootText.includes('Something went wrong'), 'Normal Admin /dashboard/admin renders cleanly without error boundary');
    assert(adminRootText.includes('Platform Operations Center') || adminRootText.includes('Admin'), 'Normal Admin sees Admin dashboard');
    assert(adminSystemApiRequests === 0, `Normal Admin root makes 0 requests to /api/admin/system/* (Actual: ${adminSystemApiRequests})`);

    // Verify Sidebar does NOT contain System & Operations
    const adminSidebarText = await adminPage.innerText('aside, nav, [data-sidebar]').catch(() => '');
    assert(!adminSidebarText.includes('System & Operations'), 'Normal Admin sidebar does NOT display System & Operations');

    // Direct Navigation to System routes -> Clean Access Denied
    const systemUIRoutes = [
      '/dashboard/admin/system',
      '/dashboard/admin/system/health',
      '/dashboard/admin/system/jobs',
      '/dashboard/admin/system/notifications',
      '/dashboard/admin/system/queues',
      '/dashboard/admin/system/controls',
    ];

    for (const route of systemUIRoutes) {
      await adminPage.goto(`${FRONTEND_URL}${route}`, { waitUntil: 'domcontentloaded' });
      await adminPage.waitForTimeout(500);
      const content = await adminPage.content();
      const hasAccessDenied = content.includes('Access Denied');
      const noCrash = !content.includes('Something went wrong');
      assert(hasAccessDenied && noCrash, `Normal Admin direct access to ${route} renders clean Access Denied`);
    }

    await adminContext.close();

    // B. SuperAdmin UI Verification
    console.log('\n  [SuperAdmin UI]');
    const superContext = await browser.newContext();
    const superPage = await superContext.newPage();

    await superPage.goto(`${FRONTEND_URL}/login`, { waitUntil: 'domcontentloaded' });
    await superPage.fill('input[name="email"], input[type="email"]', 'demo.superadmin@mondial.local');
    await superPage.fill('input[name="password"], input[type="password"]', 'DemoP@ss1');
    await superPage.click('button[type="submit"]');
    await superPage.waitForTimeout(1500);

    // Verify SuperAdmin Root
    await superPage.goto(`${FRONTEND_URL}/dashboard/admin`, { waitUntil: 'domcontentloaded' });
    await superPage.waitForTimeout(1000);
    const superRootText = await superPage.content();
    assert(!superRootText.includes('Something went wrong'), 'SuperAdmin /dashboard/admin renders cleanly');

    // Verify SuperAdmin Sidebar HAS System & Operations
    await superPage.goto(`${FRONTEND_URL}/dashboard/admin/system`, { waitUntil: 'domcontentloaded' });
    await superPage.waitForTimeout(1000);
    const superSystemText = await superPage.content();
    assert(!superSystemText.includes('Access Denied'), 'SuperAdmin /dashboard/admin/system renders without Access Denied');
    assert(superSystemText.includes('System Operations') || superSystemText.includes('Platform Health'), 'SuperAdmin sees System Overview');

    for (const route of systemUIRoutes) {
      await superPage.goto(`${FRONTEND_URL}${route}`, { waitUntil: 'domcontentloaded' });
      await superPage.waitForTimeout(500);
      const content = await superPage.content();
      const noAccessDenied = !content.includes('Access Denied');
      const noCrash = !content.includes('Something went wrong');
      assert(noAccessDenied && noCrash, `SuperAdmin access to ${route} renders cleanly`);
    }

    await superContext.close();

  } finally {
    await browser.close();
  }

  console.log('\n================================================================');
  console.log(`FINAL RESULT: ${passed} PASSED / ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) process.exit(1);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
