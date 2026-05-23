import api from "@/lib/axios";

/**
 * User object returned from auth endpoints
 */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  roles: string[];
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
