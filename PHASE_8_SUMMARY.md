# Phase 8: Capital Matchmaking — Complete System Summary

## Quick Overview

**Phase 8** connects founders with investors using a deterministic rule-based matching engine. Founders explore matches, manage interactions, and progress toward deal execution in Phase 9.

**Status:** Design complete; implementation partially done (frontend client.tsx exists; backend services ready for integration).

---

## What Exists Today

### Frontend
- ✅ Page scaffold (`phase-8/page.tsx`)
- ✅ Client component with tabs, filters, match cards (`phase-8/client.tsx`)
- ✅ KPI cards, match display, interaction buttons
- ❌ API integration methods (to add)

### Backend
- ❌ Database models (InvestorProfile, InvestorMatch)
- ❌ Matching engine service
- ❌ Phase8Service
- ❌ API controller endpoints

---

## Key Features

### Matching Algorithm (Rule-Based v1)

Deterministic scoring against company profile + investor preferences:

```
Score = 0
if (sector match) → +25
if (stage match) → +25
if (check size match) → +25
if (geography match) → +15
if (investor-ready badge) → +10
else → +5
cap at 100
```

Generate rationale: "Sector: X (match). Stage: Y (no match). Check: €250k (range match)."

### Interaction Lifecycle

```
Founder views match
├─ Log interaction (view/message/call/proposal/term_sheet)
├─ Update status (accepted/rejected/saved)
└─ Submit when ≥1 accepted match exists (score ≥40)
    └─ Advance to Phase 9 (Deal Execution)
```

### UI Components

| Component | Purpose |
|-----------|---------|
| **KPI Row** | Total matches, high-score count, average score |
| **Funding Summary** | Amount, round, equity offered, investor-ready status |
| **Tabs** | All / Interested / Accepted / Saved / Rejected |
| **Filters** | Investor type, preferred round |
| **Match Cards** | Investor name, score, type, sectors, rationale, actions |
| **Actions** | Save / Accept / Reject / Log interaction |

---

## Implementation Roadmap

### Phase 1: Backend Setup (1-2 days)
1. Create Phase8Models.cs (InvestorProfile, InvestorMatch, MatchingInsights)
2. Create MatchingEngine.cs (rule-based scorer)
3. Create Phase8Service.cs (CRUD + generation logic)
4. Create Phase8Controller.cs (API endpoints)
5. Register services in DI container
6. Seed sample investor profiles

### Phase 2: Frontend Integration (1 day)
1. Add API types to api-entrepreneur.ts
2. Add Phase8Data type to types/entrepreneur.ts
3. Update client.tsx to import and use API methods
4. Test match generation, filtering, status updates, interaction logging
5. Verify phase advancement gate

### Phase 3: Testing & Polish (1 day)
1. Test matching algorithm arithmetic
2. Test filtering by type, round, sector
3. Test status transitions and persistence
4. Test interaction logging
5. Dark mode audit
6. Accessibility audit

---

## API Endpoints

```
POST   /api/companies/{companyId}/investor-matches/regenerate
       → InvestorMatchResponse[]
       
GET    /api/companies/{companyId}/investor-matches
       → InvestorMatchResponse[]
       
PATCH  /api/companies/{companyId}/investor-matches/{matchId}
       { status: "accepted" | "rejected" | "saved" }
       → InvestorMatchResponse
       
POST   /api/companies/{companyId}/investor-matches/{matchId}/interactions
       { type: "view" | "message" | "call" | "proposal_sent" | "term_sheet", details: "" }
       → InvestorMatchResponse
       
GET    /api/companies/{companyId}/investor-matches/insights
       → MatchingInsightsResponse
```

---

## Database Schema

### InvestorProfile
```
_id: ObjectId
name: string
email: string
type: string (vc|angel|corporate|family_office)
headquarters: string (country)
preferredSectors: [string]
preferredStages: [string]
minCheckSizeEur: number
maxCheckSizeEur: number
preferredGeographies: [string] (countries)
isActive: boolean
createdAt: DateTime
updatedAt: DateTime
```

