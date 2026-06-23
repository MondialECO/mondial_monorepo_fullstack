# Investor — Figma vs Implementation Visual & UX Audit

**Date:** 2026-06-23
**Figma file:** `Mondial Dashboard Working after restored` (`5oHxoppTAyS4zb2DfUdYwy`), entry node `18802:9804`
**Live app:** http://localhost:3000 — session: **Demo Investor** (`demo.investor@mondial.local`)
**Method:** Live screens captured via browser automation; Figma frames rendered via Figma MCP; compared screen-by-screen. No code modified.
**Companion docs:** `INVESTOR_ECOSYSTEM_AUDIT_2026-06-23.md` (code-side audit) + `INVESTOR_WORKFLOW_DIAGRAM.png`.

> **Scope note on "live":** the running localhost:3000 frontend is serving a **stale build** — the `term-sheet` and `term-sheet/build` routes return the app's 404 page even though source + build artifacts + route manifests all contain them (built 2026‑06‑17, BUILD_ID `85AWqJWNhSRuTUh40LT8M`). Where this matters, the screen is marked *broken in live build* and the **code-side** state is given separately.

---

## Executive summary

The implementation is a **transaction-focused, cleaner reduction** of a much richer Figma vision. The live investor app nails the *spine* (discovery → detail → NDA/data-room → pipeline → deals negotiation) with real data and good componentry, but drops most of Figma's **analytics and social-proof surface area** — portfolio performance charts, the discovery insights rail, the founder identity/“why this deal” sections, the full document data-room, and the pipeline portfolio snapshot. It also **adds** two whole surfaces Figma never designed (a Deals negotiation workspace and Messages).

Overall **visual parity vs Figma ≈ 57% (code) / ≈ 50% (actually reachable in the current live build)**. Detail in Section H.

Three defects stand out:
- **P0/P1 — Term Sheet flow 404s live** (stale build). The offer-builder, which in *code* closely matches the Figma "Term Sheet Builder", is unreachable.
- **P1 — Opportunity-detail Score Breakdown shows 0%** for every sub-dimension while the headline match is 91%.
- **P1 — "Unknown founder" / "Entrepreneur · F4CC"**: founder & counterparty names don't resolve on the dashboard, investments list, and Messages.

---

## A. Figma Screen Inventory

28 investor-relevant frames (all 1440px artboards) live under node `18802:9804`, organized into "phase" sections that mirror the investor lifecycle:

| # | Figma frame | nodeId | Maps to live |
|---|---|---|---|
| 1 | dashboard-investor-overview | 18802:11732 | Investments dashboard |
| 2 | dashboard-investor-portfolio | 18802:11884 | Investments dashboard |
| 3 | dashboard-investor-portfolio (alt) | 18802:11968 | Investments dashboard |
| 4 | dashboard-filter | 18802:12054 | (filter state) |
| 5 | Profile Page – Public View (generic) | 19457:24264 | — (creator profile, not investor) |
| 6 | Profile Edit Page | 19457:23443 / 19457:23367 | Profile Edit |
| 7 | Settings – account / Creator Preferences | 19457:23090 / 19457:23526 | — (no investor settings page) |
| 8–11 | Phase 2 — Declaration / documents / review | 21974:16239, 21993:20321, 21998:21541, 22007:7804 | — (no live "declaration" flow) |
| 12 | Phase 3 investment thesis (Return) | 22022:19349 | Thesis wizard |
| 13 | Phase 3 thesis – policy | 22022:19883 | Thesis wizard |
| 14 | Phase 3 board | 22022:30210 | Thesis wizard |
| 15 | Phase 3 complete thesis | 22022:31191 | Thesis wizard (completion) |
| 16 | Phase 4 profile – public view | 22043:8074 | Public Profile |
| 17 | Phase 4 profile – edit | 22051:19690 | Profile Edit |
| 18 | Phase 5 Line Deal-discovery | 22107:8884 | Discovery feed |
| 19 | Phase 5 Row line Deal-discovery | 22115:29008 | Discovery feed (alt layout) |
| 20 | Phase 5 review details – overview | 22173:19123 | Opportunity detail |
| 21–24 | Phase 5 details – revenue/operations/roadmap/documents | 22191:8611 / 9137 / 9522 / 10280 | Opportunity detail tabs |
| 25 | Phase 6 founder profile – overview | 22225:9271 | Opportunity detail |
| 26 | Phase 6 – traction | 22274:11927 | Opportunity detail → Traction tab |
| 27 | Phase 6 – Cap Table (locked) | 22274:33499 | Opportunity detail → Cap Table (pre-NDA) |
| 28 | Phase 6 – Cap Table (unlocked) | 22455:29482 | Opportunity detail → Cap Table (post-NDA) |
| 29 | Phase 6 – team | 22423:11362 | Opportunity detail → Team tab |
| 30 | Phase 6 – Documents (unlocked) | 22474:17036 | Opportunity detail → Documents tab |
| 31–33 | Phase 6 – NDA preview / signature / access | 22442:14547, 22455:14899, 22455:19541 | NDAAcceptModal |
| 34 | phase 7 – data room | 22287:12560 | Data Room |
| 35 | phase 8 – term sheet (Builder) | 22316:10466 | Term Sheet Builder (`/term-sheet/build`) |
| 36 | phase 9 – pipeline | 22614:33095 | Pipeline |

