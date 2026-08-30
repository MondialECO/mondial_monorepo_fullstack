# Mondial Creator — Test Harness

Two test suites covering the full Creator flow.

---

## Files

| File | What it tests | How to run |
|------|--------------|------------|
| `creator/e2e/support/manual/creator-api-tests.sh` | API-level: Phase 3 order (422), credit exhaustion (402), rate limit (429) | bash script |
| `creator/e2e/support/manual/creator-e2e.spec.ts` | Browser + API: credits grant, AI sessions, Level Up, dashboard de-mock | Playwright |
| `playwright.config.ts` | Playwright configuration | (auto-used) |

---

## Prerequisites

Both backend and frontend must be running locally:
```bash
# Terminal 1 — backend
cd backend && dotnet run

# Terminal 2 — frontend
npm run dev  # from the repository root; src/app is canonical
```

OpenRouter API key must be set:
```bash
dotnet user-secrets set "OpenRouter:ApiKey" "sk-or-v1-<your-new-key>"
```

---

## 1. API Tests (curl — fastest, no browser needed)

```bash
chmod +x tests/creator/e2e/support/manual/creator-api-tests.sh
./tests/creator/e2e/support/manual/creator-api-tests.sh
```

What it covers:
- TEST 2: Forecast without business plan → 422 `business_plan_required`
- TEST 4: Zero-credit user → 402 on all 3 AI flows (requires manual MongoDB step)
- TEST 6: 21st request in 1 min → 429 rate limit
- ADDITIONAL: Phase guard check

For TEST 4, you need to set a user's credits to 0 in MongoDB:
```js
// In mongosh
db.AICredits.updateOne(
  { ownerUserId: "<userId from script output>" },
  { $set: { balance: 0 } }
)
```

---

## 2. Playwright Tests (browser + API)

```bash
# Install (first time only)
npm install --save-dev @playwright/test
npx playwright install chromium

# Run
npx playwright test tests/creator/e2e/support/manual/creator-e2e.spec.ts --headed
```

What it covers:
- TEST 1: Fresh user gets 100 credits on first AI call (lazy grant)
- TEST 3: Business plan + forecast both complete with real AI output
- TEST 5: Level Up creates entrepreneur profile + bridge pre-fills LegalStructure
- TEST 7: Dashboard DOM has no mock strings (Sophie Chen etc.)

---

## Test Coverage Matrix

| Test | API script | Playwright | Manual |
|------|-----------|-----------|--------|
| 1 — Credits lazy grant | — | ✅ | Verify MongoDB Balance=99 |
| 2 — Phase 3 order | ✅ | — | — |
| 3 — Full AI flow | — | ✅ | Check chart data in browser |
| 4 — Credit exhaustion UX | ✅ (partial) | — | Verify frontend message |
| 5 — Level Up + Bridge | — | ✅ | Check Phase 4 cap table in browser |
| 6 — Rate limit | ✅ | — | — |
| 7 — Dashboard de-mock | — | ✅ | — |

---

## What to watch manually (not automatable)

1. **TEST 3 — Charts**: Open `/phase-3/forecast` after AI completes. Charts must show real data, not flat bars or mock values.

2. **TEST 4 — Frontend UX**: After a 402, the UI must show:
   - Clarifier: "You've used all your AI credits" — no retry button
   - Business plan: "You've used all your AI credits" — Generate button disabled
   - Forecast: "You've used all your AI credits" — no retry button
   - NOT a generic error, NOT a retry button on 402

3. **TEST 5 — Cap table**: After Level Up, go to `/dashboard/entrepreneur/phase-4`.
   - If Tanvir 70% / ESOP 10% / Investors 20% → `SeedCapTableFromPlanAsync` succeeded ✅
   - If empty/single founder row → seed failed silently; grep backend log for `"Cap-table seed failed"`

4. **TEST 5 — SignalR**: Level Up redirect happens via `setTimeout` (1600ms), not SignalR subscription. The `LevelUpComplete` event IS emitted server-side but the celebration screen doesn't subscribe. Redirect still works.

---

## Reporting results

After running both suites, report:

```
API TESTS:
  TEST 2 (Phase 3 order): PASS / FAIL
  TEST 4 (Credit exhaustion): PASS / FAIL / SKIPPED
  TEST 6 (Rate limit): PASS / FAIL

PLAYWRIGHT TESTS:
  TEST 1 (Credits lazy grant): PASS / FAIL
  TEST 3 (Full AI flow): PASS / FAIL — session times?
  TEST 5 (Level Up + Bridge): PASS / FAIL — cap table seeded?
  TEST 7 (Dashboard de-mock): PASS / FAIL

MANUAL CHECKS:
  Chart data in browser: real / mock
  402 UX in all 3 flows: distinct / generic
  Cap table after Level Up: seeded / empty

BUGS FOUND: (list with phase + error + log line)
```
