import { OnboardingProvider } from "@/providers/OnboardingProvider";
import AuthGuard from "@/components/layout/AuthGuard";
import Image from "next/image";
import Link from "next/link";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <OnboardingProvider>
        <div className="min-h-screen bg-background">
          <header className="border-b border-border bg-card/50 backdrop-blur-xs">
            <div className="max-w-[1180px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
              <Link
                href="/onboarding"
                className="flex items-center gap-2.5 hover:opacity-90 transition-opacity"
              >
                <div className="w-9 h-9 rounded-xl bg-card border border-border shadow-xs flex items-center justify-center shrink-0 overflow-hidden">
                  <Image
                    src="/brand-logo-footer.png"
                    alt="Mondial"
                    width={24}
                    height={24}
                    className="object-contain"
                    priority
                  />
                </div>
                <span className="font-semibold text-lg tracking-tight text-foreground">
                  Mondial
                </span>
              </Link>
              <span className="inline-flex items-center rounded-full bg-primary/10 text-primary border border-primary/20 px-3 py-1 text-xs font-medium uppercase tracking-wider">
                Verification
              </span>
            </div>
          </header>
          <div>{children}</div>
        </div>
      </OnboardingProvider>
    </AuthGuard>
  );
}
