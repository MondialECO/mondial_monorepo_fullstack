'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, CircleCheck, Info, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Phase3SetupShell } from '@/components/creator/Phase3SetupShell';
import { useCreatorProgress } from '@/providers/CreatorProgressProvider';
import { cn } from '@/lib/utils';
import {
  creatorJourneyApi,
  type CofounderDraft,
  type FormationGenerator,
  type FormationTypeCode,
} from '@/lib/api-creator-journey';

// The fixed declarable skill set (mirrors the backend DeclarableSkills).
const DECLARABLE_SKILLS = [
  'Tech/Engineering', 'Finance', 'Legal', 'Sales', 'Operations',
  'Design', 'Community', 'Product', 'Domain expertise', 'Marketing',
] as const;

// SP-backed gap baseline (mirrors the backend GapBaseline) — every gap → a real specialist.
const GAP_BASELINE: { skill: string; specialty: string; label: string }[] = [
  { skill: 'Tech/Engineering', specialty: 'development', label: 'Full-stack Developer' },
  { skill: 'Finance', specialty: 'finance', label: 'Financial Advisor' },
  { skill: 'Legal', specialty: 'legal', label: 'Legal Specialist' },
  { skill: 'Design', specialty: 'branding', label: 'Brand Designer' },
];

const EQUITY_RANGES = ['< 5%', '5–10%', '10–20%', '> 20%'];
const LOCATIONS = ['remote', 'local', 'either'];
const SKILLS_AUTOSAVE_DEBOUNCE_MS = 400;

type PendingSkillsSave = {
  skills: string[];
  revision: number;
};

