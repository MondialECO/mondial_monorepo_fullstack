import type { HubConnection } from "@microsoft/signalr";

// Server-side hub endpoints (mapped in backend Program.cs under /hubs/*).
export const HUB_PATHS = {
  chat: "/hubs/chat",
  notifications: "/hubs/notifications",
} as const;

export type HubName = keyof typeof HUB_PATHS;

// Client-side connection lifecycle, surfaced to consumers (e.g. for status UI).
export type RealtimeStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected";

// A single inbound server→client event binding.
// `method` is the SignalR method name the server invokes on the client;
// `handler` receives the (already deserialized) payload.
export interface HubEventBinding {
  method: string;
  handler: (payload: unknown) => void;
}

// Factory for a type-safe binding. The payload type is asserted at this single
// boundary (SignalR delivers the deserialized server payload), keeping consumer
// handlers fully typed without leaking `any` into call sites.
export function hubEvent<TPayload>(
  method: string,
  handler: (payload: TPayload) => void
): HubEventBinding {
  return { method, handler: handler as (payload: unknown) => void };
}

export interface UseSignalRHubOptions {
  // When false, the hook will not attempt to connect (e.g. before auth ready).
  enabled?: boolean;
  // Server→client event handlers to register for the connection's lifetime.
  events?: HubEventBinding[];
  // Called once the connection reaches the "connected" state (initial + after
  // a successful reconnect), useful for (re)joining groups.
  onConnected?: (connection: HubConnection) => void | Promise<void>;
}

export interface UseSignalRHubResult {
  connection: HubConnection | null;
  status: RealtimeStatus;
  // Type-safe server method invocation. Throws if not connected.
  invoke: <TResult = void>(method: string, ...args: unknown[]) => Promise<TResult>;
}