### InvestorMatch
```
_id: ObjectId
companyId: string (foreign key)
investorId: string (foreign key → InvestorProfile)
matchScore: int (0-100)
matchRationale: string
engineVersion: string ("rule_based_v1")
status: string (new|interested|accepted|rejected|saved|passed|viewing|reviewing)
statusUpdatedAt: DateTime
interactions: [
  {
    type: string (view|message|call|proposal_sent|term_sheet),
    details: string,
    occurredAt: DateTime
  }
]
matchedAt: DateTime
savedAt: DateTime
acceptedAt: DateTime
rejectedAt: DateTime
```

### MatchingInsights
```
totalMatches: int
highScoreMatches: int (score >= 70)
interactionsCount: int
averageScore: double
lastMatchedAt: DateTime
```

---

## Validation Gates

| Gate | Trigger | Requirement |
|------|---------|---|
| **Generate Matches** | Click "Generate matches" | Company ≥ Phase 6 (data room) OR ≥ Phase 7 (investor-ready) |
| **Accept Match** | Click "Accept" | Match score ≥ 40 (weak fit OK to explore) |
| **Advance to Phase 9** | Click "Submit & Complete Phase 8" | ≥1 accepted match |

---

## Future Enhancements

### LLM-Driven Matching (When AI Provider Credentials Available)

1. Assemble company snapshot (phases 2-6 data + badge + founder bio)
2. Call Claude: "Rate founder-investor pair on fit, timing, strategic value"
3. Parse response: score (0-100) + personalized rationale
4. Persist in same InvestorMatch model, tag `engineVersion: "claude-opus-4-8"`
5. Fallback to rule-based scorer if LLM fails

### Features to Add

- [ ] Investor profile photos + bios (UI cards)
- [ ] Two-way messaging (in-app + email integration)
- [ ] Deal pipeline tracking (saved → reviewing → negotiating → closed)
- [ ] Investor sentiment analysis (AI reads replies, suggests next steps)
- [ ] Automated icebreaker templates ("Thanks for the match, here's why we're a fit...")
- [ ] Analytics: match response rate, time-to-accept, close rate

---

## Performance Targets

- **Generate matches:** ≤5s (100-500 investors vs 1 company)
- **List matches:** ≤2s (fetch + filter 100-500 records)
- **Update status:** ≤1s (single record patch)
- **Calculate insights:** ≤1s (aggregation query)

---

## Documentation Files

| File | Purpose |
|------|---------|
| `PHASE_8_SYSTEM_DESIGN.md` | Business logic, architecture, data models, algorithms |
| `PHASE_8_BACKEND_IMPLEMENTATION.md` | Complete C# code for models, services, controllers, DTOs |
| `PHASE_8_FRONTEND_IMPLEMENTATION.md` | Complete TypeScript code for types, API methods, client component |
| `PHASE_8_SUMMARY.md` | This file — roadmap and quick reference |

---

## Success Metrics

- % of founders who generate matches
- % of matches with ≥1 interaction
- Avg time-to-accept for top-10 matches
- % advancing to Phase 9
- Investor satisfaction (post-match survey)

---

## Next Steps

1. **Immediate:** Copy Phase 8 backend code into project (models, services, controller)
2. **Day 2:** Add API methods to api-entrepreneur.ts
3. **Day 3:** Test and refine; seed sample investor pool
4. **Day 4:** Dark mode audit, accessibility audit, performance testing

---

## Questions?

Refer to the design docs for:
- Matching algorithm details → `PHASE_8_SYSTEM_DESIGN.md`
- Backend code → `PHASE_8_BACKEND_IMPLEMENTATION.md`
- Frontend code → `PHASE_8_FRONTEND_IMPLEMENTATION.md`

