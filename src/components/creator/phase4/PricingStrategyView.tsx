'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Tag,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ArrowLeft,
  FileText,
  Check,
  X,
  Edit3,
} from 'lucide-react';
import type {
  PricingStrategy,
  PricingOffer,
  PricingEvidenceRecord,
  UpdatePricingOfferRequest,
  BillingPeriod,
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
  const router = useRouter();
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

  // Save coordination & race prevention locks
  const isSavingRef = useRef<boolean>(false);
  const activeSavePromiseRef = useRef<Promise<void> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Interactive Scenario Simulator: Quantity count
  const [simulatorQuantity, setSimulatorQuantity] = useState<number>(10);

  // Assumptions disclosure toggle
  const [showAssumptions, setShowAssumptions] = useState<boolean>(false);

  // Edit Offer Modal state
  const [editingOffer, setEditingOffer] = useState<PricingOffer | null>(null);
  const [editPrice, setEditPrice] = useState<string>('');
  const [editDiscount, setEditDiscount] = useState<string>('');
  const [editBillingPeriod, setEditBillingPeriod] = useState<string>('Monthly');
  const [editFeatures, setEditFeatures] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');

  // Feedback / Sale Modals
  const [feedbackModalOpen, setFeedbackModalOpen] = useState<boolean>(false);
  const [feedbackParticipant, setFeedbackParticipant] = useState<string>('');
  const [feedbackNote, setFeedbackNote] = useState<string>('');
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const [saleModalOpen, setSaleModalOpen] = useState<boolean>(false);
  const [salePrice, setSalePrice] = useState<string>('');
  const [saleCustomer, setSaleCustomer] = useState<string>('');
  const [saleNotes, setSaleNotes] = useState<string>('');
  const [saleError, setSaleError] = useState<string | null>(null);

  // Note Modal
  const [noteModalOpen, setNoteModalOpen] = useState<boolean>(false);
  const [offerNoteText, setOfferNoteText] = useState<string>('');

  const executeSavePrice = async (targetPrice: number): Promise<void> => {
    if (!activeOffer) return;
    if (isSavingRef.current && activeSavePromiseRef.current) {
      return activeSavePromiseRef.current;
    }

    isSavingRef.current = true;
    setIsSubmitting(true);
    setSaveError(null);

    const promise = (async () => {
      try {
        await onUpdateOffer(activeOffer.key, {
          founderPrice: targetPrice,
          founderNotes: activeOffer.founderNotes,
        });
      } catch (err: any) {
        setSaveError(err.message || 'Failed to save price selection.');
        throw err;
      } finally {
        isSavingRef.current = false;
        setIsSubmitting(false);
        activeSavePromiseRef.current = null;
      }
    })();

    activeSavePromiseRef.current = promise;
    return promise;
  };

  const openEditModal = (offer: PricingOffer) => {
    setEditingOffer(offer);
    setEditPrice(
      offer.founderPrice !== undefined && offer.founderPrice !== null
        ? offer.founderPrice.toString()
        : offer.recommendedPrice.toString()
    );
    setEditDiscount(offer.launchDiscountPercentage ? offer.launchDiscountPercentage.toString() : '0');
    setEditBillingPeriod(offer.billingPeriod || 'Monthly');
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
        billingFrequency: editBillingPeriod || 'Monthly',
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

  const handleSaveAndContinue = async () => {
    try {
      setIsSubmitting(true);
      setSaveError(null);

      // 1. Wait for any in-flight blur save first
      if (activeSavePromiseRef.current) {
        await activeSavePromiseRef.current;
      }

      // 2. Check if current price input needs persisting
      const parsed = parseFloat(chosenPriceInput);
      if (!isNaN(parsed) && activeOffer && parsed !== initialPrice) {
        await executeSavePrice(parsed);
      }

      if (updateAvailable) {
        await onRefresh();
      }

      router.push(`/dashboard/creator/phase-4/gtm?ideaId=${ideaId}`);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save and continue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveFeedback = async () => {
    if (!activeOffer || !feedbackNote.trim()) return;
    try {
      setIsSubmitting(true);
      setFeedbackError(null);

      const newRecord: PricingEvidenceRecord = {
        id: crypto.randomUUID ? crypto.randomUUID() : `ev-${Date.now()}`,
        type: 'Feedback',
        participantOrCustomer: feedbackParticipant.trim() || 'Prospect / Interviewee',
        channel: 'Customer Discovery Interview',
        notes: feedbackNote.trim(),
        isPaid: false,
        isFounderReported: true,
        currency: activeOffer.presentation?.currency || 'EUR',
        recordedAt: new Date().toISOString(),
      };

      await onUpdateOffer(activeOffer.key, {
        newEvidenceRecord: newRecord,
      });

      setFeedbackNote('');
      setFeedbackParticipant('');
      setFeedbackModalOpen(false);
    } catch (err: any) {
      setFeedbackError(err.message || 'Failed to persist feedback record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSavePreorder = async () => {
    if (!activeOffer || !saleCustomer.trim() || !salePrice.trim()) return;
    try {
      setIsSubmitting(true);
      setSaleError(null);

      const parsedAmount = parseFloat(salePrice);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        setSaleError('Please enter a valid positive payment amount.');
        setIsSubmitting(false);
        return;
      }

      const newRecord: PricingEvidenceRecord = {
        id: crypto.randomUUID ? crypto.randomUUID() : `ev-${Date.now()}`,
        type: 'PreOrder',
        amount: parsedAmount,
        participantOrCustomer: saleCustomer.trim(),
        channel: 'Direct Preorder / Pilot Sale',
        notes: saleNotes.trim() || 'Paid launch commitment',
        isPaid: true,
        isFounderReported: true,
        currency: activeOffer.presentation?.currency || 'EUR',
        recordedAt: new Date().toISOString(),
      };

      await onUpdateOffer(activeOffer.key, {
        newEvidenceRecord: newRecord,
      });

      setSaleCustomer('');
      setSalePrice('');
      setSaleNotes('');
      setSaleModalOpen(false);
    } catch (err: any) {
      setSaleError(err.message || 'Failed to persist sale / preorder record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1. Gate Blocking Screen
  if (gateError) {
    return (
      <div className="w-full max-w-[1120px] mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6 animate-fadeIn">
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
      <div className="w-full max-w-[1120px] mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-6 animate-fadeIn">
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
            <p className="text-sm text-muted-foreground leading-relaxed font-sans">
              Synthesizes your Phase 3 Business Model, French cost structure, Financial Forecast benchmarks, and customer segments into mathematically floor-tested launch offers.
            </p>
          </div>

          <div className="max-w-md mx-auto bg-muted/30 border border-border rounded-xl p-5 text-left text-xs space-y-2.5 text-muted-foreground">
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
  const variableCost = activeOffer?.unitEconomics?.variableCostPerUnit ?? 0;
  const priceFloor = activeOffer?.unitEconomics?.minimumPriceFloor;
  const isCostConfigured = activeOffer?.unitEconomics?.isCostBasisConfigured ?? (variableCost > 0);
  const costBasisState =
    activeOffer?.unitEconomics?.costBasisState ||
    (variableCost < 0
      ? 'InvalidNegative'
      : !isCostConfigured
      ? 'UnknownOrIncomplete'
      : variableCost === 0
      ? 'ExplicitZero'
      : 'ValidPositive');

  // Active Offer Format Helpers
  const modelDisplay = activeOffer?.revenueModel
    ? activeOffer.revenueModel === 'Subscription'
      ? 'Monthly subscription'
      : `${activeOffer.revenueModel} Model`
    : 'Monthly subscription';

  const recordedEvidence = activeOffer?.recordedEvidence || [];
  const isTested =
    activeOffer?.marketPriceValidationLevel === 'EmpiricallyValidated' ||
    activeOffer?.marketPriceValidationLevel === 'Supported' ||
    (activeOffer?.validatedMarketPrice !== null && activeOffer?.validatedMarketPrice !== undefined && activeOffer.validatedMarketPrice > 0);

  // Dynamic Simulator Quantities & Labels
  const revModel = activeOffer?.revenueModel || 'Subscription';
  const billingPer = activeOffer?.billingPeriod || 'Monthly';
  const isAnnual = billingPer === 'Annual' || billingPer === 'Yearly';
  const isRetainer = revModel === 'Retainer' || billingPer === 'Retainer';
  const isProject = revModel === 'TieredService' || billingPer === 'Milestone' || (!isRetainer && revModel === 'OneTime' && billingPer === 'OneOff');
  const isOneTimeUnit = revModel === 'OneTime' && !isProject;
  const isUsage = revModel === 'UsageBased';
  const isCommission = revModel === 'MarketplaceCommission';

  const simulatorLabel = isRetainer
    ? 'ACTIVE RETAINER CLIENTS'
    : isProject
    ? 'ACTIVE CLIENT PROJECTS'
    : isOneTimeUnit
    ? 'UNITS SOLD'
    : isUsage
    ? 'BILLABLE USAGE UNITS'
    : isCommission
    ? 'TRANSACTIONS FACILITATED'
    : isAnnual
    ? 'ANNUAL SUBSCRIBERS'
    : 'PAYING BUSINESSES';

  const simulatorPeriod = isRetainer
    ? 'Estimated recurring monthly retainer revenue'
    : isProject
    ? 'Estimated one-time project delivery revenue'
    : isOneTimeUnit
    ? 'Estimated unit sales revenue'
    : isUsage
    ? 'Estimated usage-based revenue'
    : isCommission
    ? 'Estimated platform commission revenue (net of gross GMV)'
    : isAnnual
    ? `Estimated annual revenue (${currencySymbol}${Math.round((chosenPrice * simulatorQuantity) / 12).toLocaleString()}/mo equivalent)`
    : 'Estimated monthly revenue';

  const simulatorFormula = isRetainer
    ? `${currencySymbol}${chosenPrice}/mo retainer × ${simulatorQuantity} clients`
    : isProject
    ? `${currencySymbol}${chosenPrice}/project × ${simulatorQuantity} projects`
    : isOneTimeUnit
    ? `${currencySymbol}${chosenPrice}/unit × ${simulatorQuantity} units`
    : isUsage
    ? `${currencySymbol}${chosenPrice}/unit × ${simulatorQuantity} units`
    : isCommission
    ? `${currencySymbol}${chosenPrice} commission/tx × ${simulatorQuantity} transactions`
    : isAnnual
    ? `${currencySymbol}${chosenPrice}/yr × ${simulatorQuantity} subscribers`
    : `${currencySymbol}${chosenPrice} × ${simulatorQuantity} businesses`;

  const isPriceConfigured = chosenPrice > 0;
  const simulatorTotalValue = isPriceConfigured
    ? `${currencySymbol}${(chosenPrice * simulatorQuantity).toLocaleString()}`
    : 'Incomplete estimate';

  return (
    <div className="w-full max-w-[1120px] mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6 animate-fadeIn">
      {/* 0. Top Page-Level Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-mono tracking-wider text-muted-foreground font-semibold">
              PHASE 4 · STEP 4.6
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
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed font-sans">
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

      {saveError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3 text-xs text-red-700 dark:text-red-300">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
          <div className="flex-1">
            <span className="font-semibold block">Save Conflict or Error:</span>
            <span>{saveError} Your entered price was preserved.</span>
          </div>
          <button onClick={() => setSaveError(null)} className="text-red-500 hover:underline text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Upstream Stale Notice Banner */}
      {updateAvailable && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                Upstream Milestone Updates Detected
              </h4>
              <p className="text-xs text-amber-800 dark:text-amber-300/90 mt-0.5 font-sans">
                Upstream sources have evolved since pricing was generated:{' '}
                <span className="font-medium">{changedSources.join(', ')}</span>.
                Refreshing will recalculate economics while preserving your recorded evidence and founder overrides.
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

      {/* Multi-Tier Offer Switcher */}
      {offers.length > 1 && (
        <div className="bg-card border border-border rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-sm">
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
                      : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground border border-border'
                  }`}
                >
                  <span>{offer.name}</span>
                  {offer.isRecommendedDefault && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.2 rounded-full font-mono">
                      Default
                    </span>
                  )}
                  {offer.unitEconomics?.minimumPriceFloor &&
                    offer.effectivePrice < offer.unitEconomics.minimumPriceFloor && (
                      <span className="text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-300 px-1.5 py-0.2 rounded-full font-mono">
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
      {/* SECTION 1: COMPACT PRICING SUMMARY (Figma Frame 57221:12169)              */}
      {/* ========================================================================= */}
      <div className="bg-card border border-border rounded-2xl p-6 sm:p-7 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block font-sans">
              YOUR CHOSEN PRICE
            </span>
            <p className="text-3xl sm:text-4xl font-semibold text-foreground font-mono tabular-nums tracking-tight">
              {`${currencySymbol}${chosenPrice} per business / ${activeOffer?.billingPeriod ? activeOffer.billingPeriod.toLowerCase() : 'month'}`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-medium border border-border bg-muted/40 text-foreground font-sans">
              {modelDisplay}
            </span>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 ${
                isTested
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isTested ? 'bg-emerald-500' : 'bg-amber-600'}`} />
              <span>{isTested ? (activeOffer?.marketPriceValidationLevel === 'EmpiricallyValidated' ? 'Empirically Validated' : 'Supported') : 'Not tested'}</span>
            </span>
            <span className="px-2.5 py-1 rounded bg-secondary text-xs font-normal text-muted-foreground font-sans border border-border/50">
              {activeOffer?.status === 'Valid' ? 'Draft' : activeOffer?.status || 'Draft'}
            </span>
          </div>
        </div>

        <div className="pt-3 border-t border-border text-xs text-muted-foreground font-sans">
          Choose a starting price, then check how customers respond.
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: HOW YOU’LL CHARGE (Figma Frame 57221:12185)                     */}
      {/* ========================================================================= */}
      <div className="bg-card border border-border rounded-2xl p-6 sm:p-7 space-y-6 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-xl font-bold font-heading text-foreground">
            How you’ll charge
          </h2>
          <p className="text-sm text-muted-foreground font-sans">
            Choose what customers pay for and how often.
          </p>
        </div>

        {/* Selected Model Container */}
        <div className="border border-primary bg-primary/5 dark:bg-primary/10 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold text-foreground font-sans">
                  {modelDisplay}
                </span>
                <span className="text-xs font-semibold bg-primary/15 text-primary px-2 py-0.5 rounded-full font-sans">
                  Suggested
                </span>
              </div>
              <p className="text-sm text-foreground font-sans">
                Customers pay each {activeOffer?.billingPeriod ? activeOffer.billingPeriod.toLowerCase() : 'month'} to use your product.
              </p>
              <p className="text-xs text-muted-foreground font-sans">
                {activeOffer?.featuresIncluded && activeOffer.featuresIncluded.length > 0
                  ? `${projectName} is designed for ${activeOffer.featuresIncluded.slice(0, 3).join(', ')}.`
                  : `${projectName} is designed for ongoing enquiries, quotations, and follow-ups.`}
              </p>
            </div>

            <button
              onClick={() => openEditModal(activeOffer!)}
              className="px-3.5 py-1.5 rounded-lg bg-card hover:bg-muted text-foreground border border-border text-xs font-medium shrink-0 self-start sm:self-center transition-colors shadow-sm"
            >
              Change model
            </button>
          </div>

          <div className="pt-4 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-sans">
            <div className="space-y-3">
              <div>
                <span className="text-xs font-medium text-muted-foreground block">
                  Customers pay for
                </span>
                <span className="text-sm font-semibold text-foreground block mt-0.5">
                  {activeOffer?.targetSegment || activeOffer?.name || 'One business workspace'}
                </span>
              </div>
              <div>
                <span className="text-xs font-medium text-muted-foreground block">
                  What’s included
                </span>
                <span className="text-sm text-foreground leading-relaxed block mt-0.5">
                  {activeOffer?.featuresIncluded && activeOffer.featuresIncluded.length > 0
                    ? activeOffer.featuresIncluded.join(', ')
                    : 'Enquiry management, quotations, and follow-ups.'}
                </span>
              </div>
            </div>

            <div className="space-y-3 flex flex-col justify-between">
              <div className="space-y-2 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                  <span>Usage limits — To confirm</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                  <span>Support included — To confirm</span>
                </div>
              </div>
              <div className="pt-2">
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
      {/* SECTION 3: PRICE COMPARISON & CHOICE (Figma Frame 57221:12224)             */}
      {/* ========================================================================= */}
      <div className="bg-card border border-border rounded-2xl p-6 sm:p-7 space-y-6 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-xl font-bold font-heading text-foreground">
            Price comparison & choice
          </h2>
          <p className="text-sm text-muted-foreground font-sans">
            Compare the baseline suggestion with your target price.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Suggested Price */}
          <div className="bg-muted/30 border border-border rounded-xl p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-sans block">
                SUGGESTED PRICE
              </span>
              <p className="text-3xl font-semibold text-foreground font-mono tabular-nums">
                {`${currencySymbol}${recommendedPrice} per business / ${activeOffer?.billingPeriod ? activeOffer.billingPeriod.toLowerCase() : 'month'}`}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                A starting suggestion based on your current project assumptions.
              </p>

              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2.5 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <span>Delivery costs and market prices still need checking.</span>
              </div>

              {/* Precise semantic separation of cost risks & contribution-margin boundaries */}
              {costBasisState === 'InvalidNegative' ? (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2.5 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Invalid negative cost input</span>
                    <span>Variable cost is negative ({currencySymbol}{variableCost}). Please correct your cost model.</span>
                  </div>
                </div>
              ) : costBasisState === 'UnknownOrIncomplete' ? (
                <div className="bg-muted/40 border border-border rounded-lg p-2 text-xs text-muted-foreground flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
                  <span>Variable unit cost basis unconfigured.</span>
                </div>
              ) : costBasisState === 'ExplicitZero' ? (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-2.5 text-xs text-blue-800 dark:text-blue-200 flex items-start gap-2">
                  <FileText className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Zero variable cost confirmed</span>
                    <span>Unit delivery cost is €0 (100% gross margin contribution per sale).</span>
                  </div>
                </div>
              ) : chosenPrice < variableCost ? (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2.5 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Price below floor! Loss-making under current cost structure</span>
                    <span>Selling price ({currencySymbol}{chosenPrice}) is below variable unit cost ({currencySymbol}{variableCost}), producing negative unit contribution ({currencySymbol}{chosenPrice - variableCost}/unit).</span>
                  </div>
                </div>
              ) : chosenPrice === variableCost ? (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2.5 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Zero contribution margin (Price = Variable Cost)</span>
                    <span>Selling price ({currencySymbol}{chosenPrice}) equals variable delivery cost ({currencySymbol}{variableCost}), generating €0 contribution margin toward overhead or CAC.</span>
                  </div>
                </div>
              ) : priceFloor && chosenPrice < priceFloor ? (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2.5 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Price below target margin floor ({currencySymbol}{priceFloor})</span>
                    <span>Unit contribution is positive (+{currencySymbol}{chosenPrice - variableCost}/unit), but below your target margin floor.</span>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  setChosenPriceInput(recommendedPrice.toString());
                  executeSavePrice(recommendedPrice);
                }}
                className="px-3.5 py-2 rounded-lg bg-card hover:bg-muted text-primary border border-primary text-xs font-medium transition-colors shadow-sm cursor-pointer"
              >
                Use suggested price
              </button>
            </div>
          </div>

          {/* Right: Your Chosen Price */}
          <div className="bg-card border border-primary rounded-xl p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary font-sans block">
                YOUR CHOSEN PRICE
              </span>

              <div className="flex items-center">
                <span className="bg-secondary border border-primary border-r-0 text-secondary-foreground text-xs px-3 py-2 rounded-l-lg font-sans">
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
                      executeSavePrice(parsed);
                    }
                  }}
                  className="bg-card border border-primary px-3 py-1 text-2xl font-semibold font-mono tabular-nums text-foreground w-28 rounded-r-lg focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <span className="text-sm text-muted-foreground ml-3 font-sans">
                  per business / {activeOffer?.billingPeriod ? activeOffer.billingPeriod.toLowerCase() : 'month'}
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
                    className="text-xs text-muted-foreground hover:text-foreground font-normal inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>Add a note about your choice</span>
                  </button>
                )}
              </div>

              <div className="text-[11px] text-muted-foreground pt-1 font-sans">
                Applies to all new onboarding accounts.
              </div>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-muted-foreground">
          <span>Your choice will be saved when you continue.</span>
          <span className="rounded-full border border-border bg-secondary text-muted-foreground px-2.5 py-1 text-xs font-sans">
            Tax basis — To confirm
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 4: WHY THIS SUGGESTION? (Figma Frame 57221:12269)                  */}
      {/* ========================================================================= */}
      <div className="bg-card border border-border rounded-2xl p-6 sm:p-7 space-y-4 shadow-sm">
        <h2 className="text-lg sm:text-xl font-bold font-heading text-foreground">
          Why this suggestion?
        </h2>

        <div className="border border-border rounded-xl divide-y divide-border text-xs font-sans">
          {/* Row 1: Offer */}
          <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4">
              <span className="font-semibold text-muted-foreground w-32 shrink-0 text-xs uppercase font-sans">
                YOUR OFFER
              </span>
              <span className="text-foreground text-xs font-sans">
                Ongoing use of {activeOffer?.name || `${projectName} business workspace`}.
              </span>
            </div>
            <span className="text-[11px] border border-border px-2 py-0.5 rounded text-muted-foreground bg-muted/40 self-start sm:self-center font-sans">
              Project concept and business model
            </span>
          </div>

          {/* Row 2: Customers */}
          <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4">
              <span className="font-semibold text-muted-foreground w-32 shrink-0 text-xs uppercase font-sans">
                YOUR CUSTOMERS
              </span>
              <span className="text-foreground text-xs font-sans">
                {activeOffer?.targetSegment || 'Independent service businesses in France.'}
              </span>
            </div>
            <span className="text-[11px] border border-border px-2 py-0.5 rounded text-muted-foreground bg-muted/40 self-start sm:self-center font-sans">
              Target customer profile
            </span>
          </div>

          {/* Row 3: To Verify */}
          <div className="p-3.5 flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4">
            <span className="font-semibold text-muted-foreground w-32 shrink-0 text-xs uppercase font-sans">
              TO VERIFY
            </span>
            <span className="text-foreground text-xs font-sans">
              Delivery costs, comparable offers, and what customers will pay.
            </span>
          </div>
        </div>

        {/* Understated Evidence Box */}
        <div className="bg-muted/30 border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-sans">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span>Minimum viable price:</span>
              <span className="rounded-full bg-muted text-muted-foreground text-[11px] px-2 py-0.5 flex items-center gap-1 border border-border font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60" />
                {priceFloor
                  ? `${currencySymbol}${priceFloor} / unit`
                  : 'Not yet confirmed'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>Market reference:</span>
              <span className="rounded-full bg-muted text-muted-foreground text-[11px] px-2 py-0.5 flex items-center gap-1 border border-border font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60" />
                {activeOffer?.marketReferencePrice
                  ? `${currencySymbol}${activeOffer.marketReferencePrice} recorded`
                  : 'Not yet added'}
              </span>
            </div>
          </div>

          <button
            onClick={() => setShowAssumptions(!showAssumptions)}
            className="text-xs text-muted-foreground hover:text-foreground font-medium inline-flex items-center gap-1 self-start sm:self-center cursor-pointer"
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
              <div className="space-y-1.5 bg-card p-3 rounded-lg border border-border">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">MBC Recommended Price:</span>
                  <span className="text-foreground font-bold">
                    {currencySymbol}{activeOffer?.recommendedPrice} per unit
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Founder / Chosen Price:</span>
                  <span className="text-primary font-bold">
                    {currencySymbol}{activeOffer?.founderPrice ?? activeOffer?.recommendedPrice} per unit
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Market Reference Price:</span>
                  <span className="text-foreground">
                    {activeOffer?.marketReferencePrice ? `${currencySymbol}${activeOffer.marketReferencePrice}` : 'Not specified'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Empirically Validated Price:</span>
                  <span className="text-foreground">
                    {activeOffer?.validatedMarketPrice ? `${currencySymbol}${activeOffer.validatedMarketPrice}` : 'Not validated yet'}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 bg-card p-3 rounded-lg border border-border">
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
      {/* SECTION 5: WHAT COULD YOU EARN? (Figma Frame 57221:12301)                  */}
      {/* ========================================================================= */}
      <div className="bg-card border border-border rounded-2xl p-6 sm:p-7 space-y-5 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-xl font-bold font-heading text-foreground">
            What could you earn?
          </h2>
          <p className="text-sm text-muted-foreground font-sans">
            Try a customer number to explore possible income.
          </p>
        </div>

        {/* Customer Simulator Input */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-sans">
          <span className="font-semibold uppercase tracking-wider text-muted-foreground text-xs">
            {simulatorLabel}
          </span>
          <input
            type="number"
            min="1"
            max="10000"
            value={simulatorQuantity}
            onChange={(e) => setSimulatorQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            className="bg-muted/40 border border-border px-2.5 py-1.5 rounded-lg text-sm font-semibold font-mono tabular-nums text-foreground w-20 focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <span className="text-muted-foreground text-xs">
            Changing this number does not predict how many customers you will get.
          </span>
        </div>

        {/* Calculation Result Strip */}
        <div className="bg-muted/30 border border-border rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2 text-base text-foreground font-sans">
            <span>{simulatorFormula}</span>
          </div>

          <div className="text-left sm:text-right space-y-0.5">
            {isPriceConfigured ? (
              <div className="text-3xl sm:text-4xl font-semibold font-mono tabular-nums text-foreground tracking-tight">
                {simulatorTotalValue}
              </div>
            ) : (
              <div className="text-base font-medium font-sans text-amber-600 dark:text-amber-400">
                Incomplete estimate (enter price above)
              </div>
            )}
            <div className="text-xs text-muted-foreground font-medium font-sans">
              {simulatorPeriod}
            </div>
          </div>
        </div>

        {/* Footnote Caveats */}
        <div className="space-y-1 text-xs text-muted-foreground font-sans">
          <div>• This is a planning estimate. Costs and taxes are not deducted.</div>
          <div>• Tax treatment still needs confirmation.</div>
        </div>

        {/* Incomplete Cost Warning Box */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2.5 font-sans">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block text-amber-900 dark:text-amber-100 text-xs">
              Profit estimate unavailable
            </span>
            <span className="text-amber-800 dark:text-amber-200 text-xs">Confirm your costs to understand what you could keep.</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 6: CHECK YOUR PRICE (Figma Frame 57221:12338)                       */}
      {/* ========================================================================= */}
      <div className="bg-card border border-border rounded-2xl p-6 sm:p-7 space-y-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-xl font-bold font-heading text-foreground">
              Check your price
            </h2>
            <p className="text-sm text-muted-foreground font-sans">
              Keep track of what you know about customers paying this amount.
            </p>
          </div>
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 self-start sm:self-center ${
              isTested
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isTested ? 'bg-emerald-500' : 'bg-amber-600'}`} />
            <span>{isTested ? (activeOffer?.marketPriceValidationLevel === 'EmpiricallyValidated' ? 'Empirically Validated' : 'Supported') : 'Not tested'}</span>
          </span>
        </div>

        {/* Persisted Recorded Evidence Ledger */}
        {recordedEvidence.length > 0 ? (
          <div className="space-y-2">
            {recordedEvidence.map((ev) => (
              <div key={ev.id} className="bg-muted/40 border border-border rounded-xl p-3.5 text-xs text-foreground flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{ev.participantOrCustomer}</span>
                    <span className="text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded font-mono">
                      {ev.type}
                    </span>
                    {ev.amount !== undefined && ev.amount !== null && (
                      <span className="font-mono font-semibold text-primary">
                        {currencySymbol}{ev.amount}
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground text-xs">{ev.notes}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                  <span className="text-[10px] text-muted-foreground/80 font-mono">
                    {ev.isFounderReported ? 'Founder Reported' : 'Verified'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-muted/30 border border-border rounded-xl p-4 flex items-center gap-3 text-xs text-muted-foreground font-sans">
            <FileText className="w-4 h-4 text-muted-foreground/60 shrink-0" />
            <span>No sales or paid preorders recorded yet.</span>
          </div>
        )}

        {/* Educational Comparison Matrix */}
        <div className="border border-border rounded-xl divide-y divide-border text-xs font-sans">
          <div className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
            <span className="font-semibold text-foreground w-44 shrink-0 text-xs">Market reference</span>
            <span className="text-muted-foreground flex-1 text-xs">
              A similar business lists a price. This helps you compare.
            </span>
          </div>
          <div className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
            <span className="font-semibold text-foreground w-44 shrink-0 text-xs">Customer feedback</span>
            <span className="text-muted-foreground flex-1 text-xs">
              Someone shares an opinion about your offer or price.
            </span>
          </div>
          <div className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
            <span className="font-semibold text-foreground w-44 shrink-0 text-xs">Customer interest</span>
            <span className="text-muted-foreground flex-1 text-xs">
              Someone joins a waitlist or asks for more information.
            </span>
          </div>
          <div className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
            <span className="font-semibold text-foreground w-44 shrink-0 text-xs">Sale or paid preorder</span>
            <span className="text-foreground font-medium flex-1 text-xs">
              Someone pays for a specific offer at a specific price.
            </span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground font-sans">
          Positive feedback can help you learn. Payment provides evidence that someone bought at that price.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={() => {
              setFeedbackError(null);
              setFeedbackModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-lg bg-card hover:bg-muted text-foreground border border-border text-xs font-medium transition-colors shadow-sm cursor-pointer"
          >
            Add feedback
          </button>
          <button
            onClick={() => {
              setSaleError(null);
              setSaleModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-lg bg-card hover:bg-muted text-foreground border border-border text-xs font-medium transition-colors shadow-sm cursor-pointer"
          >
            Add a sale or paid preorder
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 7: A SMALL NEXT ACTION (Figma Frame 57221:12384)                    */}
      {/* ========================================================================= */}
      <div className="bg-card border border-border rounded-2xl p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-primary font-sans block">
            NEXT ACTION
          </span>
          <h3 className="text-base font-bold font-heading text-foreground">
            Test your starting offer
          </h3>
          <ul className="space-y-1 text-xs text-muted-foreground dark:text-foreground font-bold font-sans">
            <li className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              <span>
                Offer: {activeOffer?.name ? `One ${projectName} ${activeOffer.name}` : `One ${projectName} business workspace`}
              </span>
            </li>
            <li className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              <span>
                Price to test: {currencySymbol}{chosenPrice} per {activeOffer?.billingPeriod ? activeOffer.billingPeriod.toLowerCase() : 'month'}
              </span>
            </li>
            <li className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              <span>
                Customers: {activeOffer?.targetSegment || 'Independent service businesses in France'}
              </span>
            </li>
          </ul>
          <p className="text-xs text-muted-foreground pt-1 font-sans font-normal">
            Review this task before adding it to your roadmap.
          </p>
        </div>

        <Link
          href={`/dashboard/creator/phase-4/roadmap?ideaId=${ideaId}`}
          className="px-4 py-2.5 rounded-lg bg-card hover:bg-muted text-foreground border border-border text-xs font-semibold shrink-0 self-start md:self-center transition-colors shadow-sm"
        >
          Review roadmap task
        </Link>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 8: FOOTER ACTIONS (Figma Frame 57221:12408)                        */}
      {/* ========================================================================= */}
      <div className="pt-6 border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link
          href={`/dashboard/creator/phase-4/support?ideaId=${ideaId}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors font-sans"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Aids & Support</span>
        </Link>

        <div className="flex flex-col sm:items-end gap-1">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-muted-foreground font-sans">
              You can continue while your price still needs testing.
            </span>
            <button
              onClick={handleSaveAndContinue}
              disabled={isSubmitting || isLoading}
              className="px-6 py-2.5 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition-colors shadow-sm font-sans flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving & Continuing...</span>
                </>
              ) : (
                <span>Save & Continue →</span>
              )}
            </button>
          </div>
          <span className="text-xs text-muted-foreground/80 font-sans">
            Next: GTM & Launch Strategy
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODALS                                                                    */}
      {/* ========================================================================= */}

      {/* Founder Offer Edit Modal */}
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
              <div className="grid grid-cols-2 gap-3">
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
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="founder-billing-period" className="font-semibold text-foreground block">
                    Billing Frequency
                  </label>
                  <select
                    id="founder-billing-period"
                    value={editBillingPeriod}
                    onChange={(e) => setEditBillingPeriod(e.target.value as BillingPeriod)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground font-sans focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="Monthly">Monthly Recurring</option>
                    <option value="Annual">Annual Upfront</option>
                    <option value="Retainer">Monthly Retainer</option>
                    <option value="Milestone">Milestone / Stage</option>
                    <option value="OneOff">One-off / Fixed Price</option>
                    <option value="PerUse">Per-use / Consumption</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground block">Launch Discount (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editDiscount}
                  onChange={(e) => setEditDiscount(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-primary"
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
                  className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 text-xs font-medium"
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
                className="px-3 py-1.5 rounded-lg bg-secondary text-xs text-secondary-foreground"
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

            {feedbackError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2.5 text-xs text-red-700 dark:text-red-300">
                {feedbackError}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-muted-foreground font-medium">Participant / Prospect</label>
                <input
                  type="text"
                  value={feedbackParticipant}
                  onChange={(e) => setFeedbackParticipant(e.target.value)}
                  placeholder="e.g. Lead Founder / Agency Director"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-muted-foreground font-medium">Feedback Notes</label>
                <textarea
                  rows={3}
                  value={feedbackNote}
                  onChange={(e) => setFeedbackNote(e.target.value)}
                  placeholder={`e.g. Interviewed prospect: found ${currencySymbol}${chosenPrice}/mo aligned with value, asked for multi-seat plan.`}
                  className="w-full bg-background border border-border rounded-lg p-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setFeedbackModalOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-secondary text-xs text-secondary-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting || !feedbackNote.trim()}
                onClick={handleSaveFeedback}
                className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Feedback'}
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

            {saleError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2.5 text-xs text-red-700 dark:text-red-300">
                {saleError}
              </div>
            )}

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
                  step="any"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  placeholder={chosenPrice.toString()}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-muted-foreground font-medium">Commitment Details / Notes</label>
                <input
                  type="text"
                  value={saleNotes}
                  onChange={(e) => setSaleNotes(e.target.value)}
                  placeholder="e.g. First cohort launch subscription commitment"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setSaleModalOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-secondary text-xs text-secondary-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting || !saleCustomer.trim() || !salePrice.trim()}
                onClick={handleSavePreorder}
                className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Preorder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
