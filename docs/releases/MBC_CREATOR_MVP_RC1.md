# Release Notes: Mondial Business Creation (MBC) — Creator MVP RC1

**Release Name:** Creator MVP Release Candidate 1 (RC1 Freeze)  
**Release Date:** 2026-09-19  
**Certification Status:** `PASS WITH MINOR DOCUMENTED LIMITATIONS` (RC1 Freeze Approved)  
**Target Audience:** Engineering, Product, QA, Operations, Compliance  

---

## 1. Scope of Release Candidate 1

The Creator MVP of Mondial Business Creation (MBC) empowers aspiring founders to navigate the complete venture initiation journey—from initial conceptual exploration to institutional investment readiness and formal corporate spinning-out.

This RC1 release encapsulates full-stack implementation across six foundational phases:
- **Phase 1:** Identity, Universal Onboarding & Role Selection (`Creator` / `Entrepreneur`)
- **Phase 2:** Project Identity, AI Idea Clarification & MBC Brand Visual Identity Studio
- **Phase 3:** Business Plan Intelligence (7-Step Masterplan: Market Study, Business Model, Financial Forecast, Legal & Compliance Intelligence, Company Formation, Executive Business Plan, Investor Readiness)
- **Phase 4:** Commercial Architecture (Pricing Models, Resource Calculator, GTM Roadmap)
- **Phase 5:** The Cross-Roads (Marketplace Path A vs. The Big Leap Path B)
- **Phase 6:** Level Up Transition & Continuation to the Entrepreneur Workspace

---

## 2. Canonical Creator Flow

The frozen, authoritative Creator user journey consists of:

```text
PHASE 1 — Universal Onboarding & KYC
Email OTP + Phone OTP → Identity Document Upload → Role Selection

PHASE 2 — Project Identity & Branding
Clarifier (/phase-2/clarifier)
→ Idea Summary (/phase-2/idea-summary)
→ Project Name (/phase-2/concept-name)
→ Branding Gateway (/phase-2/branding)
   ├─ MBC Brand Studio (/phase-2/brand-studio)
   ├─ M50 Designer (Marketplace Specialist Booking)
   └─ Skip (skipBranding() directly to completion)
→ Brand Kit (/phase-2/brand-kit) / Completion (/phase-2/complete)

PHASE 3 — Business Plan Intelligence (7-Step Masterplan)
3.1 Market Intelligence (/phase-3/market-study)
→ 3.2 Business Model (/phase-3/business-model)
→ 3.3 Financial Forecast (/phase-3/forecast)
→ 3.4 Legal & Compliance (/phase-3/compliance)
→ 3.5 Company Formation & Team (/phase-3/formation)
→ 3.6 Executive Business Plan (/phase-3/business-plan — 12 canonical sections)
→ 3.7 Investor Readiness (/phase-3/complete — 5 canonical dimensions)

PHASE 4 — Construction Architecture & Operational Roadmap
4.1 Construction Snapshot (/dashboard/creator/phase-4)
    ├─ Capability & Readiness Evaluation (Ready / Partially Ready / Missing / Critical / Optional)
    ├─ Profile Completeness Pre-flight (Skills & Venture Context Guard)
    └─ Upstream Artifact Extraction (Phase 2 Identity, Phase 3 Masterplan)
4.2 Operational Roadmap (/dashboard/creator/phase-4/roadmap)
    ├─ Multi-Phase Scheduling (Phases 0–3 Milestones & Task Sequences)
    ├─ Dependency Graph Evaluation & Critical Path Resolver
    └─ Task Status Orchestrator (NotStarted / InProgress / Completed / Blocked)
[Commercial Offer / Legacy: /dashboard/creator/offer-pricing]
    ├─ 4.1 Services & Pricing
    ├─ 4.2 Resource Calculator
    ├─ 4.3 Web & GTM Setup
    └─ 4.4 Offer Setup Complete

PHASE 5 — The Cross-Roads (30-Day Decision Window)
Path A: Marketplace (Full Buyout OR Co-Founder / Equity)
Path B: The Big Leap (Private Venture Spinout → Level Up)

PHASE 6 — Level Up (Continuation, Not Restart)
Atomic Creator → Entrepreneur Level Up
→ Entrepreneur Workspace (/dashboard/entrepreneur)
```

