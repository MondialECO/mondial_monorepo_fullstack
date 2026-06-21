# Phase 9 Deal Pipeline — Implementation Guide

## Status
- ✅ All DTOs and Response shapes defined
- ✅ Database models created (DealExecution, ActivityLog, TimelineEvent)
- ✅ MongoDB context updated with collections
- ✅ Indexes created for performance
- ⏳ Backend service layer (70% ready, needs state machine + remaining endpoints)
- ⏳ Controller endpoints (need implementation)
- ⏳ Frontend types and API client
- ⏳ Frontend page component

## Critical Implementation Checklist

### Backend Service Methods (Phase9Service class)
```csharp
// Core deal lifecycle
CreateDealAsync(companyId, request) → DealStatusResponse
UpdateDealStatusAsync(dealId, status, notes) → DealStatusResponse
UpdateTermSheetAsync(dealId, request) → DealStatusResponse
SignTermSheetAsync(dealId, request) → DealStatusResponse
CloseDealAsync(dealId) → DealStatusResponse (wrapper → signed)
CounterOfferAsync(dealId, request) → DealStatusResponse

// Checklist operations
AddChecklistItemAsync(dealId, checklist_type, request) → DealStatusResponse
ToggleChecklistItemAsync(dealId, checklist_type, itemId, completed) → DealStatusResponse

// Document operations
UploadDocumentAsync(dealId, request) → DealStatusResponse

// Read operations
GetDealAsync(dealId) → DealStatusResponse
GetCompanyDealsAsync(companyId) → List<DealStatusResponse>
GetDealActivityAsync(dealId) → List<DealActivityResponse>
GetRoundSummaryAsync(companyId) → RoundSummaryResponse (EXISTS)
GetTimelineEventsAsync(companyId) → List<TimelineEventResponse> (NEEDS AUTO-SEED)
GetActiveTermSheetAsync(companyId) → TermSheetResponse (EXISTS)

// Phase advancement
CanAdvancePhaseAsync(companyId) → bool (require ≥1 signed deal)
```

### Controller Endpoints (CompanyController - register summary/timeline/active before dealId param)
```csharp
POST   /api/companies/{companyId}/deals → CreateDeal
GET    /api/companies/{companyId}/deals → ListDeals
GET    /api/companies/{companyId}/deals/summary → GetRoundSummary ✅
GET    /api/companies/{companyId}/deals/timeline → GetTimeline
GET    /api/companies/{companyId}/term-sheets/active → GetActiveTermSheet ✅
GET    /api/companies/{companyId}/deals/{dealId} → GetDeal
POST   /api/companies/{companyId}/deals/{dealId}/status → UpdateStatus
PUT    /api/companies/{companyId}/deals/{dealId}/term-sheet → UpdateTermSheet
POST   /api/companies/{companyId}/deals/{dealId}/term-sheet/sign → SignTermSheet
POST   /api/companies/{companyId}/deals/{dealId}/close → CloseDeal
POST   /api/companies/{companyId}/deals/{dealId}/offer/counter → CounterOffer
POST   /api/companies/{companyId}/deals/{dealId}/due-diligence → AddChecklistItem
POST   /api/companies/{companyId}/deals/{dealId}/checklist → ToggleChecklist
POST   /api/companies/{companyId}/deals/{dealId}/documents → UploadDocument
GET    /api/companies/{companyId}/deals/{dealId}/activity → GetActivity
```

### State Machine (Phase9Requirements constants)
```csharp
public static class Phase9Requirements
{
    public static readonly string[] DealStatuses = {
        "initiated", "contacted", "interested", "meeting_scheduled",
        "negotiating", "term_sheet", "agreement_sent", "due_diligence",
        "signed", "rejected", "withdrawn"
    };
    
    public static readonly string[] TerminalStates = { "signed", "rejected", "withdrawn" };
    
    public static readonly Dictionary<string, string[]> ValidTransitions = new()
    {
        { "initiated", new[] { "contacted", "withdrawn" } },
        { "contacted", new[] { "interested", "rejected", "withdrawn" } },
        { "interested", new[] { "meeting_scheduled", "rejected", "withdrawn" } },
        { "meeting_scheduled", new[] { "negotiating", "rejected", "withdrawn" } },
        { "negotiating", new[] { "term_sheet", "rejected", "withdrawn" } },
        { "term_sheet", new[] { "agreement_sent", "negotiating", "rejected", "withdrawn" } },
        { "agreement_sent", new[] { "due_diligence", "negotiating", "rejected", "withdrawn" } },
        { "due_diligence", new[] { "signed", "rejected", "withdrawn" } },
        { "signed", Array.Empty<string>() },
        { "rejected", Array.Empty<string>() },
        { "withdrawn", Array.Empty<string>() },
    };
}
```

### Error Handling Pattern
```csharp
// 409 Conflict: terminal state, invalid transition
if (Phase9Requirements.TerminalStates.Contains(deal.Status))
    throw new InvalidOperationException("Cannot modify a deal in terminal state");

// 400 Bad Request: validation error
if (investor == null || !investor.IsActive)
    throw new ArgumentException("Investor not found or inactive");

// Activity logging (fire-and-forget)
_ = LogActivityAsync(dealId, "status_changed", oldStatus, newStatus, userId);
```

