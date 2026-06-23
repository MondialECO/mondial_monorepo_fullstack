# Investor Role — Design ↔ Implementation Reconciliation Audit

**Date:** 2026-06-11   **Mode:** READ-ONLY (no code changed, no implementation, no Figma pulled)
**Visual source of truth:** attached SVGs `phase 2`–`phase 9` (8 frames, rasterized and read screen-by-screen)
**Code audited:** `src/app/dashboard/investor/**`, `src/components/investor/**`, `src/components/deals/**`, investor API client (`src/lib/api-investor-*.ts`, `src/hooks/queries/investor*`, `src/types/investor/**`), backend `InvestorController`, `InvestorPhaseController`, `Investor`/`InvestorMatch`/`DealExecution` Mongo models, `InvestorService`.

---

## 0. Phase model & a naming warning (read this first)

The SVG filenames (`phase 2`…`phase 9`) describe a **redesigned, explicitly-phased investor journey**. The codebase does **not** implement the investor flow as numbered phases — the project's own `UNIVERSAL_PHASE_AND_ROLE_PHASE_AUDIT.md` (2026-06-08) states the investor flow is *"NOT a numbered-phase journey… a free-roam discovery→deal flow."* So the SVGs are an **aspirational redesign**, and most of the design maps to surfaces the app does not yet have.

**Critical naming collision:** the code routes `investor/phase-1` and `investor/phase-5` do **not** correspond to SVG "phase 2/5".
- `investor/phase-1/page.tsx` = the universal KYC gateway (`<UniversalPhase1/>`), role-agnostic. Not an investor design.
- `investor/phase-5/page.tsx` = a **legacy raw-axios deal-discovery stub** ("Phase 5: Deal Discovery"), unrelated to the SVG "phase 5" (which is a social feed).

**Derived phase map (SVG → meaning → code surface):**

| SVG | Phase meaning | Code surface today |
|----|----|----|
| *(none)* | Phase 1 — Universal KYC onboarding (role-agnostic) | `/onboarding/*` + `phase-1` gateway — implemented, identity/face stubbed |
| phase 2 | Investor Accreditation / Verification wizard | **none** |
| phase 3 | Investment Thesis builder (+ completion) | **none** |
| phase 4 | Public Profile (view + edit) | **none** |
| phase 5 | Social Feed / Community | **none** (code `phase-5` is an unrelated stub) |
| phase 6 | Opportunity Detail + NDA flow | `discovery/[companyId]` (+ NDA modal) — **strong** |
| phase 7 | Data Room (in-app reader) | `discovery/[companyId]/dataroom` — **partial** |
| phase 8 | Term Sheet Builder | `discovery/[companyId]/term-sheet` (read-only) + `deals/OfferComposerDialog` — **partial** |
| phase 9 | Pipeline + Portfolio | `pipeline` — **partial** |

A second mismatch runs through **every** phase: the design's left sidebar is `Overview · Investment Thesis · Public View · Edit Profile · Feed / See All · Deal Discovery · Portfolio`. The app's actual sidebar (`src/lib/menu.ts`) is `Investments · Discovery · Pipeline · Deals · Messages`. Four of the design's seven nav destinations have no route at all.

---

## 1. Per-phase reconciliation

### Phase 2 — Investor Accreditation / Verification — **FAIL** — parity ~5%
**Design (4 screens):** (1) "Confirm your investor status" — investor type (Angel / Professional / Institutional / HNW / Fund Manager), eligibility checklist, "why we verify", regulatory framework; (2) "Upload financial proof" — bank/portfolio statement + LP/fund-formation upload, accepted-docs, security & privacy; (3) "Documents Under Review" — status, submitted docs, what-happens-next (Submitted → Compliance → Bridge review), email-notify toggle; (4) hand-off into Thesis.

- **Current implementation:** none. No route, page, component, save flow or advance flow. Generic doc upload exists only inside universal onboarding (income/tax).
- **Missing from UI:** all 4 screens — investor-type selector, eligibility checklist, financial-proof uploader, compliance-review status screen, email-notify toggle.
- **Unnecessary UI:** n/a (nothing built).
- **Backend blockers:** `Investor.Type` exists, but there is **no accreditation status / review-workflow** model (no submitted-doc set, no compliance/bridge review state machine, no accreditation result field). Universal onboarding covers generic KYC docs only.
- **Frontend-only tasks:** none meaningfully (needs backend state first).
- **Visual parity:** ~5% (generic-onboarding overlap only).

