import AuthGuard from "@/components/layout/AuthGuard";
import OnboardingGuard from "@/components/layout/OnboardingGuard";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <OnboardingGuard>
        <div className="min-h-screen bg-background">
          <header className="border-b border-border">
            <div className="max-w-[1180px] mx-auto px-4 sm:px-6 h-16 flex items-center">
              <span className="font-semibold text-foreground">Account</span>
            </div>
          </header>
          <div>{children}</div>
        </div>
      </OnboardingGuard>
    </AuthGuard>
  );
}
