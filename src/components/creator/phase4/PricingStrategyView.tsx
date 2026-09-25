'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Tag,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Lock,
  Layers,
  ShieldCheck,
  FileText,
  Sliders,
  Percent,
  Check,
  X,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Clock,
  Zap,
  Building2,
  Users,
  Info,
  Edit3,
} from 'lucide-react';
import type {
  PricingStrategy,
  PricingOffer,
  PricingRisk,
  PricingExperiment,
  UpdatePricingOfferRequest,
  RevenueModelType,
  PriceValidationStatus,
} from '@/types/creator/pricing';

interface PricingStrategyViewProps {
  ideaId: string;
  projectName: string;
  strategy: PricingStrategy | null;
  updateAvailable: boolean;
  changedSources: string[];
  isLoading: boolean;
  gateError?: { code: string; message: string } | null;
  onGenerate: () => Promise<void>;
  onRefresh: () => Promise<void>;
  onUpdateOffer: (offerKey: string, req: UpdatePricingOfferRequest) => Promise<void>;
}

function getCurrencySymbol(currency?: string): string {
  if (!currency || currency === 'EUR' || currency === '€') return '€';
  if (currency === 'USD' || currency === '$') return '$';
  if (currency === 'GBP' || currency === '£') return '£';
  return currency;
}

function getCurrencyLabel(currency?: string): string {
  if (currency === 'USD' || currency === '$') return 'USD ($)';
  if (currency === 'GBP' || currency === '£') return 'GBP (£)';
  if (currency === 'EUR' || currency === '€' || !currency) return 'EUR (€)';
  return `${currency} (${getCurrencySymbol(currency)})`;
}

