# Phase 8: Capital Matchmaking — Complete System Design

## Business Goal
Connect vetted companies with investors based on deterministic rule-based matching (scalable to LLM-driven matching when provider credentials available). Founders explore investor fit, manage interaction history, and progress toward deal execution.

---

## Architecture Overview

```
FOUNDER (Phase 8)
  ├─ View matches (scored investor profiles)
  ├─ Filter by: status, investor type, round, sector
  ├─ Log interactions (view, message, call, proposal, term sheet)
  ├─ Save/accept/reject matches
  └─ Submit (advance to Phase 9: Deal Execution)

MATCHING ENGINE (Backend)
  ├─ Rule-based scorer:
  │  ├─ Sector fit (company sectors vs investor preferences)
  │  ├─ Stage fit (company stage vs investor preferred stage)
  │  ├─ Geography fit (company country vs investor geography)
  │  └─ AI readiness fit (badge earned vs investor data room requirement)
  ├─ Generate matches (100-500 per run, deterministic)
  ├─ Persist snapshots for audit trail
  └─ [Future] LLM-driven rationales & personalization

INVESTOR PROFILES (Database)
  ├─ Investor entity (name, email, type, check size, geography)
  ├─ Preferences (sectors, stages, min/max ticket size, geographies)
  ├─ Interaction history (views, messages, calls, proposals)
  └─ Status (active, inactive, opted-out)
```

---

## Database Models

### InvestorProfile (New)
```csharp
public class InvestorProfile
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

    // Identity
    public string Name { get; set; }
    public string Email { get; set; }
    public string Logo { get; set; }
    public string Bio { get; set; }

    // Profile
    public string Type { get; set; } // "vc" | "angel" | "corporate" | "family_office"
    public string Headquarters { get; set; } // country
    public List<string> PreferredSectors { get; set; } = new();
    public List<string> PreferredStages { get; set; } = new(); // "pre_seed" | "seed" | "series_a" | "series_b" | ...
    public double MinCheckSizeEur { get; set; }
    public double MaxCheckSizeEur { get; set; }
    public List<string> PreferredGeographies { get; set; } = new(); // countries

    // Status
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
```

### InvestorMatch (Phase 8 Match Record)
```csharp
public class InvestorMatch
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

    // Foreign keys
    public string CompanyId { get; set; }
    public string InvestorId { get; set; }

    // Match quality
    public int MatchScore { get; set; } // 0-100
    public string MatchRationale { get; set; } // "Sector: AgriTech (match). Stage: Seed (match). Check size: €250k-2M (within range)."
    public string EngineVersion { get; set; } // "rule_based_v1" or "claude-opus-4-8"

    // Status tracking
    public string Status { get; set; } // "new" | "interested" | "accepted" | "rejected" | "saved" | "passed" | "viewing" | "reviewing" | "matched"
    public DateTime? StatusUpdatedAt { get; set; }

    // Interaction history
    public List<InteractionLog> Interactions { get; set; } = new();

    // Metadata
    public DateTime MatchedAt { get; set; } = DateTime.UtcNow;
    public DateTime? SavedAt { get; set; }
    public DateTime? AcceptedAt { get; set; }
    public DateTime? RejectedAt { get; set; }
}

public class InteractionLog
{
    public string Type { get; set; } // "view" | "message" | "call" | "proposal_sent" | "term_sheet"
    public string Details { get; set; } // optional notes
    public DateTime OccurredAt { get; set; } = DateTime.UtcNow;
}
```

### MatchingInsights (Phase 8 Dashboard Summary)
```csharp
public class MatchingInsights
{
    public int TotalMatches { get; set; }
    public int HighScoreMatches { get; set; } // score >= 70
    public int InteractionsCount { get; set; }
    public double AverageScore { get; set; }
    public DateTime? LastMatchedAt { get; set; }
}
```

---

## API Endpoints

### Generate Matches
**POST** `/api/companies/{companyId}/investor-matches/regenerate`

**Request:** `{}`

**Response:**
```json
{
  "matchId": "xxxxxxx",
  "investorId": "yyyyyyy",
  "investorName": "Acme VC Partners",
  "matchScore": 82,
  "investorType": "vc",
  "preferredRound": "seed",
  "investmentRange": "€250k-2M",
  "preferredSectors": ["AgriTech", "ClimateChange"],
  "status": "new",
  "matchRationale": "Sector: AgriTech (match). Stage: Seed (match).",
  "engineVersion": "rule_based_v1",
  "matchedAt": "2026-06-19T10:30:00Z"
}
```

