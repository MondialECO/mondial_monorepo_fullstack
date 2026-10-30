# Clarifier Topic Flow

**Status:** APPROVED 2026-10-31 — **implemented, live-AI browser verification pending** (OpenRouter credit). Not closed. See §5.
**Supersedes:** the 6 fixed questions described in older versions of [clarifier-phase2-guide.md](clarifier-phase2-guide.md).

---

## 1. Goal

The Creator describes the idea freely; the AI works out which topics are already covered and
asks only about what is missing or unclear. Three kinds of AI message:

1. **One fixed opener** — the only fixed question. It also counts as the Problem topic's base question.
2. **A base question per topic** — asked when a topic is empty; also the fallback when the AI fails.
3. **AI follow-ups** — only when a topic is unclear, **at most once per topic**.

Opener (EN / FR, frontend i18n, rendered locally, not stored):

> "Tell me your idea in your own words. However rough it is is fine."
> "Racontez-moi votre idée avec vos propres mots. Même si elle est encore brute, c'est parfait."

## 2. Topics

Source of truth: `ClarifierScript.Topics` (backend). The AI prompt is generated from it, so the
rule and the examples below can never drift apart from what the AI sees. Each example
satisfies its rule exactly as written.

**Calibration examples live only in `ClarifierScript.Topics`** (not copied here, so they cannot
drift). Every topic has one clear and one unclear one-line example from each of **six domains**,
plus **one French example** so the judgment bar does not shift with the language:

1. food / student app · 2. freelancer B2B tool · 3. tall-women jeans brand ·
4. local service (home maths tutoring) · 5. two-sided marketplace (second-hand textbooks between students) ·
6. social / eco impact (clothing repair)

`ClarifierScriptTests` enforces ≥6 distinct domains per topic, each with a clear and an unclear
example, and a French example per topic. Each unclear example fails its rule for a visible reason
(general state, broad category, no stated shortfall, form without a "what", no concrete edge,
missing why-now or risk).

| # | Topic (key) | Clear when | Base question (EN) |
|---|---|---|---|
| 1 | The problem (`problem`) | A specific, concrete problem (not a general state such as being hungry or busy), and it is clear why it hurts — stated or obvious from the problem itself | *(the opener)* |
| 2 | Who has it (`who`) | A specific group, narrower than "students", "people" or "everyone" | "Who has this problem the most?" |
| 3 | What they use now (`alternatives`) | At least one real thing they do or use today AND the reason it falls short is **stated in words**. "Nothing" counts only with a reason | "What do they do about it today?" |
| 4 | Your solution (`solution`) | What the Creator will build AND its form (app, website, service, physical product, or another concrete form) | "What do you want to build?" |
| 5 | Your edge (`edge`) | Something concrete that makes it different/better, OR a concrete advantage the Creator has | "Why would people pick yours, and why are you the right person to build it?" |
| 6 | Why now + biggest risk (`whyNowRisk`) | **Both** a concrete reason the timing is right AND one specific thing that could go wrong | "Why is now a good time? And what's the one thing that could go wrong?" |

Prompt size (measured from the generated prompt, ≈4 characters per token): system prompt
5,854 → 7,843 characters (≈1,460 → ≈1,960 tokens, +34%); a typical whole turn ≈1,680 → ≈2,180
tokens. The extra ~500 input tokens add a negligible prefill cost next to the 5–25 s spent on the
model's output, so no trimming was needed.

