import { MenuItem, MenuSection } from "./menu";

/**
 * Extracts all unique navigation hrefs across all sections and sub-items.
 */
export function getAllMenuHrefs(sections: MenuSection[]): string[] {
  const hrefs: string[] = [];
  for (const section of sections) {
    for (const item of section.items) {
      hrefs.push(item.href);
      if (item.children) {
        for (const child of item.children) {
          hrefs.push(child.href);
        }
      }
    }
  }
  return hrefs;
}

/**
 * Robust active route matching supporting exact paths, query parameters,
 * default fallback params, and non-colliding subpath prefixes.
 */
export function isMenuHrefActive(
  itemHref: string,
  pathname: string,
  searchParams: URLSearchParams | { get: (key: string) => string | null } = new URLSearchParams(),
  allSectionHrefs: string[] = []
): boolean {
  const [itemPath, itemQuery = ""] = itemHref.split("?");

  // 1. If item specifies query parameters (e.g. ?view=leads, ?view=proposals, ?tab=activity, etc.)
  if (itemQuery) {
    if (pathname !== itemPath) return false;
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
  if (pathname === itemPath) {
    // If the item itself has no query params, but there are other sibling items at this exact same pathname with query params,
    // we should only match if no query-specific sibling matches the current query params.
    const querySiblingMatches = allSectionHrefs.some((otherHref) => {
      const [otherPath, otherQuery] = otherHref.split("?");
      if (otherPath === itemPath && otherQuery) {
        return isMenuHrefActive(otherHref, pathname, searchParams, allSectionHrefs);
      }
      return false;
    });

    if (querySiblingMatches) {
      return false;
    }

    return true;
  }

  // 3. Sub-path / Prefix match (e.g., /dashboard/creator/partnerships/deal-123)
  const isDashboardRoot =
    itemPath === "/dashboard/creator" ||
    itemPath === "/dashboard/investor" ||
    itemPath === "/dashboard/entrepreneur" ||
    itemPath === "/dashboard/serviceprovider" ||
    itemPath === "/dashboard/admin";

  if (!isDashboardRoot && pathname.startsWith(itemPath + "/")) {
    // Check if another sibling menu item has a longer matching prefix (avoid collision)
    const hasMoreSpecificSibling = allSectionHrefs.some((otherHref) => {
      const [otherPath] = otherHref.split("?");
      return (
        otherPath !== itemPath &&
        (pathname === otherPath || pathname.startsWith(otherPath + "/")) &&
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
    const [parentPath] = item.href.split("?");
    return (
      pathname === parentPath ||
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

  // URL-derived active child check
  const hasActiveChild = item.children.some((child) =>
    isMenuHrefActive(child.href, pathname, searchParams, allSectionHrefs)
  );

  // Direct parent path match
  const [parentPath] = item.href.split("?");
  const isParentPath = pathname === parentPath;

  const urlDerivedActive = hasActiveChild || isParentPath;

  if (manuallyExpanded !== undefined) {
    return manuallyExpanded;
  }

  return urlDerivedActive;
}