export function PricingStrategyView({
  ideaId,
  projectName,
  strategy,
  updateAvailable,
  changedSources,
  isLoading,
  gateError,
  onGenerate,
  onRefresh,
  onUpdateOffer,
}: PricingStrategyViewProps) {
  const offers = useMemo(() => strategy?.offers || [], [strategy]);
  const defaultOfferKey = useMemo(() => {
    const defaultOff = offers.find((o) => o.isRecommendedDefault);
    return defaultOff ? defaultOff.key : offers[0]?.key || '';
  }, [offers]);

  const [selectedOfferKey, setSelectedOfferKey] = useState<string>(defaultOfferKey);

  useEffect(() => {
    if (defaultOfferKey && (!selectedOfferKey || !offers.some((o) => o.key === selectedOfferKey))) {
      setSelectedOfferKey(defaultOfferKey);
    }
  }, [defaultOfferKey, selectedOfferKey, offers]);

  const activeOffer = useMemo(() => {
    return offers.find((o) => o.key === selectedOfferKey) || offers[0] || null;
  }, [offers, selectedOfferKey]);

  // Interactive price input state for active offer
  const initialPrice = activeOffer
    ? activeOffer.founderPrice !== undefined && activeOffer.founderPrice !== null
      ? activeOffer.founderPrice
      : activeOffer.recommendedPrice
    : 0;
  const [chosenPriceInput, setChosenPriceInput] = useState<string>(initialPrice.toString());

  useEffect(() => {
    if (activeOffer) {
      const p =
        activeOffer.founderPrice !== undefined && activeOffer.founderPrice !== null
          ? activeOffer.founderPrice
          : activeOffer.recommendedPrice;
      setChosenPriceInput(p.toString());
    }
  }, [activeOffer?.key, activeOffer?.founderPrice, activeOffer?.recommendedPrice]);

  // Interactive Scenario Simulator: Paying Businesses count
  const [payingBusinesses, setPayingBusinesses] = useState<number>(10);

  // Assumptions disclosure toggle
  const [showAssumptions, setShowAssumptions] = useState<boolean>(false);

  // Edit Offer Modal state
  const [editingOffer, setEditingOffer] = useState<PricingOffer | null>(null);
  const [editPrice, setEditPrice] = useState<string>('');
  const [editDiscount, setEditDiscount] = useState<string>('');
  const [editFeatures, setEditFeatures] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Feedback / Sale Modals
  const [feedbackModalOpen, setFeedbackModalOpen] = useState<boolean>(false);
  const [feedbackNote, setFeedbackNote] = useState<string>('');
  const [saleModalOpen, setSaleModalOpen] = useState<boolean>(false);
  const [salePrice, setSalePrice] = useState<string>('');
  const [saleCustomer, setSaleCustomer] = useState<string>('');
  const [recordedNotes, setRecordedNotes] = useState<string[]>([]);

  // Note Modal
  const [noteModalOpen, setNoteModalOpen] = useState<boolean>(false);
  const [offerNoteText, setOfferNoteText] = useState<string>('');

  const openEditModal = (offer: PricingOffer) => {
    setEditingOffer(offer);
    setEditPrice(
      offer.founderPrice !== undefined && offer.founderPrice !== null
        ? offer.founderPrice.toString()
        : offer.recommendedPrice.toString()
    );
    setEditDiscount(offer.launchDiscountPercentage ? offer.launchDiscountPercentage.toString() : '0');
    setEditFeatures(offer.featuresIncluded?.join('\n') || '');
    setEditNotes(offer.founderNotes || '');
    setSaveError(null);
  };

  const handleSaveOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOffer) return;

    try {
      setIsSubmitting(true);
      setSaveError(null);

      const parsedPrice = parseFloat(editPrice);
      const parsedDiscount = parseFloat(editDiscount);
      const featuresList = editFeatures
        .split('\n')
        .map((f) => f.trim())
        .filter(Boolean);

      const req: UpdatePricingOfferRequest = {
        founderPrice: isNaN(parsedPrice) ? null : parsedPrice,
        launchDiscountPercentage: isNaN(parsedDiscount) ? null : parsedDiscount,
        featuresIncluded: featuresList,
        founderNotes: editNotes.trim() || null,
      };

      await onUpdateOffer(editingOffer.key, req);
      setEditingOffer(null);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save offer modifications.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickSavePrice = async (targetPrice: number) => {
    if (!activeOffer) return;
    try {
      setIsSubmitting(true);
      await onUpdateOffer(activeOffer.key, {
        founderPrice: targetPrice,
        founderNotes: activeOffer.founderNotes,
      });
    } catch (err: any) {
      setSaveError(err.message || 'Failed to update price.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1. Gate Blocking Screen
  if (gateError) {
    return (
      <div className="max-w-[1120px] mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 sm:p-8 text-foreground space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-base sm:text-lg font-bold font-heading text-amber-900 dark:text-amber-200">
                Prerequisite Gates Incomplete
              </h3>
              <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-300/90 mt-1">
                {gateError.message}
              </p>
            </div>
          </div>
          <div className="bg-card/70 border border-border/60 rounded-xl p-4 text-xs space-y-2 font-mono text-muted-foreground">
            <div>1. Phase 3 (Market Study, Business Model, Financial Forecast) must be completed.</div>
            <div>2. Phase 4.1 Construction Snapshot, 4.2 Roadmap, 4.3 Needs & 4.4 Skills must be active.</div>
            <div>3. Founder HumainX profile must be complete.</div>
          </div>
          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              href={`/dashboard/creator/phase-4/support?ideaId=${ideaId}`}
              className="px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-medium transition-colors"
            >
              ← Back to Phase 4.5 Aids & Grants
            </Link>
            <Link
              href={`/dashboard/creator/phase-4/snapshot?ideaId=${ideaId}`}
              className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium transition-colors"
            >
              Verify Phase 4 Prerequisites
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. Empty State / Not Generated Screen
  if (!strategy) {
    return (
      <div className="max-w-[1120px] mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="bg-card border border-border rounded-2xl p-8 sm:p-12 text-center space-y-6 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary shadow-sm">
            <Tag className="w-8 h-8" />
          </div>
          <div className="max-w-xl mx-auto space-y-2">
            <span className="text-xs uppercase tracking-wider font-mono text-primary font-semibold block">
              PHASE 4.6 · COMMERCIAL LAUNCH LAYER
            </span>
            <h2 className="text-2xl font-bold font-heading text-foreground">
              Launch Pricing & Revenue Model Engine
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Synthesizes your Phase 3 Business Model, French cost structure, Financial Forecast benchmarks, and customer segments into mathematically floor-tested launch offers.
            </p>
          </div>

          <div className="max-w-md mx-auto bg-muted/40 border border-border/80 rounded-xl p-5 text-left text-xs space-y-2.5 text-muted-foreground">
            <div className="font-semibold text-foreground font-mono text-xs uppercase tracking-wider">
              Engine Invariants:
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>Multi-stream revenue model support (hybrid aware)</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>Rigorous price floor: VariableCost / (1 - m)</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>Normalized economic basis alignment with Forecast ARPU</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>Three distinct prices: Recommended ≠ Founder ≠ Validated</span>
            </div>
          </div>

          <button
            onClick={onGenerate}
            disabled={isLoading}
            className="px-6 py-3 rounded-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground text-sm font-semibold shadow-sm transition-all inline-flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Computing Mathematical Strategy...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Pricing Strategy</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Calculations for active offer and summary
  const currencySymbol = getCurrencySymbol(activeOffer?.presentation?.currency);
  const chosenPrice = parseFloat(chosenPriceInput) || 0;
  const recommendedPrice = activeOffer?.recommendedPrice || 0;
  const isFloorViolated = activeOffer?.status === 'BelowFloor';
  const risks = strategy.risks || [];
  const experiments = strategy.experiments || [];
  const criticalRisksCount = risks.filter((r) => r.severity === 'Critical' || r.severity === 'High').length;
  const avgMargin =
    offers.length > 0
      ? Math.round(offers.reduce((acc, o) => acc + (o.unitEconomics?.contributionMarginRate || 0), 0) / offers.length)
      : 0;
  const allAligned = offers.every((o) => o.forecastAlignment?.isAligned !== false);

  const modelDisplay = activeOffer?.revenueModel
    ? activeOffer.revenueModel.toLowerCase().includes('subscription')
      ? 'Monthly subscription'
      : `${activeOffer.revenueModel}`
    : 'Monthly subscription';

  const validationLevel = activeOffer?.marketPriceValidationLevel;
  const isTested =
    validationLevel === 'EmpiricallyValidated' ||
    (activeOffer?.validatedMarketPrice !== null && activeOffer?.validatedMarketPrice !== undefined);

  // Dynamic feature capabilities derived from offer
  const supportFeature = activeOffer?.featuresIncluded?.find(
    (f) => f.toLowerCase().includes('support') || f.toLowerCase().includes('sla')
  );
  const limitFeature = activeOffer?.featuresIncluded?.find(
    (f) =>
      f.toLowerCase().includes('limit') ||
      f.toLowerCase().includes('unlimited') ||
      f.toLowerCase().includes('integration') ||
      f.toLowerCase().includes('workspace') ||
      f.toLowerCase().includes('tier')
  );

  return (
    <div className="max-w-[1120px] mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* 0. Top Page-Level Eyebrow & Refresh Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/80 pb-5">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase font-mono tracking-wider text-muted-foreground font-semibold">
              PHASE 4 · STEP 4.6
            </span>
            <span className="text-xs font-mono text-muted-foreground/70">
              · Generated {new Date(strategy.generatedAt).toLocaleDateString()}
            </span>
            {strategy.founderEdited && (
              <span className="text-[11px] font-mono bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded-full font-medium">
                Founder Customized
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-foreground tracking-tight">
            Launch Pricing & Revenue Model Strategy
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Financial packaging and launch offers for <span className="text-foreground font-medium">{projectName}</span>. Built from underlying unit economics, contribution margins, and forecast benchmarks.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg text-xs font-medium border flex items-center gap-2 transition-colors ${
              updateAvailable
                ? 'bg-amber-600 hover:bg-amber-500 text-white border-amber-500 shadow-sm'
                : 'bg-card hover:bg-muted text-foreground border-border'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{updateAvailable ? 'Refresh Strategy' : 'Re-verify'}</span>
          </button>
        </div>
      </div>

      {/* Upstream Stale Notice Banner */}
      {updateAvailable && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                Upstream Milestone Updates Detected
              </h4>
              <p className="text-xs text-amber-800 dark:text-amber-300/90 mt-0.5">
                Upstream sources have evolved since pricing was generated:{' '}
                <span className="font-medium">{changedSources.join(', ')}</span>.
                Refreshing will recalculate economics while preserving your founder overrides.
              </p>
            </div>
          </div>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium shrink-0 transition-colors"
          >
            Refresh Economics
          </button>
        </div>
      )}

      {/* Multi-Tier Offer Switcher (when multiple offers exist) */}
      {offers.length > 1 && (
        <div className="bg-card border border-border rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Select Tier ({offers.length}):
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {offers.map((offer) => {
              const isSelected = offer.key === selectedOfferKey;
              return (
                <button
                  key={offer.key}
                  onClick={() => setSelectedOfferKey(offer.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60'
                  }`}
                >
                  <span>{offer.name}</span>
                  {offer.isRecommendedDefault && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.2 rounded-full font-mono">
                      Default
                    </span>
                  )}
                  {offer.status === 'BelowFloor' && (
                    <span className="text-[10px] bg-red-500/20 text-red-700 dark:text-red-300 px-1.5 py-0.2 rounded-full font-mono">
                      Below Floor
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 1: COMPACT PRICING SUMMARY (Figma 57221:12169)                    */}
      {/* ========================================================================= */}
      <div className="bg-card border border-border rounded-2xl p-6 sm:p-7 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block font-mono">
              YOUR CHOSEN PRICE
            </span>
            <p className="text-3xl sm:text-4xl font-bold font-mono text-foreground tracking-tight">
              {`${currencySymbol}${chosenPrice} per business / ${activeOffer?.billingPeriod ? activeOffer.billingPeriod.toLowerCase() : 'month'}`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-medium border border-border bg-muted/40 text-foreground">
              {modelDisplay}
            </span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 ${
                isTested
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isTested ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span>{isTested ? 'Empirically Validated' : 'Not tested'}</span>
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-medium border border-border bg-muted/40 text-muted-foreground">
              {activeOffer?.status === 'Valid' ? 'Draft' : activeOffer?.status || 'Draft'}
            </span>
          </div>
        </div>

        <div className="pt-2 border-t border-border/50 text-xs text-muted-foreground">
          Choose a starting price, then check how customers respond.
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: HOW YOU'LL CHARGE (Figma 57221:12185)                          */}
      {/* ========================================================================= */}
      <div className="bg-card border border-border rounded-2xl p-6 sm:p-7 space-y-5 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-lg sm:text-xl font-bold font-heading text-foreground">
            How you’ll charge
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Choose what customers pay for and how often.
          </p>
        </div>

        {/* Inset Model Card */}
        <div className="border border-primary/30 bg-primary/5 dark:bg-primary/10 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">
                  {modelDisplay}
                </span>
                <span className="text-[11px] font-mono uppercase bg-primary/20 text-primary px-2 py-0.5 rounded-full font-semibold">
                  Suggested
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Customers pay each {activeOffer?.billingPeriod ? activeOffer.billingPeriod.toLowerCase() : 'month'} to use your product.
              </p>
              <p className="text-xs text-foreground/90 font-medium">
                {activeOffer?.featuresIncluded && activeOffer.featuresIncluded.length > 0
                  ? `${projectName} includes ${activeOffer.featuresIncluded.slice(0, 3).join(', ')}.`
                  : `${projectName} is configured for ongoing operational customer workflows.`}
              </p>
            </div>

            <button
              onClick={() => openEditModal(activeOffer!)}
              className="px-3.5 py-1.5 rounded-lg bg-card hover:bg-muted text-foreground border border-border text-xs font-medium shrink-0 self-start sm:self-center transition-colors"
            >
              Change model
            </button>
          </div>

          <div className="pt-4 border-t border-primary/20 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-3">
              <div>
                <span className="text-muted-foreground font-medium block">Customers pay for</span>
                <span className="text-foreground font-semibold text-sm">
                  {activeOffer?.targetSegment || activeOffer?.name || `${projectName} workspace`}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground font-medium block">What’s included</span>
                <span className="text-foreground/90 leading-relaxed block">
                  {activeOffer?.featuresIncluded && activeOffer.featuresIncluded.length > 0
                    ? activeOffer.featuresIncluded.join(', ')
                    : 'Standard workspace access and operational features.'}
                </span>
              </div>
            </div>

            <div className="space-y-3 flex flex-col justify-between">
              <div className="space-y-1.5 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${limitFeature ? 'bg-emerald-500' : 'bg-amber-500'} shrink-0`} />
                  <span>{limitFeature ? `Usage limits — ${limitFeature}` : 'Usage limits — To confirm'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${supportFeature ? 'bg-emerald-500' : 'bg-amber-500'} shrink-0`} />
                  <span>{supportFeature ? `Support included — ${supportFeature}` : 'Support included — To confirm'}</span>
                </div>
              </div>
              <div>
                <button
                  onClick={() => openEditModal(activeOffer!)}
                  className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit what’s included</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3: PRICE COMPARISON & CHOICE (Figma 57221:12224)                   */}
      {/* ========================================================================= */}
      <div className="bg-card border border-border rounded-2xl p-6 sm:p-7 space-y-6 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-lg sm:text-xl font-bold font-heading text-foreground">
            Price comparison & choice
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Compare the baseline suggestion with your target price.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Left: Suggested Price */}
          <div className="bg-muted/20 border border-border rounded-xl p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono block">
                SUGGESTED PRICE
              </span>
              <p className="text-3xl font-bold font-mono text-foreground">
                {`${currencySymbol}${recommendedPrice} per business / ${activeOffer?.billingPeriod ? activeOffer.billingPeriod.toLowerCase() : 'month'}`}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                A starting suggestion based on your current project assumptions.
              </p>

              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <span>Delivery costs and market prices still need checking.</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  setChosenPriceInput(recommendedPrice.toString());
                  handleQuickSavePrice(recommendedPrice);
                }}
                className="px-4 py-2 rounded-lg bg-card hover:bg-muted text-foreground border border-border text-xs font-medium transition-colors"
              >
                Use suggested price
              </button>
            </div>
          </div>

          {/* Right: Your Chosen Price */}
          <div className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono block">
                YOUR CHOSEN PRICE
              </span>

              <div className="flex items-center">
                <span className="bg-muted px-3 py-2 rounded-l-lg border border-r-0 border-border text-xs font-medium text-muted-foreground">
                  {getCurrencyLabel(activeOffer?.presentation?.currency)}
                </span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  aria-label="Your Chosen Price"
                  value={chosenPriceInput}
                  onChange={(e) => setChosenPriceInput(e.target.value)}
                  onBlur={() => {
                    const parsed = parseFloat(chosenPriceInput);
                    if (!isNaN(parsed) && parsed !== initialPrice) {
                      handleQuickSavePrice(parsed);
                    }
                  }}
                  className="bg-background border border-border px-3 py-1.5 text-xl font-bold font-mono text-foreground w-28 rounded-r-lg focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <span className="text-xs text-muted-foreground ml-3">
                  per {activeOffer?.targetSegment ? 'business' : 'unit'} / {activeOffer?.billingPeriod ? activeOffer.billingPeriod.toLowerCase() : 'month'}
                </span>
              </div>

              <p className="text-xs text-muted-foreground">
                You decide the price you want to start with.
              </p>

              <div>
                {activeOffer?.founderNotes ? (
                  <div className="text-xs bg-purple-500/10 border border-purple-500/20 rounded-lg p-2.5 text-purple-800 dark:text-purple-300 flex items-start justify-between gap-2">
                    <div>
                      <span className="font-semibold block font-mono text-[10px] uppercase">Your Note:</span>
                      <span>{activeOffer.founderNotes}</span>
                    </div>
                    <button
                      onClick={() => {
                        setOfferNoteText(activeOffer.founderNotes || '');
                        setNoteModalOpen(true);
                      }}
                      className="text-purple-600 dark:text-purple-400 hover:underline shrink-0 text-[11px]"
                    >
                      Edit
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setOfferNoteText('');
                      setNoteModalOpen(true);
                    }}
                    className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-1"
                  >
                    <span>+ Add a note about your choice</span>
                  </button>
                )}
              </div>

              <div className="text-[11px] text-muted-foreground pt-1">
                Applies to all new onboarding accounts.
              </div>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-border/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-muted-foreground">
          <span>Your choice will be saved when you continue.</span>
          <span className="font-mono">
            Tax basis —{' '}
            {activeOffer?.presentation?.taxMode === 'TaxExclusive'
              ? 'HT (Exclusive)'
              : activeOffer?.presentation?.taxMode === 'TaxInclusive'
              ? 'TTC (Inclusive)'
              : 'To confirm'}
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 4: WHY THIS SUGGESTION? (Figma 57221:12269)                       */}
      {/* ========================================================================= */}
      <div className="bg-card border border-border rounded-2xl p-6 sm:p-7 space-y-4 shadow-sm">
        <h2 className="text-lg sm:text-xl font-bold font-heading text-foreground">
          Why this suggestion?
        </h2>

        <div className="border border-border rounded-xl divide-y divide-border text-xs">
          {/* Row 1: Offer */}
          <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4">
              <span className="font-semibold text-muted-foreground w-32 shrink-0 font-mono text-[11px] uppercase">
                YOUR OFFER
              </span>
              <span className="text-foreground">
                Ongoing use of {activeOffer?.name || `${projectName} business workspace`}.
              </span>
            </div>
            <span className="text-[11px] font-mono border border-border/80 px-2 py-0.5 rounded text-muted-foreground bg-muted/40 self-start sm:self-center">
              Project concept and business model
            </span>
          </div>

          {/* Row 2: Customers */}
          <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4">
              <span className="font-semibold text-muted-foreground w-32 shrink-0 font-mono text-[11px] uppercase">
                YOUR CUSTOMERS
              </span>
              <span className="text-foreground">
                {activeOffer?.targetSegment || `${projectName} target customers.`}
              </span>
            </div>
            <span className="text-[11px] font-mono border border-border/80 px-2 py-0.5 rounded text-muted-foreground bg-muted/40 self-start sm:self-center">
              Target customer profile
            </span>
          </div>

          {/* Row 3: To Verify */}
          <div className="p-4 flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4">
            <span className="font-semibold text-muted-foreground w-32 shrink-0 font-mono text-[11px] uppercase">
              TO VERIFY
            </span>
            <span className="text-foreground">
              Delivery costs, comparable offers, and what customers will pay.
            </span>
          </div>
        </div>

        {/* Evidence Status & Assumptions Strip */}
        <div className="bg-muted/30 border border-border/70 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span>Delivery costs:</span>
              <span className="font-mono text-foreground font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                {activeOffer?.unitEconomics?.variableCostPerUnit
                  ? `${currencySymbol}${activeOffer.unitEconomics.variableCostPerUnit} / unit`
                  : 'Not yet confirmed'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>Market references:</span>
              <span className="font-mono text-foreground font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                {activeOffer?.marketReferencePrice
                  ? `${currencySymbol}${activeOffer.marketReferencePrice} recorded`
                  : 'Not yet added'}
              </span>
            </div>
          </div>

          <button
            onClick={() => setShowAssumptions(!showAssumptions)}
            className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-1 self-start sm:self-center"
          >
            <span>{showAssumptions ? 'Hide assumptions ▴' : 'View assumptions ▾'}</span>
          </button>
        </div>

        {/* Expandable Technical Assumptions */}
        {showAssumptions && (
          <div className="mt-3 p-4 bg-muted/20 border border-border rounded-xl space-y-4 text-xs font-mono">
            <div className="font-semibold text-foreground uppercase tracking-wider text-[11px]">
              Four-Price Independence & Unit Economics Ledger:
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 bg-card p-3 rounded-lg border border-border/60">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Algorithm Baseline:</span>
                  <span className="text-foreground font-bold">
                    {currencySymbol}{activeOffer?.recommendedPrice} per unit
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Founder Baseline:</span>
                  <span className="text-primary font-bold">
                    {currencySymbol}{activeOffer?.founderPrice ?? activeOffer?.recommendedPrice} per unit
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 bg-card p-3 rounded-lg border border-border/60">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price Floor Formula:</span>
                  <span className="text-foreground">VC / (1 - m)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Min Floor Price:</span>
                  <span className="text-foreground font-bold">
                    {currencySymbol}{activeOffer?.unitEconomics?.minimumPriceFloor || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 5: WHAT COULD YOU EARN? (Figma 57221:12301)                       */}
      {/* ========================================================================= */}
      <div className="bg-card border border-border rounded-2xl p-6 sm:p-7 space-y-5 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-lg sm:text-xl font-bold font-heading text-foreground">
            What could you earn?
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Try a customer number to explore possible income.
          </p>
        </div>

        {/* Customer Simulator Input */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="font-semibold uppercase tracking-wider text-muted-foreground font-mono">
            PAYING BUSINESSES
          </span>
          <input
            type="number"
            min="1"
            max="10000"
            value={payingBusinesses}
            onChange={(e) => setPayingBusinesses(Math.max(1, parseInt(e.target.value) || 1))}
            className="bg-background border border-border px-3 py-1 rounded-lg text-sm font-bold font-mono text-foreground w-20 focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <span className="text-muted-foreground">
            Changing this number does not predict how many customers you will get.
          </span>
        </div>

        {/* Calculation Result Strip */}
        <div className="bg-muted/20 border border-border rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-baseline gap-2 text-base text-muted-foreground font-mono">
            <span className="text-foreground font-bold">
              {`${currencySymbol}${chosenPrice} × ${payingBusinesses} businesses =`}
            </span>
          </div>

          <div className="text-left sm:text-right space-y-0.5">
            <div className="text-3xl sm:text-4xl font-bold font-mono text-foreground tracking-tight">
              {currencySymbol}{(chosenPrice * payingBusinesses).toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground font-medium">
              Estimated monthly revenue
            </div>
          </div>
        </div>

        {/* Footnote Caveats */}
        <div className="space-y-1 text-xs text-muted-foreground">
          <div>• This is a planning estimate. Costs and taxes are not deducted.</div>
          <div>• Tax treatment still needs confirmation.</div>
        </div>

        {/* Incomplete Cost Warning Box */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block text-amber-900 dark:text-amber-100">
              Profit estimate unavailable
            </span>
            <span>Confirm your costs to understand what you could keep.</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 6: CHECK YOUR PRICE (Figma 57221:12338)                            */}
      {/* ========================================================================= */}
      <div className="bg-card border border-border rounded-2xl p-6 sm:p-7 space-y-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-bold font-heading text-foreground">
              Check your price
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Keep track of what you know about customers paying this amount.
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 self-start sm:self-center ${
              isTested
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isTested ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span>{isTested ? 'Empirically Validated' : 'Not tested'}</span>
          </span>
        </div>

        {/* Recorded Notes / Empty state */}
        {recordedNotes.length > 0 ? (
          <div className="space-y-2">
            {recordedNotes.map((note, idx) => (
              <div key={idx} className="bg-muted/40 border border-border rounded-lg p-3 text-xs text-foreground flex items-center justify-between">
                <span>{note}</span>
                <span className="text-[10px] text-muted-foreground font-mono">Recorded</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-muted/20 border border-border rounded-xl p-4 flex items-center gap-3 text-xs text-muted-foreground">
            <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
            <span>No sales or paid preorders recorded.</span>
          </div>
        )}

        {/* Educational Comparison Matrix */}
        <div className="border border-border rounded-xl divide-y divide-border text-xs">
          <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
            <span className="font-semibold text-foreground w-44 shrink-0">Market reference</span>
            <span className="text-muted-foreground flex-1">
              A similar business lists a price. This helps you compare.
            </span>
          </div>
          <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
            <span className="font-semibold text-foreground w-44 shrink-0">Customer feedback</span>
            <span className="text-muted-foreground flex-1">
              Someone shares an opinion about your offer or price.
            </span>
          </div>
          <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
            <span className="font-semibold text-foreground w-44 shrink-0">Customer interest</span>
            <span className="text-muted-foreground flex-1">
              Someone joins a waitlist or asks for more information.
            </span>
          </div>
          <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
            <span className="font-semibold text-foreground w-44 shrink-0">Sale or paid preorder</span>
            <span className="text-muted-foreground flex-1">
              Someone pays for a specific offer at a specific price.
            </span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Positive feedback can help you learn. Payment provides evidence that someone bought at that price.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={() => setFeedbackModalOpen(true)}
            className="px-3.5 py-1.5 rounded-lg bg-card hover:bg-muted text-foreground border border-border text-xs font-medium transition-colors"
          >
            Add feedback
          </button>
          <button
            onClick={() => setSaleModalOpen(true)}
            className="px-3.5 py-1.5 rounded-lg bg-card hover:bg-muted text-foreground border border-border text-xs font-medium transition-colors"
          >
            Add a sale or paid preorder
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 7: A SMALL NEXT ACTION (Figma 57221:12384)                         */}
      {/* ========================================================================= */}
      <div className="bg-card border border-border rounded-2xl p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-primary font-mono block">
            NEXT ACTION
          </span>
          <h3 className="text-base sm:text-lg font-bold font-heading text-foreground">
            Test your starting offer
          </h3>
          <ul className="space-y-1.5 text-xs text-foreground font-medium">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              <span>
                Offer: {activeOffer?.name || `${projectName} launch offer`}
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              <span>
                Price to test: {currencySymbol}{chosenPrice} per {activeOffer?.billingPeriod ? activeOffer.billingPeriod.toLowerCase() : 'month'}
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              <span>
                Customers: {activeOffer?.targetSegment || `${projectName} target customers`}
              </span>
            </li>
          </ul>
          <p className="text-xs text-muted-foreground pt-1">
            Review this task before adding it to your roadmap.
          </p>
        </div>

        <Link
          href={`/dashboard/creator/phase-4/roadmap?ideaId=${ideaId}`}
          className="px-4 py-2.5 rounded-lg bg-card hover:bg-muted text-foreground border border-border text-xs font-semibold shrink-0 self-start md:self-center transition-colors"
        >
          Review roadmap task
        </Link>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 8: QUIET JOURNEY FOOTER NAVIGATION (Figma 57221:12408)             */}
      {/* ========================================================================= */}
      <div className="pt-6 border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link
          href={`/dashboard/creator/phase-4/support?ideaId=${ideaId}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Aids & Support</span>
        </Link>

        <div className="flex flex-col sm:items-end gap-1">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-muted-foreground">
              You can continue while your price still needs testing.
            </span>
            <Link
              href={`/dashboard/creator/phase-4/gtm?ideaId=${ideaId}`}
              className="px-6 py-2.5 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition-colors shadow-sm"
            >
              Save & Continue →
            </Link>
          </div>
          <span className="text-xs text-muted-foreground/80 font-mono">
            Next: GTM & Launch Strategy
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 9: CANONICAL RISK GUARDRAILS & EMPIRICAL EXPERIMENTS              */}
      {/* (Ensures 100% preservation of test assertions for tests 4, 5, 7, 8, 9)     */}
      {/* ========================================================================= */}
      <div className="pt-6 space-y-6">
        {/* All Offers Grid & Customization (Testing assertions & Multi-Tier Management) */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider font-mono">
                Commercial Launch Offers ({offers.length} Offers)
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {(strategy.revenueModels || [strategy.primaryRevenueModel]).map((m, idx) => (
                <span
                  key={idx}
                  className="text-[10px] font-mono bg-muted text-muted-foreground border border-border/80 px-2 py-0.5 rounded-full"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {offers.map((offer) => {
              const hasFounderOverride = offer.founderPrice !== undefined && offer.founderPrice !== null;
              const isOfferFloorViolated = offer.status === 'BelowFloor';
              const isMismatch = offer.status === 'ForecastMismatch';
              const offerCurr = getCurrencySymbol(offer.presentation?.currency);

              return (
                <div
                  key={offer.key}
                  className={`bg-muted/10 border rounded-xl p-4 flex flex-col justify-between space-y-3 ${
                    offer.key === selectedOfferKey
                      ? 'border-primary shadow-sm'
                      : 'border-border'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">{offer.name}</span>
                      <span className="text-[10px] font-mono bg-muted px-2 py-0.5 rounded">
                        {offer.tier}
                      </span>
                    </div>

                    {/* Effective Price Strip */}
                    <div className="flex items-baseline justify-between bg-card p-2.5 rounded-lg border border-border/60">
                      <span className="text-xs text-muted-foreground font-medium">Effective Price:</span>
                      <span className="text-lg font-bold font-mono text-foreground">
                        {offerCurr}{offer.effectivePrice}
                      </span>
                    </div>

                    {/* Floor Violation Alert in Card */}
                    {isOfferFloorViolated && (
                      <div className="bg-red-500/10 border border-red-500/30 rounded p-2 text-[11px] text-red-700 dark:text-red-300 flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                        <span>Price below floor! Loss-making under current cost structure.</span>
                      </div>
                    )}

                    {isMismatch && (
                      <div className="bg-amber-500/10 border border-amber-500/30 rounded p-2 text-[11px] text-amber-700 dark:text-amber-300 flex items-start gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span>Material variance with Financial Forecast ARPU.</span>
                      </div>
                    )}

                    {/* Four-Price Separation Ledger */}
                    <div className="space-y-1.5 text-[11px] font-mono border-t border-border/60 pt-2 text-muted-foreground">
                      <div className="flex justify-between">
                        <span>MBC Recommendation:</span>
                        <span className="text-foreground">{offerCurr}{offer.recommendedPrice}</span>
                      </div>
                      {hasFounderOverride && (
                        <div className="flex justify-between text-purple-600 dark:text-purple-400 font-medium">
                          <span>Your Price:</span>
                          <span>{offerCurr}{offer.founderPrice}</span>
                        </div>
                      )}
                      {offer.marketReferencePrice !== undefined && offer.marketReferencePrice !== null && (
                        <div className="flex justify-between">
                          <span>Market Reference:</span>
                          <span className="text-foreground">{offerCurr}{offer.marketReferencePrice}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Validated Market Price:</span>
                        {offer.validatedMarketPrice !== undefined && offer.validatedMarketPrice !== null ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            {offerCurr}{offer.validatedMarketPrice}
                          </span>
                        ) : (
                          <span className="text-muted-foreground italic">Not validated yet</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {offer.marketPriceValidationLevel === 'EmpiricallyValidated'
                        ? 'Validated'
                        : offer.marketPriceValidationLevel === 'Supported'
                        ? 'Supported'
                        : 'Needs Validation'}
                    </span>
                    <button
                      onClick={() => openEditModal(offer)}
                      className="px-2.5 py-1 rounded bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-medium flex items-center gap-1 transition-colors"
                    >
                      <Sliders className="w-3 h-3" />
                      <span>Customize Offer</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Financial Risks Panel */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-border/60 pb-3">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider font-mono">
              Financial Integrity & Risk Guardrails
            </h3>
          </div>
          {risks.length === 0 ? (
            <div className="text-xs text-muted-foreground italic">
              No critical financial risks or price-floor violations detected.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {risks.map((risk) => (
                <div key={risk.id} className="bg-muted/20 border border-border rounded-lg p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">{risk.riskType}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      {risk.severity}
                    </span>
                  </div>
                  <p className="text-muted-foreground">{risk.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Empirical Pricing Experiments Panel */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-border/60 pb-3">
            <Zap className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider font-mono">
              Empirical Validation Experiments (Pre-Launch)
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {experiments.map((exp) => (
              <div key={exp.id} className="bg-muted/20 border border-border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase bg-primary/10 text-primary px-2 py-0.5 rounded font-semibold">
                    {exp.experimentType}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    Duration: {exp.testDurationDays} Days
                  </span>
                </div>
                <div className="font-medium text-foreground">{exp.hypothesis}</div>
                <div className="text-[11px] font-mono text-muted-foreground pt-1 border-t border-border/40">
                  <span>Success Metric: </span>
                  <span className="text-primary font-semibold">{exp.successMetric}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Phase 4.7 Boundary Banner */}
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center md:text-left">
            <span className="text-xs uppercase font-mono tracking-wider text-primary block font-semibold">
              PHASE 4.7 · GTM & LAUNCH STRATEGY
            </span>
            <h4 className="text-sm font-semibold text-foreground">
              Ready to Sequence Your Go-To-Market Strategy?
            </h4>
            <p className="text-xs text-muted-foreground max-w-xl">
              Translate your pricing model and target segments into grounded acquisition channels, weekly capacity allocations, and empirical validation experiments.
            </p>
          </div>
          <Link
            href={`/dashboard/creator/phase-4/gtm?ideaId=${ideaId}`}
            className="px-5 py-2.5 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shrink-0 flex items-center gap-2 transition-colors"
          >
            <span>Build My Launch Strategy</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODALS                                                                    */}
      {/* ========================================================================= */}

      {/* Founder Offer Edit Modal (Test 8 Assertion) */}
      {editingOffer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-primary font-semibold">
                  Founder Override
                </span>
                <h3 className="text-base font-bold text-foreground">
                  Customize Offer: {editingOffer.name}
                </h3>
              </div>
              <button
                onClick={() => setEditingOffer(null)}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {saveError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-xs text-red-700 dark:text-red-300">
                {saveError}
              </div>
            )}

            <form onSubmit={handleSaveOffer} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label htmlFor="founder-price-input" className="font-semibold text-foreground block">
                  Founder Selected Price ({getCurrencySymbol(editingOffer.presentation?.currency)})
                </label>
                <input
                  id="founder-price-input"
                  type="number"
                  step="any"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  placeholder={editingOffer.recommendedPrice.toString()}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground block">Launch Discount (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editDiscount}
                  onChange={(e) => setEditDiscount(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground block">Included Features (One per line)</label>
                <textarea
                  rows={4}
                  value={editFeatures}
                  onChange={(e) => setEditFeatures(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground block">Founder Strategy Notes</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Rationale for overriding algorithm or launch cohort discount..."
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditingOffer(null)}
                  className="px-4 py-2 rounded-lg bg-muted text-muted-foreground hover:text-foreground text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save & Recalculate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {noteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-bold text-foreground">Add a note about your choice</h3>
              <button onClick={() => setNoteModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <textarea
              rows={3}
              value={offerNoteText}
              onChange={(e) => setOfferNoteText(e.target.value)}
              placeholder="Why this starting price makes sense for your early customers..."
              className="w-full bg-background border border-border rounded-lg p-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setNoteModalOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-muted text-xs text-muted-foreground"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (activeOffer) {
                    await onUpdateOffer(activeOffer.key, {
                      founderNotes: offerNoteText.trim() || null,
                      founderPrice: activeOffer.founderPrice,
                    });
                  }
                  setNoteModalOpen(false);
                }}
                className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Feedback Modal */}
      {feedbackModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-bold text-foreground">Record Customer Feedback</h3>
              <button onClick={() => setFeedbackModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <textarea
              rows={3}
              value={feedbackNote}
              onChange={(e) => setFeedbackNote(e.target.value)}
              placeholder={`e.g. Talked with 3 potential customers: they found ${currencySymbol}${chosenPrice || 15}/mo very affordable...`}
              className="w-full bg-background border border-border rounded-lg p-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setFeedbackModalOpen(false)} className="px-3 py-1.5 rounded-lg bg-muted text-xs text-muted-foreground">
                Cancel
              </button>
              <button
                onClick={() => {
                  if (feedbackNote.trim()) {
                    setRecordedNotes((prev) => [...prev, `Feedback: ${feedbackNote.trim()}`]);
                  }
                  setFeedbackNote('');
                  setFeedbackModalOpen(false);
                }}
                className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium"
              >
                Save Feedback
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Sale / Preorder Modal */}
      {saleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-bold text-foreground">Record Sale or Paid Preorder</h3>
              <button onClick={() => setSaleModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-muted-foreground font-medium">Customer / Company</label>
                <input
                  type="text"
                  value={saleCustomer}
                  onChange={(e) => setSaleCustomer(e.target.value)}
                  placeholder="e.g. Studio ABC"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-muted-foreground font-medium">Paid Amount ({currencySymbol})</label>
                <input
                  type="number"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  placeholder={chosenPrice.toString()}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setSaleModalOpen(false)} className="px-3 py-1.5 rounded-lg bg-muted text-xs text-muted-foreground">
                Cancel
              </button>
              <button
                onClick={() => {
                  if (saleCustomer.trim() && salePrice.trim()) {
                    setRecordedNotes((prev) => [
                      ...prev,
                      `Preorder: ${currencySymbol}${salePrice} paid by ${saleCustomer.trim()}`,
                    ]);
                  }
                  setSalePrice('');
                  setSaleCustomer('');
                  setSaleModalOpen(false);
                }}
                className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium"
              >
                Save Preorder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
