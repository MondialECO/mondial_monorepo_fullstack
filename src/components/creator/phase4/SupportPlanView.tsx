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
    const isNeedsStale =
      gateError.message.includes('Needs') ||
      gateError.code === 'NEEDS_ANALYSIS_REFRESH_REQUIRED';
    const isSkillsStale =
      gateError.code === 'SKILLS_PLAN_REFRESH_REQUIRED' ||
      gateError.message.includes('Skills');
    const isPhase3Gate = gateError.message.includes('Phase 3');

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
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            {isNeedsStale && (
              <Link
                href={`/dashboard/creator/phase-4/needs?ideaId=${ideaId}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm transition-all shadow"
              >
                <span>Go to Step 4.3 Needs Analysis</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
            {isSkillsStale && (
              <Link
                href={`/dashboard/creator/phase-4/skills?ideaId=${ideaId}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm transition-all shadow"
              >
                <span>Go to Step 4.4 Skills & Training</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
            {isPhase3Gate && (
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
      <section className="p-7 rounded-2xl bg-card border border-border/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-[28px] font-bold text-foreground tracking-tight font-heading leading-tight">
              {totalOptions} options to explore
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground font-sans">
              Based on your project, learning needs and current situation.
            </p>
          </div>
          <Link
            href={`/dashboard/creator/profile?ideaId=${ideaId}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline transition-colors shrink-0 font-sans"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Update my details</span>
          </Link>
        </div>

        {/* Tags Strip */}
        <div className="flex items-center gap-2 flex-wrap text-sm text-foreground font-medium font-sans">
          <span className="px-3 py-1 rounded-full bg-muted border border-border/60 text-xs sm:text-sm">
            France
          </span>
          {profileSummary?.currentSituation && (
            <>
              <span className="text-muted-foreground text-xs">•</span>
              <span className="px-3 py-1 rounded-full bg-muted border border-border/60 text-xs sm:text-sm">
                {profileSummary.currentSituation}
              </span>
            </>
          )}
          {profileSummary?.weeklyAvailability && (
            <>
              <span className="text-muted-foreground text-xs">•</span>
              <span className="px-3 py-1 rounded-full bg-muted border border-border/60 text-xs sm:text-sm">
                {profileSummary.weeklyAvailability}
              </span>
            </>
          )}
          <span className="text-muted-foreground text-xs">•</span>
          <span className="px-3 py-1 rounded-full bg-muted border border-border/60 text-xs sm:text-sm">
            Project in preparation
          </span>
        </div>

        {/* Quiet Footnote */}
        <p className="text-xs text-muted-foreground pt-4 border-t border-border/50 font-sans leading-relaxed">
          Each programme has its own conditions and application process. Saving an option does not
          submit an application.
        </p>
      </section>

      {/* COMPONENT 2: LOCATION CARD (FIGMA 57221:11932) */}
      <section className="p-7 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3">
        <div className="space-y-1">
          <h3 className="text-lg sm:text-xl font-bold text-foreground font-heading">
            Where will you start your business?
          </h3>
          <p className="text-sm text-muted-foreground font-sans">This helps us check local support.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 max-w-md pt-1">
          <div className="relative flex-1">
            <MapPin className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              placeholder="City or postcode (e.g. Lyon, 69002)"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-muted/40 border border-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-sans"
            />
          </div>
          <button
            onClick={handleSaveLocation}
            disabled={isSavingLocation || !locationInput.trim()}
            className="px-5 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-secondary-foreground font-medium text-sm transition-colors shrink-0 disabled:opacity-50 flex items-center justify-center gap-1.5 font-sans"
          >
            {isSavingLocation ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : locationSavedSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-500" />
                <span>Saved ✓</span>
              </>
            ) : (
              <span>Save location</span>
            )}
          </button>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed font-sans pt-1">
          Reused from your declared project country (France). Other details are requested only when
          required by a specific programme.
        </p>
      </section>


      {/* MISSING ELIGIBILITY FACTS ASSISTANT */}
      {plan.missingEligibilityFacts && plan.missingEligibilityFacts.length > 0 && (
        <section className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-semibold text-xs font-sans">
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
                  <div className="text-xs font-semibold text-foreground font-sans">{fact.question}</div>
                  <div className="text-xs text-muted-foreground leading-relaxed font-sans">
                    {fact.whyNeeded}
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  {fact.dataType === 'boolean' ? (
                    <>
                      <button
                        onClick={() => handleFactResponse(fact.key, 'true')}
                        disabled={answeringFactKey === fact.key}
                        className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold transition-colors font-sans"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => handleFactResponse(fact.key, 'false')}
                        disabled={answeringFactKey === fact.key}
                        className="px-3.5 py-1.5 rounded-lg bg-card hover:bg-muted border border-border text-foreground text-xs font-semibold transition-colors font-sans"
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
                          className="px-2.5 py-1 rounded-md bg-card hover:bg-muted border border-border text-foreground text-xs font-medium font-sans"
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
                      className="bg-muted/40 border border-border rounded-lg px-2.5 py-1 text-xs text-foreground w-full font-sans"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* COMPONENT 3: OPPORTUNITY CARDS LIST (FIGMA 57221:11932) */}
      <div className="space-y-4">
        {allMatches.length === 0 ? (
          <div className="bg-card border border-border/80 rounded-2xl p-12 text-center text-muted-foreground space-y-2">
            <Compass className="w-8 h-8 mx-auto text-muted-foreground/60" />
            <div className="text-sm font-semibold text-foreground font-sans">
              No matching support schemes identified yet.
            </div>
            <div className="text-xs font-sans">
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
                className={`rounded-2xl bg-card border border-border/80 shadow-xs hover:border-border transition-all ${
                  isExpanded ? 'p-8 space-y-4' : 'p-7 space-y-4'
                }`}
              >
                {/* Top Row: Pill badges & Toggle */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 flex-wrap font-sans">
                    {/* Category Badge */}
                    <span className="px-2.5 py-1 rounded-full bg-muted text-xs font-medium text-muted-foreground">
                      {categoryLabel}
                    </span>

                    {/* Status Badge */}
                    {isAwarded ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#E5F7ED] dark:bg-emerald-950/40 text-[#157A55] dark:text-emerald-400 border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#157A55] dark:bg-emerald-400" />
                        Awarded
                      </span>
                    ) : isEligibleStatutory ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#E5F7ED] dark:bg-emerald-950/40 text-[#157A55] dark:text-emerald-400 border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#157A55] dark:bg-emerald-400" />
                        Eligible (Statutory)
                      </span>
                    ) : isEligibleToApply ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        Eligible to Apply
                      </span>
                    ) : isNeedsCheck ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FEF7EC] dark:bg-amber-950/40 text-[#965F11] dark:text-amber-400 border border-amber-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#965F11] dark:bg-amber-400" />
                        A few details to check
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#DCE1FF] dark:bg-blue-950/40 text-[#1A47C3] dark:text-blue-300 border border-blue-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#1A47C3] dark:bg-blue-400" />
                        May fit your project
                      </span>
                    )}

                    {/* Saved State Badge if tracked */}
                    {isSaved && (
                      <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                        {match.founderApplicationState}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => toggleExpand(match.key, index)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Scheme Header Info */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <h3
                      className={`font-bold text-foreground font-heading tracking-tight ${
                        isExpanded ? 'text-2xl sm:text-[28px]' : 'text-lg sm:text-xl'
                      }`}
                    >
                      {match.name}
                    </h3>
                    <p className="text-sm sm:text-base font-medium text-foreground font-sans leading-snug">
                      {match.supportValueDescription || match.description}
                    </p>
                    <p className="text-sm text-muted-foreground font-sans leading-relaxed pt-0.5">
                      {match.whyMatched?.[0] ||
                        'You are preparing an early-stage project and may benefit from guidance.'}
                    </p>
                    <div className="text-xs text-muted-foreground font-sans pt-1 flex items-center gap-2 flex-wrap">
                      <span>
                        Official details:{' '}
                        <span className="font-medium text-foreground">
                          {match.programmeOwner || match.managingAuthority || 'To be confirmed'}
                        </span>
                      </span>
                      {match.catalogueSource && (
                        <span className="text-muted-foreground/80 font-mono">via {match.catalogueSource}</span>
                      )}
                    </div>
                  </div>

                  {/* Collapsed Right Action Buttons (Figma 57221:11932 CARD COMPACT) */}
                  {!isExpanded && (
                    <div className="flex items-center gap-3 shrink-0 self-start sm:self-center font-sans pt-2 sm:pt-0">
                      <button
                        onClick={() => handleToggleBookmark(match)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5 ${
                          isSaved
                            ? 'bg-primary/10 border border-primary text-primary'
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                        }`}
                      >
                        <Bookmark className="w-4 h-4" />
                        <span>{isSaved ? 'Saved' : 'Save this option'}</span>
                      </button>

                      <button
                        onClick={() => toggleExpand(match.key, index)}
                        className="px-4 py-2 rounded-xl bg-card border border-border/80 text-primary hover:bg-muted font-medium text-sm transition-colors inline-flex items-center gap-1.5"
                      >
                        <span>View details</span>
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* EXPANDED INSET PANEL (FIGMA 57221:11932 CARD EXPANDED) */}
                {isExpanded && (
                  <div className="p-6 sm:p-7 rounded-xl bg-muted/30 border border-border/70 space-y-5 animate-fadeIn">
                    {/* 2-Column Analytical Breakdown */}
                    {(() => {
                      const matchChecklist = (plan.applicationChecklists || []).find(
                        (c) =>
                          c.opportunityKey === match.key ||
                          c.opportunityId === match.opportunityId
                      );

                      const checks =
                        match.conditionsMissing && match.conditionsMissing.length > 0
                          ? match.conditionsMissing
                          : match.supportType === 'TrainingFunding'
                          ? [
                              'Your location and declared region',
                              'The selected training or development scope from your Skills Plan',
                              'Whether the programme supports that scope',
                              'The relevant application conditions',
                              'Whether applications are currently open',
                            ]
                          : match.supportType === 'SocialContributionExemption'
                          ? [
                              'Your business registration date (within 45 days of formation)',
                              'Selected legal form and founder corporate mandate',
                              'Eligibility of social security regime with URSSAF',
                              'Whether applications are currently open',
                            ]
                          : match.supportType === 'HonorLoan' || match.supportType === 'Loan'
                          ? [
                              'Your local platform territory in France',
                              'The amount of equity co-financing needed',
                              '3-year financial forecast and cash flow viability',
                              'Whether applications are currently open',
                            ]
                          : [
                              'Your location',
                              'Whether your venture meets the specific criteria of this scheme',
                              'Applicable deadlines and submission requirements',
                              'Whether applications are currently open',
                            ];

                      const mayNeedSummary =
                        matchChecklist && matchChecklist.items.length > 0
                          ? matchChecklist.items.map((i) => i.label).join(' • ')
                          : 'A checklist based on the programme’s published requirements.';

                      return (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                          {/* Left: What You Could Get */}
                          <div className="space-y-1">
                            <span className="text-xs font-mono tracking-wider text-muted-foreground uppercase block font-semibold">
                              WHAT YOU COULD GET
                            </span>
                            <p className="font-normal text-foreground leading-relaxed">
                              {match.supportValueDescription ||
                                'Help with eligible project costs, depending on the programme’s rules.'}
                            </p>
                          </div>

                          {/* Right: Why This May Fit */}
                          <div className="space-y-1">
                            <span className="text-xs font-mono tracking-wider text-muted-foreground uppercase block font-semibold">
                              WHY THIS MAY FIT
                            </span>
                            <p className="font-normal text-foreground leading-relaxed">
                              {match.whyMatched && match.whyMatched.length > 0
                                ? match.whyMatched.join(' ')
                                : 'Aligned with your project goals, founder situation, and operational roadmap.'}
                            </p>
                          </div>

                          {/* Left: What We Already Know */}
                          <div className="space-y-1">
                            <span className="text-xs font-mono tracking-wider text-muted-foreground uppercase block font-semibold">
                              WHAT WE ALREADY KNOW
                            </span>
                            <p className="font-normal text-foreground leading-relaxed">
                              You are{' '}
                              {profileSummary?.currentSituation
                                ? `a ${profileSummary.currentSituation.toLowerCase()}`
                                : 'an entrepreneur'}{' '}
                              preparing a project{locationInput ? ` in ${locationInput}` : ' in France'}.
                            </p>
                          </div>

                          {/* Right: When To Apply */}
                          <div className="space-y-1">
                            <span className="text-xs font-mono tracking-wider text-muted-foreground uppercase block font-semibold">
                              WHEN TO APPLY
                            </span>
                            <p className="font-normal text-foreground leading-relaxed">
                              {match.timing?.timingNotes ||
                                (match.timing?.rolling
                                   ? 'Rolling programme — applications open year-round.'
                                   : 'Application dates need checking.')}
                            </p>
                          </div>

                          {/* Full Row: What To Check */}
                          <div className="space-y-2 sm:col-span-2 pt-1">
                            <span className="text-xs font-mono tracking-wider text-muted-foreground uppercase block font-semibold">
                              WHAT TO CHECK
                            </span>
                            <ul className="space-y-2 pt-0.5">
                              {checks.map((checkItem, idx) => (
                                <li
                                  key={idx}
                                  className="flex items-center gap-2.5 font-normal text-foreground text-sm"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 shrink-0" />
                                  <span>{checkItem}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Left: What You May Need */}
                          <div className="space-y-1">
                            <span className="text-xs font-mono tracking-wider text-muted-foreground uppercase block font-semibold">
                              WHAT YOU MAY NEED
                            </span>
                            <p className="font-normal text-foreground leading-relaxed">
                              {mayNeedSummary}
                            </p>
                          </div>

                          {/* Right: Official Source */}
                          <div className="space-y-1">
                            <span className="text-xs font-mono tracking-wider text-muted-foreground uppercase block font-semibold">
                              OFFICIAL SOURCE
                            </span>
                            <p className="font-normal text-muted-foreground leading-relaxed">
                              {match.officialUrl ? (
                                <a
                                  href={match.officialUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-primary hover:underline inline-flex items-center gap-1.5 font-medium"
                                >
                                  Official portal verified <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              ) : (
                                'Source to confirm · Official link not available yet.'
                              )}
                            </p>
                          </div>
                        </div>
                      );
                    })()}

                    {/* BLUE INFO BOX (BEFORE YOU APPLY) */}
                    <div className="p-4 sm:p-5 rounded-xl bg-card border border-border/80 flex items-start gap-3 shadow-xs">
                      <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-foreground block">
                          BEFORE YOU APPLY
                        </span>
                        <p className="text-sm text-muted-foreground leading-relaxed font-sans">
                          When an official source is verified, you can prepare required documents and
                          propose preparation tasks to your Operational Roadmap.
                        </p>
                      </div>
                    </div>

                    {/* Expanded Footer Actions */}
                    <div className="pt-4 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <button
                          onClick={() => setSelectedAuditMatch(match)}
                          className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium text-sm transition-colors"
                        >
                          Check my details
                        </button>
                        <button
                          onClick={() => setSelectedAuditMatch(match)}
                          className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium text-sm transition-colors"
                        >
                          Audit Details
                        </button>
                        <button
                          onClick={() => handleToggleBookmark(match)}
                          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5 ${
                            isSaved
                              ? 'bg-primary/10 border border-primary text-primary'
                              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                          }`}
                        >
                          <Bookmark className="w-4 h-4" />
                          <span>{isSaved ? 'Saved' : 'Save this option'}</span>
                        </button>
                        <button
                          onClick={() => handleOpenStateModal(match)}
                          className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-secondary-foreground text-sm font-medium transition-colors inline-flex items-center gap-1.5"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Track Application</span>
                        </button>
                      </div>

                      <div className="flex flex-col sm:items-end gap-1">
                        {match.officialUrl ? (
                          <a
                            href={match.officialUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition-colors inline-flex items-center gap-1.5 shadow-sm"
                          >
                            <span>Open official website</span>
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        ) : (
                          <>
                            <button
                              disabled
                              className="px-5 py-2.5 rounded-xl bg-muted text-muted-foreground text-sm font-medium cursor-not-allowed opacity-60"
                            >
                              Open official website
                            </button>
                            <span className="text-xs text-muted-foreground">
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

      {/* COMPONENT 4: JOURNEY FOOTER (FIGMA 57221:11932) */}
      <footer className="pt-6 border-t border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-sans">
        <Link
          href={`/dashboard/creator/phase-4/skills?ideaId=${ideaId}`}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-secondary-foreground text-sm font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Skills & Training</span>
        </Link>

        <span className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
          You can return to your saved support options later.
        </span>

        <Link
          href={`/dashboard/creator/phase-4/pricing?ideaId=${ideaId}`}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm transition-all shadow-sm"
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

    </div>
  );
}
