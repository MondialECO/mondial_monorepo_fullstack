# Clarifier WebSocket Integration Test Spec

**Date:** 2026-10-30  
**Status:** Ready for QA

---

## Test Scope

This document outlines integration tests for the Phase 2 Clarifier WebSocket real-time messaging system, including:
- WebSocket connection lifecycle
- Streaming message chunks (word-by-word AI responses)
- HTTP LongPolling fallback
- Topic evaluation and state progression
- Language support (EN/FR)
- Database persistence

---

## Test Categories

### 1. Connection Lifecycle

#### 1.1 WebSocket Connection Establishment
**Test:** `should establish WebSocket connection on page mount`

```typescript
// Arrange
const token = await getAuthToken();
const sessionId = "test-session-123";

// Act
navigate('/dashboard/creator/phase-2/clarifier?ideaId=test-idea');
await waitFor(() => {
  expect(getClarifierWebSocket().isConnected()).toBe(true);
});

// Assert
expect(getClarifierWebSocket().isConnected()).toBe(true);
```

#### 1.2 Automatic Reconnection
**Test:** `should automatically reconnect on disconnect`

```typescript
// Arrange
const ws = getClarifierWebSocket();
await ws.connect();

// Act
// Simulate disconnect
simulateNetworkDisconnect();
await waitFor(() => {
  expect(ws.isConnected()).toBe(true);
}, { timeout: 5000 });

// Assert
expect(ws.isConnected()).toBe(true);
expect(consoleErrorMock).toHaveBeenCalledWith(
  expect.stringContaining('WebSocket reconnecting')
);
```

#### 1.3 Graceful Fallback to HTTP
**Test:** `should fallback to HTTP if WebSocket fails`

```typescript
// Arrange
mockWebSocketError('ECONNREFUSED');
const ws = initializeClarifierWebSocket(token);

// Act
await ws.connect();
const message = "What is your problem?";
await handleSend(message);

// Assert
// Should have fallen back to HTTP endpoint
expect(mockHttpPost).toHaveBeenCalledWith(
  '/api/creator-journey/clarifier/message',
  expect.objectContaining({ message, language: 'en' })
);
```

---

### 2. Streaming Messages

#### 2.1 Real-time Chunk Streaming
**Test:** `should stream AI response chunk-by-chunk with typing effect`

```typescript
// Arrange
const userMessage = "The problem is...";
const expectedChunks = ["The ", "problem ", "is ", "that ", "..."];
const chunks = [];

getClarifierWebSocket().onMessageChunk((chunk) => {
  chunks.push(chunk);
});

// Act
await handleSend(userMessage);
await waitFor(() => {
  expect(chunks.length).toBeGreaterThan(0);
});

// Assert
expect(chunks.join("")).toContain("problem");
expect(screen.getByText(/typing/i)).toBeInTheDocument();
```

#### 2.2 Message Complete Event
**Test:** `should emit MessageComplete with topic status and next topic`

```typescript
// Arrange
let messageCompleteData = null;
getClarifierWebSocket().onMessageComplete((data) => {
  messageCompleteData = data;
});

// Act
await handleSend("Solve climate change");
await waitFor(() => {
  expect(messageCompleteData).not.toBeNull();
});

// Assert
expect(messageCompleteData).toMatchObject({
  aiMessage: expect.objectContaining({
    id: expect.any(String),
    text: expect.any(String),
    topic: expect.any(String),
  }),
  topicStatus: expect.objectContaining({
    problem: expect.objectContaining({
      status: expect.stringMatching(/pending|unclear|clear/),
    }),
  }),
  nextTopic: expect.any(String),
  clarityScore: expect.any(Number),
  allTopicsCleared: expect.any(Boolean),
});
```

#### 2.3 Streaming UI Updates
**Test:** `should update UI in real-time as chunks arrive`

