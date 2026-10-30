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

Each topic's examples span **three domains** so the AI is not anchored to one idea:
(A) food / students, (B) a freelancer B2B tool, (C) a fashion brand for tall women.
`ClarifierScriptTests` enforces ≥3 clear and ≥3 unclear examples per topic.

| # | Topic (key) | Clear when | Clear examples (A · B · C) | Unclear examples (A · B · C) | Base question (EN) |
|---|---|---|---|---|---|
| 1 | The problem (`problem`) | A specific, concrete problem (not a general state such as being hungry or busy), and it is clear why it hurts — stated or obvious from the problem itself | "Dorm students can't find cheap healthy food." · "Freelance designers wait 60+ days to get paid because chasing invoices by email feels awkward." · "Tall women can't find jeans long enough in regular stores, so they pay for tailoring or settle for a bad fit." | "Students are hungry." · "Freelancers have money problems." · "Clothes don't fit well." | *(the opener)* |
| 2 | Who has it (`who`) | A specific group, narrower than "students", "people" or "everyone" | "Dorm students." · "Freelance graphic designers who bill clients monthly." · "Women over 1.78 m who buy jeans online." | "Students." · "Small businesses." · "Everyone who wears clothes." | "Who has this problem the most?" |
| 3 | What they use now (`alternatives`) | At least one real thing they do or use today AND the reason it falls short is **stated in words**. "Nothing" counts only with a reason | "They order Uber Eats, but it's too expensive on a student budget." · "Spreadsheet reminders — they forget to follow up, and clients ignore plain emails." · "Nothing — tall-specific brands only ship from abroad and returns cost too much." | "Eat junk." · "Excel." · "Other brands." | "What do they do about it today?" |
| 4 | Your solution (`solution`) | What the Creator will build AND its form (app, website, service, physical product, or another concrete form) | "I want to make a meal-sharing app." · "A web tool that sends polite payment reminders from the freelancer's own email." · "A direct-to-consumer jeans brand sold online, with inseams up to 40 inches." | "Something to help them eat better." · "An app." · "Something for tall women." | "What do you want to build?" |
| 5 | Your edge (`edge`) | Something concrete that makes it different/better, OR a concrete advantage the Creator has | "Meals are cooked by students for students, so it's cheaper than delivery." · "I freelanced for eight years and already have 300 designers on my newsletter." · "I'm 1.85 m myself and worked as a pattern maker at a denim factory." | "It's better." · "We really care about freelancers." · "Our quality is great." | "Why would people pick yours, and why are you the right person to build it?" |
| 6 | Why now + biggest risk (`whyNowRisk`) | **Both** a concrete reason the timing is right AND one specific thing that could go wrong | "Food prices rose a lot this year; the biggest risk is students not trusting food cooked by strangers." · "Freelancing grew fast since remote work became normal; the biggest risk is clients finding automatic reminders pushy." · "Most jeans are now bought online; the biggest risk is getting the fit right without try-ons." | "Now is a good time." (neither part) · "Remote work is growing." (no risk) · "Returns might be expensive." (no why-now) | "Why is now a good time? And what's the one thing that could go wrong?" |

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
- [ ] Calibration: "Students are hungry" as the Problem is **not** clear.
- [ ] Edit a clear topic, including the two-field topics (Your edge, Why now + biggest risk); the edit persists and later AI turns do not overwrite it.
- [ ] Weak path end to end: weak in the panel → C-2 summary with its unconfirmed marker → marker **visible on the rendered Phase 3 screens** (not only in response data).
- [ ] One full run in French: AI follow-ups in French; fallback base questions in French.
- [ ] Light and dark themes at 1440 and 1920 widths.

**Open gap (blocks the weak-path check):** no screen renders the unconfirmed marker yet. Weak
topics are flagged in the C-2 input/prompt and in the stored C-2 output (`unconfirmedInputs`),
so Phase 3's AI generators see it, but the idea-summary page and the Phase 3 screens do not
display it. Needs a UI change before the closing verification.
