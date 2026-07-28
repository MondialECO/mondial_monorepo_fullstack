'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export const UNSAVED_CHANGES_MESSAGE = 'You have unsaved changes. Leave this page and discard them?';

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, canonicalize(entry)]),
    );
  }
  return value;
}

export function formStateFingerprint(value: unknown) {
  return JSON.stringify(canonicalize(value));
}

export function hasFormChanged(current: unknown, baseline: unknown) {
  return formStateFingerprint(current) !== formStateFingerprint(baseline);
}

export function useSpDirtyFormGuard<T>(currentState: T, options?: { enabled?: boolean }) {
  const router = useRouter();
  const currentFingerprint = useMemo(() => formStateFingerprint(currentState), [currentState]);
  const [baselineFingerprint, setBaselineFingerprint] = useState(currentFingerprint);
  const enabled = options?.enabled ?? true;
  const dirty = enabled && currentFingerprint !== baselineFingerprint;
  const dirtyRef = useRef(dirty);
  const currentFingerprintRef = useRef(currentFingerprint);

  useEffect(() => {
    dirtyRef.current = dirty;
    currentFingerprintRef.current = currentFingerprint;
  }, [currentFingerprint, dirty]);

  const markClean = useCallback((state?: T) => {
    setBaselineFingerprint(state === undefined ? currentFingerprintRef.current : formStateFingerprint(state));
  }, []);

  const confirmDiscard = useCallback((onConfirm: () => void) => {
    if (!dirtyRef.current || window.confirm(UNSAVED_CHANGES_MESSAGE)) {
      dirtyRef.current = false;
      onConfirm();
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    if (!dirty) return;

    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    const interceptInternalLink = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest('a[href]');
      if (!(anchor instanceof HTMLAnchorElement) || anchor.target === '_blank' || anchor.hasAttribute('download')) return;

      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin) return;
      if (`${destination.pathname}${destination.search}${destination.hash}` === `${window.location.pathname}${window.location.search}${window.location.hash}`) return;

      event.preventDefault();
      if (!window.confirm(UNSAVED_CHANGES_MESSAGE)) return;
      dirtyRef.current = false;
      router.push(`${destination.pathname}${destination.search}${destination.hash}`);
    };

    window.addEventListener('beforeunload', beforeUnload);
    document.addEventListener('click', interceptInternalLink, true);
    return () => {
      window.removeEventListener('beforeunload', beforeUnload);
      document.removeEventListener('click', interceptInternalLink, true);
    };
  }, [dirty, router]);

  return { dirty, markClean, confirmDiscard };
}
