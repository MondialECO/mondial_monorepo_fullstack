/**
 * Cross-tab synchronization coordinator for Creator active idea.
 *
 * Product Rule:
 * A user may own multiple ideas, but all Creator project tabs follow the same selected idea.
 * Selecting Idea B notifies open Creator tabs via localStorage storage events,
 * and receiving tabs cleanly reload into Idea B on their current route.
 * Unsaved input is discarded without switch-triggered saves or confirmation modals.
 */

export const ACTIVE_IDEA_SIGNAL_KEY = 'mondial_active_idea_signal';

export interface ActiveIdeaSignalPayload {
  ideaId: string;
  userId: string | null;
  timestamp: number;
  tabId: string;
}

let tabId: string | null = null;
export function getTabId(): string {
  if (!tabId) {
    tabId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `tab-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
  return tabId;
}

export function getAuthUserId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    const user = JSON.parse(raw);
    return user?.id ?? null;
  } catch {
    return null;
  }
}

/** Flag indicating this tab is undergoing a forced reload due to an idea switch */
let isReloadingForSwitch = false;

export function isTabReloadingForSwitch(): boolean {
  return isReloadingForSwitch;
}

export function setTabReloadingForSwitch(reloading: boolean): void {
  isReloadingForSwitch = reloading;
}

/** Registry of pending save cancellation callbacks */
const saveCancellationCallbacks = new Set<() => void>();

export function registerSaveCancellation(cancelFn: () => void): () => void {
  saveCancellationCallbacks.add(cancelFn);
  return () => {
    saveCancellationCallbacks.delete(cancelFn);
  };
}

export function cancelAllPendingSaves(): void {
  isReloadingForSwitch = true;
  saveCancellationCallbacks.forEach((fn) => {
    try {
      fn();
    } catch (err) {
      console.warn('Error in save cancellation callback:', err);
    }
  });
}

/**
 * Broadcast an active idea change to other browser tabs via localStorage.
 * Storage events only fire in OTHER tabs/windows, not the initiating tab.
 */
export function notifyActiveIdeaChanged(ideaId: string, userId?: string | null): void {
  if (typeof window === 'undefined' || !ideaId) return;
  try {
    const effectiveUserId = userId ?? getAuthUserId();
    const payload: ActiveIdeaSignalPayload = {
      ideaId,
      userId: effectiveUserId,
      timestamp: Date.now(),
      tabId: getTabId(),
    };
    localStorage.setItem(ACTIVE_IDEA_SIGNAL_KEY, JSON.stringify(payload));
  } catch {
    // Quota or private mode safety
  }
}

/**
 * Reconstruct a target URL for an idea switch:
 * - Preserves pathname
 * - Updates or sets ideaId to targetIdeaId
 * - Removes legacy ?idea= parameter
 * - Preserves unrelated query parameters
 * - Preserves hash
 */
export function buildReloadUrlForNewIdea(currentHref: string, newIdeaId: string): string {
  try {
    const parsed = new URL(currentHref, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
    parsed.searchParams.delete('idea');
    parsed.searchParams.set('ideaId', newIdeaId);
    return parsed.pathname + parsed.search + parsed.hash;
  } catch {
    return currentHref;
  }
}
