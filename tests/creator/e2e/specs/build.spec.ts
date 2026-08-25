import { test, expect, creatorApi } from '../fixtures/creator-fixtures';

type JourneyPayload = {
  data: {
    journey: {
      activeIdeaId: string;
      phase5Data: {
        chosenPath?: string;
        pathB?: {
          companyFormation?: { selectedType: string; ownership: Array<{ holder: string; percent: number }> };
          seedFunding?: { totalAsk: number; useOfFunds: Array<{ category: string; percent: number }>; investorTypesTargeted: string[] };
        };
      };
    };
  };
};

async function openBuild(page: import('@playwright/test').Page) {
  await page.goto('/dashboard/creator/crossroads');
  await page.getByRole('heading', { name: 'Build the Company' }).click();
  await expect(page.getByText('Company Planning', { exact: true })).toBeVisible();
  await expect(page.getByText('Funding Preparation', { exact: true })).toBeVisible();
}

async function fillOwnership(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: 'SAS', exact: true }).click();
  const holders = page.locator('input[placeholder="Holder"]');
  await holders.nth(0).fill('Founder');
  await holders.nth(0).locator('..').locator('input[type="number"]').fill('85');
  await page.getByRole('button', { name: 'Add holder' }).click();
  await holders.nth(1).fill('Co-founder pool');
  await holders.nth(1).locator('..').locator('input[type="number"]').fill('15');
}

