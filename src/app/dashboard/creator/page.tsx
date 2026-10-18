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
import { useTranslation } from '@/hooks/useTranslation';
import type {
  CreatorDashboardSummary,
  DashboardAttentionItem,
  DashboardPhaseMilestone,
  DashboardResultItem,
  DashboardSubstage,
} from '@/types/creator/dashboard';

// Compact relative time format helper
function timeAgo(iso?: string | null, t?: (key: string, vars?: Record<string, string | number>) => string): string {
  if (!iso) return '';
  const tTime = new Date(iso).getTime();
  if (Number.isNaN(tTime)) return '';
  const s = Math.floor((Date.now() - tTime) / 1000);
  if (s < 60) return t ? t('common.now') : 'now';
  if (s < 3600) return t ? t('common.minutesAgo', { count: Math.floor(s / 60) }) : `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return t ? t('common.hoursAgo', { count: Math.floor(s / 3600) }) : `${Math.floor(s / 3600)}h ago`;
  return t ? t('common.daysAgo', { count: Math.floor(s / 86400) }) : `${Math.floor(s / 86400)}d ago`;
}

// Map phase numbers to titles (fallback)
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
  const { t, formatDate, locale } = useTranslation();
  const getPhaseTitle = (phaseNum: number) => t(`creator.phases.${phaseNum}`) || PHASE_TITLES[phaseNum] || 'Active';
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
            <h2 className="text-xl font-bold text-foreground">{t('creator.dashboard.welcome', 'Welcome to Creator Studio,')} {firstName}!</h2>
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
              {t('creator.dashboard.createFirstIdea', 'Create Your First Idea')}
            </Button>
            <Button
              asChild
              variant="outline"
              className="rounded-xl gap-2 font-semibold"
            >
              <Link href="/dashboard/creator/phase-2/clarifier">
                <Sparkles className="w-4 h-4 text-primary" /> {t('creator.dashboard.startClarifier', 'Start AI Clarifier')}
              </Link>
            </Button>
            <Button onClick={() => void refetch()} variant="ghost" className="rounded-xl gap-2 text-muted-foreground">
              <RotateCw className="w-4 h-4" />{t('creator.dashboard.tryAgain', 'Try Again')}</Button>
          </div>
        </div>
      </div>
    );
  }

  // Project-scoped link helper
  const effectiveIdeaId = activeIdeaId || summary?.project?.id;
  const projectHref = (path: string) => {
    if (!effectiveIdeaId) return path;
    const [basePath, search] = path.split('?');
    const params = new URLSearchParams(search || '');
    params.set('ideaId', effectiveIdeaId);
    const queryString = params.toString();
    return queryString ? `${basePath}?${queryString}` : basePath;
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
              aria-label={t('creator.dashboard.backToDashboard', 'Back to dashboard')}
              className="h-8 w-8 rounded-lg border-border/70"
              asChild
            >
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <span>{t('creator.dashboard.creatorFlow', 'Creator Flow')}</span>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30" />
              <span className="text-foreground">{t('creator.dashboard.gettingStarted', 'Getting Started')}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="h-8 rounded-lg bg-card text-muted-foreground px-3 flex items-center gap-1.5 border-border text-xs">
              <Clock className="w-3.5 h-3.5" />
              {formatDate(new Date(), { weekday: 'short', month: 'short', day: 'numeric' })}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="rounded-lg border-border bg-card text-foreground font-semibold text-xs h-8"
            >
              <Link href="/dashboard/creator/myideas">{t('creator.dashboard.myIdeas')}</Link>
            </Button>
          </div>
        </div>

        {/* Hero Welcome Card with Create Idea CTA */}
        <Card className="rounded-3xl border-2 border-primary/30 bg-gradient-to-br from-card via-card to-primary/[0.06] p-8 sm:p-10 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10 pointer-events-none" />
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              {t('creator.dashboard.commandCenterBadge')}
            </div>
            
            <div className="space-y-3">
              <h1 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight leading-tight">
                {t('creator.dashboard.turnVisionTitle', { name: firstName })}
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl">
                {t('creator.dashboard.emptyDescription')}
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
                {t('creator.dashboard.createFirstIdea')}
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-xl font-semibold text-sm px-6 h-12 border-border/80 gap-2 bg-card hover:bg-muted/50"
              >
                <Link href="/dashboard/creator/phase-2/clarifier">
                  <Lightbulb className="w-5 h-5 text-amber-500" />
                  {t('creator.dashboard.brainstormWithClarifier')}
                </Link>
              </Button>

              <Button
                asChild
                variant="ghost"
                size="lg"
                className="rounded-xl font-semibold text-sm px-5 h-12 text-muted-foreground hover:text-foreground"
              >
                <Link href="/dashboard/creator/myideas">
                  {t('creator.dashboard.viewIdeaVault')} <ArrowRight className="w-4 h-4 ml-1.5" />
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
              {t('creator.dashboard.pathTitle')}
            </h2>
            <Badge variant="outline" className="text-xs font-semibold">{t('creator.dashboard.fourPhases')}</Badge>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="rounded-2xl border-border bg-card p-5 space-y-3 hover:border-primary/40 transition-all shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                02
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground">{t('creator.dashboard.roadmap.phase2Title')}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t('creator.dashboard.roadmap.phase2Desc')}
                </p>
              </div>
              <Badge variant="outline" className="text-xs text-primary bg-primary/5 border-primary/20">{'Phase 2'}</Badge>
            </Card>

            <Card className="rounded-2xl border-border bg-card p-5 space-y-3 hover:border-primary/40 transition-all shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-sm">
                03
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground">{t('creator.dashboard.roadmap.phase3Title')}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t('creator.dashboard.roadmap.phase3Desc')}
                </p>
              </div>
              <Badge variant="outline" className="text-xs text-blue-500 bg-blue-500/5 border-blue-500/20">{'Phase 3'}</Badge>
            </Card>

            <Card className="rounded-2xl border-border bg-card p-5 space-y-3 hover:border-primary/40 transition-all shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold text-sm">
                04
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground">{t('creator.dashboard.roadmap.phase4Title')}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t('creator.dashboard.roadmap.phase4Desc')}
                </p>
              </div>
              <Badge variant="outline" className="text-xs text-purple-500 bg-purple-500/5 border-purple-500/20">{'Phase 4'}</Badge>
            </Card>

            <Card className="rounded-2xl border-border bg-card p-5 space-y-3 hover:border-primary/40 transition-all shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-sm">
                05
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground">{t('creator.dashboard.roadmap.phase5Title')}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t('creator.dashboard.roadmap.phase5Desc')}
                </p>
              </div>
              <Badge variant="outline" className="text-xs text-emerald-500 bg-emerald-500/5 border-emerald-500/20">{'Phase 5'}</Badge>
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
                  {t('creator.dashboard.securityTitle', 'Creator Security & IP')}
                </h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t('creator.dashboard.securityDesc', 'All ideas created in Mondial are timestamped, encrypted, and remain 100% your intellectual property until formal transfer.')}
              </p>
              <Button
                onClick={handleCreateIdea}
                disabled={isCreatingIdea}
                className="w-full rounded-xl text-xs font-bold h-9 bg-primary text-primary-foreground"
              >
                {t('creator.dashboard.startFirstIdeaNow', 'Start Your First Idea Now')}
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
  const greetingKey = currentHour < 12 ? 'creator.dashboard.hero.goodMorning' : currentHour < 18 ? 'creator.dashboard.hero.goodAfternoon' : 'creator.dashboard.hero.goodEvening';
  const heroGreeting = `${t(greetingKey, { name: firstName })} 👋`;

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

  // Truthful count {' '}{t('creator.dashboard.of', 'of')}{' '} compiled reports and strategic plans
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
            aria-label={t('creator.dashboard.backToDashboard', 'Back to dashboard')}
            className="h-8 w-8 rounded-lg border-border/70"
            asChild
          >
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <span>{t('creator.dashboard.creatorFlow', 'Creator Flow')}</span>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30" />
            <span className="text-foreground">{t('creator.dashboard.commandCenter', 'Command Center')}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="h-8 rounded-lg bg-card text-muted-foreground px-3 flex items-center gap-1.5 border-border text-xs">
            <Clock className="w-3.5 h-3.5" />
            {formatDate(new Date(), { weekday: 'short', month: 'short', day: 'numeric' })}
          </Badge>
          <Button
            onClick={handleCreateIdea}
            disabled={isCreatingIdea}
            size="sm"
            className="rounded-lg font-bold text-xs h-8 gap-1.5 bg-primary text-primary-foreground shadow-xs"
          >
            {isCreatingIdea ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            {t('creator.dashboard.newIdea')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            asChild
            className="rounded-lg border-border bg-card text-foreground font-semibold text-xs h-8"
          >
            <Link href="/dashboard/creator/myideas">{t('creator.dashboard.switchIdea')}</Link>
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
              {t('creator.dashboard.phase', 'Phase')} {nextAction.phase}{' · '}{getPhaseTitle(nextAction.phase)}
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white font-heading">
              {heroGreeting}
            </h1>
            <p className="text-xs sm:text-sm font-medium text-white/90">
              {t('creator.dashboard.hero.ventureValidated', {
                name: project.name || 'Your venture',
                phase: journey.currentPhase,
                phaseTitle: getPhaseTitle(journey.currentPhase),
              })}
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
              {t('creator.dashboard.metrics.clarityScore')}
            </span>
            <div className="text-2xl font-black text-foreground font-heading">
              {project.clarityScore != null ? `${Math.round(project.clarityScore)}%` : '—'}
            </div>
            <p className="text-caption text-muted-foreground">
              {project.clarityScore != null
                ? t('creator.dashboard.metrics.phaseEvaluated', { phase: journey.currentPhase })
                : t('creator.dashboard.metrics.pendingPhase2')}
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
              {t('creator.dashboard.metrics.aiAssets')}
            </span>
            <div className="text-2xl font-black text-foreground font-heading">
              {results.length}
            </div>
            <p className="text-caption text-muted-foreground">
              {results.length === 1
                ? t('creator.dashboard.metrics.oneGenerated')
                : t('creator.dashboard.metrics.multipleGenerated', { count: results.length })}
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
              {t('creator.dashboard.metrics.legalReadiness')}
            </span>
            <div className="text-2xl font-black text-foreground font-heading">
              {project.legalReadinessPct != null
                ? `${Math.round(project.legalReadinessPct)}%`
                : (legalResult?.status || t('creator.dashboard.metrics.pending'))}
            </div>
            <p className="text-caption text-muted-foreground">
              {t('creator.dashboard.metrics.statutoryCompliance')}
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
              {t('creator.dashboard.metrics.reports')}
            </span>
            <div className="text-2xl font-black text-foreground font-heading">
              {reportsCount}
            </div>
            <p className="text-caption text-muted-foreground">
              {reportsCount === 1
                ? t('creator.dashboard.metrics.oneDocumentCompiled')
                : t('creator.dashboard.metrics.multipleDocumentsCompiled', { count: reportsCount })}
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
              {t('creator.dashboard.attention.title', { count: attentionItems.length })}
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
                      {t('creator.dashboard.attention.priorityBadge', { severity: item.severity })}
                    </Badge>
                    <span className="text-footnote text-muted-foreground">
                      {t('creator.dashboard.attention.phase', { phase: item.phase })}
                    </span>
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
                    {item.actionLabel || t('creator.dashboard.attention.resolve')}
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
                    {t('creator.dashboard.phase', 'Phase')} {journey.currentPhase}{' — '}{getPhaseTitle(journey.currentPhase)}
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
                  {t('creator.dashboard.bento.projectCard.clarity')}
                </span>
                <span className="text-xs font-bold text-foreground font-mono">
                  {project.clarityScore != null ? `${Math.round(project.clarityScore)}%` : '—'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-muted/20 border border-border/50">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                  {t('creator.dashboard.bento.projectCard.legal')}
                </span>
                <span className="text-xs font-bold text-foreground font-mono">
                  {project.legalReadinessPct != null
                    ? `${Math.round(project.legalReadinessPct)}%`
                    : (legalResult?.status || t('creator.dashboard.metrics.pending'))}
                </span>
              </div>
            </div>

            <div className="pt-1">
              <Button variant="outline" size="sm" asChild className="w-full rounded-xl border-border text-xs h-8 font-semibold">
                <Link href={projectHref('/dashboard/creator/phase-2')}>
                  {t('creator.dashboard.bento.projectCard.fullDetails')} <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
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
                  {t('creator.dashboard.bento.journey.title')}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {t('creator.dashboard.phase', 'Phase')} {journey.currentPhase}{' — '}{getPhaseTitle(journey.currentPhase)}
                </p>
              </div>
              <Badge variant="outline" className="text-xs font-semibold">
                {t('creator.dashboard.bento.journey.percentComplete', { percent: overallProgress })}
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
                        {t('creator.dashboard.phase', 'Phase')} {phaseNum}
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
                    {t('creator.dashboard.phase', 'Phase')} {journey.currentPhase} {t('creator.dashboard.milestones', 'Milestones')}
                  </span>
                  <span className="text-muted-foreground font-mono">
                    {activeSubstages.filter((s: DashboardSubstage) => s.isCompleted ?? s.status === 'Completed').length} {t('creator.dashboard.of', 'of')} {activeSubstages.length} {' '}{t('creator.dashboard.done', 'done')}
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
                      {t('creator.dashboard.bento.phase5Gate.title')}
                    </h3>
                    <Badge
                      variant="outline"
                      className={`text-badge font-semibold ${
                        phase5.isUnlocked
                          ? 'border-emerald-500/30 text-emerald-600 bg-emerald-500/10'
                          : 'border-border text-muted-foreground'
                      }`}
                    >
                      {phase5.isUnlocked ? t('creator.dashboard.bento.phase5Gate.unlocked') : t('creator.dashboard.bento.phase5Gate.locked')}
                    </Badge>
                    {chosenPath && (
                      <Badge variant="secondary" className="text-badge font-semibold">
                        {t('creator.dashboard.path', 'Path:')} {chosenPath === 'sell' ? t('creator.crossroads.fullBuyout', 'Full Buyout') : t('creator.crossroads.buildTitle', 'Build Company')}
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
                      {t('creator.dashboard.bento.phase5Gate.enterCrossroads')}
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
                    {t('creator.dashboard.bento.phase5Gate.crossroadsLocked')}
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
                  <h3 className="text-sm font-bold text-foreground font-heading">
                    {t('creator.dashboard.bento.forecast.title')}
                  </h3>
                  <p className="text-caption text-muted-foreground">
                    {t('creator.dashboard.bento.forecast.subtitle')}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" asChild className="h-7 text-xs font-semibold text-primary hover:text-primary/80 px-2">
                <Link href={projectHref('/dashboard/creator/phase-3/forecast')}>
                  {t('creator.dashboard.bento.forecast.viewFull')} <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </Button>
            </div>

            {/* 3 mini stats matching Figma */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-muted/20 border border-border/60 text-center">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block truncate">
                  {t('creator.dashboard.bento.forecast.revenueProjection')}
                </span>
                <span className="text-xs font-black text-foreground font-mono truncate block">
                  {forecastSummary?.revenueProjection != null
                    ? new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
                        style: 'currency',
                        currency: forecastSummary.currency || 'EUR',
                        maximumFractionDigits: 0,
                      }).format(forecastSummary.revenueProjection)
                    : '—'}
                </span>
              </div>
              <div className="space-y-0.5 border-x border-border/60">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block truncate">
                  {t('creator.dashboard.startingFrom', 'Starting From')}
                </span>
                <span className="text-xs font-black text-foreground font-mono truncate block">
                  {forecastSummary?.breakEvenMonth != null
                    ? `Month ${forecastSummary.breakEvenMonth}`
                    : '—'}
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block truncate">
                  {t('creator.dashboard.modelType', 'Model Type')}
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
                {t('creator.dashboard.bento.forecast.chartCaption')}
              </p>
            </div>
          </Card>

          {/* Asset Library / Verified Outputs Card */}
          <Card className="rounded-[20px] border border-border bg-card p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2 font-heading">
                  <FileText className="w-4 h-4 text-primary" />
                  {t('creator.dashboard.bento.outputs.title', { count: results.length })}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t('creator.dashboard.bento.outputs.subtitle')}
                </p>
              </div>
              <Button variant="outline" size="sm" asChild className="rounded-lg text-xs h-7 border-border px-2.5">
                <Link href={projectHref('/dashboard/creator/asset-library')}>{t('creator.dashboard.bento.outputs.viewAll')}</Link>
              </Button>
            </div>

            {results.length === 0 ? (
              <div className="p-6 border border-dashed border-border rounded-xl text-center space-y-2 bg-muted/10 flex flex-col items-center justify-center">
                <Folder className="w-7 h-7 text-muted-foreground/40" />
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-foreground">{t('creator.dashboard.bento.outputs.noOutputsTitle')}</h4>
                  <p className="text-caption text-muted-foreground max-w-sm leading-relaxed">
                    {t('creator.dashboard.bento.outputs.noOutputsDesc')}
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
                        <span>{timeAgo(itemTime, t)}</span>
                        <span className="flex items-center gap-1 font-semibold group-hover:text-foreground">
                          {t('creator.dashboard.bento.outputs.openAsset')}
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
                {t('creator.dashboard.bento.communication.messagesTitle')}
              </h3>
              {unreadConversations > 0 && (
                <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold text-badge border-0 px-2 py-0.5">
                  {t('creator.dashboard.bento.communication.newMessages', { count: unreadConversations })}
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
                <p className="text-caption text-destructive">{t('creator.dashboard.cantLoadMessages', "Couldn't load messages.")}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => conversationsQ.refetch()}
                  className="gap-1.5 text-xs h-7"
                >
                  <RotateCw className="w-3 h-3" /> {t('creator.dashboard.bento.communication.retry')}
                </Button>
              </div>
            ) : recentConversations.length === 0 ? (
              <div className="text-center py-5 space-y-1">
                <p className="text-xs font-semibold text-foreground">{t('creator.dashboard.bento.communication.noMessages')}</p>
                <p className="text-caption text-muted-foreground leading-relaxed">
                  {t('creator.dashboard.bento.communication.noMessagesDesc')}
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
                            {timeAgo(c.lastMessageAt, t)}
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
                    {t('creator.dashboard.bento.communication.openMessenger')}
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
                {t('creator.dashboard.bento.communication.notificationsTitle')}
              </h3>
              {notif.unreadCount > 0 && (
                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-badge border-0 px-2 py-0.5">
                  {t('creator.dashboard.bento.communication.newNotifications', { count: notif.unreadCount })}
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
                <p className="text-caption text-destructive">{t('creator.dashboard.cantLoadNotifications', "Couldn't load notifications.")}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => notif.refetch()}
                  className="gap-1.5 text-xs h-7"
                >
                  <RotateCw className="w-3 h-3" /> {t('creator.dashboard.bento.communication.retry')}
                </Button>
              </div>
            ) : recentNotifications.length === 0 ? (
              <p className="text-caption text-muted-foreground text-center py-4 leading-relaxed">
                {t('creator.dashboard.bento.communication.allCaughtUp')}
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
                        {timeAgo(n.createdAt, t)}
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
                    {t('creator.dashboard.bento.communication.allNotifications')}
                  </Link>
                </Button>
              </div>
            )}
          </Card>

          {/* Marketplace & Liquidity Card */}
          <Card className="rounded-[20px] border border-border bg-card p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 font-heading">
                <Users className="w-4 h-4 text-purple-500" />{t('creator.dashboard.marketplace', 'Marketplace')}</h3>
              <Badge variant="outline" className="text-[10px] font-mono">{'Phase 5'}</Badge>
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
              <span className="text-footnote text-muted-foreground">{t('creator.dashboard.listing', 'Listing:')}<span className="font-semibold text-foreground">{phase5.isUnlocked ? 'Active' : 'Gated'}</span>
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
            {t('creator.dashboard.quickActions', 'Quick Actions')}
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
                <span className="block font-bold text-foreground truncate">{t('creator.dashboard.businessPlan', 'Business Plan')}</span>
                <span className="block text-[11px] text-muted-foreground font-normal truncate">{t('creator.dashboard.synthesizePlan', 'Synthesize executive plan')}</span>
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
                <span className="block font-bold text-foreground truncate">{t('creator.dashboard.marketplace', 'Marketplace')}</span>
                <span className="block text-[11px] text-muted-foreground font-normal truncate">{t('creator.dashboard.browseServices', 'Browse ecosystem services')}</span>
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
                <span className="block font-bold text-foreground truncate">{t('creator.dashboard.hireProviders', 'Hire Providers')}</span>
                <span className="block text-[11px] text-muted-foreground font-normal truncate">{t('creator.dashboard.hireExperts', 'Design & legal experts')}</span>
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
                <span className="block font-bold text-foreground truncate">{t('creator.dashboard.construction', 'Construction')}</span>
                <span className="block text-[11px] text-muted-foreground font-normal truncate">{t('creator.dashboard.roadmapStrategy', 'Roadmap & strategy')}</span>
              </div>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
