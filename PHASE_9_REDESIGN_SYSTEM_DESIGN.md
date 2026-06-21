# Phase 9: Deal Pipeline — Redesigned System Design (Figma-Aligned)

## Business Goal
Enable founders to track investor interest through a simple 5-stage pipeline (Interested → In Discussion → Term Sheet → Due Diligence → Closed). Simplified deal tracking without over-engineered stakeholder/document/milestone management.

---

## Architecture Overview

```
FOUNDER (Phase 9 — Deal Pipeline)
  ├─ View 4 stats: Total Deals, Committed $, Target $, Remaining $
  ├─ See round progress bar (committed vs. target, % filled)
  ├─ Filter deals by pipeline stage (Interested | In Discussion | Term Sheet | Due Diligence | Closed)
  ├─ Add new deal (investor name, type, activity description)
  ├─ Move deal through pipeline (drag/click status change)
  ├─ View/manage term sheet (equity %, amounts, legal terms)
  ├─ Accept or counter term sheet (auto-advances deal status)
  └─ View timeline of all deal events (7 milestones)

DEAL ENGINE (Backend)
  ├─ Track deals in 5 states (interested → in_discussion → term_sheet → due_diligence → closed)
  ├─ Manage term sheets separately (pending | accepted | countered | rejected)
  ├─ Auto-generate timeline events (funding ask published, matches identified, term sheet received, etc.)
  ├─ Calculate round summary (total committed, remaining to target, % filled)
  ├─ Validate state transitions (only allow valid next states)
  └─ Derive post-money valuation (server-side only, never accept from client)

STORAGE (MongoDB — 3 collections)
  ├─ Deals: CompanyId, InvestorId, InvestorName, Status, CommittedAmountEur, ActivityTitle, ActivityDate
  ├─ TermSheets: DealId, EquityPercent, InvestmentAmountEur, PreMoneyValuationEur, Status, LegalTerms
  └─ DealTimelineEvents: CompanyId, EventDate, Title, Status (completed|active|pending), Color (green|blue|amber|gray)
```

---

## Data Models

### 1. Deal (Collection: `deals`)

```csharp
public class Deal
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

    // Foreign keys
    public string CompanyId { get; set; }
    public string InvestorId { get; set; }

    // Identity
    public string InvestorName { get; set; }
    public string InvestorType { get; set; }  // "vc" | "angel" | "corporate" | "family_office"

    // Pipeline status
    public string Status { get; set; } = "interested";  
    // "interested" | "in_discussion" | "term_sheet" | "due_diligence" | "closed" | "abandoned"
    public DateTime? StatusUpdatedAt { get; set; }

    // Funding commitment
    public decimal? CommittedAmountEur { get; set; }  // Null until deal closes or investor commits

    // Activity tracking
    public string ActivityTitle { get; set; }  // e.g. "Reviewed pitch deck", "Viewed data room"
    public string ActivityDescription { get; set; }  // e.g. "Investor read deck and scheduled meeting"
    public DateTime ActivityDate { get; set; }

    // Audit
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
```

### 2. TermSheet (Collection: `termsheets`)

```csharp
public class TermSheet
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

    // Foreign keys
    public string CompanyId { get; set; }
    public string DealId { get; set; }

    // Identity
    public string InvestorName { get; set; }

    // Financial terms
    public decimal EquityPercent { get; set; }  // e.g. 9.44
    public decimal InvestmentAmountEur { get; set; }
    public decimal PreMoneyValuationEur { get; set; }
    public decimal PostMoneyValuationEur { get; set; }  // Derived: pre + investment (server-side only)

    // Legal terms
    public string ShareClass { get; set; }  // e.g. "Preferred Seed"
    public string LiquidationPref { get; set; }  // e.g. "1x non-participating"
    public string BoardSeat { get; set; }  // e.g. "1 observer seat"
    public bool HasBoardSeat { get; set; }  // Shown as "Yes · standard" in UI
    public string AntiDilutionType { get; set; }  // e.g. "Broad-based weighted"
    public DateTime? ClosingDeadline { get; set; }  // Shown as "April 30, 2026" in amber badge

    // Status
    public string Status { get; set; } = "pending";  // "pending" | "accepted" | "countered" | "rejected"
    public DateTime? ExpiresAt { get; set; }  // Shown as "Expires Apr 30" red badge

    // Audit
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
```

