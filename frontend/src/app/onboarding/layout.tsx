import { OnboardingProvider } from "@/providers/OnboardingProvider";
import AuthGuard from "@/components/layout/AuthGuard";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <OnboardingProvider>
        <div className="min-h-screen bg-background">
          <header className="border-b border-border">
            <div className="max-w-[1180px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-primary" aria-hidden />
                <span className="font-semibold text-foreground">Mondial</span>
              </div>
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                Phase 1 · Verification
              </span>
            </div>
          </header>
          <div>{children}</div>
        </div>
      </OnboardingProvider>
    </AuthGuard>
  );
}
