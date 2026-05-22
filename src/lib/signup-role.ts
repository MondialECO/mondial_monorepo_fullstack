export const SIGNUP_ROLE_STORAGE_KEY = "signup:selected-role";

export const SIGNUP_ROLE_MAP: Record<string, string> = {
  entrepreneur: "Entrepreneur",
  creator: "Creator",
  investor: "Investor",
  "service-provider": "ServiceProvider",
};

export function mapSignupRoleToBackendRole(roleId: string): string {
  return SIGNUP_ROLE_MAP[roleId] ?? "Creator";
}

export function formatRoleLabel(roleId: string): string {
  if (!roleId) return "Creator";
  return roleId
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

