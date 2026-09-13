# Mondial ECO — Change Impact & Blast Radius Matrix

This matrix provides developers and architects with an immediate dependency map answering: **"If we change this file or module, what else could break?"**

---

## 1. High-Impact Core Modules

| Module / File Modified | Immediate Dependents | Cascading Blast Radius | Mitigation & Verification Protocol |
|---|---|---|---|
| **`AuthProvider.tsx`**<br/>`src/app/_providers/AuthProvider.tsx` | - `src/components/layout/AuthGuard.tsx`<br/>- `src/app/dashboard/layout.tsx`<br/>- `src/lib/axios.ts` | **Catastrophic (Whole Frontend)**.<br/>Can lock out all users, break token refresh, corrupt role switching, or disable the Phase 1 onboarding gate. | Run full authentication integration tests and verify multi-tab session sync before committing. |
| **`roles.ts`**<br/>`src/lib/roles.ts` | - `AuthProvider.tsx`<br/>- `AuthGuard.tsx`<br/>- `menu.ts`<br/>- All role dashboards | **High (Platform Navigation)**.<br/>Altering role parsing, normalization, or primary role priority can route founders or creators to wrong dashboards or cause 403 authorization loops. | Verify `parseStrictUserRole`, `resolvePrimaryRole`, and all dashboard routes against unit tests. |
| **`axios.ts`**<br/>`src/lib/axios.ts` | - Every React Query query/mutation<br/>- All form submission handlers | **High (API Ingress)**.<br/>Interceptors affect every outbound HTTP request. Breaking token injection or the 401 retry queue causes widespread silent API failures. | Verify 401 refresh token queueing with simulated expired access tokens. |
| **`MongoDbContext.cs`**<br/>`backend/DbContext/MongoDbContext.cs` | - All 51 Controllers<br/>- All backend Services and Repositories | **Catastrophic (Database Layer)**.<br/>Changing collection names, casing (e.g. `applicationUsers`), or index definitions can cause silent empty query results or startup crashes. | Never alter collection name casing. Ensure all `Ensure*Indexes` methods swallow exceptions to prevent startup aborts. |
| **`CreatorIdeas` Entity**<br/>`backend/Models/DatabaseModels/CreatorIdea.cs` | - `CreatorIdeasController`<br/>- `CreatorJourneyService`<br/>- `DealsController`<br/>- AI session anchors | **High (Creator & Marketplace)**.<br/>Altering schema or optimistic concurrency version breaks Phase 2-6 incubation, Full Buyout deals, and Level Up conversions. | Test multi-idea backfill and ensure `Version` header is propagated in response context. |
| **`Companies` Entity**<br/>`backend/Models/DatabaseModels/Companies.cs` | - `CompanyController`<br/>- `CapTableCalculator`<br/>- `InvestorMatcher`<br/>- `DealsController` | **High (Entrepreneur & Funding)**.<br/>Affects traction metrics, Phase 2-10 progression, Cap Table versioning, and post-deal `AmountRaised` calculations. | Run `dotnet test` covering `CompanyServiceTests` and `EquityDealCloseCapTableTests`. |
| **`DealExecution` Entity**<br/>`backend/Models/DatabaseModels/DealExecution.cs` | - `DealsController`<br/>- `CompanyService`<br/>- Investor Portfolio<br/>- Creator Sales | **High (Commerce & Escrow)**.<br/>Mutating deal stages, term sheets, or signature schemas breaks Full Buyout, Co-Founder Equity, and Funding deals. | Validate all status mutations against `Phase9Requirements.DealStatusTransitions`. |
| **`WorkroomEngagement`**<br/>`backend/Models/DatabaseModels/Workroom.cs` | - `WorkroomController`<br/>- `WorkroomService`<br/>- `EarningsController`<br/>- Background sweep jobs | **High (Service Provider Operations)**.<br/>Affects milestone approval, deliverable submission, escrow balance release, and automated review expiration. | Ensure ACID transaction support is enabled in test environment before modifying financial routines. |

---

## 2. Cross-Subsystem Dependency Chains

```
[ Modify ApplicationUser.Roles ]
               │
               ├─► Breaks JWT Token Claims Generation (AuthController.cs)
               ├─► Breaks OnTokenValidated claim backfill
               ├─► Breaks AuthGuard.tsx role normalization
               └─► Reroutes user to default /dashboard/creator incorrectly

[ Modify Phase4CapTable Schema ]
               │
               ├─► Breaks CapTableCalculator dilution algorithms
               ├─► Breaks ESOP grant allocations
               ├─► Breaks Deal Close share issuance (CompanyService.cs)
               └─► Corrupts investor percentage marks in CompanyPortfolioHolding

[ Modify ClarifierSession Schema ]
               │
               ├─► Breaks IdeaClarifierHandler prompt hydration
               ├─► Breaks Hangfire 'ai' queue deserialization
               └─► Prevents OutputSnapshots copying into CreatorIdea
```
