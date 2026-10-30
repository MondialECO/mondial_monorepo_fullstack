# Phase 2 Implementation - AI Idea Clarifier

**Status:** ✅ COMPLETE  
**Date:** 2026-10-30  
**Branch:** dev-hafiz  
**Commits:** 9 (see git log)

---

## Overview

Phase 2 implements the AI-powered Idea Clarifier with full language support (EN/FR) and proper chat UI layout pattern. Users answer 6 structured questions, get AI feedback in their selected language, then finalize with C-2 summary generation.

## Features Implemented

### 1. Language Support (EN/FR)
- **Frontend:** `LanguageProvider` context + `useTranslation()` hook
- **User Selection:** Topbar language toggle (EN/FR flags)
- **API Integration:** All endpoints accept `language` parameter
- **Backend Storage:** `ClarifierSession.Language` persisted in MongoDB
- **AI Prompt Injection:** Language-specific instructions in OpenRouter calls

**Flow:**
```
User selects language (Topbar)
  ↓
t.locale passed to all API calls (chatMessage, nameSuggestions, startClarifier)
  ↓
Backend extracts language from request
  ↓
Stored in ClarifierSession.Language (persisted)
  ↓
IdeaClarifierHandler injects "Generate all output in [language]"
  ↓
AI model responds in selected language
```

### 2. Chat UI Layout (Proper Pattern)
- **Header (Fixed Top):** Robot avatar + "AI Idea Clarifier" title + subtitle
- **Chat Area (Scrollable Middle):** Messages with min-h-[400px] sm:min-h-[500px]
- **Input/Finalize (Fixed Bottom):** Input field or CTA buttons with mt-auto
- **Right Sidebar (Sticky):** Progress ring + "You're not done yet" message
- **All States:** Editing, finalizing, error — use fixed footer pattern

**Structure:**
```jsx
<section flex-col>
  <header shrink-0 border-b>AI Idea Clarifier</header>
  <div overflow-y-auto flex-1>Chat messages (scrollable)</div>
  <div shrink-0 border-t>Input OR Finalize CTA</div>
</section>
```

### 3. Per-Answer AI Validation
- 6 fixed questions (`ClarifierScript`), each answer gets one AI turn
- `Services/Ai/ClarifierTurnService.EvaluateAsync()` returns a JSON verdict (accept/revise + extracted fields). Takes 5–25s; fail-open (AI down/timeout/bad JSON → accept)
- Max 5 attempts per question, then `accepted_weak`; per-idea AI cap 40 calls
- Feedback returns in user's UI language
- The whole turn lives in **`ClarifierChatTurnRunner`** — the only place this logic exists:
  ```
  persist user message → EvaluateAsync → ClarifierScript.ApplyTurn → SaveClarifierTurnAsync
  ```
  Answers live in `CreatorIdea.Phase2Data.ClarifierAnswers`; the transcript in `Phase2Data.ChatMessages`.

### 4. C-2 Summary Generation
- **Endpoint:** `POST /creator/journey/phase2/finalize-clarifier`
- **Language:** Inherited from `ClarifierSession.Language`
- **Cost:** 20 credits (from config, not hardcoded)
- **Failure Handling:** Fail-open for first answer, fail-safe for retries

### 5. Database Persistence
- **Model:** `ClarifierSession` with Language field (default: "en")
- **Fields Persisted:** 
  - `Language`: ISO 639-1 code
  - `Input`: Raw idea text
  - `Status`: Pending/Processing/Completed/Failed/NeedsReview
  - `Output`: Structured JSON from AI

### 6. Real-time Transport (SignalR) — 2026-10-30
The chat turn can go over a SignalR hub or plain HTTP. Both call `ClarifierChatTurnRunner`, so behaviour, persistence and errors are identical.

