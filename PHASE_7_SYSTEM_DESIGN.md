# Phase 7: Automated Readiness Review — System Design & Business Logic

## Executive Summary

**Phase 7** is an automated readiness review engine that scores a company's investor readiness across 5 dimensions. It produces:
- A **0-100 overall score** based on deterministic rules over Phase 2-6 data
- An **investor-ready badge** (binary flag at score >= 70)
- **Actionable recommendations** from hardcoded templates
- An **immutable history** for trend tracking

**Current mode:** Deterministic rule-based scorer (NOT LLM).  
**Future P1:** Replace with LLM when provider credentials are available; keep rule-based fallback.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Phase 7 Request Flow                                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Frontend                Backend               Database      │
│  ========              =======               ========       │
│                                                              │
│  1. Click              → POST /ai-review                     │
│  "Run Review"            CompanyId                          │
│                                                              │
│                        2. Load Companies                    │
│                           by ID              Companies      │
│                                              ├─ Phase 2-5   │
│                                              ├─ Phase 6     │
│                                              ├─ AiReview    │
│                                              │              │
│                        3. RunAiReviewAsync                  │
│                           ├─ CalculateScores (rule-based)   │
│                           ├─ GenerateRecommendations        │
│                           └─ Create response                │
│                                                              │
│                        4. Persist to two places:            │
│                           a) Companies.AiReview             │
│                              (cheap "current score" reads)   │
│                                                              │
│                           b) Phase7ReviewSnapshots          │
│                              (immutable audit trail)         │
│                                                              │
│  ← AiReviewResponse ←    5. Return to frontend              │
│    (overallScore,                                           │
│     scoreBreakdown,                                         │
│     investorReadyBadge,                                     │
│     recommendations,                                        │
│     reviewedAt)                                             │
│                                                              │
│  6. Update UI                                               │
│     ├─ Show scores                                          │
│     ├─ Show badge status                                    │
│     ├─ Show recommendations                                 │
│     ├─ Enable/disable submit button                         │
│     └─ Add to history                                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Scoring Algorithm: Rule-Based Deterministic Scorer

### Scoring Dimensions (5 equal-weight pillars)

Each dimension has a **base score** plus **feature-based additions**. All are capped at 100.  
**Overall score = Average of 5 dimensions, rounded down.**

#### 1. **Verification Score** (Base: 50 → Max: 100)

Measures: Company identity verification via Phase 2 data.

| Rule | Points | Source |
|------|--------|--------|
| Base | 50 | Always applied |
| LegalName populated | +10 | `company.LegalName` |
| RegistrationNumber populated | +15 | `company.RegistrationNumber` |
| BeneficialOwnersDto.Count > 0 | +15 | `company.BeneficialOwnersDto` (Phase 2) |
| DocumentStatuses.Count > 0 | +10 | `company.DocumentStatuses` (Phase 2) |
| **Max** | **100** | `Math.Min(total, 100)` |

**Example:**
- Company with LegalName, RegistrationNumber, 2 beneficial owners, 3 docs: 50 + 10 + 15 + 15 + 10 = **100**
- Company with only LegalName: 50 + 10 = **60**

---

#### 2. **Financial Score** (Base: 30 → Max: 100)

Measures: Revenue signals and financial position via Phase 3 data.

| Rule | Points | Source |
|------|--------|--------|
| Base | 30 | Always applied |
| TotalRevenue > 0 | +20 | Sum of Q1-Q4 revenue (Phase 3) |
| TotalRevenue > $100k | +20 | Bonus for material revenue |
| Valuation > 0 | +15 | `company.Valuation` |
| CurrentFunds > 0 | +15 | `company.CurrentFunds` |
| **Max** | **100** | `Math.Min(total, 100)` |

**Example:**
- Company with $150k revenue, $2M valuation, $500k in bank: 30 + 20 + 20 + 15 + 15 = **100**
- Early-stage with $30k revenue, no valuation: 30 + 20 = **50**

