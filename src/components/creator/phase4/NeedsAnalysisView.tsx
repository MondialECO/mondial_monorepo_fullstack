'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Layers,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Sparkles,
  ChevronDown,
  Shield,
  DollarSign,
  Briefcase,
  Cpu,
  Scale,
  Users,
  Megaphone,
  Compass,
  Check,
  Plus,
  ExternalLink,
  Tag,
  Rocket,
  Circle,
} from 'lucide-react';
import type {
  NeedsAnalysis,
  CreatorNeed,
  NeedCategory,
  NeedRequirementType,
  NeedPriority,
  NeedTiming,
  NeedSystemStatus,
  NeedFounderState,
  UpdateNeedStateRequest,
} from '@/types/creator/needs';

interface NeedsAnalysisViewProps {
  ideaId: string;
  projectName: string;
  analysis: NeedsAnalysis | null;
  updateAvailable: boolean;
  changedSources: string[];
  totalActiveNeeds: number;
  criticalCount: number;
  highCount: number;
  satisfiedCount: number;
  isLoading: boolean;
  isGenerating?: boolean;
  error?: string | null;
  gateError?: { code: string; message: string } | null;
  onGenerate: () => Promise<void>;
  onRefresh: () => Promise<void>;
  onUpdateNeedState: (needKey: string, req: UpdateNeedStateRequest) => Promise<void>;
  onKeepCurrent: () => Promise<void>;
  onClearError?: () => void;
}

interface CategoryConfig {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
}