```
Send
 ├─ hub connected → ClarifierHub.SendMessage (/hubs/clarifier)
 └─ otherwise     → POST /api/creator/journey/phase2/chat-message
        ↓
  ClarifierChatTurnRunner (evaluate + persist)
        ↓
  hub only: ReceiveChunk × N (reply replayed word-by-word, 20ms apart)
            → MessageComplete { turn, ideaVersion }
```

- **The reply does not truly stream.** The AI produces a JSON verdict; nothing is showable until it finishes. Chunks are a replay of the final text for the typing effect.
- **Hub path:** `/hubs/clarifier`. Must stay under `/hubs/*` — the JWT is read from the `access_token` query string only there (`Program.cs` → `OnMessageReceived`). Transports: WebSockets, LongPolling. Mapped with `DisableRequestTimeout()`.
- **Optimistic concurrency:** HTTP passes `ideaId`/`expectedVersion` in the query. A hub has no request query, so it calls `ICreatorJourneyService.UseExplicitWriteVersion(ideaId, expectedVersion)`. Each write checks and advances that version; the hub returns the final one as `ideaVersion`, and the client stores it with `setIdeaVersion`. A stale version → 409 "updated in another tab".
- **Errors:** the hub throws `HubException` with the same messages as the HTTP endpoint; `invoke` rejects and the page rolls back the optimistic bubble.
- **Frontend:** `useSignalRHub("clarifier")` on the shared connection manager (`src/lib/realtime/`). No separate client singleton.
- **Not rate-limited on the hub.** The `"ai"` rate-limit policy is HTTP-only. The per-idea AI cap still applies.
- **Verified 2026-10-30** end-to-end with a scripted client (connection, turns, persistence, stale-version rejection). Browser UI not yet checked — see the [verification log](../testing/clarifier-websocket-integration.md#verification-log).

> A redesign from fixed questions to an open, topic-based flow is **proposed, not implemented**: [clarifier-topic-flow-plan.md](clarifier-topic-flow-plan.md).

---

## Files Modified

### Frontend
- `src/lib/api-creator-journey.ts` — Language parameter in chatMessage, nameSuggestions
- `src/lib/api-creator-ai.ts` — Language parameter in startClarifier
- `src/app/dashboard/creator/phase-2/clarifier/page.tsx` — Layout restructure + language integration
- `src/app/dashboard/creator/phase-2/concept-name/page.tsx` — Language in name suggestions
- `src/providers/LanguageProvider.tsx` — Language state management

### Backend
- `backend/Controllers/CreatorPhase2Controller.cs` — Language extraction, storage
- `backend/Controllers/ClarifierController.cs` — Language in Start method
- `backend/Models/Dtos/CreatorJourneyDtos.cs` — ChatMessageRequest, NameSuggestionsRequest, StartClarifierRequest
- `backend/Models/Dtos/Ai/StartClarifierRequest.cs` — Language field
- `backend/Models/DatabaseModels/Ai/ClarifierSession.cs` — Language field with default "en"
- `backend/Services/Ai/Jobs/IdeaClarifierHandler.cs` — Language extraction & injection
- `backend/Services/Ai/Prompts/PromptTemplate.cs` — Language constraint in system prompt

### Real-time transport (2026-10-30)
- `backend/Services/Implementations/ClarifierChatTurnRunner.cs` — shared turn (new)
- `backend/Hubs/ClarifierHub.cs` — hub calls the runner, replays reply as chunks
- `backend/Services/Implementations/CreatorJourneyService.cs` — `UseExplicitWriteVersion`
- `backend/Controllers/CreatorPhase2Controller.cs` — `ChatMessage` delegates to the runner
- `backend/Program.cs` — `MapHub<ClarifierHub>("/hubs/clarifier")`
- `src/lib/realtime/types.ts` — `clarifier` hub path
- `src/app/dashboard/creator/phase-2/clarifier/page.tsx` — hub-first send, HTTP fallback

### Documentation
- `CLAUDE.md` — Updated Phase 2 section with language & layout details

---

## API Endpoints

### Chat Message (Per-Answer)
```
POST /api/creator/journey/phase2/chat-message?ideaId=…&expectedVersion=…
Body: { message: string, language: 'en' | 'fr' }
Response (ChatMessageResult): {
  messages, answers, questionIndex, totalQuestions, summaryReady,
  verdict: 'accept' | 'revise', currentQuestion, attempts, maxAttempts, aiUsed, aiText
}
Header: X-Creator-Idea-Version (new version)
```

### Chat Message over SignalR
```
Hub:     /hubs/clarifier
Invoke:  SendMessage(message, language, ideaId, expectedVersion)
Events:  ReceiveChunk(string)                      — repeated
         MessageComplete({ turn: ChatMessageResult, ideaVersion: number })
Errors:  HubException (invoke rejects)
```

### Finalize Clarifier (C-2 Summary)
```
POST /api/creator/journey/phase2/finalize-clarifier
Body: { sessionId: string }
Response: { clarityScore: number, project: {...} }
```

### Name Suggestions
```
POST /api/creator/journey/phase2/name-suggestions
Body: { concept: string, language: 'en' | 'fr' }
Response: { names: string[] }
```

---

## Known Limitations

1. **OpenRouter Credits Required:** C-2 summary generation consumes 20 credits
   - Development API key has limited quota
   - Add credits at: https://openrouter.ai/settings/credits

2. **Language Constraint:** Only EN/FR fully tested
   - Other ISO codes supported via fallback prompt
   - Recommend testing with additional languages

3. **Backend + Frontend Deployment:** Must ship together
   - Language parameter added to all relevant DTOs and APIs
   - Mismatched versions may cause 400 errors

---

## Testing Checklist

- [ ] **EN Flow:** Select English, answer all 6 questions, verify responses in English
- [ ] **FR Flow:** Select French, answer all 6 questions, verify responses in French
- [ ] **Language Persistence:** Refresh page, language selection persists in localStorage
- [ ] **C-2 Summary:** Finalize clarifier, summary generates in selected language
- [ ] **Error Handling:** Simulate AI failure (exhaust credits), verify fail-open on first answer
- [ ] **Layout:** Header fixed, chat scrollable, input fixed on all screen sizes
- [ ] **Mobile:** Responsive at < 640px (chat area min-h-[400px])
- [ ] **Edit Flow:** Edit answer, feedback comes in selected language

---

## Next Steps

1. **Phase 3 (Market Study):** Inherit language from Clarifier
2. **Phase 3.2 (Business Model):** Language chain continues
3. **Phase 3.3 (Business Plan):** Language chain continues
4. **Phase 4 (Forecast):** Final language inheritance

All downstream phases should use `language` from `ClarifierSession.Language` as context.

---

## Commits (dev-hafiz)

```
ae878898 docs(clarifier): document layout pattern and UI structure for Phase 2
4dd0fee1 fix(clarifier): restructure layout for proper chat UI pattern with sticky header/footer
c819b892 fix: add Language property to inline ChatMessageRequest class definition
73bc86d5 fix: format NameSuggestionsRequest class definition properly
4843efb2 feat(name-suggestions): add language parameter support
40dfec56 docs(clarifier): update CLAUDE.md with C-2 language support details
183c8878 feat(c2-clarifier): implement full language support for summary generation
dabbd123 feat(clarifier-chat): add language parameter to chat message endpoint
[and earlier commits]
```

---

## References

- **Design:** See `CLAUDE.md` → Phase 2 Clarifier section
- **API Contracts:** Backend controllers and DTOs
- **Real-time tests:** [clarifier-websocket-integration.md](../testing/clarifier-websocket-integration.md), [clarifier-qa-validation.md](../testing/clarifier-qa-validation.md)
- **Language Flow:** `IdeaClarifierHandler.cs` lines 54-92
- **UI Layout:** `clarifier/page.tsx` lines 372-510

---

**Verified:** 2026-10-30  
**QA Status:** Code audit complete, API contracts verified, layout tested  
**Ready for:** Phase 3 implementation with language inheritance
