'use client';

import React, { useState } from 'react';
import Link from 'next/navigation';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  Compass,
  Clock,
  RefreshCw,
  Check,
  AlertCircle,
} from 'lucide-react';
import type {
  ConstructionReadinessReview,
  ReadinessArtifactCard,
  ReadinessAttentionIssue,
  ReadinessNextAction,
} from '@/types/creator/construction-readiness';

interface ConstructionReadinessViewProps {
  ideaId: string;
  projectName: string;
  review: ConstructionReadinessReview | null;
  isSaved: boolean;
  updateAvailable?: boolean;
  changedSources?: string[];
  isLoading?: boolean;
  onSaveReview: () => Promise<void>;
}

export function ConstructionReadinessView({
  ideaId,
  projectName,
  review,
  isSaved,
  updateAvailable = false,
  changedSources = [],
  isLoading = false,
  onSaveReview,
}: ConstructionReadinessViewProps) {
  const router = useRouter();
  const [isAccordionOpen, setIsAccordionOpen] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSaveAndGoDashboard = async () => {
    try {
      setIsSaving(true);
      setSaveError(null);
      await onSaveReview();
      router.push('/dashboard/creator');
    } catch (err: any) {
      setSaveError(err?.message || 'Failed to save review. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const withIdea = (route: string) => {
    if (!ideaId) return route;
    return route.includes('?') ? `${route}&ideaId=${encodeURIComponent(ideaId)}` : `${route}?ideaId=${encodeURIComponent(ideaId)}`;
  };

  const criticalIssue = review?.issues?.find((i) => i.priority === 'critical');
  const secondaryIssues = review?.issues?.filter((i) => i.priority !== 'critical') || [];

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 animate-fadeIn font-sans text-foreground">
      {/* Update Available Banner if upstream data changed */}
      {updateAvailable && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-foreground">Update available</h4>
              <p className="text-xs text-muted-foreground">
                Upstream inputs changed ({changedSources.join(', ')}). Your previously saved review is preserved below with fresh assessment findings.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Save Error Banner */}
      {saveError && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-foreground">Save Error</h4>
              <p className="text-xs text-muted-foreground">{saveError}</p>
            </div>
          </div>
          <button
            onClick={() => setSaveError(null)}
            className="text-xs text-muted-foreground hover:text-foreground font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 1: COMPACT ASSESSMENT SUMMARY (Figma 57221:13333) */}
      {/* ========================================================================= */}
      <section
        id="compact-assessment-summary"
        className="bg-card border border-border rounded-xl p-6 sm:p-8 shadow-xs space-y-6"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Column: Current Position */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  YOUR CURRENT POSITION
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-xs font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  {review?.status || (isLoading ? 'Evaluating...' : 'Status unavailable')}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold font-heading text-foreground tracking-tight leading-snug">
                {review?.positionHeadline ||
                  (isLoading
                    ? 'Evaluating saved project work and requirements...'
                    : 'Assessment details unavailable.')}
              </h2>
            </div>

            {(review?.currentActionGuidance || review?.dependencyGuidance) && (
              <div className="space-y-2 pt-2 border-t border-border/50">
                {review?.currentActionGuidance && (
                  <div className="flex items-start gap-2.5 text-xs sm:text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>{review.currentActionGuidance}</span>
                  </div>
                )}
                {review?.dependencyGuidance && (
                  <div className="flex items-start gap-2.5 text-xs sm:text-sm text-muted-foreground">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <span>{review.dependencyGuidance}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Construction Readiness Score Module */}
          <div className="lg:col-span-5 bg-muted/40 border border-border/80 rounded-xl p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  CONSTRUCTION READINESS
                </span>
                <Info className="w-4 h-4 text-muted-foreground/80" />
              </div>

              <div className="text-lg sm:text-xl font-bold font-heading text-foreground">
                {review?.overallScore !== null && review?.overallScore !== undefined
                  ? `${review.overallScore}%`
                  : 'Score not yet calculated'}
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {review?.scoreAvailabilityExplanation ||
                  'Review the available work and unresolved items below.'}
              </p>
            </div>

            <div className="pt-3 border-t border-border/60 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Sparkles className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span>Based on saved project information</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2: WHAT YOU ALREADY HAVE (Figma 57221:13370) */}
      {/* ========================================================================= */}
      <section
        id="what-you-already-have"
        className="bg-card border border-border rounded-xl p-6 sm:p-8 shadow-xs space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
          <div>
            <h2 className="text-xl font-bold font-heading text-foreground tracking-tight">
              What you already have
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Your saved work gives you a starting point for the next actions.
            </p>
          </div>
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-muted text-xs font-mono font-medium text-muted-foreground shrink-0">
            {isLoading || !review
              ? '...'
              : `${review.savedArtifactsCount ?? review.artifacts?.filter((a) => a.status !== 'Missing').length ?? 0} saved artefacts`}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {review?.artifacts && review.artifacts.length > 0 ? (
            review.artifacts.map((card: ReadinessArtifactCard) => {
              const badgeStyle =
                card.statusColor === 'emerald'
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                  : card.statusColor === 'blue'
                  ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20'
                  : card.statusColor === 'amber'
                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
                  : 'bg-muted text-muted-foreground border-border/80';

              return (
                <div
                  key={card.id}
                  className="bg-muted/20 border border-border rounded-xl p-5 flex flex-col justify-between space-y-4 hover:border-border/80 transition-colors"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-bold font-heading text-foreground">{card.title}</h3>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${badgeStyle}`}
                      >
                        {card.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{card.description}</p>
                  </div>

                  <div className="pt-2">
                    <a
                      href={withIdea(card.actionRoute)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                    >
                      <span>{card.actionLabel}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-3 text-xs text-muted-foreground">Artifacts loading...</div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 3: WHAT NEEDS ATTENTION (Figma 57221:13472) */}
      {/* ========================================================================= */}
      <section id="what-needs-attention" className="space-y-4">
        <div>
          <h2 className="text-xl font-bold font-heading text-foreground tracking-tight">
            What needs attention
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Focus on the issues that affect your next actions.
          </p>
        </div>

        {/* Prominent Critical Priority Card */}
        {criticalIssue && (
          <div className="bg-card border-2 border-rose-500/30 rounded-xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold font-heading text-foreground">
                    {criticalIssue.title}
                  </h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-semibold">
                    {criticalIssue.badge || 'Critical priority'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                  {criticalIssue.subtitle}
                </p>
              </div>
            </div>

            {/* 4 Structured Reasoning Blocks */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div className="bg-muted/30 border border-border/60 rounded-lg p-4 space-y-1.5">
                <span className="font-mono text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                  WHY THIS MATTERS
                </span>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {criticalIssue.whyItMatters}
                </p>
              </div>

              <div className="bg-muted/30 border border-border/60 rounded-lg p-4 space-y-1.5">
                <span className="font-mono text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                  WHAT IS ALREADY DECIDED
                </span>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {criticalIssue.whatIsAlreadyDecided}
                </p>
              </div>

              <div className="bg-muted/30 border border-border/60 rounded-lg p-4 space-y-1.5">
                <span className="font-mono text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                  WHAT IS STILL NEEDED
                </span>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {criticalIssue.whatIsStillNeeded}
                </p>
              </div>

              <div className="bg-muted/30 border border-border/60 rounded-lg p-4 space-y-1.5">
                <span className="font-mono text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                  WHAT THIS AFFECTS
                </span>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  {criticalIssue.whatThisAffects?.map((item, idx) => (
                    <li key={idx} className="leading-snug">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Footer of Critical Card */}
            <div className="pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-xs text-muted-foreground space-y-1">
                {criticalIssue.connectedWork && (
                  <div className="font-medium text-foreground">{criticalIssue.connectedWork}</div>
                )}
                {criticalIssue.sourcesText && (
                  <div className="text-muted-foreground/80">{criticalIssue.sourcesText}</div>
                )}
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {criticalIssue.actionRoute && (
                  <a
                    href={withIdea(criticalIssue.actionRoute)}
                    className="px-4 py-2 rounded-lg border border-border bg-background hover:bg-muted text-xs font-semibold text-foreground transition-colors"
                  >
                    {criticalIssue.actionLabel || 'Review need'}
                  </a>
                )}
                {criticalIssue.secondaryActionRoute && (
                  <a
                    href={withIdea(criticalIssue.secondaryActionRoute)}
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold transition-colors shadow-xs"
                  >
                    {criticalIssue.secondaryActionLabel || 'Open connected roadmap task'}
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Secondary Issue Cards Grid */}
        {secondaryIssues.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {secondaryIssues.map((issue) => (
              <div
                key={issue.id}
                className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between space-y-4 shadow-xs"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-bold font-heading text-foreground">{issue.title}</h4>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground border border-border">
                      {issue.badge}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-foreground">{issue.subtitle}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{issue.whyItMatters}</p>
                  {issue.extraInfo && (
                    <div className="pt-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-muted/60 text-[10px] font-mono text-muted-foreground">
                        {issue.extraInfo}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  {issue.actionRoute && (
                    <a
                      href={withIdea(issue.actionRoute)}
                      className="px-3.5 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-xs font-semibold text-foreground transition-colors inline-block"
                    >
                      {issue.actionLabel || 'Review'}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* SECTION 4: YOUR NEXT ACTION (Figma 57221:13599) */}
      {/* ========================================================================= */}
      {review?.nextAction && (
        <section
          id="your-next-action"
          className="bg-card border border-border rounded-xl p-6 sm:p-8 shadow-xs space-y-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                YOUR NEXT ACTION
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 text-xs font-medium">
                {review.nextAction.type}
              </span>
              {review.nextAction.estimatedEffort && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-mono">
                  <Clock className="w-3 h-3" />
                  Estimated effort: {review.nextAction.estimatedEffort}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold font-heading text-foreground">
              {review.nextAction.title}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-3xl">
              {review.nextAction.description}
            </p>
          </div>

          <div className="pt-2 flex items-center gap-3 flex-wrap">
            <a
              href={withIdea(review.nextAction.primaryActionRoute)}
              className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-colors shadow-xs inline-flex items-center gap-1.5"
            >
              <span>{review.nextAction.primaryActionLabel}</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            {review.nextAction.secondaryActionRoute && (
              <a
                href={withIdea(review.nextAction.secondaryActionRoute)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                {review.nextAction.secondaryActionLabel || 'View roadmap'}
              </a>
            )}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* SECTION 5: WHY THIS ASSESSMENT? (Expandable Accordion · Figma 57221:13619) */}
      {/* ========================================================================= */}
      <section
        id="why-this-assessment"
        className="bg-card border border-border rounded-xl p-6 sm:p-8 shadow-xs space-y-4"
      >
        <button
          type="button"
          onClick={() => setIsAccordionOpen(!isAccordionOpen)}
          aria-expanded={isAccordionOpen}
          className="w-full flex items-center justify-between text-left cursor-pointer group"
        >
          <div className="flex items-center gap-2.5">
            <Info className="w-5 h-5 text-primary" />
            <h3 className="text-base sm:text-lg font-bold font-heading text-foreground group-hover:text-primary transition-colors">
              Why this assessment?
            </h3>
          </div>
          <div className="p-1 rounded-md text-muted-foreground group-hover:text-foreground transition-colors">
            {isAccordionOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </button>

        {isAccordionOpen && (
          <div className="space-y-4 pt-2 border-t border-border/60 animate-fadeIn">
            <p className="text-xs sm:text-sm text-foreground">
              This review compares your saved requirements, decisions, work status, and supporting evidence.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              <div className="bg-muted/20 border border-border/80 rounded-lg p-4 space-y-1.5">
                <span className="text-xs font-bold text-primary block">Principle 1</span>
                <h4 className="text-xs font-bold text-foreground">
                  Plans and completed work are assessed separately.
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Having a plan does not mean product deliverables or customer tests are completed.
                </p>
              </div>

              <div className="bg-muted/20 border border-border/80 rounded-lg p-4 space-y-1.5">
                <span className="text-xs font-bold text-primary block">Principle 2</span>
                <h4 className="text-xs font-bold text-foreground">
                  Unknown information remains open for review.
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Decisions that lack supporting evidence are kept visible rather than filled with assumptions.
                </p>
              </div>

              <div className="bg-muted/20 border border-border/80 rounded-lg p-4 space-y-1.5">
                <span className="text-xs font-bold text-primary block">Principle 3</span>
                <h4 className="text-xs font-bold text-foreground">
                  Critical dependencies remain visible.
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Unresolved delivery blockers stay highlighted even when secondary assets are ready.
                </p>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground pt-1">
              You can inspect sources, saved decisions, and required criteria across your journey at any time without technical database jargon.
            </p>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* SECTION 6: CONTINUING YOUR WORK PANEL (Figma 57221:13652) */}
      {/* ========================================================================= */}
      <section
        id="continuing-your-work"
        className="bg-muted/40 border border-border rounded-xl p-6 flex items-start gap-4"
      >
        <div className="w-10 h-10 rounded-lg bg-card border border-border flex items-center justify-center shrink-0 shadow-xs">
          <Compass className="w-5 h-5 text-primary" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold font-heading text-foreground">
            Keep building from your dashboard
          </h4>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Your saved outputs and unfinished actions will remain available so you can continue at your own pace.
          </p>
          <p className="text-xs text-muted-foreground/80 pt-0.5">
            Saving this review does not mark unfinished work complete.
          </p>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 7: FOOTER ACTIONS (Figma 57221:13663) */}
      {/* ========================================================================= */}
      <footer className="pt-4 pb-12 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-border">
        <a
          href={withIdea('/dashboard/creator/phase-4/launch-assets')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Launch Assets</span>
        </a>

        <button
          type="button"
          onClick={handleSaveAndGoDashboard}
          disabled={isSaving}
          className="px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-all shadow-sm disabled:opacity-50 inline-flex items-center gap-2 cursor-pointer"
        >
          {isSaving ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Saving review...</span>
            </>
          ) : (
            <span>Save review &amp; go to dashboard</span>
          )}
        </button>
      </footer>
    </div>
  );
}
