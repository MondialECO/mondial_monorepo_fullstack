# Investor Build Plan — FINAL Blueprint

**Date:** 2026-06-11 · **Status:** PLAN ONLY (no code written) · **Scope:** Phase 3 Investment Thesis · Phase 4 Public Profile · Phase 6 Opportunity Detail · Phase 8 Term Sheet Builder
**Inputs:** Investor SVGs, Investor Backend Field Map, Investor Implementation Preparation Audit.

Conventions observed and followed: routes `src/app/dashboard/investor/<route>/page.tsx` + colocated `_components/`; shared investor UI in `src/components/investor/`; query hooks in `src/hooks/queries/`; typed axios wrappers in `src/lib/api-*.ts`; types in `src/types/investor/`; theme tokens only (no hex); Server Components by default, `"use client"` only at interactive leaves; React Compiler ON (no defensive memo).

---

## 0. Baseline & targets (4-phase scope)

| Phase | Parity now | Parity after build | Gain |
|------|-----------|--------------------|------|
| 3 Investment Thesis | 5% | ~88% | **+83** |
| 4 Public Profile | 5% | ~82% | **+77** |
| 6 Opportunity Detail | 75% | ~92% | **+17** |
| 8 Term Sheet Builder | 28% | ~85% | **+57** |
| **Scope average** | **~28%** | **~87%** | — |

---

## 1. Exact files to CREATE

### Phase 3 — Investment Thesis (route `…/investor/thesis`)
- `src/app/dashboard/investor/thesis/page.tsx` — wizard host (client; loads profile, owns step state)
- `src/app/dashboard/investor/thesis/_components/ThesisWizard.tsx` — stepper shell + nav
- `src/app/dashboard/investor/thesis/_components/StepReturnExpectations.tsx` — Step 1 (target multiple, check-size range)
- `src/app/dashboard/investor/thesis/_components/StepFollowOnRights.tsx` — Step 2 (follow-on policy, pro-rata toggle, board participation)
- `src/app/dashboard/investor/thesis/_components/StepSectorsGeography.tsx` — Step 3 (sectors, geographies, stage, thesis statement)
- `src/app/dashboard/investor/thesis/_components/ThesisCompletionCard.tsx` — completion + profile score
- `src/app/dashboard/investor/thesis/_components/ThesisWizardSkeleton.tsx`
- `src/lib/api-investor-profile.ts` — `getInvestorProfile`, `updateInvestorProfile` wrappers
- `src/hooks/queries/investor-profile.ts` — `useInvestorProfile`, `useUpdateInvestorProfile`
- `src/types/investor/profile.ts` — `InvestorProfile`, `InvestorThesisInput`, `InvestorProfileInput`

### Phase 4 — Public Profile (routes `…/investor/profile`, `…/investor/profile/edit`)
- `src/app/dashboard/investor/profile/page.tsx` — public profile view
- `src/app/dashboard/investor/profile/_components/ProfileHeaderBanner.tsx` — cover + avatar + name + verified badge
- `src/app/dashboard/investor/profile/_components/ProfileAboutCard.tsx`
- `src/app/dashboard/investor/profile/_components/InvestmentPreferencesCard.tsx`
- `src/app/dashboard/investor/profile/_components/NotableInvestmentsCard.tsx`
- `src/app/dashboard/investor/profile/_components/ProfileContactLinks.tsx`
- `src/app/dashboard/investor/profile/_components/PublicProfileSkeleton.tsx`
- `src/app/dashboard/investor/profile/edit/page.tsx` — edit form host
- `src/app/dashboard/investor/profile/edit/_components/BasicInformationSection.tsx`
- `src/app/dashboard/investor/profile/edit/_components/ContactLinksSection.tsx`
- `src/app/dashboard/investor/profile/edit/_components/InvestorProfileSection.tsx`
- *(reuses Phase-3 `api-investor-profile.ts` + `investor-profile.ts` hooks — no new API files)*

### Phase 6 — Opportunity Detail (finishers; mostly chart primitives)
- `src/components/investor/OwnershipDonut.tsx` — reusable donut (cap-table ownership + Phase-8 equity)
- *(Traction chart deferred — see §3 backend gap; no file now)*

### Phase 8 — Term Sheet Builder (rebuild the existing route)
- `src/app/dashboard/investor/discovery/[companyId]/term-sheet/_components/TermSheetBuilder.tsx` — 3-step host bound to the real deal
- `…/term-sheet/_components/StepCoreTerms.tsx` — amount, pre/post, equity, share class, price/share, equity donut
- `…/term-sheet/_components/StepInvestorRights.tsx` — pro-rata, info rights, anti-dilution, ROFR/co-sale, vesting, board, liq-pref
- `…/term-sheet/_components/StepReviewSend.tsx` — closing timeline (governing law/jurisdiction), validation, send/sign
- `…/term-sheet/_components/TermSheetLivePreview.tsx` — live document preview
- `…/term-sheet/_components/ShareClassSelector.tsx`
- `…/term-sheet/_components/ClosingTimelineSection.tsx`
- `src/lib/term-sheet-export.ts` — client-side PDF export (Copy + Export PDF)