Rule calibration notes (amendment 4 — every topic checked):
- **Problem** allows an *obvious* harm, so "can't find cheap healthy food" is clear — but a general state is not a problem, so "Students are hungry" is unclear.
- **What they use now** requires the shortfall *stated*, so "Eat junk." / "Excel." are unclear (matches the plan's example).
- **Solution** was relaxed to "what + form", so "I want to make a meal-sharing app" is clear (matches the plan's example); "An app." has a form but no "what".

### Chips

Chips come **only** from the AI, written for the Creator's own idea (the prompt forbids generic
chips or chips copied from the examples). Only for `who` and `solution` follow-ups. If the AI
returns none — or the AI is unavailable — **no chips are shown**; there are no fallback chips
anywhere in the code. The plan's illustrative chips ("dorm students / part-time workers /
international students") exist only in this doc and as fake AI output in unit tests.

Fixed-text fallbacks (base questions, fallback follow-ups, closing message) exist in **EN and FR in
the backend**, because AI replies are stored in the transcript and the backend writes them when
the AI fails. Language: detected language if en/fr, else the UI language.

### Ask order

Among topics that are empty or unclear: **problem → who → solution → what they use now → edge → why now/risk**.
The panel shows topics in the same order (D3).

### Example (verified against the live AI, 2026-10-31)

```
AI:      Tell me your idea…
Creator: Dorm students can't find cheap healthy food, I want to make a meal-sharing app.
         → Problem ✓  Who ✓  Solution ✓
AI:      Eating well on a student budget in dorms is definitely a real challenge.
         What do they currently do or use to handle meals today, and where does that fall short?
Creator: Eat junk.                                  → unclear → follow-up
AI:      …They turn to junk food today, but what specifically makes that fall short for them?
Creator: Uber Eats is too expensive for them and the canteen closes at 8pm.   → ✓
AI:      …Why would students pick your app over other options, and why are you the right person to build it?
```

Turns: typically 5–9; **maximum 12** (opener + Problem follow-up + 5 base questions + 5 follow-ups).

---

## 3. Decisions

| # | Decision | Outcome |
|---|---|---|
| D1 | Still unclear after the one follow-up | **Approved:** accepted as **weak**; the flow moves on. |
| D2 | Later messages and earlier topics | **Amended & approved:** a later message may fill topics that are **empty, unclear or weak**, and may upgrade **weak → clear**. Only a **clear** topic is locked and changes only through Edit. Weak is never downgraded. |
| D3 | Panel order | **Approved:** same as the ask order; internal record numbers unchanged. |
| D4 | AI fails | **Approved:** the whole message goes to the asked topic as **weak** (the opener → Problem); next comes the next empty topic's base question. A later AI turn can still upgrade it (D2). |
| D5 | Opener half-covers a topic | **Approved, refined by amendment 6:** empty → base question; unclear → follow-up; still unclear → weak. The opener **is** Problem's base question: if it says nothing usable about the problem, Problem is unclear and gets its one follow-up — never a separate base question. |
| D6 | Topic 6 with parts missing | **Confirmed 2026-10-31:** one follow-up asks for all missing parts; anything still missing → weak. |
| D7 | Who writes base questions when the AI works | **Confirmed 2026-10-31:** the AI rephrases the base question in the Creator's language (`nextBase`); the EN/FR text is the fallback. Accepted risk: a Creator writing in another language gets EN/FR text when the AI fails. |
| D8 | Calibration conflict | **Resolved by amendment 4:** Solution relaxed to "what + form"; every topic's examples checked against its rule (§2). |

### Amendments (2026-10-31)

| # | Amendment | Implementation |
|---|---|---|
| A3 | Four panel states: empty / unclear / weak / clear; weak never a plain ✓ | `ClarifierStepList`: clear = green ✓; weak = dashed amber ring + amber ✓ + amber "Thin answer" caption; unclear = amber number + "Needs a little more detail"; empty = grey number. |
| A5 | AI input each turn = per-topic state + full transcript | `ClarifierTopicsInput` carries all six topic states (with current fields) and every earlier message, plus the latest message. |
| A6 | Opener counts as Problem's base question | `AskOrder` starts with Problem; the opener turn's asked topic is Problem. |
| A7 | One `UpdateOneAsync`, targeted `$set`, version check kept | `SaveClarifierTurnAsync`: one `UpdateOne` = `$set Phase2Data.ClarifierAnswers` (status, extracted, follow-up flags) + `$push` reply, with the optimistic version filter. Never a replace. |
| A8 | Weak stays weak through C-2 to Phase 3 | Frontend sends `rawIdea.unconfirmedFields`; the C-2 prompt labels those inputs `[THIN ANSWER — unconfirmed]`; the stored C-2 output gets `unconfirmedInputs` + `unconfirmedInputsNote`, which MarketStudy / BusinessModel / BusinessPlan already read as part of the clarifier output. |

---

## 4. Implementation map

**Backend**
- `Services/Implementations/ClarifierScript.cs` — topics, rules, examples, EN/FR texts, ask order, `ApplyTopicsTurn`, `NextTopic`, edits.
- `Services/Ai/ClarifierTurnService.cs` — prompt generated from the topics; parses per-topic status, extraction, follow-up, chips, `nextBase`. Token limit configurable via `Ai:OutputTokenLimits:ClarifierTurn` (default 3000).
- `Services/Implementations/ClarifierChatTurnRunner.cs` — one turn for HTTP and the hub; response `{ messages, doneCount, totalTopics, summaryReady, currentTopic, aiUsed, answers, aiText, chips }`.
- `Models/DatabaseModels/CreatorJourney.cs` — `ClarifierAnswer.FollowUpUsed`, `CreatorChatMessage.Chips`.
- `Controllers/CreatorPhase2Controller.cs` — answer edit re-judged by the same topic rules (applied only when clear).
- `Controllers/ClarifierController.cs`, `Models/Dtos/Ai/StartClarifierRequest.cs`, `Services/Ai/Jobs/IdeaClarifierHandler.cs` — unconfirmed flags (A8).
- Tests: `ClarifierScriptTests`, `ClarifierTurnServiceTests` (rewritten).

**Frontend**
- `src/lib/clarifier-answers.ts` — topic naming, `topicState`, `nextTopic`, ask order, `unconfirmedFields` in `buildRawIdea`.
- `src/components/creator/clarifier/ClarifierStepList.tsx` — four states, ask order.
- `src/app/dashboard/creator/phase-2/clarifier/page.tsx` — chips above the input (tap fills the input), topic progress.
- `src/locales/{en,fr}/creator.json` — opener, topic labels, states, chips label.

---

## 5. Verification (2026-10-31)

| Check | Result |
|---|---|
| Backend unit tests (`ClarifierScriptTests`, `ClarifierTurnServiceTests`, related) | ✅ all pass |
| Live AI, alternating HTTP / hub | ✅ opener cleared 3 topics; "Eat junk." → follow-up; next answer → clear; correct ask order and extraction |
| AI unavailable (fail-open), HTTP + hub | ✅ asked topic → weak; next base question; closing at the end |
| Browser (Playwright, 1440px): hub socket, no console errors, panel order, weak styling, light + dark | ✅ |
| Browser with live AI: clear / unclear / chips states | ⏳ **Blocked** — OpenRouter key out of credit (402, ≈1,189 tokens affordable). Re-run after a top-up. |
| C-2 summary with `unconfirmedInputs` end to end | ⏳ Not run (same credit block). |

The four previously failing `ClarifierControllerIntegrationTests` are fixed (commit `0e9ad8ba`):
the tests now create an owned idea, as the controller has intentionally required since `c4295156`.

### Closing verification (live AI, browser) — required before this doc is marked closed

- [ ] Clear, unclear and chips: chips render and tapping one fills the input; chips are specific to the idea.
- [ ] At least **2 ideas from different domains** (not only meal-sharing); for each, one thin answer written for that idea is marked **unclear**, not clear.
- [ ] At least **2 ideas from the newer domains** (local service, two-sided marketplace, social/eco impact); for each, a thin answer written for that idea is marked **unclear**, not clear.
- [ ] Calibration: "Students are hungry" as the Problem is **not** clear.
- [ ] Edit a clear topic, including the two-field topics (Your edge, Why now + biggest risk); the edit persists and later AI turns do not overwrite it.
- [ ] Weak path end to end, on rendered screens: weak topic in the panel → amber "Unconfirmed — thin answer" tag on idea-summary → banner on Market Study, Business Model and Business Plan → "Fix it" → accepted edit → back on idea-summary the tag is gone, and the banner is gone on all three Phase 3 screens. Includes a two-field topic (Your edge or Why now + biggest risk).
- [ ] Stale summary: after Fix it (or any answer edit after the summary), idea-summary shows "answers changed since the last summary" + "Regenerate summary (N credits)"; nothing regenerates until clicked; after regenerating the notice is gone. The Revisit button is visible and opens the clarifier.
- [ ] Stale Phase 3 after a new C-2: Market Study and Business Plan show "Built on an older version" + Regenerate (price from credits API); regenerating builds from the new C-2 and the notice disappears; earlier versions are still in the history.
- [ ] Chain: regenerate Market Study → Business Model shows the stale notice; regenerating Business Model clears it.
- [ ] Weak-topic edit routing: the side-panel pencil on a weak topic opens the AI rewrite (not the field editor); on a clear topic it opens the field editor (both fields for Your edge / Why now + biggest risk).
- [ ] One full run in French: AI follow-ups in French; fallback base questions in French.
- [ ] Light and dark themes at 1440 and 1920 widths.

### Known gaps (recorded, not implemented)

- **Business Plan staleness covers only C-2.** `BusinessPlanHandler` (Prepare, HEAD) also consumes,
  none of which drive `upstreamStale` yet:
  - the canonical **Idea Core** (`CreatorIdea.Project`, marked "authoritative") — also changed by
    project edits outside the clarifier (name, tagline, category);
  - **Market Study** current version (`Phase3Data.MarketStudySessionId`);
  - **Business Model** current version (`Phase3Data.BusinessModelSessionId`);
  - **Financial Forecast** current version (`Phase3Data.ForecastSessionId`);
  - **Formation & team** (`Phase3Data.FormationGenerator`: entity type, skills, roles needed);
  - **Legal assessment** summary (`Phase3Data.LegalAssessment`: planning readiness, applicable count);
  - the C-2 output itself (supporting context) — the only input covered today.
- **Business Plan single-section rewrite** (`POST rewrite-section`) still reads the session's original
  C-2 (`BusinessPlanController.RewriteSection` → `session.ClarifierSessionId`), so a rewrite after a
  new summary uses the old C-2. It is not a regenerate, so it was left out of the stale-content repair.

### Stale downstream content and edit routing (2026-10-31, defect repair)

- **Idea-summary:** when an answer changed after the last summary (`summaryIsStale`, the same rule
  as the clarifier CTA), it shows the existing "answers changed" copy with
  "Regenerate summary (N credits)". The click opens the clarifier with `?regenerate=1`, which starts
  the C-2 regenerate once, only if still stale. The documented Revisit button is now rendered.
- **Phase 3 versions record their source** (`BuiltFromClarifierSessionId`; for Business Model also
  `BuiltFromMarketStudySessionId` + `BuiltFromMarketStudyVersion`). Manual edits and section
  rewrites inherit the current version's source. History stays append-only (newest-last).
- **Stale signal (`upstreamStale` on GET):** Market Study / Business Plan — built-from C-2 ≠ the
  idea's current C-2. Business Model — built-from market study session or version ≠ the idea's
  current market study (so regenerating Market Study makes Business Model stale). Legacy versions
  fall back to the session reference / timestamps. UI: quiet "Built on an older version" notice +
  Regenerate (price from `/api/ai/credits`); nothing runs automatically.
- **Regenerate uses the current upstream:** current C-2 for Market Study and Business Plan; current
  market study (and its version) for Business Model. Business Plan's single-section rewrite is
  unchanged (it is not a regenerate).
- **Edit routing:** a weak topic is edited only through the AI-verified rewrite (side-panel pencil =
  "Fix it"); clear topics keep the field-only edit.
- Tests: `Phase3UpstreamStalenessTests` (rules, per-screen GET, regenerate input per screen),
  `phase3-stale-upstream-notice.test.tsx`, `clarifier-step-list-edit-routing.test.tsx`.

### Unconfirmed marker in the UI (2026-10-31)

- **Single source of truth:** the UI reads the live per-topic status (`weakTopics(phase2.clarifierAnswers)`);
  nothing is saved at finalize. An edit that turns a weak topic clear removes every marker with no
  sync step. C-2 keeps its own prompt/output snapshot (`unconfirmedFields` / `unconfirmedInputs`)
  for the AI only.
- **Idea-summary:** amber tag + "Fix it" on cards that come from one topic — Target user (2),
  Core problem (1), Your solution (4), Your edge (5). Concept and Market gap are C-2 syntheses, so
  they get no tag. Weak topics without a card — What they use now (3), Why now + biggest risk (6) —
  get their own tagged row. "Fix it" opens `clarifier?fix=<topic>` straight into that topic's
  AI-judged edit (field-only edits don't change status, so they can't clear the marker); an
  accepted edit returns to idea-summary.
- **Phase 3 (audit):** C-2 consumers are **Market Study** (passes `clarifierSessionId`),
  **Business Model** (clarifier session taken from the market study) and **Business Plan** (passes
  `clarifierSessionId`). Not consumers: Forecast, Compliance, Formation, the Phase 3 hub, Complete.
  The three consumers show one quiet banner ("N of your answers were thin… Review them" →
  idea-summary) when at least one topic is weak; nothing otherwise. No per-field tags. Phase 1
  untouched.
- Never blocks progress. Theme tokens only (`--dr-bg-yellow`, `--dr-yellow`, `--primary`, `--card`, `--border`).
- Verified now: component tests (`clarifier-unconfirmed-marker.test.tsx`: banner hidden at 0 weak,
  count + link, singular, weak → clear drops out, tag link incl. two-field topic 6), tsc, lint.
  **Not yet seen in a browser:** Phase 3 screens are phase-guarded until Phase 2 has a C-2 summary,
  and idea-summary needs one too — both need AI credit. Part of the closing checklist above.
