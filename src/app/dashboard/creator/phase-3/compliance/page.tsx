'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Scale,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Clock,
  CheckCircle2,
  Sparkles,
  Layers,
  MessageSquare,
  Building2,
} from 'lucide-react';
import { Phase3SetupShell } from '@/components/creator/Phase3SetupShell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCreatorProgress } from '@/providers/CreatorProgressProvider';
import {
  creatorJourneyApi,
  type LegalComplianceOverview,
  type ExtendedLegalChecklistItem,
  type ChecklistStatus,
} from '@/lib/api-creator-journey';
import {
  creatorDocumentsApi,
  type CreatorIdeaDocument,
} from '@/lib/api-creator-documents';
import { LegalStageNavigation, WORKSPACE_STAGES } from '@/components/creator/legal/LegalStageNavigation';
import { LegalRequirementCanvas } from '@/components/creator/legal/LegalRequirementCanvas';
import { LegalAiGuideRail } from '@/components/creator/legal/LegalAiGuideRail';
import { LegalEvidenceModal } from '@/components/creator/legal/LegalEvidenceModal';
import { LegalEvidenceVaultView } from '@/components/creator/legal/LegalEvidenceVaultView';
import { cn } from '@/lib/utils';
import { FolderCheck } from 'lucide-react';
import { withIdeaContext } from '@/lib/creator-routes';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