---

#### 3. **Equity Score** (Base: 40 → Max: 100)

Measures: Cap table completeness via Phase 4 data.

| Rule | Points | Source |
|------|--------|--------|
| Base | 40 | Always applied |
| EquityStructure.Count > 0 | +20 | Cap table with founder/investor stakes |
| TotalShares > 0 | +20 | Share pool defined |
| EsopPoolPercent > 0 | +20 | Employee stock option pool allocated |
| **Max** | **100** | `Math.Min(total, 100)` |

**Example:**
- Company with cap table, share pool, 10% ESOP: 40 + 20 + 20 + 20 = **100**
- No cap table yet: **40**

---

#### 4. **Funding Score** (Base: 30 → Max: 100)

Measures: Fundraising readiness via Phase 5 data.

| Rule | Points | Source |
|------|--------|--------|
| Base | 30 | Always applied |
| FundingAskAmount > 0 | +25 | Amount seeking (`company.FundingAskAmount`) |
| FundingRoundType populated | +20 | Round type (Seed, Series A, etc.) |
| CapitalAllocation.Count > 0 | +15 | Budget breakdown by use category (Phase 5) |
| HiringPlan.Count > 0 | +10 | Resource plan with hiring detail (Phase 5) |
| **Max** | **100** | `Math.Min(total, 100)` |

**Example:**
- Company seeking $2M Seed, with breakdown, hiring plan: 30 + 25 + 20 + 15 + 10 = **100**
- No funding strategy: **30**

---

#### 5. **Data Room Score** (Base: 20 → Max: 100)

Measures: Investor readiness via Phase 6 data room.

| Rule | Points | Source |
|------|--------|--------|
| Base | 20 | Always applied |
| DataRoomDocuments.Count > 0 | +30 | Docs uploaded |
| IsDataRoomLive | +20 | Data room published |
| IsDataRoomNdaRequired | +15 | NDA protection enabled |
| DataRoomAccessRecords.Count > 0 | +15 | Investor access granted |
| **Max** | **100** | `Math.Min(total, 100)` |

**Example:**
- Company with 10 docs live, NDA on, 3 investors granted access: 20 + 30 + 20 + 15 + 15 = **100**
- Empty data room: **20**

---

### Overall Score Calculation

```csharp
OverallScore = (V + F + E + Fu + D) / 5
// Each component is 0-100, so OverallScore is 0-100
// Integer division, no rounding
```

**Examples:**
- All dimensions = 100: (100 + 100 + 100 + 100 + 100) / 5 = **100**
- All dimensions = 50: (50 + 50 + 50 + 50 + 50) / 5 = **50**
- Mixed (90, 80, 70, 60, 50): (90 + 80 + 70 + 60 + 50) / 5 = **70** ← Meets threshold

---

## Recommendation Engine: Hardcoded Templates

### Rules (triggered by dimension scores)

| Trigger | Recommendation | Priority | Potential Gain | Details |
|---------|---|---|---|---|
| `VerificationScore < 60` | Complete Legal Verification | high | +20 | Upload registration docs & beneficial owner details |
| `FinancialScore < 70` | Improve Financial Documentation | high | +25 | Provide quarterly revenue & financial statements |
| `EquityScore < 70` | Finalize Cap Table | high | +20 | Define complete equity structure (founders, investors, ESOP) |
| `FundingScore < 70` | Clarify Use of Funds | medium | +25 | Detailed capital allocation breakdown |
| `DataRoomScore < 70` | Set Up Investor Data Room | medium | +30 | Upload key docs (pitch, models, term sheets) |
| Sum of all scores < 350 | Strengthen Overall Profile | medium | +15 | Generic catch-all for incomplete profiles |

