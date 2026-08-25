import { test, expect, creatorApi } from '../fixtures/creator-fixtures';

test.describe('Creator multi-idea browser safety', () => {
  test.use({ creatorScenario: 'CreatorWithTwoIdeas' });

  test('a tab keeps writing to idea A after another tab selects idea B', async ({ creatorPage, creatorUser }) => {
    const [ideaA, ideaB] = creatorUser.ideaIds;
    expect(ideaA).toBeTruthy();
    expect(ideaB).toBeTruthy();

    // Tab 1 holds a tab-local A workspace. Tab 2 selects B as the user-level
    // preference, exactly the stale-active-pointer case that must not redirect A.
    await creatorPage.evaluate((ideaId) => sessionStorage.setItem('creator_workspace_idea_id', ideaId), ideaA);
    const tab2 = await creatorPage.context().newPage();
    await tab2.goto(`/dashboard/creator?idea=${ideaB}`);
    await expect(tab2).toHaveURL(/\/dashboard\/creator/);
    const switched = await creatorApi(tab2, '/creator/ideas/active', { method: 'PATCH', body: { ideaId: ideaB } });
    expect(switched.status).toBe(200);

    const aBefore = await creatorApi<{ data: { journey: { ideaVersion: number } } }>(creatorPage, `/creator/journey?ideaId=${ideaA}`);
    expect(aBefore.status).toBe(200);
    const expectedVersion = aBefore.body.data.journey.ideaVersion;
    const marker = `A-${Date.now()}`;
    const saved = await creatorApi(creatorPage, `/creator/journey/project?ideaId=${ideaA}&expectedVersion=${expectedVersion}`, {
      method: 'PATCH', body: { name: marker },
    });
    expect(saved.status).toBe(200);

    const aAfter = await creatorApi<{ data: { journey: { project: { name: string } } } }>(creatorPage, `/creator/journey?ideaId=${ideaA}`);
    const bAfter = await creatorApi<{ data: { journey: { project: { name: string } } } }>(creatorPage, `/creator/journey?ideaId=${ideaB}`);
    expect(aAfter.body.data.journey.project.name).toBe(marker);
    expect(bAfter.body.data.journey.project.name).not.toBe(marker);
  });

  test('a stale same-idea save is rejected with 409', async ({ creatorPage, creatorUser }) => {
    const ideaA = creatorUser.ideaIds[0];
    const tab2 = await creatorPage.context().newPage();
    await tab2.goto(`/dashboard/creator?idea=${ideaA}`);

    const first = await creatorApi<{ data: { journey: { ideaVersion: number } } }>(creatorPage, `/creator/journey?ideaId=${ideaA}`);
    const second = await creatorApi<{ data: { journey: { ideaVersion: number } } }>(tab2, `/creator/journey?ideaId=${ideaA}`);
    const version = first.body.data.journey.ideaVersion;
    expect(second.body.data.journey.ideaVersion).toBe(version);

    const writer = await creatorApi(creatorPage, `/creator/journey/project?ideaId=${ideaA}&expectedVersion=${version}`, {
      method: 'PATCH', body: { tagline: `writer-${Date.now()}` },
    });
    expect(writer.status).toBe(200);

    const stale = await creatorApi(tab2, `/creator/journey/project?ideaId=${ideaA}&expectedVersion=${version}`, {
      method: 'PATCH', body: { tagline: `stale-${Date.now()}` },
    });
    expect(stale.status).toBe(409);
    expect(JSON.stringify(stale.body)).toContain('This idea was updated in another tab');
  });

  test('a stale sessionStorage workspace pointer recovers to an owned workspace', async ({ creatorPage, creatorUser }) => {
    const deletedIdea = '000000000000000000000000';
    await creatorPage.evaluate((ideaId) => sessionStorage.setItem('creator_workspace_idea_id', ideaId), deletedIdea);
    await creatorPage.reload();
    await expect(creatorPage).toHaveURL(/\/dashboard\/creator/);
    await expect.poll(() => creatorPage.evaluate(() => sessionStorage.getItem('creator_workspace_idea_id')))
      .not.toBe(deletedIdea);
    const current = await creatorPage.evaluate(() => sessionStorage.getItem('creator_workspace_idea_id'));
    expect(creatorUser.ideaIds).toContain(current);
  });
});
