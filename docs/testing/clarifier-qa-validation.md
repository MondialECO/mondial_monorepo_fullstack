# Clarifier Real-time — QA Validation Report

**Feature:** Phase 2 clarifier chat over SignalR (`/hubs/clarifier`) with HTTP fallback
**Build / branch:** ____________  **Tester:** ____________  **Date:** ____________
**Scenarios:** [clarifier-websocket-integration.md](clarifier-websocket-integration.md) (IDs below match)

---

## Setup

1. Backend: `cd backend && dotnet run` → `http://localhost:5093`
2. Frontend: `npm run dev` → `http://localhost:3000`
3. Log in as a Creator with an idea in Phase 2. Open `/dashboard/creator/phase-2/clarifier`.
4. DevTools → Network → **WS** → select `hubs/clarifier` → **Messages** tab, to watch frames.
5. **To force HTTP:** DevTools → Network → right-click → *Block request URL* → `*hubs/clarifier*`, then reload.
6. **To check the database:** MongoDB `CreatorIdeas` → your idea → `Phase2Data.ClarifierAnswers`, `Phase2Data.ChatMessages`, `Version`.

Mark each row **P** (pass), **F** (fail) or **B** (blocked). Put details for every F in *Issues*.

---

## 1. Connection

| ID | Check | Result | Notes |
|---|---|---|---|
| 1.1 | Socket to `:5093/hubs/clarifier` opens (101); no console errors | | |
| 1.2 | Logged-out / expired token → 401 on negotiate; chat still works via HTTP | | |
| 1.3 | Leave and return to the page quickly → no "stopped during negotiation" error | | |
| 1.4 | Stop backend, restart → reconnects; sends during outage use HTTP | | |
| 1.5 | Idle 60s → socket still open | | |

## 2. Turn parity — run twice: hub ☐ and HTTP ☐

| ID | Check | Hub | HTTP | Notes |
|---|---|---|---|---|
| 2.1 | Opener covering problem/who/solution → all three ✓, next asks "what they use now" | | | |
| 2.2 | Vague answer → follow-up (chips for who/solution), topic shows "Needs a little more detail" | | | |
| 2.3 | Still vague after follow-up → weak ("Thin answer", never a plain ✓), moves on | | | |
| 2.4 | Empty message → "Message is required." | | | |
| 2.5 | > 4000 chars → length error | | | |
| 2.6 | Send after all topics done → "already covered" | | | |
| 2.7 | AI off / OpenRouter down → asked topic weak, next base question | | | |
| 2.8 | Refresh → transcript + answers identical to before | | | |

## 3. Streaming display (hub)

| ID | Check | Result | Notes |
|---|---|---|---|
| 3.1 | Typing indicator during AI wait, then word-by-word reply with cursor | | |
| 3.2 | Cursor disappears; no duplicate AI bubble afterwards | | |
| 3.3 | HTTP: reply appears at once | | |

**Timings (hub, 5 sends):**

| # | Send → first chunk (s) | Send → complete (s) | aiUsed |
|---|---|---|---|
| 1 | | | |
| 2 | | | |
| 3 | | | |
| 4 | | | |
| 5 | | | |

Expect roughly 5–25s to the first chunk (AI verdict time), plus about 20ms per word.

## 4. Optimistic concurrency

| ID | Check | Result | Notes |
|---|---|---|---|
| 4.1 | Two hub sends in a row both succeed | | |
| 4.2 | Hub send then HTTP answer-edit both succeed | | |
| 4.3 | Two tabs: second tab's send → "updated in another tab", bubble rolls back, draft restored | | |
| 4.4 | Hub call with someone else's ideaId → rejected, nothing written | | |
| 4.5 | Hub call with expectedVersion 0 → rejected | | |

4.4 and 4.5 need a manual invoke from the browser console or a test client.

## 5. Language

| ID | Check | Result | Notes |
|---|---|---|---|
| 5.1 | EN → English feedback | | |
| 5.2 | FR → French feedback | | |
| 5.3 | Same over HTTP | | |

## 6. Errors

| ID | Check | Result | Notes |
|---|---|---|---|
| 6.1 | Server error → readable message (no "HubException:" text), rollback, draft restored | | |
| 6.2 | Kill the connection mid-reply → error shown; refresh shows the saved turn | | |

---

## Summary

| | Count |
|---|---|
| Pass | |
| Fail | |
| Blocked | |

### Issues

| # | ID | What happened | Severity | Status |
|---|---|---|---|---|
| 1 | | | | |

### Decision

- [ ] Ready to ship
- [ ] Ship with listed fixes
- [ ] Needs rework

Sign-off — QA: ________ Date: ____  Product: ________ Date: ____
