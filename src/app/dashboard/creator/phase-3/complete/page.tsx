'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { withIdeaContext } from '@/lib/creator-routes';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
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

  const [formation, setFormation] = useState<{
    selectedType?: string;
    founderEquity?: number;
    plannedRole?: string;
    skills?: { youHave?: string[]; youNeed?: string[] };
  } | undefined>(undefined);
  const [cross, setCross] = useState<{ youNeed: string[]; seedAsk: number | null }>({
    youNeed: [],
    seedAsk: null,
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

  const { data: legalFramework } = useQuery({
    queryKey: ['business-plan-section-12-complete', currentIdeaId],
    queryFn: () => creatorJourneyApi.getBusinessPlanSection12(currentIdeaId),
    staleTime: 60_000,
  });

  const forecastBasis = useMemo(() => {
    if (!forecastOutput) return undefined;
    const revMonths = forecastOutput.revenueForecast?.monthly ?? [];
    const costMonths = forecastOutput.costForecast?.monthly ?? [];
    const currency = forecastOutput.revenueForecast?.currency ?? 'EUR';

    const calcYear = (startM: number, endM: number) => {
      let rev = 0;
      let opex = 0;
      for (let m = startM; m <= endM; m++) {
        const rm = revMonths.find((x) => x.month === m);
        const cm = costMonths.find((x) => x.month === m);
        if (rm) rev += rm.amount ?? 0;
        if (cm) opex += (cm.fixedCosts ?? 0) + (cm.variableCosts ?? 0);
      }
      return { rev, opex, net: rev - opex };
    };

    const y1 = calcYear(1, 12);
    const y2 = calcYear(13, 24);
    const y3 = calcYear(25, 36);

    return {
      currency,
      years: [
        { year: 1, revenue: y1.rev, opex: y1.opex, netIncome: y1.net },
        { year: 2, revenue: y2.rev, opex: y2.opex, netIncome: y2.net },
        { year: 3, revenue: y3.rev, opex: y3.opex, netIncome: y3.net },
      ],
      summary: {
        breakEvenMonth: forecastOutput.breakEvenAnalysis?.breakEvenMonth,
      },
    };
  }, [forecastOutput]);

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
            formationGenerator?: {
              selectedType?: string;
              founderEquity?: number;
              plannedRole?: string;
              youHave?: Array<{ label: string }>;
              youNeed?: Array<{ label: string }>;
            };
          } | undefined;
          const p5 = journey.phase5Data as { pathB?: { seedFunding?: { totalAsk?: number } } } | undefined;

          if (p3?.investorReadinessScore) {
            setReadiness(p3.investorReadinessScore);
          }
          setBpSessionId(p3?.businessPlanSessionId ?? null);
          setForecastSessionId(p3?.forecastSessionId ?? null);

          if (p3?.formationGenerator) {
            setFormation({
              selectedType: p3.formationGenerator.selectedType,
              founderEquity: p3.formationGenerator.founderEquity,
              plannedRole: p3.formationGenerator.plannedRole,
              skills: {
                youHave: (p3.formationGenerator.youHave ?? []).map((x) => x.label),
                youNeed: (p3.formationGenerator.youNeed ?? []).map((x) => x.label),
              },
            });
          }

          setCross({
            youNeed: (p3?.formationGenerator?.youNeed ?? []).map((n) => n.label),
            seedAsk: p5?.pathB?.seedFunding?.totalAsk ?? null,
          });
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
          country: project.country,
          category: project.category,
        }}
        plan={bpOutput}
        forecast={forecastOutput}
        forecastBasis={forecastBasis}
        formation={formation}
        cross={cross}
        legalFramework={legalFramework}
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