There is **no Figma frame** for: a Deals/negotiation inbox, Messages, or a standalone read-only term-sheet summary — those are implementation-only (Section E).

---

## B. Route → Figma Mapping & Screen-by-Screen Comparison

Classifications: **Exact Match · Minor Differences · Major Differences · Better Than Figma · Missing From Implementation · Exists In Implementation But Not In Figma.**

### B1. Investments Dashboard — **Major Differences**
- **Route:** `/dashboard/investor` · **Figma:** `18802:11732`, `18802:11884`
- **Components:** `InvestorDashboard` page, KPI tiles, `EmptyState`, investments list
- **Live:** "Welcome Back"; "Recommended next steps" card (2 CTAs); **4** KPI tiles (Total Invested $770K, Portfolio Value $770K, Investments 03, Avg ROI 0.0%); "Your Investments" full-width list.
- **Figma:** "Hello Back, Jona 👋"; **3** KPI tiles (Total Invest, Total Equity Owned, ROI); **"Portfolio Performance" bar chart** (Jan–Aug + date filter + tooltip); right **"My Stakeholders"** panel with avatars/amounts.
- **Mismatches:**
  - Missing **Portfolio Performance chart** → *Missing From Implementation* — **P2**
  - Missing **My Stakeholders** side panel (replaced by full-width list) — **P2**
  - **"by Unknown founder"** on every investment (founder name unresolved) — **P1**
  - "Recommended next steps" CTAs **self-link** to `/dashboard/investor` (dead-ends; `page.tsx:41,47`) — **P2**
  - Portfolio Value == Total Invested and **ROI 0.0%** (no valuation/return computed) — **P2**
  - Greeting not personalized (Figma uses first name + emoji) — **P3**

### B2. Discovery Feed — **Major Differences**
- **Route:** `/dashboard/investor/discovery` · **Figma:** `22107:8884`, `22115:29008`
- **Components:** `FeedHeader`, `FilterChipBar`, `OpportunityCardListItem`, `MessageFounderButton`
- **Live:** "Deal Discovery"; filter chips; 4 cards with **initials avatars**, match badge, sector/stage/geo, Asking/Valuation, Message/View details.
- **Figma:** search bar; selected-chip states + "Clear Filter"; cards with **large image thumbnails**, short-pitch + metrics + a structured Finding-Goal/Stage/Geography row; **right "All Insights" rail** (Thesis Alignment, Average-Match donut, Score Breakdown, Recommended Action); "12 new matches today" badge; live activity toast.
- **Mismatches:**
  - Missing **"All Insights" rail** (score breakdown/thesis alignment on the feed) — **P2**
  - Missing **search bar** — **P2**
  - Cards use initials, not **image thumbnails** — **P3**
  - No selected-chip/Clear-Filter affordance — **P3**