**Evaluation logic:**
```csharp
var recommendations = new List<RecommendationDto>();
if (scores.V < 60) recommendations.Add(...);  // Check each rule
if (scores.F < 70) recommendations.Add(...);
if (scores.E < 70) recommendations.Add(...);
if (scores.Fu < 70) recommendations.Add(...);
if (scores.D < 70) recommendations.Add(...);
if (scores.V + scores.F + scores.E + scores.Fu + scores.D < 350)
  recommendations.Add(...);  // Catch-all

return recommendations;  // 0-6 recommendations per run
```

**Note:** These are **hardcoded templates**, not LLM-generated. The frontend labels them "AI recommendations" but they're deterministic based on dimension thresholds. This is MVP-correct; future LLM will replace templates with per-company generated text.

---

## Investor-Ready Badge Logic

### Badge Award Rules

A company earns the **investor-ready badge** if and only if:

```csharp
if (OverallScore >= 70)
  InvestorReadyBadge = true
else
  InvestorReadyBadge = false
```

**Binary decision:** Score >= 70 → badge eligible.

### Safety Gates (to prevent spoofing)

When advancing Phase 7 → Phase 8, the backend validator enforces:

1. **Review exists:** `company.AiReview != null`
2. **Score passes:** `overallScore >= 70`
3. **Badge is true:** `investorReadyBadge == true`
4. **Review is fresh:** `ReviewedAt > (now - 30 days)`

If ANY gate fails, phase advancement is blocked.

---

## Data Models

### AiReviewResponse (DTO — returned to frontend)

```csharp
public class AiReviewResponse
{
    public int OverallScore { get; set; }                    // 0-100
    public ScoreBreakdownDto ScoreBreakdown { get; set; }    // 5 dimension scores
    public bool InvestorReadyBadge { get; set; }             // true if score >= 70
    public List<RecommendationDto> Recommendations { get; set; }  // 0-6 items
    public DateTime ReviewedAt { get; set; }                 // Timestamp
}
```

### ScoreBreakdownDto

```csharp
public class ScoreBreakdownDto
{
    public int VerificationScore { get; set; }    // 0-100
    public int FinancialScore { get; set; }       // 0-100
    public int EquityScore { get; set; }          // 0-100
    public int FundingScore { get; set; }         // 0-100
    public int DataRoomScore { get; set; }        // 0-100
    public int OverallScore { get; set; }         // 0-100
}
```

### RecommendationDto

```csharp
public class RecommendationDto
{
    public string Title { get; set; }                    // e.g., "Complete Legal Verification"
    public string Description { get; set; }             // e.g., "Upload company registration documents..."
    public string Priority { get; set; }                // "high" | "medium" | "low"
    public int PotentialPointGain { get; set; }         // How many points if fixed (15-30)
}
```

### Phase7ReviewSnapshot (Database model — immutable)

```csharp
public class Phase7ReviewSnapshot
{
    [BsonId]
    public string Id { get; set; }                           // MongoDB ObjectId

    public string CompanyId { get; set; }                    // Foreign key to Companies
    public int OverallScore { get; set; }
    public ScoreBreakdownDto ScoreBreakdown { get; set; }
    public bool InvestorReadyBadge { get; set; }
    public List<RecommendationDto> Recommendations { get; set; }
    
    public DateTime ReviewedAt { get; set; }                 // When the run occurred
    public string EngineVersion { get; set; }                // "rule_based_v1" or "claude-opus-4-7" etc.
}
```

### Companies.AiReview (denormalized cache for fast reads)

```csharp
// Inside Companies class:
public AiReviewResponse AiReview { get; set; }               // Latest review
public DateTime? LastAiReviewAt { get; set; }                // When it was run
```

---

## Database Schema

### Collections

#### `Companies` collection
Fields used by Phase 7 engine:

**Verification:**
- `LegalName` (string)
- `RegistrationNumber` (string)
- `BeneficialOwnersDto` (List<BeneficialOwnerDto>)
- `DocumentStatuses` (List<DocumentStatusDto>)

**Financial:**
- `Q1Revenue`, `Q2Revenue`, `Q3Revenue`, `Q4Revenue` (decimal)
- `Valuation` (decimal)
- `CurrentFunds` (decimal)

