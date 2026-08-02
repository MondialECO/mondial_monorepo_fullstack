import type { PortfolioItem } from "@/types/service-provider";

/**
 * Mirrors ServiceProviderLimits.MaxPortfolioItems on the backend. Portfolio
 * items are embedded in the provider document, so an unbounded list grows that
 * document towards the 16 MB BSON ceiling. The server is authoritative — this
 * copy only lets the UI disable "Add item" before a doomed request is sent.
 */
export const MAX_PORTFOLIO_ITEMS = 20;

export function isPortfolioFull(items: PortfolioItem[]) {
  return items.length >= MAX_PORTFOLIO_ITEMS;
}

/**
 * Identify the item an add-mutation just created, by diffing ids against the
 * list we held before the call. Returns null when the answer is ambiguous —
 * a concurrent add from another tab can land in the same response, and
 * guessing (for example "the last one") would attach the image to the wrong
 * item. Callers surface a retry instead of silently mis-filing the upload.
 */
export function findAddedPortfolioItem(
  before: PortfolioItem[],
  after: PortfolioItem[]
): PortfolioItem | null {
  const existing = new Set(before.map((item) => item.id).filter(Boolean));
  const added = after.filter((item) => item.id && !existing.has(item.id));
  return added.length === 1 ? added[0] : null;
}
