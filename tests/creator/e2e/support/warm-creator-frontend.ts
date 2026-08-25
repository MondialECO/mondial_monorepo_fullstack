import { chromium } from '@playwright/test';

type WarmupCreator = {
  email: string;
  password: string;
};

type WarmupResponse = {
  data?: WarmupCreator;
};

export default async function warmCreatorFrontend(): Promise<void> {
  const frontendPort = Number(process.env.CREATOR_E2E_FRONTEND_PORT ?? 3001);
  const frontendOrigin = `http://localhost:${frontendPort}`;
  const apiOrigin = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5094/api';
  const provision = await fetch(`${apiOrigin}/e2e/creators`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fixture: 'CreatorBasic', runId: `${process.env.CREATOR_E2E_RUN_ID ?? 'local'}-warmup` }),
  });

  if (!provision.ok) {
    throw new Error(`Creator E2E frontend warmup could not provision its test user (${provision.status}).`);
  }

  const payload = await provision.json() as WarmupResponse;
  if (!payload.data?.email || !payload.data.password) {
    throw new Error('Creator E2E frontend warmup received an invalid test-user response.');
  }

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(`${frontendOrigin}/login`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await page.getByRole('heading', { name: 'Welcome back' }).waitFor({ state: 'visible', timeout: 120_000 });
    await page.locator('#email').fill(payload.data.email);
    await page.locator('#password').fill(payload.data.password);
    await page.getByRole('button', { name: /^sign in$/i }).click();
    await page.waitForURL(/\/dashboard\/creator/, { timeout: 120_000 });
    await page.getByRole('heading', { name: /Good morning,/ }).waitFor({ state: 'visible', timeout: 120_000 });
    await page.goto(`${frontendOrigin}/dashboard/creator/crossroads`, { waitUntil: 'networkidle', timeout: 120_000 });
    await page.goto(`${frontendOrigin}/dashboard/creator/investors`, { waitUntil: 'networkidle', timeout: 120_000 });
  } finally {
    await browser.close();
  }
}
