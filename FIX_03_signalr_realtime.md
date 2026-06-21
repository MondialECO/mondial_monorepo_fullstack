# Fix 03 — SignalR Realtime Failure (P0)

Scope: realtime connectivity only. AI / onboarding / messaging-business-logic / notifications-business-logic / deals / marketplace / matching / service-provider / entrepreneur untouched.

## SECTION A — Root Cause

**Frontend lifecycle race: `stop()` was called on a hub connection while its `start()` was still negotiating, which the SignalR client reports as "The connection was stopped during negotiation." and which left realtime permanently dead.**

Trace (1–9):
1. **Frontend init** (`src/lib/realtime/use-signalr-hub.ts`): on mount the effect calls `acquireConnection(hub)` + `ensureStarted(hub)`; on cleanup it calls `releaseConnection(hub)`.
2. **accessTokenFactory** (`connection-manager.ts` `getAccessToken`): reads `localStorage.token` directly — correct; not the problem.
3. **Hub URL** (`getHubUrl`): `API_ORIGIN + HUB_PATHS[hub]` → `http://localhost:5093/hubs/{chat,notifications}` — correct.
4. **Negotiate**: `POST /hubs/{hub}/negotiate` → **200** with a valid `connectionId`/`connectionToken` and `availableTransports: ["WebSockets","ServerSentEvents","LongPolling"]` — server healthy.
5. **WebSocket upgrade**: proven to work — a manual `ws://…/hubs/{hub}?id=…&access_token=…` opened and the server returned the SignalR handshake ack (`{}`). So transport + auth are fine.
6. **Backend JWT extraction** (`Program.cs` `JwtBearerEvents.OnMessageReceived`): reads `access_token` from query for `/hubs` paths — correct.
7. **Hub authorization**: WS handshake ack succeeded for an authenticated token → hub auth works.
8. **Dev config**: `UseHttpsRedirection` is a no-op in dev (no HTTPS port bound), CORS `AllowAll` (explicit origins + credentials) returns 200 on negotiate — fine.
9. **Exact failure point**: `releaseConnection` (in `connection-manager.ts`) called `connection.stop()` **synchronously and unconditionally** the moment refCount hit 0. Under React **Strict Mode** (Next dev double-invokes effects: mount → cleanup → mount) — and during fast client-side navigation between pages that share a hub — the cleanup ran while the first `start()` was mid-negotiate. `stop()` aborted that negotiate → `Failed to start the connection: The connection was stopped during negotiation.` The console showed this repeatedly and the UI stayed "SignalR Offline."

Browser evidence (before vs after): pre-fix → **two** notify-negotiate POSTs + repeating `stopped during negotiation`. After fix → a **single** clean negotiate, **no** `stopped during negotiation` / `Failed to start` errors.

## SECTION B — Files Modified
- `src/lib/realtime/connection-manager.ts` (realtime transport layer only).

## SECTION C — Exact Fix

Deferred, start-aware teardown so an unmount→remount within a grace window keeps the same connection (and its in-flight `start()`) alive, and a genuine teardown waits for `start()` to settle before calling `stop()`:

- `ManagedConnection` gains a `teardownTimer`.
- `acquireConnection`: on re-acquire, **cancel** any pending teardown timer.
- `releaseConnection` (now sync `void`): when refCount hits 0, **schedule** teardown after `TEARDOWN_DELAY_MS` (1000 ms) instead of stopping immediately; a re-acquire cancels it.
- New `stopManaged`: `await managed.startPromise` (swallowing errors) **before** `connection.stop()`, so teardown never aborts a negotiate.

```ts
const TEARDOWN_DELAY_MS = 1000;
// ManagedConnection += teardownTimer: ReturnType<typeof setTimeout> | null

// acquireConnection (existing branch): clear a pending teardown
if (existing.teardownTimer) { clearTimeout(existing.teardownTimer); existing.teardownTimer = null; }

async function stopManaged(hub, managed) {
  registry.delete(hub);
  if (managed.startPromise) { try { await managed.startPromise; } catch {} }
  try { await managed.connection.stop(); } catch {}
}

export function releaseConnection(hub) {
  const managed = registry.get(hub);
  if (!managed) return;
  managed.refCount -= 1;
  if (managed.refCount > 0) return;
  if (managed.teardownTimer) return;
  managed.teardownTimer = setTimeout(() => {
    const current = registry.get(hub);
    if (!current || current.refCount > 0) return; // re-acquired
    void stopManaged(hub, current);
  }, TEARDOWN_DELAY_MS);
}
```

Only caller of `releaseConnection` is `useSignalRHub` via `void releaseConnection(hub)`, so the sync return is compatible. No backend change (the backend was never at fault).

## SECTION D — Build Results
- Frontend-only change; Next.js dev server hot-reloaded it (no error overlay; routes served).
- Full `next build`/lint not run here (lint timed out cold; repo guidance is not to run heavy builds unprompted). Change is contained to one module, no new deps. Recommend `npm run build` in CI.

## SECTION E — Browser Verification
- **Transport (both hubs):** manual `negotiate` → 200 + raw WebSocket handshake → server `{}` ack, for **`/hubs/chat`** and **`/hubs/notifications`**, authenticated via `access_token`. Proves WS upgrade + JWT-for-hubs + hub handshake all work.
- **Race resolved (NotificationHub — the reported symptom):** after the fix, loading the dashboard produced a **single** notify negotiate (200) and **zero** `stopped during negotiation` / `Failed to start` console errors (previously: double negotiate + a stream of that error). The notification hub is enabled via `!!token` (`NotificationBell` → `useNotificationRealtime`) and now starts cleanly.

## SECTION F — Remaining Risks / Out-of-scope finding

**ChatHub on the Messages page still shows "Offline" — but NOT because of SignalR.** Root cause is separate and external to realtime connectivity:

- `MessagingWorkspace` enables the chat hub with `enabled: !!user` where `user` comes from `useAuth()`. On the Messages page the console logs **`[useAuth] Warning: Called outside AuthProvider. This component will not work properly.`**, so `user` is `null` → `enabled` is `false` → the chat hook **never starts** the connection (status stays "idle" → badge "Offline").
- This is an **AuthContext/provider-scoping** bug (the notification hub is unaffected because it keys off `token`, not `user`). It lies in the explicitly excluded areas (auth/onboarding + messaging component), so per scope I did **not** change it.
- The ChatHub itself is healthy (WS handshake ack above); it will connect as soon as `enabled` is true. Recommend a separate ticket: ensure `MessagingWorkspace`/the messages route renders within `AuthProvider` (or gate the chat hub on `!!token` like the bell does).

Other: realtime verified in dev only (Strict Mode is the dev trigger; production would not double-invoke, but the deferred-teardown also fixes genuine fast-navigation races) — confirm with a production build in CI.

**Conclusion:** SignalR realtime connectivity is fixed and proven (both hubs negotiate + complete the WebSocket handshake; the NotificationHub start-race is gone). The only remaining "Offline" is the ChatHub being disabled by an out-of-scope auth-context bug, whose root cause is proven to be external to SignalR.