### Phase 3 — Investment Thesis builder — **FAIL** — parity ~5%
**Design (4 steps + completion):** Return Expectations (target multiple "5–10x"); Follow-on Policy / Pro-rata Right / Board Participation; Preferred Sectors + Geographic Focus + Thesis Statement + Preferred Stage; Completion screen with a computed "Strong investor profile / 88" score and profile summary.

- **Current implementation:** none (no thesis route/page/components, no save/advance).
- **Missing from UI:** all 4 steps + completion; the profile-score widget.
- **Unnecessary UI:** n/a.
- **Backend blockers:** **partial.** `Investor` already has `PreferredSectors`, `PreferredStages`, `MinCheckSize`/`MaxCheckSize`, `PreferredGeographies`, `RequiresProRataRights`, `RequiresBoardSeat`, `PreferredEquityTypes`, `ProfileScore`; read via `GET /api/investor/profile`, writable via `PUT /api/investors/{id}`. **Missing fields:** return multiple, follow-on policy, free-text thesis statement, preferred role / value-add.
- **Frontend-only tasks:** ~70% of the thesis form can be built **today** against existing fields; only the 4 missing fields need a small model addition.
- **Visual parity:** ~5%.

### Phase 4 — Public Profile (view + edit) — **FAIL** — parity ~5%
**Design (2 screens):** public profile view (cover photo, avatar, thesis-fit score, KPI row, About, Investment Preferences, Notable Investments, Activity/Recent Posts) and an edit form (Basic Information, Contact & Links, Investor Profile).

- **Current implementation:** none.
- **Missing from UI:** both screens entirely.
- **Backend blockers:** **partial.** `Investor` has `Bio`, `Website`, `LogoUrl`, `SuccessfulExits`, `AverageCheckSize`, `CompletedDeals`, `ActiveInvestments`, `PrimaryContact/Email/Phone`; `GET /api/investor/profile` exists. **Missing:** cover image, social links, public-visibility flag, and the activity/posts feed (depends on Phase 5).
- **Frontend-only tasks:** the static profile view + edit form (excluding the posts feed) are buildable today against existing fields.
- **Visual parity:** ~5%.

### Phase 5 — Social Feed / Community — **FAIL** — parity ~2%
**Design (~8 screens):** a social feed (posts, media, likes/comments, profile, post detail) — "Feed / See All".

- **Current implementation:** none. The `investor/phase-5` route is an unrelated legacy deal-list stub.
- **Missing from UI:** the entire feed subsystem.
- **Backend blockers:** **total.** There is **no Post / Feed / Social model or controller anywhere** (only `Ai/AiFeedback.cs`). This is the single largest backend gap in the role.
- **Frontend-only tasks:** none until a posts/feed API exists.
- **Visual parity:** ~2%.

### Phase 6 — Opportunity Detail + NDA — **PASS (functional) / PARTIAL (visual)** — parity ~75%
**Design:** detail page with tabs Overview / Traction / Cap Table / Team / Documents; "Excellent Match 88%" score breakdown (Sector / Stage / Geography / Team); NDA-Required card; KPI strip; NDA-locked empty states; 2-step NDA accept modal (Preview → Signature) with Key Terms, full document preview, "See full AI analysis", eIDAS footer.

- **Current implementation:** `discovery/[companyId]/page.tsx` + `_components/` (OpportunityHeader, OpportunityKPIStrip, MatchScoreCard, OverviewTabPanel, TractionTabPanel, CapTableTabPanel, TeamTabPanel, DocumentsTabPanel, DetailSkeleton). Match breakdown (`ScoreBreakdownPanel`) = Sector/Stage/Geography/Team — matches design. `NDARequiredCard` + `NDAAcceptModal` (review → confirm → success). NDA-locked badges on Cap Table/Team/Documents. **Plus** a discovery FEED list (`discovery/page.tsx` + FeedHeader, FilterChipBar, OpportunityCardListItem, EmptyFeedState) that has **no SVG** to reconcile against.
  - **Save/advance flow:** NDA acceptance (`acceptNda` → `POST /companies/{id}/dataroom/nda/accept`) unlocks gated tabs.
