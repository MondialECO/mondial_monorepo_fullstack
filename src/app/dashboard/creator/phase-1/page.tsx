import { OnboardingProvider } from "@/providers/OnboardingProvider";
import CreatorPhase1Client from "./client";

export const metadata = {
  title: 'Identity Verification | Mondial',
  description: 'Complete your identity verification to unlock Creator features',
};

export default function CreatorPhase1Page() {
  return (
    <OnboardingProvider>
      <CreatorPhase1Client />
    </OnboardingProvider>
  );
}
