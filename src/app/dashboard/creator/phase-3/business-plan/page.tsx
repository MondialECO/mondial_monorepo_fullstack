'use client';

import { useState, useEffect, useMemo, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  ArrowLeft,
  ArrowRight,
  Loader2,
  RotateCw,
  AlertTriangle,
  FileWarning,
  Sparkles,
  Pencil,
  Check,
  ExternalLink,
  FileDown,
  Info,
  Layers,
  TrendingUp,
  Users,
  Banknote,
  Activity,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Phase3SetupShell } from '@/components/creator/Phase3SetupShell';
import PlanForecastPrintView from '@/components/creator/PlanForecastPrintView';
import { useCreatorProgress } from '@/providers/CreatorProgressProvider';
import { useAiCredits, useBusinessPlanSessionTimed, useForecastSessionTimed, useStartBusinessPlan } from '@/hooks/queries/creator-ai';
import { creatorJourneyApi } from '@/lib/api-creator-journey';
import { creatorAiApi } from '@/lib/api-creator-ai';
import { hasAiOutput, type BusinessPlanOutput, type ForecastOutput } from '@/types/creator/ai';
import { toAiError, type AiError } from '@/lib/ai-errors';

type SectionOwnershipType = 'owned_editable' | 'external_linked' | 'external_scheduled' | 'owned_full_plan';

interface DisplaySection {
  id: string;
  number: string;
  title: string;
  body: string;
  ownership: SectionOwnershipType;
  rewritable: boolean;
  edited: boolean;
  sourceLabel?: string;
  sourceRoute?: string;
  explanation?: string;
}

// Frontend display-section id → C-3 field (the 5 rewritable/editable sections only).
const FIELD_BY_SECTION: Record<string, string> = {
  executive: 'executiveSummary',
  'target-market': 'marketAnalysis',
  'business-model': 'revenueModel',
  competitive: 'competitorAnalysis',
  gtm: 'goToMarket',
};

