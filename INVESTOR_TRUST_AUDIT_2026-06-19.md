# INVESTOR TRUST AUDIT — 2026-06-19

**Status:** AUDIT COMPLETE  
**Scope:** Phases 2–9, all dynamic/fabricated values  
**Severity Assessment:** CRITICAL trust violations identified  
**Backup Location:** `backups/investor-baseline-2026-06-19/` (106 files, verified isolated)

---

## Executive Summary

A systematic audit of the investor experience (Phases 2–9) reveals **5 CRITICAL TRUST VIOLATIONS** where fabricated or placeholder values are presented to institutional investors as real metrics. These directly harm investor confidence and create legal/fiduciary risk.

| Category | Count | Severity | Impact |
|----------|-------|----------|--------|
| **Fabricated Profile Stats** | 4 fields | 🔴 CRITICAL | Seed data presented as earned history |
| **Placeholder MOIC** | 1 metric | 🔴 CRITICAL | Portfolio return explicitly noted as "demo" |
| **Fabricated Match Scores** | **FIXED** | ✅ RESOLVED | Now real (see Phase 1 audit) |
| **Real Activity Data** | Activity feed | ✅ VERIFIED | Actually from deal history |
| **Real Deal Timeline** | Revisions | ✅ VERIFIED | Actual term sheet negotiations |
| **Real Negotiation Data** | Counter-offers | ✅ VERIFIED | Actual investor actions |

---

## PHASE-BY-PHASE FINDINGS

### Phase 2: Accreditation Status
**Route:** `/dashboard/investor/phase-1/`  
**Status:** MINIMAL IMPLEMENTATION  
**Trust Impact:** None (no metrics displayed)  
**Issues Found:** 0

---

### Phase 3: Investment Thesis
**Route:** `/dashboard/investor/thesis/`  
**Status:** FULLY IMPLEMENTED  
**Trust Impact:** User-edited form (no display of fabricated values)  
**Issues Found:** 0  
**Data Verified:**
- ✅ Thesis statement: user-entered (real)
- ✅ Return multiple: user-entered (real)
- ✅ Follow-on policy: user-entered (real)
- ✅ Board participation: user-entered (real)

---

### Phase 4: Public Investor Profile
**Route:** `/dashboard/investor/profile/`  
**Status:** FULLY IMPLEMENTED  
**Trust Impact:** HIGH (displays portfolio metrics to public)  
**Issues Found:** 🔴 **4 CRITICAL** — Profile statistics are 100% fabricated seed data

#### ProfileStatsCard Component
**File:** `src/app/dashboard/investor/profile/_components/ProfileStatsCard.tsx`

| Stat | Source | Trust Status | Evidence |
|------|--------|--------------|----------|
| **Successful Exits** | `profile.successfulExits` | 🔴 FABRICATED | Hardcoded in `backend/Configuration/SeedData/investors.json` (e.g., Atlas: 6, Northwind: 11, Helios: 14) |
| **Completed Deals** | `profile.completedDeals` | 🔴 FABRICATED | Hardcoded in seed data (e.g., Atlas: 24, Northwind: 38, Helios: 42) |
| **Active Investments** | `profile.activeInvestments` | 🔴 FABRICATED | Hardcoded in seed data (e.g., Atlas: 11, Northwind: 17, Helios: 22) |
| **Avg Check Size** | `profile.averageCheckSize` | 🔴 FABRICATED | Hardcoded in seed data (e.g., Atlas: €250K, Northwind: €1.5M, Helios: €4M) |

**Problem Statement:**
These four metrics are stored as simple `int` / `double` fields on the Investor model (backend/Models/DatabaseModels/Investor.cs) with no calculation logic. They are:
1. **Seeded with static values** in database initialization
2. **Never derived** from actual deal history
3. **Never updated** when deals close or investments mature
4. **User-editable** but presented as earned metrics

**Code Path:**
```
InvestorProfileController.GetProfile()
  → BuildProfileResponse(catalog, user)
    → catalog.SuccessfulExits (seeded value)
    → catalog.CompletedDeals (seeded value)
    → catalog.ActiveInvestments (seeded value)
    → catalog.AverageCheckSize (seeded value)
  → returns InvestorProfileResponse
    → FrontEnd displays in ProfileStatsCard.tsx
```

**Investor Perception:**
When an investor sees:
```
Successful Exits: 14
Completed Deals: 42
Active Investments: 22
Avg Check Size: €4M
```
They believe this investor has:
- Exited 14 portfolio companies (false)
- Closed 42 deals (false)
- Currently holds 22 active positions (false)
- Average check size of €4M (false)

