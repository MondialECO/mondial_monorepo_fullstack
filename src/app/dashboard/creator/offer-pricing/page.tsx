"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Sparkles,
  TrendingUp,
  FileText,
  DollarSign,
  ArrowRight,
  ChevronRight,
  Sliders,
  Check,
  Percent,
  Plus,
  Trash2,
  Cpu,
  Layers,
  Award,
  BarChart,
  Target,
  Rocket,
  ShieldCheck,
} from "lucide-react";

import { useCreatorProgress } from "@/providers/CreatorProgressProvider";
import { useRouter } from "next/navigation";

export default function OfferPricingPage() {
  const router = useRouter();
  const { state, updateProject, completeStep, advancePhase } = useCreatorProgress();
  const [activeTab, setActiveTab] = useState<"pricing" | "calculator" | "gtm" | "complete">("pricing");
  const [isSaved, setIsSaved] = useState(false);

  // Pricing tiers state
  const [tiers, setTiers] = useState([
    { name: "Starter", price: 15, billCycle: "mo", features: ["Up to 50 invoices/mo", "Basic OCR scanner", "Email support"] },
    { name: "Professional", price: 49, billCycle: "mo", features: ["Unlimited invoices", "Advanced ledger mapping", "API access", "Priority support"] },
    { name: "Enterprise", price: 299, billCycle: "mo", features: ["Dedicated model training", "Custom integrations", "SLA guarantees", "24/7 account manager"] },
  ]);

  // AI resource calculator state
  const [monthlyTrans, setMonthlyTrans] = useState(15000);
  const [modelType, setModelType] = useState<"standard" | "premium">("standard");
  const modelCostFactor = modelType === "premium" ? 0.005 : 0.002;
  const infrastructureCost = Math.round(monthlyTrans * modelCostFactor + 120);
  const projectedRevenue = Math.round((monthlyTrans / 100) * 1.5 * 19); // 1.5% conversion at $19 ARPU
  const grossMargin = projectedRevenue > 0 ? Math.round(((projectedRevenue - infrastructureCost) / projectedRevenue) * 100) : 0;

  // GTM setup state
  const [adBudget, setAdBudget] = useState(2500);
  const [cac, setCac] = useState(45);
  const paybackPeriod = Math.ceil(cac / 15); // months to recover CAC based on $15 ARPU

  return (
    <div className="mx-auto w-full max-w-[1136px] space-y-6 bg-background pb-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold leading-tight text-foreground sm:text-[28px] flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-primary" />
            Phase 4: Offer & Resource Setup
          </h1>
          <p className="text-sm font-normal text-muted-foreground mt-1">
            Structure your service tiers, calculate delivery resources, and align Go-To-Market variables.
          </p>
        </div>

        {/* Tab buttons */}
        <div className="flex flex-wrap gap-1 bg-muted/65 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setActiveTab("pricing")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "pricing" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            4.1 Tiers & Pricing
          </button>
          <button
            onClick={() => setActiveTab("calculator")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "calculator" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            4.2 Resource Calculator
          </button>
          <button
            onClick={() => setActiveTab("gtm")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "gtm" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            4.3 GTM Setup
          </button>
          <button
            onClick={() => setActiveTab("complete")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "complete" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            4.4 Status Complete
          </button>
        </div>
      </div>

      {/* TAB 1: TIERS & PRICING */}
      {activeTab === "pricing" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid gap-6 md:grid-cols-3">
            {tiers.map((tier, idx) => (
              <Card key={tier.name} className={`rounded-xl border-border/70 bg-card shadow-sm p-6 flex flex-col justify-between ${idx === 1 ? "border-primary/50 ring-1 ring-primary/20" : ""}`}>
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-bold text-foreground">{tier.name}</h3>
                    {idx === 1 && <Badge className="bg-primary/10 text-primary border-0 font-bold px-2 py-0.5">Most Popular</Badge>}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-foreground">${tier.price}</span>
                    <span className="text-xs text-muted-foreground font-semibold">/{tier.billCycle}</span>
                  </div>
                  <div className="h-px bg-border/50" />
                  <ul className="space-y-2.5 text-xs text-muted-foreground font-semibold">
                    {tier.features.map((feat) => (
                      <li key={feat} className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-success-text shrink-0" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="pt-6">
                  <Button variant={idx === 1 ? "default" : "outline"} className="w-full rounded-lg font-bold">
                    Edit Plan Settings
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" className="rounded-xl font-bold border-border">Add Custom Tier</Button>
            <Button onClick={() => { completeStep(4, 1); setActiveTab("calculator"); }} className="rounded-xl font-bold bg-primary text-white flex items-center gap-1.5">
              Next: Resource Calculator <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* TAB 2: RESOURCE CALCULATOR */}
      {activeTab === "calculator" && (
        <div className="grid gap-6 lg:grid-cols-3 animate-in fade-in duration-200">
          <Card className="lg:col-span-2 rounded-xl border-border/70 bg-card shadow-sm p-6 space-y-6">
            <div className="space-y-2">
              <h3 className="font-bold text-foreground">AI Infrastructure Cost Estimation</h3>
              <p className="text-xs text-muted-foreground">Slide transactions to estimate server cost models and margins.</p>
            </div>

            <div className="space-y-6 pt-3">
              {/* Transactions Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-muted-foreground">Projected Invoices Scanned (monthly)</span>
                  <span className="text-foreground font-bold">{monthlyTrans.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="5000"
                  max="100000"
                  step="5000"
                  value={monthlyTrans}
                  onChange={(e) => setMonthlyTrans(Number(e.target.value))}
                  className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* Model Choice */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">AI Model Level</span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setModelType("standard")}
                    className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${
                      modelType === "standard"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-muted-foreground hover:bg-muted/30"
                    }`}
                  >
                    Standard OCR (Llama-3-Lite)
                  </button>
                  <button
                    onClick={() => setModelType("premium")}
                    className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${
                      modelType === "premium"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-muted-foreground hover:bg-muted/30"
                    }`}
                  >
                    Premium LayoutLM (GPT-4o-Mini)
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-border/40">
              <Button onClick={() => { completeStep(4, 2); setActiveTab("gtm"); }} className="rounded-xl font-bold bg-primary text-white flex items-center gap-1.5">
                Next: Go-To-Market Setup <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </Card>

          {/* Calculator Output */}
          <Card className="rounded-xl border-border/70 bg-card shadow-sm p-6 flex flex-col justify-between">
            <div className="space-y-5">
              <h3 className="font-bold text-sm text-foreground uppercase tracking-wider">Estimated Resource Output</h3>
              <div className="divide-y divide-border/60">
                <div className="flex items-center justify-between py-2.5 text-xs">
                  <span className="text-muted-foreground">Server Hosting Cost</span>
                  <span className="font-bold text-foreground">${infrastructureCost}/mo</span>
                </div>
                <div className="flex items-center justify-between py-2.5 text-xs">
                  <span className="text-muted-foreground">Projected Revenue</span>
                  <span className="font-bold text-foreground">${projectedRevenue.toLocaleString()}/mo</span>
                </div>
                <div className="flex items-center justify-between py-2.5 text-xs">
                  <span className="text-muted-foreground">Estimated Gross Margin</span>
                  <span className="font-bold text-success-text">{grossMargin}%</span>
                </div>
              </div>
            </div>
            <div className="p-3 bg-muted/35 rounded-xl border border-border/40 text-[10px] text-muted-foreground leading-relaxed">
              These calculations represent estimated hosting and token costs for validation endpoints. Final operational metrics depend on reseller commission models.
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: GTM SETUP */}
      {activeTab === "gtm" && (
        <div className="grid gap-6 md:grid-cols-3 animate-in fade-in duration-200">
          <Card className="md:col-span-2 rounded-xl border-border/70 bg-card shadow-sm p-6 space-y-6">
            <div className="space-y-2">
              <h3 className="font-bold text-foreground">Go-To-Market (GTM) Parameters</h3>
              <p className="text-xs text-muted-foreground">Configure customer acquisition variables to align marketing payback periods.</p>
            </div>

            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Acquisition Budget ($)</label>
                <Input
                  type="number"
                  value={adBudget}
                  onChange={(e) => setAdBudget(Number(e.target.value))}
                  className="rounded-xl text-xs bg-muted/40 border-border/80 focus-visible:ring-primary/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Target CAC ($)</label>
                <Input
                  type="number"
                  value={cac}
                  onChange={(e) => setCac(Number(e.target.value))}
                  className="rounded-xl text-xs bg-muted/40 border-border/80 focus-visible:ring-primary/20"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-border/40">
              <Button onClick={() => { completeStep(4, 3); setActiveTab("complete"); }} className="rounded-xl font-bold bg-primary text-white flex items-center gap-1.5">
                Next: Complete Status <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </Card>

          <Card className="rounded-xl border-border/70 bg-card shadow-sm p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-foreground uppercase tracking-wider">Acquisition Efficiency</h3>
              <div className="divide-y divide-border/60">
                <div className="flex items-center justify-between py-2.5 text-xs">
                  <span className="text-muted-foreground">Estimated New Customers</span>
                  <span className="font-bold text-foreground">{Math.round(adBudget / cac)}/mo</span>
                </div>
                <div className="flex items-center justify-between py-2.5 text-xs">
                  <span className="text-muted-foreground">Payback Period</span>
                  <span className="font-bold text-primary">{paybackPeriod} months</span>
                </div>
              </div>
            </div>
            <div className="p-3 bg-muted/35 rounded-xl border border-border/40 text-[10px] text-muted-foreground leading-relaxed">
              Target CAC is aligned with South Asian SMB models where payback periods exceeding 6 months present high capital constraints. We recommend digital reselling loops.
            </div>
          </Card>
        </div>
      )}

      {/* TAB 4: COMPLETE STATUS */}
      {activeTab === "complete" && (
        <Card className="rounded-2xl border-border/70 bg-card shadow-sm p-8 text-center max-w-xl mx-auto space-y-6 animate-in zoom-in-95 duration-200">
          <div className="relative flex items-center justify-center">
            <div className="absolute w-24 h-24 rounded-full bg-success-light animate-ping" style={{ animationDuration: "2.5s" }} />
            <div className="w-16 h-16 rounded-full bg-[#00A854] flex items-center justify-center text-white shadow-lg shadow-success-light">
              <Check className="h-8 w-8" strokeWidth={3} />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-foreground">Offer & Resource Setup Completed!</h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
              Your service tiers, infrastructure calculator, and Go-To-Market variables are fully locked into your business profile.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-border bg-muted/10 text-left space-y-2 max-w-md mx-auto">
            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
              <ShieldCheck className="h-4 w-4 text-success-text" /> Data Saved Successfully
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              These details will serve as prerequisite inputs for the investor matching pipeline and Crossroads decision gate.
            </p>
          </div>

          <div className="flex justify-center gap-3 pt-4">
            <Button variant="outline" onClick={() => setActiveTab("pricing")} className="rounded-xl font-bold">Review Setup</Button>
            <Button
              onClick={() => {
                completeStep(4, 4);
                advancePhase(4);
                router.push('/dashboard/creator');
              }}
              className="rounded-xl font-bold bg-primary text-white"
            >
              Back to Dashboard
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