test.describe('Creator Build path', () => {
  test.use({ creatorScenario: 'CreatorBuildReadyForCrossroads' });

  test('starts without invented ownership, funding, allocation, or investor decisions', async ({ creatorPage }) => {
    const before = await creatorApi<JourneyPayload>(creatorPage, '/creator/journey');
    expect(before.status).toBe(200);
    expect(before.body.data.journey.phase5Data.chosenPath).toBeFalsy();
    expect(before.body.data.journey.phase5Data.pathB?.companyFormation).toBeFalsy();
    expect(before.body.data.journey.phase5Data.pathB?.seedFunding).toBeFalsy();

    await openBuild(creatorPage);
    await expect(creatorPage.locator('input[placeholder="Holder"]')).toHaveValue('');
    await expect(creatorPage.getByLabel('Your funding target')).toHaveValue('');
    await expect(creatorPage.getByText('80%', { exact: true })).toHaveCount(0);
    await expect(creatorPage.getByText('150,000', { exact: false })).toHaveCount(0);
    await expect(creatorPage.getByText('50 / 30 / 20', { exact: false })).toHaveCount(0);
  });

  test('persists a creator-entered ownership plan', async ({ creatorPage }) => {
    const initial = await creatorApi<JourneyPayload>(creatorPage, '/creator/journey');
    const ideaId = initial.body.data.journey.activeIdeaId;

    await openBuild(creatorPage);
    await fillOwnership(creatorPage);
    const save = creatorPage.waitForResponse((response) =>
      response.url().includes('/creator/company-formation') && response.request().method() === 'POST');
    await creatorPage.getByRole('button', { name: 'Save company planning' }).click();
    const savedResponse = await save;
    expect(savedResponse.status()).toBe(200);
    const requestUrl = new URL(savedResponse.url());
    const usedVersion = Number(requestUrl.searchParams.get('expectedVersion'));
    expect(requestUrl.searchParams.get('ideaId')).toBe(ideaId);
    expect(usedVersion).toBeGreaterThan(0);
    expect(Number(savedResponse.headers()['x-creator-idea-version'])).toBe(usedVersion + 1);

    const stale = await creatorApi(creatorPage, `/creator/company-formation?ideaId=${ideaId}&expectedVersion=${usedVersion}`, {
      method: 'POST',
      body: {
        selectedType: 'SAS',
        ownership: [
          { holder: 'Founder', percent: 85, isFounder: true, isEsop: false },
          { holder: 'Co-founder pool', percent: 15, isFounder: false, isEsop: false },
        ],
      },
    });
    expect(stale.status).toBe(409);

    await creatorPage.goto('/dashboard/creator');
    await openBuild(creatorPage);
    const holders = creatorPage.locator('input[placeholder="Holder"]');
    await expect(holders.nth(0)).toHaveValue('Founder');
    await expect(holders.nth(0).locator('..').locator('input[type="number"]')).toHaveValue('85');
    await expect(holders.nth(1)).toHaveValue('Co-founder pool');

    const persisted = await creatorApi<JourneyPayload>(creatorPage, `/creator/journey?ideaId=${ideaId}`);
    expect(persisted.body.data.journey.phase5Data.pathB?.companyFormation?.ownership)
      .toEqual(expect.arrayContaining([
        expect.objectContaining({ holder: 'Founder', percent: 85 }),
        expect.objectContaining({ holder: 'Co-founder pool', percent: 15 }),
      ]));
  });

  test('rejects invalid ownership instead of persisting it as a Build decision', async ({ creatorPage }) => {
    const initial = await creatorApi<JourneyPayload>(creatorPage, '/creator/journey');
    const ideaId = initial.body.data.journey.activeIdeaId;

    await openBuild(creatorPage);
    await creatorPage.getByRole('button', { name: 'SAS', exact: true }).click();
    const holder = creatorPage.locator('input[placeholder="Holder"]');
    await holder.fill('Founder');
    await holder.locator('..').locator('input[type="number"]').fill('110');
    const save = creatorPage.waitForResponse((response) =>
      response.url().includes('/creator/company-formation') && response.request().method() === 'POST');
    await creatorPage.getByRole('button', { name: 'Save company planning' }).click();
    expect((await save).status()).toBe(422);
    await expect(creatorPage.locator('p.text-destructive')).toBeVisible();

    const persisted = await creatorApi<JourneyPayload>(creatorPage, `/creator/journey?ideaId=${ideaId}`);
    expect(persisted.body.data.journey.phase5Data.pathB?.companyFormation).toBeFalsy();
  });

  test('persists an explicit funding target, allocation, and investor preference', async ({ creatorPage }) => {
    const initial = await creatorApi<JourneyPayload>(creatorPage, '/creator/journey');
    const ideaId = initial.body.data.journey.activeIdeaId;

    await openBuild(creatorPage);
    await creatorPage.getByLabel('Your funding target').fill('42000');
    await creatorPage.getByRole('button', { name: 'Add use of funds' }).click();
    await creatorPage.getByRole('button', { name: 'Add use of funds' }).click();
    const categories = creatorPage.locator('input[placeholder="Category"]');
    await categories.nth(0).fill('Product');
    await categories.nth(0).locator('..').locator('input[type="number"]').fill('60');
    await categories.nth(1).fill('Go to market');
    await categories.nth(1).locator('..').locator('input[type="number"]').fill('40');
    await creatorPage.getByRole('button', { name: 'Angel', exact: true }).click();
    const save = creatorPage.waitForResponse((response) =>
      response.url().includes('/creator/seed-funding') && response.request().method() === 'POST');
    await creatorPage.getByRole('button', { name: 'Save funding preparation' }).click();
    expect((await save).status()).toBe(200);

    await creatorPage.goto('/dashboard/creator');
    await openBuild(creatorPage);
    await expect(creatorPage.getByLabel('Your funding target')).toHaveValue('42000');
    await expect(creatorPage.locator('input[placeholder="Category"]').nth(0)).toHaveValue('Product');
    await expect(creatorPage.locator('input[placeholder="Category"]').nth(1)).toHaveValue('Go to market');

    const persisted = await creatorApi<JourneyPayload>(creatorPage, `/creator/journey?ideaId=${ideaId}`);
    expect(persisted.body.data.journey.phase5Data.pathB?.seedFunding).toEqual(expect.objectContaining({
      totalAsk: 42000,
      investorTypesTargeted: expect.arrayContaining(['Angel']),
      useOfFunds: expect.arrayContaining([
        expect.objectContaining({ category: 'Product', percent: 60 }),
        expect.objectContaining({ category: 'Go to market', percent: 40 }),
      ]),
    }));
  });
});