export default function ComplianceWorkspacePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryIdeaId = searchParams.get('ideaId');
  const initialStageParam = searchParams.get('stage');
  const initialReqParam = searchParams.get('requirement');

  const { completeStep } = useCreatorProgress();
  const queryClient = useQueryClient();

  // Active workspace state: 'roadmap' | 'vault'
  const [workspaceView, setWorkspaceView] = useState<'roadmap' | 'vault'>(
    initialStageParam === 'evidence_vault' ? 'vault' : 'roadmap'
  );
  const [selectedStage, setSelectedStage] = useState<string>(
    initialStageParam && initialStageParam !== 'evidence_vault' ? initialStageParam : 'overview'
  );
  const [selectedItemId, setSelectedItemId] = useState<string | null>(initialReqParam || null);
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
  const [evidenceItemTarget, setEvidenceItemTarget] = useState<ExtendedLegalChecklistItem | null>(null);
  const [isChangeReviewOpen, setIsChangeReviewOpen] = useState(false);
  const [isAiGuideOpen, setIsAiGuideOpen] = useState(false);

  // Authoritative overview query (Stage 5 API)
  const {
    data: overview,
    isLoading: overviewLoading,
    isError: overviewError,
    refetch: refetchOverview,
  } = useQuery<LegalComplianceOverview>({
    queryKey: ['creator', 'legalOverview', queryIdeaId],
    queryFn: () => creatorJourneyApi.getLegalOverview(queryIdeaId),
    staleTime: 30_000,
  });

  // Vault documents query for evidence attachment
  const { data: documents = [] } = useQuery<CreatorIdeaDocument[]>({
    queryKey: ['creator', 'documents', queryIdeaId],
    queryFn: () => creatorDocumentsApi.list(queryIdeaId || ''),
    enabled: Boolean(queryIdeaId),
  });

  // Evaluate / Refresh mutation
  const evaluateMutation = useMutation({
    mutationFn: () => creatorJourneyApi.evaluateLegalCompliance(queryIdeaId),
    onSuccess: (data) => {
      queryClient.setQueryData(['creator', 'legalOverview', queryIdeaId], data);
      queryClient.invalidateQueries({ queryKey: ['creator', 'dashboardRefs', queryIdeaId] });
    },
  });

  // Status update mutation
  const statusMutation = useMutation({
    mutationFn: ({ itemId, newStatus }: { itemId: string; newStatus: ChecklistStatus }) =>
      creatorJourneyApi.updateLegalItemStatus(itemId, newStatus, queryIdeaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator', 'legalOverview', queryIdeaId] });
      queryClient.invalidateQueries({ queryKey: ['creator', 'dashboardRefs', queryIdeaId] });
    },
  });

  // Evidence attach mutation
  const evidenceMutation = useMutation({
    mutationFn: ({ itemId, documentId }: { itemId: string; documentId: string }) =>
      creatorJourneyApi.attachLegalEvidence(itemId, documentId, undefined, undefined, queryIdeaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator', 'legalOverview', queryIdeaId] });
      queryClient.invalidateQueries({ queryKey: ['creator', 'documents', queryIdeaId] });
      queryClient.invalidateQueries({ queryKey: ['creator', 'dashboardRefs', queryIdeaId] });
    },
  });

  // Unlink evidence mutation
  const unlinkMutation = useMutation({
    mutationFn: ({ requirementId, documentId }: { requirementId: string; documentId: string }) =>
      creatorJourneyApi.unlinkLegalEvidence(requirementId, documentId, queryIdeaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator', 'legalOverview', queryIdeaId] });
      queryClient.invalidateQueries({ queryKey: ['creator', 'documents', queryIdeaId] });
      queryClient.invalidateQueries({ queryKey: ['creator', 'dashboardRefs', queryIdeaId] });
    },
  });

  // Update evidence status mutation
  const updateEvidenceStatusMutation = useMutation({
    mutationFn: ({ linkId, status }: { linkId: string; status: string }) =>
      creatorJourneyApi.updateEvidenceStatus(linkId, status, undefined, queryIdeaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creator', 'legalOverview', queryIdeaId] });
      queryClient.invalidateQueries({ queryKey: ['creator', 'dashboardRefs', queryIdeaId] });
    },
  });

  const assessment = overview?.assessment;
  const items: ExtendedLegalChecklistItem[] = assessment?.items || [];
  const applicableItems = items.filter((i) => i.status !== 'not_applicable');

  // Currently selected requirement entity
  const selectedItem = useMemo(() => {
    if (!selectedItemId) {
      if (selectedStage !== 'overview') {
        const stageItems = applicableItems.filter((i) => i.stage === selectedStage);
        return stageItems[0] || null;
      }
      return null;
    }
    return items.find((i) => i.id === selectedItemId) || null;
  }, [selectedItemId, selectedStage, items, applicableItems]);

  const handleSelectStage = (stageKey: string) => {
    if (stageKey === 'evidence_vault') {
      setWorkspaceView('vault');
      return;
    }
    setWorkspaceView('roadmap');
    setSelectedStage(stageKey);
    // Auto-select first item in that stage if exists
    if (stageKey !== 'overview') {
      const stageItems = applicableItems.filter((i) => i.stage === stageKey);
      if (stageItems.length > 0) {
        setSelectedItemId(stageItems[0].id);
      } else {
        setSelectedItemId(null);
      }
    } else {
      setSelectedItemId(null);
    }
  };

  const handleSelectItem = (item: ExtendedLegalChecklistItem) => {
    setSelectedItemId(item.id);
    if (item.stage && item.stage !== selectedStage) {
      setSelectedStage(item.stage);
    }
  };

  const handleOpenRequirementFromVault = (stage: string, requirementId: string) => {
    setWorkspaceView('roadmap');
    setSelectedStage(stage);
    setSelectedItemId(requirementId);
  };

  const handleStatusChange = async (item: ExtendedLegalChecklistItem, newStatus: ChecklistStatus) => {
    await statusMutation.mutateAsync({ itemId: item.id, newStatus });
  };

  const handleOpenEvidenceModal = (item: ExtendedLegalChecklistItem) => {
    setEvidenceItemTarget(item);
    setIsEvidenceModalOpen(true);
  };

  const handleEvidenceAttached = async (documentId: string) => {
    if (!evidenceItemTarget) return;
    await evidenceMutation.mutateAsync({ itemId: evidenceItemTarget.id, documentId });
  };

  const handleProceedNext = () => {
    completeStep(3, 4);
    router.push(withIdeaContext('/dashboard/creator/phase-3/formation', queryIdeaId));
  };

  const stageName = useMemo(() => {
    const s = WORKSPACE_STAGES.find((st) => st.key === selectedStage);
    return s ? s.label : 'Overview';
  }, [selectedStage]);

  return (
    <Phase3SetupShell
      fullWidth
      stepEyebrow="STEP 3.4 · LEGAL & COMPLIANCE"
      title="Legal & Compliance Intelligence"
      description="Personalized statutory roadmap and evidence tracking based on your verified France business classification."
      headerActions={
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-badge font-semibold gap-1 py-1 px-3 bg-muted/40 border-border">
            <span>🇫🇷</span> France Rules (FR-2026.1)
          </Badge>
          {overview?.isPotentiallyOutdated && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => evaluateMutation.mutate()}
              disabled={evaluateMutation.isPending}
              className="text-xs h-8 gap-1.5 border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-300 hover:bg-amber-500/20"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', evaluateMutation.isPending && 'animate-spin')} />
              Refresh Roadmap
            </Button>
          )}
        </div>
      }
    >
      {/* Global Stale State Warning (Reason-Aware) */}
      {(overview?.staleMetadata?.isStale ?? overview?.isPotentiallyOutdated) && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/25 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
          <div className="flex items-start gap-3 text-amber-900 dark:text-amber-300">
            <Clock className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">
                  {overview?.staleMetadata?.staleReason === 'RulesUpdated'
                    ? 'French statutory guidance updated'
                    : 'Business changes detected'}
                </span>
                <Badge variant="outline" className="text-[10px] bg-amber-500/20 text-amber-900 dark:text-amber-200 border-amber-500/30 font-semibold">
                  Update available
                </Badge>
              </div>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Your venture information changed after your last legal assessment. Your legal roadmap may need updating.
              </p>
              {overview?.staleMetadata?.humanChangeDescriptions && overview.staleMetadata.humanChangeDescriptions.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] font-semibold text-muted-foreground">Changes detected:</span>
                  {overview.staleMetadata.humanChangeDescriptions.map((desc, idx) => (
                    <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-amber-500/15 text-amber-900 dark:text-amber-200 border border-amber-500/20">
                      {desc}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsChangeReviewOpen(true)}
              className="text-xs h-8 px-3 rounded-xl border-amber-500/30 bg-card hover:bg-amber-500/10 text-foreground font-medium"
            >
              Review Changes
            </Button>
            <Button
              size="sm"
              onClick={() => evaluateMutation.mutate()}
              disabled={evaluateMutation.isPending}
              className="text-xs h-8 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white shrink-0 shadow-none font-medium"
            >
              <RefreshCw className={cn('w-3.5 h-3.5 mr-1.5', evaluateMutation.isPending && 'animate-spin')} />
              Refresh Legal Analysis
            </Button>
          </div>
        </div>
      )}

      {/* Change Review Modal */}
      {isChangeReviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in-0">
          <Card className="w-full max-w-lg border border-border bg-card shadow-2xl rounded-2xl overflow-hidden p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-primary" />
                <h3 className="text-base font-bold text-foreground">Legal Roadmap Changes</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsChangeReviewOpen(false)}
                className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground"
              >
                ✕
              </Button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                  Upstream Signals Changed
                </span>
                {overview?.staleMetadata?.humanChangeDescriptions && overview.staleMetadata.humanChangeDescriptions.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {overview.staleMetadata.humanChangeDescriptions.map((desc, idx) => (
                      <Badge key={idx} variant="secondary" className="px-2.5 py-1 text-xs font-semibold">
                        {desc}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">General business model update detected.</p>
                )}
              </div>

              {overview?.reconciliationSummary && (
                <div className="space-y-3 pt-2 border-t border-border">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Last Reconciliation Impact
                  </span>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 block font-mono">
                        +{overview.reconciliationSummary.addedRequirements.length}
                      </span>
                      <span className="text-[10px] text-muted-foreground">Added</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-muted/40 border border-border">
                      <span className="text-lg font-bold text-foreground block font-mono">
                        {overview.reconciliationSummary.unchangedRequirementsCount}
                      </span>
                      <span className="text-[10px] text-muted-foreground">Preserved</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-muted/20 border border-border">
                      <span className="text-lg font-bold text-muted-foreground block font-mono">
                        -{overview.reconciliationSummary.removedRequirements.length}
                      </span>
                      <span className="text-[10px] text-muted-foreground">Archived</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-3 bg-muted/30 border border-border/50 rounded-xl space-y-1 text-muted-foreground leading-relaxed">
                <p className="font-medium text-foreground">Progress & Evidence Protection:</p>
                <p>
                  Refreshing your legal analysis reconciles statutory rules with current business signals.
                  Your existing completion progress, notes, and attached evidence files in the vault will be strictly preserved.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsChangeReviewOpen(false)}
                className="text-xs rounded-xl"
              >
                Close
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setIsChangeReviewOpen(false);
                  evaluateMutation.mutate();
                }}
                disabled={evaluateMutation.isPending}
                className="text-xs rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
              >
                <RefreshCw className={cn('w-3.5 h-3.5', evaluateMutation.isPending && 'animate-spin')} />
                Refresh Legal Analysis
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* 1. Loading State */}
      {overviewLoading && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-3 space-y-3">
            <Skeleton className="h-28 w-full rounded-2xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div className="md:col-span-6 space-y-4">
            <Skeleton className="h-44 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
          <div className="md:col-span-3 space-y-3">
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        </div>
      )}

      {/* 2. Error State */}
      {!overviewLoading && overviewError && (
        <Card className="p-8 border-dashed border-destructive/40 bg-destructive/5 rounded-2xl text-center space-y-3 max-w-lg mx-auto">
          <AlertTriangle className="w-8 h-8 text-destructive mx-auto" />
          <h3 className="text-sm font-bold text-foreground">We couldn&apos;t load your legal roadmap</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            There was a problem retrieving your personalized legal overview.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchOverview()}
            className="text-xs rounded-xl gap-1.5 mx-auto border-border"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </Button>
        </Card>
      )}

      {/* 3. Empty State (No Assessment) */}
      {!overviewLoading && !overviewError && (!overview?.hasAssessment || !assessment) && (
        <Card className="p-10 border border-border rounded-2xl bg-card shadow-sm text-center space-y-4 max-w-xl mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Scale className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-foreground">Build Your France Legal Roadmap</h3>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-md mx-auto">
              MBC will classify your current business model, customer types, and revenue tiers to synthesize a deterministic statutory roadmap for France.
            </p>
          </div>
          <Button
            onClick={() => evaluateMutation.mutate()}
            disabled={evaluateMutation.isPending}
            className="rounded-xl text-xs px-5 h-9 bg-primary hover:bg-primary/95 text-primary-foreground font-medium shadow-none gap-2"
          >
            {evaluateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing Business Plan...
              </>
            ) : (
              <>
                Analyse My Business
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </Card>
      )}

      {/* 4. Active Legal Workspace (Roadmap vs Vault) */}
      {!overviewLoading && !overviewError && overview?.hasAssessment && assessment && (
        <div className="space-y-6">
          {/* Workspace Primary Section Switcher */}
          <div className="flex items-center justify-between border-b border-border/80 pb-3 gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setWorkspaceView('roadmap')}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all',
                  workspaceView === 'roadmap'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted/60'
                )}
              >
                <Layers className="w-3.5 h-3.5" />
                Legal Roadmap & Requirements
              </button>
              <button
                type="button"
                onClick={() => setWorkspaceView('vault')}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all',
                  workspaceView === 'vault'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted/60'
                )}
              >
                <FolderCheck className="w-3.5 h-3.5" />
                Evidence Vault & Audit Trail
                {(documents.length > 0 || (overview.evidenceLinks?.length ?? 0) > 0) && (
                  <Badge
                    variant={workspaceView === 'vault' ? 'secondary' : 'outline'}
                    className="text-[10px] px-1.5 py-0 font-mono ml-0.5"
                  >
                    {overview.evidenceLinks?.length ?? documents.length}
                  </Badge>
                )}
              </button>
            </div>

            {/* AI Guide Trigger (Visible on-demand when rail is collapsed below 1728px) */}
            {workspaceView === 'roadmap' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAiGuideOpen(true)}
                className="3xl:hidden flex items-center gap-1.5 text-xs font-medium rounded-xl h-8 px-3 border-border hover:bg-muted/60"
              >
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>AI Guide</span>
              </Button>
            )}
          </div>

          {/* VIEW A: EVIDENCE VAULT & AUDIT TRAIL */}
          {workspaceView === 'vault' ? (
            <LegalEvidenceVaultView
              ideaId={queryIdeaId || ''}
              overview={overview}
              documents={documents}
              onOpenRequirement={handleOpenRequirementFromVault}
              onOpenEvidenceModal={handleOpenEvidenceModal}
              onUnlinkEvidence={async (reqId, docId) => {
                await unlinkMutation.mutateAsync({ requirementId: reqId, documentId: docId });
              }}
              onUpdateEvidenceStatus={async (linkId, status) => {
                await updateEvidenceStatusMutation.mutateAsync({ linkId, status });
              }}
              isMutating={unlinkMutation.isPending || updateEvidenceStatusMutation.isPending}
            />
          ) : (
            /* VIEW B: 3-PANE ROADMAP WORKSPACE */
            <div className="flex flex-col lg:flex-row gap-6 items-start">
              {/* LEFT PANE: Stage Navigation & Summary */}
              <LegalStageNavigation
                selectedStage={selectedStage}
                onSelectStage={handleSelectStage}
                planningReadinessPct={overview.planningReadinessPct}
                stageBreakdown={overview.stageBreakdown}
                totalApplicableCount={applicableItems.length}
                totalCompletedCount={
                  applicableItems.filter(
                    (i) => i.status === 'completed' || i.status === 'done' || i.status === 'reviewed',
                  ).length
                }
                needsInfoCount={
                  applicableItems.filter(
                    (i) => i.status === 'needs_information' || i.evaluationStatus === 'needs_information',
                  ).length
                }
                actionRequiredCount={
                  applicableItems.filter(
                    (i) =>
                      i.status === 'action_required' ||
                      i.status === 'not_started' ||
                      i.status === 'pending',
                  ).length
                }
                evidenceVaultCount={overview.evidenceLinks?.length ?? documents.length}
              />

              {/* CENTER PANE: Primary Requirement & Evidence Canvas */}
              <LegalRequirementCanvas
                selectedStage={selectedStage}
                stageName={stageName}
                items={applicableItems}
                selectedItem={selectedItem}
                onSelectItem={handleSelectItem}
                onStatusChange={handleStatusChange}
                onOpenEvidenceModal={handleOpenEvidenceModal}
                documents={documents}
                detectedArchetypes={overview.detectedArchetypes}
                planningReadinessPct={overview.planningReadinessPct}
                onGoToStage={handleSelectStage}
                evidenceLinks={overview.evidenceLinks}
                onViewInVault={() => setWorkspaceView('vault')}
                onOpenAiGuide={() => setIsAiGuideOpen(true)}
              />

              {/* RIGHT PANE: Contextual AI Assistant Rail */}
              {/* Stacked on mobile/tablet (<1024px), Collapsed to Sheet on 1024px–1727px, Docked on >= 1728px (3xl) */}
              <div className="w-full lg:hidden 3xl:block 3xl:w-auto shrink-0">
                <LegalAiGuideRail
                  selectedItem={selectedItem}
                  detectedArchetypes={overview.detectedArchetypes}
                />
              </div>
            </div>
          )}

          {/* On-Demand AI Guide Sheet (Accessible below 1728px) */}
          <Sheet open={isAiGuideOpen} onOpenChange={setIsAiGuideOpen}>
            <SheetContent
              side="right"
              className="w-full sm:max-w-md p-6 pt-12 flex flex-col border-l border-border bg-card overflow-hidden"
            >
              <SheetHeader className="sr-only">
                <SheetTitle>MBC Legal Guide</SheetTitle>
                <SheetDescription>Contextual statutory guidance and legal intelligence</SheetDescription>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto pr-1">
                <LegalAiGuideRail
                  selectedItem={selectedItem}
                  detectedArchetypes={overview.detectedArchetypes}
                  className="w-full lg:w-full border-0 shadow-none bg-transparent p-0 rounded-none"
                />
              </div>
            </SheetContent>
          </Sheet>

          {/* Statutory Planning Guidance Notice */}
          <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 text-xs text-muted-foreground flex items-start gap-3 mt-6">
            <Scale className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <span className="font-semibold text-foreground">MONDIAL BUSINESS CREATION (MBC) Planning Notice:</span> This legal intelligence workspace provides automated statutory guidance and planning readiness based on French commercial regulations (FR-2026.1). It does not constitute formal legal advice, certified statutory compliance, or official government incorporation.
            </p>
          </div>

          {/* Bottom Workflow Navigation Bar */}
          <div className="flex items-center justify-between gap-4 pt-6 border-t border-border/70 mt-8">
            <Button
              variant="ghost"
              onClick={() => router.push(withIdeaContext('/dashboard/creator/phase-3/forecast', queryIdeaId))}
              className="text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Financial Forecast
            </Button>
            <Button
              onClick={handleProceedNext}
              className="gap-2 font-medium text-xs rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground shadow-none px-5"
            >
              Proceed to Company Formation <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Evidence Upload / Link Modal */}
      {isEvidenceModalOpen && queryIdeaId && (
        <LegalEvidenceModal
          open={isEvidenceModalOpen}
          onClose={() => {
            setIsEvidenceModalOpen(false);
            setEvidenceItemTarget(null);
          }}
          ideaId={queryIdeaId}
          item={evidenceItemTarget}
          existingDocuments={documents}
          onEvidenceAttached={handleEvidenceAttached}
        />
      )}
    </Phase3SetupShell>
  );
}
