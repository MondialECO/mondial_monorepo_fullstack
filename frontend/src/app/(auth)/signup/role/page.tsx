import type { Metadata } from "next";
import { SignupShell } from "@/components/auth/signup/SignupShell";
import { RoleSelector } from "@/components/auth/signup/RoleSelector";
import { SIGNUP_ROLES } from "@/components/auth/signup/roles.data";

export const metadata: Metadata = {
  title: "Join the Mondial Ecosystem",
  description: "Select how you want to contribute to the future of sustainable growth.",
};

/**
 * /signup/role — role picker step. Server component; hands the interactive
 * RoleSelector (client) only the data it needs. Matches Figma file
 * 5oHxoppTAyS4zb2DfUdYwy node 21512:42899.
 */
export default function SignupRolePage() {
  return (
    <SignupShell
      title="Join the Mondial Ecosystem"
      subtitle="Select how you want to contribute to the future of sustainable growth."
    >
      <RoleSelector roles={SIGNUP_ROLES} variant="grid" />
    </SignupShell>
  );
}