**Equity:**
- `EquityStructure` (List<EquityAllocationDto>)
- `TotalShares` (decimal)
- `EsopPoolPercent` (decimal)

**Funding:**
- `FundingAskAmount` (decimal)
- `FundingRoundType` (string)
- `CapitalAllocation` (List<CapitalAllocationDto>)
- `ResourceMap` (ResourceMapDto with HiringPlan)

**Data Room:**
- `DataRoomDocuments` (List<DataRoomDocumentResponse>)
- `IsDataRoomLive` (bool)
- `IsDataRoomNdaRequired` (bool)
- `DataRoomAccessRecords` (List<DataRoomAccessRecord>)

**Phase 7 fields:**
- `AiReview` (AiReviewResponse) — latest snapshot, denormalized for cheap reads
- `LastAiReviewAt` (DateTime?) — when review was last run
- `IsInvestorReady` (bool) — set to true if badge awarded; used for marketplace visibility

#### `Phase7ReviewSnapshots` collection
One immutable document per review run.

**Indexes:**
- `CompanyId` (ascending) + `ReviewedAt` (descending) — for history retrieval, sorted by recency

---

## API Contracts

### POST /companies/{companyId}/ai-review

**Purpose:** Run a new readiness review.

**Request:** Empty body  
**Response:**
```json
{
  "overallScore": 72,
  "scoreBreakdown": {
    "verificationScore": 80,
    "financialScore": 70,
    "equityScore": 75,
    "fundingScore": 65,
    "dataRoomScore": 70,
    "overallScore": 72
  },
  "investorReadyBadge": true,
  "recommendations": [
    {
      "title": "Clarify Use of Funds",
      "description": "Provide detailed breakdown of how capital will be allocated...",
      "priority": "medium",
      "potentialPointGain": 25
    }
  ],
  "reviewedAt": "2026-06-19T14:30:00Z"
}
```

**Side effects:**
- Loads Companies by ID
- Calls `_aiReviewEngine.RunReviewAsync(company)`
- Writes `company.AiReview = response` + `company.LastAiReviewAt = ReviewedAt`
- Persists updated Companies document
- Inserts new Phase7ReviewSnapshot (immutable)

---

### GET /companies/{companyId}/ai-review

**Purpose:** Fetch the latest review.

**Response:** Same as POST response above.

**Implementation:**
```csharp
public async Task<AiReviewResponse> GetAiReviewScoreAsync(string companyId)
{
    var company = await GetCompanyAsync(companyId);
    return company.AiReview ?? throw new InvalidOperationException("No automated review found for this company");
}
```

---

### GET /companies/{companyId}/ai-review/history

**Purpose:** Retrieve all past reviews (for trend chart).

