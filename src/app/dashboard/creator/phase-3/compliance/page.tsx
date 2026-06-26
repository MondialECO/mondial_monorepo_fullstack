'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, ArrowLeft, ArrowRight, Check, Loader2, AlertTriangle, UserPlus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phase3SetupShell } from '@/components/creator/Phase3SetupShell';
import { useCreatorProgress } from '@/providers/CreatorProgressProvider';
import {
  creatorJourneyApi,
  type LegalChecklist,
  type LegalChecklistItem,
  type ChecklistStatus,
} from '@/lib/api-creator-journey';

const NEXT_STATUS: Record<ChecklistStatus, ChecklistStatus> = {
  pending: 'in_progress',
  in_progress: 'done',
  done: 'pending',
};

export default function CompliancePage() {
  const router = useRouter();
  const { completeStep } = useCreatorProgress();
  const [checklist, setChecklist] = useState<LegalChecklist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyItem, setBusyItem] = useState<string | null>(null);
  const [findingSp, setFindingSp] = useState<string | null>(null);
  const [workroomNote, setWorkroomNote] = useState<string | null>(null);

  // Load existing checklist; generate-if-absent.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { journey } = await creatorJourneyApi.get();
        const existing = (journey.phase3Data as { legalChecklist?: LegalChecklist })?.legalChecklist;
        const cl = existing?.items?.length ? existing : await creatorJourneyApi.generateLegalChecklist();
        if (active) setChecklist(cl);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Couldn't load the checklist.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const cycle = async (item: LegalChecklistItem) => {
    setBusyItem(item.id);
    try {
      const updated = await creatorJourneyApi.updateLegalItem(item.id, NEXT_STATUS[item.status]);
      setChecklist(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't update the item.");
    } finally {
      setBusyItem(null);
    }
  };

  const findSp = async (item: LegalChecklistItem) => {
    if (!item.spSpecialty) return;
    setFindingSp(item.id);
    setWorkroomNote(null);
    try {
      const matches = await creatorJourneyApi.spMatches(item.spSpecialty);
      if (matches.length === 0) { setWorkroomNote(`No verified ${item.spSpecialty} specialists available right now.`); return; }
      await creatorJourneyApi.openWorkroom(matches[0].spId, item.label);
      setWorkroomNote(`Workroom opened with ${matches[0].name}.`);
    } catch (e) {
      setWorkroomNote(e instanceof Error ? e.message : "Couldn't open a workroom.");
    } finally {
      setFindingSp(null);
    }
  };

  const handleContinue = () => {
    completeStep(3, 4); // local cursor only; status derived server-side
    router.push('/dashboard/creator/phase-3/formation');
  };

  const statusColor = (s: ChecklistStatus) =>
    s === 'done' ? 'text-primary' : s === 'in_progress' ? 'text-warning' : 'text-muted-foreground';

  const mandatory = checklist?.items.filter((i) => i.category === 'mandatory') ?? [];
  const optional = checklist?.items.filter((i) => i.category === 'optional') ?? [];
  const pct = checklist && checklist.totalCount > 0 ? Math.round((checklist.completedCount / checklist.totalCount) * 100) : 0;

  return (
    <Phase3SetupShell
      stepEyebrow="Step 3.4"
      title="Legal & Compliance Checklist"
      description="A tailored checklist for your sector. Mark items as you progress — you can finish these anytime."
    >
      {loading && <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center"><Loader2 className="h-5 w-5 animate-spin" /> Generating your checklist…</div>}

      {error && !loading && (
        <div className="flex flex-col items-center gap-3 py-12">
          <p className="text-destructive text-sm">{error}</p>
          <Button variant="outline" size="sm" onClick={() => location.reload()}>Retry</Button>
        </div>
      )}

      {checklist && !loading && (
        <div className="space-y-6">
          {/* Progress */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-2 text-sm">
              <span className="font-semibold">{checklist.completedCount}/{checklist.totalCount} complete</span>
              <span className="text-muted-foreground">{pct}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>

          {workroomNote && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm text-primary">{workroomNote}</div>
          )}

          {/* Mandatory Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-destructive" />
              <h3 className="text-sm font-bold text-foreground">Required Items</h3>
              <span className="text-xs text-muted-foreground">({mandatory.length})</span>
            </div>
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 space-y-2">
              {mandatory.map((item) => (
                <Card key={item.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-4 hover:border-destructive/30 transition-colors">
                  <div className="flex items-center gap-3 flex-1">
                    <button onClick={() => cycle(item)} disabled={busyItem === item.id}
                      className={`h-6 w-6 rounded-md border flex items-center justify-center shrink-0 ${item.status === 'done' ? 'bg-primary border-primary text-primary-foreground' : item.status === 'in_progress' ? 'border-warning bg-warning/5' : 'border-destructive/30 bg-destructive/5'}`}>
                      {busyItem === item.id ? <Loader2 className="h-3 w-3 animate-spin" /> : item.status === 'done' ? <Check className="h-4 w-4" /> : null}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-foreground">{item.label}</span>
                        {item.badge === 'urgent' && <Badge className="bg-destructive text-white gap-1 text-xs"><AlertTriangle className="h-3 w-3" /> Urgent</Badge>}
                        {item.badge === 'fintech' && <Badge className="bg-warning text-white text-xs">FinTech</Badge>}
                        {item.aiGenerable && <Badge variant="outline" className="gap-1 text-xs"><Sparkles className="h-3 w-3" /> AI-generable</Badge>}
                      </div>
                      <span className={`text-xs ${statusColor(item.status)}`}>{item.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                  {item.showFindSp && (
                    <Button variant="outline" size="sm" onClick={() => findSp(item)} disabled={findingSp === item.id} className="gap-1.5 shrink-0 ml-2">
                      {findingSp === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />} Find SP
                    </Button>
                  )}
                </Card>
              ))}
            </div>
          </div>

          {/* Optional Section */}
          {optional.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-muted-foreground">Optional Items</h3>
                <span className="text-xs text-muted-foreground">({optional.length})</span>
              </div>
              <div className="space-y-2">
                {optional.map((item) => (
                  <Card key={item.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-colors">
                    <div className="flex items-center gap-3 flex-1">
                      <button onClick={() => cycle(item)} disabled={busyItem === item.id}
                        className={`h-6 w-6 rounded-md border flex items-center justify-center shrink-0 ${item.status === 'done' ? 'bg-primary border-primary text-primary-foreground' : item.status === 'in_progress' ? 'border-warning bg-warning/5' : 'border-border'}`}>
                        {busyItem === item.id ? <Loader2 className="h-3 w-3 animate-spin" /> : item.status === 'done' ? <Check className="h-4 w-4" /> : null}
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-foreground">{item.label}</span>
                          {item.badge === 'urgent' && <Badge className="bg-destructive text-white gap-1 text-xs"><AlertTriangle className="h-3 w-3" /> Urgent</Badge>}
                          {item.badge === 'fintech' && <Badge className="bg-warning text-white text-xs">FinTech</Badge>}
                          {item.aiGenerable && <Badge variant="outline" className="gap-1 text-xs"><Sparkles className="h-3 w-3" /> AI-generable</Badge>}
                        </div>
                        <span className={`text-xs ${statusColor(item.status)}`}>{item.status.replace('_', ' ')}</span>
                      </div>
                    </div>
                    {item.showFindSp && (
                      <Button variant="outline" size="sm" onClick={() => findSp(item)} disabled={findingSp === item.id} className="gap-1.5 shrink-0 ml-2">
                        {findingSp === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />} Find SP
                      </Button>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => router.push('/dashboard/creator/phase-3')}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
            <Button onClick={handleContinue} className="gap-2"><ShieldCheck className="h-4 w-4" /> Continue <ArrowRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}
    </Phase3SetupShell>
  );
}
