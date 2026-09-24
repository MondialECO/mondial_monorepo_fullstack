"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Edit2,
  Check,
  RotateCcw,
  Loader2,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

export interface StartingBudgetModalProps {
  open: boolean;
  onClose: () => void;
  suggestedBudget?: number;
  rationale?: string;
  runwayMonths?: number;
  isLoadingSuggestion?: boolean;
  isGenerating?: boolean;
  onGenerate: (budget: number, provenance: "ai_suggested" | "founder_confirmed") => void;
}

export const StartingBudgetModal: React.FC<StartingBudgetModalProps> = ({
  open,
  onClose,
  suggestedBudget = 0,
  rationale,
  runwayMonths = 6,
  isLoadingSuggestion = false,
  isGenerating = false,
  onGenerate,
}) => {
  const [budget, setBudget] = useState<number>(suggestedBudget);
  const [isEditing, setIsEditing] = useState<boolean>(!suggestedBudget || suggestedBudget <= 0);
  const [editValue, setEditValue] = useState<string>(suggestedBudget > 0 ? suggestedBudget.toString() : "");
  const [isUserModified, setIsUserModified] = useState<boolean>(false);

  // Synchronize when AI suggestion finishes loading
  useEffect(() => {
    if (suggestedBudget > 0 && !isUserModified) {
      setBudget(suggestedBudget);
      setEditValue(suggestedBudget.toString());
      setIsEditing(false);
    }
  }, [suggestedBudget, isUserModified]);

  const handleApplyEdit = () => {
    const parsed = parseFloat(editValue.replace(/[^0-9.]/g, ""));
    if (!isNaN(parsed) && parsed > 0) {
      setBudget(parsed);
      setIsUserModified(parsed !== suggestedBudget);
      setIsEditing(false);
    }
  };

  const handleResetToAi = () => {
    setBudget(suggestedBudget);
    setEditValue(suggestedBudget.toString());
    setIsUserModified(false);
    setIsEditing(false);
  };

  const handleConfirm = () => {
    const finalBudget = isEditing
      ? parseFloat(editValue.replace(/[^0-9.]/g, "")) || budget
      : budget;
    const provenance = isUserModified ? "founder_confirmed" : "ai_suggested";
    onGenerate(finalBudget, provenance);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !isGenerating) onClose(); }}>
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden bg-card border-border shadow-2xl rounded-2xl">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-emerald-600/10 via-primary/10 to-transparent p-6 pb-4 border-b border-border/60">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-mono uppercase tracking-widest text-primary font-semibold">
              STEP 3.3 · INITIAL LAUNCH CAPITAL
            </span>
          </div>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-500" />
              Starting Budget Setup
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1">
              Review and confirm your initial launch capital before generating the 36-month financial forecast.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {isLoadingSuggestion ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground font-medium">
                Analyzing business model & unit economics for budget suggestion…
              </p>
            </div>
          ) : (
            <>
              {/* Highlight Card */}
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/20 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs font-semibold px-2 py-0.5"
                    >
                      <Sparkles className="w-3 h-3 mr-1" />
                      {isUserModified ? "Custom Allocation" : "AI Recommended"}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-mono">
                      {runwayMonths}-Month Launch Runway
                    </span>
                  </div>
                  <Badge
                    variant="secondary"
                    className="text-[11px] font-medium bg-muted text-muted-foreground"
                  >
                    {isUserModified ? "Your value" : "AI suggested"}
                  </Badge>
                </div>

                {/* Amount display / editor */}
                <div className="py-1">
                  {!isEditing ? (
                    <div className="flex items-baseline justify-between">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground font-mono">
                          €{budget.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                        </span>
                        <span className="text-xs font-medium text-muted-foreground ml-1">
                          initial cash balance
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isUserModified && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleResetToAi}
                            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                            title="Reset to AI suggested budget"
                          >
                            <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditValue(budget.toString());
                            setIsEditing(true);
                          }}
                          className="h-8 px-2.5 text-xs font-semibold rounded-lg"
                        >
                          <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Edit Amount
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Enter Custom Starting Budget (€)
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                            €
                          </span>
                          <Input
                            type="number"
                            step="1000"
                            min="1000"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleApplyEdit();
                            }}
                            className="pl-8 font-mono font-bold text-lg h-10 rounded-lg"
                            placeholder="50000"
                            autoFocus
                          />
                        </div>
                        <Button
                          size="sm"
                          onClick={handleApplyEdit}
                          className="h-10 px-3.5 font-semibold rounded-lg gap-1"
                        >
                          <Check className="w-4 h-4" /> Set
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsEditing(false)}
                          className="h-10 px-2.5 text-xs text-muted-foreground"
                        >
                          Cancel
                        </Button>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        <span className="text-[11px] text-muted-foreground mr-1">Quick presets:</span>
                        {[25000, 50000, 75000, 100000].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => {
                              setBudget(preset);
                              setEditValue(preset.toString());
                              setIsUserModified(preset !== suggestedBudget);
                              setIsEditing(false);
                            }}
                            className="px-2 py-0.5 rounded text-[11px] font-mono bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          >
                            €{preset / 1000}k
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* AI Rationale narrative */}
                <div className="pt-2 border-t border-emerald-500/10 text-xs sm:text-sm text-foreground/80 leading-relaxed">
                  {rationale || (
                    <span>
                      Synthesized from your <strong>Step 3.2 Business Model Canvas</strong> and unit economics. Provides a {runwayMonths}-month cash cushion to cover fixed OPEX and initial customer acquisition without premature cash depletion.
                    </span>
                  )}
                </div>
              </div>

              {/* Assurances */}
              <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/40 border border-border/50">
                  <TrendingUp className="w-4 h-4 text-primary shrink-0" />
                  <span>Feeds Year 1 Month 1 Starting Cash directly</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/40 border border-border/50">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Editable anytime via "Regenerate"</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 px-6 bg-muted/30 border-t border-border flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {isUserModified ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                ✓ Customized: €{budget.toLocaleString()}
              </span>
            ) : (
              <span>Standard AI estimate for your venture type</span>
            )}
          </p>
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isGenerating}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirm}
              disabled={isGenerating || isLoadingSuggestion}
              className="gap-2 font-semibold rounded-xl text-xs px-5 shadow-sm"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Forecast…
                </>
              ) : (
                <>
                  Generate Financial Forecast
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
