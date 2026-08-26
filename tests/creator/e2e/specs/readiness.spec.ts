import { test, expect, creatorApi } from '../fixtures/creator-fixtures';

type ReadinessPayload = {
  data: {
    overallProgress: number;
    levelUpEligible: boolean;
    selectedPath: string;
    missingRequired: string[];
    nextBestAction: { key: string; label: string } | null;
  };
};

async function openBuild(page: import('@playwright/test').Page) {
  await page.goto('/dashboard/creator/crossroads');
  await page.getByRole('heading', { name: 'Build the Company' }).click();
  await expect(page.getByText('Company Planning', { exact: true })).toBeVisible();
}

async function saveBuildCompanyPlanning(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: 'SAS', exact: true }).click();
  const holder = page.locator('input[placeholder="Holder"]');
  await holder.fill('Founder');
  await holder.locator('..').locator('input[type="number"]').fill('100');
  const save = page.waitForResponse((response) => response.url().includes('/creator/company-formation'));
  await page.getByRole('button', { name: 'Save company planning' }).click();
  expect((await save).status()).toBe(200);
}

async function saveBuildFunding(page: import('@playwright/test').Page) {
  await page.getByLabel('Your funding target').fill('50000');
  await page.getByRole('button', { name: 'Add use of funds' }).click();
  const category = page.locator('input[placeholder="Category"]');
  await category.fill('Build');
  await category.locator('..').locator('input[type="number"]').fill('100');
  await page.getByRole('button', { name: 'Angel', exact: true }).click();
  const save = page.waitForResponse((response) => response.url().includes('/creator/seed-funding'));
  await page.getByRole('button', { name: 'Save funding preparation' }).click();
  expect((await save).status()).toBe(200);
}

test.describe('Creator readiness', () => {
  test.describe('incomplete Build preparation', () => {
    test.use({ creatorScenario: 'CreatorBuildIncomplete' });

    test('shows the server-derived missing requirement and next action', async ({ creatorPage, creatorUser }) => {
      const readiness = await creatorApi<ReadinessPayload>(creatorPage, `/creator/readiness?ideaId=${creatorUser.activeIdeaId}`);
      expect(readiness.status).toBe(200);
      expect(readiness.body.data.levelUpEligible).toBeFalsy();
      expect(readiness.body.data.missingRequired).toContain('company_setup');
      expect(readiness.body.data.nextBestAction?.key).toBe('company_setup');

      await creatorPage.goto('/dashboard/creator/investors');
      await expect(creatorPage.getByText(readiness.body.data.nextBestAction!.label).first()).toBeVisible({ timeout: 15_000 });
      await expect(creatorPage.getByText(/Still needed:/)).toContainText('Complete company planning');
      await expect(creatorPage.getByRole('button', { name: 'Level Up' })).toHaveCount(0);
    });

    test('advances readiness from company planning to funding, then eligibility', async ({ creatorPage, creatorUser }) => {
      await openBuild(creatorPage);
      await saveBuildCompanyPlanning(creatorPage);
      const afterCompany = await creatorApi<ReadinessPayload>(creatorPage, `/creator/readiness?ideaId=${creatorUser.activeIdeaId}`);
      expect(afterCompany.body.data.missingRequired).toEqual(['funding_preparation']);
      expect(afterCompany.body.data.nextBestAction?.key).toBe('funding_preparation');

      await saveBuildFunding(creatorPage);
      const afterFunding = await creatorApi<ReadinessPayload>(creatorPage, `/creator/readiness?ideaId=${creatorUser.activeIdeaId}`);
      expect(afterFunding.body.data.missingRequired).toEqual([]);
      expect(afterFunding.body.data.levelUpEligible).toBeTruthy();

      await creatorPage.goto('/dashboard/creator/investors');
      await expect(creatorPage.getByRole('button', { name: 'Level Up' })).toBeVisible();
    });
  });

  test.describe('eligible Build preparation', () => {
    test.use({ creatorScenario: 'CreatorBuildEligible' });

    test('shows Level Up even when optional investor matching is empty', async ({ creatorPage, creatorUser }) => {
      const readiness = await creatorApi<ReadinessPayload>(creatorPage, `/creator/readiness?ideaId=${creatorUser.activeIdeaId}`);
      expect(readiness.status).toBe(200);
      expect(readiness.body.data.levelUpEligible).toBeTruthy();
      expect(readiness.body.data.missingRequired).toEqual([]);

      await creatorPage.goto('/dashboard/creator/investors');
      await expect(creatorPage.getByText(/No matches yet/i)).toBeVisible();
      await expect(creatorPage.getByRole('button', { name: 'Level Up' })).toBeVisible();
    });

    test('levels up through the real transaction-capable E2E stack', async ({ creatorPage, creatorUser }) => {
      test.setTimeout(120_000);
      const readiness = await creatorApi<ReadinessPayload>(creatorPage, `/creator/readiness?ideaId=${creatorUser.activeIdeaId}`);
      expect(readiness.status).toBe(200);
      await creatorPage.goto('/dashboard/creator/investors');
      await creatorPage.getByRole('button', { name: 'Level Up' }).click();
      await expect(creatorPage.getByRole('heading', { name: 'Level Up' })).toBeVisible();
      await expect(creatorPage.getByRole('button', { name: 'Confirm Level Up' })).toBeEnabled();
      const [levelUpResponse] = await Promise.all([
        creatorPage.waitForResponse((response) => response.url().includes('/creator/level-up') && response.request().method() === 'POST'),
        creatorPage.getByRole('button', { name: 'Confirm Level Up' }).click(),
      ]);
      expect(levelUpResponse.status()).toBe(200);
      await expect(creatorPage).toHaveURL(/\/dashboard\/entrepreneur/, { timeout: 30_000 });
    });
  });
});
