# Score Breakdown Fix — Before / After Code Reference

---

## ❌ BEFORE: Fabricated Score Breakdown

### Problem: Hardcoded Offset Derivation

**File:** `backend/Services/CompanyService.cs` (lines 3222–3236)

```csharp
private static OpportunityScoreBreakdownDto BuildScoreBreakdown(int matchScore)
{
    static int Clamp(int v) => Math.Clamp(v, 0, 100);
    return new OpportunityScoreBreakdownDto
    {
        SectorFit = Clamp(matchScore),        // ISSUE: Just copies total score
        StageFit = Clamp(matchScore - 3),     // ISSUE: Arbitrary -3 offset
        GeographyFit = Clamp(matchScore - 5), // ISSUE: Arbitrary -5 offset
        TeamScore = Clamp(matchScore + 2),    // ISSUE: Arbitrary +2 offset, not real "team"
    };
}
```

**Usage in API Response:**

```csharp
var detail = new OpportunityDetailResponse
{
    MatchScore = match.MatchScore,  // 76 (real)
    ScoreBreakdown = BuildScoreBreakdown(match.MatchScore), // ← derives 4 fake scores from 76
};
```

**What the investor sees:**
```json
{
  "matchScore": 76,
  "scoreBreakdown": {
    "sectorFit": 76,      // Fake: just copied the total
    "stageFit": 73,       // Fake: 76 - 3 (why -3? no one knows)
    "geographyFit": 71,   // Fake: 76 - 5 (why -5? no one knows)
    "teamScore": 78       // Fake: 76 + 2 (not even a real dimension)
  }
}
```

**Impact:** Investor has zero visibility into which dimensions actually matched. The "breakdown" is pure math fiction.

---

## ✅ AFTER: Real Persisted Component Scores

### Solution: Single Source of Truth

**File:** `backend/Models/DatabaseModels/InvestorMatch.cs`

```csharp
public class InvestorMatch
{
    public int MatchScore { get; set; } // 0-100 total
    // ← NEW: Real component scores, persisted at match time
    public ScoreComponents ScoreComponents { get; set; } = new();
}

public class ScoreComponents
{
    public int SectorScore { get; set; }              // 0-25
    public int StageScore { get; set; }               // 0-15
    public int CheckSizeScore { get; set; }           // 0-20
    public int GeographyScore { get; set; }           // 0-10
    public int EquityTypeScore { get; set; }          // 0-5
    public int InvestmentHistoryScore { get; set; }   // 0-10
    public int RevenueStageScore { get; set; }        // 0-7
    public int MarketSizeScore { get; set; }          // 0-4
    public int GrowthPotentialScore { get; set; }     // 0-4
    // Total max: 25+15+20+10+5+10+7+4+4 = 100
}
```

**Matching Engine Capture:**

**File:** `backend/Services/Implementations/InvestorMatcher.cs`

```csharp
// OLD signature:
// internal (int Score, string Rationale) ScoreAndExplain(Companies company, Investor investor)
// FIXED signature:
internal (int Score, ScoreComponents Components, string Rationale) ScoreAndExplain(Companies company, Investor investor)
{
    var components = new ScoreComponents();
    int score = 0;

    // ---- Sector (0-25) -----
    if (investor.PreferredSectors?.Any(...) == true)
    {
        score += 25;
        components.SectorScore = 25;  // ← CAPTURED
        hits.Add("sector match");
    }
    else if (investor.PreferredSectors == null || investor.PreferredSectors.Count == 0)
    {
        score += 12;
        components.SectorScore = 12;  // ← CAPTURED
        hits.Add("investor sector-agnostic");
    }
    else
    {
        components.SectorScore = 0;   // ← CAPTURED
        misses.Add("sector mismatch");
    }

    // ---- Stage (0-15) -----
    if (investor.PreferredStages?.Any(...) == true)
    {
        score += 15;
        components.StageScore = 15;   // ← CAPTURED
        hits.Add("stage match");
    }
    // ... etc for all 9 dimensions ...

    return (Math.Min(score, 100), components, rationale);  // ← Return components
}
```

**Persistence in FindMatchesAsync():**

```csharp
var (score, components, rationale) = ScoreAndExplain(company, investor);

var match = new InvestorMatch
{
    MatchScore = score,          // 76 (real)
    ScoreComponents = components, // ← PERSISTED to MongoDB
    MatchRationale = rationale,
    // ...
};

await _dbContext.InvestorMatches.InsertOneAsync(match);
```

