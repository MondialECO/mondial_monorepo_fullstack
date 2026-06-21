import api from "@/lib/axios";

/**
 * User object returned from auth endpoints
 */
export interface AuthUser {
  id?: string;
  Id?: string;
  name?: string;
  Name?: string;
  email?: string;
  Email?: string;
  roles?: string[];
  Roles?: string[];
  onboarding?: { phase?: number };
  Onboarding?: { phase?: number };
}

/**
 * Registration request payload
 */
export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  role: string;
}

/**
 * Registration response from backend
 */
export interface RegisterResponse {
  token?: string;
  user?: AuthUser;
  message?: string;
  data?: {
    token?: string;
    user?: AuthUser;
    id?: string;
    email?: string;
    onboardingToken?: string;
  };
}

/**
 * Onboarding token validation response
 */
export interface ValidateOnboardingTokenResponse {
  userId: string;
  email: string;
  role: string;
}

/**
 * Register a new user account
 * @param data - Registration data (fullName, email, password, role)
 * @returns Promise with token, user object, and onboarding token
 * @throws Error with response data if registration fails
 */
export const registerApi = async (
  data: RegisterRequest
): Promise<RegisterResponse> => {
  const payload = {
    Name: data.fullName,
    Email: data.email,
    Password: data.password,
    User: data.role,
  };

  const response = await api.post<RegisterResponse>("/auth/register", payload);
  return response.data;
};

/**
 * Validate a short-lived onboarding token from post-signup flow
 * @param token - The onboarding token from signup response
 * @returns Promise with validated userId, email, and role
 * @throws Error if token is invalid or expired
 */
export const validateOnboardingToken = async (
  token: string
): Promise<ValidateOnboardingTokenResponse> => {
  const response = await api.post<{
    success: boolean;
    message: string;
    data: ValidateOnboardingTokenResponse;
  }>("/auth/validate-onboarding-token", { onboardingToken: token });

  if (!response.data.success) {
    throw new Error(response.data.message || "Token validation failed");
  }

  return response.data.data;
};

export function getAuthErrorMessage(error: unknown, fallback = "Registration failed"): string {
  const axiosError = error as { response?: { data?: unknown }; code?: string; message?: string };
  const responseData = axiosError?.response?.data;

  const isNetworkError =
    axiosError?.code === "ERR_NETWORK" ||
    axiosError?.message === "Network Error";

  if (isNetworkError) {
    return "Unable to connect. Please check your network and try again.";
  }

  if (!responseData || typeof responseData !== "object") {
    return error instanceof Error ? error.message : fallback;
  }

  const payload = responseData as { message?: unknown; data?: unknown };
  const messages: string[] = [];

  if (Array.isArray(payload.data)) {
    messages.push(...payload.data.filter((item): item is string => typeof item === "string"));
  } else if (payload.data && typeof payload.data === "object") {
    Object.values(payload.data).forEach((value) => {
      if (Array.isArray(value)) {
        messages.push(...value.filter((item): item is string => typeof item === "string"));
      }
    });
  }

  if (messages.length > 0) return messages.join(" ");
  if (typeof payload.message === "string") return payload.message;

  return fallback;
}
