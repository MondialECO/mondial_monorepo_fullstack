"use client";

import { SignupTitle, RoleList, RoleCard, CTASection } from "../components";
import { ROLES } from "../constants";
import { Button } from "@/components/ui/button";

interface RoleSelectionCompactStepProps {
  selectedRole: string | null;
  onSelectRole: (roleId: string) => void;
  onNext: () => void;
  onBack?: () => void;
  showBack?: boolean;
}

export function RoleSelectionCompactStep({
  selectedRole,
  onSelectRole,
  onNext,
  onBack,
  showBack = false
}: RoleSelectionCompactStepProps) {
  return (
    <div className="space-y-7">
      <SignupTitle
        badge="Step 1 of 3"
        title="Choose Your Role"
        subtitle="Select the role that best describes what you want to do"
      />

      <RoleList>
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
      </RoleList>

      <CTASection orientation="horizontal">
        {showBack && (
          <Button
            variant="outline"
            onClick={onBack}
            className="sm:flex-1"
          >
            Back
          </Button>
        )}
        <Button
          onClick={onNext}
          disabled={!selectedRole}
          className="flex-1"
        >
          Continue
        </Button>
      </CTASection>
    </div>
  );
}