function buildSections(
  bp: BusinessPlanOutput | undefined,
  project: { problem: string; solution: string; targetUser: string },
  cross: { hasForecast: boolean; hasGtm: boolean; youNeed: string[]; seedAsk: number | null },
): DisplaySection[] {
  const join = (...xs: (string | undefined)[]) => xs.filter(Boolean).join(' ');
  const isEdited = (sectionId: string) =>
    bp?._sectionMeta?.[FIELD_BY_SECTION[sectionId]]?.status === 'edited';
  const sectionNum = (n: number) => String(n).padStart(2, '0');

  const opsOverview = bp?.operationsPlan?.overview ?? '';
  const risksSummary = bp?.risks?.length
    ? `${bp.risks.length} primary risk factors evaluated with active mitigations.`
    : '';

  return [
    {
      id: 'executive',
      number: sectionNum(1),
      title: 'Executive Summary',
      body: bp?.executiveSummary?.overview ?? '',
      ownership: 'owned_editable',
      rewritable: true,
      edited: isEdited('executive'),
    },
    {
      id: 'problem-solution',
      number: sectionNum(2),
      title: 'Problem & Solution',
      body: project.problem || project.solution ? join(project.problem, '—', project.solution) : '',
      ownership: 'external_linked',
      rewritable: false,
      edited: false,
      sourceLabel: 'Idea Clarifier (Phase 2)',
      sourceRoute: '/dashboard/creator/phase-2/clarifier',
      explanation: 'Authored in the Phase 2 Idea Clarifier. Changes made there automatically synchronize here.',
    },
    {
      id: 'target-market',
      number: sectionNum(3),
      title: 'Target Market',
      body: join(project.targetUser, bp?.marketAnalysis?.overview),
      ownership: 'owned_editable',
      rewritable: true,
      edited: isEdited('target-market'),
    },
    {
      id: 'business-model',
      number: sectionNum(4),
      title: 'Business Model',
      body: bp?.revenueModel?.summary ?? '',
      ownership: 'owned_editable',
      rewritable: true,
      edited: isEdited('business-model'),
    },
    {
      id: 'competitive',
      number: sectionNum(5),
      title: 'Competitive Landscape',
      body: bp?.competitorAnalysis?.overview ?? '',
      ownership: 'owned_editable',
      rewritable: true,
      edited: isEdited('competitive'),
    },
    {
      id: 'gtm',
      number: sectionNum(6),
      title: 'Go-to-Market',
      body: bp?.goToMarket?.strategy ?? '',
      ownership: 'owned_editable',
      rewritable: true,
      edited: isEdited('gtm'),
    },
    {
      id: 'financials',
      number: sectionNum(7),
      title: 'Financial Projections',
      body: cross.hasForecast
        ? 'Bound to your live multi-year financial model — revenue growth, fixed/variable cost structures, and break-even milestones.'
        : 'Your financial forecast (Step 3.4) models dynamic revenue and cost trajectories.',
      ownership: 'external_linked',
      rewritable: false,
      edited: false,
      sourceLabel: 'Financial Forecast (Step 3.4)',
      sourceRoute: cross.hasForecast
        ? '/dashboard/creator/phase-3/forecast'
        : '/dashboard/creator/phase-3/forecast-inputs',
      explanation: 'Calculated by the financial forecast engine in Step 3.4. Edit assumptions there to update.',
    },
    {
      id: 'team',
      number: sectionNum(8),
      title: 'Team Needs & Structure',
      body: cross.youNeed.length
        ? `Identified key hiring requirements: ${cross.youNeed.join(', ')}.`
        : 'Team capability and co-founder/executive requirements derived from your venture profile.',
      ownership: 'external_linked',
      rewritable: false,
      edited: false,
      sourceLabel: 'Company Formation (Step 3.6)',
      sourceRoute: '/dashboard/creator/phase-3/formation',
      explanation: 'Derived from your skills evaluation and legal entity structure in Step 3.6.',
    },
    {
      id: 'funding',
      number: sectionNum(9),
      title: 'Funding Requirements',
      body: cross.seedAsk
        ? `Target seed round ask: €${cross.seedAsk.toLocaleString()}.`
        : 'Target seed funding requirements and valuation parameters are established during Phase 5.',
      ownership: 'external_scheduled',
      rewritable: false,
      edited: false,
      sourceLabel: 'Phase 5 (Seed Funding)',
      explanation: 'This figure is set during Phase 5 (Seed Funding) and will appear here once you reach that step.',
    },
    {
      id: 'operations',
      number: sectionNum(10),
      title: 'Operations & Milestones',
      body: opsOverview,
      ownership: 'owned_full_plan',
      rewritable: false,
      edited: false,
      sourceLabel: 'Full Plan Synthesis',
      explanation: 'This section is produced as part of the full business plan synthesis and updates whenever the plan is regenerated.',
    },
    {
      id: 'risks',
      number: sectionNum(11),
      title: 'Risk Register & Mitigations',
      body: risksSummary,
      ownership: 'owned_full_plan',
      rewritable: false,
      edited: false,
      sourceLabel: 'Full Plan Synthesis',
      explanation: 'This section is produced as part of the full business plan synthesis and updates whenever the plan is regenerated.',
    },
  ];
}

function friendlyError(e: unknown, fallback: string): string {
  const res = (e as { response?: { status?: number; data?: { message?: string } } } | undefined)?.response;
  if (res?.status === 422 && res.data?.message === 'section_not_editable') {
    return 'This section is auto-generated from another module — update its source to change it.';
  }
  return e instanceof Error ? e.message : fallback;
}

const has = (s?: string | null): s is string => !!s && s.trim().length > 0;
const arr2 = <T,>(a?: T[] | null): a is T[] => Array.isArray(a) && a.length > 0;

function Extras({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5 pt-1">
      <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground font-sans">{label}</h4>
      {children}
    </div>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="list-disc pl-5 text-sm text-muted-foreground leading-relaxed space-y-1 font-sans">
      {items.map((x, i) => (
        <li key={i}>{x}</li>
      ))}
    </ul>
  );
}

