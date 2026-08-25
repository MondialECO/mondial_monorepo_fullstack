import { test, expect, creatorApi, provisionCreator } from '../fixtures/creator-fixtures';
import { test as unauthenticated } from '@playwright/test';

test.describe('Creator authenticated E2E foundation', () => {
  test('an authenticated Creator reaches the dashboard and authenticated API', async ({ creatorPage, creatorUser }) => {
    await expect(creatorPage).toHaveURL(/\/dashboard\/creator/);
    await expect(creatorPage.getByText(/welcome|creator dashboard|idea clarity score/i).first()).toBeVisible();

    const me = await creatorApi<{ data?: { id?: string } }>(creatorPage, '/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.data?.id).toBe(creatorUser.userId);
  });

  test('a Creator cannot read another Creator’s idea', async ({ creatorPage, request }) => {
    const other = await provisionCreator(request, 'CreatorWithTwoIdeas');
    const foreignIdeaId = other.ideaIds[0];
    expect(foreignIdeaId).toBeTruthy();

    const foreign = await creatorApi(creatorPage, `/creator/journey?ideaId=${foreignIdeaId}`);
    // The exact HTTP mapping is owned by the normal Creator controller. The
    // browser assertion here is the safety invariant: no foreign composite is
    // ever returned to an authenticated Creator.
    expect(foreign.status).not.toBe(200);
    expect(JSON.stringify(foreign.body)).not.toContain(other.userId);
  });
});

unauthenticated('an unauthenticated browser is redirected from the Creator dashboard', async ({ page }) => {
  await page.goto('/dashboard/creator');
  await expect(page).toHaveURL(/\/login/);
});
