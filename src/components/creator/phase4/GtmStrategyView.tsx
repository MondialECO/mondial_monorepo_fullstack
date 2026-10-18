'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Rocket,
  Target,
  Share2,
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Lock,
  ChevronDown,
  ChevronUp,
  X,
  ExternalLink,
  Users,
  Copy,
  Check,
  Edit3,
  BarChart3,
  Sliders,
  CheckCheck,
} from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import type {
  GtmStrategy,
  GtmChannelStrategy,
  GtmExperiment,
  ChannelPriority,
  ExperimentRunOutcome,
  UpdateGtmChannelRequest,
  RecordExperimentRunRequest,
  UpdateGtmStrategyRequest,
} from '@/types/creator/gtm';

interface GtmStrategyViewProps {
  ideaId: string;
  projectName: string;
  strategy: GtmStrategy | null;
  updateAvailable: boolean;
  changedSources: string[];
  isLoading: boolean;
  gateError?: { code: string; message: string } | null;
  onGenerate: () => Promise<void>;
  onRefresh: () => Promise<void>;
  onUpdateChannel: (channelKey: string, req: UpdateGtmChannelRequest) => Promise<void>;
  onUpdateStrategy?: (req: UpdateGtmStrategyRequest) => Promise<void>;
  onRecordExperimentRun: (experimentKey: string, req: RecordExperimentRunRequest) => Promise<void>;
}

