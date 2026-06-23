# Mondial — Investor Product Preservation & Redesign Authority Audit

**Date:** 2026-06-23
**Authority panel:** Principal Product Designer · Principal UX Architect · VC-Platform Expert · Senior SaaS Product Reviewer
**Mission:** rule on exactly what **must be preserved, redesigned, improved, removed, or never touched** across the entire investor surface. **Not** a Figma-parity exercise. Optimize for investor success · deal creation · deal completion · founder communication · trust · clarity · professionalism · enterprise-grade UX.
**Inputs:** product docs, Figma `5oHxoppTAyS4zb2DfUdYwy`, codebase, live app, and all prior audits (routes, APIs, phases, workflow, Figma comparison, code-vs-live, council review, terminology).

## Inviolable capabilities (the spine — must survive every change)
Every recommendation below is constrained so these six capabilities and their business logic remain **fully intact**:
**Discovery → Diligence → Deal Creation → Negotiation → Signing → Deal Completion.**
"REMOVE" is therefore applied **only to dead/orphaned code that carries no live capability.** No workflow, no business rule, and no data contract is ever removed.

## Classification legend
| Tag | Meaning |
|---|---|
| 🟢 **MUST PRESERVE** | Capability/screen stays; presentation may evolve, logic intact |
| 🔵 **REDESIGN UI ONLY** | Re-skin / re-lay-out; **zero** logic or data-contract change |
| 🟡 **IMPROVE UX** | Surface existing data, fix hierarchy/metric/CTA; no logic change |
| 🔴 **REMOVE** | Dead code only (no live functionality) |
| ⬛ **NEVER TOUCH** | Business logic / workflow / gating / API contract / auth — do not alter |

Component verdict scale (per request): **Keep Current · Replace w/ Figma · Combine Current+Figma · Build New Hybrid.**
Effort **S/M/L**, Impact **★/★★/★★★** as in the Council Review.

---

# A. Investor Product Preservation Matrix — screens / routes / modals / states

For each: classification · why it exists · business & investor value · risk if removed · risk if redesigned · action.