- *Match:* match-score badges, chip filters, Message + View-details actions are all present and clean.

### B3. Opportunity Detail — **Major Differences / partly Missing From Implementation**
- **Route:** `/dashboard/investor/discovery/[companyId]` · **Figma:** `22225:9271`, `22173:19123` (+ tab frames)
- **Components:** `OpportunityHeader`, `OpportunityKPIStrip`, `MatchScoreCard`/`ScoreBreakdownPanel`, tab panels, `NDAAcceptModal`, `MakeOfferButton`
- **Live:** indigo banner (initials avatar), tags + **NDA Signed**, **Make Offer / Contact Founder / Save / Share**; 4 KPI tiles (Funding Ask €1.8M, Pre-Money €5.4M, Post-Money €7.2M, Equity 13%); tabs (Overview/Traction/Cap Table/Team/Documents); About + Company Snapshot; right rail 91% match donut + Score Breakdown.
- **Figma:** large **founder hero image** + identity/bio + **verification badges** (Identity/Finance Verified, Accredited, Trust Score 94); stat row; **Use of Funds** bar card; **"Why this deal?"** AI-match card; right rail with **NDA-required CTA**, **Funding Progress** bar, **Deal Score A+** sub-scores.
- **Mismatches:**
  - **Score Breakdown shows 0% for Sector/Stage/Check-size** while donut reads 91% — data bug — **P1**
  - Missing founder **hero image + verification badges** — **P2**
  - Missing **Use of Funds** breakdown — **P2**
  - Missing **"Why this deal?" AI** card (no investor-facing AI route; matches code audit) — **P2**
  - Missing **Funding Progress** + **Deal Score** panels — **P2**
  - **Save / Share buttons are dead** (no handler; `OpportunityHeader.tsx:96-103`) — **P2**
- *Better/Match:* financial KPI strip (Funding Ask / Pre / Post / Equity) is cleaner and more useful than Figma's stat row; **Make Offer** entry point is a needed addition; tab structure and NDA gating match Figma intent.

### B4. Data Room — **Major Differences / largely Missing From Implementation**
- **Route:** `…/[companyId]/dataroom` · **Figma:** `22287:12560`
- **Components:** `DataRoomHeader`, `DocumentsSection`, `SessionActivityCard`, `DiligenceProgressCard`, `NDALockedScreen`
- **Live (NDA unlocked):** "No documents have been published in this data room yet." + Session Activity (Views 1 / Downloads 0) + Diligence Progress placeholder.
- **Figma:** full **watermarked PDF viewer** (page nav, Search, Full Screen, Download), **categorized document tree** (Pitch/Financial/Legal/Technical with counts + locks + "New"), **Session Analytics** (time-on-doc, pages viewed, DD progress %), **Documents-reviewed checklist**, **AI Analysis** insights, **Next Steps** (Create Team Sheet / Request Meeting / Add To Pipeline), **Private Notes**, watermark + session-timer banner.
- **Mismatches:**
  - Missing the entire **document viewer + doc tree** — **P1**
  - Missing **AI Analysis**, **Private Notes**, **Next Steps**, watermark/session-timer banner — **P2**
  - **"Documents reviewed 1 of 0"** inconsistency — **P3**
- This is the **single largest design-to-implementation gap.**

### B5. Term Sheet (read-only summary) — **Missing From Implementation (broken in live build)**
- **Route:** `…/[companyId]/term-sheet` · **Figma:** (preview pane within `22316:10466`)
- **Live:** **404 — Page not found.** Source exists (`term-sheet/page.tsx`, no `notFound()`); in build manifest; not served by the running (stale) server. — **P1**

