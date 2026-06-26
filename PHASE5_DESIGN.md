══════════════════════════════════════════════════════════════════════════════
MONDIAL.CLIENT — PHASE 5 SYSTEM DESIGN
FUNDING SUBMISSION & INVESTOR READINESS
══════════════════════════════════════════════════════════════════════════════

# SECTION 1 — FLOW & PHASE POSITION

Phase 4 Complete ✓ (Cap Table locked)
         ↓
PHASE 5 — Funding Submission (3 sequential steps)
  Step 1 — Quantify Capital (raise, valuation, equity %, share type)
  Step 2 — Resource Mapping (capital allocation + hiring plan)
  Step 3 — Equity Offer + Pitch Deck + Narrative
         ↓
Phase 5 Complete
  → Companies.FundingAskLive = true
  → InvestorReadyScore +13, TrustScore +10
  → Equity offer snapshot → MatchmakingQueue (key: "{companyId}:phase5")
  → Phase 6 (Data Room) unlocks
  → Phase 7 (AI Expert Review) unlocks simultaneously


# SECTION 2 — DATABASE SCHEMA

## Companies Collection (inline Phase 5 fields)

### Phase 5: Funding Ask (Core)
```
FundingAskAmount         double?           // EUR, e.g. 500000
FundingRoundType         string            // seed | series_a | pre_seed | bridge
PreMoneyValuation        double?           // EUR, inherited from Phase 3 finalValuation
EquityOfferedPercent     double?           // 0.01–99.99
ShareType                string            // preferred | safe | note
FundingAskLive           bool?             // set true on Phase 5 completion
```

### Phase 5: Capital Allocation
```
CapitalAllocation        List<CapitalAllocationDto>
  - Category             string            // Product | Sales | Operations | Hiring | Infrastructure | Legal | Other
  - Amount               double?           // EUR, calculated: raise * percent / 100 (derivable, redundant)
  - Percent              double            // 0–100, must total 95–105%
  - TimelineMonths       int?              // 1–18
```

### Phase 5: Resource Mapping (Hiring & Services)
```
ResourceMap              ResourceMapDto
  - HiringPlan           List<HiringPlanDto>
      - Role             string            // e.g. "Backend Engineer"
      - Salary           double            // EUR, >= 0
      - Timeline         string            // e.g. "Q2" or "Month 3"
      - Priority         string            // high | medium | low
      - ResourceType     string            // Employee | Contractor | ServiceProvider
      - SourceVia        string            // DirectHire | MondialSP | Agency (future)
  - ServiceProviders     List<ServiceProviderDto> (reserved, not yet used)
  - TechTools            List<TechToolDto> (reserved, not yet used)
```

### Phase 5: Pitch & Narrative
```
PitchDeckFileName        string?           // e.g. "pitch-v2.pdf"
PitchDeckStoragePath     string?           // e.g. "uploads/{companyId}/pitch.pdf"
PitchDeckFileSize        long?             // bytes, for display
PitchDeckUploadedAt      DateTime?         // UTC timestamp
FundingNarrative         string?           // >= 200 characters, free-form text
```

### Phase 5: Outreach (Future)
```
OutreachCampaignTemplate string?           // template name or template text
OutreachInvestorList     List<string>      // investor user IDs or investor profile IDs
OutreachCampaignStartedAt DateTime?        // when campaign was sent/scheduled
```

### Scoring (set by Phase5CompletionEvents)
```
InvestorReadyScore       int?              // incremented +13 on Phase 5 completion (0–100 max)
TrustScore               int?              // incremented +10 on Phase 5 completion (legacy, 0–100 max)
```


# SECTION 3 — API ENDPOINTS

Base path: `/api/companies/{companyId}/`

## Funding Ask Endpoints

### POST /funding-ask
**Purpose:** Save funding ask (amount, round, valuation, equity %, share type).

