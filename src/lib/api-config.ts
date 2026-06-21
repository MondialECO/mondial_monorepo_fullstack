// Single source of truth for the backend API base URL.
//
// NEXT_PUBLIC_* values are inlined at BUILD time, not read at runtime — so this
// must be set before `next build`. To prevent accidentally shipping a
// production bundle baked with a localhost URL, we fall back to localhost ONLY
// outside production and fail the build loudly otherwise. There is no runtime
// fix for a wrong value; the bundle must be rebuilt.

const RAW = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
const DEV_FALLBACK = "http://localhost:5093/api";

function resolveApiBaseUrl(): string {
  if (RAW) return RAW.replace(/\/+$/, "");
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "NEXT_PUBLIC_API_BASE_URL is not set. It must be defined at build time " +
        "(e.g. https://api.your-domain.com/api). Refusing to fall back to " +
        "localhost in a production build."
    );
  }
  return DEV_FALLBACK;
}

// Full REST base, e.g. https://api.your-domain.com/api (no trailing slash).
export const API_BASE_URL = resolveApiBaseUrl();

// Server origin without the trailing /api — used for SignalR hubs (/hubs/*)
// and for resolving relative media paths.
export const API_ORIGIN = API_BASE_URL.replace(/\/api$/, "");