### B6. Term Sheet Builder — **Code Matches Figma, but Missing/Broken in live build**
- **Route:** `…/[companyId]/term-sheet/build` · **Figma:** `22316:10466`
- **Live:** **404.** — **P1**
- **Code (per code audit):** 3-step wizard `StepCoreEconomics` → `StepRightsGovernance` → `StepReviewSend` with `LiveTermSheetPreview`, wired to `POST /investor/term-sheet/{id}/create`. This **closely matches** Figma's "Term Sheet Builder" (3 steps · live "Non-Binding Term Sheet" preview · core economics / share structure / closing timeline / investor rights). So the screen is effectively *built and on-design* — it just isn't reachable in the running build.
- **Recommendation:** rebuild + restart the frontend; then re-verify as likely **Exact/Minor**.

### B7. Investment Thesis — **Major Differences**
- **Route:** `/dashboard/investor/thesis` · **Figma:** `22022:19349` (+ policy/board/complete)
- **Components:** `ThesisWizard`, step components, `ThesisCompletionCard`
- **Live:** Step 1 "Return expectations & focus" = **Check size (€ min/max) + Geographic focus chips + Preferred stages chips**; progress-bar stepper; Back/Next.
- **Figma:** Step 1 "Return Expectations" = **MOIC target-multiple slider (5–10x)**; numbered-circle stepper (Return → Policy → Board → Complete).
- **Mismatches:**
  - Step 1 content differs entirely; the **MOIC return-multiple slider** isn't surfaced where Figma places it — **P2**
  - **Progress-bar stepper** vs Figma's numbered-circle stepper — **P3**
  - Step ordering/grouping differs (live front-loads check-size/geo/stages) — **P3**
- *Match:* 4-step wizard + completion card concept; validation gating.

### B8. Public Profile — **Major Differences / partly Missing From Implementation**
- **Route:** `/dashboard/investor/profile` · **Figma:** `22043:8074`
- **Components:** `ProfileHeaderBanner`, `ProfileAboutCard`, `InvestmentPreferencesCard`, `ProfileCompletionCard` (and **unused** `ProfileStatsCard`)
- **Live:** cover banner + (empty) avatar, Angel + Public badges, About, Investment Preferences, **Profile Completion 7/7** checklist.
- **Figma:** **AI Match Snapshot 92%**, **verification status**, stats row (48 / 12 / €5M / 3.2x / 92%), **Value-Add Beyond Capital**, **Portfolio Showcase**, **Deal Criteria**, **Social Proof** (founder testimonial + co-investor endorsement), activity feed, tabs (Feed/Portfolio/Trends/Connections).
- **Mismatches:**
  - Missing AI Match Snapshot, verification status, stats row, Value-Add, Portfolio Showcase, Deal Criteria, Social Proof, activity feed, tabs — **P2**
  - **`ProfileStatsCard` is built but never rendered** (dead import; `profile/page.tsx:7`) — **P3**
- *Better/Extra:* **Profile Completion checklist** is an implementation addition (good onboarding nudge), not in Figma.

### B9. Profile Edit — **Minor Differences**
- **Route:** `/dashboard/investor/profile/edit` · **Figma:** `22051:19690`, `19457:23443`
- **Live:** clean form — Basic Information (Display name, Investor type, Headline, Bio) + Contact & Links (Website, …), dynamic social rows, Save/Cancel.
- **Verdict:** structurally faithful, standard form. Minor visual differences only.

