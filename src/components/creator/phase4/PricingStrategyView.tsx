'use client';

import React, { useState } from 'react';
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
  const [editingOffer, setEditingOffer] = useState<PricingOffer | null>(null);
  const [editPrice, setEditPrice] = useState<string>('');
  const [editDiscount, setEditDiscount] = useState<string>('');
  const [editFeatures, setEditFeatures] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const openEditModal = (offer: PricingOffer) => {
    setEditingOffer(offer);
    setEditPrice(offer.founderPrice !== undefined && offer.founderPrice !== null ? offer.founderPrice.toString() : offer.recommendedPrice.toString());
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

  // 1. Gate Blocking Screen
  if (gateError) {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="bg-amber-950/30 border border-amber-800/60 rounded-xl p-6 text-amber-200 space-y-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" />
            <div>
              <h3 className="text-base font-semibold text-amber-200">Prerequisite Gates Incomplete</h3>
              <p className="text-xs text-amber-300/80 mt-1">{gateError.message}</p>
            </div>
          </div>
          <div className="bg-amber-900/20 rounded-lg p-4 text-xs space-y-2 border border-amber-800/40 font-mono text-amber-300/90">
            <div>1. Phase 3 (Market Study, Business Model, Financial Forecast) must be completed.</div>
            <div>2. Phase 4.1 Construction Snapshot, 4.2 Roadmap, 4.3 Needs & 4.4 Skills must be active.</div>
            <div>3. Founder HumainX profile must be complete.</div>
          </div>
          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              href={`/dashboard/creator/phase-4/support?ideaId=${ideaId}`}
              className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium"
            >
              ← Back to Phase 4.5 Aids & Grants
            </Link>
            <Link
              href={`/dashboard/creator/phase-4/snapshot?ideaId=${ideaId}`}
              className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium"
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
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-10 text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-950/40">
            <Tag className="w-8 h-8" />
          </div>
          <div className="max-w-xl mx-auto space-y-2">
            <span className="text-[11px] uppercase tracking-widest font-mono text-emerald-400 font-semibold block">
              PHASE 4.6 · COMMERCIAL LAUNCH LAYER
            </span>
            <h2 className="text-xl font-bold text-zinc-100">Launch Pricing & Revenue Model Engine</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Synthesizes your Phase 3 Business Model, French cost structure, Financial Forecast benchmarks, and customer segments into mathematically floor-tested launch offers.
            </p>
          </div>

          <div className="max-w-md mx-auto bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-4 text-left text-xs space-y-2 text-zinc-300">
            <div className="font-semibold text-zinc-200 font-mono text-[11px] uppercase tracking-wider">
              Engine Invariants:
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Multi-stream revenue model support (hybrid aware)</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Rigorous price floor: VariableCost / (1 - m)</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Normalized economic basis alignment with Forecast ARPU</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Three distinct prices: Recommended ≠ Founder ≠ Validated</span>
            </div>
          </div>

          <button
            onClick={onGenerate}
            disabled={isLoading}
            className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white text-xs font-semibold shadow-lg shadow-emerald-950/60 transition-all inline-flex items-center gap-2"
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

  // Calculate high-level summary counters
  const offers = strategy.offers || [];
  const risks = strategy.risks || [];
  const experiments = strategy.experiments || [];
  const avgMargin = offers.length > 0
    ? Math.round(offers.reduce((acc, o) => acc + (o.unitEconomics?.contributionMarginRate || 0), 0) / offers.length)
    : 0;
  const criticalRisksCount = risks.filter((r) => r.severity === 'Critical' || r.severity === 'High').length;
  const allAligned = offers.every((o) => o.forecastAlignment?.isAligned !== false);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* 1. Header & Eyebrow */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded">
              Phase 4.6 · Commercial Launch Layer
            </span>
            <span className="text-[11px] font-mono text-zinc-500">
              Generated {new Date(strategy.generatedAt).toLocaleDateString()}
            </span>
            {strategy.founderEdited && (
              <span className="text-[10px] font-mono bg-purple-950/60 text-purple-300 border border-purple-800/40 px-2 py-0.5 rounded font-medium">
                Founder Customized
              </span>
            )}
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-zinc-100">
            Launch Pricing & Revenue Model Strategy
          </h1>
          <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
            Financial packaging and launch offers for <span className="text-zinc-200 font-medium">{projectName}</span>. Built from underlying unit economics, contribution margins, and forecast benchmarks.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg text-xs font-medium border flex items-center gap-2 transition-colors ${
              updateAvailable
                ? 'bg-amber-600 hover:bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-950/50'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{updateAvailable ? 'Refresh Strategy' : 'Re-verify'}</span>
          </button>
        </div>
      </div>

      {/* 2. Stale Notification Banner */}
      {updateAvailable && (
        <div className="bg-gradient-to-r from-amber-950/50 via-zinc-900 to-zinc-900 border border-amber-800/60 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-semibold text-amber-200">Upstream Milestone Updates Detected</h4>
              <p className="text-xs text-zinc-400 mt-0.5">
                Upstream sources have evolved since pricing was generated: <span className="text-amber-300 font-medium">{changedSources.join(', ')}</span>.
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

      {/* 3. Hero Financial Counters */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 space-y-1">
          <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 block">Primary Model</span>
          <div className="text-sm font-bold text-emerald-400 font-mono flex items-center gap-1.5 truncate">
            <Tag className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{strategy.primaryRevenueModel}</span>
          </div>
          <span className="text-[10px] text-zinc-500">
            {strategy.revenueModels?.length || 1} stream{(strategy.revenueModels?.length || 1) > 1 ? 's' : ''} active
          </span>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 space-y-1">
          <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 block">Launch Offers</span>
          <div className="text-sm font-bold text-zinc-100 font-mono">
            {offers.length} Offer{offers.length > 1 ? 's' : ''}
          </div>
          <span className="text-[10px] text-zinc-500">
            {offers.filter((o) => o.isRecommendedDefault).length > 0 ? 'Default selected' : 'Multi-tier ready'}
          </span>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 space-y-1">
          <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 block">Avg Contribution Margin</span>
          <div className="text-sm font-bold text-cyan-400 font-mono flex items-center gap-1">
            <Percent className="w-3.5 h-3.5 text-cyan-400" />
            <span>{avgMargin}%</span>
          </div>
          <span className="text-[10px] text-zinc-500">Across packaged offers</span>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 space-y-1">
          <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 block">Forecast Alignment</span>
          <div className="text-sm font-bold font-mono flex items-center gap-1.5">
            {allAligned ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Aligned
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Variance
              </span>
            )}
          </div>
          <span className="text-[10px] text-zinc-500">Normalized period check</span>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 space-y-1">
          <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 block">Pricing Risks</span>
          <div className="text-sm font-bold font-mono">
            {criticalRisksCount > 0 ? (
              <span className="text-amber-400">{criticalRisksCount} High Risk</span>
            ) : (
              <span className="text-emerald-400">0 Critical</span>
            )}
          </div>
          <span className="text-[10px] text-zinc-500">{risks.length} total monitored</span>
        </div>
      </div>

      {/* 4. Multi-Stream Revenue Architecture Card */}
      <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-zinc-800/60 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider font-mono">
              Revenue Model Architecture
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono text-zinc-400">Underlying Streams:</span>
            {(strategy.revenueModels || [strategy.primaryRevenueModel]).map((m, idx) => (
              <span
                key={idx}
                className="text-[10px] font-mono bg-zinc-800/80 text-zinc-200 border border-zinc-700/60 px-2 py-0.5 rounded-full"
              >
                {m}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="md:col-span-2 space-y-1 text-zinc-300 leading-relaxed">
            <div className="text-zinc-100 font-medium">Recommendation Rationale:</div>
            <p className="text-zinc-400">{strategy.recommendation?.primaryRationale || strategy.summary}</p>
          </div>
          <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-3 space-y-2">
            <div className="text-[11px] font-semibold text-zinc-300 font-mono uppercase tracking-wider">
              Key Action Items:
            </div>
            <div className="space-y-1.5 text-zinc-400">
              {(strategy.recommendation?.keyActionItems || []).map((item, idx) => (
                <div key={idx} className="flex items-start gap-1.5">
                  <ArrowRight className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Packaged Offer Architecture Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <Tag className="w-4 h-4 text-emerald-400" />
              <span>Commercial Launch Offers</span>
            </h3>
            <p className="text-xs text-zinc-400">
              Packaged pricing tiers tested against cost floor and forecast ARPU.
            </p>
          </div>
          <span className="text-[11px] font-mono text-zinc-500">
            {offers.length} Tier{offers.length > 1 ? 's' : ''} Configured
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {offers.map((offer) => {
            const hasFounderOverride = offer.founderPrice !== undefined && offer.founderPrice !== null;
            const isFloorViolated = offer.status === 'BelowFloor';
            const isMismatch = offer.status === 'ForecastMismatch';

            return (
              <div
                key={offer.key}
                className={`bg-zinc-900/50 border rounded-xl p-5 flex flex-col justify-between transition-all relative ${
                  offer.isRecommendedDefault
                    ? 'border-emerald-500/60 shadow-lg shadow-emerald-950/30'
                    : 'border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                {offer.isRecommendedDefault && (
                  <div className="absolute -top-2.5 right-4 bg-emerald-600 text-white font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded font-semibold shadow">
                    MBC Recommended Default
                  </div>
                )}

                <div className="space-y-4">
                  {/* Title & Segment */}
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                        {offer.tier}
                      </span>
                      <span className="text-[10px] font-mono bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded border border-zinc-700">
                        {offer.targetSegment}
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-zinc-100 mt-1">{offer.name}</h4>
                    <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                      {offer.revenueModel} · {offer.billingPeriod || 'Monthly'}
                    </div>
                  </div>

                  {/* Four-Price Separation Display */}
                  <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-lg p-3 space-y-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-zinc-400 font-medium">Effective Launch Price:</span>
                      <div className="text-right">
                        <span className="text-xl font-bold font-mono text-zinc-100">
                          {`${getCurrencySymbol(offer.presentation?.currency)}${offer.effectivePrice}`}
                        </span>
                        <span className="text-[10px] text-zinc-500 ml-1">
                          {offer.presentation?.taxMode === 'TaxInclusive'
                            ? 'TTC'
                            : offer.presentation?.taxMode === 'TaxExclusive'
                            ? 'HT'
                            : offer.presentation?.taxMode === 'Exempt'
                            ? 'Exempt'
                            : 'HT/TTC N/A'}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-zinc-800/60 pt-2 space-y-1.5 text-[11px] font-mono">
                      <div className="flex items-center justify-between text-zinc-400">
                        <span>MBC Recommendation:</span>
                        <span className="text-zinc-200">
                          {`${getCurrencySymbol(offer.presentation?.currency)}${offer.recommendedPrice}`}
                        </span>
                      </div>
                      {hasFounderOverride && (
                        <div className="flex items-center justify-between text-purple-400 font-medium">
                          <span>Your Price:</span>
                          <span>{`${getCurrencySymbol(offer.presentation?.currency)}${offer.founderPrice}`}</span>
                        </div>
                      )}
                      {offer.marketReferencePrice !== undefined && offer.marketReferencePrice !== null && (
                        <div className="flex items-center justify-between text-blue-400">
                          <span>Market Reference:</span>
                          <span>{`${getCurrencySymbol(offer.presentation?.currency)}${offer.marketReferencePrice}`}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400">Validated Market Price:</span>
                        {offer.validatedMarketPrice !== undefined && offer.validatedMarketPrice !== null ? (
                          <span className="text-emerald-400 font-semibold">
                            {`${getCurrencySymbol(offer.presentation?.currency)}${offer.validatedMarketPrice}`}
                          </span>
                        ) : (
                          <span className="text-zinc-500 italic">Not validated yet</span>
                        )}
                      </div>
                      {/* Evidence Validation Badge */}
                      <div className="flex items-center justify-between pt-1 border-t border-zinc-800/40 text-[10px]">
                        <span className="text-zinc-500 uppercase">Evidence Quality:</span>
                        <span
                          className={`px-1.5 py-0.5 rounded font-medium border ${
                            offer.marketPriceValidationLevel === 'EmpiricallyValidated'
                              ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800/50'
                              : offer.marketPriceValidationLevel === 'Supported'
                              ? 'bg-blue-950/70 text-blue-300 border-blue-800/50'
                              : offer.marketPriceValidationLevel === 'Indicative'
                              ? 'bg-amber-950/70 text-amber-300 border-amber-800/50'
                              : 'bg-zinc-800/80 text-zinc-400 border-zinc-700/50'
                          }`}
                        >
                          {offer.marketPriceValidationLevel === 'EmpiricallyValidated'
                            ? 'Validated'
                            : offer.marketPriceValidationLevel === 'Supported'
                            ? 'Supported'
                            : offer.marketPriceValidationLevel === 'Indicative'
                            ? 'Provisional'
                            : 'Needs Validation'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Banner */}
                  {isFloorViolated && (
                    <div className="bg-red-950/40 border border-red-800/60 rounded p-2 text-[11px] text-red-300 flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                      <span>Price below floor! Loss-making under current cost structure.</span>
                    </div>
                  )}

                  {isMismatch && (
                    <div className="bg-amber-950/40 border border-amber-800/60 rounded p-2 text-[11px] text-amber-300 flex items-start gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>Material variance with Financial Forecast ARPU.</span>
                    </div>
                  )}

                  {/* Unit Economics Breakdown */}
                  <div className="space-y-1.5 text-xs">
                    <div className="text-[11px] font-semibold text-zinc-300 font-mono uppercase tracking-wider flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-emerald-400" />
                      <span>Unit Economics:</span>
                    </div>
                    <div className="bg-zinc-950/40 border border-zinc-800/60 rounded p-2.5 space-y-1 text-[11px] font-mono">
                      <div className="flex justify-between text-zinc-400">
                        <span>Min Floor Price:</span>
                        <span className="text-zinc-200">
                          {offer.presentation?.currency || '€'}
                          {offer.unitEconomics?.minimumPriceFloor}
                        </span>
                      </div>
                      <div className="flex justify-between text-zinc-400">
                        <span>Variable Cost:</span>
                        <span className="text-zinc-300">
                          {offer.presentation?.currency || '€'}
                          {offer.unitEconomics?.variableCostPerUnit}
                        </span>
                      </div>
                      <div className="flex justify-between text-zinc-400">
                        <span>Contribution Margin:</span>
                        <span className="text-emerald-400 font-bold">
                          {offer.presentation?.currency || '€'}
                          {offer.unitEconomics?.contributionMarginAmount} (
                          {offer.unitEconomics?.contributionMarginRate}%)
                        </span>
                      </div>
                      {offer.unitEconomics?.breakevenUnitsPerMonth && (
                        <div className="flex justify-between text-zinc-400">
                          <span>Breakeven Volume:</span>
                          <span className="text-zinc-300">
                            {offer.unitEconomics.breakevenUnitsPerMonth} units/mo
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Forecast Alignment Basis */}
                  <div className="space-y-1 text-xs">
                    <div className="text-[11px] font-semibold text-zinc-300 font-mono uppercase tracking-wider">
                      Forecast Alignment:
                    </div>
                    <div className="bg-zinc-950/40 border border-zinc-800/60 rounded p-2 text-[11px] font-mono space-y-0.5 text-zinc-400">
                      <div className="flex justify-between">
                        <span>Basis:</span>
                        <span className="text-zinc-300">{offer.forecastAlignment?.alignmentBasis}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Benchmark vs Offer:</span>
                        <span className="text-zinc-200">
                          {offer.presentation?.currency || '€'}{offer.forecastAlignment?.forecastBenchmarkValue} vs {offer.presentation?.currency || '€'}{offer.forecastAlignment?.normalizedOfferValue}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Variance:</span>
                        <span className={offer.forecastAlignment?.isAligned ? 'text-emerald-400' : 'text-amber-400'}>
                          {offer.forecastAlignment?.variancePercentage}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Features Included */}
                  <div className="space-y-1.5 text-xs">
                    <div className="text-[11px] font-semibold text-zinc-300 font-mono uppercase tracking-wider">
                      Included Features:
                    </div>
                    <div className="space-y-1">
                      {(offer.featuresIncluded || []).map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-zinc-400 text-xs">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {offer.founderNotes && (
                    <div className="bg-purple-950/20 border border-purple-800/40 rounded p-2 text-[11px] text-purple-300">
                      <span className="font-semibold block font-mono">Founder Note:</span>
                      <span>{offer.founderNotes}</span>
                    </div>
                  )}
                </div>

                {/* Edit CTA */}
                <div className="pt-4 mt-4 border-t border-zinc-800/60 flex items-center justify-end">
                  <button
                    onClick={() => openEditModal(offer)}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <Sliders className="w-3 h-3 text-emerald-400" />
                    <span>Customize Offer</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. Financial Integrity & Risk Monitoring Panel */}
      <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-zinc-800/60 pb-3">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider font-mono">
            Financial Integrity & Risk Guardrails
          </h3>
        </div>

        {risks.length === 0 ? (
          <div className="text-xs text-zinc-500 italic py-2">
            No critical financial risks or price-floor violations detected.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {risks.map((risk) => (
              <div
                key={risk.id}
                className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-3 space-y-1.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-200">{risk.riskType}</span>
                  <span
                    className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-bold ${
                      risk.severity === 'Critical'
                        ? 'bg-red-950 text-red-400 border border-red-800'
                        : risk.severity === 'High'
                        ? 'bg-amber-950 text-amber-400 border border-amber-800'
                        : 'bg-zinc-800 text-zinc-300'
                    }`}
                  >
                    {risk.severity}
                  </span>
                </div>
                <p className="text-zinc-400 leading-relaxed">{risk.description}</p>
                <div className="text-emerald-400/90 text-[11px] pt-1">
                  <span className="font-medium">Mitigation:</span> {risk.mitigationSuggestion}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 7. Empirical Pricing Experiments */}
      <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-zinc-800/60 pb-3">
          <Zap className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider font-mono">
            Empirical Validation Experiments (Pre-Launch)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {experiments.map((exp) => (
            <div
              key={exp.id}
              className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 px-2 py-0.5 rounded font-semibold">
                  {exp.experimentType}
                </span>
                <span className="text-[10px] font-mono text-zinc-500">
                  Duration: {exp.testDurationDays} Days
                </span>
              </div>
              <div className="font-medium text-zinc-200">{exp.hypothesis}</div>
              <div className="space-y-1 text-[11px] font-mono text-zinc-400 border-t border-zinc-800/40 pt-2">
                <div>Target Segment: <span className="text-zinc-300">{exp.targetSegment}</span></div>
                <div>Success Metric: <span className="text-emerald-400">{exp.successMetric}</span></div>
                <div className="text-zinc-400 pt-1">{exp.suggestedAction}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 8. Canonical Phase 4.7 Navigation Banner */}
      <div className="mt-12 bg-emerald-950/20 border border-emerald-800/40 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center md:text-left">
          <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-400 block font-semibold">
            PHASE 4.7 · GTM & LAUNCH STRATEGY
          </span>
          <h4 className="text-sm font-semibold text-zinc-100">Ready to Sequence Your Go-To-Market Strategy?</h4>
          <p className="text-xs text-zinc-400 max-w-xl">
            Translate your pricing model and target segments into grounded acquisition channels, weekly capacity allocations, and empirical validation experiments.
          </p>
        </div>
        <Link
          href={`/dashboard/creator/phase-4/gtm?ideaId=${ideaId}`}
          className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shrink-0 flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition-colors"
        >
          <span>Build My Launch Strategy</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 9. Founder Edit Modal Dialog */}
      {editingOffer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                  Founder Override
                </span>
                <h3 className="text-base font-bold text-zinc-100">
                  Customize Offer: {editingOffer.name}
                </h3>
              </div>
              <button
                onClick={() => setEditingOffer(null)}
                className="text-zinc-400 hover:text-zinc-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {saveError && (
              <div className="bg-red-950/40 border border-red-800/60 rounded-lg p-3 text-xs text-red-300">
                {saveError}
              </div>
            )}

            <form onSubmit={handleSaveOffer} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="founder-price-input" className="text-xs font-medium text-zinc-300 flex items-center justify-between">
                  <span>Founder Selected Price ({editingOffer.presentation?.currency || '€'})</span>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    Floor: {editingOffer.presentation?.currency || '€'}{editingOffer.unitEconomics?.minimumPriceFloor}
                  </span>
                </label>
                <input
                  id="founder-price-input"
                  type="number"
                  step="0.01"
                  required
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 font-mono focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[10px] text-zinc-500">
                  MBC Recommended: {editingOffer.presentation?.currency || '€'}{editingOffer.recommendedPrice}. Editing immediately recalculates contribution margins and forecast variance.
                </p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="founder-discount-input" className="text-xs font-medium text-zinc-300">
                  Launch Pilot Discount (%)
                </label>
                <input
                  id="founder-discount-input"
                  type="number"
                  min="0"
                  max="100"
                  value={editDiscount}
                  onChange={(e) => setEditDiscount(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="founder-features-input" className="text-xs font-medium text-zinc-300">
                  Included Features (One per line)
                </label>
                <textarea
                  id="founder-features-input"
                  rows={4}
                  value={editFeatures}
                  onChange={(e) => setEditFeatures(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="founder-notes-input" className="text-xs font-medium text-zinc-300">
                  Founder Strategic Notes
                </label>
                <input
                  id="founder-notes-input"
                  type="text"
                  placeholder="e.g. Early adopter tier for pilot partners"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingOffer(null)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 text-white text-xs font-medium flex items-center gap-2 shadow-lg shadow-emerald-950/50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Recalculating Economics...</span>
                    </>
                  ) : (
                    <span>Save & Recalculate</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
