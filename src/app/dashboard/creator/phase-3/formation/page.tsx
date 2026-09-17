'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleAlert,
  CircleCheck,
  Compass,
  Cpu,
  Info,
  Layers,
  Lightbulb,
  Loader2,
  Search,
  ShieldAlert,
  Sparkles,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Phase3SetupShell } from '@/components/creator/Phase3SetupShell';
import { useCreatorProgress } from '@/providers/CreatorProgressProvider';
import { cn } from '@/lib/utils';
import {
  creatorJourneyApi,
  type CofounderDraft,
  type FormationGenerator,
  type FormationOption,
  type FormationRecommendationFactor,
  type FormationTypeCode,
} from '@/lib/api-creator-journey';

// The fixed declarable skill set (mirrors the backend DeclarableSkills).
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

// SP-backed gap baseline (mirrors the backend GapBaseline) — every gap → a real specialist.
const GAP_BASELINE: { skill: string; specialty: string; label: string; description: string }[] = [
  {
    skill: 'Tech/Engineering',
    specialty: 'development',
    label: 'Full-stack Developer',
    description: 'Technical architecture, frontend/backend engineering, and API infrastructure.',
  },
  {
    skill: 'Finance',
    specialty: 'finance',
    label: 'Financial Advisor',
    description: 'Financial forecasting, unit economics validation, and tax optimization.',
  },
  {
    skill: 'Legal',
    specialty: 'legal',
    label: 'Legal Specialist',
    description: 'Corporate bylaws, shareholder agreements, and regulatory compliance.',
  },
  {
    skill: 'Design',
    specialty: 'branding',
    label: 'Brand Designer',
    description: 'Brand identity, UI/UX systems, and marketing visual assets.',
  },
];

const EQUITY_RANGES = ['< 5%', '5–10%', '10–20%', '> 20%'];
const LOCATIONS = ['remote', 'local', 'either'];
const SKILLS_AUTOSAVE_DEBOUNCE_MS = 400;

type PendingSkillsSave = {
  skills: string[];
  revision: number;
  ideaId: string | null;
};

