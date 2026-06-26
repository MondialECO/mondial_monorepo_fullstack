"use client";

import { useEffect, useRef, useState } from "react";
import { HubConnection, HubConnectionState } from "@microsoft/signalr";
import {
  acquireConnection,
  ensureStarted,
  releaseConnection,
} from "./connection-manager";
import type {
  HubName,
  RealtimeStatus,
  UseSignalRHubOptions,
  UseSignalRHubResult,
} from "./types";

function mapState(state: HubConnectionState): RealtimeStatus {
  switch (state) {
    case HubConnectionState.Connected:
      return "connected";
    case HubConnectionState.Connecting:
      return "connecting";
    case HubConnectionState.Reconnecting:
      return "reconnecting";
    default:
      return "disconnected";
  }
}

/**
 * Generic, reusable SignalR hub hook. Hub-name driven, supports any number of
 * hubs (each backed by a shared, ref-counted connection from the connection
 * manager). Registers server→client event handlers, tracks connection status,
 * and cleans up automatically on unmount.
 */
export function useSignalRHub(
  hub: HubName,
  options: UseSignalRHubOptions = {}
): UseSignalRHubResult {
  const { enabled = true, events, onConnected } = options;

  const [status, setStatus] = useState<RealtimeStatus>("idle");
  const [connection, setConnection] = useState<HubConnection | null>(null);

  // Latest callbacks/bindings, kept in refs and updated in an effect (never
  // during render) so the connect effect depends only on (hub, enabled) and
  // never tears the socket down when props change.
  const eventsRef = useRef(events);
  const onConnectedRef = useRef(onConnected);
  const connectionRef = useRef<HubConnection | null>(null);

  useEffect(() => {
    eventsRef.current = events;
    onConnectedRef.current = onConnected;
  });

  useEffect(() => {
    if (!enabled) {
      setStatus("idle");
      return;
    }

    let cancelled = false;
    const conn = acquireConnection(hub);
    connectionRef.current = conn;
    setConnection(conn);

    const bindings = eventsRef.current ?? [];
    for (const { method, handler } of bindings) {
      conn.on(method, handler);
    }

    const handleReconnecting = () => {
      if (!cancelled) setStatus("reconnecting");
    };
    const handleReconnected = async () => {
      if (cancelled) return;
      setStatus("connected");
      await onConnectedRef.current?.(conn);
    };
    const handleClose = () => {
      if (!cancelled) setStatus("disconnected");
    };

    conn.onreconnecting(handleReconnecting);
    conn.onreconnected(handleReconnected);
    conn.onclose(handleClose);

    // A shared connection may already be mid-lifecycle (connected/reconnecting);
    // otherwise we're about to start it, so reflect "connecting".
    setStatus(
      conn.state === HubConnectionState.Disconnected
        ? "connecting"
        : mapState(conn.state)
    );

    ensureStarted(hub)
      .then(async () => {
        if (cancelled) return;
        setStatus("connected");
        await onConnectedRef.current?.(conn);
      })
      .catch(() => {
        if (!cancelled) setStatus("disconnected");
      });

    return () => {
      cancelled = true;
      for (const { method, handler } of bindings) {
        conn.off(method, handler);
      }
      void releaseConnection(hub);
      connectionRef.current = null;
    };
  }, [hub, enabled]);

  const invoke = <TResult = void>(
    method: string,
    ...args: unknown[]
  ): Promise<TResult> => {
    const conn = connectionRef.current;
    if (!conn || conn.state !== HubConnectionState.Connected) {
      return Promise.reject(
        new Error(`Cannot invoke "${method}": hub "${hub}" is not connected`)
      );
    }
    return conn.invoke<TResult>(method, ...args);
  };

  return { connection, status, invoke };
}