---

## 3. Major Implemented Capabilities

### 3.1 MBC Brand Visual Identity Studio & Asset Hub (Phase 2)
- **Calm, Generative Studio:** 7 modal steps over a 6-segment progress bar on a full-bleed canvas (Strategy $\to$ Direction $\to$ Logo Type $\to$ Logo Creation $\to$ Variations $\to$ Colour $\to$ Typography).
- **Billing Transparency:** Zero silent or auto-fire debiting on modal open. Free steps (Strategy, Logo Type, SVG Redraw, Color Mood, Typography Tuning) cost 0 credits. Billed steps dynamically query `/api/ai/credits` upfront.
- **Client-Side ZIP Packager:** Instantly packages 7 SVG lockups (`primary`, `horizontal`, `stacked`, `icon-only`, `black`, `white`, `transparent`), color and typography JSON tokens, CSS Custom Properties, and README.md.

### 3.2 Quantitative Market Intelligence & Osterwalder Canvas (Steps 3.1 & 3.2)
- **Truly Proportional Sizing Funnel:** TAM, SAM, and SOM bars rendered without deceptive minimum-width clamping floors, backed by transparent derivation audit trails.
- **9-Block Osterwalder Business Model Canvas:** Multi-column layout with value proposition focal emphasis, unit economics telemetry (ARPU, CAC, LTV, LTV:CAC ratio, Payback months), and assumptions evidence register.
- **Dynamic Sector Benchmarks:** Injects verified tailwinds and median multiples from `IMarketBenchmarkResolver`.

### 3.3 Financial Modeling & 36-Month Projections (Step 3.3)
- **Consolidated Workspace:** Interactive Live Assumptions drawer with real-time recalculations.
- **Horizon Modeling:** 12 months AI-synthesized + 24 months deterministically projected with required disclaimers.
- **TAM Auto-Seeding:** Seamlessly imports TAM from Step 3.1 while strictly preserving manual overrides on resume.

### 3.4 Statutory Legal & Compliance Intelligence (Step 3.4)
- **National Catalogue Version:** `FR-2026.1` containing 18 canonical French legal rules derived from `backend/Resources/LegalRules/FranceRules.json`.
- **System Principle:** Deterministic rules govern statutory applicability. AI explains and assists with founder drafts; AI does NOT determine statutory applicability or certify compliance.
- **Evidence Activity Trail:** Append-only activity history tracking founder notes, file uploads, and status changes.
- **Live Verification:** Verified live against MongoDB for note/evidence preservation, idempotency (0 duplicates on consecutive refresh), and cross-surface freshness consistency.

### 3.5 Executive Business Plan (Step 3.6)
- **12 Canonical Sections:** Rendered in continuous document format with a sticky navigation index. Includes **Section 12: Legal & Regulatory Framework**.
- **Universal Inline Markdown Editing:** All owned sections support real-time word counting, diff tracking, and persistent session updates.
- **Print & PDF Parity:** UI, browser print view (`@media print`), and PDF export view all share the identical 12-section document structure.

### 3.6 Institutional Investor Readiness Engine (Step 3.7)
- **Canonical Weighted Scoring (Total = 100):**
  - Concept Clarity & Differentiation: **20%**
  - Market Evidence & Opportunity Sizing: **20%**
  - Financial Projections & Unit Economics: **25%**
  - Legal & Compliance Governance: **15%**
  - Team Credibility & Founder Advantage: **20%**
- **Actionable Deduction Breakdown:** Itemizes points lost with 1-click remediation links to the specific phase screens.

### 3.7 HumainX / Professional Profile Personalization Layer
- **Leveled Skills Architecture:** Upgraded from flat string arrays to structured objects `{ name: string, level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert', source: 'SelfDeclared' | 'Assessment' | 'Verified', verification?: string }`.
- **VentureContext Modeling:** Rich founder operational context schema (`Stage`, `FundingTarget`, `AvailableHoursPerWeek`, `TargetLaunchDate`) embedded in `UniversalProfileRecord`.
- **Bidirectional Data-Loss Prevention:** Round-trip persistence in `ProfileEditorService` and frontend `ProfileView.tsx` with deep differential updating to prevent cross-contamination.
- **Migration & Database Headroom:** Idempotent migration script (`migration_skills_to_objects.mjs`) verified against MongoDB Atlas tier headroom with automated snapshot backups (`professionalProfiles_backup_skills_...`) and strict 30-day drop policies.

