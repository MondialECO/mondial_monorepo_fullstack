'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Scale,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  HelpCircle,
  FileCheck2,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  creatorJourneyApi,
  type LegalComplianceOverview,
  type ExtendedLegalChecklistItem,
} from '@/lib/api-creator-journey';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';

interface Phase3LegalCardProps {
  ideaId?: string | null;
  className?: string;
}

export function Phase3LegalCard({ ideaId, className }: Phase3LegalCardProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Authoritative overview query from Backend Stage 5 API
  const {
    data: overview,
    isLoading,
    isError,
    refetch,
  } = useQuery<LegalComplianceOverview>({
    queryKey: ['creator', 'legalOverview', ideaId],
    queryFn: () => creatorJourneyApi.getLegalOverview(ideaId),
    enabled: Boolean(ideaId),
    staleTime: 30_000,
  });

  // Evaluate / Refresh assessment mutation
  const evaluateMutation = useMutation({
    mutationFn: () => creatorJourneyApi.evaluateLegalCompliance(ideaId),
    onMutate: () => setIsRefreshing(true),
    onSettled: () => {
      setIsRefreshing(false);
      queryClient.invalidateQueries({ queryKey: ['creator', 'legalOverview', ideaId] });
      queryClient.invalidateQueries({ queryKey: ['creator', 'dashboardRefs', ideaId] });
    },
  });

  // 1. Loading State (Skeleton layout)
  if (isLoading) {
    return (
      <Card className={cn('rounded-2xl border-border bg-card shadow-sm p-6 space-y-5', className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="w-5 h-5 rounded-md" />
            <Skeleton className="w-36 h-5 rounded-md" />
          </div>
          <Skeleton className="w-16 h-5 rounded-full" />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <Skeleton className="w-40 h-4 rounded" />
            <Skeleton className="w-10 h-4 rounded" />
          </div>
          <Skeleton className="w-full h-2 rounded-full" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
        <div className="flex gap-1.5">
          <Skeleton className="w-16 h-6 rounded-md" />
          <Skeleton className="w-16 h-6 rounded-md" />
          <Skeleton className="w-16 h-6 rounded-md" />
        </div>
        <Skeleton className="w-full h-9 rounded-xl" />
      </Card>
    );
  }

  // 2. Error State (No false 0 requirements assumption)
  if (isError || !overview) {
    return (
      <Card className={cn('rounded-2xl border-dashed border-destructive/40 bg-destructive/5 p-6 space-y-4 text-center', className)}>
        <div className="w-10 h-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-foreground">
            {t('creator.phase3.legalCard.unavailableTitle', 'Legal overview unavailable')}
          </h4>
          <p className="text-caption text-muted-foreground max-w-xs mx-auto leading-relaxed">
            {t('creator.phase3.legalCard.unavailableDesc', "We couldn't load your personalized France legal roadmap right now.")}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="rounded-lg text-xs gap-1.5 mx-auto border-border"
        >
          <RefreshCw className="w-3.5 h-3.5" /> {t('creator.phase3.legalCard.retry', 'Retry')}
        </Button>
      </Card>
    );
  }

  const {
    hasAssessment,
    assessment,
    planningReadinessPct = 0,
    stageBreakdown = [],
    detectedArchetypes = [],
    isPotentiallyOutdated = false,
    staleMetadata,
  } = overview;

  const isStale = staleMetadata?.isStale ?? isPotentiallyOutdated;

  // 3. Empty State (Assessment not yet generated)
  if (!hasAssessment || !assessment) {
    return (
      <Card className={cn('rounded-2xl border-border bg-card shadow-sm p-6 space-y-4', className)}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
            <Scale className="w-4 h-4 text-primary" />
            {t('creator.phase3.legalCard.title', 'Legal & Compliance')}
          </h3>
          <Badge variant="outline" className="text-badge font-semibold gap-1 py-0.5 px-2 bg-muted/40 border-border">
            <span>🇫🇷</span> {t('creator.phase3.legalCard.country', 'France')}
          </Badge>
        </div>

        <div className="p-6 border border-dashed border-border rounded-xl text-center space-y-3 bg-muted/10 flex flex-col items-center justify-center">
          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <div className="space-y-1 max-w-sm">
            <h4 className="text-xs font-bold text-foreground">
              {t('creator.phase3.legalCard.emptyTitle', 'Personalized France Legal Roadmap')}
            </h4>
            <p className="text-caption text-muted-foreground leading-relaxed">
              {t('creator.phase3.legalCard.emptyDesc', 'MBC personalizes statutory requirements from your Business Plan, pricing model, and customer segments.')}
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => evaluateMutation.mutate()}
            disabled={evaluateMutation.isPending || isRefreshing}
            className="rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground text-xs gap-1.5 font-medium px-4 shadow-none"
          >
            {evaluateMutation.isPending || isRefreshing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                {t('creator.phase3.legalCard.analyzing', 'Analyzing Business...')}
              </>
            ) : (
              <>
                {t('creator.phase3.legalCard.analyse', 'Analyse My Business')}
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </Button>
        </div>
      </Card>
    );
  }

  // Calculations for active assessment
  const items: ExtendedLegalChecklistItem[] = assessment.items || [];
  const applicableItems = items.filter((i) => i.status !== 'not_applicable');
  const applicableCount = applicableItems.length;
  const completedCount = applicableItems.filter(
    (i) => i.status === 'completed' || i.status === 'done' || i.status === 'reviewed',
  ).length;

  const needsInfoCount = applicableItems.filter(
    (i) => i.status === 'needs_information' || i.evaluationStatus === 'needs_information',
  ).length;

  const actionRequiredCount = applicableItems.filter(
    (i) =>
      i.status === 'action_required' ||
      i.status === 'not_started' ||
      i.status === 'pending' ||
      i.status === 'in_progress',
  ).length;

  // Key chronological stage buckets
  const beforeLaunchStage = stageBreakdown.find((s) => s.stage === 'before_launch');
  const beforeSaleStage = stageBreakdown.find((s) => s.stage === 'before_sale');
  const ongoingStage = stageBreakdown.find((s) => s.stage === 'ongoing');
  const creationStage = stageBreakdown.find((s) => s.stage === 'company_creation' || s.stage === 'before_creation');

  // Next Priority Message logic
  let nextActionMessage = `${applicableCount} applicable statutory requirements`;
  if (needsInfoCount > 0) {
    nextActionMessage = `${needsInfoCount} requirement${needsInfoCount > 1 ? 's' : ''} need${needsInfoCount === 1 ? 's' : ''} more business information`;
  } else if ((beforeLaunchStage?.totalCount ?? 0) > (beforeLaunchStage?.completedCount ?? 0)) {
    const remaining = (beforeLaunchStage?.totalCount ?? 0) - (beforeLaunchStage?.completedCount ?? 0);
    nextActionMessage = `${remaining} action${remaining > 1 ? 's' : ''} required before launch`;
  } else if ((beforeSaleStage?.totalCount ?? 0) > (beforeSaleStage?.completedCount ?? 0)) {
    const remaining = (beforeSaleStage?.totalCount ?? 0) - (beforeSaleStage?.completedCount ?? 0);
    nextActionMessage = `${remaining} requirement${remaining > 1 ? 's' : ''} required before first sale`;
  } else if (planningReadinessPct >= 100) {
    nextActionMessage = 'Planning checklist complete (based on current business data)';
  } else if (actionRequiredCount > 0) {
    nextActionMessage = `${actionRequiredCount} action${actionRequiredCount > 1 ? 's' : ''} need${actionRequiredCount === 1 ? 's' : ''} attention`;
  }

  // Business profile chips (limit to 4 visible + overflow counter)
  const maxVisibleChips = 4;
  const visibleChips = detectedArchetypes.slice(0, maxVisibleChips);
  const extraChipsCount = Math.max(0, detectedArchetypes.length - maxVisibleChips);

  return (
    <Card className={cn('rounded-2xl border-border bg-card shadow-sm p-6 space-y-5', className)}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-primary" />
            <h3 className="font-bold text-sm text-foreground">
              {t('creator.phase3.legalCard.title', 'Legal & Compliance')}
            </h3>
          </div>
          <p className="text-caption text-muted-foreground">
            {t('creator.phase3.legalCard.subtitle', 'Personalized from your Business Plan')}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          {isStale && (
            <Badge
              variant="warning"
              className="text-[10px] font-semibold tracking-tight px-2 py-0.5"
              title={staleMetadata?.staleReason === 'RulesUpdated' ? t('creator.phase3.legalCard.rulesUpdated', 'Guidance updated') : t('creator.phase3.legalCard.businessChanged', 'Business model updated since last analysis')}
            >
              {t('creator.phase3.legalCard.updateNeeded', 'Update needed')}
            </Badge>
          )}
          <Badge
            variant="outline"
            className="text-badge font-semibold gap-1 py-0.5 px-2 bg-muted/40 border-border"
          >
            <span>🇫🇷</span> {t('creator.phase3.legalCard.country', 'France')}
          </Badge>
        </div>
      </div>

      {/* Stale Warning Banner */}
      {isStale && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl space-y-2 text-xs">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0 text-amber-900 dark:text-amber-300">
              <Clock className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span className="truncate font-semibold">
                {staleMetadata?.staleReason === 'RulesUpdated'
                  ? t('creator.phase3.legalCard.rulesUpdated', 'French statutory guidance updated')
                  : staleMetadata?.staleReason === 'BusinessDataChanged'
                  ? t('creator.phase3.legalCard.businessChanged', 'Business changes detected')
                  : t('creator.phase3.legalCard.reviewRecommended', 'Legal review recommended')}
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => evaluateMutation.mutate()}
              disabled={evaluateMutation.isPending || isRefreshing}
              className="h-7 text-xs px-2.5 shrink-0 bg-background border-amber-500/40 hover:bg-amber-500/10"
            >
              <RefreshCw className={cn('w-3 h-3 mr-1', (evaluateMutation.isPending || isRefreshing) && 'animate-spin')} />
              {t('creator.phase3.legalCard.refresh', 'Refresh')}
            </Button>
          </div>

          {staleMetadata?.humanChangeDescriptions && staleMetadata.humanChangeDescriptions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {staleMetadata.humanChangeDescriptions.slice(0, 3).map((change, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/20 text-amber-800 dark:text-amber-200"
                >
                  {change}
                </span>
              ))}
              {staleMetadata.humanChangeDescriptions.length > 3 && (
                <span className="text-[10px] text-amber-700/80 dark:text-amber-300/80 self-center">
                  {t('creator.phase3.legalCard.moreCount', '+{{count}} more', {
                    count: staleMetadata.humanChangeDescriptions.length - 3
                  })}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Legal Planning Readiness Progress */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-muted-foreground uppercase tracking-wider text-[11px]">
            {t('creator.phase3.legalCard.planningReadiness', 'Legal Planning Readiness')}
          </span>
          <span className="font-bold text-sm text-foreground font-mono">
            {Math.round(planningReadinessPct)}%
          </span>
        </div>
        <Progress value={planningReadinessPct} className="h-2 bg-muted" />
        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
          <span>{t('creator.phase3.legalCard.satisfiedCount', { completed: completedCount, total: applicableCount })}</span>
          <span>{t('creator.phase3.legalCard.guidanceOnly', 'Guidance only')}</span>
        </div>
      </div>

      {/* Chronological Stage Breakdown Counts */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2.5 rounded-xl bg-muted/30 border border-border/60">
          <span className="block text-caption text-muted-foreground">
            {t('creator.phase3.legalCard.beforeLaunch', 'Before Launch')}
          </span>
          <span className="text-sm font-bold text-foreground">
            {beforeLaunchStage?.totalCount ?? 0}
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-muted/30 border border-border/60">
          <span className="block text-caption text-muted-foreground">
            {t('creator.phase3.legalCard.firstSale', 'First Sale')}
          </span>
          <span className="text-sm font-bold text-foreground">
            {beforeSaleStage?.totalCount ?? 0}
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-muted/30 border border-border/60">
          <span className="block text-caption text-muted-foreground">
            {t('creator.phase3.legalCard.ongoing', 'Ongoing')}
          </span>
          <span className="text-sm font-bold text-foreground">
            {ongoingStage?.totalCount ?? 0}
          </span>
        </div>
      </div>

      {/* Business Profile Chips */}
      {detectedArchetypes.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            {t('creator.phase3.legalCard.signalsTitle', 'Business Profile Signals')}
          </span>
          <div className="flex flex-wrap gap-1.5 items-center">
            {visibleChips.map((archetype, idx) => (
              <span
                key={idx}
                className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground border border-border/40"
              >
                {archetype}
              </span>
            ))}
            {extraChipsCount > 0 && (
              <span className="text-caption text-muted-foreground font-medium pl-1">
                {t('creator.phase3.legalCard.moreCount', '+{{count}} more', { count: extraChipsCount })}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Priority Message Notification */}
      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-primary/5 border border-primary/10 text-xs">
        {needsInfoCount > 0 ? (
          <HelpCircle className="w-4 h-4 text-warning shrink-0" />
        ) : planningReadinessPct >= 100 ? (
          <ShieldCheck className="w-4 h-4 text-success-text shrink-0" />
        ) : (
          <AlertTriangle className="w-4 h-4 text-primary shrink-0" />
        )}
        <span className="font-medium text-foreground truncate">
          {nextActionMessage}
        </span>
      </div>

      {/* Primary CTA */}
      <Button
        asChild
        size="sm"
        className="w-full rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground font-medium text-xs h-9 shadow-none"
      >
        <Link href={`/dashboard/creator/phase-3/compliance${ideaId ? `?ideaId=${ideaId}` : ''}`}>
          {t('creator.phase3.legalCard.openRoadmap', 'Open My Legal Roadmap')}
          <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
        </Link>
      </Button>
    </Card>
  );
}

export default Phase3LegalCard;
