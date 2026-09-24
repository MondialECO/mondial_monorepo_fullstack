'use client';

import React, { useState, useMemo } from 'react';
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
  onNext: () => void;
  onBack: () => void;
  effectiveIdeaId?: string | null;
}

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
  // Navigation active section scrollspy / selection
  const [activeChapter, setActiveChapter] = useState('01');
  // Local reviewed state for all 12 chapters
  const [reviewedChapters, setReviewedChapters] = useState<Record<string, boolean>>({});
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

  const currencySymbol = useMemo(() => {
    const c = forecastBasis?.currency?.toUpperCase() || 'EUR';
    if (c === 'USD') return '$';
    if (c === 'GBP') return '£';
    return '€';
  }, [forecastBasis?.currency]);

  // Financial metrics for Year 1, 2, 3
  const financialData = useMemo(() => {
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
  }, [forecastBasis]);

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

  const chaptersMeta = [
    { num: '01', title: 'Executive Summary', id: 'executive', rewritable: true },
    { num: '02', title: 'Problem & Solution', id: 'problem-solution', rewritable: true },
    { num: '03', title: 'Market & Customers', id: 'target-market', rewritable: true },
    { num: '04', title: 'Business Model', id: 'business-model', rewritable: true },
    { num: '05', title: 'Competition & Positioning', id: 'competitive', rewritable: true },
    { num: '06', title: 'Go-to-Market', id: 'gtm', rewritable: true },
    { num: '07', title: 'Financial Plan', id: 'financials', rewritable: false },
    { num: '08', title: 'Company & Team', id: 'team', rewritable: false },
    { num: '09', title: 'Funding Requirements', id: 'funding', rewritable: false },
    { num: '10', title: 'Operations & Milestones', id: 'operations', rewritable: false },
    { num: '11', title: 'Risks & Next Steps', id: 'risks', rewritable: false },
    { num: '12', title: 'Legal & Compliance', id: 'legal-framework', rewritable: false },
  ];

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
              Your business plan
            </h1>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-card border border-border shadow-xs">
              <span className="text-badge font-semibold text-foreground font-sans">{projectName}</span>
            </div>
            <Badge
              variant="outline"
              className="text-badge font-semibold tracking-wider uppercase bg-muted/60 text-muted-foreground border-border/80 px-2.5 py-0.5 rounded-full font-sans"
            >
              DRAFT
            </Badge>
          </div>
          <p className="text-body text-muted-foreground mt-1 font-sans">
            Built from the work you&apos;ve already completed.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={onExportPdf}
            className="gap-2 text-button font-semibold rounded-xl bg-card border-border hover:bg-muted/40 transition-colors shadow-xs font-sans"
          >
            <FileDown className="h-4 w-4 text-muted-foreground" />
            <span>Download</span>
            <ChevronDown className="h-3 w-3 text-muted-foreground ml-0.5" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={onExportPdf}
            title="More actions"
            aria-label="More actions"
            className="rounded-xl bg-card border-border hover:bg-muted/40 transition-colors shadow-xs shrink-0 h-9 w-9 font-sans"
          >
            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
          </Button>

          <Button
            onClick={onRegenerate}
            disabled={isGenerating}
            className="gap-2 text-button font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xs font-sans"
          >
            <span>Regenerate Business Plan</span>
            <RotateCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* 2. QUIET CONTEXT NOTICE */}
      <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg bg-muted/50 border border-border/50 text-caption text-muted-foreground font-sans">
        <Info className="h-4 w-4 text-muted-foreground shrink-0" />
        <span>All chapters are currently in Draft status based on assembled project data.</span>
      </div>

      {/* 3. MAIN WORKSPACE (2-Column: Left Chapter Navigator + Right Continuous Document) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ASIDE - LEFT: Chapter Navigator */}
        <aside className="lg:col-span-3 lg:self-start lg:sticky lg:top-20 z-20 hidden lg:block">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-xs space-y-2 max-h-[calc(100vh-6rem)] overflow-y-auto">
            <div className="flex items-center justify-between px-2 pb-2 border-b border-border/60">
              <span className="text-badge font-bold uppercase tracking-wider text-muted-foreground font-sans">
                CONTENTS
              </span>
              <span className="text-badge font-medium text-muted-foreground font-sans">
                12 Sections
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
                      <span className="truncate">{ch.title}</span>
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
                      {isReviewed ? 'Reviewed' : 'Draft'}
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
            <p className="text-section-title font-medium text-muted-foreground font-sans">Business Plan</p>
            <div className="flex items-center gap-2 text-caption text-muted-foreground pt-1 flex-wrap font-sans">
              <span>{countryName}</span>
              <span>•</span>
              <span>{categoryName}</span>
              <span>•</span>
              <span className="text-primary font-medium">Draft Status</span>
            </div>
          </div>

          {/* CHAPTER 01: EXECUTIVE SUMMARY */}
          <section id="chapter-01" className="space-y-4 pt-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <h2 className="text-section-title font-bold text-foreground font-heading">01 · Executive Summary</h2>
                <Badge
                  variant="outline"
                  className={`text-badge font-medium rounded-full font-sans ${
                    reviewedChapters['01']
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      : 'bg-muted/60 text-muted-foreground'
                  }`}
                >
                  {reviewedChapters['01'] ? 'Reviewed' : 'Draft'}
                </Badge>
              </div>
            </div>

            <p className="text-body text-muted-foreground font-sans">
              Your business in one clear overview.
            </p>

            <div className="text-body text-foreground leading-relaxed font-sans space-y-3">
              {bpOutput?.executiveSummary?.overview ? (
                bpOutput.executiveSummary.overview.split('\n\n').map((para, i) => (
                  <p key={i}>{para}</p>
                ))
              ) : (
                <>
                  <p>
                    {projectName} is a planned {categoryName.toLowerCase()} platform in {countryName}{' '}
                    designed to solve critical workflow challenges for {project.targetUser || 'target customers'}.
                  </p>
                  <p>
                    {project.solution ||
                      `The venture focuses on automated digital workflows and structured processing tailored for ${project.targetUser || 'modern clients'}.`}
                  </p>
                  <p>
                    The business model leverages scalable customer acquisition, recurring value delivery, and operational milestones aligned with {countryName} regulatory standards.
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
                <span>BUILT FROM ASSEMBLED INPUTS</span>
                {sourceChipsExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>

              {sourceChipsExpanded && (
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  {['Project Concept', 'Business Model', 'Financial Forecast', 'Company Setup'].map((chip) => (
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleReviewed('01')}
                className={`gap-1.5 text-button font-semibold rounded-lg font-sans ${
                  reviewedChapters['01']
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/40'
                    : 'bg-muted/40 text-foreground hover:bg-muted/70'
                }`}
              >
                <Check className={`h-3.5 w-3.5 ${reviewedChapters['01'] ? 'text-emerald-600' : 'text-emerald-700'}`} />
                <span>{reviewedChapters['01'] ? 'Reviewed' : 'Mark reviewed'}</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  openEditor(
                    'executive',
                    '01 · Executive Summary',
                    bpOutput?.executiveSummary?.overview || ''
                  )
                }
                className="gap-1.5 text-button font-semibold rounded-lg bg-muted/40 text-foreground hover:bg-muted/70 font-sans"
              >
                <Pencil className="h-3.5 w-3.5 text-foreground/70" />
                <span>Edit text</span>
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
                <span>Rewrite with AI</span>
              </Button>
            </div>
          </section>

          <hr className="border-border/60" />

          {/* CHAPTER 02: PROBLEM & SOLUTION */}
          <section id="chapter-02" className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <h2 className="text-section-title font-bold text-foreground font-heading">02 · Problem & Solution</h2>
                <Badge
                  variant="outline"
                  className={`text-badge font-medium rounded-full font-sans ${
                    reviewedChapters['02']
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      : 'bg-muted/60 text-muted-foreground'
                  }`}
                >
                  {reviewedChapters['02'] ? 'Reviewed' : 'Draft'}
                </Badge>
              </div>
            </div>

            <p className="text-body text-muted-foreground font-sans">
              What needs to improve and how your project helps.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 sm:p-5 rounded-xl border border-border/70 bg-muted/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-badge font-bold uppercase tracking-wider text-muted-foreground font-sans">
                    THE PROBLEM
                  </span>
                  {(bpOutput?.problemSolution?.problem || clarifierOutput?.problemDefinition?.statement) && (
                    <Badge variant="outline" className="text-badge bg-primary/10 text-primary border-primary/20 font-sans font-medium">
                      AI Synthesized
                    </Badge>
                  )}
                </div>
                <p className="text-body text-foreground font-sans leading-relaxed">
                  {bpOutput?.problemSolution?.problem ||
                    clarifierOutput?.problemDefinition?.statement ||
                    (bpOutput?.executiveSummary?.overview ? bpOutput.executiveSummary.overview.split('\n\n')[0] : '') ||
                    project.problem ||
                    `Core operational friction and manual fragmentation experienced by ${project.targetUser || 'target users'} in ${countryName}.`}
                </p>
              </div>

              <div className="p-4 sm:p-5 rounded-xl border border-border/70 bg-muted/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-badge font-bold uppercase tracking-wider text-muted-foreground font-sans">
                    THE PROPOSED SOLUTION
                  </span>
                  {(bpOutput?.problemSolution?.solution || clarifierOutput?.proposedSolution?.summary || clarifierOutput?.proposedSolution?.valueProposition) && (
                    <Badge variant="outline" className="text-badge bg-primary/10 text-primary border-primary/20 font-sans font-medium">
                      AI Synthesized
                    </Badge>
                  )}
                </div>
                <p className="text-body text-foreground font-sans leading-relaxed">
                  {bpOutput?.problemSolution?.solution ||
                    clarifierOutput?.proposedSolution?.summary ||
                    clarifierOutput?.proposedSolution?.valueProposition ||
                    bpOutput?.executiveSummary?.valueProposition ||
                    project.solution ||
                    `${projectName} provides an integrated ${categoryName.toLowerCase()} solution to streamline operations for ${project.targetUser || 'users'}.`}
                </p>
              </div>
            </div>

            {/* Action Row */}
            <div className="flex items-center gap-2 flex-wrap pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleReviewed('02')}
                className={`gap-1.5 text-button font-semibold rounded-lg font-sans ${
                  reviewedChapters['02']
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/40'
                    : 'bg-muted/40 text-foreground hover:bg-muted/70'
                }`}
              >
                <Check className={`h-3.5 w-3.5 ${reviewedChapters['02'] ? 'text-emerald-600' : 'text-emerald-700'}`} />
                <span>{reviewedChapters['02'] ? 'Reviewed' : 'Mark reviewed'}</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  openEditor(
                    'problem-solution',
                    '02 · Problem & Solution',
                    bpOutput?.problemSolution?.problem || clarifierOutput?.problemDefinition?.statement || project.problem || ''
                  )
                }
                className="gap-1.5 text-button font-semibold rounded-lg bg-muted/40 text-foreground hover:bg-muted/70 font-sans"
              >
                <Pencil className="h-3.5 w-3.5 text-foreground/70" />
                <span>Edit text</span>
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
                <span>Rewrite with AI</span>
              </Button>

              <Link
                href={effectiveIdeaId ? `/dashboard/creator/phase-2/clarifier?ideaId=${effectiveIdeaId}` : '/dashboard/creator/phase-2/clarifier'}
                className="inline-flex items-center gap-1.5 text-button font-semibold text-primary hover:underline font-sans ml-auto"
              >
                <span>View project concept</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </section>

          <hr className="border-border/60" />

          {/* CHAPTER 03: MARKET & CUSTOMERS */}
          <section id="chapter-03" className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <h2 className="text-section-title font-bold text-foreground font-heading">03 · Market & Customers</h2>
                <Badge
                  variant="outline"
                  className={`text-badge font-medium rounded-full font-sans ${
                    reviewedChapters['03']
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      : 'bg-muted/60 text-muted-foreground'
                  }`}
                >
                  {reviewedChapters['03'] ? 'Reviewed' : 'Draft'}
                </Badge>
              </div>
            </div>

            <p className="text-body text-muted-foreground font-sans">
              Who the service is for and what supports the opportunity.
            </p>

            <div className="p-4 sm:p-5 rounded-xl border border-border/70 bg-muted/30 space-y-2.5 font-sans">
              <div className="flex items-start gap-2.5 text-body text-foreground">
                <span className="text-primary font-bold">•</span>
                <span>
                  Initial customer segment:{' '}
                  <strong className="text-foreground">
                    {bpOutput?.marketAnalysis?.targetSegments?.[0] || clarifierOutput?.targetAudience?.primarySegment || project.targetUser || 'Target commercial clients & early adopters'}
                  </strong>.
                </span>
              </div>
              <div className="flex items-start gap-2.5 text-body text-foreground">
                <span className="text-primary font-bold">•</span>
                <span>
                  Initial launch market: <strong className="text-foreground">{countryName}</strong>.
                </span>
              </div>
              <div className="flex items-start gap-2.5 text-body text-foreground">
                <span className="text-primary font-bold">•</span>
                <span>
                  Customer need to validate:{' '}
                  {clarifierOutput?.problemDefinition?.painPoints?.[0] ||
                    bpOutput?.marketAnalysis?.trends?.[0] ||
                    project.problem ||
                    `Operational bottlenecks and workflow friction experienced by ${project.targetUser || 'users'}.`}
                </span>
              </div>
              <div className="flex items-start gap-2.5 text-body text-foreground">
                <span className="text-primary font-bold">•</span>
                <span>
                  Evidence to develop:{' '}
                  {bpOutput?.marketAnalysis?.marketSizeQualitative ||
                    clarifierOutput?.targetAudience?.sizeQualitative ||
                    'In-depth customer interviews, prototype pilots, and direct feedback loops.'}
                </span>
              </div>
            </div>

            {/* Supporting market evidence notice */}
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-caption text-amber-800 dark:text-amber-300 font-sans">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              <span>Add supporting market evidence before using numerical market claims.</span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <Link
                href={effectiveIdeaId ? `/dashboard/creator/phase-3/market-study?ideaId=${effectiveIdeaId}` : '/dashboard/creator/phase-3/market-study'}
                className="inline-flex items-center gap-1.5 text-button font-semibold text-primary hover:underline font-sans"
              >
                <span>View Market Intelligence</span>
                <ExternalLink className="h-3 w-3" />
              </Link>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleReviewed('03')}
                className="text-button text-muted-foreground hover:text-foreground font-sans"
              >
                {reviewedChapters['03'] ? 'Reviewed' : 'Mark reviewed'}
              </Button>
            </div>
          </section>

          <hr className="border-border/60" />

          {/* CHAPTER 04: BUSINESS MODEL */}
          <section id="chapter-04" className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <h2 className="text-section-title font-bold text-foreground font-heading">04 · Business Model</h2>
                <Badge
                  variant="outline"
                  className={`text-badge font-medium rounded-full font-sans ${
                    reviewedChapters['04']
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      : 'bg-muted/60 text-muted-foreground'
                  }`}
                >
                  {reviewedChapters['04'] ? 'Reviewed' : 'Draft'}
                </Badge>
              </div>
            </div>

            <p className="text-body text-muted-foreground font-sans">How the business plans to earn revenue.</p>

            <p className="text-body text-foreground leading-relaxed font-sans">
              {bpOutput?.revenueModel?.summary ||
                `The business operates on a ${categoryName.toLowerCase()} model with commercial terms tailored for ${project.targetUser || 'customers'} in ${countryName}.`}
            </p>

            <div className="p-4 rounded-xl border border-border/70 bg-muted/30">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-card border border-border shadow-xs space-y-1">
                  <span className="text-badge font-bold uppercase tracking-wider text-muted-foreground font-sans block">
                    REVENUE MODEL
                  </span>
                  <p className="text-body font-semibold text-foreground font-sans truncate">
                    {bpOutput?.revenueModel?.revenueStreams?.[0]?.name || categoryName || 'Recurring Subscriptions'}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-card border border-border shadow-xs space-y-1">
                  <span className="text-badge font-bold uppercase tracking-wider text-muted-foreground font-sans block">
                    PRICING
                  </span>
                  <p className="text-body font-semibold text-foreground font-sans truncate">
                    {bpOutput?.revenueModel?.pricingStrategy || 'Tiered value pricing'}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-card border border-border shadow-xs space-y-1">
                  <span className="text-badge font-bold uppercase tracking-wider text-muted-foreground font-sans block">
                    DELIVERY
                  </span>
                  <p className="text-body font-semibold text-foreground font-sans truncate">
                    {categoryName || 'Online platform'}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-card border border-border shadow-xs space-y-1">
                  <span className="text-badge font-bold uppercase tracking-wider text-muted-foreground font-sans block">
                    MAIN COST AREAS
                  </span>
                  <p className="text-body font-semibold text-foreground font-sans truncate">
                    {bpOutput?.revenueModel?.keyMetrics?.[0] || 'Development, infrastructure & acquisition'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <Link
                href={effectiveIdeaId ? `/dashboard/creator/phase-3/business-model?ideaId=${effectiveIdeaId}` : '/dashboard/creator/phase-3/business-model'}
                className="inline-flex items-center gap-1.5 text-button font-semibold text-primary hover:underline font-sans"
              >
                <span>Update Business Model</span>
                <ExternalLink className="h-3 w-3" />
              </Link>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleReviewed('04')}
                className="text-button text-muted-foreground hover:text-foreground font-sans"
              >
                {reviewedChapters['04'] ? 'Reviewed' : 'Mark reviewed'}
              </Button>
            </div>
          </section>

          <hr className="border-border/60" />

          {/* CHAPTER 05: COMPETITION & POSITIONING */}
          <section id="chapter-05" className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <h2 className="text-section-title font-bold text-foreground font-heading">05 · Competition & Positioning</h2>
                <Badge
                  variant="outline"
                  className={`text-badge font-medium rounded-full font-sans ${
                    reviewedChapters['05']
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      : 'bg-muted/60 text-muted-foreground'
                  }`}
                >
                  {reviewedChapters['05'] ? 'Reviewed' : 'Draft'}
                </Badge>
              </div>
            </div>

            <p className="text-body text-muted-foreground font-sans">
              What customers use today and why they might consider your service.
            </p>

            <div className="overflow-x-auto rounded-xl border border-border/80">
              <table className="w-full text-left text-table-header font-sans">
                <thead className="bg-muted/60 border-b border-border/80">
                  <tr>
                    <th className="px-4 py-3 text-table-header font-bold uppercase tracking-wider text-muted-foreground font-sans">
                      ALTERNATIVE
                    </th>
                    <th className="px-4 py-3 text-table-header font-bold uppercase tracking-wider text-muted-foreground font-sans">
                      CURRENT APPROACH
                    </th>
                    <th className="px-4 py-3 text-table-header font-bold uppercase tracking-wider text-primary font-sans">
                      PROPOSED {projectName.toUpperCase()} FOCUS
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
                        <td className="px-4 py-3 text-body font-semibold text-foreground font-sans">Manual & Ad-hoc methods</td>
                        <td className="px-4 py-3 text-body text-muted-foreground font-sans">Spreadsheets, emails, and disconnected tools</td>
                        <td className="px-4 py-3 text-body bg-primary/5 text-foreground font-medium font-sans">
                          Unified, automated end-to-end {categoryName.toLowerCase()} experience
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-body font-semibold text-foreground font-sans">Legacy Enterprise platforms</td>
                        <td className="px-4 py-3 text-body text-muted-foreground font-sans">Broad, complex legacy systems with high overhead</td>
                        <td className="px-4 py-3 text-body bg-primary/5 text-foreground font-medium font-sans">
                          Modern, purpose-built workflows tailored for {project.targetUser || 'users'}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-body font-semibold text-foreground font-sans">Fragmented point solutions</td>
                        <td className="px-4 py-3 text-body text-muted-foreground font-sans">Single-purpose tools requiring manual integration</td>
                        <td className="px-4 py-3 text-body bg-primary/5 text-foreground font-medium font-sans">
                          Integrated ecosystem designed for {countryName} market standards
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>

            <p className="text-caption text-muted-foreground italic font-sans">
              This positioning is a working assumption to test with customers.
            </p>

            <div className="flex items-center justify-end pt-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleReviewed('05')}
                className="text-button text-muted-foreground hover:text-foreground font-sans"
              >
                {reviewedChapters['05'] ? 'Reviewed' : 'Mark reviewed'}
              </Button>
            </div>
          </section>

          <hr className="border-border/60" />

          {/* CHAPTER 06: GO-TO-MARKET */}
          <section id="chapter-06" className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <h2 className="text-section-title font-bold text-foreground font-heading">06 · Go-to-Market</h2>
                <Badge
                  variant="outline"
                  className={`text-badge font-medium rounded-full font-sans ${
                    reviewedChapters['06']
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      : 'bg-muted/60 text-muted-foreground'
                  }`}
                >
                  {reviewedChapters['06'] ? 'Reviewed' : 'Draft'}
                </Badge>
              </div>
            </div>

            <p className="text-body text-muted-foreground font-sans">How the first customers could discover the service.</p>

            <p className="text-body text-foreground leading-relaxed font-sans">
              {bpOutput?.goToMarket?.strategy ||
                `The initial launch will focus on targeted outreach to ${project.targetUser || 'early adopter customers'} in ${countryName} to validate core workflows and gather user feedback before broader commercial rollout.`}
            </p>

            <div className="p-4 rounded-xl border border-border/70 bg-muted/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-badge font-bold uppercase tracking-wider text-muted-foreground font-sans block">
                  FIRST ACQUISITION CHANNEL
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-body font-semibold text-foreground font-sans">
                    {bpOutput?.goToMarket?.channels?.[0] || 'Primary direct outreach'}
                  </span>
                  <Badge variant="outline" className={`text-badge font-sans ${bpOutput?.goToMarket?.channels?.[0] ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted/60 text-muted-foreground'}`}>
                    {bpOutput?.goToMarket?.channels?.[0] ? 'Active Channel' : 'To be decided'}
                  </Badge>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  openEditor(
                    'gtm',
                    '06 · Go-to-Market',
                    bpOutput?.goToMarket?.strategy || ''
                  )
                }
                className="text-button font-semibold rounded-lg bg-card font-sans"
              >
                Add your approach
              </Button>
            </div>

            <div className="flex items-center justify-end pt-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleReviewed('06')}
                className="text-button text-muted-foreground hover:text-foreground font-sans"
              >
                {reviewedChapters['06'] ? 'Reviewed' : 'Mark reviewed'}
              </Button>
            </div>
          </section>

          <hr className="border-border/60" />

          {/* CHAPTER 07: FINANCIAL PLAN */}
          <section id="chapter-07" className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <h2 className="text-section-title font-bold text-foreground font-heading">07 · Financial Plan</h2>
                <Badge
                  variant="outline"
                  className={`text-badge font-medium rounded-full font-sans ${
                    reviewedChapters['07']
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      : 'bg-muted/60 text-muted-foreground'
                  }`}
                >
                  {reviewedChapters['07'] ? 'Reviewed' : 'Draft'}
                </Badge>
              </div>
            </div>

            <p className="text-body text-muted-foreground font-sans">
              The forecast and assumptions behind the project.
            </p>

            {/* Financial Summary Table */}
            <div className="overflow-x-auto rounded-xl border border-border/80">
              <table className="w-full text-left text-table-header font-sans">
                <thead className="bg-muted/60 border-b border-border/80">
                  <tr>
                    <th className="px-4 py-3 text-table-header font-bold uppercase tracking-wider text-muted-foreground font-sans">
                      METRIC
                    </th>
                    <th className="px-4 py-3 text-table-header font-bold uppercase tracking-wider text-muted-foreground font-sans">
                      YEAR 1
                    </th>
                    <th className="px-4 py-3 text-table-header font-bold uppercase tracking-wider text-muted-foreground font-sans">
                      YEAR 2
                    </th>
                    <th className="px-4 py-3 text-table-header font-bold uppercase tracking-wider text-muted-foreground font-sans">
                      YEAR 3
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  <tr>
                    <td className="px-4 py-3 text-body font-medium text-foreground font-sans">Revenue</td>
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
                    <td className="px-4 py-3 text-body font-medium text-foreground font-sans">Operating costs</td>
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
                    <td className="px-4 py-3 text-body font-bold text-foreground font-sans">Revenue less operating costs</td>
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
                  FORECAST PROJECTION (3 YEARS)
                </span>
                <div className="flex items-center gap-4 text-caption font-sans">
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-xs bg-[#1a47c3] inline-block" />
                    <span className="text-muted-foreground">Revenue</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-xs bg-[#747685] inline-block" />
                    <span className="text-muted-foreground">Operating Costs</span>
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
                    fill="#1a47c3"
                  />
                  <rect
                    x="148"
                    y={financialData.y1.opex > 0 ? 160 - (financialData.y1.opex / maxFinancialRev) * 130 : 158}
                    width="32"
                    height={financialData.y1.opex > 0 ? Math.max(4, (financialData.y1.opex / maxFinancialRev) * 130) : 2}
                    rx="3"
                    fill="#747685"
                  />
                  <text x="145" y="182" textAnchor="middle" className="text-caption fill-muted-foreground font-sans">
                    Year 1
                  </text>

                  {/* Group 2: Year 2 */}
                  <rect
                    x="270"
                    y={financialData.y2.rev > 0 ? 160 - (financialData.y2.rev / maxFinancialRev) * 130 : 158}
                    width="32"
                    height={financialData.y2.rev > 0 ? Math.max(4, (financialData.y2.rev / maxFinancialRev) * 130) : 2}
                    rx="3"
                    fill="#1a47c3"
                  />
                  <rect
                    x="308"
                    y={financialData.y2.opex > 0 ? 160 - (financialData.y2.opex / maxFinancialRev) * 130 : 158}
                    width="32"
                    height={financialData.y2.opex > 0 ? Math.max(4, (financialData.y2.opex / maxFinancialRev) * 130) : 2}
                    rx="3"
                    fill="#747685"
                  />
                  <text x="305" y="182" textAnchor="middle" className="text-caption fill-muted-foreground font-sans">
                    Year 2
                  </text>

                  {/* Group 3: Year 3 */}
                  <rect
                    x="430"
                    y={financialData.y3.rev > 0 ? 160 - (financialData.y3.rev / maxFinancialRev) * 130 : 158}
                    width="32"
                    height={financialData.y3.rev > 0 ? Math.max(4, (financialData.y3.rev / maxFinancialRev) * 130) : 2}
                    rx="3"
                    fill="#1a47c3"
                  />
                  <rect
                    x="468"
                    y={financialData.y3.opex > 0 ? 160 - (financialData.y3.opex / maxFinancialRev) * 130 : 158}
                    width="32"
                    height={financialData.y3.opex > 0 ? Math.max(4, (financialData.y3.opex / maxFinancialRev) * 130) : 2}
                    rx="3"
                    fill="#747685"
                  />
                  <text x="465" y="182" textAnchor="middle" className="text-caption fill-muted-foreground font-sans">
                    Year 3
                  </text>
                </svg>
              </div>
            </div>

            <div className="space-y-1 text-footnote text-muted-foreground font-sans">
              <p>
                Forecast assumptions, not actual results. This summary does not show cash flow or establish the break-even date.
              </p>
              <p>Cash requirements and break-even should be reviewed in the full forecast.</p>
            </div>

            <div className="flex items-center justify-between pt-1">
              <Link
                href={effectiveIdeaId ? `/dashboard/creator/phase-3/forecast?ideaId=${effectiveIdeaId}` : '/dashboard/creator/phase-3/forecast'}
                className="inline-flex items-center gap-1.5 text-button font-semibold text-primary hover:underline font-sans"
              >
                <span>Update financial forecast</span>
                <ExternalLink className="h-3 w-3" />
              </Link>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleReviewed('07')}
                className="text-button text-muted-foreground hover:text-foreground font-sans"
              >
                {reviewedChapters['07'] ? 'Reviewed' : 'Mark reviewed'}
              </Button>
            </div>
          </section>

          <hr className="border-border/60" />

          {/* CHAPTER 08: COMPANY & TEAM */}
          <section id="chapter-08" className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <h2 className="text-section-title font-bold text-foreground font-heading">08 · Company & Team</h2>
                <Badge
                  variant="outline"
                  className={`text-badge font-medium rounded-full font-sans ${
                    reviewedChapters['08']
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      : 'bg-muted/60 text-muted-foreground'
                  }`}
                >
                  {reviewedChapters['08'] ? 'Reviewed' : 'Draft'}
                </Badge>
              </div>
            </div>

            <p className="text-body text-muted-foreground font-sans">
              The planned company setup and people needed to begin.
            </p>

            {/* 5-Cell Quick Facts Strip */}
            <div className="p-4 rounded-xl border border-border/70 bg-muted/30">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                <div className="p-2.5 rounded-lg bg-card border border-border shadow-xs space-y-1">
                  <span className="text-badge font-bold uppercase tracking-wider text-muted-foreground font-sans block">
                    COMPANY STRUCTURE
                  </span>
                  <p className="text-body font-semibold text-foreground font-sans truncate">
                    {formation?.selectedType || (project.country === 'France' ? 'SASU' : 'Limited Company')}
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-card border border-border shadow-xs space-y-1">
                  <span className="text-badge font-bold uppercase tracking-wider text-muted-foreground font-sans block">
                    OWNERSHIP PLAN
                  </span>
                  <p className="text-body font-semibold text-foreground font-sans">
                    {formation?.founderEquity ? `${formation.founderEquity}% Founder` : '100% Founder'}
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-card border border-border shadow-xs space-y-1">
                  <span className="text-badge font-bold uppercase tracking-wider text-muted-foreground font-sans block">
                    PLANNED LEADERSHIP
                  </span>
                  <p className="text-body font-semibold text-foreground font-sans truncate">
                    {formation?.plannedRole || 'President / Founder'}
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-card border border-border shadow-xs space-y-1">
                  <span className="text-badge font-bold uppercase tracking-wider text-muted-foreground font-sans block">
                    FOUNDER RESPONSIBILITIES
                  </span>
                  <p className="text-body font-semibold text-foreground font-sans truncate">
                    {formation?.skills?.youHave?.length ? formation.skills.youHave.slice(0, 2).join(', ') : 'Product direction & strategy'}
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-card border border-border shadow-xs space-y-1 col-span-2 sm:col-span-1">
                  <span className="text-badge font-bold uppercase tracking-wider text-muted-foreground font-sans block">
                    SUPPORT TO ASSESS
                  </span>
                  <p className="text-body font-semibold text-foreground font-sans truncate">
                    {cross.youNeed.length ? cross.youNeed.slice(0, 2).join(', ') : 'Technical & advisory partners'}
                  </p>
                </div>
              </div>
            </div>

            <p className="text-caption text-muted-foreground italic font-sans">
              These are planning decisions. The company has not been registered through this screen.
            </p>

            {/* 3-Tier Team Breakdown Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-2">
                <span className="text-card-title font-semibold text-foreground font-sans block">
                  Founder Responsibilities
                </span>
                <p className="text-body text-muted-foreground font-sans leading-relaxed">
                  {formation?.skills?.youHave?.length
                    ? `Lead responsibilities: ${formation.skills.youHave.join(', ')}.`
                    : `Venture leadership, product architecture, and customer discovery for ${projectName}.`}
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-2">
                <span className="text-card-title font-semibold text-foreground font-sans block">
                  Support for Launch
                </span>
                <p className="text-body text-muted-foreground font-sans leading-relaxed">
                  {cross.youNeed.length
                    ? `Key talent to bring in: ${cross.youNeed.join(', ')}.`
                    : `Core technical, commercial, and operational advisors for launch.`}
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-2">
                <span className="text-card-title font-semibold text-foreground font-sans block">
                  Roles for Later Stage
                </span>
                <p className="text-body text-muted-foreground font-sans leading-relaxed">
                  Dedicated growth specialists across customer onboarding, operations, and technical scaling.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <Link
                href={effectiveIdeaId ? `/dashboard/creator/phase-3/formation?ideaId=${effectiveIdeaId}` : '/dashboard/creator/phase-3/formation'}
                className="inline-flex items-center gap-1.5 text-button font-semibold text-primary hover:underline font-sans"
              >
                <span>Update company setup</span>
                <ExternalLink className="h-3 w-3" />
              </Link>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleReviewed('08')}
                className="text-button text-muted-foreground hover:text-foreground font-sans"
              >
                {reviewedChapters['08'] ? 'Reviewed' : 'Mark reviewed'}
              </Button>
            </div>
          </section>

          <hr className="border-border/60" />

          {/* CHAPTER 09: FUNDING REQUIREMENTS */}
          <section id="chapter-09" className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <h2 className="text-section-title font-bold text-foreground font-heading">09 · Funding Requirements</h2>
                <Badge
                  variant="outline"
                  className={`text-badge font-medium rounded-full font-sans ${
                    reviewedChapters['09']
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      : 'bg-muted/60 text-muted-foreground'
                  }`}
                >
                  {reviewedChapters['09'] ? 'Reviewed' : 'Draft'}
                </Badge>
              </div>
            </div>

            <p className="text-body text-muted-foreground font-sans">
              What funding may be needed and which decisions come later.
            </p>

            <div className="p-4 sm:p-5 rounded-xl border border-border/70 bg-muted/30 space-y-3 font-sans">
              <div className="flex items-start gap-2.5 text-body text-foreground pb-2 border-b border-border/60">
                <span className="text-muted-foreground font-medium shrink-0">Funding need:</span>
                <span className="font-semibold text-foreground">
                  {cross.seedAsk
                    ? `Target seed ask: ${formatAmount(cross.seedAsk)}`
                    : 'To be confirmed from the cash-flow forecast.'}
                </span>
              </div>
              <div className="flex items-start gap-2.5 text-body text-foreground">
                <span className="text-muted-foreground font-medium shrink-0">Fundraising amount and terms:</span>
                <span className="font-semibold text-foreground">
                  {cross.seedAsk ? 'Staged deployment across launch milestones.' : 'To be decided based on runway.'}
                </span>
              </div>
            </div>

            <p className="text-footnote text-muted-foreground font-sans leading-relaxed">
              A financial shortfall and a fundraising target are different decisions. Funding options will be developed when the project reaches that stage.
            </p>

            <div className="flex items-center justify-end pt-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleReviewed('09')}
                className="text-button text-muted-foreground hover:text-foreground font-sans"
              >
                {reviewedChapters['09'] ? 'Reviewed' : 'Mark reviewed'}
              </Button>
            </div>
          </section>

          <hr className="border-border/60" />

          {/* CHAPTER 10: OPERATIONS & MILESTONES */}
          <section id="chapter-10" className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <h2 className="text-section-title font-bold text-foreground font-heading">10 · Operations & Milestones</h2>
                <Badge
                  variant="outline"
                  className={`text-badge font-medium rounded-full font-sans ${
                    reviewedChapters['10']
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      : 'bg-muted/60 text-muted-foreground'
                  }`}
                >
                  {reviewedChapters['10'] ? 'Reviewed' : 'Draft'}
                </Badge>
              </div>
            </div>

            <p className="text-body text-muted-foreground font-sans">
              How the project will move from preparation to launch.
            </p>

            <div className="overflow-x-auto rounded-xl border border-border/80">
              <table className="w-full text-left text-table-header font-sans">
                <thead className="bg-muted/60 border-b border-border/80">
                  <tr>
                    <th className="px-4 py-3 text-table-header font-bold uppercase tracking-wider text-muted-foreground font-sans">
                      STAGE
                    </th>
                    <th className="px-4 py-3 text-table-header font-bold uppercase tracking-wider text-muted-foreground font-sans">
                      INTENDED OUTCOME
                    </th>
                    <th className="px-4 py-3 text-table-header font-bold uppercase tracking-wider text-muted-foreground font-sans">
                      TIMING
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {bpOutput?.operationsPlan?.milestones && bpOutput.operationsPlan.milestones.length > 0 ? (
                    bpOutput.operationsPlan.milestones.map((m, i) => (
                      <tr key={i}>
                        <td className="px-4 py-3 text-body font-semibold text-foreground font-sans">{m.title}</td>
                        <td className="px-4 py-3 text-body text-muted-foreground font-sans">{m.description}</td>
                        <td className="px-4 py-3 text-body text-muted-foreground font-sans">{m.timeframe || 'To be planned'}</td>
                      </tr>
                    ))
                  ) : (
                    <>
                      <tr>
                        <td className="px-4 py-3 text-body font-semibold text-foreground font-sans">Validate</td>
                        <td className="px-4 py-3 text-body text-muted-foreground font-sans">Confirm core problem and workflow priorities with {project.targetUser || 'target users'}</td>
                        <td className="px-4 py-3 text-body text-muted-foreground font-sans">Phase 1</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-body font-semibold text-foreground font-sans">Build</td>
                        <td className="px-4 py-3 text-body text-muted-foreground font-sans">Develop the core {categoryName.toLowerCase()} minimum viable product ({projectName})</td>
                        <td className="px-4 py-3 text-body text-muted-foreground font-sans">Phase 2</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-body font-semibold text-foreground font-sans">Pilot</td>
                        <td className="px-4 py-3 text-body text-muted-foreground font-sans">Test early version with initial cohort in {countryName}</td>
                        <td className="px-4 py-3 text-body text-muted-foreground font-sans">Phase 3</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-body font-semibold text-foreground font-sans">Launch</td>
                        <td className="px-4 py-3 text-body text-muted-foreground font-sans">Refine offer based on customer metrics and expand commercial rollout</td>
                        <td className="px-4 py-3 text-body text-muted-foreground font-sans">Phase 4</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end pt-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleReviewed('10')}
                className="text-button text-muted-foreground hover:text-foreground font-sans"
              >
                {reviewedChapters['10'] ? 'Reviewed' : 'Mark reviewed'}
              </Button>
            </div>
          </section>

          <hr className="border-border/60" />

          {/* CHAPTER 11: RISKS & NEXT STEPS */}
          <section id="chapter-11" className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <h2 className="text-section-title font-bold text-foreground font-heading">11 · Risks & Next Steps</h2>
                <Badge
                  variant="outline"
                  className={`text-badge font-medium rounded-full font-sans ${
                    reviewedChapters['11']
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      : 'bg-muted/60 text-muted-foreground'
                  }`}
                >
                  {reviewedChapters['11'] ? 'Reviewed' : 'Draft'}
                </Badge>
              </div>
            </div>

            <p className="text-body text-muted-foreground font-sans">
              What needs attention as the project develops.
            </p>

            {/* Risk Table */}
            <div className="overflow-x-auto rounded-xl border border-border/80">
              <table className="w-full text-left text-table-header font-sans">
                <thead className="bg-muted/60 border-b border-border/80">
                  <tr>
                    <th className="px-4 py-3 text-table-header font-bold uppercase tracking-wider text-muted-foreground font-sans">
                      RISK
                    </th>
                    <th className="px-4 py-3 text-table-header font-bold uppercase tracking-wider text-muted-foreground font-sans">
                      WHY IT MATTERS
                    </th>
                    <th className="px-4 py-3 text-table-header font-bold uppercase tracking-wider text-muted-foreground font-sans">
                      PLANNED RESPONSE
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {bpOutput?.risks && bpOutput.risks.length > 0 ? (
                    bpOutput.risks.map((r, i) => (
                      <tr key={i}>
                        <td className="px-4 py-3 text-body font-semibold text-foreground font-sans">{(r as any).risk || r.category || 'Identified Risk'}</td>
                        <td className="px-4 py-3 text-body text-muted-foreground font-sans">{r.description}</td>
                        <td className="px-4 py-3 text-body text-foreground font-medium font-sans">{r.mitigation}</td>
                      </tr>
                    ))
                  ) : (
                    <>
                      <tr>
                        <td className="px-4 py-3 text-body font-semibold text-foreground font-sans">Customer Adoption</td>
                        <td className="px-4 py-3 text-body text-muted-foreground font-sans">{project.targetUser || 'Customers'} may take longer to adopt new operational tools</td>
                        <td className="px-4 py-3 text-body text-foreground font-medium font-sans">Conduct direct pilot interviews and validate willingness to pay early</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-body font-semibold text-foreground font-sans">Development Timeline</td>
                        <td className="px-4 py-3 text-body text-muted-foreground font-sans">Feature complexity or integrations may take longer than anticipated</td>
                        <td className="px-4 py-3 text-body text-foreground font-medium font-sans">Prioritize lean core features and iterate continuously</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-body font-semibold text-foreground font-sans">Ecosystem & Regulation</td>
                        <td className="px-4 py-3 text-body text-muted-foreground font-sans">Market regulatory standards in {countryName} may evolve</td>
                        <td className="px-4 py-3 text-body text-foreground font-medium font-sans">Review legal compliance roadmap regularly with official guidelines</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-body font-semibold text-foreground font-sans">Financial Runway</td>
                        <td className="px-4 py-3 text-body text-muted-foreground font-sans">Operating expenses may outpace revenue prior to break-even</td>
                        <td className="px-4 py-3 text-body text-foreground font-medium font-sans">Monitor burn rate closely and adjust phase milestones</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>

            {/* PRIORITIZED NEXT STEPS */}
            <div className="p-4 sm:p-5 rounded-xl border border-border/70 bg-muted/30 space-y-3">
              <span className="text-badge font-bold uppercase tracking-wider text-muted-foreground font-sans block">
                PRIORITIZED NEXT STEPS
              </span>
              <div className="space-y-2">
                {[
                  `Conduct validation interviews with ${project.targetUser || 'target customers'}.`,
                  `Finalize initial product scope and technical architecture for ${projectName}.`,
                  `Review financial forecast and prepare legal formation in ${countryName}.`,
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleReviewed('11')}
                className="text-button text-muted-foreground hover:text-foreground font-sans"
              >
                {reviewedChapters['11'] ? 'Reviewed' : 'Mark reviewed'}
              </Button>
            </div>
          </section>

          <hr className="border-border/60" />

          {/* CHAPTER 12: LEGAL & COMPLIANCE */}
          <section id="chapter-12" className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <h2 className="text-section-title font-bold text-foreground font-heading">12 · Legal & Compliance</h2>
                <Badge
                  variant="outline"
                  className={`text-badge font-medium rounded-full font-sans ${
                    reviewedChapters['12']
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      : 'bg-muted/60 text-muted-foreground'
                  }`}
                >
                  {reviewedChapters['12'] ? 'Reviewed' : 'Draft'}
                </Badge>
              </div>
            </div>

            <p className="text-body text-muted-foreground font-sans">
              The legal considerations identified for your project.
            </p>

            <div className="text-body text-foreground leading-relaxed font-sans space-y-3">
              <p>
                {legalFramework?.summary ||
                  bpOutput?.legalFramework?.summary ||
                  `The legal roadmap identifies topics to review based on the current project, planned company setup and operating model.`}
              </p>
              <p>
                Relevant topics may include company formation, customer terms, website information, data protection (GDPR), and activity-specific requirements. Each item has its own timing and official guidance.
              </p>
            </div>

            <div className="flex items-center justify-between pt-1">
              <Link
                href={effectiveIdeaId ? `/dashboard/creator/phase-3/compliance?ideaId=${effectiveIdeaId}` : '/dashboard/creator/phase-3/compliance'}
                className="inline-flex items-center gap-1.5 text-button font-semibold text-primary hover:underline font-sans"
              >
                <span>View legal roadmap</span>
                <ExternalLink className="h-3 w-3" />
              </Link>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleReviewed('12')}
                className="text-button text-muted-foreground hover:text-foreground font-sans"
              >
                {reviewedChapters['12'] ? 'Reviewed' : 'Mark reviewed'}
              </Button>
            </div>
          </section>
        </article>
      </div>

      {/* 4. FOOTER - JOURNEY NAVIGATION FOOTER */}
      <div className="p-4 sm:p-6 rounded-2xl border border-border bg-card shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-caption text-muted-foreground font-sans text-center sm:text-left">
          You can return to this plan and update it as your project develops.
        </p>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <Button
            variant="ghost"
            onClick={onBack}
            className="gap-2 text-button font-bold text-muted-foreground hover:text-foreground font-sans"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Company Setup</span>
          </Button>

          <Button
            onClick={onNext}
            className="gap-2 text-button font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs font-sans"
          >
            <span>Continue to Investor Readiness</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* INLINE EDIT SECTION DIALOG */}
      <Dialog open={editModal.open} onOpenChange={(open) => setEditModal((prev) => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-xl font-sans">
          <DialogHeader>
            <DialogTitle className="text-base font-bold font-sans">
              Edit {editModal.title}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Textarea
              value={editModal.content}
              onChange={(e) => setEditModal((prev) => ({ ...prev, content: e.target.value }))}
              rows={8}
              className="text-sm font-sans resize-none"
              placeholder="Enter section content..."
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
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveEdit}
              disabled={editModal.isSaving}
              className="gap-1.5"
            >
              {editModal.isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
