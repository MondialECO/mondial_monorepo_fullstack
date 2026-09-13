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
  await expect(page.getByText('Build this project yourself')).toBeVisible();
}

test.describe('Creator Build path', () => {
  test.use({ creatorScenario: 'CreatorBuildReadyForCrossroads' });

  test('displays clean Build Yourself confirmation card without legacy cards', async ({ creatorPage }) => {
    const before = await creatorApi<JourneyPayload>(creatorPage, '/creator/journey');
    expect(before.status).toBe(200);

    await openBuild(creatorPage);

    // Verify confirmation and readiness summary elements
    await expect(creatorPage.getByText('Build this project yourself')).toBeVisible();
    await expect(creatorPage.getByText('You are choosing to continue this project as the entrepreneur.')).toBeVisible();
    await expect(creatorPage.getByText('Initial ownership', { exact: false })).toBeVisible();
    await expect(creatorPage.getByText('100% Founder', { exact: false })).toBeVisible();
    await expect(creatorPage.getByText('Set later in Entrepreneur Funding phase')).toBeVisible();
    await expect(creatorPage.getByRole('button', { name: 'Continue as Entrepreneur' })).toBeVisible();
    await expect(creatorPage.getByRole('button', { name: 'Back to options' })).toBeVisible();

    // Verify legacy cards and inputs are NOT rendered
    await expect(creatorPage.getByText('Company Planning', { exact: true })).toHaveCount(0);
    await expect(creatorPage.getByText('Funding Preparation', { exact: true })).toHaveCount(0);
    await expect(creatorPage.locator('input[placeholder="Holder"]')).toHaveCount(0);
    await expect(creatorPage.getByLabel('Your funding target')).toHaveCount(0);
  });

  test('back to options returns to crossroads selection', async ({ creatorPage }) => {
    await openBuild(creatorPage);
    await creatorPage.getByRole('button', { name: 'Back to options' }).click();
    await expect(creatorPage.getByRole('heading', { name: 'Build the Company' })).toBeVisible();
  });

  test('retains backward compatibility for company-formation and seed-funding API endpoints', async ({ creatorPage }) => {
    const initial = await creatorApi<JourneyPayload>(creatorPage, '/creator/journey');
    const ideaId = initial.body.data.journey.activeIdeaId;

    const cfRes = await creatorApi(creatorPage, `/creator/company-formation?ideaId=${ideaId}&expectedVersion=1`, {
      method: 'POST',
      body: {
        selectedType: 'SAS',
        ownership: [{ holder: 'Founder', percent: 100, isFounder: true, isEsop: false }],
      },
    });
    expect([200, 409]).toContain(cfRes.status);

    const sfRes = await creatorApi(creatorPage, `/creator/seed-funding?ideaId=${ideaId}&expectedVersion=2`, {
      method: 'POST',
      body: {
        totalAsk: 50000,
        investorTypesTargeted: ['Angel'],
        useOfFunds: [{ category: 'Product', percent: 100 }],
      },
    });
    expect([200, 409]).toContain(sfRes.status);
  });
});