export default function FormationPage() {
  const router = useRouter();
  const {
    state: { activeIdeaId },
    completeStep,
    isLoading: progressLoading,
  } = useCreatorProgress();

  const [view, setView] = useState<'type' | 'skills'>('type');
  const [formation, setFormation] = useState<FormationGenerator | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selecting, setSelecting] = useState(false);

  // 3.5b state
  const [declaredSkills, setDeclaredSkills] = useState<string[]>([]);
  const [continuing, setContinuing] = useState(false);
  const [roleNeeded, setRoleNeeded] = useState('Technical co-founder');
  const [equityRange, setEquityRange] = useState(EQUITY_RANGES[1]);
  const [locationPreference, setLocationPreference] = useState(LOCATIONS[2]);
  const [savingCf, setSavingCf] = useState(false);
  const [cfSaved, setCfSaved] = useState(false);
  const [flushingSkills, setFlushingSkills] = useState(false);

  // Formation follows the Creator draft pattern: one debounce timer plus an
  // explicit flush before navigation. The pending snapshot is latest-wins and
  // the drain is serialized so PATCH responses can never land out of order.
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

  const queueSkillsAutosave = useCallback(
    (skills: string[]) => {
      const revision = latestSkillsRevisionRef.current + 1;
      latestSkillsRevisionRef.current = revision;
      pendingSkillsSaveRef.current = { skills: [...skills], revision, ideaId: activeIdeaId };

      if (skillsSaveTimerRef.current) clearTimeout(skillsSaveTimerRef.current);
      skillsSaveTimerRef.current = setTimeout(() => {
        skillsSaveTimerRef.current = null;
        void drainSkillsQueue().catch(() => undefined);
      }, SKILLS_AUTOSAVE_DEBOUNCE_MS);
    },
    [activeIdeaId, drainSkillsQueue],
  );

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
          } catch (genErr) {
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
        if (f.skillsDeclared) {
          const hydratedSkills =
            f.youHave?.filter((s) => (DECLARABLE_SKILLS as readonly string[]).includes(s)) ?? [];
          declaredSkillsRef.current = hydratedSkills;
          setDeclaredSkills(hydratedSkills);
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

  const toggleSkill = (skill: string) => {
    if (skillsInteractionLockedRef.current) return;
    const previous = declaredSkillsRef.current;
    const next = previous.includes(skill)
      ? previous.filter((item) => item !== skill)
      : [...previous, skill];
    declaredSkillsRef.current = next;
    setDeclaredSkills(next);
    setError(null);
    queueSkillsAutosave(next);
  };

  // Client-side gap derivation
  const gaps = GAP_BASELINE.filter((g) => !declaredSkills.includes(g.skill));
  const selectedOption = formation?.options?.find((option) => option.code === formation.selectedType);
  const recommendedOption = formation?.options?.find((option) => option.code === formation.recommendedType);
  const cofounderDraft = (): CofounderDraft => ({ roleNeeded, equityRange, locationPreference });

  const isOverrideActive = Boolean(
    formation?.selectedType &&
      formation.recommendedType &&
      formation.selectedType !== formation.recommendedType,
  );

  const saveCofounder = async () => {
    if (skillsInteractionLockedRef.current) return;
    skillsInteractionLockedRef.current = true;
    setSavingCf(true);
    setCfSaved(false);
    setError(null);
    try {
      await flushSkills();
      const f = await creatorJourneyApi.declareFormationSkills(
        declaredSkillsRef.current,
        cofounderDraft(),
        activeIdeaId,
      );
      setFormation(f);
      setCfSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save preferences.");
    } finally {
      skillsInteractionLockedRef.current = false;
      setSavingCf(false);
    }
  };

  const handleContinue = async () => {
    if (skillsInteractionLockedRef.current) return;
    skillsInteractionLockedRef.current = true;
    setContinuing(true);
    setError(null);
    try {
      await flushSkills();
      await creatorJourneyApi.declareFormationSkills(
        declaredSkillsRef.current,
        cofounderDraft(),
        activeIdeaId,
      );
      completeStep(3, 6);
      router.push('/dashboard/creator/phase-3/complete');
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save your skills.");
      setContinuing(false);
      skillsInteractionLockedRef.current = false;
    }
  };

  const showCompanyType = async () => {
    if (skillsInteractionLockedRef.current) return;
    skillsInteractionLockedRef.current = true;
    setFlushingSkills(true);
    setError(null);
    try {
      await flushSkills();
      setView('type');
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save your skills.");
    } finally {
      skillsInteractionLockedRef.current = false;
      setFlushingSkills(false);
    }
  };

  const showSkills = async () => {
    if (skillsInteractionLockedRef.current) return;
    skillsInteractionLockedRef.current = true;
    setFlushingSkills(true);
    setError(null);
    try {
      await flushSkills();
      setView('skills');
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save your skills.");
    } finally {
      skillsInteractionLockedRef.current = false;
      setFlushingSkills(false);
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
      compact
      stepEyebrow="Step 3.6"
      title="Company Formation & Team"
      description="A rule-backed company structure baseline grounded in your venture profile, with transparent reasoning and skills assessment."
      contentClassName="mt-8 space-y-6 max-w-5xl mx-auto"
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

      {formation && !loading && view === 'type' && (
        <div className="space-y-6">
          {/* Jurisdiction Context Banner */}
          <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs leading-relaxed text-foreground">
            <Info className="size-4 shrink-0 text-primary mt-0.5" aria-hidden="true" />
            <div>
              <span className="font-semibold text-primary">Jurisdiction Notice (France Baseline):</span>{' '}
              The options below illustrate standard French corporate structures (SAS, SAS-U, SARL). If you plan to incorporate in another jurisdiction (e.g. US Delaware, UK Ltd, Germany GmbH), treat this as an architectural guideline and consult a qualified legal advisor.
            </div>
          </div>

          {/* Section 1: Discrete Recommendation Inputs & Reasoning */}
          <Card className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground font-sans">
                  Recommendation Engine Inputs &amp; Reasoning
                </h3>
              </div>
              <span className="text-xs text-muted-foreground font-medium">
                Suggestion:{' '}
                <strong className="text-primary font-mono text-sm uppercase">
                  {formation.recommendedType}
                </strong>
              </span>
            </div>

            <p className="text-xs text-muted-foreground leading-normal">
              Our rule engine analyzed your live venture attributes from Idea Clarifier, Financial Forecast, and Team Setup. The recommendation is grounded on these discrete facts:
            </p>

            {/* Discrete Factor Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {(formation.recommendationFactors && formation.recommendationFactors.length > 0) ? (
                formation.recommendationFactors.map((factor, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col justify-between rounded-xl border border-border/60 bg-muted/30 p-3.5 space-y-1.5 transition-colors hover:border-primary/30"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-primary tracking-wide uppercase">
                        {factor.category}
                      </span>
                      <span className="text-xs font-mono font-medium text-foreground bg-card px-2 py-0.5 rounded border border-border/50">
                        {factor.signal}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-snug">
                      {factor.implication}
                    </p>
                  </div>
                ))
              ) : (
                <div className="col-span-2 rounded-xl border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
                  {formation.recommendationReason}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-[11px] text-muted-foreground/80 pt-1">
              <Lightbulb className="size-3.5 shrink-0 text-amber-500" />
              <span>
                Changing upstream parameters (e.g. updating forecast TAM/Growth or adding co-founders) dynamically updates this baseline.
              </span>
            </div>
          </Card>

          {/* Override Alert Banner if active */}
          {isOverrideActive && (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs leading-relaxed text-foreground">
              <CircleAlert className="size-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <span className="font-semibold text-amber-700 dark:text-amber-300">
                  Founder Override Active:
                </span>{' '}
                You selected <strong className="font-mono text-foreground">{formation.selectedType}</strong> instead of the automated recommendation (<strong className="font-mono text-muted-foreground">{formation.recommendedType}</strong>). This deliberate choice will be preserved across Phase 4 execution and Phase 6 legal formation.
              </div>
            </div>
          )}

          {/* Section 2: Structure Selection Cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground font-sans">
                Select Entity Structure
              </h3>
              <span className="text-xs text-muted-foreground">Tap any option to choose or override</span>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {formation.options?.map((option) => {
                const isRec = formation.recommendedType === option.code;
                const isSel = formation.selectedType === option.code;
                const isOptionOverride = isSel && !isRec;

                return (
                  <button
                    key={option.code}
                    type="button"
                    onClick={() => selectType(option.code)}
                    disabled={selecting}
                    aria-pressed={isSel}
                    className={cn(
                      'group relative flex min-h-[220px] flex-col justify-between rounded-2xl border bg-card p-5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70',
                      isSel
                        ? 'border-primary shadow-sm bg-primary/[0.02] ring-1 ring-primary/40'
                        : isRec
                        ? 'border-primary/40 hover:border-primary/70'
                        : 'border-border/70 hover:border-primary/30',
                    )}
                  >
                    <div className="space-y-2.5">
                      <div className="flex w-full items-center justify-between gap-2">
                        <span className="text-xl font-bold font-mono tracking-tight text-foreground">
                          {option.code}
                        </span>

                        {isSel && (
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border',
                              isOptionOverride
                                ? 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                                : 'border-primary/20 bg-primary/10 text-primary',
                            )}
                          >
                            <Check className="size-3" />
                            {isOptionOverride ? 'Selected (Override)' : 'Selected'}
                          </span>
                        )}

                        {!isSel && isRec && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                            <Sparkles className="size-3" />
                            Suggested
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {option.description}
                      </p>
                    </div>

                    <div className="space-y-1.5 pt-4 border-t border-border/50 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Min Capital:</span>
                        <span className="font-mono font-medium text-foreground">{option.capital}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Filing Time:</span>
                        <span className="font-mono font-medium text-foreground">{option.formationTime}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Est. Cost:</span>
                        <span className="font-mono font-medium text-foreground">{option.estimatedCost}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <p className="text-[11px] text-muted-foreground/70 italic pt-1">
              * Indicative timelines and capital thresholds based on standard registry filings. No statutory state fees are charged at this stage.
            </p>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-6 border-t border-border">
            <Button
              variant="outline"
              onClick={() => void navigateAfterSkillsFlush('/dashboard/creator/phase-3/compliance')}
              disabled={flushingSkills}
              className="h-10 rounded-xl border-border px-4 text-sm font-medium text-muted-foreground shadow-none"
            >
              <ArrowLeft className="size-4 mr-2" /> Back to Compliance
            </Button>
            <Button
              onClick={() => void showSkills()}
              disabled={selecting || flushingSkills}
              className="h-10 gap-2 rounded-xl px-5 text-sm font-semibold"
            >
              {(selecting || flushingSkills) && <Loader2 className="size-4 animate-spin" />}
              Continue to Team &amp; Skills {!selecting && !flushingSkills && <ArrowRight className="size-4" />}
            </Button>
          </div>
        </div>
      )}

      {formation && !loading && view === 'skills' && (
        <div className="space-y-6">
          {/* Section 1: Skills Assessment & Declarations */}
          <Card className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm space-y-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Users className="size-4 text-primary" />
                <h3 className="text-base font-semibold text-foreground font-sans">
                  Founder Capabilities &amp; Team Composition
                </h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Declare the competencies you personally bring to the founding team. The system evaluates these against baseline venture milestones to highlight specialist gaps.
              </p>
            </div>

            {/* Founder-Declared Skills Picker */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Founder-Declared Skills (Self-Reported)
                </span>
                <span className="text-xs text-muted-foreground">
                  {declaredSkills.length} selected
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {DECLARABLE_SKILLS.map((skill) => {
                  const isSelected = declaredSkills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      disabled={continuing || flushingSkills || savingCf}
                      aria-pressed={isSelected}
                      className={cn(
                        'inline-flex h-8 items-center gap-1.5 rounded-full border px-3.5 text-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70',
                        isSelected
                          ? 'border-primary bg-primary font-semibold text-primary-foreground shadow-sm'
                          : 'border-border bg-card text-foreground hover:border-primary/40 hover:bg-muted/40',
                      )}
                    >
                      {isSelected && <Check className="size-3" aria-hidden="true" />}
                      {skill}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Split Comparison: Declared vs Inferred Gaps */}
            <div className="grid gap-6 border-t border-border pt-6 md:grid-cols-2">
              {/* Left: Declared */}
              <div className="space-y-3 rounded-xl border border-border/60 bg-muted/20 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground uppercase tracking-wider">
                  <CircleCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Your Declared Core Competencies</span>
                </div>
                <p className="text-xs text-muted-foreground leading-snug">
                  Skills you bring directly to venture execution:
                </p>
                {declaredSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {declaredSkills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs italic text-muted-foreground pt-1">
                    No skills selected yet. Tap any chips above to declare capabilities.
                  </p>
                )}
              </div>

              {/* Right: Derived Gaps */}
              <div className="space-y-3 rounded-xl border border-border/60 bg-muted/20 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                  <Compass className="size-4 text-amber-600 dark:text-amber-400" />
                  <span>System-Derived Competence Gaps</span>
                </div>
                <p className="text-xs text-muted-foreground leading-snug">
                  Early-stage capabilities not covered in your self-declaration:
                </p>

                {gaps.length === 0 ? (
                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-emerald-700 dark:text-emerald-300">
                    Comprehensive coverage: All common early-stage foundational skills are declared.
                  </div>
                ) : (
                  <div className="space-y-2 pt-1">
                    {gaps.map((gap) => (
                      <div
                        key={gap.skill}
                        className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-card p-3 shadow-none transition-colors hover:border-primary/30"
                      >
                        <div>
                          <div className="text-xs font-semibold text-foreground">{gap.label}</div>
                          <div className="text-[11px] text-muted-foreground">{gap.skill}</div>
                        </div>

                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="h-7 shrink-0 gap-1.5 rounded-full border-border px-3 text-[11px] font-semibold text-primary shadow-none hover:border-primary"
                        >
                          <Link
                            href={`/marketplace?category=${gap.specialty}`}
                            aria-disabled={flushingSkills || continuing || savingCf}
                            onClick={(event) => {
                              event.preventDefault();
                              void navigateAfterSkillsFlush(`/marketplace?category=${gap.specialty}`);
                            }}
                          >
                            <Search className="size-3" />
                            Find SP
                          </Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Section 2: Technical Co-Founder Draft Preferences */}
          <Card className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Cpu className="size-4 text-primary" />
                <h3 className="text-base font-semibold text-foreground font-sans">
                  Co-Founder Matchmaking Preferences (Draft)
                </h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                If you are looking to recruit a co-founder, save your target profile. Matchmaking activates at Level Up (Phase 6).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <label className="space-y-1.5 text-xs font-medium text-foreground">
                <span>Role Needed</span>
                <input
                  value={roleNeeded}
                  onChange={(event) => {
                    setRoleNeeded(event.target.value);
                    setCfSaved(false);
                  }}
                  className="h-10 w-full rounded-xl border border-border bg-muted/30 px-3 text-xs outline-none transition-colors focus:border-primary focus:bg-card"
                  placeholder="e.g. Technical Co-Founder / CTO"
                />
              </label>

              <label className="space-y-1.5 text-xs font-medium text-foreground">
                <span>Target Equity Allocation</span>
                <select
                  value={equityRange}
                  onChange={(event) => {
                    setEquityRange(event.target.value);
                    setCfSaved(false);
                  }}
                  className="h-10 w-full rounded-xl border border-border bg-muted/30 px-3 text-xs font-mono outline-none transition-colors focus:border-primary focus:bg-card"
                >
                  {EQUITY_RANGES.map((range) => (
                    <option key={range} value={range}>
                      {range}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1.5 text-xs font-medium text-foreground">
                <span>Location Preference</span>
                <select
                  value={locationPreference}
                  onChange={(event) => {
                    setLocationPreference(event.target.value);
                    setCfSaved(false);
                  }}
                  className="h-10 w-full rounded-xl border border-border bg-muted/30 px-3 text-xs capitalize outline-none transition-colors focus:border-primary focus:bg-card"
                >
                  {LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={saveCofounder}
                disabled={savingCf || continuing || flushingSkills}
                className="h-9 gap-1.5 rounded-xl border-border px-4 text-xs font-semibold text-primary shadow-none"
              >
                {savingCf && <Loader2 className="size-3.5 animate-spin" />}
                Save Co-Founder Preferences
              </Button>
              {cfSaved && (
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Check className="size-3.5" /> Preferences saved — will queue at Level Up (Phase 6).
                </span>
              )}
            </div>
          </Card>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-6 border-t border-border">
            <Button
              variant="outline"
              onClick={() => void showCompanyType()}
              disabled={continuing || flushingSkills || savingCf}
              className="h-10 rounded-xl border-border px-4 text-sm font-medium text-muted-foreground shadow-none"
            >
              <ArrowLeft className="size-4 mr-2" /> Structure Options
            </Button>
            <Button
              onClick={handleContinue}
              disabled={continuing || flushingSkills || savingCf}
              className="h-10 gap-2 rounded-xl px-5 text-sm font-semibold"
            >
              {continuing && <Loader2 className="size-4 animate-spin" />}
              Complete Phase 3 {!continuing && <ArrowRight className="size-4" />}
            </Button>
          </div>
        </div>
      )}
    </Phase3SetupShell>
  );
}
