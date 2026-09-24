# Mondial ECO — Canonical Source-of-Truth Matrix

This matrix establishes the definitive, canonical data authority for every major architectural concept in Mondial ECO. It distinguishes between active canonical systems, secondary caches, migration bridges, and deprecated legacy models.

---

## 1. Domain Concept Authority Matrix

| Domain Concept | Canonical Authority (Source of Truth) | Collection / Store Name | Secondary / Cache / Pointer | Status & Evolution Notes |
|---|---|---|---|---|
| **User Identity & Auth** | `ApplicationUser` entity | `applicationUsers` | JWT Bearer Token (Sub claim) | **CANONICAL**. Owned by ASP.NET Core Identity. Note case-sensitive name `applicationUsers`. |
| **User Roles** | `ApplicationUser.Roles[]` | `applicationUsers` | `User.role` (Frontend primary resolved role) | **CANONICAL**. Array of roles. Single scalar `role` is a UI presentation fallback only. |
| **Phase 1 Onboarding Gate** | `ApplicationUser.Onboarding.Phase` | `applicationUsers` | Client `user.onboardingPhase` | **CANONICAL**. Universal gate: `0` = Incomplete (bounced to `/onboarding`), `1` = Certified. |
| **Universal Identity KYC** | `UniversalIdentityVerification` | `UniversalIdentityVerifications` | `ApplicationUser.Onboarding.IdentityDocumentVerified`, `KycStatus` | **CANONICAL**. Tracks provider applicant ID, verification status, document type, and event deduplication. Ingress ledger in `IdentityWebhookDeliveryLogs`; transitions in `IdentityDecisionAuditLogs`. |
| **Creator Project Entity** | `CreatorIdea` entity | `CreatorIdeas` | `CreatorJourney.ActiveIdeaId` | **CANONICAL**. Multi-idea foundation. Replaces legacy single-idea structure. |
| **Creator Journey State** | `CreatorJourney` entity | `CreatorJourneys` | Derived in memory at read time | **CANONICAL**. Current phase is DERIVED on read via `CreatorJourneyService`, never hardcoded. Backfilled to `CreatorIdeas` on boot via `CreatorIdeaBackfillMigration`. |
| **Legacy Business Idea** | `BusinessIdeas` entity | `BusinessIdeas` | — | **LEGACY**. Original prototype idea model. Retained for API compatibility. *Note: Not migrated by `CreatorIdeaBackfillMigration` (which backfills `CreatorJourneys` -> `CreatorIdeas`).* |
| **Universal Professional Profile** | `ProfessionalProfileRecord` | `ProfessionalProfiles` | `ApplicationUser.Name`, `PublicSlug` | **CANONICAL**. Authority for public slug, headline, bio, media (avatar/cover), work experiences, education, skills, languages, industries, and rich text overview for ALL roles via `/dashboard/profile` and `/profile/[slug]`. |
| **Creator HumainX Gate & State** | `ProfessionalProfileRecord.QuickStart` | `ProfessionalProfiles` | `isBackendQuickStartComplete(profile)` & `ICreatorQuickStartService` | **CANONICAL (BACKEND-AUTHORITATIVE)**. Authoritatively stored in MongoDB `ProfessionalProfileRecord.QuickStart` (`Version`, `Step1ConfirmedAt`, `Step2ConfirmedAt`, `Step3ConfirmedAt`, `CompletedAt`). Backend is the sole authority across refresh, logout/login, storage wipe, and cross-device sessions. Client `localStorage` is legacy migration cache only; backend state always wins. |
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
| **Creator Brand Kit** | `BrandKit` | `BrandKits` | `CreatorIdea.Project.Branding` | **CANONICAL**. Full visual identity source of truth (Strategy, Direction, Logo Type, Logo Concepts, 7 Derived Variations, Colors, Typography, 3-Snapshot History). Synced to thin 4-field pointer on `Project.Branding` (`BrandingMethod`, `LogoAsset`, `PaletteName`, `TypographyPairing`). |
| **Creator Phase 3.4 Legal & Compliance** | `CreatorLegalAssessment` | `CreatorIdeas` | `CreatorPhase3Data.LegalChecklist` (historical BSON read only) | **CANONICAL**. Sole legal authority for statutory rules evaluation, compliance items, status transitions, and staleness detection (`CreatorIdea.Phase3Data.LegalAssessment`). `CreatorPhase3Data.LegalChecklist` is retained as a legacy BSON compatibility surface (0 canonical active readers, 0 new writers). `UpdateLegalChecklistItemAsync` is a compatibility command adapter only delegating to canonical `UpdateLegalAssessmentItemStatusAsync`. `POST /api/creator/ai/legal-checklist/generate` and `PATCH /api/creator/legal-checklist/item/{itemId}` are compatibility HTTP endpoints only. |
| **Creator Phase 4 Completion Authority** | `Phase4CompletionResolver` | In-memory service | `CreatorJourneyService.ComputePhaseStatusAsync` | **CANONICAL**. Sole Phase 4 completion authority. Evaluates stage-native resolution semantics across all 7 stages (4.1–4.7). Zero duplicate predicates. Phase 4.8 is not implemented; Phase 4.9 is reserved. |
| **Creator Founder Capacity Authority** | `IFounderCapacityResolver` | In-memory service | `ProfessionalProfileRecord.VentureContext` | **CANONICAL**. Sole founder-capacity authority calculating weekly availability, operational bandwidth, and channel constraints. |
| **Creator Pricing Policy Authority** | `PricingPolicyEngine` | In-memory service | `CreatorPhase4PricingService` | **CANONICAL**. Canonical pricing-policy authority governing tax mode inference (`DetermineTaxMode`), margin floors, and revenue model structures. |
| **Creator Dashboard Summary** | `ICreatorDashboardService` (`GET /api/creator/dashboard/summary`) | In-memory aggregation service | Single command center DTO (`CreatorDashboardSummaryDto`) | **CANONICAL**. Single authoritative read aggregation for `/dashboard/creator`. Assembles project identity, BrandKit projection, next action, attention items, 4-phase journey overview with active substages, verified outputs, and Phase 5 Crossroads unlock gate. 0 duplicate database collections; 0 duplicate domain business rules. |
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
   - All AI sessions (`ClarifierSessions`, `BusinessPlanSessions`, `ForecastSessions`, `BrandKits`) must carry an explicit `businessIdeaId` referencing `CreatorIdea.Id`. Any unanchored session is rejected by the multi-idea integrity guard.