export function GtmStrategyView({
  ideaId,
  projectName,
  strategy,
  updateAvailable,
  changedSources,
  isLoading,
  gateError,
  onGenerate,
  onRefresh,
  onUpdateChannel,
  onUpdateStrategy,
  onRecordExperimentRun,
}: GtmStrategyViewProps) {
  const router = useRouter();
  const { t } = useTranslation();

  // Accordions
  const [whyGroupOpen, setWhyGroupOpen] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);

  // Modals & Drafts
  const [isEditMessageOpen, setIsEditMessageOpen] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [isSavingMessage, setIsSavingMessage] = useState(false);

  const [isAdjustGroupOpen, setIsAdjustGroupOpen] = useState(false);
  const [customGroup, setCustomGroup] = useState('');
  const [isSavingGroup, setIsSavingGroup] = useState(false);

  const [isChangeChannelOpen, setIsChangeChannelOpen] = useState(false);
  const [selectedChannelKey, setSelectedChannelKey] = useState('');

  const [isSetBudgetOpen, setIsSetBudgetOpen] = useState(false);
  const [budgetInput, setBudgetInput] = useState<number | ''>('');
  const [timeInput, setTimeInput] = useState<number | ''>('');
  const [isSavingBudget, setIsSavingBudget] = useState(false);

  const [isSetTargetsOpen, setIsSetTargetsOpen] = useState(false);
  const [targetContacted, setTargetContacted] = useState<number | ''>(50);
  const [targetReplies, setTargetReplies] = useState<number | ''>(10);
  const [targetDemos, setTargetDemos] = useState<number | ''>(5);
  const [targetPurchases, setTargetPurchases] = useState<number | ''>(2);
  const [isSavingTargets, setIsSavingTargets] = useState(false);

  const [isRecordResultsOpen, setIsRecordResultsOpen] = useState(false);
  const [actualSpend, setActualSpend] = useState<number | ''>(0);
  const [actualEffort, setActualEffort] = useState('');
  const [actualObservations, setActualObservations] = useState('');
  const [actualOutcome, setActualOutcome] = useState<ExperimentRunOutcome>('Validated');
  const [isSubmittingRecord, setIsSubmittingRecord] = useState(false);

  // Derived primary elements from strategy & effective overrides
  const primaryChannel =
    strategy?.channelStrategy?.find((c) => c.priority === 'Primary') ||
    strategy?.channelStrategy?.[0] ||
    null;

  const effectiveCustomerGroup =
    strategy?.founderOverrides?.['CustomCustomerGroup'] ||
    strategy?.primarySegment?.segmentName ||
    'Independent service businesses';

  const defaultOutreachMessage =
    strategy?.founderOverrides?.['CustomOutreachMessage'] ||
    `“Hi, I’m building ${projectName} for ${effectiveCustomerGroup}. I’d like to understand how you currently manage enquiries, quotations, and follow-ups. Would you be open to a short conversation about your process?”`;

  const effectiveBudget = strategy?.founderOverrides?.['SpendableBudget']
    ? Number(strategy.founderOverrides['SpendableBudget'])
    : strategy?.budgetPlan?.totalAvailableBudget;

  const effectiveHours = strategy?.founderOverrides?.['WeeklyHoursAvailable']
    ? Number(strategy.founderOverrides['WeeklyHoursAvailable'])
    : (strategy?.founderExecutionPlan?.weeklyHoursAvailable || 4);

  const effectiveTargetContacted = strategy?.founderOverrides?.['Target_Contacted']
    ? Number(strategy.founderOverrides['Target_Contacted'])
    : targetContacted;

  const effectiveTargetReplies = strategy?.founderOverrides?.['Target_Replies']
    ? Number(strategy.founderOverrides['Target_Replies'])
    : targetReplies;

  const effectiveTargetDemos = strategy?.founderOverrides?.['Target_Demos']
    ? Number(strategy.founderOverrides['Target_Demos'])
    : targetDemos;

  const effectiveTargetPurchases = strategy?.founderOverrides?.['Target_Purchases']
    ? Number(strategy.founderOverrides['Target_Purchases'])
    : targetPurchases;

  const handleCopyMessage = () => {
    navigator.clipboard.writeText((customMessage || defaultOutreachMessage).replace(/[“”]/g, ''));
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2500);
  };

  const handleActivateAndContinue = async () => {
    try {
      setIsActivating(true);
      if (onUpdateStrategy) {
        await onUpdateStrategy({ status: 'Active' });
      }
      router.push(`/dashboard/creator/phase-4/launch-assets?ideaId=${encodeURIComponent(ideaId)}`);
    } catch (err) {
      console.error('Failed to activate plan:', err);
    } finally {
      setIsActivating(false);
    }
  };

  const handleSaveMessage = async () => {
    try {
      setIsSavingMessage(true);
      await onUpdateStrategy?.({ customOutreachMessage: customMessage.trim() });
      setIsEditMessageOpen(false);
    } catch (err) {
      console.error('Failed to save message:', err);
    } finally {
      setIsSavingMessage(false);
    }
  };

  const handleSaveCustomerGroup = async () => {
    try {
      setIsSavingGroup(true);
      await onUpdateStrategy?.({ customCustomerGroup: customGroup.trim() });
      setIsAdjustGroupOpen(false);
    } catch (err) {
      console.error('Failed to save customer group:', err);
    } finally {
      setIsSavingGroup(false);
    }
  };

  const handleSaveBudgetAndTime = async () => {
    try {
      setIsSavingBudget(true);
      await onUpdateStrategy?.({
        weeklyHoursAvailable: typeof timeInput === 'number' ? timeInput : null,
        spendableBudget: typeof budgetInput === 'number' ? budgetInput : null,
      });
      setIsSetBudgetOpen(false);
    } catch (err) {
      console.error('Failed to save budget & time:', err);
    } finally {
      setIsSavingBudget(false);
    }
  };

  const handleSaveTargets = async () => {
    try {
      setIsSavingTargets(true);
      await onUpdateStrategy?.({
        targetContacted: typeof targetContacted === 'number' ? targetContacted : null,
        targetReplies: typeof targetReplies === 'number' ? targetReplies : null,
        targetDemos: typeof targetDemos === 'number' ? targetDemos : null,
        targetPurchases: typeof targetPurchases === 'number' ? targetPurchases : null,
      });
      setIsSetTargetsOpen(false);
    } catch (err) {
      console.error('Failed to save targets:', err);
    } finally {
      setIsSavingTargets(false);
    }
  };

  const handleSaveChannelPriority = async (channelKey: string, priority: ChannelPriority) => {
    try {
      await onUpdateChannel(channelKey, {
        ideaId,
        priority,
      });
      setIsChangeChannelOpen(false);
    } catch (err) {
      console.error('Failed to update channel priority:', err);
    }
  };

  const handleRecordRunSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const primaryExp = strategy?.experiments?.[0];
    if (!primaryExp) {
      setIsRecordResultsOpen(false);
      return;
    }
    try {
      setIsSubmittingRecord(true);
      await onRecordExperimentRun(primaryExp.key, {
        ideaId,
        actualSpend: Number(actualSpend) || 0,
        actualEffort: actualEffort.trim() || '2 hours outreach',
        observations: actualObservations.trim() || 'Recorded customer discovery activity.',
        outcome: actualOutcome,
        statusUpdate: 'Completed',
      });
      setIsRecordResultsOpen(false);
    } finally {
      setIsSubmittingRecord(false);
    }
  };

  // 1. GATE BLOCKER VIEW
  if (gateError) {
    return (
      <div className="w-full min-w-0 space-y-6">
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 sm:p-8 text-foreground space-y-4 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-amber-800 dark:text-amber-300 font-semibold block">
                {t('creator.phase4.gtmView.prerequisiteActive', 'PREREQUISITE GATE ACTIVE · PHASE 4.7 LOCKED')}
              </span>
              <h2 className="text-lg sm:text-xl font-bold font-heading text-amber-900 dark:text-amber-200 mt-1">
                {t('creator.phase4.gtmView.pricingRequiredFirst', 'Phase 4.6 Pricing Strategy Required First')}
              </h2>
              <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-300/90 mt-1">
                {gateError.message}
              </p>
            </div>
          </div>
          <div className="bg-card/70 border border-border/60 rounded-xl p-4 text-xs space-y-2 font-mono text-muted-foreground">
            <div>{t('creator.phase4.gtmView.prereq1', '1. Phase 4.6 Pricing & Revenue Model must be generated and valid.')}</div>
            <div>{t('creator.phase4.gtmView.prereq2', '2. Unit economics and contribution margins must be established.')}</div>
            <div>{t('creator.phase4.gtmView.prereq3', '3. Target segments and baseline prices must be defined.')}</div>
          </div>
          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              href={`/dashboard/creator/phase-4/pricing?ideaId=${ideaId}`}
              className="px-5 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-sm flex items-center gap-2 transition-colors"
            >
              <span>{t('creator.phase4.gtmView.completePricing', 'Complete Step 4.6 Pricing Strategy')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. EMPTY / UNGENERATED VIEW
  if (!strategy) {
    return (
      <div className="w-full min-w-0 space-y-6 animate-fadeIn">
        <div className="bg-card border border-border rounded-2xl p-8 sm:p-12 text-center space-y-6 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary shadow-sm">
            <Rocket className="w-8 h-8" />
          </div>
          <div className="max-w-xl mx-auto space-y-2">
            <span className="text-xs uppercase tracking-wider font-mono text-primary font-semibold block">
              {t('creator.phase4.gtmView.engineBadge', 'CREATOR PHASE 4.7 · GTM & LAUNCH STRATEGY ENGINE')}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-heading text-foreground">
              {t('creator.phase4.gtmView.convertTitle', 'Convert Pricing & Market Intelligence into a Sequenced Launch')}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('creator.phase4.gtmView.engineSubtitle', 'Derive grounded customer acquisition channels, weekly capacity allocations, empirical validation experiments, and measurable conversion funnel metrics without guesswork.')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left max-w-2xl mx-auto pt-2">
            <div className="p-4 rounded-xl bg-muted/40 border border-border text-xs space-y-1">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-primary" /> {t('creator.phase4.gtmView.featureTargetCustomer', 'Target Customer')}
              </div>
              <p className="text-muted-foreground">
                {t('creator.phase4.gtmView.featureTargetCustomerDesc', 'Pinpoint your highest-relevance starting segment and outreach angle.')}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-muted/40 border border-border text-xs space-y-1">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-primary" /> {t('creator.phase4.gtmView.featureFocusChannel', 'Focus Channel')}
              </div>
              <p className="text-muted-foreground">
                {t('creator.phase4.gtmView.featureFocusChannelDesc', 'Prioritize low-friction acquisition grounded in your weekly hours.')}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-muted/40 border border-border text-xs space-y-1">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-primary" /> {t('creator.phase4.gtmView.featureActionSequence', 'Action Sequence')}
              </div>
              <p className="text-muted-foreground">
                {t('creator.phase4.gtmView.featureActionSequenceDesc', 'Timeboxed validation experiments with clear success benchmarks.')}
              </p>
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={onGenerate}
              disabled={isLoading}
              className="px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm shadow-sm inline-flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isLoading ? t('creator.phase4.gtmView.synthesizingStrategy', 'Synthesizing GTM Strategy...') : t('creator.phase4.gtmView.buildButton', 'Build My Launch Strategy')}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. FIGMA NODE 57221:12464 CANONICAL 10-SECTION VIEW
  return (
    <div className="w-full min-w-0 space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-semibold tracking-wider text-muted-foreground uppercase font-mono">
            {t('creator.phase4.gtmView.stepBadge', 'PHASE 4 · STEP 4.7')}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight font-heading">
            {t('creator.phase4.gtmView.title', 'GTM & Launch Strategy')}
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed font-sans">
            {t('creator.phase4.gtmView.subtitle', 'Grounded go-to-market plan for {{name}}, balancing founder capacity, starting channels, and customer validation milestones.', { name: projectName })}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="px-3.5 py-1.5 rounded-lg border border-border bg-card hover:bg-accent text-xs font-medium text-foreground flex items-center gap-1.5 transition-colors disabled:opacity-50"
            title={t('creator.phase4.gtmView.refreshTitle', 'Refresh GTM strategy against fresh upstream data')}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-primary' : ''}`} />
            <span>{t('creator.phase4.gtmView.reverify', 'Re-verify')}</span>
          </button>
        </div>
      </div>

      {/* Upstream Staleness / Update Available Notice */}
      {updateAvailable && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-semibold text-foreground">{t('creator.phase4.gtmView.updateAvailable', 'Update available:')}</h4>
              <p className="text-xs text-muted-foreground">
                {t('creator.phase4.gtmView.upstreamChangesDetected', 'Upstream changes detected in {{sources}}.', { sources: changedSources.join(', ') || 'Pricing or Roadmap' })}
              </p>
            </div>
          </div>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium shrink-0 transition-colors"
          >
            {t('creator.phase4.gtmView.refreshLaunchPlan', 'Refresh Launch Plan')}
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 1: COMPACT PLAN SUMMARY CARD                                      */}
      {/* ========================================================================= */}
      <section className="bg-card border border-border rounded-2xl p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground font-semibold">
              {t('creator.phase4.gtmView.yourLaunchPlan', 'YOUR LAUNCH PLAN')}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border text-[11px] font-mono">
              {strategy.status || t('creator.phase4.gtmView.draft', 'Draft')}
            </span>
          </div>
          <span className="text-xs font-mono text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-md border border-border/60">
            {t('creator.phase4.gtmView.project', 'Project: {{name}}', { name: projectName })}
          </span>
        </div>

        <div className="space-y-1.5">
          <h2 className="text-xl sm:text-2xl font-bold font-heading text-foreground tracking-tight">
            {strategy.overallMotion || t('creator.phase4.gtmView.defaultOverallMotion', 'Start with customer conversations')}
          </h2>
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
            {strategy.primarySegment?.problem
              ? t('creator.phase4.gtmView.learnCustomerProblem', 'Learn how target customers currently manage {{problem}} before introducing your planned solution.', { problem: strategy.primarySegment.problem.toLowerCase() })
              : t('creator.phase4.gtmView.defaultLearnProblem', 'Learn how customers manage enquiries before introducing your planned solution.')}
          </p>
        </div>

        {/* 3 Compact Facts Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
          <div className="bg-muted/40 border border-border/70 rounded-xl p-3.5 space-y-1">
            <span className="text-[11px] text-muted-foreground font-mono uppercase block">
              {t('creator.phase4.gtmView.firstCustomersLabel', 'First customers')}
            </span>
            <p className="text-sm font-semibold text-foreground truncate">
              {effectiveCustomerGroup}
            </p>
          </div>

          <div className="bg-muted/40 border border-border/70 rounded-xl p-3.5 space-y-1">
            <span className="text-[11px] text-muted-foreground font-mono uppercase block">
              {t('creator.phase4.gtmView.mainChannelLabel', 'Main channel')}
            </span>
            <p className="text-sm font-semibold text-foreground truncate">
              {primaryChannel?.channelName || t('creator.phase4.gtmView.defaultPrimaryChannel', 'Direct outreach')}
            </p>
          </div>

          <div className="bg-muted/40 border border-border/70 rounded-xl p-3.5 space-y-1">
            <span className="text-[11px] text-muted-foreground font-mono uppercase block">
              {t('creator.phase4.gtmView.budgetLabel', 'Budget')}
            </span>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 text-xs font-medium font-mono tabular-nums">
                {effectiveBudget !== undefined && effectiveBudget !== null
                  ? `€${effectiveBudget.toLocaleString()}`
                  : strategy.budgetPlan?.validationStatus === 'Supported'
                  ? t('creator.phase4.gtmView.supported', 'Supported')
                  : t('creator.phase4.gtmView.needsValidation', 'Needs validation')}
              </span>
            </div>
          </div>
        </div>

        {/* Small Next-Action Reminder Line */}
        <div className="pt-2 flex items-center gap-2 text-xs text-muted-foreground border-t border-border/50">
          <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
          <span>{t('creator.phase4.gtmView.nextLaunchAction', 'Next launch action: Prepare customer conversations')}</span>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2: YOUR FIRST CUSTOMERS                                           */}
      {/* ========================================================================= */}
      <section className="bg-card border border-border rounded-2xl p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h2 className="text-lg sm:text-xl font-bold font-heading text-foreground">
              {t('creator.phase4.gtmView.firstCustomers', 'Your first customers')}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {t('creator.phase4.gtmView.startWithGroup', 'Start with a specific group you can learn from.')}
            </p>
          </div>
          <button
            onClick={() => {
              setCustomGroup(effectiveCustomerGroup);
              setIsAdjustGroupOpen(true);
            }}
            className="px-3.5 py-1.5 rounded-lg border border-border bg-background hover:bg-accent text-xs font-semibold text-foreground transition-colors shrink-0 self-start sm:self-auto"
          >
            {t('creator.phase4.gtmView.adjustCustomerGroup', 'Adjust customer group')}
          </button>
        </div>

        {/* Highlighted Pale-Blue Selected Group Container */}
        <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-2xl p-5 space-y-2.5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="text-sm sm:text-base font-semibold text-foreground leading-snug">
              {effectiveCustomerGroup}
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[11px] font-mono font-medium shrink-0">
              {strategy.founderOverrides?.['CustomCustomerGroup'] ? t('creator.phase4.gtmView.founderDecision', 'Founder Decision') : t('creator.phase4.gtmView.suggested', 'Suggested')}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {t('creator.phase4.gtmView.dayToDayProblem', 'Their day-to-day work matches the problem {{name}} is being designed to address.', { name: projectName })}
          </p>

          <div className="pt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <Target className="w-3.5 h-3.5 text-primary shrink-0" />
            <span>
              {t('creator.phase4.gtmView.likelyDecisionMaker', 'Likely decision-maker:')}{' '}
              <strong className="text-foreground font-medium">
                {strategy.primarySegment?.buyingComplexity || t('creator.phase4.gtmView.businessOwner', 'Business owner')}
              </strong>{' '}
              {t('creator.phase4.gtmView.toBeConfirmed', '— To confirm')}
            </span>
          </div>
        </div>

        {/* Collapsible Disclosure ("Why this group?") */}
        <div className="border border-border/70 rounded-xl overflow-hidden">
          <button
            onClick={() => setWhyGroupOpen(!whyGroupOpen)}
            className="w-full px-4 py-3 bg-muted/20 hover:bg-muted/40 flex items-center justify-between text-xs sm:text-sm font-medium text-foreground transition-colors"
          >
            <span>{t('creator.phase4.gtmView.whyThisGroup', 'Why this group?')}</span>
            {whyGroupOpen ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
          {whyGroupOpen && (
            <div className="p-4 bg-card text-xs text-muted-foreground space-y-2 border-t border-border/70 leading-relaxed">
              <p>
                <strong>{t('creator.phase4.gtmView.groundedRationale', 'Grounded Rationale:')}</strong>{' '}
                {strategy.primarySegment?.rationale ||
                  t('creator.phase4.gtmView.defaultRationale', 'Identified from Phase 3.1 Market Study as having the highest workflow pain and minimal custom IT barrier.')}
              </p>
              <p>
                <strong>{t('creator.phase4.gtmView.salesCycleBasis', 'Sales Cycle Basis:')}</strong>{' '}
                {strategy.primarySegment?.estimatedSalesCycle ||
                  t('creator.phase4.gtmView.defaultSalesCycle', '1–3 weeks for initial trial conversation and evaluation.')}
              </p>
              {strategy.primarySegment?.revenueModel && (
                <p>
                  <strong>{t('creator.phase4.gtmView.alignedRevenueModel', 'Aligned Revenue Model:')}</strong> {strategy.primarySegment.revenueModel}
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 3: WHAT YOU'LL SAY                                                */}
      {/* ========================================================================= */}
      <section className="bg-card border border-border rounded-2xl p-6 sm:p-7 shadow-xs space-y-4">
        <div className="space-y-0.5">
          <h2 className="text-lg sm:text-xl font-bold font-heading text-foreground">
            {t('creator.phase4.gtmView.whatYoullSay', 'What you’ll say')}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {t('creator.phase4.gtmView.explainProblem', 'Explain the problem you want to help with.')}
          </p>
        </div>

        {/* Positioning Pill Container */}
        <div className="bg-muted/30 border border-border/70 rounded-xl p-4 space-y-1.5">
          <span className="px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground text-[10px] font-mono font-semibold uppercase tracking-wider inline-block">
            {t('creator.phase4.gtmView.positioning', 'POSITIONING')}
          </span>
          <p className="text-sm font-medium text-foreground leading-relaxed">
            {strategy.primarySegment?.primaryMessage ||
              t('creator.phase4.gtmView.positioningDefault', '{{name}} is being built to keep customer enquiries, quotations, and follow-ups in one place.', { name: projectName })}
          </p>
        </div>

        {/* Outreach Draft Box */}
        <div className="bg-card border border-border/80 rounded-2xl p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
              {t('creator.phase4.gtmView.initialOutreachDraft', 'INITIAL OUTREACH MESSAGE DRAFT')}
            </span>
            <span className="text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-medium">
              {t('creator.phase4.gtmView.readyForTesting', 'Ready for testing')}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-muted/20 border border-border/60 text-xs sm:text-sm text-foreground leading-relaxed italic font-sans whitespace-pre-line">
            {defaultOutreachMessage}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setCustomMessage(defaultOutreachMessage);
                  setIsEditMessageOpen(true);
                }}
                className="px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-accent text-xs font-semibold text-foreground flex items-center gap-1.5 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{t('creator.phase4.gtmView.editMessage', 'Edit message')}</span>
              </button>

              <button
                onClick={handleCopyMessage}
                className="px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-accent text-xs font-semibold text-foreground flex items-center gap-1.5 transition-colors"
              >
                {copiedMessage ? (
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                )}
                <span>{copiedMessage ? t('creator.phase4.gtmView.copied', 'Copied!') : t('creator.phase4.gtmView.copyMessage', 'Copy message')}</span>
              </button>
            </div>

            <span className="text-[11px] text-muted-foreground italic">
              {t('creator.phase4.gtmView.copyNotice', 'Note: Copying does not send.')}
            </span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          {t('creator.phase4.gtmView.introPreparationNote', 'Introduce the project as in preparation until the product is ready. No live product demonstration is promised at this stage.')}
        </p>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 4: HOW CUSTOMERS WILL BUY                                         */}
      {/* ========================================================================= */}
      <section className="bg-card border border-border rounded-2xl p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h2 className="text-lg sm:text-xl font-bold font-heading text-foreground">
              {t('creator.phase4.gtmView.howCustomersWillBuy', 'How customers will buy')}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {t('creator.phase4.gtmView.explanationReassurance', 'Choose how much explanation and reassurance customers may need.')}
            </p>
          </div>
          <button
            onClick={() => setWhyGroupOpen(!whyGroupOpen)}
            className="text-xs font-semibold text-primary hover:underline self-start sm:self-auto"
          >
            {t('creator.phase4.gtmView.reviewApproach', 'Review approach')}
          </button>
        </div>

        {/* Recommended Approach Banner */}
        <div className="bg-muted/30 border border-border/70 rounded-xl p-4 space-y-1">
          <h3 className="text-sm font-bold text-foreground font-heading">
            {t('creator.phase4.gtmView.talkFirst', 'Talk first, demonstrate when ready')}
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t('creator.phase4.gtmView.conversationProcess', 'A conversation helps you understand their current process. A working demo can later show how {{name}} fits.', { name: projectName })}
          </p>
        </div>

        {/* 3 Compact Decision Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-muted/20 border border-border/60 rounded-xl p-3.5 space-y-1">
            <span className="text-[10px] font-mono text-muted-foreground uppercase font-semibold block">
              {t('creator.phase4.gtmView.whoDecides', 'WHO DECIDES?')}
            </span>
            <p className="text-xs text-foreground leading-snug">
              {strategy.primarySegment?.buyingComplexity
                ? t('creator.phase4.gtmView.whoDecidesDesc', 'Likely the {{complexity}}. Confirm during conversations.', { complexity: strategy.primarySegment.buyingComplexity.toLowerCase() })
                : t('creator.phase4.gtmView.defaultWhoDecides', 'Likely the business owner. Confirm during conversations.')}
            </p>
          </div>

          <div className="bg-muted/20 border border-border/60 rounded-xl p-3.5 space-y-1">
            <span className="text-[10px] font-mono text-muted-foreground uppercase font-semibold block">
              {t('creator.phase4.gtmView.whatNeedsExplaining', 'WHAT NEEDS EXPLAINING?')}
            </span>
            <p className="text-xs text-foreground leading-snug">
              {strategy.primarySegment?.problem
                ? t('creator.phase4.gtmView.whatNeedsExplainingDesc', 'How {{problem}} would be addressed in {{name}}.', { problem: strategy.primarySegment.problem.toLowerCase(), name: projectName })
                : t('creator.phase4.gtmView.defaultWhatNeedsExplaining', 'How enquiries, quotations, and follow-ups would work in {{name}}.', { name: projectName })}
            </p>
          </div>

          <div className="bg-muted/20 border border-border/60 rounded-xl p-3.5 space-y-1">
            <span className="text-[10px] font-mono text-muted-foreground uppercase font-semibold block">
              {t('creator.phase4.gtmView.whatCouldBuildTrust', 'WHAT COULD BUILD TRUST?')}
            </span>
            <p className="text-xs text-foreground leading-snug">
              {strategy.primarySegment?.primaryMessage
                ? t('creator.phase4.gtmView.whatCouldBuildTrustDesc', 'A usable demo demonstrating: "{{message}}".', { message: strategy.primarySegment.primaryMessage })
                : t('creator.phase4.gtmView.defaultWhatCouldBuildTrust', 'A usable demo and clear answers about setup and business information.')}
            </p>
          </div>
        </div>

        {/* Stage Progression Preview */}
        <div className="bg-muted/30 border border-border/60 rounded-xl p-3.5 flex flex-wrap items-center gap-3 text-xs">
          <span className="text-muted-foreground font-medium">{t('creator.phase4.gtmView.progression', 'Progression:')}</span>
          <span className="px-3 py-1 rounded-md bg-card border border-border font-semibold text-foreground shadow-xs">
            {t('creator.phase4.gtmView.nowCustomerConversations', 'Now: Customer conversations')}
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-muted text-muted-foreground border border-border/60">
            <Lock className="w-3 h-3" />
            <span>{t('creator.phase4.gtmView.laterProductDemo', 'Later: Product demo')}</span>
            <span className="text-[10px] bg-muted-foreground/15 px-1.5 py-0.5 rounded ml-1 font-mono">
              {t('creator.phase4.gtmView.requiresUsableDemo', 'Requires usable demo')}
            </span>
          </div>
        </div>

        {/* Small Pricing Reference Card */}
        <div className="bg-muted/20 border border-border/60 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">{t('creator.phase4.gtmView.currentChosenPrice', 'Current chosen price:')}</span>
            <strong className="text-foreground font-semibold">
              €{strategy.primarySegment?.selectedPrice || 15} {t('creator.phase4.gtmView.perBusinessMonth', 'per business / month')}
            </strong>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[10px] font-mono font-medium">
              {strategy.pricingValidationRequired ? t('creator.phase4.gtmView.needsValidation', 'Needs validation') : t('creator.phase4.gtmView.fromPhase46', 'From Phase 4.6')}
            </span>
          </div>
          <Link
            href={`/dashboard/creator/phase-4/pricing?ideaId=${ideaId}`}
            className="text-primary hover:underline font-semibold flex items-center gap-1"
          >
            <span>{t('creator.phase4.gtmView.reviewPricing', 'Review pricing')}</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 5: WHERE TO REACH THEM                                            */}
      {/* ========================================================================= */}
      <section className="bg-card border border-border rounded-2xl p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h2 className="text-lg sm:text-xl font-bold font-heading text-foreground">
              {t('creator.phase4.gtmView.whereToReachThem', 'Where to reach them')}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {t('creator.phase4.gtmView.focusStartingChannel', 'Focus on one starting channel.')}
            </p>
          </div>
          <button
            onClick={() => setIsChangeChannelOpen(true)}
            className="px-3.5 py-1.5 rounded-lg border border-border bg-background hover:bg-accent text-xs font-semibold text-foreground transition-colors shrink-0 self-start sm:self-auto"
          >
            {t('creator.phase4.gtmView.changeChannel', 'Change channel')}
          </button>
        </div>

        {/* Selected Channel Card */}
        <div className="bg-muted/20 border border-border/80 rounded-2xl p-5 space-y-3.5">
          <div className="flex items-center gap-2.5">
            <h3 className="text-base font-bold text-foreground font-heading">
              {primaryChannel?.channelName || t('creator.phase4.gtmView.defaultPrimaryChannel', 'Direct outreach')}
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[11px] font-mono font-medium">
              {t('creator.phase4.gtmView.primaryFocus', 'Primary focus')}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {primaryChannel?.whyNow ||
              t('creator.phase4.gtmView.defaultWhyNow', 'Identify relevant businesses and invite them to discuss how they manage enquiries and quotations.')}
          </p>

          {/* 3 Structured Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="bg-card border border-border/60 rounded-xl p-3 space-y-1">
              <span className="text-[10px] font-mono text-muted-foreground uppercase font-semibold block">
                {t('creator.phase4.gtmView.whyStartHere', 'WHY START HERE?')}
              </span>
              <p className="text-xs text-foreground leading-snug">
                {primaryChannel?.rationale ||
                  t('creator.phase4.gtmView.defaultChannelRationale', 'It supports direct conversations about the workflow your product will address.')}
              </p>
            </div>

            <div className="bg-card border border-border/60 rounded-xl p-3 space-y-1">
              <span className="text-[10px] font-mono text-muted-foreground uppercase font-semibold block">
                {t('creator.phase4.gtmView.whatYoullDo', 'WHAT YOU’LL DO')}
              </span>
              <p className="text-xs text-foreground leading-snug">
                {primaryChannel?.firstStep ||
                  t('creator.phase4.gtmView.defaultFirstStep', 'Prepare a relevant contact shortlist and adapt your introduction.')}
              </p>
            </div>

            <div className="bg-card border border-border/60 rounded-xl p-3 space-y-1">
              <span className="text-[10px] font-mono text-muted-foreground uppercase font-semibold block">
                {t('creator.phase4.gtmView.whatNeedsChecking', 'WHAT NEEDS CHECKING')}
              </span>
              <p className="text-xs text-foreground leading-snug">
                {primaryChannel?.evidenceGrounded ||
                  t('creator.phase4.gtmView.defaultEvidenceGrounded', 'Which businesses fit, how to reach them, and the time required.')}
              </p>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          {t('creator.phase4.gtmView.startingHypothesisNote', 'Treat this as a starting hypothesis to test, not a proven channel.')}
        </p>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 6: WHAT YOU CAN COMMIT                                            */}
      {/* ========================================================================= */}
      <section className="bg-card border border-border rounded-2xl p-6 sm:p-7 shadow-xs space-y-4">
        <div className="space-y-0.5">
          <h2 className="text-lg sm:text-xl font-bold font-heading text-foreground">
            {t('creator.phase4.gtmView.whatYouCanCommit', 'What you can commit')}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {t('creator.phase4.gtmView.balanceEffort', 'Balance marketing effort against your current workload.')}
          </p>
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Column A: Project time */}
          <div className="bg-muted/20 border border-border/70 rounded-2xl p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-muted-foreground uppercase font-semibold block">
                {t('creator.phase4.gtmView.projectTime', 'PROJECT TIME')}
              </span>
              <div className="text-2xl sm:text-3xl font-bold text-foreground font-mono tabular-nums">
                {effectiveHours} {t('creator.phase4.gtmView.hoursPerWeek', 'hours / week')}
              </div>
              <p className="text-xs text-muted-foreground">
                {t('creator.phase4.gtmView.allocatedGtm', 'Allocated to GTM: {{allocated}}h ({{remaining}}h remaining for product).', {
                  allocated: strategy.founderExecutionPlan?.weeklyHoursAllocated || Math.min(2, effectiveHours),
                  remaining: Math.max(0, effectiveHours - (strategy.founderExecutionPlan?.weeklyHoursAllocated || Math.min(2, effectiveHours)))
                })}
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-border/50">
              <div className="text-xs text-muted-foreground">
                {t('creator.phase4.gtmView.capacityBand', 'Capacity band:')}{' '}
                <strong className="text-foreground font-medium">
                  {strategy.founderExecutionPlan?.capacityBand || 'Moderate'}
                </strong>
              </div>
              <button
                onClick={() => {
                  setTimeInput(effectiveHours);
                  setBudgetInput(effectiveBudget !== undefined && effectiveBudget !== null ? effectiveBudget : '');
                  setIsSetBudgetOpen(true);
                }}
                className="px-3.5 py-1.5 rounded-lg border border-border bg-card hover:bg-accent text-xs font-semibold text-foreground transition-colors"
              >
                {t('creator.phase4.gtmView.reviewAvailableTime', 'Review available time')}
              </button>
            </div>
          </div>

          {/* Column B: Marketing budget */}
          <div className="bg-muted/20 border border-border/70 rounded-2xl p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-muted-foreground uppercase font-semibold block">
                {t('creator.phase4.gtmView.marketingBudget', 'MARKETING BUDGET')}
              </span>
              <div className="text-2xl sm:text-3xl font-bold text-foreground font-mono tabular-nums">
                {effectiveBudget !== undefined && effectiveBudget !== null
                  ? `€${effectiveBudget.toLocaleString()}`
                  : t('creator.phase4.gtmView.needsValidation', 'Needs validation')}
              </div>
              <p className="text-xs text-muted-foreground">
                {t('creator.phase4.gtmView.source', 'Source:')} {strategy.founderOverrides?.['SpendableBudget'] ? 'FounderOverride' : (strategy.budgetPlan?.budgetSource || 'FounderDeclared')} {t('creator.phase4.gtmView.status', '· Status:')}{' '}
                {strategy.budgetPlan?.spendableStatus || 'Planned'}
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-border/50">
              <div className="text-xs text-muted-foreground">
                {effectiveBudget !== undefined && effectiveBudget !== null
                  ? t('creator.phase4.gtmView.confirmedMarketingBudget', 'Confirmed marketing budget.')
                  : t('creator.phase4.gtmView.noBudgetConfirmed', 'No budget confirmed yet. Not assumed as €0.')}
              </div>
              <button
                onClick={() => {
                  setBudgetInput(effectiveBudget !== undefined && effectiveBudget !== null ? effectiveBudget : '');
                  setTimeInput(effectiveHours);
                  setIsSetBudgetOpen(true);
                }}
                className="px-3.5 py-1.5 rounded-lg border border-border bg-card hover:bg-accent text-xs font-semibold text-foreground transition-colors"
              >
                {t('creator.phase4.gtmView.setBudget', 'Set budget')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 7: YOUR LAUNCH ACTIONS                                            */}
      {/* ========================================================================= */}
      <section className="bg-card border border-border rounded-2xl p-6 sm:p-7 shadow-xs space-y-4">
        <div className="space-y-0.5">
          <h2 className="text-lg sm:text-xl font-bold font-heading text-foreground">
            {t('creator.phase4.gtmView.yourLaunchActions', 'Your launch actions')}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {t('creator.phase4.gtmView.reviewSuggestedActions', 'Review these suggested actions alongside your existing roadmap.')}
          </p>
        </div>

        <div className="space-y-3">
          {/* Action 1 (EXPANDED) */}
          <div className="bg-muted/20 border border-border/80 rounded-2xl p-5 space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-mono font-bold flex items-center justify-center">
                  1
                </span>
                <h3 className="text-sm sm:text-base font-bold text-foreground font-heading">
                  {strategy.launchPlan?.phases?.[0]?.phaseName ||
                    strategy.experiments?.[0]?.hypothesis ||
                    t('creator.phase4.gtmView.defaultPhase1Name', 'Prepare customer conversations')}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-[10px] font-mono font-semibold">
                  {strategy.experiments?.[0]?.status || t('creator.phase4.gtmView.proposed', 'Proposed')}
                </span>
              </div>
              <span className="text-xs text-muted-foreground font-mono">
                {t('creator.phase4.gtmView.timing', 'Timing:')} {strategy.launchPlan?.phases?.[0]?.timeframe || t('creator.phase4.gtmView.beforeProductCompletion', 'Before product completion')}
              </span>
            </div>

            {/* Expanded 4-Quadrant Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-card border border-border/60 rounded-xl text-xs">
              <div className="space-y-1">
                <span className="font-semibold text-foreground">{t('creator.phase4.gtmView.whatToDo', 'What to do:')}</span>
                <p className="text-muted-foreground">
                  {primaryChannel?.firstStep ||
                    strategy.experiments?.[0]?.evidenceRequired ||
                    t('creator.phase4.gtmView.defaultWhatToDo', 'Define the businesses you want to speak with and prepare a short introduction.')}
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-foreground">{t('creator.phase4.gtmView.expectedOutput', 'Expected output:')}</span>
                <p className="text-muted-foreground">
                  {strategy.experiments?.[0]?.primaryMetric
                    ? t('creator.phase4.gtmView.targetMetric', 'Target: {{metric}} ({{target}})', { metric: strategy.experiments[0].primaryMetric, target: strategy.experiments[0].targetValue ?? 'Baseline' })
                    : t('creator.phase4.gtmView.defaultExpectedOutput', 'A focused contact shortlist and a message ready to adapt.')}
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-foreground">{t('creator.phase4.gtmView.whyItMatters', 'Why it matters:')}</span>
                <p className="text-muted-foreground">
                  {primaryChannel?.rationale ||
                    strategy.primarySegment?.rationale ||
                    t('creator.phase4.gtmView.defaultWhyItMatters', 'Learn how potential customers currently handle the problem.')}
                </p>
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-foreground">{t('creator.phase4.gtmView.timeAndCapacity', 'Time & Capacity:')}</span>
                <p className="text-muted-foreground">
                  {t('creator.phase4.gtmView.hoursWeekAllocated', '{{hours}} hours / week allocated', {
                    hours: primaryChannel?.estimatedWeeklyHours || strategy.founderExecutionPlan?.weeklyHoursAllocated || 2
                  })}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <span className="text-[11px] text-muted-foreground">
                {t('creator.phase4.gtmView.sourcedFrom', 'Sourced from:')} {effectiveCustomerGroup},{' '}
                {primaryChannel?.channelName || t('creator.phase4.gtmView.defaultPrimaryChannel', 'Selected outreach approach')}
              </span>
              <Link
                href={`/dashboard/creator/phase-4/roadmap?ideaId=${ideaId}`}
                className="px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-accent text-xs font-semibold text-foreground flex items-center gap-1.5 transition-colors"
              >
                <span>{t('creator.phase4.gtmView.reviewRoadmapTask', 'Review roadmap task')}</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Action 2 (COMPACT) */}
          <div className="bg-muted/10 border border-border/60 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-muted text-muted-foreground text-xs font-mono font-bold flex items-center justify-center">
                2
              </span>
              <span className="text-sm font-semibold text-foreground">
                {strategy.launchPlan?.phases?.[1]?.phaseName || t('creator.phase4.gtmView.showWorkingDemo', 'Show a working demo')}
              </span>
              <span className="text-xs text-muted-foreground">
                {'· '}
                {strategy.launchPlan?.phases?.[1]?.timeframe || t('creator.phase4.gtmView.whenDemoReady', 'When a demo is ready')}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-md border border-border/50 self-start sm:self-auto">
              <Lock className="w-3 h-3 text-muted-foreground" />
              <span>{t('creator.phase4.gtmView.needsDemo', 'Needs a usable product demo')}</span>
            </div>
          </div>

          {/* Action 3 (COMPACT) */}
          <div className="bg-muted/10 border border-border/60 rounded-xl p-4 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-muted text-muted-foreground text-xs font-mono font-bold flex items-center justify-center">
                  3
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {strategy.launchPlan?.phases?.[2]?.phaseName || t('creator.phase4.gtmView.reviewWebsite', 'Review your launch website')}
                </span>
                <span className="text-xs text-muted-foreground">
                  {'· '}
                  {strategy.launchPlan?.phases?.[2]?.timeframe || t('creator.phase4.gtmView.beforePublicLaunch', 'Before public launch')}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-md border border-border/50 self-start sm:self-auto">
                <Lock className="w-3 h-3 text-muted-foreground" />
                <span>{t('creator.phase4.gtmView.needsLaunchAssets', 'Needs launch assets')}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground pl-7">
              {strategy.launchPlan?.phases?.[2]?.objective ||
                t('creator.phase4.gtmView.reviewWebsiteDesc', 'Check that the message, offer, and call to action match your plan.')}
            </p>
          </div>

          {/* Action 4 (COMPACT) */}
          <div className="bg-muted/10 border border-border/60 rounded-xl p-4 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-full bg-muted text-muted-foreground text-xs font-mono font-bold flex items-center justify-center">
                  4
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {strategy.launchPlan?.phases?.[3]?.phaseName || t('creator.phase4.gtmView.reviewResults', 'Review your launch results')}
                </span>
                <span className="text-xs text-muted-foreground">
                  {'· '}
                  {strategy.launchPlan?.phases?.[3]?.timeframe || t('creator.phase4.gtmView.afterOutreachActivity', 'After outreach activity')}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-md border border-border/50 self-start sm:self-auto">
                <Lock className="w-3 h-3 text-muted-foreground" />
                <span>{t('creator.phase4.gtmView.needsRecordedActivity', 'Needs recorded activity')}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground pl-7">
              {strategy.launchPlan?.phases?.[3]?.objective ||
                t('creator.phase4.gtmView.reviewResultsDesc', 'Compare what you tried with replies, demonstrations, and purchases.')}
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 8: WHAT TO TRACK                                                  */}
      {/* ========================================================================= */}
      <section className="bg-card border border-border rounded-2xl p-6 sm:p-7 shadow-xs space-y-4">
        <div className="space-y-0.5">
          <h2 className="text-lg sm:text-xl font-bold font-heading text-foreground">
            {t('creator.phase4.gtmView.whatToTrack', 'What to track')}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {t('creator.phase4.gtmView.recordNextActions', 'Record what happens so you can improve your next actions.')}
          </p>
        </div>

        {/* Dynamic Funnel Data Table */}
        {(() => {
          const getMetricTotal = (key: string): number | null => {
            if (!strategy.experiments?.length) return null;
            let total = 0;
            let hasData = false;
            for (const exp of strategy.experiments) {
              for (const run of exp.runs || []) {
                const found = run.metricsObserved?.find(
                  (m) => m.metricKey?.toLowerCase() === key.toLowerCase() || m.metricName?.toLowerCase().includes(key.toLowerCase())
                );
                if (found && typeof found.value === 'number') {
                  total += found.value;
                  hasData = true;
                }
              }
            }
            return hasData ? total : null;
          };

          const totalRunsCount = strategy.experiments?.reduce((acc, exp) => acc + (exp.runs?.length || 0), 0) || 0;
          const actualContacted = getMetricTotal('contacted');
          const actualReplies = getMetricTotal('replies');
          const actualDemos = getMetricTotal('demos');
          const actualPurchases = getMetricTotal('purchases');

          return (
            <div className="border border-border/80 rounded-xl overflow-hidden shadow-xs">
              <div className="grid grid-cols-12 bg-muted/50 px-4 py-2.5 text-[11px] font-mono font-bold text-muted-foreground uppercase border-b border-border">
                <div className="col-span-6">{t('creator.phase4.gtmView.measure', 'MEASURE')}</div>
                <div className="col-span-3">{t('creator.phase4.gtmView.target', 'TARGET')}</div>
                <div className="col-span-3 text-right">{t('creator.phase4.gtmView.actual', 'ACTUAL')}</div>
              </div>

              <div className="divide-y divide-border/60 text-xs sm:text-sm">
                <div className="grid grid-cols-12 px-4 py-3 items-center hover:bg-muted/10 transition-colors">
                  <div className="col-span-6 font-medium text-foreground">{t('creator.phase4.gtmView.businessesContacted', 'Businesses contacted')}</div>
                  <div className="col-span-3 text-muted-foreground font-mono tabular-nums text-xs">
                    {effectiveTargetContacted ? `${effectiveTargetContacted}` : t('creator.phase4.gtmView.notSet', 'Not set')}
                  </div>
                  <div className="col-span-3 text-right font-mono tabular-nums text-muted-foreground">
                    {actualContacted !== null ? actualContacted : totalRunsCount > 0 ? totalRunsCount : '—'}
                  </div>
                </div>

                <div className="grid grid-cols-12 px-4 py-3 items-center hover:bg-muted/10 transition-colors">
                  <div className="col-span-6 font-medium text-foreground">{t('creator.phase4.gtmView.repliesReceived', 'Replies received')}</div>
                  <div className="col-span-3 text-muted-foreground font-mono tabular-nums text-xs">
                    {effectiveTargetReplies ? `${effectiveTargetReplies}` : t('creator.phase4.gtmView.notSet', 'Not set')}
                  </div>
                  <div className="col-span-3 text-right font-mono tabular-nums text-muted-foreground">
                    {actualReplies !== null ? actualReplies : '—'}
                  </div>
                </div>

                <div className="grid grid-cols-12 px-4 py-3 items-center hover:bg-muted/10 transition-colors">
                  <div className="col-span-6 font-medium text-foreground">{t('creator.phase4.gtmView.demoRequests', 'Demo requests')}</div>
                  <div className="col-span-3 text-muted-foreground font-mono tabular-nums text-xs">
                    {effectiveTargetDemos ? `${effectiveTargetDemos}` : t('creator.phase4.gtmView.notSet', 'Not set')}
                  </div>
                  <div className="col-span-3 text-right font-mono tabular-nums text-muted-foreground">
                    {actualDemos !== null ? actualDemos : '—'}
                  </div>
                </div>

                <div className="grid grid-cols-12 px-4 py-3 items-center hover:bg-muted/10 transition-colors">
                  <div className="col-span-6 font-medium text-foreground">{t('creator.phase4.gtmView.purchases', 'Purchases')}</div>
                  <div className="col-span-3 text-muted-foreground font-mono tabular-nums text-xs">
                    {effectiveTargetPurchases ? `${effectiveTargetPurchases}` : t('creator.phase4.gtmView.notSet', 'Not set')}
                  </div>
                  <div className="col-span-3 text-right font-mono tabular-nums text-muted-foreground">
                    {actualPurchases !== null ? actualPurchases : '—'}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Empty State Notice & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
            {strategy.experiments?.[0]?.runs?.length
              ? t('creator.phase4.gtmView.recordedRunsSummary', 'Recorded {{count}} validation runs. Replies and demo requests show interest; purchases show someone bought.', { count: strategy.experiments[0].runs.length })
              : t('creator.phase4.gtmView.noResultsRecorded', 'No results recorded yet. Replies and demo requests show interest; purchases show someone bought.')}
          </p>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              onClick={() => {
                setTargetContacted(effectiveTargetContacted ?? '');
                setTargetReplies(effectiveTargetReplies ?? '');
                setTargetDemos(effectiveTargetDemos ?? '');
                setTargetPurchases(effectiveTargetPurchases ?? '');
                setIsSetTargetsOpen(true);
              }}
              className="px-3.5 py-1.5 rounded-lg border border-border bg-card hover:bg-accent text-xs font-semibold text-foreground transition-colors"
            >
              {t('creator.phase4.gtmView.setTargets', 'Set targets')}
            </button>
            <button
              onClick={() => setIsRecordResultsOpen(true)}
              className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold transition-colors"
            >
              {t('creator.phase4.gtmView.recordResults', 'Record results')}
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 9: CONNECTION TO LAUNCH ASSETS                                    */}
      {/* ========================================================================= */}
      <section className="bg-card border border-border rounded-2xl p-6 sm:p-7 shadow-xs space-y-4">
        <div className="space-y-1">
          <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest block">
            {t('creator.phase4.gtmView.nextStepPreview', 'NEXT STEP PREVIEW')}
          </span>
          <h2 className="text-lg sm:text-xl font-bold font-heading text-foreground">
            {t('creator.phase4.gtmView.planGuideAssets', 'Your plan will guide your launch assets')}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {t('creator.phase4.gtmView.previewWebsiteGuide', 'Your customer group, message, offer, and next action will help shape your website.')}
          </p>
        </div>

        {/* 3 Mini Preview Pills */}
        <div className="flex flex-wrap gap-2.5 pt-1">
          <div className="px-3 py-1.5 rounded-lg bg-muted/40 border border-border/70 text-xs font-medium text-foreground">
            {t('creator.phase4.gtmView.forLabel', 'For:')} <strong className="font-semibold">{effectiveCustomerGroup}</strong>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-muted/40 border border-border/70 text-xs font-medium text-foreground">
            {t('creator.phase4.gtmView.messageLabel', 'Message:')} <strong className="font-semibold">{strategy.founderOverrides?.['CustomOutreachMessage'] || strategy.primarySegment?.primaryMessage || 'Keep enquiries & quotes in one place'}</strong>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-muted/40 border border-border/70 text-xs font-medium text-foreground">
            {t('creator.phase4.gtmView.proposedCta', 'Proposed CTA:')}{' '}
            <strong className="font-semibold">
              {strategy.experiments?.[0]?.offer
                ? t('creator.phase4.gtmView.expressInterestIn', 'Express interest in {{offer}}', { offer: strategy.experiments[0].offer })
                : t('creator.phase4.gtmView.expressInterestProposal', 'Express interest (Proposal to review in Step 4.8)')}
            </strong>
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          {t('creator.phase4.gtmView.ctaMatchNote', 'The call to action should match what your project can currently offer. Direct sales or checkout will not be enabled while the product is in preparation.')}
        </p>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 10: JOURNEY FOOTER                                                */}
      {/* ========================================================================= */}
      <footer className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link
          href={`/dashboard/creator/phase-4/pricing?ideaId=${encodeURIComponent(ideaId)}`}
          className="text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('creator.phase4.gtmView.backToPricing', 'Back to Pricing')}</span>
        </Link>

        <p className="text-xs text-muted-foreground text-center max-w-sm">
          {t('creator.phase4.gtmView.activatingSavesNote', 'Activating saves your chosen plan. You control when each action starts.')}
        </p>

        <div className="flex flex-col items-end gap-1 w-full sm:w-auto">
          <button
            onClick={handleActivateAndContinue}
            disabled={isActivating || isLoading}
            className="w-full sm:w-auto px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-colors disabled:opacity-50"
          >
            <span>{isActivating ? t('creator.phase4.gtmView.activating', 'Activating plan...') : t('creator.phase4.gtmView.activateAndContinue', 'Activate plan & continue')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <span className="text-[11px] text-muted-foreground font-mono">
            {t('creator.phase4.gtmView.nextLaunchAssets', 'Next: Launch Assets')}
          </span>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* MODALS                                                                    */}
      {/* ========================================================================= */}

      {/* 1. Edit Message Modal */}
      {isEditMessageOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold font-heading text-foreground">
                {t('creator.phase4.gtmView.editOutreachMessage', 'Edit Initial Outreach Message')}
              </h3>
              <button
                onClick={() => setIsEditMessageOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('creator.phase4.gtmView.editOutreachDesc', 'Customize the introductory message you plan to send to prospective discovery customers.')}
            </p>
            <textarea
              rows={4}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full p-3 rounded-xl bg-background border border-input text-xs sm:text-sm text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none"
              placeholder={t('creator.phase4.gtmView.outreachPlaceholder', 'Enter your customized outreach message...')}
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsEditMessageOpen(false)}
                disabled={isSavingMessage}
                className="px-4 py-2 rounded-lg border border-border text-xs font-semibold text-foreground hover:bg-accent"
              >
                {t('creator.phase4.gtmView.cancel', 'Cancel')}
              </button>
              <button
                onClick={handleSaveMessage}
                disabled={isSavingMessage}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-50"
              >
                {isSavingMessage ? t('creator.phase4.gtmView.saving', 'Saving...') : t('creator.phase4.gtmView.saveMessage', 'Save Message')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Adjust Customer Group Modal */}
      {isAdjustGroupOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold font-heading text-foreground">
                {t('creator.phase4.gtmView.adjustCustomerGroupTitle', 'Adjust Target Customer Group')}
              </h3>
              <button
                onClick={() => setIsAdjustGroupOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('creator.phase4.gtmView.adjustCustomerGroupDesc', 'Define the specific profile of businesses or individuals you plan to contact first.')}
            </p>
            <textarea
              rows={3}
              value={customGroup || effectiveCustomerGroup}
              onChange={(e) => setCustomGroup(e.target.value)}
              className="w-full p-3 rounded-xl bg-background border border-input text-xs sm:text-sm text-foreground focus:ring-2 focus:ring-primary/40 focus:outline-none"
              placeholder={t('creator.phase4.gtmView.customerGroupPlaceholder', 'e.g. Independent service businesses in France...')}
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsAdjustGroupOpen(false)}
                disabled={isSavingGroup}
                className="px-4 py-2 rounded-lg border border-border text-xs font-semibold text-foreground hover:bg-accent"
              >
                {t('creator.phase4.gtmView.cancel', 'Cancel')}
              </button>
              <button
                onClick={handleSaveCustomerGroup}
                disabled={isSavingGroup}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-50"
              >
                {isSavingGroup ? t('creator.phase4.gtmView.saving', 'Saving...') : t('creator.phase4.gtmView.saveCustomerGroup', 'Save Customer Group')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Change Channel Modal */}
      {isChangeChannelOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-card border border-border rounded-2xl max-w-xl w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold font-heading text-foreground">
                {t('creator.phase4.gtmView.selectOutreachChannel', 'Select Starting Outreach Channel')}
              </h3>
              <button
                onClick={() => setIsChangeChannelOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('creator.phase4.gtmView.selectChannelDesc', 'Choose which acquisition or validation channel you want to prioritize as your primary focus.')}
            </p>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {strategy.channelStrategy?.map((ch) => (
                <div
                  key={ch.key}
                  onClick={() => setSelectedChannelKey(ch.key)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    (selectedChannelKey || primaryChannel?.key) === ch.key
                      ? 'bg-primary/10 border-primary shadow-xs'
                      : 'bg-muted/20 border-border hover:border-border/80'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground font-heading">
                        {ch.channelName}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                        {ch.priority}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">{ch.rationale}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSaveChannelPriority(ch.key, 'Primary');
                    }}
                    className="px-3 py-1 rounded-md bg-primary text-primary-foreground text-xs font-semibold shrink-0"
                  >
                    {t('creator.phase4.gtmView.setAsPrimary', 'Set as Primary')}
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsChangeChannelOpen(false)}
                className="px-4 py-2 rounded-lg border border-border text-xs font-semibold text-foreground hover:bg-accent"
              >
                {t('creator.phase4.gtmView.done', 'Done')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Set Budget & Time Modal */}
      {isSetBudgetOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold font-heading text-foreground">
                {t('creator.phase4.gtmView.setTimeAndBudget', 'Set Time & Marketing Budget')}
              </h3>
              <button
                onClick={() => setIsSetBudgetOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  {t('creator.phase4.gtmView.weeklyHoursAvailable', 'Weekly Project Hours Available')}
                </label>
                <input
                  type="number"
                  min={1}
                  max={80}
                  value={timeInput}
                  onChange={(e) =>
                    setTimeInput(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="w-full p-2.5 rounded-xl bg-background border border-input text-xs sm:text-sm text-foreground"
                  placeholder={t('creator.phase4.gtmView.hoursPlaceholder', 'e.g. 4')}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  {t('creator.phase4.gtmView.spendableMarketingBudget', 'Spendable Marketing Budget (€)')}
                </label>
                <input
                  type="number"
                  min={0}
                  step={50}
                  value={budgetInput}
                  onChange={(e) =>
                    setBudgetInput(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="w-full p-2.5 rounded-xl bg-background border border-input text-xs sm:text-sm text-foreground"
                  placeholder={t('creator.phase4.gtmView.budgetPlaceholder', 'e.g. 500')}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsSetBudgetOpen(false)}
                disabled={isSavingBudget}
                className="px-4 py-2 rounded-lg border border-border text-xs font-semibold text-foreground hover:bg-accent"
              >
                {t('creator.phase4.gtmView.cancel', 'Cancel')}
              </button>
              <button
                onClick={handleSaveBudgetAndTime}
                disabled={isSavingBudget}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-50"
              >
                {isSavingBudget ? t('creator.phase4.gtmView.saving', 'Saving...') : t('creator.phase4.gtmView.save', 'Save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Set Targets Modal */}
      {isSetTargetsOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold font-heading text-foreground">
                {t('creator.phase4.gtmView.setTargetsTitle', 'Set Launch Tracking Targets')}
              </h3>
              <button
                onClick={() => setIsSetTargetsOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">{t('creator.phase4.gtmView.businessesToContact', 'Businesses to contact')}</label>
                <input
                  type="number"
                  value={targetContacted}
                  onChange={(e) =>
                    setTargetContacted(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="w-full p-2 rounded-lg bg-background border border-input text-foreground"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground">{t('creator.phase4.gtmView.targetReplies', 'Target replies')}</label>
                <input
                  type="number"
                  value={targetReplies}
                  onChange={(e) =>
                    setTargetReplies(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="w-full p-2 rounded-lg bg-background border border-input text-foreground"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground">{t('creator.phase4.gtmView.targetDemoRequests', 'Target demo requests')}</label>
                <input
                  type="number"
                  value={targetDemos}
                  onChange={(e) =>
                    setTargetDemos(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="w-full p-2 rounded-lg bg-background border border-input text-foreground"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground">{t('creator.phase4.gtmView.targetPurchases', 'Target purchases')}</label>
                <input
                  type="number"
                  value={targetPurchases}
                  onChange={(e) =>
                    setTargetPurchases(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="w-full p-2 rounded-lg bg-background border border-input text-foreground"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsSetTargetsOpen(false)}
                disabled={isSavingTargets}
                className="px-4 py-2 rounded-lg border border-border text-xs font-semibold text-foreground hover:bg-accent"
              >
                {t('creator.phase4.gtmView.cancel', 'Cancel')}
              </button>
              <button
                onClick={handleSaveTargets}
                disabled={isSavingTargets}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-50"
              >
                {isSavingTargets ? t('creator.phase4.gtmView.saving', 'Saving...') : t('creator.phase4.gtmView.saveTargets', 'Save Targets')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Record Results Modal */}
      {isRecordResultsOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <form
            onSubmit={handleRecordRunSubmit}
            className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold font-heading text-foreground">
                {t('creator.phase4.gtmView.recordOutreachActivity', 'Record Launch Outreach Activity')}
              </h3>
              <button
                type="button"
                onClick={() => setIsRecordResultsOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">{t('creator.phase4.gtmView.actualSpend', 'Actual Spend (€)')}</label>
                <input
                  type="number"
                  value={actualSpend}
                  onChange={(e) =>
                    setActualSpend(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="w-full p-2 rounded-lg bg-background border border-input text-foreground"
                  placeholder="0"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">{t('creator.phase4.gtmView.timeEffortInvested', 'Time / Effort Invested')}</label>
                <input
                  type="text"
                  value={actualEffort}
                  onChange={(e) => setActualEffort(e.target.value)}
                  className="w-full p-2 rounded-lg bg-background border border-input text-foreground"
                  placeholder={t('creator.phase4.gtmView.effortPlaceholder', 'e.g. 3 hours outreach')}
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">{t('creator.phase4.gtmView.observationsFeedback', 'Observations & Feedback')}</label>
                <textarea
                  rows={3}
                  value={actualObservations}
                  onChange={(e) => setActualObservations(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-background border border-input text-foreground"
                  placeholder={t('creator.phase4.gtmView.observationsPlaceholder', 'e.g. Contacted 10 local electricians; 3 replied asking about quotation format...')}
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">{t('creator.phase4.gtmView.validationOutcome', 'Validation Outcome')}</label>
                <select
                  value={actualOutcome}
                  onChange={(e) => setActualOutcome(e.target.value as ExperimentRunOutcome)}
                  className="w-full p-2 rounded-lg bg-background border border-input text-foreground"
                >
                  <option value="Validated">{t('creator.phase4.gtmView.validatedStrongInterest', 'Validated (Strong Customer Interest)')}</option>
                  <option value="Invalidated">{t('creator.phase4.gtmView.invalidatedNoFit', 'Invalidated (No Fit)')}</option>
                  <option value="Inconclusive">{t('creator.phase4.gtmView.inconclusiveNeedsSamples', 'Inconclusive (Needs More Samples)')}</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsRecordResultsOpen(false)}
                className="px-4 py-2 rounded-lg border border-border text-xs font-semibold text-foreground hover:bg-accent"
              >
                {t('creator.phase4.gtmView.cancel', 'Cancel')}
              </button>
              <button
                type="submit"
                disabled={isSubmittingRecord}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-50"
              >
                {isSubmittingRecord ? t('creator.phase4.gtmView.saving', 'Saving...') : t('creator.phase4.gtmView.saveResults', 'Save Results')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