**Request:**
```json
{
  "raiseAmount": 500000,                    // EUR, > 0
  "roundType": "seed",                      // seed | series_a | pre_seed | bridge
  "preMoneyValuation": 5000000,             // EUR, >= raise
  "equityOfferedPercent": 10.5,             // 0.01–100
  "shareType": "preferred",                 // preferred | safe | note
  "capitalAllocation": [
    {
      "category": "Product",
      "percent": 40.0
    },
    {
      "category": "Sales & Marketing",
      "percent": 35.0
    },
    {
      "category": "Operations",
      "percent": 25.0
    }
  ],
  "resourceMap": {
    "hiringPlan": [
      {
        "role": "Backend Engineer",
        "salary": 80000,
        "timeline": "Q2",
        "priority": "high"
      }
    ],
    "serviceProviders": [],
    "techTools": []
  }
}
```

**Validation (write-time):**
- raiseAmount > 0
- roundType in enum
- preMoneyValuation > 0
- equityOfferedPercent in (0, 100]
- shareType in {preferred, safe, note}
- Each allocation: category non-empty, percent in [0, 100]
- Each hiring row: role non-empty, salary >= 0, timeline non-empty, priority in {high, medium, low}

**Validation (advancement-time, ValidatePhase5Async):**
- Capital allocation total in [95, 105] ✓
- Hiring plan non-empty ✓
- Each hiring row valid ✓
- Pitch deck uploaded ✓
- Narrative >= 200 chars ✓
- All field values finite (no NaN/Infinity) ✓

**Response:**
```json
{
  "fundingAskId": "uuid",
  "raiseAmount": 500000,
  "roundType": "seed",
  "preMoneyValuation": 5000000,
  "equityOfferedPercent": 10.5,
  "shareType": "preferred",
  "postMoneyValuation": 5500000,
  "pricePerShare": 5.00,
  "newSharesIssued": 100000,
  "capitalAllocation": [...],
  "resourceMap": {...},
  "savedAt": "2026-06-18T10:30:00Z"
}
```

### GET /funding-profile
**Purpose:** Fetch current funding ask, allocation, hiring plan, pitch deck metadata, narrative.

**Response:**
```json
{
  "companyId": "comp-1",
  "fundingAskAmount": 500000,
  "fundingRoundType": "seed",
  "preMoneyValuation": 5000000,
  "equityOfferedPercent": 10.5,
  "shareType": "preferred",
  "capitalAllocation": [
    { "category": "Product", "amount": 200000, "percent": 40.0 },
    { "category": "Sales", "amount": 175000, "percent": 35.0 },
    { "category": "Operations", "amount": 125000, "percent": 25.0 }
  ],
  "resourceMap": {
    "hiringPlan": [
      { "role": "Backend Engineer", "salary": 80000, "timeline": "Q2", "priority": "high" }
    ]
  },
  "pitchDeckFileName": "pitch-v2.pdf",
  "pitchDeckFileSize": 2097152,
  "pitchDeckUploadedAt": "2026-06-18T09:15:00Z",
  "fundingNarrative": "We are raising to scale our product...",
  "fundingAskLive": false,
  "investorReadyScore": 45,
  "trustScore": 60
}
```

## Pitch Deck Endpoints

### POST /pitch-deck
**Purpose:** Upload pitch deck (PDF, PPTX, DOCX).

**Request:** multipart/form-data
- `file`: binary (max 10MB)

**Response:**
```json
{
  "fileName": "pitch-v2.pdf",
  "storagePath": "uploads/comp-1/pitch-v2.pdf",
  "fileSize": 2097152,
  "uploadedAt": "2026-06-18T09:15:00Z"
}
```

### GET /pitch-deck
**Purpose:** Fetch pitch deck metadata.

**Response:** (same as POST response above)

## Narrative Endpoints

### POST /funding-narrative
**Purpose:** Save funding narrative (>= 200 characters).

**Request:**
```json
{
  "narrative": "We are raising €500k seed to scale our SaaS product for SMBs. Capital will be allocated to: 40% Product development (backend scalability, mobile app), 35% Sales & marketing (direct sales, content), 25% Operations (team, infrastructure). We will hire 3 engineers and 1 sales person in Q2-Q3. Current traction: €120k ARR, 45 paying customers, 35% MoM growth."
}
```

**Validation (write-time):**
- narrative.length >= 200
- narrative.length <= (no limit, but practical ~5000)

