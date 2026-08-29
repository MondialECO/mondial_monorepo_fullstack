"use client";

import React from "react";
import { Coins, Plus, Trash2, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const TARGET_INVESTOR_TYPES = ["Angel", "Pre-seed fund", "Seed fund", "Strategic investor"];

export interface UseOfFunds {
  category: string;
  percent: number;
}

export function validateUseOfFunds(use: UseOfFunds[]): {
  isValid: boolean;
  total: number;
} {
  const total = use.reduce((sum, entry) => sum + (entry.percent || 0), 0);
  return {
    isValid: total === 100,
    total,
  };
}

interface FundingPreparationCardProps {
  totalAsk: number;
  onTotalAskChange: (ask: number) => void;
  useOfFunds: UseOfFunds[];
  onUseOfFundsChange: (use: UseOfFunds[]) => void;
  investorTypes: string[];
  onInvestorTypesChange: (types: string[]) => void;
  onSave?: () => void;
  isSaving?: boolean;
  isSaved?: boolean;
  error?: string | null;
  title?: string;
  description?: string;
  buttonLabel?: string;
  showSaveButton?: boolean;
  isOptional?: boolean;
}

export function FundingPreparationCard({
  totalAsk,
  onTotalAskChange,
  useOfFunds,
  onUseOfFundsChange,
  investorTypes,
  onInvestorTypesChange,
  onSave,
  isSaving = false,
  isSaved = false,
  error = null,
  title = "Funding Preparation",
  description = "Set your own funding target and use of funds. These values are not inferred from a generic template.",
  buttonLabel = "Save funding preparation",
  showSaveButton = true,
  isOptional = false,
}: FundingPreparationCardProps) {
  const { total: useSum } = validateUseOfFunds(useOfFunds);

  const toggleInvestor = (value: string) => {
    onInvestorTypesChange(
      investorTypes.includes(value)
        ? investorTypes.filter((item) => item !== value)
        : [...investorTypes, value]
    );
  };

  const addCategory = () => {
    onUseOfFundsChange([...useOfFunds, { category: "", percent: 0 }]);
  };

  const removeCategory = (index: number) => {
    onUseOfFundsChange(useOfFunds.filter((_, i) => i !== index));
  };

  const updateCategory = (index: number, updates: Partial<UseOfFunds>) => {
    onUseOfFundsChange(
      useOfFunds.map((item, i) => (i === index ? { ...item, ...updates } : item))
    );
  };

  return (
    <Card className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-bold flex items-center gap-1.5">
          <Coins className="h-4 w-4 text-primary" /> {title}
        </div>
        {isOptional && (
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-muted text-muted-foreground">
            Optional / Skippable
          </span>
        )}
      </div>

      <p className="text-xs text-muted-foreground">{description}</p>

      {/* Target Ask */}
      <label className="text-sm space-y-1 block">
        <span className="text-muted-foreground">Your funding target (€)</span>
        <input
          aria-label="Your funding target"
          type="number"
          min="10000"
          placeholder="e.g. 250000"
          value={totalAsk || ""}
          onChange={(e) => onTotalAskChange(Number(e.target.value))}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </label>

      {/* Use of Funds Table */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Use of funds allocation</span>
          <span className={useSum === 100 || (isOptional && useSum === 0) ? "text-primary font-semibold" : "text-destructive font-semibold"}>
            {useSum}%
          </span>
        </div>

        {useOfFunds.map((entry, index) => (
          <div key={index} className="grid grid-cols-[1fr_auto_auto] gap-2 items-center">
            <input
              value={entry.category}
              placeholder="Category (e.g. Engineering, Marketing)"
              onChange={(e) => updateCategory(index, { category: e.target.value })}
              className="text-xs rounded-lg border border-border bg-background px-2 py-1.5 outline-none focus:border-primary"
            />
            <input
              type="number"
              value={entry.percent || ""}
              placeholder="0"
              onChange={(e) => updateCategory(index, { percent: Number(e.target.value) })}
              className="w-16 text-xs rounded-lg border border-border bg-background px-2 py-1.5 outline-none focus:border-primary text-right"
            />
            <button
              type="button"
              onClick={() => removeCategory(index)}
              aria-label="Remove use of funds"
              className="p-1 hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={addCategory}
          className="text-xs text-primary inline-flex items-center gap-1 hover:underline font-medium"
        >
          <Plus className="h-3 w-3" /> Add use of funds
        </button>
      </div>

      {/* Target Investor Types */}
      <div className="space-y-1.5">
        <span className="text-xs text-muted-foreground">Target investor types</span>
        <div className="flex flex-wrap gap-2">
          {TARGET_INVESTOR_TYPES.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => toggleInvestor(value)}
              className={`rounded-full border px-3 py-1 text-xs transition-all ${
                investorTypes.includes(value)
                  ? "border-primary bg-primary/10 text-primary font-medium"
                  : "border-border text-muted-foreground hover:border-primary/40"
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {isSaved && (
        <div className="flex items-center gap-2 text-sm text-primary">
          <Check className="h-4 w-4" /> Funding preparation saved.
        </div>
      )}

      {showSaveButton && onSave && (
        <Button onClick={onSave} disabled={isSaving} className="gap-2">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {buttonLabel}
        </Button>
      )}
    </Card>
  );
}
