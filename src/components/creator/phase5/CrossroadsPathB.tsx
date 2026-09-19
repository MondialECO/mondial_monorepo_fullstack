"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Rocket, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { creatorJourneyApi, type OwnershipEntry } from "@/lib/api-creator-journey";
import { useAuth } from "@/app/_providers/AuthProvider";

type BuildState = {
  companyFormation?: { selectedType?: string; ownership?: OwnershipEntry[] } | null;
  seedFunding?: { totalAsk?: number } | null;
};

type FormationContext = {
  selectedType?: string;
  recommendedType?: string;
};

export function CrossroadsPathB({
  ideaId,
  projectName,
  initial,
  formationContext,
  isLeveledUp = false,
  onBack,
  onChanged,
}: {
  ideaId?: string | null;
  projectName?: string;
  initial?: Record<string, unknown>;
  formationContext?: Record<string, unknown>;
  isLeveledUp?: boolean;
  onBack?: () => void;
  onChanged?: () => void;
}) {
  const router = useRouter();
  const { refreshAuthMe } = useAuth();

  const saved = initial as BuildState | undefined;
  const formation = formationContext as FormationContext | undefined;

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Formation direction: Phase 3 selected / recommended, then historical Path B, fallback SAS
  const formationDirection =
    formation?.selectedType ||
    formation?.recommendedType ||
    saved?.companyFormation?.selectedType ||
    "SAS";

  // Initial ownership: historical Path B ownership if present, otherwise Founder 100%
  const historicalOwnership = saved?.companyFormation?.ownership;
  const ownershipText =
    historicalOwnership && historicalOwnership.length > 0
      ? historicalOwnership.map((o) => `${o.holder || (o.isFounder ? "Founder" : "Partner")}: ${o.percent}%`).join(", ")
      : "100% Founder";

  const handleConfirmLevelUp = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await creatorJourneyApi.levelUp(ideaId ?? undefined);
      await refreshAuthMe();
      setSuccess(true);
      onChanged?.();
      setTimeout(() => {
        router.push(res.redirectTo || "/dashboard/entrepreneur");
      }, 1200);
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err.response?.data?.message ?? (e instanceof Error ? e.message : "Failed to level up to Entrepreneur."));
      setSubmitting(false);
    }
  };

  if (isLeveledUp || success) {
    return (
      <Card className="rounded-2xl border border-primary/30 bg-primary/5 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">
              {success ? "Welcome, Entrepreneur!" : "Project already moved to Entrepreneur workspace"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {success
                ? "Your venture intelligence has been transferred. Redirecting to your Entrepreneur workspace…"
                : "Your company workspace is active. You can continue building this venture in the Entrepreneur dashboard."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button
            onClick={() => router.push("/dashboard/entrepreneur")}
            className="gap-2"
          >
            <Rocket className="h-4 w-4" /> Open Entrepreneur Workspace
          </Button>
          {onBack && !success && (
            <Button variant="outline" onClick={onBack}>
              Back to options
            </Button>
          )}
        </div>
      </Card>
    );
  }

  const transferItems = [
    { label: "Project identity & concept", detail: projectName || "Active venture identity" },
    { label: "Brand kit", detail: "Logo, colors, typography tokens" },
    { label: "Market study & sizing", detail: "TAM/SAM/SOM funnel & benchmark tailwinds" },
    { label: "Structured Business Model Canvas", detail: "9 Osterwalder building blocks & unit economics" },
    { label: "36-month Financial Forecast", detail: "Cash flow projections & custom TAM provenance" },
    { label: "Legal & compliance roadmap", detail: "Stable statutory requirement IDs (FR-CORP, etc.)" },
    { label: "Evidence links & vault files", detail: "Referenced into Data Room (0 bytes duplicated on disk)" },
    { label: "12-section Executive Business Plan", detail: "Section 12 Legal Framework & founder edits preserved" },
    { label: "Investor readiness baseline", detail: "Historical Phase 3 diagnostic benchmark" },
  ];

  return (
    <Card className="rounded-2xl border border-border bg-card p-6 space-y-6 shadow-sm">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          Stage 11 · Level-Up Continuity Bridge
        </div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">Ready to build your company?</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Your Creator project will become the foundation of your Entrepreneur workspace.
          All venture intelligence, market research, financial forecasts, and compliance progress transfer automatically.
        </p>
      </div>

      {/* Transfer Preview Checklist */}
      <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Transfer Preview · Venture Intelligence Carried Forward
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
          {transferItems.map((item, idx) => (
            <div key={idx} className="flex items-start gap-2.5 text-xs">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-foreground">{item.label}</span>
                <span className="text-muted-foreground block text-[11px]">{item.detail}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Company Confirmation Section */}
      <div className="rounded-xl border border-border bg-muted/40 p-4 divide-y divide-border text-sm space-y-1">
        <div className="flex items-center justify-between py-2">
          <span className="text-muted-foreground font-medium">Company name</span>
          <span className="font-semibold text-foreground">{projectName || "Active Venture"}</span>
        </div>
        <div className="flex items-center justify-between py-2">
          <span className="text-muted-foreground font-medium">Chosen legal structure</span>
          <span className="font-semibold text-foreground">{formationDirection}</span>
        </div>
        <div className="flex items-center justify-between py-2">
          <span className="text-muted-foreground font-medium">Initial ownership</span>
          <span className="font-semibold text-foreground">{ownershipText}</span>
        </div>
        <div className="flex items-center justify-between py-2">
          <span className="text-muted-foreground font-medium">Jurisdiction</span>
          <span className="font-semibold text-foreground">France (FR)</span>
        </div>
        <div className="flex items-center justify-between py-2">
          <span className="text-muted-foreground font-medium">Registration status</span>
          <span className="text-xs text-muted-foreground font-medium">
            Workspace creation in MBC · Official incorporation (KBIS) verified in Phase 2
          </span>
        </div>
      </div>

      {/* Regulatory Distinction Notice */}
      <div className="flex items-start gap-2.5 rounded-lg border border-border/80 bg-background/80 p-3.5 text-xs text-muted-foreground leading-relaxed">
        <AlertCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <p>
          <strong className="text-foreground">MBC Entrepreneur Workspace Created ≠ Government Company Registration:</strong>{" "}
          This step activates your operational company dashboard in Mondial with all inherited Creator assets. Formal registration with INPI and Greffe is guided in Entrepreneur Phase 2.
        </p>
      </div>

      {error && (
        <div role="alert" className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <Button
          onClick={handleConfirmLevelUp}
          disabled={submitting}
          className="gap-2 font-semibold h-11 px-5"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Connecting venture to Entrepreneur workspace…</span>
            </>
          ) : (
            <>
              <Rocket className="h-4 w-4" />
              <span>Continue as Entrepreneur</span>
            </>
          )}
        </Button>
        {onBack && (
          <Button
            variant="outline"
            onClick={onBack}
            disabled={submitting}
          >
            Back to options
          </Button>
        )}
      </div>
    </Card>
  );
}