| Screen / state | Class | Why it exists / value | Risk if **removed** | Risk if **redesigned** | Recommended action |
|---|---|---|---|---|---|
| **Investments Dashboard** `/investor` | 🟢 + 🟡 | Portfolio landing; orients the investor, drives re-engagement | Loses the home base / retention anchor | Low (presentation only) | **Keep but improve:** Current Value + Net MOIC (kill duplicate KPI), repoint dead CTAs, real founder names |
| **Discovery Feed** `/discovery` | 🟢 + 🟡 | Top-of-funnel sourcing; thesis-ranked matches | **Kills sourcing — funnel has no entry** | Low | **Keep; improve:** insights rail + recommended-action, trust badge, search |
| **Opportunity Detail** `/discovery/[id]` | 🟢 + 🟡 | Evaluation hub; gateway to offer | **Kills evaluation/deal-creation** | Med (don't disturb Make-Offer/tabs/NDA) | **Keep; improve:** fix Score 0%, surface funding progress/verification; keep Make Offer & cap table |
| **Opportunity → Cap Table tab** | 🟢 (Keep current) | Ownership transparency (donut + table) | Loses diligence-critical view | Med — already excellent | **Keep as is** (better than Figma) |
| **Opportunity → Team tab** | 🟡 | Founder-team credibility | Low | Low | **Improve:** richer member cards (data-gated) |
| **Opportunity → Traction tab** | 🟡 | Growth evidence | Low | Low | **Improve presentation;** honest empty state stays |
| **NDA Flow / Accept modal** | ⬛ logic + 🔵 UI | Legal gate unlocking cap table/data room/financials | **Breaks compliance + diligence gating** | High if logic touched; safe if only skin | **Never touch gating; redesign modal skin** (adopt Figma signature polish) |
| **Data Room** `/dataroom` | 🟢 capability + 🔵 presentation | Diligence workspace | **Kills diligence** | Med | **Preserve capability; redesign empty/shell;** add Next-Steps; viewer = Build New (core) |
| **Investment Thesis** `/thesis` | 🟢 (Keep current) | Captures matchable criteria → match quality | **Degrades matching** | Med (don't lose check-size/geo/stage capture) | **Keep as is** (better than Figma); minor stepper polish |
| **Public Profile** `/profile` | 🟢 + 🟡 | Investor's storefront to founders | Lowers founder trust/response | Low | **Keep; improve:** track record + value-add; render/remove ProfileStatsCard |
| **Profile Edit** `/profile/edit` | 🟢 (Keep current) | Self-service profile maintenance | Loses editability | Low | **Keep as is** |
| **Pipeline** `/pipeline` | 🟢 (read-only) + 🟡 | Deal-stage tracking across lifecycle | Loses tracking | **High if made draggable** (misrepresents derived stages) | **Keep read-only; improve:** Portfolio Snapshot + AI nudge. **Do NOT add drag-drop** |
| **Portfolio (holdings/perf)** | 🟡 | Post-investment tracking | Low | Low | **Improve:** surface MOIC/returns; sector mix |
| **Messages** `/messages` | 🟢 + 🟡 | Founder-investor channel | **Kills communication** | Low | **Keep; improve:** real names + deal context |
| **Negotiation Workspace** `/deals` | 🟢 + ⬛ logic | Offer negotiation engine | **Kills negotiation/closing** | **High** (offer state machine) | **Preserve; never touch logic; improve** offer-diff/whose-turn |
| **Offer Creation** (`OfferComposerDialog`/MakeOffer) | ⬛ + 🟢 | Starts a deal | **Kills deal creation** | High | **Never touch logic; keep;** keep Make-Offer prominence |
| **Term Sheet Builder** `/term-sheet/build` | 🟢 + ⬛ | Authors & sends the offer (3-step + live preview) | **Kills deal creation** | High | **Preserve; restore 404 (rebuild);** never touch create logic |
| **Term Sheet (read-only)** `/term-sheet` | 🟢 | Deal-stage summary | Loses deal context view | Low | **Preserve; restore 404** |
| **Signatures** (`SignaturePanel`/`signTermSheet`) | ⬛ + 🟢 | Legally closes the deal | **Kills signing/completion** | **High** (signature record) | **Never touch logic; keep; UI polish only** |
| **Notifications** (bell, mark-read) | 🟢 | Re-engagement, deal events | Loses event awareness | Low | **Keep;** ensure deep-links to the right deal |
| **Empty States** (feed/deals/dataroom/messages) | 🟡 | Guidance when no data | Confusing blanks | Low | **Keep honest ones; improve** data-room empty → actionable launchpad |
| **Loading States** (skeletons/spinners) | 🟢 (Keep) | Perceived performance | Jank/uncertainty | Low | **Keep as is** |
| **Error States** | 🟢 + 🟡 | Failure recovery | Silent failure | Low | **Keep retry UX; improve:** stop the dashboard API from masking errors as empty data |
| **`phase-1` shim** | 🔴 | Legacy onboarding back-compat | **None** (orphaned, no nav) | n/a | **Remove** (dead route) |
| **`phase-5` "Deal Discovery"** | 🔴 | Superseded dead page (404 endpoint) | **None** (dead) | n/a | **Remove** (dead route) |

---

# B. Investor Redesign Matrix — what genuinely needs redesign vs. just improvement

| Item | Verdict | Scope boundary |
|---|---|---|
| Data Room shell (empty viewer) | 🔵 **REDESIGN UI ONLY** + Build-New viewer (core) | Re-lay-out shell + add Next-Steps; the document viewer/AI = separate core track |
| NDA accept/sign modal | 🔵 **REDESIGN UI ONLY** | Adopt Figma's signature/watermark polish; **gating logic untouched** |
| Dashboard KPI block | 🟡 **IMPROVE** (not full redesign) | Swap redundant KPI, repoint CTAs |
| Discovery card + rail | 🟡 **IMPROVE** | Add insights rail + trust badge; cards stay |
| Opportunity right rail | 🟡 **IMPROVE** | Fix score display, add funding progress/Deal Score |
| Pipeline | 🟡 **IMPROVE** | Add Portfolio Snapshot; **no structural redesign, no DnD** |
| Everything else live | 🟢 **PRESERVE** | Most live screens need *improvement*, not *redesign* |

**Authority ruling:** the live investor product needs **surfacing and polish, not wholesale redesign.** Only two items warrant true UI redesign (Data Room shell, NDA modal), and neither touches logic.

---

# C. Investor Component Audit

Per component: **Keep Current / Replace w/ Figma / Combine / Build New** + class + effort/impact.

| Component | Exists in | Verdict | Class | Why |
|---|---|---|---|---|
| **Cap Table (donut + table)** | Live, Figma | **Keep Current** | 🟢 | Live = donut + real data table; ≥ Figma. S/★★★ to keep |
| **KPI Cards** | Live, Figma | **Keep Current** (improve metrics) | 🟢🟡 | Solid; just pick better metrics. S/★★★ |
| **Match Score donut** | Live, Figma | **Keep Current** | 🟢 | Good; logic ⬛. S/★★★ |
| **Score Breakdown bars** | Live (buggy 0%), Figma | **Combine** (live bars + correct values) | 🟡 | Display bug, not design flaw. S/★★★ |
| **Trust Score** | data exists, minimal UI | **Build New** surfacing | 🟡 | Field unshown; high trust ROI. M/★★★ |
| **Verification Badges** | Figma; data flags exist | **Replace w/ Figma** | 🟡 | Adopt Figma design over existing data. M/★★★ |
| **Founder Identity** | Live(thin), Figma(rich) | **Combine** | 🟡 | Figma richness + live data. M/★★ |
| **Funding Progress** | Figma; data exists | **Replace w/ Figma** (Build New from data) | 🟡 | Urgency driver; not in live. M/★★★ |
| **Timelines** (Revision/Deal/Activity) | Live | **Keep Current** | 🟢 | Negotiation/audit backbone. ⬛ data |
| **Activity Feeds** (Session/ActivityFeed) | Live, Figma | **Keep Current** | 🟢 | Live session analytics solid |
| **Profile Completion** | Live only | **Keep Current** | 🟢 | Better than Figma; onboarding nudge |
| **Filters (chips)** | Live, Figma | **Combine** | 🟡 | Keep chips; add selected/clear states |
| **Search** | Figma only | **Build New** (adopt Figma) | 🟡 | Scales discovery; M/★★ |
| **Sort Controls** | implicit (thesis-rank) | **Build New** (light) | 🟦 | Optional explicit sort; S/★ |
| **Messaging components** | Live only | **Keep Current** (improve labels) | 🟢🟡 | Keep; fix names. S/★★ |
| **Comment / Private Notes** | Figma (data room) | **Build New** | 🟦 | Diligence notes; core-adjacent. M/★★ |
| **Document Viewer** | Figma only | **Build New** | ⬛/core | Diligence core; **separate track**. L/★★★ |
| **File Upload (signature)** | Live | **Keep Current** (UI polish) | 🟢 | Signing capability; ⬛ logic |
| **Drag & Drop Uploader** | onboarding/founder side | **Keep Current** | 🟢 | Where present; investor side minimal |
| **CTA: Make Offer** | Live only | **Keep Current** | 🟢 | Deal-creation entry; ≥ Figma |
| **CTA: Save / Share (opportunity)** | Live (dead) | **Remove or wire** | 🔴/🟡 | Dead today — wire or delete |
| **CTA: Dashboard "next steps"** | Live (self-links) | **Redesign** (repoint) | 🟡 | Repoint to Discovery/Deals |
| **`ProfileStatsCard`** | Live (unused import) | **Remove or render** | 🔴/🟡 | Built, never rendered |
| **Tables (general)** | only cap table | **Keep Current** | 🟢 | Only true table; well done |
| **Charts (match/capable donuts)** | Live | **Keep Current** | 🟢 | Add portfolio/sector donut (Build New) |

---

# D. Investor Workflow Preservation Matrix — ⬛ NEVER TOUCH the engine

These are business logic / state machines / gating. **No redesign may alter them.**

| Workflow / logic | Implementation | Class | Why untouchable |
|---|---|---|---|
| Discovery matching & scoring | `getOpportunities`, scoreBreakdown, matchRationale | ⬛ | Determines the entire funnel ranking |
| NDA gating | `acceptNda` + `enabled`/null-companyId gating | ⬛ | Legal + diligence access control |
| Diligence/data-room access | session + diligence-progress gating | ⬛ | Controls confidential exposure |
| Offer state machine | create / counter / accept / reject / viewed / close | ⬛ | The deal lifecycle itself |
| Term-sheet derivation | `deriveDealStage`, `buildActivityFeed` | ⬛ | Drives stage + timeline truth |
| Signing & completion | `signTermSheet` (multipart), `closeDeal`, signature records | ⬛ | Legal close; audit integrity |
| Auth / role routing | `AuthProvider` (/auth/me), `AuthGuard`, role map | ⬛ | Security boundary; role correctness |
| Realtime deal updates | `useDealRealtime` / SignalR | ⬛ | Live negotiation sync |
| API contracts | all `api-investor-*`, `api-deals` endpoints | ⬛ | Backend coupling; do not rename/reshape |

**Ruling:** presentation work wraps these; it never reaches into them. Every "improve" surfaces their *output* differently — it never changes their behavior.

---

# E. Investor Trust System Audit
Trust is the highest-leverage lever and is mostly *unshown existing data*.
| Trust signal | State | Verdict |
|---|---|---|
| Verification badges (identity/finance/accredited) | data flags exist, not surfaced | 🟡 Replace-w/-Figma — **Must** |
| Trust Score /100 | field exists, minimal | 🟡 Build-New surfacing — **Must** |
| "N committed · round closing {date}" | Figma; data derivable | 🟡 — **High ROI** |
| Data-room integrity ("watermarked · monitored · NDA on file") | Figma | 🔵 — **High ROI** |
| Signature / revision audit trail | live (timelines) | 🟢 Keep — **Must preserve** |
| Provenance labels (self-reported vs verified, "as of {date}") | absent | 🟡 — **Nice** |
| Professionalism-by-subtraction: fix Score 0%, "Unknown founder", "1 of 0", dead buttons | live defects | 🔴/🟡 — **Must** |

# F. Investor Conversion Audit
| Conversion lever | State | Verdict |
|---|---|---|
| Recommended-action / round-closing nudge (Discovery) | Figma; data exists | 🟡 — **Must** |
| Make Offer prominence (Opportunity) | live | 🟢 Keep — **Must preserve** |
| Term-Sheet Builder reachable | **404 live** | 🟢 Restore — **Must (P0)** |
| Dashboard "Your move" action band | dead self-links today | 🟡 Redesign — **Must** |
| Funding progress urgency | Figma; data exists | 🟡 — **High ROI** |
| Match rationale / Deal Score surfaced | data exists | 🟡 — **High ROI** |

# G. Investor Professionalism Audit
| Issue | Verdict |
|---|---|
| Score Breakdown 0% across all dims | 🔴 fix — **Must** |
| "Unknown founder" / "Entrepreneur · F4CC" | 🔴 fix — **Must** |
| "Documents reviewed 1 of 0" | 🔴 fix — **Must** |
| Dead Save/Share + self-link CTAs | 🔴 wire/remove — **Must** |
| Hardcoded Kanban palette (dark-mode unsafe) | 🟡 tokenize — **Nice** |
| Currency $↔€ inconsistency | 🟡 normalize — **Nice** |
| Upsell outranking work surfaces | 🟡 demote — **Nice** |

# H. Investor Enterprise-grade UX Audit
| Dimension | State | Verdict |
|---|---|---|
| IA / funnel-ordered nav | alphabetical-ish | 🟡 reorder — **High ROI** |
| Screen hierarchy (primary action dominant) | inconsistent | 🟡 — **High ROI** |
| Global trust strip (consistent header chip) | absent | 🟡 — **High ROI** |
| Data viz quality (cap table, donuts) | strong | 🟢 Keep |
| Dark mode | live, no Figma | 🟢 Keep (audit Kanban colors) |
| Responsive | code-responsive; mobile nav drawer absent | 🟡 add drawer — **Nice** (core-light) |
| Empty/loading/error consistency | good except data-room empty + dashboard error-masking | 🟡 — **High ROI** |
| Accessibility (contrast, focus, dead buttons) | not fully audited | 🟡 dedicated pass — **Nice** |

---

# FINAL IMPLEMENTATION GUIDE
Every screen & component → **KEEP AS IS · KEEP BUT IMPROVE · REDESIGN · REMOVE.** (Logic always preserved.)

### KEEP AS IS (do not touch — already enterprise-grade / better than Figma)
- Cap Table donut + table · Match-score donut · Loading skeletons · Profile Edit form · Investment Thesis capture · Profile Completion card · Negotiation/Revision/Activity **timelines** · Session Activity feed · **Make Offer** CTA · Term-Sheet Builder structure (just restore reachability) · all ⬛ workflow logic, NDA gating, signature/close, auth guards, API contracts, realtime.

### KEEP BUT IMPROVE (surface existing data / polish — no logic change)
- **Dashboard** → Current Value + Net MOIC, real founder names, "Your move" action band.
- **Discovery** → insights rail + recommended-action, trust badge + % round-filled, search, chip states.
- **Opportunity** → fix Score 0%, surface funding progress + verification + Deal Score; founder identity; wire/remove Save&Share.
- **Pipeline** → Portfolio Snapshot + AI nudge (stay read-only).
- **Portfolio** → MOIC/returns/sector mix.
- **Messages** → real names + deal context.
- **Negotiation** → offer-diff + whose-turn + closing checklist surfacing.
- **Public Profile** → track record + value-add.
- **Data-room empty state** → actionable Next-Steps.
- **Score Breakdown / Trust Score / Verification / Funding Progress** components → surface (Replace-w/-Figma / Build-New from existing data).
- **Notifications, Error states** → deep-link correctly; stop dashboard error-masking.

### REDESIGN (UI only — logic frozen)
- **Data Room shell** (re-lay-out + Next-Steps; document viewer/AI = separate **core** track, not "presentation").
- **NDA accept/sign modal** (adopt Figma signature/watermark polish; gating untouched).

### REMOVE (dead code only — zero live capability lost)
- `/dashboard/investor/phase-1` (orphaned shim) · `/dashboard/investor/phase-5` (dead, 404 endpoint).
- Dead **Save/Share** buttons (or wire) · dashboard **self-link CTAs** (repoint) · unused **`ProfileStatsCard`** import · orphaned `counterpartyRole` util · dead dashboard data path (`useInvestorPortfolio/Settings`, dashboard `useInvestorProfile`).
- "Documents reviewed 1 of 0" placeholder logic display.

### NEVER TOUCH (restated for the record)
Discovery scoring · NDA gating · data-room access control · offer state machine (create/counter/accept/reject/close) · term-sheet derivation · signing & completion · auth/role routing · realtime sync · all investor/deals API contracts.

---

## Authority sign-off
- **Principal Product Designer:** the live product is closer to "best-in-class" than to "needs-rebuild" — preserve aggressively, redesign only the Data-Room shell and NDA modal, improve everywhere by *surfacing* data.
- **Principal UX Architect:** one hierarchy law + funnel IA + a global trust strip resolve most clarity gaps without touching a single workflow.
- **VC-Platform Expert:** the negotiation/term-sheet/signing spine is the moat — freeze its logic, restore the 404'd builder, and surface trust + momentum (verification, funding progress, MOIC) to convert.
- **Senior SaaS Reviewer:** professionalism defects (0% scores, "Unknown founder", dead buttons) are the fastest enterprise-credibility wins; the dead routes are safe deletions. Nothing here removes capability, logic, or workflow.

**Final ruling:** *Preserve the engine and the strong components, redesign only two shells, improve by exposing data the system already has, and remove only what is provably dead. The best investor experience here is the current product — de-bugged, trust-surfaced, and re-prioritized — not a redesign.*
