# Phase 3 Steps 3 & 4 Comprehensive Audit

**Date:** 2026-06-17  
**Scope:** Step 3 (KPI Baseline) + Step 4 (Concept Overview)  
**Status:** ⚠️ **FUNCTIONAL BUT INCONSISTENT** — Works end-to-end but has data architecture issues and missing validations

---

## Executive Summary

✅ **What works:**
- Form validations prevent invalid data
- Phase advancement gates on required data
- API endpoints return expected shapes (mostly)
- Side-effects (scoring, matchmaking) execute

⚠️ **What's broken/risky:**
- BurnRate & NPS stored in Companies table, not Phase3Kpi → data silos
- KpiBaselineResponse doesn't include BurnRate/NPS → can't round-trip values
- Frontend relies on client-side storage for optional KPI fields → data loss if cache clears
- Validation runs AFTER persistence in places → potential partial writes

---

## Part A: Step 3 (KPI Baseline) Issues

### Issue 1: Data Silo — BurnRate & NPS Stored Separately ⚠️ HIGH

**Location:** CompanyService.cs:657-712 + Phase3Models.cs:11-28

**Problem:**
- Phase3Kpi model has 7 fields: Mrr, Arr, GrossMarginPercent, Cac, Ltv, ChurnPercent, ActiveAccounts
- BurnRate & Nps are **NOT** in Phase3Kpi model
- Instead, they're persisted to Companies.MonthlyBurn and Companies.Nps (line 702-704)
- This creates two separate collections holding KPI data:
  - **Phase3Kpi:** The main KPI baseline (auditable history)
  - **Companies:** Optional burn & NPS (current state only, no history)

**Consequences:**
1. GetKpiBaselineAsync returns only Phase3Kpi fields → BurnRate/NPS missing from API
2. Frontend can't round-trip these values; must use client-side storage
3. Audit trail for BurnRate/NPS changes is lost (only latest in Companies)
4. If frontend clears cache, BurnRate/NPS values are lost

**Code Evidence:**
```csharp
// Phase3Kpi model (does NOT include BurnRate/Nps)
public class Phase3Kpi
{
    public double Mrr { get; set; }
    public double Arr { get; set; }
    // ... other fields ...
    // ❌ NO BurnRate, NO Nps
}

// But SaveKpiBaselineAsync persists them elsewhere
await _dbContext.Phase3Kpis.InsertOneAsync(doc);  // ← Phase3Kpi only
if (request.BurnRate.HasValue || request.Nps.HasValue)
{
    // ← Then update Companies table separately
    await _dbContext.Companies.UpdateOneAsync(...);
}
```

**Recommendation:** CRITICAL
1. Add BurnRate & Nps fields to Phase3Kpi model
2. Persist them there in SaveKpiBaselineAsync
3. Update MapKpi to include these fields in response
4. Update KpiBaselineResponse DTO to include them

---

### Issue 2: Missing API Response Fields ⚠️ HIGH

**Location:** CompanyDtos.cs:589-599 + api-entrepreneur.ts:131-140

**Problem:**
- Backend SaveKpiBaselineAsync accepts BurnRate & Nps in request
- But doesn't return them in KpiBaselineResponse
- Frontend can't verify what was saved

**Code Evidence:**
```csharp
// Backend — accepts these
public record SaveKpiBaselineRequest(
    double Mrr, double Arr, ...,
    double? BurnRate,    // ← Accepted
    int? Nps);           // ← Accepted

// But response doesn't include them
public record KpiBaselineResponse(
    double Mrr, double Arr, ...,
    // ❌ NO BurnRate, NO Nps in response
    string RecordedAt);
```

**Frontend Impact:**
```typescript
// Frontend must fall back to client-side storage
const burnRate = (phase3Data as any)?.burnRate ?? null;  // ← from local storage
const nps = (phase3Data as any)?.nps ?? null;           // ← from local storage
```

**Recommendation:** CRITICAL
- Add BurnRate and Nps to KpiBaselineResponse DTO
- Update MapKpi to map them from Phase3Kpi
- Frontend can then use API response instead of client-side storage

---

### Issue 3: Client-Side Storage Fallback (Data Loss Risk) ⚠️ MEDIUM