- **Missing from UI:** real **charts** — design shows a "Transaction Volume Growth" bar chart (Traction) and an "Ownership Structure" donut (Cap Table); the implemented panels render KPI tiles + a lucide icon, not charts (`recharts@3.8.1` is installed but unused here). NDA modal lacks the "See full AI analysis" link and the eIDAS/template footer.
- **Unnecessary UI / drift:** NDA key-terms text says **"Confidentiality — 24 months"**, design says **"3 years from signing"** (copy mismatch).
- **Backend blockers:** none material. Feed/detail/score/cap-table/team/docs all served by `/companies/opportunities*`. `POST /api/investor/nda/create` is a **DocuSign placeholder** (returns a demo link); NDA *accept* is real.
- **Frontend-only tasks:** swap chart placeholders for real recharts bar/donut; add AI-analysis link + eIDAS footer to NDA modal; fix the 24mo→3yr copy.
- **Visual parity:** ~75%.

### Phase 7 — Data Room — **PARTIAL** — parity ~45%
**Design:** in-app **watermarked document reader** (page-by-page preview, "2 / 18" pager, diagonal name/IP watermark), categorized doc tree (Pitch Materials / Financial / Legal / Technical with review ticks), security banner + live session timer ("00:13:40 Session active"), Session Analytics (this-doc / total / pages-viewed / docs-opened + diligence %), Documents-reviewed list, **Next Steps** (Create Term Sheet / Request a Meeting / Add to Pipeline), **AI Analysis** bullet panel, **Private Notes** input.

- **Current implementation:** `discovery/[companyId]/dataroom/page.tsx` + DataRoomHeader, DocumentsSection (categorized list + per-file **download**), SessionActivityCard (analytics), DiligenceProgressCard, NDALockedScreen.
- **Missing from UI:** the **in-app document viewer** (no page-by-page preview, no pager, no watermark overlay/banner, no session countdown timer); the **AI Analysis** panel; the **Private Notes** input; the **Next Steps** action card (Create Term Sheet / Request Meeting / Add to Pipeline). Documents are download-only.
- **Unnecessary UI:** none.
- **Backend blockers:** session / diligence / document-list / download endpoints exist. **Blockers:** no AI-analysis endpoint, no private-notes endpoint; seeded documents carry an **empty `StoragePath`**, so the real download path 400s on the dev seed; no DocuSign / watermark-rendering service.
- **Frontend-only tasks (immediate):** the "Next Steps" actions can be wired to **existing** routes/endpoints today (term-sheet route, messages, pipeline). A client-side PDF viewer with CSS watermark overlay + a session timer is frontend-only against existing session data.
- **Visual parity:** ~45%.

### Phase 8 — Term Sheet Builder — **PARTIAL** — parity ~30% (route) / data ~70% present
**Design:** a 3-step builder (Core Terms → Investor Rights → Review & Send) with a **live document preview that updates as you type**; share-class cards (Preferred Seed / Common / SAFE / Conv. Note) + per-share price + existing-shares-outstanding → auto-calculated new-shares + equity donut ("88%"); Closing Timeline (due-diligence period, closing date, **Governing Law**, **Jurisdiction**); full Investor Rights (pro-rata, info rights, anti-dilution, ROFR/co-sale, founder vesting); Auto-Saved, Export PDF, Copy, "All terms valid — ready to send".