**Response:**
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "companyId": "...",
    "overallScore": 75,
    "scoreBreakdown": { ... },
    "investorReadyBadge": true,
    "recommendations": [ ... ],
    "reviewedAt": "2026-06-19T14:30:00Z",
    "engineVersion": "rule_based_v1"
  },
  {
    "id": "507f1f77bcf86cd799439010",
    "overallScore": 68,
    ...
    "reviewedAt": "2026-06-12T10:15:00Z",
    "engineVersion": "rule_based_v1"
  }
]
```

**Implementation:**
```csharp
public async Task<List<Phase7ReviewSnapshot>> GetAiReviewHistoryAsync(string companyId)
{
    await GetCompanyAsync(companyId);
    return await _dbContext.Phase7ReviewSnapshots
        .Find(s => s.CompanyId == companyId)
        .SortByDescending(s => s.ReviewedAt)
        .ToListAsync();
}
```

---

## Validation Rules (Phase 7 Validator)

When a founder clicks "Publish Phase 7" to advance to Phase 8:

```csharp
public async Task<(bool IsValid, List<string> Errors)> ValidatePhase7Async(Companies company)
{
    var errors = new List<string>();

    // 1. Review must exist
    if (company.AiReview == null)
        errors.Add("Automated readiness review must be completed");

    // 2. Score must be >= 70
    if (!Phase7Requirements.MeetsAdvanceThreshold(company.AiReview.OverallScore))
        errors.Add($"Review score must be at least 70 (currently {company.AiReview.OverallScore})");

    // 3. Badge must be true
    if (!company.AiReview.InvestorReadyBadge)
        errors.Add("Latest review did not award the investor-ready badge");

    // 4. Review must be fresh (<30 days old)
    var reviewedAt = company.LastAiReviewAt ?? company.AiReview.ReviewedAt;
    if (!Phase7Requirements.IsFreshEnough(reviewedAt))
        errors.Add($"Review is stale (run at {reviewedAt}, max age 30 days) — rerun before advancing");

    return (errors.Count == 0, errors);
}
```

**All 4 gates must pass for Phase 7 completion.**

---

## Freshness Window

**Rule:** A review is valid for **30 days** from the `ReviewedAt` timestamp.

**Why:** Prevents stale reviews from gating advancement when underlying Phase 2-6 data has changed materially (e.g., new funding, cap table update, data room changes).

**Implementation:**
```csharp
public static readonly TimeSpan MaxReviewAgeForAdvance = TimeSpan.FromDays(30);

public static bool IsFreshEnough(DateTime reviewedAt, DateTime? now = null)
{
    var ts = (now ?? DateTime.UtcNow) - reviewedAt;
    return ts <= MaxReviewAgeForAdvance;
}
```

---

## Frontend State & Flow

### Page State (Phase 7 page.tsx)

```typescript
const [review, setReview] = useState<AiReviewResponse | null>(null);
const [history, setHistory] = useState<AiReviewHistoryEntry[]>([]);
const [isRunning, setIsRunning] = useState(false);
const [isSubmitting, setIsSubmitting] = useState(false);
const [error, setError] = useState('');
```

### User Flows

#### **1. First Visit — No Review Yet**
```
→ reload() fetches getAiReview() → null
→ UI shows: "No review yet. Click Run review."
→ Button: "Run review" (enabled)
```

#### **2. User Clicks "Run Review"**
```
→ handleRunReview():
  - setIsRunning(true)
  - Calls runAiReview(companyId)
  - setReview(result)
  - reload() to refresh history
  - setIsRunning(false)

→ UI updates:
  - Shows scores (0-100, color-coded)
  - Shows badge status (green "Eligible" or gray "Pending")
  - Lists recommendations (0-6 items)
  - Shows "Last run: [date/time]"
  - Button: "Re-run review" (enabled again)
  - "Publish" button enabled IF score >= 70 AND badge == true
```

#### **3. User Clicks "Publish & Complete Phase 7"**
```
→ handleSubmit():
  - Calls advancePhase(companyId, 7, {})
  - Backend validates all 4 gates
  - If all pass: currentPhase becomes 8, routes to /phase-7/complete
  - If any fail: error banner shows why

→ /phase-7/complete page:
  - Shows trophy icon, "Investor-Ready Badge Claimed!"
  - Shows score, badge status
  - Shows Phase 8 unlock message
  - Button: "Continue to Phase 8"
