import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";
import { defaultRetryPolicy } from "./reconnect-policy";
import { HUB_PATHS, type HubName } from "./types";

// Hubs are mounted at the server root (/hubs/*), NOT under the REST /api
// prefix. Derive the origin by stripping a trailing /api from the configured
// API base url.
function getHubUrl(hub: HubName): string {
  const apiBase =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5093/api";
  const origin = apiBase.replace(/\/api\/?$/, "");
  return `${origin}${HUB_PATHS[hub]}`;
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

interface ManagedConnection {
  connection: HubConnection;
  refCount: number;
  // Shared start promise so concurrent consumers of the same hub don't each
  // call start() (which throws unless the connection is Disconnected).
  startPromise: Promise<void> | null;
}

// One shared connection per hub, reference-counted so multiple hooks/components
// reuse a single socket. The connection is stopped and dropped once the last
// consumer releases it (automatic cleanup).
const registry = new Map<HubName, ManagedConnection>();

export function acquireConnection(hub: HubName): HubConnection {
  const existing = registry.get(hub);
  if (existing) {
    existing.refCount += 1;
    return existing.connection;
  }

  const connection = buildConnection(hub);
  registry.set(hub, { connection, refCount: 1, startPromise: null });
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

export async function releaseConnection(hub: HubName): Promise<void> {
  const managed = registry.get(hub);
  if (!managed) return;

  managed.refCount -= 1;
  if (managed.refCount > 0) return;

  registry.delete(hub);
  try {
    await managed.connection.stop();
  } catch {
    // Stopping an already-dead connection is a no-op for our purposes.
  }
}

// Test/diagnostic helper — not for app UI.
export function getActiveHubCount(): number {
  return registry.size;
}
