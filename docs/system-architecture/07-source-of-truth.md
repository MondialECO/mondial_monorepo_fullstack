# Mondial ECO — Canonical Source-of-Truth Matrix

This matrix establishes the definitive, canonical data authority for every major architectural concept in Mondial ECO. It distinguishes between active canonical systems, secondary caches, migration bridges, and deprecated legacy models.

---

## 1. Domain Concept Authority Matrix

| Domain Concept | Canonical Authority (Source of Truth) | Collection / Store Name | Secondary / Cache / Pointer | Status & Evolution Notes |
|---|---|---|---|---|
| **User Identity & Auth** | `ApplicationUser` entity | `applicationUsers` | JWT Bearer Token (Sub claim) | **CANONICAL**. Owned by ASP.NET Core Identity. Note case-sensitive name `applicationUsers`. |
| **User Roles** | `ApplicationUser.Roles[]` | `applicationUsers` | `User.role` (Frontend primary resolved role) | **CANONICAL**. Array of roles. Single scalar `role` is a UI presentation fallback only. |
| **Phase 1 Onboarding** | `ApplicationUser.Onboarding.Phase` | `applicationUsers` | Client `user.onboardingPhase` | **CANONICAL**. Universal gate: `0` = Incomplete (bounced to `/onboarding`), `1` = Certified. |
| **Creator Project Entity** | `CreatorIdea` entity | `CreatorIdeas` | `CreatorJourney.ActiveIdeaId` | **CANONICAL**. Multi-idea foundation. Replaces legacy single-idea structure. |
| **Creator Journey State** | `CreatorJourney` entity | `CreatorJourneys` | Derived in memory at read time | **CANONICAL**. Current phase is DERIVED on read via `CreatorJourneyService`, never hardcoded. Backfilled to `CreatorIdeas` on boot via `CreatorIdeaBackfillMigration`. |
| **Legacy Business Idea** | `BusinessIdeas` entity | `BusinessIdeas` | — | **LEGACY**. Original prototype idea model. Retained for API compatibility. *Note: Not migrated by `CreatorIdeaBackfillMigration` (which backfills `CreatorJourneys` -> `CreatorIdeas`).* |
| **Universal Professional Profile** | `ProfessionalProfileRecord` | `ProfessionalProfiles` | `ApplicationUser.Name`, `PublicSlug` | **CANONICAL**. Authority for public slug, headline, bio, media (avatar/cover), work experiences, education, skills, languages, industries, and rich text overview for ALL roles via `/dashboard/profile` and `/profile/[slug]`. |
| **Service Provider Domain Profile**| `ServiceProviderProfileRecord` | `ServiceProviderProfiles` | `ApplicationUser.Tier_level` (legacy fallback) | **CANONICAL**. Server-controlled authority for Service Provider Tier ladder (Tiers 1–4), verification status, trust score breakdown, order capacity, and pricing models. |
| **Investor Domain Profile** | `Investor` entity | `Investors` | `ApplicationUser.InvestorProfile` (legacy onboarding) | **CANONICAL**. Authority for investor thesis statement, preferred stages, geographies, ticket sizes, and portfolio connections. |
| **Company / Venture Profile** | `Companies` entity | `Companies` | `ApplicationUser.EntrepreneurProfile` (legacy) | **CANONICAL**. Holds legal entity details, traction, data room items, and venture phases (2–10). |
| **Public Marketplace Project** | `CreatorIdea` (`Status=live/available`) | `CreatorIdeas` | `MarketplaceProjectDto` (Projection DTO) | **CANONICAL**. Public listings are read directly from `CreatorIdeas.Phase5Data.PathA.MarketplaceListing`. `MarketplaceProjects` is a projection DTO and API route, NOT a separate MongoDB collection. |
| **Marketplace Access & NDAs** | `MarketplaceProjectAccessGrant` | `MarketplaceProjectAccessGrants` | `MarketplaceProjectAccessLogs` | **CANONICAL**. Enforces entrepreneur access levels (Teaser, Full, NDA-gated) to published Creator ideas. |
| **Cap Table & ESOP** | `Phase4CapTable` (Latest Version) | `Phase4CapTables` | `Companies.EquityStructure` | **CANONICAL**. Versioned immutable ledger. `Companies.EquityStructure` is initial seed only. |
| **Vesting Schedules** | `Phase4VestingSchedule` | `Phase4VestingSchedules` | Embedded on Cap Table | **CANONICAL**. Unique composite index `{CompanyId, GrantId}` enforces upsert integrity. |
| **Deal Transaction Authority** | `DealExecution` entity | `DealExecutions` | `DealsController` (Route alias) | **CANONICAL**. Master transaction engine for `FULL_BUYOUT`, `EQUITY_PARTNERSHIP`, and `INVESTMENT_ROUND`. Manages term sheets, revisions, bilateral signatures, and deal closing. There is no `DealContracts` collection. |
| **Workroom Contracts** | `Contract` entity | `Contracts` | `WorkroomEngagement.ContractId` | **CANONICAL**. Bilateral engagement contract governing Service Provider workroom milestones. Unique index on `EngagementId`. |
| **Investor Pipeline State** | `DealExecution.Status` + `InvestorMatch` | `DealExecutions`, `InvestorMatches` | Kanban UI State | **CANONICAL**. Strict state machine defined in `Phase9Requirements.cs`. |
| **Investor Portfolio** | `CompanyPortfolioHolding` | `CompanyPortfolioHoldings` | Aggregated portfolio summaries | **CANONICAL**. Created automatically by `CreateCompanyPortfolioHoldingsForDealAsync` upon deal completion. |
| **Service Catalog** | `ServiceListing` + `ServicePackage` | `ServiceListings`, `ServicePackages` | Redis Cache (Optional) | **CANONICAL**. Module 2 source of truth. |
| **Leads & Briefs** | `ClientBrief` + `Proposal` | `ClientBriefs`, `Proposals` | `ClientBriefInteraction` | **CANONICAL**. Module 3 source of truth. Handled with soft-expiry by Hangfire minutely sweep. |
| **Workroom & Escrow** | `WorkroomEngagement` + `Contract` | `WorkroomEngagements`, `Contracts` | `FinancialTransactions` | **CANONICAL (STATE ONLY)**. Domain state machine governs milestone transitions and escrow funds release. Gateway settlement uses `StubPaymentGatewayService` and requires a production payment adapter. |
| **AI Clarifier Session** | `ClarifierSession` | `ClarifierSessions` | `CreatorIdeas.ClarifierData` | **CANONICAL**. C-2 AI session source of truth. |
| **AI Business Plan** | `BusinessPlanSession` | `BusinessPlanSessions` | `CreatorIdeas.BusinessPlan` | **CANONICAL**. C-3 AI session source of truth. |
| **AI Forecast Model** | `ForecastSession` | `ForecastSessions` | `CreatorIdeas.FinancialForecast`| **CANONICAL**. C-4 AI session source of truth. |
| **Realtime Chat** | `ChatMessage` + `Conversation` | `ChatMessages`, `Conversations` | Redis SignalR Backplane | **CANONICAL**. Stored in MongoDB; distributed in real time via Redis SignalR. |
| **Notifications** | `Notification` entity | `Notifications` | Browser Web Push Service Worker | **CANONICAL**. Stored in MongoDB; dispatched via `NotificationHub`. |

---

## 2. Source-of-Truth Integrity Rules

1. **Never Trust Client-Sent Role**:
   - The frontend `user.role` is a presentation helper indicating the active landing view.
   - The backend authoritative gate is the claims principal populated directly from `applicationUsers.Roles[]` during JWT validation.
2. **Cap Table Dilution Rule**:
   - The Cap Table is never mutated by ad-hoc field edits. A new version (`Version + 1`) is appended to `Phase4CapTables` alongside matching entries in `Phase4OwnershipHistories` and `Phase4ShareIssuances`.
3. **Multi-Idea Creator Anchor**:
   - All AI sessions (`ClarifierSessions`, `BusinessPlanSessions`, `ForecastSessions`) must carry an explicit `businessIdeaId` referencing `CreatorIdea.Id`. Any unanchored session is rejected by the multi-idea integrity guard.
4. **Deal Closure Rule**:
   - Transition to `completed` can only occur through the founder-controlled close endpoint (`AssertCanPerform(ctx.Role, DealAction.UpdateStatus)`), requiring both parties' digital signatures (`deal.Signatures.BothSigned == true`).
