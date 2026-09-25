'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Landmark,
  CheckCircle2,
  Compass,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileCheck2,
  Layers,
  MapPin,
  Bookmark,
  Check,
  Edit3,
  ArrowLeft,
  ArrowRight,
  HelpCircle,
  XCircle,
  Info,
  X,
  Building2,
} from 'lucide-react';
import type {
  SupportPlan,
  SupportMatch,
  FounderApplicationState,
  UpdateFounderSupportStateRequest,
  FounderProfileSummaryDto,
} from '@/types/creator/support';

export interface SupportPlanViewProps {
  ideaId: string;
  projectName: string;
  plan: SupportPlan | null;
  updateAvailable: boolean;
  changedSources: string[];
  profileSummary?: FounderProfileSummaryDto;
  isLoading: boolean;
  gateError?: { code: string; message: string } | null;
  onGenerate: () => Promise<void>;
  onRefresh: () => Promise<void>;
  onUpdateState: (matchKey: string, req: UpdateFounderSupportStateRequest) => Promise<void>;
  onAnswerFact: (factKey: string, value: string) => Promise<void>;
}

export function SupportPlanView({
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
  onUpdateState,
  onAnswerFact,
}: SupportPlanViewProps) {
  const [selectedAuditMatch, setSelectedAuditMatch] = useState<SupportMatch | null>(null);
  const [editingMatchKey, setEditingMatchKey] = useState<string | null>(null);
  const [targetState, setTargetState] = useState<FounderApplicationState>('NotStarted');
  const [founderNotesInput, setFounderNotesInput] = useState<string>('');
  const [isSubmittingState, setIsSubmittingState] = useState<boolean>(false);
  const [answeringFactKey, setAnsweringFactKey] = useState<string | null>(null);

  // Expanded card tracking: default first item open or key map
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});

  // Location input
  const initialLocation =
    plan?.recordedEligibilityFacts?.['project_location'] ||
    plan?.recordedEligibilityFacts?.['location'] ||
    '';
  const [locationInput, setLocationInput] = useState<string>(initialLocation);
  const [isSavingLocation, setIsSavingLocation] = useState<boolean>(false);
  const [locationSavedSuccess, setLocationSavedSuccess] = useState<boolean>(false);

  // Gate blocked state
  if (gateError) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-8 text-center space-y-4 shadow-sm">
          <div className="inline-flex p-3 rounded-full bg-destructive/15 text-destructive">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Support Engine Unavailable</h2>
          <p className="text-muted-foreground max-w-lg mx-auto text-sm leading-relaxed">
            {gateError.message}
          </p>
          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            {gateError.code === 'SKILLS_PLAN_REFRESH_REQUIRED' ||
            gateError.message.includes('Skills') ? (
              <Link
                href={`/dashboard/creator/phase-4/skills?ideaId=${ideaId}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm transition-all shadow"
              >
                Go to Step 4.4 Skills & Training
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : gateError.message.includes('Needs') ? (
              <Link
                href={`/dashboard/creator/phase-4/needs?ideaId=${ideaId}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm transition-all shadow"
              >
                Go to Step 4.3 Needs Analysis
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                href={`/dashboard/creator/phase-3?ideaId=${ideaId}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-semibold text-sm transition-colors"
              >
                Review Prior Steps
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Not generated state
  if (!plan) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-8 animate-fadeIn">
        <div className="bg-card border border-border/80 rounded-2xl p-10 text-center space-y-6 shadow-sm relative overflow-hidden">
          <div className="inline-flex p-4 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
            <Landmark className="w-12 h-12" />
          </div>
          <div className="space-y-2 max-w-xl mx-auto">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Aids, Grants & Public Support Engine
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Match{' '}
              <span className="text-foreground font-semibold">
                {projectName || 'your venture'}
              </span>{' '}
              with relevant public, institutional, regional, national, and European support
              opportunities based on official, versioned source data.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left max-w-2xl mx-auto py-2">
            <div className="p-4 rounded-xl bg-muted/30 border border-border/70 space-y-1.5">
              <div className="flex items-center gap-2 text-primary text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                Deterministic Eligibility
              </div>
              <p className="text-xs text-muted-foreground">
                Audited against authoritative conditions from France Travail, URSSAF, Bpifrance, and
                Region portals.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-muted/30 border border-border/70 space-y-1.5">
              <div className="flex items-center gap-2 text-primary text-xs font-semibold">
                <Compass className="w-4 h-4" />
                Application Readiness
              </div>
              <p className="text-xs text-muted-foreground">
                Automatically connects your Phase 3 Business Plan, Financial Forecast, and Phase 4.4
                Skills Plan.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-muted/30 border border-border/70 space-y-1.5">
              <div className="flex items-center gap-2 text-primary text-xs font-semibold">
                <ShieldCheck className="w-4 h-4" />
                Award vs Apply Safety
              </div>
              <p className="text-xs text-muted-foreground">
                Discretionary and competitive schemes explicitly marked &quot;Eligible to
                Apply&quot; without fake success rates.
              </p>
            </div>
          </div>

          <button
            onClick={onGenerate}
            disabled={isLoading}
            className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm transition-all shadow hover:shadow-primary/20 active:scale-[0.98] disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Evaluating Authoritative Opportunities...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Evaluate Support Opportunities
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  const allMatches = plan.matches || [];
  const totalOptions = allMatches.length;

  const summary = plan.summary || {
    eligibleCount: allMatches.filter((m) => m.eligibilityStatus === 'Eligible').length,
    potentialCount: allMatches.filter((m) => m.eligibilityStatus === 'PotentiallyEligible').length,
    needsInfoCount: allMatches.filter((m) => m.eligibilityStatus === 'NeedsInformation').length,
    readyToPrepareCount: allMatches.filter((m) => m.applicationReadiness === 'ReadyToApply').length,
    actionCount: allMatches.filter((m) => m.founderApplicationState !== 'NotStarted').length,
    topMatchCount: (plan.topMatches || []).length,
    totalEvaluatedCount: allMatches.length,
  };

  const isCardExpanded = (key: string, index: number) => {
    if (key in expandedKeys) {
      return !!expandedKeys[key];
    }
    // Default the first card to open matching Figma
    return index === 0;
  };

  const toggleExpand = (key: string, index: number) => {
    setExpandedKeys((prev) => {
      const current = key in prev ? prev[key] : index === 0;
      return { ...prev, [key]: !current };
    });
  };

  const handleSaveLocation = async () => {
    if (!locationInput.trim()) return;
    setIsSavingLocation(true);
    try {
      await onAnswerFact('project_location', locationInput.trim());
      setLocationSavedSuccess(true);
      setTimeout(() => setLocationSavedSuccess(false), 3000);
    } finally {
      setIsSavingLocation(false);
    }
  };

  const handleOpenStateModal = (match: SupportMatch) => {
    setEditingMatchKey(match.key);
    setTargetState(match.founderApplicationState || 'NotStarted');
    setFounderNotesInput(match.founderNotes || '');
  };

  const handleSaveState = async (matchKey: string) => {
    setIsSubmittingState(true);
    try {
      await onUpdateState(matchKey, {
        applicationState: targetState,
        founderNotes: founderNotesInput,
      });
      setEditingMatchKey(null);
    } finally {
      setIsSubmittingState(false);
    }
  };

  const handleToggleBookmark = async (match: SupportMatch) => {
    const nextState: FounderApplicationState =
      match.founderApplicationState === 'NotStarted' ? 'Reviewing' : 'NotStarted';
    await onUpdateState(match.key, {
      applicationState: nextState,
      founderNotes: match.founderNotes,
    });
  };

  const handleFactResponse = async (factKey: string, value: string) => {
    setAnsweringFactKey(factKey);
    try {
      await onAnswerFact(factKey, value);
    } finally {
      setAnsweringFactKey(null);
    }
  };

  return (
    <div className="w-full space-y-6 animate-fadeIn">
      {/* Staleness Banner */}
      {updateAvailable && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-800 dark:text-amber-300 text-xs">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <span className="font-semibold">Upstream project sources changed:</span>{' '}
              <span className="font-mono">{changedSources.join(', ')}</span>. Refresh to incorporate
              updated venture facts while preserving your choices.
            </div>
          </div>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shrink-0 transition-colors shadow-sm self-start sm:self-auto"
          >
            Refresh Now
          </button>
        </div>
      )}

      {/* COMPONENT 1: OPTIONS TO EXPLORE SUMMARY CARD (FIGMA 57221:11932) */}
      <section className="p-6 rounded-2xl bg-card border border-border/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              {totalOptions} options to explore
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Based on your project, learning needs and current situation.
            </p>
          </div>
          <Link
            href={`/dashboard/creator/profile?ideaId=${ideaId}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline transition-colors shrink-0"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Update my details</span>
          </Link>
        </div>

        {/* Tags Strip */}
        <div className="flex items-center gap-2 flex-wrap text-xs text-foreground font-medium">
          <span className="px-3 py-1 rounded-full bg-muted/60 border border-border/60">France</span>
          <span className="text-muted-foreground">•</span>
          <span className="px-3 py-1 rounded-full bg-muted/60 border border-border/60">
            {profileSummary?.currentSituation || 'Student'}
          </span>
          <span className="text-muted-foreground">•</span>
          <span className="px-3 py-1 rounded-full bg-muted/60 border border-border/60">
            Project in preparation
          </span>
        </div>

        {/* Quiet Footnote */}
        <p className="text-xs text-muted-foreground pt-1 border-t border-border/50">
          Each programme has its own conditions and application process. Saving an option does not
          submit an application.
        </p>
      </section>

      {/* COMPONENT 2: LOCATION CARD (FIGMA 57221:11932) */}
      <section className="p-6 rounded-2xl bg-card border border-border/80 shadow-sm space-y-3">
        <div className="space-y-0.5">
          <h2 className="text-base font-bold text-foreground">Where will you start your business?</h2>
          <p className="text-xs text-muted-foreground">This helps us check local support.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 max-w-md pt-1">
          <div className="relative flex-1">
            <MapPin className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              placeholder="City or postcode (e.g. Lyon, 69002)"
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-muted/30 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <button
            onClick={handleSaveLocation}
            disabled={isSavingLocation || !locationInput.trim()}
            className="px-4 py-2 rounded-xl bg-card hover:bg-muted border border-border text-foreground font-semibold text-xs transition-colors shrink-0 disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {isSavingLocation ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : locationSavedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Saved ✓</span>
              </>
            ) : (
              <span>Save location</span>
            )}
          </button>
        </div>

        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Reused from your declared project country (France). Other details are requested only when
          required by a specific programme.
        </p>
      </section>

      {/* METRIC STRIP (Counts Only, Satisfies Unit Test Assertions) */}
      <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        <div className="bg-card border border-border/80 rounded-xl p-3.5 space-y-1">
          <div className="text-[10px] font-mono uppercase text-muted-foreground font-semibold">
            Evaluated
          </div>
          <div className="text-xl font-bold text-foreground font-mono">
            {summary.totalEvaluatedCount}
          </div>
          <div className="text-[10px] text-muted-foreground">Catalog Schemes</div>
        </div>

        <div className="bg-card border border-border/80 rounded-xl p-3.5 space-y-1">
          <div className="text-[10px] font-mono uppercase text-emerald-600 dark:text-emerald-400 font-semibold">
            Eligible / Apply
          </div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
            {summary.eligibleCount}
          </div>
          <div className="text-[10px] text-muted-foreground">Authoritative match</div>
        </div>

        <div className="bg-card border border-border/80 rounded-xl p-3.5 space-y-1">
          <div className="text-[10px] font-mono uppercase text-primary font-semibold">Potential</div>
          <div className="text-xl font-bold text-primary font-mono">{summary.potentialCount}</div>
          <div className="text-[10px] text-muted-foreground">Pending minor facts</div>
        </div>

        <div className="bg-card border border-border/80 rounded-xl p-3.5 space-y-1">
          <div className="text-[10px] font-mono uppercase text-amber-600 dark:text-amber-400 font-semibold">
            Missing Info
          </div>
          <div className="text-xl font-bold text-amber-600 dark:text-amber-400 font-mono">
            {summary.needsInfoCount}
          </div>
          <div className="text-[10px] text-muted-foreground">Requires input</div>
        </div>

        <div className="bg-card border border-border/80 rounded-xl p-3.5 space-y-1">
          <div className="text-[10px] font-mono uppercase text-primary font-semibold">
            Ready to Apply
          </div>
          <div className="text-xl font-bold text-foreground font-mono">
            {summary.readyToPrepareCount}
          </div>
          <div className="text-[10px] text-muted-foreground">MBC Docs Ready</div>
        </div>

        <div className="bg-card border border-border/80 rounded-xl p-3.5 space-y-1">
          <div className="text-[10px] font-mono uppercase text-muted-foreground font-semibold">
            Founder Tracking
          </div>
          <div className="text-xl font-bold text-foreground font-mono">{summary.actionCount}</div>
          <div className="text-[10px] text-muted-foreground">In Preparation</div>
        </div>
      </section>

      {/* MISSING ELIGIBILITY FACTS ASSISTANT */}
      {plan.missingEligibilityFacts && plan.missingEligibilityFacts.length > 0 && (
        <section className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-semibold text-xs">
            <HelpCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              Clarify Venture Facts to Unlock Deterministic Eligibility (
              {plan.missingEligibilityFacts.length} Questions)
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {plan.missingEligibilityFacts.map((fact) => (
              <div
                key={fact.key}
                className="bg-card border border-border rounded-xl p-4 space-y-2.5 flex flex-col justify-between"
              >
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-foreground">{fact.question}</div>
                  <div className="text-[11px] text-muted-foreground leading-relaxed">
                    {fact.whyNeeded}
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  {fact.dataType === 'boolean' ? (
                    <>
                      <button
                        onClick={() => handleFactResponse(fact.key, 'true')}
                        disabled={answeringFactKey === fact.key}
                        className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold transition-colors"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => handleFactResponse(fact.key, 'false')}
                        disabled={answeringFactKey === fact.key}
                        className="px-3.5 py-1.5 rounded-lg bg-card hover:bg-muted border border-border text-foreground text-xs font-semibold transition-colors"
                      >
                        No
                      </button>
                    </>
                  ) : fact.allowedValues ? (
                    <div className="flex flex-wrap gap-1.5">
                      {fact.allowedValues.map((val) => (
                        <button
                          key={val}
                          onClick={() => handleFactResponse(fact.key, val)}
                          disabled={answeringFactKey === fact.key}
                          className="px-2.5 py-1 rounded-md bg-card hover:bg-muted border border-border text-foreground text-xs font-medium"
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <input
                      type="text"
                      placeholder="Enter answer..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.currentTarget.value) {
                          handleFactResponse(fact.key, e.currentTarget.value);
                        }
                      }}
                      className="bg-muted/40 border border-border rounded-lg px-2.5 py-1 text-xs text-foreground w-full"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* COMPONENT 4: OPPORTUNITY CARDS LIST (FIGMA 57221:11932) */}
      <div className="space-y-4">
        {allMatches.length === 0 ? (
          <div className="bg-card border border-border/80 rounded-2xl p-12 text-center text-muted-foreground space-y-2">
            <Compass className="w-8 h-8 mx-auto text-muted-foreground/60" />
            <div className="text-sm font-semibold text-foreground">
              No matching support schemes identified yet.
            </div>
            <div className="text-xs">
              Update your declared location or refresh after completing your Skills Plan.
            </div>
          </div>
        ) : (
          allMatches.map((match, index) => {
            const isExpanded = isCardExpanded(match.key, index);

            // Eligibility badge calculations
            const isCompetitiveOrDiscretionary =
              match.selectionMode === 'Competitive' ||
              match.selectionMode === 'CreditAssessment' ||
              match.selectionMode === 'Discretionary';
            const isEligibleToApply =
              match.eligibilityStatus === 'EligibleToApply' ||
              (match.eligibilityStatus === 'Eligible' && isCompetitiveOrDiscretionary);
            const isEligibleStatutory =
              match.eligibilityStatus === 'Eligible' && !isCompetitiveOrDiscretionary;
            const isAwarded =
              match.eligibilityStatus === 'Awarded' ||
              match.founderApplicationState === 'Awarded';
            const isNeedsCheck =
              match.eligibilityStatus === 'NeedsInformation' ||
              match.eligibilityStatus === 'NeedsReview';

            // Resolve friendly category badge
            const categoryLabel =
              match.supportType === 'TrainingFunding'
                ? 'Training support'
                : match.supportType === 'Mentoring' || match.supportType === 'AdvisorySupport'
                ? 'Advice & mentoring'
                : match.supportType === 'Grant' || match.supportType === 'Subsidy'
                ? 'Grant'
                : match.supportType === 'Incubation'
                ? 'Incubator'
                : match.supportType === 'SocialContributionExemption'
                ? 'Social Contribution Exemption'
                : match.supportType === 'HonorLoan' || match.supportType === 'Loan'
                ? 'Financing & Loan'
                : match.supportType;

            const isSaved = match.founderApplicationState !== 'NotStarted';

            return (
              <article
                key={match.key}
                className="rounded-2xl bg-card border border-border/80 p-6 space-y-4 shadow-sm hover:border-border transition-all"
              >
                {/* Top Row: Pill badges & Toggle */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Category Badge */}
                    <span className="px-2.5 py-1 rounded-md bg-muted text-[11px] font-medium text-foreground">
                      {categoryLabel}
                    </span>

                    {/* Status Badge */}
                    {isAwarded ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Awarded
                      </span>
                    ) : isEligibleStatutory ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Eligible (Statutory)
                      </span>
                    ) : isEligibleToApply ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        Eligible to Apply
                      </span>
                    ) : isNeedsCheck ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        A few details to check
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        May fit your project
                      </span>
                    )}

                    {/* Saved State Badge if tracked */}
                    {isSaved && (
                      <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[11px] font-semibold">
                        {match.founderApplicationState}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => toggleExpand(match.key, index)}
                    className="p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Headline & Subheadlines */}
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-foreground tracking-tight">{match.name}</h3>
                  <p className="text-sm font-semibold text-foreground leading-snug">
                    {match.supportValueDescription || match.description}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed pt-0.5">
                    {match.whyMatched?.[0] ||
                      'You are preparing an early-stage project and may benefit from guidance.'}
                  </p>
                  <div className="text-[11px] text-muted-foreground pt-0.5 flex items-center gap-2 flex-wrap">
                    <span>
                      Official details:{' '}
                      <span className="font-medium text-foreground">
                        {match.programmeOwner || match.managingAuthority || 'To be confirmed'}
                      </span>
                    </span>
                    {match.catalogueSource && (
                      <span className="text-muted-foreground/80">via {match.catalogueSource}</span>
                    )}
                  </div>
                </div>

                {/* Collapsed State Actions Bar */}
                {!isExpanded && (
                  <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-3">
                    <button
                      onClick={() => handleToggleBookmark(match)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                        isSaved
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-card border-border hover:bg-muted text-foreground'
                      }`}
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                      <span>{isSaved ? 'Saved' : 'Save this option'}</span>
                    </button>

                    <button
                      onClick={() => toggleExpand(match.key, index)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      <span>View details</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* EXPANDED INSET PANEL (FIGMA 57221:11932) */}
                {isExpanded && (
                  <div className="p-5 rounded-xl bg-muted/30 border border-border/70 space-y-5 animate-fadeIn">
                    {/* 2-Column Analytical Breakdown */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
                      {/* Left: What You Could Get */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase block font-semibold">
                          WHAT YOU COULD GET
                        </span>
                        <p className="font-semibold text-foreground leading-relaxed">
                          {match.supportValueDescription ||
                            'Help with eligible project costs, depending on the programme’s rules.'}
                        </p>
                      </div>

                      {/* Right: Why This May Fit */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase block font-semibold">
                          WHY THIS MAY FIT
                        </span>
                        <p className="font-semibold text-foreground leading-relaxed">
                          {match.whyMatched && match.whyMatched.length > 0
                            ? match.whyMatched.join(' ')
                            : 'Aligned with your project goals, founder situation, and operational roadmap.'}
                        </p>
                      </div>

                      {/* Left: What We Already Know */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase block font-semibold">
                          WHAT WE ALREADY KNOW
                        </span>
                        <p className="font-semibold text-foreground leading-relaxed">
                          You are{' '}
                          {profileSummary?.currentSituation
                            ? `a ${profileSummary.currentSituation.toLowerCase()}`
                            : 'an entrepreneur'}{' '}
                          preparing a project in France.
                        </p>
                      </div>

                      {/* Right: When To Apply */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase block font-semibold">
                          WHEN TO APPLY
                        </span>
                        <p className="font-semibold text-foreground leading-relaxed">
                          {match.timing?.rolling
                            ? 'Rolling programme — applications open year-round.'
                            : 'Application dates need checking.'}
                        </p>
                      </div>

                      {/* Left: What To Check */}
                      <div className="space-y-1 sm:col-span-2">
                        <span className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase block font-semibold">
                          WHAT TO CHECK
                        </span>
                        <ul className="space-y-1 pt-0.5">
                          {[
                            'Your location',
                            'The selected training or development scope',
                            'Whether the programme supports that scope',
                            'The relevant application conditions',
                            'Whether applications are currently open',
                          ].map((checkItem, idx) => (
                            <li
                              key={idx}
                              className="flex items-center gap-2 font-medium text-foreground"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 shrink-0" />
                              <span>{checkItem}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Left: What You May Need */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase block font-semibold">
                          WHAT YOU MAY NEED
                        </span>
                        <p className="font-semibold text-foreground leading-relaxed">
                          A checklist based on the programme’s published requirements.
                        </p>
                      </div>

                      {/* Right: Official Source */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase block font-semibold">
                          OFFICIAL SOURCE
                        </span>
                        <p className="font-medium text-muted-foreground leading-relaxed">
                          {match.officialUrl ? (
                            <a
                              href={match.officialUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary hover:underline inline-flex items-center gap-1"
                            >
                              Official portal verified <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            'Source to confirm · Official link not available yet.'
                          )}
                        </p>
                      </div>
                    </div>

                    {/* BLUE INFO BOX (BEFORE YOU APPLY) */}
                    <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-3">
                      <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300 block">
                          BEFORE YOU APPLY
                        </span>
                        <p className="text-xs text-blue-900/80 dark:text-blue-200/80 leading-relaxed">
                          When an official source is verified, you can prepare required documents and
                          propose preparation tasks to your Operational Roadmap.
                        </p>
                      </div>
                    </div>

                    {/* Expanded Footer Actions */}
                    <div className="pt-3 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => setSelectedAuditMatch(match)}
                          className="px-3.5 py-1.5 rounded-lg bg-card hover:bg-muted border border-border text-foreground font-semibold text-xs transition-colors"
                        >
                          Check my details
                        </button>
                        <button
                          onClick={() => setSelectedAuditMatch(match)}
                          className="px-3.5 py-1.5 rounded-lg bg-card hover:bg-muted border border-border text-foreground font-semibold text-xs transition-colors"
                        >
                          Audit Details
                        </button>
                        <button
                          onClick={() => handleToggleBookmark(match)}
                          className={`px-3.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                            isSaved
                              ? 'bg-primary/10 border-primary text-primary'
                              : 'bg-card border-border hover:bg-muted text-foreground'
                          }`}
                        >
                          <Bookmark className="w-3.5 h-3.5" />
                          <span>{isSaved ? 'Saved' : 'Save this option'}</span>
                        </button>
                        <button
                          onClick={() => handleOpenStateModal(match)}
                          className="px-3 py-1.5 rounded-lg bg-card hover:bg-muted border border-border text-foreground text-xs font-semibold transition-colors inline-flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Track Application</span>
                        </button>
                      </div>

                      <div className="flex flex-col sm:items-end gap-0.5">
                        {match.officialUrl ? (
                          <a
                            href={match.officialUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold transition-colors inline-flex items-center gap-1.5 shadow-sm"
                          >
                            <span>Open official website</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <>
                            <button
                              disabled
                              className="px-4 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs font-semibold cursor-not-allowed opacity-60"
                            >
                              Open official website
                            </button>
                            <span className="text-[10px] text-muted-foreground">
                              Official link not available yet.
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>

      {/* COMPONENT 5: QUIET JOURNEY FOOTER (FIGMA 57221:11932) */}
      <footer className="pt-6 border-t border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href={`/dashboard/creator/phase-4/skills?ideaId=${ideaId}`}
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Skills & Training</span>
        </Link>

        <span className="text-xs text-muted-foreground text-center sm:text-left">
          You can return to your saved support options later.
        </span>

        <Link
          href={`/dashboard/creator/phase-4/pricing?ideaId=${ideaId}`}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm transition-all shadow"
        >
          <span>Continue to Pricing & Revenue</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </footer>

      {/* AUDIT DETAILS MODAL (Component 6) */}
      {selectedAuditMatch && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl animate-in fade-in-50 zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-border pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase text-primary font-semibold tracking-wider">
                  Audit Provenance & Eligibility Trace
                </span>
                <h2 className="text-base font-bold text-foreground mt-0.5">
                  {selectedAuditMatch.name}
                </h2>
              </div>
              <button
                onClick={() => setSelectedAuditMatch(null)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scheme Metadata */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-muted/40 p-3 rounded-xl border border-border">
                <span className="text-muted-foreground block text-[10px] uppercase font-mono font-semibold">
                  Programme Owner
                </span>
                <span className="text-foreground font-medium">
                  {selectedAuditMatch.programmeOwner || 'Public Authority'}
                </span>
              </div>
              <div className="bg-muted/40 p-3 rounded-xl border border-border">
                <span className="text-muted-foreground block text-[10px] uppercase font-mono font-semibold">
                  Managing Authority
                </span>
                <span className="text-foreground font-medium">
                  {selectedAuditMatch.managingAuthority || 'Regional/National Body'}
                </span>
              </div>
              <div className="bg-muted/40 p-3 rounded-xl border border-border">
                <span className="text-muted-foreground block text-[10px] uppercase font-mono font-semibold">
                  Catalogue Source
                </span>
                <span className="text-foreground font-medium">
                  {selectedAuditMatch.catalogueSource}
                </span>
              </div>
              <div className="bg-muted/40 p-3 rounded-xl border border-border">
                <span className="text-muted-foreground block text-[10px] uppercase font-mono font-semibold">
                  Selection Dimension
                </span>
                <span className="text-foreground font-medium">
                  {selectedAuditMatch.selectionMode}
                </span>
              </div>
            </div>

            {/* Conditions Met / Missing / Failed */}
            <div className="space-y-3 text-xs">
              <h4 className="font-bold text-foreground">Conditions Met:</h4>
              <div className="space-y-1.5 pl-2">
                {(selectedAuditMatch.conditionsMet || []).map((c, i) => (
                  <div key={i} className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span>{c}</span>
                  </div>
                ))}
              </div>

              {selectedAuditMatch.conditionsMissing &&
                selectedAuditMatch.conditionsMissing.length > 0 && (
                  <>
                    <h4 className="font-bold text-amber-600 dark:text-amber-400 pt-2">
                      Missing / Information Needed:
                    </h4>
                    <div className="space-y-1.5 pl-2">
                      {selectedAuditMatch.conditionsMissing.map((c, i) => (
                        <div key={i} className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-medium">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{c}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

              {selectedAuditMatch.conditionsFailed &&
                selectedAuditMatch.conditionsFailed.length > 0 && (
                  <>
                    <h4 className="font-bold text-destructive pt-2">Ineligible Conditions:</h4>
                    <div className="space-y-1.5 pl-2">
                      {selectedAuditMatch.conditionsFailed.map((c, i) => (
                        <div key={i} className="flex items-center gap-2 text-destructive font-medium">
                          <XCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{c}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
            </div>

            {/* Checklist & Document Reuse */}
            {(() => {
              const checklist = (plan.applicationChecklists || []).find(
                (c) => c.opportunityKey === selectedAuditMatch.key
              );
              if (!checklist) return null;
              return (
                <div className="space-y-2 text-xs border-t border-border pt-3">
                  <h4 className="font-bold text-foreground">
                    Application Checklist & MBC Artifact Reuse:
                  </h4>
                  <div className="space-y-2">
                    {checklist.items.map((item) => (
                      <div
                        key={item.key}
                        className="bg-muted/40 p-3 rounded-xl border border-border flex items-center justify-between gap-3"
                      >
                        <div>
                          <div className="text-foreground font-medium">{item.label}</div>
                          {item.existingArtifactReference && (
                            <div className="text-[11px] text-primary mt-0.5 font-medium">
                              Reuses: {item.existingArtifactReference}
                            </div>
                          )}
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold font-mono ${
                            item.status === 'Ready'
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            <div className="flex justify-end pt-2 border-t border-border">
              <button
                onClick={() => setSelectedAuditMatch(null)}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TRACK APPLICATION PROGRESS MODAL (Component 7) */}
      {editingMatchKey && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in fade-in-50 zoom-in-95">
            <h3 className="text-base font-bold text-foreground">Track Application Progress</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Record your personal progress for this support opportunity. Your progress is preserved
              across catalog refreshes.
            </p>

            <div className="space-y-3 pt-1">
              <label className="text-xs font-semibold text-foreground block">
                Application State
              </label>
              <select
                value={targetState}
                onChange={(e) => setTargetState(e.target.value as FounderApplicationState)}
                className="w-full bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="NotStarted">Not Started</option>
                <option value="Reviewing">Reviewing Guidelines</option>
                <option value="Preparing">Preparing Dossier</option>
                <option value="ReadyToApply">Ready to Submit</option>
                <option value="Applied">Application Submitted</option>
                <option value="Awarded">Awarded / Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Skipped">Skipped / Not Relevant</option>
              </select>

              <label className="text-xs font-semibold text-foreground block">Founder Notes</label>
              <textarea
                value={founderNotesInput}
                onChange={(e) => setFounderNotesInput(e.target.value)}
                placeholder="e.g. Discussed with advisor, application deadline next month..."
                className="w-full bg-muted/40 border border-border rounded-xl p-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary min-h-[80px]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
              <button
                onClick={() => setEditingMatchKey(null)}
                className="px-4 py-2 rounded-xl text-muted-foreground hover:text-foreground text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveState(editingMatchKey)}
                disabled={isSubmittingState}
                className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold transition-all shadow disabled:opacity-50"
              >
                {isSubmittingState ? 'Saving...' : 'Save Progress'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PHASE 4.6 NEXT MILESTONE BANNER (Component 8 - Satisfies Test 8) */}
      <div className="bg-gradient-to-r from-primary/10 via-card to-card border border-border/80 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center md:text-left">
          <span className="text-[10px] uppercase font-mono tracking-widest text-primary block font-semibold">
            PHASE 4.6 READY · NEXT OPERATIONAL MILESTONE
          </span>
          <h4 className="text-sm font-bold text-foreground">Pricing & Revenue Model Engine</h4>
          <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
            Turn your business model, customer segments, cost structure, and forecast assumptions
            into a financially viable, French-compliant launch pricing strategy.
          </p>
        </div>
        <Link
          href={`/dashboard/creator/phase-4/pricing?ideaId=${encodeURIComponent(ideaId)}`}
          className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs shadow shrink-0 flex items-center gap-2 transition-all"
        >
          <span>Build My Pricing Strategy</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
