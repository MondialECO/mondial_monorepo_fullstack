"use client";

import Link from "next/link";
import {
  Briefcase,
  FileText,
  FileUp,
  Users,
  BadgeCheck,
  ArrowRight,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEntrepreneurProgress } from "@/hooks/useEntrepreneurProgress";
import { RouteGuard } from "@/components/entrepreneur/RouteGuard";
import { cn } from "@/lib/utils";

/**
 * Phase 2 entry point. The Figma uses an inline per-step layout (no hub
 * page), so this is intentionally minimal — a compact roadmap of the 4
 * sub-steps with a CTA that drops the user into the first incomplete one.
 */
const STEPS = [
  {
    step: 1,
    title: "Legal Identity",
    subtitle: "Register your company legal structure",
    icon: FileText,
    href: "/dashboard/entrepreneur/phase-2/step-1",
  },
  {
    step: 2,
    title: "Document Submission",
    subtitle: "Upload KBIS, RIB, tax and insurance",
    icon: FileUp,
    href: "/dashboard/entrepreneur/phase-2/step-2",
  },
  {
    step: 3,
    title: "Ownership & KYC",
    subtitle: "Declare beneficial owners + biometric KYC",
    icon: Users,
    href: "/dashboard/entrepreneur/phase-2/step-3",
  },
  {
    step: 4,
    title: "Company Verification",
    subtitle: "Receive your Mondial.eco Certified badge",
    icon: BadgeCheck,
    href: "/dashboard/entrepreneur/phase-2/step-4",
  },
];

function Phase2HubContent() {
  const { progress } = useEntrepreneurProgress();
  if (!progress) return null;

  const isDone = (n: number) => progress.completedSteps.has(`2-${n}`);
  const maxDone = STEPS.reduce((m, s) => (isDone(s.step) ? Math.max(m, s.step) : m), 0);
  const firstOpen = STEPS.find((s) => !isDone(s.step));
  const pct = Math.round((STEPS.filter((s) => isDone(s.step)).length / STEPS.length) * 100);

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="mx-auto max-w-[1000px] px-4 sm:px-6 py-6 sm:py-10 space-y-6">
        {/* Header */}
        <header className="bg-background border border-border rounded-2xl px-6 sm:px-8 py-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-primary" />
            </span>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Phase 2
            </p>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
            Company Verification
          </h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-2xl">
            Get your company verified with an official Mondial.eco Certified badge. Once complete,
            you unlock investor visibility, the data room, and the funding portal.
          </p>

          <div className="mt-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {STEPS.filter((s) => isDone(s.step)).length} of {STEPS.length} steps complete
              </span>
              <span className="font-semibold text-foreground">{pct}%</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
            </div>
          </div>

          {firstOpen && (
            <div className="mt-5">
              <Button asChild className="gap-2">
                <Link href={firstOpen.href}>
                  {maxDone === 0 ? "Start verification" : `Continue · Step ${firstOpen.step}`}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          )}
        </header>

        {/* Step list */}
        <ol className="space-y-3">
          {STEPS.map((s) => {
            const done = isDone(s.step);
            const locked = s.step > maxDone + 1 && !done;
            const Icon = s.icon;

            return (
              <li key={s.step}>
                <Link
                  href={locked ? "#" : s.href}
                  className={cn(
                    "flex items-center gap-4 rounded-2xl border bg-background px-5 py-4 transition",
                    locked && "opacity-60 cursor-not-allowed",
                    !locked && "hover:border-primary/40",
                    done ? "border-green-600/30 bg-green-600/5" : "border-border",
                  )}
                >
                  <span
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                      done
                        ? "bg-green-600/15 text-green-700 dark:text-green-300"
                        : locked
                        ? "bg-muted text-muted-foreground"
                        : "bg-primary/10 text-primary",
                    )}
                  >
                    {done ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      Step {s.step}. {s.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.subtitle}</p>
                  </div>
                  {done ? (
                    <span className="text-xs font-medium text-green-700 dark:text-green-300 uppercase tracking-wide">
                      Completed
                    </span>
                  ) : locked ? (
                    <Lock className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  )}
                </Link>
              </li>
            );
          })}
        </ol>

        {/* Back link */}
        <div>
          <Button variant="outline" asChild>
            <Link href="/dashboard/entrepreneur">Back to overview</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Phase2Page() {
  return (
    <RouteGuard requiredPhase={2}>
      <Phase2HubContent />
    </RouteGuard>
  );
}
