# Score Breakdown Fix — Verification Checklist

**Date:** 2026-06-19  
**Status:** Ready for Testing  
**Signed Off By:** ___________________

---

## Pre-Deployment Verification

### Code Changes ✓

- [ ] **InvestorMatch.cs**
  - [ ] `ScoreComponents` field added to class
  - [ ] `ScoreComponents` initialized with `= new()`
  - [ ] New `ScoreComponents` class has 9 properties (no more, no less)
  - [ ] All 9 properties are `int` type

- [ ] **InvestorMatcher.cs**
  - [ ] `ScoreAndExplain()` signature changed to include `ScoreComponents` in return
  - [ ] All 9 dimensions set in `components` object during calculation
  - [ ] `SectorScore` set in sector calculation block
  - [ ] `StageScore` set in stage calculation block
  - [ ] `CheckSizeScore` set in check-size calculation block
  - [ ] `GeographyScore` set in geography calculation block
  - [ ] `EquityTypeScore` set in equity-type calculation block
  - [ ] `InvestmentHistoryScore` set in investment-history calculation block
  - [ ] `RevenueStageScore` set in revenue-stage calculation block
  - [ ] `MarketSizeScore` set in market-size calculation block
  - [ ] `GrowthPotentialScore` set in growth-potential calculation block
  - [ ] `FindMatchesAsync()` unpacks `components` from tuple and assigns to `match.ScoreComponents`
  - [ ] `CalculateMatchScoreAsync()` updated to discard `components` (uses `_` in tuple)

- [ ] **CompanyService.cs**
  - [ ] `BuildScoreBreakdown()` function completely removed
  - [ ] `GetOpportunityForInvestorAsync()` maps 9 fields from `match.ScoreComponents`
  - [ ] Each mapping uses null-coalescing (`?? 0`)
  - [ ] No remaining references to `BuildScoreBreakdown()`

- [ ] **CompanyDtos.cs**
  - [ ] `OpportunityScoreBreakdownDto` has exactly 9 properties
  - [ ] Properties are: SectorFit, StageFit, CheckSizeFit, GeographyFit, EquityTypeFit, InvestmentHistoryFit, RevenueStageScore, MarketSizeScore, GrowthPotentialScore
  - [ ] Each property documented with max value and meaning

- [ ] **opportunities.ts (Frontend)**
  - [ ] `OpportunityScoreBreakdown` interface has exactly 9 properties
  - [ ] Property names match DTO (camelCase)
  - [ ] All properties are `number` type

- [ ] **ScoreBreakdownPanel.tsx**
  - [ ] `ROWS` array has exactly 9 entries
  - [ ] First entry is `{ key: "sectorFit", label: "Sector Match" }`
  - [ ] Last entry is `{ key: "growthPotentialScore", label: "Growth Potential" }`
  - [ ] No references to old field names (teamScore, etc.)

### Compilation ✓

- [ ] Backend compiles without errors (`dotnet build`)
- [ ] Backend compiles without warnings
- [ ] Frontend builds without errors (`npm run build`)
- [ ] No TypeScript errors in ScoreBreakdownPanel.tsx
- [ ] No TypeScript errors in type files

### Unit Tests ✓

- [ ] Create test for `ScoreAndExplain()` with known sector match → verifies `components.SectorScore = 25`
- [ ] Create test for `ScoreAndExplain()` with known sector miss → verifies `components.SectorScore = 0`
- [ ] Test all 9 dimensions for "hit" and "miss" cases
- [ ] Verify returned total score = sum of component scores (clamped to 100)
- [ ] Test null-coalescing in API response (`match.ScoreComponents == null` → all values return 0)

### Database ✓

- [ ] No migrations needed (MongoDB auto-adds `scoreComponents` on first write)
- [ ] Existing documents with `scoreComponents = null` are handled by null-coalescing
- [ ] Run a sanity query to verify document structure before/after first write

---

## Post-Deployment Verification