export default function FormationPage() {
  const router = useRouter();
  const { completeStep } = useCreatorProgress();

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
          const updatedFormation = await creatorJourneyApi.declareFormationSkills(snapshot.skills);
          if (isMountedRef.current && snapshot.revision === latestSkillsRevisionRef.current) {
            setFormation(updatedFormation);
            setError(null);
          }
        } catch (cause) {
          // A newer toggle supersedes a failed older snapshot and is attempted next.
          // Otherwise retain the failed snapshot so an explicit navigation flush can retry it.
          // React refs can change while the awaited request is in flight, although
          // TypeScript's control-flow analysis still remembers the null assignment.
          const queuedAfterFailure = pendingSkillsSaveRef.current as PendingSkillsSave | null;
          const hasNewerSnapshot = queuedAfterFailure !== null
            && queuedAfterFailure.revision > snapshot.revision;
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

  const queueSkillsAutosave = useCallback((skills: string[]) => {
    const revision = latestSkillsRevisionRef.current + 1;
    latestSkillsRevisionRef.current = revision;
    pendingSkillsSaveRef.current = { skills: [...skills], revision };

    if (skillsSaveTimerRef.current) clearTimeout(skillsSaveTimerRef.current);
    skillsSaveTimerRef.current = setTimeout(() => {
      skillsSaveTimerRef.current = null;
      void drainSkillsQueue().catch(() => undefined);
    }, SKILLS_AUTOSAVE_DEBOUNCE_MS);
  }, [drainSkillsQueue]);

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
      // Covers non-page-owned SPA unmounts on a best-effort basis. Page-owned
      // navigation always awaits flushSkills before it is allowed to proceed.
      if (pendingSkillsSaveRef.current) void drainSkillsQueue().catch(() => undefined);
    };
  }, [drainSkillsQueue, flushSkills]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { journey } = await creatorJourneyApi.get();
        const phase3 = journey.phase3Data as {
          forecastSessionId?: string | null;
          formationGenerator?: FormationGenerator;
        };
        const existing = phase3?.formationGenerator;
        // Existing records created before forecast-backed recommendations do not have
        // a reason/basis. Also refresh when the creator links a newer forecast session;
        // the backend preserves selections and declared skills.
        const forecastIsCurrent = !phase3?.forecastSessionId ||
          existing?.forecastBasis?.forecastSessionId === phase3.forecastSessionId;
        const hasBackendOptions = (existing?.options?.length ?? 0) > 0;
        const f = existing?.recommendedType && existing.recommendationReason && forecastIsCurrent && hasBackendOptions
          ? existing
          : await creatorJourneyApi.generateFormation();
        if (!active) return;
        setFormation(f);
        // Legacy formations (no declaration) start EMPTY — the old youHave was an echo of the
        // creator's own words, never a declaration. Only reload chips once truly declared.
        if (f.skillsDeclared) {
          const hydratedSkills = f.youHave.filter((s) => (DECLARABLE_SKILLS as readonly string[]).includes(s));
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
    return () => { active = false; };
  }, []);

  const selectType = async (type: FormationTypeCode) => {
    setSelecting(true);
    try {
      const { formation: f } = await creatorJourneyApi.selectFormationType(type);
      setFormation(f); // type ↔ skills are decoupled — this never recalculates the gap
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

  // Client-side gap derivation (same baseline as the backend) for live UX.
  const gaps = GAP_BASELINE.filter((g) => !declaredSkills.includes(g.skill));
  const selectedOption = formation?.options.find((option) => option.code === formation.selectedType);
  const recommendedOption = formation?.options.find((option) => option.code === formation.recommendedType);
  const cofounderDraft = (): CofounderDraft => ({ roleNeeded, equityRange, locationPreference });

  const saveCofounder = async () => {
    if (skillsInteractionLockedRef.current) return;
    skillsInteractionLockedRef.current = true;
    setSavingCf(true);
    setCfSaved(false);
    setError(null);
    try {
      await flushSkills();
      const f = await creatorJourneyApi.declareFormationSkills(declaredSkillsRef.current, cofounderDraft());
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
      // Persist declared skills (+ co-founder draft when the tech-gap form is in play).
      await creatorJourneyApi.declareFormationSkills(declaredSkillsRef.current, cofounderDraft());
      completeStep(3, 5); // local cursor only; status stays engine-derived
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
      stepEyebrow=""
      title="Company Formation & Team"
      description="A suggested company structure to start from, and the skill areas to consider as you build."
      contentClassName="mt-8 space-y-0"
      titleClassName="text-[32px] font-semibold leading-10 tracking-normal sm:text-[32px]"
    >
      {loading && <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center"><Loader2 className="h-5 w-5 animate-spin" /> Loading your formation…</div>}

      {error && !loading && (
        <div className="flex flex-col items-center gap-3 py-12">
          <p className="text-destructive text-sm">{error}</p>
          <Button variant="outline" size="sm" onClick={() => void retryCurrentError()} disabled={flushingSkills}>
            {flushingSkills && <Loader2 className="size-4 animate-spin" />}
            Retry
          </Button>
        </div>
      )}

      {formation && !loading && view === 'type' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl border border-primary/15 bg-primary/5 p-3 text-xs leading-4 text-primary">
            <Info className="size-4 shrink-0" aria-hidden="true" />
            <p>
              These are <strong>French</strong> company structures (SAS, SAS-U, SARL). If you&apos;re incorporating elsewhere,
              treat this as illustrative and consult a specialist in your jurisdiction.
            </p>
          </div>

          <Card className="space-y-6 rounded-3xl border-white bg-card/70 p-5 shadow-none sm:p-7">
            <div className="text-sm font-medium uppercase leading-5 text-muted-foreground">Suggested starting structure</div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {formation.options.map((option) => {
                const isRec = formation.recommendedType === option.code;
                const isSel = formation.selectedType === option.code;
                return (
                  <button
                    key={option.code}
                    type="button"
                    onClick={() => selectType(option.code)}
                    disabled={selecting}
                    aria-pressed={isSel}
                    className={cn(
                      "flex min-h-[190px] flex-col gap-4 rounded-2xl border bg-card p-5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70",
                      isSel || isRec ? "border-primary/50" : "border-border/60 hover:border-primary/30",
                    )}
                  >
                    <div className="flex w-full items-center justify-between gap-3">
                      <span className="text-xl font-semibold leading-6 text-foreground">{option.code}</span>
                      {(isSel || isRec) && (
                        <span className="inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full border border-primary/15 bg-primary/5 px-2.5 text-[11px] font-bold text-primary">
                          <CircleCheck className="size-4" aria-hidden="true" />
                          {isSel ? 'Selected' : 'Suggested'}
                        </span>
                      )}
                    </div>

                    <p className="min-h-8 text-xs leading-4 text-muted-foreground">{option.description}</p>

                    <div className="space-y-2 text-xs leading-4">
                      <div className="flex gap-2"><span className="text-muted-foreground">Capital:</span> <span className="font-semibold text-foreground">{option.capital}</span></div>
                      <div className="flex gap-2"><span className="text-muted-foreground">Time:</span> <span className="font-semibold text-foreground">{option.formationTime}</span></div>
                      <div className="flex gap-2"><span className="text-muted-foreground">Cost:</span> <span className="font-semibold text-foreground">{option.estimatedCost}</span></div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="space-y-3">
              <p className="text-xs leading-[1.4] text-muted-foreground">
                Indicative figures only - approximate ranges, not authoritative legal or tax figures to plan on.
              </p>

              <div className="space-y-1 rounded-xl border border-border bg-muted px-4 py-3 text-xs leading-4 text-muted-foreground">
                <p>{formation.selectedType
                  ? `You've selected ${formation.selectedType} - ${selectedOption?.description ?? ''} You can change this anytime before Phase 4.`
                  : `A common starting point is ${formation.recommendedType} - ${recommendedOption?.description ?? ''} A rule-based suggestion you can override, not advice based on your specific filing.`}</p>
                {formation.recommendationReason && (
                  <p><span className="font-semibold text-foreground">Why this suggestion:</span> {formation.recommendationReason}</p>
                )}
              </div>
            </div>
          </Card>

          <div className="flex items-center justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => void navigateAfterSkillsFlush('/dashboard/creator/phase-3/compliance')}
              disabled={flushingSkills}
              className="h-10 rounded-xl border-border px-4 text-sm font-medium text-muted-foreground shadow-none"
            >
              <ArrowLeft className="size-4" /> Back
            </Button>
            <Button onClick={() => void showSkills()} disabled={selecting || flushingSkills} className="h-10 gap-2 rounded-xl px-4 text-[13px] font-semibold">
              {(selecting || flushingSkills) && <Loader2 className="size-4 animate-spin" />}
              Continue to Skills {!selecting && !flushingSkills && <ArrowRight className="size-4" />}
            </Button>
          </div>
        </div>
      )}

      {formation && !loading && view === 'skills' && (
        <div className="space-y-5">
          <Card className="space-y-6 rounded-[20px] border-white bg-card p-6 shadow-[0_2px_20px_rgba(0,0,0,0.02)] sm:p-8">
            <div className="space-y-2">
              <h3 className="text-lg font-medium leading-6 text-foreground">Your skills &amp; competence gaps</h3>
              <p className="text-sm leading-5 text-muted-foreground">Which of these do you personally bring? Tap all that apply.</p>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {DECLARABLE_SKILLS.map((skill) => {
                const selected = declaredSkills.includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    disabled={continuing || flushingSkills || savingCf}
                    aria-pressed={selected}
                    className={cn(
                      "inline-flex h-8 items-center gap-1.5 rounded-full border px-4 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70",
                      selected
                        ? "border-primary bg-primary font-semibold text-primary-foreground"
                        : "border-border bg-transparent font-normal text-foreground hover:border-primary/40",
                    )}
                  >
                    {selected && <CircleCheck className="size-3" aria-hidden="true" />}
                    {skill}
                  </button>
                );
              })}
            </div>

            {declaredSkills.length > 0 && (
              <div className="grid gap-8 border-t border-border pt-6 md:grid-cols-2 md:gap-12">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <CircleCheck className="size-4" aria-hidden="true" /> You have
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {declaredSkills.map((skill) => (
                      <span key={skill} className="rounded-lg bg-[#d4ffe5] px-2.5 py-1 text-[11px] font-medium leading-4 text-[#157a55]">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-[#965f11]">
                      <Info className="size-4" aria-hidden="true" /> Common early-stage gaps
                    </div>
                    <p className="text-xs leading-4 text-muted-foreground">
                      Common skill areas for early-stage ventures that you didn&apos;t select — general starting points, not an analysis of your specific venture needs.
                    </p>
                  </div>

                  {gaps.length === 0 ? (
                    <p className="pt-1 text-xs italic text-muted-foreground">You&apos;ve selected all the common early-stage skill areas. No specialists suggested right now.</p>
                  ) : (
                    <div className="space-y-2">
                      {gaps.map((gap) => (
                        <div key={gap.skill} className="flex min-h-[52px] items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3">
                          <span className="text-sm font-semibold leading-5 text-foreground">{gap.label}</span>
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="h-7 shrink-0 gap-1.5 rounded-full border-border px-3 text-[11px] font-semibold shadow-none"
                          >
                            <Link
                              href="/marketplace/services"
                              aria-disabled={flushingSkills || continuing || savingCf}
                              onClick={(event) => {
                                event.preventDefault();
                                void navigateAfterSkillsFlush('/marketplace/services');
                              }}
                            >
                              <Search className="size-3" />
                              Find Service Providers
                            </Link>
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>

          <Card className="space-y-6 rounded-[20px] border-white bg-card p-6 shadow-[0_2px_20px_rgba(0,0,0,0.02)] sm:p-8">
              <h4 className="text-base font-medium leading-6 text-foreground">Looking for a technical co-founder?</h4>

              <div className="flex items-center gap-3 rounded-xl border border-primary/50 bg-primary/5 px-4 py-3 text-xs leading-4 text-muted-foreground">
                <Info className="size-4 shrink-0 text-foreground" aria-hidden="true" />
                <p>
                  Co-founder matching happens at Level Up (Phase 6) — not now. We&apos;ll save your preferences and start matching once you Level Up. Nothing is being searched yet.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <label className="space-y-2 text-sm font-medium text-foreground">
                    <span>Role needed</span>
                    <input
                      value={roleNeeded}
                      onChange={(event) => { setRoleNeeded(event.target.value); setCfSaved(false); }}
                      className="h-12 w-full rounded-lg border border-border bg-card px-4 text-sm font-normal outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </label>
                  <label className="space-y-2 text-sm font-medium text-foreground">
                    <span>Equity Range</span>
                    <select
                      value={equityRange}
                      onChange={(event) => { setEquityRange(event.target.value); setCfSaved(false); }}
                      className="h-12 w-full rounded-lg border border-border bg-card px-4 text-sm font-normal outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                    >
                      {EQUITY_RANGES.map((range) => <option key={range} value={range}>{range}</option>)}
                    </select>
                  </label>
                  <label className="space-y-2 text-sm font-medium text-foreground">
                    <span>Location Preference</span>
                    <select
                      value={locationPreference}
                      onChange={(event) => { setLocationPreference(event.target.value); setCfSaved(false); }}
                      className="h-12 w-full rounded-lg border border-border bg-card px-4 text-sm font-normal capitalize outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                    >
                      {LOCATIONS.map((location) => <option key={location} value={location}>{location}</option>)}
                    </select>
                  </label>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={saveCofounder}
                    disabled={savingCf || continuing || flushingSkills}
                    className="h-11 gap-1.5 rounded-lg border-border px-6 text-sm font-medium text-primary shadow-none"
                  >
                    {savingCf && <Loader2 className="size-4 animate-spin" />}
                    Save co-founder preferences
                  </Button>
                  {cfSaved && <span className="text-[11px] text-success-text">Saved — we&apos;ll start matching at Level Up.</span>}
                </div>
              </div>
          </Card>

          <div className="flex items-center justify-between gap-4 pt-3">
            <Button
              variant="outline"
              onClick={() => void showCompanyType()}
              disabled={continuing || flushingSkills || savingCf}
              className="h-10 rounded-xl border-border px-4 text-sm font-medium text-muted-foreground shadow-none"
            >
              {flushingSkills ? <Loader2 className="size-4 animate-spin" /> : <ArrowLeft className="size-4" />}
              Company Type
            </Button>
            <Button onClick={handleContinue} disabled={continuing || flushingSkills || savingCf} className="h-10 gap-2 rounded-xl px-4 text-[13px] font-semibold">
              {continuing && <Loader2 className="size-4 animate-spin" />}
              Continue to Phase Complete {!continuing && <ArrowRight className="size-4" />}
            </Button>
          </div>
        </div>
      )}
    </Phase3SetupShell>
  );
}
