# Mondial ECO — Comprehensive API Map & Endpoint Inventory

The Mondial ECO backend exposes 579 API endpoints managed across 51 controllers. Every endpoint follows standard REST conventions and returns a standardized response envelope (`ApiResponse<T>` or `ApiResponse`).

---

## 1. API Domain Overview

| Domain Module | Primary Controllers | Total Endpoints | Primary Role / Access Gate |
|---|---|---|---|
| **Authentication & Onboarding** | `AuthController`, `OnboardingController` | 28 | Anonymous / Authenticated User |
| **Universal Profile & Verification** | `ProfileController`, `VarificationController`, `PrivacyController` | 19 | Authenticated User |
| **Creator Incubation & Phases 2–6** | `Creator*Controller`, `CreatorIdeas*`, `CreatorJourney*`, `BusinessIdea*` | 68 | Creator Role |
| **Entrepreneur & Company Building** | `CompanyController` (Phases 2–10) | 105 | Entrepreneur / Founder Role |
| **Investor Discovery & Diligence** | `Investor*Controller`, `InvestorDiligence*`, `InvestorPhase*` | 35 | Investor Role |
| **Service Provider Platform** | `ServiceProvider*`, `ServiceCatalog*`, `Leads*`, `Workroom*`, `Earnings*` | 100 | Service Provider / Client |
| **Marketplace (Projects & Services)**| `MarketplaceController`, `MarketplaceProjectsController` | 16 | Public Browse / Private Buyer |
| **Deals, Buyouts & Cap Tables** | `DealsController`, `TransactionController` | 83 | Creator, Founder, Investor |
| **Messaging & Notifications** | `ChatController`, `NotificationController` | 10 | Authenticated User |
| **AI Intelligence & Sessions** | `AiController`, `Clarifier*`, `BusinessPlan*`, `Forecast*`, `IdeaGenerator*`| 22 | Authenticated User (Creator focus) |
| **Admin & Governance** | `Admin*Controllers`, `BackgroundJob*`, `Platform*`, `Analytics*` | 93 | Admin / SuperAdmin Role |
| **TOTAL** | **51 Controllers** | **579** | — |

---

## 2. API Domain Breakdown & Detailed Endpoints

### A. Authentication, Onboarding & Identity
- **`AuthController`** (`/api/auth`):
  - `POST /api/auth/register`: Canonical user registration issuing 8-hour access token and establishing authenticated session.
  - `POST /api/auth/login`: Issue JWT access token (HMAC-SHA256, 8-hour expiry). Rate limited to 5 req/min per IP.
  - `GET /api/auth/me`: Universal session validator, returns user ID, canonical roles, and onboarding phase.
  - `POST /api/auth/refresh-token`: Exchange valid bearer token for a refreshed session token.
  - `POST /api/auth/logout`: Server-side notification of logout; client wipes localStorage.
  - `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`: Token-based credential recovery.
  - `GET /api/auth/confirm-email`, `POST /api/auth/resend-confirmation-email`: Email verification.
  - `GET /api/auth/roles`: Returns all valid roles in the platform ecosystem.
- **`OnboardingController`** (`/api/onboarding`):
  - `GET /api/onboarding/status`: Hub status read returning completion state for Email, Phone, Identity, and supplementary documents.
  - `POST /api/onboarding/send-email-otp`: Send 6-digit email OTP (HMAC-SHA256 hashed, 10-minute expiry).
  - `POST /api/onboarding/verify-email-otp`: Verify 6-digit email code and update `Onboarding.EmailOtpVerified = true`.
  - `POST /api/onboarding/send-otp`: Send 6-digit SMS OTP via Twilio (HMAC-SHA256 hashed, 60-second expiry).
  - `POST /api/onboarding/verify-otp`: Verify 6-digit SMS code and update `Onboarding.PhoneVerified = true`.
  - `POST /api/onboarding/documents/{type}`: Upload supplementary documents (`residence`, `income`, `tax`, `license`).
  - `POST /api/onboarding/complete`: Finalize Universal Phase, updating `ApplicationUser.Onboarding.Phase = 1`.
