'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, ArrowLeft, ArrowRight, Check, Loader2, UserPlus, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phase3SetupShell } from '@/components/creator/Phase3SetupShell';
import { useCreatorProgress } from '@/providers/CreatorProgressProvider';
import { creatorJourneyApi, type FormationGenerator } from '@/lib/api-creator-journey';

const TYPE_FACTS: Record<string, { capital: string; time: string; cost: string; note: string }> = {
  SAS: { capital: '€1+ (flexible)', time: '1–2 weeks', cost: '€200–€1,500', note: 'Investor-grade, flexible governance.' },
  'SAS-U': { capital: '€1+ (flexible)', time: '1–2 weeks', cost: '€200–€1,200', note: 'Single-shareholder SAS — solo founders.' },
  SARL: { capital: '€1+ (fixed shares)', time: '2–3 weeks', cost: '€200–€1,500', note: 'Traditional, well-suited to family/retail.' },
};

const TYPES: ('SAS' | 'SARL' | 'SAS-U')[] = ['SAS', 'SAS-U', 'SARL'];

export default function FormationPage() {
  const router = useRouter();
  const { completeStep } = useCreatorProgress();
  const [formation, setFormation] = useState<FormationGenerator | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [findingSp, setFindingSp] = useState<string | null>(null);
  const [workroomNote, setWorkroomNote] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { journey } = await creatorJourneyApi.get();
        const existing = (journey.phase3Data as { formationGenerator?: FormationGenerator })?.formationGenerator;
        const f = existing?.recommendedType ? existing : await creatorJourneyApi.generateFormation();
        if (active) setFormation(f);
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
      setFormation(f);
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

  const handleContinue = () => {
    completeStep(3, 5);
    router.push('/dashboard/creator/phase-3/complete');
  };

  return (
    <Phase3SetupShell
      stepEyebrow="Step 3.5"
      title="Company Formation & Team"
      description="A recommended legal structure for your idea, plus the specialists you'll want on board."
    >
      {loading && <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center"><Loader2 className="h-5 w-5 animate-spin" /> Analyzing your formation…</div>}

      {error && !loading && (
        <div className="flex flex-col items-center gap-3 py-12">
          <p className="text-destructive text-sm">{error}</p>
          <Button variant="outline" size="sm" onClick={() => location.reload()}>Retry</Button>
        </div>
      )}

      {formation && !loading && (
        <div className="space-y-6">
          {/* Recommended type + selection */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Recommended structure</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {TYPES.map((t) => {
                const isRec = formation.recommendedType === t;
                const isSel = formation.selectedType === t;
                const facts = TYPE_FACTS[t];
                return (
                  <button key={t} onClick={() => selectType(t)} disabled={selecting}
                    className={`rounded-2xl border-2 p-4 text-left transition-all ${isSel ? 'border-primary bg-primary/5' : isRec ? 'border-primary/40' : 'border-border'}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-extrabold">{t}</span>
                      {isSel ? <CheckCircle2 className="h-5 w-5 text-primary" /> : isRec ? <Badge className="bg-primary text-primary-foreground">Recommended</Badge> : null}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{facts.note}</p>
                    <div className="mt-3 space-y-1 text-xs">
                      <div><span className="text-muted-foreground">Capital:</span> {facts.capital}</div>
                      <div><span className="text-muted-foreground">Time:</span> {facts.time}</div>
                      <div><span className="text-muted-foreground">Cost:</span> {facts.cost}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {workroomNote && <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm text-primary">{workroomNote}</div>}

          {/* Skill gap */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="rounded-2xl border border-border bg-card p-5">
              <div className="text-sm font-semibold mb-3 flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> You Have</div>
              {formation.youHave.length === 0 ? (
                <p className="text-sm text-muted-foreground">Add strengths on your idea to populate this.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {formation.youHave.map((h) => <span key={h} className="rounded-full bg-primary/10 text-primary px-3 py-1 text-xs">{h}</span>)}
                </div>
              )}
            </Card>

            <Card className="rounded-2xl border border-border bg-card p-5">
              <div className="text-sm font-semibold mb-3 flex items-center gap-2"><Building2 className="h-4 w-4 text-warning" /> You Need</div>
              <div className="space-y-2">
                {formation.youNeed.length === 0 && <p className="text-sm text-muted-foreground">Your team looks covered. 🎉</p>}
                {formation.youNeed.map((n) => (
                  <div key={n.label} className="flex items-center justify-between gap-2">
                    <span className="text-sm">{n.label}</span>
                    <Button variant="outline" size="sm" onClick={() => findSp(n.spSpecialty, n.label)} disabled={findingSp === n.spSpecialty} className="gap-1.5 shrink-0">
                      {findingSp === n.spSpecialty ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />} Find SP
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => router.push('/dashboard/creator/phase-3/compliance')}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
            <Button onClick={handleContinue} className="gap-2">Continue <ArrowRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}
    </Phase3SetupShell>
  );
}
