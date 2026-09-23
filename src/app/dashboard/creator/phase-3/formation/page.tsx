'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { withIdeaContext } from '@/lib/creator-routes';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Phase3SetupShell } from '@/components/creator/Phase3SetupShell';
import { FormationFigmaFlow, type FormationSetupPayload } from '@/components/creator/formation/FormationFigmaFlow';
import { useCreatorProgress } from '@/providers/CreatorProgressProvider';
import {
  creatorJourneyApi,
  type CofounderDraft,
  type FormationGenerator,
  type FormationTypeCode,
} from '@/lib/api-creator-journey';

const DECLARABLE_SKILLS = [
  'Tech/Engineering',
  'Finance',
  'Legal',
  'Sales',
  'Operations',
  'Design',
  'Community',
  'Product',
  'Domain expertise',
  'Marketing',
] as const;

const EQUITY_RANGES = ['< 5%', '5–10%', '10–20%', '> 20%'];
const LOCATIONS = ['remote', 'local', 'either'];

type PendingSkillsSave = {
  skills: string[];
  revision: number;
  ideaId: string | null;
};

export default function FormationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryIdeaId = searchParams.get('ideaId');
  const {
    state: { activeIdeaId },
    completeStep,
    isLoading: progressLoading,
  } = useCreatorProgress();
  const currentIdeaId = queryIdeaId || activeIdeaId || null;

  const [formation, setFormation] = useState<FormationGenerator | null>(null);
  const [projectContext, setProjectContext] = useState<{
    sector?: string;
    concept?: string;
    geography?: string;
    country?: string;
    userName?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [continuing, setContinuing] = useState(false);
  const [flushingSkills, setFlushingSkills] = useState(false);

  const [roleNeeded, setRoleNeeded] = useState('Technical co-founder');
  const [equityRange, setEquityRange] = useState(EQUITY_RANGES[1]);
  const [locationPreference, setLocationPreference] = useState(LOCATIONS[2]);

  const declaredSkillsRef = useRef<string[]>([]);
  const pendingSkillsSaveRef = useRef<PendingSkillsSave | null>(null);
  const skillsSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skillsSaveInFlightRef = useRef<Promise<void> | null>(null);
  const latestSkillsRevisionRef = useRef(0);
  const skillsInteractionLockedRef = useRef(false);
  const isMountedRef = useRef(true);

  const drainSkillsQueue = useCallback((): Promise<void> => {
    if (skillsSaveInFlightRef.current) return skillsSaveInFlightRef.current;

    const request = (async () => {
      while (pendingSkillsSaveRef.current) {
        const snapshot = pendingSkillsSaveRef.current;
        pendingSkillsSaveRef.current = null;

        try {
          const updatedFormation = await creatorJourneyApi.declareFormationSkills(
            snapshot.skills,
            undefined,
            snapshot.ideaId,
          );
          if (isMountedRef.current && snapshot.revision === latestSkillsRevisionRef.current) {
            setFormation(updatedFormation);
            setError(null);
          }
        } catch (cause) {
          const queuedAfterFailure = pendingSkillsSaveRef.current as PendingSkillsSave | null;
          const hasNewerSnapshot =
            queuedAfterFailure !== null && queuedAfterFailure.revision > snapshot.revision;
          if (!hasNewerSnapshot) pendingSkillsSaveRef.current = snapshot;
          if (isMountedRef.current) {
            setError(cause instanceof Error ? cause.message : "Couldn't save your skills.");
          }
          if (!hasNewerSnapshot) throw cause;
        }
      }
    })().finally(() => {
      if (skillsSaveInFlightRef.current === request) skillsSaveInFlightRef.current = null;
    });

    skillsSaveInFlightRef.current = request;
    return request;
  }, []);

  const flushSkills = useCallback(async () => {
    if (skillsSaveTimerRef.current) {
      clearTimeout(skillsSaveTimerRef.current);
      skillsSaveTimerRef.current = null;
    }

    while (pendingSkillsSaveRef.current || skillsSaveInFlightRef.current) {
      await drainSkillsQueue();
    }
  }, [drainSkillsQueue]);

  useEffect(() => {
    isMountedRef.current = true;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!pendingSkillsSaveRef.current && !skillsSaveInFlightRef.current) return;
      void flushSkills().catch(() => undefined);
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      isMountedRef.current = false;
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (skillsSaveTimerRef.current) {
        clearTimeout(skillsSaveTimerRef.current);
        skillsSaveTimerRef.current = null;
      }
      if (pendingSkillsSaveRef.current) void drainSkillsQueue().catch(() => undefined);
    };
  }, [drainSkillsQueue, flushSkills]);

  useEffect(() => {
    if (progressLoading) return;
    let active = true;
    (async () => {
      try {
        const { journey } = await creatorJourneyApi.get(activeIdeaId);
        if (journey?.project) {
          setProjectContext({
            sector: journey.project.sector,
            concept: journey.project.concept,
            geography: journey.project.geography,
            country: journey.project.geography,
            userName: journey.project.name,
          });
        }
        const phase3 = journey.phase3Data as {
          forecastSessionId?: string | null;
          formationGenerator?: FormationGenerator;
        };
        const existing = phase3?.formationGenerator;
        const forecastIsCurrent =
          !phase3?.forecastSessionId ||
          existing?.forecastBasis?.forecastSessionId === phase3.forecastSessionId;
        const hasBackendOptions = (existing?.options?.length ?? 0) > 0;
        
        let f: FormationGenerator;
        if (
          existing?.recommendedType &&
          existing.recommendationReason &&
          forecastIsCurrent &&
          hasBackendOptions
        ) {
          f = existing;
        } else {
          try {
            f = await creatorJourneyApi.generateFormation(activeIdeaId);
          } catch {
            const { journey: freshJourney } = await creatorJourneyApi.get(activeIdeaId);
            const freshPhase3 = freshJourney.phase3Data as { formationGenerator?: FormationGenerator };
            if (freshPhase3?.formationGenerator?.recommendedType && (freshPhase3.formationGenerator.options?.length ?? 0) > 0) {
              f = freshPhase3.formationGenerator;
            } else {
              f = await creatorJourneyApi.generateFormation(activeIdeaId);
            }
          }
        }
        if (!active) return;
        setFormation(f);
        if (f.skillsDeclared || (f.youHave && f.youHave.length > 0)) {
          const hydratedSkills =
            f.youHave?.filter((s) => (DECLARABLE_SKILLS as readonly string[]).includes(s)) ?? [];
          declaredSkillsRef.current = hydratedSkills;
        }
        if (f.cofounderDraft) {
          setRoleNeeded(f.cofounderDraft.roleNeeded ?? 'Technical co-founder');
          setEquityRange(f.cofounderDraft.equityRange ?? EQUITY_RANGES[1]);
          setLocationPreference(f.cofounderDraft.locationPreference ?? LOCATIONS[2]);
        }
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Couldn't load formation.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [activeIdeaId, progressLoading]);

  const selectType = async (type: FormationTypeCode) => {
    setSelecting(true);
    try {
      const { formation: f } = await creatorJourneyApi.selectFormationType(type, activeIdeaId);
      setFormation(f);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't select type.");
    } finally {
      setSelecting(false);
    }
  };

  const cofounderDraft = (): CofounderDraft => ({ roleNeeded, equityRange, locationPreference });

  const handleContinue = async (config?: FormationSetupPayload) => {
    if (skillsInteractionLockedRef.current) return;
    skillsInteractionLockedRef.current = true;
    setContinuing(true);
    setError(null);
    try {
      await flushSkills();

      const draft: CofounderDraft | undefined =
        config?.mode === 'team'
          ? {
              roleNeeded: roleNeeded || 'Technical co-founder',
              equityRange: `${100 - (config.founderEquity ?? 75)}%`,
              locationPreference: locationPreference || 'either',
            }
          : undefined;

      const skillsToSave =
        declaredSkillsRef.current.length > 0
          ? declaredSkillsRef.current
          : (formation?.youHave?.filter((s) => (DECLARABLE_SKILLS as readonly string[]).includes(s)) ?? []);

      await creatorJourneyApi.declareFormationSkills(
        skillsToSave,
        draft,
        currentIdeaId,
      );
      completeStep(3, 5);
      router.push(withIdeaContext('/dashboard/creator/phase-3/business-plan', currentIdeaId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save your skills.");
    } finally {
      setContinuing(false);
      skillsInteractionLockedRef.current = false;
    }
  };

  const navigateAfterSkillsFlush = async (href: string) => {
    if (skillsInteractionLockedRef.current) return;
    skillsInteractionLockedRef.current = true;
    setFlushingSkills(true);
    setError(null);
    try {
      await flushSkills();
      router.push(href);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save your skills.");
    } finally {
      skillsInteractionLockedRef.current = false;
      setFlushingSkills(false);
    }
  };

  const retryCurrentError = async () => {
    if (!pendingSkillsSaveRef.current && !skillsSaveInFlightRef.current) {
      location.reload();
      return;
    }
    if (skillsInteractionLockedRef.current) return;
    skillsInteractionLockedRef.current = true;
    setFlushingSkills(true);
    try {
      await flushSkills();
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save your skills.");
    } finally {
      skillsInteractionLockedRef.current = false;
      setFlushingSkills(false);
    }
  };

  return (
    <Phase3SetupShell
      fullWidth
      stepEyebrow="STEP 3.5 · COMPANY FORMATION & TEAM"
      title="Company Formation & Team"
      description="A rule-backed company structure baseline grounded in your venture profile, with transparent reasoning and skills assessment."
      contentClassName="mt-8 space-y-6 w-full min-w-0 max-w-none"
      titleClassName="text-3xl font-semibold leading-tight tracking-tight text-foreground font-sans"
    >
      {loading && (
        <div className="flex items-center gap-3 text-muted-foreground py-16 justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-sm font-medium">Evaluating venture signals and formation profile…</span>
        </div>
      )}

      {error && !loading && (
        <Card className="flex flex-col items-center gap-3 py-10 px-6 border-destructive/20 bg-destructive/5 text-center">
          <ShieldAlert className="size-6 text-destructive" />
          <p className="text-destructive text-sm font-medium">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void retryCurrentError()}
            disabled={flushingSkills}
            className="rounded-xl border-border"
          >
            {flushingSkills && <Loader2 className="size-4 animate-spin mr-2" />}
            Retry Operation
          </Button>
        </Card>
      )}

      {formation && !loading && (
        <FormationFigmaFlow
          formation={formation}
          project={projectContext}
          onSelectType={selectType}
          onContinue={handleContinue}
          onBack={() => void navigateAfterSkillsFlush(withIdeaContext('/dashboard/creator/phase-3/compliance', currentIdeaId))}
          isSaving={continuing || flushingSkills || selecting}
        />
      )}
    </Phase3SetupShell>
  );
}
