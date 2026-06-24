# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e\creator-ai-flow.spec.ts >> Creator AI - live flow >> TEST 3 - full Phase-3 AI flow with real data
- Location: e2e\creator-ai-flow.spec.ts:125:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: /sharpen it/i }).or(getByText('AI Idea Clarifier')).first()
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for getByRole('button', { name: /sharpen it/i }).or(getByText('AI Idea Clarifier')).first()

```

```yaml
- alert
- text: M Mondial Main
- list:
  - listitem:
    - link "Dashboard":
      - /url: /dashboard/creator
  - listitem:
    - link "My Idea":
      - /url: /dashboard/creator/myideas
  - listitem:
    - link "Project Studio":
      - /url: /dashboard/creator/project-studio
  - listitem:
    - link "Offer & Pricing":
      - /url: /dashboard/creator/offer-pricing
- text: Growth
- list:
  - listitem:
    - link "The Crossroads":
      - /url: /dashboard/creator/crossroads
  - listitem:
    - link "Marketplace":
      - /url: /dashboard/creator/marketplace
  - listitem:
    - link "Hire Providers":
      - /url: /dashboard/creator/hire-providers
  - listitem:
    - link "IP Vault":
      - /url: /dashboard/creator/ip-vault
- text: Communication
- list:
  - listitem:
    - link "Messages":
      - /url: /dashboard/creator/messages
  - listitem:
    - link "Notifications":
      - /url: /dashboard/creator/notifications
- text: Assets
- list:
  - listitem:
    - link "Asset Library":
      - /url: /dashboard/creator/asset-library
  - listitem:
    - link "Documents":
      - /url: /dashboard/creator/documents
  - listitem:
    - link "Settings":
      - /url: /dashboard/creator/settings
- paragraph: Upgrade Now
- paragraph: Get more views and reach more investors.
- button "Upgrade"
- text: D Demo creator Creator
- banner:
  - button "Toggle Sidebar"
  - navigation:
    - link "Dashboard":
      - /url: /dashboard
    - text: Creator
  - button "Messages"
  - button "Notifications": 9+
  - button "Toggle theme"
  - button "Logout"
- main:
  - link "Back to dashboard":
    - /url: /dashboard
  - text: Creator Flow Dashboard
  - button "Reset Progress"
  - heading "Good morning, there 👋" [level=1]
  - paragraph: Refining your project concept. Complete the questions to unlock forecasts.
  - text: Wednesday, Jun 24, 2026
  - link "Edit Concept":
    - /url: /dashboard/creator/phase-2
  - button "AI Tools"
  - text: — Idea Clarity Score — AI Assets Generated — Investor Readiness — Interested Buyers
  - heading "Your Project" [level=3]
  - text: Identity Ready A
  - heading "AutoInvoice" [level=4]
  - paragraph: We help freelancers recover unpaid invoices by automating follow-up sequences.
  - text: FinTech SaaS
  - link "Edit":
    - /url: /dashboard/creator/phase-2
  - text: Creator Journey 1 of 6 phases completed Identity 2 Concept 3 Intel 4 Pricing 5 Crossroads 6 Matching Currently on Phase 2 — Idea Refinement
  - link "Continue":
    - /url: /dashboard/creator/phase-2/clarifier
  - heading "AI Financial Forecast" [level=3]
  - heading "No forecast yet" [level=4]
  - paragraph: Run your financial forecast in Phase 3 to see your projected revenue, break-even, and cash flow here.
  - link "Run your forecast":
    - /url: /dashboard/creator/phase-3/forecast
  - heading "Asset Library" [level=3]
  - heading "Nothing Here Yet" [level=4]
  - paragraph: Your completed work and generated assets will appear here.
  - heading "Messages" [level=3]
  - paragraph: No conversations yet. Reach out to an investor or provider to start one.
  - heading "Notifications" [level=3]
  - text: 18 new
  - paragraph: AI job failed
  - text: 6m
  - paragraph: AI job failed
  - text: 21m
  - paragraph: AI job failed
  - text: 8h
  - paragraph: AI job failed
  - text: 13h
  - link "View all notifications":
    - /url: /dashboard/creator/notifications
  - heading "Marketplace" [level=3]
  - heading "Smart Matching Locked" [level=4]
  - paragraph: Completing Phase 5 Crossroads unlocks buyers and co-founder matches.
  - heading "Quick Actions" [level=3]
  - heading "Generate Pitch Deck" [level=4]
  - paragraph: One-click AI generator
  - heading "List on Marketplace" [level=4]
  - paragraph: Sell or license concept
  - heading "Hire a Provider" [level=4]
  - paragraph: M50 service directory
  - heading "Build My Company" [level=4]
  - paragraph: Transition to founder