- **Current implementation:** the term-sheet **route** (`discovery/[companyId]/term-sheet/page.tsx`) is a **read-only preview** — TermSheetHeader, InvestmentSummaryGrid, DealTermsSection, DealTimeline, ActivityFeed, and a `ReadOnlyActionsRow` whose Download / Message Founder / Edit Terms buttons are **all disabled** ("Investor-side editing arrives in a later release"). The **actual offer creation** lives in `deals/OfferComposerDialog` — a **single-step** form (raise, pre/post-money, investor equity %, equity type [preferred/safe/note], liquidation pref, anti-dilution, board seats, pro-rata) → `POST /api/investor/term-sheet/{companyId}/create`. The full negotiate/counter/sign/close flow exists in `deals/*` (OfferActionsRow, RevisionTimeline, SignaturePanel, SignTermSheetDialog, CloseDealDialog).
- **Missing from UI:** the multi-step builder, the live preview, share-class cards + price-per-share + new-shares + equity donut, the Closing Timeline (governing law / jurisdiction), Export PDF; the read-only route's actions are disabled.
- **Unnecessary UI:** the read-only term-sheet route partially duplicates the `deals` offer/preview surfaces.
- **Backend blockers:** **mostly supported.** `DealExecution.TermSheet` already has TotalRaise, Pre/Post-money, EquityType, InvestorEquityPercent, ProRataRights, LiquidationPreference, BoardSeats, AntiDilutionProtection, VestingYears/CliffMonths, InvestorRights, ProposedClosingDate, Status; create + revision + dual-signature endpoints exist. **Missing fields:** Governing Law, Jurisdiction, Share-class name, Price-per-share, Existing-shares-outstanding (last two derivable), due-diligence-period label.
- **Frontend-only tasks:** a multi-step builder + live preview can be built against the existing create endpoint and TermSheet model; PDF export is frontend-feasible. Governing law / jurisdiction need a small model addition.
- **Visual parity:** ~30% on the route; underlying data coverage ~70%.

### Phase 9 — Pipeline + Portfolio — **PARTIAL** — parity ~40%
**Design:** KPI strip (Active Deals / Capital Committed vs target / Avg Match / Portfolio MOIC); filter chips (All / Hot / Awaiting me / Awaiting founder / Climate / FinTech); Kanban (New Matches / In Review / NDA Signed / Data Room / Negotiation, with "drag deals here" placeholders); an expanded deal card (offer/equity/pre-money + activity timeline + Message founder / View term sheet / Edit terms); **AI Next-Best-Action** card ("Use this draft"); **Portfolio Snapshot** (holdings list with multiples, sector-allocation donut, performance cards Total Invested / Current Value +unrealized / DPI, IRR); a bottom portfolio strip.

- **Current implementation:** `pipeline/page.tsx` + PipelineHeader, KPIStrip (active deals, capital committed, avg match, MOIC), KanbanBoard (columns **New Matches / In Review / NDA Signed / Data Room / Negotiation** — matches design), ExpandedDealCard, PipelineSkeleton.
- **Missing from UI:** filter chips; drag-and-drop (the board is static — no dnd library wired); the **AI Next-Best-Action** card; the **entire Portfolio Snapshot** (holdings, sector donut, performance, IRR/DPI) and the portfolio strip.
- **Unnecessary UI:** none; but note `MOIC` is rendered from a **demo placeholder (1.44)**.
- **Backend blockers:** pipeline + summary endpoints exist. **Portfolio analytics are not backed by data:** `BuildPortfolioAsync` projects only invested amount / equity / status / date; `GET /api/investor/stats` explicitly notes *"no realized valuation/exit data yet… 0% ROI."* So **MOIC, IRR, DPI, current valuation, per-holding multiples, sector allocation do not exist** server-side. No AI-nudge endpoint.
- **Frontend-only tasks:** filter chips; drag-and-drop with optimistic UI; expanded-card wiring. Portfolio Snapshot is blocked on backend analytics.
- **Visual parity:** ~40%.

---

## 2. Deliverables

### 2.1 Investor phase inventory (status board)

| Phase | Surface | Status | Visual parity |
|------|---------|--------|--------------|
| 2 Accreditation | none | **FAIL** | ~5% |
| 3 Investment Thesis | none | **FAIL** | ~5% |
| 4 Public Profile | none | **FAIL** | ~5% |
| 5 Feed / Social | none | **FAIL** | ~2% |
| 6 Opportunity Detail + NDA | `discovery/[companyId]` | **PASS / partial visual** | ~75% |
| 7 Data Room | `…/dataroom` | **PARTIAL** | ~45% |
| 8 Term Sheet Builder | `…/term-sheet` + `deals/*` | **PARTIAL** | ~30% |
| 9 Pipeline + Portfolio | `pipeline` | **PARTIAL** | ~40% |

