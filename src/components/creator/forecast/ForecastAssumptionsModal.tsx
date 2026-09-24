"use client";

import React, { useState, useEffect, useMemo } from "react";
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
import { Card } from "@/components/ui/card";
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
  Percent,
  ShoppingCart,
  Briefcase,
  Store,
  CheckCircle2,
  AlertCircle,
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
  averageOrderValue?: number;
  takeRatePct?: number;
  taxRatePct?: number;
}

export interface ForecastAssumptionsFormProps {
  mode?: "page" | "modal";
  open?: boolean;
  onClose?: () => void;
  initialValues: ForecastDriverValues;
  initialProvenance?: Record<string, string>;
  initialRationales?: Record<string, string>;
  businessModelType?: string;
  activeDrivers?: Record<string, boolean>;
  isSubmitting?: boolean;
  creditCost?: number;
  onConfirm: (
    values: ForecastDriverValues,
    provenance: Record<string, string>,
    activeDrivers: Record<string, boolean>
  ) => Promise<void> | void;
}

export function formatProvenanceBadge(field: string, prov?: string, isModified?: boolean) {
  if (isModified || prov === "founder_edited") {
    return { label: "Founder edited", variant: "founder" as const };
  }
  if (prov === "founder_confirmed") {
    return { label: "Founder confirmed", variant: "confirmed" as const };
  }
  if (prov === "upstream_business_model") {
    return { label: "Based on Step 3.2 pricing", variant: "upstream" as const };
  }
  if (prov === "upstream_market" || prov === "canonical_step_3_1") {
    return { label: "Canonical · Step 3.1 Market Study", variant: "canonical" as const };
  }
  if (prov === "upstream_legal" || prov === "canonical_legal") {
    return { label: "Upstream · Legal context", variant: "canonical" as const };
  }
  if (prov === "ai_suggested") {
    return { label: "AI suggested", variant: "ai" as const };
  }
  if (!prov) {
    return { label: "Needs Input", variant: "warning" as const };
  }
  return { label: prov, variant: "ai" as const };
}

