import { chromium } from 'playwright';
import path from 'path';

const outputDir = 'C:/Users/Siraj/.gemini/antigravity-ide/brain/9fc77a08-b62b-4622-b07d-0d97b1df77d7';

async function main() {
  const browser = await chromium.launch({
    headless: true,
    channel: 'msedge',
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    colorScheme: 'light',
  });
  const page = await context.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('request', req => console.log('REQ:', req.method(), req.url()));

  await page.addInitScript(() => {
    window.localStorage.setItem('token', 'mock-token-xyz');
    window.localStorage.setItem('user', JSON.stringify({
      id: 'mock-user-1',
      email: 'creator@example.com',
      role: 'Creator',
      roles: ['Creator'],
      onboarding: { phase: 1, completed: true },
      onboardingPhase: 1,
    }));
  });

  await page.route('**/*', async (route) => {
    const url = route.request().url();
    if (url.includes('/auth/me')) {
      console.log('Fulfilling /auth/me');
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 'mock-user-1',
            email: 'creator@example.com',
            role: 'Creator',
            roles: ['Creator'],
            onboarding: { phase: 1, completed: true },
            onboardingPhase: 1,
          },
        }),
      });
    }
    if (url.includes('/creator/journey')) {
      console.log('Fulfilling /creator/journey');
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'x-creator-idea-version': '1' },
        body: JSON.stringify({
          success: true,
          data: {
            exists: true,
            project: {
              title: 'EcoSphere',
              branding: { logoType: 'ai' },
            },
            flow: {
              phase: 2,
              step: 'branding',
            },
          },
        }),
      });
    }
    return route.continue();
  });

  await page.goto('http://localhost:3000/dashboard/creator/phase-2/branding', {
    waitUntil: 'domcontentloaded',
  });

  await page.waitForTimeout(3000);
  console.log('Current URL:', page.url());
  await page.screenshot({ path: path.join(outputDir, 'debug_screenshot.png'), fullPage: true });

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
