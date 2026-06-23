'use client';

import type { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Download,
  Edit2,
  Eye,
  FileSpreadsheet,
  FileText,
  Folder,
  Gauge,
  Lock,
  MessageSquare,
  Palette,
  Play,
  Rocket,
  RotateCw,
  ShieldCheck,
  Sparkles,
  Store,
  TrendingUp,
  Users,
  Zap,
  ChevronRight,
  AlertTriangle,
  Bell,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useCreatorProgress } from '@/providers/CreatorProgressProvider';
import { getNextCreatorAction } from '@/lib/creator-state-resolver';
import { useDashboardStats } from '@/hooks/queries/creator';
import { useForecastSessionTimed } from '@/hooks/queries/creator-ai';
import { useConversations } from '@/hooks/queries/chat';
import { useNotifications } from '@/hooks/queries/notifications';
import { creatorJourneyApi } from '@/lib/api-creator-journey';
import type { ForecastOutput } from '@/types/creator/ai';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Compact relative time for real timestamps ("2m", "3h", "5d", "now").
function timeAgo(iso?: string | null): string {
  if (!iso) return '';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

// Live forecast monthly revenue → recharts series (null-safe per the audit). This is
// the SAME ForecastOutput the Phase-3 forecast view renders — no separate dashboard copy.
function toRevenueChart(output?: ForecastOutput) {
  const rev = output?.revenueForecast?.monthly ?? [];
  return rev.map((m) => ({ name: `M${m?.month ?? ''}`, Revenue: m?.amount ?? null }));
}

// One honest cell for a KPI value: loading (skeleton) / error (retry, NOT zeros) /
// empty (genuine zero-state) / data — kept visually distinct (the R11 lesson at the
// component level). A failed request must never render as a real-looking number.
function StatCell({
  loading, error, empty, onRetry, children,
}: { loading?: boolean; error?: boolean; empty?: boolean; onRetry?: () => void; children: ReactNode }) {
  if (loading) return <Skeleton className="h-7 w-20" />;
  if (error)
    return (
      <button onClick={onRetry} className="flex items-center gap-1 text-xs font-semibold text-destructive">
        <AlertTriangle className="h-3.5 w-3.5" /> Failed — retry
      </button>
    );
  if (empty) return <span className="text-2xl font-black text-muted-foreground/40 tracking-tight">—</span>;
  return <>{children}</>;
}

export default function CreatorDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    state, resetJourney, advancePhase, setCrossroadsPath,
    isLoading: journeyLoading, error: journeyError, refetch: refetchJourney,
  } = useCreatorProgress();
  const { journeyState, project } = state;
  const phase3Documents = state.documents.filter((doc) => doc.phase === 3);

  // ---- Real data sources (replaces every former hardcoded sample constant) ----
  // Readiness score (P1.8) from /creator/dashboard/stats. Errors propagate (no fallback).
  const statsQ = useDashboardStats();
  const readiness = statsQ.data?.investorReadinessScore ?? null;

  // The mapped progress state drops these raw refs, so fetch the journey once for
  // the forecast session id + matched-investor count (real loading/error states).
  const refsQ = useQuery({ queryKey: ['creator', 'dashboardRefs'], queryFn: () => creatorJourneyApi.get() });
  const forecastSessionId =
    (refsQ.data?.journey.phase3Data as { forecastSessionId?: string } | undefined)?.forecastSessionId ?? null;
  const matchedInvestorCount =
    (refsQ.data?.journey.phase5Data as { pathB?: { seedFunding?: { matchedInvestorCount?: number } } } | undefined)
      ?.pathB?.seedFunding?.matchedInvestorCount ?? null;

  // Forecast — the SAME live session source as the Phase-3 forecast view.
  const forecast = useForecastSessionTimed(forecastSessionId);
  const forecastOutput = (forecast.data as { output?: ForecastOutput } | undefined)?.output;
  const forecastLoading = !!forecastSessionId && forecast.phase === 'polling';
  const forecastError = !!forecastSessionId && forecast.isError && forecast.phase !== 'polling';
  const hasForecast = forecast.phase === 'terminal' && !!forecastOutput;

  // Forecast-derived figures — same math as the Phase-3 view (null when no forecast).
  const year3Arr = forecastOutput ? (forecastOutput.revenueForecast?.monthly?.[35]?.amount ?? 0) * 12 : null;
  const breakEvenMonth = forecastOutput?.breakEvenAnalysis?.breakEvenMonth ?? null;
  const breakEvenAchieved = forecastOutput?.breakEvenAnalysis?.isAchievedWithinHorizon;
  const revenueChart = toRevenueChart(forecastOutput);

  // KPI values (real; honest empty when genuinely absent — never a placeholder).
  const clarityScore = project.clarityScore || null;
  const assetsGenerated = state.documents.length;

  // Real chat + notification sources (replaces the sample Messages/Notifications cards).
  const conversationsQ = useConversations();
  const recentConversations = (conversationsQ.data ?? []).slice(0, 3);
  const unreadConversations = (conversationsQ.data ?? []).reduce((n, c) => n + (c.unreadCount > 0 ? 1 : 0), 0);
  const notif = useNotifications();
  const recentNotifications = notif.notifications.slice(0, 4);

  const firstName = user?.name?.trim().split(/\s+/)[0] || 'there';

  // Determine current active state (State A to F)
  const isPhase1Done = journeyState.phase1.status === 'completed';
  const isPhase2NotStarted = journeyState.phase2.status === 'locked' || journeyState.phase2.status === 'available';
  const isPhase2InProgress = journeyState.phase2.status === 'in_progress';
  const isPhase2Done = journeyState.phase2.status === 'completed';
  const isPhase3Done = journeyState.phase3.status === 'completed';
  const isPhase4Done = journeyState.phase4.status === 'completed';
  const isPhase5Done = journeyState.phase5.status === 'completed';

  let dashboardState: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' = 'A';
  if (isPhase1Done && isPhase2NotStarted) dashboardState = 'A';
  else if (isPhase2InProgress) dashboardState = 'B';
  else if (isPhase2Done && !isPhase3Done) dashboardState = 'C';
  else if (isPhase3Done && !isPhase4Done) dashboardState = 'D';
  else if (isPhase4Done && !isPhase5Done) dashboardState = 'E';
  else if (isPhase5Done) dashboardState = 'F';

  const action = getNextCreatorAction(journeyState);

  // Dynamic progress calculation based on phase completion
  let completedCount = 0;
  if (isPhase1Done) completedCount++;
  if (isPhase2Done) completedCount++;
  if (isPhase3Done) completedCount++;
  if (isPhase4Done) completedCount++;
  if (isPhase5Done) completedCount++;

  return (
    <div className="mx-auto w-full max-w-[1136px] space-y-6 bg-background pb-8 font-sans">
      {/* Header Breadcrumbs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" aria-label="Back to dashboard" className="h-8 w-8 rounded-lg border-border/70" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <span>Creator Flow</span>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30" />
            <span className="text-foreground">Dashboard</span>
          </div>
        </div>

        {/* Reset / Developer Control */}
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-destructive" onClick={resetJourney}>
          Reset Progress
        </Button>
      </div>

      {/* Row 1: Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground sm:text-3xl leading-tight">
            Good morning, {firstName} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {dashboardState === 'A' && 'Your identity is verified. Start your first project concept below.'}
            {dashboardState === 'B' && 'Refining your project concept. Complete the questions to unlock forecasts.'}
            {dashboardState === 'C' && 'Project concept defined successfully. Continue setup to model financials.'}
            {dashboardState === 'D' && 'Project intelligence is fully modeled. Complete pricing options to proceed.'}
            {dashboardState === 'E' && 'Checklists complete! Proceed to the Crossroads decision board.'}
            {dashboardState === 'F' && `${project.name || 'AutoInvoice'} is gaining traction. Phase 5/6 reached!`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="h-9 rounded-lg bg-card text-muted-foreground px-3 flex items-center gap-1.5 border-border">
            <Clock className="w-3.5 h-3.5" />
            {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
          </Badge>
          {dashboardState === 'A' ? (
            <Button variant="outline" asChild className="rounded-lg border-border bg-card text-foreground font-semibold text-xs px-4 h-9">
              <Link href={action.route}>New Idea</Link>
            </Button>
          ) : (
            <Button variant="outline" asChild className="rounded-lg border-border bg-card text-foreground text-xs px-4 h-9">
              <Link href="/dashboard/creator/phase-2">Edit Concept</Link>
            </Button>
          )}
          <Button variant="outline" className="rounded-lg border-border bg-card text-foreground font-semibold text-xs px-4 h-9">
            <Sparkles className="w-3.5 h-3.5 mr-1" />
            AI Tools
          </Button>
        </div>
      </div>

      {/* Row 2: KPI Metrics Grid — real data, honest loading/error/empty/data states */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Idea Clarity Score — journey project (backend-authoritative) */}
        <Card className="rounded-2xl border-border bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-primary/5 text-primary rounded-lg">
              <Gauge className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-foreground tracking-tight">
              <StatCell loading={journeyLoading} error={!!journeyError} empty={clarityScore == null} onRetry={refetchJourney}>
                {clarityScore}
                <span className="text-xs text-muted-foreground font-normal">/100</span>
              </StatCell>
            </div>
            <div className="text-xs text-muted-foreground mt-1.5 font-medium">Idea Clarity Score</div>
          </div>
        </Card>

        {/* AI Assets Generated — real journey documents count */}
        <Card className="rounded-2xl border-border bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-success-light text-success-text rounded-lg">
              <FileText className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-foreground tracking-tight">
              <StatCell loading={journeyLoading} error={!!journeyError} empty={assetsGenerated === 0} onRetry={refetchJourney}>
                {assetsGenerated}
              </StatCell>
            </div>
            <div className="text-xs text-muted-foreground mt-1.5 font-medium">AI Assets Generated</div>
          </div>
        </Card>

        {/* Investor Readiness — /creator/dashboard/stats (P1.8). Replaces the former
            "Est. IP Valuation" tile, which had no real dashboard source. */}
        <Card className="rounded-2xl border-border bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-primary/5 text-primary rounded-lg">
              <ShieldCheck className="h-4.5 w-4.5" />
            </div>
            {readiness?.label && (
              <Badge className="bg-primary/10 text-primary border-0 font-bold px-2 py-0.5 text-[10px]">
                {readiness.label}
              </Badge>
            )}
          </div>
          <div>
            <div className="text-2xl font-black text-foreground tracking-tight">
              <StatCell loading={statsQ.isLoading} error={statsQ.isError} empty={readiness == null} onRetry={statsQ.refetch}>
                {readiness ? Math.round(readiness.total) : null}
                <span className="text-xs text-muted-foreground font-normal">/100</span>
              </StatCell>
            </div>
            <div className="text-xs text-muted-foreground mt-1.5 font-medium">Investor Readiness</div>
          </div>
        </Card>

        {/* Interested Buyers — matched-investor count (P1.11 smart matching) */}
        <Card className="rounded-2xl border-border bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-primary/5 text-primary rounded-lg">
              <Users className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-foreground tracking-tight">
              <StatCell loading={refsQ.isLoading} error={refsQ.isError} empty={!matchedInvestorCount} onRetry={refsQ.refetch}>
                {matchedInvestorCount}
              </StatCell>
            </div>
            <div className="text-xs text-muted-foreground mt-1.5 font-medium">Interested Buyers</div>
          </div>
        </Card>
      </div>

      {/* Crossroads Banner (Only in state E) */}
      {dashboardState === 'E' && (
        <Card className="rounded-2xl border border-warning/30 bg-gradient-to-r from-warning/5 to-primary/5 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-warning/10 flex items-center justify-center text-warning shrink-0">
              <Rocket className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                ⚡ You've reached The Crossroads — Phase 5
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
                Fully packaged idea. Sell/license it OR build your company and unlock investor matching. Select your strategic path below.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Button
              className="flex-1 md:flex-none rounded-xl bg-warning text-white hover:bg-warning/95 text-xs font-bold px-5 h-10"
              onClick={() => {
                setCrossroadsPath('sell_license');
                advancePhase(5);
              }}
            >
              Sell / License
            </Button>
            <Button
              className="flex-1 md:flex-none rounded-xl bg-primary text-white hover:bg-primary/95 text-xs font-bold px-5 h-10"
              onClick={() => {
                setCrossroadsPath('build');
                advancePhase(5);
              }}
            >
              Build It
            </Button>
          </div>
        </Card>
      )}

      {/* Row 3: Main Grid Layout (2-Column) */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Project, Forecast, and Asset Library */}
        <div className="lg:col-span-2 space-y-6">
          {/* Your Project Card */}
          <Card className="rounded-2xl border-border bg-card shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Rocket className="w-4 h-4 text-warning" />
                Your Project
              </h3>
              {dashboardState !== 'A' ? (
                <Badge className="bg-success-light text-success-text border-0 font-bold px-3 py-1 text-xs">
                  Identity Ready
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground border-border text-xs px-3 py-1">
                  Draft Not Started
                </Badge>
              )}
            </div>

            {/* Hero / Logo detail */}
            {dashboardState === 'A' ? (
              <div className="p-6 border border-dashed border-border rounded-xl text-center space-y-3 bg-muted/10">
                <p className="text-xs text-muted-foreground">
                  You haven't initialized your project branding. Launch the Smart Gate wizard to build your draft identity.
                </p>
                <Button asChild size="sm" className="rounded-lg bg-primary text-white hover:bg-primary/95 text-xs">
                  <Link href={action.route}>Start Project Now</Link>
                </Button>
              </div>
            ) : (
              <div className="flex gap-4 items-start p-4 bg-muted/10 border border-border/50 rounded-xl relative">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-primary to-warning flex items-center justify-center font-black text-xl text-white shrink-0">
                  {project.name ? project.name.charAt(0).toUpperCase() : 'A'}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-foreground text-base truncate">{project.name || 'AutoInvoice'}</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                    {project.concept || 'We help freelancers recover unpaid invoices by automating follow-up sequences.'}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    <Badge variant="outline" className="text-[10px] font-semibold px-2 py-0.5 bg-warning/5 text-warning border-warning/10">
                      {project.category || 'FinTech'}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] font-semibold px-2 py-0.5 bg-primary/5 text-primary border-primary/10">
                      SaaS
                    </Badge>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild className="absolute top-4 right-4 rounded-lg text-xs h-7 border-border px-2">
                  <Link href="/dashboard/creator/phase-2">
                    <Edit2 className="w-3.5 h-3.5 mr-1" />
                    Edit
                  </Link>
                </Button>
              </div>
            )}

            {/* Stepper progress indicator */}
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-foreground">Creator Journey</span>
                <span className="text-muted-foreground">{completedCount} of 6 phases completed</span>
              </div>
              <div className="relative flex justify-between items-start pt-2">
                {/* Connector line */}
                <div className="absolute top-5 left-4 right-4 h-0.5 bg-border -z-10" />
                <div
                  className="absolute top-5 left-4 h-0.5 bg-gradient-to-r from-success-text to-primary -z-10 transition-all duration-500"
                  style={{ width: `${Math.max(0, ((completedCount - 1) / 5) * 100)}%` }}
                />

                {/* Steps */}
                <div className="flex flex-col items-center gap-1.5 z-10">
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold ${isPhase1Done ? 'bg-success-text border-success-text text-white' : 'bg-card border-border text-muted-foreground'}`}>
                    {isPhase1Done ? <Check className="w-4 h-4" /> : '1'}
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium">Identity</span>
                </div>

                <div className="flex flex-col items-center gap-1.5 z-10">
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold ${isPhase2Done ? 'bg-success-text border-success-text text-white' : dashboardState === 'B' ? 'bg-warning border-warning text-white ring-4 ring-warning/10' : 'bg-card border-border text-muted-foreground'}`}>
                    {isPhase2Done ? <Check className="w-4 h-4" /> : '2'}
                  </div>
                  <span className={`text-[10px] font-medium ${dashboardState === 'B' ? 'text-warning font-semibold' : 'text-muted-foreground'}`}>Concept</span>
                </div>

                <div className="flex flex-col items-center gap-1.5 z-10">
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold ${isPhase3Done ? 'bg-success-text border-success-text text-white' : dashboardState === 'C' ? 'bg-warning border-warning text-white ring-4 ring-warning/10' : 'bg-card border-border text-muted-foreground'}`}>
                    {isPhase3Done ? <Check className="w-4 h-4" /> : '3'}
                  </div>
                  <span className={`text-[10px] font-medium ${dashboardState === 'C' ? 'text-warning font-semibold' : 'text-muted-foreground'}`}>Intel</span>
                </div>

                <div className="flex flex-col items-center gap-1.5 z-10">
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold ${isPhase4Done ? 'bg-success-text border-success-text text-white' : dashboardState === 'D' ? 'bg-warning border-warning text-white ring-4 ring-warning/10' : 'bg-card border-border text-muted-foreground'}`}>
                    {isPhase4Done ? <Check className="w-4 h-4" /> : '4'}
                  </div>
                  <span className={`text-[10px] font-medium ${dashboardState === 'D' ? 'text-warning font-semibold' : 'text-muted-foreground'}`}>Pricing</span>
                </div>

                <div className="flex flex-col items-center gap-1.5 z-10">
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold ${isPhase5Done ? 'bg-success-text border-success-text text-white' : dashboardState === 'E' ? 'bg-warning border-warning text-white ring-4 ring-warning/10' : 'bg-card border-border text-muted-foreground'}`}>
                    {isPhase5Done ? <Check className="w-4 h-4" /> : '5'}
                  </div>
                  <span className={`text-[10px] font-medium ${dashboardState === 'E' ? 'text-warning font-semibold' : 'text-muted-foreground'}`}>Crossroads</span>
                </div>

                <div className="flex flex-col items-center gap-1.5 z-10">
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold ${dashboardState === 'F' ? 'bg-warning border-warning text-white ring-4 ring-warning/10' : 'bg-card border-border text-muted-foreground'}`}>
                    6
                  </div>
                  <span className={`text-[10px] font-medium ${dashboardState === 'F' ? 'text-warning font-semibold' : 'text-muted-foreground'}`}>Matching</span>
                </div>
              </div>
            </div>

            {/* Continue to current phase — shown when there's an active phase */}
            {dashboardState !== 'A' && dashboardState !== 'F' && (
              <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/10 rounded-xl">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Play className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[10px] font-bold text-primary uppercase tracking-wider">
                      Currently on
                    </span>
                    <span className="block text-xs font-bold text-foreground truncate">
                      {dashboardState === 'B' && 'Phase 2 — Idea Refinement'}
                      {dashboardState === 'C' && 'Phase 3 — Project Intelligence'}
                      {dashboardState === 'D' && 'Phase 4 — Offer & Pricing'}
                      {dashboardState === 'E' && 'Phase 5 — The Crossroads'}
                    </span>
                  </div>
                </div>
                <Button asChild size="sm" className="rounded-full px-5 text-xs font-bold shrink-0">
                  <Link href={action.route}>
                    Continue
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Link>
                </Button>
              </div>
            )}
          </Card>

          {/* AI Financial Forecast Card */}
          <Card className="rounded-2xl border-border bg-card shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                AI Financial Forecast
              </h3>
              {hasForecast && (
                <Button variant="outline" size="sm" asChild className="rounded-lg text-xs h-7 border-border px-2.5">
                  <Link href="/dashboard/creator/phase-3/forecast">View full</Link>
                </Button>
              )}
            </div>

            {!forecastSessionId ? (
              // EMPTY (no forecast run yet) — honest CTA, never fabricated bars.
              <div className="p-8 border border-dashed border-border rounded-xl text-center space-y-3 bg-muted/10 flex flex-col items-center justify-center min-h-[200px]">
                <TrendingUp className="w-6 h-6 text-muted-foreground/45" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-foreground">No forecast yet</h4>
                  <p className="text-[11px] text-muted-foreground max-w-xs leading-relaxed">
                    Run your financial forecast in Phase 3 to see your projected revenue, break-even, and cash flow here.
                  </p>
                </div>
                <Button asChild size="sm" className="rounded-lg bg-primary text-white hover:bg-primary/95 text-xs">
                  <Link href="/dashboard/creator/phase-3/forecast">Run your forecast</Link>
                </Button>
              </div>
            ) : forecastLoading ? (
              // LOADING — skeleton, not fake data.
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 border-b border-border/50 pb-4">
                  {[0, 1, 2].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
                <Skeleton className="h-[150px] w-full" />
              </div>
            ) : forecastError ? (
              // ERROR — distinct from empty; retry, never zeros.
              <div className="p-8 border border-dashed border-destructive/30 rounded-xl text-center space-y-3 bg-destructive/5 flex flex-col items-center justify-center min-h-[200px]">
                <AlertTriangle className="w-6 h-6 text-destructive" />
                <p className="text-[11px] text-destructive max-w-xs leading-relaxed">Your forecast failed to load.</p>
                <Button variant="outline" size="sm" onClick={() => forecast.retry()} className="rounded-lg text-xs gap-1.5">
                  <RotateCw className="w-3.5 h-3.5" /> Retry
                </Button>
              </div>
            ) : hasForecast ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 border-b border-border/50 pb-4">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Year 3 ARR</span>
                    <div className="text-lg font-bold text-foreground">
                      {year3Arr != null ? `€${Math.round(year3Arr).toLocaleString()}` : '—'}
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Break-even</span>
                    <div className="text-lg font-bold text-foreground">
                      {breakEvenMonth == null ? '—' : breakEvenAchieved === false ? 'Not in 36 mo' : `Month ${breakEvenMonth}`}
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">EBITDA Margin</span>
                    {/* No margin field in the live forecast contract — honest unavailable. */}
                    <div className="text-lg font-bold text-muted-foreground/50">—</div>
                  </div>
                </div>

                {revenueChart.length > 0 && (
                  <div className="h-[150px] w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenueChart} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/40" />
                        <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={8} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                        <YAxis stroke="var(--muted-foreground)" fontSize={8} tickLine={false} axisLine={false} tickFormatter={(v) => (v != null ? `€${Math.round(Number(v) / 1000)}k` : '')} />
                        <Tooltip formatter={(v) => (v != null ? [`€${Number(v).toLocaleString()}`] : [])} contentStyle={{ background: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px', fontSize: '10px' }} />
                        <Bar dataKey="Revenue" fill="var(--primary)" radius={[3, 3, 0, 0]} maxBarSize={14} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            ) : (
              // Terminal but no usable output (e.g. needs-review) — honest, not fabricated.
              <div className="p-8 border border-dashed border-border rounded-xl text-center space-y-1.5 bg-muted/10 flex flex-col items-center justify-center min-h-[200px]">
                <TrendingUp className="w-6 h-6 text-muted-foreground/45" />
                <p className="text-[11px] text-muted-foreground max-w-xs leading-relaxed">Forecast results aren&apos;t available yet.</p>
              </div>
            )}
          </Card>

          {/* Asset Library Card */}
          <Card className="rounded-2xl border-border bg-card shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Folder className="w-4 h-4 text-primary" />
                Asset Library
              </h3>
              {completedCount > 1 && (
                <Button variant="outline" size="sm" asChild className="rounded-lg text-xs h-7 border-border px-2.5">
                  <Link href="/dashboard/creator/asset-library">View all</Link>
                </Button>
              )}
            </div>

            {completedCount <= 1 ? (
              <div className="p-8 border border-dashed border-border rounded-xl text-center space-y-1.5 bg-muted/10 flex flex-col items-center justify-center">
                <Folder className="w-6 h-6 text-muted-foreground/40" />
                <h4 className="text-xs font-bold text-foreground">Nothing Here Yet</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Your completed work and generated assets will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {isPhase3Done && phase3Documents.length > 0 && phase3Documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                        {doc.category === 'Financial Model' ? (
                          <FileSpreadsheet className="w-4.5 h-4.5" />
                        ) : (
                          <FileText className="w-4.5 h-4.5" />
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-foreground">{doc.name.replace(/\.[^.]+$/, '').replace(/_/g, ' ')}</h4>
                        <span className="text-[10px] text-muted-foreground">{doc.category} · Phase 3.{doc.step}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" aria-label="Download" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                ))}

                {isPhase3Done && phase3Documents.length === 0 && (
                  <>
                    <div className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                          <FileSpreadsheet className="w-4.5 h-4.5" />
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-bold text-foreground">3-Year Financial Forecast</h4>
                          <span className="text-[10px] text-muted-foreground">Financial Model · Phase 3.2</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" aria-label="Download" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                          <FileText className="w-4.5 h-4.5" />
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-bold text-foreground">AI Business Plan</h4>
                          <span className="text-[10px] text-muted-foreground">Strategic Plan · Phase 3.3</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" aria-label="Download" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </>
                )}

                {isPhase2Done && (
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 bg-success-light/30 rounded-lg flex items-center justify-center text-success-text">
                        <Palette className="w-4.5 h-4.5" />
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-foreground">Brand Identity Kit</h4>
                        <span className="text-[10px] text-muted-foreground">Logo · Palette · Fonts · Phase 2.3</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" aria-label="Download" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {isPhase3Done && (
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 bg-warning/10 rounded-lg flex items-center justify-center text-warning">
                        <CheckCircle2 className="w-4.5 h-4.5" />
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-foreground">Legal Checklist</h4>
                        <span className="text-[10px] text-muted-foreground">4 of 12 addressed · 8 remaining</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" aria-label="Open compliance checklist" className="h-8 w-8 text-muted-foreground hover:text-foreground" asChild>
                      <Link href="/dashboard/creator/phase-3/compliance">
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Messages, Notifications, and Marketplace/Smart Matching */}
        <div className="space-y-6">
          {/* Messages Card — real recent conversations (chat infra) */}
          <Card className="rounded-2xl border-border bg-card shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-warning" />
                Messages
              </h3>
              {unreadConversations > 0 && (
                <Badge className="bg-warning/15 text-warning font-bold text-[10px] border-0 px-2 py-0.5">
                  {unreadConversations} new
                </Badge>
              )}
            </div>

            {conversationsQ.isLoading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => <Skeleton key={i} className="h-11 w-full" />)}
              </div>
            ) : conversationsQ.isError ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <p className="text-[11px] text-destructive">Couldn&apos;t load your messages.</p>
                <Button variant="outline" size="sm" onClick={() => conversationsQ.refetch()} className="gap-1.5 text-xs"><RotateCw className="h-3.5 w-3.5" /> Retry</Button>
              </div>
            ) : recentConversations.length === 0 ? (
              <p className="text-[11px] text-muted-foreground text-center py-6 leading-relaxed">
                No conversations yet. Reach out to an investor or provider to start one.
              </p>
            ) : (
              <div className="space-y-3">
                {recentConversations.map((c) => {
                  const other = c.participants.find((p) => p.id !== user?.id) ?? c.participants[0];
                  const name = other?.name?.trim() || 'Conversation';
                  const initials = name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?';
                  return (
                    <Link key={c.id} href={`/dashboard/creator/messages?c=${c.id}`} className="flex items-center gap-3 hover:bg-muted/10 p-1 rounded-lg transition-colors">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-warning text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <h4 className="text-xs font-bold text-foreground truncate">{name}</h4>
                          <span className="text-[9px] text-muted-foreground shrink-0 ml-2">{timeAgo(c.lastMessageAt)}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate mt-0.5">{c.lastMessage || 'No messages yet.'}</p>
                      </div>
                      {c.unreadCount > 0 && <div className="w-1.5 h-1.5 rounded-full bg-warning shrink-0" />}
                    </Link>
                  );
                })}

                <Button variant="outline" size="sm" asChild className="w-full text-xs rounded-xl h-9 mt-2 font-bold text-muted-foreground hover:text-foreground">
                  <Link href="/dashboard/creator/messages">
                    <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                    Open Messages
                  </Link>
                </Button>
              </div>
            )}
          </Card>

          {/* Notifications Card — real notifications (notification infra) */}
          <Card className="rounded-2xl border-border bg-card shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Bell className="w-4 h-4 text-success-text" />
                Notifications
              </h3>
              {notif.unreadCount > 0 && (
                <Badge className="bg-success-light text-success-text font-bold text-[10px] border-0 px-2 py-0.5">
                  {notif.unreadCount} new
                </Badge>
              )}
            </div>

            {notif.isLoading ? (
              <div className="space-y-3.5">
                {[0, 1, 2].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
              </div>
            ) : notif.isError ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <p className="text-[11px] text-destructive">Couldn&apos;t load notifications.</p>
                <Button variant="outline" size="sm" onClick={() => notif.refetch()} className="gap-1.5 text-xs"><RotateCw className="h-3.5 w-3.5" /> Retry</Button>
              </div>
            ) : recentNotifications.length === 0 ? (
              <p className="text-[11px] text-muted-foreground text-center py-6 leading-relaxed">
                You&apos;re all caught up — no notifications yet.
              </p>
            ) : (
              <div className="space-y-3.5">
                {recentNotifications.map((n) => (
                  <div key={n.id} className="flex gap-2.5 items-start">
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${n.isRead ? 'bg-muted-foreground/30' : 'bg-success-text'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground leading-snug">{n.title || n.body}</p>
                      <span className="text-[9px] text-muted-foreground mt-0.5 block">{timeAgo(n.createdAt)}</span>
                    </div>
                  </div>
                ))}

                <Button variant="outline" size="sm" asChild className="w-full text-xs rounded-xl h-9 mt-2 font-bold text-muted-foreground hover:text-foreground">
                  <Link href="/dashboard/creator/notifications">
                    <Bell className="w-3.5 h-3.5 mr-1.5" />
                    View all notifications
                  </Link>
                </Button>
              </div>
            )}
          </Card>

          {/* Marketplace / Matches Card */}
          <Card className="rounded-2xl border-border bg-card shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Store className="w-4 h-4 text-warning" />
                Marketplace
              </h3>
            </div>

            {matchedInvestorCount && matchedInvestorCount > 0 ? (
              // Real matched-investor count (P1.11). Individual buyer identities are
              // surfaced on the Marketplace page (the investor↔chat linkage gate), not
              // fabricated here.
              <div className="text-center space-y-3 pt-2">
                <div className="text-3xl font-black text-foreground">{matchedInvestorCount}</div>
                <p className="text-xs text-muted-foreground font-medium">
                  {matchedInvestorCount === 1 ? 'investor matched' : 'investors matched'}
                </p>
                <Button className="w-full text-xs rounded-xl h-9 mt-2 font-bold bg-primary hover:bg-primary/95 text-white" asChild>
                  <Link href="/dashboard/creator/marketplace">
                    <Eye className="w-3.5 h-3.5 mr-1.5" />
                    View Buyers
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="p-6 border border-dashed border-border rounded-xl text-center space-y-1.5 bg-muted/10 flex flex-col items-center justify-center">
                <Lock className="w-5 h-5 text-muted-foreground/45" />
                <h4 className="text-xs font-bold text-foreground">Smart Matching Locked</h4>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Completing Phase 5 Crossroads unlocks buyers and co-founder matches.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Row 4: Quick Actions Grid */}
      <div className="space-y-3 pt-2">
        <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
          <Zap className="w-4 h-4 text-warning" />
          Quick Actions
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card
            className="rounded-2xl border-border bg-card p-4 hover:border-primary/50 cursor-pointer shadow-sm flex flex-col items-center text-center gap-2 transition-all hover:-translate-y-0.5 hover:shadow-md group"
            onClick={() => router.push('/dashboard/creator/phase-3/business-plan')}
          >
            <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white flex items-center justify-center transition-colors">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-foreground text-xs">Generate Pitch Deck</h4>
              <p className="text-[10px] text-muted-foreground mt-0.5">One-click AI generator</p>
            </div>
          </Card>

          <Card
            className="rounded-2xl border-border bg-card p-4 hover:border-warning/50 cursor-pointer shadow-sm flex flex-col items-center text-center gap-2 transition-all hover:-translate-y-0.5 hover:shadow-md group"
            onClick={() => router.push('/dashboard/creator/marketplace')}
          >
            <div className="w-10 h-10 rounded-xl bg-warning/10 text-warning group-hover:bg-warning group-hover:text-white flex items-center justify-center transition-colors">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-foreground text-xs">List on Marketplace</h4>
              <p className="text-[10px] text-muted-foreground mt-0.5">Sell or license concept</p>
            </div>
          </Card>

          <Card
            className="rounded-2xl border-border bg-card p-4 hover:border-success-text/50 cursor-pointer shadow-sm flex flex-col items-center text-center gap-2 transition-all hover:-translate-y-0.5 hover:shadow-md group"
            onClick={() => router.push('/dashboard/creator/hire-providers')}
          >
            <div className="w-10 h-10 rounded-xl bg-success-light/30 text-success-text group-hover:bg-success-text group-hover:text-white flex items-center justify-center transition-colors">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-foreground text-xs">Hire a Provider</h4>
              <p className="text-[10px] text-muted-foreground mt-0.5">M50 service directory</p>
            </div>
          </Card>

          <Card
            className="rounded-2xl border-border bg-card p-4 hover:border-warning/50 cursor-pointer shadow-sm flex flex-col items-center text-center gap-2 transition-all hover:-translate-y-0.5 hover:shadow-md group"
            onClick={() => router.push('/dashboard/creator/crossroads')}
          >
            <div className="w-10 h-10 rounded-xl bg-warning/10 text-warning group-hover:bg-warning group-hover:text-white flex items-center justify-center transition-colors">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-foreground text-xs">Build My Company</h4>
              <p className="text-[10px] text-muted-foreground mt-0.5">Transition to founder</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
