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
  Users
} from 'lucide-react';
import type {
  GtmStrategy,
  GtmChannelStrategy,
  GtmExperiment,
  ChannelPriority,
  ExperimentRunOutcome,
  UpdateGtmChannelRequest,
  RecordExperimentRunRequest
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
      return 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60';
    case 'Secondary':
      return 'bg-blue-950/60 text-blue-400 border-blue-800/60';
    case 'Later':
      return 'bg-amber-950/60 text-amber-400 border-amber-800/60';
    case 'NotRecommended':
      return 'bg-zinc-800/60 text-zinc-400 border-zinc-700/60';
    default:
      return 'bg-zinc-800/60 text-zinc-400 border-zinc-700/60';
  }
}

function getEffortBadge(effort: string) {
  switch (effort) {
    case 'High':
      return 'bg-red-950/50 text-red-400 border-red-800/40';
    case 'Medium':
      return 'bg-amber-950/50 text-amber-400 border-amber-800/40';
    case 'Low':
      return 'bg-emerald-950/50 text-emerald-400 border-emerald-800/40';
    default:
      return 'bg-zinc-800/50 text-zinc-400 border-zinc-700/40';
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
  onRecordExperimentRun
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
    setExpandedRuns(prev => ({ ...prev, [expKey]: !prev[expKey] }));
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
        founderNotes: editNotes.trim() ? editNotes : null
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
        statusUpdate: 'Completed'
      });
      setLoggingExperiment(null);
    } finally {
      setIsLoggingRun(false);
    }
  };

  // 1. GATE BLOCKER VIEW
  if (gateError) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-6 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-950/40 border border-amber-800/60 flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8 text-amber-400" />
        </div>
        <div className="space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-semibold">
            PREREQUISITE GATE ACTIVE · PHASE 4.7 LOCKED
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-100 font-display">
            Phase 4.6 Pricing Strategy Required First
          </h2>
          <p className="text-sm text-zinc-400 max-w-lg mx-auto">
            {gateError.message}
          </p>
        </div>
        <div className="pt-4 flex items-center justify-center gap-4">
          <Link
            href={`/dashboard/creator/phase-4/pricing?ideaId=${ideaId}`}
            className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-950/40 flex items-center gap-2"
          >
            <span>Complete Step 4.6 Pricing Strategy</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  // 2. EMPTY / UNGENERATED VIEW
  if (!strategy) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-6 text-center space-y-8">
        <div className="w-20 h-20 rounded-3xl bg-emerald-950/40 border border-emerald-800/60 flex items-center justify-center mx-auto shadow-xl shadow-emerald-950/20">
          <Rocket className="w-10 h-10 text-emerald-400" />
        </div>
        <div className="space-y-3">
          <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-semibold">
            CREATOR PHASE 4.7 · GTM & LAUNCH STRATEGY ENGINE
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-100 font-display">
            Convert Pricing & Market Intelligence into a Sequenced Launch
          </h2>
          <p className="text-sm text-zinc-400 max-w-xl mx-auto">
            Derive grounded customer acquisition channels, weekly capacity allocations, empirical validation experiments, and measurable conversion funnel metrics without guesswork.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left max-w-2xl mx-auto pt-2">
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1">
            <div className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-emerald-400" />
              <span>Multi-Signal Motion</span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Evaluates buying complexity, offer structure, and trust requirements—not raw price thresholds alone.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1">
            <div className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span>Shared Capacity Resolver</span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Reuses the canonical founder weekly capacity model to calculate channel effort load and prevent burnout.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1">
            <div className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
              <FlaskConical className="w-3.5 h-3.5 text-purple-400" />
              <span>Honest Baselines</span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Flags ungrounded targets as NeedsBaseline instead of inventing fake conversion or CAC targets.
            </p>
          </div>
        </div>

        <div className="pt-4">
          <button
            onClick={onGenerate}
            disabled={isLoading}
            className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 text-white text-sm font-semibold shadow-xl shadow-emerald-950/50 flex items-center gap-2 mx-auto transition-all"
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
    );
  }

  // 3. COMPLETE DASHBOARD VIEW
  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* 3.1 Header / Hero Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-zinc-800">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono uppercase bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 px-2.5 py-1 rounded-full font-semibold">
              PHASE 4.7 · GTM & LAUNCH STRATEGY
            </span>
            <span className="text-xs font-mono text-zinc-400">
              Motion: <strong className="text-zinc-200">{strategy.overallMotion}</strong>
            </span>
            <span className="text-xs font-mono text-zinc-500">
              Generated {new Date(strategy.generatedAt).toLocaleDateString()}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100 font-display">
            {projectName || 'Project'} Go-To-Market Strategy
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl">
            Deterministic channel prioritization grounded in founder availability, offer economics, and empirical validation gates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg text-xs font-medium border flex items-center gap-2 transition-colors ${
              updateAvailable
                ? 'bg-amber-950/60 text-amber-300 border-amber-700/80 hover:bg-amber-900/50'
                : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{updateAvailable ? 'Upstream Changes Available' : 'Refresh GTM'}</span>
          </button>
        </div>
      </div>

      {/* 3.2 Conditional Staleness Banner */}
      {updateAvailable && (
        <div className="bg-amber-950/40 border border-amber-800/80 rounded-xl p-4 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-semibold text-amber-200">
                GTM Strategy Has Upstream Dependency Updates
              </h4>
              <p className="text-[11px] text-amber-300/80">
                Consumed sources have changed: {changedSources.join(', ')}. Refreshing will update recommendations while strictly preserving founder overrides and historical experiment runs.
              </p>
            </div>
          </div>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium shrink-0 flex items-center gap-1.5 shadow"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Now</span>
          </button>
        </div>
      )}

      {/* 3.3 Warning: Pricing Needs Validation First */}
      {strategy.pricingValidationRequired && (
        <div className="bg-blue-950/30 border border-blue-800/60 rounded-xl p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-blue-200">
              Validation-First GTM Motion Required
            </h4>
            <p className="text-[11px] text-blue-300/80">
              {strategy.pricingValidationNotice ||
                'Pricing model is in NeedsValidation confidence. Paid acquisition channels are deferred until customer willingness-to-pay is demonstrated through early discovery calls and pilots.'}
            </p>
          </div>
        </div>
      )}

      {/* 3.4 Warning: Founder Capacity Overload */}
      {strategy.capacityWarningActive && (
        <div className="bg-red-950/40 border border-red-800/80 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-red-200">
              Founder Capacity Overload Alert
            </h4>
            <p className="text-[11px] text-red-300/80">
              {strategy.founderExecutionPlan?.overloadMitigationNotice ||
                'Allocated weekly channel hours exceed your declared availability. Deprioritize secondary channels or delegate operational tasks to avoid execution failure.'}
            </p>
          </div>
        </div>
      )}

      {/* 3.5 Top Stat Cards: Capacity & Budget Provenance */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Capacity Reconciliation */}
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Weekly Founder Capacity</span>
            <Clock className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-100">
            {strategy.founderExecutionPlan?.weeklyHoursAllocated}h / {strategy.founderExecutionPlan?.weeklyHoursAvailable}h
          </div>
          <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono">
            <span>Band: {strategy.founderExecutionPlan?.capacityBand}</span>
            <span className={strategy.founderExecutionPlan?.isOverloaded ? 'text-red-400 font-semibold' : 'text-emerald-400'}>
              {strategy.founderExecutionPlan?.remainingWeeklyHours}h buffer
            </span>
          </div>
        </div>

        {/* Card 2: Spendable Launch Budget */}
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Spendable Marketing Cash</span>
            <DollarSign className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-100">
            {strategy.budgetPlan?.totalAvailableBudget !== null && strategy.budgetPlan?.totalAvailableBudget !== undefined
              ? `€${strategy.budgetPlan.totalAvailableBudget.toLocaleString()}`
              : '€0 (Bootstrapped)'}
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-zinc-400">Status: {strategy.budgetPlan?.spendableStatus}</span>
            <span className="text-zinc-500">{strategy.budgetPlan?.budgetSource}</span>
          </div>
        </div>

        {/* Card 3: CAC Economics */}
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">CAC Provenance</span>
            <BarChart3 className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-100">
            {strategy.budgetPlan?.observedCac !== null && strategy.budgetPlan?.observedCac !== undefined
              ? `€${strategy.budgetPlan.observedCac} (Observed)`
              : strategy.budgetPlan?.forecastCacAssumption !== null && strategy.budgetPlan?.forecastCacAssumption !== undefined
              ? `€${strategy.budgetPlan.forecastCacAssumption} (Assumed)`
              : 'Needs Baseline'}
          </div>
          <div className="text-[11px] text-zinc-500 font-mono">
            {strategy.budgetPlan?.observedCac ? 'Empirically validated in market' : 'Unvalidated forecast assumption'}
          </div>
        </div>

        {/* Card 4: Primary Segment & Offer */}
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Primary Launch Segment</span>
            <Target className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-base font-bold text-zinc-100 truncate">
            {strategy.primarySegment?.segmentName}
          </div>
          <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
            <span>€{strategy.primarySegment?.selectedPrice}</span>
            <span>{strategy.primarySegment?.revenueModel}</span>
          </div>
        </div>
      </div>

      {/* 3.6 Primary Launch Segment Deep-Dive */}
      <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-zinc-100">
              Primary Launch Segment & Positioning
            </h3>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded">
            Target Match Score: {strategy.primarySegment?.relevanceScore}%
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div>
              <span className="text-[10px] font-mono text-zinc-500 uppercase">Target Segment</span>
              <div className="text-sm font-medium text-zinc-200">{strategy.primarySegment?.segmentName}</div>
              <p className="text-xs text-zinc-400 mt-1">{strategy.primarySegment?.rationale}</p>
            </div>
            <div>
              <span className="text-[10px] font-mono text-zinc-500 uppercase">Core Problem Addressed</span>
              <div className="text-xs text-zinc-300 mt-0.5">{strategy.primarySegment?.problem}</div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-[10px] font-mono text-zinc-500 uppercase">Primary Value Proposition Angle</span>
              <div className="text-xs text-emerald-300 font-medium mt-0.5 bg-emerald-950/20 border border-emerald-900/40 p-2.5 rounded-lg">
                &ldquo;{strategy.primarySegment?.primaryMessage}&rdquo;
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs font-mono text-zinc-400 pt-1">
              <div>
                <span className="text-[10px] text-zinc-500 uppercase block">Buying Complexity</span>
                <span className="text-zinc-300">{strategy.primarySegment?.buyingComplexity}</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 uppercase block">Sales Cycle Basis</span>
                <span className="text-zinc-300">{strategy.primarySegment?.estimatedSalesCycle}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3.7 Channel Portfolio Strategy */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-emerald-400" />
              <span>Prioritized Acquisition Channels</span>
            </h3>
            <p className="text-xs text-zinc-400">
              Prioritized by deterministic reason codes based on your target segment, offer complexity, and capacity load.
            </p>
          </div>
          <span className="text-xs font-mono text-zinc-500">
            {strategy.channelStrategy.filter(c => c.priority === 'Primary').length} Primary Channels
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {strategy.channelStrategy.map(channel => (
            <div
              key={channel.key}
              className={`p-5 rounded-xl border flex flex-col justify-between transition-all ${
                channel.priority === 'Primary'
                  ? 'bg-zinc-900/80 border-emerald-800/50 shadow-lg shadow-emerald-950/10'
                  : channel.priority === 'Secondary'
                  ? 'bg-zinc-900/50 border-zinc-800'
                  : 'bg-zinc-950/60 border-zinc-800/60 opacity-85'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border font-semibold ${getPriorityBadge(channel.priority)}`}>
                    {channel.priority}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${getEffortBadge(channel.effortLevel)}`}>
                      {channel.effortLevel} Effort
                    </span>
                    <span className="text-[11px] font-mono text-zinc-400">
                      {channel.estimatedWeeklyHours}h/wk
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-zinc-200">
                    {channel.channelName}
                  </h4>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    {channel.rationale}
                  </p>
                </div>

                {/* Deterministic Reason Codes */}
                <div className="space-y-1">
                  <span className="text-[9px] font-mono uppercase text-zinc-500 tracking-wider">
                    Deterministic Reason Codes
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {channel.reasonCodes.map((rc, i) => (
                      <span
                        key={i}
                        className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-300 border border-zinc-700/50"
                      >
                        {rc}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Grounding & First Step */}
                <div className="space-y-1 text-[11px] border-t border-zinc-800/60 pt-2 font-mono">
                  <div className="text-zinc-400">
                    <strong className="text-zinc-300">Why now:</strong> {channel.whyNow}
                  </div>
                  <div className="text-emerald-400/90 pt-1">
                    <strong className="text-emerald-300">First Step:</strong> {channel.firstStep}
                  </div>
                </div>

                {/* Founder Notes if any */}
                {channel.founderEdited && (
                  <div className="bg-zinc-950/80 border border-zinc-800 rounded p-2 text-[10px] text-amber-300/90 font-mono">
                    <strong>Founder Note:</strong> {channel.founderNotes || 'Priority customized by founder.'}
                  </div>
                )}
              </div>

              <div className="pt-4 mt-3 border-t border-zinc-800/60 flex items-center justify-between">
                <span className="text-[10px] font-mono text-zinc-500">
                  {channel.monthlySpendEstimate > 0 ? `€${channel.monthlySpendEstimate}/mo spend` : '€0 spend'}
                </span>
                <button
                  onClick={() => openChannelModal(channel)}
                  className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1 font-medium"
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
            <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-purple-400" />
              <span>GTM Validation Experiments</span>
            </h3>
            <p className="text-xs text-zinc-400">
              Empirical hypotheses with success and stop conditions. Completed runs are preserved immutably as historical evidence.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {strategy.experiments.map(exp => (
            <div
              key={exp.key}
              className="p-5 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase bg-purple-950/60 text-purple-400 border border-purple-800/60 px-2 py-0.5 rounded font-semibold">
                    {exp.timebox}
                  </span>
                  <span className="text-xs font-semibold text-zinc-200">
                    Channel: {exp.channel}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">
                    Cap: €{exp.budgetCap}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleRunHistory(exp.key)}
                    className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1 font-mono"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>{exp.runs?.length || 0} Runs Logged</span>
                    {expandedRuns[exp.key] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                  <button
                    onClick={() => openLogRunModal(exp)}
                    className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium flex items-center gap-1.5 shadow"
                  >
                    <span>Log Completed Run</span>
                  </button>
                </div>
              </div>

              {/* Hypothesis */}
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase text-zinc-500 tracking-wider">
                  Testable Hypothesis
                </span>
                <div className="text-sm font-medium text-zinc-200">
                  {exp.hypothesis}
                </div>
              </div>

              {/* Success / Stop / Metric Conditions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono pt-2 border-t border-zinc-800/60">
                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase block">Primary Metric</span>
                  <span className="text-purple-300">{exp.primaryMetric}</span>
                  <div className="text-[10px] text-zinc-500">
                    Threshold: <strong className="text-zinc-400">{exp.targetStatus}</strong>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-emerald-400 uppercase block">Success Condition</span>
                  <span className="text-zinc-300">{exp.successCondition}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-red-400 uppercase block">Stop Condition</span>
                  <span className="text-zinc-300">{exp.stopCondition}</span>
                </div>
              </div>

              {/* Immutable Historical Runs Accordion */}
              {expandedRuns[exp.key] && (
                <div className="pt-3 border-t border-zinc-800/80 space-y-3">
                  <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Immutable Historical Evidence Log</span>
                  </span>

                  {(!exp.runs || exp.runs.length === 0) ? (
                    <p className="text-xs text-zinc-500 italic">
                      No completed experiment runs recorded yet. Execute the initial test and click &quot;Log Completed Run&quot;.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {exp.runs.map(run => (
                        <div
                          key={run.runId}
                          className="p-3 rounded-lg bg-zinc-950/80 border border-zinc-800 text-xs font-mono space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                              run.outcome === 'Validated'
                                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                                : run.outcome === 'Invalidated'
                                ? 'bg-red-950/60 text-red-400 border-red-800/60'
                                : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                            }`}>
                              Outcome: {run.outcome}
                            </span>
                            <span className="text-[10px] text-zinc-500">
                              Recorded {new Date(run.recordedAt).toLocaleString()}
                            </span>
                          </div>
                          <div className="text-zinc-300 font-sans text-xs">
                            {run.observations}
                          </div>
                          <div className="flex items-center gap-4 text-[10px] text-zinc-500 pt-1">
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
          <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <span>Standardized Measurement Contract</span>
          </h3>
          <p className="text-xs text-zinc-400">
            Stable definitions across Phase 4.7 through Entrepreneur analytics to prevent definition drift.
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/40">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-zinc-950/80 border-b border-zinc-800 text-zinc-400 uppercase text-[10px]">
              <tr>
                <th className="p-3">Stage</th>
                <th className="p-3">Metric Name</th>
                <th className="p-3">Calculation / Formula</th>
                <th className="p-3">Data Source</th>
                <th className="p-3">Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              {strategy.metricsFramework.map(m => (
                <tr key={m.key} className="hover:bg-zinc-800/20">
                  <td className="p-3 text-emerald-400 font-semibold">{m.funnelStage}</td>
                  <td className="p-3 text-zinc-200 font-sans">{m.name}</td>
                  <td className="p-3 text-zinc-400 text-[11px]">{m.numerator} / {m.denominator}</td>
                  <td className="p-3 text-zinc-500">{m.dataSource}</td>
                  <td className="p-3 text-zinc-300">
                    <span className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400">
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
      <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-zinc-100">
              Sequenced Launch Phasing
            </h3>
          </div>
          <span className="text-xs font-mono text-zinc-400">
            Target Launch Window: <strong className="text-zinc-200">{strategy.launchPlan?.primaryLaunchMonth}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {strategy.launchPlan?.phases?.map(p => (
            <div
              key={p.phaseNumber}
              className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded font-semibold">
                  Phase {p.phaseNumber}
                </span>
                <span className="text-[10px] font-mono text-zinc-500">
                  {p.timeframe}
                </span>
              </div>
              <h4 className="text-xs font-semibold text-zinc-200">{p.phaseName}</h4>
              <p className="text-[11px] text-zinc-400">{p.objective}</p>

              <div className="space-y-1 text-[10px] font-mono pt-2 border-t border-zinc-800/60 text-zinc-400">
                <span className="text-emerald-400 uppercase block">Exit Criteria:</span>
                <ul className="list-disc list-inside space-y-0.5">
                  {p.exitCriteria?.map((ec, i) => (
                    <li key={i} className="text-zinc-300">{ec}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3.11 Strict Phase 4.8 Boundary Banner (Disabled) */}
      <div className="mt-12 bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center md:text-left">
          <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 block">
            PHASE 4.8 BOUNDARY · COMING NEXT
          </span>
          <h4 className="text-sm font-semibold text-zinc-200">Launch Assets & Execution Collateral</h4>
          <p className="text-xs text-zinc-400 max-w-xl">
            Copywriting, landing page wireframes, sales deck scripts, email outreach templates, and brand collateral belong to Phase 4.8 once GTM strategy is sequenced.
          </p>
        </div>
        <button
          disabled
          className="px-4 py-2.5 rounded-lg bg-zinc-800/60 text-zinc-500 border border-zinc-700/50 text-xs font-medium cursor-not-allowed shrink-0 flex items-center gap-2"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Generate Launch Assets (Phase 4.8 Coming Next)</span>
        </button>
      </div>

      {/* 4. MODAL: Adjust Channel Priority */}
      {editingChannel && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                  Founder Override
                </span>
                <h3 className="text-base font-bold text-zinc-100">
                  {editingChannel.channelName}
                </h3>
              </div>
              <button
                onClick={() => setEditingChannel(null)}
                className="text-zinc-400 hover:text-zinc-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveChannel} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">
                  Select Channel Priority
                </label>
                <select
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value as ChannelPriority)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Primary">Primary (Immediate Focus)</option>
                  <option value="Secondary">Secondary (Supporting Motion)</option>
                  <option value="Later">Later (Post-Validation)</option>
                  <option value="NotRecommended">Not Recommended (Deferred)</option>
                </select>
                <p className="text-[10px] text-zinc-500">
                  Recommended by engine: <strong className="text-zinc-300">{editingChannel.recommendedPriority}</strong>
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">
                  Founder Strategic Rationale
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Delaying outreach until CRM is configured..."
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingChannel(null)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingChannel}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 text-white text-xs font-semibold flex items-center gap-2"
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-purple-400 font-semibold">
                  Record Historical Evidence
                </span>
                <h3 className="text-base font-bold text-zinc-100">
                  Log Experiment Run
                </h3>
              </div>
              <button
                onClick={() => setLoggingExperiment(null)}
                className="text-zinc-400 hover:text-zinc-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRun} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">
                    Actual Spend (€)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={runSpend}
                    onChange={(e) => setRunSpend(parseFloat(e.target.value) || 0)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">
                    Actual Effort (Hours/Days)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 5 hours"
                    value={runEffort}
                    onChange={(e) => setRunEffort(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">
                  Empirical Outcome
                </label>
                <select
                  value={runOutcome}
                  onChange={(e) => setRunOutcome(e.target.value as ExperimentRunOutcome)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-purple-500"
                >
                  <option value="Validated">Validated (Met success condition)</option>
                  <option value="Invalidated">Invalidated (Triggered stop condition)</option>
                  <option value="Inconclusive">Inconclusive (Needs more observations)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">
                  Empirical Observations & Findings
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Record qualitative customer quotes, conversion counts, objections, or conversion obstacles observed..."
                  value={runObservations}
                  onChange={(e) => setRunObservations(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setLoggingExperiment(null)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoggingRun}
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-800 text-white text-xs font-semibold flex items-center gap-2"
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