### 2.2 Missing screens inventory
1. Accreditation: investor-type select, eligibility checklist, financial-proof uploader, "Documents Under Review" status (Phase 2 ×4).
2. Investment Thesis: return-expectations, follow-on/pro-rata/board, sectors/geo/thesis-statement/stage, completion + profile-score (Phase 3 ×5).
3. Public Profile **view** and Public Profile **edit** (Phase 4 ×2).
4. Social Feed + post detail + profile-feed (Phase 5, multiple).
5. Data Room **in-app document viewer** (watermark, pager, session timer), **AI Analysis** panel, **Private Notes**, **Next Steps** card (Phase 7).
6. Term Sheet **multi-step builder** + **live preview** + share-class/price/new-shares/equity-donut + closing-timeline + Export PDF (Phase 8).
7. Pipeline **filter chips**, **AI Next-Best-Action** card, **Portfolio Snapshot** (holdings / sector donut / performance / IRR / DPI) + portfolio strip (Phase 9).
8. Real charts in Opportunity Detail Traction (bar) & Cap Table (donut) (Phase 6).

### 2.3 Orphan routes
- `investor/phase-5` — **orphan stub** (legacy raw-axios deal list; not in nav; duplicates Discovery). **Recommend delete.**
- `investor/phase-1` — KYC gateway, reached only via `AuthGuard` redirect (acceptable; not a true orphan).
- `investor/deals` — in nav and functional (the real offer/negotiation engine), but has **no SVG**; it is the de-facto home of Phase 8 creation. Reconcile with the term-sheet route rather than leaving two surfaces.

### 2.4 Duplicate / overlapping screens
- **Deal discovery ×2:** `investor/phase-5` stub vs the real `investor/discovery` feed.
- **Term sheet ×2:** read-only `…/term-sheet` route vs `deals/OfferComposerDialog` + `OfferTermsCard` (the working creation/preview).
- **Deal status ×2:** `deals/NegotiationWorkspace` (inbox/negotiation) overlaps the `pipeline` Kanban (both render deal stage/status from `DealExecution`).

### 2.5 Backend blockers (data that cannot be rendered as designed)
1. **Social/Feed subsystem — none** (no Post/Feed/Comment/Like model or controller). Blocks Phase 5 entirely and the Phase 4 activity feed.
2. **Portfolio analytics — none.** No MOIC / IRR / DPI / current valuation / per-holding multiple / sector allocation (explicit MVP gap). Blocks the Phase 9 Portfolio Snapshot and the KPI strip's real MOIC.
3. **AI Analysis / AI Next-Best-Action — none.** No endpoint behind the Data Room AI panel (Phase 7) or the Pipeline nudge (Phase 9).
4. **Accreditation review workflow — none.** No investor accreditation status / submitted-doc set / compliance-review state (Phase 2).
5. **Thesis extra fields — missing** on `Investor`: return multiple, follow-on policy, thesis statement, preferred role/value-add (Phase 3).
6. **Profile social fields — missing:** cover image, social links, public-visibility flag (Phase 4).
7. **Term sheet fields — missing** on `TermSheet`: Governing Law, Jurisdiction, share-class name, price-per-share, existing-shares-outstanding, DD-period label (Phase 8).
8. **NDA — placeholder.** `nda/create` returns a demo DocuSign link; no real e-sign; key-terms data not server-driven (Phase 6/7).
9. **Data Room documents — empty `StoragePath` in seed**, so real downloads/viewer 400 against dev data; no notes/watermark service (Phase 7).

### 2.6 Frontend-only tasks (buildable now, no backend change)
- Phase 6: replace Traction/Cap-Table icon placeholders with **recharts** bar/donut (lib already installed); add NDA-modal AI-analysis link + eIDAS footer; fix "24 months" → "3 years" copy.
- Phase 7: wire **Next Steps** actions to existing term-sheet/messages/pipeline routes; build a client-side PDF viewer with CSS watermark overlay + session timer from existing session data.
- Phase 8: multi-step **builder + live preview + Export PDF** against the existing create endpoint and `TermSheet` model (all economic fields except governing-law/jurisdiction already exist).
- Phase 9: **filter chips**, drag-and-drop with optimistic UI, expanded-card action wiring.
- Phase 3: ~70% of the **Thesis form** (sectors/stages/check-size/geo/pro-rata/board/equity-types) against existing `Investor` fields + `PUT /api/investors/{id}`.
- Phase 4: **Public Profile view + edit** (excluding posts feed) against existing `Investor` profile fields.
- Cross-cutting: extend the investor **sidebar** (`menu.ts`) toward the design IA (Overview / Thesis / Public View / Edit Profile / Portfolio).