### Background Task Pattern (Fire-and-Forget)
```csharp
// After deal transitions to "signed":
_ = Task.Run(async () =>
{
    try
    {
        var company = await _dbContext.Companies.Find(c => c.Id == companyId).FirstOrDefaultAsync();
        if (company != null)
        {
            company.InvestorReadyScore = (company.InvestorReadyScore ?? 0) + 10;
            company.FundingAskLive = false;
            await _dbContext.Companies.ReplaceOneAsync(c => c.Id == companyId, company);
        }
    }
    catch { /* best-effort */ }
});
```

### Frontend TypeScript Types
```typescript
type DealStatus = "initiated" | "contacted" | "interested" | "meeting_scheduled" |
                  "negotiating" | "term_sheet" | "agreement_sent" | "due_diligence" |
                  "signed" | "rejected" | "withdrawn" | "completed"; // completed = reporting alias

interface DealStatusResponse {
  dealId: string;
  companyId: string;
  status: DealStatus;
  investors: DealInvestorResponse[];
  termSheet: TermSheetResponse;
  dueDiligenceChecklist: ChecklistItemResponse[];
  closingChecklist: ChecklistItemResponse[];
  dealDocuments: DealDocumentResponse[];
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
}

interface RoundSummaryResponse {
  totalDeals: number;
  committedAmountEur: number;
  roundTargetEur: number;
  remainingEur: number;
  percentFilled: number;
  interestedCount: number;
  inDiscussionCount: number;
  termSheetCount: number;
  closedCount: number;
}

const VALID_TRANSITIONS: Record<DealStatus, DealStatus[]> = {
  initiated: ["contacted", "withdrawn"],
  contacted: ["interested", "rejected", "withdrawn"],
  interested: ["meeting_scheduled", "rejected", "withdrawn"],
  meeting_scheduled: ["negotiating", "rejected", "withdrawn"],
  negotiating: ["term_sheet", "rejected", "withdrawn"],
  term_sheet: ["agreement_sent", "negotiating", "rejected", "withdrawn"],
  agreement_sent: ["due_diligence", "negotiating", "rejected", "withdrawn"],
  due_diligence: ["signed", "rejected", "withdrawn"],
  signed: [],
  rejected: [],
  withdrawn: [],
  completed: [], // reporting alias
};
```

### Frontend API Client Pattern
```typescript
export const entrepreneurApi = {
  // ... existing methods
  
  createDeal: async (companyId: string, request: CreateDealRequest): Promise<DealStatusResponse> => {
    return api.post(`/companies/${companyId}/deals`, request).then(r => r.data);
  },
  
  getActiveTermSheet: async (companyId: string): Promise<TermSheetResponse | null> => {
    try {
      return await api.get(`/companies/${companyId}/term-sheets/active`).then(r => r.data);
    } catch (error: any) {
      if (error.response?.status === 404) return null;
      throw error;
    }
  },
  
  // ... other methods
};
```

### Frontend Page Component Structure
```typescript
"use client";

const Phase9Client = () => {
  const [deals, setDeals] = useState<DealStatusResponse[]>([]);
  const [summary, setSummary] = useState<RoundSummaryResponse | null>(null);
  const [termSheet, setTermSheet] = useState<TermSheetResponse | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEventResponse[]>([]);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [activity, setActivity] = useState<DealActivityResponse[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // On mount: fetch all data in parallel
  useEffect(() => {
    const reload = async () => {
      try {
        const [d, s, ts, te] = await Promise.all([
          api.getCompanyDeals(companyId),
          api.getRoundSummary(companyId),
          api.getActiveTermSheet(companyId),
          api.getTimeline(companyId),
        ]);
        setDeals(d);
        setSummary(s);
        setTermSheet(ts);
        setTimelineEvents(te);
      } catch (err) {
        setError("Failed to load deals");
      }
    };
    reload();
  }, []);

  // On selected deal change: fetch activity log
  useEffect(() => {
    if (!selectedDealId) return;
    
    const controller = new AbortController();
    const fetchActivity = async () => {
      try {
        const a = await api.getDealActivity(selectedDealId, { signal: controller.signal });
        setActivity(a);
      } catch (err) {
        if (!controller.signal.aborted) setError("Failed to load activity");
      }
    };
    fetchActivity();

    return () => controller.abort();
  }, [selectedDealId]);

  // Mutation handler pattern
  const handleStatusChange = async (newStatus: string) => {
    if (isLocked || !selectedDealId) return;
    
    setIsLocked(true);
    try {
      await api.updateDealStatus(selectedDealId, { status: newStatus, notes: "" });
      // Reload all data
      const [d, s] = await Promise.all([
        api.getCompanyDeals(companyId),
        api.getRoundSummary(companyId),
      ]);
      setDeals(d);
      setSummary(s);
    } catch (err: any) {
      const msg = err.response?.status === 409 ? "Invalid state transition" :
                  err.response?.status === 400 ? "Invalid request" :
                  "Something went wrong";
      setError(msg);
    } finally {
      setIsLocked(false);
    }
  };

  // Render logic...
};
```

## Implementation Order (Recommended)
1. Phase9Requirements constants class
2. Phase9Service base methods (GetDealAsync, GetCompanyDealsAsync, etc.)
3. CreateDealAsync with investor validation
4. UpdateDealStatusAsync with state machine validation
5. Activity logging helper
6. UpdateTermSheet, SignTermSheet, CloseDeal, CounterOffer
7. Checklist and document operations
8. Timeline auto-seeding
9. All controller endpoints
10. Frontend types and API client
11. Frontend page component

## Token Budget Breakdown
- Backend: ~8-10k tokens (service + controller)
- Frontend: ~5-7k tokens (types + API + component)
- **Reserve: Test coverage, error handling, edge cases**
