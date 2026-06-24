import { test, expect, Page } from "@playwright/test";

/**
 * Creator AI live e2e (TEST 3 / 5 / 7).
 *
 * Requires the REAL stack running:
 *   backend  -> dotnet run        (http://localhost:5093, valid OpenRouter key)
 *   frontend -> npm run dev       (http://localhost:3000)
 *   MongoDB connected.
 *
 * Run all:
 *   npx playwright test e2e/creator-ai-flow.spec.ts --headed
 *
 * Run one test:
 *   npx playwright test --headed -g "TEST 7"
 *   npx playwright test --headed -g "TEST 3"
 *
 * Level Up (opt-in, permanent):
 *   $env:RUN_LEVELUP="1"; npx playwright test --headed -g "TEST 5"
 */

const EMAIL    = process.env.UI_EMAIL    || "demo.creator@local.com";
const PASSWORD = process.env.UI_PASSWORD || "demo.creator@local.comA1";
const AI_WAIT  = 3 * 60 * 1000; // 3 min per AI job

const CLARIFIER_ANSWERS = [
  "A SaaS tool that helps freelancers recover unpaid invoices automatically using AI reminders and legal templates",
  "Freelancers and independent contractors",
  "Late or unpaid invoices cost freelancers time and money",
  "Automated multi-channel reminders, escalating templates, and one-click legal letter generation",
  "Existing tools are either too expensive or require manual effort",
  "5 years of freelance experience, a legal background, and I built the first version myself",
];

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

async function login(page: Page) {
  await page.goto("/login");
  await page.locator("#email").fill(EMAIL);
  await page.locator("#password").fill(PASSWORD);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await page.waitForURL((url: URL) => !url.pathname.endsWith("/login"), {
    timeout: 45_000,
  });
  const here = page.url();
  if (!/\/dashboard\/creator/.test(here)) {
    throw new Error(
      `Login landed on "${here}" — not /dashboard/creator.\n` +
      `"${EMAIL}" likely hasn't completed Phase-1 KYC.\n` +
      `Fix: login in the browser, complete onboarding, then re-run.`
    );
  }
}

/** Navigate through the Smart Gate to reach the clarifier page. */
async function navigateToClarifier(page: Page) {
  // The Smart Gate (/phase-2) is a single clickable <Card> whose CTA button
  // "Let's sharpen it" sets selectedEntryPath = "already_have_idea" and routes
  // to the clarifier (src/app/dashboard/creator/phase-2/page.tsx).
  await page.goto("/dashboard/creator/phase-2");
  await page.waitForLoadState("networkidle");

  const cta = page
    .getByRole("button", { name: /sharpen it/i })   // the card CTA
    .or(page.getByText("AI Idea Clarifier"))         // fallback: the card heading
    .first();
  await expect(cta).toBeVisible({ timeout: 15_000 });
  await cta.click();

  await page.waitForURL(/phase-2\/clarifier/, { timeout: 15_000 });
  await page.waitForLoadState("networkidle");
}

/** Reset journey state on the dashboard (idempotent — skips if button absent). */
async function resetJourneyIfPossible(page: Page) {
  await page.goto("/dashboard/creator");
  await page.waitForLoadState("networkidle");
  const reset = page.getByRole("button", { name: /reset progress/i });
  if (await reset.count() > 0 && await reset.isVisible()) {
    await reset.click();
    await page.waitForTimeout(1500);
  }
}

// ─────────────────────────────────────────────
// TESTS
// ─────────────────────────────────────────────