function SectionExtras({ id, bp }: { id: string; bp?: BusinessPlanOutput }) {
  if (!bp) return null;
  const blocks: ReactNode[] = [];
  const es = bp.executiveSummary;
  const ma = bp.marketAnalysis;
  const ca = bp.competitorAnalysis;
  const rm = bp.revenueModel;
  const gtm = bp.goToMarket;
  const ops = bp.operationsPlan;
  const risks = bp.risks;

  if (id === 'executive') {
    if (has(es?.valueProposition)) {
      blocks.push(
        <Extras key="vp" label="Value Proposition">
          <p className="text-sm text-foreground/90 leading-relaxed font-sans">{es!.valueProposition}</p>
        </Extras>,
      );
    }
    if (arr2(es?.highlights)) {
      blocks.push(
        <Extras key="hl" label="Core Highlights">
          <Bullets items={es!.highlights!} />
        </Extras>,
      );
    }
  } else if (id === 'target-market') {
    if (arr2(ma?.targetSegments)) {
      blocks.push(
        <Extras key="seg" label="Target Customer Segments">
          <Bullets items={ma!.targetSegments!} />
        </Extras>,
      );
    }
    if (has(ma?.marketSizeQualitative)) {
      blocks.push(
        <Extras key="size" label="Market Scope & Dynamics">
          <p className="text-sm text-foreground/90 leading-relaxed font-sans">{ma!.marketSizeQualitative}</p>
        </Extras>,
      );
    }
    if (arr2(ma?.trends)) {
      blocks.push(
        <Extras key="tr" label="Key Sector Trends">
          <Bullets items={ma!.trends!} />
        </Extras>,
      );
    }
  } else if (id === 'business-model') {
    if (arr2(rm?.revenueStreams)) {
      blocks.push(
        <Extras key="rs" label="Revenue Streams">
          <Bullets
            items={rm!.revenueStreams!.map((s) => [s.name, s.description].filter(Boolean).join(' — '))}
          />
        </Extras>,
      );
    }
    if (has(rm?.pricingStrategy)) {
      blocks.push(
        <Extras key="ps" label="Pricing Architecture">
          <p className="text-sm text-foreground/90 leading-relaxed font-sans">{rm!.pricingStrategy}</p>
        </Extras>,
      );
    }
    if (arr2(rm?.keyMetrics)) {
      blocks.push(
        <Extras key="km" label="Monitored Unit Economics & Metrics">
          <Bullets items={rm!.keyMetrics!} />
        </Extras>,
      );
    }
  } else if (id === 'competitive') {
    if (arr2(ca?.competitors)) {
      blocks.push(
        <Extras key="cmp" label="Direct & Indirect Competitor Matrix">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
            {ca!.competitors!.map((c, i) => (
              <div key={i} className="rounded-xl border border-border bg-card/60 p-3.5 space-y-1.5 shadow-sm">
                <div className="text-sm font-semibold text-foreground flex items-center justify-between">
                  <span>{c.name ?? 'Competitor'}</span>
                  {has(c.positioning) && (
                    <Badge variant="secondary" className="text-[10px] font-normal">
                      {c.positioning}
                    </Badge>
                  )}
                </div>
                {arr2(c.strengths) && (
                  <div className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground/80">Strengths:</span> {c.strengths!.join(', ')}
                  </div>
                )}
                {arr2(c.weaknesses) && (
                  <div className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground/80">Weaknesses:</span> {c.weaknesses!.join(', ')}
                  </div>
                )}
                {has(c.ourAdvantage) && (
                  <div className="text-xs text-primary font-medium pt-0.5">
                    <span className="font-semibold text-foreground/80">Our Edge:</span> {c.ourAdvantage}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Extras>,
      );
    }
  } else if (id === 'gtm') {
    if (arr2(gtm?.channels)) {
      blocks.push(
        <Extras key="ch" label="Distribution & Acquisition Channels">
          <Bullets items={gtm!.channels!} />
        </Extras>,
      );
    }
    if (arr2(gtm?.phases)) {
      blocks.push(
        <Extras key="ph" label="Rollout Phases">
          <Bullets
            items={gtm!.phases!.map((p) => [p.name, p.description].filter(Boolean).join(' — '))}
          />
        </Extras>,
      );
    }
  } else if (id === 'operations') {
    if (arr2(ops?.keyActivities)) {
      blocks.push(
        <Extras key="ops-act" label="Key Operational Activities">
          <Bullets items={ops!.keyActivities!} />
        </Extras>,
      );
    }
    if (arr2(ops?.resources)) {
      blocks.push(
        <Extras key="ops-res" label="Critical Resources">
          <Bullets items={ops!.resources!} />
        </Extras>,
      );
    }
    if (arr2(ops?.milestones)) {
      blocks.push(
        <Extras key="ops-ms" label="Target Milestones">
          <div className="space-y-2 mt-1">
            {ops!.milestones!.map((m, i) => (
              <div key={i} className="flex items-start gap-2.5 rounded-lg border border-border bg-card/40 p-2.5 text-xs font-sans">
                <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 font-mono text-[10px] font-bold">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-foreground flex items-center justify-between">
                    <span>{m.title ?? 'Milestone'}</span>
                    {has(m.timeframe) && <span className="text-muted-foreground font-mono">{m.timeframe}</span>}
                  </div>
                  {has(m.description) && <p className="text-muted-foreground mt-0.5">{m.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </Extras>,
      );
    }
  } else if (id === 'risks') {
    if (arr2(risks)) {
      blocks.push(
        <Extras key="risk-grid" label="Evaluated Risk Matrix & Mitigation Strategy">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
            {risks!.map((r, i) => (
              <div key={i} className="rounded-xl border border-border bg-card/60 p-3.5 space-y-1.5 shadow-sm font-sans">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px] font-semibold uppercase tracking-wider">
                    {r.category ?? 'Risk'}
                  </Badge>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
                    {has(r.likelihood) && <span>Likelihood: <strong className="text-foreground">{r.likelihood}</strong></span>}
                    {has(r.impact) && <span>• Impact: <strong className="text-foreground">{r.impact}</strong></span>}
                  </div>
                </div>
                {has(r.description) && (
                  <p className="text-xs text-foreground/90 font-medium">{r.description}</p>
                )}
                {has(r.mitigation) && (
                  <div className="text-xs text-muted-foreground bg-muted/30 rounded p-2 mt-1">
                    <span className="font-semibold text-foreground/80">Mitigation:</span> {r.mitigation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Extras>,
      );
    }
  }

  if (blocks.length === 0) return null;
  return <div className="mt-4 space-y-3.5 border-t border-border/60 pt-3.5">{blocks}</div>;
}

export default function BusinessPlanPage() {
  const router = useRouter();
  const { completeStep } = useCreatorProgress();

  const [loading, setLoading] = useState(true);
  const [bpSessionId, setBpSessionId] = useState<string | null>(null);
  const [forecastSessionId, setForecastSessionId] = useState<string | null>(null);
  const [clarifierSessionId, setClarifierSessionId] = useState<string | null>(null);
  const [project, setProject] = useState({ name: '', problem: '', solution: '', targetUser: '' });
  const [showExport, setShowExport] = useState(false);
  const [cross, setCross] = useState({ hasForecast: false, hasGtm: false, youNeed: [] as string[], seedAsk: null as number | null });
  const [startError, setStartError] = useState<AiError | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string>('executive');

  const [rewriting, setRewriting] = useState<{ sectionId: string; baseVersion: number } | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [editState, setEditState] = useState<{ id: string; state: 'saving' | 'saved' | 'error'; message?: string } | null>(null);

  const startBp = useStartBusinessPlan();
  const credits = useAiCredits();
  const planCost = credits.data?.costs?.BusinessPlan ?? 0;
  const insufficientCredits = credits.data ? credits.data.balance < planCost : false;
  const session = useBusinessPlanSessionTimed(bpSessionId);
  const forecastSession = useForecastSessionTimed(forecastSessionId);
  const forecastOutput = (forecastSession.data as { output?: ForecastOutput } | undefined)?.output ?? null;
  const currentVersion = (session.data as { currentVersion?: number } | undefined)?.currentVersion ?? 0;

  useEffect(() => {
    if (rewriting && currentVersion > rewriting.baseVersion) setRewriting(null);
  }, [currentVersion, rewriting]);

  useEffect(() => {
    if (rewriting && session.phase === 'terminal' && currentVersion <= rewriting.baseVersion) {
      setRewriting(null);
      setStartError({ kind: 'other', message: 'The section rewrite didn’t complete — your plan is unchanged. You can try again.' });
    }
  }, [session.phase, currentVersion, rewriting]);

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
        setForecastSessionId(p3?.forecastSessionId ?? null);
        setClarifierSessionId(p3?.clarifierSessionId ?? p2?.clarifierSessionId ?? null);
        setProject({
          name: journey.project?.name ?? '',
          problem: journey.project?.problem ?? '',
          solution: journey.project?.solution ?? '',
          targetUser: journey.project?.targetUser ?? '',
        });
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

  // Track active section via scroll listener
  useEffect(() => {
    const handleScroll = () => {
      const sectionElements = document.querySelectorAll<HTMLElement>('[data-section-anchor]');
      const scrollPos = window.scrollY + 200;
      sectionElements.forEach((el) => {
        const top = el.offsetTop;
        const height = el.offsetHeight;
        const id = el.getAttribute('data-section-anchor');
        if (id && scrollPos >= top && scrollPos < top + height) {
          setActiveSectionId(id);
        }
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const bpOutput = (session.data as { output?: BusinessPlanOutput } | undefined)?.output;
  const completed = session.phase === 'terminal' && hasAiOutput((session.data as { status?: import('@/types/creator/ai').AiSessionStatus })?.status) && !!bpOutput;
  const showDocument = completed || (!!rewriting && !!bpOutput);

  const bpError = (session.data as { error?: string | null } | undefined)?.error ?? null;
  const terminalFailed = !!bpSessionId && session.phase === 'terminal' && !completed && !rewriting;
  const failedIsProviderBilling = /openrouter error \(402\)/i.test(bpError ?? '');
  const failedIsCredits = !failedIsProviderBilling && /402|credit|insufficient|payment/i.test(bpError ?? '');

  const sections = useMemo(
    () => buildSections(bpOutput, project, cross),
    [bpOutput, project, cross],
  );

  const handleStart = async () => {
    setStartError(null);
    if (!clarifierSessionId) {
      setStartError({ kind: 'other', message: 'Complete the Idea Clarifier first — the plan builds on it.' });
      return;
    }
    try {
      const res = await startBp.mutateAsync({ clarifierSessionId });
      await creatorJourneyApi.setPhase3Session('businessPlan', res.sessionId);
      setBpSessionId(res.sessionId);
    } catch (e) {
      setStartError(toAiError(e, 'Could not start the business plan.'));
    }
  };

  const handleRewrite = async (sectionId: string) => {
    if (!bpSessionId || rewriting) return;
    setStartError(null);
    setRewriting({ sectionId, baseVersion: currentVersion });
    try {
      await creatorAiApi.rewriteSection(bpSessionId, sectionId);
      session.retry();
    } catch (e) {
      setStartError({ kind: 'other', message: friendlyError(e, 'Rewrite failed.') });
      setRewriting(null);
    }
  };

  const saveEdit = async (sectionId: string) => {
    if (!bpSessionId) return;
    setEditState({ id: sectionId, state: 'saving' });
    try {
      await creatorAiApi.editSection(bpSessionId, sectionId, editDraft);
      session.retry();
      setEditing(null);
      setEditState({ id: sectionId, state: 'saved' });
    } catch (e) {
      setEditState({ id: sectionId, state: 'error', message: friendlyError(e, 'Save failed.') });
    }
  };

  const scrollToSection = (id: string) => {
    setActiveSectionId(id);
    const element = document.getElementById(`doc-section-${id}`);
    if (element) {
      const yOffset = -90;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const handleNext = () => {
    completeStep(3, 3);
    router.push(cross.hasForecast
      ? '/dashboard/creator/phase-3/forecast'
      : '/dashboard/creator/phase-3/forecast-inputs');
  };

  return (
    <>
      <PlanForecastPrintView
        open={showExport}
        onClose={() => setShowExport(false)}
        projectName={project.name}
        project={project}
        plan={bpOutput}
        forecast={forecastOutput}
        cross={{ youNeed: cross.youNeed, seedAsk: cross.seedAsk }}
      />
      <Phase3SetupShell
        fullWidth
        stepEyebrow="Step 3.3"
        title="AI Business Plan"
        description="Your comprehensive 11-section business plan. Edit owned sections directly or navigate to authoritative source modules."
      >
        {loading && (
          <div className="flex items-center gap-2 text-muted-foreground py-16 justify-center">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading business plan…
          </div>
        )}

        {!loading && !bpSessionId && (
          <Card className="rounded-2xl border border-border bg-card p-6 space-y-4 max-w-xl mx-auto shadow-sm">
            <h3 className="font-bold text-base font-sans">
              {startError?.kind === 'credits'
                ? "You've used all your AI credits"
                : 'Generate your business plan'}
            </h3>
            <p className="text-sm text-muted-foreground font-sans leading-relaxed">
              {startError?.kind === 'credits'
                ? "You've used all your AI credits."
                : 'We will synthesize an 11-section investor-ready document from your clarified idea and venture core.'}
            </p>
            {startError && startError.kind !== 'credits' && (
              <div className="space-y-2">
                <p className="text-sm text-destructive">{startError.message}</p>
                {(startError.kind === 'service' || startError.kind === 'rateLimited') && (
                  <Button variant="outline" size="sm" onClick={handleStart} disabled={startBp.isPending} className="gap-1.5">
                    <RotateCw className="h-3.5 w-3.5" /> Try again
                  </Button>
                )}
              </div>
            )}
            <div className="flex items-center justify-between border-t border-border pt-4 mt-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard/creator/phase-3/business-model')}
                className="text-xs font-bold text-muted-foreground font-sans"
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Business Model
              </Button>
              <Button
                onClick={handleStart}
                disabled={startBp.isPending || startError?.kind === 'credits' || insufficientCredits}
                className="gap-2 font-sans font-semibold"
              >
                {startBp.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                Generate plan{planCost > 0 ? ` (${planCost} credits)` : ''}
              </Button>
            </div>
            {insufficientCredits && (
              <p className="text-xs font-medium text-destructive">
                Insufficient credits: requires {planCost} credits (you have {credits.data?.balance ?? 0}).
              </p>
            )}
          </Card>
        )}

        {bpSessionId && session.phase === 'polling' && !rewriting && (
          <div className="space-y-4 max-w-4xl mx-auto py-8">
            <div className="flex items-center justify-center gap-3 text-sm font-medium text-foreground py-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              Synthesizing 11-section business plan across market, operations, and financials…
            </div>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 w-full rounded-2xl border border-border bg-card/60 animate-pulse" />
            ))}
          </div>
        )}

        {bpSessionId && session.phase === 'timedout' && (
          <div className="flex flex-col items-center gap-3 py-16 text-center max-w-md mx-auto">
            <FileWarning className="h-10 w-10 text-warning" />
            <h3 className="font-bold text-base">Generation timed out</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This generation is taking longer than expected. The job may still finish in the background.
            </p>
            <Button variant="outline" onClick={session.retry} className="gap-2 mt-2">
              <RotateCw className="h-4 w-4" /> Check Status
            </Button>
          </div>
        )}

        {bpSessionId && session.isError && session.phase !== 'polling' && (
          <div className="flex flex-col items-center gap-3 py-16 text-center max-w-md mx-auto">
            <AlertTriangle className="h-10 w-10 text-destructive" />
            <h3 className="font-bold text-base text-destructive">Unable to load business plan</h3>
            <p className="text-sm text-muted-foreground">An error occurred while retrieving the session data.</p>
            <Button variant="outline" onClick={session.retry} className="gap-2 mt-2">
              <RotateCw className="h-4 w-4" /> Retry
            </Button>
          </div>
        )}

        {terminalFailed && (
          <Card className="rounded-2xl border border-border bg-card p-6 space-y-4 max-w-xl mx-auto shadow-sm">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <h3 className="font-bold text-base font-sans">
                {startError?.kind === 'credits' || failedIsCredits
                  ? "You've used all your AI credits"
                  : 'We couldn’t generate your business plan'}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground font-sans leading-relaxed">
              {startError?.kind === 'credits' || failedIsCredits
                ? "You've used all your AI credits."
                : failedIsProviderBilling
                ? 'The AI service is temporarily unavailable on our side. Your credits have been safeguarded — please try again shortly.'
                : 'The AI service was temporarily unavailable (provider rate limit or timeout). Please try generating again.'}
            </p>
            {startError && startError.kind !== 'credits' && (
              <div className="space-y-1">
                <p className="text-sm text-destructive">{startError.message}</p>
              </div>
            )}
            <Button
              onClick={handleStart}
              disabled={startBp.isPending || startError?.kind === 'credits' || failedIsCredits}
              className="gap-2 font-sans font-semibold"
            >
              {startBp.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCw className="h-4 w-4" />} Generate again
            </Button>
          </Card>
        )}

        {showDocument && (
          <div className="space-y-6">
            {/* Header Document Controls Card */}
            <Card className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5 flex-1">
                  <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="font-bold text-base sm:text-lg text-foreground font-sans">
                      {project.name || 'Venture'} — Comprehensive Business Plan
                    </h2>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap font-sans">
                      <span className="font-mono text-foreground/80 font-medium">Version {currentVersion || 1}</span>
                      <span>•</span>
                      <span>11 Continuous Sections</span>
                      <span>•</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                        <Check className="h-3.5 w-3.5" /> Investor Document Format
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <Button
                    variant="outline"
                    onClick={() => setShowExport(true)}
                    className="gap-2 font-sans text-xs font-semibold rounded-xl"
                  >
                    <FileDown className="h-4 w-4" /> Export Document (PDF)
                  </Button>
                </div>
              </div>
            </Card>

            {/* Main Document Layout: Sticky Sidebar Index + Continuous Document Canvas */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Sticky Sidebar Index */}
              <aside className="hidden lg:block lg:col-span-4 sticky top-24 space-y-3">
                <Card className="rounded-2xl border border-border bg-card/90 backdrop-blur p-4 shadow-sm">
                  <div className="flex items-center justify-between pb-3 mb-2 border-b border-border/70">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-sans flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5" /> Document Index
                    </h3>
                    <span className="text-[11px] font-mono text-muted-foreground">11 Sections</span>
                  </div>
                  <nav className="space-y-1">
                    {sections.map((s) => {
                      const isActive = activeSectionId === s.id;
                      return (
                        <button
                          key={s.id}
                          onClick={() => scrollToSection(s.id)}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between group ${
                            isActive
                              ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className={`font-mono text-[11px] ${isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                              {s.number}
                            </span>
                            <span className="truncate">{s.title}</span>
                          </div>
                          {s.ownership === 'external_linked' && (
                            <ExternalLink className={`h-3 w-3 shrink-0 opacity-60 ${isActive ? 'text-primary-foreground' : ''}`} />
                          )}
                          {s.edited && (
                            <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-primary-foreground' : 'bg-primary'} shrink-0`} />
                          )}
                        </button>
                      );
                    })}
                  </nav>
                </Card>
              </aside>

              {/* Continuous Document Canvas */}
              <main className="lg:col-span-8 space-y-6">
                {startError && (
                  <div className="p-3.5 rounded-xl bg-destructive/10 text-destructive text-sm border border-destructive/20 font-sans">
                    {startError.message}
                  </div>
                )}

                <Card className="rounded-2xl border border-border bg-card shadow-sm p-6 sm:p-8 space-y-10">
                  {sections.map((s, idx) => {
                    const isRewriting = rewriting?.sectionId === s.id;
                    const isEditing = editing === s.id;
                    const saving = editState?.id === s.id && editState.state === 'saving';
                    const saved = editState?.id === s.id && editState.state === 'saved';
                    const saveError = editState?.id === s.id && editState.state === 'error';

                    return (
                      <section
                        key={s.id}
                        id={`doc-section-${s.id}`}
                        data-section-anchor={s.id}
                        className={`space-y-3.5 scroll-mt-24 ${idx > 0 ? 'pt-8 border-t border-border/60' : ''}`}
                      >
                        {/* Section Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="font-mono text-xs font-bold text-primary px-2 py-0.5 rounded bg-primary/10">
                              {s.number}
                            </span>
                            <h3 className="font-bold text-base sm:text-lg text-foreground font-sans tracking-tight">
                              {s.title}
                            </h3>
                            {s.ownership === 'owned_editable' && (
                              <Badge variant="outline" className="text-[10px] font-sans font-medium text-muted-foreground">
                                Direct Editable
                              </Badge>
                            )}
                            {s.ownership === 'external_linked' && (
                              <Badge variant="secondary" className="text-[10px] font-sans font-medium gap-1 text-primary">
                                <ExternalLink className="h-2.5 w-2.5" /> {s.sourceLabel}
                              </Badge>
                            )}
                            {s.ownership === 'external_scheduled' && (
                              <Badge variant="outline" className="text-[10px] font-sans font-medium text-amber-600 dark:text-amber-400 border-amber-500/30">
                                Phase 5 Scope
                              </Badge>
                            )}
                            {s.ownership === 'owned_full_plan' && (
                              <Badge variant="outline" className="text-[10px] font-sans font-medium text-muted-foreground">
                                Full Plan Synthesis
                              </Badge>
                            )}
                            {s.edited && (
                              <Badge variant="outline" className="text-[10px] font-sans font-medium gap-1 border-primary/40 text-primary">
                                <Pencil className="h-2.5 w-2.5" /> User Edited
                              </Badge>
                            )}
                          </div>

                          {/* Section Action Controls */}
                          <div className="flex items-center gap-2 shrink-0">
                            {s.ownership === 'owned_editable' && !isEditing && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={isRewriting || saving}
                                  onClick={() => {
                                    setEditing(s.id);
                                    setEditDraft(s.body);
                                    setEditState(null);
                                  }}
                                  className="h-8 text-xs gap-1.5 font-sans font-medium text-muted-foreground hover:text-foreground"
                                >
                                  <Pencil className="h-3.5 w-3.5" /> Edit
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={isRewriting || saving}
                                  onClick={() => handleRewrite(s.id)}
                                  className="h-8 text-xs gap-1.5 font-sans font-medium text-primary hover:text-primary/90"
                                >
                                  <Sparkles className="h-3.5 w-3.5" /> AI Rewrite
                                </Button>
                              </>
                            )}

                            {s.ownership === 'external_linked' && s.sourceRoute && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(s.sourceRoute!)}
                                className="h-8 text-xs gap-1.5 font-sans font-medium text-muted-foreground hover:text-foreground rounded-lg"
                              >
                                Edit at Source <ChevronRight className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Section Content Rendering */}
                        {isRewriting ? (
                          <div className="space-y-2 py-3" aria-busy="true">
                            <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
                            <div className="h-4 w-full rounded bg-muted animate-pulse" />
                            <div className="h-4 w-5/6 rounded bg-muted animate-pulse" />
                            <div className="flex items-center gap-2 text-xs text-primary font-medium pt-1">
                              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Rewriting {s.title} with AI…
                            </div>
                          </div>
                        ) : isEditing ? (
                          <div className="space-y-2.5 pt-1">
                            <Textarea
                              rows={5}
                              value={editDraft}
                              onChange={(e) => setEditDraft(e.target.value)}
                              className="text-sm font-sans leading-relaxed resize-y focus-visible:ring-1"
                              disabled={saving}
                              placeholder={`Enter updated ${s.title.toLowerCase()} content…`}
                            />
                            <div className="flex items-center justify-between gap-2">
                              <div className="text-xs">
                                {saving && (
                                  <span className="flex items-center gap-1.5 text-muted-foreground">
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving changes…
                                  </span>
                                )}
                                {saveError && <span className="text-destructive font-medium">{editState?.message}</span>}
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditing(null);
                                    setEditState(null);
                                  }}
                                  disabled={saving}
                                  className="text-xs"
                                >
                                  Cancel
                                </Button>
                                <Button size="sm" onClick={() => saveEdit(s.id)} disabled={saving} className="text-xs font-semibold">
                                  Save Section
                                </Button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2.5">
                            {s.body ? (
                              <p className="text-sm text-foreground/90 leading-relaxed font-sans whitespace-pre-line">
                                {s.body}
                              </p>
                            ) : (
                              <p className="text-sm text-muted-foreground italic font-sans">
                                Content not generated yet.
                              </p>
                            )}

                            {/* Section Explanatory Note for External & Scheduled Sections */}
                            {s.explanation && (
                              <div className="flex items-start gap-2 rounded-xl bg-muted/40 border border-border/50 p-3 text-xs text-muted-foreground font-sans mt-2">
                                <Info className="h-4 w-4 shrink-0 text-muted-foreground/80 mt-0.5" />
                                <span>{s.explanation}</span>
                              </div>
                            )}

                            {/* Render Detailed Structured Sub-Arrays & Appendices */}
                            <SectionExtras id={s.id} bp={bpOutput} />

                            {saved && (
                              <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                <Check className="h-3.5 w-3.5" /> Section saved successfully
                              </span>
                            )}
                            {saveError && <span className="text-xs text-destructive font-medium">{editState?.message}</span>}
                          </div>
                        )}
                      </section>
                    );
                  })}
                </Card>

                {/* Bottom Stepper Navigation */}
                <div className="flex items-center justify-between border-t border-border pt-6 mt-8">
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={() => router.push('/dashboard/creator/phase-3/business-model')}
                    className="font-sans font-semibold gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back to Business Model
                  </Button>
                  <Button onClick={handleNext} size="lg" className="gap-2 font-sans font-semibold">
                    Proceed to Financial Forecast <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </main>
            </div>
          </div>
        )}
      </Phase3SetupShell>
    </>
  );
}
