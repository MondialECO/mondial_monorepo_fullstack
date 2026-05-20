import axios from "axios";

const api = axios.create({
  baseURL: "https://api.mondialbusiness.eu/api",
  // baseURL: "https://localhost:7264/api",
});

// Track whether we're already attempting a refresh to prevent infinite loops
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
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
