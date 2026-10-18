'use client';

import React, { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  RotateCw,
  RefreshCw,
  CheckCircle2,
  ExternalLink,
  Scale,
} from 'lucide-react';
import { Phase3SetupShell } from '@/components/creator/Phase3SetupShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCreatorProgress } from '@/providers/CreatorProgressProvider';
import { cn } from '@/lib/utils';
import {
  creatorJourneyApi,
  getCreatorWorkspaceIdea,
  type LegalComplianceOverview,
  type LegalBusinessProfileDto,
  type ExtendedLegalChecklistItem,
  type ChecklistStatus,
} from '@/lib/api-creator-journey';
import {
  LegalFigmaStageSection,
  FIGMA_STAGE_TABS,
  type FigmaStageTabKey,
} from '@/components/creator/legal/LegalFigmaStageSection';
import { withIdeaContext } from '@/lib/creator-routes';
import { useTranslation } from '@/hooks/useTranslation';

function generateProjectSummary(
  profile?: LegalBusinessProfileDto | null,
  projectName?: string
): string {
  const parts: string[] = [];
  const isSub = profile?.hasSubscription?.value === true;
  const isSaaS = profile?.isSaaS?.value === true;
  const isMarketplace = profile?.isMarketplace?.value === true;
  const isB2B = profile?.isB2B?.value === true;
  const isB2C = profile?.isB2C?.value === true;
  const hasOnlinePayments = profile?.hasOnlinePayments?.value === true;
  const collectsPersonalData = profile?.collectsPersonalData?.value === true;

  const name = (profile?.businessName || projectName || '').trim();
  const entityLead = name ? `For "${name}", you’re planning ` : 'You’re planning ';

  if (isSaaS || (isSub && isB2C)) {
    parts.push(`${entityLead}an online subscription service in France.`);
  } else if (isMarketplace) {
    parts.push(`${entityLead}a digital platform and marketplace connecting users in France.`);
  } else if (isB2B) {
    parts.push(`${entityLead}a commercial B2B software and service operating in France.`);
  } else {
    parts.push(`${entityLead}a commercial business venture operating under French jurisdiction.`);
  }

  if (profile?.rawSector) {
    parts.push(`The project operates in the ${profile.rawSector} sector.`);
  }

  if (hasOnlinePayments || collectsPersonalData || isSub || isB2C || isMarketplace) {
    parts.push("You expect to take online payments and collect customer information.");
  } else {
    parts.push("You expect to issue commercial invoices and process client business information.");
  }

  return parts.join(' ');
}

