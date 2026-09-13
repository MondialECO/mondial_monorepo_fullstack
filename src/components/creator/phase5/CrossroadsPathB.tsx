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
              {success ? "Welcome, Entrepreneur!" : "Project already moved to Entrepreneur journey"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {success
                ? "Your company workspace has been created. Redirecting to your Entrepreneur dashboard…"
                : "Your company workspace is active. You can continue building this venture in the Entrepreneur dashboard."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button
            onClick={() => router.push("/dashboard/entrepreneur")}
            className="gap-2"
          >
            <Rocket className="h-4 w-4" /> Open Entrepreneur Dashboard
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

  return (
    <Card className="rounded-2xl border border-border bg-card p-6 space-y-6 shadow-sm">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">Build this project yourself</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          You are choosing to continue this project as the entrepreneur.
          Your Creator project and history will remain available.
          Mondial will create or connect the company workspace and unlock
          the Entrepreneur journey.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-muted/40 p-4 divide-y divide-border text-sm">
        <div className="flex items-center justify-between py-2.5">
          <span className="text-muted-foreground font-medium">Project</span>
          <span className="font-semibold text-foreground">{projectName || "Active Project"}</span>
        </div>
        <div className="flex items-center justify-between py-2.5">
          <span className="text-muted-foreground font-medium">Formation direction</span>
          <span className="font-semibold text-foreground">{formationDirection}</span>
        </div>
        <div className="flex items-center justify-between py-2.5">
          <span className="text-muted-foreground font-medium">Initial ownership</span>
          <span className="font-semibold text-foreground">{ownershipText}</span>
        </div>
        <div className="flex items-center justify-between py-2.5">
          <span className="text-muted-foreground font-medium">Funding</span>
          <span className="text-muted-foreground font-medium">Set later in Entrepreneur Funding phase</span>
        </div>
      </div>

      {error && (
        <div role="alert" className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <Button
          onClick={handleConfirmLevelUp}
          disabled={submitting}
          className="gap-2 font-semibold"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Moving to Entrepreneur workspace…</span>
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
