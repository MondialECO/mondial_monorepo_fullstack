import { defineConfig, devices } from '@playwright/test';
import { resolve } from 'node:path';

const frontendPort = Number(process.env.CREATOR_E2E_FRONTEND_PORT ?? 3001);
const frontendRoot = resolve(__dirname, '../../../../');

export default defineConfig({
  testDir: '../specs',
  // The live-AI suite remains deliberately manual/credentialed and is run via
  // tests/playwright.config.ts, never through the disposable CI harness.
  testIgnore: ['**/creator-ai-flow.spec.ts'],
  globalSetup: resolve(__dirname, '../support/warm-creator-frontend.ts'),
  fullyParallel: false,
  forbidOnly: true,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['html', { outputFolder: '../../../../playwright-report/creator-e2e', open: 'never' }], ['list']],
  use: {
    baseURL: `http://localhost:${frontendPort}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [{ name: 'creator-chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npm run dev -- --port ${frontendPort}`,
    cwd: frontendRoot,
    // Waiting on /login also warms the first route every fixture needs. A bare
    // port check can succeed while Next is still compiling that route.
    url: `http://localhost:${frontendPort}/login`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      ...process.env,
      NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5094/api',
    },
  },
  timeout: 60_000,
  globalTimeout: 20 * 60 * 1000,
});
