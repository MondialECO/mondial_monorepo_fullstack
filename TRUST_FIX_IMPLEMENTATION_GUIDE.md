# Trust Issues — Implementation Guide

**Date:** 2026-06-19  
**Critical Issues:** 2  
**Estimated Time:** 3 hours total

---

## Issue #1: Profile Statistics Fabrication (Phase 4)

### The Problem
Four profile metrics (Successful Exits, Completed Deals, Active Investments, Avg Check Size) are displayed as earned history but are actually hardcoded seed data.

**Files:**
- `src/app/dashboard/investor/profile/_components/ProfileStatsCard.tsx` — Displays the metrics
- `backend/Controllers/InvestorPhaseController.cs` — Provides the metrics via API
- `backend/Models/DatabaseModels/Investor.cs` — Stores the fields
- `backend/Configuration/SeedData/investors.json` — Hardcoded seed values

### Current Code

#### Frontend Display (src/app/dashboard/investor/profile/_components/ProfileStatsCard.tsx)
```tsx
<KPITile
  icon={Award}
  label="Successful exits"
  value={String(profile.successfulExits ?? 0)}  // ← Displays seeded value
/>
<KPITile
  icon={CheckCircle2}
  label="Completed deals"
  value={String(profile.completedDeals ?? 0)}   // ← Displays seeded value
/>
<KPITile
  icon={Activity}
  label="Active investments"
  value={String(profile.activeInvestments ?? 0)} // ← Displays seeded value
/>
<KPITile
  icon={DollarSign}
  label="Avg. check size"
  value={fmtUsd(profile.averageCheckSize)}       // ← Displays seeded value
/>
```

#### Backend Source (backend/Controllers/InvestorPhaseController.cs:262–298)
```csharp
private static InvestorProfileResponse BuildProfileResponse(Investor? catalog, ApplicationUser user) => new()
{
    // ...
    SuccessfulExits = catalog?.SuccessfulExits ?? 0,           // ← Seeded value
    AverageCheckSize = catalog?.AverageCheckSize ?? 0,         // ← Seeded value
    CompletedDeals = catalog?.CompletedDeals ?? 0,             // ← Seeded value
    ActiveInvestments = catalog?.ActiveInvestments ?? 0,       // ← Seeded value
    // ...
};
```

#### Seed Data (backend/Configuration/SeedData/investors.json)
```json
{
  "Name": "Atlas Seed Partners",
  "SuccessfulExits": 6,                // ← Hardcoded
  "AverageCheckSize": 250000,          // ← Hardcoded
  "CompletedDeals": 24,                // ← Hardcoded
  "ActiveInvestments": 11              // ← Hardcoded
}
```

### Solution Options

#### Option A: RECOMMENDED — Calculate from Actual Deal History

**Approach:**
1. When fetching investor profile, count their actual deals
2. Calculate: closed deals = status "closed"
3. Calculate: active investments = status "active" 
4. Calculate: avg check size = sum(deal.amount) / count(deals)
5. Display real values derived from deal data

**Implementation:**

**File:** `backend/Controllers/InvestorPhaseController.cs` (in BuildProfileResponse method)

Replace:
```csharp
SuccessfulExits = catalog?.SuccessfulExits ?? 0,
AverageCheckSize = catalog?.AverageCheckSize ?? 0,
CompletedDeals = catalog?.CompletedDeals ?? 0,
ActiveInvestments = catalog?.ActiveInvestments ?? 0,
```

With:
```csharp
SuccessfulExits = await CountSuccessfulExits(catalog?.Id),  // Query deals where status = "closed"
AverageCheckSize = await CalculateAverageCheckSize(catalog?.Id), // Sum all deal amounts / count
CompletedDeals = await CountClosedDeals(catalog?.Id),  // Count where status != "active"
ActiveInvestments = await CountActiveDeals(catalog?.Id), // Count where status = "active"
```

**Helper Methods to Add:**
```csharp
private async Task<int> CountSuccessfulExits(string? investorId)
{
    if (string.IsNullOrEmpty(investorId)) return 0;
    var deals = await _dbContext.Deals
        .Find(d => d.Investor?.Id == investorId && d.Status == "closed")
        .ToListAsync();
    return deals.Count;
}

private async Task<double> CalculateAverageCheckSize(string? investorId)
{
    if (string.IsNullOrEmpty(investorId)) return 0;
    var deals = await _dbContext.Deals
        .Find(d => d.Investor?.Id == investorId && d.Status != "pending")
        .ToListAsync();
    if (!deals.Any()) return 0;
    return deals.Average(d => d.InvestmentAmount);
}

private async Task<int> CountClosedDeals(string? investorId)
{
    if (string.IsNullOrEmpty(investorId)) return 0;
    var deals = await _dbContext.Deals
        .Find(d => d.Investor?.Id == investorId && d.Status == "closed")
        .ToListAsync();
    return deals.Count;
}

private async Task<int> CountActiveDeals(string? investorId)
{
    if (string.IsNullOrEmpty(investorId)) return 0;
    var deals = await _dbContext.Deals
        .Find(d => d.Investor?.Id == investorId && d.Status == "active")
        .ToListAsync();
    return deals.Count;
}
```

