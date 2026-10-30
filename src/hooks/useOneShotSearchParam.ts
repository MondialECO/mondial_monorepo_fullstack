"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * A URL flag that may trigger something once (e.g. a paid regenerate). It is captured on first
 * render and stripped from the URL immediately, so a refresh, the back button or a bookmark can
 * never replay it. `take()` returns true at most once.
 */
export function useOneShotSearchParam(name: string, value = "1"): () => boolean {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pending = useRef(searchParams.get(name) === value);

  useEffect(() => {
    if (!searchParams.has(name)) return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete(name);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [name, pathname, router, searchParams]);

  return () => {
    if (!pending.current) return false;
    pending.current = false;
    return true;
  };
}