### 3.8 Creator Phase 4.1 — Construction Snapshot Engine (`/dashboard/creator/phase-4`)
- **Normalized ConstructionContext Adapter:** Synthesizes upstream inputs across Phase 2 (Brand Kit lockups, color/typography tokens), Phase 3 (Market study TAM/SAM/SOM, Business Model Canvas, 36-month P&L Forecast, Legal Statutory Compliance FR-2026.1, SAS/SAS-U/SARL Formation), and the HumainX Profile.
- **5-Tier Capability Taxonomy:** Algorithmic categorization into `Critical`, `Ready`, `Partially Ready`, `Missing`, and `Optional` states without misleading percentage aggregates.
- **Canonical Profile Guard (`Phase4ProfileGuard`):** Enforces founder profile readiness (skills declaration and venture context) before granting access to Phase 4 incubation tools.
- **Deterministic Refresh & Staleness Detection:** Dynamic staleness detection flags changed upstream sources (`changedSources[]`), supporting idempotent re-analysis without state clobbering.

### 3.9 Creator Phase 4.2 — Operational Roadmap Engine (`/dashboard/creator/phase-4/roadmap`)
- **Deterministic Action Scheduler (`RoadmapScheduler`):** Transforms the Construction Snapshot into a realistic, sequenced action plan partitioned across 4 distinct milestone phases:
  - *Phase 0: Foundations* (Clarification, Brand Kit, Core Specs)
  - *Phase 1: Legal & Compliance* (Statuts constitutifs, RNE registration, IP filings, RGPD)
  - *Phase 2: Brand & Product Spec* (Design system tokens, MVP architecture, Technical validation)
  - *Phase 3: Commercial Launch* (Go-to-market channels, Tiered pricing, Launch telemetry)
- **Dependency & Critical Path Resolution:** Predecessor/successor task linkages identify parallelizable tracks and calculate cumulative schedule estimates.
- **Interactive Lifecycle Mutations:** Founder updates task execution state via `PATCH /api/creator/phase4/roadmap/tasks/{taskId}/status` (`NotStarted` $\to$ `InProgress` $\to$ `Completed` or `Blocked`).

### 3.10 Next.js Client Navigation & Phase Guard Decoupling
- **Suspense Boundary Enclosure:** Resolved Next.js 16 / React 19 client router bailouts by wrapping all `useSearchParams()` consumers in `<Suspense>` on `/dashboard/creator/phase-4` and `/dashboard/creator/phase-4/roadmap`.
- **Decoupled Phase 4 Router Guard:** Removed blanket Phase 4 redirection in `CreatorPhaseGuard.tsx`, handing gating authority directly to `Phase4ProfileGuard.tsx` to eliminate 404/redirect loops.

---

## 4. Creator → Entrepreneur Continuity Contract

Promotion to Entrepreneur is a **continuation, not a restart**:
1. **Zero Physical Document Duplication:** Documents are referenced directly into the Entrepreneur Data Room as private/draft assets without duplicating files on disk.
2. **Preserved Invariants:** Project identity, Brand Kit assets, Market Study, Business Model, 36-month Financial Forecast, Legal Assessment baseline, attached Evidence links, complete 12-section Business Plan, and Investor Readiness baseline all carry through atomically.
3. **Legal Source of Truth Isolation:** The Creator legal assessment is frozen as an immutable historical baseline; `Companies.LegalAssessment` becomes the active, mutable Entrepreneur operational state via deep copy.
4. **Marketplace Behavior:** Full Buyout listings are automatically paused; Co-founder / Equity offerings remain active.

---

## 5. Security & Isolation Architecture

