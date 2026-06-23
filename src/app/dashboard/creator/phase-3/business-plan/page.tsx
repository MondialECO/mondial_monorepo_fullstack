'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, ArrowLeft, ArrowRight, Loader2, RotateCw, AlertTriangle, FileWarning, Sparkles, Pencil, Check, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Phase3SetupShell } from '@/components/creator/Phase3SetupShell';
import { useCreatorProgress } from '@/providers/CreatorProgressProvider';
import { useBusinessPlanSessionTimed, useStartBusinessPlan } from '@/hooks/queries/creator-ai';
import { creatorJourneyApi } from '@/lib/api-creator-journey';
import { creatorAiApi } from '@/lib/api-creator-ai';
import { hasAiOutput, type BusinessPlanOutput } from '@/types/creator/ai';

type SectionBadge = 'auto_built_phase2' | 'ai_researched' | 'auto_built_43' | 'auto_filled_31' | 'used_in_phase5' | null;
const BADGE_LABEL: Record<NonNullable<SectionBadge>, string> = {
  auto_built_phase2: 'Auto-built · Phase 2',
  ai_researched: 'AI-researched',
  auto_built_43: 'Auto-built · 4.3',
  auto_filled_31: 'Auto-filled · 3.1',
  used_in_phase5: 'Used in Phase 5',
};

// `rewritable` mirrors the backend BusinessPlanSections.Map (the 5 real C-3 fields
// RewriteSection accepts). The other 4 are DERIVED from another module — not editable
// here; `derivedSource` names where they actually come from (for the disabled hint).
interface DisplaySection { id: string; title: string; body: string; badge: SectionBadge; rewritable: boolean; edited: boolean; derivedSource?: string; }

// Frontend display-section id → C-3 field (the 5 rewritable/editable sections only).
// Mirrors the server-side BusinessPlanSections.Map so the splice round-trips cleanly.
const FIELD_BY_SECTION: Record<string, string> = {
  executive: 'executiveSummary',
  'target-market': 'marketAnalysis',
  'business-model': 'revenueModel',
  competitive: 'competitorAnalysis',
  gtm: 'goToMarket',
};

// Map C-3 BusinessPlanOutput (7 fields) + cross-module data → 9 display sections.
function buildSections(
  bp: BusinessPlanOutput | undefined,
  project: { problem: string; solution: string; targetUser: string },
  cross: { hasForecast: boolean; hasGtm: boolean; youNeed: string[]; seedAsk: number | null },
): DisplaySection[] {
  const join = (...xs: (string | undefined)[]) => xs.filter(Boolean).join(' ');
  const isEdited = (sectionId: string) =>
    bp?._sectionMeta?.[FIELD_BY_SECTION[sectionId]]?.status === 'edited';
  return [
    { id: 'executive', title: '1. Executive Summary', body: bp?.executiveSummary?.overview ?? '', badge: null, rewritable: true, edited: isEdited('executive') },
    { id: 'problem-solution', title: '2. Problem & Solution', body: join(project.problem, '—', project.solution), badge: 'auto_built_phase2', rewritable: false, edited: false, derivedSource: 'your clarified idea (Phase 2)' },
    { id: 'target-market', title: '3. Target Market', body: join(project.targetUser, bp?.marketAnalysis?.overview), badge: 'auto_built_phase2', rewritable: true, edited: isEdited('target-market') },
    { id: 'business-model', title: '4. Business Model', body: bp?.revenueModel?.summary ?? '', badge: null, rewritable: true, edited: isEdited('business-model') },
    { id: 'competitive', title: '5. Competitive Landscape', body: bp?.competitorAnalysis?.overview ?? '', badge: 'ai_researched', rewritable: true, edited: isEdited('competitive') },
    { id: 'gtm', title: '6. Go-to-Market', body: bp?.goToMarket?.strategy ?? '', badge: cross.hasGtm ? 'auto_built_43' : null, rewritable: true, edited: isEdited('gtm') },
    // Option (a): plan generates with a placeholder here; the forecast step (next)
    // back-fills it. The plan precedes the forecast, so it can't bind one yet at plan time.
    { id: 'financials', title: '7. Financial Projections', body: cross.hasForecast ? 'Bound to your live forecast — revenue, costs, cash flow, and break-even.' : 'Your forecast (the next step) will populate this section.', badge: 'auto_filled_31', rewritable: false, edited: false, derivedSource: 'your forecast' },
    { id: 'team', title: '8. Team Needs', body: cross.youNeed.length ? `Key hires: ${cross.youNeed.join(', ')}.` : 'Run the Formation Generator (3.4) to identify team needs.', badge: null, rewritable: false, edited: false, derivedSource: 'the Formation Generator (3.4)' },
    { id: 'funding', title: '9. Funding Requirements', body: cross.seedAsk ? `Target raise: €${cross.seedAsk.toLocaleString()}.` : 'Defined later in Phase 5 (seed funding).', badge: cross.seedAsk ? 'used_in_phase5' : null, rewritable: false, edited: false, derivedSource: 'your Phase 5 seed funding' },
  ];
}