**Location:** step-3/page.tsx:43-61

**Problem:**
- Frontend hydrates BurnRate & NPS from local phase data, NOT API
- If user clears browser cache or uses incognito mode, values are lost
- No warning or validation that cache was cleared

**Code Evidence:**
```typescript
useEffect(() => {
  const existing = getPhaseData(3);
  if (existing) {
    // Hydrate from LOCAL storage
    if (existing.burnRate != null) setMonthlyBurn(String(existing.burnRate));
    if (existing.nps != null) setNps(String(existing.nps));
  }
  
  // Fetch KPI from API (has all other fields)
  const kpi = await getKpiBaseline(companyId);  // Returns: Mrr, Arr, CAC, LTV, Churn
  // But kpi.burnRate and kpi.nps are undefined!
}, []);
```

**Scenario:**
1. User enters BurnRate=5000, NPS=72 in Step 3
2. User submits → saved to Companies table
3. User closes browser, cache is cleared
4. User re-opens Step 3 → burnRate & NPS show as empty (!)
5. User fills them again to see "saved" values
6. Confusing UX

**Recommendation:** MEDIUM (after Issue 1 & 2 are fixed)
- Once Issue 1 is fixed (BurnRate/NPS in Phase3Kpi), Issue 3 is automatically solved
- API will return these values, no client-side storage needed

---

### Issue 4: Validation Occurs Before Persistence ✅ NO ISSUE (Audit was wrong)

**Location:** CompanyService.cs:678-689

**Audit claim:** "Validation occurs after persistence, causing race condition"  
**Finding:** **INCORRECT** — Validation happens BEFORE persistence

**Evidence:**
```csharp
Line 678-680: var validationErrors = Phase3Requirements.ValidateKpiBaseline(doc);
             if (validationErrors.Count > 0)
                 throw new ArgumentException(string.Join("; ", validationErrors));

Line 684-687: if (request.BurnRate.HasValue && request.BurnRate.Value < 0)
                 throw new ArgumentException("burnRate must be >= 0");
             if (request.Nps.HasValue && (request.Nps.Value < 0 || request.Nps.Value > 100))
                 throw new ArgumentException("nps must be between 0 and 100");

Line 689:    await _dbContext.Phase3Kpis.InsertOneAsync(doc);  // ← Insert AFTER validation
```

**Verdict:** ✅ No race condition. Validation is correctly placed before persistence.

---

### Issue 5: Frontend Validation vs Backend Validation ⚠️ LOW

**Location:** step-3/page.tsx:111-117 vs CompanyService.cs:678-687

**Problem:**
- Frontend and backend both validate, but slightly differently
- Not a blocker, but increases maintenance burden

**Comparison:**
```typescript
// Frontend (step-3/page.tsx:113)
if (cacN < 0 || cacN > 999999 ||     // Allows CAC=0
    ltvN < 0 || ltvN > 999999 ||
    churnN < 0 || churnN > 100 ||    // Churn 0-100 ✓
    npsN < 0 || npsN > 100)          // NPS 0-100 ✓

// Backend (CompanyService.cs:684-687)
if (burnRate < 0)                     // BurnRate >= 0 ✓
if (nps < 0 || nps > 100)            // NPS 0-100 ✓
```

**Issue:** Frontend allows CAC=0, which makes LTV/CAC ratio division confusing

**Recommendation:** LOW
- Add explicit check: if CAC is provided, it must be > 0
- Or document that CAC=0 means "not yet determined" and is valid

---

## Part B: Step 4 (Concept Overview) Issues

### Issue 6: Step 4 Doesn't Pre-Check Step 3 Completion ⚠️ MEDIUM

**Location:** step-4/page.tsx:135-156 vs backend PhaseValidator.cs:100-136

**Problem:**
- Step 4 allows user to submit form without verifying Step 3 was completed
- Validation only happens at phase advancement time (backend)
- If Step 3 is missing, user sees cryptic error instead of helpful message

**Code Evidence:**
```typescript
// Frontend Step 4 — no pre-check
const handleComplete = async () => {
  await saveConcept({...});
  await advancePhase(3);  // ← Only NOW checks if KPI exists
};

// Backend validator (PhaseValidator.cs:125-126)
if (kpiRequired && kpiBaseline == null)
    return new() { "KPI baseline required to advance" };
```

