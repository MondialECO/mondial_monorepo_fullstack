'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, ArrowLeft, ArrowRight, Check, CircleCheck, Info, Loader2, UserPlus } from 'lucide-react';
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

export default function FormationPage() {
  const router = useRouter();
  const { completeStep } = useCreatorProgress();

  const [view, setView] = useState<'type' | 'skills'>('type');
  const [formation, setFormation] = useState<FormationGenerator | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [findingSp, setFindingSp] = useState<string | null>(null);
  const [workroomNote, setWorkroomNote] = useState<string | null>(null);

  // 3.5b state
  const [declaredSkills, setDeclaredSkills] = useState<string[]>([]);
  const [continuing, setContinuing] = useState(false);
  const [roleNeeded, setRoleNeeded] = useState('Technical co-founder');
  const [equityRange, setEquityRange] = useState(EQUITY_RANGES[1]);
  const [locationPreference, setLocationPreference] = useState(LOCATIONS[2]);
  const [savingCf, setSavingCf] = useState(false);
  const [cfSaved, setCfSaved] = useState(false);

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
        if (f.skillsDeclared) setDeclaredSkills(f.youHave.filter((s) => (DECLARABLE_SKILLS as readonly string[]).includes(s)));
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

  const findSp = async (specialty: string, label: string) => {
    setFindingSp(specialty);
    setWorkroomNote(null);
    try {
      const matches = await creatorJourneyApi.spMatches(specialty);
      if (matches.length === 0) { setWorkroomNote(`No verified ${specialty} specialists available right now.`); return; }
      await creatorJourneyApi.openWorkroom(matches[0].spId, label);
      setWorkroomNote(`Workroom opened with ${matches[0].name}.`);
    } catch (e) {
      setWorkroomNote(e instanceof Error ? e.message : "Couldn't open a workroom.");
    } finally {
      setFindingSp(null);
    }
  };

  const toggleSkill = (s: string) =>
    setDeclaredSkills((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  // Client-side gap derivation (same baseline as the backend) for live UX.
  const gaps = GAP_BASELINE.filter((g) => !declaredSkills.includes(g.skill));
  const hasTechGap = gaps.some((g) => g.skill === 'Tech/Engineering');
  const selectedOption = formation?.options.find((option) => option.code === formation.selectedType);
  const recommendedOption = formation?.options.find((option) => option.code === formation.recommendedType);
  const cofounderDraft = (): CofounderDraft => ({ roleNeeded, equityRange, locationPreference });

  const saveCofounder = async () => {
    setSavingCf(true);
    setCfSaved(false);
    try {
      const f = await creatorJourneyApi.declareFormationSkills(declaredSkills, cofounderDraft());
      setFormation(f);
      setCfSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save preferences.");
    } finally {
      setSavingCf(false);
    }
  };

  const handleContinue = async () => {
    setContinuing(true);
    try {
      // Persist declared skills (+ co-founder draft when the tech-gap form is in play).
      await creatorJourneyApi.declareFormationSkills(declaredSkills, hasTechGap ? cofounderDraft() : undefined);
      completeStep(3, 5); // local cursor only; status stays engine-derived
      router.push('/dashboard/creator/phase-3/complete');
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save your skills.");
      setContinuing(false);
    }
  };

  return (
    <Phase3SetupShell
      compact={view === 'type'}
      stepEyebrow={view === 'type' ? '' : 'Step 3.5'}
      title="Company Formation & Team"
      description="A suggested company structure to start from, and the skill areas to consider as you build."
      contentClassName={view === 'type' ? 'mt-8 space-y-0' : undefined}
      titleClassName={view === 'type' ? 'text-[32px] font-semibold leading-10 tracking-normal sm:text-[32px]' : undefined}
    >
      {loading && <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center"><Loader2 className="h-5 w-5 animate-spin" /> Loading your formation…</div>}

      {error && !loading && (
        <div className="flex flex-col items-center gap-3 py-12">
          <p className="text-destructive text-sm">{error}</p>
          <Button variant="outline" size="sm" onClick={() => location.reload()}>Retry</Button>
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
            <Button variant="outline" onClick={() => router.push('/dashboard/creator/phase-3/compliance')} className="h-10 rounded-xl border-border px-4 text-sm font-medium text-muted-foreground shadow-none">
              <ArrowLeft className="size-4" /> Back
            </Button>
            <Button onClick={() => setView('skills')} disabled={selecting} className="h-10 gap-2 rounded-xl px-4 text-[13px] font-semibold">
              {selecting && <Loader2 className="size-4 animate-spin" />}
              Continue to Skills {!selecting && <ArrowRight className="size-4" />}
            </Button>
          </div>
        </div>
      )}

      {formation && !loading && view === 'skills' && (
        <div className="space-y-6">
          {workroomNote && <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm text-primary">{workroomNote}</div>}

          <Card className="rounded-2xl border border-border bg-card p-6 space-y-5">
            <div>
              <h3 className="font-bold text-sm text-foreground">Your skills &amp; common gaps</h3>
              <p className="text-xs text-muted-foreground mt-1">Which of these do you personally bring? Tap all that apply.</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {DECLARABLE_SKILLS.map((s) => {
                const on = declaredSkills.includes(s);
                return (
                  <button key={s} onClick={() => toggleSkill(s)}
                    className={`rounded-full px-3 py-1.5 text-[11px] font-medium border transition-all ${on ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border hover:border-primary/40'}`}>
                    {on && <Check className="inline h-3 w-3 mr-1" />}{s}
                  </button>
                );
              })}
            </div>

            {declaredSkills.length > 0 && (
              <div className="grid gap-6 md:grid-cols-2 border-t border-border pt-5">
                {/* You have */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-primary"><Check className="h-4 w-4" /> You have</div>
                  <div className="flex flex-wrap gap-2">
                    {declaredSkills.map((h) => (
                      <span key={h} className="rounded-full bg-primary/10 text-primary px-3 py-1 text-[10px] font-medium">{h}</span>
                    ))}
                  </div>
                </div>

                {/* You need */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-warning"><Building2 className="h-4 w-4" /> Common early-stage gaps</div>
                  <p className="text-[10px] text-muted-foreground">Common skill areas for early-stage ventures that you didn&apos;t select — general starting points, not an analysis of what your specific venture needs.</p>
                  {gaps.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic pt-1">You&apos;ve selected all the common early-stage skill areas. No specialists suggested right now.</p>
                  ) : (
                    <div className="space-y-2">
                      {gaps.map((g) => (
                        <div key={g.skill} className="flex items-center justify-between gap-2 p-3 rounded-lg border border-border/50 bg-muted/20">
                          <span className="text-xs font-medium text-foreground">{g.label}</span>
                          <Button variant="outline" size="sm" onClick={() => findSp(g.specialty, g.label)} disabled={findingSp === g.specialty} className="gap-1.5 shrink-0 text-[11px] h-8">
                            {findingSp === g.specialty ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserPlus className="h-3 w-3" />} Find SP
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Co-founder — only for the tech gap. Draft captured now, matched at Level Up. */}
            {declaredSkills.length > 0 && hasTechGap && (
              <div className="rounded-xl border border-border p-4 space-y-3">
                <h4 className="font-bold text-xs text-foreground">Looking for a technical co-founder?</h4>
                <div className="rounded-lg bg-primary/5 border border-primary/10 p-3 text-[11px] text-muted-foreground leading-relaxed">
                  Co-founder matching happens at <strong className="text-foreground">Level Up (Phase 6)</strong> — not now. We&apos;ll
                  save your preferences and start matching once you Level Up. Nothing is being searched yet.
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="text-[11px] space-y-1">
                    <span className="text-muted-foreground">Role needed</span>
                    <input value={roleNeeded} onChange={(e) => { setRoleNeeded(e.target.value); setCfSaved(false); }}
                      className="w-full rounded-lg border border-border bg-background px-2.5 py-2 text-xs outline-none focus:border-primary" />
                  </label>
                  <label className="text-[11px] space-y-1">
                    <span className="text-muted-foreground">Equity range</span>
                    <select value={equityRange} onChange={(e) => { setEquityRange(e.target.value); setCfSaved(false); }}
                      className="w-full rounded-lg border border-border bg-background px-2.5 py-2 text-xs outline-none focus:border-primary font-mono">
                      {EQUITY_RANGES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </label>
                  <label className="text-[11px] space-y-1">
                    <span className="text-muted-foreground">Location preference</span>
                    <select value={locationPreference} onChange={(e) => { setLocationPreference(e.target.value); setCfSaved(false); }}
                      className="w-full rounded-lg border border-border bg-background px-2.5 py-2 text-xs outline-none focus:border-primary capitalize">
                      {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm" onClick={saveCofounder} disabled={savingCf} className="gap-1.5">
                    {savingCf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null} Save co-founder preferences
                  </Button>
                  {cfSaved && <span className="text-[11px] text-success-text">Saved — we&apos;ll start matching at Level Up.</span>}
                </div>
              </div>
            )}
          </Card>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border pt-6">
            <Button variant="ghost" onClick={() => setView('type')} disabled={continuing} className="text-xs font-bold text-muted-foreground self-start sm:self-center">
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Company type
            </Button>
            <Button onClick={handleContinue} disabled={continuing} className="gap-1.5">
              {continuing ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Continue to Phase Complete {!continuing && <ArrowRight className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      )}
    </Phase3SetupShell>
  );
}
