import { API_ORIGIN } from "./api-config";

/**
 * Resolves a brand asset URI (relative or absolute) to a fully qualified URL
 * that can be loaded in <img> tags, CSS background images, or client fetch requests.
 */
export function resolveMediaUrl(
  uri?: string | null,
  version?: number | string
): string {
  if (!uri) return "";
  const trimmed = uri.trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("<svg") || trimmed.startsWith("<?xml")) {
    return `data:image/svg+xml;utf8,${encodeURIComponent(trimmed)}`;
  }

  let base = trimmed;
  if (
    !trimmed.startsWith("http://") &&
    !trimmed.startsWith("https://") &&
    !trimmed.startsWith("data:") &&
    !trimmed.startsWith("blob:")
  ) {
    const cleanPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
    base = `${API_ORIGIN}${cleanPath}`;
  }

  if (version !== undefined && version !== null) {
    const separator = base.includes("?") ? "&" : "?";
    return `${base}${separator}v=${version}`;
  }

  return base;
}
