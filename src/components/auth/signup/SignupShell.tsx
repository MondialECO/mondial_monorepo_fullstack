import { Wordmark } from "./Wordmark";
import { SectionBadge } from "./SectionBadge";
import { SignupFooter } from "./SignupFooter";
import { cn } from "@/lib/utils";

/**
 * Page chrome: header (logo), hero (badge + title + subtitle), slot for
 * the role selector, then footer. Server component — pass the RoleSelector
 * (which is client) in as `children` from the page.
 */
export function SignupShell({
  badge = "Onboarding Protocol",
  title,
  subtitle,
  children,
}: {
  badge?: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6">
        <Wordmark />
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-center px-6">
        <section
          className={cn(
            "flex w-full max-w-2xl flex-col items-center gap-10 py-12 text-center",
            "sm:py-16",
          )}
        >
          <div className="flex flex-col items-center gap-4">
            <SectionBadge>{badge}</SectionBadge>
            <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {title}
            </h1>
            <p className="max-w-md text-balance text-sm text-muted-foreground sm:text-base">
              {subtitle}
            </p>
          </div>

          {children}
        </section>
      </main>

      <div className="mx-auto w-full max-w-7xl px-6">
        <SignupFooter />
      </div>
    </div>
  );
}
