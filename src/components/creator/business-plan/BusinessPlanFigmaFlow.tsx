'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  FileDown,
  Sparkles,
  Pencil,
  Check,
  ChevronDown,
  ChevronUp,
  Info,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Loader2,
  AlertTriangle,
  RotateCw,
  MoreHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/hooks/useTranslation';
import type { BusinessPlanOutput, ClarifierOutput, LegalRegulatoryFramework } from '@/types/creator/ai';

export interface BusinessPlanFigmaFlowProps {
  project: {
    name: string;
    problem: string;
    solution: string;
    targetUser: string;
    country?: string;
    category?: string;
    sector?: string;
  };
  bpOutput?: BusinessPlanOutput;
  clarifierOutput?: ClarifierOutput | null;
  forecastBasis?: {
    years?: Array<{ year: number; revenue: number; opex: number; netIncome: number }>;
    currency?: string;
    summary?: { breakEvenMonth?: number; minCashRequired?: number };
  };
  formation?: {
    selectedType?: string;
    founderEquity?: number;
    plannedRole?: string;
    skills?: { youHave?: string[]; youNeed?: string[] };
  };
  cross: {
    hasForecast: boolean;
    youNeed: string[];
    seedAsk: number | null;
  };
  legalFramework?: LegalRegulatoryFramework | null;
  currentVersion: number;
  rewritingSectionId: string | null;
  onRewriteSection: (sectionId: string) => Promise<void>;
  onEditSection: (sectionId: string, content: string) => Promise<void>;
  onExportPdf: () => void;
  onRegenerate?: () => void;
  isGenerating?: boolean;
  onNext: (currentReviewed?: Record<string, boolean>) => void | Promise<void>;
  onBack: () => void;
  effectiveIdeaId?: string | null;
}

export const CHAPTERS_META = [
  { num: '01', title: 'Executive Summary', id: 'executive', rewritable: true, field: 'executiveSummary' },
  { num: '02', title: 'Problem & Solution', id: 'problem-solution', rewritable: true, field: 'problemSolution' },
  { num: '03', title: 'Market & Customers', id: 'target-market', rewritable: true, field: 'marketAnalysis' },
  { num: '04', title: 'Business Model', id: 'business-model', rewritable: true, field: 'revenueModel' },
  { num: '05', title: 'Competition & Positioning', id: 'competitive', rewritable: true, field: 'competitorAnalysis' },
  { num: '06', title: 'Go-to-Market', id: 'gtm', rewritable: true, field: 'goToMarket' },
  { num: '07', title: 'Financial Plan', id: 'financials', rewritable: false, field: 'financialPlan' },
  { num: '08', title: 'Company & Team', id: 'team', rewritable: false, field: 'companyTeam' },
  { num: '09', title: 'Funding Requirements', id: 'funding', rewritable: false, field: 'fundingRequirements' },
  { num: '10', title: 'Operations & Milestones', id: 'operations', rewritable: false, field: 'operationsPlan' },
  { num: '11', title: 'Risks & Next Steps', id: 'risks', rewritable: false, field: 'risks' },
  { num: '12', title: 'Legal & Compliance', id: 'legal-framework', rewritable: false, field: 'legalFramework' },
];