**API Response Mapping:**

**File:** `backend/Services/CompanyService.cs` (updated `GetOpportunityForInvestorAsync()`)

```csharp
// OLD (fabricated):
// ScoreBreakdown = BuildScoreBreakdown(match.MatchScore),

// FIXED (real):
ScoreBreakdown = new OpportunityScoreBreakdownDto
{
    SectorFit = match.ScoreComponents?.SectorScore ?? 0,              // ← Real value
    StageFit = match.ScoreComponents?.StageScore ?? 0,                // ← Real value
    CheckSizeFit = match.ScoreComponents?.CheckSizeScore ?? 0,        // ← Real value
    GeographyFit = match.ScoreComponents?.GeographyScore ?? 0,        // ← Real value
    EquityTypeFit = match.ScoreComponents?.EquityTypeScore ?? 0,      // ← Real value
    InvestmentHistoryFit = match.ScoreComponents?.InvestmentHistoryScore ?? 0,  // ← Real value
    RevenueStageScore = match.ScoreComponents?.RevenueStageScore ?? 0,          // ← Real value
    MarketSizeScore = match.ScoreComponents?.MarketSizeScore ?? 0,             // ← Real value
    GrowthPotentialScore = match.ScoreComponents?.GrowthPotentialScore ?? 0,   // ← Real value
},
```

**Frontend Type:**

```typescript
// OLD (4 fields):
// interface OpportunityScoreBreakdown {
//   sectorFit: number;
//   stageFit: number;
//   geographyFit: number;
//   teamScore: number;
// }

// FIXED (9 fields, real breakdown):
export interface OpportunityScoreBreakdown {
    sectorFit: number;               // 0-25
    stageFit: number;                // 0-15
    checkSizeFit: number;            // 0-20
    geographyFit: number;            // 0-10
    equityTypeFit: number;           // 0-5
    investmentHistoryFit: number;    // 0-10
    revenueStageScore: number;       // 0-7
    marketSizeScore: number;         // 0-4
    growthPotentialScore: number;    // 0-4
}
```

**UI Component:**

```typescript
// OLD (4 hardcoded rows):
// const ROWS = [
//   { key: "sectorFit", label: "Sector Fit" },
//   { key: "stageFit", label: "Stage Fit" },
//   { key: "geographyFit", label: "Geography" },
//   { key: "teamScore", label: "Team Score" },
// ];

// FIXED (9 rows with real dimensions):
const ROWS: Array<{ key: keyof OpportunityScoreBreakdown; label: string }> = [
  { key: "sectorFit", label: "Sector Match" },
  { key: "stageFit", label: "Funding Stage" },
  { key: "checkSizeFit", label: "Check Size" },
  { key: "geographyFit", label: "Geography" },
  { key: "equityTypeFit", label: "Equity Type" },
  { key: "investmentHistoryFit", label: "Investment History" },
  { key: "revenueStageScore", label: "Revenue Stage" },
  { key: "marketSizeScore", label: "Market Size" },
  { key: "growthPotentialScore", label: "Growth Potential" },
];

// Rendering logic unchanged (still renders bars, same visual styling)
```

**What the investor now sees:**
```json
{
  "matchScore": 76,
  "scoreBreakdown": {
    "sectorFit": 25,               // Real: Company.Industry matches Investor.PreferredSectors
    "stageFit": 15,                // Real: Company.FundingRoundType matches Investor.PreferredStages
    "checkSizeFit": 20,            // Real: Company.FundingAskAmount in [Min,Max] band
    "geographyFit": 10,            // Real: Company.Country matches Investor.PreferredGeographies
    "equityTypeFit": 0,            // Real: Company.ShareType does NOT match Investor.PreferredEquityTypes
    "investmentHistoryFit": 8,     // Real: Investor has 5 exits + 2 active investments
    "revenueStageScore": 0,        // Real: Company revenue stage doesn't match investor appetite
    "marketSizeScore": 4,          // Real: Company TAM >= €1B
    "growthPotentialScore": 0      // Real: Company growth score is low
  }
  // Total: 25+15+20+10+0+8+0+4+0 = 82 ≤ 100 (clamped)
}
```

---

## Data Flow Comparison

### ❌ BEFORE