### B10. Pipeline — **Major Differences / partly Missing From Implementation**
- **Route:** `/dashboard/investor/pipeline` · **Figma:** `22614:33095`
- **Components:** `PipelineHeader`, `KPIStrip`, `KanbanBoard`/`KanbanColumn`/`DealCardCompact`, `ExpandedDealCard`
- **Live:** "Pipeline + Portfolio"; **3** KPI tiles (Active Deals 4, Capital Committed €770K, Avg Match 85%); **5-stage Kanban** (New Matches/In Review/NDA Signed/Data Room/Negotiation); expanded deal card below.
- **Figma:** **4** KPI tiles (adds **Portfolio MOIC 2.4X**, with progress bars); **filter chips** (Hot/Awaiting me/Awaiting founder/Climate/FinTech); Kanban with **drag-and-drop** ("Drag deals here"); **"AI Nudge"** card; **"Portfolio Snapshot"** (holdings list + **sector-allocation donut** + performance: Total Invested / Current Value / DPI).
- **Mismatches:**
  - Kanban is **display-only — no drag-and-drop / no persistence** (`KanbanColumn.tsx:44-51`) — **P2**
  - Missing **Portfolio MOIC** KPI — **P3**
  - Missing **filter chips** — **P3**
  - Missing **AI Nudge** card — **P2**
  - Missing entire **Portfolio Snapshot** (holdings + sector donut + performance) — **P2**
  - **Hardcoded column palette** (`bg-blue-50/amber-50/emerald-50/teal-50/orange-50`, `KanbanColumn.tsx:17-24`) violates the "theme tokens only" rule — **P3**
- *Match:* header/subtitle, 5-stage model, KPI strip, expanded-deal concept are faithful.

### B11. Deals / Negotiation Workspace — **Exists In Implementation But Not In Figma** (Better Than Figma)
- **Route:** `/dashboard/investor/deals` · **Figma:** none
- **Components:** `NegotiationWorkspace`, `DealInbox`, `DealDetailPanel`, `OfferTermsCard`, `OfferComposerDialog`, `SignaturePanel`, `RevisionTimeline`
- **Live:** inbox (Rousseau/NovaPay/Veris/Atomica with Sent/Completed badges) + detail (offer terms grid Raise/Post-Money/Equity/Type, timeline, status "Awaiting founder", counter/accept/reject/sign). Functional, real-time.
- **Verdict:** a full negotiation surface Figma never designed. **Recommend keeping** — this is the operational heart of the investor flow.

### B12. Messages — **Exists In Implementation But Not In Figma**
- **Route:** `/dashboard/investor/messages` · **Figma:** none
- **Live:** two-pane messaging (conversation list + thread).
- **Issue:** conversations labelled **"Entrepreneur · F4CC" / "Entrepreneur · 03DE"** — generic role + hash, not founder/company names — **P2**. Otherwise functional. **Recommend keeping.**

### B13. Orphaned (not in nav, not in Figma) — for completeness
- `/dashboard/investor/phase-1` (legacy onboarding shim) and `/dashboard/investor/phase-5` (dead "Deal Discovery", calls non-existent `/api/investor/deals` → 404). See code audit Section D.

---

## C. Missing Screens (in Figma, absent/!=  in implementation)

1. **Portfolio Performance dashboard view** — Figma's charted overview (`18802:11732`) has no charted equivalent live.
2. **Full Data Room document viewer** (`22287:12560`) — the document-reading experience is essentially unbuilt.
3. **Term Sheet (read-only) + Builder** (`22316:10466`) — present in code, **404 in the live build**.
4. **Rich founder/opportunity profile** (`22225:9271`) — identity, verification, Use-of-Funds, Why-this-deal, Deal Score are absent.
5. **Rich investor public profile** (`22043:8074`) — Portfolio Showcase, Social Proof, Value-Add, verification, tabs absent.
6. **Phase-2 "Investment Declaration" flow** (`21974:16239` …) — no live counterpart (superseded by Thesis).
7. **Investor Settings page** (`19457:23090`) — no `/dashboard/investor/settings` exists.

## D. Missing Components

Charts & analytics: **Portfolio Performance bar chart**, **sector-allocation donut**, **Average-Match donut on the feed**, **Funding Progress bars**, **Deal Score (A+) sub-scores**.
Panels: discovery **"All Insights" rail**, **"My Stakeholders"** panel, **Portfolio Snapshot**, **AI Nudge**, **Why-this-deal AI** card, **Use of Funds** card, **verification-status** card, **Social Proof / endorsements**.
Inputs: discovery **search bar**, thesis **MOIC slider**, pipeline **filter chips**, data-room **private-notes** input.
Data-room: **document tree**, **watermarked PDF viewer**, **session timer/watermark banner**, **AI analysis** list, **Next-Steps** actions.
Media: deal-card **image thumbnails**, founder **hero image**.