4. **Deal Closure Rule**:
   - Transition to `completed` can only occur through the founder-controlled close endpoint (`AssertCanPerform(ctx.Role, DealAction.UpdateStatus)`), requiring both parties' digital signatures (`deal.Signatures.BothSigned == true`).
5. **BrandKit & Project.Branding Synchronization Rule**:
   - `BrandKit` in the `BrandKits` collection is the sole authority for full brand kit identity (Strategy, Direction, Logo Type, Logo Concepts, 7 Derived Variations, 5-role Color System, 4-role Typography System, 3-Snapshot History).
   - `CreatorIdea.Project.Branding` is a read-optimized, thin summary pointer containing strictly 4 fields: `BrandingMethod`, `LogoAsset`, `PaletteName`, and `TypographyPairing`. Whenever Logo, Colors, or Typography are updated in `BrandKit`, backend synchronously updates `CreatorIdea.Project.Branding`.
6. **BrandKit Section Sequencing, Completion & Hub Re-Edit Rule**:
   - During initial drafting (`Status = "draft"`), step advancement and PATCH operations enforce strict sequential prerequisites with genuine server-side timestamps (`Strategy.ConfirmedAt`, `Direction.SelectedAt`, `Logo.ApprovedAt`, `Colors.ConfirmedAt`, `Typography.ConfirmedAt`).
   - First-time entry from `/phase-2/branding` into Studio transparently auto-provisions a default draft BrandKit via `POST /open-studio` / `GetOrCreateBrandKitAsync` without requiring out-of-band pre-seeding.
   - Step 6 advancement strictly requires `kit.Colors.ConfirmedAt != null` (eliminating role count proxies), and transitioning to `Status = "complete"` requires `kit.Typography.ConfirmedAt != null`.
   - Confirming Typography advances the kit to `Status = "complete"` and automatically transitions the creator to the Brand Kit Hub (`/dashboard/creator/phase-2/brand-kit`), allowing arbitrary section re-editing in Studio (`/dashboard/creator/phase-2/brand-studio`) with upstream cascade warnings and automatic rollback snapshots.
   - When `Status = "complete"`, `POST /advance` with `targetStep == kit.CurrentStep` is an idempotent 200 no-op (no `Version` increment), allowing safe re-confirmations from Hub or Studio, while genuine backwards transitions (`targetStep < kit.CurrentStep`) remain blocked with 400.
   - The entry flow (`/phase-2/branding`), studio shell, hub, and summary complete screen (`/phase-2/complete`) are verified compile-clean and verified via live E2E browser walkthroughs on unseeded fresh ideas and direct MongoDB reads.
