import axios from "axios";

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5093/api";

const api = axios.create({
  baseURL: apiBaseUrl,
});

// Track whether we're already attempting a refresh to prevent infinite loops
let isRefreshing = false;
interface QueueItem {
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}
let failedQueue: QueueItem[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });

  isRefreshing = false;
  failedQueue = [];
};

// ✅ REQUEST INTERCEPTOR - Adds token to all requests
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // localStorage not available (e.g., SSR context)
  }
  return config;
});

// ✅ RESPONSE INTERCEPTOR - Handles 401 and attempts token refresh
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;
    const requestUrl = String(originalRequest?.url ?? "");
    const publicAuthPaths = [
      "/auth/login",
      "/auth/register",
      "/auth/forgot-password",
      "/auth/reset-password",
      "/auth/confirm-email",
      "/auth/resend-confirmation-email",
    ];
    const isPublicAuthRequest = publicAuthPaths.some((path) =>
      requestUrl.includes(path)
    );
    const isRefreshRequest = requestUrl.includes("/auth/refresh-token");
    const storedToken =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;

    // Public auth endpoints can legitimately return 401/400 and should not
    // trigger session-expired redirects or refresh-token retries.
    if (isPublicAuthRequest || isRefreshRequest || !storedToken) {
      return Promise.reject(err);
    }

    if (err.response?.status === 401 && !originalRequest._retry) {
      // Prevent infinite retry loops
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch((err) => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt to refresh the token
        // Note: Adjust endpoint based on your backend's actual refresh token endpoint
        const response = await axios.post(
          `${api.defaults.baseURL}/auth/refresh-token`,
          {},
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        const { token: newToken } = response.data;

        // Update stored token
        localStorage.setItem("token", newToken);

        // Update authorization header for this request
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        // Process queued requests
        processQueue(null, newToken);

        // Retry original request with new token
        return api(originalRequest);
      } catch (refreshError) {
        // Token refresh failed - redirect to login
        try {
          localStorage.clear();
          if (typeof window !== "undefined") {
            window.location.href = "/login?reason=session_expired";
          }
        } catch {
          // localStorage not available
        }

        processQueue(refreshError, null);
        return Promise.reject(refreshError);
      }
    }

    // For any other error, clear localStorage if it's still a 401
    if (err.response?.status === 401 && !originalRequest._retry) {
      try {
        localStorage.clear();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      } catch {
        // localStorage not available (e.g., SSR context)
      }
    }

    return Promise.reject(err);
  }
);

export default api;