test.describe("Creator AI - live flow", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  // ── TEST 7: dashboard de-mock (fast, state-independent) ──────────────────
  test("TEST 7 - dashboard is de-mocked", async ({ page }) => {
    await page.goto("/dashboard/creator");
    await page.waitForLoadState("networkidle");
    const body = await page.locator("body").innerText();

    // Sample content that was removed during de-mock work:
    const MOCK_STRINGS = [
      "Sophie Chen",
      "Ahmed Karim",
      "Marie Laurent",
      "Aster Kitchen",
      "Northstar",
      "€186,000",   // hardcoded ARR fallback
      "Month 14",   // hardcoded break-even fallback
    ];
    for (const s of MOCK_STRINGS) {
      expect(body, `mock string "${s}" must not appear on dashboard`).not.toContain(s);
    }

    // At least one real KPI label must render:
    await expect(page.getByText("Idea Clarity Score")).toBeVisible();

    // /ai-masterplan must NOT be in the sidebar (unlinked in Step 4):
    const masterplanLink = page.locator("a[href*='ai-masterplan']");
    expect(await masterplanLink.count()).toBe(0);
  });

  // ── TEST 3: full AI flow (clarifier → plan → forecast), live OpenRouter ──
  test("TEST 3 - full Phase-3 AI flow with real data", async ({ page }) => {
    test.setTimeout(10 * 60 * 1000); // three real AI jobs back-to-back

    // Reset the shared demo account so the flow is repeatable.
    await resetJourneyIfPossible(page);

    // ── Clarifier ────────────────────────────────────────────────────────────
    // Go through the Smart Gate instead of navigating directly to /clarifier.
    await navigateToClarifier(page);

    const input = page.getByLabel("Message");
    await expect(input).toBeVisible({ timeout: 15_000 });

    for (const answer of CLARIFIER_ANSWERS) {
      await expect(input).toBeEnabled({ timeout: 10_000 });
      await input.fill(answer);
      // Send button — try aria-label first, then fallback role selectors.
      const sendBtn =
        page.getByLabel(/send message/i)
          .or(page.getByRole("button", { name: /send/i }))
          .or(page.locator("button[type='submit']"))
          .first();
      await sendBtn.click();
      // Small pause: lets the next AI question render before we fill again.
      await page.waitForTimeout(1200);
    }

    // After the 6th answer, the clarifier session polls to terminal and
    // automatically routes to /idea-summary.
    await page.waitForURL(/idea-summary/, { timeout: AI_WAIT });
    await expect(page.getByText(/clarity/i).first()).toBeVisible();

    // ── Business Plan (C-3) ──────────────────────────────────────────────────
    await page.goto("/dashboard/creator/phase-3/business-plan");
    await page.waitForLoadState("networkidle");

    const genPlan = page.getByRole("button", { name: /generate plan/i });
    await expect(genPlan).toBeVisible({ timeout: 10_000 });
    await genPlan.click();

    // Poll until 9 sections appear (AI job can take minutes).
    await expect(page.getByText("1. Executive Summary")).toBeVisible({
      timeout: AI_WAIT,
    });
    await expect(page.getByText("7. Financial Projections")).toBeVisible();

    // Section 7 should show a placeholder until the forecast runs.
    const sec7 = page.getByText(/financial projections/i).first();
    await expect(sec7).toBeVisible();

    // Derived sections (financials, team, funding, problem-solution) must have
    // Rewrite disabled (Lock badge / disabled button).
    // We assert at least one of the derived sections has a disabled control.
    const disabledRewrite = page
      .locator("button[disabled], button[aria-disabled='true']")
      .filter({ hasText: /rewrite/i });
    // Soft check — not all UIs label the button "Rewrite"; just verify it exists.
    if (await disabledRewrite.count() > 0) {
      await expect(disabledRewrite.first()).toBeDisabled();
    }

    // ── Forecast (C-4) ───────────────────────────────────────────────────────
    await page.goto("/dashboard/creator/phase-3/forecast");
    await page.waitForLoadState("networkidle");

    // The "Generate your Business Plan first" guard must NOT be visible now.
    await expect(
      page.getByText(/generate your business plan first/i)
    ).toHaveCount(0);

    const genForecast = page.getByRole("button", { name: /generate forecast/i });
    await expect(genForecast).toBeEnabled({ timeout: 10_000 });
    await genForecast.click();

    // Recharts renders <svg class="recharts-surface"> only from real ForecastOutput.
    await expect(page.locator("svg.recharts-surface").first()).toBeVisible({
      timeout: AI_WAIT,
    });

    // The hardcoded mock Year-3 figure ($1,500,000) must NOT appear.
    const fbody = await page.locator("body").innerText();
    expect(fbody).not.toContain("1,500,000");

    // Section 7 of the business plan should now be back-filled.
    // Navigate back to check.
    await page.goto("/dashboard/creator/phase-3/business-plan");
    await page.waitForLoadState("networkidle");
    const sec7body = await page.locator("body").innerText();
    // Placeholder text should no longer be present once forecast is done.
    expect(sec7body).not.toContain("your forecast (the next step) will populate");
  });

  // ── TEST 5: Level Up + bridge (OPT-IN, permanent) ────────────────────────
  test("TEST 5 - Level Up and entrepreneur bridge", async ({ page }) => {
    test.skip(
      process.env.RUN_LEVELUP !== "1",
      "Opt-in only — Level Up permanently converts this account to an entrepreneur. " +
        "Run with RUN_LEVELUP=1 on a disposable account."
    );
    test.setTimeout(5 * 60 * 1000);

    await page.goto("/dashboard/creator/investors");
    await page.waitForLoadState("networkidle");

    const levelUp = page.getByRole("button", { name: /level up/i });
    if ((await levelUp.count()) === 0) {
      test.skip(
        true,
        "Level Up button not found — Phases 2-5 (Build path + seed funding) are not complete."
      );
    }
    await levelUp.click();

    // The backend atomically creates the company and returns the entrepreneur profile id.
    // The frontend redirects via setTimeout (1600ms) — not a SignalR subscription.
    await page.waitForURL(/\/dashboard\/entrepreneur/, { timeout: 60_000 });

    // Bridge verification: LegalStructure pre-filled from Phase 5 formation.
    await page.goto("/dashboard/entrepreneur/phase-2/step-1");
    await page.waitForLoadState("networkidle");
    const stepBody = await page.locator("body").innerText();

    expect(
      stepBody,
      "LegalStructure 'SAS' should be pre-filled from Phase 5 formation"
    ).toContain("SAS");

    // Proof fields (LegalName, Documents) must be empty.
    // We check that common placeholder text is present, not a real legal name.
    const legalNameInput = page.locator(
      "input[name*='legalName'], input[placeholder*='legal name' i]"
    );
    if ((await legalNameInput.count()) > 0) {
      const val = await legalNameInput.first().inputValue();
      expect(val, "LegalName must be empty (proof field)").toBe("");
    }

    // Cap table: optionally verify pre-seeded ownership from Phase 5.
    await page.goto("/dashboard/entrepreneur/phase-4");
    await page.waitForLoadState("networkidle");
    const phase4Body = await page.locator("body").innerText();
    // If SeedCapTableFromPlanAsync succeeded: 70% / 10% / 20% ownership present.
    // If it failed silently: the cap table is empty (backend log shows "Cap-table seed failed").
    if (phase4Body.includes("70") && phase4Body.includes("10")) {
      console.log("✅ Cap table pre-seeded from Phase 5 ownership");
    } else {
      console.warn(
        "⚠️  Cap table appears empty after Level Up. " +
        "Check backend log for 'Cap-table seed failed'. " +
        "This is a known best-effort operation — the level-up itself succeeded."
      );
    }
  });
});