**Time Estimate:** 2-3 hours  
**Benefit:** Metrics are 100% real, calculated from actual investor deals  
**Risk:** If investor has no deals, all values will be 0 (which is honest)

---

#### Option B: Hide Until Data Exists (INTERIM FIX)

**Approach:**
1. Remove ProfileStatsCard entirely
2. Show message: "Statistics will populate as you make investments"
3. Restore card when investor has 1+ completed deal

**Implementation:**

**File:** `src/app/dashboard/investor/profile/page.tsx`

Replace:
```tsx
<ProfileStatsCard profile={profile} />
```

With:
```tsx
{profile.completedDeals > 0 || profile.activeInvestments > 0 ? (
  <ProfileStatsCard profile={profile} />
) : (
  <Card className="p-6 bg-muted/30 border-border rounded-lg">
    <p className="text-sm text-muted-foreground">
      Portfolio statistics will appear here as you review and make investments.
    </p>
  </Card>
)}
```

**Time Estimate:** 30 minutes  
**Benefit:** Hides fabricated data immediately  
**Trade-off:** Investors see "incomplete" profile instead of trusted metrics

---

#### Option C: Clear Disclaimer (INTERIM, NOT RECOMMENDED)

Add a warning banner above ProfileStatsCard:

```tsx
<Alert variant="warning">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Statistics in Development</AlertTitle>
  <AlertDescription>
    These values will auto-populate as you make investments on the platform.
  </AlertDescription>
</Alert>
<ProfileStatsCard profile={profile} />
```

**Time Estimate:** 15 minutes  
**Benefit:** Users know values aren't finalized  
**Trade-off:** "Demo" badge doesn't fix fabrication, just warns about it

---

### Recommended Fix
**Option A** — Calculate from actual deal history (most trustworthy)  
Time: 2-3 hours  
Outcome: Fully real, auditable metrics

---

## Issue #2: Portfolio MOIC Placeholder (Phase 9)

### The Problem
Portfolio MOIC is displayed as "1.44x" with sublabel "demo placeholder" but most investors won't notice the placeholder text and will believe their portfolio returns are 1.44x.

**Files:**
- `src/app/dashboard/investor/pipeline/_components/KPIStrip.tsx` — Displays the MOIC
- `src/types/investor/opportunities.ts` — Type definition notes it's placeholder
- `backend API endpoint` — Returns InvestorPipelineSummary.moic

### Current Code

#### Frontend Display (src/app/dashboard/investor/pipeline/_components/KPIStrip.tsx:36–42)
```tsx
<KPITile
  icon={TrendingUp}
  label="Portfolio MOIC"
  value={`${summary.moic.toFixed(2)}x`}
  sublabel="demo placeholder"  // ← WARNING IS TOO SUBTLE
/>
```

#### Type Definition (src/types/investor/opportunities.ts:108–109)
```ts
/** Demo placeholder (1.44) until per-investment current-valuation lands. */
moic: number;
```

### Solution Options

#### Option A: RECOMMENDED — Remove Entirely

**Approach:**
1. Delete the MOIC KPI tile
2. Show only: Active Deals, Capital Committed, Avg Match Score
3. When real valuation data exists, add MOIC back

**Implementation:**

**File:** `src/app/dashboard/investor/pipeline/_components/KPIStrip.tsx`

Replace:
```tsx
<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
  <KPITile icon={Briefcase} label="Active Deals" value={...} sublabel="..." />
  <KPITile icon={Wallet} label="Capital Committed" value={...} sublabel="..." />
  <KPITile icon={Sparkles} label="Avg Match Score" value={...} sublabel="..." />
  <KPITile
    icon={TrendingUp}
    label="Portfolio MOIC"
    value={`${summary.moic.toFixed(2)}x`}
    sublabel="demo placeholder"
  />
</div>
```

With:
```tsx
<div className="grid grid-cols-2 gap-4 md:grid-cols-3">
  <KPITile icon={Briefcase} label="Active Deals" value={...} sublabel="..." />
  <KPITile icon={Wallet} label="Capital Committed" value={...} sublabel="..." />
  <KPITile icon={Sparkles} label="Avg Match Score" value={...} sublabel="..." />
</div>
```