- **`IdentityController`** (`/api/identity`):
  - `GET /api/identity/config`: Returns supported identity document types for a country (e.g., `national_id`, `passport`, `residence_permit` for France).
  - `POST /api/identity/session`: Start or resume Sumsub WebSDK KYC session and mint 15-minute access token.
  - `GET /api/identity/status`: Query authoritative verification status (`Pending`, `Verified`, `Rejected`).
  - `POST /api/identity/retry`: Archive rejected attempt and initialize a fresh verification attempt.
  - `POST /api/identity/webhook/sumsub`: Canonical HMAC-SHA256 signed webhook receiver for Sumsub review results.

### B. Creator System & Phases 2–6 (68 Endpoints)
- **`CreatorIdeasController` & `CreatorJourneyController`** (`/api/creator/ideas`, `/api/creator/journey`):
  - `GET /api/creator/ideas`: List all created ideas owned by the authenticated Creator.
  - `POST /api/creator/ideas`: Create a new multi-idea entry with active journey anchoring.
  - `GET /api/creator/ideas/{id}`: Detailed idea entity including output snapshots.
  - `GET /api/creator/journey`: Derived-status engine returning active phase completion state.
- **`CreatorPhase2Controller`** (`/api/creator/phase-2`):
  - `GET /api/creator/phase-2/concept-name`: Query generated concept names.
  - `POST /api/creator/phase-2/branding`: Save color palette, typography, and visual tone.
  - `POST /api/creator/phase-2/logo`: Upload and attach brand logo asset.
  - `GET /api/creator/phase-2/hire-designer`: Find matched Service Providers for design work.
- **`CreatorBrandKitController`** (`/api/creator/journey/phase2/brand-kit`):
  - `GET /api/creator/journey/phase2/brand-kit`: Retrieve complete BrandKit entity (`BrandKitRecord`) for the active or queried idea (returns 200 with null data if no kit exists).
  - `POST /api/creator/journey/phase2/brand-kit`: Idempotently create or retrieve initial BrandKit entity (seeding Strategy from Project, 5-role default Colors, 4-role default Typography) via shared `GetOrCreateBrandKitAsync`.
  - `POST /api/creator/journey/phase2/brand-kit/open-studio`: Idempotently retrieve/auto-provision initial BrandKit on first-time entry via shared `GetOrCreateBrandKitAsync`, or reset all section regenerate counters (3/3 caps) to 0 when re-entering Studio from Hub.
  - `PATCH /api/creator/journey/phase2/brand-kit/strategy`: Partially update Strategy section (`PersonalityTraits`, `PositioningStatement`, `TargetAudience`, `BrandValues`, `VisualPreferences`) with optimistic concurrency validation.
  - `PATCH /api/creator/journey/phase2/brand-kit/direction`: Partially update Direction section (`SelectedDirection`, `Directions`) with optimistic concurrency validation.
  - `PATCH /api/creator/journey/phase2/brand-kit/logo`: Partially update Logo section (`SelectedConcept`, `Concepts`, `Variations`), syncing `LogoAsset` to `CreatorIdea.Project.Branding`.
  - `PATCH /api/creator/journey/phase2/brand-kit/colors`: Partially update Colors section (5 canonical roles: `Primary`, `Secondary`, `Accent`, `Background`, `Text`), syncing `PaletteName` to `CreatorIdea.Project.Branding`.
  - `PATCH /api/creator/journey/phase2/brand-kit/typography`: Partially update Typography section (4 canonical roles: `Logo type`, `Heading`, `Body`, `Button & label`), syncing `TypographyPairing` to `CreatorIdea.Project.Branding`.
  - `POST /api/creator/journey/phase2/brand-kit/direction/generate`: AI generation of 4 strategic brand directions (7 credits, max 3 cap).
  - `POST /api/creator/journey/phase2/brand-kit/logo/generate-concepts`: AI generation of 6 logo concepts across 6 mark families (4 credits).
  - `POST /api/creator/journey/phase2/brand-kit/logo/regenerate-concept/{conceptKey}`: AI regeneration of a single logo concept (2 credits, max 3 cap).
  - `POST /api/creator/journey/phase2/brand-kit/logo/derive-variations`: Deterministic rendering of 7 canonical variations from selected concept (0 credits).
  - `POST /api/creator/journey/phase2/brand-kit/colors/generate`: Deterministic initial derivation of 5-role colour palette from logo/direction (0 credits).
  - `POST /api/creator/journey/phase2/brand-kit/colors/regenerate`: AI generative colour palette regeneration with contrast validation (2 credits, max 3 cap).
  - `POST /api/creator/journey/phase2/brand-kit/typography/generate`: Deterministic initial derivation of 4-role typography system from logo/direction (0 credits).
  - `POST /api/creator/journey/phase2/brand-kit/typography/regenerate`: AI generative typography system regeneration with distinctness enforcement (2 credits, max 3 cap).
  - `POST /api/creator/journey/phase2/brand-kit/snapshot`: Create concurrency-guarded backup snapshot (bounded to 3 newest).
  - `POST /api/creator/journey/phase2/brand-kit/snapshot/restore`: Restore historical snapshot by index with automatic pre-restore backup.