### 3. DealTimelineEvent (Collection: `dealtimelineevents`)

```csharp
public class DealTimelineEvent
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

    // Foreign key
    public string CompanyId { get; set; }

    // Timeline data
    public DateTime EventDate { get; set; }
    public string Title { get; set; }  // e.g. "Funding ask published"
    public string Subtitle { get; set; }  // e.g. "Pre-Seed round live on marketplace"

    // Display
    public string Status { get; set; }  // "completed" | "active" | "pending"
    public string Color { get; set; }  // "green" | "blue" | "amber" | "gray"
    public bool IsAutoGenerated { get; set; }  // True if created by system (not manually)

    // Audit
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
```

---

## State Machine

### Valid Transitions

```
interested
  → in_discussion
  → abandoned

in_discussion
  → term_sheet
  → abandoned

term_sheet
  → due_diligence (via AcceptTermSheet)
  → in_discussion (via CounterTermSheet)
  → abandoned

due_diligence
  → closed
  → term_sheet (go back if new TS needed)
  → abandoned

closed
  → (read-only, no further transitions)

* (any state) → abandoned
```

### Term Sheet Impact on Deal Status

```
CreateTermSheet → Deal.Status becomes "term_sheet"
AcceptTermSheet → Deal.Status becomes "due_diligence", Deal.CommittedAmountEur set if not already
CounterTermSheet → Deal.Status back to "in_discussion"
TermSheet.Status = "rejected" → Deal status unchanged (but TS no longer active)
```

---

## API Endpoints

### Deals

#### Create Deal
**POST** `/api/companies/{companyId}/deals`

**Request:**
```json
{
  "investorName": "Acme Ventures",
  "investorType": "vc",
  "activityTitle": "Reviewed pitch deck",
  "activityDescription": "Investor reviewed 2-slide pitch overview"
}
```

**Response:** `DealResponse`
```json
{
  "dealId": "xxx",
  "investorName": "Acme Ventures",
  "investorType": "vc",
  "status": "interested",
  "activityTitle": "Reviewed pitch deck",
  "activityDate": "2026-06-20T10:00:00Z",
  "createdAt": "2026-06-20T10:00:00Z"
}
```

#### List Deals
**GET** `/api/companies/{companyId}/deals`

**Query:** `?status=interested` (optional)

**Response:** `DealResponse[]`

#### Update Deal
**PATCH** `/api/companies/{companyId}/deals/{dealId}`

**Request:**
```json
{
  "status": "in_discussion",
  "committedAmountEur": 250000,
  "activityTitle": "Scheduled meeting",
  "activityDescription": "Meeting with founder and lead investor"
}
```

**Response:** `DealResponse`

#### Delete Deal
**DELETE** `/api/companies/{companyId}/deals/{dealId}`

**Response:** 204 No Content

#### Close Deal
**POST** `/api/companies/{companyId}/deals/{dealId}/close`

**Request:** `{}`

**Response:** `DealResponse` with `status: "closed"`

#### Get Round Summary
**GET** `/api/companies/{companyId}/deals/summary`

**Response:** `RoundSummaryResponse`
```json
{
  "totalDeals": 4,
  "committedAmountEur": 200000,
  "roundTargetEur": 450000,
  "remainingEur": 250000,
  "percentFilled": 44.44,
  "interestedCount": 3,
  "inDiscussionCount": 2,
  "termSheetCount": 1,
  "closedCount": 1
}
```

#### Get Timeline
**GET** `/api/companies/{companyId}/deals/timeline`

**Response:** `TimelineEventResponse[]` (sorted by EventDate ascending)

### Term Sheets