## E. Extra Components (in implementation, not in Figma) — keep

- **Deals / Negotiation Workspace** (offer → counter → accept → sign → close) — *Better Than Figma*; keep.
- **Messages** workspace — keep (fix the generic conversation labels).
- **Profile Completion** checklist card — good onboarding nudge; keep.
- **"Recommended next steps"** dashboard card — keep the concept but **fix the dead self-link CTAs**.
- **Make Offer** entry point on opportunity detail — keep.
- **Built-but-unused:** `ProfileStatsCard` (render it or remove).

## F. Design Deviations (tokens · spacing · typography · colors · cards · tables · forms · states)

- **Color tokens:** primary indigo/blue is consistent with Figma across screens. **Violation:** pipeline Kanban columns use hardcoded Tailwind palette (`bg-blue-50/amber-50/emerald-50/teal-50/orange-50`, `KanbanColumn.tsx:17-24`) and the dead `phase-5` screen uses `bg-neutral-*`/`bg-red-50` — both bypass theme tokens (CLAUDE.md hard rule). — **P3**
- **Typography:** live uses a consistent bold ~28px H1 + muted subtitle system; clean and on-brand, though flatter than Figma (Figma leans on more weights/sizes and accent numerals). Acceptable.
- **Cards:** rounded-2xl (~16px) + subtle border/shadow throughout — consistent and close to Figma's card styling. Good.
- **Spacing:** generous, consistent gutters; live tends to **more whitespace / fewer elements per card** than Figma's denser cards. Net cleaner, less information-dense.
- **Tables:** neither side uses true data tables for investors; both use card/list rows (cap-table is the exception — present as a tab).
- **Forms:** Profile Edit and Thesis match shadcn form conventions and are on-design.
- **Empty states:** honest and well-built (Data Room "No documents…", Deals/Messages "Select a … "). Better than leaving blank.
- **Loading states:** real skeletons/spinners observed ("Loading your portfolio…", feed skeleton rows). Good.
- **Localization:** live shows **€** (EUR), Figma mostly **$** — cosmetic, but be deliberate.
- **Responsive:** not separately validated this pass; Figma includes 393px mobile companions for dashboard/profile that have **no confirmed live mobile equivalent** — flag for a responsive pass. — **P3**
- **Data bugs surfaced visually:** Score Breakdown 0% (**P1**), "Unknown founder" (**P1**), "Documents reviewed 1 of 0" (**P3**), ROI 0.0% / Portfolio Value == Invested (**P2**).

## G. Recommended Fixes (prioritized)

**P0 / P1 (blockers & broken):**
1. **Rebuild + restart the frontend** so `/term-sheet` and `/term-sheet/build` stop 404-ing (routes exist in code & manifest). Re-verify the Builder against Figma `22316:10466`.
2. **Fix Score Breakdown 0%** on opportunity detail — sub-scores should populate (Figma shows Sector/Stage/Geography/Team).
3. **Resolve founder/counterparty names** — kill "Unknown founder" (dashboard + investments) and "Entrepreneur · F4CC" (Messages).

**P2 (high-value parity gaps):**
4. Build the **Data Room document viewer** (tree + viewer + analytics + notes) — the biggest gap.
5. Add the discovery **"All Insights" rail** (or surface score-breakdown/thesis-alignment on the feed) + a **search bar**.
6. Add **Portfolio Performance chart** (dashboard) and **Portfolio Snapshot** (pipeline: holdings + sector donut + performance).
7. Enrich opportunity detail: **founder identity/verification**, **Use of Funds**, **Why-this-deal**, **Funding Progress**, **Deal Score**.
8. Wire the **dead Save/Share** buttons and the **self-link dashboard CTAs**; render or remove **ProfileStatsCard**.
9. Fix **ROI/Portfolio Value** computation so they aren't trivially equal/zero.

