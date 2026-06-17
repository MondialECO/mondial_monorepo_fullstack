import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";
import { defaultRetryPolicy } from "./reconnect-policy";
import { HUB_PATHS, type HubName } from "./types";
import { API_ORIGIN } from "../api-config";

// Hubs are mounted at the server root (/hubs/*), NOT under the REST /api
// prefix. API_ORIGIN is the API base url with the trailing /api stripped.
function getHubUrl(hub: HubName): string {
  return `${API_ORIGIN}${HUB_PATHS[hub]}`;
}

// The backend reads the JWT from the `access_token` query string for /hubs/*
// requests (see Program.cs JwtBearerEvents.OnMessageReceived). The SignalR
// client appends it automatically when given an accessTokenFactory.
function getAccessToken(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem("token") ?? "";
  } catch {
    return "";
  }
}

function buildConnection(hub: HubName): HubConnection {
  return new HubConnectionBuilder()
    .withUrl(getHubUrl(hub), { accessTokenFactory: getAccessToken })
    .withAutomaticReconnect(defaultRetryPolicy)
    .configureLogging(
      process.env.NODE_ENV === "development" ? LogLevel.Warning : LogLevel.Error
    )
    .build();
}

// Grace period before a hub with no consumers is actually stopped. A synchronous
// unmount→remount (React Strict Mode in dev) or fast navigation between two pages
// that share a hub re-acquires within this window and cancels the stop, so we
// never call connection.stop() on a still-negotiating start() — which throws
// "The connection was stopped during negotiation." and leaves realtime dead.
const TEARDOWN_DELAY_MS = 1000;

interface ManagedConnection {
  connection: HubConnection;
  refCount: number;
  // Shared start promise so concurrent consumers of the same hub don't each
  // call start() (which throws unless the connection is Disconnected).
  startPromise: Promise<void> | null;
  // Pending deferred-teardown timer (see releaseConnection); cancelled if the
  // hub is re-acquired before it fires.
  teardownTimer: ReturnType<typeof setTimeout> | null;
}

// One shared connection per hub, reference-counted so multiple hooks/components
// reuse a single socket. The connection is stopped and dropped once the last
// consumer releases it (automatic cleanup).
const registry = new Map<HubName, ManagedConnection>();

export function acquireConnection(hub: HubName): HubConnection {
  const existing = registry.get(hub);
  if (existing) {
    existing.refCount += 1;
    // Cancel a pending teardown — a consumer re-acquired before the grace
    // period elapsed, so the connection (possibly mid-start) lives on.
    if (existing.teardownTimer) {
      clearTimeout(existing.teardownTimer);
      existing.teardownTimer = null;
    }
    return existing.connection;
  }

  const connection = buildConnection(hub);
  registry.set(hub, { connection, refCount: 1, startPromise: null, teardownTimer: null });
  return connection;
}

// Start the shared connection at most once. Concurrent callers await the same
// promise; a failed start resets so a later caller can retry.
export function ensureStarted(hub: HubName): Promise<void> {
  const managed = registry.get(hub);
  if (!managed) return Promise.reject(new Error(`No connection for hub: ${hub}`));

  if (managed.connection.state !== HubConnectionState.Disconnected) {
    return managed.startPromise ?? Promise.resolve();
  }

  managed.startPromise = managed.connection.start().catch((err) => {
    managed.startPromise = null;
    throw err;
  });
  return managed.startPromise;
}

async function stopManaged(hub: HubName, managed: ManagedConnection): Promise<void> {
  registry.delete(hub);
  // Wait for any in-flight start() to settle BEFORE stopping, so a genuine
  // teardown never aborts a negotiate in progress (which would throw
  // "The connection was stopped during negotiation.").
  if (managed.startPromise) {
    try {
      await managed.startPromise;
    } catch {
      // start() already failed — nothing live to stop.
    }
  }
  try {
    await managed.connection.stop();
  } catch {
    // Stopping an already-dead connection is a no-op for our purposes.
  }
}

export function releaseConnection(hub: HubName): void {
  const managed = registry.get(hub);
  if (!managed) return;

  managed.refCount -= 1;
  if (managed.refCount > 0) return;

  // Defer teardown. If the last consumer unmounts and immediately remounts
  // (React Strict Mode in dev, or fast client-side navigation between pages
  // that share this hub), acquireConnection cancels this timer and the SAME
  // connection — including an in-flight start() — survives. Without this, the
  // synchronous stop() landed mid-negotiate and killed realtime permanently.
  if (managed.teardownTimer) return;
  managed.teardownTimer = setTimeout(() => {
    const current = registry.get(hub);
    if (!current || current.refCount > 0) return; // re-acquired in the meantime
    void stopManaged(hub, current);
  }, TEARDOWN_DELAY_MS);
}

// Test/diagnostic helper — not for app UI.
export function getActiveHubCount(): number {
  return registry.size;
}
