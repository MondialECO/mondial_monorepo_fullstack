import { API_ORIGIN } from "./api-config";

/**
 * Resolves a brand asset URI (relative or absolute) to a fully qualified URL
 * that can be loaded in <img> tags, CSS background images, or client fetch requests.
 */
export function resolveMediaUrl(uri?: string | null): string {
  if (!uri) return "";
  const trimmed = uri.trim();
  if (!trimmed) return "";
  
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:")
  ) {
    return trimmed;
  }

  const cleanPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${API_ORIGIN}${cleanPath}`;
}