**UX Issue:**
User fills Step 4 form → clicks "Complete Phase" → error: "KPI baseline required" (confusing, should say "Go back to Step 3")

**Recommendation:** MEDIUM
- Before allowing Step 4 form submission, call getKpiBaseline()
- If null, show: "⚠️ Complete Step 3 (KPI Baseline) first"
- Disable submit button until Step 3 is done

---

### Issue 7: SaveConcept Called Before Phase Advance ⚠️ LOW

**Location:** step-4/page.tsx:145-151

**Problem:**
- Concept is saved via saveConcept()
- THEN phase advance is called
- If phase advance fails, concept is already saved but phase didn't advance
- On reload, form shows stale data (concept saved but phase=3)

**Code:**
```typescript
// Line 145-149
await savePhaseData(3, {
  oneLiner: oneLiner.trim(),
  ...
});

// Line 150-151 (happens AFTER savePhaseData)
const advanceResponse = await entrepreneurApi.advancePhase(companyId, 3);
```

**Scenario:**
1. User fills concept form
2. Frontend saves concept
3. Phase advance fails (backend error, network timeout, etc.)
4. Frontend shows error, but concept is already persisted
5. User refreshes → form reloads old data, phase still shows as 3
6. Confusing state

**Recommendation:** LOW
- Move savePhaseData call to AFTER successful advancePhase
- Or add error handling to rollback local state on failure

---

### Issue 8: Phase Advance Response Handling ✅ CORRECT

**Location:** step-4/page.tsx:153-156

**Claim:** Frontend checks `!== 4` which seems backwards

**Evidence:**
```typescript
if (advanceResponse?.currentPhase !== 4)
    throw new Error(`Expected currentPhase=4, got ${advanceResponse?.currentPhase}`);
```

**Analysis:** ✅ CORRECT
- phaseToComplete = 3
- Backend sets: currentPhase = phaseToComplete + 1 = 4
- Response includes currentPhase = 4
- Check `!== 4` throws error if NOT 4
- This is correct logic

---

### Issue 9: Side-Effects Swallowed on Error ⚠️ MEDIUM

**Location:** Phase3CompletionEvents.cs:19-112

**Problem:**
- When phase 3 advances, completion events run in try-catch
- All exceptions are swallowed silently (line 106-110)
- If matchmaking queue insertion fails, frontend doesn't know
- User thinks phase 3 is complete, but matchmaking queue insertion failed

**Code:**
```csharp
public static async Task RunAsync(MongoDbContext db, Companies company)
{
    try
    {
        // Score updates, matchmaking payload, queue insertion
        // ... 80 lines of code ...
    }
    catch
    {
        // Intentionally swallowed: completion events are best-effort
    }
}
```

**Risk:**
- Matchmaking queue grows with pending items, but some have bugs
- No logging or alerting if failures occur
- Silent data loss

**Recommendation:** MEDIUM
- Log exceptions so ops can see failures
- Or return a flag in CompanyProgressResponse indicating success
- At minimum, alert user if side-effects fail

---

## Part C: Data Flow Consistency

### Issue 10: NPS Read from Wrong Source in Matchmaking ⚠️ LOW

**Location:** Phase3CompletionEvents.cs:77 vs CompanyService.cs:702-704

**Problem:**
- When building matchmaking payload, NPS is read from company.Nps
- But if user re-submits KPI baseline with updated NPS, old value persists in matchmaking queue

**Evidence:**
```csharp
// Phase3CompletionEvents.cs:77
{ "NPS", company.Nps.HasValue ? new BsonInt32(company.Nps.Value) : BsonNull.Value }
// ← Reads from Companies table (latest only)

// But CompanyService.cs:689 inserted it into Phase3Kpi
await _dbContext.Phase3Kpis.InsertOneAsync(doc);  // ← Contains NPS with timestamp
```

**Scenario:**
1. User submits NPS=72 in Step 3
2. Phase 3 completes → matchmaking queue enqueued with NPS=72
3. User navigates back and re-submits Step 3 with NPS=60
4. A new Phase3Kpi is inserted with NPS=60
5. Companies.Nps is updated to 60
6. **But matchmaking queue still has NPS=72** (immutable, only status changes)

