# Mondial — Investor Product Council Review

**Date:** 2026-06-23
**Council:** Head of Product · Principal UX Designer · Principal Frontend Architect · VC-Platform Expert
**Mandate:** design the *best* investor experience — **not** Figma parity. Optimize for **investor conversion · deal creation · negotiation success · founder-investor communication · product clarity · trust · professionalism.**
**Guardrails (hard):** keep the product model, workflow, and business logic **unchanged**; **no new features**; recommendations are **presentation-layer only** — information architecture, hierarchy, visual emphasis, metric placement, data-viz, trust indicators, empty/loading states, CTA placement, and **surfacing data the system already stores**.

> **Grounding principle:** every "add" below maps to a field that already exists in the investor data models (`types/investor/*`, `types/deals.ts`) or an already-wired API. We are *exposing* data, not inventing it. Items that would require new backend are marked **[CORE — out of scope]**.

**Rating legend**
- **Classification:** 🟥 Must Have · 🟩 High ROI · 🟦 Nice To Have · ⬜ Ignore
- **Effort:** S = ≤1 day (copy/layout/reuse) · M = 2–4 days (new component, existing data) · L = 1–2 wks
- **Impact:** ★ low · ★★ med · ★★★ high (across the 7 goals)
- **ROI:** 1–10 (impact ÷ effort)

---

## PART 1 — Per-screen council analysis

For each surface: **Stay / Improve / Remove / Surface (hidden) / Key metrics / Key charts / Trust / Deal-creation / Founder-response.**

### 1. Investments Dashboard (`/dashboard/investor`)
| Q | Answer |
|---|---|
| **Must stay** | KPI tile row, "Your Investments" list, role-correct sidebar, "recommended next steps" pattern |
| **Improve** | Replace the meaningless **Portfolio Value == Total Invested** pair with **Current Value + Net MOIC**; fix **ROI 0.0%**; repoint the two CTAs (they self-link today) to **Discovery** and **Deals** |
| **Remove** | Dead self-link CTAs as-is; de-emphasize the "Upgrade" upsell on the primary work surface (professionalism) |
| **Surface (hidden)** | `currentValuation`, `returns` (exist on each `Investment`) → unrealized gain + MOIC; pipeline counts ("3 deals awaiting your move"); real `creatorName` (today "Unknown founder") |
| **Key metrics** | Total Invested · Current Value · Net MOIC · # Active Deals · Capital committed vs deployed · # in Negotiation |
| **Key charts** | Portfolio value-over-time (line) · Sector allocation (donut) |
| **Trust** | Real founder names · "Valuations as of {date}" · self-reported vs verified labelling |
| **Deal-creation** | "N new matches · M deals awaiting you" → routes into Discovery/Deals |
| **Founder-response** | n/a here |

### 2. Discovery Feed (`/discovery`)
| Q | Answer |
|---|---|
| **Must stay** | Thesis-ranked ordering, match-score badges, filter chips, Message + View-details on every card |
| **Improve** | Add a **"why this matches you + recommended action"** rail/expander; add **search**; show selected-chip + "clear" states |
| **Remove** | Nothing material. **Ignore** image thumbnails (pure visual) |
| **Surface (hidden)** | `matchRationale` and the 9-dim `scoreBreakdown` (already power the detail page) · `trustScore` per card · round timing |
| **Key metrics** | Match % · Trust score · Ask · Valuation · Stage · % of round filled / days to close |
| **Key charts** | Per-card mini match-breakdown bar · feed-level average-match ring |
| **Trust** | Trust-score badge · "verified" flag · "N investors committed" |
| **Deal-creation** | **Recommended-action nudge** ("Send EOI before this round closes — 68% filled") — scarcity + next step |
| **Founder-response** | "Founder active this week / replies in ~Xh" **[CORE if not stored]**; investor's own verification raises reply odds |

