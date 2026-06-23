# Investor Screens — Figma vs Code vs Live (three-way), judged by business value

**Date:** 2026-06-23
**Lens (per request):** *not* visual parity. Every call is judged by impact on **(1) investor conversion · (2) deal creation · (3) negotiation success · (4) founder-investor communication · (5) product clarity.**
**Constraint:** keep the core product unchanged; recommendations are **presentation-layer only** (copy, layout, surfacing existing data, routing, states) — never new backend capability.
**Sources:** Figma `5oHxoppTAyS4zb2DfUdYwy`; code audit + live captures from this session.

---

## A. Three-way presence matrix

✅ = exists / ⚠️ = exists but shell/partial / ❌ = absent (or unreachable).

| # | Investor screen | Figma | Code | Live | Classification |
|---|---|:---:|:---:|:---:|---|
| 1 | Investments Dashboard | ✅ | ✅ | ✅ | **All three** |
| 2 | Discovery Feed | ✅ | ✅ | ✅ | **All three** |
| 3 | Opportunity Detail (+ Overview/Traction/Cap Table/Team/Documents) | ✅ | ✅ | ✅ | **All three** |
| 4 | NDA accept / sign modal | ✅ | ✅ | ✅ | **All three** |
| 5 | Data Room | ✅ (full viewer) | ⚠️ (shell) | ⚠️ (empty shell) | **All three — but Figma ≫ Code/Live** |
| 6 | Investment Thesis wizard | ✅ | ✅ | ✅ | **All three** |
| 7 | Public Profile | ✅ | ✅ | ✅ | **All three** |
| 8 | Profile Edit | ✅ | ✅ | ✅ | **All three** |
| 9 | Pipeline (Kanban + portfolio) | ✅ | ✅ | ✅ | **All three** |
| 10 | Term Sheet (read-only) | ✅ (preview) | ✅ | ❌ (404) | **Figma + Code, not Live** |
| 11 | Term Sheet Builder (send offer) | ✅ | ✅ | ❌ (404) | **Figma + Code, not Live** |
| 12 | Deals / Negotiation workspace | ❌ | ✅ | ✅ | **Code + Live, not Figma** |
| 13 | Messages | ❌ | ✅ | ✅ | **Code + Live, not Figma** |
| 14 | Dark mode (all screens) | ❌ | ✅ | ✅ | **Code + Live, not Figma** |
| 15 | Investment Declaration flow (Phase 2) | ✅ | ❌ | ❌ | **Figma only** |
| 16 | Investor Settings page | ✅ | ❌ | ❌ | **Figma only** |
| 17 | Portfolio Performance chart (dashboard) | ✅ | ❌ | ❌ | **Figma only** |
| 18 | `phase-1` onboarding shim | ❌ | ✅ | ⚠️ (orphaned URL) | **Code only (dead)** |
| 19 | `phase-5` "Deal Discovery" | ❌ | ✅ | ❌ (404 endpoint) | **Code only (dead)** |

**"Live only" = none.** Everything live is generated from code, so there is no live-only screen by construction. The meaningful splits are *Figma+Code-not-Live* (term sheet, stale build), *Code+Live-not-Figma* (negotiation, messages, dark mode), and *Figma-only* (declaration, settings, portfolio chart).

---

## B. Mismatch verdicts — which version wins, why, business value, action

Ordered by impact on the five goals (highest first). Each is a **presentation-layer** call unless explicitly flagged as core.

