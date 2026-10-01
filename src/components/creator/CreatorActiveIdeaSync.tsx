'use client';

import { useEffect, useRef } from 'react';
import { creatorJourneyApi } from '@/lib/api-creator-journey';
import {
  ACTIVE_IDEA_SIGNAL_KEY,
  ActiveIdeaSignalPayload,
  getTabId,
  getAuthUserId,
  cancelAllPendingSaves,
  buildReloadUrlForNewIdea,
} from '@/lib/creator-tab-sync';

/**
 * Headless cross-tab active idea synchronization coordinator.
 * Listens for storage events from other tabs when the user changes active idea,
 * re-reads authoritative backend selection, cancels pending saves, and reloads
 * open Creator tabs into the new active idea on their same route.
 */
export function CreatorActiveIdeaSync() {
  const lastHandledTimeRef = useRef<number>(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageEvent = async (event: StorageEvent) => {
      if (event.key !== ACTIVE_IDEA_SIGNAL_KEY || !event.newValue) return;

      try {
        const payload: ActiveIdeaSignalPayload = JSON.parse(event.newValue);
        if (!payload || !payload.ideaId) return;

        // Ignore events triggered by this exact tab
        if (payload.tabId === getTabId()) return;

        // Account isolation: ignore events belonging to a different user
        const currentUserId = getAuthUserId();
        if (payload.userId && currentUserId && payload.userId !== currentUserId) {
          return;
        }

        // Prevent processing stale or out-of-order notifications
        if (payload.timestamp && payload.timestamp <= lastHandledTimeRef.current) {
          return;
        }
        lastHandledTimeRef.current = payload.timestamp || Date.now();

        // Only synchronize active Creator dashboard/project routes
        if (!window.location.pathname.startsWith('/dashboard/creator')) {
          return;
        }

        // Check displayed/stored idea in this tab
        const search = new URLSearchParams(window.location.search);
        const currentIdeaId = search.get('ideaId') || search.get('idea') || sessionStorage.getItem('creator_workspace_idea_id');

        // Verify with authoritative backend account journey before reloading
        const { journey } = await creatorJourneyApi.getAccountJourney();
        const authoritativeId = journey.activeIdeaId;

        if (!authoritativeId || authoritativeId === currentIdeaId) {
          return;
        }

        // Cleanly cancel pending debounced writes or blur saves
        cancelAllPendingSaves();

        // Perform clean full-page reload into the new idea on the same route
        const targetUrl = buildReloadUrlForNewIdea(window.location.href, authoritativeId);
        window.location.replace(targetUrl);
      } catch {
        // Resilient handling of malformed storage payloads
      }
    };

    window.addEventListener('storage', handleStorageEvent);
    return () => {
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, []);

  return null;
}