export default function ComplianceWorkspacePage() {
  const router = useRouter();
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const queryIdeaId = searchParams.get('ideaId');
  const initialStageParam = searchParams.get('stage');
  const initialReqParam = searchParams.get('requirement');

  const { state, completeStep } = useCreatorProgress();
  const effectiveIdeaId = queryIdeaId || state?.activeIdeaId || getCreatorWorkspaceIdea() || null;
  const queryClient = useQueryClient();

  const [isGenerating, setIsGenerating] = useState(false);

  // Active Stage Tab in Figma Section 5
  const [activeStageTab, setActiveStageTab] = useState<FigmaStageTabKey>(() => {
    if (initialStageParam === 'company_creation' || initialStageParam === 'before_launch' || initialStageParam === 'before_sale') {
      return 'register_launch';
    }
    if (initialStageParam === 'ongoing') {
      return 'running_business';
    }
    return 'before_register';
  });

  const [expandedItemId, setExpandedItemId] = useState<string | null>(initialReqParam || null);

  // Authoritative overview query
  const {
    data: overview,
    isLoading: overviewLoading,
    isError: overviewError,
    refetch: refetchOverview,
  } = useQuery<LegalComplianceOverview>({
    queryKey: ['creator', 'legalOverview', effectiveIdeaId],
    queryFn: () => creatorJourneyApi.getLegalOverview(effectiveIdeaId),
    staleTime: 30_000,
  });

  // Evaluate / Refresh mutation
  const evaluateMutation = useMutation({
    mutationFn: () => creatorJourneyApi.evaluateLegalCompliance(effectiveIdeaId),
    onMutate: () => {
      setIsGenerating(true);
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['creator', 'legalOverview', effectiveIdeaId] });
      queryClient.invalidateQueries({ queryKey: ['creator', 'dashboardRefs', effectiveIdeaId] });
      setIsGenerating(false);
    },
    onError: () => {
      setIsGenerating(false);
    },
  });

  const isGeneratingActive = isGenerating || evaluateMutation.isPending;

  // Status update mutation
  const statusMutation = useMutation({
    mutationFn: ({ itemId, newStatus }: { itemId: string; newStatus: ChecklistStatus }) =>
      creatorJourneyApi.updateLegalItemStatus(itemId, newStatus, effectiveIdeaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator', 'legalOverview', effectiveIdeaId] });
      queryClient.invalidateQueries({ queryKey: ['creator', 'dashboardRefs', effectiveIdeaId] });
    },
  });

  const assessment = overview?.assessment;
  const items: ExtendedLegalChecklistItem[] = assessment?.items || [];
  const applicableItems = useMemo(
    () => items.filter((i) => i.status !== 'not_applicable'),
    [items]
  );

  const completedCount = useMemo(
    () =>
      applicableItems.filter(
        (i) => i.status === 'completed' || i.status === 'done' || i.status === 'reviewed'
      ).length,
    [applicableItems]
  );

  // Section 3 Recommended Next Action (Figma 57156:9158)
  const nextAction = useMemo(() => {
    const uncompleted = applicableItems.filter(
      (i) => i.status !== 'completed' && i.status !== 'done' && i.status !== 'reviewed'
    );
    const critical = uncompleted.find((i) => i.priority === 'critical');
    return critical || uncompleted[0] || applicableItems[0] || null;
  }, [applicableItems]);

  const handleStatusChange = async (item: ExtendedLegalChecklistItem, newStatus: ChecklistStatus) => {
    await statusMutation.mutateAsync({ itemId: item.id, newStatus });
  };

  const handleToggleExpand = (itemId: string) => {
    setExpandedItemId((prev) => (prev === itemId ? null : itemId));
  };

  // Section 3 "Review this step" action
  const handleReviewStep = (targetItem: ExtendedLegalChecklistItem) => {
    const targetTab = FIGMA_STAGE_TABS.find((t) => t.stageFilter(targetItem))?.key || 'before_register';
    setActiveStageTab(targetTab);
    setExpandedItemId(targetItem.id);
    setTimeout(() => {
      const el = document.getElementById(`task-${targetItem.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const handleSaveAndContinue = () => {
    completeStep(3, 4);
    router.push(withIdeaContext('/dashboard/creator/phase-3/formation', effectiveIdeaId));
  };

  const projectSummaryNarrative = useMemo(() => {
    return generateProjectSummary(
      overview?.assessment?.businessProfile,
      state?.project?.name
    );
  }, [overview?.assessment?.businessProfile, state?.project?.name]);

  return (
    <Phase3SetupShell
      fullWidth
      stepEyebrow={t('creator.phase3.compliance.eyebrow')}
      title={t('creator.phase3.compliance.title')}
      description={t('creator.phase3.compliance.description')}
    >
      {/* 1. Loading State */}
      {overviewLoading && !isGeneratingActive && (
        <div className="w-full space-y-6">
          <Skeleton className="h-6 w-72 rounded-lg" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-44 w-full rounded-2xl" />
          <Skeleton className="h-36 w-full rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      )}

      {/* 2. Error State */}
      {!overviewLoading && !isGeneratingActive && overviewError && (
        <Card className="p-8 border-dashed border-destructive/40 bg-destructive/5 rounded-2xl text-center space-y-3 max-w-lg mx-auto">
          <AlertTriangle className="size-8 text-destructive mx-auto" />
          <h3 className="text-sm font-bold text-foreground">{t('creator.phase3.compliance.loadErrorTitle')}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t('creator.phase3.compliance.loadErrorDesc')}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchOverview()}
            className="text-xs rounded-xl gap-1.5 mx-auto border-border"
          >
            {t('creator.phase3.compliance.retry')}
          </Button>
        </Card>
      )}

      {/* 3. Empty & Generating Pre-Assessment State */}
      {!overviewLoading && !overviewError && (!overview?.hasAssessment || !assessment) && (
        <Card className="p-10 border border-border rounded-2xl bg-card shadow-sm text-center space-y-5 max-w-xl mx-auto" role="status" aria-live="polite">
          <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            {isGeneratingActive ? (
              <RotateCw className="size-6 animate-spin text-primary" />
            ) : (
              <Scale className="size-6" />
            )}
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-foreground">
              {isGeneratingActive ? t('creator.phase3.compliance.generatingTitle') : t('creator.phase3.compliance.generateTitle')}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-md mx-auto">
              {isGeneratingActive
                ? t('creator.phase3.compliance.generatingDesc')
                : t('creator.phase3.compliance.generateDesc')}
            </p>
          </div>

          {isGeneratingActive && (
            <div className="w-48 h-1.5 bg-muted rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-primary rounded-full animate-indeterminate" />
            </div>
          )}

          <Button
            onClick={() => evaluateMutation.mutate()}
            disabled={isGeneratingActive}
            className="rounded-xl text-xs px-5 h-9 bg-primary hover:bg-primary/95 text-primary-foreground font-medium shadow-none gap-2"
          >
            {isGeneratingActive ? (
              <>
                <RotateCw className="size-4 animate-spin" />
                {t('creator.phase3.compliance.analysingBtn')}
              </>
            ) : (
              <>
                {t('creator.phase3.compliance.analyseBtn')}
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </Card>
      )}

      {/* 4. Active Workspace Content: Full Screen Responsive Flow */}
      {!overviewLoading && !overviewError && !isGeneratingActive && overview?.hasAssessment && assessment && (
        <div className="w-full space-y-6 text-foreground">
          {/* SECTION 1: SHORT INTRODUCTION (Figma 57156:9158) */}
          <div className="pb-1">
            <p className="text-body text-muted-foreground font-sans">
              {t('creator.phase3.compliance.intro')}
            </p>
          </div>

          {/* SECTION 2: ROADMAP SUMMARY CARD (Figma 57156:9158) */}
          <Card className="p-6 rounded-lg border border-border/80 bg-card shadow-xs space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-page-heading sm:text-2xl font-semibold tracking-tight text-foreground font-heading">
                  {t('creator.phase3.compliance.roadmapReady')}
                </h2>
                <p className="text-body text-muted-foreground leading-relaxed font-sans">
                  {t('creator.phase3.compliance.roadmapSubtitle', 'Here’s what to prepare before registration, launch and day-to-day operations — based on your project.')}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => evaluateMutation.mutate()}
                disabled={isGeneratingActive}
                className="gap-1.5 text-xs rounded-lg border-border font-sans shrink-0"
              >
                <RotateCw className={cn("size-3.5", isGeneratingActive && "animate-spin")} />
                {t('creator.phase3.compliance.reevaluate', 'Re-evaluate')}
              </Button>
            </div>
          </Card>

          {/* SECTION 3: RECOMMENDED NEXT ACTION CARD (Figma 57156:9158) */}
          {nextAction ? (
            <div className="p-6 rounded-lg border border-primary/20 bg-secondary dark:bg-secondary/40 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-badge font-bold uppercase tracking-wider bg-card text-primary font-sans">
                  {t('creator.phase3.compliance.startHere', 'START HERE')}
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="text-card-title sm:text-xl font-semibold text-foreground font-heading">
                  {nextAction.title || nextAction.label}
                </h3>
                <p className="text-body text-muted-foreground leading-relaxed font-sans">
                  {nextAction.whyItApplies ||
                    'Your planned activity determines whether you need a licence or qualification.'}
                </p>
              </div>

              <Button
                onClick={() => handleReviewStep(nextAction)}
                className="rounded text-button font-medium h-auto py-2.5 px-5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs gap-2 font-sans"
              >
                {t('creator.phase3.compliance.reviewStep', 'Review this step')}
                <ArrowRight className="size-4" />
              </Button>
            </div>
          ) : (
            <div className="p-6 rounded-lg border border-success-strong/20 bg-success-light dark:bg-success-strong/10 shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-success-strong">
                <CheckCircle2 className="size-5" />
                <h3 className="text-card-title font-semibold font-heading">{t('creator.phase3.compliance.allSatisfiedTitle', 'All milestones marked as satisfied!')}</h3>
              </div>
              <p className="text-caption text-muted-foreground font-sans">
                {t('creator.phase3.compliance.allSatisfiedDesc', 'You have verified and completed every statutory requirement identified for your France setup.')}
              </p>
            </div>
          )}

          {/* SECTION 4: ABOUT YOUR PROJECT CARD (Figma 57156:9158) */}
          <Card className="p-6 rounded-lg border border-border/80 bg-card shadow-xs space-y-3">
            <div className="space-y-1">
              <h3 className="text-card-title font-semibold text-foreground font-heading">
                {t('creator.phase3.compliance.aboutProject', 'About your project')}
              </h3>
              <p className="text-body text-muted-foreground leading-relaxed font-sans">
                {projectSummaryNarrative}
              </p>
            </div>

            <div className="pt-1">
              <Button
                variant="link"
                onClick={() =>
                  router.push(
                    withIdeaContext('/dashboard/creator/phase-3/business-model', effectiveIdeaId)
                  )
                }
                className="p-0 h-auto text-label font-medium text-primary hover:underline gap-1.5 inline-flex items-center font-sans"
              >
                {t('creator.phase3.compliance.updateProjectDetails', 'Update your project details')}
                <ExternalLink className="size-3.5" />
              </Button>
            </div>
          </Card>

          {/* SECTION 5: CHECKLIST STAGE SECTION (Figma 57156:9158) */}
          <LegalFigmaStageSection
            items={applicableItems}
            activeTab={activeStageTab}
            onTabChange={setActiveStageTab}
            expandedItemId={expandedItemId}
            onToggleExpand={handleToggleExpand}
            onStatusChange={handleStatusChange}
            disclaimer={overview.disclaimer}
          />

          {/* SECTION 6: FOOTER REASSURANCE & CONTINUATION (Figma 57156:9158) */}
          <div className="pt-8 pb-16 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-border/60">
            <p className="text-body text-muted-foreground font-sans">
              {t('creator.phase3.compliance.footerNote', 'You can return to this roadmap as your project moves forward.')}
            </p>

            <div className="flex items-center gap-3 shrink-0">
              <Button
                variant="ghost"
                onClick={() =>
                  router.push(
                    withIdeaContext('/dashboard/creator/phase-3/forecast', effectiveIdeaId)
                  )
                }
                className="gap-2 text-button font-medium font-sans text-muted-foreground hover:text-foreground rounded"
              >
                <ArrowLeft className="size-4" />
                {t('creator.branding.back', 'Back')}
              </Button>

              <Button
                onClick={handleSaveAndContinue}
                className="rounded text-button font-medium h-auto py-2.5 px-6 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs font-sans"
              >
                {t('creator.phase3.compliance.continueToFormation', 'Save and continue')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Phase3SetupShell>
  );
}
