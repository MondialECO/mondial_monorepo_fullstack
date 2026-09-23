'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { withIdeaContext } from '@/lib/creator-routes';
import {
  FileText,
  Download,
  FolderArchive,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Loader2,
  AlertCircle,
  Folder,
  Layers,
  Sparkles,
  ChevronRight,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Phase3SetupShell } from '@/components/creator/Phase3SetupShell';
import { useCreatorProgress } from '@/providers/CreatorProgressProvider';
import { creatorJourneyApi } from '@/lib/api-creator-journey';
import { brandKitApi } from '@/lib/api-creator-brand-kit';
import { creatorAiApi } from '@/lib/api-creator-ai';
import { exportBrandKitZip } from '@/lib/brand-kit-export';
import MarketStudyPrintView from '@/components/creator/MarketStudyPrintView';
import BusinessModelPrintView from '@/components/creator/BusinessModelPrintView';
import ForecastPrintView from '@/components/creator/ForecastPrintView';
import PlanForecastPrintView from '@/components/creator/PlanForecastPrintView';
import type {
  MarketStudyOutput,
  BusinessModelOutput,
  BusinessPlanOutput,
  ForecastOutput,
} from '@/types/creator/ai';
import type { BrandKit } from '@/types/creator/brand-kit';
import type { BackendCreatorJourney, ComputedJourneyStatus } from '@/types/creator/journey-api';

interface ArtifactItem {
  id: string;
  phaseId: 2 | 3 | 4;
  phaseTitle: string;
  stepNumber: string;
  title: string;
  description: string;
  fileFormat: 'PDF' | 'ZIP' | 'IN_APP';
  isDownloadableV1: boolean;
  isReady: boolean;
  lastUpdatedText: string | null;
  versionNumber?: number | null;
  stepUrl: string;
  onDownloadOrView?: () => Promise<void>;
  downloadLabel?: string;
  nonDownloadableNote?: string;
}

