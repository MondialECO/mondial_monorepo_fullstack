# Clarifier Real-time Integration Scenarios

**Updated:** 2026-10-30
**Scope:** Phase 2 clarifier chat turn over SignalR (`/hubs/clarifier`) and its HTTP fallback.
**Status:** Scenarios only — **no automated tests exist yet** for the hub or the turn runner.

Design reference: [implementation/clarifier-phase2-guide.md §6](../implementation/clarifier-phase2-guide.md).

---

## What is under test

Both transports run the same `ClarifierChatTurnRunner`:

```
persist user message → AI verdict (accept/revise) → ApplyTurn → persist answers + AI reply
```

The hub then replays the AI reply as `ReceiveChunk` events and sends
`MessageComplete { turn, ideaVersion }`. Most scenarios below are therefore
**transport parity** checks: the hub must behave exactly like
`POST /api/creator/journey/phase2/chat-message`.

---

## 1. Connection

| # | Scenario | Expected |
|---|---|---|
| 1.1 | Open the clarifier page while logged in | One connection to `{API_ORIGIN}/hubs/clarifier` (negotiate → WebSocket 101). No console errors. |
| 1.2 | Open the page with an expired or missing token | Negotiate returns 401. Page still works through HTTP. |
| 1.3 | Navigate away and back quickly (or React Strict Mode in dev) | Shared connection is reused; no "stopped during negotiation" error. |
| 1.4 | Kill the backend while the page is open, then restart it | Client reconnects automatically. Sends during the outage use HTTP. |
| 1.5 | Connection stays idle > 30s | Not dropped (hub is mapped with `DisableRequestTimeout()`). |

## 2. Turn parity (hub vs HTTP)

Run each scenario once over the hub and once with WebSocket blocked (HTTP).

| # | Scenario | Expected (both transports) |
|---|---|---|
| 2.1 | Good answer to Q1 | `verdict: accept`, `currentQuestion: 2`, user msg + AI reply in `messages`. |
| 2.2 | Vague answer | `verdict: revise`, `currentQuestion` unchanged, `attempts` +1. |
| 2.3 | 5 vague answers to the same question | 5th is accepted as `accepted_weak`; flow moves on. |
| 2.4 | Empty / whitespace message | Rejected with "Message is required." Nothing persisted. |
| 2.5 | Message > 4000 chars | Rejected with the length error. |
| 2.6 | Send after all 6 are answered | Rejected with "All clarifier questions are already answered." (409). |
| 2.7 | AI disabled or OpenRouter down | Fail-open: answer accepted, `aiUsed: false`. |
| 2.8 | Refresh after any turn | Transcript and answers reload from the server, identical to what was shown. |

## 3. Streaming display

| # | Scenario | Expected |
|---|---|---|
| 3.1 | Send an answer over the hub | Typing indicator for the AI wait (5–25s), then the reply appears word-by-word with a cursor. |
| 3.2 | Reply finishes | Cursor disappears; the streamed bubble is replaced by the server transcript (no duplicate bubble). |
| 3.3 | Send over HTTP | Reply appears at once (no word-by-word effect). |

> First-chunk latency is **not** a meaningful metric: the first chunk can only arrive after the AI verdict is complete.

## 4. Optimistic concurrency

| # | Scenario | Expected |
|---|---|---|
| 4.1 | Two sends in a row over the hub | The second succeeds. The client stored `ideaVersion` from the first `MessageComplete`. |
| 4.2 | Hub send, then an HTTP edit (or the reverse) | Both succeed; the version carries over between transports. |
| 4.3 | Same idea open in two tabs; send from tab A, then from tab B | Tab B gets "This idea was updated in another tab…" (409). Its bubble rolls back and the draft is restored. |
| 4.4 | Hub `SendMessage` with an `ideaId` the user doesn't own | Rejected; nothing written. |
| 4.5 | Hub `SendMessage` with `expectedVersion` 0 | Rejected: "expectedVersion is required for Creator changes." |

## 5. Language

| # | Scenario | Expected |
|---|---|---|
| 5.1 | UI in EN, answer in EN | AI feedback in English. |
| 5.2 | UI in FR, answer in FR | AI feedback in French. |
| 5.3 | Same as 5.1/5.2 over HTTP | Identical behaviour (the `language` argument reaches the same runner). |

## 6. Errors

| # | Scenario | Expected |
|---|---|---|
| 6.1 | Any server error during a hub turn | Readable message in the chat (no "HubException:" prefix). The user bubble rolls back and the draft is restored. |
| 6.2 | Connection drops after the turn was saved but before `MessageComplete` | Error shown. On refresh, the saved turn is visible (the write already happened). |

---

## Suggested automated coverage (not yet written)

- **Backend unit:** `ClarifierChatTurnRunner` with mocked `ICreatorJourneyService` + `IClarifierTurnService` for 2.1–2.7.
- **Backend unit:** `CreatorJourneyService.UseExplicitWriteVersion` (match, mismatch → 409, wrong ideaId → 400, version advances once per write).
- **Backend integration:** `ClarifierHub` with a test SignalR client — parity with the HTTP endpoint for 2.1 and 4.3.
- **Frontend:** clarifier page with a mocked `useSignalRHub` — hub path vs HTTP path, error rollback (6.1).

## Manual run

```bash
# backend (from backend/)  →  http://localhost:5093
dotnet run
# frontend (repo root)     →  http://localhost:3000
npm run dev
```

Open `/dashboard/creator/phase-2/clarifier`. In DevTools → Network → WS, select the
`hubs/clarifier` socket to see `ReceiveChunk` / `MessageComplete` frames. To force
HTTP, block the request URL pattern `*hubs/clarifier*` and reload.
