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
  { phase: 9, title: 'Deal Execution', description: 'Term sheets and close', icon: Users, href: '/dashboard/entrepreneur/phase-9' },
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
    (async () => {
      setLoading(true);
      let prog: CompanyProgressResponse;
      try {
        prog = await entrepreneurApi.getCurrentPhase();
      } catch {
        if (active) { setNoCompany(true); setLoading(false); }
        return;
      }
      if (!active) return;
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
  }, []);

  // ---- derived (real data only) ----
  const committed = deals.reduce(
    (sum, d) => sum + (d.investors?.reduce((s, i) => s + (i.committedAmount || 0), 0) ?? 0),
    0,
  );
  const target = funding?.fundingAskAmount ?? 0;
  const fundingPct = target > 0 ? Math.min(100, Math.round((committed / target) * 100)) : 0;
  const activePhase = PHASES.find((p) => p.phase === progress?.currentPhase) ?? PHASES[0];

  // ---- no-company state ----
  if (noCompany) {
    return (
      <div className="mx-auto w-full max-w-7xl">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="gap-2">
            <CardTitle className="text-2xl">Start your entrepreneur journey</CardTitle>
            <CardDescription>
              Complete Phase 1 verification to create your company profile and unlock the dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard/entrepreneur/phase-1">Begin verification <ArrowRight className="h-4 w-4" /></Link>
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
                {p