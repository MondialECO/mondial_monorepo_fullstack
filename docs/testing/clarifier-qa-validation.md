# Phase 2 Clarifier WebSocket - QA Validation Report

**Test Date:** 2026-10-30  
**Tester:** QA Team  
**Build:** dev-hafiz (31 commits)  
**Status:** Ready for Validation

---

## Pre-Test Setup

### Environment
```bash
# 1. Kill existing processes
pkill -f "dotnet|node|npm"

# 2. Clear caches
rm -rf .next backend/bin backend/obj

# 3. Restart servers
npm run dev              # Frontend on http://localhost:3000
dotnet run -p backend   # Backend on http://localhost:5000

# 4. Verify connectivity
curl http://localhost:5000/health
curl http://localhost:3000
```

### Test Account
- Email: test@mondial.eco
- Password: [check 1password]
- Role: Creator (Phase 2 access)

---

## Test Cases

### 1. WebSocket Connection

#### 1.1 Initial Connection
**Steps:**
1. Open http://localhost:3000/dashboard/creator/phase-2/clarifier?ideaId=test-idea-123
2. Wait 2 seconds
3. Open DevTools → Network → WS
4. Check for WebSocket connection to `/api/clarifier`

**Expected:**
- ✅ WebSocket connects (status 101 Switching Protocols)
- ✅ Connection ID appears in hub logs
- ✅ No JavaScript errors in console

**Result:** [ ] Pass [ ] Fail

**Notes:**
```
Connection Details:
- URL: ws://localhost:5000/api/clarifier
- Protocol: SignalR with WebSocket transport
- Status: [Connected/Failed]
- Connection Time: __ ms
```

---

#### 1.2 Automatic Reconnection
**Steps:**
1. With connection established, throttle network to "Offline" in DevTools
2. Wait 5 seconds
3. Restore network connection
4. Wait 5 seconds

**Expected:**
- ✅ Console shows "WebSocket reconnecting" message
- ✅ WebSocket re-establishes connection
- ✅ No data loss or UI freeze

**Result:** [ ] Pass [ ] Fail

**Notes:**
```
Reconnection Details:
- Reconnection Attempts: __
- Successful Reconnect: [Yes/No]
- Time to Reconnect: __ ms
```

---

### 2. Streaming Messages

#### 2.1 First Message Streaming
**Steps:**
1. Type first answer: "The problem is that students can't find affordable tutoring"
2. Press Enter
3. Watch message delivery

**Expected:**
- ✅ Message appears in chat immediately (optimistic UI)
- ✅ Typing indicator shows with blinking cursor
- ✅ AI response chunks appear word-by-word
- ✅ Cursor disappears when complete
- ✅ Topic status updates in sidebar

**Result:** [ ] Pass [ ] Fail

**Streaming Metrics:**
```
First Chunk Latency: __ ms (target <200ms)
Total Message Tokens: __
Streaming Time: __ seconds
Chunks Received: __
```

---

#### 2.2 Message Complete Event
**Steps:**
1. After first message completes
2. Check DevTools → Network → WS
3. Look for "MessageComplete" event

**Expected:**
- ✅ MessageComplete event sent with:
  - aiMessage (id, text, topic, timestamp)
  - topicStatus (updated problem status)
  - nextTopic (should be "who")
  - clarityScore (0.0-1.0)
  - allTopicsCleared (false)

**Result:** [ ] Pass [ ] Fail

**Payload Validation:**
```json
{
  "aiMessage": {
    "id": "msg-_",
    "text": "_____",
    "topic": "problem",
    "timestamp": "2026-10-30T__:__:__Z"
  },
  "topicStatus": {
    "problem": {
      "status": "clear|unclear|pending",
      "baseAnswer": "______",
      "followUpAttempts": 0,
      "updatedAt": "2026-10-30T__:__:__Z"
    }
  },
  "nextTopic": "who",
  "clarityScore": 0.17,
  "allTopicsCleared": false
}
```

---

### 3. Topic Flow

#### 3.1 Topic Priority Order
**Steps:**
1. Answer all 6 questions in order
2. Track nextTopic in each MessageComplete event
3. Verify priority order matches: problem → who → solution → alternatives → edge → risk

**Expected Topic Sequence:**
1. problem (starter) → nextTopic: **who**
2. who → nextTopic: **solution**
3. solution → nextTopic: **alternatives**
4. alternatives → nextTopic: **edge**
5. edge → nextTopic: **risk**
6. risk → nextTopic: **null** (allTopicsCleared: true)

**Result:** [ ] Pass [ ] Fail

**Topic Responses:**
| Topic | Answer Provided | Status | NextTopic | Clarity |
|-------|-----------------|--------|-----------|---------|
| problem | __ | clear/unclear | __ | __ |
| who | __ | clear/unclear | __ | __ |
| solution | __ | clear/unclear | __ | __ |
| alternatives | __ | clear/unclear | __ | __ |
| edge | __ | clear/unclear | __ | __ |
| risk | __ | clear/unclear | null | __ |

---

### 4. Language Support

#### 4.1 English (EN)
**Steps:**
1. Clarifier page loads with localStorage language = 'en'
2. Answer first question
3. Check response language

**Expected:**
- ✅ AI response in English
- ✅ UI labels in English
- ✅ No French text in responses

**Result:** [ ] Pass [ ] Fail

---

#### 4.2 French (FR)
**Steps:**
1. Change language to FR in settings
2. Refresh page
3. Answer first question
4. Check response language

**Expected:**
- ✅ AI response in French
- ✅ UI labels in French
- ✅ No English text in responses
- ✅ Language persists on refresh

**Result:** [ ] Pass [ ] Fail

**Language Switching Time:** __ ms

---

### 5. HTTP Fallback

