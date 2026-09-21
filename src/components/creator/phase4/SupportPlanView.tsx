'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Award,
  Landmark,
  ShieldCheck,
  FileCheck2,
  AlertCircle,
  Clock,
  ArrowRight,
  RefreshCw,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Edit3,
  Check,
  ExternalLink,
  Info,
  Layers,
  Lock,
  FileText,
  Building2,
  Calendar,
  DollarSign,
  Briefcase,
  HelpCircle,
  XCircle,
  CheckCircle2,
  Compass,
} from 'lucide-react';
import type {
  SupportPlan,
  SupportMatch,
  MissingEligibilityFact,
  SupportApplicationChecklist,
  EligibilityStatus,
  SelectionMode,
  FounderApplicationState,
  UpdateFounderSupportStateRequest,
} from '@/types/creator/support';

interface SupportPlanViewProps {
  ideaId: string;
  projectName: string;
  plan: SupportPlan | null;
  updateAvailable: boolean;
  changedSources: string[];
  isLoading: boolean;
  gateError?: { code: string; message: string } | null;
  onGenerate: () => Promise<void>;
  onRefresh: () => Promise<void>;
  onUpdateState: (matchKey: string, req: UpdateFounderSupportStateRequest) => Promise<void>;
  onAnswerFact: (factKey: string, value: string) => Promise<void>;
}

type TabType =
  | 'ALL'
  | 'RECOMMENDED'
  | 'GRANTS'
  | 'EXEMPTIONS'
  | 'FINANCING'
  | 'EMPLOYMENT'
  | 'INNOVATION'
  | 'REGIONAL'
  | 'EUROPEAN';

