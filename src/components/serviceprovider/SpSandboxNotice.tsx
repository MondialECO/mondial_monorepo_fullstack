'use client';

import { useEffect, useState } from 'react';
import { FlaskConical, X } from 'lucide-react';

const DISMISS_KEY = 'sp-sandbox-notice-dismissed';

/**
 * One environment-level notice for the whole SP surface, replacing the per-panel STUB
 * disclaimers the workroom used to stack.
 *
 * The workroom previously carried ten of these — four permanent banners, three inline
 * "· STUB-backed" suffixes on metric values, and three more inside dialogs and toasts.
 * Two tabs opened with two stacked info banners before any content. The cost was not the
 * space: a provider who is shown the same non-actionable warning ten times learns to skip
 * banners, and dispute and payment-blocked warnings live in exactly that space.
 *
 * Dismissal is per-session (sessionStorage), so it reappears on a fresh sign-in rather
 * than disappearing forever.
 */
export function SpSandboxNotice() {
  // Starts hidden so the server and first client render agree; the effect reveals it.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(DISMISS_KEY) !== '1') setVisible(true);
  }, []);

  if (!visible) return null;

  return (
    <div className="flex items-center gap-2 border-b border-warning/30 bg-warning/10 px-4 py-2 text-xs text-warning sm:px-6 lg:px-8">
      <FlaskConical className="size-3.5 shrink-0" aria-hidden="true" />
      <p className="min-w-0 flex-1">
        Sandbox mode — payments, payouts, file scanning and contract signing are simulated.
        No real money moves.
      </p>
      <button
        type="button"
        onClick={() => {
          sessionStorage.setItem(DISMISS_KEY, '1');
          setVisible(false);
        }}
        aria-label="Dismiss sandbox notice"
        className="shrink-0 rounded p-0.5 outline-none transition-colors hover:bg-warning/20 focus-visible:ring-2 focus-visible:ring-warning"
      >
        <X className="size-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
