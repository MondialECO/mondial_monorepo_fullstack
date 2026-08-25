import { test as base, expect, type APIRequestContext, type Page } from '@playwright/test';

export type CreatorFixtureName =
  | 'CreatorBasic'
  | 'CreatorVerified'
  | 'CreatorWithTwoIdeas'
  | 'CreatorBuildReadyForCrossroads'
  | 'CreatorBuildIncomplete'
  | 'CreatorBuildEligible';

export type CreatorUser = {
  email: string;
  password: string;
  userId: string;
  fixture: CreatorFixtureName;
  ideaIds: string[];
  activeIdeaId: string | null;
};

type CreatorFixtures = {
  creatorScenario: CreatorFixtureName;
  creatorUser: CreatorUser;
  creatorPage: Page;
};

const apiOrigin = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5094/api';

export async function provisionCreator(
  request: APIRequestContext,
  fixture: CreatorFixtureName,
): Promise<CreatorUser> {
  const response = await request.post(`${apiOrigin}/e2e/creators`, {
    data: { fixture, runId: process.env.CREATOR_E2E_RUN_ID ?? 'local' },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
  const body = await response.json();
  return body.data as CreatorUser;
}

export async function loginAsCreator(page: Page, user: CreatorUser): Promise<void> {
  await page.goto('/login');
  await page.locator('#email').fill(user.email);
  await page.locator('#password').fill(user.password);
  await page.getByRole('button', { name: /^sign in$/i }).click();
  await page.waitForURL(/\/dashboard\/creator/, { timeout: 45_000 });
}

/** Browser-context request: it uses the JWT issued by the normal login flow. */
export async function creatorApi<T = unknown>(
  page: Page,
  path: string,
  init?: { method?: string; body?: unknown },
): Promise<{ status: number; body: T; headers: Record<string, string> }> {
  const result = await page.evaluate(async ({ origin, path, init }) => {
    const response = await fetch(`${origin}${path}`, {
      method: init?.method ?? 'GET',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token') ?? ''}`,
        ...(init?.body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      body: init?.body === undefined ? undefined : JSON.stringify(init.body),
    });
    const text = await response.text();
    let body: unknown = null;
    try { body = text ? JSON.parse(text) : null; } catch { body = text; }
    return {
      status: response.status,
      body,
      headers: Object.fromEntries(response.headers.entries()),
    };
  }, { origin: apiOrigin, path, init });

  return {
    ...result,
    body: result.body as T,
  };
}

export const test = base.extend<CreatorFixtures>({
  creatorScenario: ['CreatorBasic', { option: true }],
  creatorUser: async ({ request, creatorScenario }, provide) => {
    await provide(await provisionCreator(request, creatorScenario));
  },
  creatorPage: async ({ page, creatorUser }, provide) => {
    await loginAsCreator(page, creatorUser);
    await provide(page);
  },
});

export { expect };
