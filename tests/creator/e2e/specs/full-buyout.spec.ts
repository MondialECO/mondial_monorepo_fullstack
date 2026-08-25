import { test, expect, creatorApi } from '../fixtures/creator-fixtures';

test.describe('Creator Full Buyout', () => {
  test.use({ creatorScenario: 'CreatorBuildReadyForCrossroads' });

  test('Sell the Project persists an asking price and publishes a full_buyout listing', async ({ creatorPage }) => {
    const journey = await creatorApi<{ data: { journey: { activeIdeaId: string } } }>(creatorPage, '/creator/journey');
    expect(journey.status).toBe(200);
    const ideaId = journey.body.data.journey.activeIdeaId;

    await creatorPage.goto('/dashboard/creator/crossroads');
    await expect(creatorPage.getByRole('heading', { name: 'Sell the Project' })).toBeVisible();
    await expect(creatorPage.getByRole('heading', { name: 'Build the Company' })).toBeVisible();
    await expect(creatorPage.getByText(/sell\s*\/\s*license/i)).toHaveCount(0);

    await creatorPage.getByRole('heading', { name: 'Sell the Project' }).click();
    await expect(creatorPage.getByText('Full Buyout Listing', { exact: true })).toBeVisible();
    await expect(creatorPage.getByText(/not a certified business or IP valuation/i)).toBeVisible();
    await expect(creatorPage.getByText(/stays separate from the planning estimate/i)).toBeVisible();

    await creatorPage.getByLabel('Your asking price').fill('125000');
    const publishResponse = creatorPage.waitForResponse((response) =>
      response.url().includes('/creator/marketplace/publish') && response.request().method() === 'POST');
    await creatorPage.getByRole('button', { name: 'Publish Full Buyout Listing' }).click();
    const response = await publishResponse;
    expect(response.status()).toBe(200);
    const payload = await response.json();
    expect(payload.data.listing.saleType).toBe('full_buyout');
    expect(payload.data.listing.openToPurchase).toBeTruthy();
    expect(payload.data.listing.openToLicense).toBeFalsy();

    await creatorPage.goto('/dashboard/creator');
    await creatorPage.goto('/dashboard/creator/crossroads');
    await expect(creatorPage.getByLabel('Your asking price')).toHaveValue('125000');

    const saved = await creatorApi<{ data: { journey: { phase5Data: { pathA: { marketplaceListing: { askingPrice: number; saleType: string } } } } } }>(creatorPage, `/creator/journey?ideaId=${ideaId}`);
    expect(saved.body.data.journey.phase5Data.pathA.marketplaceListing.askingPrice).toBe(125000);
    expect(saved.body.data.journey.phase5Data.pathA.marketplaceListing.saleType).toBe('full_buyout');
  });
});
