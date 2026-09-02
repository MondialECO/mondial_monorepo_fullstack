'use client';

/**
 * Entrepreneur Dashboard Overview (main /dashboard/entrepreneur).
 *
 * Figma: node 21509:39132. This screen is wired entirely to real backend data
 * via `entrepreneurApi` — NO mock data, NO hardcoded metrics. Each widget
 * degrades to an empty/skeleton state when its source returns nothing.
 *
 * Data sources (all real, typed):
 *  - Trust score / progress / phase ........ getCurrentPhase()  (CompanyProgressResponse)
 *  - Estimated valuation / growth .......... getFinancialSummary()
 *  - Target raised / capital allocation .... getFundingProfile()
 *  - Investor matches ...................... getMatchingInsights()
 *  - Committed funds / deal metrics ........ getCompanyDeals()
 *  - AI mentor suggestions ................. getRecommendations()
 *  - Activity feed ......................... getDataRoomActivityTimeline()
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  CheckCircle2,
  Clock,
  Compass,
  FileText,
  FolderOpen,
  Handshake,
  Lightbulb,
  Lock,
  PieChart,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/app/_providers/AuthProvider';
import { useEntrepreneurProgress } from '@/providers/EntrepreneurProgressProvider';
import {
  entrepreneurApi,
  type CompanyProgressResponse,
  type FinancialSummaryResponse,
  type FundingProfileResponse,
  type MatchingInsightsResponse,
  type DealStatusResponse,
  type RecommendationDto,
  type Phase6AccessLogResponse,
} from '@/lib/api-entrepreneur';

// ---- Static phase config (labels only — no metrics/fake values) -------------
type PhaseDef = { phase: number; title: string; description: string; icon: typeof FileText; href: string };

const PHASES: PhaseDef[] = [
  { phase: 1, title: 'Identity & Onboarding', description: 'KYC and verification', icon: FileText, href: '/dashboard/entrepreneur/phase-1' },
  { phase: 2, title: 'Company Verification', description: 'Legal, documents, ownership', icon: Briefcase, href: '/dashboard/entrepreneur/phase-2' },
  { phase: 3, title: 'Financial Verification & Tracking', description: 'Revenue, valuation, KPIs', icon: BarChart3, href: '/dashboard/entrepreneur/phase-3' },
  { phase: 4, title: 'Equity & Cap Table', description: 'Cap table, ESOP, dilution', icon: PieChart, href: '/dashboard/entrepreneur/phase-4' },
  { phase: 5, title: 'Funding Ask', description: 'Funding request and pitch', icon: TrendingUp, href: '/dashboard/entrepreneur/phase-5' },
  { phase: 6, title: 'Data Room', description: 'Secure document vault', icon: FolderOpen, href: '/dashboard/entrepreneur/phase-6' },
  { phase: 7, title: 'AI Expert Review', description: 'Investor-readiness review', icon: Sparkles, href: '/dashboard/entrepreneur/phase-7' },
  { phase: 8, title: 'Investor Matching', description: 'Matches and outreach', icon: Handshake, href: '/dashboard/entrepreneur/phase-8' },
  { phase: 9, title: 'Deal Execution', description: 'Term sheets and close', icon: Users, href: '/dashboard/entrepreneur/deals' },
];

const TOTAL_PHASES = PHASES.length;

// ---- formatters -------------------------------------------------------------
const eur = (n: number) =>
  new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', notation: 'compact', maximumFractionDigits: 1 }).format(n || 0);

const dateShort = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

// ---- small presentational pieces (kept in-file to avoid new import paths) ---
function StatCard({
  label, value, hint, icon: Icon,
}: { label: string; value: string; hint?: string; icon: typeof FileText }) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 p-5">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="text-4xl font-bold leading-none text-foreground">{value}</p>
          {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        <span className="rounded-lg bg-primary/10 p-2.5 text-primary">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
      </CardContent>
    </Card>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return <p className="py-6 text-center text-sm text-muted-foreground">{children}</p>;
}

function priorityVariant(p: RecommendationDto['priority']): 'destructive' | 'default' | 'secondary' {
  return p === 'high' ? 'destructive' : p === 'medium' ? 'default' : 'secondary';
}

// Circular progress ring (Figma hero) — real percent in, theme tokens only.
function ProgressRing({ percent, label, sublabel }: { percent: number; label: string; sublabel?: string }) {
  const R = 36;
  const C = 2 * Math.PI * R;
  const pct = Math.max(0, Math.min(100, Math.round(percent || 0)));
  const offset = C - (pct / 100) * C;
  return (
    <div
      className="relative h-28 w-28 shrink-0"
      role="progressbar"
      aria-label={label}
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <svg viewBox="0 0 100 100" className="h-28 w-28 -rotate-90">
        <circle cx="50" cy="50" r={R} fill="none" strokeWidth="9" stroke="currentColor" className="text-muted" />
        <circle
          cx="50"
          cy="50"
          r={R}
          fill="none"
          strokeWidth="9"
          strokeLinecap="round"
          stroke="currentColor"
          className="text-primary transition-[stroke-dashoffset] duration-700"
          strokeDasharray={C}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-foreground">{pct}%</span>
        {sublabel ? <span className="text-[11px] text-muted-foreground">{sublabel}</span> : null}
      </div>
    </div>
  );
}

// ---- main -------------------------------------------------------------------
export default function EntrepreneurOverview() {
  const { user } = useAuth();
  const { activeCompanyId, isSwitching, isLoading: isProgressLoading } = useEntrepreneurProgress();
  const [loading, setLoading] = useState(true);
  const [noCompany, setNoCompany] = useState(false);
  const [progress, setProgress] = useState<CompanyProgressResponse | null>(null);
  const [financial, setFinancial] = useState<FinancialSummaryResponse | null>(null);
  const [funding, setFunding] = useState<FundingProfileResponse | null>(null);
  const [matches, setMatches] = useState<MatchingInsightsResponse | null>(null);
  const [deals, setDeals] = useState<DealStatusResponse[]>([]);
  const [recs, setRecs] = useState<RecommendationDto[]>([]);
  const [activity, setActivity] = useState<Phase6AccessLogResponse[]>([]);

  useEffect(() => {
    let active = true;

    // Reset previous company data to prevent stale flash
    setLoading(true);
    setProgress(null);
    setFinancial(null);
    setFunding(null);
    setMatches(null);
    setDeals([]);
    setRecs([]);
    setActivity([]);
    setNoCompany(false);

    (async () => {
      let prog: CompanyProgressResponse;
      try {
        prog = await entrepreneurApi.getCurrentPhase(activeCompanyId || undefined);
      } catch {
        if (active) { setNoCompany(true); setLoading(false); }
        return;
      }
      if (!active) return;
      if (!prog?.companyId) {
        setNoCompany(true);
        setLoading(false);
        return;
      }
      setProgress(prog);
      const id = prog.companyId;

      // Fetch each widget's data independently; one failure must not blank the page.
      const settle = <T,>(p: Promise<T>, set: (v: T) => void) =>
        p.then((v) => { if (active) set(v); }).catch(() => { /* widget shows empty state */ });

      await Promise.allSettled([
        settle(entrepreneurApi.getFinancialSummary(id), setFinancial),
        settle(entrepreneurApi.getFundingProfile(id), setFunding),
        settle(entrepreneurApi.getMatchingInsights(id), setMatches),
        settle(entrepreneurApi.getCompanyDeals(id), setDeals),
        settle(entrepreneurApi.getRecommendations(id), setRecs),
        settle(entrepreneurApi.getDataRoomActivityTimeline(id), setActivity),
      ]);
      if (active) setLoading(false);
    })();

    return () => { active = false; };
  }, [activeCompanyId]);

  const isViewLoading = loading || isSwitching || isProgressLoading;

  // ---- derived (real data only) ----
  const committed = deals.reduce(
    (sum, d) => sum + (d.investors?.reduce((s, i) => s + (i.committedAmount || 0), 0) ?? 0),
    0,
  );
  const target = funding?.fundingAskAmount ?? 0;
  const fundingPct = target > 0 ? Math.min(100, Math.round((committed / target) * 100)) : 0;
  const activePhase = PHASES.find((p) => p.phase === progress?.currentPhase) ?? PHASES[0];

  // ---- no-company / onboarding state ----
  if (noCompany) {
    const isUniversalVerified = (user?.onboardingPhase ?? 0) >= 1;

    return (
      <div className="mx-auto w-full max-w-7xl">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="gap-2">
            <CardTitle className="text-2xl">
              {isUniversalVerified ? 'Continue your entrepreneur journey' : 'Start your entrepreneur journey'}
            </CardTitle>
            <CardDescription>
              {isUniversalVerified
                ? 'Complete your company verification to continue building your business.'
                : 'Complete your identity verification to continue.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              {isUniversalVerified ? (
                <Link href="/dashboard/entrepreneur/phase-2">
                  Continue Company Verification <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <Link href="/dashboard/entrepreneur/phase-1">
                  Begin Verification <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-8">
      {/* ── STEP 8: Evolution Journey hero ───────────────────────────── */}
      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="w-fit uppercase tracking-wide">Evolution Journey</Badge>
                {progress ? (
                  <Badge className="w-fit">P{progress.currentPhase} Active</Badge>
                ) : (
                  <Skeleton className="h-5 w-16" />
                )}
              </div>
              <CardTitle className="text-3xl sm:text-4xl">Completion progress</CardTitle>
              <CardDescription className="text-base">
                {progress
                  ? `You are in Phase ${progress.currentPhase}. Follow the recommended next action to keep your raise moving.`
                  : 'Loading your journey…'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              {progress ? (
                <ProgressRing
                  percent={progress.overallProgressPercent}
                  label="Overall journey progress"
                  sublabel={`${progress.completedPhases.length}/${TOTAL_PHASES}`}
                />
              ) : (
                <Skeleton className="h-28 w-28 rounded-full" />
              )}
              <div className="rounded-xl border bg-background px-5 py-4 text-right">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Trust score</p>
                {progress ? (
                  <p className="text-3xl font-bold text-primary">{progress.trustScore}/100</p>
                ) : (
                  <Skeleton className="mt-1 h-9 w-24" />
                )}
              </div>
            </div>
          </div>
          <div className="space-y-2" role="status" aria-live="polite">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Overall progress</span>
              <span className="font-semibold text-foreground">
                {progress ? `${progress.completedPhases.length} of ${TOTAL_PHASES} phases complete` : '—'}
              </span>
            </div>
            <Progress value={progress?.overallProgressPercent ?? 0} className="h-3" aria-label="Overall journey progress" />
            <p className="text-xs text-muted-foreground">{progress?.overallProgressPercent ?? 0}% complete</p>
          </div>
          {progress ? (
            <Button asChild className="h-11 w-fit justify-between">
              <Link href={activePhase.href}>Continue {activePhase.title} <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          ) : null}
        </CardHeader>
      </Card>

      {/* Funds-raised mini cards (real committed / target) */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { label: 'Committed', value: committed > 0 ? eur(committed) : '—' },
          { label: 'Target', value: target > 0 ? eur(target) : '—' },
          { label: 'Remaining', value: target > 0 ? eur(Math.max(0, target - committed)) : '—' },
        ].map((m) => (
          <Card key={m.label}>
            <CardContent className="p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{m.label}</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{m.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── STEP 2: KPI card row ─────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isViewLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)
        ) : (
          <>
            <StatCard
              label="Target Raised"
              value={target > 0 ? eur(target) : '—'}
              hint={funding?.fundingRoundType ? funding.fundingRoundType.replace('_', ' ') : 'No funding ask yet'}
              icon={Target}
            />
            <StatCard
              label="Trust Score"
              value={progress ? `${progress.trustScore}/100` : '—'}
              hint={progress?.isInvestorReady ? 'Investor ready' : 'In progress'}
              icon={CheckCircle2}
            />
            <StatCard
              label="Investor Matches"
              value={matches ? String(matches.totalMatches) : '0'}
              hint={matches && matches.highScoreMatches > 0 ? `${matches.highScoreMatches} high intent` : 'No high-intent yet'}
              icon={Handshake}
            />
            <StatCard
              label="Estimated Valuation"
              value={financial && financial.finalValuation > 0 ? eur(financial.finalValuation) : '—'}
              hint={financial && financial.growthRate ? `${financial.growthRate > 0 ? '+' : ''}${financial.growthRate}% growth` : undefined}
              icon={TrendingUp}
            />
          </>
        )}
      </div>

      {/* ── STEP 3 + 4: Funding progress + Capital allocation ────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="gap-1">
            <CardTitle className="flex items-center gap-2 text-lg"><Wallet className="h-5 w-5 text-primary" />Funding progress</CardTitle>
            <CardDescription>Committed capital against your current funding ask.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isViewLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : target > 0 ? (
              <>
                <div className="flex items-end justify-between">
                  <span className="text-2xl font-bold text-foreground">{eur(committed)}</span>
                  <span className="text-sm text-muted-foreground">of {eur(target)}</span>
                </div>
                <Progress value={fundingPct} className="h-3" aria-label="Funding committed progress" />
                <p className="text-xs text-muted-foreground">{fundingPct}% committed · {eur(Math.max(0, target - committed))} remaining</p>
              </>
            ) : (
              <EmptyHint>No funding ask published yet. <Link href="/dashboard/entrepreneur/phase-5" className="text-primary hover:underline">Create one in Phase 5</Link>.</EmptyHint>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-1">
            <CardTitle className="flex items-center gap-2 text-lg"><PieChart className="h-5 w-5 text-primary" />Capital allocation</CardTitle>
            <CardDescription>How the requested funds are planned to be used.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isViewLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : funding && funding.capitalAllocation.length > 0 ? (
              funding.capitalAllocation.map((a) => (
                <div key={a.category} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{a.category}</span>
                    <span className="font-medium text-muted-foreground">{a.percent}% · {eur(a.amount)}</span>
                  </div>
                  <Progress value={a.percent} className="h-2" aria-label={`${a.category} allocation`} />
                </div>
              ))
            ) : (
              <EmptyHint>No capital allocation set yet.</EmptyHint>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Hiring priorities + resource allocation (real resourceMap; honest empty) */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="gap-1">
            <CardTitle className="flex items-center gap-2 text-lg"><Briefcase className="h-5 w-5 text-primary" />Hiring priorities</CardTitle>
            <CardDescription>Planned roles from your funding ask.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {isViewLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : funding?.resourceMap?.hiringPlan && funding.resourceMap.hiringPlan.length > 0 ? (
              funding.resourceMap.hiringPlan.map((h, i) => (
                <div key={`${h.role}-${i}`} className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{h.role}</p>
                    <p className="text-xs text-muted-foreground">{h.timeline}{h.salary ? ` · ${eur(h.salary)}` : ''}</p>
                  </div>
                  <Badge variant={h.priority === 'high' ? 'destructive' : h.priority === 'medium' ? 'default' : 'secondary'} className="shrink-0 capitalize">{h.priority}</Badge>
                </div>
              ))
            ) : (
              <EmptyHint>No hiring plan yet. <Link href="/dashboard/entrepreneur/phase-5" className="text-primary hover:underline">Add one in Phase 5</Link>.</EmptyHint>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-1">
            <CardTitle className="flex items-center gap-2 text-lg"><Wallet className="h-5 w-5 text-primary" />Resource allocation</CardTitle>
            <CardDescription>Tools and service providers in your plan.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isViewLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : funding?.resourceMap && (funding.resourceMap.techTools.length > 0 || funding.resourceMap.serviceProviders.length > 0) ? (
              <>
                {funding.resourceMap.techTools.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tech tools</p>
                    <div className="flex flex-wrap gap-2">
                      {funding.resourceMap.techTools.map((t, i) => (
                        <Badge key={`${t.name}-${i}`} variant="secondary">{t.name}{t.monthlyCost ? ` · ${eur(t.monthlyCost)}/mo` : ''}</Badge>
                      ))}
                    </div>
                  </div>
                ) : null}
                {funding.resourceMap.serviceProviders.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Service providers</p>
                    <div className="flex flex-wrap gap-2">
                      {funding.resourceMap.serviceProviders.map((s, i) => (
                        <Badge key={`${s.name}-${i}`} variant="secondary">{s.name}{s.estimatedCost ? ` · ${eur(s.estimatedCost)}` : ''}</Badge>
                      ))}
                    </div>
                  </div>
                ) : null}
              </>
            ) : (
              <EmptyHint>No tools or service providers added yet.</EmptyHint>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Investor insights (expense breakdown) — no company-scoped expense field exposed; honest shell */}
      <Card>
        <CardHeader className="gap-1">
          <CardTitle className="flex items-center gap-2 text-lg"><BarChart3 className="h-5 w-5 text-primary" />Investor insights</CardTitle>
          <CardDescription>Expense and spend breakdown shared with investors.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-24 items-center justify-center rounded-lg border border-dashed" role="status">
            <p className="text-sm italic text-muted-foreground">Awaiting backend field — a company-scoped expense endpoint is required.</p>
          </div>
        </CardContent>
      </Card>

      {/* ── STEP 5 + 6: AI mentor + Activity feed ────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="gap-1">
            <CardTitle className="flex items-center gap-2 text-lg"><Lightbulb className="h-5 w-5 text-primary" />AI mentor suggestions</CardTitle>
            <CardDescription>Actions that raise your investor-readiness score.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isViewLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : recs.length > 0 ? (
              recs.map((r, i) => (
                <div key={`${r.title}-${i}`} className="flex items-start justify-between gap-3 rounded-lg border bg-card p-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-foreground">{r.title}</p>
                      <Badge variant={priorityVariant(r.priority)} className="shrink-0 capitalize">{r.priority}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{r.description}</p>
                  </div>
                  {r.potentialPointGain > 0 ? (
                    <span className="shrink-0 text-sm font-semibold text-primary">+{r.potentialPointGain}</span>
                  ) : null}
                </div>
              ))
            ) : (
              <EmptyHint>No suggestions yet. <Link href="/dashboard/entrepreneur/phase-7" className="text-primary hover:underline">Run an AI review</Link>.</EmptyHint>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-1">
            <CardTitle className="flex items-center gap-2 text-lg"><Clock className="h-5 w-5 text-primary" />Recent activity</CardTitle>
            <CardDescription>Latest investor engagement on your data room.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {isViewLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : activity.length > 0 ? (
              activity.slice(0, 8).map((ev) => (
                <div key={ev.id} className="flex items-center justify-between gap-3 border-b pb-2 text-sm last:border-0 last:pb-0">
                  <span className="flex items-center gap-2 text-foreground">
                    <span className="rounded-md bg-muted p-1.5 text-muted-foreground">
                      {ev.eventType === 'download' ? <FolderOpen className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
                    </span>
                    <span className="capitalize">{ev.eventType}</span> on a document
                  </span>
                  <span className="text-xs text-muted-foreground">{dateShort(ev.occurredAt)}</span>
                </div>
              ))
            ) : (
              <EmptyHint>No activity yet — it appears once investors view your data room.</EmptyHint>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Ventures & Acquisitions Relationships ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">Ventures & Acquisitions</h2>
            <p className="text-xs text-muted-foreground">
              Discover creator projects, manage commercial negotiations, and access acquired intellectual property.
            </p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Link href="/dashboard/entrepreneur/discover">
            <Card className="hover:border-primary/40 hover:shadow-md transition-all cursor-pointer h-full">
              <CardContent className="p-5 flex items-start gap-4">
                <span className="rounded-xl bg-primary/10 p-3 text-primary shrink-0">
                  <Compass className="h-5 w-5" />
                </span>
                <div className="space-y-1">
                  <p className="font-bold text-sm text-foreground">Discover Projects</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Explore validated creator ventures open for Buyout or Equity Partnership.
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/entrepreneur/deals">
            <Card className="hover:border-primary/40 hover:shadow-md transition-all cursor-pointer h-full">
              <CardContent className="p-5 flex items-start gap-4">
                <span className="rounded-xl bg-indigo-500/10 p-3 text-indigo-500 shrink-0">
                  <Handshake className="h-5 w-5" />
                </span>
                <div className="space-y-1">
                  <p className="font-bold text-sm text-foreground">Project Deals</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Manage active term sheet negotiations, NDAs, and deal pipelines with creators.
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/entrepreneur/acquisitions">
            <Card className="hover:border-primary/40 hover:shadow-md transition-all cursor-pointer h-full">
              <CardContent className="p-5 flex items-start gap-4">
                <span className="rounded-xl bg-emerald-500/10 p-3 text-emerald-500 shrink-0">
                  <Briefcase className="h-5 w-5" />
                </span>
                <div className="space-y-1">
                  <p className="font-bold text-sm text-foreground">My Acquisitions</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Access verified inventory of intellectual property and assets acquired via Full Buyout.
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* ── STEP 1 + 8: Phase journey grid (real status, no fake metrics) ── */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {PHASES.map((p) => {
          const isCompleted = !!progress?.completedPhases.includes(p.phase);
          const isActive = progress?.currentPhase === p.phase;
          const isLocked = !isCompleted && !isActive;
          const Icon = p.icon;
          return (
            <Link key={p.phase} href={isLocked ? '#' : p.href} aria-disabled={isLocked}>
              <Card
                className={cn(
                  'h-full border transition-all',
                  isLocked ? 'opacity-70 cursor-not-allowed' : 'hover:border-primary/40 hover:shadow-md cursor-pointer',
                  isActive && 'border-primary/40',
                )}
              >
                <CardHeader className="gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className={cn('rounded-lg p-2.5', isCompleted ? 'bg-primary/10 text-primary' : isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>
                        <Icon className="h-5 w-5" aria-hidden />
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground">Phase {p.phase}</p>
                          {isCompleted && <CheckCircle2 className="h-4 w-4 text-primary" aria-label="completed" />}
                          {isActive && <Clock className="h-4 w-4 text-primary" aria-label="active" />}
                          {isLocked && <Lock className="h-4 w-4 text-muted-foreground" aria-label="locked" />}
                        </div>
                        <p className="text-sm text-muted-foreground">{p.title}</p>
                      </div>
                    </div>
                    {!isLocked && <ArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden />}
                  </div>
                  <CardDescription className="text-sm">{p.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
