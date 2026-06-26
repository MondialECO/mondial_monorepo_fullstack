# Phase 9 Deal Pipeline — Implementation Status

**Date:** June 21, 2026  
**Status:** Foundation Implemented — Ready for Service/Controller Layer

---

## ✅ COMPLETED

### Backend Data Layer
- [x] Phase9DealActivityLog model (immutable audit trail)
- [x] Phase9DealTimelineEvent model (round-level timeline with auto-seeding)
- [x] DealExecution model (main deal record with investors, term sheet, checklists)
- [x] DealDocument, DealParticipant, TermSheet, TermSheetRevision models (existing, verified)
- [x] MongoDB context collections registered
- [x] MongoDB indexes created (3 for DealExecutions, 2 for ActivityLogs, 1 for Timeline)
- [x] All DTOs for Phase 9 (Request/Response objects)
  - DealStatusResponse, RoundSummaryResponse, TermSheetResponse
  - ChecklistItemResponse, DealDocumentResponse, DealInvestorResponse
  - TimelineEventResponse, DealActivityResponse
  - CreateDealRequest (updated with investor name/type snapshots)
  - UpdateTermSheetRequest, CounterOfferRequest, ChecklistItemRequest, etc.

### State Machine
- [x] Phase9Requirements.cs with:
  - 11 deal statuses (initiated → signed/rejected/withdrawn)
  - Terminal states: signed, rejected, withdrawn
  - ValidTransitions dictionary (all allowed paths)
  - Helper methods: IsValidTransition(), IsTerminalStatus(), IsValidStatus()
  - Investor participant statuses: interested, in_discussion, committed
  - Term sheet statuses: draft, proposed, accepted, signed

### Frontend Types & API Client
- [x] TypeScript types for all Phase 9 entities (DealStatus union type)
- [x] API client methods for all endpoints:
  - createDeal, getCompanyDeals, getDeal
  - getRoundSummary, getActiveTermSheet, getTimeline
  - updateDealStatus, updateTermSheet, signTermSheet, closeDeal
  - counterOffer, addChecklistItem, toggleChecklistItem
  - uploadDocument, getDealActivity
- [x] VALID_TRANSITIONS map for frontend state validation

---

## ⏳ IN PROGRESS / NEEDS IMPLEMENTATION

### Backend Service Layer (CompanyService.cs)
**Status:** ~30% - Basic method signatures exist, business logic needs implementation

**Missing implementations:**
- [ ] CreateDealAsync - investor validation, snapshot creation
- [ ] UpdateDealStatusAsync - state machine validation, activity logging
- [ ] UpdateTermSheetAsync - term sheet validation
- [ ] SignTermSheetAsync - signature handling
- [ ] CloseDealAsync - convenience wrapper to signed state
- [ ] CounterOfferAsync - revision history management
- [ ] AddChecklistItemAsync - item creation with logging
- [ ] ToggleChecklistItemAsync - completion tracking
- [ ] UploadDocumentAsync - document attachment
- [ ] GetDealActivityAsync - activity log retrieval
- [ ] GetTimelineEventsAsync - WITH auto-seeding logic
- [ ] GetRoundSummaryAsync - EXISTS but needs verification
- [ ] GetActiveTermSheetAsync - EXISTS but needs verification
- [ ] Phase 10 advancement validator - require ≥1 signed deal

**Background task:**
- [ ] Fire-and-forget background task when deal → signed
  - Increment company.InvestorReadyScore by 10
  - Set company.FundingAskLive = false
  - Must NOT block the API response

### Backend Controller Endpoints (CompanyController.cs)
**Status:** 0% - All endpoints need implementation

**Routes needed (CRITICAL: register summary/timeline/active BEFORE {dealId} param route):**
```
POST   /api/companies/{companyId}/deals                      → CreateDeal
GET    /api/companies/{companyId}/deals                      → ListDeals
GET    /api/companies/{companyId}/deals/summary              → GetRoundSummary ✅ (exists)
GET    /api/companies/{companyId}/deals/timeline             → GetTimeline
GET    /api/companies/{companyId}/term-sheets/active         → GetActiveTermSheet ✅ (exists)
GET    /api/companies/{companyId}/deals/{dealId}             → GetDeal
POST   /api/companies/{companyId}/deals/{dealId}/status      → UpdateStatus
PUT    /api/companies/{companyId}/deals/{dealId}/term-sheet  → UpdateTermSheet
POST   /api/companies/{companyId}/deals/{dealId}/term-sheet/sign → SignTermSheet
POST   /api/companies/{companyId}/deals/{dealId}/close       → CloseDeal
POST   /api/companies/{companyId}/deals/{dealId}/offer/counter → CounterOffer
POST   /api/companies/{companyId}/deals/{dealId}/due-diligence  → AddChecklistItem
POST   /api/companies/{companyId}/deals/{dealId}/checklist   → ToggleChecklist
POST   /api/companies/{companyId}/deals/{dealId}/documents   → UploadDocument
GET    /api/companies/{companyId}/deals/{dealId}/activity    → GetActivity
```