#### Create Term Sheet
**POST** `/api/companies/{companyId}/term-sheets`

**Request:**
```json
{
  "dealId": "xxx",
  "investorName": "Atomico",
  "equityPercent": 9.44,
  "investmentAmountEur": 250000,
  "preMoneyValuationEur": 2400000,
  "shareClass": "Preferred Seed",
  "liquidationPref": "1x non-participating",
  "boardSeat": "1 observer seat",
  "hasBoardSeat": true,
  "antiDilutionType": "Broad-based weighted",
  "closingDeadline": "2026-04-30T23:59:59Z",
  "expiresAt": "2026-05-31T23:59:59Z"
}
```

**Response:** `TermSheetResponse`

#### Get Active Term Sheet
**GET** `/api/companies/{companyId}/term-sheets/active`

**Response:** `TermSheetResponse | null`

#### Accept Term Sheet
**PATCH** `/api/companies/{companyId}/term-sheets/{termSheetId}/accept`

**Request:** `{}`

**Response:** `TermSheetResponse` with `status: "accepted"`
- Side effect: Deal.Status → "due_diligence"
- Side effect: Auto-append timeline event "Term sheet accepted"

#### Counter Term Sheet
**PATCH** `/api/companies/{companyId}/term-sheets/{termSheetId}/counter`

**Request:** `{}`

**Response:** `TermSheetResponse` with `status: "countered"`
- Side effect: Deal.Status → "in_discussion"
- Side effect: Auto-append timeline event "Term sheet countered"

---

## DTOs

```csharp
namespace Backend.Models.Dtos
{
    // Deal DTOs
    public class CreateDealRequest
    {
        public string InvestorName { get; set; }
        public string InvestorType { get; set; }
        public string ActivityTitle { get; set; }
        public string ActivityDescription { get; set; }
    }

    public class UpdateDealRequest
    {
        public string Status { get; set; }  // optional
        public decimal? CommittedAmountEur { get; set; }  // optional
        public string ActivityTitle { get; set; }  // optional
        public string ActivityDescription { get; set; }  // optional
    }

    public class DealResponse
    {
        public string DealId { get; set; }
        public string InvestorId { get; set; }
        public string InvestorName { get; set; }
        public string InvestorType { get; set; }
        public string Status { get; set; }
        public decimal? CommittedAmountEur { get; set; }
        public string ActivityTitle { get; set; }
        public string ActivityDescription { get; set; }
        public string ActivityDate { get; set; }
        public string CreatedAt { get; set; }
    }

    // Term Sheet DTOs
    public class CreateTermSheetRequest
    {
        public string DealId { get; set; }
        public string InvestorName { get; set; }
        public decimal EquityPercent { get; set; }
        public decimal InvestmentAmountEur { get; set; }
        public decimal PreMoneyValuationEur { get; set; }
        public string ShareClass { get; set; }
        public string LiquidationPref { get; set; }
        public string BoardSeat { get; set; }
        public bool HasBoardSeat { get; set; }
        public string AntiDilutionType { get; set; }
        public DateTime? ClosingDeadline { get; set; }
        public DateTime? ExpiresAt { get; set; }
    }

    public class TermSheetResponse
    {
        public string TermSheetId { get; set; }
        public string DealId { get; set; }
        public string InvestorName { get; set; }
        public decimal EquityPercent { get; set; }
        public decimal InvestmentAmountEur { get; set; }
        public decimal PreMoneyValuationEur { get; set; }
        public decimal PostMoneyValuationEur { get; set; }
        public string ShareClass { get; set; }
        public string LiquidationPref { get; set; }
        public string BoardSeat { get; set; }
        public bool HasBoardSeat { get; set; }
        public string AntiDilutionType { get; set; }
        public DateTime? ClosingDeadline { get; set; }
        public DateTime? ExpiresAt { get; set; }
        public string Status { get; set; }
        public string CreatedAt { get; set; }
    }

    // Round Summary
    public class RoundSummaryResponse
    {
        public int TotalDeals { get; set; }
        public decimal CommittedAmountEur { get; set; }
        public decimal RoundTargetEur { get; set; }
        public decimal RemainingEur { get; set; }
        public decimal PercentFilled { get; set; }
        public int InterestedCount { get; set; }
        public int InDiscussionCount { get; set; }
        public int TermSheetCount { get; set; }
        public int ClosedCount { get; set; }
    }

    // Timeline
    public class TimelineEventResponse
    {
        public string EventId { get; set; }
        public string EventDate { get; set; }
        public string Title { get; set; }
        public string Subtitle { get; set; }
        public string Status { get; set; }  // "completed" | "active" | "pending"
        public string Color { get; set; }  // "green" | "blue" | "amber" | "gray"
    }
}
```