---

## 2. Exact files to MODIFY

- `src/lib/menu.ts` — add investor nav: **Investment Thesis** (`/dashboard/investor/thesis`), **Public Profile** (`/dashboard/investor/profile`); optional **Portfolio** later.
- `src/types/investor/dashboard.ts` — replace `InvestorProfile`/`InvestorSettings = Record<string,unknown>` stubs with typed shapes (or re-export from new `profile.ts`).
- `src/lib/api-investor-dashboard.ts` — keep `getInvestorProfile`/`getInvestorSettings`; point typed callers at the new types.
- `src/app/dashboard/investor/discovery/[companyId]/_components/CapTableTabPanel.tsx` — add `OwnershipDonut` above the existing table.
- `src/components/investor/NDAAcceptModal.tsx` — fix key-term copy ("24 months" → "3 years"), add "See full AI analysis" link + eIDAS/template footer (static).
- `src/app/dashboard/investor/discovery/[companyId]/_components/TractionTabPanel.tsx` — relabel tiles honestly as "readiness signals" until real traction KPIs land (avoid presenting them as the design's traction metrics).
- `src/app/dashboard/investor/discovery/[companyId]/term-sheet/page.tsx` — swap read-only assembly for `TermSheetBuilder`; read the real deal (`getDeal`) instead of deriving from `OpportunityDetail`.
- `src/components/investor/MatchScoreDonut.tsx` — optional: generalize so `OwnershipDonut`/equity donut share one primitive.

---

## 3. Exact backend changes required

**B-1 (critical) — New self-write endpoint.** `InvestorPhaseController` (`api/investor`): `PUT /api/investor/profile` `[Authorize(Roles="Investor")]`. Resolves the caller's linked `Investor` via `user.InvestorProfile.InvestorId`; 403 if unlinked; updates the thesis + profile fields; bumps `UpdatedAt`. *(Unblocks all Phase 3 + Phase 4 saves; `PUT /api/investors/{id}` stays Admin-only.)*

**B-2 — Expand `GET /api/investor/profile` projection.** Add the existing-but-dropped fields: `RequiresProRataRights`, `RequiresBoardSeat`, `PreferredEquityTypes`, `SuccessfulExits`, `CompletedDeals`, `ActiveInvestments`, `AverageCheckSize`, plus the new fields in B-3.

**B-3 — New `Investor` fields** (model `Investor.cs`): `TargetReturnMultiple` (string range e.g. "5-10x"), `FollowOnPolicy` (string), `ThesisStatement` (string), `PreferredRole` (string), `BoardParticipationLevel` (string, optional), `Headline` (string), `CoverImageUrl` (string), `SocialLinks` (Dictionary<string,string>), `IsPublic` (bool, default false).

**B-4 — New `TermSheet` fields** (embedded in `DealExecution.cs`): `GoverningLaw` (string), `Jurisdiction` (string), optional typed `Rofr`/`CoSale` (bool) — otherwise carried in `InvestorRights[]`.

**B-5 — Extend `OfferTermsRequest`** (`OfferDtos.cs`) to accept `GoverningLaw`, `Jurisdiction`, `ProposedClosingDate` (already on `TermSheet`, not yet on the request), and share-class label so the builder can persist them through `…/term-sheet/{companyId}/create` and `…/offer/counter`.

**Deferred (NOT in Sprint-1; later phases):** traction KPIs + narrative on `OpportunityDetailResponse` (owner-gating policy decision), server-driven NDA key-terms + real e-sign, server PDF, full `EquityType` enum expansion (ripples into `Phase9Requirements` whitelists).

---

## 4. Exact API endpoints

**New (1):** `PUT /api/investor/profile` (B-1).
**Reused as-is:**
- `GET /api/investor/profile`, `GET /api/investor/settings` (P3/P4 reads)
- `GET /api/companies/opportunities/{id}` (+ `/documents`), `POST /api/companies/{id}/dataroom/nda/accept` (P6)
- `POST /api/investor/term-sheet/{companyId}/create`, `GET /api/companies/deals/{dealId}`, `POST /api/companies/deals/{dealId}/offer/counter|accept|reject|viewed`, `POST /api/companies/deals/{dealId}/term-sheet/sign`, `POST /api/companies/deals/{dealId}/close` (P8)

**Deferred:** `GET /api/investor/directory` (public-profile browse), traction read on opportunity detail, PDF/e-sign services.

---

## 5. Exact Mongo changes

All changes are **additive and non-destructive** (Mongo is schemaless; existing documents read new fields as null/default — no migration script required).
- **`investors` collection:** add B-3 fields (`TargetReturnMultiple`, `FollowOnPolicy`, `ThesisStatement`, `PreferredRole`, `BoardParticipationLevel`, `Headline`, `CoverImageUrl`, `SocialLinks`, `IsPublic`).
- **`dealExecutions` collection → embedded `TermSheet`:** add B-4 fields (`GoverningLaw`, `Jurisdiction`, optional `Rofr`/`CoSale`).
- **Indexes:** none required for Sprint-1. (Optional later: index `investors.IsPublic` + `investors.LinkedUserId` once a public directory ships.)
- **No collection renames, no field removals, no backfill.** A one-time optional backfill could set `IsPublic=false` explicitly, but the default handles it.

---

## 6. Exact reusable components

- **Charts:** `MatchScoreDonut` (→ generalize to power `OwnershipDonut` + Phase-8 equity donut).
- **Primitives:** `KPITile`, `ScoreBreakdownPanel`, `NDALockedPanel`, `LoadingState`/`ErrorState`/`EmptyState`, `ImageWithFallback` (avatar/cover), shadcn `Form`+zod/`Input`/`Select`/`Label`/`Card`/`Badge`/`Tabs`/`Separator`/`Button`.
- **Phase 8 specifically:** `OfferComposerDialog` + `OfferTermsCard` (every economic field already modeled), `TermSheetHeader`, `DealTimeline`, `ActivityFeed`, `MakeOfferButton`, `SignTermSheetDialog`.
- **API/data:** existing `getInvestorProfile`/`getInvestorSettings` wrappers; `api-deals.ts` (`getDeal`, `createInvestorOffer`, `counterOffer`, `signTermSheet`); `term-sheet-derivation.ts` **stage** logic (keep) — discard its fake-terms helpers (see §10).
- **Pattern:** entrepreneur multi-step form pattern (`usePhase2Step1Form` family) as the Phase-3 wizard template.

---

## 7. Exact implementation order

**Step 0 — Foundations (½–1 day).** Backend B-1 (`PUT /api/investor/profile`) + B-2 (projection) + B-3/B-4 fields; add `menu.ts` nav; create `api-investor-profile.ts`, `investor-profile.ts` hooks, `types/investor/profile.ts`. *(Unblocks 3, 4, and 8 persistence.)*

**Step 1 — Phase 6 finishers (frontend only).** `OwnershipDonut` → into `CapTableTabPanel`; NDA copy + AI-analysis link; Traction relabel. *Highest parity-per-hour.*

**Step 2 — Phase 4 Public Profile.** View + edit on existing reads + B-1 write.

**Step 3 — Phase 3 Investment Thesis.** Wizard on existing/new fields + B-1 write + completion score.

**Step 4 — Phase 8 Term Sheet Builder.** Rebuild route as 3-step builder bound to the real `DealExecution`, reusing offer logic; persist via create/counter (B-5); live preview; PDF export.

---

## 8. Estimated parity gain per phase
- Phase 6: **+17** (75 → ~92)
- Phase 4: **+77** (5 → ~82)
- Phase 3: **+83** (5 → ~88)
- Phase 8: **+57** (28 → ~85)

## 9. Estimated completion % after each step (4-phase scope average)
- Baseline: **~28%**
- After Step 1 (P6): **~33%**
- After Step 2 (P4): **~52%**
- After Step 3 (P3): **~73%**
- After Step 4 (P8): **~87%**

*(Residual to 100% is backend-deferred: P3 domains-interest + live computed score, P4 activity feed, P6 real traction KPIs, P8 server PDF + real e-sign + full share-class enum.)*

---

## 10. What to delete / remove

- **Delete** `src/app/dashboard/investor/phase-5/page.tsx` and `src/app/dashboard/investor/phase-5/client.tsx` (orphan legacy deal-list stub; not in nav; duplicates Discovery).
- **Delete** `src/app/dashboard/investor/discovery/[companyId]/term-sheet/_components/ReadOnlyActionsRow.tsx` (dead — all actions disabled).
- **Remove the fake-data bindings** in `InvestmentSummaryGrid.tsx` and `DealTermsSection.tsx` (they render the company ask as the investor "Offer Amount" and round-derived placeholder terms). Repurpose their layout inside `TermSheetLivePreview` bound to the **real** deal; do not keep the derived versions.
- **Delete the fake-terms helpers** in `src/lib/term-sheet-derivation.ts` (`instrumentForRound`, `investorRightsForRound`, `governanceForRound`, `KEY_CONDITIONS`) once the builder reads real `TermSheet` data; **keep** the stage-derivation logic (`deriveDealStage`, `STAGE_LABEL`).
- **Deprecate** the legacy `GET /api/investor/deals` endpoint after `phase-5` deletion (its only consumer), or mark it internal.

---

*Final blueprint. No code written, no implementation performed.*