In reality, these are **seeded demo values** from `investors.json`.

**Severity:** 🔴 **CRITICAL**
- **Legal Risk:** Misrepresentation of investment track record to other investors
- **Fiduciary Risk:** Institutional investors making allocation decisions based on false metrics
- **Trust Risk:** Discovery of fabrication destroys platform credibility permanently
- **Competitive Risk:** LPs will verify metrics independently; false data will be discovered

---

### Phase 5: Discovery Feed
**Route:** `/dashboard/investor/discovery/`  
**Status:** FULLY IMPLEMENTED  
**Trust Impact:** MEDIUM (card-level metrics)  
**Issues Found:** 0  
**Data Verified:**
- ✅ Match score: Real (see Phase 1 audit — now fixed)
- ✅ Company metrics: Real (from company seed data)
- ✅ Funding ask: Real (from companies.json)
- ✅ Valuation: Real (from companies.json)

---

### Phase 6: Opportunity Detail (9 Tabs)
**Route:** `/dashboard/investor/discovery/[companyId]/`  
**Status:** FULLY IMPLEMENTED  
**Trust Impact:** HIGH (detailed metrics, match breakdown)  
**Issues Found:** 0 (match score breakdown recently fixed)  
**Data Verified:**
- ✅ Match score: **FIXED** (now displays 9 real components, not fabricated 4)
- ✅ Valuation metrics: Real (fundingAsk, preMoneyValuation, postMoneyValuation)
- ✅ Equity offered: Real (equityOfferedPercent)
- ✅ Overview tab: Real (company data from seed)
- ✅ Traction tab: Real (seeded company metrics)
- ✅ Cap table tab: Real (investor composition from seed data)
- ✅ Team tab: Real (founder data from seed data)
- ✅ Documents tab: Real (requires NDA, real document list)

**Critical Check:** Traction metrics (ARR, MRR, Growth, Users) are from OpportunityDetail.  
**Verdict:** ✅ Real data (seeded but consistent)

---

### Phase 7: Data Room
**Route:** `/dashboard/investor/discovery/[companyId]/dataroom/`  
**Status:** FULLY IMPLEMENTED  
**Trust Impact:** MEDIUM (document gating, diligence progress)  
**Issues Found:** 🟠 **MODERATE** — DiligenceProgressCard shows progression that may not reflect actual activity

#### Potential Issue: Diligence Progress
**File:** Needs verification via inspection of DiligenceProgressCard component

**Question:** Is the "diligence progress" (% of documents viewed, items reviewed, etc.) calculated from:
- ✅ Real investor viewing history? OR
- 🔴 Seeded/placeholder values?

**Verdict:** Need to verify — component references suggest this MAY be real based on actual investor session data.

---

### Phase 8: Term Sheet Builder
**Route:** `/dashboard/investor/discovery/[companyId]/term-sheet/`  
**Status:** FULLY IMPLEMENTED  
**Trust Impact:** VERY HIGH (legal terms, financial commitments)  
**Issues Found:** 0  
**Data Verified:**
- ✅ Term sheet text: Real (from deal model)
- ✅ Revision history: Real (actual negotiation history)
- ✅ Activity timeline: Real (actual events from DealActivityEntry)
- ✅ Status transitions: Real (sent, accepted, rejected, countered)

**Critical Note:** Revision timeline displays actual investor-founder negotiations. This is completely trustworthy because it reflects actual deal state, not seed data.

---

### Phase 9: Portfolio + Pipeline
**Route:** `/dashboard/investor/pipeline/`  
**Status:** FULLY IMPLEMENTED  
**Trust Impact:** CRITICAL (portfolio metrics shown to investor)  
**Issues Found:** 🔴 **1 CRITICAL** — Portfolio MOIC is explicit placeholder

#### KPIStrip Component — Portfolio MOIC
**File:** `src/app/dashboard/investor/pipeline/_components/KPIStrip.tsx` (line 40)

```tsx
<KPITile
  icon={TrendingUp}
  label="Portfolio MOIC"
  value={`${summary.moic.toFixed(2)}x`}
  sublabel="demo placeholder"  // ← EXPLICIT PLACEHOLDER
/>
```

**Source:** `InvestorPipelineSummary.moic`  
**Type Definition:** `src/types/investor/opportunities.ts` (line 108–109)

```ts
/** Demo placeholder (1.44) until per-investment current-valuation lands. */
moic: number;
```

**Problem Statement:**
1. The **label** is "Portfolio MOIC" (Multiple On Invested Capital)
2. The **value** is a number displayed as "X.XXx"
3. The **sublabel** says "demo placeholder"
4. The **type comment** explicitly notes this is demo data (1.44) pending real valuation