**Time Estimate:** 10 minutes  
**Benefit:** Completely removes misleading metric  
**Trade-off:** Investors don't see any return metric (but better than fake one)

---

#### Option B: Replace with Interim Metric

**Approach:**
1. Instead of MOIC, show "Dry Powder Available"
2. Or show "Portfolio Companies" count (active + exited)
3. Both are real and valuable

**Implementation (Dry Powder Example):**

**File:** `src/app/dashboard/investor/pipeline/_components/KPIStrip.tsx`

Replace:
```tsx
<KPITile
  icon={TrendingUp}
  label="Portfolio MOIC"
  value={`${summary.moic.toFixed(2)}x`}
  sublabel="demo placeholder"
/>
```

With:
```tsx
<KPITile
  icon={TrendingUp}
  label="Dry Powder"
  value={formatCurrency(summary.dryPowderAvailable)}
  sublabel="available to invest"
/>
```

**Requirements:**
- Backend must provide `dryPowderAvailable` in summary
- This could be: investor's stated max capital - amount committed

**Time Estimate:** 1-2 hours  
**Benefit:** Shows real metric (capital available), removes fake MOIC  
**Trade-off:** Need to calculate dry powder in backend

---

#### Option C: Calculate Real MOIC (BEST LONG-TERM)

**Approach:**
1. For each closed deal, get: amount invested + current valuation
2. Calculate: MOIC = total current value / total invested
3. Display real calculated value

**Implementation:**

Would require:
1. Backend to query investor's closed deals
2. Each deal to have "current valuation" field
3. Calculate: sum(current valuations) / sum(invested amounts)

**Time Estimate:** 3-4 hours  
**Benefit:** Fully real, auditable returns  
**Trade-off:** Requires deal valuation tracking (may not exist yet)

---

### Recommended Fix
**Option A** — Remove MOIC entirely (safest, immediate)  
Time: 10 minutes  
Outcome: No fake metrics shown

Alternative: **Option B** — Replace with Dry Powder (more useful)  
Time: 1-2 hours  
Outcome: Real metric that provides value

---

## Implementation Checklist

### Before You Start
- [ ] Read both issues in full
- [ ] Decide which option for each (profile stats + MOIC)
- [ ] Get team agreement on approach

### Profile Statistics Fix
- [ ] **Decision made:** Calculate (A), Hide (B), or Warn (C)?
- [ ] **Code changes:** Implement chosen option
- [ ] **Testing:** Verify with investor who has 0 deals, 1 deal, 5 deals
- [ ] **Code review:** Ensure calculation logic is correct
- [ ] **Deployment:** Deploy and monitor for errors

### Portfolio MOIC Fix
- [ ] **Decision made:** Remove (A), Replace (B), or Calculate (C)?
- [ ] **Code changes:** Implement chosen option
- [ ] **UI/Layout:** Verify grid layout looks good with new # of tiles
- [ ] **Testing:** Verify no console errors, responsive on mobile
- [ ] **Code review:** Quick check
- [ ] **Deployment:** Deploy and monitor

### Verification
- [ ] Load investor profile (Phase 4) → Verify stats shown correctly
- [ ] Load investor pipeline (Phase 9) → Verify MOIC is gone/replaced/calculated
- [ ] Check mobile view (375px, 768px, 1280px)
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] All other metrics still display correctly

### Post-Deployment
- [ ] Monitor error logs (30 minutes)
- [ ] Check investor feedback
- [ ] Verify database queries don't timeout
- [ ] Compare with backup (no unintended changes)

---

## Timeline

**Recommended Approach:**
- **Profile Stats:** Option A (calculate from deal history) — 2-3 hours
- **Portfolio MOIC:** Option A (remove) — 10 minutes
- **Testing & Verification:** 30 minutes
- **Total:** ~3 hours

**Faster Approach (if time-constrained):**
- **Profile Stats:** Option B (hide) — 30 minutes
- **Portfolio MOIC:** Option A (remove) — 10 minutes
- **Testing:** 30 minutes
- **Total:** ~1 hour

---

## Sign-Off

These two fixes are REQUIRED before institutional investor production launch.

**Issue #1 (Profile Stats):** Must be calculated or hidden  
**Issue #2 (Portfolio MOIC):** Must be removed or replaced

Without these fixes, investors will believe fabricated metrics are real.

---

**Generated:** 2026-06-19  
**Backup Status:** ✅ Verified and isolated  
**Recommendation:** Fix both issues within 3 hours, then re-test end-to-end