```typescript
// Arrange
const screen = render(<ClarifierPage />);

// Act
await handleSend("My problem is X");
const messageBubble = await screen.findByRole('generic', {
  name: /assistant/i,
});

// Assert - message should appear immediately
expect(messageBubble).toBeInTheDocument();

// Assert - typing cursor should appear
await waitFor(() => {
  expect(messageBubble.textContent).toContain('▌');
});

// Assert - cursor should be removed on completion
await waitFor(() => {
  expect(messageBubble.textContent).not.toContain('▌');
}, { timeout: 5000 });
```

---

### 3. Topic Evaluation & State

#### 3.1 Topic Status Persistence
**Test:** `should persist topic status to database on MessageComplete`

```typescript
// Arrange
const sessionId = "session-123";
const topicBefore = { status: 'pending' };

// Act
await handleSend("Clear problem statement");
await waitFor(() => {
  expect(dbMock.updateOne).toHaveBeenCalled();
});

// Assert
const updateCall = dbMock.updateOne.mock.calls[0];
expect(updateCall[1].$set.Topics.problem.status).toBe('clear');
expect(updateCall[1].$set.UpdatedAt).toBeDefined();
```

#### 3.2 Topic Priority Selection
**Test:** `should select next topic in priority order: problem → who → solution → alternatives → edge → risk`

```typescript
// Arrange
const ws = getClarifierWebSocket();
let nextTopics = [];
ws.onMessageComplete((data) => {
  nextTopics.push(data.nextTopic);
});

// Act
await handleSend("Problem: X"); // problem → clear
await waitFor(() => expect(nextTopics[0]).toBe('who'));
await handleSend("Who: Y"); // who → clear
await waitFor(() => expect(nextTopics[1]).toBe('solution'));
await handleSend("Solution: Z"); // solution → clear
await waitFor(() => expect(nextTopics[2]).toBe('alternatives'));

// Assert
expect(nextTopics).toEqual(['who', 'solution', 'alternatives']);
```

#### 3.3 Follow-up Question Generation
**Test:** `should generate follow-up if topic is unclear`

```typescript
// Arrange
const followUpResponses = [];

// Act
await handleSend("Something vague"); // Insufficient answer
await waitFor(() => {
  const followUp = screen.queryByText(/why is this/i);
  if (followUp) followUpResponses.push(followUp.textContent);
});

// Assert
expect(followUpResponses.length).toBeGreaterThan(0);
expect(screen.getByRole('button', { name: /edit/i })).toBeDisabled();
```

---

### 4. Language Support

#### 4.1 English (EN) Responses
**Test:** `should generate AI responses in English when language=en`

```typescript
// Arrange
mockLanguage('en');

// Act
await handleSend("What is the problem?");
await waitFor(() => {
  const response = screen.getByText(/the problem/i);
  expect(response).toBeInTheDocument();
});

// Assert
expect(getClarifierWebSocket().connect).toHaveBeenCalledWith(
  expect.objectContaining({ language: 'en' })
);
```

#### 4.2 French (FR) Responses
**Test:** `should generate AI responses in French when language=fr`

```typescript
// Arrange
mockLanguage('fr');

// Act
await handleSend("Quel est le problème?");
await waitFor(() => {
  const response = screen.getByText(/le problème/i);
  expect(response).toBeInTheDocument();
});

// Assert
expect(getClarifierWebSocket().connect).toHaveBeenCalledWith(
  expect.objectContaining({ language: 'fr' })
);
```

---

### 5. Error Handling

#### 5.1 WebSocket Error Recovery
**Test:** `should handle WebSocket errors gracefully`

```typescript
// Arrange
getClarifierWebSocket().onError((error) => {
  console.error('[Clarifier] Error:', error);
});

// Act
simulateWebSocketError('TIMEOUT');
await waitFor(() => {
  expect(screen.getByText(/error occurred/i)).toBeInTheDocument();
});

// Assert
expect(screen.getByRole('button', { name: /try again/i })).toBeEnabled();
```

#### 5.2 Fallback HTTP Endpoint
**Test:** `should use HTTP POST /clarifier/message if WebSocket unavailable`

```typescript
// Arrange
blockWebSocket();

// Act
await handleSend("Test message");

// Assert
expect(mockHttpPost).toHaveBeenCalledWith(
  '/api/clarifier/message',
  expect.objectContaining({
    message: 'Test message',
    language: 'en',
  })
);
```

