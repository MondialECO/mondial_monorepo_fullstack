"use client";

import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  CheckCircle2,
  Download,
  ArrowRight,
  Eye,
  FolderLock,
  Megaphone,
} from "lucide-react";
import { useEntrepreneurProgress } from "@/hooks/useEntrepreneurProgress";
import { RouteGuard } from "@/components/entrepreneur/RouteGuard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Phase 2 · Step 4 — Company verification certificate (Figma 2.5). Final
 * confirmation screen. Used to be a misplaced "Financial Preview"; per the
 * Figma + product spec, financial valuation is Phase 3's job, not Phase 2.
 */
function Phase2Step4Content() {
  const router = useRouter();
  const { progress, completeStep } = useEntrepreneurProgress();

  const overallScore = 100;
  const trustScore = 60;

  const issuedDate = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  function handleContinueToPhase3() {
    completeStep(2, 4);
    router.push("/dashboard/entrepreneur/phase-3");
  }

  if (!progress) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="mx-auto max-w-[1100px] px-4 sm:px-6 py-6 sm:py-10 space-y-6">
        <section className="bg-background border border-border rounded-2xl overflow-hidden">
          {/* Header */}
          <header className="flex items-start justify-between gap-6 px-6 sm:px-8 pt-7 pb-6">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                Company verification
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                All 4 verification milestone achieved
              </p>
            </div>
            <div className="text-right min-w-[180px]">
              <p className="text-sm font-semibold text-foreground">
                Overall Score{" "}
                <span className="text-primary">{overallScore}%</span>
              </p>
              <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${overallScore}%` }}
                />
              </div>
            </div>
          </header>

          {/* Roadmap breadcrumb */}
          <div className="px-6 sm:px-8 pb-4">
            <h2 className="text-base font-semibold text-foreground mb-3">Verification Roadmap</h2>
            <RoadmapBreadcrumb
              steps={[
                { label: "Concept Overview", done: true },
                { label: "Document Updates", done: true },
                { label: "Ownership & KYC", done: true },
                { label: "Final Overview", done: true, active: true },
              ]}
            />
          </div>

          {/* Cert + Trust Score cards */}
          <div className="px-6 sm:px-8 pb-6 grid grid-cols-1 lg:grid-cols-2 gap-5">
            <CertCard issuedDate={issuedDate} />
            <TrustScoreCard score={trustScore} />
          </div>

          {/* Features Now Unlocked */}
          <div className="px-6 sm:px-8 pb-6 border-t border-border pt-6">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Features Now Unlocked
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <UnlockedFeature
                icon={Eye}
                title="Investor Visibility"
                subtitle="Featured in matching results"
              />
              <UnlockedFeature
                icon={FolderLock}
                title="Data Room"
                subtitle="Secure Document Hosting"
              />
              <UnlockedFeature
                icon={Megaphone}
                title="Funding Portal"
                subtitle="Apply for pre-seed rounds"
              />
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex flex-col sm:flex-row gap-3 px-6 sm:px-8 py-5 border-t border-border">
            <Button variant="outline" className="gap-2" disabled>
              <Download className="w-4 h-4" />
              Download Certificate
            </Button>
            <Button onClick={handleContinueToPhase3} className="sm:ml-auto gap-2">
              Continue to Phase 3: Investor Outreach
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}

function RoadmapBreadcrumb({
  steps,
}: {
  steps: { label: string; done?: boolean; active?: boolean }[];
}) {
  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
      {steps.map((s, i) => (
        <li key={s.label} className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5",
              s.active
                ? "text-primary font-semibold"
                : s.done
                ? "text-foreground"
                : "text-muted-foreground",
            )}
          >
            {s.done && <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />}
            {s.label}
          </span>
          {i < steps.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />}
        </li>
      ))}
    </ol>
  );
}

function CertCard({ issuedDate }: { issuedDate: string }) {
  return (
    <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/5 to-primary/0 p-6 flex flex-col items-center text-center">
      {/* Stylized cert circle */}
      <div className="relative w-24 h-24 mb-4">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary via-amber-400 to-foreground" />
        <div className="absolute inset-2 rounded-full bg-background flex items-center justify-center">
          <BadgeCheck className="w-10 h-10 text-primary" />
        </div>
      </div>

      <p className="inline-flex items-center gap-1.5 text-sm text-primary font-medium mb-1">
        <BadgeCheck className="w-4 h-4" />
        Verified Company
      </p>
      <p className="text-base font-semibold text-foreground mb-5">Mondial.eco Certified Business</p>

      <div className="grid grid-cols-2 gap-6 w-full pt-4 border-t border-border text-left">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Issued
          </p>
          <p className="text-sm font-medium text-foreground mt-1">{issuedDate}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Expires
          </p>
          <p className="text-sm font-medium text-foreground mt-1">{issuedDate}</p>
        </div>
      </div>
    </div>
  );
}

function TrustScoreCard({ score }: { score: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card/40 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">Executive Trust Score</p>
        <span className="text-xs font-semibold text-green-700 dark:text-green-300 bg-green-600/15 px-2 py-1 rounded-full">
          +20 pts
        </span>
      </div>

      <div>
        <p className="text-4xl font-bold text-foreground">
          {score}
          <span className="text-lg font-medium text-muted-foreground">/100</span>
        </p>
        <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-primary rounded-full" style={{ width: `${score}%` }} />
        </div>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        Your score increased significantly after document verification. Higher scores unlock lower
        platform fees.
      </p>
    </div>
  );
}

function UnlockedFeature({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: typeof Eye;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card/40 px-4 py-3 flex items-center gap-3">
      <span className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

export default function Phase2Step4Page() {
  return (
    <RouteGuard requiredPhase={2} requiredStep={4}>
      <Phase2Step4Content />
    </RouteGuard>
  );
}
