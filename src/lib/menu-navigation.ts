import { MenuItem, MenuSection } from "./menu";

/**
 * Extracts all unique navigation hrefs across all sections and sub-items.
 */
export function getAllMenuHrefs(sections: MenuSection[]): string[] {
  const hrefs: string[] = [];
  for (const section of sections) {
    for (const item of section.items) {
      if (item.href && !item.href.startsWith("#")) {
        hrefs.push(item.href);
      }
      if (item.children) {
        for (const child of item.children) {
          if (child.href && !child.href.startsWith("#")) {
            hrefs.push(child.href);
          }
        }
      }
    }
  }
  return hrefs;
}

// Known route aliases mapping internal workflow/redirect routes to canonical sidebar menu destinations
export const CREATOR_ROUTE_ALIASES: Record<string, string> = {
  // Phase 2 Brand Studio sub-steps & Brand Kit -> Brand Studio
  "/dashboard/creator/phase-2/branding": "/dashboard/creator/phase-2/brand-studio",
  "/dashboard/creator/phase-2/logo-tool": "/dashboard/creator/phase-2/brand-studio",
  "/dashboard/creator/phase-2/hire-designer": "/dashboard/creator/phase-2/brand-studio",
  "/dashboard/creator/phase-2/brand-kit": "/dashboard/creator/phase-2/brand-studio",

  // Phase 2 completion transition -> Brand Studio
  "/dashboard/creator/phase-2/complete": "/dashboard/creator/phase-2/brand-studio",

  // Phase 3 root redirect -> Market Study
  "/dashboard/creator/phase-3": "/dashboard/creator/phase-3/market-study",

  // Phase 4.8 alias: /assets -> /launch-assets
  "/dashboard/creator/phase-4/assets": "/dashboard/creator/phase-4/launch-assets",

  // Canonical redirect aliases
  "/dashboard/creator/ip-vault": "/dashboard/creator/documents",
  "/dashboard/creator/hire-providers": "/marketplace/services",
  "/dashboard/creator/marketplace": "/marketplace/projects",
  "/dashboard/creator/profile": "/dashboard/profile",
};

/**
 * Checks if a pathname belongs to Creator Phase 4 (Construction & Launch Preparation).
 */
export function isPhase4Route(pathname: string): boolean {
  return (
    pathname === "/dashboard/creator/phase-4" ||
    pathname.startsWith("/dashboard/creator/phase-4/")
  );
}

/**
 * Internal Creator workflow routes that keep the "Build My Project" parent active/expanded
 * without highlighting a dedicated child item.
 */
export function isClarifierWorkflowRoute(pathname: string): boolean {
  return (
    pathname === "/dashboard/creator/phase-2" ||
    pathname === "/dashboard/creator/phase-2/clarifier" ||
    pathname === "/dashboard/creator/clarifier" ||
    pathname === "/dashboard/creator/phase-2/concept-name" ||
    pathname === "/dashboard/creator/phase-2/idea-summary"
  );
}

/**
 * Robust active route matching supporting exact paths, query parameters,
 * default fallback params, non-colliding subpath prefixes, and workflow aliases.
 */