**P3 (polish):**
10. Move pipeline Kanban colors to **theme tokens**; add **drag-and-drop** (or visually signal it's read-only).
11. Discovery **image thumbnails** + selected-chip/Clear-Filter states; thesis **MOIC slider** + numbered stepper; pipeline **filter chips** + Portfolio MOIC KPI.
12. Run a **responsive/mobile** pass against Figma's 393px companions; verify **dark mode** across investor screens.

## H. Final Investor UI Completion Percentage

Per-screen parity vs Figma (code state; "live" notes reachability):

| Screen | Parity vs Figma | Note |
|---|---:|---|
| Investments Dashboard | 55% | chart + stakeholders missing; data bugs |
| Discovery Feed | 65% | insights rail + search + thumbnails missing |
| Opportunity Detail | 60% | identity/use-of-funds/why-this-deal/deal-score missing; score bug |
| Data Room | 25% | viewer/tree/AI/notes unbuilt |
| Term Sheet (read-only) | 70% code / **0% live** | 404 (stale build) |
| Term Sheet Builder | 90% code / **0% live** | matches Figma, 404 (stale build) |
| Investment Thesis | 70% | restructured wizard; MOIC slider not surfaced |
| Public Profile | 45% | rich social/portfolio sections missing |
| Profile Edit | 90% | on-design form |
| Pipeline | 50% | no DnD/filters/AI/portfolio-snapshot |
| Deals (negotiation) | n/a (extra) | not in Figma — keep |
| Messages | n/a (extra) | not in Figma — keep |

**Overall investor UI completion vs Figma ≈ 57% (code-complete)**, dropping to **≈ 50% as actually reachable in the current live build** (term-sheet 404s). Excluding the two implementation-only surfaces (Deals, Messages) from the denominator; including their *added* value, the investor app delivers meaningful capability Figma never specified, but trails Figma on analytics, document tooling, and profile richness.

---

## I. Supplement — sub-states, dark mode & responsive (verification pass)

Added after the main pass to close the items flagged as not-yet-verified.

### I.1 Opportunity-detail sub-tabs (NDA-unlocked state)
- **Overview** — About + Company Snapshot. *Minor Differences* (covered in B3).
- **Traction** — present; honest "metrics not published" empty state when traction data is absent (matches code audit). Figma `22274:11927` shows a populated traction view; live depends on data. *Minor/Data-gated.*
- **Cap Table** — **strong, on-design.** Renders an **ownership donut** (Founder & CEO 60% / Co-Founder 25% / ESOP 10% / Other 5%) **plus a real data table** (Stakeholder · Type · Shares · % Diluted: 600,000/60%, 250,000/25%, 100,000/10%) + Total Shares 1,000,000 / ESOP 10%. Closely matches Figma cap-table-unlocked `22455:29482`. *Exact/Minor.* — This is the **only true data table** in the investor surface, and it's well done.
- **Team** — minimal: two member cards (Founder & CEO, Co-Founder) with role only; initials avatar shows odd "F&". Figma team `22423:11362` is richer (photos/bios/links). *Major Differences / partly Missing.* — **P3.**
- **Documents** — tab count **0**, empty (consistent with the empty Data Room). *Missing data, not screen.*
- **Correction to B3:** a **minimal "Why this deal?"** text card *does* exist in the right rail ("Sector fit 91; stage seed; geography Netherlands") — but it is plain text, not Figma's rich AI-bullet card. The **Score Breakdown bug is worse than first noted**: **all nine** sub-dimensions read **0%** (Sector Match, Funding Stage, Check Size, Geography, Equity Type, Investment History, Revenue Stage, Market Size, Growth Potential) while the donut shows 91%. — **P1.**

### I.2 Dark mode — **Exists In Implementation But Not In Figma (keep)**
- Figma frames are **light-mode only**; the app ships a working **dark theme** (toggle in the top bar). The Investments dashboard renders cleanly in dark mode — dark surfaces, correct border/zebra contrast, KPI tiles, list rows, and the "Recommended next steps" card all adapt; no fixed-gray bleed-through observed on the dashboard.
- *Verdict:* a genuine enhancement beyond the design. **Recommend keeping.** (A full dark-mode sweep of every investor screen — e.g. the Kanban's hardcoded `bg-*-50` columns, which will look washed-out on dark — is still advisable; those palette literals don't theme. — **P3.**)

### I.3 Responsive behavior — implemented in code; pixel-parity not visually confirmed
- The browser-capture tooling returned a fixed ~1456px viewport regardless of window resize, so true mobile rendering could **not** be screenshot this session.
- **Code evidence is unambiguous, however:** investor pages use responsive Tailwind breakpoints throughout — dashboard `grid-cols-1 md:grid-cols-2 lg:grid-cols-4` (`page.tsx:52`), `OpportunityKPIStrip md:grid-cols-4`, `InvestmentSummaryGrid md:grid-cols-5`, `pipeline KPIStrip md:grid-cols-3`, and `sm:flex-row` header stacks across feed/header/dataroom/pipeline. So multi-column grids **do** collapse to single-column on small screens.
- **Gap:** no dedicated mobile navigation drawer (`Sheet`/`useIsMobile`) was found in `components/layout`; the sidebar relies on a collapse toggle. Figma includes **393px mobile companion frames** for dashboard/profile with **no confirmed pixel-matched live mobile layout**. *Recommend a dedicated responsive QA pass on a real device/emulator.* — **P3.**

### I.4 Net effect on completion %
These findings **raise** Opportunity Detail slightly (Cap Table is excellent; a minimal Why-this-deal exists) but **confirm** the P1 score-breakdown bug and a weak Team tab. Dark mode and responsive grids are positives not credited in the Figma-parity denominator. Overall figures in Section H stand: **≈57% code / ≈50% live-reachable.**

---

## Appendix — Evidence captured (live, this session)

| Screen | Route | Live result |
|---|---|---|
| Dashboard | `/dashboard/investor` | rendered; $770K / 3 investments / "Unknown founder" / ROI 0.0% |
| Discovery | `/dashboard/investor/discovery` | rendered; 4 matched deals, chips, no insights rail |
| Opportunity detail | `…/discovery/6a2cd2d51026dd996926ece3` | rendered; NDA Signed; **Score Breakdown 0%** |
| Data Room | `…/dataroom` | rendered; **empty documents**; Session Activity |
| Term Sheet | `…/term-sheet` | **404** |
| Term Sheet Builder | `…/term-sheet/build` | **404** |
| Thesis | `/dashboard/investor/thesis` | rendered; step 1 of 4 |
| Public Profile | `/dashboard/investor/profile` | rendered; Completion 7/7; no stats card |
| Profile Edit | `/dashboard/investor/profile/edit` | rendered; clean form |
| Pipeline | `/dashboard/investor/pipeline` | rendered; 5-stage Kanban (no DnD) |
| Deals | `/dashboard/investor/deals` | rendered; negotiation workspace |
| Messages | `/dashboard/investor/messages` | rendered; generic conversation labels |
| Detail → Cap Table tab | `…/discovery/[id]` | rendered; ownership donut + data table (NDA-unlocked) |
| Detail → Team tab | `…/discovery/[id]` | rendered; 2 member cards (minimal) |
| Detail → Documents tab | `…/discovery/[id]` | empty (count 0) |
| Dashboard (dark mode) | `/dashboard/investor` | rendered; clean dark theme, good contrast |
| Responsive (mobile) | — | not pixel-verifiable via tooling; responsive Tailwind grids confirmed in code |

*Live screenshots were captured to the browser host during this session; Figma frames referenced by node ID throughout.*