7. **Professional Profile vs. Service Provider Business Profile Separation**:
   - `ProfessionalProfiles` is the **sole canonical home** for all professional presentation data across all roles: `Headline`, `Bio`, `ProfileImage`, `CoverImage`, `ProfessionalOverview`, `Industries`, `Languages`, `LanguageProficiencies`, `Experiences`, `Education`, `Skills`, `SocialLinks`, `EditorDraft`, and `ProfileVersion`.
   - The legacy embedded professional-profile copies previously stored in `ApplicationUser.ServiceProviderProfile` have been permanently retired: unset in stored MongoDB documents (snapshot `applicationUsers_backup_sp_20260920172731`) and decorated with `[BsonIgnore]` in C#.
   - `ApplicationUser.ServiceProviderProfile` retains **exclusively** Service Provider operational and business fields: `VerificationStatus`, `ProviderTier`, `TrustScore`, `TrustBreakdown`, `ServiceCategories`, `PricingModels`, `PortfolioItems`, `MaximumConcurrentOrders`, `CurrentActiveOrders`, `NewOrderAvailability`, `FinancialSettings`, `ProviderId`, `CurrentPhase`, and timestamps.
   - All consumers (including Creator Phase 3 SP matching cards, Creator Phase 2 Designer cards, and Marketplace service listings and provider headers) read professional fields directly from `ProfessionalProfiles` / split records with clean non-empty fallbacks.
8. **Creator HumainX Backend-Authoritative Gate Rule**:
   - Creator Dashboard access (`/dashboard/creator` and subroutes) strictly requires authoritative backend Quick Start completion: `isBackendQuickStartComplete(profile) === true` (which checks `CompletedAt != null` on canonical `ProfessionalProfileRecord.QuickStart`).
   - The backend `ProfessionalProfileRecord.QuickStart` is the sole source of truth across browser refresh, logout/login, storage wipe, and different devices/browsers.
   - Server-side `Creator` role authorization is strictly enforced: `CreatorQuickStartController` rejects non-creator requests (Investors, Entrepreneurs, Service Providers) with `403 Forbidden`.
   - Step confirmations and completion use MongoDB nested atomic updates (`Builders<ProfessionalProfileRecord>.Update.Set`), preventing lost updates against concurrent autosaves.
   - Step confirmations are idempotent: `Step1ConfirmedAt ??= now`, `Step2ConfirmedAt ??= now`, `CompletedAt ??= now`. Re-confirming will never overwrite original timestamps.
   - Progression preferences are deterministically mapped to canonical `LearningPreference` and `DelegationPreference` without introducing redundant schema fields.
   - Legacy `localStorage` migration policy: Backend state always wins. If backend state is complete, legacy `localStorage` is cleaned up. If backend state is absent, user undergoes one-time backend Quick Start onboarding. Subsequent profile edits after completion never reopen the Quick Start gate.
