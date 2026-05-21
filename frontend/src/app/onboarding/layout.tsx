import { OnboardingProvider } from "@/providers/OnboardingProvider";
import AuthGuard from "@/components/layout/AuthGuard";
import OnboardingStepNav from "@/components/onboarding/OnboardingStepNav";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <OnboardingProvider>
        <div className="min-h-screen bg-background flex flex-col">
          <header className="border-b border-border">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
              <h1 className="font-semibold text-foreground">Set up your account</h1>
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                Phase 1 · Identity & KYC
              </span>
            </div>
          </header>

          <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 grid gap-8 md:grid-cols-[240px_1fr]">
            <aside className="md:sticky md:top-8 self-start">
              <OnboardingStepNav />
            </aside>
            <main className="min-w-0">{children}</main>
          </div>
        </div>
      </OnboardingProvider>
    </AuthGuard>
  );
}