### 3. Opportunity Detail (`/discovery/[id]`)
| Q | Answer |
|---|---|
| **Must stay** | Financial KPI strip (Ask/Pre/Post/Equity), 5 tabs, **Make Offer** (live's edge over Figma), NDA gating, **Cap Table donut + table** (excellent — keep) |
| **Improve** | **Fix Score Breakdown 0%** (it shows 0% on all 9 dims — destroys trust); enrich Overview with founder identity; make **Make Offer** the dominant CTA; richer Team tab |
| **Remove** | **Dead Save / Share buttons** (wire or delete) |
| **Surface (hidden)** | `matchRationale` (full), `aiReviewScore` → "Deal Score", `trustScore`, verification flags, funding progress (ask vs committed) — all in `OpportunityDetail` |
| **Key metrics** | Match % · Deal Score (AI) · Trust · Ask/Pre/Post/Equity · Dilution · % round filled · days to close |
| **Key charts** | Match-breakdown bars (fix 0%) · Cap-table donut (have) · Use-of-funds bars · Funding-progress bar |
| **Trust** | Verification badges · Trust Score /100 · NDA-signed state · "N committed" · founder identity |
| **Deal-creation** | Make Offer + **restore the Term-Sheet Builder (404 today)** + funding-progress urgency |
| **Founder-response** | Prominent **Contact Founder** · founder responsiveness signal |

### 4. Data Room (`/discovery/[id]/dataroom`)
| Q | Answer |
|---|---|
| **Must stay** | NDA gate, Session Activity, Diligence Progress, per-doc download |
| **Improve** | Strong **empty state** ("Docs will appear here — meanwhile, add to pipeline / message founder"); **Next-Steps action panel** |
| **Remove** | "Documents reviewed **1 of 0**" inconsistency |
| **Surface (hidden)** | Diligence checklist + session analytics (already returned by API); reuse pipeline/term-sheet actions as next-steps |
| **Key metrics** | Docs reviewed / total · Diligence % · Time in room · Days since last access |
| **Key charts** | Diligence progress ring · doc-category completion bars |
| **Trust** | "Watermarked · session monitored" banner · NDA-signed · access audit |
| **Deal-creation** | **Add to Pipeline / Build Term Sheet** from the room |
| **Founder-response** | "Request a meeting / Message founder" CTA |
| **Note** | The **document viewer / AI analysis** is **[CORE — out of scope]**; only the presentation shell + next-steps are in remit |

### 5. Term Sheet (read-only) + Builder (`/term-sheet`, `/term-sheet/build`)
| Q | Answer |
|---|---|
| **Must stay** | The whole built flow — 3-step builder + live preview (matches Figma, already coded) |
| **Improve** | **Restore reachability — both 404 in the live build** (stale deploy: rebuild + restart). This is the single highest-value fix |
| **Remove** | Disabled redundant "Message Founder" (a working one exists elsewhere) |
| **Surface** | Live "Non-Binding Term Sheet" preview as the investor types (already built) |
| **Key metrics** | Investment amount · Pre/Post · Equity % · Price/share · New shares |
| **Key charts** | Equity/ownership ring in the builder (already designed) |
| **Trust** | "Non-binding · watermarked" framing · clear signature blocks |
| **Deal-creation** | This **is** deal creation — its absence dead-ends the funnel |
| **Founder-response** | Sends the offer that starts founder dialogue |

### 6. Investment Thesis (`/thesis`)
| Q | Answer |
|---|---|
| **Must stay** | Capture of check size, geographies, stages, sectors (drives match quality — keep over Figma's softer MOIC slider) |
| **Improve** | Labeled stepper (clarity); optional MOIC/return-multiple field (`targetReturnMultiple` exists) |
| **Surface** | "Your thesis powers these matches" link back to Discovery |
| **Trust/clarity** | Explain that thesis inputs drive ranking |

### 7. Public Profile (`/profile`) + Edit
| Q | Answer |
|---|---|
| **Must stay** | Cover, About, Investment Preferences, **Profile Completion checklist** (keep — better than Figma) |
| **Improve** | Add **track record + value-add** sections |
| **Remove** | Built-but-unused `ProfileStatsCard` — render it or delete |
| **Surface (hidden)** | `successfulExits`, `averageCheckSize`, `completedDeals`, `activeInvestments` (all in `InvestorProfile`) |
| **Founder-response** | **This is the #1 founder-response lever** — a verified, track-record-rich investor profile earns more founder replies |

### 8. Pipeline / Portfolio (`/pipeline`)
| Q | Answer |
|---|---|
| **Must stay** | 5-stage Kanban, KPI strip, expanded deal card. **Keep read-only** |
| **Improve** | Add **Portfolio Snapshot** (holdings + sector donut + performance) and an **AI-Nudge** prompt |
| **Remove** | Don't add drag-and-drop — stages are system-derived; manual drag would misrepresent reality (**clarity**) |
| **Surface** | `InvestorPipeline.summary`, portfolio holdings/returns |
| **Key metrics** | Active deals · Capital committed · Avg match · **Portfolio MOIC** · stage counts |
| **Charts** | Sector-allocation donut · performance |
| **Founder-response** | AI-Nudge: "founders reply in 48–72h — send a follow-up" |

### 9. Deals / Negotiation (`/deals`)
| Q | Answer |
|---|---|
| **Must stay** | Inbox + detail, offer-terms grid, timeline, counter/accept/reject/sign, status (live's biggest edge over Figma) |
| **Improve** | **Offer-diff** visualization (what changed across revisions), **whose-turn** emphasis, real founder name |
| **Surface (hidden)** | `revisions[]` diff, `currentTurn`, `closingChecklist`, `signatures` (all in `DealStatus`) |
| **Key metrics** | Current Raise/Post/Equity/Type · revision # · days in negotiation · offer↔counter gap |
| **Charts** | Offer-vs-counter delta (valuation/equity) |
| **Trust** | Signature/audit record · "agreed terms" clarity |
| **Founder-response** | Response-time indicator + nudge |

### 10. Messages (`/messages`)
| Q | Answer |
|---|---|
| **Must stay** | Two-pane workspace (keep — not in Figma) |
| **Improve** | Show **founder/company name + avatar** (today "Entrepreneur · F4CC") and **deal context** in the thread header |
| **Founder-response** | Named, context-rich threads raise reply rates |

---

## PART 2 — The Blueprints

### A. Investor Product Blueprint (IA & screen hierarchy)
**Information architecture — order the sidebar by the investor's actual funnel,** not alphabetically:

```
SOURCE      → Discovery            (find)
EVALUATE    → Opportunity + Data Room   (diligence)
TRANSACT    → Term Sheet → Deals   (offer → negotiate → close)
TRACK       → Pipeline + Investments(portfolio)
RELATE      → Messages             (communicate)
IDENTITY    → Thesis + Public Profile
```
- **Screen hierarchy law:** on every screen the **primary action** (Make Offer / Send EOI / Build Term Sheet / Message) is the visually dominant element; analytics/secondary live in a right rail; upsells never outrank the work.
- **Global trust strip:** a slim, consistent header chip on opportunity/data-room/deal screens — `NDA state · Trust Score · verified`.
- **Keep:** Deals, Messages, dark mode, Make-Offer, read-only Pipeline, Profile-completion, Cap-table viz (all already better than Figma).

| Recommendation | Class | Effort | Impact | ROI |
|---|---|---|---|---|
| Funnel-ordered nav + consistent screen hierarchy | 🟩 High ROI | S | ★★ | 8 |
| Global trust strip (reuse trustScore/NDA) | 🟩 High ROI | S | ★★★ | 9 |
| Demote upsell below primary actions | 🟦 Nice | S | ★ | 6 |

### B. Investor Trust Blueprint
Trust is the highest-leverage, lowest-effort win — the data exists, it's just unshown.
- **Verification badges** (identity / finance / accredited) + **Trust Score /100** on opportunity, profile, and feed cards.
- **"N investors committed · round closes {date}"** social proof on opportunity + discovery.
- **Data-room integrity banner:** "Watermarked · session monitored · NDA on file."
- **Provenance labels:** "Valuation self-reported" vs "verified"; "Data as of {date}" on all metrics.
- **Audit trail** on deals: revision history + signature records (exist) shown as a tamper-evident timeline.
- **Professionalism cleanups (trust-by-subtraction):** fix Score-Breakdown 0%, "Unknown founder", "Documents reviewed 1 of 0"; wire/remove dead Save/Share; consistent currency.

| Recommendation | Class | Effort | Impact | ROI |
|---|---|---|---|---|
| Verification + Trust Score everywhere (surface existing) | 🟥 Must | M | ★★★ | 9 |
| Fix 0% / Unknown-founder / dead buttons (professionalism) | 🟥 Must | S | ★★★ | 10 |
| "N committed · round closing" social proof | 🟩 High ROI | S | ★★★ | 9 |
| Data-room integrity banner | 🟩 High ROI | S | ★★ | 8 |
| "Data as of" + self-reported/verified labels | 🟦 Nice | S | ★★ | 7 |

### C. Investor Metrics Blueprint
The canonical metric set and **where each belongs** (place the decision metric closest to the decision):

| Surface | Primary metrics (decision) | Secondary |
|---|---|---|
| Discovery card | Match % · Trust score · Ask · Stage | Valuation · % round filled |
| Opportunity | **Deal Score (AI)** · Match % · Pre/Post · Equity · Dilution | Funding progress · days-to-close |
| Data Room | Diligence % · docs reviewed/total | time in room |
| Negotiation | Current Raise/Post/Equity/Type · offer↔counter gap | revision # · days in nego |
| Portfolio/Dashboard | Total Invested · Current Value · **Net MOIC** · # Active | sector mix · committed vs deployed |

- **Rule:** never show two metrics that are identical (kill Portfolio Value == Total Invested). Every number gets a unit, a basis, and a timestamp.

| Recommendation | Class | Effort | Impact | ROI |
|---|---|---|---|---|
| Replace redundant KPIs with MOIC/Current Value | 🟥 Must | S | ★★★ | 9 |
| Deal Score (surface `aiReviewScore`) on opportunity | 🟩 High ROI | M | ★★★ | 8 |
| Dilution / ownership math on opportunity | 🟦 Nice | M | ★★ | 6 |

### D. Investor Dashboard Blueprint
- **Hierarchy:** (1) "Your move" action band — *N matches, M deals awaiting you* → deep links; (2) Portfolio health row — Total Invested · Current Value · Net MOIC · Active; (3) Portfolio value chart + sector donut; (4) Holdings list with real names + per-holding MOIC.
- **Surface:** `currentValuation`/`returns` → unrealized gain; pipeline stage counts.
- **Empty state:** "No investments yet → explore N matched opportunities" (routes to Discovery).
- **CTA:** the action band replaces today's two dead self-link CTAs.

| Recommendation | Class | Effort | Impact | ROI |
|---|---|---|---|---|
| "Your move" action band (repoint CTAs) | 🟥 Must | S | ★★★ | 10 |
| Current Value + Net MOIC + unrealized (surface returns) | 🟥 Must | M | ★★★ | 8 |
| Portfolio value chart + sector donut | 🟦 Nice | M | ★★ | 6 |

### E. Discovery Blueprint
- **Layout:** ranked card list (keep) + **right "Insights" rail** = thesis-alignment (surface `matchRationale`), average-match ring, score-breakdown, **Recommended Action** (round-closing nudge).
- **Card:** add Trust badge + "% round filled"; one-tap **Message** / **View** (keep); expander shows per-card match breakdown.
- **Add search**; selected-chip + clear states.
- **CTA emphasis:** "Send EOI / Make Offer" as the high-intent action on strong matches.

| Recommendation | Class | Effort | Impact | ROI |
|---|---|---|---|---|
| Insights rail + Recommended Action (surface existing scores) | 🟥 Must | M | ★★★ | 9 |
| Trust badge + % round filled on cards | 🟩 High ROI | S | ★★★ | 9 |
| Search + chip states | 🟦 Nice | M | ★★ | 6 |
| Image thumbnails | ⬜ Ignore | M | ★ | 2 |

### F. Opportunity Blueprint
- **Hierarchy:** founder/company identity + verification → financial KPI strip → **Make Offer** (dominant) → tabs → right rail (Deal Score, Match breakdown **fixed**, Funding progress, NDA/Contact).
- **Surface:** `matchRationale`, `aiReviewScore` (Deal Score), `trustScore`, verification, funding progress, use-of-funds.
- **Keep:** Cap-table donut+table (excellent), financial KPIs, Make Offer.
- **Empty/locked:** keep honest NDA-locked panels; pre-NDA show "Sign NDA to unlock cap table, data room, financials".

| Recommendation | Class | Effort | Impact | ROI |
|---|---|---|---|---|
| Fix Score-Breakdown 0% | 🟥 Must | S | ★★★ | 10 |
| Funding progress + verification + Deal Score (surface) | 🟥 Must | M | ★★★ | 9 |
| Founder identity in Overview | 🟩 High ROI | M | ★★ | 7 |
| Wire/remove Save & Share | 🟩 High ROI | S | ★★ | 8 |

### G. Data Room Blueprint
- **Keep** Session Activity + Diligence Progress; **add Next-Steps panel** (Add to Pipeline / Build Term Sheet / Request Meeting) — pure reuse of existing actions.
- **Empty state** becomes a launchpad, not a dead end.
- **Integrity banner** for trust.
- **[CORE — out of scope]:** the in-browser document viewer + AI analysis (separate track).

| Recommendation | Class | Effort | Impact | ROI |
|---|---|---|---|---|
| Next-Steps action panel | 🟥 Must | S | ★★★ | 9 |
| Actionable empty state | 🟩 High ROI | S | ★★ | 8 |
| Integrity/"monitored" banner | 🟩 High ROI | S | ★★ | 8 |
| Document viewer / AI analysis | ⬜ Ignore (core, not presentation) | L | ★★★ | — |

### H. Portfolio Blueprint
- **Add Portfolio Snapshot** to Pipeline + Dashboard: holdings (name · cost · current · MOIC), **sector-allocation donut**, performance (Total Invested · Current Value · unrealized).
- **Surface** `currentValuation`/`returns`; compute Net MOIC from existing fields.
- **Trust:** "valuations as of {date}", self-reported vs verified.

| Recommendation | Class | Effort | Impact | ROI |
|---|---|---|---|---|
| Portfolio Snapshot (holdings + donut + perf) | 🟩 High ROI | M | ★★ | 7 |
| Net MOIC / unrealized (compute from existing) | 🟥 Must | S | ★★★ | 9 |

### I. Negotiation Blueprint
- **Keep** the workspace (best-in-class vs Figma).
- **Add offer-diff card** — show what changed between revisions (surface `revisions[]`); **whose-turn** banner (`currentTurn`); **closing checklist** (`closingChecklist`) and **signature/audit** timeline.
- **Real founder name** + deal context in header.

| Recommendation | Class | Effort | Impact | ROI |
|---|---|---|---|---|
| Offer-diff + whose-turn (surface existing) | 🟩 High ROI | M | ★★★ | 8 |
| Closing checklist + signature audit timeline | 🟩 High ROI | M | ★★ | 7 |
| Founder name + deal context in header | 🟥 Must | S | ★★ | 9 |

---

## PART 3 — Master prioritized roadmap

### 🟥 Must Have (do first — defects + trust + funnel)
| # | Item | Surface | Effort | Impact | ROI |
|---|---|---|---|---|---|
| 1 | Rebuild/restart → **restore Term-Sheet + Builder** (404) | Opportunity→Deal | S(ops) | ★★★ | 10 |
| 2 | Fix **Score Breakdown 0%** | Opportunity | S | ★★★ | 10 |
| 3 | Fix **Unknown founder / Entrepreneur·F4CC** names | Dashboard/Messages | S | ★★★ | 10 |
| 4 | **"Your move" action band** (repoint dead CTAs) | Dashboard | S | ★★★ | 10 |
| 5 | **Net MOIC / Current Value** (kill duplicate KPI) | Dashboard | S–M | ★★★ | 9 |
| 6 | **Verification + Trust Score** surfaced everywhere | Global | M | ★★★ | 9 |
| 7 | **Discovery Insights rail + Recommended Action** | Discovery | M | ★★★ | 9 |
| 8 | **Funding progress + Deal Score** on opportunity | Opportunity | M | ★★★ | 9 |
| 9 | **Data Room Next-Steps** panel + actionable empty state | Data Room | S | ★★★ | 9 |
| 10 | **Founder name + deal context** in Negotiation/Messages | Deals/Messages | S | ★★ | 9 |

### 🟩 High ROI (do next)
Global trust strip · Trust badge + "% round filled" on cards · funnel-ordered nav · wire/remove Save&Share · offer-diff + whose-turn · closing-checklist/signature timeline · Portfolio Snapshot · data-room integrity banner · track-record on Public Profile.

### 🟦 Nice To Have
Portfolio value chart · sector donut on dashboard · search + chip states on Discovery · dilution math · thesis MOIC field + labeled stepper · "data as of" labels.

### ⬜ Ignore (not aligned to the 7 goals or out of remit)
Image thumbnails · pixel-matching Figma steppers/spacing · $→€ cosmetics · **Pipeline drag-and-drop** (would misrepresent system-derived stages) · **Phase-2 Declaration flow** (Thesis supersedes) · **rebuilding the doc viewer as "presentation"** (it's core) · renaming the Entrepreneur role.

---

## Council sign-off

- **Head of Product:** the roadmap is defect-first then trust-first — every Must-Have either unblocks the funnel or removes something that reads as broken. No new scope; fastest path to a credible platform.
- **Principal UX:** one hierarchy law (primary action dominates, analytics in the rail, upsell never wins) plus funnel-ordered IA fixes most clarity issues without touching the workflow.
- **Principal Frontend Architect:** ~90% of this is reusing existing hooks/fields and adding presentation components — S/M effort, React-Compiler-friendly, no new data contracts. The one operational must-do (rebuild for the 404 routes) is free.
- **VC-Platform Expert:** investors decide on **thesis-fit, trust, ownership math, and round momentum** — surfacing match rationale, verification, funding progress, MOIC, and a clean term-sheet path is exactly what converts browsing into committed capital. Keep the negotiation workspace; it's ahead of the design.

**North star:** the best investor platform here isn't the prettiest — it's the one where an investor can, on every screen, see *why this fits me*, *can I trust it*, and *what's my next move* — using data the product already has.