9. **Creator Phase 3.4 Legal Authority & Compatibility Surface Rule**:
   - `CreatorLegalAssessment` on `CreatorIdea.Phase3Data.LegalAssessment` is the sole canonical Creator legal source of truth.
   - `CreatorPhase3Data.LegalChecklist` is preserved strictly as a backward-compatible BSON deserialization surface for historical documents, with 0 canonical active readers and 0 active new writers.
   - Statutory Evaluation: Deterministic 21-rule catalogue in `FranceRules.json` evaluated via `FranceLegalRulesCatalog` and `LegalApplicabilityEngine`.
   - Business Signal Certainty: Absence of evidence evaluates strictly to `SignalConfidenceLevels.Unknown`, ensuring unknown facts yield `NeedsInformation` when legal applicability requires positive confirmation. Zero frontend legal inference.
   - Planning Readiness Calculation: Single canonical calculator `LegalApplicabilityEngine.ComputePlanningReadiness` (40% Pre-registration, 40% Launch, 20% Ongoing; Critical wt = 2.0, Recommended wt = 1.0; completed = 1.0, in_progress = 0.5, ready_for_review = 0.5, needs_information = 0.0, not_applicable = excluded).
   - Step 3.7 Connection: `Legal dimension score = (PlanningReadinessPct / 100) * 15` reading directly from `LegalAssessment` with 0 legacy checklist dependencies.
   - Project Isolation: All legal endpoints require an explicit `ideaId`. Missing `ideaId` on `GET /api/creator/legal-compliance/section-12` returns HTTP 400 Bad Request. Zero ambient/first idea fallbacks.
   - Compatibility Adapters: `UpdateLegalChecklistItemAsync` is a pure compatibility command adapter delegating to canonical `UpdateLegalAssessmentItemStatusAsync`. `POST /api/creator/ai/legal-checklist/generate` and `PATCH /api/creator/legal-checklist/item/{itemId}` are compatibility HTTP endpoints only, writing directly to canonical `LegalAssessment`.
10. **Creator Phase 4 Completion Single-Authority Rule**:
   - `Phase4CompletionResolver` is the sole authority for determining Phase 4 completion.
   - Generic `Status != Draft` checks and ad-hoc flags are prohibited. All 7 stages (4.1 Construction Snapshot, 4.2 Operational Roadmap, 4.3 Needs & Requirements, 4.4 Skills & Training, 4.5 Aids, Grants & Support, 4.6 Pricing Strategy, 4.7 GTM Strategy) are resolved using domain-native criteria.
   - Phase 4.8 is not implemented; Phase 4.9 is reserved.
11. **Forecast Financial Assumptions Single-Authority & Calculation Authority Rule**:
   - `ForecastSession.Inputs` is the sole canonical source of truth for Step 3.3 financial assumptions. Authority precedence: persisted server value > current unsaved form state > scoped temporary client cache.
   - `ForecastAssumptionsForm` is the single canonical assumptions form/schema. `StartingBudgetModal.tsx` is removed; starting budget is an integrated input.
   - `FinancialForecastEngine` is the sole deterministic 36-month calculation authority. Zero client-side forecast engines; zero parallel math helpers in `ForecastHandler`.
   - All forecast endpoints require a non-empty `ideaId`. Missing or whitespace `ideaId` returns HTTP 400; foreign/unowned `ideaId` returns HTTP 404. Zero silent fallbacks to first-idea or `'active'` key.
   - Upstream assumption propagation (`MarketStudyVersion`, `BusinessModelVersion`) uses strict monotonic version guards: `incoming < stored` is rejected as stale, `incoming == stored` is an idempotent no-op, `incoming > stored` accepts the update. Founder-edited fields (`IsFounderLocked`) are permanently locked and survive all upstream version changes.
   - The latest valid completed version resolver (`hasValidCompletedForecast`) governs displayed results; failed or in-progress regenerations preserve existing valid results non-destructively.

---

## 3. Creator Phase 2–5 Clean Baseline

```text
CREATOR PHASE 2–5 CLEAN BASELINE

Phase 2 Brand authority:
BrandKit (canonical visual identity authority; CreatorIdea.Project.Branding is derived projection only)

Phase 3.3 Forecast authority:
FinancialForecastEngine (sole deterministic calculation authority)
ForecastSession.Inputs (sole financial assumptions authority)

Phase 3.4 Legal authority:
CreatorLegalAssessment (CreatorIdea.Phase3Data.LegalAssessment)

HumainX onboarding authority:
ProfessionalProfileRecord.QuickStart (sole onboarding journey authority; localStorage has no access/progression authority)

Phase 4 completion authority:
Phase4CompletionResolver (sole Phase 4 completion authority)

Founder capacity authority:
IFounderCapacityResolver (sole founder-capacity authority)

Pricing authority:
PricingPolicyEngine (canonical pricing-policy authority)


Legacy legal business logic:
0

Legacy compatibility surfaces:
Retained intentionally where needed for backward compatibility (1 BSON field, 1 command adapter, 2 HTTP endpoints)

Phase 4.8:
NOT IMPLEMENTED (Next approved stage)

Phase 4.9:
RESERVED (Construction readiness)
```
