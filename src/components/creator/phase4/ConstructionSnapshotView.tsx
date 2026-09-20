'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ConstructionSnapshot, 
  ConstructionSnapshotItem, 
  ConstructionStatus, 
  ConstructionPriority 
} from '@/types/creator/phase4';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  HelpCircle, 
  XCircle, 
  RefreshCw, 
  ArrowRight, 
  ShieldAlert,
  Info,
  ExternalLink,
  ChevronRight,
  Layers
} from 'lucide-react';

interface ConstructionSnapshotViewProps {
  ideaId?: string;
  projectName?: string;
  snapshot: ConstructionSnapshot | null;
  updateAvailable: boolean;
  changedSources: string[];
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
  onGenerate: () => Promise<void>;
  onRefresh: () => Promise<void>;
  onDismissStale?: () => void;
}

export function ConstructionSnapshotView({
  ideaId = '',
  projectName = 'Your Project',
  snapshot,
  updateAvailable,
  changedSources,
  isLoading,
  isGenerating,
  error,
  onGenerate,
  onRefresh,
  onDismissStale,
}: ConstructionSnapshotViewProps) {
  const [staleDismissed, setStaleDismissed] = useState(false);

  // 1. Loading State
  if (isLoading || isGenerating) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center p-8 text-center bg-slate-900/40 border border-slate-800 rounded-2xl">
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
          <Layers className="w-6 h-6 text-emerald-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">
          Building your construction snapshot…
        </h3>
        <p className="text-slate-400 max-w-md text-sm">
          MBC is combining your business plan, project data and professional profile.
        </p>
      </div>
    );
  }

  // 2. Error State
  if (error && !snapshot) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center bg-rose-950/20 border border-rose-800/40 rounded-2xl">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-400 mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">
          We couldn't build your construction snapshot.
        </h3>
        <p className="text-slate-400 max-w-md text-sm mb-6">
          Your existing project data is safe. ({error})
        </p>
        <button
          onClick={onGenerate}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition-colors inline-flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    );
  }

  // 3. Empty State
  if (!snapshot) {
    return (
      <div className="min-h-[450px] flex flex-col items-center justify-center p-12 text-center bg-gradient-to-b from-slate-900/60 to-slate-950/80 border border-slate-800 rounded-2xl">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6 shadow-inner">
          <Layers className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">
          Your construction snapshot is ready to be generated.
        </h2>
        <p className="text-slate-400 max-w-lg text-sm leading-relaxed mb-8">
          MBC analyzes your Phase 2 branding, Phase 3 business intelligence, and HumainX professional profile to diagnose what is ready, what is partial, and what requires attention before building.
        </p>
        <button
          onClick={onGenerate}
          className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-emerald-950/40 hover:scale-[1.02] flex items-center gap-2"
        >
          Generate My Snapshot
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Group items canonically
  const criticalItems = snapshot.criticalItems || [];
  const readyItems = snapshot.readyItems || [];
  const partialItems = snapshot.partialItems || [];
  const missingItems = snapshot.missingItems || [];
  const optionalItems = snapshot.optionalItems || [];

  const readyCount = readyItems.length;
  const partialCount = partialItems.length;
  const missingCount = missingItems.length;
  const criticalCount = criticalItems.length;

  return (
    <div className="space-y-8 font-sans">
      {/* Stale State Banner */}
      {updateAvailable && !staleDismissed && (
        <div className="p-5 rounded-2xl bg-amber-950/30 border border-amber-500/40 shadow-lg text-amber-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-white text-base">Update Available</div>
              <p className="text-sm text-amber-300/80">
                New project or profile information may affect this snapshot.
              </p>
              {changedSources && changedSources.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1.5 items-center text-xs text-amber-200/70">
                  <span className="font-medium">Changed:</span>
                  {changedSources.map((source) => (
                    <span key={source} className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20">
                      • {source}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
            <button
              onClick={() => {
                setStaleDismissed(true);
                onDismissStale?.();
              }}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 rounded-xl transition-colors border border-slate-700/60"
            >
              Keep Current Version
            </button>
            <button
              onClick={onRefresh}
              className="px-4 py-2 text-xs font-medium text-amber-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm font-semibold"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh Snapshot
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 shadow-xl relative overflow-hidden backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-widest font-semibold text-emerald-400">
              {projectName}
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Construction Snapshot
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              {snapshot.overallSummary || 'A structured diagnostic of readiness, capabilities, and dependencies across your venture.'}
            </p>
          </div>

          {/* Counts Matrix (No percentage!) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
            <div className="px-4 py-3 rounded-2xl bg-rose-950/20 border border-rose-500/30 text-center">
              <div className="text-2xl font-bold text-rose-400">{criticalCount}</div>
              <div className="text-xs font-medium text-rose-300/80 uppercase tracking-wider">Critical</div>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 text-center">
              <div className="text-2xl font-bold text-emerald-400">{readyCount}</div>
              <div className="text-xs font-medium text-emerald-300/80 uppercase tracking-wider">Ready</div>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-center">
              <div className="text-2xl font-bold text-amber-400">{partialCount}</div>
              <div className="text-xs font-medium text-amber-300/80 uppercase tracking-wider">Partial</div>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-slate-800/40 border border-slate-700/50 text-center">
              <div className="text-2xl font-bold text-slate-300">{missingCount}</div>
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Missing</div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Level UI Groups - Exact Canon Order:
          1. Critical Attention
          2. Ready
          3. Partially Ready (includes Partial and NeedsReview with visible badge)
          4. Missing
          5. Optional
      */}
      <div className="space-y-10">
        {/* 1. Critical Attention */}
        {criticalItems.length > 0 && (
          <SectionGroup
            title="Critical Attention"
            badgeText={`${criticalItems.length} Blocking`}
            badgeColor="rose"
            description="Items that materially block execution before build or launch."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {criticalItems.map((item) => (
                <ItemCard key={item.key} item={item} />
              ))}
            </div>
          </SectionGroup>
        )}

        {/* 2. Ready */}
        {readyItems.length > 0 && (
          <SectionGroup
            title="Ready"
            badgeText={`${readyItems.length} Confirmed`}
            badgeColor="emerald"
            description="Capabilities and foundation assets ready for execution."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {readyItems.map((item) => (
                <ItemCard key={item.key} item={item} />
              ))}
            </div>
          </SectionGroup>
        )}

        {/* 3. Partially Ready (includes NeedsReview) */}
        {partialItems.length > 0 && (
          <SectionGroup
            title="Partially Ready"
            badgeText={`${partialItems.length} In Progress & Review`}
            badgeColor="amber"
            description="Areas with initial structure that require further proficiency confirmation or detail."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {partialItems.map((item) => (
                <ItemCard key={item.key} item={item} />
              ))}
            </div>
          </SectionGroup>
        )}

        {/* 4. Missing */}
        {missingItems.length > 0 && (
          <SectionGroup
            title="Missing"
            badgeText={`${missingItems.length} Identified Gaps`}
            badgeColor="slate"
            description="Expected components or capabilities not currently found in project intelligence or profile."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {missingItems.map((item) => (
                <ItemCard key={item.key} item={item} />
              ))}
            </div>
          </SectionGroup>
        )}

        {/* 5. Optional */}
        {optionalItems.length > 0 && (
          <SectionGroup
            title="Optional"
            badgeText={`${optionalItems.length} Secondary`}
            badgeColor="blue"
            description="Enhancements and secondary resources that can be addressed after initial construction."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {optionalItems.map((item) => (
                <ItemCard key={item.key} item={item} />
              ))}
            </div>
          </SectionGroup>
        )}
      </div>

      {/* Next CTA: Build My Roadmap (Phase 4.2 Activated) */}
      <div className="p-8 rounded-3xl bg-slate-900/40 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <div className="text-xs uppercase tracking-wider font-semibold text-slate-500">Next Step</div>
          <h3 className="text-lg font-semibold text-white">Phase 4.2 · Operational Roadmap</h3>
          <p className="text-sm text-slate-400 mt-1">
            Turn your construction diagnostic into an ordered timeline with work streams and dependency gates.
          </p>
        </div>

        <Link
          href={`/dashboard/creator/phase-4/roadmap?ideaId=${encodeURIComponent(ideaId)}`}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-indigo-950/40 hover:scale-[1.02] flex items-center gap-2 shrink-0"
        >
          <span>Build My Roadmap</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

function SectionGroup({
  title,
  badgeText,
  badgeColor,
  description,
  children,
}: {
  title: string;
  badgeText: string;
  badgeColor: 'rose' | 'emerald' | 'amber' | 'slate' | 'blue';
  description: string;
  children: React.ReactNode;
}) {
  const colorStyles = {
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    slate: 'bg-slate-700/30 text-slate-300 border-slate-600/40',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 pb-2 border-b border-slate-800/80">
        <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
        <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${colorStyles[badgeColor]}`}>
          {badgeText}
        </span>
      </div>
      <p className="text-xs text-slate-400 -mt-2">{description}</p>
      {children}
    </div>
  );
}

function ItemCard({ item }: { item: ConstructionSnapshotItem }) {
  const isBlocking = item.blocking;
  const isNeedsReview = item.status === 'NeedsReview';

  return (
    <div 
      className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
        isBlocking
          ? 'bg-rose-950/10 border-rose-500/30 hover:border-rose-500/50'
          : isNeedsReview
          ? 'bg-amber-950/10 border-amber-500/30 hover:border-amber-500/50'
          : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700'
      }`}
    >
      <div className="space-y-3">
        {/* Header: Status, Category, Priority */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <StatusBadge status={item.status} />
            <span className="text-xs text-slate-400 font-medium">
              {item.category}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {isBlocking && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                Blocking
              </span>
            )}
            <PriorityBadge priority={item.priority} />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold text-white tracking-tight">
          {item.title}
        </h3>

        {/* Reason */}
        <p className="text-sm text-slate-300 leading-relaxed">
          {item.reason}
        </p>
      </div>

      {/* Footer: Sources & Recommended Next Step */}
      <div className="mt-4 pt-3.5 border-t border-slate-800/60 space-y-2.5">
        {/* Sources */}
        {item.source && item.source.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
            <span className="text-slate-500 text-[11px]">Sources:</span>
            {item.source.map((src, idx) => (
              <span 
                key={idx} 
                className="px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/60 text-[11px] text-slate-300"
              >
                {src}
              </span>
            ))}
          </div>
        )}

        {/* Recommended Next Step */}
        {item.recommendedNextStep && (
          <div className="text-xs text-slate-400 flex items-start gap-1.5 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60">
            <span className="font-semibold text-emerald-400 shrink-0">Next:</span>
            <span className="leading-normal">{item.recommendedNextStep}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: ConstructionStatus }) {
  switch (status) {
    case 'Ready':
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
          <CheckCircle2 className="w-3 h-3" />
          Ready
        </span>
      );
    case 'NeedsReview':
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/30 font-semibold">
          <HelpCircle className="w-3 h-3" />
          Needs Review
        </span>
      );
    case 'Partial':
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
          <Clock className="w-3 h-3" />
          Partial
        </span>
      );
    case 'Critical':
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/30 font-semibold">
          <AlertTriangle className="w-3 h-3" />
          Critical
        </span>
      );
    case 'Missing':
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700/60 font-medium">
          <XCircle className="w-3 h-3" />
          Missing
        </span>
      );
    case 'Optional':
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
          <Info className="w-3 h-3" />
          Optional
        </span>
      );
    default:
      return null;
  }
}

function PriorityBadge({ priority }: { priority: ConstructionPriority }) {
  const styles: Record<ConstructionPriority, string> = {
    Critical: 'text-rose-400',
    High: 'text-amber-400',
    Medium: 'text-slate-300',
    Low: 'text-slate-400',
    Optional: 'text-slate-500',
  };

  return (
    <span className={`text-[11px] font-medium ${styles[priority] || 'text-slate-400'}`}>
      {priority}
    </span>
  );
}