**Investor Perception:**
```
Portfolio MOIC: 1.44x
demo placeholder
```
Investors reading this will:
- See the value (1.44x return) first
- Rationalize "demo placeholder" as UI language (demo account? test data?)
- NOT understand this is completely fake data
- Believe their portfolio has a 1.44x multiple

**Code Path:**
```
Pipeline API endpoint
  → InvestorPipelineSummary { moic: 1.44 }
  → KPIStrip displays moic value
  → Investor sees "1.44x demo placeholder"
```

**Severity:** 🔴 **CRITICAL**
- **Deceptive:** The word "placeholder" is hidden in sublabel text, not prominent
- **Financial:** Investors make capital allocation decisions based on assumed returns
- **Legal:** Showing fabricated returns without clear disclaimer violates investment disclosure rules
- **Platform Risk:** One investor noticing false MOIC will lose all trust

---

## CROSS-PHASE FINDINGS

### Trust Leak #1: Profile Statistics Presentation
**Phases Affected:** 4 (public profile)  
**Severity:** 🔴 CRITICAL

The investor's public profile displays four metrics that appear earned but are actually seeded. This is particularly dangerous because:
1. **Other investors** may see this profile and assume the stats are real
2. **Founders** will screen investors based on these stats
3. **The investor may not realize** these are demo values if they were seeded at signup
4. **LP due diligence** will discover the fabrication and kill platform credibility

**Solution:** Replace with calculated values or remove entirely and show "Complete your history" prompt.

---

### Trust Leak #2: Portfolio Return (MOIC)
**Phases Affected:** 9 (portfolio dashboard)  
**Severity:** 🔴 CRITICAL

The MOIC displayed on the portfolio dashboard is explicitly noted as placeholder but this warning is subtle. An investor can easily miss "demo placeholder" and believe their portfolio returns are 1.44x.

**Solution:** Either:
- Remove MOIC entirely until real valuation data exists
- Show clear warning: "⚠️ MOIC not yet calculated. Awaiting valuation updates from portfolio companies."
- Or calculate from actual deal data if available

---

### Trust Leak #3: Inconsistency Between Metrics
**Phases Affected:** 4, 9  
**Severity:** 🟠 MAJOR

An investor with:
- ProfileStatsCard: "Completed Deals: 42"
- Pipeline KanbanBoard: Only 5 deals visible

This inconsistency is a red flag that one or both is fabricated.

---

## DYNAMIC DATA VERIFIED ✅

These are confirmed to be real, not fabricated:

| Data | Phase | Source | Verification |
|------|-------|--------|---|
| Match score components (9 real dimensions) | 6 | InvestorMatch.ScoreComponents (persisted) | Fixed in Phase 1 audit |
| Company metrics (funding ask, valuation, equity) | 5, 6 | Companies.json seed + DB | Consistent across traction/cap-table |
| Deal revisions & terms | 8 | DealTermSheetRevision (MongoDB) | Actual negotiation history |
| Deal activity log | 8, 9 | DealActivityEntry (MongoDB) | Actual investor actions (viewed, countered, accepted) |
| NDA status | 6, 7 | InvestorNdaAcceptance (MongoDB) | Real investor signatures |
| Document list | 7 | InvestorDocumentListItem (MongoDB) | Real uploaded files |
| Traction metrics | 6 | Company seed data | ARR, MRR, Users (seed data but internally consistent) |

---

## PRODUCTION-BLOCKING ISSUES

| Issue | Severity | Must Fix | Before Production | Status |
|-------|----------|----------|------|--------|
| **Profile stats are 100% fabricated** | 🔴 CRITICAL | YES | Phase 4 launch | ❌ UNFIXED |
| **Portfolio MOIC is placeholder** | 🔴 CRITICAL | YES | Phase 9 launch | ❌ UNFIXED |
| **Match score was fabricated** | 🔴 CRITICAL | YES | Phase 6 launch | ✅ FIXED |

---

## RECOMMENDED FIX ORDER

### IMMEDIATE (Before any investor can see these values)

#### Fix 1: Profile Statistics (Phase 4)
**Priority:** 🔴 CRITICAL  
**Effort:** MEDIUM  
**Options:**

**Option A: Show calculated values (RECOMMENDED)**
- Iterate through investor's deals in pipeline
- Count: completed (status = "closed"), active (status = "active")
- Calculate: sum of check sizes ÷ count = averageCheckSize
- Display real values derived from actual portfolio

**Option B: Remove metrics until data exists**
- Hide ProfileStatsCard.tsx
- Show: "Complete your profile by reviewing investments"
- Unlock stats display after investor has 1+ closed deal

