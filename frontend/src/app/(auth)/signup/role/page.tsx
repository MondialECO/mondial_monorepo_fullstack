import type { Metadata } from "next";
import { SignupShell } from "@/components/auth/signup/SignupShell";
import { RoleSelector } from "@/components/auth/signup/RoleSelector";
import { SIGNUP_ROLES } from "@/components/auth/signup/roles.data";

export const metadata: Metadata = {
  title: "Choose Your Path · Mondial",
  description: "Select your operational profile to initialize your workspace.",
};

/**
 * /signup/role — role picker step. Server component; hands the interactive
 * RoleSelector (client) only the data it needs.
 *
 * Flip `variant` to "list" for the single-column card layout.
 */
export default function SignupRolePage() {
  return (
    <SignupShell
      badge="Onboarding Protocol"
      title="Choose Your Path"
      subtitle="Select your operational profile to initialize your workspace."
    >
      <RoleSelector roles={SIGNUP_ROLES} variant="grid" />
    </SignupShell>
  );
}
