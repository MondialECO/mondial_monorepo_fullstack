import axios from "axios";

const api = axios.create({
  baseURL: "https://api.mondialbusiness.eu/api",
  // baseURL: "https://localhost:7264/api",
});

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

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      try {
        localStorage.clear();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      } catch {
        // localStorage not available
      }
    }
    return Promise.reject(err);
  }
);

export default api;
