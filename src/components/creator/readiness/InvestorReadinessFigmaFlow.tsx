'use client';

import React from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  LayoutGrid,
  FileText,
  BarChart3,
  Users,
  Tag,
  Wrench,
  Megaphone,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  Info,
  Loader2,
  AlertTriangle,
  RotateCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { withIdeaContext } from '@/lib/creator-routes';
import type { InvestorReadinessScore, ReadinessDeduction } from '@/lib/api-creator-journey';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';

export interface InvestorReadinessFigmaFlowProps {
  project: {
    name: string;
    targetUser?: string;
    country?: string;
    category?: string;
    problem?: string;
    solution?: string;
  };
  readiness: InvestorReadinessScore | null;
  loading: boolean;
  missingPrerequisite: string | null;
  updateAvailable: boolean;
  changedSources: string[];
  onRecompute: () => Promise<void>;
  isRecomputing: boolean;
  canContinue: boolean;
  onContinue: () => Promise<void>;
  isNavigating: boolean;
  onExportPdf: () => void;
  ideaId?: string | null;
}

export const InvestorReadinessFigmaFlow: React.FC<InvestorReadinessFigmaFlowProps> = ({
  project,
  readiness,
  loading,
  missingPrerequisite,
  updateAvailable,
  changedSources,
  onRecompute,
  isRecomputing,
  canContinue,
  onContinue,
  isNavigating,
  onExportPdf,
  ideaId,
}) => {
  const { t } = useTranslation();
  const projectName = project.name?.trim() || 'Your Venture';
  const totalScore = readiness?.total ?? 0;

  const displayScore = (val?: number | null) =>
    typeof val === 'number' && !isNaN(val)
      ? Number.isInteger(val)
        ? val.toFixed(0)
        : val.toFixed(1)
      : '0';

  // 5 Dimensions matching the 100-point total from Figma Node 57160:11404
  const breakdown = readiness?.breakdown;
  const conceptScore = breakdown?.conceptClarity ?? 0;
  const marketScore = breakdown?.marketEvidence ?? 0;
  const financeScore = breakdown?.financialModel ?? 0;
  const legalScore = breakdown?.legalReadiness ?? 0;
  const teamScore = breakdown?.teamCredibility ?? 0;

  // Dynamic Headline and Summary from backend or score tier fallback
  const headline = readiness?.headline ||
    (totalScore >= 85 ? 'Fully validated venture foundation, ready for institutional capital.'
    : totalScore >= 70 ? 'Strong institutional foundation, nearly investor-ready.'
    : totalScore >= 50 ? 'A clear starting point, with a few gaps to work through.'
    : 'Foundational gaps identified, requiring further validation.');

  const summary = readiness?.summary ||
    (totalScore >= 85
      ? 'Your venture intelligence demonstrates institutional rigor across customer evidence, unit economics, statutory compliance, and founder capabilities.'
      : totalScore >= 70
      ? 'Your concept and market evidence are well articulated. Addressing key financial sensitivity points and specialist coverage will finalize readiness.'
      : 'Your concept is taking shape. Stronger customer evidence, clearer financial assumptions, and a practical support plan will make it easier to explain your business.');

  // Map 5 structured improvement rows
  const improvementRows = (() => {
    const deductions = readiness?.deductions ?? [];

    const getDed = (dimKey: string): ReadinessDeduction | undefined =>
      deductions.find((d) => d.dimension.toLowerCase() === dimKey.toLowerCase());

    const conceptDed = getDed('conceptclarity');
    const marketDed = getDed('marketevidence');
    const financeDed = getDed('financialmodel');
    const legalDed = getDed('legalreadiness');
    const teamDed = getDed('teamcredibility');

    const rows = [
      {
        key: 'concept',
        title: 'Concept clarity',
        score: conceptScore,
        max: 20,
        lost: conceptDed?.pointsLost ?? Math.max(0, Math.round(20 - conceptScore)),
        currentState:
          conceptDed?.currentState ??
          (conceptScore >= 20
            ? 'Optimal. Venture concept, problem statement, and solution are fully defined and validated.'
            : project.problem && project.solution
            ? `The problem and proposed solution for ${projectName} are described.`
            : 'Venture concept and unique value proposition require clarification.'),
        recommendation:
          conceptDed?.recommendation ??
          (conceptScore >= 20
            ? 'Concept meets all institutional clarity benchmarks.'
            : `Clarify why your first customers would choose ${projectName} over their current approach.`),
        subtext: undefined as string | undefined,
        actionLabel: 'Refine your concept',
        actionRoute: '/dashboard/creator/phase-2/clarifier',
        isPrimaryGap: false,
      },
      {
        key: 'market',
        title: 'Market evidence',
        score: marketScore,
        max: 20,
        lost: marketDed?.pointsLost ?? Math.max(0, Math.round(20 - marketScore)),
        currentState:
          marketDed?.currentState ??
          (marketScore >= 20
            ? 'Optimal. Market sizing and customer validation evidence are completed.'
            : project.targetUser
            ? `An initial customer group (${project.targetUser}) is identified.`
            : 'An initial customer group is identified.'),
        recommendation:
          marketDed?.recommendation ??
          (marketScore >= 20
            ? 'Market evidence meets institutional addressability standards.'
            : 'Add direct customer feedback and sources that support your market assumptions.'),
        subtext: undefined as string | undefined,
        actionLabel: 'Review your market study',
        actionRoute: '/dashboard/creator/phase-3/market-study',
        isPrimaryGap: true, // "Start here" badge in Figma
      },
      {
        key: 'finance',
        title: 'Financial model',
        score: financeScore,
        max: 25,
        lost: financeDed?.pointsLost ?? Math.max(0, Math.round(25 - financeScore)),
        currentState:
          financeDed?.currentState ??
          (financeScore >= 25
            ? 'Optimal. 36-month projections demonstrate break-even velocity and sustainable unit economics.'
            : 'A forecast is available, with assumptions still to test.'),
        recommendation:
          financeDed?.recommendation ??
          (financeScore >= 25
            ? 'Financial projections meet institutional diligence criteria.'
            : 'Explain the main revenue and cost assumptions, and check what happens if sales start more slowly.'),
        subtext: undefined as string | undefined,
        actionLabel: 'Review your financial forecast',
        actionRoute: '/dashboard/creator/phase-3/forecast',
        isPrimaryGap: false,
      },
      {
        key: 'legal',
        title: 'Legal readiness',
        score: legalScore,
        max: 15,
        lost: legalDed?.pointsLost ?? Math.max(0, Math.round(15 - legalScore)),
        currentState:
          legalDed?.currentState ??
          (legalScore >= 15
            ? 'Optimal. Legal and compliance checklist requirements are fully verified.'
            : 'A personalised legal roadmap is available.'),
        recommendation:
          legalDed?.recommendation ??
          (legalScore >= 15
            ? 'Statutory and governance planning verified.'
            : 'Clarify which requirements apply to your activity and when you will handle them.'),
        subtext:
          legalDed?.subtext ??
          (legalScore < 15
            ? 'This assesses your planning, not whether your company is already registered.'
            : undefined),
        actionLabel: 'Review your legal roadmap',
        actionRoute: '/dashboard/creator/phase-3/compliance',
        isPrimaryGap: false,
      },
      {
        key: 'team',
        title: 'Team credibility',
        score: teamScore,
        max: 20,
        lost: teamDed?.pointsLost ?? Math.max(0, Math.round(20 - teamScore)),
        currentState:
          teamDed?.currentState ??
          (teamScore >= 20
            ? 'Optimal. Founder advantage and operational partner coverage are verified.'
            : 'The founder’s responsibilities are outlined.'),
        recommendation:
          teamDed?.recommendation ??
          (teamScore >= 20
            ? 'Team structure and specialized support requirements are met.'
            : 'Explain how you will cover the skills your launch needs, including any outside support.'),
        subtext:
          teamDed?.subtext ??
          (teamScore < 20 ? 'You can plan these responsibilities as a solo founder.' : undefined),
        actionLabel: 'Review company setup & team',
        actionRoute: '/dashboard/creator/phase-3/formation',
        isPrimaryGap: false,
      },
    ];

    // Find the row with the largest points lost to set "Start here" if market isn’t the highest
    let maxLost = -1;
    let maxKey = 'market';
    rows.forEach((r) => {
      if (r.lost > maxLost) {
        maxLost = r.lost;
        maxKey = r.key;
      }
    });

    return rows.map((r) => ({
      ...r,
      isPrimaryGap: r.key === maxKey && r.lost > 0,
    }));
  })();

  return (
    <div className="w-full max-w-[1040px] mx-auto space-y-8 font-sans pb-16 text-foreground">
      {/* 1. COMPACT INTRODUCTION & HEADER (Figma Node 57160:11404) */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 pt-2 pb-1 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono">
            <span>{t('creator.phase3.readiness.projectIntelligence')}</span>
            <span className="size-1.5 rounded-full bg-primary inline-block" />
            <span>{t('creator.phase3.readiness.phaseBadge')}</span>
          </div>

          <h1 className="text-2xl sm:text-[30px] font-bold tracking-tight text-foreground font-sans mt-1.5">
            {t('creator.phase3.readiness.title')}
          </h1>

          <p className="text-sm text-muted-foreground mt-1 font-sans">
            {t('creator.phase3.readiness.subtitle')}
          </p>

          <div className="flex items-center gap-2.5 mt-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-card border border-border shadow-xs">
              <span className="text-xs font-semibold text-foreground font-sans">{projectName}</span>
            </div>
            <Badge
              variant="outline"
              className="text-badge font-semibold bg-muted/60 text-muted-foreground border-border/80 px-2.5 py-0.5 rounded-full font-mono uppercase tracking-wider"
            >
              {t('creator.phase3.readiness.liveAssessment')}
            </Badge>
          </div>
        </div>

        <Link
          href={withIdeaContext('/dashboard/creator/phase-3/business-plan', ideaId)}
          className="text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1 shrink-0 pb-1"
        >
          <span>{t('creator.phase3.readiness.viewBusinessPlan')}</span>
          <span className="text-xs font-mono">↗</span>
        </Link>
      </div>

      {/* Upstream Change Notification if available */}
      {updateAvailable && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 text-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <span className="font-bold">{t('creator.phase3.readiness.updateAvailable')}</span>{' '}
              {t('creator.phase3.readiness.updateDesc', { sources: changedSources.join(', ') || 'Business Model / Legal / Projections' })}
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={onRecompute}
            disabled={isRecomputing}
            className="h-8 text-xs border-amber-500/40 text-amber-900 dark:text-amber-100 hover:bg-amber-500/20 shrink-0 font-medium"
          >
            {isRecomputing ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : <RotateCw className="size-3.5 mr-1.5" />}
            {t('creator.phase3.readiness.reEvaluateScore')}
          </Button>
        </div>
      )}

      {/* Missing Prerequisite Warning */}
      {missingPrerequisite && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs leading-relaxed text-foreground">
          <AlertTriangle className="size-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div>
            <span className="font-semibold text-amber-700 dark:text-amber-300">
              {t('creator.phase3.readiness.incompletePrerequisite')}
            </span>{' '}
            {t('creator.phase3.readiness.moduleRequiresCompletion', { module: missingPrerequisite.replace(/_/g, ' ') })}
          </div>
        </div>
      )}

      {/* Loading Card */}
      {loading && (
        <Card className="flex items-center justify-center gap-3 py-16 border-border/70 bg-card text-muted-foreground">
          <Loader2 className="size-6 animate-spin text-primary" />
          <span className="text-sm font-medium">{t('creator.phase3.readiness.computingScore')}</span>
        </Card>
      )}

      {!loading && (
        <>
          {/* 2. SECTION 2: READINESS OVERVIEW (HERO CARD) */}
          <Card className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              {/* Left Score Column */}
              <div className="w-full sm:w-[280px] shrink-0 space-y-2">
                <span className="text-xs font-semibold tracking-wider uppercase text-muted-foreground font-sans">
                  {t('creator.phase3.readiness.yourPlanningReadiness')}
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl sm:text-[56px] font-extrabold font-mono tracking-tight text-foreground">
                    {displayScore(totalScore)}
                  </span>
                  <span className="text-xl sm:text-2xl font-mono text-muted-foreground font-semibold">/ 100</span>
                </div>
                {/* Horizontal Progress Bar */}
                <div className="h-1.5 w-full bg-muted/80 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, Math.max(0, totalScore))}%` }}
                  />
                </div>
              </div>

              {/* Right Interpretation Column */}
              <div className="flex-1 sm:pl-8 sm:border-l sm:border-border/60 space-y-2">
                <h3 className="text-lg sm:text-xl font-bold text-foreground font-sans tracking-tight">
                  {headline}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed font-sans">
                  {summary}
                </p>
              </div>
            </div>

            {/* Segment Breakdown Horizontal Track (5 Pillars) */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 pt-5 border-t border-border/60">
              {/* Concept */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground font-sans">{t('creator.phase3.readiness.dimensions.concept')}</span>
                  <span className="font-mono text-muted-foreground">{displayScore(conceptScore)}/20</span>
                </div>
                <div className="h-1.5 w-full bg-muted/80 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-foreground/70 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (conceptScore / 20) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Market */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground font-sans">{t('creator.phase3.readiness.dimensions.market')}</span>
                  <span className="font-mono text-muted-foreground">{displayScore(marketScore)}/20</span>
                </div>
                <div className="h-1.5 w-full bg-muted/80 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-foreground/70 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (marketScore / 20) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Finance */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground font-sans">{t('creator.phase3.readiness.dimensions.finance')}</span>
                  <span className="font-mono text-muted-foreground">{displayScore(financeScore)}/25</span>
                </div>
                <div className="h-1.5 w-full bg-muted/80 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-foreground/70 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (financeScore / 25) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Legal */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground font-sans">{t('creator.phase3.readiness.dimensions.legal')}</span>
                  <span className="font-mono text-muted-foreground">{displayScore(legalScore)}/15</span>
                </div>
                <div className="h-1.5 w-full bg-muted/80 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-foreground/70 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (legalScore / 15) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Team */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground font-sans">{t('creator.phase3.readiness.dimensions.team')}</span>
                  <span className="font-mono text-muted-foreground">{displayScore(teamScore)}/20</span>
                </div>
                <div className="h-1.5 w-full bg-muted/80 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-foreground/70 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (teamScore / 20) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Disclaimer card footer */}
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-muted/40 border border-border/50 text-xs text-muted-foreground font-sans">
              <Info className="size-3.5 shrink-0 text-muted-foreground" />
              <span>
                {t('creator.phase3.readiness.scoreDisclaimer')}
              </span>
            </div>
          </Card>

          {/* 3. SECTION 3: WHAT TO IMPROVE */}
          <div className="space-y-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-sans">
                {t('creator.phase3.readiness.whatToImprove')}
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5 font-sans">
                {t('creator.phase3.readiness.whatToImproveDesc')}
              </p>
            </div>

            <Card className="rounded-2xl border border-border/80 bg-card overflow-hidden divide-y divide-border/60 shadow-xs">
              {improvementRows.map((row) => (
                <div
                  key={row.key}
                  className={cn(
                    'p-5 sm:p-6 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4',
                    row.isPrimaryGap ? 'bg-amber-50/50 dark:bg-amber-950/20' : 'hover:bg-muted/10',
                  )}
                >
                  <div className="space-y-2 flex-1 max-w-3xl">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-base font-bold text-foreground font-sans">
                        {row.title}
                      </h3>
                      {row.isPrimaryGap && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200 font-sans">
                          {t('creator.phase3.readiness.startHere')}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-md bg-muted/60 text-xs font-semibold text-muted-foreground font-mono">
                        {displayScore(row.score)} / {row.max}
                      </span>
                    </div>

                    <div className="space-y-1 text-sm font-sans">
                      <p className="text-foreground">
                        <strong className="font-semibold">{t('creator.phase3.readiness.currentState')}</strong> {row.currentState}
                      </p>
                      <p className="text-muted-foreground">
                        <strong className="font-semibold text-foreground/80">{t('creator.phase3.readiness.recommendation')}</strong> {row.recommendation}
                      </p>
                      {row.subtext && (
                        <p className="text-xs text-muted-foreground/80 italic pt-0.5">
                          {row.subtext}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-2 shrink-0 pt-2 md:pt-0">
                    {row.lost > 0 ? (
                      <span className="text-sm font-semibold text-amber-700 dark:text-amber-400 font-mono">
                        {t('creator.phase3.readiness.pointsLost', { points: displayScore(row.lost) })}
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                        {t('creator.phase3.readiness.fullMarks')}
                      </span>
                    )}
                    <Link
                      href={withIdeaContext(row.actionRoute, ideaId)}
                      className="text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1 shrink-0"
                    >
                      <span>{row.actionLabel}</span>
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </Card>
          </div>

          {/* 4. SECTION 4: YOUR PROJECT DOCUMENTS */}
          <div className="space-y-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-sans">
                {t('creator.phase3.readiness.projectDocuments')}
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5 font-sans">
                {t('creator.phase3.readiness.projectDocumentsDesc')}
              </p>
            </div>

            <Card className="rounded-2xl border border-border/80 bg-card overflow-hidden divide-y divide-border/60 shadow-xs">
              {/* Doc 1: Market study */}
              <div className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-muted/10 transition-colors">
                <div className="flex items-center gap-3.5">
                  <div className="size-10 rounded-xl bg-muted/60 border border-border/50 flex items-center justify-center text-primary shrink-0">
                    <TrendingUp className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground font-sans">
                      {t('creator.phase3.readiness.docMarketStudyTitle', 'Market study')}
                    </h3>
                    <p className="text-xs text-muted-foreground font-sans">
                      {t('creator.phase3.readiness.docMarketStudyDesc', 'Your customers, competitors, and market assumptions.')}
                    </p>
                  </div>
                </div>
                <Link
                  href={withIdeaContext('/dashboard/creator/phase-3/market-study', ideaId)}
                  className="text-sm font-semibold text-primary hover:underline px-3 py-1.5 rounded-lg shrink-0"
                >
                  {t('creator.phase3.readiness.docView', 'View')}
                </Link>
              </div>

              {/* Doc 2: Business model */}
              <div className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-muted/10 transition-colors">
                <div className="flex items-center gap-3.5">
                  <div className="size-10 rounded-xl bg-muted/60 border border-border/50 flex items-center justify-center text-primary shrink-0">
                    <LayoutGrid className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground font-sans">
                      {t('creator.phase3.readiness.docBusinessModelTitle', 'Business model')}
                    </h3>
                    <p className="text-xs text-muted-foreground font-sans">
                      {t('creator.phase3.readiness.docBusinessModelDesc', 'How your business plans to create value and earn revenue.')}
                    </p>
                  </div>
                </div>
                <Link
                  href={withIdeaContext('/dashboard/creator/phase-3/business-model', ideaId)}
                  className="text-sm font-semibold text-primary hover:underline px-3 py-1.5 rounded-lg shrink-0"
                >
                  {t('creator.phase3.readiness.docView', 'View')}
                </Link>
              </div>

              {/* Doc 3: Business plan with Primary badge & Download button */}
              <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/20 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3.5">
                  <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                    <FileText className="size-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-foreground font-sans">
                        {t('creator.phase3.steps.businessPlan', 'Business plan')}
                      </h3>
                      <span className="px-2 py-0.5 rounded-md bg-muted/80 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider font-mono">
                        {t('creator.phase3.readiness.primary')}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground font-sans">
                      {t('creator.phase3.readiness.docBusinessPlanDesc', 'Your project brought together in one document.')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Link
                    href={withIdeaContext('/dashboard/creator/phase-3/business-plan', ideaId)}
                    className="text-sm font-semibold text-primary hover:underline px-3 py-1.5 rounded-lg"
                  >
                    {t('creator.phase3.readiness.docView')}
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onExportPdf}
                    className="h-8 text-xs font-semibold gap-1.5 rounded-lg border-border bg-card shadow-2xs hover:bg-muted"
                  >
                    <span>{t('creator.phase3.readiness.docDownload')}</span>
                    <ChevronDown className="size-3" />
                  </Button>
                </div>
              </div>

              {/* Doc 4: Financial forecast */}
              <div className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-muted/10 transition-colors">
                <div className="flex items-center gap-3.5">
                  <div className="size-10 rounded-xl bg-muted/60 border border-border/50 flex items-center justify-center text-primary shrink-0">
                    <BarChart3 className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground font-sans">
                      {t('creator.phase3.readiness.docForecastTitle', 'Financial forecast')}
                    </h3>
                    <p className="text-xs text-muted-foreground font-sans">
                      {t('creator.phase3.readiness.docForecastDesc', 'Your financial assumptions and projections.')}
                    </p>
                  </div>
                </div>
                <Link
                  href={withIdeaContext('/dashboard/creator/phase-3/forecast', ideaId)}
                  className="text-sm font-semibold text-primary hover:underline px-3 py-1.5 rounded-lg shrink-0"
                >
                  {t('creator.phase3.readiness.docView', 'View')}
                </Link>
              </div>

              {/* Doc 5: Company setup & team */}
              <div className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-muted/10 transition-colors">
                <div className="flex items-center gap-3.5">
                  <div className="size-10 rounded-xl bg-muted/60 border border-border/50 flex items-center justify-center text-primary shrink-0">
                    <Users className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground font-sans">
                      {t('creator.phase3.readiness.docFormationTitle', 'Company setup & team')}
                    </h3>
                    <p className="text-xs text-muted-foreground font-sans">
                      {t('creator.phase3.readiness.docFormationDesc', 'Your proposed structure, responsibilities, and support needs.')}
                    </p>
                  </div>
                </div>
                <Link
                  href={withIdeaContext('/dashboard/creator/phase-3/formation', ideaId)}
                  className="text-sm font-semibold text-primary hover:underline px-3 py-1.5 rounded-lg shrink-0"
                >
                  {t('creator.phase3.readiness.docView', 'View')}
                </Link>
              </div>
            </Card>
          </div>

          {/* 5. SECTION 5: WHAT COMES NEXT (PHASE 4 PREVIEW) */}
          <Card className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground font-sans">
                {t('creator.phase3.readiness.nextOfferTitle')}
              </h2>
              <p className="text-sm text-muted-foreground mt-1 font-sans">
                {t('creator.phase3.readiness.nextOfferDesc')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Step 01: Pricing */}
              <div className="p-5 rounded-xl border border-border/60 bg-muted/20 flex flex-col justify-between space-y-4">
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-primary font-mono tracking-wider">
                    {t('creator.phase3.readiness.stepBadge', 'STEP {{step}}', { step: '01' })}
                  </span>
                  <h3 className="text-base font-bold text-foreground font-sans">
                    {t('creator.phase3.readiness.stepPricingTitle')}
                  </h3>
                  <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                    {t('creator.phase3.readiness.stepPricingDesc')}
                  </p>
                </div>
                <div className="pt-3 border-t border-border/50 flex items-center gap-1.5 text-xs text-muted-foreground font-sans">
                  <Tag className="size-3.5 text-muted-foreground" />
                  <span>{t('creator.phase3.readiness.stepPricingTag', 'Packaging & tiers')}</span>
                </div>
              </div>

              {/* Step 02: Resources */}
              <div className="p-5 rounded-xl border border-border/60 bg-muted/20 flex flex-col justify-between space-y-4">
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-primary font-mono tracking-wider">
                    {t('creator.phase3.readiness.stepBadge', 'STEP {{step}}', { step: '02' })}
                  </span>
                  <h3 className="text-base font-bold text-foreground font-sans">
                    {t('creator.phase3.readiness.stepResourcesTitle')}
                  </h3>
                  <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                    {t('creator.phase3.readiness.stepResourcesDesc')}
                  </p>
                </div>
                <div className="pt-3 border-t border-border/50 flex items-center gap-1.5 text-xs text-muted-foreground font-sans">
                  <Wrench className="size-3.5 text-muted-foreground" />
                  <span>{t('creator.phase3.readiness.stepResourcesTag', 'Tooling & operations')}</span>
                </div>
              </div>

              {/* Step 03: Go-to-market */}
              <div className="p-5 rounded-xl border border-border/60 bg-muted/20 flex flex-col justify-between space-y-4">
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-primary font-mono tracking-wider">
                    {t('creator.phase3.readiness.stepBadge', 'STEP {{step}}', { step: '03' })}
                  </span>
                  <h3 className="text-base font-bold text-foreground font-sans">
                    {t('creator.phase3.readiness.stepGtmTitle')}
                  </h3>
                  <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                    {t('creator.phase3.readiness.stepGtmDesc')}
                  </p>
                </div>
                <div className="pt-3 border-t border-border/50 flex items-center gap-1.5 text-xs text-muted-foreground font-sans">
                  <Megaphone className="size-3.5 text-muted-foreground" />
                  <span>{t('creator.phase3.readiness.stepGtmTag', 'Early traction channels')}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* 6. SECTION 6: FOOTER WITH TWO FORWARD OPTIONS */}
          <div className="space-y-4 pt-4 border-t border-border/60">
            <p className="text-xs text-muted-foreground text-center font-sans">
              {t('creator.phase3.readiness.footerNote')}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <Link
                href={withIdeaContext('/dashboard/creator/phase-3/business-plan', ideaId)}
                className="text-sm font-semibold text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="size-4" />
                <span>{t('creator.phase3.readiness.backToBusinessPlan')}</span>
              </Link>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Button
                  asChild
                  variant="outline"
                  className="flex-1 sm:flex-initial h-11 px-5 rounded-xl font-semibold border-border bg-card shadow-2xs hover:bg-muted"
                >
                  <Link href="/dashboard/creator">
                    {t('creator.phase3.readiness.saveGoDashboard')}
                  </Link>
                </Button>

                <Button
                  onClick={onContinue}
                  disabled={!canContinue || isNavigating}
                  className="flex-1 sm:flex-initial h-11 px-6 rounded-xl font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs gap-2"
                >
                  {isNavigating ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>{t('creator.phase3.readiness.advancingToPhase4')}</span>
                    </>
                  ) : (
                    <>
                      <span>{t('creator.phase3.readiness.continueToPhase4')}</span>
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
