const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000/login');
  await page.fill('input[type="email"]', 'demo.superadmin@mondial.local');
  await page.fill('input[type="password"]', 'DemoP@ss1');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard/**', { timeout: 10000 });

  // Navigate to users
  await page.goto('http://localhost:3000/dashboard/admin/users', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  const content = await page.content();
  console.log('Includes demo.superadmin:', content.includes('demo.superadmin@mondial.local'));
  console.log('Includes demo.admin:', content.includes('demo.admin@mondial.local'));

  const rows = await page.$$eval('table tbody tr', (trs) => trs.map(tr => tr.innerText.replace(/\n/g, ' ')));
  console.log('Rows count:', rows.length);
  console.log('First 5 rows:');
  rows.slice(0, 5).forEach((r, i) => console.log(` [${i+1}] ${r}`));

  await browser.close();
})().catch(console.error);