export const ForecastAssumptionsForm: React.FC<ForecastAssumptionsFormProps> = ({
  mode = "page",
  open = true,
  onClose,
  initialValues,
  initialProvenance = {},
  initialRationales = {},
  businessModelType = "saas",
  activeDrivers = {},
  isSubmitting = false,
  creditCost = 32,
  onConfirm,
}) => {
  const [values, setValues] = useState<ForecastDriverValues>(() => ({
    ...initialValues,
    taxRatePct: initialValues.taxRatePct ?? undefined,
    averageOrderValue: initialValues.averageOrderValue ?? (initialValues.arpu > 0 ? initialValues.arpu : undefined),
    takeRatePct: initialValues.takeRatePct ?? undefined,
  }));

  const [provenance, setProvenance] = useState<Record<string, string>>(initialProvenance);
  const [formError, setFormError] = useState<string | null>(null);

  const initialValuesKey = JSON.stringify(initialValues);
  const initialProvKey = JSON.stringify(initialProvenance);
  const isHydratedRef = React.useRef(false);

  // Sync state whenever props change, preserving any user modifications
  useEffect(() => {
    if (!isHydratedRef.current) {
      isHydratedRef.current = true;
      setValues({
        ...initialValues,
        taxRatePct: initialValues.taxRatePct ?? undefined,
        averageOrderValue: initialValues.averageOrderValue ?? (initialValues.arpu > 0 ? initialValues.arpu : undefined),
        takeRatePct: initialValues.takeRatePct ?? undefined,
      });
      setProvenance(initialProvenance);
      return;
    }

    setValues((prev) => {
      const next = { ...initialValues };
      (Object.keys(prev) as Array<keyof ForecastDriverValues>).forEach((k) => {
        if (provenance[k] === "founder_edited" && prev[k] !== undefined) {
          (next as any)[k] = prev[k];
        }
      });
      return {
        ...next,
        taxRatePct: next.taxRatePct ?? undefined,
        averageOrderValue: next.averageOrderValue ?? (next.arpu > 0 ? next.arpu : undefined),
        takeRatePct: next.takeRatePct ?? undefined,
      };
    });
  }, [initialValuesKey, initialProvKey]);

  const bm = (businessModelType || "saas").toLowerCase();
  const isEcommerce = bm === "ecommerce";
  const isService = bm === "service";
  const isMarketplace = bm === "marketplace";
  const isSaas = !isEcommerce && !isService && !isMarketplace;

  // Active drivers determination
  const resolvedActiveDrivers = useMemo(() => {
    const drivers: Record<string, boolean> = {
      startingBudget: true,
      launchSubscribers: true,
      monthlyGrowthPct: true,
      opex: true,
      variableCost: true,
      taxRatePct: true,
      tam: false, // context only
      businessModelType: false, // context only
      ...activeDrivers,
    };

    if (isSaas) {
      drivers.monthlyChurnPct = true;
      drivers.arpu = true;
      drivers.averageOrderValue = false;
      drivers.takeRatePct = false;
    } else if (isEcommerce) {
      drivers.monthlyChurnPct = false;
      drivers.arpu = false;
      drivers.averageOrderValue = true;
      drivers.takeRatePct = false;
    } else if (isService) {
      drivers.monthlyChurnPct = activeDrivers.monthlyChurnPct ?? false;
      drivers.arpu = true;
      drivers.averageOrderValue = false;
      drivers.takeRatePct = false;
    } else if (isMarketplace) {
      drivers.monthlyChurnPct = false;
      drivers.arpu = false;
      drivers.averageOrderValue = true;
      drivers.takeRatePct = true;
    }

    return drivers;
  }, [isSaas, isEcommerce, isService, isMarketplace, activeDrivers]);

  const handleChange = (field: keyof ForecastDriverValues, valStr: string) => {
    setFormError(null);
    const num = parseFloat(valStr.replace(/[^0-9.]/g, ""));
    const updatedNum = isNaN(num) ? 0 : num;
    setValues((prev) => ({ ...prev, [field]: updatedNum }));
    setProvenance((prev) => ({ ...prev, [field]: "founder_edited" }));
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

  const isFieldUserModified = (field: keyof ForecastDriverValues) => {
    return (
      provenance[field] === "founder_edited" ||
      provenance[field] === "founder_confirmed" ||
      values[field] !== initialValues[field]
    );
  };

  const renderBadge = (field: keyof ForecastDriverValues, defaultProv = "ai_suggested") => {
    const provKey = provenance[field] || defaultProv;
    const isMod = isFieldUserModified(field);
    const info = formatProvenanceBadge(field, provKey, isMod);

    if (info.variant === "founder" || info.variant === "confirmed") {
      return (
        <Badge variant="outline" className="text-[10px] px-2 py-0.5 text-primary border-primary/30 bg-primary/5 font-semibold">
          {info.label}
        </Badge>
      );
    }
    if (info.variant === "canonical" || info.variant === "upstream") {
      return (
        <Badge variant="outline" className="text-[10px] px-2 py-0.5 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/5 font-semibold">
          {info.label}
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-[10px] px-2 py-0.5 text-muted-foreground bg-muted font-normal">
        {info.label}
      </Badge>
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (values.startingBudget < 0) {
      setFormError("Starting budget cannot be negative.");
      return;
    }
    if (values.launchSubscribers < 0) {
      setFormError("Launch volume cannot be negative.");
      return;
    }
    if (values.monthlyGrowthPct < 0 || values.monthlyGrowthPct > 100) {
      setFormError("Monthly growth rate must be between 0% and 100%.");
      return;
    }
    if (resolvedActiveDrivers.monthlyChurnPct) {
      if (values.monthlyChurnPct <= 0 || values.monthlyChurnPct > 50) {
        setFormError("Monthly churn must be between 0.1% and 50%.");
        return;
      }
    }
    if (isMarketplace) {
      if ((values.takeRatePct ?? 0) <= 0 || (values.takeRatePct ?? 0) > 100) {
        setFormError("Marketplace Take Rate must be between 0.1% and 100%.");
        return;
      }
      if ((values.averageOrderValue ?? 0) <= 0) {
        setFormError("Average Transaction Value must be greater than 0.");
        return;
      }
    } else if (isEcommerce) {
      if ((values.averageOrderValue ?? values.arpu ?? 0) <= 0) {
        setFormError("Average Order Value (AOV) must be greater than 0.");
        return;
      }
    } else {
      if (values.arpu <= 0) {
        setFormError("Pricing / ARPU must be greater than 0.");
        return;
      }
    }

    if (values.opex < 0) {
      setFormError("Fixed OPEX cannot be negative.");
      return;
    }
    if (values.variableCost < 0) {
      setFormError("Variable cost cannot be negative.");
      return;
    }

    // Call onConfirm with sanitized payload
    onConfirm(values, provenance, resolvedActiveDrivers);
  };

  // Archetype label dictionary
  const labels = {
    launchSubs: isEcommerce
      ? "Initial Monthly Orders"
      : isService
      ? "Starting Clients or Projects"
      : isMarketplace
      ? "Starting Transaction Volume"
      : "Launch Subscribers",
    subsDesc: isEcommerce
      ? "Baseline customer orders expected at Month 1 launch."
      : isService
      ? "Initial active client or project count at launch."
      : isMarketplace
      ? "Monthly completed transactions expected at launch."
      : "Baseline active subscriber count at Month 1 launch.",
    growth: isEcommerce
      ? "Order Growth Rate (%/mo)"
      : isService
      ? "Client / Project Growth Rate (%/mo)"
      : isMarketplace
      ? "Transaction Growth Rate (%/mo)"
      : "Monthly Growth Rate (%/mo)",
    growthDesc: isEcommerce
      ? "Month-over-month compounding order volume expansion."
      : isService
      ? "Month-over-month new client acquisition expansion."
      : isMarketplace
      ? "Month-over-month transaction volume scaling."
      : "Month-over-month new subscriber acquisition rate.",
    price: isEcommerce
      ? "Average Order Value (AOV) (€)"
      : isService
      ? "Monthly Retainer / Avg Project Value (€)"
      : isMarketplace
      ? "Average Transaction Value (ATV) (€)"
      : "Price per Subscriber / ARPU (€/mo)",
    priceDesc: isEcommerce
      ? "Average basket revenue per completed customer order."
      : isService
      ? "Average monthly retainer or project contract billing per client."
      : isMarketplace
      ? "Gross transaction value per trade on the marketplace."
      : "Average monthly subscription revenue per active customer.",
    varCost: isEcommerce
      ? "COGS & Fulfillment per Order (€/order)"
      : isService
      ? "Direct Delivery Cost per Client/Project (€)"
      : isMarketplace
      ? "Payment Processing & Server Cost per Tx (€/tx)"
      : "Variable Cost per Subscriber (€/sub)",
    varCostDesc: isEcommerce
      ? "Direct product unit cost, packaging, and fulfillment per order."
      : isService
      ? "Direct contractor or delivery cost incurred per client."
      : isMarketplace
      ? "Stripe / gateway fee and platform processing cost per trade."
      : "Hosting, tooling, and support cost incurred per subscriber.",
    churn: isService ? "Client Turnover / Churn (%/mo)" : "Monthly Churn Rate (%/mo)",
    churnDesc: "Monthly customer attrition rate (0.1% to 50%).",
  };

  const formBody = (
    <form onSubmit={handleSubmit} id="forecast-assumptions-canonical-form" className="space-y-6">
      {/* Archetype Context Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl border border-primary/20 bg-primary/5 text-xs text-muted-foreground">
        <div className="flex items-center gap-2.5">
          {isEcommerce ? (
            <ShoppingCart className="w-4 h-4 text-primary shrink-0" />
          ) : isService ? (
            <Briefcase className="w-4 h-4 text-primary shrink-0" />
          ) : isMarketplace ? (
            <Store className="w-4 h-4 text-primary shrink-0" />
          ) : (
            <Layers className="w-4 h-4 text-primary shrink-0" />
          )}
          <span>
            Active Model: <strong className="text-foreground uppercase tracking-wider">{bm}</strong>. Drivers are dynamically tailored to your verified unit economics.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[11px] font-mono bg-card text-foreground">
            {creditCost} Credits
          </Badge>
        </div>
      </div>

      {formError && (
        <div className="flex items-center gap-2 p-3 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* Grid of Canonical Drivers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Starting Budget */}
        <div className="space-y-1.5 p-4 rounded-xl border border-border/80 bg-card hover:border-primary/40 transition-colors shadow-xs">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              Starting Budget (€)
            </label>
            {renderBadge("startingBudget")}
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
              placeholder="50000"
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            {initialRationales.startingBudget || "Initial launch capital / cash reserve at Month 1."}
          </p>
        </div>

        {/* 2. Launch Volume */}
        <div className="space-y-1.5 p-4 rounded-xl border border-border/80 bg-card hover:border-primary/40 transition-colors shadow-xs">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Users className="w-4 h-4 text-blue-500" />
              {labels.launchSubs}
            </label>
            {renderBadge("launchSubscribers")}
          </div>
          <Input
            type="number"
            step="5"
            min="0"
            value={values.launchSubscribers}
            onChange={(e) => handleChange("launchSubscribers", e.target.value)}
            className="font-mono text-sm h-9 rounded-lg"
            placeholder="100"
          />
          <p className="text-[11px] text-muted-foreground">{labels.subsDesc}</p>
        </div>

        {/* 3. Growth Rate */}
        <div className="space-y-1.5 p-4 rounded-xl border border-border/80 bg-card hover:border-primary/40 transition-colors shadow-xs">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              {labels.growth}
            </label>
            {renderBadge("monthlyGrowthPct")}
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
              placeholder="12"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground">%</span>
          </div>
          <p className="text-[11px] text-muted-foreground">{labels.growthDesc}</p>
        </div>

        {/* 4. Pricing / Revenue Driver */}
        {isMarketplace ? (
          <>
            {/* Marketplace: Average Transaction Value */}
            <div className="space-y-1.5 p-4 rounded-xl border border-border/80 bg-card hover:border-primary/40 transition-colors shadow-xs">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-primary" />
                  Average Transaction Value (ATV) (€)
                </label>
                {renderBadge("averageOrderValue", "upstream_business_model")}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground">€</span>
                <Input
                  type="number"
                  step="5"
                  min="1"
                  value={values.averageOrderValue}
                  onChange={(e) => handleChange("averageOrderValue", e.target.value)}
                  className="pl-7 font-mono text-sm h-9 rounded-lg"
                  placeholder="100"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">Average GMV value per marketplace trade.</p>
            </div>

            {/* Marketplace: Take Rate % */}
            <div className="space-y-1.5 p-4 rounded-xl border border-border/80 bg-card hover:border-primary/40 transition-colors shadow-xs">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Percent className="w-4 h-4 text-purple-500" />
                  Platform Take Rate (%)
                </label>
                {renderBadge("takeRatePct", "upstream_business_model")}
              </div>
              <div className="relative">
                <Input
                  type="number"
                  step="0.5"
                  min="0.1"
                  max="100"
                  value={values.takeRatePct}
                  onChange={(e) => handleChange("takeRatePct", e.target.value)}
                  className="pr-7 font-mono text-sm h-9 rounded-lg"
                  placeholder="15"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground">%</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Commission fee rate. Revenue = GMV × Take Rate.
              </p>
            </div>
          </>
        ) : isEcommerce ? (
          <div className="space-y-1.5 p-4 rounded-xl border border-border/80 bg-card hover:border-primary/40 transition-colors shadow-xs">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-primary" />
                {labels.price}
              </label>
              {renderBadge("averageOrderValue", "upstream_business_model")}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground">€</span>
              <Input
                type="number"
                step="1"
                min="1"
                value={values.averageOrderValue ?? values.arpu}
                onChange={(e) => {
                  handleChange("averageOrderValue", e.target.value);
                  handleChange("arpu", e.target.value);
                }}
                className="pl-7 font-mono text-sm h-9 rounded-lg"
                placeholder="65"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">{labels.priceDesc}</p>
          </div>
        ) : (
          <div className="space-y-1.5 p-4 rounded-xl border border-border/80 bg-card hover:border-primary/40 transition-colors shadow-xs">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-primary" />
                {labels.price}
              </label>
              {renderBadge("arpu", "upstream_business_model")}
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
                placeholder="49"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">{labels.priceDesc}</p>
          </div>
        )}

        {/* 5. Cost of Goods / Variable Cost */}
        <div className="space-y-1.5 p-4 rounded-xl border border-border/80 bg-card hover:border-primary/40 transition-colors shadow-xs">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-purple-500" />
              {labels.varCost}
            </label>
            {renderBadge("variableCost", "upstream_business_model")}
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground">€</span>
            <Input
              type="number"
              step="0.5"
              min="0"
              value={values.variableCost}
              onChange={(e) => handleChange("variableCost", e.target.value)}
              className="pl-7 font-mono text-sm h-9 rounded-lg"
              placeholder="8"
            />
          </div>
          <p className="text-[11px] text-muted-foreground">{labels.varCostDesc}</p>
        </div>

        {/* 6. Fixed OPEX */}
        <div className="space-y-1.5 p-4 rounded-xl border border-border/80 bg-card hover:border-primary/40 transition-colors shadow-xs">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Building className="w-4 h-4 text-amber-600" />
              Fixed Operating Costs / OPEX (€/mo)
            </label>
            {renderBadge("opex", "upstream_business_model")}
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
              placeholder="8000"
            />
          </div>
          <p className="text-[11px] text-muted-foreground">Monthly salaries, tools, legal, and operational overhead.</p>
        </div>

        {/* 7. Churn Rate (Active for SaaS / Retainer; Inactive/N-A for E-commerce & Marketplace) */}
        {resolvedActiveDrivers.monthlyChurnPct ? (
          <div className="space-y-1.5 p-4 rounded-xl border border-border/80 bg-card hover:border-primary/40 transition-colors shadow-xs">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <TrendingDown className="w-4 h-4 text-amber-500" />
                {labels.churn}
              </label>
              {renderBadge("monthlyChurnPct")}
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
                placeholder="3.5"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground">%</span>
            </div>
            <p className="text-[11px] text-muted-foreground">{labels.churnDesc}</p>
          </div>
        ) : (
          <div className="space-y-1.5 p-4 rounded-xl border border-border/60 bg-muted/20 opacity-80">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <TrendingDown className="w-4 h-4 text-muted-foreground" />
                Monthly Churn Rate
              </label>
              <Badge variant="outline" className="text-[10px] px-2 py-0.5 text-muted-foreground bg-muted/60">
                N/A · Inactive Driver
              </Badge>
            </div>
            <div className="text-xs font-mono text-muted-foreground py-2 leading-relaxed">
              Not applicable for {bm} — forecast scales via monthly transaction/order growth.
            </div>
          </div>
        )}

        {/* 8. Tax Rate */}
        <div className="space-y-1.5 p-4 rounded-xl border border-border/80 bg-card hover:border-primary/40 transition-colors shadow-xs">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Percent className="w-4 h-4 text-indigo-500" />
              Corporate Tax Rate (%)
            </label>
            {renderBadge("taxRatePct", provenance.taxRatePct || "")}
          </div>
          <div className="relative">
            <Input
              type="number"
              step="0.5"
              min="0"
              max="100"
              value={values.taxRatePct != null ? values.taxRatePct : ""}
              onChange={(e) => handleChange("taxRatePct", e.target.value)}
              className="pr-7 font-mono text-sm h-9 rounded-lg"
              placeholder="e.g. 25"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground">%</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Applicable corporate income tax rate (or 0% if tax exempt / pass-through entity).
          </p>
        </div>

        {/* 9. TAM (Read-only Context) */}
        <div className="space-y-1.5 p-4 rounded-xl border border-border/80 bg-muted/30">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Target className="w-4 h-4 text-rose-500" />
              Total Addressable Market / TAM (€)
            </label>
            <Badge variant="outline" className="text-[10px] px-2 py-0.5 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/5 font-semibold">
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
              className="pl-7 font-mono text-sm h-9 rounded-lg bg-muted/60 cursor-not-allowed text-muted-foreground"
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Canonical TAM ceiling from Step 3.1 Market Study (read-only linked fact).
          </p>
        </div>
      </div>
    </form>
  );

  if (mode === "modal") {
    return (
      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (!o && !isSubmitting && onClose) onClose();
        }}
      >
        <DialogContent className="max-w-3xl p-0 gap-0 overflow-hidden bg-card border-border shadow-2xl rounded-2xl max-h-[90vh] flex flex-col">
          {/* Modal Header */}
          <div className="bg-gradient-to-r from-primary/10 via-emerald-600/10 to-transparent p-6 pb-4 border-b border-border/60 shrink-0">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-mono uppercase tracking-widest text-primary font-semibold">
                STEP 3.3 · FINANCIAL INPUTS & ASSUMPTIONS · {bm.toUpperCase()}
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

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto flex-1">{formBody}</div>

          {/* Modal Footer */}
          <div className="p-4 px-6 bg-muted/30 border-t border-border flex items-center justify-between shrink-0">
            <p className="text-xs text-muted-foreground">
              Custom edits are authoritative and preserved across regenerations.
            </p>
            <div className="flex items-center gap-2.5">
              {onClose && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                form="forecast-assumptions-canonical-form"
                onClick={handleSubmit}
                size="sm"
                disabled={isSubmitting}
                className="gap-2 font-semibold rounded-xl text-xs px-5 shadow-sm"
              >
                {isSubmitting ? (
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
  }

  // mode === "page" (First-time main screen)
  return (
    <div className="w-full space-y-6 max-w-4xl mx-auto py-2">
      <Card className="p-6 sm:p-8 rounded-2xl border border-border bg-card shadow-sm space-y-6">
        <div className="space-y-2 border-b border-border/60 pb-5">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-[11px] font-mono font-semibold tracking-wider uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-primary inline-block" />
              STEP 3.3 · FINANCIAL FORECAST
            </div>
            <Badge variant="outline" className="text-xs font-mono bg-muted/60">
              {creditCost} Credits
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-foreground">
            Adjust Forecast Assumptions
          </h1>
          <p className="text-sm text-muted-foreground font-sans leading-relaxed">
            Review the assumptions prepared from your Market Study and Business Model before generating your forecast.
          </p>
        </div>

        {formBody}

        <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            Assumptions are saved canonically and will seed your 36-month projections.
          </p>
          <Button
            type="submit"
            form="forecast-assumptions-canonical-form"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full sm:w-auto gap-2 font-semibold rounded-xl text-sm px-6 h-10 shadow-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating Forecast…
              </>
            ) : (
              <>
                Generate Forecast
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export type ForecastAssumptionsModalProps = Omit<ForecastAssumptionsFormProps, "mode">;

export const ForecastAssumptionsModal: React.FC<
  ForecastAssumptionsModalProps
> = (props) => {
  return <ForecastAssumptionsForm mode="modal" {...props} />;
};

export default ForecastAssumptionsForm;
