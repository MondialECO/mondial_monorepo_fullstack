import CreatorOnboardingClient from "@/app/onboarding/creator/CreatorOnboardingClient";

export const metadata = {
  title: "Creator Verification - Mondial",
  description: "Verify your creator account to continue.",
};

export default function CreatorVerificationPage() {
  return <CreatorOnboardingClient />;
}