```
Matching Engine
  ↓ (calculates 9 dimensions internally)
  ↓
MatchScore Persisted (76)
  ↓
GetOpportunityForInvestorAsync()
  ↓
BuildScoreBreakdown(76)  ← No component scores available
  ├─ SectorFit = 76
  ├─ StageFit = 73 (fabricated via offset)
  ├─ GeographyFit = 71 (fabricated via offset)
  └─ TeamScore = 78 (fabricated via offset, not even a real dimension)
  ↓
OpportunityDetailResponse.ScoreBreakdown (4 fake values)
  ↓
Frontend → ScoreBreakdownPanel
  ↓
UI Bars (all magic numbers, no traceability)
```

### ✅ AFTER

```
Matching Engine
  ↓
Calculate all 9 dimensions (SectorScore=25, StageScore=15, CheckSizeScore=20, ...)
  ↓
ScoreComponents object
  ↓
Persist to InvestorMatch (single source of truth)
  ↓
GetOpportunityForInvestorAsync()
  ├─ Read match.ScoreComponents.SectorScore (25) ✓
  ├─ Read match.ScoreComponents.StageScore (15) ✓
  ├─ Read match.ScoreComponents.CheckSizeScore (20) ✓
  ├─ Read match.ScoreComponents.GeographyScore (10) ✓
  ├─ Read match.ScoreComponents.EquityTypeScore (0) ✓
  ├─ Read match.ScoreComponents.InvestmentHistoryScore (8) ✓
  ├─ Read match.ScoreComponents.RevenueStageScore (0) ✓
  ├─ Read match.ScoreComponents.MarketSizeScore (4) ✓
  └─ Read match.ScoreComponents.GrowthPotentialScore (0) ✓
  ↓
OpportunityDetailResponse.ScoreBreakdown (9 real values)
  ↓
Frontend → ScoreBreakdownPanel
  ↓
UI Bars (traceable to matching logic, fully auditable)
```

---

## Example: Real Match Scored Before vs After

### Scenario
- **Company:** SaaS with €2M revenue (scaling), €300k ask, France, Seed stage, SAFEs
- **Investor:** Prefers Seed, €200k–€2M range, France, SAFEs, 3 exits, 2 active

### ❌ BEFORE: Fabricated Breakdown

```
InvestorMatcher calculates (internally):
  Sector: 25 (web3 → no match, should be 0)
  Stage: 15 (seed match)
  Check-size: 20 (€300k in band)
  Geography: 10 (France match)
  Equity type: 5 (SAFE match)
  Investment history: 10 (3 exits, 2 active)
  Revenue stage: 7 (€2M aligns with seed appetite)
  Market size: 4 (unknown, assume €1B+)
  Growth potential: 4 (assumed medium growth)
  ───────────────────
  TOTAL: 100 (but clamped to 75 for demo)

API stores: MatchScore = 75

GetOpportunityForInvestorAsync() calls BuildScoreBreakdown(75):
  SectorFit = 75      ← WRONG: Should be 0 (web3 ≠ investor preference)
  StageFit = 72       ← WRONG: Should be 15 (calculated as 75-3)
  GeographyFit = 70   ← WRONG: Should be 10 (calculated as 75-5)
  TeamScore = 77      ← WRONG: Not even a real dimension (calculated as 75+2)

Frontend renders: "Your match score is 75. Breakdown: Sector 75%, Stage 72%, Geography 70%, Team 77%"

Investor sees: "Why is this a 75? The breakdown doesn't make sense. Sector is maxed but they invest in different verticals?"

VERDICT: Untrustworthy. Investor confidence: ❌
```

### ✅ AFTER: Real Breakdown