- **`BusinessPlanController`** (`/api/ai/business-plan`):
  - `POST /api/ai/business-plan`: Start AI business plan generation (C-3, requires clarifier session).
  - `GET /api/ai/business-plan/{sessionId}`: Read a single business plan session with version content.
  - `GET /api/ai/business-plan`: List all business plan sessions for the authenticated user.
  - `POST /api/ai/business-plan/{sessionId}/regenerate`: Regenerate business plan (new version, append-only).
  - `POST /api/ai/business-plan/rewrite-section`: AI single-section rewrite (splice via `BusinessPlanSections`).
  - `PATCH /api/ai/business-plan/{sessionId}/section`: Manual per-section text edit (shared splice path).
  - `PUT /api/ai/business-plan/{sessionId}`: Full content update on the current version.
- **`ForecastController`** (`/api/ai/forecast`):
  - `POST /api/ai/forecast`: Start AI forecast generation (C-4, requires completed business plan).
  - `GET /api/ai/forecast/{sessionId}`: Read a single forecast session with version content.
  - `GET /api/ai/forecast`: List all forecast sessions for the authenticated user.
  - `POST /api/ai/forecast/{sessionId}/regenerate`: Regenerate forecast (new version, append-only).
  - `PUT /api/ai/forecast/{sessionId}`: Full content update on the current version.
- **`CreatorPhase3Controller`** (`/api/creator`):
  - `POST /api/creator/ai/legal-checklist/generate`: Generate deterministic sector-specific legal checklist (3.3).
  - `PATCH /api/creator/legal-checklist/item/{itemId}`: Toggle checklist item completion status.
  - `POST /api/creator/ai/formation-generator/start`: Generate formation recommendation (3.4).
  - `PATCH /api/creator/formation/select-type`: Select legal entity type (SAS/SAS-U/SARL).
  - `PATCH /api/creator/formation/skills`: Update skill-gap / team assessment.
  - `GET /api/creator/sp-matches`: Service Provider skill-gap matches.
  - `POST /api/creator/workroom/open`: Open a workroom with a matched SP.
  - `POST /api/creator/journey/phase3/session`: Link AI session IDs to the journey.
  - `PATCH /api/creator/masterplan/complete`: Trigger Phase 3 completion gate.
- **`CreatorPhase4Controller`** (`/api/creator/phase-4`):
  - `GET /api/creator/phase-4/offer-pricing`: Calculate recommended asset valuation using market benchmarks.
- **`CreatorPhase5Controller`** (`/api/creator/phase-5`):
  - `POST /api/creator/phase-5/crossroads`: Submit decision path (`FULL_BUYOUT`, `EQUITY_PARTNERSHIP`, `BUILD_YOURSELF`).
- **`CreatorPhase6Controller`** (`/api/creator/phase-6`):
  - `POST /api/creator/phase-6/level-up`: Transition idea into an Entrepreneur profile and initialize Company record.

### C. Entrepreneur & Company Building System (105 Endpoints)
- **`CompanyController`** (`/api/company`):
  - `GET /api/company/my-company`: Get company entity owned by the calling founder.
  - `POST /api/company`: Register new legal company entity.
  - `PUT /api/company/{id}/phase`: Advance entrepreneur phase (Phases 1 through 10).
  - `GET /api/company/{id}/traction`: Read traction metrics (ARR, MRR, user growth).
  - `POST /api/company/{id}/traction`: Record monthly financial and operational traction.
  - `GET /api/company/{id}/cap-table`: Retrieve latest version of shareholder Cap Table (`Phase4CapTable`).
  - `POST /api/company/{id}/cap-table/grant`: Create new ESOP grant or advisor equity.
  - `GET /api/company/{id}/valuation`: Execute algorithmic valuation (`ValuationEngine`).
  - `POST /api/company/{id}/data-room/document`: Upload diligence document to data room.
  - `GET /api/company/{id}/investor-matches`: Read algorithmic matches from `InvestorMatcher`.

