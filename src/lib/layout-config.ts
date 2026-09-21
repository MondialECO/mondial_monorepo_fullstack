/**
 * Routes that render without the sidebar and with reduced top bar chrome (logo, breadcrumb, avatar only).
 * Adding a new Phase 2 variant requires an explicit edit here — it will not be captured by naming convention.
 */
export const SIDEBAR_SUPPRESSED_ROUTE_PREFIXES = [
  "/dashboard/creator/phase-2",
  "/dashboard/entrepreneur/phase-2",
  "/dashboard/creator/humainx",
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

/**
 * Semantic layout-mode decision: Check if a route manages its own full-bleed workspace
 * and should not receive the default outer dashboard shell content padding.
 * Standard pages receive shell padding; true workspace routes own their internal spacing.
 */
export function isUnpaddedDashboardRoute(pathname: string): boolean {
  // Phase 2 chrome routes manage their own full-bleed canvas and internal padding
  if (isPhase2ChromeRoute(pathname)) return true;
  return false;
}
