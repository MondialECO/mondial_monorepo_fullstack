"use client";

import React from "react";
import { Building2, Plus, Trash2, AlertTriangle, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const LEGAL_STRUCTURE_TYPES = ["SAS", "SAS-U", "SARL"];

export interface OwnershipEntry {
  holder: string;
  percent: number;
  isFounder: boolean;
  isEsop: boolean;
}

export function validateOwnershipSplit(ownership: OwnershipEntry[]): {
  isValid: boolean;
  total: number;
  founderTotal: number;
  esopTotal: number;
  hasEsopWarning: boolean;
} {
  const total = ownership.reduce((sum, entry) => sum + (entry.percent || 0), 0);
  const founderTotal = ownership.filter((entry) => entry.isFounder).reduce((sum, entry) => sum + (entry.percent || 0), 0);
  const esopTotal = ownership.filter((entry) => entry.isEsop).reduce((sum, entry) => sum + (entry.percent || 0), 0);
  return {
    isValid: total === 100,
    total,
    founderTotal,
    esopTotal,
    hasEsopWarning: esopTotal < 10,
  };
}

interface CompanyPlanningCardProps {
  type: string;
  onTypeChange: (type: string) => void;
  ownership: OwnershipEntry[];
  onOwnershipChange: (entries: OwnershipEntry[]) => void;
  onSave?: () => void;
  isSaving?: boolean;
  isSaved?: boolean;
  error?: string | null;
  warnings?: string[];
  title?: string;
  description?: string;
  buttonLabel?: string;
  showSaveButton?: boolean;
}

export function CompanyPlanningCard({
  type,
  onTypeChange,
  ownership,
  onOwnershipChange,
  onSave,
  isSaving = false,
  isSaved = false,
  error = null,
  warnings = [],
  title = "Company Planning",
  description = "Ownership — enter your intended split",
  buttonLabel,
  showSaveButton = true,
}: CompanyPlanningCardProps) {
  const { total, founderTotal, hasEsopWarning } = validateOwnershipSplit(ownership);

  const addHolder = () => {
    onOwnershipChange([
      ...ownership,
      { holder: "", percent: 0, isFounder: false, isEsop: false },
    ]);
  };

  const removeHolder = (index: number) => {
    onOwnershipChange(ownership.filter((_, i) => i !== index));
  };

  const updateHolder = (index: number, updates: Partial<OwnershipEntry>) => {
    onOwnershipChange(
      ownership.map((item, i) => (i === index ? { ...item, ...updates } : item))
    );
  };

  return (
    <Card className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="text-sm font-bold flex items-center gap-1.5">
        <Building2 className="h-4 w-4 text-primary" /> {title}
      </div>

      {/* Legal Structure Selector */}
      <div className="space-y-1.5">
        <span className="text-xs text-muted-foreground">Planned Legal Structure</span>
        <div className="flex gap-2">
          {LEGAL_STRUCTURE_TYPES.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onTypeChange(value)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition-all ${
                type === value
                  ? "border-primary text-primary bg-primary/5"
                  : "border-border text-muted-foreground hover:border-primary/40"
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      {/* Ownership Table */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{description}</span>
          <span className={total === 100 ? "text-primary font-semibold" : "text-destructive font-semibold"}>
            {total}% · founder {founderTotal}%
          </span>
        </div>

        {ownership.map((entry, index) => (
          <div
            key={index}
            className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-2 items-center"
          >
            <input
              value={entry.holder}
              placeholder="Holder"
              onChange={(e) => updateHolder(index, { holder: e.target.value })}
              className="text-xs rounded-lg border border-border bg-background px-2 py-1.5 outline-none focus:border-primary"
            />
            <input
              type="number"
              value={entry.percent || ""}
              placeholder="0"
              onChange={(e) => updateHolder(index, { percent: Number(e.target.value) })}
              className="w-16 text-xs rounded-lg border border-border bg-background px-2 py-1.5 outline-none focus:border-primary text-right"
            />
            <label className="text-[10px] flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={entry.isFounder}
                onChange={(e) => updateHolder(index, { isFounder: e.target.checked })}
              />{" "}
              founder
            </label>
            <label className="text-[10px] flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={entry.isEsop}
                onChange={(e) => updateHolder(index, { isEsop: e.target.checked })}
              />{" "}
              esop
            </label>
            <button
              type="button"
              onClick={() => removeHolder(index)}
              aria-label="Remove ownership holder"
              className="p-1 hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={addHolder}
          className="text-xs text-primary inline-flex items-center gap-1 hover:underline font-medium"
        >
          <Plus className="h-3 w-3" /> Add holder
        </button>
      </div>

      {(warnings.includes("esop_recommended") || hasEsopWarning) && (
        <p className="text-xs text-warning flex items-center gap-1">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> An ESOP pool of ≥10% is recommended for hiring.
        </p>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {showSaveButton && onSave && (
        <Button onClick={onSave} disabled={isSaving} className="gap-2">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {buttonLabel ?? (isSaved ? "Update company planning" : "Save company planning")}
        </Button>
      )}
    </Card>
  );
}