export const BusinessPlanFigmaFlow: React.FC<BusinessPlanFigmaFlowProps> = ({
  project,
  bpOutput,
  clarifierOutput,
  forecastBasis,
  formation,
  cross,
  legalFramework,
  currentVersion,
  rewritingSectionId,
  onRewriteSection,
  onEditSection,
  onExportPdf,
  onRegenerate,
  isGenerating = false,
  onNext,
  onBack,
  effectiveIdeaId,
}) => {
  const { t } = useTranslation();

  const getChapterTitle = (chOrNum: typeof CHAPTERS_META[number] | string) => {
    const ch = typeof chOrNum === 'string'
      ? CHAPTERS_META.find(c => c.num === chOrNum || c.id === chOrNum)
      : chOrNum;
    if (!ch) return typeof chOrNum === 'string' ? chOrNum : '';
    switch (ch.id) {
      case 'executive':
        return t('creator.phase3.businessPlan.flow.chapters.executive', ch.title);
      case 'problem-solution':
        return t('creator.phase3.businessPlan.flow.chapters.problemSolution', ch.title);
      case 'target-market':
        return t('creator.phase3.businessPlan.flow.chapters.targetMarket', ch.title);
      case 'business-model':
        return t('creator.phase3.businessPlan.flow.chapters.businessModel', ch.title);
      case 'competitive':
        return t('creator.phase3.businessPlan.flow.chapters.competitive', ch.title);
      case 'gtm':
        return t('creator.phase3.businessPlan.flow.chapters.gtm', ch.title);
      case 'financials':
        return t('creator.phase3.businessPlan.flow.chapters.financials', ch.title);
      case 'team':
        return t('creator.phase3.businessPlan.flow.chapters.team', ch.title);
      case 'funding':
        return t('creator.phase3.businessPlan.flow.chapters.funding', ch.title);
      case 'operations':
        return t('creator.phase3.businessPlan.flow.chapters.operations', ch.title);
      case 'risks':
        return t('creator.phase3.businessPlan.flow.chapters.risks', ch.title);
      case 'legal-framework':
        return t('creator.phase3.businessPlan.flow.chapters.legalFramework', ch.title);
      default:
        return ch.title;
    }
  };

  // Navigation active section scrollspy / selection
  const [activeChapter, setActiveChapter] = useState('01');

  // Derive reviewed state from bpOutput._sectionMeta
  const metaReviewed = (() => {
    const res: Record<string, boolean> = {};
    const meta = bpOutput?._sectionMeta;
    if (meta) {
      CHAPTERS_META.forEach((ch) => {
        if (
          meta[ch.num]?.status === 'reviewed' ||
          meta[ch.id]?.status === 'reviewed' ||
          (ch.field && meta[ch.field]?.status === 'reviewed')
        ) {
          res[ch.num] = true;
        }
      });
    }
    return res;
  })();

  // Local reviewed state for all 12 chapters
  const [reviewedChapters, setReviewedChapters] = useState<Record<string, boolean>>(metaReviewed);

  React.useEffect(() => {
    if (bpOutput?._sectionMeta) {
      setReviewedChapters((prev) => ({
        ...metaReviewed,
        ...prev,
      }));
    }
  }, [metaReviewed, bpOutput?._sectionMeta]);
  // Source chips expansion state
  const [sourceChipsExpanded, setSourceChipsExpanded] = useState(true);

  // Edit section modal state
  const [editModal, setEditModal] = useState<{
    open: boolean;
    sectionId: string;
    title: string;
    content: string;
    isSaving: boolean;
    error: string | null;
  }>({
    open: false,
    sectionId: '',
    title: '',
    content: '',
    isSaving: false,
    error: null,
  });

  const toggleReviewed = (chapterNum: string) => {
    setReviewedChapters((prev) => ({
      ...prev,
      [chapterNum]: !prev[chapterNum],
    }));
  };

  const renderReviewedBadge = (num: string) => (
    <Badge
      variant="outline"
      className={`text-badge font-medium rounded-full font-sans ${
        reviewedChapters[num]
          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
          : 'bg-muted/60 text-muted-foreground'
      }`}
    >
      {reviewedChapters[num]
        ? t('creator.phase3.businessPlan.flow.reviewed', 'Reviewed')
        : t('creator.phase3.businessPlan.flow.draft', 'Draft')}
    </Badge>
  );

  const renderReviewedButton = (num: string, variant: 'button' | 'ghost' = 'ghost') => {
    if (variant === 'button') {
      return (
        <Button
          variant="outline"
          size="sm"
          onClick={() => toggleReviewed(num)}
          className={`gap-1.5 text-button font-semibold rounded-lg font-sans ${
            reviewedChapters[num]
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/40'
              : 'bg-muted/40 text-foreground hover:bg-muted/70'
          }`}
        >
          <Check className={`h-3.5 w-3.5 ${reviewedChapters[num] ? 'text-emerald-600' : 'text-emerald-700'}`} />
          <span>
            {reviewedChapters[num]
              ? t('creator.phase3.businessPlan.flow.reviewed', 'Reviewed')
              : t('creator.phase3.businessPlan.flow.markReviewed', 'Mark reviewed')}
          </span>
        </Button>
      );
    }
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => toggleReviewed(num)}
        className="text-button text-muted-foreground hover:text-foreground font-sans"
      >
        {reviewedChapters[num]
          ? t('creator.phase3.businessPlan.flow.reviewed', 'Reviewed')
          : t('creator.phase3.businessPlan.flow.markReviewed', 'Mark reviewed')}
      </Button>
    );
  };

  const scrollToChapter = (chapterNum: string) => {
    setActiveChapter(chapterNum);
    const element = document.getElementById(`chapter-${chapterNum}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const openEditor = (sectionId: string, title: string, currentContent: string) => {
    setEditModal({
      open: true,
      sectionId,
      title,
      content: currentContent,
      isSaving: false,
      error: null,
    });
  };

  const handleSaveEdit = async () => {
    if (!editModal.sectionId) return;
    setEditModal((prev) => ({ ...prev, isSaving: true, error: null }));
    try {
      await onEditSection(editModal.sectionId, editModal.content);
      setEditModal((prev) => ({ ...prev, open: false, isSaving: false }));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to save section edit.';
      setEditModal((prev) => ({ ...prev, isSaving: false, error: msg }));
    }
  };

  const c = forecastBasis?.currency?.toUpperCase() || 'EUR';
  const currencySymbol = c === 'USD' ? '$' : c === 'GBP' ? '£' : '€';

  // Financial metrics for Year 1, 2, 3
  const financialData = (() => {
    const years = forecastBasis?.years;
    if (years && years.length >= 3) {
      return {
        y1: {
          rev: years[0].revenue,
          opex: years[0].opex,
          net: years[0].netIncome || years[0].revenue - years[0].opex,
        },
        y2: {
          rev: years[1].revenue,
          opex: years[1].opex,
          net: years[1].netIncome || years[1].revenue - years[1].opex,
        },
        y3: {
          rev: years[2].revenue,
          opex: years[2].opex,
          net: years[2].netIncome || years[2].revenue - years[2].opex,
        },
      };
    }
    return {
      y1: { rev: 0, opex: 0, net: 0 },
      y2: { rev: 0, opex: 0, net: 0 },
      y3: { rev: 0, opex: 0, net: 0 },
    };
  })();

  const maxVal = Math.max(
    financialData.y1.rev,
    financialData.y1.opex,
    financialData.y2.rev,
    financialData.y2.opex,
    financialData.y3.rev,
    financialData.y3.opex
  );
  const maxFinancialRev = maxVal > 0 ? maxVal * 1.15 : 1000;

  const formatAmount = (num: number) => {
    return `${currencySymbol}${num.toLocaleString()}`;
  };

  const formatCompact = (val: number) => {
    if (val >= 1_000_000) return `${currencySymbol}${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `${currencySymbol}${(val / 1_000).toFixed(0)}k`;
    return `${currencySymbol}${Math.round(val)}`;
  };

  const chaptersMeta = CHAPTERS_META;

  // Derive dynamic strings
  const projectName = project.name?.trim() || 'Your Venture';
  const countryName = project.country?.trim() || 'France';
  const categoryName = project.category?.trim() || 'Subscription software';

  return (
    <div className="w-full min-w-0 font-sans space-y-6">
      {/* 1. TOP COMPACT TOOLBAR (Figma Node 57158:10712) */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-page-heading font-bold tracking-tight text-foreground font-heading">
              {t('creator.phase3.businessPlan.flow.title', 'Your business plan')}
            </h1>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-card border border-border shadow-xs">
              <span className="text-badge font-semibold text-foreground font-sans">{projectName}</span>
            </div>
            <Badge
              variant="outline"
              className="text-badge font-semibold tracking-wider uppercase bg-muted/60 text-muted-foreground border-border/80 px-2.5 py-0.5 rounded-full font-sans"
            >
              {t('creator.phase3.businessPlan.flow.draft', 'DRAFT')}
            </Badge>
          </div>
          <p className="text-body text-muted-foreground mt-1 font-sans">
            {t('creator.phase3.businessPlan.flow.builtFromCompleted', "Built from the work you've already completed.")}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={onExportPdf}
            className="gap-2 text-button font-semibold rounded-xl bg-card border-border hover:bg-muted/40 transition-colors shadow-xs font-sans"
          >
            <FileDown className="h-4 w-4 text-muted-foreground" />
            <span>{t('creator.phase3.businessPlan.flow.download', 'Download')}</span>
            <ChevronDown className="h-3 w-3 text-muted-foreground ml-0.5" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={onExportPdf}
            title={t('creator.phase3.businessPlan.flow.moreActions', 'More actions')}
            aria-label={t('creator.phase3.businessPlan.flow.moreActions', 'More actions')}
            className="rounded-xl bg-card border-border hover:bg-muted/40 transition-colors shadow-xs shrink-0 h-9 w-9 font-sans"
          >
            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
          </Button>

          <Button
            onClick={onRegenerate}
            disabled={isGenerating}
            className="gap-2 text-button font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xs font-sans"
          >
            <span>{t('creator.phase3.businessPlan.flow.regenerate', 'Regenerate Business Plan')}</span>
            <RotateCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* 2. QUIET CONTEXT NOTICE */}
      <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg bg-muted/50 border border-border/50 text-caption text-muted-foreground font-sans">
        <Info className="h-4 w-4 text-muted-foreground shrink-0" />
        <span>{t('creator.phase3.businessPlan.flow.contextNotice', 'All chapters are currently in Draft status based on assembled project data.')}</span>
      </div>

      {/* 3. MAIN WORKSPACE (2-Column: Left Chapter Navigator + Right Continuous Document) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ASIDE - LEFT: Chapter Navigator */}
        <aside className="lg:col-span-3 lg:self-start lg:sticky lg:top-20 z-20 hidden lg:block">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-xs space-y-2 max-h-[calc(100vh-6rem)] overflow-y-auto">
            <div className="flex items-center justify-between px-2 pb-2 border-b border-border/60">
              <span className="text-badge font-bold uppercase tracking-wider text-muted-foreground font-sans">
                {t('creator.phase3.businessPlan.flow.contents', 'CONTENTS')}
              </span>
              <span className="text-badge font-medium text-muted-foreground font-sans">
                {t('creator.phase3.businessPlan.flow.sectionsCount', '12 Sections')}
              </span>
            </div>

            <nav className="space-y-1">
              {chaptersMeta.map((ch) => {
                const isActive = activeChapter === ch.num;
                const isReviewed = reviewedChapters[ch.num];
                return (
                  <button
                    key={ch.num}
                    type="button"
                    onClick={() => scrollToChapter(ch.num)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all text-caption font-sans ${
                      isActive
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className={`font-mono text-badge ${isActive ? 'text-primary' : 'text-muted-foreground/80'}`}>
                        {ch.num}
                      </span>
                      <span className="truncate">{getChapterTitle(ch)}</span>
                    </div>

                    <span
                      className={`text-badge font-medium px-2 py-0.5 rounded-sm font-sans shrink-0 ${
                        isReviewed
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : isActive
                          ? 'bg-primary/20 text-primary'
                          : 'bg-muted/60 text-muted-foreground'
                      }`}
                    >
                      {isReviewed
                        ? t('creator.phase3.businessPlan.flow.reviewed', 'Reviewed')
                        : t('creator.phase3.businessPlan.flow.draft', 'Draft')}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* ARTICLE - RIGHT: Continuous Document Surface */}
        <article className="lg:col-span-9 rounded-2xl border border-border bg-card p-6 sm:p-10 shadow-xs space-y-10">
          {/* DOCUMENT HEADER */}
          <div className="p-6 sm:p-8 rounded-xl bg-muted/40 dark:bg-muted/20 border border-border/60 space-y-2">
            <h1 className="text-stat-xl font-bold tracking-tight text-foreground font-heading">
              {projectName}
            </h1>
            <p className="text-section-title font-medium text-muted-foreground font-sans">
              {t('creator.phase3.businessPlan.flow.businessPlanTitle', 'Business Plan')}
            </p>
            <div className="flex items-center gap-2 text-caption text-muted-foreground pt-1 flex-wrap font-sans">
              <span>{countryName}</span>
              <span>•</span>
              <span>{categoryName}</span>
              <span>•</span>
              <span className="text-primary font-medium">
                {t('creator.phase3.businessPlan.flow.draftStatus', 'Draft Status')}
              </span>
            </div>
          </div>

          {/* CHAPTER 01: EXECUTIVE SUMMARY */}
          <section id="chapter-01" className="space-y-4 pt-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <h2 className="text-section-title font-bold text-foreground font-heading">
                  01 · {getChapterTitle(CHAPTERS_META[0])}
                </h2>
                {renderReviewedBadge('01')}
              </div>
            </div>

            <p className="text-body text-muted-foreground font-sans">
              {t('creator.phase3.businessPlan.flow.ch1.desc', 'Your business in one clear overview.')}
            </p>

            <div className="text-body text-foreground leading-relaxed font-sans space-y-3">
              {bpOutput?.executiveSummary?.overview ? (
                bpOutput.executiveSummary.overview.split('\n\n').map((para, i) => (
                  <p key={i}>{para}</p>
                ))
              ) : (
                <>
                  <p>
                    {projectName} {t('creator.phase3.businessPlan.flow.ch1.isPlanned', 'is a planned')} {categoryName.toLowerCase()} {t('creator.phase3.businessPlan.flow.ch1.platformIn', 'platform in')} {countryName}{' '}
                    {t('creator.phase3.businessPlan.flow.ch1.designedToSolve', 'designed to solve critical workflow challenges for')} {project.targetUser || t('creator.phase3.businessPlan.flow.ch1.targetCustomers', 'target customers')}.
                  </p>
                  <p>
                    {project.solution ||
                      t('creator.phase3.businessPlan.flow.ch1.defaultSolution', 'The venture focuses on automated digital workflows and structured processing tailored for {{targetUser}}.', { targetUser: project.targetUser || t('creator.phase3.businessPlan.flow.ch1.modernClients', 'modern clients') })}
                  </p>
                  <p>
                    {t('creator.phase3.businessPlan.flow.ch1.modelLeverages', 'The business model leverages scalable customer acquisition, recurring value delivery, and operational milestones aligned with {{country}} regulatory standards.', { country: countryName })}
                  </p>
                </>
              )}
            </div>

            {/* Collapsible Source Chips */}
            <div className="rounded-xl border border-border/60 bg-muted/30 p-3.5 space-y-2">
              <button
                type="button"
                onClick={() => setSourceChipsExpanded(!sourceChipsExpanded)}
                className="flex items-center justify-between w-full text-badge font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground font-sans"
              >
                <span>{t('creator.phase3.businessPlan.flow.builtFromAssembled', 'BUILT FROM ASSEMBLED INPUTS')}</span>
                {sourceChipsExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>

              {sourceChipsExpanded && (
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  {[
                    t('creator.phase3.businessPlan.flow.sourceChips.projectConcept', 'Project Concept'),
                    t('creator.phase3.businessPlan.flow.sourceChips.businessModel', 'Business Model'),
                    t('creator.phase3.businessPlan.flow.sourceChips.financialForecast', 'Financial Forecast'),
                    t('creator.phase3.businessPlan.flow.sourceChips.companySetup', 'Company Setup'),
                  ].map((chip) => (
                    <span
                      key={chip}
                      className="px-2.5 py-1 rounded-md text-badge font-medium bg-card border border-border text-foreground/80 shadow-xs font-sans"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Action Row */}
            <div className="flex items-center gap-2 flex-wrap pt-2">
              {renderReviewedButton('01', 'button')}

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  openEditor(
                    'executive',
                    `01 · ${getChapterTitle(CHAPTERS_META[0])}`,
                    bpOutput?.executiveSummary?.overview || ''
                  )
                }
                className="gap-1.5 text-button font-semibold rounded-lg bg-muted/40 text-foreground hover:bg-muted/70 font-sans"
              >
                <Pencil className="h-3.5 w-3.5 text-foreground/70" />
                <span>{t('creator.phase3.businessPlan.flow.editText', 'Edit text')}</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onRewriteSection('executive')}
                disabled={rewritingSectionId === 'executive'}
                className="gap-1.5 text-button font-semibold rounded-lg bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 font-sans"
              >
                {rewritingSectionId === 'executive' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                <span>{t('creator.phase3.businessPlan.flow.rewriteWithAi', 'Rewrite with AI')}</span>
              </Button>
            </div>
          </section>

          <hr className="border-border/60" />

          {/* CHAPTER 02: PROBLEM & SOLUTION */}
          <section id="chapter-02" className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <h2 className="text-section-title font-bold text-foreground font-heading">
                  02 · {getChapterTitle(CHAPTERS_META[1])}
                </h2>
                {renderReviewedBadge('02')}
              </div>
            </div>

            <p className="text-body text-muted-foreground font-sans">
              {t('creator.phase3.businessPlan.flow.ch2.desc', 'What needs to improve and how your project helps.')}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 sm:p-5 rounded-xl border border-border/70 bg-muted/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-badge font-bold uppercase tracking-wider text-muted-foreground font-sans">
                    {t('creator.phase3.businessPlan.flow.ch2.problemLabel', 'THE PROBLEM')}
                  </span>
                  {(bpOutput?.problemSolution?.problem || clarifierOutput?.problemDefinition?.statement) && (
                    <Badge variant="outline" className="text-badge bg-primary/10 text-primary border-primary/20 font-sans font-medium">
                      {t('creator.phase3.businessPlan.flow.aiSynthesized', 'AI Synthesized')}
                    </Badge>
                  )}
                </div>
                <p className="text-body text-foreground font-sans leading-relaxed">
                  {bpOutput?.problemSolution?.problem ||
                    clarifierOutput?.problemDefinition?.statement ||
                    (bpOutput?.executiveSummary?.overview ? bpOutput.executiveSummary.overview.split('\n\n')[0] : '') ||
                    project.problem ||
                    t('creator.phase3.businessPlan.flow.ch2.defaultProblem', 'Core operational friction and manual fragmentation experienced by {{targetUser}} in {{country}}.', { targetUser: project.targetUser || 'target users', country: countryName })}
                </p>
              </div>

              <div className="p-4 sm:p-5 rounded-xl border border-border/70 bg-muted/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-badge font-bold uppercase tracking-wider text-muted-foreground font-sans">
                    {t('creator.phase3.businessPlan.flow.ch2.solutionLabel', 'THE PROPOSED SOLUTION')}
                  </span>
                  {(bpOutput?.problemSolution?.solution || clarifierOutput?.proposedSolution?.summary || clarifierOutput?.proposedSolution?.valueProposition) && (
                    <Badge variant="outline" className="text-badge bg-primary/10 text-primary border-primary/20 font-sans font-medium">
                      {t('creator.phase3.businessPlan.flow.aiSynthesized', 'AI Synthesized')}
                    </Badge>
                  )}
                </div>
                <p className="text-body text-foreground font-sans leading-relaxed">
                  {bpOutput?.problemSolution?.solution ||
                    clarifierOutput?.proposedSolution?.summary ||
                    clarifierOutput?.proposedSolution?.valueProposition ||
                    bpOutput?.executiveSummary?.valueProposition ||
                    project.solution ||
                    t('creator.phase3.businessPlan.flow.ch2.defaultSolution', '{{project}} provides an integrated {{category}} solution to streamline operations for {{targetUser}}.', { project: projectName, category: categoryName.toLowerCase(), targetUser: project.targetUser || 'users' })}
                </p>
              </div>
            </div>

            {/* Action Row */}
            <div className="flex items-center gap-2 flex-wrap pt-2">
              {renderReviewedButton('02', 'button')}

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  openEditor(
                    'problem-solution',
                    `02 · ${getChapterTitle(CHAPTERS_META[1])}`,
                    bpOutput?.problemSolution?.problem || clarifierOutput?.problemDefinition?.statement || project.problem || ''
                  )
                }
                className="gap-1.5 text-button font-semibold rounded-lg bg-muted/40 text-foreground hover:bg-muted/70 font-sans"
              >
                <Pencil className="h-3.5 w-3.5 text-foreground/70" />
                <span>{t('creator.phase3.businessPlan.flow.editText', 'Edit text')}</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onRewriteSection('problem-solution')}
                disabled={rewritingSectionId === 'problem-solution'}
                className="gap-1.5 text-button font-semibold rounded-lg bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 font-sans"
              >
                {rewritingSectionId === 'problem-solution' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                <span>{t('creator.phase3.businessPlan.flow.rewriteWithAi', 'Rewrite with AI')}</span>
              </Button>

              <Link
                href={effectiveIdeaId ? `/dashboard/creator/phase-2/clarifier?ideaId=${effectiveIdeaId}` : '/dashboard/creator/phase-2/clarifier'}
                className="inline-flex items-center gap-1.5 text-button font-semibold text-primary hover:underline font-sans ml-auto"
              >
                <span>{t('creator.phase3.businessPlan.flow.viewProjectConcept', 'View project concept')}</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </section>

          <hr className="border-border/60" />

          {/* CHAPTER 03: MARKET & CUSTOMERS */}
          <section id="chapter-03" className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <h2 className="text-section-title font-bold text-foreground font-heading">
                  03 · {getChapterTitle(CHAPTERS_META[2])}
                </h2>
                {renderReviewedBadge('03')}
              </div>
            </div>

            <p className="text-body text-muted-foreground font-sans">
              {t('creator.phase3.businessPlan.flow.ch3.desc', 'Who the service is for and what supports the opportunity.')}
            </p>

            <div className="p-4 sm:p-5 rounded-xl border border-border/70 bg-muted/30 space-y-2.5 font-sans">
              <div className="flex items-start gap-2.5 text-body text-foreground">
                <span className="text-primary font-bold">•</span>
                <span>
                  {t('creator.phase3.businessPlan.flow.ch3.segmentLabel', 'Initial customer segment:')}{' '}
                  <strong className="text-foreground">
                    {bpOutput?.marketAnalysis?.targetSegments?.[0] || clarifierOutput?.targetAudience?.primarySegment || project.targetUser || t('creator.phase3.businessPlan.flow.ch3.defaultSegment', 'Target commercial clients & early adopters')}
                  </strong>.
                </span>
              </div>
              <div className="flex items-start gap-2.5 text-body text-foreground">
                <span className="text-primary font-bold">•</span>
                <span>
                  {t('creator.phase3.businessPlan.flow.ch3.marketLabel', 'Initial launch market:')} <strong className="text-foreground">{countryName}</strong>.
                </span>
              </div>
              <div className="flex items-start gap-2.5 text-body text-foreground">
                <span className="text-primary font-bold">•</span>
                <span>
                  {t('creator.phase3.businessPlan.flow.ch3.needLabel', 'Customer need to validate:')}{' '}
                  {clarifierOutput?.problemDefinition?.painPoints?.[0] ||
                    bpOutput?.marketAnalysis?.trends?.[0] ||
                    project.problem ||
                    t('creator.phase3.businessPlan.flow.ch3.defaultNeed', 'Operational bottlenecks and workflow friction experienced by {{targetUser}}.', { targetUser: project.targetUser || 'users' })}
                </span>
              </div>
              <div className="flex items-start gap-2.5 text-body text-foreground">
                <span className="text-primary font-bold">•</span>
                <span>
                  {t('creator.phase3.businessPlan.flow.ch3.evidenceLabel', 'Evidence to develop:')}{' '}
                  {bpOutput?.marketAnalysis?.marketSizeQualitative ||
                    clarifierOutput?.targetAudience?.sizeQualitative ||
                    t('creator.phase3.businessPlan.flow.ch3.defaultEvidence', 'In-depth customer interviews, prototype pilots, and direct feedback loops.')}
                </span>
              </div>
            </div>

            {/* Supporting market evidence notice */}
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-caption text-amber-800 dark:text-amber-300 font-sans">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              <span>{t('creator.phase3.businessPlan.flow.ch3.evidenceNotice', 'Add supporting market evidence before using numerical market claims.')}</span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <Link
                href={effectiveIdeaId ? `/dashboard/creator/phase-3/market-study?ideaId=${effectiveIdeaId}` : '/dashboard/creator/phase-3/market-study'}
                className="inline-flex items-center gap-1.5 text-button font-semibold text-primary hover:underline font-sans"
              >
                <span>{t('creator.phase3.businessPlan.flow.viewMarketIntelligence', 'View Market Intelligence')}</span>
                <ExternalLink className="h-3 w-3" />
              </Link>

              {renderReviewedButton('03')}
            </div>
          </section>

          <hr className="border-border/60" />

          {/* CHAPTER 04: BUSINESS MODEL */}
          <section id="chapter-04" className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <h2 className="text-section-title font-bold text-foreground font-heading">
                  04 · {getChapterTitle(CHAPTERS_META[3])}
                </h2>
                {renderReviewedBadge('04')}
              </div>
            </div>

            <p className="text-body text-muted-foreground font-sans">{t('creator.phase3.businessPlan.flow.ch4.desc', 'How the business plans to earn revenue.')}</p>

            <p className="text-body text-foreground leading-relaxed font-sans">
              {bpOutput?.revenueModel?.summary ||
                t('creator.phase3.businessPlan.flow.ch4.defaultSummary', 'The business operates on a {{category}} model with commercial terms tailored for {{targetUser}} in {{country}}.', { category: categoryName.toLowerCase(), targetUser: project.targetUser || 'customers', country: countryName })}
            </p>

            <div className="p-4 rounded-xl border border-border/70 bg-muted/30">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-card border border-border shadow-xs space-y-1">
                  <span className="text-badge font-bold uppercase tracking-wider text-muted-foreground font-sans block">
                    {t('creator.phase3.businessPlan.flow.ch4.revenueModel', 'REVENUE MODEL')}
                  </span>
                  <p className="text-body font-semibold text-foreground font-sans truncate">
                    {bpOutput?.revenueModel?.revenueStreams?.[0]?.name || categoryName || t('creator.phase3.businessPlan.flow.ch4.defaultRevenueStream', 'Recurring Subscriptions')}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-card border border-border shadow-xs space-y-1">
                  <span className="text-badge font-bold uppercase tracking-wider text-muted-foreground font-sans block">
                    {t('creator.phase3.businessPlan.flow.ch4.pricing', 'PRICING')}
                  </span>
                  <p className="text-body font-semibold text-foreground font-sans truncate">
                    {bpOutput?.revenueModel?.pricingStrategy || t('creator.phase3.businessPlan.flow.ch4.defaultPricing', 'Tiered value pricing')}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-card border border-border shadow-xs space-y-1">
                  <span className="text-badge font-bold uppercase tracking-wider text-muted-foreground font-sans block">
                    {t('creator.phase3.businessPlan.flow.ch4.delivery', 'DELIVERY')}
                  </span>
                  <p className="text-body font-semibold text-foreground font-sans truncate">
                    {categoryName || t('creator.phase3.businessPlan.flow.ch4.defaultDelivery', 'Online platform')}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-card border border-border shadow-xs space-y-1">
                  <span className="text-badge font-bold uppercase tracking-wider text-muted-foreground font-sans block">
                    {t('creator.phase3.businessPlan.flow.ch4.mainCostAreas', 'MAIN COST AREAS')}
                  </span>
                  <p className="text-body font-semibold text-foreground font-sans truncate">
                    {bpOutput?.revenueModel?.keyMetrics?.[0] || t('creator.phase3.businessPlan.flow.ch4.defaultCostAreas', 'Development, infrastructure & acquisition')}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <Link
                href={effectiveIdeaId ? `/dashboard/creator/phase-3/business-model?ideaId=${effectiveIdeaId}` : '/dashboard/creator/phase-3/business-model'}
                className="inline-flex items-center gap-1.5 text-button font-semibold text-primary hover:underline font-sans"
              >
                <span>{t('creator.phase3.businessPlan.flow.updateBusinessModel', 'Update Business Model')}</span>
                <ExternalLink className="h-3 w-3" />
              </Link>

              {renderReviewedButton('04')}
            </div>
          </section>

          <hr className="border-border/60" />

          {/* CHAPTER 05: COMPETITION & POSITIONING */}
          <section id="chapter-05" className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <h2 className="text-section-title font-bold text-foreground font-heading">
                  05 · {getChapterTitle(CHAPTERS_META[4])}
                </h2>
                {renderReviewedBadge('05')}
              </div>
            </div>

            <p className="text-body text-muted-foreground font-sans">
              {t('creator.phase3.businessPlan.flow.ch5.desc', 'What customers use today and why they might consider your service.')}
            </p>

            <div className="overflow-x-auto rounded-xl border border-border/80">
              <table className="w-full text-left text-table-header font-sans">
                <thead className="bg-muted/60 border-b border-border/80">
                  <tr>
                    <th className="px-4 py-3 text-table-header font-bold uppercase tracking-wider text-muted-foreground font-sans">
                      {t('creator.phase3.businessPlan.flow.ch5.thAlternative', 'ALTERNATIVE')}
                    </th>
                    <th className="px-4 py-3 text-table-header font-bold uppercase tracking-wider text-muted-foreground font-sans">
                      {t('creator.phase3.businessPlan.flow.ch5.thCurrentApproach', 'CURRENT APPROACH')}
                    </th>
                    <th className="px-4 py-3 text-table-header font-bold uppercase tracking-wider text-primary font-sans">
                      {t('creator.phase3.businessPlan.flow.ch5.thProposedFocus', 'PROPOSED {{project}} FOCUS', { project: projectName.toUpperCase() })}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {bpOutput?.competitorAnalysis?.competitors && bpOutput.competitorAnalysis.competitors.length > 0 ? (
                    bpOutput.competitorAnalysis.competitors.map((comp, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 text-body font-semibold text-foreground font-sans">{comp.name || `Competitor ${idx + 1}`}</td>
                        <td className="px-4 py-3 text-body text-muted-foreground font-sans">{comp.positioning || comp.strengths?.join(', ') || 'Incumbent alternative'}</td>
                        <td className="px-4 py-3 text-body bg-primary/5 text-foreground font-medium font-sans">
                          {comp.ourAdvantage || comp.weaknesses?.map((w) => `Better ${w}`).join(', ') || `Differentiated value proposition for ${project.targetUser || 'users'}`}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <>
                      <tr>
                        <td className="px-4 py-3 text-body font-semibold text-foreground font-sans">{t('creator.phase3.businessPlan.flow.ch5.row1Alt', 'Manual & Ad-hoc methods')}</td>
                        <td className="px-4 py-3 text-body text-muted-foreground font-sans">{t('creator.phase3.businessPlan.flow.ch5.row1Approach', 'Spreadsheets, emails, and disconnected tools')}</td>
                        <td className="px-4 py-3 text-body bg-primary/5 text-foreground font-medium font-sans">
                          {t('creator.phase3.businessPlan.flow.ch5.row1Focus', 'Unified, automated end-to-end {{category}} experience', { category: categoryName.toLowerCase() })}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-body font-semibold text-foreground font-sans">{t('creator.phase3.businessPlan.flow.ch5.row2Alt', 'Legacy Enterprise platforms')}</td>
                        <td className="px-4 py-3 text-body text-muted-foreground font-sans">{t('creator.phase3.businessPlan.flow.ch5.row2Approach', 'Broad, complex legacy systems with high overhead')}</td>
                        <td className="px-4 py-3 text-body bg-primary/5 text-foreground font-medium font-sans">
                          {t('creator.phase3.businessPlan.flow.ch5.row2Focus', 'Modern, purpose-built workflows tailored for {{targetUser}}', { targetUser: project.targetUser || 'users' })}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-body font-semibold text-foreground font-sans">{t('creator.phase3.businessPlan.flow.ch5.row3Alt', 'Fragmented point solutions')}</td>
                        <td className="px-4 py-3 text-body text-muted-foreground font-sans">{t('creator.phase3.businessPlan.flow.ch5.row3Approach', 'Single-purpose tools requiring manual integration')}</td>
                        <td className="px-4 py-3 text-body bg-primary/5 text-foreground font-medium font-sans">
                          {t('creator.phase3.businessPlan.flow.ch5.row3Focus', 'Integrated ecosystem designed for {{country}} market standards', { country: countryName })}
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>

            <p className="text-caption text-muted-foreground italic font-sans">
              {t('creator.phase3.businessPlan.flow.ch5.workingAssumption', 'This positioning is a working assumption to test with customers.')}
            </p>

            <div className="flex items-center justify-end pt-1">
              {renderReviewedButton('05')}
            </div>
          </section>

          <hr className="border-border/60" />

          {/* CHAPTER 06: GO-TO-MARKET */}
          <section id="chapter-06" className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <h2 className="text-section-title font-bold text-foreground font-heading">
                  06 · {getChapterTitle(CHAPTERS_META[5])}
                </h2>
                {renderReviewedBadge('06')}
              </div>
            </div>

            <p className="text-body text-muted-foreground font-sans">{t('creator.phase3.businessPlan.flow.ch6.desc', 'How the first customers could discover the service.')}</p>

            <p className="text-body text-foreground leading-relaxed font-sans">
              {bpOutput?.goToMarket?.strategy ||
                t('creator.phase3.businessPlan.flow.ch6.defaultStrategy', 'The initial launch will focus on targeted outreach to {{targetUser}} in {{country}} to validate core workflows and gather user feedback before broader commercial rollout.', { targetUser: project.targetUser || 'early adopter customers', country: countryName })}
            </p>

            <div className="p-4 rounded-xl border border-border/70 bg-muted/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-badge font-bold uppercase tracking-wider text-muted-foreground font-sans block">
                  {t('creator.phase3.businessPlan.flow.ch6.firstAcquisitionChannel', 'FIRST ACQUISITION CHANNEL')}
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-body font-semibold text-foreground font-sans">
                    {bpOutput?.goToMarket?.channels?.[0] || t('creator.phase3.businessPlan.flow.ch6.defaultChannel', 'Primary direct outreach')}
                  </span>
                  <Badge variant="outline" className={`text-badge font-sans ${bpOutput?.goToMarket?.channels?.[0] ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted/60 text-muted-foreground'}`}>
                    {bpOutput?.goToMarket?.channels?.[0] ? t('creator.phase3.businessPlan.flow.activeChannel', 'Active Channel') : t('creator.phase3.businessPlan.flow.toBeDecided', 'To be decided')}
                  </Badge>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  openEditor(
                    'gtm',
                    `06 · ${getChapterTitle(CHAPTERS_META[5])}`,
                    bpOutput?.goToMarket?.strategy || ''
                  )
                }
                className="text-button font-semibold rounded-lg bg-card font-sans"
              >
                {t('creator.phase3.businessPlan.flow.addYourApproach', 'Add your approach')}
              </Button>
            </div>

            <div className="flex items-center justify-end pt-1">
              {renderReviewedButton('06')}
            </div>
          </section>

          <hr className="border-border/60" />

          {/* CHAPTER 07: FINANCIAL PLAN */}
          <section id="chapter-07" className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <h2 className="text-section-title font-bold text-foreground font-heading">
                  07 · {getChapterTitle(CHAPTERS_META[6])}
                </h2>
                {renderReviewedBadge('07')}
              </div>
            </div>

            <p className="text-body text-muted-foreground font-sans">
              {t('creator.phase3.businessPlan.flow.ch7.desc', 'The forecast and assumptions behind the project.')}
            </p>

            {/* Financial Summary Table */}
            <div className="overflow-x-auto rounded-xl border border-border/80">
              <table className="w-full text-left text-table-header font-sans">
                <thead className="bg-muted/60 border-b border-border/80">
                  <tr>
                    <th className="px-4 py-3 text-table-header font-bold uppercase tracking-wider text-muted-foreground font-sans">
                      {t('creator.phase3.businessPlan.flow.ch7.thMetric', 'METRIC')}
                    </th>
                    <th className="px-4 py-3 text-table-header font-bold uppercase tracking-wider text-muted-foreground font-sans">
                      {t('creator.phase3.businessPlan.flow.ch7.thYear1', 'YEAR 1')}
                    </th>
                    <th className="px-4 py-3 text-table-header font-bold uppercase tracking-wider text-muted-foreground font-sans">
                      {t('creator.phase3.businessPlan.flow.ch7.thYear2', 'YEAR 2')}
                    </th>
                    <th className="px-4 py-3 text-table-header font-bold uppercase tracking-wider text-muted-foreground font-sans">
                      {t('creator.phase3.businessPlan.flow.ch7.thYear3', 'YEAR 3')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  <tr>
                    <td className="px-4 py-3 text-body font-medium text-foreground font-sans">{t('creator.phase3.businessPlan.flow.ch7.revenue', 'Revenue')}</td>
                    <td className="px-4 py-3 text-body font-mono font-bold text-primary">
                      {formatAmount(financialData.y1.rev)}
                    </td>
                    <td className="px-4 py-3 text-body font-mono font-bold text-primary">
                      {formatAmount(financialData.y2.rev)}
                    </td>
                    <td className="px-4 py-3 text-body font-mono font-bold text-primary">
                      {formatAmount(financialData.y3.rev)}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-body font-medium text-foreground font-sans">{t('creator.phase3.businessPlan.flow.ch7.operatingCosts', 'Operating costs')}</td>
                    <td className="px-4 py-3 text-body font-mono text-muted-foreground">
                      {formatAmount(financialData.y1.opex)}
                    </td>
                    <td className="px-4 py-3 text-body font-mono text-muted-foreground">
                      {formatAmount(financialData.y2.opex)}
                    </td>
                    <td className="px-4 py-3 text-body font-mono text-muted-foreground">
                      {formatAmount(financialData.y3.opex)}
                    </td>
                  </tr>
                  <tr className="bg-primary/5">
                    <td className="px-4 py-3 text-body font-bold text-foreground font-sans">{t('creator.phase3.businessPlan.flow.ch7.revenueLessCosts', 'Revenue less operating costs')}</td>
                    <td className="px-4 py-3 text-body font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {formatAmount(financialData.y1.net)}
                    </td>
                    <td className="px-4 py-3 text-body font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {formatAmount(financialData.y2.net)}
                    </td>
                    <td className="px-4 py-3 text-body font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {formatAmount(financialData.y3.net)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Visual SVG Chart: FORECAST PROJECTION (3 YEARS) */}
            <div className="p-4 sm:p-5 rounded-xl border border-border/70 bg-muted/20 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-badge font-bold uppercase tracking-wider text-muted-foreground font-sans">
                  {t('creator.phase3.businessPlan.flow.ch7.chartTitle', 'FORECAST PROJECTION (3 YEARS)')}
                </span>
                <div className="flex items-center gap-4 text-caption font-sans">
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-xs inline-block" style={{ backgroundColor: "var(--chart-revenue-dark)" }} />
                    <span className="text-muted-foreground">{t('creator.phase3.businessPlan.flow.ch7.revenue', 'Revenue')}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-xs inline-block" style={{ backgroundColor: "var(--chart-opex)" }} />
                    <span className="text-muted-foreground">{t('creator.phase3.businessPlan.flow.ch7.operatingCosts', 'Operating Costs')}</span>
                  </div>
                </div>
              </div>

              {/* Exact Vector SVG Bar Chart */}
              <div className="w-full h-44 sm:h-52">
                <svg className="w-full h-full" viewBox="0 0 600 200" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  <line x1="50" y1="30" x2="570" y2="30" stroke="currentColor" strokeOpacity="0.1" strokeDasharray="3 3" />
                  <line x1="50" y1="95" x2="570" y2="95" stroke="currentColor" strokeOpacity="0.1" strokeDasharray="3 3" />
                  <line x1="50" y1="160" x2="570" y2="160" stroke="currentColor" strokeOpacity="0.2" />

                  {/* Y-Axis Labels */}
                  <text x="15" y="34" className="text-badge fill-muted-foreground font-mono">
                    {formatCompact(maxFinancialRev)}
                  </text>
                  <text x="15" y="99" className="text-badge fill-muted-foreground font-mono">
                    {formatCompact(Math.round(maxFinancialRev / 2))}
                  </text>
                  <text x="25" y="164" className="text-badge fill-muted-foreground font-mono">
                    {currencySymbol}0
                  </text>

                  {/* Group 1: Year 1 */}
                  <rect
                    x="110"
                    y={financialData.y1.rev > 0 ? 160 - (financialData.y1.rev / maxFinancialRev) * 130 : 158}
                    width="32"
                    height={financialData.y1.rev > 0 ? Math.max(4, (financialData.y1.rev / maxFinancialRev) * 130) : 2}
                    rx="3"
                    fill="var(--chart-revenue-dark)"
                  />
                  <rect
                    x="148"
                    y={financialData.y1.opex > 0 ? 160 - (financialData.y1.opex / maxFinancialRev) * 130 : 158}
                    width="32"
                    height={financialData.y1.opex > 0 ? Math.max(4, (financialData.y1.opex / maxFinancialRev) * 130) : 2}
                    rx="3"
                    fill="var(--chart-opex)"
                  />
                  <text x="145" y="182" textAnchor="middle" className="text-caption fill-muted-foreground font-sans">
                    {t('creator.phase3.businessPlan.flow.ch7.year1', 'Year 1')}
                  </text>

                  {/* Group 2: Year 2 */}
                  <rect
                    x="270"
                    y={financialData.y2.rev > 0 ? 160 - (financialData.y2.rev / maxFinancialRev) * 130 : 158}
                    width="32"
                    height={financialData.y2.rev > 0 ? Math.max(4, (financialData.y2.rev / maxFinancialRev) * 130) : 2}
                    rx="3"
                    fill="var(--chart-revenue-dark)"
                  />
                  <rect
                    x="308"
                    y={financialData.y2.opex > 0 ? 160 - (financialData.y2.opex / maxFinancialRev) * 130 : 158}
                    width="32"
                    height={financialData.y2.opex > 0 ? Math.max(4, (financialData.y2.opex / maxFinancialRev) * 130) : 2}
                    rx="3"
                    fill="var(--chart-opex)"
                  />
                  <text x="305" y="182" textAnchor="middle" className="text-caption fill-muted-foreground font-sans">
                    {t('creator.phase3.businessPlan.flow.ch7.year2', 'Year 2')}
                  </text>

                  {/* Group 3: Year 3 */}
                  <rect
                    x="430"
                    y={financialData.y3.rev > 0 ? 160 - (financialData.y3.rev / maxFinancialRev) * 130 : 158}
                    width="32"
                    height={financialData.y3.rev > 0 ? Math.max(4, (financialData.y3.rev / maxFinancialRev) * 130) : 2}
                    rx="3"
                    fill="var(--chart-revenue-dark)"
                  />
                  <rect
                    x="468"
                    y={financialData.y3.opex > 0 ? 160 - (financialData.y3.opex / maxFinancialRev) * 130 : 158}
                    width="32"
                    height={financialData.y3.opex > 0 ? Math.max(4, (financialData.y3.opex / maxFinancialRev) * 130) : 2}
                    rx="3"
                    fill="var(--chart-opex)"
                  />
                  <text x="465" y="182" textAnchor="middle" className="text-caption fill-muted-foreground font-sans">
                    {t('creator.phase3.businessPlan.flow.ch7.year3', 'Year 3')}
                  </text>
                </svg>
              </div>
            </div>

            <div className="space-y-1 text-footnote text-muted-foreground font-sans">
              <p>
                {t('creator.phase3.businessPlan.flow.ch7.disclaimer1', 'Forecast assumptions, not actual results. This summary does not show cash flow or establish the break-even date.')}
              </p>
              <p>{t('creator.phase3.businessPlan.flow.ch7.disclaimer2', 'Cash requirements and break-even should be reviewed in the full forecast.')}</p>
            </div>

            <div className="flex items-center justify-between pt-1">
              <Link
                href={effectiveIdeaId ? `/dashboard/creator/phase-3/forecast?ideaId=${effectiveIdeaId}` : '/dashboard/creator/phase-3/forecast'}
                className="inline-flex items-center gap-1.5 text-button font-semibold text-primary hover:underline font-sans"
              >
                <span>{t('creator.phase3.businessPlan.flow.updateFinancialForecast', 'Update financial forecast')}</span>
                <ExternalLink className="h-3 w-3" />
              </Link>

              {renderReviewedButton('07')}
            </div>
          </section>

          <hr className="border-border/60" />

          {/* CHAPTER 08: COMPANY & TEAM */}
          <section id="chapter-08" className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <h2 className="text-section-title font-bold text-foreground font-heading">
                  08 · {getChapterTitle(CHAPTERS_META[7])}
                </h2>
                {renderReviewedBadge('08')}
              </div>
            </div>

            <p className="text-body text-muted-foreground font-sans">
              {t('creator.phase3.businessPlan.flow.ch8.desc', 'The planned company setup and people needed to begin.')}
            </p>

            {/* 5-Cell Quick Facts Strip */}
            <div className="p-4 rounded-xl border border-border/70 bg-muted/30">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                <div className="p-2.5 rounded-lg bg-card border border-border shadow-xs space-y-1">
                  <span className="text-badge font-bold uppercase tracking-wider text-muted-foreground font-sans block">
                    {t('creator.phase3.businessPlan.flow.ch8.companyStructure', 'COMPANY STRUCTURE')}
                  </span>
                  <p className="text-body font-semibold text-foreground font-sans truncate">
                    {formation?.selectedType || (project.country === 'France' ? 'SASU' : 'Limited Company')}
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-card border border-border shadow-xs space-y-1">
                  <span className="text-badge font-bold uppercase tracking-wider text-muted-foreground font-sans block">
                    {t('creator.phase3.businessPlan.flow.ch8.ownershipPlan', 'OWNERSHIP PLAN')}
                  </span>
                  <p className="text-body font-semibold text-foreground font-sans">
                    {t('creator.phase3.businessPlan.flow.ch8.founderOwnership', '{{equity}}% Founder', { equity: formation?.founderEquity ?? 100 })}
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-card border border-border shadow-xs space-y-1">
                  <span className="text-badge font-bold uppercase tracking-wider text-muted-foreground font-sans block">
                    {t('creator.phase3.businessPlan.flow.ch8.plannedLeadership', 'PLANNED LEADERSHIP')}
                  </span>
                  <p className="text-body font-semibold text-foreground font-sans truncate">
                    {formation?.plannedRole || t('creator.phase3.businessPlan.flow.ch8.defaultLeadership', 'President / Founder')}
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-card border border-border shadow-xs space-y-1">
                  <span className="text-badge font-bold uppercase tracking-wider text-muted-foreground font-sans block">
                    {t('creator.phase3.businessPlan.flow.ch8.founderResponsibilities', 'FOUNDER RESPONSIBILITIES')}
                  </span>
                  <p className="text-body font-semibold text-foreground font-sans truncate">
                    {formation?.skills?.youHave?.length ? formation.skills.youHave.slice(0, 2).join(', ') : t('creator.phase3.businessPlan.flow.ch8.defaultFounderResponsibilities', 'Product direction & strategy')}
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-card border border-border shadow-xs space-y-1 col-span-2 sm:col-span-1">
                  <span className="text-badge font-bold uppercase tracking-wider text-muted-foreground font-sans block">
                    {t('creator.phase3.businessPlan.flow.ch8.supportToAssess', 'SUPPORT TO ASSESS')}
                  </span>
                  <p className="text-body font-semibold text-foreground font-sans truncate">
                    {cross.youNeed.length ? cross.youNeed.slice(0, 2).join(', ') : t('creator.phase3.businessPlan.flow.ch8.defaultSupport', 'Technical & advisory partners')}
                  </p>
                </div>
              </div>
            </div>

            <p className="text-caption text-muted-foreground italic font-sans">
              {t('creator.phase3.businessPlan.flow.ch8.planningDisclaimer', 'These are planning decisions. The company has not been registered through this screen.')}
            </p>

            {/* 3-Tier Team Breakdown Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-2">
                <span className="text-card-title font-semibold text-foreground font-sans block">
                  {t('creator.phase3.businessPlan.flow.ch8.card1Title', 'Founder Responsibilities')}
                </span>
                <p className="text-body text-muted-foreground font-sans leading-relaxed">
                  {formation?.skills?.youHave?.length
                    ? t('creator.phase3.businessPlan.flow.ch8.card1Prefix', 'Lead responsibilities: {{skills}}.', { skills: formation.skills.youHave.join(', ') })
                    : t('creator.phase3.businessPlan.flow.ch8.card1Default', 'Venture leadership, product architecture, and customer discovery for {{project}}.', { project: projectName })}
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-2">
                <span className="text-card-title font-semibold text-foreground font-sans block">
                  {t('creator.phase3.businessPlan.flow.ch8.card2Title', 'Support for Launch')}
                </span>
                <p className="text-body text-muted-foreground font-sans leading-relaxed">
                  {cross.youNeed.length
                    ? t('creator.phase3.businessPlan.flow.ch8.card2Prefix', 'Key talent to bring in: {{skills}}.', { skills: cross.youNeed.join(', ') })
                    : t('creator.phase3.businessPlan.flow.ch8.card2Default', 'Core technical, commercial, and operational advisors for launch.')}
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-2">
                <span className="text-card-title font-semibold text-foreground font-sans block">
                  {t('creator.phase3.businessPlan.flow.ch8.card3Title', 'Roles for Later Stage')}
                </span>
                <p className="text-body text-muted-foreground font-sans leading-relaxed">
                  {t('creator.phase3.businessPlan.flow.ch8.card3Desc', 'Dedicated growth specialists across customer onboarding, operations, and technical scaling.')}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <Link
                href={effectiveIdeaId ? `/dashboard/creator/phase-3/formation?ideaId=${effectiveIdeaId}` : '/dashboard/creator/phase-3/formation'}
                className="inline-flex items-center gap-1.5 text-button font-semibold text-primary hover:underline font-sans"
              >
                <span>{t('creator.phase3.businessPlan.flow.updateCompanySetup', 'Update company setup')}</span>
                <ExternalLink className="h-3 w-3" />
              </Link>

              {renderReviewedButton('08')}
            </div>
          </section>

          <hr className="border-border/60" />

          {/* CHAPTER 09: FUNDING REQUIREMENTS */}
          <section id="chapter-09" className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <h2 className="text-section-title font-bold text-foreground font-heading">
                  09 · {getChapterTitle(CHAPTERS_META[8])}
                </h2>
                {renderReviewedBadge('09')}
              </div>
            </div>

            <p className="text-body text-muted-foreground font-sans">
              {t('creator.phase3.businessPlan.flow.ch9.desc', 'What funding may be needed and which decisions come later.')}
            </p>

            <div className="p-4 sm:p-5 rounded-xl border border-border/70 bg-muted/30 space-y-3 font-sans">
              <div className="flex items-start gap-2.5 text-body text-foreground pb-2 border-b border-border/60">
                <span className="text-muted-foreground font-medium shrink-0">{t('creator.phase3.businessPlan.flow.ch9.fundingNeedLabel', 'Funding need:')}</span>
                <span className="font-semibold text-foreground">
                  {cross.seedAsk
                    ? t('creator.phase3.businessPlan.flow.ch9.targetSeedAsk', 'Target seed ask: {{amount}}', { amount: formatAmount(cross.seedAsk) })
                    : t('creator.phase3.businessPlan.flow.ch9.forecastConfirmation', 'To be confirmed from the cash-flow forecast.')}
                </span>
              </div>
              <div className="flex items-start gap-2.5 text-body text-foreground">
                <span className="text-muted-foreground font-medium shrink-0">{t('creator.phase3.businessPlan.flow.ch9.fundraisingTermsLabel', 'Fundraising amount and terms:')}</span>
                <span className="font-semibold text-foreground">
                  {cross.seedAsk ? t('creator.phase3.businessPlan.flow.ch9.stagedDeployment', 'Staged deployment across launch milestones.') : t('creator.phase3.businessPlan.flow.ch9.decideOnRunway', 'To be decided based on runway.')}
                </span>
              </div>
            </div>

            <p className="text-footnote text-muted-foreground font-sans leading-relaxed">
              {t('creator.phase3.businessPlan.flow.ch9.shortfallNote', 'A financial shortfall and a fundraising target are different decisions. Funding options will be developed when the project reaches that stage.')}
            </p>

            <div className="flex items-center justify-end pt-1">
              {renderReviewedButton('09')}
            </div>
          </section>

          <hr className="border-border/60" />

          {/* CHAPTER 10: OPERATIONS & MILESTONES */}
          <section id="chapter-10" className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <h2 className="text-section-title font-bold text-foreground font-heading">
                  10 · {getChapterTitle(CHAPTERS_META[9])}
                </h2>
                {renderReviewedBadge('10')}
              </div>
            </div>

            <p className="text-body text-muted-foreground font-sans">
              {t('creator.phase3.businessPlan.flow.ch10.desc', 'How the project will move from preparation to launch.')}
            </p>

            <div className="overflow-x-auto rounded-xl border border-border/80">
              <table className="w-full text-left text-table-header font-sans">
                <thead className="bg-muted/60 border-b border-border/80">
                  <tr>
                    <th className="px-4 py-3 text-table-header font-bold uppercase tracking-wider text-muted-foreground font-sans">
                      {t('creator.phase3.businessPlan.flow.ch10.thStage', 'STAGE')}
                    </th>
                    <th className="px-4 py-3 text-table-header font-bold uppercase tracking-wider text-muted-foreground font-sans">
                      {t('creator.phase3.businessPlan.flow.ch10.thIntendedOutcome', 'INTENDED OUTCOME')}
                    </th>
                    <th className="px-4 py-3 text-table-header font-bold uppercase tracking-wider text-muted-foreground font-sans">
                      {t('creator.phase3.businessPlan.flow.ch10.thTiming', 'TIMING')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {bpOutput?.operationsPlan?.milestones && bpOutput.operationsPlan.milestones.length > 0 ? (
                    bpOutput.operationsPlan.milestones.map((m, i) => (
                      <tr key={i}>
                        <td className="px-4 py-3 text-body font-semibold text-foreground font-sans">{m.title}</td>
                        <td className="px-4 py-3 text-body text-muted-foreground font-sans">{m.description}</td>
                        <td className="px-4 py-3 text-body text-muted-foreground font-sans">{m.timeframe || t('creator.phase3.businessPlan.flow.ch10.toBePlanned', 'To be planned')}</td>
                      </tr>
                    ))
                  ) : (
                    <>
                      <tr>
                        <td className="px-4 py-3 text-body font-semibold text-foreground font-sans">{t('creator.phase3.businessPlan.flow.ch10.validateTitle', 'Validate')}</td>
                        <td className="px-4 py-3 text-body text-muted-foreground font-sans">{t('creator.phase3.businessPlan.flow.ch10.validateOutcome', 'Confirm core problem and workflow priorities with {{targetUser}}', { targetUser: project.targetUser || 'target users' })}</td>
                        <td className="px-4 py-3 text-body text-muted-foreground font-sans">{t('creator.phase3.businessPlan.flow.ch10.phase1', 'Phase 1')}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-body font-semibold text-foreground font-sans">{t('creator.phase3.businessPlan.flow.ch10.buildTitle', 'Build')}</td>
                        <td className="px-4 py-3 text-body text-muted-foreground font-sans">{t('creator.phase3.businessPlan.flow.ch10.buildOutcome', 'Develop the core {{category}} minimum viable product ({{project}})', { category: categoryName.toLowerCase(), project: projectName })}</td>
                        <td className="px-4 py-3 text-body text-muted-foreground font-sans">{t('creator.phase3.businessPlan.flow.ch10.phase2', 'Phase 2')}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-body font-semibold text-foreground font-sans">{t('creator.phase3.businessPlan.flow.ch10.pilotTitle', 'Pilot')}</td>
                        <td className="px-4 py-3 text-body text-muted-foreground font-sans">{t('creator.phase3.businessPlan.flow.ch10.pilotOutcome', 'Test early version with initial cohort in {{country}}', { country: countryName })}</td>
                        <td className="px-4 py-3 text-body text-muted-foreground font-sans">{t('creator.phase3.businessPlan.flow.ch10.phase3', 'Phase 3')}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-body font-semibold text-foreground font-sans">{t('creator.phase3.businessPlan.flow.ch10.launchTitle', 'Launch')}</td>
                        <td className="px-4 py-3 text-body text-muted-foreground font-sans">{t('creator.phase3.businessPlan.flow.ch10.launchOutcome', 'Refine offer based on customer metrics and expand commercial rollout')}</td>
                        <td className="px-4 py-3 text-body text-muted-foreground font-sans">{t('creator.phase3.businessPlan.flow.ch10.phase4', 'Phase 4')}</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end pt-1">
              {renderReviewedButton('10')}
            </div>
          </section>

          <hr className="border-border/60" />

          {/* CHAPTER 11: RISKS & NEXT STEPS */}
          <section id="chapter-11" className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <h2 className="text-section-title font-bold text-foreground font-heading">
                  11 · {getChapterTitle(CHAPTERS_META[10])}
                </h2>
                {renderReviewedBadge('11')}
              </div>
            </div>

            <p className="text-body text-muted-foreground font-sans">
              {t('creator.phase3.businessPlan.flow.ch11.desc', 'What needs attention as the project develops.')}
            </p>

            {/* Risk Table */}
            <div className="overflow-x-auto rounded-xl border border-border/80">
              <table className="w-full text-left text-table-header font-sans">
                <thead className="bg-muted/60 border-b border-border/80">
                  <tr>
                    <th className="px-4 py-3 text-table-header font-bold uppercase tracking-wider text-muted-foreground font-sans">
                      {t('creator.phase3.businessPlan.flow.ch11.thRisk', 'RISK')}
                    </th>
                    <th className="px-4 py-3 text-table-header font-bold uppercase tracking-wider text-muted-foreground font-sans">
                      {t('creator.phase3.businessPlan.flow.ch11.thWhyItMatters', 'WHY IT MATTERS')}
                    </th>
                    <th className="px-4 py-3 text-table-header font-bold uppercase tracking-wider text-muted-foreground font-sans">
                      {t('creator.phase3.businessPlan.flow.ch11.thPlannedResponse', 'PLANNED RESPONSE')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {bpOutput?.risks && bpOutput.risks.length > 0 ? (
                    bpOutput.risks.map((r, i) => (
                      <tr key={i}>
                        <td className="px-4 py-3 text-body font-semibold text-foreground font-sans">{(r as any).risk || r.category || t('creator.phase3.businessPlan.flow.ch11.identifiedRisk', 'Identified Risk')}</td>
                        <td className="px-4 py-3 text-body text-muted-foreground font-sans">{r.description}</td>
                        <td className="px-4 py-3 text-body text-foreground font-medium font-sans">{r.mitigation}</td>
                      </tr>
                    ))
                  ) : (
                    <>
                      <tr>
                        <td className="px-4 py-3 text-body font-semibold text-foreground font-sans">{t('creator.phase3.businessPlan.flow.ch11.risk1Name', 'Customer Adoption')}</td>
                        <td className="px-4 py-3 text-body text-muted-foreground font-sans">{t('creator.phase3.businessPlan.flow.ch11.risk1Why', '{{targetUser}} may take longer to adopt new operational tools', { targetUser: project.targetUser || 'Customers' })}</td>
                        <td className="px-4 py-3 text-body text-foreground font-medium font-sans">{t('creator.phase3.businessPlan.flow.ch11.risk1Resp', 'Conduct direct pilot interviews and validate willingness to pay early')}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-body font-semibold text-foreground font-sans">{t('creator.phase3.businessPlan.flow.ch11.risk2Name', 'Development Timeline')}</td>
                        <td className="px-4 py-3 text-body text-muted-foreground font-sans">{t('creator.phase3.businessPlan.flow.ch11.risk2Why', 'Feature complexity or integrations may take longer than anticipated')}</td>
                        <td className="px-4 py-3 text-body text-foreground font-medium font-sans">{t('creator.phase3.businessPlan.flow.ch11.risk2Resp', 'Prioritize lean core features and iterate continuously')}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-body font-semibold text-foreground font-sans">{t('creator.phase3.businessPlan.flow.ch11.risk3Name', 'Ecosystem & Regulation')}</td>
                        <td className="px-4 py-3 text-body text-muted-foreground font-sans">{t('creator.phase3.businessPlan.flow.ch11.risk3Why', 'Market regulatory standards in {{country}} may evolve', { country: countryName })}</td>
                        <td className="px-4 py-3 text-body text-foreground font-medium font-sans">{t('creator.phase3.businessPlan.flow.ch11.risk3Resp', 'Review legal compliance roadmap regularly with official guidelines')}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-body font-semibold text-foreground font-sans">{t('creator.phase3.businessPlan.flow.ch11.risk4Name', 'Financial Runway')}</td>
                        <td className="px-4 py-3 text-body text-muted-foreground font-sans">{t('creator.phase3.businessPlan.flow.ch11.risk4Why', 'Operating expenses may outpace revenue prior to break-even')}</td>
                        <td className="px-4 py-3 text-body text-foreground font-medium font-sans">{t('creator.phase3.businessPlan.flow.ch11.risk4Resp', 'Monitor burn rate closely and adjust phase milestones')}</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>

            {/* PRIORITIZED NEXT STEPS */}
            <div className="p-4 sm:p-5 rounded-xl border border-border/70 bg-muted/30 space-y-3">
              <span className="text-badge font-bold uppercase tracking-wider text-muted-foreground font-sans block">
                {t('creator.phase3.businessPlan.flow.ch11.prioritizedSteps', 'PRIORITIZED NEXT STEPS')}
              </span>
              <div className="space-y-2">
                {[
                  t('creator.phase3.businessPlan.flow.ch11.step1', 'Conduct validation interviews with {{targetUser}}.', { targetUser: project.targetUser || 'target customers' }),
                  t('creator.phase3.businessPlan.flow.ch11.step2', 'Finalize initial product scope and technical architecture for {{project}}.', { project: projectName }),
                  t('creator.phase3.businessPlan.flow.ch11.step3', 'Review financial forecast and prepare legal formation in {{country}}.', { country: countryName }),
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3 text-body text-foreground font-sans">
                    <span className="h-5 w-5 rounded-full bg-primary/10 text-primary font-bold font-mono text-badge flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end pt-1">
              {renderReviewedButton('11')}
            </div>
          </section>

          <hr className="border-border/60" />

          {/* CHAPTER 12: LEGAL & COMPLIANCE */}
          <section id="chapter-12" className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <h2 className="text-section-title font-bold text-foreground font-heading">
                  12 · {getChapterTitle(CHAPTERS_META[11])}
                </h2>
                {renderReviewedBadge('12')}
              </div>
            </div>

            <p className="text-body text-muted-foreground font-sans">
              {t('creator.phase3.businessPlan.flow.ch12.desc', 'The legal considerations identified for your project.')}
            </p>

            <div className="text-body text-foreground leading-relaxed font-sans space-y-3">
              <p>
                {legalFramework?.summary ||
                  bpOutput?.legalFramework?.summary ||
                  t('creator.phase3.businessPlan.flow.ch12.defaultSummary', 'The legal roadmap identifies topics to review based on the current project, planned company setup and operating model.')}
              </p>
              <p>
                {t('creator.phase3.businessPlan.flow.ch12.guidanceNote', 'Relevant topics may include company formation, customer terms, website information, data protection (GDPR), and activity-specific requirements. Each item has its own timing and official guidance.')}
              </p>
            </div>

            <div className="flex items-center justify-between pt-1">
              <Link
                href={effectiveIdeaId ? `/dashboard/creator/phase-3/compliance?ideaId=${effectiveIdeaId}` : '/dashboard/creator/phase-3/compliance'}
                className="inline-flex items-center gap-1.5 text-button font-semibold text-primary hover:underline font-sans"
              >
                <span>{t('creator.phase3.businessPlan.flow.viewLegalRoadmap')}</span>
                <ExternalLink className="h-3 w-3" />
              </Link>

              {renderReviewedButton('12')}
            </div>
          </section>
        </article>
      </div>

      {/* 4. FOOTER - JOURNEY NAVIGATION FOOTER */}
      <div className="p-4 sm:p-6 rounded-2xl border border-border bg-card shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-caption text-muted-foreground font-sans text-center sm:text-left">
          {t('creator.phase3.businessPlan.flow.footerNote')}
        </p>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <Button
            variant="ghost"
            onClick={onBack}
            className="gap-2 text-button font-bold text-muted-foreground hover:text-foreground font-sans"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{t('creator.phase3.businessPlan.flow.backToFormation')}</span>
          </Button>

          <Button
            onClick={() => onNext(reviewedChapters)}
            className="gap-2 text-button font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs font-sans"
          >
            <span>{t('creator.phase3.businessPlan.flow.continueToReadiness')}</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* INLINE EDIT SECTION DIALOG */}
      <Dialog open={editModal.open} onOpenChange={(open) => setEditModal((prev) => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-xl font-sans">
          <DialogHeader>
            <DialogTitle className="text-base font-bold font-sans">
              {t('creator.phase3.businessPlan.flow.editSection', { title: editModal.title })}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Textarea
              value={editModal.content}
              onChange={(e) => setEditModal((prev) => ({ ...prev, content: e.target.value }))}
              rows={8}
              className="text-sm font-sans resize-none"
              placeholder={t('creator.phase3.businessPlan.flow.enterContent')}
            />
            {editModal.error && (
              <p className="text-xs text-destructive font-medium">{editModal.error}</p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditModal((prev) => ({ ...prev, open: false }))}
              disabled={editModal.isSaving}
            >
              {t('creator.phase3.businessPlan.flow.cancel')}
            </Button>
            <Button
              size="sm"
              onClick={handleSaveEdit}
              disabled={editModal.isSaving}
              className="gap-1.5"
            >
              {editModal.isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {t('creator.phase3.businessPlan.flow.saveChanges')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
