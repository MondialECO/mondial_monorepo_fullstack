/**
 * Utilities for Creator journey route handling and idea context propagation.
 */

/**
 * Appends `?ideaId={ideaId}` to a given route URL if an ideaId is present.
 * Preserves any existing query parameters and prevents duplicate `ideaId` keys.
 */
export function withIdeaContext(route: string, ideaId?: string | null): string {
  if (!ideaId) return route;

  const [path, queryString] = route.split('?');
  const params = new URLSearchParams(queryString || '');
  params.set('ideaId', ideaId);

  const query = params.toString();
  return query ? `${path}?${query}` : path;
}
