'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Trophy,
  ShieldCheck,
  TrendingUp,
  FileText,
  PieChart,
  DollarSign,
  ArrowUpRight,
  HelpCircle,
  Lock,
  Check,
} from 'lucide-react';
import { type AiReviewResponse, type ExpertRiskItem, type CrossModuleInconsistency, type ActionRemediationItem } from '@/lib/api-entrepreneur';

interface Phase7ReviewVisualsProps {
  review: AiReviewResponse | null;
  companyId?: string;
  isClaiming?: boolean;
  onClaimBadge?: () => void;
  onUnlockPhase8?: () => void;
}

function StageRow({
  icon: Icon,
  label,
  value,
  status
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  status: 'completed' | 'missing';
}) {
  const isCompleted = status === 'completed';
  return (
    <div className="flex h-14 items-center justify-between px-4 border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
      <div className="flex gap-3 items-center w-44">
        <Icon className="w-4 h-4 text-primary" />
        <p className="text-sm font-medium text-foreground">{label}</p>
      </div>
      <div className="flex gap-2 items-center flex-1 max-w-[200px]">
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${value}%` }} />
        </div>
        <p className="text-xs font-semibold text-muted-foreground text-right w-10">{value}%</p>
      </div>
      <div className="w-32 text-right">
        {isCompleted ? (
          <div className="inline-flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Verified</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Incomplete</span>
          </div>
        )}
      </div>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const s = severity?.toUpperCase();
  if (s === 'CRITICAL') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-destructive/15 text-destructive border border-destructive/30">
        <AlertTriangle className="w-3 h-3" /> CRITICAL
      </span>
    );
  }
  if (s === 'HIGH') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
        <AlertCircle className="w-3 h-3" /> HIGH
      </span>
    );
  }
  if (s === 'MEDIUM') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/15 text-sky-700 dark:text-sky-400 border border-sky-500/30">
        MEDIUM
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">
      LOW
    </span>
  );
}

export function Phase7ReviewVisuals({ review, companyId, isClaiming, onClaimBadge, onUnlockPhase8 }: Phase7ReviewVisualsProps) {
  if (!review) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center">
        <span className="text-sm text-muted-foreground">No review yet — run the readiness review to generate your score.</span>
      </div>
    );
  }

  const sb = review.scoreBreakdown;
  const recs = review.recommendations ?? [];
  const risks = review.risks ?? [];
  const inconsistencies = review.inconsistencies ?? [];
  const missingItems = review.missingItems ?? [];
  const pitchRecs = review.pitchRecommendations ?? [];
  const actionItems = review.actionItems ?? [];
  const isFresh = review.isFresh ?? true;
  const isClaimed = review.isInvestorReady ?? false;
  const isStale = Boolean(!isFresh || (review.isCurrentlyInvestorReady === false && isClaimed));

  return (
    <div className="space-y-8">
      {/* 1. TOP HERO: Readiness Score & Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Circular score display */}
            <div className="relative w-36 h-36 flex items-center justify-center flex-shrink-0 mx-auto sm:mx-0">
              <svg className="w-full h-full" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted" />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray={`${(review.overallScore / 100) * 2 * Math.PI * 50} ${2 * Math.PI * 50}`}
                  strokeLinecap="round"
                  className="text-primary transition-all duration-700"
                  style={{ transform: 'rotate(-90deg)', transformOrigin: '60px 60px' }}
                />
              </svg>
              <div className="absolute text-center">
                <p className="text-3xl font-extrabold text-primary">{review.overallScore}</p>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">/ 100</p>
              </div>
            </div>

            {/* Profile narrative */}
            <div className="flex-1 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-xl font-bold text-foreground">Automated Readiness Assessment</h2>
                <div className="flex gap-2 items-center flex-wrap">
                  {isStale ? (
                    <span className="inline-flex items-center gap-1.5 bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-bold">
                      <AlertTriangle className="w-3.5 h-3.5" /> Needs Refresh (Stale Review)
                    </span>
                  ) : review.investorReadyBadge ? (
                    <span className="inline-flex items-center gap-1.5 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold">
                      <ShieldCheck className="w-3.5 h-3.5" /> Investor Ready
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-bold">
                      <AlertCircle className="w-3.5 h-3.5" /> In Progress (Min. 70)
                    </span>
                  )}
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {review.executiveSummary ||
                  `Your venture profile scores ${review.overallScore}/100 across 5 verified operating dimensions. Review qualitative flags and remediation actions below before investor matching.`}
              </p>
              <div className="flex gap-2 flex-wrap pt-1">
                <span className="text-xs font-semibold bg-muted px-2.5 py-1 rounded-md text-foreground">
                  {risks.length} Risk Flags
                </span>
                <span className="text-xs font-semibold bg-muted px-2.5 py-1 rounded-md text-foreground">
                  {inconsistencies.length} Inconsistencies
                </span>
                <span className="text-xs font-semibold bg-muted px-2.5 py-1 rounded-md text-foreground">
                  {actionItems.length} Action Items
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Single Combined Card (Pitch Deck Quality + Investor-Ready Badge) */}
        <div className="lg:col-span-1 bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          {/* Top Section: Pitch Deck Quality */}
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pitch Deck Quality</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-primary/10 text-primary border border-primary/20">
                Grade {review.pitchDeckAnalysis?.grade || 'N/A'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-4">
              <div className="bg-muted/40 p-2.5 rounded-lg border border-border/50 text-center">
                <p className="text-[11px] text-muted-foreground">Clarity</p>
                <p className="text-sm font-bold text-foreground">{review.pitchDeckAnalysis?.clarityNarrative || 0}/10</p>
              </div>
              <div className="bg-muted/40 p-2.5 rounded-lg border border-border/50 text-center">
                <p className="text-[11px] text-muted-foreground">Market Proof</p>
                <p className="text-sm font-bold text-foreground">{review.pitchDeckAnalysis?.marketSizeProof || 0}/10</p>
              </div>
              <div className="bg-muted/40 p-2.5 rounded-lg border border-border/50 text-center">
                <p className="text-[11px] text-muted-foreground">Traction</p>
                <p className="text-sm font-bold text-foreground">{review.pitchDeckAnalysis?.tractionMetrics || 0}/10</p>
              </div>
              <div className="bg-muted/40 p-2.5 rounded-lg border border-border/50 text-center">
                <p className="text-[11px] text-muted-foreground">Team</p>
                <p className="text-sm font-bold text-foreground">{review.pitchDeckAnalysis?.teamPedigree || 0}/10</p>
              </div>
            </div>
          </div>

          {/* Divider & Investor-Ready Badge Section (Inside Same Card) */}
          <div className="mt-6 pt-6 border-t border-border flex flex-col items-center text-center space-y-3">
            {/* 64x64 Credential Seal with Trophy (w-8 h-8) & Secondary Verification Indicator */}
            <div className="flex justify-center">
              <div className={`relative w-16 h-16 rounded-full flex items-center justify-center border-2 shadow-inner ${
                isStale
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400'
                  : isClaimed
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                  : review.investorReadyBadge
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400'
                  : 'bg-muted/60 border-border text-muted-foreground opacity-60'
              }`}>
                <Trophy className="w-8 h-8" />
                {!isStale && isClaimed && (
                  <div className="absolute -right-1 -bottom-1 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md border-2 border-card">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
                {!review.investorReadyBadge && !isClaimed && !isStale && (
                  <div className="absolute -right-1 -bottom-1 w-5 h-5 rounded-full bg-muted-foreground/30 text-muted-foreground flex items-center justify-center border-2 border-card">
                    <Lock className="w-2.5 h-2.5" />
                  </div>
                )}
                {isStale && (
                  <div className="absolute -right-1 -bottom-1 w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center shadow-md border-2 border-card">
                    <AlertTriangle className="w-3 h-3 stroke-[2.5]" />
                  </div>
                )}
              </div>
            </div>

            {/* Headline & Score */}
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-foreground">Investor-Ready Badge</h3>
              <p className="text-2xl font-extrabold text-foreground">
                {review.overallScore}<span className="text-xs font-normal text-muted-foreground">/100</span>
              </p>
            </div>

            {/* State-Specific Status / Actions */}
            {isStale ? (
              <div className="space-y-1.5 pt-1 w-full">
                <div className="inline-flex items-center gap-1.5 bg-amber-500/15 text-amber-700 dark:text-amber-300 px-3 py-1 rounded-full text-xs font-bold border border-amber-500/20">
                  <AlertTriangle className="w-3.5 h-3.5" /> Needs Refresh
                </div>
                <p className="text-xs text-muted-foreground">
                  Data room changes or review expiration require a fresh review before investor readiness is verified.
                </p>
              </div>
            ) : isClaimed ? (
              <div className="space-y-1.5 pt-1 w-full">
                <div className="inline-flex items-center gap-1.5 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/20">
                  <Check className="w-3.5 h-3.5" /> Verified
                </div>
                <div className="text-xs text-muted-foreground space-y-0.5 pt-1">
                  <p className="font-semibold text-foreground">Issued &amp; Claimed</p>
                  {review.investorReadyBadgeAwardedAt && (
                    <p className="text-[11px]">
                      Issued: <span className="font-medium text-foreground">{new Date(review.investorReadyBadgeAwardedAt).toLocaleDateString()}</span>
                    </p>
                  )}
                </div>
              </div>
            ) : review.investorReadyBadge ? (
              <div className="space-y-2.5 pt-1 w-full">
                <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold border border-primary/20">
                  <Sparkles className="w-3.5 h-3.5" /> Ready to Verify
                </div>
                <p className="text-xs text-muted-foreground">
                  Score threshold &ge; 70 met. Claim your official credential.
                </p>
                {onClaimBadge && (
                  <button
                    type="button"
                    onClick={onClaimBadge}
                    disabled={isClaiming}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  >
                    <Trophy className="w-4 h-4" />
                    {isClaiming ? 'Claiming Badge...' : 'Claim Investor-Ready Badge'}
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-1.5 pt-1 w-full">
                <div className="inline-flex items-center gap-1.5 bg-muted px-3 py-1 rounded-full text-xs font-semibold text-muted-foreground border border-border">
                  <Lock className="w-3 h-3" /> Locked &bull; Not Yet Eligible
                </div>
                <p className="text-xs text-muted-foreground">
                  Score &ge; 70 across operating dimensions required to unlock.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. STAGE PROGRESS TABLE */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="bg-muted/30 px-5 py-3 border-b border-border flex items-center justify-between">
          <p className="text-sm font-bold text-foreground">Verified Pillar Breakdown</p>
          <span className="text-xs text-muted-foreground">Authoritative Platform Evidence</span>
        </div>
        <div className="divide-y divide-border">
          <StageRow icon={ShieldCheck} label="Phase 2 Legal Verification" value={sb.verificationScore} status={sb.verificationScore >= 60 ? 'completed' : 'missing'} />
          <StageRow icon={TrendingUp} label="Phase 3 Financial Performance" value={sb.financialScore} status={sb.financialScore >= 60 ? 'completed' : 'missing'} />
          <StageRow icon={PieChart} label="Phase 4 Cap Table & Equity" value={sb.equityScore} status={sb.equityScore >= 60 ? 'completed' : 'missing'} />
          <StageRow icon={DollarSign} label="Phase 5 Funding Ask & Allocation" value={sb.fundingScore} status={sb.fundingScore >= 60 ? 'completed' : 'missing'} />
          <StageRow icon={FileText} label="Phase 6 Data Room Index" value={sb.dataRoomScore} status={sb.dataRoomScore >= 60 ? 'completed' : 'missing'} />
        </div>
      </div>

      {/* 3. STRENGTHS & WEAKNESSES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
            <CheckCircle2 className="w-4 h-4" />
            <span>Key Verified Strengths</span>
          </div>
          {(!review.strengths || review.strengths.length === 0) ? (
            <p className="text-xs text-muted-foreground italic bg-muted/20 p-3 rounded-lg border border-border/50">
              No verified strengths recorded yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {review.strengths.map((s, idx) => (
                <li key={idx} className="text-xs text-foreground bg-muted/30 p-2.5 rounded-lg border border-border/50 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Weaknesses */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>Areas for Improvement</span>
          </div>
          {(!review.weaknesses || review.weaknesses.length === 0) ? (
            <p className="text-xs text-muted-foreground italic bg-muted/20 p-3 rounded-lg border border-border/50">
              No material improvement areas identified in this review.
            </p>
          ) : (
            <ul className="space-y-2">
              {review.weaknesses.map((w, idx) => (
                <li key={idx} className="text-xs text-foreground bg-muted/30 p-2.5 rounded-lg border border-border/50 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* 4. RED FLAGS & CROSS-MODULE INCONSISTENCIES */}
      {(inconsistencies.length > 0 || risks.length > 0) && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm space-y-0">
          <div className="bg-destructive/10 px-5 py-3 border-b border-destructive/20 flex items-center justify-between">
            <div className="flex items-center gap-2 text-destructive font-bold text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>Critical Review Flags & Cross-Module Inconsistencies</span>
            </div>
            <span className="text-xs font-semibold text-destructive">{inconsistencies.length + risks.length} Items</span>
          </div>
          <div className="divide-y divide-border">
            {inconsistencies.map((inc, i) => (
              <div key={`inc-${i}`} className="p-4 hover:bg-muted/20 transition-colors space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">{inc.description}</span>
                    <span className="text-[11px] px-2 py-0.5 bg-muted rounded font-mono text-muted-foreground">
                      {inc.moduleA} ⟷ {inc.moduleB}
                    </span>
                  </div>
                  <SeverityBadge severity={inc.severity} />
                </div>
                <div className="text-xs text-muted-foreground bg-muted/40 p-2 rounded border border-border font-mono">
                  Evidence: {inc.evidence}
                </div>
              </div>
            ))}
            {risks.map((r, i) => (
              <div key={`risk-${i}`} className="p-4 hover:bg-muted/20 transition-colors space-y-1.5">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-bold text-foreground">{r.title}</span>
                  <SeverityBadge severity={r.severity} />
                </div>
                <p className="text-xs text-muted-foreground">{r.explanation}</p>
                {r.evidence && (
                  <div className="text-xs text-muted-foreground bg-muted/40 p-2 rounded border border-border font-mono">
                    Evidence: {r.evidence}
                  </div>
                )}
                {r.recommendedAction && (
                  <p className="text-xs font-medium text-primary">Recommendation: {r.recommendedAction}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. ACTION REMEDIATION ITEMS (DEEP LINKS TO PHASES 2-6) */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="bg-primary/5 px-5 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <p className="text-sm font-bold text-foreground">Recommended Remediation Steps</p>
          </div>
          <span className="text-xs font-semibold text-primary">{actionItems.length} Actions</span>
        </div>
        <div className="divide-y divide-border">
          {actionItems.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              All phase modules satisfy readiness benchmarks.
            </div>
          ) : (
            actionItems.map((act, i) => (
              <div key={`act-${i}`} className="p-4 flex items-center justify-between gap-4 hover:bg-muted/20 transition-colors">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">{act.title}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      +{act.potentialPointGain} pts
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      Phase {act.phaseNumber}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{act.description}</p>
                </div>
                <Link
                  href={`/dashboard/entrepreneur/phase-${act.phaseNumber}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-xs font-semibold text-foreground transition-colors flex-shrink-0"
                >
                  <span>Go to Phase {act.phaseNumber}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Phase7ReviewVisuals;