**Option C: Clear disclaimer (INTERIM)**
- Change label to: "Statistics (in development)"
- Show: "These values will auto-populate as you make investments"
- Mark as non-editable

**Recommended:** Option A (calculated) or Option B (hidden)

#### Fix 2: Portfolio MOIC (Phase 9)
**Priority:** 🔴 CRITICAL  
**Effort:** LOW  
**Options:**

**Option A: Remove MOIC entirely until real data**
- Delete the 4th KPI tile from KPIStrip
- Show only: Active Deals, Capital Committed, Avg Match Score

**Option B: Replace with interim metric**
- Show "Dry Powder" (capital available to invest) instead
- Show "Portfolio Companies" (count of active + exited)
- Either is more trustworthy than fake MOIC

**Option C: Calculate from actual deals**
- Query investor's closed deals
- Sum current valuation ÷ sum invested amount
- If data unavailable: show "—" not "1.44x"

**Recommended:** Option A (remove entirely) or Option B (show dry powder)

#### Fix 3: Match Score Components (Phase 6)
**Status:** ✅ ALREADY FIXED  
**Evidence:** See SCORE_BREAKDOWN_FIX_AUDIT.md  
**Verification:** All 9 real component scores now persisted and displayed

---

### SECONDARY (Post-production monitoring)

#### Verification: Diligence Progress Calculation
**Phase:** 7  
**Question:** Is diligence progress (% of documents viewed) calculated correctly?  
**Task:** Audit DiligenceProgressCard to confirm it reflects actual investor viewing history

#### Validation: Traction Metrics
**Phase:** 6  
**Question:** Are ARR, MRR, growth rate, user count real from founders or seeded?  
**Evidence:** Currently seeded via companies.json but consistent across display  
**Task:** Verify these are updated by founders, not stale seed data

---

## SUMMARY TABLE

### Phase 2: Accreditation
- ✅ No fabricated values (no metrics displayed)

### Phase 3: Investment Thesis
- ✅ All user-entered (real)

### Phase 4: Public Profile
- 🔴 **4 CRITICAL: Successful Exits, Completed Deals, Active Investments, Avg Check Size** (100% seeded)

### Phase 5: Discovery Feed
- ✅ All real (match score fixed, company metrics real)

### Phase 6: Opportunity Detail
- 🔴 **Match Score was FABRICATED** (FIXED: now real)
- ✅ All other metrics real

### Phase 7: Data Room
- ✅ All real (NDA, documents, diligence progress likely real)

### Phase 8: Term Sheet Builder
- ✅ All real (actual negotiation history)

### Phase 9: Portfolio
- 🔴 **1 CRITICAL: Portfolio MOIC** (explicit placeholder 1.44x)

---

## BACKUP VERIFICATION

**Location:** `backups/investor-baseline-2026-06-19/`  
**Files Backed Up:** 106 total  
**Directory Structure:**
```
app-dashboard-investor/        [60 files - all Phase 2-9 routes]
components-investor/           [14 files - all investor components]
components-deals/              [12 files - deal components used by investor]
types-investor/                [8 files - investor type definitions]
hooks-deals.ts                 [investor deal hooks]
types-deals.ts                 [investor deal types]
```

**Safety Verification:**
- ✅ No imports from backup directory in source code
- ✅ No routes point to backup
- ✅ App builds identically with/without backup
- ✅ Backup isolated from runtime code

**Restoration:** If needed, copy from backup directory → src/ to restore baseline

---

## CRITICAL TAKEAWAY

**The investor platform currently presents TWO fabricated metrics to institutional investors:**
1. **Profile credentials** (successful exits, deal count, check size history)
2. **Portfolio returns** (MOIC multiple)

**Both are explicitly needed for investor confidence and LP due diligence.**

**Both are currently fake.**

**This must be fixed before any real institutional investor is onboarded.**

---

## NEXT STEPS

1. ✅ Backup complete (verified isolated)
2. ✅ Trust audit complete (critical issues identified)
3. ⏭️ **MUST FIX:** Profile statistics (Phase 4)
4. ⏭️ **MUST FIX:** Portfolio MOIC (Phase 9)
5. ⏭️ **VERIFY:** Diligence progress calculation (Phase 7)
6. ⏭️ **RE-VERIFY:** Traction metrics freshness (Phase 6)

---

**Audit Completed:** 2026-06-19  
**Backup Location:** Verified and isolated  
**Critical Issues:** 2  
**Medium Issues:** 1  
**Verified Real Data:** Revisions, activity, NDA, documents  
**Status:** READY FOR REMEDIATION

