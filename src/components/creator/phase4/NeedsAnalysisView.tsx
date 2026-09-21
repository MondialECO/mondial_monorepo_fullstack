'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Layers,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Sparkles,
  ChevronRight,
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
  Edit3,
  BookOpen,
  Info,
  ExternalLink,
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
  gateError?: { code: string; message: string } | null;
  onGenerate: () => Promise<void>;
  onRefresh: () => Promise<void>;
  onUpdateNeedState: (needKey: string, req: UpdateNeedStateRequest) => Promise<void>;
}

const TIMING_LABELS: Record<NeedTiming, string> = {
  Now: 'Immediate / Now',
  Next30Days: 'Next 30 Days',
  Days30To60: '30–60 Days',
  Days60To90: '60–90 Days',
  BeforeLaunch: 'Before Launch',
  PostLaunch: 'Post-Launch',
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Team: <Users className="w-4 h-4 text-sky-400" />,
  Services: <Briefcase className="w-4 h-4 text-indigo-400" />,
  Technology: <Cpu className="w-4 h-4 text-cyan-400" />,
  Finance: <DollarSign className="w-4 h-4 text-emerald-400" />,
  LegalAdmin: <Scale className="w-4 h-4 text-amber-400" />,
  Marketing: <Megaphone className="w-4 h-4 text-purple-400" />,
  Sales: <Compass className="w-4 h-4 text-pink-400" />,
  Operations: <Layers className="w-4 h-4 text-blue-400" />,
  Training: <BookOpen className="w-4 h-4 text-orange-400" />,
  Infrastructure: <Cpu className="w-4 h-4 text-teal-400" />,
};

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
  gateError,
  onGenerate,
  onRefresh,
  onUpdateNeedState,
}: NeedsAnalysisViewProps) {
  const [staleDismissed, setStaleDismissed] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [showCovered, setShowCovered] = useState(false);
  const [updatingNeedKey, setUpdatingNeedKey] = useState<string | null>(null);

  const handleFounderStateChange = async (needKey: string, state: NeedFounderState) => {
    try {
      setUpdatingNeedKey(needKey);
      await onUpdateNeedState(needKey, { founderState: state });
    } finally {
      setUpdatingNeedKey(null);
    }
  };

  const handleNotesSave = async (needKey: string, notes: string) => {
    try {
      setUpdatingNeedKey(needKey);
      await onUpdateNeedState(needKey, { notes });
    } finally {
      setUpdatingNeedKey(null);
    }
  };

  // 1. Gate Error State (Structured prerequisite errors)
  if (gateError) {
    const isSnapshotStale = gateError.code === 'SNAPSHOT_REFRESH_REQUIRED';
    const isRoadmapStale = gateError.code === 'ROADMAP_REFRESH_REQUIRED';

    return (
      <div className="p-10 rounded-3xl bg-slate-900/60 border border-amber-500/30 text-center flex flex-col items-center justify-center min-h-[440px] max-w-2xl mx-auto shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-6">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-300 mb-3 uppercase tracking-wider">
          Prerequisite Refresh Required
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">
          {isSnapshotStale
            ? 'Construction Snapshot Refresh Required'
            : isRoadmapStale
            ? 'Operational Roadmap Refresh Required'
            : 'Prerequisites Not Completed'}
        </h2>
        <p className="text-slate-300 text-sm leading-relaxed mb-8 max-w-md">
          {gateError.message}
        </p>
        <div className="flex items-center gap-4 flex-wrap justify-center">
          {isSnapshotStale && (
            <Link
              href={`/dashboard/creator/phase-4/snapshot?ideaId=${encodeURIComponent(ideaId)}`}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-xl transition-all shadow-lg flex items-center gap-2"
            >
              <span>Refresh Snapshot</span>
              <ExternalLink className="w-4 h-4" />
            </Link>
          )}
          {isRoadmapStale && (
            <Link
              href={`/dashboard/creator/phase-4/roadmap?ideaId=${encodeURIComponent(ideaId)}`}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all shadow-lg flex items-center gap-2"
            >
              <span>Refresh Roadmap</span>
              <ExternalLink className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>
    );
  }

  // 2. Empty State
  if (!analysis && !isLoading) {
    return (
      <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800 text-center flex flex-col items-center justify-center min-h-[460px]">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6">
          <Layers className="w-8 h-8" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-300 mb-3 uppercase tracking-wider">
          Phase 4.3 · Needs Engine
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">
          Your project needs have not been analyzed yet.
        </h2>
        <p className="text-slate-400 max-w-lg text-sm leading-relaxed mb-8">
          MBC will cross-reference your Construction Snapshot, Operational Roadmap, Phase 3 specifications, and founder profile to define exactly what capabilities, services, and capital are required.
        </p>
        <button
          onClick={onGenerate}
          className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-indigo-950/40 hover:scale-[1.02] flex items-center gap-2"
        >
          <span>Generate Needs Analysis</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // 3. Loading State
  if (isLoading && !analysis) {
    return (
      <div className="p-16 rounded-3xl bg-slate-900/30 border border-slate-800/80 text-center flex flex-col items-center justify-center min-h-[460px]">
        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6 animate-pulse">
          <RefreshCw className="w-7 h-7 animate-spin" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Analyzing requirements & capabilities…</h3>
        <p className="text-slate-400 text-sm max-w-md">
          Cross-checking construction gaps with your founder profile to prevent false-positive needs.
        </p>
      </div>
    );
  }

  if (!analysis) return null;

  const activeNeeds = analysis.activeNeeds || [];
  const coveredRequirements = analysis.coveredRequirements || [];

  // Filter categories
  const categories = ['ALL', ...Array.from(new Set(activeNeeds.map((n) => n.category)))];
  const filteredActiveNeeds =
    selectedCategory === 'ALL'
      ? activeNeeds
      : activeNeeds.filter((n) => n.category === selectedCategory);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between text-xs text-slate-400 font-medium pb-2 border-b border-slate-800/60">
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/creator/phase-4/roadmap?ideaId=${encodeURIComponent(ideaId)}`}
            className="hover:text-slate-200 transition"
          >
            Phase 4.2 · Roadmap
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-indigo-400 font-semibold">Phase 4.3 · Needs & Requirements</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 text-xs font-medium border border-slate-700/60 flex items-center gap-1.5 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Re-evaluate Needs</span>
          </button>
        </div>
      </div>

      {/* Upstream Stale Warning Banner */}
      {updateAvailable && !staleDismissed && (
        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-amber-300">
                Upstream Changes Detected
              </div>
              <p className="text-xs text-amber-200/80 mt-0.5 leading-relaxed">
                Modifications in{' '}
                <span className="font-semibold text-amber-200">
                  {changedSources.length > 0 ? changedSources.join(', ') : 'Snapshot or Roadmap'}
                </span>{' '}
                may affect your required capabilities and resources.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              onClick={() => setStaleDismissed(true)}
              className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
            >
              Keep Current
            </button>
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold shadow transition flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Needs</span>
            </button>
          </div>
        </div>
      )}

      {/* Hero Header & Summary */}
      <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800/90 relative overflow-hidden backdrop-blur-sm shadow-xl">
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-indigo-400">
            <Sparkles className="w-4 h-4" />
            <span>Phase 4.3 · Needs & Requirements Engine</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">
                {projectName || 'Project Requirements'}
              </h1>
              <p className="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
                {analysis.summary ||
                  'Structured inventory of operational requirements derived from construction gaps and sequenced execution tasks.'}
              </p>
            </div>

            {/* Metric Pills (No percentages) */}
            <div className="flex items-center gap-2 flex-wrap">
              {criticalCount > 0 && (
                <div className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                  <span className="text-xs font-bold text-rose-300">
                    {criticalCount} Critical
                  </span>
                </div>
              )}
              {highCount > 0 && (
                <div className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-xs font-bold text-amber-300">
                    {highCount} High Priority
                  </span>
                </div>
              )}
              <div className="px-3.5 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-300">
                  {totalActiveNeeds} Active Needs
                </span>
              </div>
              <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-bold text-emerald-300">
                  {satisfiedCount} Already Covered
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-800/60">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
              selectedCategory === cat
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/40'
                : 'bg-slate-900/60 hover:bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {cat !== 'ALL' && CATEGORY_ICONS[cat]}
            <span>{cat === 'ALL' ? 'All Requirements' : cat}</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                selectedCategory === cat ? 'bg-indigo-700 text-indigo-200' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {cat === 'ALL' ? activeNeeds.length : activeNeeds.filter((n) => n.category === cat).length}
            </span>
          </button>
        ))}
      </div>

      {/* Active Needs Cards Grid */}
      <div className="space-y-4">
        {filteredActiveNeeds.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900/30 border border-slate-800 text-slate-400 text-sm">
            No active requirements in this category.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredActiveNeeds.map((need) => (
              <NeedCard
                key={need.key}
                need={need}
                onUpdateFounderState={handleFounderStateChange}
                onSaveNotes={handleNotesSave}
                isUpdating={updatingNeedKey === need.key}
              />
            ))}
          </div>
        )}
      </div>

      {/* Collapsible "Already Covered" Section */}
      {coveredRequirements.length > 0 && (
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/30 overflow-hidden">
          <button
            onClick={() => setShowCovered(!showCovered)}
            className="w-full p-5 flex items-center justify-between hover:bg-slate-800/30 transition text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Already Covered Capabilities</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                    {coveredRequirements.length}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Requirements verified as satisfied by your profile, founding team, or Phase 3 progress.
                </p>
              </div>
            </div>
            <div className="text-slate-400">
              {showCovered ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </div>
          </button>

          {showCovered && (
            <div className="p-5 pt-0 border-t border-slate-800/60 grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              {coveredRequirements.map((need) => (
                <div
                  key={need.key}
                  className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60 flex items-start gap-3"
                >
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold text-slate-200">{need.title}</div>
                    <div className="text-[11px] text-slate-400 mt-1 leading-relaxed">{need.whyNeeded}</div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                        Satisfied
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Source: {need.source.join(', ')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Phase 4.4 Boundary Gate */}
      <div className="p-8 rounded-3xl bg-slate-900/40 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <div className="text-xs uppercase tracking-wider font-semibold text-slate-500">
            Next Step in MBC Journey
          </div>
          <h3 className="text-lg font-semibold text-white mt-0.5">
            Phase 4.4 · Skills & Execution Engine
          </h3>
          <p className="text-sm text-slate-400 mt-1 max-w-xl">
            Decide whether to Learn, Delegate, or Verify each requirement. MBC will match specialized learning resources and verified Service Providers.
          </p>
        </div>

        <Link
          href={`/dashboard/creator/phase-4/skills?ideaId=${encodeURIComponent(ideaId)}`}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl shadow-lg hover:shadow-emerald-900/30 flex items-center gap-2 shrink-0 transition-colors"
        >
          <span>Build My Skills Plan</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

function NeedCard({
  need,
  onUpdateFounderState,
  onSaveNotes,
  isUpdating,
}: {
  need: CreatorNeed;
  onUpdateFounderState: (needKey: string, state: NeedFounderState) => Promise<void>;
  onSaveNotes: (needKey: string, notes: string) => Promise<void>;
  isUpdating: boolean;
}) {
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [noteText, setNoteText] = useState(need.notes || '');

  const priorityColors: Record<NeedPriority, string> = {
    Critical: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
    High: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    Medium: 'text-slate-300 bg-slate-800/80 border-slate-700/60',
    Low: 'text-slate-400 bg-slate-800/40 border-slate-800',
  };

  const handleNoteSubmit = async () => {
    await onSaveNotes(need.key, noteText);
    setIsEditingNotes(false);
  };

  return (
    <div
      className={`p-6 rounded-2xl border transition-all flex flex-col justify-between ${
        need.blocking
          ? 'bg-slate-900/60 border-rose-500/30 hover:border-rose-500/50'
          : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
      }`}
    >
      <div className="space-y-4">
        {/* Header: Category, Priority, Blocking */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60">
              {CATEGORY_ICONS[need.category] || <Layers className="w-3.5 h-3.5" />}
            </span>
            <span className="text-xs font-semibold text-slate-300">{need.category}</span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-400">{need.requirementType}</span>
          </div>

          <div className="flex items-center gap-2">
            {need.blocking && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                Blocking
              </span>
            )}
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                priorityColors[need.priority] || priorityColors.Medium
              }`}
            >
              {need.priority}
            </span>
          </div>
        </div>

        {/* Title & Description */}
        <div>
          <h3 className="text-base font-bold text-white leading-snug">{need.title}</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">{need.description}</p>
        </div>

        {/* Why Needed Rationale */}
        <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 text-xs text-slate-300 leading-relaxed">
          <span className="font-semibold text-indigo-400 mr-1.5">Why Needed:</span>
          {need.whyNeeded}
        </div>

        {/* Metadata Badges: Timing & Budget */}
        <div className="flex items-center gap-3 flex-wrap text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-medium text-slate-300">
              {need.customTiming || TIMING_LABELS[need.timing] || need.timing}
            </span>
          </div>

          {need.estimatedBudget !== undefined && need.estimatedBudget !== null && (
            <div className="flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-semibold text-emerald-300">
                €{need.estimatedBudget.toLocaleString()}
              </span>
              {need.budgetConfidence && (
                <span className="text-[10px] text-slate-400 font-normal">
                  ({need.budgetConfidence})
                </span>
              )}
            </div>
          )}

          {need.source && need.source.length > 0 && (
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <span>Source:</span>
              <span className="text-slate-300">{need.source.join(', ')}</span>
            </div>
          )}
        </div>

        {/* Notes display */}
        {need.notes && !isEditingNotes && (
          <div className="text-xs text-slate-300 bg-slate-800/40 p-2.5 rounded-lg border border-slate-800 flex items-start justify-between gap-2">
            <span>
              <strong className="text-slate-400 mr-1">Founder Note:</strong>
              {need.notes}
            </span>
            <button
              onClick={() => setIsEditingNotes(true)}
              className="text-slate-500 hover:text-slate-300 p-0.5"
            >
              <Edit3 className="w-3 h-3" />
            </button>
          </div>
        )}

        {isEditingNotes && (
          <div className="space-y-2">
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add personal execution notes or constraints..."
              className="w-full text-xs p-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              rows={2}
            />
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => setIsEditingNotes(false)}
                className="px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleNoteSubmit}
                disabled={isUpdating}
                className="px-3 py-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-md shadow"
              >
                Save Note
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer: Founder State Control */}
      <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 font-medium">Founder State:</span>
          <select
            value={need.founderState}
            onChange={(e) => onUpdateFounderState(need.key, e.target.value as NeedFounderState)}
            disabled={isUpdating}
            className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 font-medium focus:outline-none focus:border-indigo-500 disabled:opacity-50 cursor-pointer"
          >
            <option value="Unreviewed">Unreviewed</option>
            <option value="Confirmed">Confirmed</option>
            <option value="InProgress">In Progress</option>
            <option value="Deferred">Deferred</option>
            <option value="ClaimedSatisfied">Claimed Satisfied</option>
          </select>
        </div>

        {!need.notes && !isEditingNotes && (
          <button
            onClick={() => setIsEditingNotes(true)}
            className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 transition"
          >
            <Edit3 className="w-3 h-3" />
            <span>Add Note</span>
          </button>
        )}
      </div>
    </div>
  );
}