### D. Investor Operations & Diligence (35 Endpoints)
- **`InvestorController` & `InvestorPhaseController`** (`/api/investor`):
  - `GET /api/investor/profile`: Investor thesis, check size, and preferred sectors.
  - `POST /api/investor/profile`: Save and update investment parameters.
  - `GET /api/investor/matches`: Incoming company opportunities sorted by compatibility score.
  - `GET /api/investor/pipeline`: Active deals grouped by deal pipeline stage.
  - `GET /api/investor/portfolio`: Confirmed investment holdings (`CompanyPortfolioHolding`).
- **`InvestorDiligenceController`** (`/api/investor/diligence`):
  - `POST /api/investor/diligence/{companyId}/nda`: Accept digital NDA for data room access.
  - `GET /api/investor/diligence/{companyId}/dataroom`: Read diligence documents after NDA verification.
  - `POST /api/investor/diligence/{companyId}/question`: Submit diligence inquiry to founder.

### E. Service Provider Platform (100 Endpoints)
- **`ServiceProviderController`** (`/api/serviceprovider`):
  - `POST /api/serviceprovider/verification`: Submit professional credentials and identity proof.
  - `GET /api/serviceprovider/profile`: Read split profile (`ServiceProviderProfileRecord`).
- **`ServiceCatalogController`** (`/api/services`):
  - `GET /api/services`: Public catalog search with category, tier, and price filters.
  - `POST /api/services`: Create new service listing with tiered packages (Basic, Standard, Premium).
- **`LeadsController`** (`/api/leads`):
  - `POST /api/leads/briefs`: Client posts request for proposal.
  - `POST /api/leads/proposals`: Provider submits custom offer to client brief.
- **`WorkroomController`** (`/api/workroom`):
  - `GET /api/workroom/{id}`: Workroom engagement state machine, milestones, and contracts.
  - `POST /api/workroom/{id}/milestones/{milestoneId}/deliver`: Submit work for review.
  - `POST /api/workroom/{id}/milestones/{milestoneId}/accept`: Client approves deliverable (releases escrow).
  - `POST /api/workroom/{id}/upload`: Upload project assets with provider-private access flag.
- **`EarningsController`** (`/api/serviceprovider/earnings`):
  - `GET /api/serviceprovider/earnings/summary`: Total earned, in-escrow balance, and available payouts.
  - `POST /api/serviceprovider/earnings/payout`: Request withdrawal to connected account.

### F. Deals, Negotiations & Buyouts (83 Endpoints)
- **`DealsController`** (`/api/deals`):
  - `POST /api/deals/buyout/initiate`: Entrepreneur submits Full Buyout offer on Creator idea.
  - `POST /api/deals/equity/initiate`: Initiate Co-founder equity negotiation.
  - `POST /api/deals/{id}/revision`: Submit term sheet counter-offer (swapping `CurrentTurn`).
  - `POST /api/deals/{id}/accept-terms`: Counterparty accepts live term sheet revision.
  - `POST /api/deals/{id}/sign`: Sign agreement (tracks bilateral `CreatorSigned` / `InvestorSigned`).
  - `POST /api/deals/{id}/close`: Founder closes deal upon payment confirmation.
  - `POST /api/deals/{id}/handover`: Final asset handover from Creator to Entrepreneur.
  - `POST /api/deals/{id}/build-company`: Automatically initialize a new Company from acquired IP.

### G. AI Subsystem & Brand Studio (36 Endpoints)
- **`AiController`** (`/api/ai`):
  - `GET /api/ai/usage`: Query consumed AI credits and historical model invocations.
  - `GET /api/ai/credits`: Authoritative balance, lifetime stats, and capability cost table.
- **`ClarifierController`** (`/api/ai/clarifier`):
  - `POST /api/ai/clarifier/start`: Enqueue asynchronous Idea Clarifier job on Hangfire `ai` queue.
  - `GET /api/ai/clarifier/{sessionId}`: Read session status and structured clarity dimensions.
- **`BusinessPlanController`** (`/api/ai/business-plan`):
  - `POST /api/ai/business-plan/start`: Enqueue multi-section business plan generation.
  - `GET /api/ai/business-plan/{sessionId}`: Read generated executive summary, market analysis, and GTM.
