'use client';

import React, { useState } from 'react';
import Link from 'next/link';
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
  Compass,
  FlaskConical,
  BarChart3,
  Sliders,
  History,
  Info,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  X,
  ExternalLink,
  Users,
  TrendingUp,
  ShieldCheck,
  Check,
  Award,
} from 'lucide-react';
import type {
  GtmStrategy,
  GtmChannelStrategy,
  GtmExperiment,
  ChannelPriority,
  ExperimentRunOutcome,
  UpdateGtmChannelRequest,
  RecordExperimentRunRequest,
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
  onRecordExperimentRun: (experimentKey: string, req: RecordExperimentRunRequest) => Promise<void>;
}

function getPriorityBadge(priority: ChannelPriority) {
  switch (priority) {
    case 'Primary':
      return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
    case 'Secondary':
      return 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30';
    case 'Later':
      return 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30';
    case 'NotRecommended':
      return 'bg-muted text-muted-foreground border-border';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
}

function getEffortBadge(effort: string) {
  switch (effort) {
    case 'High':
      return 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/30';
    case 'Medium':
      return 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30';
    case 'Low':
      return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
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
  onRecordExperimentRun,
}: GtmStrategyViewProps) {
  // Modal states
  const [editingChannel, setEditingChannel] = useState<GtmChannelStrategy | null>(null);
  const [editPriority, setEditPriority] = useState<ChannelPriority>('Primary');
  const [editNotes, setEditNotes] = useState('');
  const [isUpdatingChannel, setIsUpdatingChannel] = useState(false);

  // Experiment run logging modal
  const [loggingExperiment, setLoggingExperiment] = useState<GtmExperiment | null>(null);
  const [runSpend, setRunSpend] = useState<number>(0);
  const [runEffort, setRunEffort] = useState('');
  const [runObservations, setRunObservations] = useState('');
  const [runOutcome, setRunOutcome] = useState<ExperimentRunOutcome>('Validated');
  const [isLoggingRun, setIsLoggingRun] = useState(false);

  // Toggle run history view per experiment
  const [expandedRuns, setExpandedRuns] = useState<Record<string, boolean>>({});

  const toggleRunHistory = (expKey: string) => {
    setExpandedRuns((prev) => ({ ...prev, [expKey]: !prev[expKey] }));
  };

  const openChannelModal = (ch: GtmChannelStrategy) => {
    setEditingChannel(ch);
    setEditPriority(ch.priority);
    setEditNotes(ch.founderNotes || '');
  };

  const handleSaveChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChannel) return;
    try {
      setIsUpdatingChannel(true);
      await onUpdateChannel(editingChannel.key, {
        ideaId,
        priority: editPriority,
        founderNotes: editNotes.trim() ? editNotes : null,
      });
      setEditingChannel(null);
    } finally {
      setIsUpdatingChannel(false);
    }
  };

  const openLogRunModal = (exp: GtmExperiment) => {
    setLoggingExperiment(exp);
    setRunSpend(0);
    setRunEffort('');
    setRunObservations('');
    setRunOutcome('Validated');
  };

  const handleSaveRun = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggingExperiment) return;
    try {
      setIsLoggingRun(true);
      await onRecordExperimentRun(loggingExperiment.key, {
        ideaId,
        actualSpend: Number(runSpend) || 0,
        actualEffort: runEffort.trim() || 'Not specified',
        observations: runObservations.trim(),
        outcome: runOutcome,
        statusUpdate: 'Completed',
      });
      setLoggingExperiment(null);
    } finally {
      setIsLoggingRun(false);
    }
  };

  // 1. GATE BLOCKER VIEW
  if (gateError) {
    return (
      <div className="max-w-[1120px] mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 sm:p-8 text-foreground space-y-4 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-amber-800 dark:text-amber-300 font-semibold block">
                PREREQUISITE GATE ACTIVE · PHASE 4.7 LOCKED
              </span>
              <h2 className="text-lg sm:text-xl font-bold font-heading text-amber-900 dark:text-amber-200 mt-1">
                Phase 4.6 Pricing Strategy Required First
              </h2>
              <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-300/90 mt-1">
                {gateError.message}
              </p>
            </div>
          </div>
          <div className="bg-card/70 border border-border/60 rounded-xl p-4 text-xs space-y-2 font-mono text-muted-foreground">
            <div>1. Phase 4.6 Pricing & Revenue Model must be generated and valid.</div>
            <div>2. Unit economics and contribution margins must be established.</div>
            <div>3. Target segments and baseline prices must be defined.</div>
          </div>
          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              href={`/dashboard/creator/phase-4/pricing?ideaId=${ideaId}`}
              className="px-5 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-sm flex items-center gap-2 transition-colors"
            >
              <span>Complete Step 4.6 Pricing Strategy</span>
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
      <div className="max-w-[1120px] mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="bg-card border border-border rounded-2xl p-8 sm:p-12 text-center space-y-6 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary shadow-sm">
            <Rocket className="w-8 h-8" />
          </div>
          <div className="max-w-xl mx-auto space-y-2">
            <span className="text-xs uppercase tracking-wider font-mono text-primary font-semibold block">
              CREATOR PHASE 4.7 · GTM & LAUNCH STRATEGY ENGINE
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-heading text-foreground">
              Convert Pricing & Market Intelligence into a Sequenced Launch
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Derive grounded customer acquisition channels, weekly capacity allocations, empirical validation experiments, and measurable conversion funnel metrics without guesswork.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left max-w-2xl mx-auto pt-2">
            <div className="p-4 rounded-xl bg-muted/40 border border-border/80 space-y-1">
              <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-primary" />
                <span>Multi-Signal Motion</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Evaluates buying complexity, offer structure, and trust requirements—not raw price thresholds alone.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-muted/40 border border-border/80 space-y-1">
              <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span>Shared Capacity Resolver</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Reuses the canonical founder weekly capacity model to calculate channel effort load and prevent burnout.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-muted/40 border border-border/80 space-y-1">
              <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <FlaskConical className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>Honest Baselines</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Flags ungrounded targets as NeedsBaseline instead of inventing fake conversion or CAC targets.
              </p>
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={onGenerate}
              disabled={isLoading}
              className="px-6 py-3 rounded-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground text-sm font-semibold shadow-sm flex items-center gap-2 mx-auto transition-all"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Synthesizing GTM Strategy Engine...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Go-To-Market Strategy</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. COMPLETE DASHBOARD VIEW (Figma 57221:12464)
  return (
    <div className="max-w-[1120px] mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* 3.1 Header / Hero Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase font-mono tracking-wider text-muted-foreground font-semibold">
              PHASE 4 · STEP 4.7
            </span>
            <span className="text-xs font-mono bg-muted text-muted-foreground border border-border px-2 py-0.5 rounded-full">
              Motion: <strong className="text-foreground">{strategy.overallMotion}</strong>
            </span>
            <span className="text-xs font-mono text-muted-foreground/70">
              Generated {new Date(strategy.generatedAt).toLocaleDateString()}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-foreground tracking-tight">
            {projectName || 'Project'} Go-To-Market Strategy
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Deterministic channel prioritization grounded in founder availability, offer economics, and empirical validation gates.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg text-xs font-medium border flex items-center gap-2 transition-colors ${
              updateAvailable
                ? 'bg-amber-600 hover:bg-amber-500 text-white border-amber-500 shadow-sm'
                : 'bg-card hover:bg-muted text-foreground border-border'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{updateAvailable ? 'Refresh GTM' : 'Re-verify'}</span>
          </button>
        </div>
      </div>

      {/* 3.2 Conditional Staleness Banner */}
      {updateAvailable && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <h4 className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                GTM Strategy Has Upstream Dependency Updates
              </h4>
              <p className="text-xs text-amber-800 dark:text-amber-300/90">
                Consumed sources have changed: <span className="font-medium">{changedSources.join(', ')}</span>. Refreshing will update recommendations while strictly preserving founder overrides and historical experiment runs.
              </p>
            </div>
          </div>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium shrink-0 flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Now</span>
          </button>
        </div>
      )}

      {/* 3.3 Warning: Pricing Needs Validation First */}
      {strategy.pricingValidationRequired && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h4 className="text-xs font-semibold text-blue-900 dark:text-blue-200">
              Validation-First GTM Motion Required
            </h4>
            <p className="text-xs text-blue-800 dark:text-blue-300/90">
              {strategy.pricingValidationNotice ||
                'Pricing model is in NeedsValidation confidence. Paid acquisition channels are deferred until customer willingness-to-pay is demonstrated through early discovery calls and pilots.'}
            </p>
          </div>
        </div>
      )}

      {/* 3.4 Warning: Founder Capacity Overload */}
      {strategy.capacityWarningActive && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h4 className="text-xs font-semibold text-foreground">
              Founder Capacity Overload Alert
            </h4>
            <p className="text-xs text-destructive">
              {strategy.founderExecutionPlan?.overloadMitigationNotice ||
                'Allocated weekly channel hours exceed your declared availability. Deprioritize secondary channels or delegate operational tasks to avoid execution failure.'}
            </p>
          </div>
        </div>
      )}

      {/* 3.5 Top Stat Cards: Capacity & Budget Provenance */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Capacity Reconciliation */}
        <div className="p-4 rounded-xl bg-card border border-border space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Weekly Founder Capacity</span>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold font-mono text-foreground">
            {strategy.founderExecutionPlan?.weeklyHoursAllocated}h / {strategy.founderExecutionPlan?.weeklyHoursAvailable}h
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
            <span>Band: {strategy.founderExecutionPlan?.capacityBand}</span>
            <span
              className={
                strategy.founderExecutionPlan?.isOverloaded
                  ? 'text-destructive font-semibold'
                  : 'text-emerald-600 dark:text-emerald-400 font-medium'
              }
            >
              {strategy.founderExecutionPlan?.remainingWeeklyHours}h buffer
            </span>
          </div>
        </div>

        {/* Card 2: Spendable Launch Budget */}
        <div className="p-4 rounded-xl bg-card border border-border space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Spendable Marketing Cash</span>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold font-mono text-foreground">
            {strategy.budgetPlan?.totalAvailableBudget !== null && strategy.budgetPlan?.totalAvailableBudget !== undefined
              ? `€${strategy.budgetPlan.totalAvailableBudget.toLocaleString()}`
              : '€0 (Bootstrapped)'}
          </div>
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-foreground">Status: {strategy.budgetPlan?.spendableStatus}</span>
            <span className="text-muted-foreground">{strategy.budgetPlan?.budgetSource}</span>
          </div>
        </div>

        {/* Card 3: CAC Economics */}
        <div className="p-4 rounded-xl bg-card border border-border space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">CAC Provenance</span>
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold font-mono text-foreground">
            {strategy.budgetPlan?.observedCac !== null && strategy.budgetPlan?.observedCac !== undefined
              ? `€${strategy.budgetPlan.observedCac} (Observed)`
              : strategy.budgetPlan?.forecastCacAssumption !== null && strategy.budgetPlan?.forecastCacAssumption !== undefined
              ? `€${strategy.budgetPlan.forecastCacAssumption} (Assumed)`
              : 'Needs Baseline'}
          </div>
          <div className="text-xs text-muted-foreground font-mono">
            {strategy.budgetPlan?.observedCac ? 'Empirically validated in market' : 'Unvalidated forecast assumption'}
          </div>
        </div>

        {/* Card 4: Primary Segment & Offer */}
        <div className="p-4 rounded-xl bg-card border border-border space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Primary Launch Segment</span>
            <Target className="w-4 h-4 text-primary" />
          </div>
          <div className="text-base font-bold text-foreground truncate">
            {strategy.primarySegment?.segmentName}
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
            <span>€{strategy.primarySegment?.selectedPrice}</span>
            <span>{strategy.primarySegment?.revenueModel}</span>
          </div>
        </div>
      </div>

      {/* 3.6 Primary Launch Segment Deep-Dive */}
      <div className="p-6 rounded-2xl bg-card border border-border space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/80 pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold font-heading text-foreground">
              Primary Launch Segment & Positioning
            </h3>
          </div>
          <span className="text-xs font-mono text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">
            Target Match Score: {strategy.primarySegment?.relevanceScore}%
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div>
              <span className="text-xs font-mono text-muted-foreground uppercase">Target Segment</span>
              <div className="text-sm font-semibold text-foreground">{strategy.primarySegment?.segmentName}</div>
              <p className="text-xs text-muted-foreground mt-1">{strategy.primarySegment?.rationale}</p>
            </div>
            <div>
              <span className="text-xs font-mono text-muted-foreground uppercase">Core Problem Addressed</span>
              <div className="text-xs text-foreground font-medium mt-0.5">{strategy.primarySegment?.problem}</div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-xs font-mono text-muted-foreground uppercase">Primary Value Proposition Angle</span>
              <div className="text-xs text-primary font-medium mt-0.5 bg-primary/5 border border-primary/20 p-2.5 rounded-lg">
                &ldquo;{strategy.primarySegment?.primaryMessage}&rdquo;
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs font-mono text-muted-foreground pt-1">
              <div>
                <span className="text-xs text-muted-foreground uppercase block">Buying Complexity</span>
                <span className="text-foreground font-medium">{strategy.primarySegment?.buyingComplexity}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground uppercase block">Sales Cycle Basis</span>
                <span className="text-foreground font-medium">{strategy.primarySegment?.estimatedSalesCycle}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3.7 Channel Portfolio Strategy */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold font-heading text-foreground flex items-center gap-2">
              <Share2 className="w-4 h-4 text-primary" />
              <span>Prioritized Acquisition Channels</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Prioritized by deterministic reason codes based on your target segment, offer complexity, and capacity load.
            </p>
          </div>
          <span className="text-xs font-mono text-muted-foreground">
            {strategy.channelStrategy.filter((c) => c.priority === 'Primary').length} Primary Channels
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {strategy.channelStrategy.map((channel) => (
            <div
              key={channel.key}
              className={`p-5 rounded-xl border flex flex-col justify-between transition-all ${
                channel.priority === 'Primary'
                  ? 'bg-card border-primary/40 shadow-sm'
                  : channel.priority === 'Secondary'
                  ? 'bg-card border-border'
                  : 'bg-muted/30 border-border/70 opacity-90'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-xs font-mono uppercase px-2 py-0.5 rounded border font-semibold ${getPriorityBadge(channel.priority)}`}>
                    {channel.priority}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-mono px-1.5 py-0.5 rounded border ${getEffortBadge(channel.effortLevel)}`}>
                      {channel.effortLevel} Effort
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">
                      {channel.estimatedWeeklyHours}h/wk
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-foreground">
                    {channel.channelName}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {channel.rationale}
                  </p>
                </div>

                {/* Deterministic Reason Codes */}
                <div className="space-y-1">
                  <span className="text-xs font-mono uppercase text-muted-foreground tracking-wider block">
                    Deterministic Reason Codes
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {channel.reasonCodes.map((rc, i) => (
                      <span
                        key={i}
                        className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-muted text-foreground border border-border"
                      >
                        {rc}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Grounding & First Step */}
                <div className="space-y-1 text-xs border-t border-border/60 pt-2 font-mono">
                  <div className="text-muted-foreground">
                    <strong className="text-foreground">Why now:</strong> {channel.whyNow}
                  </div>
                  <div className="text-primary pt-1">
                    <strong className="text-foreground">First Step:</strong> {channel.firstStep}
                  </div>
                </div>

                {/* Founder Notes if any */}
                {channel.founderEdited && (
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded p-2 text-xs text-purple-800 dark:text-purple-300 font-mono">
                    <strong>Founder Note:</strong> {channel.founderNotes || 'Priority customized by founder.'}
                  </div>
                )}
              </div>

              <div className="pt-4 mt-3 border-t border-border/60 flex items-center justify-between">
                <span className="text-xs font-mono text-muted-foreground">
                  {channel.monthlySpendEstimate > 0 ? `€${channel.monthlySpendEstimate}/mo spend` : '€0 spend'}
                </span>
                <button
                  onClick={() => openChannelModal(channel)}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 font-medium transition-colors"
                >
                  <Sliders className="w-3 h-3" />
                  <span>Adjust Priority</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3.8 Validation Experiments & Immutable History */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold font-heading text-foreground flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>GTM Validation Experiments</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Empirical hypotheses with success and stop conditions. Completed runs are preserved immutably as historical evidence.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {strategy.experiments.map((exp) => (
            <div
              key={exp.key}
              className="p-5 rounded-xl bg-card border border-border space-y-4 shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono uppercase bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded font-semibold">
                    {exp.timebox}
                  </span>
                  <span className="text-xs font-bold text-foreground">
                    Channel: {exp.channel}
                  </span>
                  <span className="text-xs font-mono text-muted-foreground">
                    Cap: €{exp.budgetCap}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleRunHistory(exp.key)}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 font-mono transition-colors"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>{exp.runs?.length || 0} Runs Logged</span>
                    {expandedRuns[exp.key] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                  <button
                    onClick={() => openLogRunModal(exp)}
                    className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <span>Log Completed Run</span>
                  </button>
                </div>
              </div>

              {/* Hypothesis */}
              <div className="space-y-1">
                <span className="text-xs font-mono uppercase text-muted-foreground tracking-wider block">
                  Testable Hypothesis
                </span>
                <div className="text-sm font-medium text-foreground">
                  {exp.hypothesis}
                </div>
              </div>

              {/* Success / Stop / Metric Conditions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono pt-2 border-t border-border/60">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground uppercase block">Primary Metric</span>
                  <span className="text-purple-700 dark:text-purple-300 font-semibold">{exp.primaryMetric}</span>
                  <div className="text-xs text-muted-foreground">
                    Threshold: <strong className="text-foreground">{exp.targetStatus}</strong>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 uppercase block">Success Condition</span>
                  <span className="text-foreground">{exp.successCondition}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-destructive uppercase block">Stop Condition</span>
                  <span className="text-foreground">{exp.stopCondition}</span>
                </div>
              </div>

              {/* Immutable Historical Runs Accordion */}
              {expandedRuns[exp.key] && (
                <div className="pt-3 border-t border-border space-y-3">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Immutable Historical Evidence Log</span>
                  </span>

                  {!exp.runs || exp.runs.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">
                      No completed experiment runs recorded yet. Execute the initial test and click &quot;Log Completed Run&quot;.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {exp.runs.map((run) => (
                        <div
                          key={run.runId}
                          className="p-3 rounded-lg bg-muted/40 border border-border text-xs font-mono space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-xs font-semibold px-2 py-0.5 rounded border ${
                                run.outcome === 'Validated'
                                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                                  : run.outcome === 'Invalidated'
                                  ? 'bg-destructive/10 text-destructive border-destructive/30'
                                  : 'bg-muted text-muted-foreground border-border'
                              }`}
                            >
                              Outcome: {run.outcome}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Recorded {new Date(run.recordedAt).toLocaleString()}
                            </span>
                          </div>
                          <div className="text-foreground font-sans text-xs">
                            {run.observations}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                            <span>Actual Spend: €{run.actualSpend}</span>
                            <span>Effort: {run.actualEffort}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 3.9 Metrics Framework Contract */}
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-bold font-heading text-foreground flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            <span>Standardized Measurement Contract</span>
          </h3>
          <p className="text-xs text-muted-foreground">
            Stable definitions across Phase 4.7 through Entrepreneur analytics to prevent definition drift.
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-muted/60 border-b border-border text-muted-foreground uppercase text-xs">
              <tr>
                <th className="p-3">Stage</th>
                <th className="p-3">Metric Name</th>
                <th className="p-3">Calculation / Formula</th>
                <th className="p-3">Data Source</th>
                <th className="p-3">Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-foreground">
              {strategy.metricsFramework.map((m) => (
                <tr key={m.key} className="hover:bg-muted/30">
                  <td className="p-3 text-primary font-semibold">{m.funnelStage}</td>
                  <td className="p-3 text-foreground font-sans font-medium">{m.name}</td>
                  <td className="p-3 text-muted-foreground text-xs">{m.numerator} / {m.denominator}</td>
                  <td className="p-3 text-muted-foreground">{m.dataSource}</td>
                  <td className="p-3 text-foreground">
                    <span className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground border border-border">
                      {m.target} ({m.targetStatus})
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3.10 Launch Timeline & Phasing */}
      <div className="p-6 rounded-2xl bg-card border border-border space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-border/80 pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold font-heading text-foreground">
              Sequenced Launch Phasing
            </h3>
          </div>
          <span className="text-xs font-mono text-muted-foreground">
            Target Launch Window: <strong className="text-foreground">{strategy.launchPlan?.primaryLaunchMonth}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {strategy.launchPlan?.phases?.map((p) => (
            <div
              key={p.phaseNumber}
              className="p-4 rounded-xl bg-muted/20 border border-border space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase bg-muted text-foreground px-2 py-0.5 rounded font-semibold border border-border">
                  Phase {p.phaseNumber}
                </span>
                <span className="text-xs font-mono text-muted-foreground">
                  {p.timeframe}
                </span>
              </div>
              <h4 className="text-xs font-bold text-foreground">{p.phaseName}</h4>
              <p className="text-xs text-muted-foreground">{p.objective}</p>

              <div className="space-y-1 text-xs font-mono pt-2 border-t border-border text-muted-foreground">
                <span className="text-primary uppercase block font-semibold">Exit Criteria:</span>
                <ul className="list-disc list-inside space-y-0.5">
                  {p.exitCriteria?.map((ec, i) => (
                    <li key={i} className="text-foreground">{ec}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3.11 Strict Phase 4.8 Boundary Banner (Disabled) */}
      <div className="mt-8 bg-card border border-border rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1 text-center md:text-left">
          <span className="text-xs uppercase font-mono tracking-wider text-muted-foreground block font-semibold">
            PHASE 4.8 BOUNDARY · COMING NEXT
          </span>
          <h4 className="text-sm font-bold text-foreground">Launch Assets & Execution Collateral</h4>
          <p className="text-xs text-muted-foreground max-w-xl">
            Copywriting, landing page wireframes, sales deck scripts, email outreach templates, and brand collateral belong to Phase 4.8 once GTM strategy is sequenced.
          </p>
        </div>
        <button
          disabled
          className="px-4 py-2.5 rounded-lg bg-muted text-muted-foreground border border-border text-xs font-medium cursor-not-allowed shrink-0 flex items-center gap-2 opacity-70"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Generate Launch Assets (Phase 4.8 Coming Next)</span>
        </button>
      </div>

      {/* 3.12 Quiet Journey Footer Navigation */}
      <div className="pt-6 border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link
          href={`/dashboard/creator/phase-4/pricing?ideaId=${ideaId}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Step 4.6 Pricing Strategy</span>
        </Link>

        <div className="flex flex-col sm:items-end gap-1">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-muted-foreground">
              Phase 4 Strategy Sequenced.
            </span>
            <Link
              href={`/dashboard/creator/phase-4?ideaId=${ideaId}`}
              className="px-6 py-2.5 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition-colors shadow-sm"
            >
              Review Construction Snapshot →
            </Link>
          </div>
          <span className="text-xs text-muted-foreground/80 font-mono">
            Step 4.7 of 4.7 Complete
          </span>
        </div>
      </div>

      {/* 4. MODAL: Adjust Channel Priority */}
      {editingChannel && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-primary font-semibold">
                  Founder Override
                </span>
                <h3 className="text-base font-bold text-foreground">
                  {editingChannel.channelName}
                </h3>
              </div>
              <button
                onClick={() => setEditingChannel(null)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveChannel} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground block">
                  Select Channel Priority
                </label>
                <select
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value as ChannelPriority)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="Primary">Primary (Immediate Focus)</option>
                  <option value="Secondary">Secondary (Supporting Motion)</option>
                  <option value="Later">Later (Post-Validation)</option>
                  <option value="NotRecommended">Not Recommended (Deferred)</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  Recommended by engine: <strong className="text-foreground">{editingChannel.recommendedPriority}</strong>
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground block">
                  Founder Strategic Rationale
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Delaying outreach until CRM is configured..."
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingChannel(null)}
                  className="px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingChannel}
                  className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors"
                >
                  {isUpdatingChannel ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Override...</span>
                    </>
                  ) : (
                    <span>Save Override</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL: Log Experiment Run */}
      {loggingExperiment && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-purple-700 dark:text-purple-300 font-semibold">
                  Record Historical Evidence
                </span>
                <h3 className="text-base font-bold text-foreground">
                  Log Experiment Run
                </h3>
              </div>
              <button
                onClick={() => setLoggingExperiment(null)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRun} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">
                    Actual Spend (€)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={runSpend}
                    onChange={(e) => setRunSpend(parseFloat(e.target.value) || 0)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">
                    Actual Effort (Hours/Days)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 5 hours"
                    value={runEffort}
                    onChange={(e) => setRunEffort(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground block">
                  Empirical Outcome
                </label>
                <select
                  value={runOutcome}
                  onChange={(e) => setRunOutcome(e.target.value as ExperimentRunOutcome)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="Validated">Validated (Met success condition)</option>
                  <option value="Invalidated">Invalidated (Triggered stop condition)</option>
                  <option value="Inconclusive">Inconclusive (Needs more observations)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground block">
                  Empirical Observations & Findings
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Record qualitative customer quotes, conversion counts, objections, or conversion obstacles observed..."
                  value={runObservations}
                  onChange={(e) => setRunObservations(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setLoggingExperiment(null)}
                  className="px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoggingRun}
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors"
                >
                  {isLoggingRun ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Recording Evidence...</span>
                    </>
                  ) : (
                    <span>Commit Immutable Run</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

