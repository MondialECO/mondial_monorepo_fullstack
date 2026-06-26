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
}

/**
 * Register a new user account
 * @param data - Registration data (fullName, email, password, role)
 * @returns Promise with token and/or user object
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