### 1. API Response ✓

**Endpoint:** `GET /companies/opportunities/{companyId}`

- [ ] Response includes `scoreBreakdown` object
- [ ] `scoreBreakdown` has exactly 9 fields (not 4)
- [ ] All 9 fields are present (even if value is 0)
- [ ] No field is null
- [ ] Values are realistic (0–25 for sectorFit, 0–15 for stageFit, etc.)
- [ ] Sum of component scores ≤ 100 (or matches actual total score)

**Sample Response:**
```json
{
  "matchScore": 76,
  "scoreBreakdown": {
    "sectorFit": 25,
    "stageFit": 15,
    "checkSizeFit": 20,
    "geographyFit": 10,
    "equityTypeFit": 0,
    "investmentHistoryFit": 8,
    "revenueStageScore": 7,
    "marketSizeScore": 4,
    "growthPotentialScore": 0
  }
}
```

### 2. Frontend UI ✓

**Page:** `/dashboard/investor/discovery/{companyId}`

- [ ] MatchScoreCard renders successfully
- [ ] ScoreBreakdownPanel loads without errors
- [ ] All 9 bars are visible (scroll if needed)
- [ ] Each bar has a label and value
- [ ] Labels are clear: "Sector Match", "Funding Stage", "Check Size", etc.
- [ ] Values are displayed as 0–100 (clamped from real component scores)
- [ ] All bars are proportionally sized based on values

**Visual Check:**
- [ ] Sector Match bar is visible and has a value
- [ ] Equity Type bar is visible (was hidden before)
- [ ] Investment History bar is visible (was hidden before)
- [ ] No bars show "undefined" or "NaN"
- [ ] No console errors in browser DevTools

### 3. Real Matching Data ✓

**Action:** Regenerate matches for one company

```bash
# Call the backend regeneration endpoint or run matching logic
```

- [ ] New matches created with non-zero `scoreComponents`
- [ ] When you fetch an opportunity, all 9 values are populated (not null)
- [ ] Fetch same opportunity via API and verify scoreBreakdown has all 9 fields
- [ ] Open UI and verify all 9 bars render (not just some)

### 4. Legacy Data Handling ✓

**Action:** Create a test match manually (simulating pre-fix data)

```csharp
var legacyMatch = new InvestorMatch {
    MatchScore = 75,
    ScoreComponents = null,  // ← null for legacy docs
    // ...
};
```

- [ ] Fetching this match via API doesn't crash
- [ ] `scoreBreakdown` is returned with all 9 fields = 0 (from null-coalescing)
- [ ] UI renders all 9 bars with 0 values
- [ ] No exceptions in logs

### 5. Cross-Browser & Responsive ✓

- [ ] Chrome: All 9 bars render, values visible
- [ ] Firefox: All 9 bars render, values visible
- [ ] Safari: All 9 bars render, values visible
- [ ] Mobile (375px width): All 9 bars visible (may stack or scroll)
- [ ] Tablet (768px width): All 9 bars visible
- [ ] Desktop (1280px+ width): All 9 bars visible in optimal layout

### 6. Performance ✓

- [ ] API response time unchanged (no new queries)
- [ ] Frontend render time unchanged (same number of DOM elements, just more)
- [ ] No memory leaks in ScoreBreakdownPanel
- [ ] ScoreBreakdownPanel re-renders only when `breakdown` prop changes

### 7. Logging & Monitoring ✓

- [ ] No ERROR logs for null-coalescing fallbacks
- [ ] No WARN logs for missing scoreComponents
- [ ] If old matches are fetched, log a single INFO message (optional)
- [ ] Monitor API response times post-deployment

---

## Spot-Check Scenarios

### Scenario 1: Perfect Match
**Setup:** SaaS company, Seed stage, €500k ask, France, SAFEs  
**Investor:** Prefers SaaS, Seed, €200k–€2M range, France, SAFEs, 5+ exits