```

---

## Edge Cases & Constraints

### 1. Incomplete Profile (Score < 70)
- User sees score + recommendations
- "Publish" button is disabled
- Recommendations show which sections to improve + potential point gains
- User can re-run at any time to see updated score

### 2. Review Expires (> 30 days old)
- Backend validator blocks advancement: "Review is stale, rerun before advancing"
- User must click "Re-run review" to get a fresh timestamp
- Score likely unchanged (data hasn't changed), but timestamp updates

### 3. Stale Badge (Score >= 70 but badge not set)
- This should never happen (engine awards badge in same atomic operation)
- If it does: "Latest review did not award the investor-ready badge"
- Rerun to fix

### 4. Data Changes After Review
- User completes Phase 6 (uploads data room docs)
- Phase 7 review was run 25 days ago with no data room (score = 45)
- Now score should be ~65 (data room adds +30 points)
- User must re-run review to update score

### 5. Multiple Review Runs
- No throttling — user can re-run immediately
- Each run creates a new Phase7ReviewSnapshot
- History shows all runs; frontend charts the trend
- Companies.AiReview always points to latest

---

## Future LLM Integration (P1 — Not Yet Wired)

When Claude/OpenAI credentials are available:

1. **Replace CalculateScores()** with:
   - Assemble deterministic company snapshot (JSON)
   - Hash snapshot for cache-key
   - Call LLM with structured prompt (use prompt caching)
   - Validate response against schema
   - If invalid, fall back to rule-based scorer

2. **Keep rule-based fallback** for:
   - Dev/CI runs (no credentials)
   - LLM API failures (network, rate-limit, 5xx)
   - Cost control (deterministic for internal reviews)

3. **Update EngineVersion** to model ID:
   - "rule_based_v1" → "claude-opus-4-7" or similar
   - Stored in Phase7ReviewSnapshot for reproducibility

4. **Recommendations** will be LLM-generated:
   - Per-company personalized text instead of templates
   - Higher quality, context-aware advice

---

## Business Metrics & Incentives

### Scoring Design Philosophy

**The 5 dimensions mirror the investor diligence checklist:**
1. **Verification** (30%): Legal identity confirmed → trustworthiness
2. **Financial** (30%): Revenue/valuation signals → market traction
3. **Equity** (20%): Cap table defined → governance clarity
4. **Funding** (20%): Ask + strategy clear → fundraising readiness
5. **Data Room** (0%): Transparency → due-diligence support

**Equal weighting:** Founders can't game the system by optimizing one dimension. They must build a well-rounded profile.

### Badge Threshold (70)

Signals: "Investor-ready" = meets a basic standard across all dimensions. Not "perfect", not "definitely fundable", but "has completed due diligence prep and is professionally presented".

### Recommendation Urgency

- **High priority (V < 60, F < 70, E < 70):** Core investor needs
- **Medium priority (Fu < 70, D < 70, total < 350):** Nice-to-have or catch-all

---

## Summary: Mental Model

**Phase 7 is a readiness checkpoint, not a funding approval.**

- **Input:** Company profile (Phases 2-6 data)
- **Process:** Deterministic rule-based scorer
- **Output:** Score (0-100) + badge (binary) + recommendations (list)
- **Immutability:** Every run creates a snapshot; history is auditable
- **Freshness:** Reviews valid for 30 days; stale ones block advancement
- **Future:** LLM will replace templates; rule-based remains as fallback

The badge signals: "You've done your homework. You're ready to pitch to investors." Phase 8 then connects them to matched investors.

---

## Files Involved

- **Backend Engine:** `backend/Services/Implementations/AiReviewEngine.cs`
- **Requirements (rules):** `backend/Services/Implementations/Phase7Requirements.cs`
- **Validator:** `backend/Services/Implementations/PhaseValidator.cs` (ValidatePhase7Async)
- **Service Method:** `backend/Services/CompanyService.cs` (RunAiReviewAsync, GetAiReviewScoreAsync, etc.)
- **Models:**
  - `backend/Models/DatabaseModels/Phase7Models.cs` (Phase7ReviewSnapshot)
  - `backend/Models/Dtos/CompanyDtos.cs` (AiReviewResponse, ScoreBreakdownDto, RecommendationDto)
- **Controller:** `backend/Controllers/CompanyController.cs` (POST/GET /ai-review, etc.)
- **Frontend:** `src/app/dashboard/entrepreneur/(phases)/phase-7/page.tsx`
- **Visual Component:** `src/components/entrepreneur/dataroom/Phase7ReviewVisuals.tsx`
- **API Wrapper:** `src/lib/api-entrepreneur.ts` (runAiReview, getAiReview, getAiReviewHistory)

