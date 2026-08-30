type AuthPayloadWithOnboarding = {
  onboarding?: { phase?: unknown; Phase?: unknown };
  Onboarding?: { phase?: unknown; Phase?: unknown };
};

/**
 * Read the universal onboarding phase from the camel-cased ASP.NET response,
 * while retaining compatibility with older Pascal-cased fixtures.
 */
export function readOnboardingPhase(payload: unknown): number {
  if (!payload || typeof payload !== "object") return 0;

  const user = payload as AuthPayloadWithOnboarding;
  const value =
    user.onboarding?.phase ??
    user.onboarding?.Phase ??
    user.Onboarding?.phase ??
    user.Onboarding?.Phase;

  const phase = typeof value === "number" ? value : Number(value);
  return Number.isFinite(phase) && phase >= 0 ? phase : 0;
}
