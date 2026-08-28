"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, DollarSign, AlertCircle, X, ShieldCheck, Check } from "lucide-react";
import { CreateBuyoutOfferRequest } from "@/lib/api-marketplace-projects";

interface BuyoutOfferFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateBuyoutOfferRequest) => Promise<void>;
  projectName: string;
  creatorName?: string;
  askingPrice?: number | null;
  initialTerms?: {
    purchasePrice?: number;
    handoverPeriodWeeks?: number;
    transitionSupportWeeks?: number;
    includedAssets?: string[];
    notes?: string;
  };
  isCounter?: boolean;
}

const DEFAULT_INCLUDED_ASSETS = [
  "Full Intellectual Property & Concept Ownership",
  "Complete Business Plan & Financial Model",
  "Brand Identity, Logo & Design Assets",
  "Commercial Architecture & Pricing Strategy",
  "Technical Documentation & Research Materials",
];

export function BuyoutOfferForm({
  isOpen,
  onClose,
  onSubmit,
  projectName,
  creatorName = "Creator",
  askingPrice,
  initialTerms,
  isCounter = false,
}: BuyoutOfferFormProps) {
  const [purchasePrice, setPurchasePrice] = useState<string>(
    initialTerms?.purchasePrice !== undefined
      ? String(initialTerms.purchasePrice)
      : askingPrice
      ? String(askingPrice)
      : ""
  );
  const [handoverPeriodWeeks, setHandoverPeriodWeeks] = useState<number>(
    initialTerms?.handoverPeriodWeeks ?? 2
  );
  const [transitionSupportWeeks, setTransitionSupportWeeks] = useState<number>(
    initialTerms?.transitionSupportWeeks ?? 4
  );
  const [includedAssets, setIncludedAssets] = useState<string[]>(
    initialTerms?.includedAssets ?? DEFAULT_INCLUDED_ASSETS
  );
  const [notes, setNotes] = useState<string>(initialTerms?.notes ?? "");
  const [expiryDays, setExpiryDays] = useState<number>(14);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleToggleAsset = (asset: string) => {
    setIncludedAssets((prev) =>
      prev.includes(asset) ? prev.filter((a) => a !== asset) : [...prev, asset]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const priceNum = parseFloat(purchasePrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError("Please enter a valid purchase price greater than zero.");
      return;
    }

    if (includedAssets.length === 0) {
      setError("Please select at least one asset to be included in the buyout.");
      return;
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    const payload: CreateBuyoutOfferRequest = {
      purchasePrice: priceNum,
      handoverPeriodWeeks,
      transitionSupportWeeks,
      includedAssets,
      notes: notes.trim() || undefined,
      expiresAt: expiresAt.toISOString(),
    };

    setLoading(true);
    try {
      await onSubmit(payload);
      onClose();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || "Failed to submit Full Buyout offer. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[90vh] flex flex-col bg-card border border-border rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                {isCounter ? "Counter Full Buyout Offer" : "Make Full Buyout Offer"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {isCounter ? `Propose revised buyout terms for ` : `Propose acquisition terms for `}
                <strong className="text-foreground">{projectName}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Purchase Price */}
          <div className="space-y-2 p-4 rounded-2xl border border-border/80 bg-muted/10">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-foreground">
                Proposed Purchase Price (€)
              </Label>
              {askingPrice != null && (
                <span className="text-[11px] text-muted-foreground">
                  Creator Asking Price: <strong className="text-foreground">€{askingPrice.toLocaleString()}</strong>
                </span>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                €
              </span>
              <Input
                type="number"
                min="1"
                step="100"
                placeholder="25000"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                className="pl-8 text-base font-bold"
                required
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Total one-time cash consideration paid upon closing and complete asset handover.
            </p>
          </div>

          {/* Section 2: Handover & Support Timeline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 p-4 rounded-2xl border border-border/80 bg-muted/10">
              <Label className="text-xs font-bold text-foreground">
                Handover Period
              </Label>
              <Input
                type="number"
                min="0"
                max="12"
                value={handoverPeriodWeeks}
                onChange={(e) => setHandoverPeriodWeeks(parseInt(e.target.value) || 0)}
                className="text-sm font-medium"
              />
              <span className="text-[10px] text-muted-foreground">
                Weeks for IP & asset file delivery
              </span>
            </div>

            <div className="space-y-1.5 p-4 rounded-2xl border border-border/80 bg-muted/10">
              <Label className="text-xs font-bold text-foreground">
                Transition Support
              </Label>
              <Input
                type="number"
                min="0"
                max="24"
                value={transitionSupportWeeks}
                onChange={(e) => setTransitionSupportWeeks(parseInt(e.target.value) || 0)}
                className="text-sm font-medium"
              />
              <span className="text-[10px] text-muted-foreground">
                Weeks of advisory Q&A support
              </span>
            </div>
          </div>

          {/* Section 3: Included Asset Bundle */}
          <div className="space-y-2.5 p-4 rounded-2xl border border-border/80 bg-muted/10">
            <Label className="text-xs font-bold text-foreground flex items-center justify-between">
              <span>Included Asset Bundle</span>
              <span className="text-[10px] font-normal text-muted-foreground">
                {includedAssets.length} selected
              </span>
            </Label>
            <div className="space-y-2">
              {DEFAULT_INCLUDED_ASSETS.map((asset) => {
                const checked = includedAssets.includes(asset);
                return (
                  <label
                    key={asset}
                    onClick={() => handleToggleAsset(asset)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                      checked
                        ? "border-emerald-500/30 bg-emerald-500/5 text-foreground font-medium"
                        : "border-border/50 text-muted-foreground hover:bg-muted/30"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                        checked
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-muted-foreground/40"
                      }`}
                    >
                      {checked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span>{asset}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Section 4: Notes & Expiry */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">
                Commercial Note & Terms (Optional)
              </Label>
              <Textarea
                placeholder="Add special notes, payment terms, or transition expectations..."
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="text-xs resize-none"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
              <span>Offer Valid For:</span>
              <div className="flex items-center gap-2">
                {[7, 14, 30].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setExpiryDays(days)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                      expiryDays === days
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    {days} days
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Trust Banner */}
          <div className="p-3 rounded-xl bg-muted/30 border border-border/50 flex items-center gap-2 text-[11px] text-muted-foreground">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>
              Submitting this offer initiates formal negotiation with {creatorName}. You can revise or withdraw before acceptance.
            </span>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-border flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={loading}
              className="text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className="text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5 shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> {isCounter ? "Submitting Counter..." : "Submitting Offer..."}
                </>
              ) : (
                <>
                  <DollarSign className="w-3.5 h-3.5" /> {isCounter ? "Submit Counter-Offer" : "Submit Full Buyout Offer"}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
