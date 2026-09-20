"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { withIdeaContext } from "@/lib/creator-routes";
import { creatorJourneyApi, getCreatorWorkspaceIdea } from "@/lib/api-creator-journey";
import { useCreatorProgress } from "@/providers/CreatorProgressProvider";

// Artifact-derived Phase 3 resume: routes directly to the next unfinished milestone
// 3.1 Market -> 3.2 Business Model -> 3.3 Forecast -> 3.4 Legal -> 3.5 Formation -> 3.6 Business Plan -> 3.7 Complete
export default function Phase3IndexPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryIdeaId = searchParams.get("ideaId");
  const { state: { activeIdeaId } } = useCreatorProgress();
  const effectiveIdeaId = queryIdeaId || activeIdeaId || getCreatorWorkspaceIdea() || null;

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { journey } = await creatorJourneyApi.get(effectiveIdeaId);
        if (!active) return;
        const p3 = journey?.phase3Data as {
          marketStudySessionId?: string;
          businessModelSessionId?: string;
          forecastSessionId?: string;
          legalAssessment?: unknown;
          formationGenerator?: unknown;
          businessPlanSessionId?: string;
        } | undefined;

        let target = "/dashboard/creator/phase-3/market-study";
        if (!p3?.marketStudySessionId) {
          target = "/dashboard/creator/phase-3/market-study";
        } else if (!p3?.businessModelSessionId) {
          target = "/dashboard/creator/phase-3/business-model";
        } else if (!p3?.forecastSessionId) {
          target = "/dashboard/creator/phase-3/forecast";
        } else if (!p3?.legalAssessment) {
          target = "/dashboard/creator/phase-3/compliance";
        } else if (!p3?.formationGenerator) {
          target = "/dashboard/creator/phase-3/formation";
        } else if (!p3?.businessPlanSessionId) {
          target = "/dashboard/creator/phase-3/business-plan";
        } else {
          target = "/dashboard/creator/phase-3/complete";
        }

        router.replace(withIdeaContext(target, effectiveIdeaId));
      } catch {
        if (active) {
          router.replace(withIdeaContext("/dashboard/creator/phase-3/market-study", effectiveIdeaId));
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [router, effectiveIdeaId]);

  return (
    <div className="w-full flex-1 flex flex-col min-h-screen items-center justify-center gap-3 bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Resuming Phase 3: Business Plan Intelligence...</p>
    </div>
  );
}