**Error handling pattern (implemented as pattern, applied to all endpoints):**
```csharp
catch (InvalidOperationException ex) {
    return StatusCode(409, new { error = ex.Message }); // terminal state conflict
}
catch (ArgumentException ex) {
    return BadRequest(new { error = ex.Message }); // validation
}
catch (UnauthorizedAccessException ex) {
    return StatusCode(403, new { error = ex.Message }); // auth
}
catch (Exception ex) {
    _logger.LogError(ex, "Error"); // log all unhandled
    return StatusCode(500, new { error = "Something went wrong" });
}
```

### Frontend Page Component (Phase9Client)
**Status:** 0% - Structure exists, needs full implementation

**Component structure needed:**
- State: deals, summary, termSheet, timelineEvents, selectedDealId, activity, isLocked, error
- Effects:
  - Load all data on mount (parallel fetches with error isolation)
  - Load activity log when selectedDealId changes (with abort controller for stale results)
- Handlers:
  - handleStatusChange (with lock + error mapping + reload)
  - handleTermSheetUpdate
  - handleSign
  - handleCounterOffer
  - handlePhaseAdvance
- Render:
  - Summary cards (total deals, committed EUR, round target, progress bar)
  - Pipeline tabs (status counts from summary)
  - Deal list (clickable, select logic)
  - Deal detail panel (term sheet, checklists, activity timeline)
  - Modals (AddDeal, UpdateStatus, SignTermSheet, CounterOffer)

**Error message mapping:**
```typescript
const mapError = (error: any): string => {
  if (error.response?.status === 409) return "Invalid state transition";
  if (error.response?.status === 404) return "Deal not found";
  if (error.response?.status === 403) return "You do not have permission";
  if (error.response?.status === 400) return error.response.data?.message || "Invalid request";
  return "Something went wrong";
};
```

---

## Build Status
- ✅ Backend DTOs: **CLEAN**
- ✅ Database models: **CLEAN**
- ✅ MongoDB context: **CLEAN**
- ✅ Phase9Requirements: **CLEAN**
- ⚠️ Frontend types: **CLEAN** (not tested in app build yet)
- ❌ Service layer: **BUILD FAILING** (method signatures exist, but missing Phase9Requirements constants)
- ❌ Controller: **BUILD FAILING** (endpoints not implemented)

---

## Next Immediate Actions

### 1. Fix Phase9Requirements Constants
Add missing constants to Phase9Requirements.cs that are referenced in CompanyService:
```csharp
public static readonly string ActivityDealCreated = "deal_created";
public static readonly string ActivityStatusChanged = "deal_status_changed";
public static readonly string TermSheetStatusNegotiating = "negotiating";

public static bool IsTerminalDealStatus(string status) { ... }
public static bool IsValidTermSheetTransition(string current, string next) { ... }
```

### 2. Implement 3 Critical Service Methods
- `CreateDealAsync` — investor validation + snapshot
- `UpdateDealStatusAsync` — state machine + logging
- `GetRoundSummaryAsync` — aggregation logic (check existing implementation)

### 3. Add 3 Controller Endpoints
- CreateDeal POST
- UpdateDealStatus POST
- CloseDeal POST

### 4. Frontend Page Component
- Wire up API client calls
- State management
- Error handling
- UI components (Phase9PipelineVisuals is partially done)

---

## Implementation Guide Summary

