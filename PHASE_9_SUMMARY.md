# Phase 9: Deal Execution — Complete Summary

## Quick Overview

**Phase 9** enables founders to structure, negotiate, and close investment deals with matched investors. Founders propose terms, manage documents, track progress through deal milestones, and ultimately close the deal and advance to Phase 10 (Post-Close).

**Status:** Design complete, implementation ready for integration

---

## What Exists

### Documentation (Complete)
- ✅ `PHASE_9_SYSTEM_DESIGN.md` — 250+ lines covering business logic, architecture, data models, algorithms, APIs
- ✅ `PHASE_9_BACKEND_IMPLEMENTATION.md` — Complete C# services, models, DTOs, controller code
- ✅ `PHASE_9_FRONTEND_IMPLEMENTATION.md` — Complete TypeScript types, React component, API methods
- ✅ `PHASE_9_SUMMARY.md` — This file (quick reference)

### Not Yet Implemented in Codebase
- ❌ Database models (Phase9Models.cs)
- ❌ DTOs (Phase9Dtos.cs extensions)
- ❌ Service layer (Phase9Service.cs)
- ❌ Controller (Phase9Controller.cs)
- ❌ Frontend types (api-entrepreneur.ts additions)
- ❌ Frontend component (phase-9/client.tsx + page.tsx)
- ❌ MongoDB collection setup

---

## Key Features

### 1. Deal Lifecycle Management
- 10 deal states: initial → proposed → negotiating → loi_signed → legal_review → board_approved → investor_approved → closing → closed
- State machine validation (only allow valid transitions)
- Abandoned state (can exit at any point)

### 2. Term Sheet Validation
- Investment: min $100k
- Equity: 5-40%
- Valuation: min $100k pre-money
- Sanity checks: post-money ≥ investment, pre-money ≤ 5× investment

### 3. Cap Table Calculation
```
Post-deal ownership = old ownership × (pre-money / post-money)

Example: Founder 100%, Series A $2M @ $10M pre
→ Post-money = $12M
→ Founder ownership = 100% × (10M/12M) = 83.3%
→ Investor ownership = 16.7%
```

### 4. Document Management
- Upload term sheet, SPA, cap table, SAFE, advisory agreements
- Workflow: draft → pending_review → approved/rejected → executed
- Full audit trail (who, when, status)

### 5. Milestone Tracking
- 6 key milestones (term sheet → signing → legal → board approval → closing)
- Status for each: pending | in_progress | complete | blocked
- Blocking issue tracking

### 6. Stakeholder & Communication
- Invite/track founder, legal counsel, investor, advisors
- Message log (text, status updates, document shares)
- Interaction log (calls, meetings, emails)

---