- **`ForecastController`** (`/api/ai/forecast`):
  - `POST /api/ai/forecast/start`: Enqueue financial projection generation.
  - `GET /api/ai/forecast/{sessionId}`: Read generated 36-month P&L model and break-even milestones.
- **`CreatorBrandKitController`** (`/api/creator/journey/phase2/brand-kit`):
  - `GET /api/creator/journey/phase2/brand-kit`: Retrieve owner-scoped BrandKit by `ideaId`.
  - `POST /api/creator/journey/phase2/brand-kit`: Idempotent kit initialization from `CreatorIdea.Project`.
  - `PATCH /api/creator/journey/phase2/brand-kit/strategy`: Update brand personality traits and avoid list.
  - `POST /api/creator/journey/phase2/brand-kit/direction/generate`: Generative 4-candidate visual direction generation (7 credits).
  - `PATCH /api/creator/journey/phase2/brand-kit/direction`: Select active visual direction and persist Adjust strip settings.
  - `POST /api/creator/journey/phase2/brand-kit/logo/generate-concepts`: Batch generate 6 logo concepts filtered by LogoType (4 credits).
  - `POST /api/creator/journey/phase2/brand-kit/logo/regenerate-concept/{conceptKey}`: Regenerate single concept (2 credits, 3-cap).
  - `POST /api/creator/journey/phase2/brand-kit/logo/derive-variations`: Free deterministic derivation of 7 canonical variations.
  - `PATCH /api/creator/journey/phase2/brand-kit/logo`: Set selected concept, logoType, refinement settings, or approve logo.
  - `POST /api/creator/journey/phase2/brand-kit/colors/generate`: Free deterministic initial color palette derivation.
  - `POST /api/creator/journey/phase2/brand-kit/colors/regenerate`: Generative whole-palette regeneration (2 credits, 3-cap).
  - `PATCH /api/creator/journey/phase2/brand-kit/colors`: Update Colors section (5 canonical roles: `Primary`, `Secondary`, `Accent`, `Background`, `Text`), writing `Colors.ConfirmedAt` on confirmation and syncing `PaletteName` to `CreatorIdea.Project.Branding`.
  - `POST /api/creator/journey/phase2/brand-kit/typography/generate`: Free deterministic initial typography pairing derivation.
  - `POST /api/creator/journey/phase2/brand-kit/typography/regenerate`: Generative pairing regeneration (2 credits, 3-cap, preserves locked roles & immutable Logo type).
  - `PATCH /api/creator/journey/phase2/brand-kit/typography`: Update Typography section (4 canonical roles: `Logo type`, `Heading`, `Body`, `Button & label`), writing `Typography.ConfirmedAt` on confirmation and syncing `TypographyPairing` to `CreatorIdea.Project.Branding` (server-side rejects modification to "Logo type").
  - `POST /api/creator/journey/phase2/brand-kit/advance`: Enforce sequential step prerequisites (`Step 6` requires `kit.Colors.ConfirmedAt != null`), mark `complete` on Step 6 when `kit.Typography.ConfirmedAt != null`, and sync `Project.Branding`. When `targetStep == kit.CurrentStep` on an already-`complete` kit, operates as an idempotent 200 no-op without incrementing `Version`; genuine backwards attempts (`targetStep < kit.CurrentStep`) return 400.
  - `POST /api/creator/journey/phase2/brand-kit/snapshot`: Create concurrency-guarded backup snapshot (bounded to 3).
  - `POST /api/creator/journey/phase2/brand-kit/snapshot/restore`: Concurrency-guarded snapshot restoration with automatic pre-restore backup.
  - `POST /api/creator/journey/phase2/brand-kit/open-studio`: Idempotently retrieve/auto-provision initial BrandKit on first-time entry via shared `GetOrCreateBrandKitAsync`, or reset regenerate counters (3/3 caps) when Creator re-enters Studio from Hub.


### H. Platform Administration & Governance (93 Endpoints)
- **`AdminController` & Sub-Controllers** (`/api/admin/*`):
  - `GET /api/admin/users`: Search, view, and assign roles to platform accounts.
  - `POST /api/admin/verifications/{id}/approve`: Approve KYC or Service Provider Tier certification.
  - `GET /api/admin/marketplace`: Review pending project listings and service packages.
  - `GET /api/admin/audit`: Query tamper-evident `AdminAuditLogs`.
  - `GET /api/admin/system/queues`: Monitor Hangfire queue depth and failed job states.