**Business Logic:**
1. Fetch company profile (phases 2-6 data + Phase 7 badge)
2. Fetch all active InvestorProfile records
3. For each investor, calculate match score:
   - Sector fit: +25 if company sector in investor.preferredSectors
   - Stage fit: +25 if company stage in investor.preferredStages
   - Check size: +25 if funding amount within investor.minCheckSize — investor.maxCheckSize
   - Geography: +15 if company country in investor.preferredGeographies
   - AI readiness: +10 if company.isInvestorReady && investor requires badge
4. Generate rationale: "Sector: X (match/no match). Stage: Y (match/no match)..."
5. Persist as InvestorMatch records (replace prior run)
6. Return array sorted by matchScore DESC

### Get Matches
**GET** `/api/companies/{companyId}/investor-matches`

**Response:** Array of InvestorMatch (includes investor name, logo, bio from joined profile)

### Update Match Status
**PATCH** `/api/companies/{companyId}/investor-matches/{matchId}`

**Request:**
```json
{
  "status": "accepted" // | "rejected" | "saved" | "viewed"
}
```

**Response:** Updated InvestorMatch record

### Record Interaction
**POST** `/api/companies/{companyId}/investor-matches/{matchId}/interactions`

**Request:**
```json
{
  "type": "message", // | "call" | "proposal_sent" | "term_sheet"
  "details": "Sent deck and one-pager"
}
```

**Response:** Updated InvestorMatch with new interaction in array

### Get Matching Insights
**GET** `/api/companies/{companyId}/investor-matches/insights`

**Response:**
```json
{
  "totalMatches": 127,
  "highScoreMatches": 34,
  "interactionsCount": 12,
  "averageScore": 58.3,
  "lastMatchedAt": "2026-06-19T10:30:00Z"
}
```

---

## Frontend Types (TypeScript)

```typescript
// api-entrepreneur.ts

export interface InvestorMatchResponse {
  matchId: string;
  investorId: string;
  investorName?: string;
  matchScore: number;
  investorType?: string;
  preferredRound?: string;
  investmentRange?: string;
  preferredSectors: string[];
  status: string; // "new" | "interested" | "accepted" | "rejected" | "saved" | "passed" | "viewing" | "reviewing"
  matchRationale?: string;
  engineVersion?: string;
  matchedAt?: string;
  savedAt?: string;
  acceptedAt?: string;
  rejectedAt?: string;
}

export interface MatchingInsightsResponse {
  totalMatches: number;
  highScoreMatches: number;
  interactionsCount: number;
  averageScore: number;
  lastMatchedAt?: string;
}

export interface InteractionRecord {
  type: "view" | "message" | "call" | "proposal_sent" | "term_sheet";
  details: string;
  occurredAt: string;
}
```

---

## Frontend Page Structure

### Layout
```
Phase 8: Automated Investor Matching
  ├─ Info banner (deterministic engine, LLM future roadmap)
  ├─ KPI row (total matches, high-score matches, average score)
  ├─ Funding ask summary + Re-run button
  ├─ Tabs: All / Interested / Accepted / Saved / Rejected
  ├─ Filters: Investor type, Round, Location (stub)
  └─ Match cards grid
      ├─ Investor name + status badge
      ├─ Type, investment range, preferred round, sectors
      ├─ Match score (0-100) + tone (success/warning/muted)
      ├─ Match rationale (monospace)
      ├─ Action buttons: Save / Accept / Reject / Log interaction
      └─ Engine version label
```

### Interaction Flow

**Initial Load:**
```
1. resolveCompanyId() → fetch from cache or server
2. reload():
   a. fetch getCurrentPhase() → populate investorReady flag
   b. Promise.all([
      getInvestorMatches(companyId),
      getMatchingInsights(companyId),
      getFundingProfile(companyId)
   ])
   c. setMatches, setInsights, setFunding
3. Render empty state if matches.length === 0
```

**Generate Matches:**
```
1. handleRegenerate():
   a. regenerateInvestorMatches(companyId)
   b. setMatches(fresh) ← immediate UI update
   c. reload() ← refresh insights & funding
```

**Update Match:**
```
1. handleStatusUpdate(matchId, status):
   a. updateMatchStatus(companyId, matchId, status)
   b. setMatches(prev => update in array) ← optimistic
```

**Log Interaction:**
```
1. handleInteraction(matchId, type):
   a. recordInvestorInteraction(companyId, matchId, type, details)
   b. reload() ← refresh entire list
```

**Advance Phase:**
```
1. handleSubmit():
   a. Require: matches.some(m => m.matchScore >= 40)
   b. advancePhase(companyId, 8, {})
   c. Expect: currentPhase === 9
   d. Navigate to /dashboard/entrepreneur/phase-9
```

