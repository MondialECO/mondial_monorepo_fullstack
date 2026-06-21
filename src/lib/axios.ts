import axios from "axios";
import { API_BASE_URL } from "./api-config";

const api = axios.create({
  baseURL: API_BASE_URL,
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
    // If backend is offline (Network Error / no response) and we are on localhost, mock onboarding APIs
    const isOffline = !err.response || err.code === "ERR_NETWORK";
    const isLocalhost = typeof window !== "undefined" && window.location.hostname === "localhost";
    
    if (isOffline && isLocalhost && err.config) {
      const url = err.config.url || "";
      const method = (err.config.method || "").toUpperCase();

      if (url.includes("/onboarding/status") && method === "GET") {
        let mockStatus = JSON.parse(localStorage.getItem("mock_onboarding_status") || "null");
        if (!mockStatus) {
          mockStatus = {
            phase: 0,
            role: "Creator",
            items: {
              identity: { key: "identity", verified: false, required: true },
              face: { key: "face", verified: false, required: true },
              phone: { key: "phone", verified: false, required: true },
              email: { key: "email", verified: false, required: true },
              residence: { key: "residence", verified: false, required: false },
              income: { key: "income", verified: false, required: false },
              tax: { key: "tax", verified: false, required: false },
              license: { key: "license", verified: false, required: false },
            }
          };
          localStorage.setItem("mock_onboarding_status", JSON.stringify(mockStatus));
        }
        return { data: { success: true, data: mockStatus } };
      }

      if (url.includes("/creator/dashboard/stats") && method === "GET") {
        return {
          data: {
            totalIdeas: 1,
            totalClicksLast14Days: 1284,
            totalFundRaised: 0,
            totalRequired: 0,
            totalEquity: 0,
            activeInvestors: 0,
            ideas: [
              {
                id: "mock-idea-invoice-assistant",
                name: "AI Invoice Assistant",
                status: "APPROVED",
                stageLabel: "Concept Validated",
                isPublished: true,
                createdAt: "2026-06-08T10:00:00Z",
                fundingRequired: 0,
                equityOffered: 0,
                totalRaised: 0,
                fundingProgress: 0,
                investors: []
              }
            ]
          }
        };
      }

      if (url.includes("/creator/ideas") && method === "GET") {
        return {
          data: [
            {
              id: "mock-idea-invoice-assistant",
              name: "AI Invoice Assistant",
              status: "APPROVED",
              stageLabel: "Concept Validated",
              isPublished: true,
              createdAt: "2026-06-08T10:00:00Z",
              fundingRequired: 0,
              equityOffered: 0,
              totalRaised: 0,
              fundingProgress: 0,
              investors: []
            }
          ]
        };
      }

      if (url.includes("/service-provider/profile")) {
        if (method === "GET") {
          let mockProfile = JSON.parse(localStorage.getItem("mock_service_provider_profile") || "null");
          if (!mockProfile) {
            mockProfile = {
              providerId: "mock-provider-id",
              currentPhase: 1,
              verificationStatus: "Pending",
              trustScore: 4.8,
              skills: ["React", "Next.js", "TypeScript"],
              serviceCategories: ["Development", "Design"],
              portfolioItems: [],
              headline: "Expert Fullstack Web Developer",
              bio: "Building premium React/Next.js SaaS applications.",
              industries: ["SaaS", "Fintech"],
              languages: ["English", "Bengali"],
              pricingModels: ["Hourly", "ProjectBased"],
              completionPercent: 80,
              profileComplete: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            localStorage.setItem("mock_service_provider_profile", JSON.stringify(mockProfile));
          }
          return { data: { success: true, data: mockProfile } };
        }

        if (method === "PUT") {
          const payload = typeof err.config.data === "string" ? JSON.parse(err.config.data) : err.config.data;
          const mockProfile = JSON.parse(localStorage.getItem("mock_service_provider_profile") || "null") || {};
          const updatedProfile = {
            ...mockProfile,
            ...payload,
            updatedAt: new Date().toISOString()
          };
          
          let metCount = 0;
          const totalReqs = 8;
          if (updatedProfile.headline?.trim()) metCount++;
          if (updatedProfile.bio?.trim()) metCount++;
          if (updatedProfile.skills && updatedProfile.skills.length > 0) metCount++;
          if (updatedProfile.serviceCategories && updatedProfile.serviceCategories.length > 0) metCount++;
          if (updatedProfile.industries && updatedProfile.industries.length > 0) metCount++;
          if (updatedProfile.languages && updatedProfile.languages.length > 0) metCount++;
          if (updatedProfile.pricingModels && updatedProfile.pricingModels.length > 0) metCount++;
          if (updatedProfile.portfolioItems && updatedProfile.portfolioItems.length > 0) metCount++;
          updatedProfile.completionPercent = Math.round((metCount / totalReqs) * 100);
          updatedProfile.profileComplete = metCount === totalReqs;
          
          localStorage.setItem("mock_service_provider_profile", JSON.stringify(updatedProfile));
          return { data: { success: true, data: updatedProfile } };
        }
      }

      if (url.includes("/service-provider/portfolio")) {
        const mockProfile = JSON.parse(localStorage.getItem("mock_service_provider_profile") || "null") || {};
        
        if (method === "POST") {
          const payload = typeof err.config.data === "string" ? JSON.parse(err.config.data) : err.config.data;
          const newItem = {
            index: mockProfile.portfolioItems ? mockProfile.portfolioItems.length : 0,
            title: payload.title,
            description: payload.description,
            url: payload.url,
            imagePath: payload.imagePath,
            addedAt: new Date().toISOString()
          };
          if (!mockProfile.portfolioItems) mockProfile.portfolioItems = [];
          mockProfile.portfolioItems.push(newItem);
          mockProfile.updatedAt = new Date().toISOString();
          
          let metCount = 0;
          const totalReqs = 8;
          if (mockProfile.headline?.trim()) metCount++;
          if (mockProfile.bio?.trim()) metCount++;
          if (mockProfile.skills && mockProfile.skills.length > 0) metCount++;
          if (mockProfile.serviceCategories && mockProfile.serviceCategories.length > 0) metCount++;
          if (mockProfile.industries && mockProfile.industries.length > 0) metCount++;
          if (mockProfile.languages && mockProfile.languages.length > 0) metCount++;
          if (mockProfile.pricingModels && mockProfile.pricingModels.length > 0) metCount++;
          if (mockProfile.portfolioItems && mockProfile.portfolioItems.length > 0) metCount++;
          mockProfile.completionPercent = Math.round((metCount / totalReqs) * 100);
          mockProfile.profileComplete = metCount === totalReqs;

          localStorage.setItem("mock_service_provider_profile", JSON.stringify(mockProfile));
          return { data: { success: true, data: mockProfile } };
        }

        if (method === "PUT") {
          const payload = typeof err.config.data === "string" ? JSON.parse(err.config.data) : err.config.data;
          const idx = mockProfile.portfolioItems ? mockProfile.portfolioItems.findIndex((item: any) => item.index === payload.index) : -1;
          if (idx !== -1) {
            mockProfile.portfolioItems[idx] = {
              ...mockProfile.portfolioItems[idx],
              title: payload.title,
              description: payload.description,
              url: payload.url,
              imagePath: payload.imagePath,
            };
            mockProfile.updatedAt = new Date().toISOString();
            localStorage.setItem("mock_service_provider_profile", JSON.stringify(mockProfile));
          }
          return { data: { success: true, data: mockProfile } };
        }

        if (method === "DELETE") {
          const parts = url.split("/");
          const indexToDelete = parseInt(parts[parts.length - 1], 10);
          if (mockProfile.portfolioItems) {
            mockProfile.portfolioItems = mockProfile.portfolioItems.filter((item: any) => item.index !== indexToDelete);
            mockProfile.portfolioItems = mockProfile.portfolioItems.map((item: any, idx: number) => ({
              ...item,
              index: idx
            }));
          }
          mockProfile.updatedAt = new Date().toISOString();

          let metCount = 0;
          const totalReqs = 8;
          if (mockProfile.headline?.trim()) metCount++;
          if (mockProfile.bio?.trim()) metCount++;
          if (mockProfile.skills && mockProfile.skills.length > 0) metCount++;
          if (mockProfile.serviceCategories && mockProfile.serviceCategories.length > 0) metCount++;
          if (mockProfile.industries && mockProfile.industries.length > 0) metCount++;
          if (mockProfile.languages && mockProfile.languages.length > 0) metCount++;
          if (mockProfile.pricingModels && mockProfile.pricingModels.length > 0) metCount++;
          if (mockProfile.portfolioItems && mockProfile.portfolioItems.length > 0) metCount++;
          mockProfile.completionPercent = Math.round((metCount / totalReqs) * 100);
          mockProfile.profileComplete = metCount === totalReqs;

          localStorage.setItem("mock_service_provider_profile", JSON.stringify(mockProfile));
          return { data: { success: true, data: mockProfile } };
        }
      }

      if (url.includes("/service-provider/submit-verification") && method === "POST") {
        const mockProfile = JSON.parse(localStorage.getItem("mock_service_provider_profile") || "null") || {};
        mockProfile.verificationStatus = "UnderReview";
        mockProfile.verificationSubmittedAt = new Date().toISOString();
        mockProfile.updatedAt = new Date().toISOString();
        localStorage.setItem("mock_service_provider_profile", JSON.stringify(mockProfile));

        return {
          data: {
            success: true,
            data: {
              providerId: mockProfile.providerId,
              verificationStatus: "UnderReview",
              isVerified: false,
              verificationSubmittedAt: mockProfile.verificationSubmittedAt,
              trustScore: mockProfile.trustScore
            }
          }
        };
      }

      if (method === "POST") {
        const mockStatus = JSON.parse(localStorage.getItem("mock_onboarding_status") || "null");
        if (mockStatus) {
          let updated = false;
          if (url.includes("/onboarding/identity/dev-confirm")) {
            mockStatus.items.identity.verified = true;
            mockStatus.items.face.verified = true;
            updated = true;
          } else if (url.includes("/onboarding/phone/dev-confirm") || url.includes("/onboarding/verify-otp")) {
            mockStatus.items.phone.verified = true;
            updated = true;
          } else if (url.includes("/onboarding/verify-email-otp") || url.includes("/onboarding/email/dev-confirm")) {
            mockStatus.items.email.verified = true;
            updated = true;
          } else if (url.includes("/onboarding/send-otp") || url.includes("/onboarding/send-email-otp")) {
            return { data: { success: true, message: "OTP sent successfully (mocked)" } };
          }

          if (updated) {
            const allRequiredDone = Object.values(mockStatus.items).every(
              (item: any) => !item.required || item.verified
            );
            if (allRequiredDone) {
              mockStatus.phase = 1;
              try {
                const storedUser = JSON.parse(localStorage.getItem("user") || "null");
                if (storedUser) {
                  storedUser.onboardingPhase = 1;
                  localStorage.setItem("user", JSON.stringify(storedUser));
                }
              } catch (e) {
                console.error(e);
              }
            }
            localStorage.setItem("mock_onboarding_status", JSON.stringify(mockStatus));
            return { data: { success: true, data: mockStatus } };
          }
        }
      }
    }

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

        const refreshPayload = response.data?.data ?? response.data;
        const newToken = refreshPayload?.token;
        if (!newToken) {
          throw new Error("Refresh token response missing token");
        }

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
