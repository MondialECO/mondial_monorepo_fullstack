/**
 * Phase 1 universal onboarding. Every signed-up user (regardless of role)
 * walks through this exact ordered sequence. The OnboardingGuard reads
 * status from /api/onboarding/status and redirects to the first incomplete
 * step until status.phase >= 1.
 */

export type OnboardingStep = {
  /** URL path under /onboarding/ */
  slug: "phone" | "identity" | "profile";
  /** Display order, matches the spec's 1.2 / 1.3 / 1.5 numbering. */
  number: number;
  title: string;
  description: string;
  /** Read this key on the status payload to decide if the step is done. */
  completedKey: "phoneVerified" | "kycVerified" | "profileComplete";
};

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    slug: "phone",
    number: 1,
    title: "Verify your phone",
    description: "We'll text a 6-digit code to confirm your number.",
    completedKey: "phoneVerified",
  },
  {
    slug: "identity",
    number: 2,
    title: "Verify your identity",
    description: "Government ID + face match. Required for all roles.",
    completedKey: "kycVerified",
  },
  {
    slug: "profile",
    number: 3,
    title: "Complete your profile",
    description: "Name, photo, title, location, and a short bio.",
    completedKey: "profileComplete",
  },
];

export type OnboardingStatus = {
  phase: number;
  phoneVerified: boolean;
  kycStatus: string;
  kycTier: number;
  profileComplete: boolean;
  phone?: string;
  role?: string;
};

export function isStepComplete(step: OnboardingStep, status: OnboardingStatus): boolean {
  switch (step.completedKey) {
    case "phoneVerified":
      return status.phoneVerified;
    case "kycVerified":
      return status.kycStatus?.toUpperCase() === "VERIFIED";
    case "profileComplete":
      return status.profileComplete;
  }
}

/** First step the user still needs to do. Null if everything is done. */
export function nextIncompleteStep(status: OnboardingStatus): OnboardingStep | null {
  return ONBOARDING_STEPS.find((s) => !isStepComplete(s, status)) ?? null;
}

export function onboardingPath(step: OnboardingStep | null): string {
  if (!step) return "/onboarding/complete";
  return `/onboarding/${step.slug}`;
}

export function isOnboardingComplete(status: OnboardingStatus | null | undefined): boolean {
  if (!status) return false;
  return status.phase >= 1;
}
