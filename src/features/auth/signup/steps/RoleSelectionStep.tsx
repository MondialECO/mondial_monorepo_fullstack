"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SignupTitle, RoleGrid, RoleCard } from "../components";
import { ROLES } from "../constants";

interface RoleSelectionStepProps {
  selectedRole: string | null;
  onSelectRole: (roleId: string) => void;
  onNext: () => void;
  onBack?: () => void;
  showBack?: boolean;
  signInHref?: string;
}

/**
 * Step 1 — Figma frame 3654 ("dashboard protocal", variant A).
 * ONBOARDING PROTOCOL badge → Join The Ecosystem → 2×2 role grid →
 * "Initialize Account" primary button + inline "Existing user? Sign in".
 */
export function RoleSelectionStep({
  selectedRole,
  onSelectRole,
  onNext,
  onBack,
  showBack = false,
  signInHref = "/login",
}: RoleSelectionStepProps) {
  return (
    <div className="flex w-full flex-col items-center gap-10">
      <SignupTitle
        badge="Onboarding Protocol"
        title="Join The Ecosystem"
        subtitle="Select operational profile to initialize workshop."
      />

      <RoleGrid columns="2" className="max-w-[710px]">
        {ROLES.map((role) => (
          <RoleCard
            key={role.id}
            id={role.id}
            title={role.title}
            description={role.description}
            icon={role.icon}
            isSelected={selectedRole === role.id}
            onClick={onSelectRole}
          />
        ))}
      </RoleGrid>

      <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
        {showBack && (
          <Button variant="outline" onClick={onBack} size="lg">
            Back
          </Button>
        )}
        <Button
          onClick={onNext}
          disabled={!selectedRole}
          size="lg"
          className="px-6"
        >
          Initialize Account
        </Button>
        <p className="text-sm text-muted-foreground">
          Existing user?{" "}
          <Link
            href={signInHref}
            className="font-medium text-primary hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