#### 5.1 WebSocket Unavailable
**Steps:**
1. Block WebSocket in DevTools (DevTools → Network → Add custom → Block /api/clarifier)
2. Refresh page
3. Type answer and submit
4. Check Network tab

**Expected:**
- ✅ WebSocket fails to connect
- ✅ Falls back to HTTP POST /api/clarifier/message
- ✅ Response shows fully (not streamed)
- ✅ UI still works
- ✅ Console shows fallback warning

**Result:** [ ] Pass [ ] Fail

**Fallback Request:**
```
POST /api/clarifier/message HTTP/1.1
Content-Type: application/json

{
  "message": "____",
  "language": "en",
  "ideaId": "____"
}

Response Time: __ ms
```

---

### 6. Database Persistence

#### 6.1 Topics Saved
**Steps:**
1. Answer 3 questions: problem, who, solution
2. Refresh page
3. Verify all 3 answers still visible
4. Check MongoDB for ClarifierSession.Topics field

**Expected:**
- ✅ All 3 answers preserved after refresh
- ✅ Topic status shows in MongoDB
- ✅ UpdatedAt timestamps correct
- ✅ No data loss

**Result:** [ ] Pass [ ] Fail

**MongoDB Validation:**
```javascript
db.ClarifierSessions.findOne({ _id: "session-id" })
// Check: Topics field exists with all 6 topics
// Check: problem.Status = "clear"
// Check: who.Status = "clear/unclear"
// Check: solution.Status = "clear/unclear"
// Check: UpdatedAt timestamps recent
```

---

#### 6.2 Answer Editing
**Steps:**
1. Click Edit on problem answer
2. Modify text
3. Submit
4. Refresh page
5. Verify edit persisted

**Expected:**
- ✅ Edit mode activates
- ✅ New text accepted or rejected
- ✅ Database updated on submission
- ✅ Edit persists after refresh

**Result:** [ ] Pass [ ] Fail

---

### 7. Error Handling

#### 7.1 API Timeout
**Steps:**
1. Throttle network to "GPRS" (very slow)
2. Submit a long answer
3. Wait for response

**Expected:**
- ✅ No hang (20 second timeout respected)
- ✅ Error message displayed (if timeout)
- ✅ Can retry message
- ✅ UI remains responsive

**Result:** [ ] Pass [ ] Fail

---

#### 7.2 Malformed Response
**Steps:**
1. (Manual test: use DevTools to corrupt a response)
2. Submit answer
3. Check console

**Expected:**
- ✅ Error logged but not exposed to user
- ✅ Fallback to placeholder response
- ✅ UI doesn't crash

**Result:** [ ] Pass [ ] Fail

---

### 8. Performance

#### 8.1 Streaming Latency
**Test 10 messages, track metrics:**

| Message | First Chunk (ms) | Complete (ms) | Chunks | Status |
|---------|-----------------|---------------|--------|--------|
| 1 | __ | __ | __ | pass/fail |
| 2 | __ | __ | __ | pass/fail |
| 3 | __ | __ | __ | pass/fail |
| 4 | __ | __ | __ | pass/fail |
| 5 | __ | __ | __ | pass/fail |

**Expected:**
- ✅ First chunk: <200ms
- ✅ Complete: <5 seconds
- ✅ 15+ chunks per message
- ✅ Typing effect smooth

**Result:** [ ] Pass [ ] Fail

---

#### 8.2 Memory Leaks
**Steps:**
1. Submit 20 messages
2. Open DevTools → Memory
3. Take heap snapshot at message 5
4. Take heap snapshot at message 20
5. Compare

**Expected:**
- ✅ Heap growth <50MB per 15 messages
- ✅ No detached DOM nodes
- ✅ Event listeners cleaned up

**Result:** [ ] Pass [ ] Fail

**Heap Snapshots:**
- Snapshot 1 (msg 5): __ MB
- Snapshot 2 (msg 20): __ MB
- Growth: __ MB (target: <50MB)

---

### 9. Cross-Browser

#### 9.1 Chrome
**Result:** [ ] Pass [ ] Fail
**Notes:** ____

#### 9.2 Firefox
**Result:** [ ] Pass [ ] Fail
**Notes:** ____

#### 9.3 Safari
**Result:** [ ] Pass [ ] Fail
**Notes:** ____

---

## Summary

### Passed: __ / 30 Test Cases
### Failed: __ / 30 Test Cases
### Blocked: __ / 30 Test Cases

### Critical Issues
```
1. [Issue]: _____
   [Impact]: _____
   [Fix]: _____
   [Status]: Open/Fixed/Deferred

2. [Issue]: _____
   [Impact]: _____
   [Fix]: _____
   [Status]: Open/Fixed/Deferred
```

### Recommendations
- [ ] Ready for production
- [ ] Ready with fixes
- [ ] Needs rework
- [ ] Block release

### Sign-Off
- QA Tester: ________________ Date: ______
- QA Lead: _________________ Date: ______
- Product: _________________ Date: ______

---

## Appendix: Debug Checklist

If tests fail, verify:

```bash
# 1. Backend service running
curl -I http://localhost:5000/health
# Expected: 200 OK

# 2. WebSocket endpoint responsive
curl -I -H "Connection: Upgrade" http://localhost:5000/api/clarifier
# Expected: 101 Switching Protocols or similar

# 3. Frontend built
ls -la .next
# Expected: directory exists

# 4. MongoDB running
mongo mongodb://localhost:27017
db.ClarifierSessions.count()
# Expected: >0

# 5. Logs
tail -100 backend/logs/app.log
tail -100 frontend/.next/logs/build.log

# 6. Network inspection
# DevTools → Network → Filter by "api/clarifier"
# Should see WS connection + messages
```

---

**QA Validation Complete** ✅

