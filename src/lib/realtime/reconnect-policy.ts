import type { IRetryPolicy, RetryContext } from "@microsoft/signalr";

// Capped exponential backoff with full jitter. SignalR calls this on every
// reconnect attempt; returning a number schedules the next retry after that
// many ms, returning null stops retrying.
//
// Schedule (pre-jitter): 0s, 2s, 5s, 10s, 20s, then 30s steady-state.
// Jitter spreads reconnect storms when many clients drop at once (e.g. a
// backend redeploy) so they don't all reconnect on the same tick.
const BACKOFF_MS = [0, 2_000, 5_000, 10_000, 20_000];
const MAX_DELAY_MS = 30_000;

export class CappedBackoffRetryPolicy implements IRetryPolicy {
  nextRetryDelayInMilliseconds(context: RetryContext): number | null {
    const base =
      context.previousRetryCount < BACKOFF_MS.length
        ? BACKOFF_MS[context.previousRetryCount]
        : MAX_DELAY_MS;

    // Full jitter: random in [base/2, base]. Index 0 stays immediate.
    if (base === 0) return 0;
    const half = base / 2;
    return Math.floor(half + Math.random() * half);
  }
}

// Indefinite reconnection — a long-lived app connection should keep trying.
// Callers that need a bounded policy can construct their own.
export const defaultRetryPolicy = new CappedBackoffRetryPolicy();
