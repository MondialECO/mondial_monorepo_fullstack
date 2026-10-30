# Clarifier Topic Flow — Redesign Plan

**Status:** PROPOSED — not implemented. The live clarifier still asks 6 fixed questions
(see [clarifier-phase2-guide.md](clarifier-phase2-guide.md)).
**Date:** 2026-10-30
**Owner:** product (plan), engineering review below.

---

## 1. Goal

Replace the 6 fixed questions with an open conversation. The Creator describes the idea
freely, the AI works out which topics are already covered, and only asks about what is
missing or unclear. Target: fewer, more natural turns.

The flow has three kinds of AI message:

1. **One fixed opener** — the only fixed question.
2. **A base question per topic** — asked when a topic is empty; also the fallback when the AI fails.
3. **AI follow-ups** — only when an answer is unclear, at most once per topic.

### Opener

> "Tell me your idea in your own words. However rough it is is fine."

It is deliberately open so the first answer can cover several topics at once.

## 2. Topics

| # | Topic | Clear when | Base question | Follow-up example |
|---|---|---|---|---|
| 1 | The problem | A specific problem, and why it hurts | "What problem are you fixing?" | "What happens to them because of this problem?" |
| 2 | Who has it | A specific group — not "students" or "everyone" | "Who has this problem the most?" | "Which students exactly?" + chips: *dorm students / part-time workers / international students* |
| 3 | What they use now | At least one real method or app, and why it's not enough. "Nobody does anything" is fine if a reason is given | "What do they do about it today?" | "What's bad about that option?" |
| 4 | Your solution | What the Creator will build and how people would use it | "What do you want to build?" | "How would someone use it? An app, a website, a service?" + chips |
| 5 | Your edge | What's different from others, or the Creator's own advantage | "Why would people pick yours, and why are you the right person to build it?" | "Have you lived this problem, or know people who have?" |
| 6 | Why now + biggest risk | **Both** parts present | "Why is now a good time? And what's the one thing that could go wrong?" | Asks for whichever part is missing |

### Ask order

Among topics not yet clear: **problem → who → solution → what they use now → edge → why now/risk**.
Later topics only make sense once earlier ones are understood.

### Example

```
AI:      Tell me your idea…
Creator: Dorm students can't find cheap healthy food, I want to make a meal-sharing app.
         → Problem ✓  Who ✓  Solution ✓
AI:      What do they do about it today?
Creator: Eat junk.
         → unclear → follow-up
AI:      Why don't Uber Eats or the canteen work for them?
…
```

Typically 5–9 turns; **maximum 12** (opener + 5 base questions + 6 follow-ups) when the
opener covers nothing.

### Topic 6

One topic in the panel, but the AI extracts the two parts separately (`whyNow`,
`riskiestAssumption`). No ✓ unless both are present. Not split into 7 topics: the C-2
summary already maps these two fields, so a split adds no data and changes the panel.

### Language

- Follow-ups and chips are written by the AI in the language the Creator writes in.
- Opener: shown only in the UI (not stored) → frontend i18n, EN + FR.
- Base questions: needed EN + FR in **the backend too**, because AI replies are stored in
  the transcript and the backend writes the fallback text when the AI fails. Chosen from
  the request `language`.

---

## 3. Engineering review

### What stays

The 6 topics map one-to-one onto today's field groups, so the data model and everything
downstream are reused:

| Topic | Existing fields (record #) |
|---|---|
| Problem | `problem` (1) |
| Who | `targetUser` (2) |
| What they use now | `existingAlternatives` (3) |
| Solution | `solution` (4) |
| Edge | `creatorEdge`, `founderAdvantage` (5) |
| Why now + risk | `whyNow`, `riskiestAssumption` (6) |

Unchanged: `ClarifierAnswer` records (keyed 1–6), C-2 summary (`buildRawIdea`),
answer-edit API, legacy ideas, `ClarifierChatTurnRunner` and both transports (HTTP + hub).

### What changes

**Backend**
1. **AI prompt + JSON** (`Services/Ai/ClarifierTurnService.cs`). Today the AI judges one
   question. It must judge every topic from each message:
   `topics: { problem: { status: clear|unclear|empty, extracted: {…} }, … }, ack, followUp, chips[]`.
   Include 2–3 clear/unclear calibration examples per topic.
2. **Turn rules** (`ClarifierScript.ApplyTurn`). Replaces "revise the same question up to 5
   times" with: one message may fill several topics; one follow-up per topic; next topic
   by the ask order; empty → base question, unclear → follow-up.
3. **Per-topic "follow-up used" flag** on `ClarifierAnswer`.
4. **Opener turn** — the first message is not tied to a topic.
5. **Base questions EN/FR in the backend.**
6. **Rewrite `ClarifierScriptTests`** (built around the fixed-question rules).

**Frontend**

7. Opener text in i18n (EN/FR), still rendered locally (`OPENER_ID`).
8. **Chips** — new UI; clicking one fills the input.
9. **Side panel** (`ClarifierStepList`) — topic names and state: empty / unclear / ✓ / weak.
10. `clarifier-answers.ts` — rename question → topic; logic unchanged.

Estimate: ~4–5 backend files, ~4 frontend files, plus tests.

### Latency

Each turn now judges all 6 topics, so the AI response is larger than today's single
verdict (today 5–25s per turn). Total time should stay similar or drop, because turns go
from 6–30 down to 5–12.

---

## 4. Open decisions

Each has an engineering recommendation; confirm before implementation.

| # | Question | Recommendation |
|---|---|---|
| D1 | Still unclear after the one follow-up? | Accept as **weak** and move on (today's `accepted_weak`); the Creator is never stuck. |
| D2 | Can a later message update earlier topics? | It may fill **empty or unclear** topics; a ✓ topic changes only through Edit. |
| D3 | Panel order | Same as the ask order. Internal record numbers stay as they are. |
| D4 | AI fails — where does the message go? | Whole message into the topic that was asked, as weak (the opener → problem); then the next empty topic's base question. |
| D5 | Opener half-covers a topic | Counts as **unclear** → follow-up (uses that topic's one follow-up). Rule: empty → base, unclear → follow-up, still unclear → weak. |
| D6 | Topic 6 with both parts missing | One follow-up asks for **all** missing parts; anything still missing → weak (panel shows weak, not ✓). |
| D7 | Who writes base questions when the AI works? | The AI, in the Creator's language. The EN/FR text is only the fallback. Accepted risk: a Creator writing in another language (e.g. Bangla) gets EN/FR fallback text when the AI fails. |
| D8 | Calibration conflict | The example marks "meal-sharing app" as Solution ✓, but the rule requires *how people use it*. Either relax the rule ("what they'll build is enough") or mark the example unclear. The prompt examples must match the rule. |