export function SupportPlanView({
  ideaId,
  projectName,
  plan,
  updateAvailable,
  changedSources,
  isLoading,
  gateError,
  onGenerate,
  onRefresh,
  onUpdateState,
  onAnswerFact,
}: SupportPlanViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('ALL');
  const [selectedMatch, setSelectedMatch] = useState<SupportMatch | null>(null);
  const [editingMatchKey, setEditingMatchKey] = useState<string | null>(null);
  const [targetState, setTargetState] = useState<FounderApplicationState>('NotStarted');
  const [founderNotesInput, setFounderNotesInput] = useState<string>('');
  const [isSubmittingState, setIsSubmittingState] = useState<boolean>(false);
  const [answeringFactKey, setAnsweringFactKey] = useState<string | null>(null);

  // Gate blocked state
  if (gateError) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="bg-red-950/40 border border-red-800/60 rounded-xl p-8 text-center space-y-4 shadow-xl">
          <div className="inline-flex p-3 rounded-full bg-red-900/40 border border-red-700/60 text-red-300">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-semibold text-red-200">Support Engine Unavailable</h2>
          <p className="text-zinc-400 max-w-lg mx-auto text-sm leading-relaxed">
            {gateError.message}
          </p>
          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            {gateError.code === 'SKILLS_PLAN_REFRESH_REQUIRED' || gateError.message.includes('Skills') ? (
              <Link
                href={`/dashboard/creator/phase-4/skills?ideaId=${ideaId}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-colors shadow-lg"
              >
                Go to Step 4.4 Skills & Training
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : gateError.message.includes('Needs') ? (
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

  // Not generated state
  if (!plan) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-10 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="inline-flex p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Landmark className="w-12 h-12" />
          </div>
          <div className="space-y-2 max-w-xl mx-auto">
            <h2 className="text-2xl font-bold tracking-tight text-white font-serif">
              Aids, Grants & Public Support Engine
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Match <span className="text-zinc-200 font-medium">{projectName || 'your venture'}</span> with relevant public, institutional, regional, national, and European support opportunities based on official, versioned source data.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left max-w-2xl mx-auto py-2">
            <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                Deterministic Eligibility
              </div>
              <p className="text-xs text-zinc-500">
                Audited against authoritative conditions from France Travail, URSSAF, Bpifrance, and Region portals.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-1.5">
              <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold">
                <Compass className="w-4 h-4" />
                Application Readiness
              </div>
              <p className="text-xs text-zinc-500">
                Automatically connects your Phase 3 Business Plan, Financial Forecast, and Phase 4.4 Skills Plan.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-1.5">
              <div className="flex items-center gap-2 text-purple-400 text-xs font-semibold">
                <ShieldCheck className="w-4 h-4" />
                Award vs Apply Safety
              </div>
              <p className="text-xs text-zinc-500">
                Discretionary and competitive schemes explicitly marked &quot;Eligible to Apply&quot; without fake success rates.
              </p>
            </div>
          </div>

          <button
            onClick={onGenerate}
            disabled={isLoading}
            className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-all shadow-lg hover:shadow-emerald-900/30 active:scale-[0.98] disabled:opacity-50"
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

  // Filter matches based on active tab
  const allMatches = plan.matches || [];
  const filteredMatches = allMatches.filter((match) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'RECOMMENDED') return (plan.topMatches || []).some((m) => m.key === match.key);
    if (activeTab === 'GRANTS') return match.supportType === 'Grant' || match.supportType === 'Subsidy';
    if (activeTab === 'EXEMPTIONS') return match.supportType === 'SocialContributionExemption' || match.supportType === 'TaxRelief';
    if (activeTab === 'FINANCING') return match.supportType === 'Loan' || match.supportType === 'HonorLoan' || match.supportType === 'Guarantee';
    if (activeTab === 'EMPLOYMENT') return match.supportType === 'Allowance' || match.supportType === 'EmploymentSupport' || match.supportType === 'TrainingFunding';
    if (activeTab === 'INNOVATION') return match.supportType === 'InnovationSupport' || match.name.toLowerCase().includes('french tech') || match.name.toLowerCase().includes('innov');
    if (activeTab === 'REGIONAL') return match.supportType === 'RegionalSupport' || match.key.includes('ile-de-france') || match.key.includes('hauts-de-france');
    if (activeTab === 'EUROPEAN') return match.supportType === 'EuropeanFunding' || match.key.includes('european');
    return true;
  });

  const summary = plan.summary || {
    eligibleCount: allMatches.filter((m) => m.eligibilityStatus === 'Eligible').length,
    potentialCount: allMatches.filter((m) => m.eligibilityStatus === 'PotentiallyEligible').length,
    needsInfoCount: allMatches.filter((m) => m.eligibilityStatus === 'NeedsInformation').length,
    readyToPrepareCount: allMatches.filter((m) => m.applicationReadiness === 'ReadyToApply').length,
    actionCount: allMatches.filter((m) => m.founderApplicationState !== 'NotStarted').length,
    topMatchCount: (plan.topMatches || []).length,
    totalEvaluatedCount: allMatches.length,
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

  const handleFactResponse = async (factKey: string, value: string) => {
    setAnsweringFactKey(factKey);
    try {
      await onAnswerFact(factKey, value);
    } finally {
      setAnsweringFactKey(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-mono tracking-widest text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
              Phase 4.5
            </span>
            <span className="text-xs text-zinc-500 font-mono">Official Open Data & Authority Verified</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            Aids, Grants & Public Support Engine
          </h1>
          <p className="text-sm text-zinc-400 max-w-2xl">
            Deterministic eligibility matching and application readiness across French national, regional, and European programmes for{' '}
            <span className="text-zinc-200 font-medium">{projectName || 'your venture'}</span>.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-200 text-xs font-medium transition-colors disabled:opacity-50"
            title="Re-evaluates matches against latest source catalog while preserving your application decisions"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Opportunities
          </button>
        </div>
      </div>

      {/* Staleness Banner */}
      {updateAvailable && (
        <div className="bg-amber-950/30 border border-amber-800/60 rounded-xl p-4 flex items-center justify-between gap-4 text-amber-200 text-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <span className="font-semibold">Upstream project sources changed:</span>{' '}
              <span className="text-amber-300 font-mono text-xs">{changedSources.join(', ')}</span>.
              Refresh your Support Plan to incorporate updated venture facts.
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

      {/* Hero Metrics — Strictly Counts Only, No Fake Probabilities or Fabricated Totals */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-4 space-y-1">
          <div className="text-[11px] font-mono uppercase text-zinc-500">Evaluated</div>
          <div className="text-2xl font-bold text-white font-mono">{summary.totalEvaluatedCount}</div>
          <div className="text-[11px] text-zinc-500">Catalog Schemes</div>
        </div>

        <div className="bg-emerald-950/20 border border-emerald-800/40 rounded-xl p-4 space-y-1">
          <div className="text-[11px] font-mono uppercase text-emerald-400">Eligible / Apply</div>
          <div className="text-2xl font-bold text-emerald-300 font-mono">{summary.eligibleCount}</div>
          <div className="text-[11px] text-emerald-500/80">Authoritative match</div>
        </div>

        <div className="bg-blue-950/20 border border-blue-800/40 rounded-xl p-4 space-y-1">
          <div className="text-[11px] font-mono uppercase text-blue-400">Potential</div>
          <div className="text-2xl font-bold text-blue-300 font-mono">{summary.potentialCount}</div>
          <div className="text-[11px] text-blue-500/80">Pending minor facts</div>
        </div>

        <div className="bg-amber-950/20 border border-amber-800/40 rounded-xl p-4 space-y-1">
          <div className="text-[11px] font-mono uppercase text-amber-400">Missing Info</div>
          <div className="text-2xl font-bold text-amber-300 font-mono">{summary.needsInfoCount}</div>
          <div className="text-[11px] text-amber-500/80">Requires input</div>
        </div>

        <div className="bg-purple-950/20 border border-purple-800/40 rounded-xl p-4 space-y-1">
          <div className="text-[11px] font-mono uppercase text-purple-400">Ready to Apply</div>
          <div className="text-2xl font-bold text-purple-300 font-mono">{summary.readyToPrepareCount}</div>
          <div className="text-[11px] text-purple-500/80">MBC Docs Ready</div>
        </div>

        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-4 space-y-1">
          <div className="text-[11px] font-mono uppercase text-zinc-400">Founder Tracking</div>
          <div className="text-2xl font-bold text-zinc-200 font-mono">{summary.actionCount}</div>
          <div className="text-[11px] text-zinc-500">In Preparation</div>
        </div>
      </div>

      {/* Missing Eligibility Facts Inline Assistant */}
      {plan.missingEligibilityFacts && plan.missingEligibilityFacts.length > 0 && (
        <div className="bg-zinc-900/60 border border-amber-800/40 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-amber-300 font-medium text-sm">
            <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Clarify Venture Facts to Unlock Deterministic Eligibility ({plan.missingEligibilityFacts.length} Questions)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plan.missingEligibilityFacts.map((fact) => (
              <div
                key={fact.key}
                className="bg-zinc-950/60 border border-zinc-800 rounded-lg p-4 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-zinc-200">{fact.question}</div>
                  <div className="text-[11px] text-zinc-400 leading-relaxed">{fact.whyNeeded}</div>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  {fact.dataType === 'boolean' ? (
                    <>
                      <button
                        onClick={() => handleFactResponse(fact.key, 'true')}
                        disabled={answeringFactKey === fact.key}
                        className="px-3 py-1 rounded bg-zinc-800 hover:bg-emerald-600 text-zinc-200 hover:text-white text-xs font-medium transition-colors"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => handleFactResponse(fact.key, 'false')}
                        disabled={answeringFactKey === fact.key}
                        className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
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
                          className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs"
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
                      className="bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1 text-xs text-zinc-200 w-full"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-zinc-800 scrollbar-none">
        {(
          [
            { id: 'ALL', label: 'All Opportunities', count: allMatches.length },
            { id: 'RECOMMENDED', label: 'Top Matches', count: (plan.topMatches || []).length },
            { id: 'GRANTS', label: 'Grants & Subsidies', count: allMatches.filter((m) => m.supportType === 'Grant' || m.supportType === 'Subsidy').length },
            { id: 'EXEMPTIONS', label: 'Social & Tax Relief', count: allMatches.filter((m) => m.supportType === 'SocialContributionExemption' || m.supportType === 'TaxRelief').length },
            { id: 'FINANCING', label: 'Loans & Guarantees', count: allMatches.filter((m) => m.supportType === 'Loan' || m.supportType === 'HonorLoan' || m.supportType === 'Guarantee').length },
            { id: 'EMPLOYMENT', label: 'Employment & Skills', count: allMatches.filter((m) => m.supportType === 'Allowance' || m.supportType === 'EmploymentSupport' || m.supportType === 'TrainingFunding').length },
            { id: 'INNOVATION', label: 'Innovation & Tech', count: allMatches.filter((m) => m.supportType === 'InnovationSupport' || m.name.toLowerCase().includes('french tech') || m.name.toLowerCase().includes('innov')).length },
            { id: 'REGIONAL', label: 'Regional Aids', count: allMatches.filter((m) => m.supportType === 'RegionalSupport' || m.key.includes('ile-de-france') || m.key.includes('hauts-de-france')).length },
            { id: 'EUROPEAN', label: 'European', count: allMatches.filter((m) => m.supportType === 'EuropeanFunding' || m.key.includes('european')).length },
          ] as { id: TabType; label: string; count: number }[]
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-zinc-100 text-zinc-950 shadow-md font-semibold'
                : 'bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {tab.label}
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === tab.id ? 'bg-zinc-300 text-zinc-950' : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Matches Grid */}
      <div className="grid grid-cols-1 gap-4">
        {filteredMatches.length === 0 ? (
          <div className="bg-zinc-900/30 border border-zinc-800/60 rounded-xl p-12 text-center text-zinc-500 space-y-2">
            <Compass className="w-8 h-8 mx-auto text-zinc-600" />
            <div className="text-sm font-medium text-zinc-400">No opportunities match this category filter.</div>
            <div className="text-xs">Switch to &quot;All Opportunities&quot; or refresh your criteria.</div>
          </div>
        ) : (
          filteredMatches.map((match) => {
            // Document checklist for this match
            const checklist = (plan.applicationChecklists || []).find((c) => c.opportunityKey === match.key);

            // Invariant Refinement 1: Distinct badge for Competitive/Credit/Discretionary vs Entitlement
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

            return (
              <div
                key={match.key}
                className="bg-zinc-900/50 hover:bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 transition-all space-y-4 shadow-sm"
              >
                {/* Card Top Row: Authorities, Type, and Status Badges */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/50 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Support Type */}
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                      {match.supportType}
                    </span>

                    {/* Selection Mode Dimension */}
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono text-zinc-400 bg-zinc-950 border border-zinc-800">
                      Mode: {match.selectionMode}
                    </span>

                    {/* Programme Owner vs Source attribution */}
                    <span className="px-2 py-0.5 rounded text-[11px] text-zinc-400 bg-zinc-950/80 border border-zinc-800/80 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-zinc-500" />
                      {match.programmeOwner || match.managingAuthority}
                      {match.catalogueSource && (
                        <span className="text-zinc-600">· via {match.catalogueSource}</span>
                      )}
                    </span>
                  </div>

                  {/* Eligibility / Apply Status Badge */}
                  <div className="flex items-center gap-2">
                    {isAwarded ? (
                      <span
                        className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-900/80 text-emerald-200 border border-emerald-600 flex items-center gap-1.5 shadow-sm"
                        title="Verified award confirmed by programme authority."
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                        Awarded
                      </span>
                    ) : isEligibleToApply ? (
                      <span
                        className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-950/80 text-blue-300 border border-blue-700/80 flex items-center gap-1.5 shadow-sm"
                        title="You appear to meet the known application criteria. Final selection depends on the programme authority."
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                        Eligible to Apply
                      </span>
                    ) : isEligibleStatutory ? (
                      <span
                        className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-700/80 flex items-center gap-1.5 shadow-sm"
                        title="Statutory and administrative criteria are satisfied. Proceed with required declaration."
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Eligible (Statutory)
                      </span>
                    ) : match.eligibilityStatus === 'NeedsReview' ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-300 border border-amber-700/80 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                        Needs Review
                      </span>
                    ) : match.eligibilityStatus === 'PotentiallyEligible' ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-300 border border-amber-700/80 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                        Potentially Eligible
                      </span>
                    ) : match.eligibilityStatus === 'NeedsInformation' ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
                        Needs Information
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-900 text-zinc-500 border border-zinc-800">
                        {match.eligibilityStatus}
                      </span>
                    )}

                    {/* Founder Application State Badge */}
                    {match.founderApplicationState !== 'NotStarted' && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-950/60 text-purple-300 border border-purple-800/60">
                        {match.founderApplicationState}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Title & Value */}
                <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-2">
                  <div>
                    <h3 className="text-base font-semibold text-white tracking-tight">{match.name}</h3>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed max-w-3xl">
                      {match.description}
                    </p>
                  </div>

                  {/* Versioned financial value (Source-driven, never hardcoded constant) */}
                  <div className="shrink-0 md:text-right mt-2 md:mt-0">
                    <div className="text-sm font-bold font-mono text-emerald-400">
                      {match.supportValueDescription || 'Amount Varies'}
                    </div>
                    <div className="text-[10px] text-zinc-500">
                      {match.timing?.rolling ? 'Rolling Programme' : 'Deadline-based'}
                    </div>
                  </div>
                </div>

                {/* Why Matched / Evaluation summary */}
                <div className="bg-zinc-950/40 rounded-lg p-3 border border-zinc-800/60 space-y-2">
                  <div className="text-xs text-zinc-300 font-medium flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Evaluation Rationale:</span>
                  </div>
                  <div className="text-xs text-zinc-400 space-y-1 pl-5 list-disc">
                    {(match.whyMatched || []).map((w, idx) => (
                      <div key={idx} className="leading-snug">
                        {w}
                      </div>
                    ))}
                    {match.recommendedNextStep && (
                      <div className="text-emerald-400 font-medium pt-1">
                        Next: {match.recommendedNextStep}
                      </div>
                    )}
                  </div>
                </div>

                {/* Document Reuse & MBC Linkage Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs text-zinc-400">
                  <div className="flex flex-wrap items-center gap-3">
                    {checklist && (
                      <div className="flex items-center gap-1.5 bg-zinc-950 px-2.5 py-1 rounded border border-zinc-800">
                        <FileCheck2 className="w-3.5 h-3.5 text-purple-400" />
                        <span>MBC Artifacts:</span>
                        <span className="text-zinc-200 font-medium font-mono">
                          {checklist.readyCount}/{checklist.items.length} Ready
                        </span>
                      </div>
                    )}

                    {match.relatedNeedKeys && match.relatedNeedKeys.length > 0 && (
                      <div className="flex items-center gap-1.5 bg-zinc-950 px-2.5 py-1 rounded border border-zinc-800">
                        <Layers className="w-3.5 h-3.5 text-blue-400" />
                        <span>Funds Needs:</span>
                        <span className="text-zinc-300 font-mono">
                          {match.relatedNeedKeys.join(', ')}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Official source URL */}
                    {match.officialUrl && (
                      <a
                        href={match.officialUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-emerald-400 transition-colors"
                      >
                        Official Source
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}

                    {/* View Details Drawer */}
                    <button
                      onClick={() => setSelectedMatch(match)}
                      className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
                    >
                      Audit Details
                    </button>

                    {/* Change Founder State */}
                    <button
                      onClick={() => handleOpenStateModal(match)}
                      className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors inline-flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      {match.founderApplicationState !== 'NotStarted' ? 'Update State' : 'Track Application'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Founder State Tracking Dialog */}
      {editingMatchKey && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-semibold text-white">Track Application Progress</h3>
            <p className="text-xs text-zinc-400">
              Record your personal progress for this support opportunity. This decision is preserved across catalog updates.
            </p>

            <div className="space-y-3 pt-2">
              <label className="text-xs font-medium text-zinc-300 block">Application State</label>
              <select
                value={targetState}
                onChange={(e) => setTargetState(e.target.value as FounderApplicationState)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
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

              <label className="text-xs font-medium text-zinc-300 block">Founder Notes</label>
              <textarea
                value={founderNotesInput}
                onChange={(e) => setFounderNotesInput(e.target.value)}
                placeholder="e.g. Discussed with France Travail advisor on Sept 15, dossier due next month..."
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 min-h-[80px]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
              <button
                onClick={() => setEditingMatchKey(null)}
                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveState(editingMatchKey)}
                disabled={isSubmittingState}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium disabled:opacity-50"
              >
                {isSubmittingState ? 'Saving...' : 'Save Progress'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Match Details Drawer / Modal */}
      {selectedMatch && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl my-8">
            <div className="flex items-start justify-between border-b border-zinc-800 pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase text-emerald-400 tracking-wider">
                  Audit Provenance & Eligibility Trace
                </span>
                <h2 className="text-lg font-bold text-white mt-0.5">{selectedMatch.name}</h2>
              </div>
              <button
                onClick={() => setSelectedMatch(null)}
                className="text-zinc-400 hover:text-zinc-200 text-sm p-1"
              >
                ✕
              </button>
            </div>

            {/* Scheme Metadata */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800/80">
                <span className="text-zinc-500 block text-[10px] uppercase font-mono">Programme Owner</span>
                <span className="text-zinc-200 font-medium">{selectedMatch.programmeOwner || 'Public Authority'}</span>
              </div>
              <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800/80">
                <span className="text-zinc-500 block text-[10px] uppercase font-mono">Managing Authority</span>
                <span className="text-zinc-200 font-medium">{selectedMatch.managingAuthority || 'Regional/National Body'}</span>
              </div>
              <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800/80">
                <span className="text-zinc-500 block text-[10px] uppercase font-mono">Catalogue Source</span>
                <span className="text-zinc-200 font-medium">{selectedMatch.catalogueSource}</span>
              </div>
              <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800/80">
                <span className="text-zinc-500 block text-[10px] uppercase font-mono">Selection Dimension</span>
                <span className="text-zinc-200 font-medium">{selectedMatch.selectionMode}</span>
              </div>
            </div>

            {/* Deterministic Conditions Met / Missing / Failed */}
            <div className="space-y-3 text-xs">
              <h4 className="font-semibold text-zinc-200">Conditions Met:</h4>
              <div className="space-y-1 pl-3 text-zinc-300">
                {(selectedMatch.conditionsMet || []).map((c, i) => (
                  <div key={i} className="flex items-center gap-2 text-emerald-400">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-zinc-300">{c}</span>
                  </div>
                ))}
              </div>

              {selectedMatch.conditionsMissing && selectedMatch.conditionsMissing.length > 0 && (
                <>
                  <h4 className="font-semibold text-amber-300 pt-2">Missing / Information Needed:</h4>
                  <div className="space-y-1 pl-3 text-zinc-300">
                    {selectedMatch.conditionsMissing.map((c, i) => (
                      <div key={i} className="flex items-center gap-2 text-amber-400">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-zinc-300">{c}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {selectedMatch.conditionsFailed && selectedMatch.conditionsFailed.length > 0 && (
                <>
                  <h4 className="font-semibold text-red-300 pt-2">Ineligible Conditions:</h4>
                  <div className="space-y-1 pl-3 text-zinc-300">
                    {selectedMatch.conditionsFailed.map((c, i) => (
                      <div key={i} className="flex items-center gap-2 text-red-400">
                        <XCircle className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-zinc-300">{c}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Checklist & Document Reuse */}
            {(() => {
              const checklist = (plan.applicationChecklists || []).find((c) => c.opportunityKey === selectedMatch.key);
              if (!checklist) return null;
              return (
                <div className="space-y-2 text-xs border-t border-zinc-800 pt-4">
                  <h4 className="font-semibold text-zinc-200">Application Checklist & MBC Artifact Reuse:</h4>
                  <div className="space-y-2">
                    {checklist.items.map((item) => (
                      <div
                        key={item.key}
                        className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 flex items-center justify-between gap-3"
                      >
                        <div>
                          <div className="text-zinc-200 font-medium">{item.label}</div>
                          {item.existingArtifactReference && (
                            <div className="text-[11px] text-purple-400 mt-0.5">
                              Reuses: {item.existingArtifactReference}
                            </div>
                          )}
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-medium font-mono ${
                            item.status === 'Ready'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-amber-950 text-amber-300 border border-amber-800'
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

            <div className="flex items-center justify-end pt-3 border-t border-zinc-800">
              <button
                onClick={() => setSelectedMatch(null)}
                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Phase 4.6 Next Step Banner */}
      <div className="mt-12 bg-gradient-to-r from-emerald-950/30 via-zinc-900/40 to-zinc-900/40 border border-emerald-800/40 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center md:text-left">
          <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-400 block font-semibold">
            PHASE 4.6 READY · NEXT OPERATIONAL MILESTONE
          </span>
          <h4 className="text-sm font-semibold text-zinc-100">Pricing & Revenue Model Engine</h4>
          <p className="text-xs text-zinc-400 max-w-xl">
            Turn your business model, customer segments, cost structure, and forecast assumptions into a financially viable, French-compliant launch pricing strategy.
          </p>
        </div>
        <Link
          href={`/dashboard/creator/phase-4/pricing?ideaId=${encodeURIComponent(ideaId)}`}
          className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-lg shadow-emerald-950/50 shrink-0 flex items-center gap-2 transition-colors"
        >
          <span>Build My Pricing Strategy</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