export function isMenuHrefActive(
  itemHref: string,
  pathname: string,
  searchParams: URLSearchParams | { get: (key: string) => string | null } = new URLSearchParams(),
  allSectionHrefs: string[] = []
): boolean {
  const [itemPath, itemQuery = ""] = itemHref.split("?");

  // Resolve alias if current pathname is an internal step or redirect alias
  let effectivePathname = CREATOR_ROUTE_ALIASES[pathname] || pathname;
  if (pathname.startsWith("/dashboard/creator/profile/")) {
    effectivePathname = "/dashboard/profile";
  }

  // 1. If item specifies query parameters (e.g. ?view=leads, ?view=proposals, ?tab=activity, etc.)
  if (itemQuery) {
    if (effectivePathname !== itemPath) return false;
    const expected = new URLSearchParams(itemQuery);
    for (const [key, value] of expected.entries()) {
      const current = searchParams.get(key);
      if (current === value) continue;
      // Recognized defaults when param is not present in URL
      if (key === "view" && value === "leads" && (current === null || current === "saved")) continue;
      if (key === "view" && value === "active" && current === null) continue;
      if (key === "tab" && value === "activity" && current === null) continue;
      return false;
    }
    return true;
  }

  // 2. Exact pathname match
  if (effectivePathname === itemPath) {
    // If the item itself has no query params, but there are other sibling items at this exact same pathname with query params,
    // we should only match if no query-specific sibling matches the current query params.
    const querySiblingMatches = allSectionHrefs.some((otherHref) => {
      const [otherPath, otherQuery] = otherHref.split("?");
      if (otherPath === itemPath && otherQuery) {
        return isMenuHrefActive(otherHref, effectivePathname, searchParams, allSectionHrefs);
      }
      return false;
    });

    if (querySiblingMatches) {
      return false;
    }

    return true;
  }

  // 3. Sub-path / Prefix match (e.g., /dashboard/creator/partnerships/deal-123)
  // Roots that require exact match only to avoid false-positive child highlighting
  const isDashboardRoot =
    itemPath === "/dashboard/creator" ||
    itemPath === "/dashboard/investor" ||
    itemPath === "/dashboard/entrepreneur" ||
    itemPath === "/dashboard/serviceprovider" ||
    itemPath === "/dashboard/admin" ||
    itemPath === "/dashboard/creator/phase-4";

  if (!isDashboardRoot && effectivePathname.startsWith(itemPath + "/")) {
    // Check if another sibling menu item has a longer matching prefix (avoid collision)
    const hasMoreSpecificSibling = allSectionHrefs.some((otherHref) => {
      const [otherPath] = otherHref.split("?");
      return (
        otherPath !== itemPath &&
        (effectivePathname === otherPath || effectivePathname.startsWith(otherPath + "/")) &&
        otherPath.length > itemPath.length
      );
    });

    return !hasMoreSpecificSibling;
  }

  return false;
}

/**
 * Checks if a parent menu item is active (either directly or via any active child).
 */
export function isMenuParentActive(
  item: MenuItem,
  pathname: string,
  searchParams: URLSearchParams | { get: (key: string) => string | null } = new URLSearchParams(),
  allSectionHrefs: string[] = []
): boolean {
  if (item.children && item.children.length > 0) {
    if (item.label === "Build My Project" && isClarifierWorkflowRoute(pathname)) {
      return true;
    }

    if (
      (item.label === "Launch Preparation" ||
        item.label === "Construction & Launch Preparation" ||
        item.label === "Construction & Launch") &&
      isPhase4Route(pathname)
    ) {
      return true;
    }

    const [parentPath] = item.href.split("?");
    return (
      (parentPath !== "#" && !parentPath.startsWith("#") && pathname === parentPath) ||
      item.children.some((child) =>
        isMenuHrefActive(child.href, pathname, searchParams, allSectionHrefs)
      )
    );
  }
  return isMenuHrefActive(item.href, pathname, searchParams, allSectionHrefs);
}

/**
 * Determines whether a parent menu item should be expanded.
 * Combines URL-derived active child state with manual toggle override.
 */
export function isParentItemExpanded(
  item: MenuItem,
  pathname: string,
  searchParams: URLSearchParams | { get: (key: string) => string | null } = new URLSearchParams(),
  manuallyExpanded?: boolean,
  allSectionHrefs: string[] = []
): boolean {
  if (!item.children || item.children.length === 0) return false;

  // Auto-expand if on Phase 4
  if (
    isPhase4Route(pathname) &&
    (item.label === "Launch Preparation" ||
      item.label === "Construction & Launch Preparation" ||
      item.label === "Construction & Launch" ||
      item.href === "/dashboard/creator/phase-4")
  ) {
    if (manuallyExpanded !== undefined) {
      return manuallyExpanded;
    }
    return true;
  }

  // URL-derived active child check
  const hasActiveChild = item.children.some((child) =>
    isMenuHrefActive(child.href, pathname, searchParams, allSectionHrefs)
  );

  // Direct parent path match or internal Clarifier workflow match
  const [parentPath] = item.href.split("?");
  const isParentPath =
    (parentPath !== "#" && !parentPath.startsWith("#") && pathname === parentPath) ||
    (item.label === "Build My Project" && isClarifierWorkflowRoute(pathname));

  const urlDerivedActive = hasActiveChild || isParentPath;

  if (manuallyExpanded !== undefined) {
    return manuallyExpanded;
  }

  return urlDerivedActive;
}
