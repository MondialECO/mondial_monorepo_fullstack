'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { withIdeaContext } from '@/lib/creator-routes';
import axios from 'axios';
import { useCreatorProgress } from '@/providers/CreatorProgressProvider';
import {
  creatorJourneyApi,
  type InvestorReadinessScore,
} from '@/lib/api-creator-journey';
import { InvestorReadinessFigmaFlow } from '@/components/creator/readiness/InvestorReadinessFigmaFlow';
import PlanForecastPrintView from '@/components/creator/PlanForecastPrintView';
import { useBusinessPlanSessionTimed, useForecastSessionTimed } from '@/hooks/queries/creator-ai';
import type { BusinessPlanOutput, ForecastOutput, Phase3FreshnessOverview } from '@/types/creator/ai';
import type { ComputedJourneyStatus } from '@/types/creator/journey-api';

export default function Phase3CompletePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryIdeaId = searchParams.get('ideaId');
  const {
    state: { activeIdeaId },
    advancePhase,
  } = useCreatorProgress();
  const currentIdeaId = queryIdeaId || activeIdeaId || null;

  const [project, setProject] = useState<{
    name: string;
    targetUser?: string;
    country?: string;
    category?: string;
    problem?: string;
    solution?: string;
  }>({
    name: '',
  });

  const [computed, setComputed] = useState<ComputedJourneyStatus | null>(null);
  const [readiness, setReadiness] = useState<InvestorReadinessScore | null>(null);
  const [missing, setMissing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  const [freshness, setFreshness] = useState<Phase3FreshnessOverview | null>(null);
  const [isRecomputing, setIsRecomputing] = useState(false);
  const [bpSessionId, setBpSessionId] = useState<string | null>(null);
  const [forecastSessionId, setForecastSessionId] = useState<string | null>(null);
  const [showExport, setShowExport] = useState(false);
  const hasCompletedRef = useRef(false);

  const bpSession = useBusinessPlanSessionTimed(bpSessionId);
  const forecastSession = useForecastSessionTimed(forecastSessionId);
  const bpOutput = (bpSession.data as { output?: BusinessPlanOutput } | undefined)?.output ?? null;
  const forecastOutput = (forecastSession.data as { output?: ForecastOutput } | undefined)?.output ?? null;

  const loadFreshness = async () => {
    try {
      const f = await creatorJourneyApi.getPhase3Freshness(currentIdeaId);
      setFreshness(f);
    } catch {
      // Non-blocking
    }
  };

  const handleRecompute = async () => {
    try {
      setIsRecomputing(true);
      const res = await creatorJourneyApi.computeReadiness(currentIdeaId);
      if (res?.investorReadinessScore) {
        setReadiness(res.investorReadinessScore);
      }
      await loadFreshness();
    } catch (e) {
      console.error('Failed to recompute readiness score', e);
    } finally {
      setIsRecomputing(false);
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        if (!hasCompletedRef.current) {
          hasCompletedRef.current = true;
          try {
            const { investorReadinessScore } = await creatorJourneyApi.completeMasterplan(currentIdeaId);
            if (active && investorReadinessScore) {
              setReadiness(investorReadinessScore);
            }
          } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 422) {
              const message = (error.response.data?.message as string) ?? 'A module is missing.';
              if (active) setMissing(message.replace('Missing module: ', ''));
            }
          }
        }

        const { journey, computedStatus } = await creatorJourneyApi.get(currentIdeaId);
        if (active) {
          setComputed(computedStatus);
          if (journey.project) {
            setProject({
              name: journey.project.name || '',
              targetUser: journey.project.targetUser || '',
              country: (journey.project as any)?.country || 'France',
              category: journey.project.category || 'Subscription software',
              problem: journey.project.problem || '',
              solution: journey.project.solution || '',
            });
          }

          const p3 = journey.phase3Data as {
            investorReadinessScore?: InvestorReadinessScore;
            businessPlanSessionId?: string;
            forecastSessionId?: string;
          } | undefined;

          if (p3?.investorReadinessScore) {
            setReadiness(p3.investorReadinessScore);
          }
          setBpSessionId(p3?.businessPlanSessionId ?? null);
          setForecastSessionId(p3?.forecastSessionId ?? null);
        }
        await loadFreshness();
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [currentIdeaId]);

  const canContinue =
    computed?.phase3.status === 'completed' && computed?.phase4.status === 'available';

  const handleContinue = async () => {
    if (!canContinue) return;
    setIsNavigating(true);
    advancePhase(3);

    for (let attempt = 0; attempt < 10; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      try {
        const { computedStatus } = await creatorJourneyApi.get(activeIdeaId);
        if (computedStatus?.phase4?.status === 'available') break;
      } catch {
        // Keep polling briefly; the destination performs its own backend gate too.
      }
    }

    router.push(withIdeaContext('/dashboard/creator/phase-4', currentIdeaId));
  };

  return (
    <>
      <PlanForecastPrintView
        open={showExport}
        onClose={() => setShowExport(false)}
        projectName={project.name}
        project={{
          problem: project.problem || '',
          solution: project.solution || '',
          targetUser: project.targetUser || '',
        }}
        plan={bpOutput}
        forecast={forecastOutput}
        cross={{ youNeed: [], seedAsk: null }}
      />

      <div className="w-full min-w-0 max-w-none px-4 sm:px-6 py-6 sm:py-8">
        <InvestorReadinessFigmaFlow
          project={project}
          readiness={readiness}
          loading={loading}
          missingPrerequisite={missing}
          updateAvailable={freshness?.readinessUpdateAvailable ?? false}
          changedSources={freshness?.readinessChangedSources ?? []}
          onRecompute={handleRecompute}
          isRecomputing={isRecomputing}
          canContinue={canContinue}
          onContinue={handleContinue}
          isNavigating={isNavigating}
          onExportPdf={() => setShowExport(true)}
          ideaId={currentIdeaId}
        />
      </div>
    </>
  );
}