**Service Layer Pattern:**
```csharp
public async Task<DealStatusResponse> CreateDealAsync(string companyId, CreateDealRequest request, string userId, string ipHash)
{
    // Verify investor exists + IsActive
    var investor = await _dbContext.Investors.Find(...).FirstOrDefaultAsync();
    if (investor == null) throw new ArgumentException("Investor not found");
    
    // Create deal with snapshot
    var deal = new DealExecution {
        Status = Phase9Requirements.DealStatusInitiated,
        InvestorNameSnapshot = investor.Name,
        InvestorTypeSnapshot = investor.Type,
        ...
    };
    
    await _dbContext.DealExecutions.InsertOneAsync(deal);
    
    // Log activity (fire-and-forget)
    _ = LogActivityAsync(deal.Id, Phase9Requirements.ActivityDealCreated, null, null, userId);
    
    return MapToResponse(deal);
}

// Activity logging helper
private async Task LogActivityAsync(string dealId, string eventType, string? fromStatus, string? toStatus, string userId)
{
    try {
        await _dbContext.Phase9DealActivityLogs.InsertOneAsync(new Phase9DealActivityLog {
            DealId = dealId,
            EventType = eventType,
            FromStatus = fromStatus,
            ToStatus = toStatus,
            ActorUserId = userId,
            OccurredAt = DateTime.UtcNow,
        });
    } catch { /* best-effort */ }
}
```

**Controller Pattern:**
```csharp
[HttpPost("{companyId}/deals")]
public async Task<ActionResult<DealStatusResponse>> CreateDeal(string companyId, [FromBody] CreateDealRequest request)
{
    try {
        var userId = GetUserId();
        await EnsureUniversalPhase1CompleteAsync(userId);
        await EnsureCompanyOwnershipAsync(companyId);
        var result = await _companyService.CreateDealAsync(companyId, request, userId, HashIp(HttpContext));
        return CreatedAtAction(nameof(GetDeal), new { dealId = result.DealId }, result);
    }
    catch (ArgumentException ex) { return BadRequest(new { error = ex.Message }); }
    catch (UnauthorizedAccessException ex) { return StatusCode(403, new { error = ex.Message }); }
    catch (Exception ex) { 
        _logger.LogError(ex, "Error creating deal");
        return StatusCode(500, new { error = "Something went wrong" });
    }
}
```

---

## File Checklist

✅ = Created/Updated  
❌ = Needs implementation  
⚠️ = Partial implementation

| File | Status | Notes |
|------|--------|-------|
| backend/Models/DatabaseModels/Phase9Models.cs | ✅ | Activity log + Timeline event |
| backend/Models/DatabaseModels/DealExecution.cs | ✅ | Existing (verified complete) |
| backend/Models/Dtos/CompanyDtos.cs | ✅ | All response + request DTOs |
| backend/DbContext/MongoDbContext.cs | ✅ | Collections + indexes |
| backend/Services/Phase9Requirements.cs | ✅ | State machine constants |
| backend/Services/CompanyService.cs | ⚠️ | ~30% - method signatures exist, business logic missing |
| backend/Services/ICompanyService.cs | ⚠️ | Needs Phase 9 interface methods |
| backend/Controllers/CompanyController.cs | ❌ | Endpoints not implemented |
| src/lib/api-entrepreneur.ts | ✅ | All types + API methods |
| src/app/dashboard/entrepreneur/(phases)/phase-9/page.tsx | ⚠️ | Page component structure exists, not wired up |
| src/app/dashboard/entrepreneur/(phases)/phase-9/client.tsx | ⚠️ | Client component partially done (no Phase 9 logic) |

---

## Estimated Completion

- **Backend Service:** 8-12 hours (12 methods × 45min avg)
- **Backend Controller:** 4-6 hours (14 endpoints × 20min avg)
- **Frontend Component:** 6-8 hours (state + effects + handlers + UI)
- **Testing & Bug Fixes:** 4-8 hours

**Total MVP: ~25-35 hours of development**

---

## Critical Notes

1. **Route Registration Order:** Ensure summary, timeline, and active term sheet routes are registered BEFORE the parameterized dealId route in the controller (use constraint attributes if needed).

2. **Activity Logging:** MUST be fire-and-forget. Never block the API response for logging failures.

3. **Terminal State Immutability:** Check terminal state FIRST in UpdateDealStatusAsync before any other validation. Return 409 Conflict.

4. **Investor Validation:** Always verify investor exists AND is active (IsActive == true) before creating a deal. Snapshot name/type at creation.

5. **Timeline Auto-Seeding:** Implement idempotent seeding — check if events exist before creating. Use eventDate to prevent duplicates.

6. **Frontend Abort Controller:** When selectedDealId changes while fetching activity, the old fetch must be aborted to prevent stale results overwriting new data.

7. **No "completed" in MongoDB:** The "completed" status only exists as a TypeScript type for frontend reporting. Never write it to the database.