// Friendly handler for the backend's 422 section_not_editable guard. The UI now
// prevents the confused click, but a stale UI / race / direct call can still trip it —
// translate it to the "update its source" message instead of a raw error string.
function friendlyError(e: unknown, fallback: string): string {
  const res = (e as { response?: { status?: number; data?: { message?: string } } } | undefined)?.response;
  if (res?.status === 422 && res.data?.message === 'section_not_editable') {
    return 'This section is auto-generated from another module — update its source to change it.';
  }
  return e instanceof Error ? e.message : fallback;
}

export default function BusinessPlanPage() {
  const router = useRouter();
  const { completeStep } = useCreatorProgress();

  const [loading, setLoading] = useState(true);
  const [bpSessionId, setBpSessionId] = useState<string | null>(null);
  const [clarifierSessionId, setClarifierSessionId] = useState<string | null>(null);
  const [project, setProject] = useState({ problem: '', solution: '', targetUser: '' });
  const [cross, setCross] = useState({ hasForecast: false, hasGtm: false, youNeed: [] as string[], seedAsk: null as number | null });
  const [startError, setStartError] = useState<string | null>(null);
  // The section being AI-rewritten + the plan version at rewrite-start, so we can clear
  // the single-section skeleton once the new (incremented) version lands.
  const [rewriting, setRewriting] = useState<{ sectionId: string; baseVersion: number } | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  // Per-section manual-edit save state: 'saving' | 'saved' | 'error'.
  const [editState, setEditState] = useState<{ id: string; state: 'saving' | 'saved' | 'error'; message?: string } | null>(null);

  const startBp = useStartBusinessPlan();
  const session = useBusinessPlanSessionTimed(bpSessionId);
  const currentVersion = (session.data as { currentVersion?: number } | undefined)?.currentVersion ?? 0;

  // A single-section rewrite re-enters Processing; clear the skeleton only once the
  // server has appended the new version (currentVersion advances past the baseline).
  useEffect(() => {
    if (rewriting && currentVersion > rewriting.baseVersion) setRewriting(null);
  }, [currentVersion, rewriting]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { journey } = await creatorJourneyApi.get();
        if (!active) return;
        const p3 = journey.phase3Data as {
          businessPlanSessionId?: string; clarifierSessionId?: string; forecastSessionId?: string;
          formationGenerator?: { youNeed?: { label: string }[] };
        };
        const p2 = journey.phase2Data as { clarifierSessionId?: string };
        const p5 = journey.phase5Data as { pathB?: { seedFunding?: { totalAsk?: number } } };
        setBpSessionId(p3?.businessPlanSessionId ?? null);
        setClarifierSessionId(p3?.clarifierSessionId ?? p2?.clarifierSessionId ?? null);
        setProject({ problem: journey.project?.problem ?? '', solution: journey.project?.solution ?? '', targetUser: journey.project?.targetUser ?? '' });
        setCross({
          hasForecast: !!p3?.forecastSessionId,
          hasGtm: !!(journey.phase4Data as { gtmSetup?: unknown })?.gtmSetup,
          youNeed: (p3?.formationGenerator?.youNeed ?? []).map((n) => n.label),
          seedAsk: p5?.pathB?.seedFunding?.totalAsk ?? null,
        });
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const bpOutput = (session.data as { output?: BusinessPlanOutput } | undefined)?.output;
  const completed = session.phase === 'terminal' && hasAiOutput((session.data as { status?: import('@/types/creator/ai').AiSessionStatus })?.status) && !!bpOutput;
  // Keep the section grid visible during a single-section rewrite (the session briefly
  // re-enters Processing) so only the rewritten section shows a skeleton, not the page.
  const showGrid = completed || (!!rewriting && !!bpOutput);

  const sections = useMemo(
    () => buildSections(bpOutput, project, cross),
    [bpOutput, project, cross],
  );

  const handleStart = async () => {
    setStartError(null);
    if (!clarifierSessionId) { setStartError('Complete the Idea Clarifier first — the plan builds on it.'); return; }
    try {
      const res = await startBp.mutateAsync({ clarifierSessionId });
      await creatorJourneyApi.setPhase3Session('businessPlan', res.sessionId);
      setBpSessionId(res.sessionId);
    } catch (e) {
      setStartError(e instanceof Error ? e.message : 'Could not start the business plan.');
    }
  };

  const handleRewrite = async (sectionId: string) => {
    if (!bpSessionId || rewriting) return;
    setStartError(null);
    setRewriting({ sectionId, baseVersion: currentVersion });
    try {
      await creatorAiApi.rewriteSection(bpSessionId, sectionId);
      // The session re-enters Processing; the timed poller resumes automatically.
      // The skeleton clears via the version-increment effect once the splice lands.
      session.retry();
    } catch (e) {
      setStartError(friendlyError(e, 'Rewrite failed.'));
      setRewriting(null);
    }
  };

  // Durable per-section manual edit: PATCH → server splice (status "edited"), then
  // refetch so the canonical (incremented) version shows. Survives reload.
  const saveEdit = async (sectionId: string) => {
    if (!bpSessionId) return;
    setEditState({ id: sectionId, state: 'saving' });
    try {
      await creatorAiApi.editSection(bpSessionId, sectionId, editDraft);
      session.retry(); // refetch the canonical plan (Completed → stays terminal, no poll)
      setEditing(null);
      setEditState({ id: sectionId, state: 'saved' });
    } catch (e) {
      setEditState({ id: sectionId, state: 'error', message: friendlyError(e, 'Save failed.') });
    }
  };

  // Business plan is step 2; the forecast (step 3) consumes it next.
  const handleNext = () => {
    completeStep(3, 2);
    router.push('/dashboard/creator/phase-3/forecast');
  };

  return (
    <Phase3SetupShell
      stepEyebrow="Step 3.3"
      title="AI Business Plan"
      description="Your plan in nine sections, drafted from your clarified idea. Edit any section or ask the AI to rewrite it."
      stepLabel="Phase 3 Step 3 of 6"
      progress={50}
    >
      {loading && <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center"><Loader2 className="h-5 w-5 animate-spin" /> Loading…</div>}

      {!loading && !bpSessionId && (
        <Card className="rounded-2xl border border-border bg-card p-6 space-y-4 max-w-xl">
          <h3 className="font-bold text-sm">Generate your business plan</h3>
          <p className="text-sm text-muted-foreground">We&apos;ll build a nine-section plan from your clarified idea (C-3).</p>
          {startError && <p className="text-sm text-destructive">{startError}</p>}
          <Button onClick={handleStart} disabled={startBp.isPending} className="gap-2">
            {startBp.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />} Generate plan
          </Button>
        </Card>
      )}

      {bpSessionId && session.phase === 'polling' && !rewriting && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 w-full rounded-2xl border border-border bg-card animate-pulse" />)}
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Drafting your plan…</div>
        </div>
      )}

      {bpSessionId && session.phase === 'timedout' && (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <FileWarning className="h-8 w-8 text-warning" />
          <p className="text-sm text-muted-foreground">This is taking longer than expected. The job may still finish.</p>
          <Button variant="outline" onClick={session.retry} className="gap-2"><RotateCw className="h-4 w-4" /> Resume</Button>
        </div>
      )}

      {bpSessionId && session.isError && session.phase !== 'polling' && (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-destructive">The plan failed to load.</p>
          <Button variant="outline" onClick={session.retry} className="gap-2"><RotateCw className="h-4 w-4" /> Retry</Button>
        </div>
      )}

      {showGrid && (
        <div className="space-y-4">
          {sections.map((s) => {
            const isRewriting = rewriting?.sectionId === s.id;
            const saving = editState?.id === s.id && editState.state === 'saving';
            const saved = editState?.id === s.id && editState.state === 'saved';
            const saveError = editState?.id === s.id && editState.state === 'error';
            // Derived (4) sections are computed from another module — not editable here.
            // Section 7 (forecast) gets a forecast-specific hint until a forecast runs.
            const needsForecast = s.id === 'financials' && !cross.hasForecast;
            const derivedHint = needsForecast
              ? 'Run your forecast first — this section is built from it.'
              : `Built automatically from ${s.derivedSource ?? 'another module'}. Update that to change it.`;
            return (
            <Card key={s.id} className="rounded-2xl border border-border bg-card p-5 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-sm">{s.title}</h3>
                  {s.badge && <Badge variant="outline" className="gap-1 text-[10px]"><Sparkles className="h-3 w-3" /> {BADGE_LABEL[s.badge]}</Badge>}
                  {!s.rewritable && (
                    <Badge variant="outline" className="gap-1 text-[10px] text-muted-foreground"><Lock className="h-3 w-3" /> Auto-generated</Badge>
                  )}
                  {s.edited && <Badge variant="outline" className="gap-1 text-[10px]"><Pencil className="h-3 w-3" /> Edited</Badge>}
                </div>
                <div className="flex gap-1.5 shrink-0">
                  {s.rewritable ? (
                    <>
                      <Button variant="ghost" size="sm" className="gap-1" disabled={isRewriting || saving} onClick={() => { setEditing(s.id); setEditDraft(s.body); setEditState(null); }}>
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Button>
                      <Button variant="ghost" size="sm" className="gap-1" disabled={!!rewriting || editing === s.id} onClick={() => handleRewrite(s.id)}>
                        {isRewriting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCw className="h-3.5 w-3.5" />} Rewrite
                      </Button>
                    </>
                  ) : (
                    // Derived: disabled control + teaching hint (the 422 stays the
                    // authoritative guard; this just stops the confused click).
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span tabIndex={0} className="inline-flex">
                          <Button variant="ghost" size="sm" className="gap-1 pointer-events-none text-muted-foreground" disabled>
                            <Lock className="h-3.5 w-3.5" /> {needsForecast ? 'Run forecast first' : 'Auto-generated'}
                          </Button>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[220px]">{derivedHint}</TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>
              {isRewriting ? (
                <div className="space-y-2" aria-busy="true">
                  <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
                  <div className="h-4 w-full rounded bg-muted animate-pulse" />
                  <div className="h-4 w-5/6 rounded bg-muted animate-pulse" />
                  <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Rewriting this section…</div>
                </div>
              ) : editing === s.id ? (
                <div className="space-y-2">
                  <Textarea rows={4} value={editDraft} onChange={(e) => setEditDraft(e.target.value)} className="text-sm" disabled={saving} />
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs">
                      {saving && <span className="flex items-center gap-1 text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> Saving…</span>}
                      {saveError && <span className="text-destructive">{editState?.message}</span>}
                    </span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => { setEditing(null); setEditState(null); }} disabled={saving}>Cancel</Button>
                      <Button size="sm" onClick={() => saveEdit(s.id)} disabled={saving}>Save</Button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.body || <span className="italic">Not generated yet.</span>}</p>
                  {saved && <span className="flex items-center gap-1 text-xs text-success-text"><Check className="h-3 w-3" /> Saved</span>}
                  {saveError && <span className="text-xs text-destructive">{editState?.message}</span>}
                </>
              )}
            </Card>
            );
          })}

          {/* PDF/DOCX export — stub (doc-gen not built this slice). */}
          <div className="flex items-center justify-between border-t border-border pt-6">
            <Button variant="ghost" onClick={() => router.back()}><ArrowLeft className="w-4 h-4 mr-1.5" /> Back</Button>
            <div className="flex gap-2">
              <Button variant="outline" disabled aria-disabled="true" aria-describedby="export-pdf-hint" title="Document export coming soon">Export PDF</Button>
              <span id="export-pdf-hint" className="sr-only">Coming soon — document export isn&apos;t available yet.</span>
              <Button onClick={handleNext} className="gap-1.5">Proceed to Forecast <ArrowRight className="w-4 h-4" /></Button>
            </div>
          </div>
        </div>
      )}
    </Phase3SetupShell>
  );
}
