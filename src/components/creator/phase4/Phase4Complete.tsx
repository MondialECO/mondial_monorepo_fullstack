"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, ArrowRight, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { creatorJourneyApi } from "@/lib/api-creator-journey";
import { useCreatorProgress } from "@/providers/CreatorProgressProvider";
import type { ComputedJourneyStatus } from "@/types/creator/journey-api";

export function Phase4Complete({ onContinue }: { onContinue: () => void }) {
  const { advancePhase } = useCreatorProgress();
  const [computed, setComputed] = useState<ComputedJourneyStatus | null>(null);
  const [missing, setMissing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        try {
          await creatorJourneyApi.completeOffer();
        } catch (e) {
          const err = e as { response?: { status?: number; data?: { message?: string } } };
          if (err.response?.status === 422) {
            setMissing((err.response.data?.message ?? "").replace("Missing module: ", ""));
          }
        }
        const { computedStatus } = await creatorJourneyApi.get();
        if (active) setComputed(computedStatus);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  // Derived gate — no manual status write.
  const canContinue = computed?.phase4.status === "completed" && computed?.phase5.status === "available";

  const handleContinue = async () => {
    setIsNavigating(true);
    advancePhase(4);

    // Poll backend to confirm phase 5 is unlocked before navigating
    for (let i = 0; i < 10; i++) {
      await new Promise(r => setTimeout(r, 500));
      try {
        const { computedStatus } = await creatorJourneyApi.get();
        if (computedStatus?.phase5?.status === "available") {
          break;
        }
      } catch {
        // continue polling on error
      }
    }

    onContinue();
  };

  return (
    <div className="space-y-6 text-center max-w-lg mx-auto py-4">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success-light border border-success-text/20 text-success-text">
        <CheckCircle2 className="w-10 h-10" />
      </div>
      <div>
        <h2 className="text-2xl font-extrabold">Offer &amp; setup ready</h2>
        <p className="text-sm text-muted-foreground mt-1">Pricing, resources, and your go-to-market plan are saved.</p>
      </div>

      {loading && <div className="flex items-center gap-2 text-muted-foreground justify-center"><Loader2 className="h-5 w-5 animate-spin" /> Checking…</div>}

      {!loading && missing && (
        <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/5 p-4 text-sm text-warning text-left">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p>Still needed: <strong>{missing.replace(/_/g, " ")}</strong>. Finish it to unlock The Crossroads.</p>
        </div>
      )}

      <Button onClick={handleContinue} disabled={isNavigating} className="gap-2 disabled:opacity-60">
        Continue to The Crossroads {!isNavigating && <ArrowRight className="h-4 w-4" />}
      </Button>
      {!loading && !canContinue && !missing && (
        <p className="text-xs text-muted-foreground">Complete all three steps to unlock Phase 5.</p>
      )}
    </div>
  );
}