## Core APIs

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/companies/{id}/deals` | POST | Create new deal |
| `/api/companies/{id}/deals` | GET | List all deals (with filters) |
| `/api/companies/{id}/deals/{dealId}` | GET | Get single deal |
| `/api/companies/{id}/deals/{dealId}/propose-terms` | POST | Submit term sheet |
| `/api/companies/{id}/deals/{dealId}/status` | PATCH | Update deal status |
| `/api/companies/{id}/deals/{dealId}/close` | POST | Close deal + advance to Phase 10 |
| `/api/companies/{id}/deals/{dealId}/abandon` | POST | Abandon deal |
| `/api/companies/{id}/deals/{dealId}/messages` | POST | Send message |
| `/api/companies/{id}/deals/{dealId}/documents` | POST | Upload document |

---

## Database Schema

### Main Collection: `deals`

```
{
  _id: ObjectId
  companyId: string (FK)
  investorMatchId: string (FK to phase-8 match)
  dealName: string
  status: string (state machine)
  currentTerms: TermSheet
  termHistory: [TermSheet, ...]
  documents: [DealDocument, ...]
  stakeholders: [DealStakeholder, ...]
  milestones: [DealMilestone, ...]
  messages: [DealMessage, ...]
  preCapTable: CapTableSnapshot
  postCapTable: CapTableSnapshot
  createdAt: DateTime
  closedAt: DateTime (if status="closed")
}
```

---

## Validation Gates

| Gate | Trigger | Requirement |
|------|---------|---|
| Create Deal | User clicks "Start Deal" | Phase 8 match with score ≥ 40 AND status = "accepted" |
| Propose Terms | Submit term sheet | Investment ≥ $100k, equity 5-40%, post-money ≥ investment |
| Close Deal | Click "Close Deal" | Status must be "investor_approved" or "closing" |
| Advance Phase 10 | Deal closed | At least ONE deal with status = "closed" |

---

## Integration Checklist

### Backend

- [ ] Add Phase9Models.cs to `backend/Models/DatabaseModels/`
- [ ] Add Phase9Dtos to `backend/Models/Dtos/CompanyDtos.cs`
- [ ] Add Phase9Service.cs to `backend/Services/Implementations/`
- [ ] Add Phase9Controller.cs to `backend/Controllers/`
- [ ] Register `IPhase9Service` in DI container (Startup.cs)
- [ ] Create MongoDB index on `deals` collection: `{companyId: 1, status: 1}`
- [ ] Update company model: add `currentDeal` field (optional)

### Frontend

- [ ] Add DealAgreementResponse and related types to `src/lib/api-entrepreneur.ts`
- [ ] Add API methods: createDeal, getDeal, listDeals, proposeTerms, closeDeal, etc.
- [ ] Create `src/app/dashboard/entrepreneur/(phases)/phase-9/client.tsx`
- [ ] Create `src/app/dashboard/entrepreneur/(phases)/phase-9/page.tsx`
- [ ] Create `src/app/dashboard/entrepreneur/(phases)/phase-9/complete/page.tsx` (completion screen)
- [ ] Update `layout.tsx` to guard Phase 9 (RequiredPhase=9)

### Testing

- [ ] Unit test: TermSheet validation (investment, equity, valuation)
- [ ] Unit test: Cap table dilution math
- [ ] Unit test: State machine transitions
- [ ] Integration test: Create deal → Propose terms → Close deal
- [ ] E2E test: Full deal workflow via UI
- [ ] Responsive design check (mobile, tablet, desktop)
- [ ] Accessibility audit (tabs, buttons, form fields)

---

## Code Files to Copy

From documentation:

1. **Phase9Models.cs** → `backend/Models/DatabaseModels/Phase9Models.cs`
2. **Phase9Dtos** → Merge into `backend/Models/Dtos/CompanyDtos.cs`
3. **Phase9Service.cs** → `backend/Services/Implementations/Phase9Service.cs`
4. **Phase9Controller.cs** → `backend/Controllers/Phase9Controller.cs`
5. **API types** → Add to `src/lib/api-entrepreneur.ts`
6. **client.tsx** → `src/app/dashboard/entrepreneur/(phases)/phase-9/client.tsx`
7. **page.tsx** → `src/app/dashboard/entrepreneur/(phases)/phase-9/page.tsx`

---

## Performance Expectations

- Create deal: ≤1s
- Propose terms (validate + calculate cap table): ≤1s
- List deals: ≤2s
- Upload document: ≤5s (file storage I/O)

---

## Future Enhancements

1. **Investor Notifications** — Email/SMS when deal status changes
2. **E-Signature Integration** — DocuSign/HelloSign for term sheet execution
3. **Cap Table Export** — Auto-generate PDF with pre/post cap table
4. **Board Approval Workflow** — Template + guided process
5. **Multiple Investors** — Co-investor round tracking
6. **Advisor Equity Grants** — Separate pool management
7. **Post-Close Milestones** — Revenue targets, product goals, next fundraise triggers
8. **Legal Document Templates** — SAFE, advisor agreement generators

---

## Success Metrics

- % of Phase 8 founders who initiate a deal (target: 50%+)
- Avg time from deal creation to closing (target: < 30 days)
- Deal closure rate (% of deals that reach "closed" status)
- Avg deal size (investment amount)
- Founder satisfaction (post-close survey: NPS ≥ 50)

---

## Questions & Support

Refer to detailed docs:
- **Business logic & algorithms** → `PHASE_9_SYSTEM_DESIGN.md`
- **Backend code** → `PHASE_9_BACKEND_IMPLEMENTATION.md`
- **Frontend code** → `PHASE_9_FRONTEND_IMPLEMENTATION.md`
- **API specification** → `PHASE_9_SYSTEM_DESIGN.md` (API Endpoints section)

