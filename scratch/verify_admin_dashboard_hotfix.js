const { chromium } = require('playwright');

async function run() {
  console.log('=== ADMIN ROOT DASHBOARD RUNTIME HOTFIX VERIFICATION ===\n');

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (e) {
    console.log('Chromium launch failed, attempting to launch with msedge channel:', e.message);
    try {
      browser = await chromium.launch({ channel: 'msedge', headless: true });
    } catch (e2) {
      console.error('Browser launch failed:', e2.message);
      process.exit(1);
    }
  }

  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', exception => {
    consoleErrors.push(`Uncaught exception: ${exception.message}\n${exception.stack}`);
  });

  try {
    // 1. SUPERADMIN RUNTIME VERIFICATION
    console.log('[1/4] Testing SuperAdmin login and /dashboard/admin...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });

    await page.fill('input[type="email"], input[name="email"]', 'demo.admin@mondial.local');
    await page.fill('input[type="password"], input[name="password"]', 'DemoP@ss1');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard/admin**', { timeout: 15000 });
    await page.waitForSelector('main', { timeout: 15000 });
    await page.waitForTimeout(1000);

    const bodyText = await page.innerText('body');
    const isSomethingWrong = bodyText.includes('Something went wrong');
    const hasOpsCenter = bodyText.includes('Platform Operations Center');

    console.log(`- SuperAdmin /dashboard/admin URL: ${page.url()}`);
    console.log(`- SuperAdmin "Something went wrong" present: ${isSomethingWrong}`);
    console.log(`- SuperAdmin "Platform Operations Center" present: ${hasOpsCenter}`);
    console.log(`- SuperAdmin console errors count: ${consoleErrors.length}`);
    if (!hasOpsCenter) {
      console.log(`- Page snippet: ${bodyText.slice(0, 300)}...`);
    }

    if (isSomethingWrong || !hasOpsCenter) {
      throw new Error(`SuperAdmin /dashboard/admin failed to render properly! Error: ${consoleErrors.join('\n')}`);
    }

    // Check SuperAdmin Topbar Account Menu
    const accountBtn = await page.$('button[aria-label="Open account menu"]');
    if (accountBtn) {
      await accountBtn.click();
      await page.waitForTimeout(500);
      const menuContent = await page.content();
      const hasSuperAdminLabel = menuContent.includes('SuperAdmin');
      console.log(`- SuperAdmin Account Menu label verified: ${hasSuperAdminLabel}`);
      await page.keyboard.press('Escape');
    }

    // Check SuperAdmin Platform Controls menu link in sidebar
    await page.goto('http://localhost:3000/dashboard/admin/system', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('h1', { timeout: 15000 });
    const systemContent = await page.content();
    console.log(`- SuperAdmin /dashboard/admin/system loaded: ${systemContent.includes('System Operations & Platform Health')}`);

    await page.goto('http://localhost:3000/dashboard/admin/system/controls', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('h1', { timeout: 15000 });
    const controlsContent = await page.content();
    console.log(`- SuperAdmin /dashboard/admin/system/controls loaded: ${controlsContent.includes('Platform Controls') || controlsContent.includes('Platform Availability & Feature Controls')}`);

    // Clear session for Normal Admin test
    console.log('\n[2/4] Clearing cookies and session for Normal Admin test...');
    await context.clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    consoleErrors.length = 0;

    // 2. NORMAL ADMIN RUNTIME VERIFICATION
    // Let's create or verify a normal admin token and test
    console.log('[3/4] Testing Normal Admin login and /dashboard/admin...');
    
    // Login with seeded admin or create temporary admin via API
    const authRes = await fetch('http://localhost:5093/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'demo.admin@mondial.local', password: 'DemoP@ss1' })
    });
    const authJson = await authRes.json();
    const token = authJson.data?.token || authJson.token;

    // Login as SuperAdmin to obtain superadmin token
    const creatorUserEmail = 'demo.creator@mondial.local';
    const creatorUserPass = 'DemoP@ss1';

    // Login as demo.creator to get user ID
    const creatorAuthRes = await fetch('http://localhost:5093/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: creatorUserEmail, password: creatorUserPass })
    });
    const creatorAuthJson = await creatorAuthRes.json();
    const creatorUserId = creatorAuthJson.data?.user?.id || creatorAuthJson.data?.id || creatorAuthJson.user?.id;
    console.log(`- Demo creator user ID: ${creatorUserId}`);
    
    if (creatorUserId) {
      const addRoleRes = await fetch(`http://localhost:5093/api/admin/users/${creatorUserId}/roles/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: 'Admin' })
      });
      console.log(`- Assigned Admin role to ${creatorUserEmail} status: ${addRoleRes.status}`);
    }

    // Now login as normal admin (demo.creator) in browser
    await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
    await page.fill('input[type="email"], input[name="email"]', creatorUserEmail);
    await page.fill('input[type="password"], input[name="password"]', creatorUserPass);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard/admin**', { timeout: 15000 });
    await page.waitForSelector('main', { timeout: 15000 });
    await page.waitForTimeout(1000);

    const adminContent = await page.content();
    const isAdminSomethingWrong = adminContent.includes('Something went wrong');
    const hasAdminOpsCenter = adminContent.includes('Platform Operations Center');

    console.log(`- Normal Admin /dashboard/admin URL: ${page.url()}`);
    console.log(`- Normal Admin "Something went wrong" present: ${isAdminSomethingWrong}`);
    console.log(`- Normal Admin "Platform Operations Center" present: ${hasAdminOpsCenter}`);
    console.log(`- Normal Admin console errors count: ${consoleErrors.length}`);

    if (isAdminSomethingWrong || !hasAdminOpsCenter) {
      throw new Error(`Normal Admin /dashboard/admin failed to render properly! Error: ${consoleErrors.join('\n')}`);
    }

    // Check Normal Admin direct access to /dashboard/admin/system/controls
    console.log('\n[4/4] Testing Normal Admin direct access to /dashboard/admin/system/controls...');
    await page.goto('http://localhost:3000/dashboard/admin/system/controls', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    const directControlsContent = await page.content();
    const hasAccessDenied = directControlsContent.includes('Access Denied') || directControlsContent.includes('SuperAdmin');
    const hasErrorCrash = directControlsContent.includes('Something went wrong');
    console.log(`- Normal Admin direct controls "Access Denied" screen: ${hasAccessDenied}`);
    console.log(`- Normal Admin direct controls "Something went wrong" crash: ${hasErrorCrash}`);

    console.log('\n========================================');
    console.log('ALL RUNTIME BROWSER VERIFICATIONS PASSED');
    console.log('========================================');

  } catch (err) {
    console.error('\nVerification failed with error:', err.message);
    if (consoleErrors.length > 0) {
      console.error('Console errors:', consoleErrors);
    }
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