**Response:**
```json
{
  "narrative": "...",
  "characterCount": 412,
  "savedAt": "2026-06-18T10:45:00Z"
}
```

### GET /funding-narrative
**Purpose:** Fetch current narrative.

**Response:**
```json
{
  "narrative": "...",
  "characterCount": 412
}
```

## Phase Advancement

### POST /phase/5
**Purpose:** Validate Phase 5 and advance to Phase 6.

**Request:**
```json
{}
```

**Validation (ValidatePhase5Async):**
1. FundingAskAmount finite and > 0
2. FundingRoundType present
3. PreMoneyValuation >= 1
4. EquityOfferedPercent in (0, 100]
5. ShareType in {preferred, safe, note}
6. CapitalAllocation non-empty
7. Each row: category non-empty, amount > 0, percent in [0, 100]
8. Total allocation in [95, 105]
9. HiringPlan non-empty
10. Each row: role, timeline non-empty, salary >= 0, priority in {high, medium, low}
11. PitchDeckFileName present
12. FundingNarrative >= 200 chars

**Response (on success):**
```json
{
  "currentPhase": 6,
  "completedPhases": [1, 2, 3, 4, 5],
  "investorReadyScore": 58,
  "trustScore": 70,
  "fundingAskLive": true
}
```

**Error (on failure):**
```json
{
  "error": "Cannot advance: <validation failure detail>",
  "traceId": "..."
}
```


# SECTION 4 — BUSINESS LOGIC

## Phase 5 Completion Events (Phase5CompletionEvents.cs)

When `AdvancePhaseAsync(companyId, 5)` succeeds:

### Side-effects (atomic, best-effort):
1. **InvestorReadyScore += 13** (clamped to 100)
2. **TrustScore += 10** (clamped to 100)
3. **FundingAskLive = true**
4. **Enqueue to MatchmakingQueue** (idempotent upsert):
   - Key: `{companyId}:phase5`
   - Payload:
     ```json
     {
       "idempotency_key": "{companyId}:phase5",
       "entrepreneur_id": "comp-1",
       "phase5_complete": true,
       "funding_ask_live": true,
       "equity_offer": {
         "amount": 500000,
         "round": "seed",
         "pre_money": 5000000,
         "equity_pct": 10.5,
         "share_type": "preferred",
         "min_ticket": 50000  // derived from CapitalAllocation[0].Amount or explicit field
       },
       "scores": {
         "investor_ready_score": 58,
         "trust_score": 70
       }
     }
     ```
   - Status: "pending" (consumed by Phase 8 Smart Matchmaking Engine)

### Error handling:
- All exceptions swallowed (fire-and-forget pattern)
- Completion events are best-effort; scoring/queue failures do NOT block phase advance
- **FIX NEEDED**: Add logging (ILogger) for failed side-effects to enable ops debugging

## Validation Rules (ValidatePhase5Async)

### Funding Ask Validation
- FundingAskAmount must be finite, > 0
- PreMoneyValuation must be finite, >= 1 (should be >= FundingAskAmount)
- EquityOfferedPercent must be in (0, 100]
- ShareType must be in {preferred, safe, note}

### Capital Allocation Validation
- Non-empty list required
- Each row:
  - Category non-empty
  - Amount >= 0, finite
  - Percent in [0, 100]
- **Total percent must be in [95, 105]** (allows 5% rounding tolerance)
- **FIX NEEDED**: Validate that sum(salary) in hiring plan <= raise * allocation['Hiring']%

### Hiring Plan Validation
- Non-empty list required
- Each row:
  - Role non-empty
  - Salary >= 0, finite
  - Timeline non-empty (e.g. "Q2", "Month 3")
  - Priority in {high, medium, low}

### Pitch Deck & Narrative
- PitchDeckFileName must be non-null
- **FIX NEEDED**: Verify pitch deck file actually exists in storage
- FundingNarrative >= 200 characters

### Data Type Consistency
- **FIX NEEDED**: Validate capital allocation amounts are recalculated correctly on load
- Ensure no NaN/Infinity propagates to persistence layer

## Data Lineage

