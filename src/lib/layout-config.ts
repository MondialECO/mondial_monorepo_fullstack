/**
 * Routes that render without the sidebar and with reduced top bar chrome (logo, breadcrumb, avatar only).
 * Adding a new Phase 2 variant requires an explicit edit here — it will not be captured by naming convention.
 */
export const SIDEBAR_SUPPRESSED_ROUTE_PREFIXES = [
  "/dashboard/creator/phase-2",
  "/dashboard/entrepreneur/phase-2",
] as const;

/**
 * Check if a pathname uses Phase 2 chrome layout:
 * - Sidebar hidden
 * - Top bar reduced to logo, breadcrumb, and avatar only
 * - Content full-bleed (padding suppressed)
 *
 * Matches on segment boundary: the route itself or the route followed by a separator.
 * Prefix-only matches are rejected to avoid capturing unrelated routes.
 */
export function isPhase2ChromeRoute(pathname: string): boolean {
  return SIDEBAR_SUPPRESSED_ROUTE_PREFIXES.some((route) => {
    // Exact match: /dashboard/creator/phase-2
    if (pathname === route) return true;
    // Segment boundary match: /dashboard/creator/phase-2/...
    if (pathname.startsWith(route + "/")) return true;
    return false;
  });
}