const CATEGORY_MAP: Record<string, CategoryConfig> = {
  Brand: {
    label: 'BRAND',
    icon: Megaphone,
    iconBg: 'bg-purple-500/10 dark:bg-purple-900/20',
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
  Marketing: {
    label: 'BRAND',
    icon: Megaphone,
    iconBg: 'bg-purple-500/10 dark:bg-purple-900/20',
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
  Finance: {
    label: 'FINANCE',
    icon: DollarSign,
    iconBg: 'bg-emerald-500/10 dark:bg-emerald-900/20',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  Market: {
    label: 'MARKET',
    icon: Compass,
    iconBg: 'bg-pink-500/10 dark:bg-pink-900/20',
    iconColor: 'text-pink-600 dark:text-pink-400',
  },
  Sales: {
    label: 'MARKET',
    icon: Compass,
    iconBg: 'bg-pink-500/10 dark:bg-pink-900/20',
    iconColor: 'text-pink-600 dark:text-pink-400',
  },
  'Legal & Administration': {
    label: 'LEGAL & ADMIN',
    icon: Scale,
    iconBg: 'bg-amber-500/10 dark:bg-amber-900/20',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  LegalAdmin: {
    label: 'LEGAL & ADMIN',
    icon: Scale,
    iconBg: 'bg-amber-500/10 dark:bg-amber-900/20',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  Skills: {
    label: 'SKILLS',
    icon: Users,
    iconBg: 'bg-sky-500/10 dark:bg-sky-900/20',
    iconColor: 'text-sky-600 dark:text-sky-400',
  },
  Team: {
    label: 'SKILLS',
    icon: Users,
    iconBg: 'bg-sky-500/10 dark:bg-sky-900/20',
    iconColor: 'text-sky-600 dark:text-sky-400',
  },
  Pricing: {
    label: 'PRICING',
    icon: Tag,
    iconBg: 'bg-teal-500/10 dark:bg-teal-900/20',
    iconColor: 'text-teal-600 dark:text-teal-400',
  },
  'Launch Assets': {
    label: 'LAUNCH ASSETS',
    icon: Rocket,
    iconBg: 'bg-indigo-500/10 dark:bg-indigo-900/20',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
  },
  Operations: {
    label: 'OPERATIONS',
    icon: Layers,
    iconBg: 'bg-blue-500/10 dark:bg-blue-900/20',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  Technology: {
    label: 'TECHNOLOGY',
    icon: Cpu,
    iconBg: 'bg-cyan-500/10 dark:bg-cyan-900/20',
    iconColor: 'text-cyan-600 dark:text-cyan-400',
  },
  Services: {
    label: 'SERVICES',
    icon: Briefcase,
    iconBg: 'bg-violet-500/10 dark:bg-violet-900/20',
    iconColor: 'text-violet-600 dark:text-violet-400',
  },
};

function getCategoryConfig(category: string): CategoryConfig {
  return (
    CATEGORY_MAP[category] || {
      label: category.toUpperCase(),
      icon: Layers,
      iconBg: 'bg-muted',
      iconColor: 'text-muted-foreground',
    }
  );
}

function getPriorityLabel(priority: NeedPriority | string): string {
  switch (priority) {
    case 'Critical':
      return 'Critical priority';
    case 'High':
      return 'High priority';
    case 'Medium':
      return 'Medium priority';
    case 'Low':
      return 'Low priority';
    default:
      return `${priority} priority`;
  }
}

export function NeedsAnalysisView({
  ideaId,
  projectName,
  analysis,
  updateAvailable,
  changedSources,
  totalActiveNeeds,
  criticalCount,
  highCount,
  satisfiedCount,
  isLoading,
  isGenerating = false,
  error,
  gateError,
  onGenerate,
  onRefresh,
  onUpdateNeedState,
  onKeepCurrent,
  onClearError,
}: NeedsAnalysisViewProps) {
  const [staleDismissed, setStaleDismissed] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(() => new Set());
  const [updatingNeedKey, setUpdatingNeedKey] = useState<string | null>(null);

  // Combine ActiveNeeds and CoveredRequirements into one authoritative list
  const allNeeds: CreatorNeed[] = React.useMemo(() => {
    if (!analysis) return [];
    const active = analysis.activeNeeds || [];
    const covered = analysis.coveredRequirements || [];
    return [...active, ...covered];
  }, [analysis]);

  // Expand the first need by default if none expanded
  React.useEffect(() => {
    if (allNeeds.length > 0 && expandedKeys.size === 0) {
      setExpandedKeys(new Set([allNeeds[0].key]));
    }
  }, [allNeeds]);

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleConfirmNeed = async (needKey: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      setUpdatingNeedKey(needKey);
      await onUpdateNeedState(needKey, { founderState: 'Confirmed' });
    } finally {
      setUpdatingNeedKey(null);
    }
  };

  const handleDeferNeed = async (needKey: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      setUpdatingNeedKey(needKey);
      await onUpdateNeedState(needKey, { founderState: 'Deferred' });
    } finally {
      setUpdatingNeedKey(null);
    }
  };

  const handleSaveFounderInfo = async (needKey: string, infoText: string) => {
    try {
      setUpdatingNeedKey(needKey);
      await onUpdateNeedState(needKey, { founderInformation: infoText.trim() });
    } finally {
      setUpdatingNeedKey(null);
    }
  };

  // Compute metrics from actual authoritative list
  const actualSatisfiedCount = allNeeds.filter(
    (n) => n.systemStatus === 'Satisfied' || n.founderState === 'ClaimedSatisfied'
  ).length;

  const actualIdentifiedCount = allNeeds.filter(
    (n) => n.systemStatus !== 'Satisfied' && n.founderState !== 'ClaimedSatisfied'
  ).length;

  const awaitingReviewCount = allNeeds.filter(
    (n) => n.founderState === 'Unreviewed'
  ).length;

  // 1. Prerequisite / Gate Error State
  if (gateError) {
    return (
      <div className="p-6 sm:p-8 rounded-2xl bg-card border border-border shadow-sm space-y-4 max-w-2xl mx-auto my-8">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">
              Phase 4 Requirements Check
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {gateError.message}
            </p>
          </div>
        </div>
        <div className="pt-2 flex items-center gap-3">
          <Link
            href={`/dashboard/creator/phase-4/roadmap?ideaId=${encodeURIComponent(ideaId)}`}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm"
          >
            Go to Operational Roadmap
          </Link>
          <Link
            href={`/dashboard/creator/phase-4/snapshot?ideaId=${encodeURIComponent(ideaId)}`}
            className="px-4 py-2 rounded-xl bg-card border border-border text-foreground text-xs font-semibold hover:bg-muted transition-colors shadow-sm"
          >
            Review Snapshot
          </Link>
        </div>
      </div>
    );
  }

  // 2. Loading State
  if (isLoading && !analysis) {
    return (
      <div className="py-16 flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-7 h-7 text-primary animate-spin" />
        <div className="text-sm font-medium text-muted-foreground">
          Loading your needs & requirements analysis...
        </div>
      </div>
    );
  }

  // 3. Not Generated State
  if (!analysis) {
    return (
      <div className="p-8 sm:p-12 rounded-2xl bg-card border border-border shadow-sm text-center max-w-xl mx-auto space-y-5 my-8">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
          <Sparkles className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-foreground">
            Analyze Needs & Requirements
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            MBC will evaluate your project snapshot, operational roadmap, company formation, and founder profile to map exact capability, service, legal, and capital requirements.
          </p>
        </div>
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className="px-6 py-2.5 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm font-semibold transition-all shadow-sm inline-flex items-center gap-2 disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Analyzing requirements...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Generate Needs Analysis</span>
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Inline Error Notice */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 flex items-start justify-between gap-3 text-xs leading-relaxed">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <strong>Error:</strong> {error}
            </div>
          </div>
          {onClearError && (
            <button
              onClick={onClearError}
              className="text-xs font-semibold hover:underline shrink-0"
            >
              Dismiss
            </button>
          )}
        </div>
      )}

      {/* 1. Update Available Notice */}
      {updateAvailable && changedSources.length > 0 && !staleDismissed && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-start sm:items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5 sm:mt-0" />
            <span className="text-xs leading-relaxed">
              <strong className="font-semibold text-foreground">Update available:</strong> Changed project information may affect these needs. Updates detected in:{' '}
              <span className="font-medium underline decoration-amber-500/50 underline-offset-2">
                {changedSources.join(', ')}
              </span>.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              onClick={() => setShowReviewModal(true)}
              className="px-3 py-1.5 rounded-lg bg-card border border-border hover:bg-muted text-foreground font-semibold text-xs transition-colors shadow-sm"
            >
              Review changes
            </button>
            <button
              onClick={async () => {
                setStaleDismissed(true);
                await onKeepCurrent();
              }}
              className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
            >
              Keep current version
            </button>
          </div>
        </div>
      )}

      {/* 2. Compact Horizontal Summary Surface */}
      <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Side: Total Count + Badges + Supporting Copy */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="text-lg sm:text-xl font-bold text-foreground">
              {allNeeds.length} {allNeeds.length === 1 ? 'Requirement' : 'Requirements'}
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {actualSatisfiedCount} Satisfied
              </span>

              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/80">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                {actualIdentifiedCount} Identified
              </span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Confirming a need records your decision. It does not mean the need has been met.
          </p>
        </div>

        {/* Subtle Vertical Divider on Desktop */}
        <div className="hidden md:block w-px self-stretch bg-border/80 my-0.5" />

        {/* Right Side: Awaiting Review Count */}
        <div className="shrink-0 flex items-center">
          {awaitingReviewCount > 0 ? (
            <div className="text-xs sm:text-sm font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              {awaitingReviewCount} {awaitingReviewCount === 1 ? 'need is' : 'needs are'} awaiting your review
            </div>
          ) : (
            <div className="text-xs sm:text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>All needs reviewed</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. Requirement Accordion List */}
      <div className="space-y-3">
        {allNeeds.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground italic rounded-2xl bg-card border border-border">
            No requirements recorded for this project yet.
          </div>
        ) : (
          allNeeds.map((need, index) => {
            const isExpanded = expandedKeys.has(need.key);
            const isUpdating = updatingNeedKey === need.key;
            const categoryConfig = getCategoryConfig(need.category);
            const CategoryIcon = categoryConfig.icon;
            const priorityText = getPriorityLabel(need.priority);

            const isSatisfied =
              need.systemStatus === 'Satisfied' ||
              need.founderState === 'ClaimedSatisfied';

            return (
              <div
                key={need.key}
                id={`need-${need.key}`}
                className="rounded-2xl bg-card border border-border/80 shadow-sm transition-all overflow-hidden"
              >
                {/* Accordion Row Header */}
                <div
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/30 transition-colors rounded-2xl"
                >
                  {/* Left: Accordion Toggle Button (Icon 32px, 8px corners + Category & Title) */}
                  <button
                    type="button"
                    onClick={() => toggleExpand(need.key)}
                    aria-expanded={isExpanded}
                    aria-controls={`detail-${need.key}`}
                    className="flex items-center gap-3.5 min-w-0 text-left cursor-pointer group flex-1 focus:outline-none"
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${categoryConfig.iconBg} ${categoryConfig.iconColor} group-hover:scale-105 transition-transform`}
                    >
                      <CategoryIcon className="w-4 h-4" />
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        {categoryConfig.label}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm sm:text-base font-semibold text-foreground tracking-tight leading-snug group-hover:text-primary transition-colors">
                          {need.title}
                        </h3>
                        <span className="text-xs text-muted-foreground font-normal">
                          · {priorityText}
                        </span>
                      </div>
                    </div>
                  </button>

                  {/* Right: Fulfilment Badge + Decision Badge + Inline Actions + Chevron Toggle */}
                  <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap justify-between sm:justify-end shrink-0">
                    {/* Fulfilment Status Badge */}
                    {isSatisfied ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span>Satisfied</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/80">
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                        <span>Identified</span>
                      </span>
                    )}

                    {/* Decision Badge */}
                    {need.founderState === 'Confirmed' && (
                      <span className="inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                        {isExpanded ? 'Decision: Confirmed' : 'Confirmed'}
                      </span>
                    )}

                    {need.founderState === 'Deferred' && (
                      <span className="inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                        Deferred
                      </span>
                    )}

                    {need.founderState === 'Unreviewed' && (
                      <span className="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        Awaiting your review
                      </span>
                    )}

                    {/* Inline Action Buttons for Awaiting Review */}
                    {need.founderState === 'Unreviewed' && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => handleConfirmNeed(need.key, e)}
                          disabled={isUpdating}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-card border border-border hover:bg-muted text-foreground transition-all shadow-sm disabled:opacity-50"
                        >
                          Confirm need
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeferNeed(need.key, e)}
                          disabled={isUpdating}
                          className="px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                        >
                          Defer for now
                        </button>
                      </div>
                    )}

                    {/* Accordion Chevron Button */}
                    <button
                      type="button"
                      onClick={() => toggleExpand(need.key)}
                      aria-label={isExpanded ? `Collapse ${need.title}` : `Expand ${need.title}`}
                      className="p-1 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                    >
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Expanded Inset Panel (12px corners, 2-column breakdown, connected work, built from, founder info) */}
                {isExpanded && (
                  <ExpandedNeedDetail
                    ideaId={ideaId}
                    need={need}
                    isUpdating={isUpdating}
                    onConfirm={() => handleConfirmNeed(need.key)}
                    onDefer={() => handleDeferNeed(need.key)}
                    onSaveInfo={(text) => handleSaveFounderInfo(need.key, text)}
                  />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 4. Page Footer & Journey Navigation */}
      <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Back Link */}
        <Link
          href={`/dashboard/creator/phase-4/roadmap?ideaId=${encodeURIComponent(ideaId)}`}
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors self-start sm:self-center"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Roadmap</span>
        </Link>

        {/* Right Action: Supporting Copy + Primary Pill Button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto justify-end">
          <span className="text-xs text-muted-foreground sm:text-right">
            Your reviewed needs will help shape the next step.
          </span>
          <Link
            href={`/dashboard/creator/phase-4/skills?ideaId=${encodeURIComponent(ideaId)}`}
            className="w-full sm:w-auto px-7 py-2.5 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm font-semibold transition-all shadow-sm inline-flex items-center justify-center gap-2"
          >
            <span>Continue to Skills & Training</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Review Changes Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground">
                Review Upstream Changes
              </h3>
              <button
                onClick={() => setShowReviewModal(false)}
                className="text-muted-foreground hover:text-foreground text-xs font-semibold"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
              <p>
                The following upstream project records have been updated since this requirements analysis was generated:
              </p>
              <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-1.5">
                {changedSources.map((src, i) => (
                  <div key={i} className="flex items-center gap-2 text-foreground font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span>{src}</span>
                  </div>
                ))}
              </div>
              <p className="text-[11px]">
                Refreshing will recalculate requirement coverage against your latest snapshot, roadmap, and profile data while preserving all your confirmed decisions and submitted notes.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={async () => {
                  setShowReviewModal(false);
                  setStaleDismissed(true);
                  await onKeepCurrent();
                }}
                className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                Keep current version
              </button>
              <button
                onClick={async () => {
                  setShowReviewModal(false);
                  await onRefresh();
                }}
                disabled={isGenerating}
                className="px-5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-lg transition-all shadow flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh needs analysis</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------- SUBCOMPONENT: EXPANDED DETAIL PANEL ----------------
interface ExpandedNeedDetailProps {
  ideaId: string;
  need: CreatorNeed;
  isUpdating: boolean;
  onConfirm: () => Promise<void>;
  onDefer: () => Promise<void>;
  onSaveInfo: (text: string) => Promise<void>;
}

function ExpandedNeedDetail({
  ideaId,
  need,
  isUpdating,
  onConfirm,
  onDefer,
  onSaveInfo,
}: ExpandedNeedDetailProps) {
  const [infoText, setInfoText] = useState<string>(need.founderInformation || '');
  const [isSavedNotice, setIsSavedNotice] = useState<boolean>(false);

  const handleInfoSubmit = async () => {
    if (!infoText.trim()) return;
    await onSaveInfo(infoText);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 3000);
  };

  // Resolve source link
  const resolveSourceLink = (sources: string[]) => {
    const s = sources.join(' ').toLowerCase();
    if (s.includes('roadmap')) {
      return `/dashboard/creator/phase-4/roadmap?ideaId=${encodeURIComponent(ideaId)}`;
    }
    if (s.includes('model')) {
      return `/dashboard/creator/business-model?ideaId=${encodeURIComponent(ideaId)}`;
    }
    if (s.includes('forecast')) {
      return `/dashboard/creator/forecast?ideaId=${encodeURIComponent(ideaId)}`;
    }
    return `/dashboard/creator/phase-4/snapshot?ideaId=${encodeURIComponent(ideaId)}`;
  };

  return (
    <div
      id={`detail-${need.key}`}
      className="px-5 pb-5 pt-0 animate-in fade-in-50 duration-150"
    >
      <div className="rounded-xl p-5 sm:p-6 bg-muted/20 border border-border/70 space-y-6">
        {/* A. 2-Column Core Analytical Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: WHAT IS NEEDED & WHY THIS APPLIES */}
          <div className="space-y-4">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                WHAT IS NEEDED
              </div>
              <p className="text-xs sm:text-sm text-foreground leading-relaxed mt-1">
                {need.whatIsNeeded || need.description}
              </p>
            </div>

            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                WHY THIS APPLIES
              </div>
              <p className="text-xs sm:text-sm text-foreground leading-relaxed mt-1">
                {need.whyThisApplies || need.whyNeeded}
              </p>
            </div>
          </div>

          {/* Right Column: WHAT YOU ALREADY HAVE & WHAT IS STILL MISSING */}
          <div className="space-y-4">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                WHAT YOU ALREADY HAVE
              </div>
              <p className="text-xs sm:text-sm text-foreground leading-relaxed mt-1">
                {need.whatYouAlreadyHave || 'Not assessed yet.'}
              </p>
            </div>

            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                WHAT IS STILL MISSING
              </div>
              <p className="text-xs sm:text-sm text-foreground leading-relaxed mt-1">
                {need.whatIsStillMissing || 'Prerequisite capability or deliverable.'}
              </p>
            </div>
          </div>
        </div>

        {/* Full-Width Lower Section with Divider: WHAT WOULD SATISFY THIS NEED */}
        <div className="pt-4 border-t border-border/70 space-y-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            WHAT WOULD SATISFY THIS NEED
          </div>
          <p className="text-xs sm:text-sm text-foreground leading-relaxed mt-1">
            {need.whatWouldSatisfy ||
              "Suitable capability or documented evidence for the required deliverable, with sufficient verification showing that it is available to this project."}
          </p>
        </div>

        {/* B. CONNECTED WORK (Roadmap Tasks) */}
        <div className="space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            CONNECTED WORK
          </div>

          {need.relatedRoadmapTaskKeys && need.relatedRoadmapTaskKeys.length > 0 ? (
            <div className="flex items-center gap-2 flex-wrap">
              {need.relatedRoadmapTaskKeys.map((taskKey) => {
                // Humanize task key title
                const cleanTitle = taskKey
                  .replace(/^(task\.|roadmap\.|tech\.|serv\.|legal\.)/, '')
                  .replace(/-/g, ' ')
                  .replace(/\b\w/g, (c) => c.toUpperCase());

                return (
                  <Link
                    key={taskKey}
                    href={`/dashboard/creator/phase-4/roadmap?ideaId=${encodeURIComponent(ideaId)}&taskId=${encodeURIComponent(taskKey)}`}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card border border-border/80 hover:bg-muted text-xs text-foreground font-medium transition-all shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>{cleanTitle}</span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground italic">
              No direct operational roadmap tasks linked to this requirement.
            </div>
          )}
        </div>

        {/* C. BUILT FROM Sources */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-border/70">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              BUILT FROM:
            </span>
            {need.source && need.source.length > 0 ? (
              need.source.map((src, i) => (
                <span
                  key={i}
                  className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-card border border-border/80 text-foreground"
                >
                  {src}
                </span>
              ))
            ) : (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-card border border-border/80 text-foreground">
                Construction Snapshot
              </span>
            )}
          </div>

          <Link
            href={resolveSourceLink(need.source || [])}
            className="text-xs font-semibold text-primary hover:text-primary/80 inline-flex items-center gap-1 transition-colors self-start sm:self-center"
          >
            <span>View source</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* D. FOUNDER INFORMATION PANEL */}
        <div className="pt-4 border-t border-border/70 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs sm:text-sm font-semibold text-foreground">
              Provide information about an existing capability, resource, or asset
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleInfoSubmit}
                disabled={isUpdating || !infoText.trim()}
                className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold transition-all shadow-sm inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add what I have</span>
              </button>

              <button
                onClick={onDefer}
                disabled={isUpdating || need.founderState === 'Deferred'}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              >
                <span>Defer for now</span>
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <textarea
              value={infoText}
              onChange={(e) => setInfoText(e.target.value)}
              placeholder="e.g. Contracted software agency, technical co-founder commitment, or technical portfolio..."
              rows={3}
              disabled={isUpdating}
              className="w-full text-xs sm:text-sm p-3 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed resize-y disabled:opacity-50"
            />

            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p className="text-[11px] text-muted-foreground leading-relaxed max-w-2xl">
                Founder-provided details will be assessed against this requirement&apos;s criteria. Adding details records your information; it does not automatically mark the need Satisfied.
              </p>

              {isSavedNotice && (
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>Information recorded</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
