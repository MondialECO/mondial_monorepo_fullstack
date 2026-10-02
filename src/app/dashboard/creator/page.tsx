'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  Edit2,
  FileText,
  Folder,
  Layers,
  Lock,
  MessageSquare,
  Play,
  RotateCw,
  Scale,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
  ChevronRight,
  AlertTriangle,
  AlertCircle,
  Bell,
  Briefcase,
  Target,
  Plus,
  Lightbulb,
  Loader2,
  Compass,
  Rocket,
  ShieldCheck,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/app/_providers/AuthProvider';
import { useCreatorProgress } from '@/providers/CreatorProgressProvider';
import { useCreatorDashboardSummary, useMyIdeas } from '@/hooks/queries/creator';
import { useConversations } from '@/hooks/queries/chat';
import { useNotifications } from '@/hooks/queries/notifications';
import { creatorJourneyApi } from '@/lib/api-creator-journey';
import { HumainXDashboardCard } from '@/components/creator/dashboard/HumainXDashboardCard';
import type {
  CreatorDashboardSummary,
  DashboardAttentionItem,
  DashboardPhaseMilestone,
  DashboardResultItem,
  DashboardSubstage,
} from '@/types/creator/dashboard';

// Compact relative time format helper
function timeAgo(iso?: string | null): string {
  if (!iso) return '';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

// Map phase numbers to titles
const PHASE_TITLES: Record<number, string> = {
  2: 'Identity & Brand',
  3: 'Business Intelligence',
  4: 'Construction',
  5: 'The Crossroads',
};

// Map severity to style classes
function getSeverityBadge(severity?: string) {
  const norm = (severity || 'warning').toLowerCase();
  switch (norm) {
    case 'critical':
    case 'high':
      return 'bg-destructive/10 text-destructive border-destructive/20 font-bold';
    case 'warning':
    case 'medium':
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-semibold';
    case 'info':
    case 'low':
    default:
      return 'bg-muted text-muted-foreground border-border font-medium';
  }
}

// Icon helper for result categories
function getResultCategoryIcon(category: string) {
  const norm = category.toLowerCase();
  if (norm.includes('brand') || norm.includes('identity')) {
    return <Sparkles className="w-4 h-4 text-primary" />;
  }
  if (norm.includes('legal') || norm.includes('compliance')) {
    return <Scale className="w-4 h-4 text-emerald-500" />;
  }
  if (norm.includes('financial') || norm.includes('pricing') || norm.includes('forecast')) {
    return <TrendingUp className="w-4 h-4 text-blue-500" />;
  }
  if (norm.includes('market') || norm.includes('gtm') || norm.includes('launch')) {
    return <Target className="w-4 h-4 text-amber-500" />;
  }
  if (norm.includes('skills') || norm.includes('needs') || norm.includes('support')) {
    return <Users className="w-4 h-4 text-purple-500" />;
  }
  return <FileText className="w-4 h-4 text-primary" />;
}

function getResultStatusBadge(status?: string) {
  const norm = (status || '').toLowerCase();
  if (norm === 'ready' || norm === 'complete') {
    return 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5';
  }
  if (norm.includes('update') || norm.includes('available')) {
    return 'border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10';
  }
  if (norm.includes('review') || norm.includes('validation')) {
    return 'border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10';
  }
  if (norm === 'draft' || norm.includes('progress')) {
    return 'border-muted-foreground/30 text-muted-foreground bg-muted/40';
  }
  return 'border-border text-foreground bg-muted/20';
}

export default function CreatorDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { state, refetch: refetchProgress } = useCreatorProgress();
  const activeIdeaId = state.activeIdeaId;

  const [isCreatingIdea, setIsCreatingIdea] = useState(false);

  // Single authoritative summary query
  const {
    data: summary,
    isLoading: isSummaryLoading,
    isError,
    error,
    refetch,
  } = useCreatorDashboardSummary(activeIdeaId);

  // Ideas list query to know if creator has any ideas
  const { data: myIdeas, isLoading: isIdeasLoading } = useMyIdeas();

  // Live communication streams
  const conversationsQ = useConversations();
  const recentConversations = (conversationsQ.data ?? []).slice(0, 3);
  const unreadConversations = (conversationsQ.data ?? []).reduce(
    (acc, c) => acc + (c.unreadCount > 0 ? 1 : 0),
    0
  );

  const notif = useNotifications();
  const recentNotifications = (notif.notifications ?? []).slice(0, 3);

  const firstName = user?.name?.trim().split(/\s+/)[0] || 'there';

  // Handler to create a new idea directly
  const handleCreateIdea = async () => {
    if (isCreatingIdea) return;
    setIsCreatingIdea(true);
    try {
      const res = await creatorJourneyApi.createIdea();
      if (res?.ideaId) {
        await refetchProgress(res.ideaId);
        await refetch();
        router.push(`/dashboard/creator/phase-2/clarifier?ideaId=${encodeURIComponent(res.ideaId)}`);
      } else {
        router.push('/dashboard/creator/phase-2/clarifier');
      }
    } catch {
      router.push('/dashboard/creator/phase-2/clarifier');
    } finally {
      setIsCreatingIdea(false);
    }
  };

  const isLoading = isSummaryLoading || (isIdeasLoading && !summary);

  // SKELETON LOADING STATE
  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-[1120px] space-y-8 bg-background pb-12 font-sans px-4 sm:px-6 lg:px-10">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-44 w-full rounded-2xl" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-56 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  // ERROR STATE (with helpful creation fallback)
  if (isError || !summary) {
    return (
      <div className="mx-auto w-full max-w-[1120px] space-y-6 bg-background pb-12 font-sans px-4 sm:px-6 lg:px-10">
        <div className="p-8 border border-border/80 rounded-2xl bg-card text-center space-y-5 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Lightbulb className="w-7 h-7" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h2 className="text-xl font-bold text-foreground">Welcome to Creator Studio, {firstName}!</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {error instanceof Error && !error.message.includes('403')
                ? error.message
                : "You don't have any active ideas yet. Create your first business idea or start with our AI Concept Clarifier."}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button
              onClick={handleCreateIdea}
              disabled={isCreatingIdea}
              className="rounded-xl gap-2 font-bold px-5 bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
            >
              {isCreatingIdea ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create Your First Idea
            </Button>
            <Button
              asChild
              variant="outline"
              className="rounded-xl gap-2 font-semibold"
            >
              <Link href="/dashboard/creator/phase-2/clarifier">
                <Sparkles className="w-4 h-4 text-primary" /> Start AI Clarifier
              </Link>
            </Button>
            <Button onClick={() => void refetch()} variant="ghost" className="rounded-xl gap-2 text-muted-foreground">
              <RotateCw className="w-4 h-4" /> Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Project-scoped link helper
  const projectHref = (path: string) => {
    if (!activeIdeaId) return path;
    return path.includes('?')
      ? `${path}&ideaId=${encodeURIComponent(activeIdeaId)}`
      : `${path}?ideaId=${encodeURIComponent(activeIdeaId)}`;
  };

  const { project, nextAction, attentionItems, journey, results, phase5 } = summary;
  const brand = project.brand;
  const brandLogo = brand?.logoAsset || brand?.logoUrl;
  const brandDisplayName = brand?.brandName || project.name || 'Brand';
  const hasBrandLogo = Boolean(brandLogo);

  // Check if creator has an active idea or any existing ideas
  const hasIdeas =
    (myIdeas && myIdeas.length > 0) ||
    Boolean(project?.id && project.id.length > 0 && project.name && project.name !== 'Untitled Venture');

  // EMPTY STATE: If creator has zero ideas created yet
  if (!hasIdeas) {
    return (
      <div className="w-full space-y-8 bg-background pb-12 font-sans">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              aria-label="Back to dashboard"
              className="h-8 w-8 rounded-lg border-border/70"
              asChild
            >
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <span>Creator Flow</span>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30" />
              <span className="text-foreground">Getting Started</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="h-8 rounded-lg bg-card text-muted-foreground px-3 flex items-center gap-1.5 border-border text-xs">
              <Clock className="w-3.5 h-3.5" />
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="rounded-lg border-border bg-card text-foreground font-semibold text-xs h-8"
            >
              <Link href="/dashboard/creator/myideas">My Ideas</Link>
            </Button>
          </div>
        </div>

        {/* Hero Welcome Card with Create Idea CTA */}
        <Card className="rounded-3xl border-2 border-primary/30 bg-gradient-to-br from-card via-card to-primary/[0.06] p-8 sm:p-10 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10 pointer-events-none" />
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Creator Studio Command Center
            </div>
            
            <div className="space-y-3">
              <h1 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight leading-tight">
                Turn Your Vision Into a Market-Ready Venture, {firstName}!
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl">
                You haven&apos;t created any business ideas yet. Start your journey by creating your first idea or brainstorming with our AI Concept Clarifier to produce identity tokens, financial models, and commercial architecture.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Button
                onClick={handleCreateIdea}
                disabled={isCreatingIdea}
                size="lg"
                className="rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md text-sm px-6 h-12 gap-2"
              >
                {isCreatingIdea ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Plus className="w-5 h-5" />
                )}
                Create Your First Idea
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-xl font-semibold text-sm px-6 h-12 border-border/80 gap-2 bg-card hover:bg-muted/50"
              >
                <Link href="/dashboard/creator/phase-2/clarifier">
                  <Lightbulb className="w-5 h-5 text-amber-500" />
                  Brainstorm with AI Clarifier
                </Link>
              </Button>

              <Button
                asChild
                variant="ghost"
                size="lg"
                className="rounded-xl font-semibold text-sm px-5 h-12 text-muted-foreground hover:text-foreground"
              >
                <Link href="/dashboard/creator/myideas">
                  View Idea Vault <ArrowRight className="w-4 h-4 ml-1.5" />
                </Link>
              </Button>
            </div>
          </div>
        </Card>

        {/* 4-Phase Roadmap Showcase */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Compass className="w-5 h-5 text-primary" />
              Your Path from Concept to Liquidity
            </h2>
            <Badge variant="outline" className="text-xs font-semibold">4 Phases</Badge>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="rounded-2xl border-border bg-card p-5 space-y-3 hover:border-primary/40 transition-all shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                02
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground">Identity & Brand</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Clarify your core proposition, generate brand names, and craft visual tokens with AI Brand Studio.
                </p>
              </div>
              <Badge variant="outline" className="text-xs text-primary bg-primary/5 border-primary/20">
                Phase 2
              </Badge>
            </Card>

            <Card className="rounded-2xl border-border bg-card p-5 space-y-3 hover:border-primary/40 transition-all shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-sm">
                03
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground">Business Intelligence</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Synthesize 10-year financial forecasts, business plans, and verify jurisdiction compliance.
                </p>
              </div>
              <Badge variant="outline" className="text-xs text-blue-500 bg-blue-500/5 border-blue-500/20">
                Phase 3
              </Badge>
            </Card>

            <Card className="rounded-2xl border-border bg-card p-5 space-y-3 hover:border-primary/40 transition-all shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold text-sm">
                04
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground">Offer & Construction</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Design pricing models, build operational roadmap, and map required skills and resources.
                </p>
              </div>
              <Badge variant="outline" className="text-xs text-purple-500 bg-purple-500/5 border-purple-500/20">
                Phase 4
              </Badge>
            </Card>

            <Card className="rounded-2xl border-border bg-card p-5 space-y-3 hover:border-primary/40 transition-all shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-sm">
                05
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground">The Crossroads</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Choose between a direct IP buyout on the marketplace or build a company with investor backing.
                </p>
              </div>
              <Badge variant="outline" className="text-xs text-emerald-500 bg-emerald-500/5 border-emerald-500/20">
                Phase 5
              </Badge>
            </Card>
          </div>
        </div>

        {/* Live Assistant & Recent Activity streams */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <HumainXDashboardCard />
          </div>
          <div className="space-y-6">
            <Card className="rounded-2xl border-border bg-card p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  Creator Security & IP
                </h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                All ideas created in Mondial are timestamped, encrypted, and remain 100% your intellectual property until formal transfer.
              </p>
              <Button
                onClick={handleCreateIdea}
                disabled={isCreatingIdea}
                className="w-full rounded-xl text-xs font-bold h-9 bg-primary text-primary-foreground"
              >
                Start Your First Idea Now
              </Button>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Active substages extraction
  const activeMilestone = journey.phases.find(
    (p) => (p.phaseNumber ?? p.phase) === journey.currentPhase
  );
  const activeSubstages = journey.activeSubstages ?? activeMilestone?.substageProgress ?? [];

  // Overall progress percentage calculation
  const overallProgress =
    journey.overallProgress ??
    Math.round(((journey.completedPhasesCount || 0) / (journey.totalPhasesCount || 4)) * 100);

  // Chosen path extraction
  const chosenPath = phase5.chosenPath || phase5.selectedPath;

  // Time-of-day greeting for hero banner
  const currentHour = new Date().getHours();
  const timeGreeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';
  const heroGreeting = `${timeGreeting}, ${firstName} 👋`;

  // Resolved forecast artifact if present in results
  const forecastResult = results.find(
    (r) => r.key === 'financial_forecast' || r.title.toLowerCase().includes('forecast')
  );

  // Authoritative canonical forecast from dashboard summary SSoT
  const forecastSummary = summary?.forecast;

  // Resolved legal assessment if present in results
  const legalResult = results.find(
    (r) => r.key === 'legal_assessment' || r.title.toLowerCase().includes('legal')
  );

  // Truthful count of compiled reports and strategic plans
  const reportsCount = results.filter(
    (r) =>
      r.downloadable ||
      r.exportType === 'pdf' ||
      r.title.toLowerCase().includes('report') ||
      r.title.toLowerCase().includes('plan') ||
      r.title.toLowerCase().includes('assessment')
  ).length;

  return (
    <div className="w-full space-y-8 bg-background pb-12 font-sans">
      {/* Header Breadcrumbs & Quick Date */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            aria-label="Back to dashboard"
            className="h-8 w-8 rounded-lg border-border/70"
            asChild
          >
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <span>Creator Flow</span>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30" />
            <span className="text-foreground">Command Center</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="h-8 rounded-lg bg-card text-muted-foreground px-3 flex items-center gap-1.5 border-border text-xs">
            <Clock className="w-3.5 h-3.5" />
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </Badge>
          <Button
            onClick={handleCreateIdea}
            disabled={isCreatingIdea}
            size="sm"
            className="rounded-lg font-bold text-xs h-8 gap-1.5 bg-primary text-primary-foreground shadow-xs"
          >
            {isCreatingIdea ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            New Idea
          </Button>
          <Button
            variant="outline"
            size="sm"
            asChild
            className="rounded-lg border-border bg-card text-foreground font-semibold text-xs h-8"
          >
            <Link href="/dashboard/creator/myideas">Switch Idea</Link>
          </Button>
        </div>
      </div>

      {/* 1. Hero Banner (~180px height, radius 24px, padding 32px, blue gradient, right decorative pattern) */}
      <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-r from-primary via-[#3557CA] to-[#1E3A8A] text-primary-foreground p-6 sm:p-8 min-h-[180px] flex flex-col justify-between shadow-md">
        {/* Right decorative pattern */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 pointer-events-none overflow-hidden opacity-15">
          <div className="absolute -right-10 -top-10 w-64 h-64 rounded-full border-[12px] border-white/20" />
          <div className="absolute right-12 top-10 w-44 h-44 rounded-full border-[8px] border-white/15" />
          <div className="absolute -right-4 bottom-[-20px] w-52 h-52 rounded-full border-[10px] border-white/20" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/15 border border-white/20 text-white text-[11px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3 h-3" />
              Phase {nextAction.phase} · {PHASE_TITLES[nextAction.phase] || 'Next Milestone'}
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white font-heading">
              {heroGreeting}
            </h1>
            <p className="text-xs sm:text-sm font-medium text-white/90">
              {project.name || 'Your venture'} is validated. You&apos;ve reached Phase {journey.currentPhase} — {PHASE_TITLES[journey.currentPhase] || 'Active'}.
            </p>
            <div className="space-y-1 pt-1">
              <h2 className="text-base sm:text-lg font-bold text-white/95 flex items-center gap-2">
                <Zap className="w-4 h-4 fill-white text-white shrink-0" />
                {nextAction.title}
              </h2>
              <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-sans line-clamp-2">
                {nextAction.description}
              </p>
            </div>
          </div>

          <div className="relative z-10 shrink-0 self-start md:self-center">
            <Button
              asChild
              size="lg"
              className="rounded-xl font-bold bg-white text-primary hover:bg-white/90 shadow-md text-sm px-6 h-11"
            >
              <Link href={nextAction.href}>
                {nextAction.buttonLabel}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Four Metric Pills (4-card row: 4 -> 2 -> 1, radius 20px) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Clarity Score */}
        <Card className="rounded-[20px] border border-border bg-card p-5 shadow-xs flex items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Clarity Score
            </span>
            <div className="text-2xl font-black text-foreground font-heading">
              {project.clarityScore != null ? `${Math.round(project.clarityScore)}%` : '—'}
            </div>
            <p className="text-caption text-muted-foreground">
              {project.clarityScore != null ? `Phase ${journey.currentPhase} evaluated` : 'Pending Phase 2'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
        </Card>

        {/* Metric 2: AI Assets */}
        <Card className="rounded-[20px] border border-border bg-card p-5 shadow-xs flex items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              AI Assets
            </span>
            <div className="text-2xl font-black text-foreground font-heading">
              {results.length}
            </div>
            <p className="text-caption text-muted-foreground">
              {results.length === 1 ? '1 Generated' : `${results.length} Generated`}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
        </Card>

        {/* Metric 3: Legal Readiness */}
        <Card className="rounded-[20px] border border-border bg-card p-5 shadow-xs flex items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Legal Readiness
            </span>
            <div className="text-2xl font-black text-foreground font-heading">
              {project.legalReadinessPct != null
                ? `${Math.round(project.legalReadinessPct)}%`
                : (legalResult?.status || 'Pending')}
            </div>
            <p className="text-caption text-muted-foreground">
              Statutory Compliance & Legal
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </Card>

        {/* Metric 4: Reports */}
        <Card className="rounded-[20px] border border-border bg-card p-5 shadow-xs flex items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Reports
            </span>
            <div className="text-2xl font-black text-foreground font-heading">
              {reportsCount}
            </div>
            <p className="text-caption text-muted-foreground">
              {reportsCount === 1 ? '1 document compiled' : `${reportsCount} documents compiled`}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
            <Folder className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* Priority Attention Items (Only rendered if items exist) */}
      {attentionItems && attentionItems.length > 0 && (
        <Card className="rounded-[20px] border border-amber-500/30 bg-amber-500/[0.02] p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4" />
              Items Requiring Attention ({attentionItems.length})
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {attentionItems.map((item: DashboardAttentionItem) => (
              <div
                key={item.id}
                className="flex flex-col justify-between p-4 rounded-xl border border-border bg-card shadow-xs space-y-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    {/* AUDIT FIX #1: py-[1px] replacing invalid py-0.2 */}
                    <Badge variant="outline" className={`text-badge px-1.5 py-[1px] ${getSeverityBadge(item.severity)}`}>
                      {item.severity} priority
                    </Badge>
                    <span className="text-footnote text-muted-foreground">Phase {item.phase}</span>
                  </div>
                  <h3 className="text-xs font-bold text-foreground leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-caption text-muted-foreground leading-relaxed line-clamp-2">
                    {item.description}
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="w-full text-xs font-semibold rounded-lg h-8 border-border"
                >
                  <Link href={item.href}>
                    {item.actionLabel || 'Resolve'}
                    <ArrowRight className="w-3 h-3 ml-1.5" />
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 3. Bento Grid (3 Columns on Desktop, 2 on Tablet, 1 on Mobile) */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* ============================================================ */}
        {/* COLUMN 1: Project Card + Creator Journey + Phase 5 Gate       */}
        {/* ============================================================ */}
        <div className="space-y-6">
          {/* Project Card */}
          <Card className="rounded-[20px] border border-border bg-card p-6 shadow-xs space-y-4">
            <div className="flex items-start gap-4">
              {/* AUDIT FIX #2: next/image replacing raw <img /> */}
              {hasBrandLogo ? (
                <div className="w-14 h-14 rounded-2xl border border-border bg-background flex items-center justify-center overflow-hidden shrink-0 shadow-xs p-1">
                  <Image
                    src={brandLogo!}
                    alt={brandDisplayName}
                    width={56}
                    height={56}
                    className="w-full h-full object-contain rounded-xl"
                    unoptimized
                    priority={false}
                  />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary to-amber-500 text-white flex items-center justify-center font-black text-2xl shrink-0 shadow-xs">
                  {(brandDisplayName || 'P').charAt(0).toUpperCase()}
                </div>
              )}

              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-black text-foreground tracking-tight truncate font-heading">
                    {project.name || 'Untitled Venture'}
                  </h2>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  {/* Honest Sector/Category badge — zero SaaS tag */}
                  {(project.sector || project.category) && (
                    <Badge variant="outline" className="text-[11px] font-semibold border-primary/20 bg-primary/5 text-primary">
                      {project.sector || project.category}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-[11px] font-medium border-border text-muted-foreground">
                    Phase {journey.currentPhase} — {PHASE_TITLES[journey.currentPhase] || 'Active'}
                  </Badge>
                </div>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-3">
              {project.tagline || project.concept || 'Develop and refine your project identity, intelligence, and execution models.'}
            </p>

            {/* Bottom metrics: Clarity & Legal */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/60">
              <div className="p-2.5 rounded-xl bg-muted/20 border border-border/50">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                  Clarity
                </span>
                <span className="text-xs font-bold text-foreground font-mono">
                  {project.clarityScore != null ? `${Math.round(project.clarityScore)}%` : '—'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-muted/20 border border-border/50">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                  Legal
                </span>
                <span className="text-xs font-bold text-foreground font-mono">
                  {project.legalReadinessPct != null
                    ? `${Math.round(project.legalReadinessPct)}%`
                    : (legalResult?.status || 'Pending')}
                </span>
              </div>
            </div>

            <div className="pt-1">
              <Button variant="outline" size="sm" asChild className="w-full rounded-xl border-border text-xs h-8 font-semibold">
                <Link href={projectHref('/dashboard/creator/phase-2')}>
                  Full Details <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Link>
              </Button>
            </div>
          </Card>

          {/* Creator Journey Card */}
          <Card className="rounded-[20px] border border-border bg-card p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2 font-heading">
                  <Layers className="w-4 h-4 text-primary" />
                  Creator Journey
                </h3>
                <p className="text-xs text-muted-foreground">
                  Phase {journey.currentPhase} — {PHASE_TITLES[journey.currentPhase] || 'Active'}
                </p>
              </div>
              <Badge variant="outline" className="text-xs font-semibold">
                {overallProgress}% Complete
              </Badge>
            </div>

            {/* Progress bar */}
            <Progress value={overallProgress} className="h-2 rounded-full" />

            {/* 4-Step Stepper Bar */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {journey.phases.map((phaseItem: DashboardPhaseMilestone) => {
                const phaseNum = phaseItem.phaseNumber ?? phaseItem.phase ?? 2;
                const isCompleted = phaseItem.status === 'Completed';
                const isInProgress = phaseItem.status === 'In Progress';
                const isLocked = phaseItem.status === 'Locked';

                return (
                  <div
                    key={phaseNum}
                    className={`flex flex-col p-2.5 rounded-xl border transition-all ${
                      isInProgress
                        ? 'border-primary/50 bg-primary/5'
                        : isCompleted
                        ? 'border-emerald-500/30 bg-emerald-500/5'
                        : 'border-border/60 bg-muted/10 opacity-70'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-footnote font-bold text-muted-foreground font-mono">
                        Phase {phaseNum}
                      </span>
                      {isCompleted ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : isLocked ? (
                        <Lock className="w-3.5 h-3.5 text-muted-foreground/60" />
                      ) : (
                        <Play className="w-3 h-3 text-primary fill-primary" />
                      )}
                    </div>
                    <span className="text-xs font-bold text-foreground truncate">
                      {phaseItem.title}
                    </span>
                    <span className="text-caption text-muted-foreground mt-0.5">
                      {phaseItem.status}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Active Phase Substages */}
            {activeSubstages && activeSubstages.length > 0 && (
              <div className="space-y-2.5 pt-3 border-t border-border/60">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground">
                    Phase {journey.currentPhase} Milestones
                  </span>
                  <span className="text-muted-foreground font-mono">
                    {activeSubstages.filter((s: DashboardSubstage) => s.isCompleted ?? s.status === 'Completed').length} of {activeSubstages.length} done
                  </span>
                </div>

                <div className="space-y-1.5">
                  {activeSubstages.map((sub: DashboardSubstage) => {
                    const subKey = sub.key || sub.id || sub.label;
                    const subTitle = sub.title || sub.label;
                    const isSubDone = sub.isCompleted ?? sub.status === 'Completed';

                    return (
                      <Link
                        key={subKey}
                        href={sub.href}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-border/70 hover:border-primary/40 hover:bg-muted/10 transition-colors group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
                              isSubDone
                                ? 'bg-emerald-500 text-white'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {isSubDone ? <Check className="w-2.5 h-2.5" /> : '•'}
                          </div>
                          <span className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                            {subTitle}
                          </span>
                        </div>
                        {/* AUDIT FIX #1: py-[1px] replacing invalid py-0.2 */}
                        <Badge
                          variant="outline"
                          className={`text-badge px-1.5 py-[1px] ${
                            isSubDone
                              ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5'
                              : 'border-border text-muted-foreground'
                          }`}
                        >
                          {sub.status}
                        </Badge>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>

          {/* Phase 5 Crossroads Gate Banner */}
          <Card
            className={`rounded-[20px] p-5 transition-all ${
              phase5.isUnlocked
                ? 'border-2 border-primary/40 bg-gradient-to-r from-primary/[0.04] to-amber-500/[0.04] shadow-xs'
                : 'border border-border/70 bg-muted/15'
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    phase5.isUnlocked
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {phase5.isUnlocked ? (
                    <Sparkles className="w-5 h-5 text-primary" />
                  ) : (
                    <Lock className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>

                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h3 className="text-xs font-bold text-foreground">
                      Phase 5 — The Crossroads
                    </h3>
                    <Badge
                      variant="outline"
                      className={`text-badge font-semibold ${
                        phase5.isUnlocked
                          ? 'border-emerald-500/30 text-emerald-600 bg-emerald-500/10'
                          : 'border-border text-muted-foreground'
                      }`}
                    >
                      {phase5.isUnlocked ? 'Unlocked' : 'Locked'}
                    </Badge>
                    {chosenPath && (
                      <Badge variant="secondary" className="text-badge font-semibold">
                        Path: {chosenPath === 'sell' ? 'Full Buyout' : 'Build Company'}
                      </Badge>
                    )}
                  </div>
                  <p className="text-caption text-muted-foreground leading-relaxed">
                    {phase5.guidanceText}
                  </p>
                </div>
              </div>

              <div>
                {phase5.isUnlocked ? (
                  <Button
                    asChild
                    className="w-full rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/95 text-xs px-4 h-9 shadow-xs"
                  >
                    <Link href={phase5.href}>
                      Enter The Crossroads
                      <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </Link>
                  </Button>
                ) : (
                  <Button
                    disabled
                    variant="outline"
                    className="w-full rounded-xl text-xs font-semibold h-9 border-border text-muted-foreground/60 cursor-not-allowed"
                  >
                    <Lock className="w-3.5 h-3.5 mr-1.5" />
                    Crossroads Locked
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* ============================================================ */}
        {/* COLUMN 2: AI Financial Forecast + Asset Library               */}
        {/* ============================================================ */}
        <div className="space-y-6">
          {/* AI Financial Forecast Card */}
          <Card className="rounded-[20px] border border-border bg-card p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground font-heading">AI Financial Forecast</h3>
                  <p className="text-caption text-muted-foreground">Step 3.3 Synthesis</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" asChild className="h-7 text-xs font-semibold text-primary hover:text-primary/80 px-2">
                <Link href={forecastResult?.href || projectHref('/dashboard/creator/phase-3/forecast')}>
                  View Full <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </Button>
            </div>

            {/* 3 mini stats matching Figma */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-muted/20 border border-border/60 text-center">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block truncate">
                  Revenue projection
                </span>
                <span className="text-xs font-black text-foreground font-mono truncate block">
                  {forecastSummary?.revenueProjection != null
                    ? new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: forecastSummary.currency || 'EUR',
                        maximumFractionDigits: 0,
                      }).format(forecastSummary.revenueProjection)
                    : '—'}
                </span>
              </div>
              <div className="space-y-0.5 border-x border-border/60">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block truncate">
                  Starting From
                </span>
                <span className="text-xs font-black text-foreground font-mono truncate block">
                  {forecastSummary?.breakEvenMonth != null
                    ? `Month ${forecastSummary.breakEvenMonth}`
                    : '—'}
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block truncate">
                  Model Type
                </span>
                <span className="text-xs font-black text-foreground font-mono truncate block">
                  {project.category || project.sector || 'Deterministic'}
                </span>
              </div>
            </div>

            {/* Compact Bar Chart (Figma-style proportional visual bars) */}
            <div className="space-y-2 pt-1">
              <div className="flex items-end justify-between gap-3 h-24 px-3 pt-2 border-b border-border/50">
                {[
                  { month: 'M3', height: '30%' },
                  { month: 'M12', height: '52%' },
                  { month: 'M24', height: '76%' },
                  { month: 'M36', height: '100%' },
                ].map((bar) => (
                  <div key={bar.month} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                    <div
                      className="w-full rounded-t-md bg-primary/70 group-hover:bg-primary transition-all duration-300"
                      style={{ height: bar.height }}
                    />
                    <span className="text-[10px] font-mono text-muted-foreground">{bar.month}</span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground text-center">
                36-Month deterministic projection from Step 3.3 Financial Forecast
              </p>
            </div>
          </Card>

          {/* Asset Library / Verified Outputs Card */}
          <Card className="rounded-[20px] border border-border bg-card p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2 font-heading">
                  <FileText className="w-4 h-4 text-primary" />
                  Verified Outputs & Assets ({results.length})
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Authoritative artifacts and plans compiled
                </p>
              </div>
              <Button variant="outline" size="sm" asChild className="rounded-lg text-xs h-7 border-border px-2.5">
                <Link href={projectHref('/dashboard/creator/documents')}>View Vault</Link>
              </Button>
            </div>

            {results.length === 0 ? (
              <div className="p-6 border border-dashed border-border rounded-xl text-center space-y-2 bg-muted/10 flex flex-col items-center justify-center">
                <Folder className="w-7 h-7 text-muted-foreground/40" />
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-foreground">No outputs generated yet</h4>
                  <p className="text-caption text-muted-foreground max-w-sm leading-relaxed">
                    As you complete each stage of your Creator journey, finalized plans and models will appear here.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {results.slice(0, 4).map((item: DashboardResultItem) => {
                  const itemKey = item.key || item.id || item.title;
                  const itemCategory =
                    item.category ||
                    (item.phase === 2
                      ? 'Brand'
                      : item.phase === 3
                      ? 'Intelligence'
                      : 'Construction');
                  const itemTime = item.updatedAtUtc || item.updatedAt;

                  return (
                    <Link
                      key={itemKey}
                      href={item.href}
                      className="flex flex-col justify-between p-3.5 rounded-xl border border-border/70 hover:border-primary/50 hover:bg-muted/10 transition-all group space-y-2.5"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <div className="p-1 rounded-md bg-primary/10">
                              {getResultCategoryIcon(itemCategory)}
                            </div>
                            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider font-mono">
                              {itemCategory}
                            </span>
                          </div>
                          {/* AUDIT FIX #1: py-[1px] replacing invalid py-0.2 */}
                          <Badge
                            variant="outline"
                            className={`text-badge font-semibold px-2 py-[1px] ${getResultStatusBadge(item.status)}`}
                          >
                            {item.status}
                          </Badge>
                        </div>

                        <h4 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                          {item.title}
                        </h4>
                      </div>

                      <div className="flex items-center justify-between text-footnote text-muted-foreground pt-1 border-t border-border/40">
                        <span>{timeAgo(itemTime)}</span>
                        <span className="flex items-center gap-1 font-semibold group-hover:text-foreground">
                          Open Asset
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* ============================================================ */}
        {/* COLUMN 3: Messages + Notifications + Marketplace + HumainX    */}
        {/* ============================================================ */}
        <div className="space-y-6">
          {/* Messages Card */}
          <Card className="rounded-[20px] border border-border bg-card shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2 font-heading">
                <MessageSquare className="w-4 h-4 text-amber-500" />
                Messages
              </h3>
              {unreadConversations > 0 && (
                <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold text-badge border-0 px-2 py-0.5">
                  {unreadConversations} new
                </Badge>
              )}
            </div>

            {conversationsQ.isLoading ? (
              <div className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-10 w-full rounded-lg" />
                ))}
              </div>
            ) : conversationsQ.isError ? (
              <div className="flex flex-col items-center gap-2 py-4 text-center">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <p className="text-caption text-destructive">Couldn&apos;t load messages.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => conversationsQ.refetch()}
                  className="gap-1.5 text-xs h-7"
                >
                  <RotateCw className="w-3 h-3" /> Retry
                </Button>
              </div>
            ) : recentConversations.length === 0 ? (
              <div className="text-center py-5 space-y-1">
                <p className="text-xs font-semibold text-foreground">No messages yet</p>
                <p className="text-caption text-muted-foreground leading-relaxed">
                  Messages with service providers and partners will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentConversations.map((c) => {
                  const other = c.participants?.find((p) => p.id !== user?.id) ?? c.participants?.[0];
                  const name = other?.name?.trim() || 'Conversation';
                  const initials =
                    name
                      .split(/\s+/)
                      .map((w) => w[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase() || '?';

                  return (
                    <Link
                      key={c.id}
                      href={`/dashboard/creator/messages?c=${c.id}`}
                      className="flex items-center gap-2.5 hover:bg-muted/10 p-1.5 rounded-lg transition-colors"
                    >
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-primary to-amber-500 text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <h4 className="text-xs font-bold text-foreground truncate">{name}</h4>
                          <span className="text-footnote text-muted-foreground shrink-0 ml-1">
                            {timeAgo(c.lastMessageAt)}
                          </span>
                        </div>
                        <p className="text-caption text-muted-foreground truncate">
                          {c.lastMessage || 'No messages yet.'}
                        </p>
                      </div>
                      {c.unreadCount > 0 && <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />}
                    </Link>
                  );
                })}

                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="w-full text-xs rounded-xl h-8 mt-1 font-bold text-muted-foreground hover:text-foreground"
                >
                  <Link href="/dashboard/creator/messages">
                    <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                    Open Messenger
                  </Link>
                </Button>
              </div>
            )}
          </Card>

          {/* Notifications Card */}
          <Card className="rounded-[20px] border border-border bg-card shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2 font-heading">
                <Bell className="w-4 h-4 text-emerald-500" />
                Notifications
              </h3>
              {notif.unreadCount > 0 && (
                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-badge border-0 px-2 py-0.5">
                  {notif.unreadCount} new
                </Badge>
              )}
            </div>

            {notif.isLoading ? (
              <div className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-8 w-full rounded-lg" />
                ))}
              </div>
            ) : notif.isError ? (
              <div className="flex flex-col items-center gap-2 py-4 text-center">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <p className="text-caption text-destructive">Couldn&apos;t load notifications.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => notif.refetch()}
                  className="gap-1.5 text-xs h-7"
                >
                  <RotateCw className="w-3 h-3" /> Retry
                </Button>
              </div>
            ) : recentNotifications.length === 0 ? (
              <p className="text-caption text-muted-foreground text-center py-4 leading-relaxed">
                You&apos;re all caught up — no new notifications.
              </p>
            ) : (
              <div className="space-y-2.5">
                {recentNotifications.map((n) => (
                  <div key={n.id} className="flex gap-2 items-start">
                    <div
                      className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                        n.isRead ? 'bg-muted-foreground/30' : 'bg-emerald-500'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground leading-snug">{n.title || n.body}</p>
                      {n.title && n.body && (
                        <p className="text-caption text-muted-foreground truncate">{n.body}</p>
                      )}
                      <span className="text-footnote text-muted-foreground mt-0.5 block">
                        {timeAgo(n.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="w-full text-xs rounded-xl h-8 mt-1 font-bold text-muted-foreground hover:text-foreground"
                >
                  <Link href="/dashboard/creator/notifications">
                    <Bell className="w-3.5 h-3.5 mr-1.5" />
                    View All Notifications
                  </Link>
                </Button>
              </div>
            )}
          </Card>

          {/* Marketplace & Liquidity Card */}
          <Card className="rounded-[20px] border border-border bg-card p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 font-heading">
                <Users className="w-4 h-4 text-purple-500" />
                Marketplace
              </h3>
              <Badge variant="outline" className="text-[10px] font-mono">Phase 5</Badge>
            </div>
            <div>
              <h4 className="text-xs font-bold text-foreground">
                {phase5.isUnlocked
                  ? chosenPath === 'sell'
                    ? 'Acquisition & Buyout Portal'
                    : 'Cap Table & Investor Matching'
                  : 'Liquidity & Services Network'}
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                {phase5.isUnlocked && chosenPath === 'sell'
                  ? 'Full Buyout pathway selected at The Crossroads. Connect with verified buyers and review M&A parameters.'
                  : phase5.isUnlocked && chosenPath === 'build'
                  ? 'Company Building pathway selected. Prepare cap table, syndicate allocations, and investor matching.'
                  : 'Marketplace listing and direct buyout bids unlock upon completing all Construction stages in Phase 5.'}
              </p>
            </div>
            <div className="pt-1 flex items-center justify-between">
              <span className="text-footnote text-muted-foreground">
                Listing: <span className="font-semibold text-foreground">{phase5.isUnlocked ? 'Active' : 'Gated'}</span>
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="w-full text-xs font-semibold rounded-lg h-8 border-border"
            >
              <Link href={projectHref(phase5.isUnlocked ? '/dashboard/creator/crossroads' : '/marketplace/services')}>
                {phase5.isUnlocked ? 'Open Crossroads' : 'Browse Services'}
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Link>
            </Button>
          </Card>

          {/* HumainX Dashboard Card */}
          <HumainXDashboardCard ideaId={activeIdeaId} />
        </div>
      </div>

      {/* 4. Quick Actions (Figma 4-card row: 4 -> 2 -> 1, radius 20px) */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground font-heading uppercase tracking-wider text-muted-foreground">
            Quick Actions
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Action 1: Create / generate an important project output */}
          <Button
            variant="outline"
            size="sm"
            asChild
            className="h-14 justify-start p-4 text-xs font-semibold rounded-[20px] border-border bg-card hover:border-primary/40 hover:bg-muted/10 transition-all shadow-xs"
          >
            <Link href={projectHref('/dashboard/creator/phase-3/business-plan')}>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 mr-2.5 shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div className="text-left min-w-0">
                <span className="block font-bold text-foreground truncate">Business Plan</span>
                <span className="block text-[11px] text-muted-foreground font-normal truncate">Synthesize executive plan</span>
              </div>
            </Link>
          </Button>

          {/* Action 2: Marketplace action */}
          <Button
            variant="outline"
            size="sm"
            asChild
            className="h-14 justify-start p-4 text-xs font-semibold rounded-[20px] border-border bg-card hover:border-primary/40 hover:bg-muted/10 transition-all shadow-xs"
          >
            <Link href="/marketplace/services">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500 mr-2.5 shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div className="text-left min-w-0">
                <span className="block font-bold text-foreground truncate">Marketplace</span>
                <span className="block text-[11px] text-muted-foreground font-normal truncate">Browse ecosystem services</span>
              </div>
            </Link>
          </Button>

          {/* Action 3: Find/hire provider action */}
          <Button
            variant="outline"
            size="sm"
            asChild
            className="h-14 justify-start p-4 text-xs font-semibold rounded-[20px] border-border bg-card hover:border-primary/40 hover:bg-muted/10 transition-all shadow-xs"
          >
            <Link href={projectHref('/dashboard/creator/phase-2/hire-designer')}>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 mr-2.5 shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="text-left min-w-0">
                <span className="block font-bold text-foreground truncate">Hire Providers</span>
                <span className="block text-[11px] text-muted-foreground font-normal truncate">Design & legal experts</span>
              </div>
            </Link>
          </Button>

          {/* Action 4: Build/continue company action */}
          <Button
            variant="outline"
            size="sm"
            asChild
            className="h-14 justify-start p-4 text-xs font-semibold rounded-[20px] border-border bg-card hover:border-primary/40 hover:bg-muted/10 transition-all shadow-xs"
          >
            <Link href={projectHref('/dashboard/creator/phase-4')}>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 mr-2.5 shrink-0">
                <Briefcase className="w-4 h-4" />
              </div>
              <div className="text-left min-w-0">
                <span className="block font-bold text-foreground truncate">Construction</span>
                <span className="block text-[11px] text-muted-foreground font-normal truncate">Roadmap & strategy</span>
              </div>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
