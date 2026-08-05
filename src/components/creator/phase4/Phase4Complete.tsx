"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, ArrowRight, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { creatorJourneyApi } from "@/lib/api-creator-journey";
import { useCreatorProgress } from "@/providers/CreatorProgressProvider";
import type { ComputedJourneyStatus } from "@/types/creator/journey-api";

export function Phase4Complete({ ideaId, onContinue }: { ideaId: string | null; onContinue: () => void }) {
  const { advancePhase } = useCreatorProgress();
  const [computed, setComputed] = useState<ComputedJourneyStatus | null>(null);
  const [missing, setMissing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  const [ideaConflict, setIdeaConflict] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      setMissing(null);
      setComputed(null);
      setIdeaConflict(false);
      try {
        try {
          await creatorJourneyApi.completeOffer(ideaId);
        } catch (e) {
          const err = e as { response?: { status?: number; data?: { message?: string } } };
          if (err.response?.status === 422) {
            setMissing((err.response.data?.message ?? "").replace("Missing module: ", ""));
          } else if (err.response?.status === 409) {
            if (active) {
              setIdeaConflict(true);
              setError(
                err.response.data?.message
                ?? "You've switched to a different idea elsewhere — refresh this page and try again.",
              );
            }
            return;
          }
        }
        const { computedStatus } = await creatorJourneyApi.get();
        if (active) setComputed(computedStatus);
      } catch {
        // A failed status fetch must read as an ERROR, not as "you haven't finished".
        if (active) setError("Couldn't check your Phase-4 status. This doesn't mean anything is missing — please retry.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [attempt, ideaId]);

  // Derived gate — no manual status write.
  const canContinue = computed?.phase4.status === "completed" && computed?.phase5.status === "available";

  const handleContinue = () => {
    // Respect the derived gate: never navigate unless the backend says Phase 4 is
    // completed and Phase 5 is available (mirrors the Phase-3 complete page).
    if (!canContinue) return;
    setIsNavigating(true);
    advancePhase(4);
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

      {!loading && error && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm text-destructive">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => ideaConflict ? window.location.reload() : setAttempt((a) => a + 1)}
          >
            {ideaConflict ? "Refresh page" : "Retry"}
          </Button>
        </div>
      )}

      {!loading && missing && (
        <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/5 p-4 text-sm text-warning text-left">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p>Still needed: <strong>{missing.replace(/_/g, " ")}</strong>. Finish it to unlock The Crossroads.</p>
        </div>
      )}

      <Button onClick={handleContinue} disabled={isNavigating || !canContinue} className="gap-2 disabled:opacity-60">
        Continue to The Crossroads {!isNavigating && <ArrowRight className="h-4 w-4" />}
      </Button>
      {!loading && !error && !canContinue && !missing && (
        <p className="text-xs text-muted-foreground">Complete all three steps to unlock Phase 5.</p>
      )}
    </div>
  );
}
