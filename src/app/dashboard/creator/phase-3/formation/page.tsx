'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, ArrowLeft, ArrowRight, Check, Loader2, UserPlus, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phase3SetupShell } from '@/components/creator/Phase3SetupShell';
import { useCreatorProgress } from '@/providers/CreatorProgressProvider';
import { creatorJourneyApi, type FormationGenerator, type CofounderDraft } from '@/lib/api-creator-journey';

// Indicative reference data — hardcoded frontend constants (no source, no date). Shown to
// creators as approximate ranges, NOT authoritative legal/tax figures to plan on.
const TYPE_FACTS: Record<string, { capital: string; time: string; cost: string; note: string }> = {
  SAS: { capital: '€1+ (flexible)', time: '1–2 weeks', cost: '€200–€1,500', note: 'Investor-grade, flexible governance.' },
  'SAS-U': { capital: '€1+ (flexible)', time: '1–2 weeks', cost: '€200–€1,200', note: 'Single-shareholder SAS — solo founders.' },
  SARL: { capital: '€1+ (fixed shares)', time: '2–3 weeks', cost: '€200–€1,500', note: 'Traditional, well-suited to family/retail.' },
};
const FACT_FALLBACK = { capital: '—', time: '—', cost: '—', note: '' };
// Guard every TYPE_FACTS read: a value outside {SAS,SAS-U,SARL} or null must not white-screen.
const factOf = (t?: string | null) => TYPE_FACTS[t ?? ''] ?? FACT_FALLBACK;

const TYPES: ('SAS' | 'SARL' | 'SAS-U')[] = ['SAS', 'SAS-U', 'SARL'];

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
        const existing = (journey.phase3Data as { formationGenerator?: FormationGenerator })?.formationGenerator;
        const f = existing?.recommendedType ? existing : await creatorJourneyApi.generateFormation();
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

  const selectType = async (type: 'SAS' | 'SARL' | 'SAS-U') => {
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
      stepEyebrow="Step 3.5"
      title="Company Formation & Team"
      description="A suggested company structure to start from, and the skill areas to consider as you build."
    >
      {loading && <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center"><Loader2 className="h-5 w-5 animate-spin" /> Loading your formation…</div>}

      {error && !loading && (
        <div className="flex flex-col items-center gap-3 py-12">
          <p className="text-destructive text-sm">{error}</p>
          <Button variant="outline" size="sm" onClick={() => location.reload()}>Retry</Button>
        </div>
      )}

      {formation && !loading && view === 'type' && (
        <div className="space-y-6">
          {/* Jurisdiction disclosure — visible above the cards, not a footnote. */}
          <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 text-xs text-muted-foreground leading-relaxed">
            These are <strong className="text-foreground">French</strong> company structures (SAS, SAS-U, SARL). If you&apos;re
            incorporating elsewhere, treat this as illustrative and consult a specialist in your jurisdiction.
          </div>

          <Card className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Suggested starting structure</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {TYPES.map((t) => {
                const isRec = formation.recommendedType === t;
                const isSel = formation.selectedType === t;
                const facts = factOf(t);
                return (
                  <button key={t} onClick={() => selectType(t)} disabled={selecting}
                    className={`rounded-xl border-2 p-4 text-left transition-all ${isSel ? 'border-primary bg-primary/5' : isRec ? 'border-primary/40' : 'border-border'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm">{t}</span>
                      {isSel ? <CheckCircle2 className="h-4 w-4 text-primary" /> : isRec ? <Badge className="bg-primary text-primary-foreground text-[10px]">Suggested</Badge> : null}
                    </div>
                    <p className="text-[10px] text-muted-foreground">{facts.note}</p>
                    <div className="mt-2.5 space-y-1 text-[10px]">
                      <div><span className="text-muted-foreground">Capital:</span> <span className="font-mono">{facts.capital}</span></div>
                      <div><span className="text-muted-foreground">Time:</span> <span className="font-mono">{facts.time}</span></div>
                      <div><span className="text-muted-foreground">Cost:</span> <span className="font-mono">{facts.cost}</span></div>
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-muted-foreground">Indicative figures only — approximate ranges, not authoritative legal or tax figures to plan on.</p>

            <div className="rounded-xl bg-muted/20 border border-border/60 p-3 text-xs text-muted-foreground leading-relaxed">
              {formation.selectedType
                ? `You've selected ${formation.selectedType} — ${factOf(formation.selectedType).note} You can change this anytime before Phase 4.`
                : `A common starting point is ${formation.recommendedType} — ${factOf(formation.recommendedType).note} A rule-based suggestion you can override, not advice based on your specific idea.`}
            </div>
          </Card>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border pt-6">
            <Button variant="ghost" onClick={() => router.push('/dashboard/creator/phase-3/compliance')} className="text-xs font-bold text-muted-foreground self-start sm:self-center">
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
            </Button>
            <Button onClick={() => setView('skills')} disabled={selecting} className="gap-1.5">
              Continue to Skills {!selecting && <ArrowRight className="w-4 h-4" />}
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