- **Two-Real-User Cross-Tenant Live JWT Test:** Verified with two distinct authenticated accounts (`User A` and `User B`) using genuine HMAC-SHA256 signed JWTs. All 7 unauthorized direct object reference (IDOR) attempts against User A's Journey, Documents, Legal Evidence, Forecast session, Business Plan session, Company, and Data Room documents returned **HTTP 403 Forbidden** (0 HTTP 200 data leaks).
- **Two-Tier Directory Traversal Defense:**
  - *Tier 1 (Perimeter Router):* ASP.NET Core URL router and reverse proxy normalize `../` and `..\` in path parameters, returning HTTP 404 Not Found.
  - *Tier 2 (Canonical-Root Filesystem Guard):* `CreatorIdeaDocumentsController` and `CompanyService` enforce `Path.GetFullPath` canonical root checks against the uploads root, throwing `UnauthorizedAccessException` (HTTP 403) against any relative, absolute, or escaping paths.

---

## 6. Certified Test Results Accounting

```text
Backend Test Suite (xUnit.net net8.0)
Total Discovered:       2,137
Passed:                 2,008  (+32 Phase 4 & HumainX unit tests)
Failed:                     0
Skipped:                  129  (Pre-existing legacy non-Creator marketplace/escrow tests)
Environment Blocked:        0
Mathematical Status:    100% Reconciled (2,008 + 0 + 129 = 2,137)

Frontend Test Suite (Vitest & TypeScript)
Vitest Test Files:        122 / 122 Passed (100%)
Vitest Tests:           1,050 / 1,050 Passed (100%)
TypeScript:                 0 production errors in src/
Production Build:         183 / 183 Next.js routes compiled (Turbopack)

Responsive Viewport Audit
Tested Viewports:       375px, 768px, 1440px, 1920px (Authenticated Creator sessions)
Horizontal Overflow:    0px document-level overflow across all routes
```

---

## 7. Known Product Limitations

1. **France Formation Recommendations MVP Scope:**  
   Current recommendations are strictly limited to `SAS`, `SAS-U`, and `SARL`. The recommendation engine does not yet represent every possible French business structure (e.g. EURL, Micro-entreprise / Auto-entrepreneur, Entreprise Individuelle).
2. **Legacy Non-Creator Lint Warnings:**  
   35 pre-existing lint issues exist exclusively in unmaintained legacy marketplace/escrow modules outside the Creator domain.
3. **Legacy Non-Creator Skipped Tests:**  
   129 skipped tests reside in legacy marketplace transaction fixtures.

---

## 8. Creator MVP Core Freeze Policy

Following RC1 approval, the codebase is in **Code & Feature Freeze**:

### Allowed Changes:
- Critical bug fixes (crashes, unhandled exceptions, data loss)
- Security patches (authorization, isolation, injection defenses)
- Regulatory/legal rule updates (statutory revisions to FR-2026.1)
- Production UX defects (visual alignment breaks, typography token drift)
- Deployment and environment configuration adjustments

### Prohibited Without Post-RC1 Planning:
- New Creator architecture or schema changes
- New Creator phases (Stage 13 / Phase 7)
- New major features or capabilities
- Flow redesigns or navigation restructuring
- New funding or banking modules

---

## 9. Next Operational Steps

The immediate operational sequence following RC1 freeze is:
```text
1. RC1 Code Freeze (Completed)
2. Staging Deployment & Smoke Testing
3. Production Configuration & Secrets Audit
4. Controlled Small Real-User Pilot
5. Founder Feedback & Real-World Telemetry Analysis
```
*(Stage 13 feature development will only commence following the pilot evaluation).*

---

## 10. Database Migration Backups & Collection Headroom Ledger

MongoDB Atlas cluster enforces a strict tier cap of **500 collections** (which previously blocked integration test suites during RC1). All migration snapshot collections must be recorded here with explicit drop eligibility dates to prevent phantom collections from consuming namespace headroom.

| Backup Collection Name | Document Count | Created At | Purpose / Associated Migration | Safe Drop Date | Drop Command |
|---|---|---|---|---|---|
| `applicationUsers_backup_sp_20260920172731` | 421 | 2026-09-20 | Pre-migration snapshot before unsetting legacy embedded professional-profile fields from `ApplicationUser.ServiceProviderProfile`. | **2026-10-20** (30 days post-cutover) | `db.applicationUsers_backup_sp_20260920172731.drop()` |
| `professionalProfiles_backup_skills_20260920175233` | 18 | 2026-09-20 | Pre-migration snapshot before migrating `Skills` and `EditorDraft.Skills` to leveled objects in `ProfessionalProfiles`. | **2026-10-20** (30 days post-cutover) | `db.professionalProfiles_backup_skills_20260920175233.drop()` |



