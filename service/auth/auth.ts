import axios from "@/lib/axios";

// export const loginApi = async (email: string, password: string): Promise<{ token: string; user: User }> => {
//   const response = await axios.post<LoginResponse>("/auth/login", { email, password });
//   const { Token, User } = response.data;

//   if (!Token || !User) throw new Error("Missing token or user data");
//   return { token: Token, user: User };
// };

// API response type
// type LoginResponse = {
//   token: string;
//   user: User;
// };
// Login function
// export const loginApi = async (email: string, password: string): Promise<{ token: string; user: User }> => {
//   const response = await axios.post<LoginResponse>("/auth/login", { email, password });
//   const { token, user } = response.data;

//   if (!token || !user) throw new Error("Missing token or user data");
//   return { token, user };
// };


// Register
export type RegisterModel = {
  Name: string;
  Email: string;
  Password: string;
  User: string;
};

export const registerApi = async (model: RegisterModel) => {
  const response = await axios.post("/auth/register", model);
  return response.data;
};

// Confirm Email
export type ConfirmEmailRequest = { UserId: string; Token: string };
export const confirmEmailApi = async (request: ConfirmEmailRequest) => {
  const response = await axios.post("/auth/confirm-email", request);
  return response.data;
};

// Resend Confirmation Email
export type ResendConfirmationEmailRequest = { email: string };
export const resendConfirmationEmailApi = async (request: ResendConfirmationEmailRequest) => {
  const response = await axios.post("/auth/resend-confirmation-email", request);
  return response.data;
};

// Refresh Token
export const refreshTokenApi = async () => {
  const response = await axios.post("/auth/refresh-token");
  return response.data;
};


// Profile
export type UserProfile = {
  Nmae: string;
  email: string;
  emailConfirmed: boolean;
  phoneNumber: string;
  phoneNumberConfirmed: boolean;
  address: { address: string; City: string; Country: string };
  imagePath?: string;
};

export const getAccountDetails = async (): Promise<UserProfile> => {
  const response = await axios.get<UserProfile>("/auth/account");
  return response.data;
};

// Update profile
export type UpdateProfileRequest = {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address: { address: string; City: string; Country: string };
  imageFile?: File;
};

export const updateProfileApi = async (profile: UpdateProfileRequest) => {
  const formData = new FormData();
  formData.append("FirstName", profile.firstName);
  formData.append("LastName", profile.lastName);
  formData.append("Phone", profile.phoneNumber || "");

  formData.append("Address.address", profile.address.address || "");
  formData.append("Address.City", profile.address.City || "");
  formData.append("Address.Country", profile.address.Country || "");

  if (profile.imageFile) formData.append("ImagePath", profile.imageFile);

  const response = await axios.put<{ message: string; imagePath?: string }>("/auth/account", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data;
};

// Change Password
export type ChangePasswordRequest = { currentPassword: string; newPassword: string };
export const changePasswordApi = async (request: ChangePasswordRequest) => {
  await axios.post("/auth/change-password", request);
};

// Forgot / Reset Password
export type ForgotPasswordRequest = { email: string };
export type ResetPasswordRequest = { email: string; token: string; newPassword: string; confirmPassword: string };

export const forgotPasswordApi = async (request: ForgotPasswordRequest) => {
  await axios.post("/auth/forgot-password", request);
};

export const resetPasswordApi = async (request: ResetPasswordRequest) => {
  const response = await axios.post<{ Message: string }>("/auth/reset-password", request);
  return response.data;
};