Phase 3 (KPI Baseline) → Phase 5 (PreMoneyValuation pre-filled from Phase 3.FinalValuation)
                                        ↓
Phase 5 (Funding Ask + Allocation + Hiring)
                                        ↓
Phase5CompletionEvents (InvestorReadyScore +13, TrustScore +10)
                                        ↓
MatchmakingQueue (key: {companyId}:phase5) [consumed by Phase 8]
                                        ↓
Phase 6 (Data Room) + Phase 7 (AI Review) unlock


# SECTION 5 — KNOWN ISSUES & FIXES

## Critical (Production Risk)

| Issue | File:Line | Severity | Fix |
|-------|-----------|----------|-----|
| Idempotency missing | client.tsx:221 | CRITICAL | Add idempotency key to saveFundingAsk + saveFundingNarrative + advancePhase; backend accepts Idempotency-Key header |
| Pitch deck persistence gap | client.tsx:104 | CRITICAL | Add file-exists check in Phase5Validator before phase advance |
| Capital allocation NaN propagation | client.tsx:233 | CRITICAL | Validate amount calculation; reject allocation row if percent is malformed |
| Silent exception swallow | Phase5CompletionEvents.cs:89 | CRITICAL | Add ILogger.LogError() for failed side-effects |
| Nav state desync | client.tsx:252 | CRITICAL | Only call moveToNextStep() if advancePhase().currentPhase == 6 |
| minTicket derivation | Phase5CompletionEvents.cs:46 | CRITICAL | Add explicit minTicket field to SaveFundingAskRequest, or document derivation |
| Amount field redundancy | CapitalAllocationDto | CRITICAL | Remove Amount field (client-side only) or compute server-side; eliminate dual-source risk |

## High (Functional Gap)

| Issue | Severity | Fix |
|-------|----------|-----|
| Outreach email job missing | HIGH | Implement background job to send emails to OutreachInvestorList using OutreachCampaignTemplate (backend TODO line 1341) |
| Pitch deck versioning | HIGH | Track version history; allow rollback on corrupted upload |
| Valuation logic unchecked | HIGH | Validate preMoneyValuation >= raiseAmount |
| Investor list validation | HIGH | Check investor IDs exist before outreach campaign |
| Hiring salary total unchecked | HIGH | Validate sum(salaries) <= raise * allocation[Hiring]% |

## Medium (Code Quality)

| Issue | Severity | Fix |
|-------|----------|-----|
| Capital allocation amount derivation | MEDIUM | Make Amount field read-only or remove from response |
| Data deserialization unvalidated | MEDIUM | Type-guard CapitalAllocationDto on load from API |
| camelCase/PascalCase mapping | MEDIUM | Document JSON serializer config; consider explicit [JsonPropertyName] attributes |
| Validation duplication | MEDIUM | Remove redundant narrative length check in SaveFundingNarrativeAsync |

## Low (Polish)

| Issue | Severity | Fix |
|-------|----------|-----|
| File picker accept incomplete | LOW | Add .pages, .keynote, .xls variants; use MIME types |
| Narrative no max length | LOW | Document practical limit (5000 chars) or enforce UI bound |
| Hiring salary allows 0 | LOW | Warn user on 0 salary; may be intentional |
| Allocation total rounding edge case | LOW | Use consistent decimal precision (toFixed(2)) in display and validation |


# SECTION 6 — TEST COVERAGE

**Phase5ValidatorTests.cs** (should include):
1. ✓ All valid pass
2. ✓ No funding ask → fail
3. ✓ Equity out of range → fail
4. ✓ Capital allocation not balanced (< 95% or > 105%) → fail
5. ✓ No pitch deck → fail
6. ✓ Narrative too short (< 200 chars) → fail
7. ✓ No hiring plan → fail
8. ✓ Doesn't require Phase 6 data room (Phase 5 is independent)

**Integration Tests** (missing):
- Phase 5 completion events fire correctly (scores increment, matchmaking queue enqueued)
- Pitch deck upload + validation flow
- Idempotency: retry POST /phase/5 returns same result
- Outreach email job triggers on phase completion (when implemented)

---

End of Phase 5 System Design