**Recommendation:** LOW (post-MVP)
- Read NPS from latest Phase3Kpi instead of Companies
- Or accept that matchmaking captures the *first* submission, not updates

---

## Part D: Summary Table

| Issue | Component | Severity | Impact | Status |
|-------|-----------|----------|--------|--------|
| BurnRate/NPS data silo | Backend model | 🔴 CRITICAL | Data silos, no API round-trip | UNFIXED |
| Missing response fields | API contract | 🔴 CRITICAL | Frontend can't verify saved values | UNFIXED |
| Client-side storage fallback | Frontend state | 🟠 HIGH | Data loss on cache clear | Blocked on Issue #1 |
| CAC=0 validation | Frontend validation | 🟡 MEDIUM | Undefined health indicator | UNFIXED |
| Step 4 no pre-check | UX flow | 🟡 MEDIUM | Confusing error messaging | UNFIXED |
| Side-effects swallowed | Backend error handling | 🟡 MEDIUM | Silent failures in background | UNFIXED |
| SaveConcept before advance | State management | 🟡 MEDIUM | Potential stale state on error | UNFIXED |
| NPS read from wrong source | Business logic | 🟢 LOW | Stale matchmaking data | POST-MVP |

---

## Recommended Fixes (Priority Order)

### CRITICAL (Must fix before shipping)

1. **Add BurnRate & Nps to Phase3Kpi model**
   ```csharp
   public class Phase3Kpi
   {
       // ... existing fields ...
       public double? BurnRate { get; set; }
       public int? Nps { get; set; }
   }
   ```

2. **Update SaveKpiBaselineAsync to persist to Phase3Kpi**
   ```csharp
   var doc = new Phase3Kpi { ..., BurnRate = request.BurnRate, Nps = request.Nps };
   ```

3. **Update MapKpi to return BurnRate & Nps**
   ```csharp
   private static KpiBaselineResponse MapKpi(Phase3Kpi k) => new()
   {
       // ... existing fields ...
       BurnRate = k.BurnRate,
       Nps = k.Nps,
   };
   ```

4. **Update KpiBaselineResponse DTO**
   ```csharp
   public record KpiBaselineResponse(
       // ... existing fields ...
       double? BurnRate,
       int? Nps);
   ```

5. **Update frontend to use API response instead of client-side storage**
   ```typescript
   const burnRate = kpi?.burnRate ?? null;
   const nps = kpi?.nps ?? null;
   ```

### HIGH (Before users heavily use Step 3/4)

6. **Add Step 3 pre-check in Step 4**
7. **Validate CAC > 0 in frontend if provided**
8. **Add logging to Phase3CompletionEvents**

### MEDIUM (Polish)

9. **Move savePhaseData to after successful advancePhase**
10. **Read NPS from Phase3Kpi in matchmaking payload**

---

## Test Coverage Gaps

- No test for BurnRate/NPS round-trip through API
- No test for Step 4 → Step 3 navigation (pre-check missing)
- No test for phase advancement failure with side-effects
- No test for CAC=0 edge case

---

## Verdict

| Dimension | Status | Details |
|-----------|--------|---------|
| Functional flow | ✅ WORKS | Step 3 → Step 4 → Phase advance works end-to-end |
| Data persistence | ⚠️ INCONSISTENT | BurnRate/NPS stored separately, not round-tripped via API |
| API contract | 🔴 INCOMPLETE | Response missing optional fields |
| Validation | ✅ CORRECT | Frontend & backend validations prevent bad data |
| UX | ⚠️ CONFUSING | Missing pre-checks, errors not user-friendly |
| Side-effects | ⚠️ SILENT FAILURES | Matchmaking queue issues not logged |

**Recommendation:** Functional for MVP, but **MUST fix critical issues (#1-5) before going to production**. Without these fixes, data will be lost or inaccessible when users navigate away or cache is cleared.

---

*Audit by: Claude Code  
Time: ~40 minutes  
Files reviewed: 12 (frontend + backend + DTOs + validators)*
