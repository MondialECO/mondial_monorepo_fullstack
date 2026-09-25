'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Sparkles,
  ExternalLink,
  BookOpen,
  Info,
  Check,
  X,
  FileText,
  Lock,
  ChevronRight,
  HelpCircle,
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
  isGenerating?: boolean;
  error?: string | null;
  gateError?: { code: string; message: string } | null;
  onGenerate: () => Promise<void>;
  onRefresh: () => Promise<void>;
  onUpdateResolution: (resolutionKey: string, req: UpdateResolutionRequest) => Promise<void>;
  onKeepCurrent: () => Promise<void>;
  onClearError?: () => void;
}

export function SkillsPlanView({
  ideaId,
  projectName,
  plan,
  updateAvailable,
  changedSources,
  profileSummary,
  isLoading,
  isGenerating = false,
  error,
  gateError,
  onGenerate,
  onRefresh,
  onUpdateResolution,
  onKeepCurrent,
  onClearError,
}: SkillsPlanViewProps) {
  const [staleDismissed, setStaleDismissed] = useState<boolean>(false);
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [activeBriefModal, setActiveBriefModal] = useState<CapabilityResolution | null>(null);
  const [activeEvidenceModal, setActiveEvidenceModal] = useState<CapabilityResolution | null>(null);
  const [activeWhyModal, setActiveWhyModal] = useState<CapabilityResolution | null>(null);
  const [activeMatchReasonModal, setActiveMatchReasonModal] = useState<CoveredCapability | null>(null);
  const [updatingKey, setUpdatingKey] = useState<string | null>(null);
  const [customNotes, setCustomNotes] = useState<{ [key: string]: string }>({});

  // 1. Gate Error State (Prerequisites blocked)
  if (gateError) {
    return (
      <div className="w-full max-w-[1120px] mx-auto py-8 px-4 sm:px-6">
        <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-8 text-center space-y-4 shadow-sm">
          <div className="inline-flex p-3 rounded-full bg-destructive/15 text-destructive">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Skills Plan Unavailable</h2>
          <p className="text-muted-foreground max-w-lg mx-auto text-sm leading-relaxed">
            {gateError.message}
          </p>
          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            {gateError.code === 'NEEDS_REFRESH_REQUIRED' || gateError.code === 'NEEDS_NOT_GENERATED' ? (
              <Link
                href={`/dashboard/creator/phase-4/needs?ideaId=${ideaId}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm transition-all shadow"
              >
                Go to Step 4.3 Needs Analysis
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                href={`/dashboard/creator/phase-3?ideaId=${ideaId}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-secondary hover:bg-secondary/80 text-secondary-foreground font-semibold text-sm transition-all"
              >
                Review Prior Steps
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 2. Uninitialized State (Ready to Build Skills Plan)
  if (!plan) {
    return (
      <div className="w-full max-w-[1120px] mx-auto py-8 px-4 sm:px-6 space-y-8 animate-fadeIn">
        <div className="text-center space-y-3 pt-4">
          <span className="text-xs uppercase tracking-widest text-primary font-mono font-semibold">
            STEP 4.4 · SKILLS & TRAINING
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-serif">
            Learn · Delegate · Verify Engine
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm leading-relaxed">
            Determines the optimal resolution path for every capability requirement for{' '}
            <span className="text-foreground font-medium">{projectName}</span> — balancing your skills,
            weekly availability, and statutory compliance.
          </p>
        </div>

        {profileSummary && (
          <div className="bg-card border border-border/80 rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
              YOUR PROFILE CONTEXT (FROM HUMAINX)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-muted/40 border border-border/60 rounded-xl p-4">
                <span className="text-xs text-muted-foreground block mb-1">Weekly Availability</span>
                <span className="text-sm font-semibold text-foreground">
                  {profileSummary.weeklyAvailability || '4-8 hours/week'}
                </span>
              </div>
              <div className="bg-muted/40 border border-border/60 rounded-xl p-4">
                <span className="text-xs text-muted-foreground block mb-1">Learning Approach</span>
                <span className="text-sm font-semibold text-foreground">
                  {profileSummary.learningPreference || profileSummary.preferredApproach || 'Balanced'}
                </span>
              </div>
              <div className="bg-muted/40 border border-border/60 rounded-xl p-4">
                <span className="text-xs text-muted-foreground block mb-1">Declared Top Skills</span>
                <span className="text-sm font-semibold text-foreground">
                  {profileSummary.topSkills?.length ? profileSummary.topSkills.join(', ') : 'None declared'}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="bg-card border border-border/80 rounded-2xl p-10 text-center space-y-6 shadow-sm">
          <div className="inline-flex p-4 rounded-full bg-primary/10 text-primary">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-foreground">Ready to Build Your Skills Plan</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
              Our deterministic capability resolution engine will evaluate each unresolved requirement from Step 4.3
              against your HumainX profile and statutory legal requirements.
            </p>
          </div>
          <button
            onClick={onGenerate}
            disabled={isLoading || isGenerating}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-semibold text-sm transition-all shadow"
          >
            {isLoading || isGenerating ? (
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

  const { resolutions = [], coveredCapabilities = [] } = plan;
  const activeResolutions = resolutions.filter(
    (r) => r.resolutionMode?.toUpperCase() !== 'COVERED'
  );
  const totalSkillsCount = activeResolutions.length + coveredCapabilities.length;
  const coveredCount = coveredCapabilities.length;
  const attentionCount = activeResolutions.length;

  const handleSelectMode = async (resolution: CapabilityResolution, mode: 'LEARN' | 'DELEGATE' | 'VERIFY') => {
    if (resolution.isMandatoryVerification && mode !== 'VERIFY') {
      alert('This capability requires statutory legal or professional verification under French regulations and cannot be waived with self-learning or uncertified delegation.');
      return;
    }

    const decisionCode =
      mode === 'LEARN'
        ? 'ChooseLearn'
        : mode === 'DELEGATE'
        ? 'ChooseDelegate'
        : 'ChooseVerify';

    setUpdatingKey(resolution.key);
    try {
      await onUpdateResolution(resolution.key, {
        founderDecision: decisionCode,
        founderNotes: customNotes[resolution.key] || resolution.founderNotes,
      });
    } finally {
      setUpdatingKey(null);
    }
  };

  return (
    <div className="w-full space-y-8 animate-fadeIn">
      {/* Global Error Notice if any */}
      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 flex items-center justify-between text-destructive text-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          {onClearError && (
            <button onClick={onClearError} className="text-xs font-semibold hover:underline">
              Dismiss
            </button>
          )}
        </div>
      )}

      {/* COMPONENT 1: UPSTREAM UPDATE NOTICE */}
      {updateAvailable && !staleDismissed && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="text-xs leading-relaxed">
              <strong className="font-semibold text-foreground">Update available:</strong> Changes to your project or experience may affect this plan.
              {changedSources.length > 0 && (
                <span className="ml-1 text-muted-foreground">
                  (Updates in: {changedSources.join(', ')})
                </span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
            <button
              onClick={() => setShowReviewModal(true)}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Review changes
            </button>
            <span className="text-amber-500/50">|</span>
            <button
              onClick={async () => {
                setStaleDismissed(true);
                await onKeepCurrent();
              }}
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Keep my choices
            </button>
          </div>
        </div>
      )}

      {/* COMPONENT 2: COMPACT SKILLS SUMMARY */}
      <section className="p-6 rounded-2xl bg-card border border-border/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              {totalSkillsCount} project skills
            </h1>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {coveredCount} covered
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                {attentionCount} need attention
              </span>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Based on your project needs and what you’ve shared.
          </p>
        </div>

        <div className="flex items-center gap-8 border-t md:border-t-0 md:border-l border-border/80 pt-4 md:pt-0 md:pl-8">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase block font-semibold">
              PROJECT SCOPE
            </span>
            <span className="text-sm font-semibold text-foreground">
              {projectName || 'MVP v1'}
            </span>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase block font-semibold">
              REGION
            </span>
            <span className="text-sm font-semibold text-foreground">
              France
            </span>
          </div>
        </div>
      </section>

      {/* COMPONENT 3: EXISTING STRENGTHS (You can already handle) */}
      {coveredCapabilities.length > 0 && (
        <section className="p-6 rounded-2xl bg-card border border-border/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <h2 className="text-lg font-bold text-foreground">
                You can already handle
              </h2>
              <p className="text-xs text-muted-foreground">
                From your Creator profile
              </p>
            </div>
            <Link
              href="/dashboard/creator/profile"
              className="text-xs font-semibold text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
            >
              <span>Update my experience</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {coveredCapabilities.map((item, idx) => (
              <div
                key={item.id || item.resolutionKey || idx}
                className="p-4 rounded-xl bg-muted/30 border border-border/60 flex items-center justify-between gap-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">
                      {item.capability}
                    </h4>
                    <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                      {item.currentLevel || 'Comfortable'} · Covered for ordinary work
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveMatchReasonModal(item)}
                  className="text-xs text-muted-foreground hover:text-foreground font-medium shrink-0"
                >
                  Why this matches
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* COMPONENT 4: PLAIN-LANGUAGE APPROACH CONTROLS EXPLANATION */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-card border border-border/80 shadow-sm space-y-1">
          <div className="flex items-center gap-2 text-primary font-semibold text-sm">
            <GraduationCap className="w-4 h-4" />
            <span>Learn</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Build the skills to do it yourself.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border/80 shadow-sm space-y-1">
          <div className="flex items-center gap-2 text-primary font-semibold text-sm">
            <Users className="w-4 h-4" />
            <span>Delegate</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Get help from someone with the right skills.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border/80 shadow-sm space-y-1">
          <div className="flex items-center gap-2 text-primary font-semibold text-sm">
            <ShieldCheck className="w-4 h-4" />
            <span>Verify</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Check whether your experience covers this work.
          </p>
        </div>
      </section>

      {/* RESOLUTION CARDS STREAM (COMPONENTS 5, 6, 7) */}
      <div className="space-y-6">
        {activeResolutions.map((res, cardIdx) => {
          const effectiveMode: 'LEARN' | 'DELEGATE' | 'VERIFY' =
            res.founderDecision === 'ChooseLearn'
              ? 'LEARN'
              : res.founderDecision === 'ChooseDelegate'
              ? 'DELEGATE'
              : res.founderDecision === 'ChooseVerify'
              ? 'VERIFY'
              : res.resolutionMode?.toUpperCase() === 'LEARN'
              ? 'LEARN'
              : res.resolutionMode?.toUpperCase() === 'DELEGATE'
              ? 'DELEGATE'
              : 'VERIFY';

          const isSelectedChoice = Boolean(res.founderDecision);
          const choiceLabel = isSelectedChoice
            ? `${effectiveMode.charAt(0) + effectiveMode.slice(1).toLowerCase()} (Selected)`
            : 'Not selected yet';

          return (
            <article
              key={res.key || cardIdx}
              className="p-6 sm:p-7 rounded-2xl bg-card border border-border/80 shadow-sm space-y-5 transition-all"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg sm:text-xl font-bold text-foreground">
                      {res.capability}
                    </h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                      Needs attention
                    </span>
                    {res.blocking && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-destructive/10 text-destructive border border-destructive/20">
                        Launch-Blocking
                      </span>
                    )}
                    {res.isMandatoryVerification && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                        <Lock className="w-2.5 h-2.5" />
                        Statutory
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {effectiveMode === 'DELEGATE'
                      ? 'Have someone else handle what you cannot easily do yourself.'
                      : effectiveMode === 'LEARN'
                      ? 'Learn how to explain your offer and start useful conversations.'
                      : 'Make sure your experience covers the checks needed before people use the product.'}
                  </p>
                </div>
              </div>

              {/* Level & Recommendation strip */}
              <div className="p-3 rounded-xl bg-muted/40 border border-border/60 flex flex-wrap items-center gap-2 text-xs text-muted-foreground font-medium">
                <span>Current level: {res.currentSkillLevel || 'Beginner'}</span>
                <span>·</span>
                <span>
                  Recommended:{' '}
                  <strong className="text-foreground font-semibold">
                    {res.resolutionMode?.toUpperCase() === 'LEARN'
                      ? 'Learn'
                      : res.resolutionMode?.toUpperCase() === 'DELEGATE'
                      ? 'Delegate'
                      : 'Verify'}
                  </strong>
                </span>
                <span>·</span>
                <span>
                  Your choice:{' '}
                  <strong
                    className={
                      isSelectedChoice
                        ? 'text-primary font-semibold'
                        : 'text-foreground font-semibold'
                    }
                  >
                    {choiceLabel}
                  </strong>
                </span>
              </div>

              {/* Rationale explanation */}
              <div className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
                <span className="font-semibold text-foreground">Why this recommendation:</span>{' '}
                {res.why ||
                  'Technical support may help you move forward while you focus on the work you can handle.'}
              </div>

              {/* 3-Button Approach Selector Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Learn Button */}
                <button
                  onClick={() => handleSelectMode(res, 'LEARN')}
                  disabled={updatingKey === res.key || res.isMandatoryVerification}
                  className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                    effectiveMode === 'LEARN'
                      ? 'bg-primary/10 border-primary shadow-sm text-primary'
                      : 'bg-card hover:bg-muted/50 border-border text-foreground'
                  } ${res.isMandatoryVerification ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4" />
                      Learn
                    </span>
                    {effectiveMode === 'LEARN' && (
                      <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px]">
                        ✓
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground mt-1">
                    Build the skills to do it yourself
                  </span>
                </button>

                {/* Delegate Button */}
                <button
                  onClick={() => handleSelectMode(res, 'DELEGATE')}
                  disabled={updatingKey === res.key || res.isMandatoryVerification}
                  className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                    effectiveMode === 'DELEGATE'
                      ? 'bg-primary/10 border-primary shadow-sm text-primary'
                      : 'bg-card hover:bg-muted/50 border-border text-foreground'
                  } ${res.isMandatoryVerification ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      Delegate
                    </span>
                    {effectiveMode === 'DELEGATE' && (
                      <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px]">
                        ✓
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground mt-1">
                    Get help from someone with the right skills
                  </span>
                </button>

                {/* Verify Button */}
                <button
                  onClick={() => handleSelectMode(res, 'VERIFY')}
                  disabled={updatingKey === res.key}
                  className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                    effectiveMode === 'VERIFY'
                      ? 'bg-primary/10 border-primary shadow-sm text-primary'
                      : 'bg-card hover:bg-muted/50 border-border text-foreground'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      Verify
                    </span>
                    {effectiveMode === 'VERIFY' && (
                      <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px]">
                        ✓
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground mt-1">
                    Check whether experience covers this
                  </span>
                </button>
              </div>

              {/* DYNAMIC INSET DETAIL PANELS */}
              {effectiveMode === 'DELEGATE' && (
                <div className="p-5 rounded-xl bg-muted/30 border border-border/70 space-y-4 animate-fadeIn">
                  {/* Top Header */}
                  <div className="flex items-center justify-between border-b border-border/60 pb-3">
                    <span className="text-[11px] font-mono font-bold tracking-wider text-muted-foreground uppercase">
                      DELEGATION BRIEF PREVIEW
                    </span>
                    <span className="text-xs font-semibold text-foreground">
                      Suggested type:{' '}
                      <span className="text-primary font-medium">
                        {res.delegationRequirement?.suggestedResourceType || 'Freelance specialist'}
                      </span>
                    </span>
                  </div>

                  {/* 6 Structured Attributes Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-muted-foreground block mb-0.5">Capability needed</span>
                      <span className="font-semibold text-foreground">{res.capability}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-0.5">Target timing</span>
                      <span className="font-semibold text-foreground">
                        {res.delegationRequirement?.targetTiming ||
                          res.delegationRequirement?.timing ||
                          'Before launch (Weeks 3–6)'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-0.5">Suggested budget tier</span>
                      <span className="font-semibold text-foreground">
                        {res.delegationRequirement?.estimatedBudgetTier || 'Moderate freelance tier'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-0.5">Working language</span>
                      <span className="font-semibold text-foreground">
                        {res.delegationRequirement?.workingLanguage || 'French or English'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-0.5">Estimated weekly time</span>
                      <span className="font-semibold text-foreground">
                        {res.delegationRequirement?.estimatedWeeklyTime || '5–8 hours/week'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-0.5">Expected deliverable</span>
                      <span className="font-semibold text-foreground">
                        {res.delegationRequirement?.expectedDeliverable ||
                          res.delegationRequirement?.expectedOutcome ||
                          res.delegationRequirement?.requirementSummary ||
                          'Working authenticated core workflow'}
                      </span>
                    </div>
                  </div>

                  {/* Delegation Actions Bar */}
                  <div className="pt-3 border-t border-border/60 flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setActiveBriefModal(res)}
                      className="px-3 py-1.5 rounded-lg bg-card border border-border text-foreground hover:bg-muted text-xs font-semibold transition-colors"
                    >
                      View brief
                    </button>
                    <button
                      onClick={() => setActiveBriefModal(res)}
                      className="px-3 py-1.5 rounded-lg bg-card border border-border text-foreground hover:bg-muted text-xs font-semibold transition-colors"
                    >
                      Edit brief
                    </button>
                    <button
                      onClick={() => handleSelectMode(res, 'VERIFY')}
                      className="px-3 py-1.5 rounded-lg bg-card border border-border text-foreground hover:bg-muted text-xs font-semibold transition-colors"
                    >
                      Add existing support
                    </button>
                  </div>
                </div>
              )}

              {effectiveMode === 'LEARN' && (
                <div className="p-5 rounded-xl bg-muted/30 border border-border/70 space-y-5 animate-fadeIn">
                  {/* Top Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border/60 pb-3 gap-2">
                    <div className="flex items-center gap-2 text-foreground font-bold text-sm">
                      <GraduationCap className="w-4 h-4 text-primary" />
                      <span>Your learning plan</span>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-md bg-muted text-muted-foreground font-medium">
                      Suggested effort:{' '}
                      {res.learningAction?.suggestedEffortText ||
                        (res.learningAction?.estimatedHours
                          ? `${res.learningAction.estimatedHours} hours total`
                          : '1 hour / week for 4 weeks')}
                    </span>
                  </div>

                  {/* 2-Card Learning Objectives */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-card border border-border/70 space-y-1">
                      <span className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase block font-semibold">
                        WHAT YOU’LL BE ABLE TO DO
                      </span>
                      <p className="font-semibold text-foreground leading-relaxed">
                        {res.learningAction?.whatYoullBeAbleToDo ||
                          res.learningAction?.objective ||
                          'Prepare and run a small outreach test.'}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-card border border-border/70 space-y-1">
                      <span className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase block font-semibold">
                        WHAT YOU’LL CREATE
                      </span>
                      <p className="font-semibold text-foreground leading-relaxed">
                        {res.learningAction?.whatYoullCreate ||
                          'A short first message, a follow-up checklist and a simple response log.'}
                      </p>
                    </div>
                  </div>

                  {/* 4 Practical Learning Steps */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase block font-semibold">
                      4 PRACTICAL LEARNING STEPS
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                      {[
                        { step: 'Step 01', title: 'Understand the customer problem' },
                        { step: 'Step 02', title: 'Write a clear first message' },
                        { step: 'Step 03', title: 'Plan your follow-up' },
                        { step: 'Step 04', title: 'Review responses and improve' },
                      ].map((s) => (
                        <div
                          key={s.step}
                          className="p-3 rounded-lg bg-card border border-border/60 space-y-1"
                        >
                          <span className="text-[11px] font-mono font-bold text-primary block">
                            {s.step}
                          </span>
                          <span className="text-xs font-semibold text-foreground block leading-tight">
                            {s.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Training Options Box */}
                  <div className="p-3.5 rounded-xl bg-card border border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <BookOpen className="w-4 h-4 text-foreground shrink-0" />
                      <span className="font-semibold text-foreground">Training options</span>
                      <span>· No course selected</span>
                    </div>
                    <span className="text-muted-foreground font-medium">
                      Provider and cost: To confirm
                    </span>
                  </div>

                  {/* WORKLOAD IMPACT PREVIEW */}
                  <div className="space-y-2 pt-2">
                    <span className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase block font-semibold">
                      WORKLOAD IMPACT PREVIEW
                    </span>
                    <div className="p-4 rounded-xl bg-card border border-border/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                      <div>
                        <span className="text-xs text-muted-foreground block mb-0.5">
                          Weekly availability
                        </span>
                        <span className="text-sm font-bold text-foreground">
                          {profileSummary?.weeklyAvailability || '4 hours'}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground block mb-0.5">
                          Already planned
                        </span>
                        <span className="text-sm font-bold text-foreground">
                          2.5 hours
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-primary block mb-0.5">
                          Proposed learning
                        </span>
                        <span className="text-sm font-bold text-primary">
                          +1 hour
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 block mb-0.5">
                          Total if accepted
                        </span>
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                          3.5 hours
                        </span>
                        <span className="text-[10px] text-muted-foreground block mt-0.5">
                          0.5h weekly buffer
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-muted-foreground pt-1 gap-2">
                      <div className="flex items-center gap-1.5">
                        <span>Review the change before adding learning time to your plan:</span>
                        <Link
                          href={`/dashboard/creator/phase-4/roadmap?ideaId=${ideaId}`}
                          className="font-semibold text-primary hover:underline"
                        >
                          Review roadmap change
                        </Link>
                      </div>
                      <span>Training support can be explored in the next step.</span>
                    </div>
                  </div>
                </div>
              )}

              {effectiveMode === 'VERIFY' && (
                <div className="p-5 rounded-xl bg-muted/30 border border-border/70 space-y-4 animate-fadeIn">
                  {/* 3 Columns */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div className="space-y-1">
                      <span className="text-muted-foreground block font-medium">What needs checking</span>
                      <p className="font-semibold text-foreground leading-relaxed">
                        {res.verificationRequirement?.whatNeedsChecking ||
                          res.verificationRequirement?.requirement ||
                          'Whether you can test the required workflows and identify problems consistently.'}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-muted-foreground block font-medium">What you can share</span>
                      <p className="font-semibold text-foreground leading-relaxed">
                        {res.verificationRequirement?.whatYouCanShare ||
                          res.verificationRequirement?.requiredEvidence ||
                          'Relevant previous work or a practical example of similar testing.'}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-muted-foreground block font-medium">What is still unclear</span>
                      <p className="font-semibold text-foreground leading-relaxed">
                        {res.verificationRequirement?.whatIsStillUnclear ||
                          res.verificationRequirement?.whyRequired ||
                          'Your experience with the project’s launch-critical workflows.'}
                      </p>
                    </div>
                  </div>

                  {/* Horizontal Border & Action Buttons */}
                  <div className="pt-3 border-t border-border/60 flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setActiveEvidenceModal(res)}
                      className="px-3.5 py-1.5 rounded-lg bg-card border border-border text-foreground hover:bg-muted text-xs font-semibold transition-colors"
                    >
                      See what to share
                    </button>
                    <button
                      onClick={() => handleSelectMode(res, 'VERIFY')}
                      className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold transition-colors shadow-sm"
                    >
                      Choose Verify
                    </button>
                  </div>
                </div>
              )}

              {/* Quiet note & built from tags */}
              <div className="pt-2 border-t border-border/50 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-muted-foreground">
                <div className="leading-relaxed">
                  {effectiveMode === 'DELEGATE'
                    ? 'Mondial can help match you with vetted specialists, but hiring remains your decision.'
                    : effectiveMode === 'LEARN'
                    ? 'Includes suggested outreach templates and follow-up rhythm.'
                    : 'Verification avoids extra learning hours if your experience already qualifies.'}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-[10px] uppercase font-semibold">Built from:</span>
                  <span className="px-2 py-0.5 rounded-md bg-muted text-[11px] font-medium text-foreground">
                    Needs & Requirements
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-muted text-[11px] font-medium text-foreground">
                    Creator profile
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-muted text-[11px] font-medium text-foreground">
                    {effectiveMode === 'LEARN' ? 'Business Model' : 'Operational Roadmap'}
                  </span>
                  <button
                    onClick={() => setActiveWhyModal(res)}
                    className="text-primary hover:underline font-semibold ml-1 text-xs"
                  >
                    Why this suggestion?
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* COMPONENT 8: QUIET JOURNEY FOOTER NAVIGATION */}
      <footer className="pt-6 border-t border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href={`/dashboard/creator/phase-4/needs?ideaId=${ideaId}`}
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Needs & Requirements
        </Link>

        <div className="flex flex-col sm:items-end gap-1">
          <Link
            href={`/dashboard/creator/phase-4/support?ideaId=${ideaId}`}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm transition-all shadow"
          >
            <span>Continue to Aids & Support</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <span className="text-[11px] text-muted-foreground">
            Save your choices and explore support for your project.
          </span>
        </div>
      </footer>

      {/* REVIEW CHANGES MODAL (Component 1) */}
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
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
              <p>
                The following upstream project records have been updated since this skills plan was generated:
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
                Refreshing will recalculate capability resolution paths against your latest requirements, profile, and roadmap while preserving your existing choices.
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
                Keep my choices
              </button>
              <button
                onClick={async () => {
                  setShowReviewModal(false);
                  await onRefresh();
                }}
                disabled={isLoading || isGenerating}
                className="px-5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-lg transition-all shadow flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                Refresh Skills Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELEGATION BRIEF MODAL */}
      {activeBriefModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 text-foreground font-bold text-base">
                <FileText className="w-4 h-4 text-primary" />
                <span>Delegation Brief: {activeBriefModal.capability}</span>
              </div>
              <button
                onClick={() => setActiveBriefModal(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-muted-foreground">
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-2">
                <div>
                  <span className="font-semibold text-foreground block">Objective & Scope:</span>
                  <span>
                    {activeBriefModal.delegationRequirement?.expectedOutcome ||
                      activeBriefModal.delegationRequirement?.requirementSummary ||
                      'Deliver professional execution for this launch requirement.'}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-foreground block">Suggested Resource:</span>
                  <span>
                    {activeBriefModal.delegationRequirement?.suggestedResourceType || 'Freelance specialist'} (
                    {activeBriefModal.delegationRequirement?.estimatedBudgetTier || 'Moderate tier'})
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-foreground block">Timing & Cadence:</span>
                  <span>
                    {activeBriefModal.delegationRequirement?.targetTiming ||
                      activeBriefModal.timing ||
                      'Before launch'}
                  </span>
                </div>
              </div>
              <p className="text-[11px]">
                In Step 4.5, you will be able to review matching French and EU funding mechanisms and subsidies that can offset specialist costs.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setActiveBriefModal(null)}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-xs shadow"
              >
                Close Brief
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EVIDENCE / SEE WHAT TO SHARE MODAL */}
      {activeEvidenceModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 text-foreground font-bold text-base">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span>Verification Evidence Guide</span>
              </div>
              <button
                onClick={() => setActiveEvidenceModal(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-muted-foreground">
              <p>
                To satisfy this verification requirement for <strong className="text-foreground">{activeEvidenceModal.capability}</strong>, you can provide:
              </p>
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-2 text-foreground font-medium">
                <div className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>
                    {activeEvidenceModal.verificationRequirement?.requiredEvidence ||
                      'Relevant previous work, professional certification, or a practical test record.'}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>
                    Official authority or registry documentation if applicable under French regulations.
                  </span>
                </div>
              </div>
              <p className="text-[11px]">
                Providing verified credentials waives the need to allocate learning or delegation hours to this requirement.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setActiveEvidenceModal(null)}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-xs shadow"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WHY THIS SUGGESTION MODAL */}
      {activeWhyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 text-foreground font-bold text-base">
                <HelpCircle className="w-4 h-4 text-primary" />
                <span>Why this suggestion?</span>
              </div>
              <button
                onClick={() => setActiveWhyModal(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs leading-relaxed text-muted-foreground">
              <p>
                The resolution engine determined the recommendation for <strong className="text-foreground">{activeWhyModal.capability}</strong> based on:
              </p>
              <ul className="list-disc list-inside space-y-1 p-2 rounded-lg bg-muted/30 border border-border">
                <li>
                  Reason code: <span className="font-mono text-foreground font-medium">{activeWhyModal.reasonCode}</span>
                </li>
                <li>
                  Confidence:{' '}
                  <span className="font-semibold text-foreground">{activeWhyModal.confidence}</span>
                </li>
                <li>
                  Priority:{' '}
                  <span className="font-semibold text-foreground">{activeWhyModal.priority}</span>
                </li>
              </ul>
              <p className="text-[11px] pt-1 text-foreground/90">
                {activeWhyModal.why}
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setActiveWhyModal(null)}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-xs shadow"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WHY THIS MATCHES MODAL (Covered item) */}
      {activeMatchReasonModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in-50 zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 text-foreground font-bold text-base">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Capability Coverage</span>
              </div>
              <button
                onClick={() => setActiveMatchReasonModal(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs leading-relaxed text-muted-foreground">
              <p>
                <strong className="text-foreground">{activeMatchReasonModal.capability}</strong> is already marked as covered for ordinary project operations:
              </p>
              <div className="p-3 rounded-lg bg-muted/30 border border-border space-y-1">
                <div className="text-foreground font-medium">
                  Evidence: {activeMatchReasonModal.evidence || 'Documented in your creator profile and experience records.'}
                </div>
                {activeMatchReasonModal.coverageSource && (
                  <div className="text-[11px] text-muted-foreground">
                    Source: {activeMatchReasonModal.coverageSource}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setActiveMatchReasonModal(null)}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-xs shadow"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