---

## Validation Gates

| Gate | Trigger | Requirement |
|------|---------|---|
| **Generate Matches** | User clicks "Generate matches" | Company ≥ Phase 7 (investor-ready) OR ≥ Phase 6 (data room live) |
| **Accept Match** | User clicks "Accept" | Match.matchScore ≥ 40 (weak fit is OK to explore) |
| **Advance to Phase 9** | User clicks "Submit & Complete Phase 8" | At least ONE accepted match (matchScore ≥ 40) |

---

## Matching Algorithm (Rule-Based v1)

**Deterministic Scoring:**

```
matchScore = 0

// Sector fit (max +25)
if company.sectors intersect investor.preferredSectors:
  matchScore += 25

// Stage fit (max +25)
if company.stage in investor.preferredStages:
  matchScore += 25

// Check size fit (max +25)
if fundingAmount >= investor.minCheckSize AND fundingAmount <= investor.maxCheckSize:
  matchScore += 25

// Geography fit (max +15)
if company.country in investor.preferredGeographies:
  matchScore += 15

// AI readiness fit (max +10)
if investor.requiresAiBadge AND company.isInvestorReady:
  matchScore += 10
else if !investor.requiresAiBadge:
  matchScore += 5  // small bonus for any company

// Cap at 100
matchScore = Math.Min(matchScore, 100)

// Generate rationale
rationale = ""
if (sector match):
  rationale += "Sector: {company.sectors[0]} (match). "
else:
  rationale += "Sector: {company.sectors[0]} (no match). "

if (stage match):
  rationale += "Stage: {company.stage} (match). "
else:
  rationale += "Stage: {company.stage} (no match). "

if (check size match):
  rationale += "Check size: €{fundingAmount}k (within range €{minCheck}-{maxCheck}). "
else:
  rationale += "Check size: €{fundingAmount}k (outside range €{minCheck}-{maxCheck}). "

return { matchScore, matchRationale: rationale }
```

---

## Future: LLM-Driven Matching (Roadmap)

When Anthropic credentials configured:

1. **Prompt:** Assemble company snapshot (phases 2-6, badge, founder bio) + investor profile
2. **Call Claude:** "Rate this founder-investor pair on: fit, timing, strategic value"
3. **Parse Response:** Score (0-100) + personalized rationale
4. **Persist:** Reuse InvestorMatch model, tag `engineVersion: "claude-opus-4-8"`
5. **Fallback:** If LLM fails (cost/rate limits), revert to rule-based scorer

---

## Error Handling

| Error | HTTP | Cause | Founder sees |
|-------|------|-------|---|
| No matches after regenerate | 200 OK | Investor pool empty / no fits | "No matches in this view. Adjust filters or wait for new investors." |
| Phase gate failed | 403 | Company not ≥ Phase 6 | "Must complete Phase 6 before matching" |
| Match not found | 404 | matchId typo / already deleted | "Match no longer available" |
| Update conflict | 409 | Concurrent edit | "Match was updated. Refresh and try again." |

---

## Audit Trail

Every InvestorMatch record persists:
- `matchedAt`: When match was generated
- `savedAt`: When founder saved
- `acceptedAt`: When founder accepted
- `rejectedAt`: When founder rejected
- `interactions[]`: Full log of all messages, calls, proposals
- `engineVersion`: Reproducibility

---

## Performance Targets

- **Generate matches:** ≤5s (100-500 investor profiles vs 1 company)
- **Update status:** ≤1s (single record update)
- **List matches:** ≤2s (fetch + filter 100-500 records)
- **Insights calculation:** ≤1s (aggregate query)

**Optimization:**
- Index InvestorMatch on (companyId, status)
- Cache MatchingInsights for 1h
- Batch interaction records (flush every 5 interactions or on nav away)

---

## Success Metrics

- % of founders who generate matches in Phase 8
- % of matches that receive ≥1 interaction (view/message/call)
- Avg time-to-accept for top-10 matches
- % of Phase 8 founders advancing to Phase 9
- Investor satisfaction (post-match survey)

---

## Testing Checklist

- [ ] Generate 100 matches with sample investor pool
- [ ] Verify scoring arithmetic (sector +25, stage +25, etc.)
- [ ] Test all status transitions (new → accepted, etc.)
- [ ] Verify rationale text generation
- [ ] Verify filtering (by type, round, sector)
- [ ] Verify tab counts update on status change
- [ ] Verify phase advancement gate (require ≥1 accepted match)
- [ ] Verify error states (no matches, filters empty)
- [ ] Verify accessibility (tabs, buttons, progress bar)
- [ ] Verify dark mode compatibility

