"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useSignalRHub, hubEvent } from "@/lib/realtime";
import { applyDealUpdate, dealKeys } from "./deals";
import type { DealStatus } from "@/types/deals";

// Server→client deal events (Phase D-4.5), delivered on the per-user
// notifications group. Each carries the updated DealStatus payload.
const DEAL_EVENTS = [
  "OfferReceived",
  "OfferViewed",
  "OfferCountered",
  "OfferAccepted",
  "OfferRejected",
  "DealUpdated",
] as const;

/**
 * Subscribes to deal realtime events on the existing notifications hub and
 * keeps the TanStack Query cache live. Returns the connection status.
 *
 * The handler depends only on the (stable) QueryClient + module-level cache
 * helpers, so no ref indirection is needed.
 */
export function useDealRealtime(enabled: boolean) {
  const qc = useQueryClient();

  const onDealEvent = (deal: DealStatus) => {
    if (deal?.dealId) applyDealUpdate(qc, deal);
    else qc.invalidateQueries({ queryKey: dealKeys.list });
  };

  const { status } = useSignalRHub("notifications", {
    enabled,
    events: DEAL_EVENTS.map((name) => hubEvent<DealStatus>(name, onDealEvent)),
  });

  return status;
}