```

# Test source

```ts
  1   | import { test, expect, Page } from "@playwright/test";
  2   | 
  3   | /**
  4   |  * Creator AI live e2e (TEST 3 / 5 / 7).
  5   |  *
  6   |  * Requires the REAL stack running:
  7   |  *   backend  -> dotnet run        (http://localhost:5093, valid OpenRouter key)
  8   |  *   frontend -> npm run dev       (http://localhost:3000)
  9   |  *   MongoDB connected.
  10  |  *
  11  |  * Run all:
  12  |  *   npx playwright test e2e/creator-ai-flow.spec.ts --headed
  13  |  *
  14  |  * Run one test:
  15  |  *   npx playwright test --headed -g "TEST 7"
  16  |  *   npx playwright test --headed -g "TEST 3"
  17  |  *
  18  |  * Level Up (opt-in, permanent):
  19  |  *   $env:RUN_LEVELUP="1"; npx playwright test --headed -g "TEST 5"
  20  |  */
  21  | 
  22  | const EMAIL    = process.env.UI_EMAIL    || "demo.creator@local.com";
  23  | const PASSWORD = process.env.UI_PASSWORD || "demo.creator@local.comA1";
  24  | const AI_WAIT  = 3 * 60 * 1000; // 3 min per AI job
  25  | 
  26  | const CLARIFIER_ANSWERS = [
  27  |   "A SaaS tool that helps freelancers recover unpaid invoices automatically using AI reminders and legal templates",
  28  |   "Freelancers and independent contractors",
  29  |   "Late or unpaid invoices cost freelancers time and money",
  30  |   "Automated multi-channel reminders, escalating templates, and one-click legal letter generation",
  31  |   "Existing tools are either too expensive or require manual effort",
  32  |   "5 years of freelance experience, a legal background, and I built the first version myself",
  33  | ];
  34  | 
  35  | // ─────────────────────────────────────────────
  36  | // HELPERS
  37  | // ─────────────────────────────────────────────
  38  | 
  39  | async function login(page: Page) {
  40  |   await page.goto("/login");
  41  |   await page.locator("#email").fill(EMAIL);
  42  |   await page.locator("#password").fill(PASSWORD);
  43  |   await page.getByRole("button", { name: /^sign in$/i }).click();
  44  |   await page.waitForURL((url: URL) => !url.pathname.endsWith("/login"), {
  45  |     timeout: 45_000,
  46  |   });
  47  |   const here = page.url();
  48  |   if (!/\/dashboard\/creator/.test(here)) {
  49  |     throw new Error(
  50  |       `Login landed on "${here}" — not /dashboard/creator.\n` +
  51  |       `"${EMAIL}" likely hasn't completed Phase-1 KYC.\n` +
  52  |       `Fix: login in the browser, complete onboarding, then re-run.`
  53  |     );
  54  |   }
  55  | }
  56  | 
  57  | /** Navigate through the Smart Gate to reach the clarifier page. */
  58  | async function navigateToClarifier(page: Page) {
  59  |   // The Smart Gate (/phase-2) is a single clickable <Card> whose CTA button
  60  |   // "Let's sharpen it" sets selectedEntryPath = "already_have_idea" and routes
  61  |   // to the clarifier (src/app/dashboard/creator/phase-2/page.tsx).
  62  |   await page.goto("/dashboard/creator/phase-2");
  63  |   await page.waitForLoadState("networkidle");
  64  | 
  65  |   const cta = page
  66  |     .getByRole("button", { name: /sharpen it/i })   // the card CTA
  67  |     .or(page.getByText("AI Idea Clarifier"))         // fallback: the card heading
  68  |     .first();
> 69  |   await expect(cta).toBeVisible({ timeout: 15_000 });
      |                     ^ Error: expect(locator).toBeVisible() failed
  70  |   await cta.click();
  71  | 
  72  |   await page.waitForURL(/phase-2\/clarifier/, { timeout: 15_000 });
  73  |   await page.waitForLoadState("networkidle");
  74  | }
  75  | 
  76  | /** Reset journey state on the dashboard (idempotent — skips if button absent). */
  77  | async function resetJourneyIfPossible(page: Page) {
  78  |   await page.goto("/dashboard/creator");
  79  |   await page.waitForLoadState("networkidle");
  80  |   const reset = page.getByRole("button", { name: /reset progress/i });
  81  |   if (await reset.count() > 0 && await reset.isVisible()) {
  82  |     await reset.click();
  83  |     await page.waitForTimeout(1500);
  84  |   }
  85  | }
  86  | 
  87  | // ─────────────────────────────────────────────
  88  | // TESTS
  89  | // ─────────────────────────────────────────────
  90  | 
  91  | test.describe("Creator AI - live flow", () => {
  92  |   test.beforeEach(async ({ page }) => {
  93  |     await login(page);
  94  |   });
  95  | 
  96  |   // ── TEST 7: dashboard de-mock (fast, state-independent) ──────────────────
  97  |   test("TEST 7 - dashboard is de-mocked", async ({ page }) => {
  98  |     await page.goto("/dashboard/creator");
  99  |     await page.waitForLoadState("networkidle");
  100 |     const body = await page.locator("body").innerText();
  101 | 
  102 |     // Sample content that was removed during de-mock work:
  103 |     const MOCK_STRINGS = [
  104 |       "Sophie Chen",
  105 |       "Ahmed Karim",
  106 |       "Marie Laurent",
  107 |       "Aster Kitchen",
  108 |       "Northstar",
  109 |       "€186,000",   // hardcoded ARR fallback
  110 |       "Month 14",   // hardcoded break-even fallback
  111 |     ];
  112 |     for (const s of MOCK_STRINGS) {
  113 |       expect(body, `mock string "${s}" must not appear on dashboard`).not.toContain(s);
  114 |     }
  115 | 
  116 |     // At least one real KPI label must render:
  117 |     await expect(page.getByText("Idea Clarity Score")).toBeVisible();
  118 | 
  119 |     // /ai-masterplan must NOT be in the sidebar (unlinked in Step 4):
  120 |     const masterplanLink = page.locator("a[href*='ai-masterplan']");
  121 |     expect(await masterplanLink.count()).toBe(0);
  122 |   });
  123 | 
  124 |   // ── TEST 3: full AI flow (clarifier → plan → forecast), live OpenRouter ──
  125 |   test("TEST 3 - full Phase-3 AI flow with real data", async ({ page }) => {
  126 |     test.setTimeout(10 * 60 * 1000); // three real AI jobs back-to-back
  127 | 
  128 |     // Reset the shared demo account so the flow is repeatable.
  129 |     await resetJourneyIfPossible(page);
  130 | 
  131 |     // ── Clarifier ────────────────────────────────────────────────────────────
  132 |     // Go through the Smart Gate instead of navigating directly to /clarifier.
  133 |     await navigateToClarifier(page);
  134 | 
  135 |     const input = page.getByLabel("Message");
  136 |     await expect(input).toBeVisible({ timeout: 15_000 });
  137 | 
  138 |     for (const answer of CLARIFIER_ANSWERS) {
  139 |       await expect(input).toBeEnabled({ timeout: 10_000 });
  140 |       await input.fill(answer);
  141 |       // Send button — try aria-label first, then fallback role selectors.
  142 |       const sendBtn =
  143 |         page.getByLabel(/send message/i)
  144 |           .or(page.getByRole("button", { name: /send/i }))
  145 |           .or(page.locator("button[type='submit']"))
  146 |           .first();
  147 |       await sendBtn.click();
  148 |       // Small pause: lets the next AI question render before we fill again.
  149 |       await page.waitForTimeout(1200);
  150 |     }
  151 | 
  152 |     // After the 6th answer, the clarifier session polls to terminal and
  153 |     // automatically routes to /idea-summary.
  154 |     await page.waitForURL(/idea-summary/, { timeout: AI_WAIT });
  155 |     await expect(page.getByText(/clarity/i).first()).toBeVisible();
  156 | 
  157 |     // ── Business Plan (C-3) ──────────────────────────────────────────────────
  158 |     await page.goto("/dashboard/creator/phase-3/business-plan");
  159 |     await page.waitForLoadState("networkidle");
  160 | 
  161 |     const genPlan = page.getByRole("button", { name: /generate plan/i });
  162 |     await expect(genPlan).toBeVisible({ timeout: 10_000 });
  163 |     await genPlan.click();
  164 | 
  165 |     // Poll until 9 sections appear (AI job can take minutes).
  166 |     await expect(page.getByText("1. Executive Summary")).toBeVisible({
  167 |       timeout: AI_WAIT,
  168 |     });
  169 |     await expect(page.getByText("7. Financial Projections")).toBeVisible();
```