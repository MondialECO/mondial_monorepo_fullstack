'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  RefreshCw,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Edit3,
  Check,
  BookOpen,
  Briefcase,
  AlertTriangle,
  Info,
  Layers,
  Lock,
  ExternalLink,
} from 'lucide-react';
import type {
  SkillsPlan,
  CapabilityResolution,
  CoveredCapability,
  ResolutionMode,
  FounderProfileSummaryDto,
  UpdateResolutionRequest,
} from '@/types/creator/skills';

interface SkillsPlanViewProps {
  ideaId: string;
  projectName: string;
  plan: SkillsPlan | null;
  updateAvailable: boolean;
  changedSources: string[];
  profileSummary?: FounderProfileSummaryDto;
  isLoading: boolean;
  gateError?: { code: string; message: string } | null;
  onGenerate: () => Promise<void>;
  onRefresh: () => Promise<void>;
  onUpdateResolution: (resolutionKey: string, req: UpdateResolutionRequest) => Promise<void>;
}

type FilterTab = 'ALL' | 'LEARN' | 'DELEGATE' | 'VERIFY' | 'COVERED' | 'NEEDS_REVIEW';

export function SkillsPlanView({
  ideaId,
  projectName,
  plan,
  updateAvailable,
  changedSources,
  profileSummary,
  isLoading,
  gateError,
  onGenerate,
  onRefresh,
  onUpdateResolution,
}: SkillsPlanViewProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  const [editingResolutionKey, setEditingResolutionKey] = useState<string | null>(null);
  const [selectedDecision, setSelectedDecision] = useState<string>('');
  const [notesInput, setNotesInput] = useState<string>('');
  const [isSubmittingOverride, setIsSubmittingOverride] = useState<boolean>(false);
  const [expandedLearnCardKey, setExpandedLearnCardKey] = useState<string | null>(null);

  // Gate blocked state
  if (gateError) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="bg-red-950/40 border border-red-800/60 rounded-xl p-8 text-center space-y-4 shadow-xl">
          <div className="inline-flex p-3 rounded-full bg-red-900/40 border border-red-700/60 text-red-300">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-semibold text-red-200">Skills Plan Unavailable</h2>
          <p className="text-zinc-400 max-w-lg mx-auto text-sm leading-relaxed">
            {gateError.message}
          </p>
          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            {gateError.code === 'NEEDS_REFRESH_REQUIRED' || gateError.code === 'NEEDS_NOT_GENERATED' ? (
              <Link
                href={`/dashboard/creator/phase-4/needs?ideaId=${ideaId}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-colors shadow-lg"
              >
                Go to Step 4.3 Needs Analysis
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                href={`/dashboard/creator/phase-3?ideaId=${ideaId}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-sm transition-colors"
              >
                Review Prior Steps
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Not generated yet state
  if (!plan) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <div className="text-center space-y-3 pt-6">
          <span className="text-xs uppercase tracking-widest text-emerald-400 font-mono font-medium">
            STEP 4.4 · SKILLS & TRAINING
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-white font-serif">
            Learn · Delegate · Verify Engine
          </h1>
          <p className="text-zinc-400 max-w-xl mx-auto text-sm leading-relaxed">
            Determines the optimal resolution path for every capability requirement for{' '}
            <span className="text-zinc-200 font-semibold">{projectName}</span> — balancing your skills,
            weekly availability, and statutory compliance.
          </p>
        </div>

        {profileSummary && (
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono">
              YOUR PROFILE CONTEXT (FROM HUMAINX)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-3">
                <span className="text-xs text-zinc-500 block mb-1">Weekly Availability</span>
                <span className="text-sm font-medium text-zinc-200">
                  {profileSummary.weeklyAvailability || 'Not specified'}
                </span>
              </div>
              <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-3">
                <span className="text-xs text-zinc-500 block mb-1">Learning Approach</span>
                <span className="text-sm font-medium text-zinc-200">
                  {profileSummary.learningPreference || 'Balanced'}
                </span>
              </div>
              <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-3">
                <span className="text-xs text-zinc-500 block mb-1">Declared Top Skills</span>
                <span className="text-sm font-medium text-zinc-200">
                  {profileSummary.topSkills?.length ? profileSummary.topSkills.join(', ') : 'None declared'}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-8 text-center space-y-6">
          <div className="inline-flex p-4 rounded-full bg-emerald-950/60 border border-emerald-800/50 text-emerald-400">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-zinc-200">Ready to Build Your Skills Plan</h3>
            <p className="text-zinc-400 text-sm max-w-md mx-auto">
              Our deterministic capability resolution engine will evaluate each unresolved requirement from Step 4.3
              against your HumainX profile and statutory legal requirements.
            </p>
          </div>
          <button
            onClick={onGenerate}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium text-sm transition-all shadow-lg hover:shadow-emerald-900/30"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Resolving Capabilities...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Build My Skills Plan
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  const { summary, resolutions, coveredCapabilities } = plan;
  const activeProfile = profileSummary || plan.founderProfileSummary;

  // Filter resolutions according to active tab
  const filteredResolutions = resolutions.filter((r) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'LEARN') return r.resolutionMode === 'LEARN';
    if (activeTab === 'DELEGATE') return r.resolutionMode === 'DELEGATE';
    if (activeTab === 'VERIFY') return r.resolutionMode === 'VERIFY';
    if (activeTab === 'COVERED') return r.resolutionMode === 'COVERED';
    if (activeTab === 'NEEDS_REVIEW') return r.resolutionMode === 'NEEDS_REVIEW';
    return true;
  });

  const handleOpenOverride = (resolution: CapabilityResolution) => {
    setEditingResolutionKey(resolution.key);
    setSelectedDecision(resolution.founderDecision || '');
    setNotesInput(resolution.founderNotes || '');
  };

  const handleSaveOverride = async (resolutionKey: string) => {
    setIsSubmittingOverride(true);
    try {
      await onUpdateResolution(resolutionKey, {
        founderDecision: selectedDecision || undefined,
        founderNotes: notesInput || undefined,
      });
      setEditingResolutionKey(null);
    } finally {
      setIsSubmittingOverride(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header & Breadcrumb */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
          <Link href={`/dashboard/creator/phase-4?ideaId=${ideaId}`} className="hover:text-zinc-300">
            Phase 4
          </Link>
          <ChevronRight className="w-3 h-3" />
          <Link href={`/dashboard/creator/phase-4/needs?ideaId=${ideaId}`} className="hover:text-zinc-300">
            Needs & Requirements
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-emerald-400 font-medium">Skills & Training</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span className="text-xs uppercase tracking-widest text-emerald-400 font-mono font-medium">
              STEP 4.4 · SKILLS & TRAINING
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-white font-serif mt-1">
              Learn · Delegate · Verify Engine
            </h1>
            <p className="text-zinc-400 text-sm mt-1">
              Project: <span className="text-zinc-200 font-medium">{projectName}</span> · Tailored capability resolutions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                updateAvailable
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg animate-pulse'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              {updateAvailable ? 'Refresh Skills Plan' : 'Refresh Plan'}
            </button>
          </div>
        </div>
      </div>

      {/* Staleness Warning Banner */}
      {updateAvailable && (
        <div className="bg-amber-950/40 border border-amber-800/60 rounded-xl p-4 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-amber-200">Upstream Context Changed</h4>
              <p className="text-xs text-amber-300/80 leading-relaxed">
                Inputs from{' '}
                <span className="font-mono text-amber-200">
                  {changedSources.length ? changedSources.join(', ') : 'Profile / Needs'}
                </span>{' '}
                have updated since this plan was generated. Refreshing will update recommendations while preserving your
                existing choices.
              </p>
            </div>
          </div>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium shrink-0 transition-colors"
          >
            Refresh Now
          </button>
        </div>
      )}

      {/* Hero Resolution Metrics (No percentage as required) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-zinc-900/80 border border-emerald-900/40 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-medium">Learn</span>
            <GraduationCap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-300 font-mono">{summary.learnCount}</div>
          <span className="text-[11px] text-zinc-500 block">Founder learning</span>
        </div>

        <div className="bg-zinc-900/80 border border-indigo-900/40 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-medium">Delegate</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-indigo-300 font-mono">{summary.delegateCount}</div>
          <span className="text-[11px] text-zinc-500 block">External specialists</span>
        </div>

        <div className="bg-zinc-900/80 border border-amber-900/40 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-medium">Verify</span>
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-300 font-mono">{summary.verifyCount}</div>
          <span className="text-[11px] text-zinc-500 block">Professional review</span>
        </div>

        <div className="bg-zinc-900/80 border border-sky-900/40 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-medium">Covered</span>
            <CheckCircle2 className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-sky-300 font-mono">{summary.coveredCount}</div>
          <span className="text-[11px] text-zinc-500 block">Existing capabilities</span>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-medium">Est. Learning</span>
            <Clock className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-2xl font-bold text-zinc-200 font-mono">
            {summary.totalEstimatedLearningHours}h
          </div>
          <span className="text-[11px] text-zinc-500 block">Total effort</span>
        </div>

        <div className="bg-zinc-900/80 border border-rose-900/40 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 font-medium">Needs Review</span>
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-300 font-mono">{summary.needsReviewCount}</div>
          <span className="text-[11px] text-zinc-500 block">Requires decision</span>
        </div>
      </div>

      {/* Founder Profile Context Card */}
      {activeProfile && (
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-emerald-400" />
              YOUR PROFILE CONTEXT (EVALUATED BY RESOLUTION ENGINE)
            </h3>
            <Link
              href="/dashboard/creator/profile"
              className="text-xs text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 font-medium"
            >
              Edit in HumainX
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg p-3">
              <span className="text-[11px] text-zinc-500 block mb-1">Weekly Availability</span>
              <span className="text-sm font-semibold text-zinc-200">
                {activeProfile.weeklyAvailability || '15-25 hours/week'}
              </span>
            </div>
            <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg p-3">
              <span className="text-[11px] text-zinc-500 block mb-1">Learning Preference</span>
              <span className="text-sm font-semibold text-zinc-200">
                {activeProfile.learningPreference || 'Self-Guided'}
              </span>
            </div>
            <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg p-3">
              <span className="text-[11px] text-zinc-500 block mb-1">Delegation Preference</span>
              <span className="text-sm font-semibold text-zinc-200">
                {activeProfile.delegationPreference || 'Selective'}
              </span>
            </div>
            <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-lg p-3">
              <span className="text-[11px] text-zinc-500 block mb-1">Verified Top Capabilities</span>
              <span className="text-sm font-semibold text-zinc-200 truncate block">
                {activeProfile.topSkills?.length ? activeProfile.topSkills.join(', ') : 'Declared in profile'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs Filter */}
      <div className="flex flex-wrap gap-2 border-b border-zinc-800 pb-3">
        {(
          [
            { id: 'ALL', label: 'All Requirements', count: summary.totalRequirements },
            { id: 'LEARN', label: 'Learn', count: summary.learnCount },
            { id: 'DELEGATE', label: 'Delegate', count: summary.delegateCount },
            { id: 'VERIFY', label: 'Verify', count: summary.verifyCount },
            { id: 'COVERED', label: 'Already Covered', count: summary.coveredCount },
            { id: 'NEEDS_REVIEW', label: 'Needs Review', count: summary.needsReviewCount },
          ] as const
        ).map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 ${
                isActive
                  ? 'bg-zinc-200 text-zinc-900 font-semibold'
                  : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                  isActive ? 'bg-zinc-900 text-zinc-200' : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Resolution Cards Stream */}
      <div className="space-y-4">
        {filteredResolutions.length === 0 ? (
          <div className="bg-zinc-900/30 border border-zinc-800/60 rounded-xl p-10 text-center space-y-2">
            <Check className="w-8 h-8 text-zinc-500 mx-auto" />
            <h4 className="text-sm font-medium text-zinc-300">No items in this category</h4>
            <p className="text-xs text-zinc-500">All requirements have been categorized appropriately.</p>
          </div>
        ) : (
          filteredResolutions.map((res) => {
            const isEditing = editingResolutionKey === res.key;
            return (
              <div
                key={res.key}
                className={`bg-zinc-900/70 border rounded-xl p-5 space-y-4 transition-all ${
                  res.isMandatoryVerification
                    ? 'border-amber-800/70 shadow-amber-950/20 shadow-md'
                    : res.resolutionMode === 'LEARN'
                    ? 'border-emerald-900/50 hover:border-emerald-700/60'
                    : res.resolutionMode === 'DELEGATE'
                    ? 'border-indigo-900/50 hover:border-indigo-700/60'
                    : res.resolutionMode === 'VERIFY'
                    ? 'border-amber-900/50 hover:border-amber-700/60'
                    : res.resolutionMode === 'COVERED'
                    ? 'border-sky-900/50 hover:border-sky-700/60'
                    : 'border-rose-900/50'
                }`}
              >
                {/* Resolution Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-medium text-zinc-400 uppercase">
                        {res.needCategory}
                      </span>
                      {res.blocking && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-rose-950/80 text-rose-300 border border-rose-800/70">
                          Launch-Blocking
                        </span>
                      )}
                      {res.isMandatoryVerification && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-amber-950/80 text-amber-300 border border-amber-800/70 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" />
                          Statutory Requirement
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-semibold text-zinc-100">{res.capability}</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed max-w-2xl">{res.why}</p>
                  </div>

                  {/* Mode Badges (System Mode vs Founder Override) */}
                  <div className="flex flex-col sm:items-end gap-1.5 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-zinc-500 uppercase font-mono">System:</span>
                      <span
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold uppercase font-mono ${
                          res.resolutionMode === 'LEARN'
                            ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-700/60'
                            : res.resolutionMode === 'DELEGATE'
                            ? 'bg-indigo-950/90 text-indigo-300 border border-indigo-700/60'
                            : res.resolutionMode === 'VERIFY'
                            ? 'bg-amber-950/90 text-amber-300 border border-amber-700/60'
                            : res.resolutionMode === 'COVERED'
                            ? 'bg-sky-950/90 text-sky-300 border border-sky-700/60'
                            : 'bg-rose-950/90 text-rose-300 border border-rose-700/60'
                        }`}
                      >
                        {res.resolutionMode}
                      </span>
                    </div>

                    {res.founderDecision && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-[10px] text-zinc-500 uppercase font-mono">Your Choice:</span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-800 text-zinc-200 border border-zinc-700">
                          {res.founderDecision}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Specific Action Plan Display */}
                {res.resolutionMode === 'LEARN' && res.learningAction && (
                  <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-3">
                        <span className="text-zinc-400">
                          Objective:{' '}
                          <strong className="text-zinc-200 font-normal">{res.learningAction.objective}</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                          Target: {res.learningAction.targetLevel}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/50">
                          {res.learningAction.estimatedHours}h est.
                        </span>
                      </div>
                    </div>

                    {/* Curated Topics Accordion */}
                    {res.learningAction.suggestedTopics?.length > 0 && (
                      <div className="pt-2 border-t border-zinc-800/60">
                        <span className="text-[11px] font-mono text-zinc-400 block mb-2 font-semibold">
                          CURATED LEARNING TOPICS:
                        </span>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-300">
                          {res.learningAction.suggestedTopics.map((topic, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                              <span>{topic}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {res.resolutionMode === 'DELEGATE' && res.delegationRequirement && (
                  <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-[11px] text-zinc-500 block">Suggested Partner Type</span>
                        <span className="font-medium text-indigo-300 font-mono">
                          {res.delegationRequirement.suggestedResourceType}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-zinc-500 block">Timing</span>
                        <span className="font-medium text-zinc-300">{res.delegationRequirement.timing}</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-zinc-500 block">Expected Outcome</span>
                        <span className="font-medium text-zinc-300">{res.delegationRequirement.expectedOutcome}</span>
                      </div>
                    </div>
                  </div>
                )}

                {res.resolutionMode === 'VERIFY' && res.verificationRequirement && (
                  <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-[11px] text-zinc-500 block">Verification Type</span>
                        <span className="font-medium text-amber-300 font-mono">
                          {res.verificationRequirement.verificationType}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-zinc-500 block">Authority Source</span>
                        <span className="font-medium text-zinc-300">
                          {res.verificationRequirement.authoritySource || 'Official French Registry'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-zinc-500 block">Required Evidence</span>
                        <span className="font-medium text-zinc-300">
                          {res.verificationRequirement.requiredEvidence}
                        </span>
                      </div>
                    </div>

                    {/* Optional Supporting Learning for Verify (Correction 3) */}
                    {res.verificationRequirement.optionalLearningSupplement && (
                      <div className="pt-2 border-t border-zinc-800/60 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs text-amber-300 font-medium">
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Optional Supporting Knowledge for Founder</span>
                        </div>
                        <p className="text-[11px] text-zinc-400">
                          {res.verificationRequirement.optionalLearningSupplement.objective} (Est.{' '}
                          {res.verificationRequirement.optionalLearningSupplement.estimatedHours}h) — Does not replace
                          professional verification.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {res.resolutionMode === 'COVERED' && (
                  <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-3 text-xs text-zinc-400 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>
                      Capability verified through your profile qualifications or existing project coverage. No further
                      action needed.
                    </span>
                  </div>
                )}

                {/* Founder Notes display if present */}
                {res.founderNotes && (
                  <div className="text-xs bg-zinc-950/40 rounded p-2 text-zinc-300 border border-zinc-800/40">
                    <span className="text-zinc-500 font-mono text-[10px] uppercase block">Your Notes:</span>
                    {res.founderNotes}
                  </div>
                )}

                {/* Card Action Bar & Decision Editor */}
                <div className="flex items-center justify-between pt-2 border-t border-zinc-800/50">
                  <div className="text-[11px] text-zinc-500">
                    Confidence: <span className="font-mono text-zinc-400">{res.confidence}</span>
                  </div>

                  {isEditing ? (
                    <div className="w-full sm:w-auto flex flex-col gap-2 pt-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={selectedDecision}
                          onChange={(e) => setSelectedDecision(e.target.value)}
                          className="bg-zinc-800 border border-zinc-700 rounded px-2.5 py-1 text-xs text-zinc-200"
                        >
                          <option value="">Choose your decision...</option>
                          <option value="AcceptedRecommendation">Accept System Recommendation</option>
                          {!res.isMandatoryVerification && (
                            <>
                              <option value="ChooseLearn">I will learn this myself</option>
                              <option value="ChooseDelegate">I will delegate this</option>
                            </>
                          )}
                          <option value="ChooseVerify">Require verified review</option>
                          <option value="DeferDecision">Defer for later</option>
                        </select>

                        {res.isMandatoryVerification && (
                          <span className="text-[11px] text-amber-400/90 italic">
                            * Statutory verification cannot be overridden with self-learning
                          </span>
                        )}
                      </div>

                      <input
                        type="text"
                        placeholder="Optional personal notes or reason..."
                        value={notesInput}
                        onChange={(e) => setNotesInput(e.target.value)}
                        className="bg-zinc-950 border border-zinc-700 rounded px-3 py-1 text-xs text-zinc-200 w-full sm:w-80"
                      />

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSaveOverride(res.key)}
                          disabled={isSubmittingOverride}
                          className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium"
                        >
                          {isSubmittingOverride ? 'Saving...' : 'Save Decision'}
                        </button>
                        <button
                          onClick={() => setEditingResolutionKey(null)}
                          className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleOpenOverride(res)}
                      className="text-xs text-zinc-400 hover:text-zinc-200 inline-flex items-center gap-1 font-medium transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      {res.founderDecision ? 'Change Decision' : 'Decide Alternative'}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Active Phase 4.5 Support CTA */}
      <div className="mt-12 bg-zinc-900/60 border border-emerald-800/60 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg">
        <div className="space-y-1 text-center md:text-left">
          <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-400 block">
            NEXT STEP · PHASE 4.5
          </span>
          <h4 className="text-sm font-semibold text-zinc-100">Aids, Grants & Public Support Matching</h4>
          <p className="text-xs text-zinc-400">
            Match your venture and identified training and delegation needs with French and EU public grants, exemptions, and financing.
          </p>
        </div>
        <Link
          href={`/dashboard/creator/phase-4/support?ideaId=${ideaId}`}
          className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shrink-0 flex items-center gap-2 transition-all shadow-md active:scale-[0.98]"
        >
          <span>Explore Support & Funding</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
