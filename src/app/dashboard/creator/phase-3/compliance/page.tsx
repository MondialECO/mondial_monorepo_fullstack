'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Loader2, Search, Square, SquareCheckBig, WandSparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Phase3SetupShell } from '@/components/creator/Phase3SetupShell';
import { useCreatorProgress } from '@/providers/CreatorProgressProvider';
import { cn } from '@/lib/utils';
import {
  creatorJourneyApi,
  type LegalChecklist,
  type LegalChecklistItem,
  type ChecklistStatus,
} from '@/lib/api-creator-journey';

const NEXT_STATUS: Record<ChecklistStatus, ChecklistStatus> = {
  pending: 'done',
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

  const handleContinue = () => {
    completeStep(3, 4); // local cursor only; status derived server-side
    router.push('/dashboard/creator/phase-3/formation');
  };

  const mandatory = checklist?.items.filter((i) => i.category === 'mandatory') ?? [];
  // ADVISORY: legal items no longer gate Phase-3 completion (backend gate removed —
  // the checklist is pure self-attestation). Counts below are guidance only.
  const mandatoryDone = mandatory.filter((i) => i.status === 'done').length;
  const mandatoryRemaining = mandatory.length - mandatoryDone;
  const pct = checklist && checklist.totalCount > 0 ? Math.round((checklist.completedCount / checklist.totalCount) * 100) : 0;
  const orderedItems = checklist
    ? [...checklist.items].sort((a, b) => Number(b.status === 'done') - Number(a.status === 'done'))
    : [];

  return (
    <Phase3SetupShell
      compact
      stepEyebrow=""
      title="Legal & Compliance Checklist"
      description="A tailored checklist for your sector. Mark items as you progress - you can finish these anytime."
      headerAlign="left"
      contentClassName="mt-8 space-y-0"
      titleClassName="text-[32px] font-semibold leading-10 sm:text-[32px]"
    >
      {loading && (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Generating your checklist...
        </div>
      )}

      {error && !loading && (
        <div className="flex flex-col items-center gap-3 py-12">
          <p className="text-destructive text-sm">{error}</p>
          <Button variant="outline" size="sm" onClick={() => location.reload()}>Retry</Button>
        </div>
      )}

      {checklist && !loading && (
        <div className="space-y-8">
          <Card className="space-y-2 rounded-lg border-border/60 bg-card p-4 shadow-none">
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-muted-foreground">Compliance Readiness</span>
              <span className="font-semibold text-primary">{pct}%</span>
            </div>
            <Progress value={pct} className="h-1 bg-muted" aria-label={`${pct}% compliance readiness`} />
            <div className="text-sm text-muted-foreground">
              Task: <span className="font-medium text-foreground">{checklist.completedCount}/{checklist.totalCount}</span>
            </div>
          </Card>

          <div className="space-y-3">
            {orderedItems.map((item) => {
              const done = item.status === 'done';
              const busy = busyItem === item.id;

              return (
                <Card
                  key={item.id}
                  className="min-h-20 rounded-xl border-border/50 bg-card px-4 py-3 shadow-none transition-colors hover:border-border"
                  aria-busy={busy}
                >
                  <div className="flex min-h-[54px] items-start gap-3">
                    <button
                      type="button"
                      onClick={() => cycle(item)}
                      disabled={busy}
                      aria-label={`${done ? 'Mark as pending' : 'Mark as done'}: ${item.label}`}
                      aria-pressed={done}
                      className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
                    >
                      {busy ? (
                        <Loader2 className="size-4 animate-spin text-primary" />
                      ) : done ? (
                        <SquareCheckBig className="size-4 text-[#157a55]" strokeWidth={2.25} />
                      ) : (
                        <Square className="size-4 text-[#965f11]" strokeWidth={1.5} />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex min-h-7 items-start justify-between gap-3">
                        <p
                          className={cn(
                            "min-w-0 flex-1 text-base font-medium leading-6 text-foreground",
                            done && "text-muted-foreground line-through",
                          )}
                        >
                          {item.label}
                        </p>

                        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                          {item.badge && (
                            <span className="inline-flex h-7 items-center rounded-full border border-warning/25 bg-warning/10 px-2 text-xs font-medium text-warning">
                              {item.badge === 'urgent' ? 'Urgent' : 'FinTech'}
                            </span>
                          )}
                          {item.aiGenerable && (
                            <span className="inline-flex h-7 items-center gap-1 rounded-full bg-muted px-2.5 text-[11px] font-medium text-muted-foreground">
                              <WandSparkles className="size-3" /> AI-generable
                            </span>
                          )}
                          {item.showFindSp && (
                            <Button
                              asChild
                              variant="outline"
                              size="sm"
                              className="h-7 rounded-full border-border bg-muted/60 px-2 text-xs font-medium text-muted-foreground shadow-none hover:bg-muted"
                            >
                              <Link href="/marketplace/services">
                                <Search className="size-3" />
                                Find Service Providers
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>

                      <p className={cn("text-sm font-medium leading-5", done ? "text-[#157a55]" : "text-[#965f11]")}>
                        {done ? 'Done' : 'Pending'}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="space-y-4">
            {mandatoryRemaining > 0 && (
              <p className="text-sm font-medium text-[#965f11]">
                You can continue - {mandatoryRemaining} required {mandatoryRemaining === 1 ? 'item is' : 'items are'} still outstanding. Recommended before launch.
              </p>
            )}
            <div className="flex items-center justify-between border-t border-border pt-6">
              <Button variant="ghost" onClick={() => router.push('/dashboard/creator/phase-3')}>
                <ArrowLeft className="size-4" /> Back
              </Button>
              <Button onClick={handleContinue} className="gap-2">
                Continue <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </Phase3SetupShell>
  );
}
