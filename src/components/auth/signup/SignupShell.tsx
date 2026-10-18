'use client';

import { Wordmark } from "./Wordmark";
import { SectionBadge } from "./SectionBadge";
import { SignupFooter } from "./SignupFooter";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

/**
 * Page chrome: header (logo), hero (badge + title + subtitle), slot for
 * the role selector, then footer.
 */
export function SignupShell({
  badge,
  title,
  subtitle,
  children,
}: {
  badge?: string;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const { t } = useTranslation();

  const resolvedBadge = badge ?? t('auth.roles.protocolBadge', 'Onboarding Protocol');
  const resolvedTitle = title ?? t('auth.roles.choosePathTitle', 'Choose Your Path');
  const resolvedSubtitle = subtitle ?? t('auth.roles.choosePathSubtitle', 'Select your operational profile to initialize your workspace.');

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
            <SectionBadge>{resolvedBadge}</SectionBadge>
            <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {resolvedTitle}
            </h1>
            <p className="max-w-md text-balance text-sm text-muted-foreground sm:text-base">
              {resolvedSubtitle}
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