### 2.7 Recommended implementation order
1. **Sidebar/IA alignment** (`menu.ts`) — unblocks discoverability of everything below. *(FE)*
2. **Phase 6 polish to PASS-visual** — real charts, NDA-modal copy/links. Cheapest parity gain. *(FE)*
3. **Phase 8 Term Sheet Builder** — high product value, backend largely ready; add governing-law/jurisdiction fields, then build the wizard + live preview + PDF. *(FE + small BE)*
4. **Phase 3 Investment Thesis** — build the form on existing fields; add 4 missing fields. Feeds match-score quality everywhere. *(FE + small BE)*
5. **Phase 4 Public Profile** (view + edit, minus feed). *(FE + small BE)*
6. **Phase 7 Data Room viewer** — PDF viewer + watermark + Next Steps wiring; fix seed `StoragePath`. *(FE + BE/data)*
7. **Phase 9 Portfolio analytics** — backend valuation/exit/IRR/MOIC/DPI/sector model, then the Snapshot UI. *(BE-heavy)*
8. **Phase 2 Accreditation** — accreditation state machine + 4 screens. *(BE + FE)*
9. **Phase 5 Feed** — net-new social subsystem (model, API, UI). Largest effort; lowest leverage on the deal funnel. *(BE-heavy + FE)*

### 2.8 Estimated parity
- **Average visual parity across the 8 designed phases ≈ 26%.**
- Weighted toward the **core deal funnel** (Phases 6–9), parity ≈ **48%**; the **profile/community half** (Phases 2–5) ≈ **4%**.

### 2.9 Estimated production readiness
- **Against the full redesigned vision (Phases 2–9): ~35%.** Half the designed surfaces don't exist.
- **The currently-built slice on its own (Discovery → Detail → NDA → Data Room → Offer/Negotiate/Sign → Pipeline): ~70% production-ready**, with real caveats: universal KYC identity/face is UI-stubbed (blocks fresh accounts), NDA e-sign is a placeholder, data-room downloads 400 on empty seed `StoragePath`, and pipeline MOIC is a demo constant.

### 2.10 Roadmap to 95% parity
**Milestone A — Funnel to ~90% (mostly frontend, ~2–3 wks)**
Sidebar IA; Phase 6 real charts + NDA copy/links (→ ~90%); Phase 8 builder + live preview + PDF + add GoverningLaw/Jurisdiction (→ ~85%); Phase 7 viewer + watermark + Next Steps + fix seed `StoragePath` (→ ~85%); Phase 9 filter chips + DnD + expanded-card wiring (→ ~70%, portfolio still pending).

**Milestone B — Profile half + thesis (frontend + light backend, ~2–3 wks)**
Phase 3 Thesis (form on existing fields + 4 new fields, → ~90%); Phase 4 Public Profile view+edit minus feed (→ ~80%); Phase 2 Accreditation screens + accreditation state model (→ ~85%).

**Milestone C — Data-backed + community (backend-heavy, ~3–4 wks)**
Phase 9 portfolio analytics (valuation/exit/IRR/MOIC/DPI/sector) + Snapshot UI + AI nudge (→ ~90%); Phase 7 AI-analysis + notes endpoints (→ ~90%); Phase 5 social feed subsystem end-to-end (→ ~85%) and the Phase 4 activity feed (→ ~95%); real NDA e-sign.

**Exit at ~95% average:** every phase ≥ 85%, the deal funnel (6–9) ≥ 90%, and no phase blocked solely on missing data. The two true long-poles are **portfolio analytics data (Phase 9)** and the **social feed subsystem (Phase 5)** — both backend-net-new and the gating items for the final ~20 points.

---

*Audit only. No code modified, no implementation performed.*