export default function CreatorAssetLibraryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryIdeaId = searchParams.get('ideaId');
  const { state: { activeIdeaId }, isLoading: progressLoading } = useCreatorProgress();
  const currentIdeaId = queryIdeaId || activeIdeaId || null;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Raw fetched data
  const [journey, setJourney] = useState<BackendCreatorJourney | null>(null);
  const [computedStatus, setComputedStatus] = useState<ComputedJourneyStatus | null>(null);
  const [brandKit, setBrandKit] = useState<BrandKit | null>(null);

  // Lazy loaded print view states
  const [loadingArtifactId, setLoadingArtifactId] = useState<string | null>(null);
  const [activeMarketStudy, setActiveMarketStudy] = useState<MarketStudyOutput | null>(null);
  const [isMarketStudyOpen, setIsMarketStudyOpen] = useState(false);

  const [activeBusinessModel, setActiveBusinessModel] = useState<BusinessModelOutput | null>(null);
  const [businessModelVersion, setBusinessModelVersion] = useState<number | null>(null);
  const [businessModelUpdatedAt, setBusinessModelUpdatedAt] = useState<string | null>(null);
  const [isBusinessModelOpen, setIsBusinessModelOpen] = useState(false);

  const [activePlan, setActivePlan] = useState<BusinessPlanOutput | null>(null);
  const [activeForecast, setActiveForecast] = useState<ForecastOutput | null>(null);
  const [isPlanForecastOpen, setIsPlanForecastOpen] = useState(false);

  // Initial single fetch on mount
  useEffect(() => {
    if (progressLoading) return;
    let active = true;

    (async () => {
      setLoading(true);
      setError(null);
      setActionError(null);
      try {
        const [journeyRes, kitRes] = await Promise.allSettled([
          creatorJourneyApi.get(currentIdeaId),
          brandKitApi.getBrandKit(currentIdeaId || undefined),
        ]);

        if (!active) return;

        if (journeyRes.status === 'fulfilled') {
          setJourney(journeyRes.value.journey);
          setComputedStatus(journeyRes.value.computedStatus);
        } else {
          throw journeyRes.reason;
        }

        if (kitRes.status === 'fulfilled') {
          setBrandKit(kitRes.value);
        }
      } catch (err: any) {
        if (active) {
          setError(err?.message || 'Failed to load creator asset library.');
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [currentIdeaId, progressLoading]);

  const projectName =
    journey?.project?.name ||
    journey?.project?.tagline ||
    'Project';

  const projectMeta = {
    problem: journey?.project?.problem || '',
    solution: journey?.project?.solution || '',
    targetUser: journey?.project?.targetUser || '',
    sector: journey?.project?.sector || '',
    geography: journey?.project?.geography || '',
    marketGap: journey?.project?.marketGap || '',
  };

  const phase3 = journey?.phase3Data as {
    marketStudySessionId?: string | null;
    businessModelSessionId?: string | null;
    businessPlanSessionId?: string | null;
    forecastSessionId?: string | null;
    formationGenerator?: { selectedOptionKey?: string; confirmedAt?: string };
    legalAssessment?: { items?: Array<{ id: string; status: string }>; updatedAt?: string; evaluatedAt?: string };
    legalChecklist?: { items?: Array<{ id: string; status: string }>; updatedAt?: string };
  } | undefined;

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return null;
    }
  };

  // 1. Market Study Lazy Loader
  const handleOpenMarketStudy = async () => {
    if (!phase3?.marketStudySessionId) return;
    setLoadingArtifactId('market-study');
    setActionError(null);
    try {
      const session = await creatorAiApi.getMarketStudy(phase3.marketStudySessionId);
      if (session.output) {
        setActiveMarketStudy(session.output);
        setIsMarketStudyOpen(true);
      }
    } catch (err: any) {
      console.error('Failed to load Market Study session:', err);
      setActionError(err?.message || 'Failed to open Market Study export view.');
    } finally {
      setLoadingArtifactId(null);
    }
  };

  // 2. Business Model Lazy Loader
  const handleOpenBusinessModel = async () => {
    if (!phase3?.businessModelSessionId) return;
    setLoadingArtifactId('business-model');
    setActionError(null);
    try {
      const session = await creatorAiApi.getBusinessModel(phase3.businessModelSessionId);
      if (session.output) {
        setActiveBusinessModel(session.output);
        setBusinessModelVersion(session.currentVersion ?? 1);
        setBusinessModelUpdatedAt(session.updatedAt || session.createdAt);
        setIsBusinessModelOpen(true);
      }
    } catch (err: any) {
      console.error('Failed to load Business Model session:', err);
      setActionError(err?.message || 'Failed to open Business Model export view.');
    } finally {
      setLoadingArtifactId(null);
    }
  };

  // 3. Business Plan Lazy Loader
  const handleOpenBusinessPlan = async () => {
    if (!phase3?.businessPlanSessionId) return;
    setLoadingArtifactId('business-plan');
    setActionError(null);
    try {
      const session = await creatorAiApi.getBusinessPlan(phase3.businessPlanSessionId);
      if (session.output) {
        setActivePlan(session.output);
        setActiveForecast(null);
        setIsPlanForecastOpen(true);
      }
    } catch (err: any) {
      console.error('Failed to load Business Plan session:', err);
      setActionError(err?.message || 'Failed to open Business Plan export view.');
    } finally {
      setLoadingArtifactId(null);
    }
  };

  // 3. Financial Forecast Lazy Loader
  const handleOpenForecast = async () => {
    if (!phase3?.forecastSessionId) return;
    setLoadingArtifactId('financial-forecast');
    setActionError(null);
    try {
      const session = await creatorAiApi.getForecast(phase3.forecastSessionId);
      if (session.output) {
        setActiveForecast(session.output);
        setActivePlan(null);
        setIsPlanForecastOpen(true);
      }
    } catch (err: any) {
      console.error('Failed to load Financial Forecast session:', err);
      setActionError(err?.message || 'Failed to open Financial Forecast export view.');
    } finally {
      setLoadingArtifactId(null);
    }
  };

  // 4. Brand Kit ZIP Downloader
  const handleDownloadBrandKit = async () => {
    if (!brandKit) return;
    setLoadingArtifactId('brand-kit');
    setActionError(null);
    try {
      await exportBrandKitZip(brandKit, projectName);
    } catch (err: any) {
      console.error('Failed to export Brand Kit ZIP:', err);
      setActionError(err?.message || 'Failed to generate Brand Kit ZIP export.');
    } finally {
      setLoadingArtifactId(null);
    }
  };

  // Logo derivation for PDF prints
  const logoUrl = useMemo(() => {
    if (!brandKit) return null;
    const selectedKey = brandKit.logo?.selectedConceptKey;
    const concepts = brandKit.logo?.concepts || [];
    const approvedConcept = selectedKey ? concepts.find((c) => c.key === selectedKey) : concepts[0];
    const variations = brandKit.logo?.variations || {};
    return (
      variations.primary?.svgUri ||
      variations.primary?.pngUri ||
      variations.horizontal?.svgUri ||
      variations.horizontal?.pngUri ||
      variations.transparent?.svgUri ||
      variations.transparent?.pngUri ||
      variations.badge_stamp?.svgUri ||
      variations.badge_stamp?.pngUri ||
      approvedConcept?.lockupAssetUri ||
      approvedConcept?.markAssetUri ||
      null
    );
  }, [brandKit]);

  // Build the 8 artifact models
  const isBrandKitReady = Boolean(brandKit && (brandKit.status === "complete" || (brandKit as any).isConfirmed || brandKit.logo?.selectedConceptKey));
  const isMarketStudyReady = Boolean(phase3?.marketStudySessionId);
  const isBusinessModelReady = Boolean(phase3?.businessModelSessionId);
  const isBusinessPlanReady = Boolean(phase3?.businessPlanSessionId);
  const isForecastReady = Boolean(phase3?.forecastSessionId);
  const isFormationReady = Boolean(phase3?.formationGenerator?.selectedOptionKey);
  const isLegalChecklistReady = Boolean(
    (phase3?.legalAssessment?.items && phase3.legalAssessment.items.length > 0) ||
    (phase3?.legalChecklist?.items && phase3.legalChecklist.items.length > 0)
  );
  const isPhase4Ready = Boolean(computedStatus?.phase4?.status === 'completed');

  const artifacts: ArtifactItem[] = [
    // Phase 2
    {
      id: 'brand-kit',
      phaseId: 2,
      phaseTitle: 'Phase 2 // Brand & Visual Identity',
      stepNumber: 'Step 2.3',
      title: 'Brand Identity Kit',
      description: 'Production vector lockups (6 SVG variations), 5-role WCAG color palette, typography scale definitions, and CSS custom properties.',
      fileFormat: 'ZIP',
      isDownloadableV1: true,
      isReady: isBrandKitReady,
      lastUpdatedText: formatDate(brandKit?.updatedAt || journey?.updatedAt),
      versionNumber: brandKit?.version ?? 1,
      stepUrl: withIdeaContext('/dashboard/creator/phase-2/brand-kit', currentIdeaId),
      downloadLabel: 'Download ZIP',
      onDownloadOrView: handleDownloadBrandKit,
    },
    // Phase 3
    {
      id: 'market-study',
      phaseId: 3,
      phaseTitle: 'Phase 3 // Business Foundations',
      stepNumber: 'Step 3.1',
      title: 'Market Study & Sizing Funnel',
      description: 'TAM/SAM/SOM market sizing constriction, direct & indirect competitor benchmarking matrix, verified demand signals, and founder gap validation.',
      fileFormat: 'PDF',
      isDownloadableV1: true,
      isReady: isMarketStudyReady,
      lastUpdatedText: formatDate(journey?.updatedAt),
      stepUrl: withIdeaContext('/dashboard/creator/phase-3/market-study', currentIdeaId),
      downloadLabel: 'Export PDF',
      onDownloadOrView: handleOpenMarketStudy,
    },
    {
      id: 'business-model',
      phaseId: 3,
      phaseTitle: 'Phase 3 // Business Foundations',
      stepNumber: 'Step 3.2',
      title: 'Business Model Canvas & Unit Economics',
      description: 'Canonical 9-box Osterwalder canvas, pricing tier architecture, customer acquisition cost benchmarks, and lifetime value unit economics.',
      fileFormat: 'PDF',
      isDownloadableV1: true,
      isReady: isBusinessModelReady,
      lastUpdatedText: formatDate(journey?.updatedAt),
      stepUrl: withIdeaContext('/dashboard/creator/phase-3/business-model', currentIdeaId),
      downloadLabel: 'Export PDF',
      onDownloadOrView: handleOpenBusinessModel,
    },
    {
      id: 'financial-forecast',
      phaseId: 3,
      phaseTitle: 'Phase 3 // Business Foundations',
      stepNumber: 'Step 3.3',
      title: 'Financial Forecast & Break-Even Model',
      description: '36-month pro forma projections, monthly fixed & variable cost breakdown, net cashflow trajectory, and dynamic break-even horizon analysis.',
      fileFormat: 'PDF',
      isDownloadableV1: true,
      isReady: isForecastReady,
      lastUpdatedText: formatDate(journey?.updatedAt),
      stepUrl: withIdeaContext('/dashboard/creator/phase-3/forecast', currentIdeaId),
      downloadLabel: 'Export PDF',
      onDownloadOrView: handleOpenForecast,
    },
    {
      id: 'legal-checklist',
      phaseId: 3,
      phaseTitle: 'Phase 3 // Business Foundations',
      stepNumber: 'Step 3.4',
      title: 'Legal & Regulatory Compliance Checklist',
      description: 'Corporate bylaws, IP assignment agreements, GDPR data processing registers, employment contracts, and statutory compliance status.',
      fileFormat: 'IN_APP',
      isDownloadableV1: false,
      isReady: isLegalChecklistReady,
      lastUpdatedText: formatDate(phase3?.legalAssessment?.updatedAt || phase3?.legalAssessment?.evaluatedAt || phase3?.legalChecklist?.updatedAt || journey?.updatedAt),
      stepUrl: withIdeaContext('/dashboard/creator/phase-3/compliance', currentIdeaId),
      nonDownloadableNote: 'Compliance checklist active · Standalone PDF export is not yet supported for this format.',
    },
    {
      id: 'formation-memo',
      phaseId: 3,
      phaseTitle: 'Phase 3 // Business Foundations',
      stepNumber: 'Step 3.5',
      title: 'Corporate Formation & Skill Architecture',
      description: 'Recommended legal entity structure (SAS / SARL / Delaware C-Corp), founder equity allocation ranges, and specialist co-founder baseline.',
      fileFormat: 'IN_APP',
      isDownloadableV1: false,
      isReady: isFormationReady,
      lastUpdatedText: formatDate(journey?.updatedAt),
      stepUrl: withIdeaContext('/dashboard/creator/phase-3/formation', currentIdeaId),
      nonDownloadableNote: 'Entity structure and skills configured · Standalone PDF export is not yet supported for this format.',
    },
    {
      id: 'business-plan',
      phaseId: 3,
      phaseTitle: 'Phase 3 // Business Foundations',
      stepNumber: 'Step 3.6',
      title: 'Executive Business Plan',
      description: 'Investor-grade business plan covering value proposition, addressable target market, revenue streams, operational milestones, and risk register.',
      fileFormat: 'PDF',
      isDownloadableV1: true,
      isReady: isBusinessPlanReady,
      lastUpdatedText: formatDate(journey?.updatedAt),
      stepUrl: withIdeaContext('/dashboard/creator/phase-3/business-plan', currentIdeaId),
      downloadLabel: 'Export PDF',
      onDownloadOrView: handleOpenBusinessPlan,
    },
    // Phase 4
    {
      id: 'investor-readiness',
      phaseId: 4,
      phaseTitle: 'Phase 4 // Venture Packaging & Readiness',
      stepNumber: 'Phase 4',
      title: 'Investor Readiness & Offer Architecture',
      description: 'Complete commercial offer packaging, resource allocation budget, and go-to-market runway plan prepared for investor diligence.',
      fileFormat: 'IN_APP',
      isDownloadableV1: false,
      isReady: isPhase4Ready,
      lastUpdatedText: formatDate(journey?.updatedAt),
      stepUrl: withIdeaContext('/dashboard/creator/phase-4', currentIdeaId),
      nonDownloadableNote: 'Offer architecture confirmed · Standalone PDF export is not yet supported for this format.',
    },
  ];

  const readyCount = artifacts.filter((a) => a.isReady).length;
  const isCompletelyEmpty = readyCount === 0;

  // Group by phase
  const phaseGroups = [
    {
      phaseId: 2,
      phaseTitle: 'Phase 2 // Brand & Visual Identity',
      items: artifacts.filter((a) => a.phaseId === 2),
    },
    {
      phaseId: 3,
      phaseTitle: 'Phase 3 // Business Foundations',
      items: artifacts.filter((a) => a.phaseId === 3),
    },
    {
      phaseId: 4,
      phaseTitle: 'Phase 4 // Venture Packaging & Readiness',
      items: artifacts.filter((a) => a.phaseId === 4),
    },
  ];

  return (
    <Phase3SetupShell
      fullWidth
      headerAlign="left"
      stepEyebrow="Assets & IP"
      title="Creator Asset Library"
      description="All documents and exports are generated on demand from your project's current data."
    >
      <div className="w-full space-y-10 pb-16">
        {/* Loading State */}
        {loading && (
          <Card className="rounded-xl border border-border/70 bg-card p-12 text-center max-w-xl mx-auto space-y-4 shadow-none">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto" />
            <p className="text-xs text-muted-foreground font-sans">
              Loading your venture asset catalog...
            </p>
          </Card>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-5 flex items-start gap-3.5 max-w-2xl mx-auto">
            <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-destructive font-sans">
                Failed to load Asset Library
              </h4>
              <p className="text-xs text-foreground/80 font-sans">{error}</p>
            </div>
          </div>
        )}

        {/* Action / Export Error Banner */}
        {actionError && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 flex items-start justify-between gap-3 max-w-3xl mx-auto animate-in fade-in-50">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-destructive font-sans">
                  Export Notice
                </h4>
                <p className="text-xs text-foreground/90 font-sans leading-relaxed">
                  {actionError}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActionError(null)}
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground shrink-0"
              aria-label="Dismiss export error"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Completely Empty State (No artifacts produced yet) */}
        {!loading && !error && isCompletelyEmpty && (
          <Card className="rounded-xl border border-border/70 bg-card p-8 sm:p-10 space-y-6 shadow-none max-w-3xl mx-auto text-left">
            <div className="space-y-1.5 border-b border-border/60 pb-4">
              <span className="text-label text-muted-foreground uppercase tracking-wider">
                Catalog Status · 0 of 8 Produced
              </span>
              <h3 className="text-base sm:text-lg font-semibold text-foreground font-sans">
                No project artifacts produced yet
              </h3>
              <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                Documents appear here automatically as you complete milestones across each phase of your venture. Each document is compiled on demand from your project&apos;s current data.
              </p>
            </div>

            <div className="space-y-3 text-xs text-muted-foreground font-sans">
              <div className="text-label font-semibold uppercase text-foreground">
                Document Generation Milestones:
              </div>
              <ul className="space-y-2 divide-y divide-border/40">
                <li className="pt-2 flex items-start gap-2">
                  <span className="font-semibold text-foreground shrink-0">Phase 2:</span>
                  <span><strong>Brand Identity Kit (.ZIP)</strong> — Unlocked upon confirming your 6-step visual identity in Brand Studio.</span>
                </li>
                <li className="pt-2 flex items-start gap-2">
                  <span className="font-semibold text-foreground shrink-0">Phase 3:</span>
                  <span><strong>Market Study, Business Plan, &amp; Financial Forecast (.PDF)</strong> — Compiled as you generate sizing funnels, operational models, and 36-month projections.</span>
                </li>
                <li className="pt-2 flex items-start gap-2">
                  <span className="font-semibold text-foreground shrink-0">Phase 4:</span>
                  <span><strong>Investor Readiness Summary</strong> — Generated upon finalizing your commercial offer packaging and pricing architecture.</span>
                </li>
              </ul>
            </div>

            <div className="pt-2 border-t border-border/60 flex items-center justify-between">
              <span className="text-caption text-muted-foreground">
                Active workspace: <strong className="text-foreground">{projectName}</strong>
              </span>
              <Button
                size="sm"
                onClick={() => router.push('/dashboard/creator')}
                className="gap-1.5 text-xs font-semibold rounded-lg"
              >
                Go to Active Phase <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </Card>
        )}

        {/* Populated State (All 8 artifacts listed, grouped by phase) */}
        {!loading && !error && !isCompletelyEmpty && (
          <div className="space-y-10">
            {/* Freshness banner */}
            <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-sans text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span>
                  <strong>On-Demand Generation:</strong> Exports always reflect your latest project edits.
                </span>
              </div>
              <span className="text-caption text-muted-foreground/80">
                {readyCount} of 8 documents active
              </span>
            </div>

            {/* Render Groups */}
            {phaseGroups.map((group) => (
              <div key={group.phaseId} className="space-y-4">
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <h3 className="text-section-title font-bold uppercase tracking-wider text-foreground">
                    {group.phaseTitle}
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {group.items.map((item) => {
                    const isBusy = loadingArtifactId === item.id;

                    return (
                      <Card
                        key={item.id}
                        className="rounded-xl border border-border/70 bg-card p-5 sm:p-6 flex flex-col justify-between gap-5 transition-all shadow-none hover:border-border"
                      >
                        <div className="space-y-2.5">
                          {/* Top Row: Step Tag + Format Pill + Status */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-badge uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border/60">
                                {item.stepNumber}
                              </span>
                              <span className="text-badge font-bold uppercase px-1.5 py-0.5 rounded bg-muted/80 text-foreground border border-border/60">
                                {item.fileFormat === 'PDF' ? '.PDF' : item.fileFormat === 'ZIP' ? '.ZIP' : 'IN-APP'}
                              </span>
                            </div>

                            {item.isReady ? (
                              <span className="inline-flex items-center gap-1 text-badge uppercase text-emerald-600 dark:text-emerald-400 font-semibold">
                                <CheckCircle2 className="w-3 h-3" /> Ready
                              </span>
                            ) : (
                              <span className="text-badge uppercase text-muted-foreground/70">
                                Not Produced
                              </span>
                            )}
                          </div>

                          {/* Title & Description */}
                          <div className="space-y-1">
                            <h4 className="text-sm font-semibold text-foreground font-sans">
                              {item.title}
                            </h4>
                            <p className="text-xs text-muted-foreground font-sans leading-relaxed line-clamp-2">
                              {item.description}
                            </p>
                          </div>
                        </div>

                        {/* Bottom Row: Metadata & Actions */}
                        <div className="pt-3 border-t border-border/60 space-y-3">
                          {/* Last updated info */}
                          <div className="flex items-center justify-between text-caption text-muted-foreground">
                            <span>
                              {item.isReady && item.lastUpdatedText
                                ? `Updated: ${item.lastUpdatedText}`
                                : 'Not yet generated'}
                            </span>
                            {item.versionNumber && (
                              <span className="text-muted-foreground/80">v{item.versionNumber}</span>
                            )}
                          </div>

                          {/* Action Button or Explanatory Note */}
                          {item.isReady ? (
                            item.isDownloadableV1 ? (
                              <div className="flex items-center justify-between gap-2">
                                <Button
                                  size="sm"
                                  onClick={item.onDownloadOrView}
                                  disabled={isBusy}
                                  className="w-full sm:w-auto gap-1.5 text-xs font-semibold rounded-lg"
                                >
                                  {isBusy ? (
                                    <>
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Preparing...
                                    </>
                                  ) : item.fileFormat === 'ZIP' ? (
                                    <>
                                      <FolderArchive className="w-3.5 h-3.5" /> {item.downloadLabel || 'Download ZIP'}
                                    </>
                                  ) : (
                                    <>
                                      <Download className="w-3.5 h-3.5" /> {item.downloadLabel || 'Export PDF'}
                                    </>
                                  )}
                                </Button>
                                <Link
                                  href={item.stepUrl}
                                  className="text-caption text-muted-foreground hover:text-foreground font-sans inline-flex items-center gap-1 shrink-0"
                                >
                                  View Screen <ExternalLink className="w-3 h-3" />
                                </Link>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <p className="text-caption text-muted-foreground font-sans leading-normal">
                                  {item.nonDownloadableNote}
                                </p>
                                <Link
                                  href={item.stepUrl}
                                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline font-sans"
                                >
                                  Open in {item.stepNumber} <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                              </div>
                            )
                          ) : (
                            <Link
                              href={item.stepUrl}
                              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground font-sans"
                            >
                              Generate in {item.stepNumber} <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lazy-Loaded Market Study Print Overlay */}
      {activeMarketStudy && (
        <MarketStudyPrintView
          open={isMarketStudyOpen}
          onClose={() => {
            setIsMarketStudyOpen(false);
            setActiveMarketStudy(null);
          }}
          projectName={projectName}
          project={{
            sector: projectMeta.sector,
            geography: projectMeta.geography,
            marketGap: projectMeta.marketGap,
          }}
          output={activeMarketStudy}
        />
      )}

      {/* Lazy-Loaded Business Model Print Overlay */}
      {activeBusinessModel && (
        <BusinessModelPrintView
          open={isBusinessModelOpen}
          onClose={() => {
            setIsBusinessModelOpen(false);
            setActiveBusinessModel(null);
          }}
          projectName={projectName}
          project={{
            sector: projectMeta.sector,
            geography: projectMeta.geography,
            marketGap: projectMeta.marketGap,
            problem: projectMeta.problem,
            solution: projectMeta.solution,
            targetUser: projectMeta.targetUser,
          }}
          output={activeBusinessModel}
          version={businessModelVersion}
          updatedAt={businessModelUpdatedAt}
        />
      )}

      {/* Lazy-Loaded Financial Forecast Print Overlay */}
      {activeForecast && (
        <ForecastPrintView
          open={isPlanForecastOpen}
          onClose={() => {
            setIsPlanForecastOpen(false);
            setActiveForecast(null);
          }}
          projectName={projectName}
          logoUrl={logoUrl}
          project={{
            sector: projectMeta.sector,
            geography: projectMeta.geography,
            targetUser: projectMeta.targetUser,
          }}
          output={activeForecast}
        />
      )}

      {/* Lazy-Loaded Business Plan Print Overlay */}
      {activePlan && (
        <PlanForecastPrintView
          open={isPlanForecastOpen}
          onClose={() => {
            setIsPlanForecastOpen(false);
            setActivePlan(null);
          }}
          projectName={projectName}
          project={{
            problem: projectMeta.problem,
            solution: projectMeta.solution,
            targetUser: projectMeta.targetUser,
          }}
          plan={activePlan}
          forecast={null}
        />
      )}
    </Phase3SetupShell>
  );
}