### 1. Term Sheet + Builder — *Figma + Code, NOT Live* → **KEEP (restore)**  ⭐ top priority
- **Better:** Code (it already matches Figma's 3-step builder with live "Non-Binding Term Sheet" preview). Live is simply broken (404 — stale build).
- **Why:** This is the **offer-authoring funnel**. In the running product an investor literally cannot reach "Build & Send Term Sheet."
- **Business value:** Directly gates **deal creation (2)** and **negotiation success (3)** — it's the moment an investor turns interest into a binding action. Broken = the funnel dead-ends after diligence.
- **Action:** **KEEP** the built UI; the fix is operational — rebuild the frontend + restart so the route serves. No design or product change needed. *Highest ROI of anything in this report.*

### 2. Discovery Feed — *All three; Figma richer* → **IMPROVE (surface what already exists)**
- **Better:** Figma — its **"All Insights" rail** (thesis-alignment, match donut, **score breakdown**, and a **"Recommended Action: send EOI before the round closes — 68% filled"** nudge). Live cards are cleaner but inert.
- **Why:** The insights rail answers *"why act, and why now"* at the point of decision. The score data **already exists** in code (it powers the detail page) — surfacing it on the feed is presentation-only.
- **Business value:** The "recommended action / round-closing" nudge is a **conversion (1)** and **deal-creation (2)** engine — scarcity + a next step. High value, low build cost.
- **Action:** **IMPROVE** — add a right-rail (or per-card) "why matched / send EOI" nudge reusing existing score + round data. *(Skip image thumbnails — pure visual, no goal impact.)*

### 3. Opportunity Detail — *All three; mixed* → **IMPROVE live; KEEP its Make-Offer edge**
- **Better:** Split. **Live is better** for deal creation (it has a **Make Offer** CTA + clean financial KPIs that Figma lacks). **Figma is better** for trust: founder identity, **verification badges**, **Funding Progress ("69%, round closes May 20, 8 committed")**, **"Why this deal?" AI** rationale.
- **Why:** Verification + funding-progress build the confidence and urgency that move an investor from "reading" to "offering." The **Score Breakdown showing 0% across all 9 dimensions** (live bug) actively *destroys* trust in the matching engine.
- **Business value:** Fixing 0% and adding funding-progress/verification serve **conversion (1)**, **deal creation (2)**, and **product clarity (5)**; keeping Make Offer serves **(2)**.
- **Action:** **IMPROVE** — (a) fix the Score Breakdown 0% display bug [clarity/trust]; (b) surface **Funding Progress** + **verification** (data exists: trustScore, ndaRequired, valuations); (c) wire or remove the **dead Save/Share** buttons. **KEEP** Make Offer.

### 4. Data Room — *All three; Figma ≫ live* → **IMPROVE presentation; viewer itself is CORE (out of scope)**
- **Better:** Figma (full watermarked viewer + doc tree + **Next-Steps: Add to Pipeline / Request Meeting / Create Term Sheet** + private notes). Live is an empty shell.
- **Why:** Diligence is where deals are won or abandoned. But the **document viewer is a core capability**, not presentation — building it is explicitly outside the "presentation-only" remit.
- **Business value:** The **Next-Steps action panel** (presentation layer over existing pipeline/term-sheet actions) converts a passive reading session into **deal creation (2)** + **negotiation (3)**.
- **Action:** **IMPROVE (presentation only)** — add the **Next-Steps action panel** and a stronger empty-state CTA ("Documents will appear here — meanwhile, add to pipeline / message the founder"). **Flag** the viewer/AI-analysis as core backend work for a separate track.

### 5. Pipeline — *All three; Figma richer* → **IMPROVE selectively; deliberately DON'T copy drag-drop**
- **Better:** Mixed. Figma adds an **"AI Nudge" ("founders reply in 48-72h — send a follow-up")**, a **Portfolio Snapshot** (holdings + sector donut + performance), and **drag-and-drop**.
- **Why this is nuanced:** Pipeline stages here are **derived from real deal state** (NDA signed → data room → negotiation). **Drag-and-drop would let an investor fake a stage that doesn't match reality — that *reduces* product clarity (5).** So the live **read-only** board is arguably *better* for clarity than Figma's draggable one.
- **Business value:** The AI Nudge serves **negotiation success (3)** + **founder-investor communication (4)**; the Portfolio Snapshot serves retention/**clarity (5)**.
- **Action:** **IMPROVE** — add the AI-Nudge prompt and Portfolio Snapshot (reusing existing deal/portfolio data). **KEEP read-only** (do **not** add drag-and-drop — it would misrepresent the automated lifecycle). *Move the hardcoded column colors to theme tokens (dark-mode safety).*

### 6. Deals / Negotiation — *Code + Live, NOT Figma* → **KEEP (better than Figma)**
- **Better:** Code/Live — Figma never designed a negotiation inbox. Live has offer terms, revision timeline, status, counter/accept/reject/sign.
- **Why:** This **is** negotiation. It's the operational heart of turning a term sheet into a closed deal.
- **Business value:** Direct **negotiation success (3)**, **deal creation (2)**, **founder-investor communication (4)**.
- **Action:** **KEEP.** Optional presentation **IMPROVE**: clearer current-turn/offer-diff emphasis so each side instantly sees "what changed / whose move it is."

### 7. Messages — *Code + Live, NOT Figma* → **KEEP; IMPROVE labels**
- **Better:** Code/Live (Figma has no messaging).
- **Why / issue:** Conversations read **"Entrepreneur · F4CC / 03DE"** — generic role + hash, not founder/company names.
- **Business value:** Messaging is pure **founder-investor communication (4)**; opaque labels undercut it and hurt **clarity (5)**.
- **Action:** **KEEP; IMPROVE** — render founder/company name + avatar (data exists in the deal/opportunity records). Presentation-only.

### 8. Investments Dashboard — *All three; mixed* → **IMPROVE (fix data display); chart optional**
- **Better:** Mostly a tie on structure; **Figma adds a Portfolio Performance chart + Stakeholders panel.** Live has the right KPIs but shows **"by Unknown founder," ROI 0.0%, and two CTAs that self-link to the same page.**
- **Why:** First-impression clarity. "Unknown founder" + dead buttons read as broken; that erodes trust on the landing screen.
- **Business value:** **Clarity (5)** + **communication (4)** (founder names) + **conversion (1)** (CTAs should route to Discovery/Pipeline, not nowhere).
- **Action:** **IMPROVE** — fix founder-name resolution + ROI display [clarity]; point the "Recommended next steps" CTAs at Discovery/Pipeline [conversion]. **Optional:** add the Portfolio Performance chart (retention; lower priority than the fixes).

### 9. Public Profile — *All three; Figma richer* → **IMPROVE; KEEP completion card**
- **Better:** Mixed. Figma adds **Value-Add, Portfolio Showcase, Social Proof / endorsements, verification.** Live adds a **Profile Completion checklist** Figma lacks.
- **Why:** The investor's public profile is what **founders** read when deciding whether to engage — social proof + track record drive two-sided trust.
- **Business value:** **Founder-investor communication (4)** + **conversion (1)** (a credible investor profile gets more founder replies).
- **Action:** **IMPROVE** — surface Value-Add + a lightweight Portfolio Showcase (data largely exists: sectors, completed deals, exits). **KEEP** the completion checklist (good onboarding nudge). *Render or remove the built-but-unused `ProfileStatsCard`.*

### 10. Investment Thesis — *All three; live arguably better* → **KEEP live**
- **Better:** **Live** for the goals — it captures **check size, geographies, stages, sectors** (concrete, *matchable* criteria) where Figma's step 1 is a soft MOIC slider.
- **Why:** Better thesis inputs → better matches → more relevant deals surfaced.
- **Business value:** **Deal creation (2)** + **conversion (1)** via match quality.
- **Action:** **KEEP** live structure. Minor **IMPROVE**: optionally add the MOIC target field; switch the progress bar to a labeled stepper for clarity. Low priority.

### 11. Figma-only screens → mostly **DON'T BUILD**
- **Investment Declaration flow (Phase 2):** superseded by the live **Thesis** wizard, which is the cleaner realization. **Action: skip** (no value in duplicating).
- **Investor Settings page:** not conversion-critical; only build if notification/visibility prefs become needed. **Action: defer.**
- **Portfolio Performance chart:** the one Figma-only piece worth borrowing — see Dashboard #8 (retention/clarity, optional).

### 12. Code-only dead screens → **REMOVE**
- **`phase-5`** ("Deal Discovery", calls a non-existent endpoint → 404) and **`phase-1`** (orphaned onboarding shim). Not in Figma, not usefully live.
- **Business value of removal:** **product clarity (5)** + reduced maintenance/attack surface; eliminates a route that 404s if hit.
- **Action:** **REMOVE** (dead-route cleanup; already flagged in the code audit).

---

## C. Prioritized presentation-layer plan (ranked by goal impact)

| Pri | Change | Type | Goals served |
|---|---|---|---|
| **P0** | Rebuild + restart frontend so **Term Sheet / Builder stop 404-ing** | restore | deal creation, negotiation |
| **P0** | Fix **Opportunity Score Breakdown 0%** display | bug/clarity | conversion, clarity |
| **P0** | Resolve **founder & conversation names** ("Unknown founder", "Entrepreneur · F4CC") | bug/clarity | communication, clarity |
| **P1** | Discovery **"why matched + send EOI / round-closing" nudge** (reuse existing scores) | surface | conversion, deal creation |
| **P1** | Opportunity **Funding Progress + verification** surfacing; wire/remove **Save/Share** | surface | conversion, trust |
| **P1** | Data Room **Next-Steps action panel** + better empty state | surface | deal creation, negotiation |
| **P1** | Dashboard CTAs → route to **Discovery/Pipeline** (not self-links) | routing | conversion |
| **P2** | Pipeline **AI Nudge + Portfolio Snapshot** (keep board read-only) | surface | negotiation, communication, clarity |
| **P2** | Negotiation **offer-diff / whose-turn** emphasis | layout | negotiation |
| **P2** | Public Profile **Value-Add + Portfolio Showcase** | surface | communication, conversion |
| **P3** | Move Kanban colors to **theme tokens**; **remove** dead `phase-1`/`phase-5` | cleanup | clarity |
| **P3** | Optional: dashboard **Portfolio Performance chart**; thesis MOIC field/stepper | enhance | retention, clarity |

## D. Explicitly DO NOT do (protect the core / avoid anti-value changes)

- **Don't add drag-and-drop to Pipeline** — stages are system-derived; manual drag would misrepresent real deal state and *reduce* clarity.
- **Don't build the Phase-2 Investment Declaration flow** — Thesis already covers it better; duplication adds confusion.
- **Don't rebuild the Data Room document viewer as a "presentation" task** — it's core capability; scope it separately.
- **Don't chase pixel parity** (image thumbnails, exact stepper styling, $→€ cosmetics) — no measurable impact on the five goals.
- **Don't rename the `Entrepreneur` role or touch ownership models** — keep core unchanged (see the terminology decision doc).

---

### Bottom line
The **live product is functionally ahead of Figma where it counts** (negotiation, messaging, Make-Offer, dark mode) and **behind only on conversion-nudging and trust-surfacing** (discovery insights, funding progress, verification, data-room next-steps) — plus three outright defects (term-sheet 404, score 0%, unresolved names). Every recommendation above is presentation-layer and reuses data the system already has; none requires changing the core product.