---

## Service Layer

### IPhase9Service

```csharp
public interface IPhase9Service
{
    // Deals
    Task<DealResponse> CreateDealAsync(string companyId, CreateDealRequest request);
    Task<List<DealResponse>> GetDealsAsync(string companyId, string status = null);
    Task<DealResponse> UpdateDealAsync(string companyId, string dealId, UpdateDealRequest request);
    Task DeleteDealAsync(string companyId, string dealId);
    Task<DealResponse> CloseDealAsync(string companyId, string dealId);

    // Summary & Timeline
    Task<RoundSummaryResponse> GetRoundSummaryAsync(string companyId);
    Task<List<TimelineEventResponse>> GetTimelineAsync(string companyId);

    // Term Sheets
    Task<TermSheetResponse> CreateTermSheetAsync(string companyId, CreateTermSheetRequest request);
    Task<TermSheetResponse> GetActiveTermSheetAsync(string companyId);
    Task<TermSheetResponse> AcceptTermSheetAsync(string companyId, string termSheetId);
    Task<TermSheetResponse> CounterTermSheetAsync(string companyId, string termSheetId);

    // Validation
    Task<bool> ValidatePhase9ReadyAsync(string companyId);
}
```

---

## Validation Gates

| Gate | Requirement |
|------|-------------|
| **Create Deal** | Phase 9 unlocked (Phase 8 complete) |
| **Accept Term Sheet** | Valid term sheet exists, can't accept rejected TS |
| **Close Deal** | Deal status must be "due_diligence" |
| **Advance Phase 10** | At least 1 deal with status = "closed" OR at least 1 TermSheet with status = "accepted" |

---

## HTTP Status Codes

```
POST /deals → 201 Created
GET /deals → 200 OK
PATCH /deals/{id} → 200 OK
DELETE /deals/{id} → 204 No Content
POST /deals/{id}/close → 200 OK
PATCH /term-sheets/{id}/accept → 200 OK

INVALID STATE TRANSITION (e.g., term_sheet → closed without due_diligence) → 409 Conflict
NOT FOUND → 404 Not Found
VALIDATION ERROR (e.g., negative investment) → 400 Bad Request
UNAUTHORIZED → 401 Unauthorized
FORBIDDEN (not company owner) → 403 Forbidden
SERVER ERROR → 500 Internal Server Error
```

---

## MongoDB Indexes

```javascript
// Deals collection
db.deals.createIndex({ companyId: 1, status: 1 })
db.deals.createIndex({ companyId: 1, activityDate: -1 })

// TermSheets collection
db.termsheets.createIndex({ companyId: 1, dealId: 1 })
db.termsheets.createIndex({ dealId: 1, status: 1 })

// DealTimelineEvents collection
db.dealtimelineevents.createIndex({ companyId: 1, eventDate: 1 })
```

---

## Notes

- **PostMoneyValuationEur always derived server-side** (never accept from client)
- **No cap table calculation** (not in Figma)
- **No stakeholder/milestone/message management** (Phase 9 is simple pipeline tracking)
- **Fire-and-forget timeline events** (append event, don't block response)
- **JWT auth required** (extract CompanyId from token, validate ownership)
- **camelCase JSON serialization** (ASP.NET Core default)

