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
  SlidersHorizontal,
  Loader2,
  RotateCcw,
  Sparkles,
  Info,
  DollarSign,
  Users,
  TrendingUp,
  TrendingDown,
  Building,
  Target,
  Layers,
  ArrowRight,
} from "lucide-react";

export interface ForecastDriverValues {
  startingBudget: number;
  launchSubscribers: number;
  monthlyGrowthPct: number;
  monthlyChurnPct: number;
  arpu: number;
  variableCost: number;
  opex: number;
  tam: number;
}

export interface ForecastAssumptionsModalProps {
  open: boolean;
  onClose: () => void;
  initialValues: ForecastDriverValues;
  initialProvenance?: Record<string, string>;
  initialRationales?: Record<string, string>;
  businessModelType?: string;
  isRegenerating: boolean;
  creditCost?: number;
  onConfirm: (
    values: ForecastDriverValues,
    provenance: Record<string, string>
  ) => void;
}

export const ForecastAssumptionsModal: React.FC<ForecastAssumptionsModalProps> = ({
  open,
  onClose,
  initialValues,
  initialProvenance = {},
  initialRationales = {},
  businessModelType,
  isRegenerating,
  creditCost = 15,
  onConfirm,
}) => {
  const [values, setValues] = useState<ForecastDriverValues>(initialValues);
  const [provenance, setProvenance] = useState<Record<string, string>>(initialProvenance);

  // Sync state whenever modal opens or initial values change
  useEffect(() => {
    if (open) {
      setValues(initialValues);
      setProvenance(initialProvenance);
    }
  }, [open, initialValues, initialProvenance]);

  const handleChange = (field: keyof ForecastDriverValues, valStr: string) => {
    const num = parseFloat(valStr.replace(/[^0-9.]/g, ""));
    const updatedNum = isNaN(num) ? 0 : num;
    setValues((prev) => ({ ...prev, [field]: updatedNum }));
    setProvenance((prev) => ({ ...prev, [field]: "founder_confirmed" }));
  };

  const handleResetField = (field: keyof ForecastDriverValues) => {
    setValues((prev) => ({ ...prev, [field]: initialValues[field] }));
    setProvenance((prev) => {
      const next = { ...prev };
      if (initialProvenance[field]) {
        next[field] = initialProvenance[field];
      } else {
        delete next[field];
      }
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(values, provenance);
  };

  const isFieldUserModified = (field: keyof ForecastDriverValues) => {
    return provenance[field] === "founder_confirmed" || provenance[field] === "founder_edited" || values[field] !== initialValues[field];
  };

  const bm = (businessModelType || "").toLowerCase();
  const isEcommerce = bm === "ecommerce";
  const isService = bm === "service";
  const isMarketplace = bm === "marketplace";

  const labels = {
    launchSubs: isEcommerce
      ? "Initial Monthly Orders"
      : isService
      ? "Active Retained Clients"
      : isMarketplace
      ? "Monthly Active Transacting Users"
      : "Subscribers at Launch",
    subsDesc: isEcommerce
      ? "Baseline order volume at Month 1."
      : isService
      ? "Initial client count at launch."
      : isMarketplace
      ? "Monthly transacting buyers/sellers."
      : "Initial baseline active subscriber count at Month 1.",
    arpu: isEcommerce
      ? "Average Order Value (AOV) (€)"
      : isService
      ? "Average Contract Value (ACV) (€/mo)"
      : isMarketplace
      ? "GMV / Take Rate per Tx (€)"
      : "Price per Subscriber / ARPU (€/mo)",
    arpuDesc: isEcommerce
      ? "Average basket revenue per customer order."
      : isService
      ? "Average monthly retainer or project billing per client."
      : isMarketplace
      ? "Net platform take fee per marketplace transaction."
      : "Average monthly revenue collected per active customer.",
    varCost: isEcommerce
      ? "Cost of Goods Sold (COGS) (€/order)"
      : isService
      ? "Direct Delivery Cost (€/client)"
      : isMarketplace
      ? "Transaction & Processing Cost (€/tx)"
      : "Variable Cost (€/sub)",
    varCostDesc: isEcommerce
      ? "Direct product, packaging, and fulfillment cost per order."
      : isService
      ? "Direct contractor or specialized delivery cost per client."
      : isMarketplace
      ? "Payment processing and server transaction fee per trade."
      : "Hosting, support, or transaction cost incurred per subscriber.",
    churn: isEcommerce
      ? "Monthly Customer Attrition (%/mo)"
      : isService
      ? "Client Churn (%/mo)"
      : isMarketplace
      ? "User Drop-off Rate (%/mo)"
      : "Monthly Churn (%/mo)",
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !isRegenerating) onClose(); }}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden bg-card border-border shadow-2xl rounded-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 via-emerald-600/10 to-transparent p-6 pb-4 border-b border-border/60 shrink-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-mono uppercase tracking-widest text-primary font-semibold">
              STEP 3.3 · FINANCIAL INPUTS & ASSUMPTIONS {businessModelType ? `· ${businessModelType.toUpperCase()}` : ""}
            </span>
            <Badge variant="outline" className="text-[11px] font-mono bg-muted/60">
              {creditCost} Credits
            </Badge>
          </div>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-primary" />
              Adjust Forecast Assumptions
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-0.5">
              Review saved inputs or edit any driver to recalculate 36 months of revenue, expenses, and cash flow.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} id="forecast-assumptions-form" className="p-6 space-y-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. Starting Budget */}
            <div className="space-y-1.5 p-3.5 rounded-xl border border-border/80 bg-muted/20 hover:border-primary/40 transition-colors">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                  Starting Budget (€)
                </label>
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 ${
                    isFieldUserModified("startingBudget")
                      ? "text-primary border-primary/30 bg-primary/5 font-semibold"
                      : "text-muted-foreground bg-muted"
                  }`}
                >
                  {isFieldUserModified("startingBudget") ? "Your value" : "AI suggested"}
                </Badge>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground">€</span>
                <Input
                  type="number"
                  step="1000"
                  min="0"
                  value={values.startingBudget}
                  onChange={(e) => handleChange("startingBudget", e.target.value)}
                  className="pl-7 font-mono text-sm h-9 rounded-lg"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                {initialRationales.startingBudget || "Initial cash balance to start Year 1 Month 1."}
              </p>
            </div>

            {/* 2. Subscribers at Launch */}
            <div className="space-y-1.5 p-3.5 rounded-xl border border-border/80 bg-muted/20 hover:border-primary/40 transition-colors">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-500" />
                  {labels.launchSubs}
                </label>
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 ${
                    isFieldUserModified("launchSubscribers")
                      ? "text-primary border-primary/30 bg-primary/5 font-semibold"
                      : "text-muted-foreground bg-muted"
                  }`}
                >
                  {isFieldUserModified("launchSubscribers") ? "Your value" : "AI suggested"}
                </Badge>
              </div>
              <Input
                type="number"
                step="5"
                min="0"
                value={values.launchSubscribers}
                onChange={(e) => handleChange("launchSubscribers", e.target.value)}
                className="font-mono text-sm h-9 rounded-lg"
              />
              <p className="text-[11px] text-muted-foreground">{labels.subsDesc}</p>
            </div>

            {/* 3. Monthly Growth Rate */}
            <div className="space-y-1.5 p-3.5 rounded-xl border border-border/80 bg-muted/20 hover:border-primary/40 transition-colors">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  Monthly Growth (%/mo)
                </label>
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 ${
                    isFieldUserModified("monthlyGrowthPct")
                      ? "text-primary border-primary/30 bg-primary/5 font-semibold"
                      : "text-muted-foreground bg-muted"
                  }`}
                >
                  {isFieldUserModified("monthlyGrowthPct") ? "Your value" : "AI suggested"}
                </Badge>
              </div>
              <div className="relative">
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  max="100"
                  value={values.monthlyGrowthPct}
                  onChange={(e) => handleChange("monthlyGrowthPct", e.target.value)}
                  className="pr-7 font-mono text-sm h-9 rounded-lg"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground">%</span>
              </div>
              <p className="text-[11px] text-muted-foreground">Monthly compound new customer acquisition rate.</p>
            </div>

            {/* 4. Monthly Churn Rate */}
            {isEcommerce ? (
              <div className="space-y-1.5 p-3.5 rounded-xl border border-border/60 bg-muted/10 opacity-75">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                    <TrendingDown className="w-3.5 h-3.5 text-muted-foreground" />
                    Customer Churn Rate
                  </label>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground bg-muted/50">
                    N/A · Inactive Driver
                  </Badge>
                </div>
                <div className="text-xs font-mono text-muted-foreground py-1.5">
                  Not applicable — E-commerce forecasts scale via monthly order growth rather than subscription retention.
                </div>
              </div>
            ) : (
              <div className="space-y-1.5 p-3.5 rounded-xl border border-border/80 bg-muted/20 hover:border-primary/40 transition-colors">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <TrendingDown className="w-3.5 h-3.5 text-amber-500" />
                    {labels.churn}
                  </label>
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 ${
                      isFieldUserModified("monthlyChurnPct")
                        ? "text-primary border-primary/30 bg-primary/5 font-semibold"
                        : "text-muted-foreground bg-muted"
                    }`}
                  >
                    {isFieldUserModified("monthlyChurnPct") ? "Your value" : "AI suggested"}
                  </Badge>
                </div>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="50"
                    value={values.monthlyChurnPct}
                    onChange={(e) => handleChange("monthlyChurnPct", e.target.value)}
                    className="pr-7 font-mono text-sm h-9 rounded-lg"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground">%</span>
                </div>
                <p className="text-[11px] text-muted-foreground">Monthly customer loss rate (0.1% to 50%).</p>
              </div>
            )}

            {/* 5. ARPU */}
            <div className="space-y-1.5 p-3.5 rounded-xl border border-border/80 bg-muted/20 hover:border-primary/40 transition-colors">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-primary" />
                  {labels.arpu}
                </label>
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 ${
                    isFieldUserModified("arpu")
                      ? "text-primary border-primary/30 bg-primary/5 font-semibold"
                      : "text-muted-foreground bg-muted"
                  }`}
                >
                  {isFieldUserModified("arpu") ? "Your value" : "AI suggested"}
                </Badge>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground">€</span>
                <Input
                  type="number"
                  step="1"
                  min="1"
                  value={values.arpu}
                  onChange={(e) => handleChange("arpu", e.target.value)}
                  className="pl-7 font-mono text-sm h-9 rounded-lg"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">{labels.arpuDesc}</p>
            </div>

            {/* 6. Variable Cost */}
            <div className="space-y-1.5 p-3.5 rounded-xl border border-border/80 bg-muted/20 hover:border-primary/40 transition-colors">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-purple-500" />
                  {labels.varCost}
                </label>
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 ${
                    isFieldUserModified("variableCost")
                      ? "text-primary border-primary/30 bg-primary/5 font-semibold"
                      : "text-muted-foreground bg-muted"
                  }`}
                >
                  {isFieldUserModified("variableCost") ? "Your value" : "AI suggested"}
                </Badge>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground">€</span>
                <Input
                  type="number"
                  step="1"
                  min="0"
                  value={values.variableCost}
                  onChange={(e) => handleChange("variableCost", e.target.value)}
                  className="pl-7 font-mono text-sm h-9 rounded-lg"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">{labels.varCostDesc}</p>
            </div>

            {/* 7. Fixed OPEX */}
            <div className="space-y-1.5 p-3.5 rounded-xl border border-border/80 bg-muted/20 hover:border-primary/40 transition-colors">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-amber-600" />
                  Fixed Operating Costs / OPEX (€/mo)
                </label>
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 ${
                    isFieldUserModified("opex")
                      ? "text-primary border-primary/30 bg-primary/5 font-semibold"
                      : "text-muted-foreground bg-muted"
                  }`}
                >
                  {isFieldUserModified("opex") ? "Your value" : "AI suggested"}
                </Badge>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground">€</span>
                <Input
                  type="number"
                  step="500"
                  min="0"
                  value={values.opex}
                  onChange={(e) => handleChange("opex", e.target.value)}
                  className="pl-7 font-mono text-sm h-9 rounded-lg"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">Monthly salaries, tools, legal, and operational overhead.</p>
            </div>

            {/* 8. TAM - Canonical from Step 3.1 Market Study, read-only */}
            <div className="space-y-1.5 p-3.5 rounded-xl border border-border/80 bg-muted/20 hover:border-primary/40 transition-colors">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-rose-500" />
                  Total Addressable Market / TAM (€)
                </label>
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 text-emerald-600 border-emerald-500/30 bg-emerald-500/5 font-semibold"
                >
                  Canonical · Step 3.1 Market Study
                </Badge>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground">€</span>
                <Input
                  type="number"
                  readOnly
                  disabled
                  value={values.tam}
                  className="pl-7 font-mono text-sm h-9 rounded-lg bg-muted/50 cursor-not-allowed text-muted-foreground"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Canonical TAM ceiling from Step 3.1 Market Study (read-only in Step 3.3).
              </p>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="p-4 px-6 bg-muted/30 border-t border-border flex items-center justify-between shrink-0">
          <p className="text-xs text-muted-foreground">
            Custom edits are authoritative and preserved across regenerations.
          </p>
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isRegenerating}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => onConfirm(values, provenance)}
              size="sm"
              disabled={isRegenerating}
              className="gap-2 font-semibold rounded-xl text-xs px-5 shadow-sm"
            >
              {isRegenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Recalculating Projections…
                </>
              ) : (
                <>
                  Recalculate & Regenerate
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