**Expected:**
- [ ] Sector Match: 25 (hit)
- [ ] Funding Stage: 15 (hit)
- [ ] Check Size: 20 (in band)
- [ ] Geography: 10 (hit)
- [ ] Equity Type: 5 (hit)
- [ ] Investment History: 8 (experienced)
- [ ] Revenue Stage: 7 (hits seed appetite)
- [ ] Market Size: 4 (assume large)
- [ ] Growth Potential: 4 (assume high)
- [ ] **Total:** 98

**Verify:**
- [ ] All bars are at or near max value
- [ ] No bars are 0
- [ ] Total matches API MatchScore

### Scenario 2: Sector Mismatch
**Setup:** Web3 company, Seed stage, €500k ask, France  
**Investor:** Prefers SaaS only (not Web3)

**Expected:**
- [ ] Sector Match: 0 (miss)
- [ ] Funding Stage: 15 (hit)
- [ ] Check Size: 20 (in band)
- [ ] Geography: 10 (hit)
- [ ] Equity Type: [0 or 5]
- [ ] Investment History: 8
- [ ] Revenue Stage: 7
- [ ] Market Size: 4
- [ ] Growth Potential: 4
- [ ] **Total:** ~68

**Verify:**
- [ ] Sector Match bar is visibly 0
- [ ] Other bars are non-zero where expected
- [ ] Rationale mentions "sector mismatch"

### Scenario 3: Check-Size Mismatch
**Setup:** Company asking €5M, Investor range €200k–€2M

**Expected:**
- [ ] Check Size: 0 (outside band, not adjacent)
- [ ] All other components: [varies]

**Verify:**
- [ ] Check Size bar is 0
- [ ] Rationale mentions "check size outside band"

### Scenario 4: Legacy Match (pre-fix)
**Setup:** Match created before this fix (scoreComponents = null)

**Expected:**
- [ ] All 9 fields: 0
- [ ] Total: 0
- [ ] No API errors
- [ ] No UI crashes

**Verify:**
- [ ] API response returns all 9 fields with 0 value
- [ ] ScoreBreakdownPanel renders without errors
- [ ] All bars are empty (0 height)

---

## Regression Tests

### Must Not Break

- [ ] Discovery feed still loads matches
- [ ] Match score ranking still works (sorted by MatchScore total)
- [ ] Opportunity detail page still renders all other tabs (Overview, Traction, etc.)
- [ ] NDA workflow unchanged
- [ ] Deal creation workflow unchanged
- [ ] Negotiation workspace unchanged

### Run Full Test Suite

- [ ] `dotnet test` (backend)
- [ ] `npm test` (frontend)
- [ ] No new test failures introduced

---

## Sign-Off

### Code Reviewer
- [ ] All code changes reviewed and approved
- [ ] No style violations
- [ ] No security concerns

**Reviewer Name:** ___________________  
**Signature:** ___________________  
**Date:** ___________________

### QA/Tester
- [ ] All verification scenarios passed
- [ ] No regressions detected
- [ ] UI/UX acceptable

**Tester Name:** ___________________  
**Signature:** ___________________  
**Date:** ___________________

### Deployment Lead
- [ ] Ready for production
- [ ] Rollback plan reviewed
- [ ] Monitoring alerts configured

**Deployment Lead:** ___________________  
**Signature:** ___________________  
**Date:** ___________________

---

## Post-Launch Monitoring (7 days)

- [ ] Monitor API error rates (should be 0% increase)
- [ ] Check for null-coalescing fallback logs (legacy matches)
- [ ] Verify UI rendering performance (no slowdowns)
- [ ] Review user feedback (investor confidence improvements?)
- [ ] Confirm all new matches have non-zero scoreComponents

---

## Issues Found & Resolution

| Issue | Severity | Status | Resolution |
|-------|----------|--------|------------|
| | | | |

---

**Checklist Version:** 1.0  
**Last Updated:** 2026-06-19  
**Status:** READY FOR TESTING ✅