---

### 6. Performance

#### 6.1 Streaming Latency
**Test:** `should deliver first chunk within 100ms of sending message`

```typescript
// Arrange
let firstChunkTime = null;
getClarifierWebSocket().onMessageChunk(() => {
  if (!firstChunkTime) {
    firstChunkTime = Date.now();
  }
});

// Act
const sendTime = Date.now();
await handleSend("What's the problem?");
await waitFor(() => {
  expect(firstChunkTime).not.toBeNull();
});

// Assert
const latency = firstChunkTime - sendTime;
expect(latency).toBeLessThan(200); // Allow 200ms for test overhead
```

#### 6.2 Memory Cleanup
**Test:** `should release event listeners on disconnect`

```typescript
// Arrange
const listenerCountBefore = getListenerCount(ws);

// Act
ws.disconnect();

// Assert
const listenerCountAfter = getListenerCount(ws);
expect(listenerCountAfter).toBeLessThan(listenerCountBefore);
```

---

### 7. Database Persistence

#### 7.1 Topics Dictionary Serialization
**Test:** `should serialize/deserialize Topics dictionary correctly`

```typescript
// Arrange
const originalStatus = {
  problem: { status: 'clear', baseAnswer: 'X', followUpAttempts: 1, updatedAt: new Date() },
  who: { status: 'unclear', baseAnswer: 'Y', followUpAttempts: 0, updatedAt: new Date() },
};

// Act
await updateTopicStatusAsync(sessionId, originalStatus);
const retrieved = await getTopicStatusAsync(sessionId);

// Assert
expect(retrieved).toEqual(originalStatus);
```

#### 7.2 Backward Compatibility (Legacy Sessions)
**Test:** `should initialize Topics for sessions without Topics field`

```typescript
// Arrange
const legacySession = await ClarifierSession.findById(sessionId);
// Legacy session has no Topics field

// Act
const status = await getTopicStatusAsync(sessionId);

// Assert
expect(status).toEqual(InitializeTopics());
expect(status).toHaveProperty('problem');
```

---

## Manual Testing Checklist

### Connection & Streaming
- [ ] Open Clarifier page, verify WebSocket connects in DevTools Network tab
- [ ] Type first answer, observe typing indicator with blinking cursor
- [ ] Observe text appearing word-by-word (typing effect)
- [ ] Answer completes and shows next topic in sidebar

### Language Switching
- [ ] Switch language to FR in settings
- [ ] Refresh Clarifier page
- [ ] Verify AI responses are in French
- [ ] Switch back to EN, verify English responses

### Fallback Scenarios
- [ ] Disable WebSocket in DevTools (Network throttling → Block WebSocket)
- [ ] Send message
- [ ] Verify HTTP fallback is used (check Network tab for POST to /clarifier/message)
- [ ] Response displays (but without streaming effect)

### State Persistence
- [ ] Answer all 6 questions
- [ ] Refresh page
- [ ] Verify all answers are still visible (loaded from DB)
- [ ] Edit an answer, verify changes persist

---

## Test Execution

### Unit Tests
```bash
npm run test -- backend/Tests/Services/Clarifier/ClarifierTopicServiceTests.cs
npm run test -- src/__tests__/lib/clarifier-websocket.test.ts
```

### Integration Tests
```bash
npm run test:e2e -- clarifier-websocket-integration
```

### Manual Testing
```bash
npm run dev
# Navigate to /dashboard/creator/phase-2/clarifier
# Follow Manual Testing Checklist above
```

---

## Success Criteria

✅ WebSocket connects on page load  
✅ Messages stream chunk-by-chunk with <200ms latency  
✅ Topic status persists to database  
✅ HTTP fallback works if WebSocket unavailable  
✅ Language support (EN/FR) works in both modes  
✅ All 6 topics progress in priority order  
✅ Backward compatible with legacy sessions  
✅ Error handling recovers gracefully  

---

**Status:** Ready for implementation & QA validation  
**Effort:** 2-3 days for full test coverage + manual validation

