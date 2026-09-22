'use client';

import React from 'react';
import Link from 'next/link';
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
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/app/_providers/AuthProvider';
import { useCreatorProgress } from '@/providers/CreatorProgressProvider';
import { useCreatorDashboardSummary } from '@/hooks/queries/creator';
import { useConversations } from '@/hooks/queries/chat';
import { useNotifications } from '@/hooks/queries/notifications';
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

export default function CreatorDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { state } = useCreatorProgress();
  const activeIdeaId = state.activeIdeaId;

  // Single authoritative summary query
  const {
    data: summary,
    isLoading,
    isError,
    error,
    refetch,
  } = useCreatorDashboardSummary(activeIdeaId);

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

  // SKELETON LOADING STATE
  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-[1280px] space-y-8 bg-background pb-12 font-sans">
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

  // ERROR STATE
  if (isError || !summary) {
    return (
      <div className="mx-auto w-full max-w-[1280px] space-y-6 bg-background pb-12 font-sans">
        <div className="p-8 border border-destructive/20 rounded-2xl bg-destructive/5 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-destructive mx-auto" />
          <h2 className="text-lg font-bold text-foreground">Failed to Load Creator Dashboard</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {error instanceof Error ? error.message : 'Could not synchronize your command center state from the server.'}
          </p>
          <Button onClick={() => void refetch()} variant="outline" className="rounded-xl gap-2">
            <RotateCw className="w-4 h-4" /> Try Again
          </Button>
        </div>
      </div>
    );
  }

  const { project, nextAction, attentionItems, journey, results, phase5 } = summary;
  const brand = project.brand;
  const brandLogo = brand?.logoAsset || brand?.logoUrl;
  const brandDisplayName = brand?.brandName || project.name || 'Brand';
  const hasBrandLogo = Boolean(brandLogo);

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

  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-6 bg-background pb-12 font-sans">
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
            variant="outline"
            size="sm"
            asChild
            className="rounded-lg border-border bg-card text-foreground font-semibold text-xs h-8"
          >
            <Link href="/dashboard/creator/myideas">Switch Idea</Link>
          </Button>
        </div>
      </div>

      {/* Row 1: Project Identity & Header */}
      <Card className="rounded-2xl border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4 min-w-0">
            {/* Real Brand Logo or Styled Monogram Avatar */}
            {hasBrandLogo ? (
              <div className="w-14 h-14 rounded-2xl border border-border bg-background flex items-center justify-center overflow-hidden shrink-0 shadow-sm p-1">
                <img
                  src={brandLogo!}
                  alt={brandDisplayName}
                  className="w-full h-full object-contain rounded-xl"
                />
              </div>
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary to-amber-500 text-white flex items-center justify-center font-black text-2xl shrink-0 shadow-sm">
                {(brandDisplayName || 'P').charAt(0).toUpperCase()}
              </div>
            )}

            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight truncate">
                  {project.name || 'Untitled Venture'}
                </h1>
                {/* Sector / Category badge (No SaaS badge!) */}
                {(project.sector || project.category) && (
                  <Badge variant="outline" className="text-xs font-semibold border-primary/20 bg-primary/5 text-primary">
                    {project.sector || project.category}
                  </Badge>
                )}
                {/* Phase milestone badge */}
                <Badge variant="outline" className="text-xs font-medium border-border text-muted-foreground">
                  Phase {journey.currentPhase} — {PHASE_TITLES[journey.currentPhase] || 'Active'}
                </Badge>
              </div>

              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-2 max-w-3xl">
                {project.tagline || project.concept || 'Develop and refine your project identity, intelligence, and execution models.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
            {journey.currentPhase >= 2 && (
              <Button variant="outline" size="sm" asChild className="rounded-xl border-border text-xs h-9">
                <Link href="/dashboard/creator/phase-2">
                  <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Brand Identity
                </Link>
              </Button>
            )}
            <Button variant="outline" size="sm" asChild className="rounded-xl border-border text-xs h-9">
              <Link href="/dashboard/creator/documents">
                <Folder className="w-3.5 h-3.5 mr-1.5" /> Vault
              </Link>
            </Button>
          </div>
        </div>
      </Card>

      {/* Row 2: Dominant CTA — Next Recommended Action */}
      <Card className="rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-card via-card to-primary/[0.04] p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                <Zap className="w-4 h-4 fill-primary text-primary" />
                Next Recommended Action
              </span>
              <Badge variant="secondary" className="text-xs font-semibold px-2 py-0.5">
                Phase {nextAction.phase}
              </Badge>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-foreground">
              {nextAction.title}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {nextAction.description}
            </p>
          </div>

          <div className="shrink-0">
            <Button
              asChild
              size="lg"
              className="w-full md:w-auto rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md text-sm px-6 h-11"
            >
              <Link href={nextAction.href}>
                {nextAction.buttonLabel}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </Card>

      {/* Row 3: Priority Attention Items (Only rendered if items exist) */}
      {attentionItems && attentionItems.length > 0 && (
        <Card className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.02] p-5 shadow-sm space-y-3">
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
                    <Badge variant="outline" className={`text-badge px-1.5 py-0.2 ${getSeverityBadge(item.severity)}`}>
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

      {/* Main 2-Column Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column (2 Cols): Journey Overview, Phase 5 Gate, Verified Outputs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Creator Journey Overview (Phases 2 to 5) */}
          <Card className="rounded-2xl border-border bg-card p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" />
                  Creator Journey Overview
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Progress tracking across four canonical stages
                </p>
              </div>
              <Badge variant="outline" className="text-xs font-semibold">
                {overallProgress}% Complete
              </Badge>
            </div>

            {/* 4-Step Stepper Bar */}
            <div className="grid grid-cols-4 gap-2 pt-2">
              {journey.phases.map((phaseItem: DashboardPhaseMilestone) => {
                const phaseNum = phaseItem.phaseNumber ?? phaseItem.phase ?? 2;
                const isCompleted = phaseItem.status === 'Completed';
                const isInProgress = phaseItem.status === 'In Progress';
                const isLocked = phaseItem.status === 'Locked';

                return (
                  <div
                    key={phaseNum}
                    className={`flex flex-col p-3 rounded-xl border transition-all ${
                      isInProgress
                        ? 'border-primary/50 bg-primary/5'
                        : isCompleted
                        ? 'border-emerald-500/30 bg-emerald-500/5'
                        : 'border-border/60 bg-muted/10 opacity-70'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-footnote font-bold text-muted-foreground">
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
                    <span className="text-caption text-muted-foreground mt-1">
                      {phaseItem.status}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Active Phase Substages (Concise breakdown of current phase) */}
            {activeSubstages && activeSubstages.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-border/60">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground">
                    Current Milestones — Phase {journey.currentPhase}
                  </span>
                  <span className="text-muted-foreground">
                    {activeSubstages.filter((s: DashboardSubstage) => s.isCompleted ?? s.status === 'Completed').length} of{' '}
                    {activeSubstages.length} done
                  </span>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  {activeSubstages.map((sub: DashboardSubstage) => {
                    const subKey = sub.key || sub.id || sub.label;
                    const subTitle = sub.title || sub.label;
                    const isSubDone = sub.isCompleted ?? sub.status === 'Completed';

                    return (
                      <Link
                        key={subKey}
                        href={sub.href}
                        className="flex items-center justify-between p-3 rounded-xl border border-border/70 hover:border-primary/40 hover:bg-muted/10 transition-colors group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 ${
                              isSubDone
                                ? 'bg-emerald-500 text-white'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {isSubDone ? <Check className="w-3 h-3" /> : '•'}
                          </div>
                          <span className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                            {subTitle}
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-badge px-1.5 py-0 ${
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
            className={`rounded-2xl p-6 transition-all ${
              phase5.isUnlocked
                ? 'border-2 border-primary/40 bg-gradient-to-r from-primary/[0.04] to-amber-500/[0.04] shadow-sm'
                : 'border border-border/70 bg-muted/15'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    phase5.isUnlocked
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {phase5.isUnlocked ? (
                    <Sparkles className="w-6 h-6 text-primary" />
                  ) : (
                    <Lock className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-foreground">
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
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
                    {phase5.guidanceText}
                  </p>
                </div>
              </div>

              <div className="shrink-0">
                {phase5.isUnlocked ? (
                  <Button
                    asChild
                    className="w-full md:w-auto rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/95 text-xs px-5 h-10 shadow-sm"
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
                    className="w-full md:w-auto rounded-xl text-xs font-semibold h-10 border-border text-muted-foreground/60 cursor-not-allowed"
                  >
                    <Lock className="w-3.5 h-3.5 mr-1.5" />
                    Crossroads Locked
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Real Outputs & Assets Grid */}
          <Card className="rounded-2xl border-border bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Verified Outputs & Assets ({results.length})
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Authoritative artifacts and plans produced during your journey
                </p>
              </div>
              <Button variant="outline" size="sm" asChild className="rounded-lg text-xs h-7 border-border px-2.5">
                <Link href="/dashboard/creator/documents">View Vault</Link>
              </Button>
            </div>

            {results.length === 0 ? (
              <div className="p-8 border border-dashed border-border rounded-xl text-center space-y-3 bg-muted/10 flex flex-col items-center justify-center">
                <Folder className="w-8 h-8 text-muted-foreground/40" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-foreground">No outputs generated yet</h4>
                  <p className="text-caption text-muted-foreground max-w-sm leading-relaxed">
                    As you complete each stage of your Creator journey, finalized plans and models will appear here.
                  </p>
                </div>
                <Button asChild size="sm" className="rounded-lg bg-primary text-primary-foreground text-xs">
                  <Link href={nextAction.href}>Start with {nextAction.title}</Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {results.map((item: DashboardResultItem) => {
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
                      className="flex flex-col justify-between p-4 rounded-xl border border-border/70 hover:border-primary/50 hover:bg-muted/10 transition-all group space-y-3"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-primary/10">
                              {getResultCategoryIcon(itemCategory)}
                            </div>
                            <span className="text-caption font-bold text-muted-foreground uppercase tracking-wider">
                              {itemCategory}
                            </span>
                          </div>
                          <Badge
                            variant="outline"
                            className="text-badge font-semibold border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 px-2 py-0.2"
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

        {/* Right Column (1 Col): HumainX Profile, Live Communication, Shortcuts */}
        <div className="space-y-6">
          {/* HumainX Profile Onboarding Card */}
          <HumainXDashboardCard ideaId={activeIdeaId} />

          {/* Messages Card — Real chat conversations */}
          <Card className="rounded-2xl border-border bg-card shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
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
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-11 w-full rounded-lg" />
                ))}
              </div>
            ) : conversationsQ.isError ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <p className="text-caption text-destructive">Couldn&apos;t load messages.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => conversationsQ.refetch()}
                  className="gap-1.5 text-xs"
                >
                  <RotateCw className="w-3.5 h-3.5" /> Retry
                </Button>
              </div>
            ) : recentConversations.length === 0 ? (
              <p className="text-caption text-muted-foreground text-center py-6 leading-relaxed">
                No active conversations yet. Messages with service providers and partners will appear here.
              </p>
            ) : (
              <div className="space-y-3">
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
                      className="flex items-center gap-3 hover:bg-muted/10 p-1.5 rounded-lg transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-amber-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <h4 className="text-xs font-bold text-foreground truncate">{name}</h4>
                          <span className="text-footnote text-muted-foreground shrink-0 ml-2">
                            {timeAgo(c.lastMessageAt)}
                          </span>
                        </div>
                        <p className="text-caption text-muted-foreground truncate mt-0.5">
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
                  className="w-full text-xs rounded-xl h-9 mt-2 font-bold text-muted-foreground hover:text-foreground"
                >
                  <Link href="/dashboard/creator/messages">
                    <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                    Open Messenger
                  </Link>
                </Button>
              </div>
            )}
          </Card>

          {/* Notifications Card — Real notifications */}
          <Card className="rounded-2xl border-border bg-card shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
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
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-8 w-full rounded-lg" />
                ))}
              </div>
            ) : notif.isError ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <p className="text-caption text-destructive">Couldn&apos;t load notifications.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => notif.refetch()}
                  className="gap-1.5 text-xs"
                >
                  <RotateCw className="w-3.5 h-3.5" /> Retry
                </Button>
              </div>
            ) : recentNotifications.length === 0 ? (
              <p className="text-caption text-muted-foreground text-center py-6 leading-relaxed">
                You&apos;re all caught up — no new notifications.
              </p>
            ) : (
              <div className="space-y-3">
                {recentNotifications.map((n) => (
                  <div key={n.id} className="flex gap-2.5 items-start">
                    <div
                      className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                        n.isRead ? 'bg-muted-foreground/30' : 'bg-emerald-500'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground leading-snug">{n.title || n.body}</p>
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
                  className="w-full text-xs rounded-xl h-9 mt-2 font-bold text-muted-foreground hover:text-foreground"
                >
                  <Link href="/dashboard/creator/notifications">
                    <Bell className="w-3.5 h-3.5 mr-1.5" />
                    View All Notifications
                  </Link>
                </Button>
              </div>
            )}
          </Card>

          {/* Quick Shortcuts */}
          <Card className="rounded-2xl border-border bg-card p-6 shadow-sm space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
              Venture Hub Shortcuts
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                asChild
                className="h-9 justify-start text-xs font-semibold rounded-lg border-border"
              >
                <Link href="/dashboard/creator/phase-3/legal">
                  <Scale className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
                  Legal Center
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="h-9 justify-start text-xs font-semibold rounded-lg border-border"
              >
                <Link href="/dashboard/creator/phase-4">
                  <Briefcase className="w-3.5 h-3.5 mr-1.5 text-blue-500" />
                  Construction
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="h-9 justify-start text-xs font-semibold rounded-lg border-border"
              >
                <Link href="/dashboard/creator/documents">
                  <Folder className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
                  IP Vault
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="h-9 justify-start text-xs font-semibold rounded-lg border-border"
              >
                <Link href="/marketplace/services">
                  <Users className="w-3.5 h-3.5 mr-1.5 text-purple-500" />
                  Marketplace
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