```
InvestorMatcher.ScoreAndExplain() calculates:
  Sector: 0 (web3 ∉ Investor.PreferredSectors; mismatch logged)
  Stage: 15 (seed = preferred)
  Check-size: 20 (€300k ∈ [€200k, €2M]; in-band)
  Geography: 10 (France ∈ PreferredGeographies)
  Equity type: 5 (SAFE ∈ PreferredEquityTypes)
  Investment history: 8 (3 exits + 2 active = 2+3=5 pts, fit on avg check)
  Revenue stage: 7 (€2M = scaling; matches seed appetite)
  Market size: 4 (unknown marke size, assume large TAM)
  Growth potential: 3 (company looks promising, ~70/100)
  ───────────────────────────────────────────────────────
  TOTAL: 0+15+20+10+5+8+7+4+3 = 72

InvestorMatch persists:
  MatchScore = 72
  ScoreComponents = {
    SectorScore: 0,
    StageScore: 15,
    CheckSizeScore: 20,
    GeographyScore: 10,
    EquityTypeScore: 5,
    InvestmentHistoryScore: 8,
    RevenueStageScore: 7,
    MarketSizeScore: 4,
    GrowthPotentialScore: 3,
  }

GetOpportunityForInvestorAsync() maps:
  ScoreBreakdown.SectorFit = 0 ✓
  ScoreBreakdown.StageFit = 15 ✓
  ScoreBreakdown.CheckSizeFit = 20 ✓
  ScoreBreakdown.GeographyFit = 10 ✓
  ScoreBreakdown.EquityTypeFit = 5 ✓
  ScoreBreakdown.InvestmentHistoryFit = 8 ✓
  ScoreBreakdown.RevenueStageScore = 7 ✓
  ScoreBreakdown.MarketSizeScore = 4 ✓
  ScoreBreakdown.GrowthPotentialScore = 3 ✓

Frontend renders all 9 bars with labels and real values

Investor sees: "Your match score is 72. Breakdown:
  Sector: 0% (reason: SaaS in Web3; you prefer SaaS, not Web3)
  Stage: 100% (Seed matches perfectly)
  Check Size: 100% (€300k is in your ideal band)
  Geography: 100% (France is your preferred geography)
  Equity Type: 100% (You prefer SAFEs, company uses SAFEs)
  Investment History: 80% (You have strong track record; ask aligns)
  Revenue Stage: 100% (€2M scaling revenue aligns with Seed appetite)
  Market Size: 100% (Large TAM estimated)
  Growth Potential: 75% (Medium-high growth expected)
  
  Strengths: Perfect stage fit, right check size, matching geography & terms
  Concerns: Different sector than typical (you prefer SaaS, this is Web3)
  
  Reason: Strong fundamental fit on every dimension except sector; offset by strong track record."

Investor sees: "OK, this makes sense. They're a strong team investing in the right stage, right size, right place. The sector mismatch is noted but we have good fundamentals everywhere else. I trust this score."

VERDICT: Trustworthy. Investor confidence: ✅
```

---

## Verification Checklist for Implementation

- [ ] **Model:** `InvestorMatch.ScoreComponents` field added and initialized
- [ ] **DAO:** `ScoreComponents` class created with all 9 fields
- [ ] **Matcher:** `ScoreAndExplain()` returns `(Score, Components, Rationale)` tuple
- [ ] **Matcher:** All 9 dimensions set in `components` during calculation
- [ ] **Matcher:** `FindMatchesAsync()` passes `components` to `InvestorMatch` constructor
- [ ] **MongoDB:** Document structure includes `scoreComponents` object with all 9 fields
- [ ] **Service:** `BuildScoreBreakdown()` function removed
- [ ] **Service:** `GetOpportunityForInvestorAsync()` reads from `match.ScoreComponents`
- [ ] **DTO:** `OpportunityScoreBreakdownDto` has 9 fields (not 4)
- [ ] **DTO:** Each field documented with max value and meaning
- [ ] **Frontend Type:** `OpportunityScoreBreakdown` has 9 fields matching DTO
- [ ] **Frontend Component:** `ScoreBreakdownPanel.ROWS` has 9 entries
- [ ] **Frontend Component:** No references to old "TeamScore" field
- [ ] **API Contract:** Old `ScoreBreakdown` field still present (backward compat)
- [ ] **Null Safety:** All mappings use `?? 0` for legacy docs
- [ ] **Test Data:** Regenerated matches have non-zero `ScoreComponents`

---

## Rollback Instructions (if needed)

If reverting:

1. Restore `CompanyService.BuildScoreBreakdown()` from git history
2. Revert `GetOpportunityForInvestorAsync()` to call `BuildScoreBreakdown(match.MatchScore)`
3. Revert `OpportunityScoreBreakdownDto` to 4 fields only
4. Revert frontend types and ScoreBreakdownPanel to old ROWS
5. Remove `ScoreComponents` from InvestorMatch model
6. API response will return fake 4-component breakdown again

**Not recommended:** Real component scores are more trustworthy.
