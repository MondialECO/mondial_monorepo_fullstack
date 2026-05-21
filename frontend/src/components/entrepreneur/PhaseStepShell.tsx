"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Lightbulb, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Shared card layout for every Phase 2 step page (Figma 2.1 / 2.2 / 2.3).
 * Header with title + subtitle on the left, a right-aligned progress badge.
 * Body slot. Footer with optional Save Draft + Next CTAs. Optional info
 * banner ("Why need this information") and locked-preview slot below.
 */
export interface PhaseStepShellProps {
  title: string;
  subtitle: string;

  /** Small uppercase label above the progress value, e.g. "PROGRESS". */
  progressLabel?: string;
  /** Big value text, e.g. "From 80% Filled" or "0 of 4 Required". */
  progressValue?: string;
  /** Icon for the round progress badge in the top right. */
  progressIcon?: LucideIcon;
  /** Treats the round progress badge as "in progress" (blue) vs "complete" (green). */
  progressTone?: "primary" | "success";

  /** Main form / content area. */
  children: ReactNode;

  /** Optional footer slots. Either pass primaryAction / secondaryAction, or
   *  pass `footer` for a fully custom footer. */
  primaryAction?: { label: string; onClick?: () => void; href?: string; disabled?: boolean; loading?: boolean };
  secondaryAction?: { label: string; onClick?: () => void; href?: string };
  /** Small text on the left of the footer row (e.g. "Save For Later"). */
  footerHint?: { label: string; onClick?: () => void };
  footer?: ReactNode;

  /** Optional info banner shown below the card. */
  infoBanner?: { title: string; description: ReactNode };

  /** Optional locked-step preview shown at the very bottom. */
  lockedPreview?: ReactNode;

  /** Status pill in the very bottom footer row (e.g. "Completed State"). */
  statusPill?: ReactNode;
}

export default function PhaseStepShell({
  title,
  subtitle,
  progressLabel = "PROGRESS",
  progressValue,
  progressIcon: ProgressIcon,
  progressTone = "primary",
  children,
  primaryAction,
  secondaryAction,
  footerHint,
  footer,
  infoBanner,
  lockedPreview,
  statusPill,
}: PhaseStepShellProps) {
  const badgeToneClass =
    progressTone === "success"
      ? "bg-green-600/15 text-green-700 dark:text-green-300"
      : "bg-primary/10 text-primary";

  const defaultFooter = (primaryAction || secondaryAction || footerHint) && (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 sm:px-8 py-5 border-t border-border">
      <div className="text-sm text-muted-foreground">
        {footerHint &&
          (footerHint.onClick ? (
            <button onClick={footerHint.onClick} className="hover:text-foreground transition">
              {footerHint.label}
            </button>
          ) : (
            <span>{footerHint.label}</span>
          ))}
      </div>
      <div className="flex items-center gap-3">
        {secondaryAction && (
          <Button variant="outline" asChild={!!secondaryAction.href} onClick={secondaryAction.onClick}>
            {secondaryAction.href ? <Link href={secondaryAction.href}>{secondaryAction.label}</Link> : secondaryAction.label}
          </Button>
        )}
        {primaryAction && (
          <Button
            asChild={!!primaryAction.href}
            onClick={primaryAction.onClick}
            disabled={primaryAction.disabled || primaryAction.loading}
          >
            {primaryAction.href ? (
              <Link href={primaryAction.href} className="inline-flex items-center gap-2">
                {primaryAction.label}
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <span className="inline-flex items-center gap-2">
                {primaryAction.label}
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="mx-auto max-w-[1100px] px-4 sm:px-6 py-6 sm:py-10 space-y-6">
        {/* Main step card */}
        <section className="bg-background border border-border rounded-2xl overflow-hidden">
          {/* Header */}
          <header className="flex items-start justify-between gap-6 px-6 sm:px-8 pt-7 pb-6">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                {title}
              </h1>
              <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-2xl">
                {subtitle}
              </p>
            </div>

            {progressValue && (
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {progressLabel}
                  </p>
                  <p className="text-sm font-semibold text-foreground mt-0.5">{progressValue}</p>
                </div>
                {ProgressIcon && (
                  <span className={cn("w-12 h-12 rounded-full flex items-center justify-center", badgeToneClass)}>
                    <ProgressIcon className="w-5 h-5" />
                  </span>
                )}
              </div>
            )}
          </header>

          {/* Body */}
          <div className="px-6 sm:px-8 pb-6">{children}</div>

          {/* Footer */}
          {footer ?? defaultFooter}
        </section>

        {/* Why-need-this banner */}
        {infoBanner && (
          <section className="bg-primary/5 border border-primary/15 rounded-2xl px-6 py-5 flex items-start gap-4">
            <span className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-5 h-5 text-primary" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-1">{infoBanner.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{infoBanner.description}</p>
            </div>
          </section>
        )}

        {/* Locked preview of next step */}
        {lockedPreview}

        {/* Status pill (e.g. "Completed State") */}
        {statusPill && <div>{statusPill}</div>}
      </div>
    </div>
  );
}
