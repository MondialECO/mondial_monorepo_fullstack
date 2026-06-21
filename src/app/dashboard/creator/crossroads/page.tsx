"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Sparkles,
  GitFork,
  CheckCircle2,
  TrendingUp,
  FileText,
  DollarSign,
  Shield,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Sliders,
  Check,
  Building2,
  Lock,
  Eye,
  Store,
  Users,
  Compass,
} from "lucide-react";

import { useCreatorProgress } from "@/providers/CreatorProgressProvider";
import { useRouter } from "next/navigation";

export default function CrossroadsPage() {
  const router = useRouter();
  const { state, updateProject, completeStep, advancePhase, setCrossroadsPath } = useCreatorProgress();
  const { project, journeyState } = state;

  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    if (isNavigating && state.journeyState.phase6.status === 'available') {
      router.push('/dashboard/creator/investors');
    }
  }, [isNavigating, state.journeyState.phase6.status, router]);

  const [activeTab, setActiveTab] = useState<"decision" | "valuation" | "marketplace" | "matchmaking">("decision");
  const [decision, setDecision] = useState<"buyout" | "build" | null>(
    journeyState.phase5.selectedPath || null
  );
  const [valuationScore, setValuationScore] = useState(88);
  const [buyoutPrice, setBuyoutPrice] = useState(120000);
  const [equityWanted, setEquityWanted] = useState(10);
  const [isListed, setIsListed] = useState(false);

  // Smart matchmaking list
  const matches = [
    { name: "Soren Ventures", type: "Venture Fund", matchScore: 94, targetSector: "FinTech SaaS", focus: "Equity / Seed Funding" },
    { name: "Berlin Angel Syndicate", type: "Angel Group", matchScore: 88, targetSector: "AI Productivity", focus: "IP Acquisition / Buyout" },
    { name: "Elena Rostova", type: "Individual Angel", matchScore: 82, targetSector: "Emerging Markets", focus: "Equity Match" },
  ];

  return (
    <div className="mx-auto w-full max-w-[1136px] space-y-6 bg-background pb-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold leading-tight text-foreground sm:text-[28px] flex items-center gap-2">
            <GitFork className="h-6 w-6 text-primary animate-pulse" />
            Phase 5: The Crossroads Decision
          </h1>
          <p className="text-sm font-normal text-muted-foreground mt-1">
            Choose your monetization pipeline, value your IP, and execute marketplace matches.
          </p>
        </div>

        {/* Tab buttons */}
        <div className="flex flex-wrap gap-1 bg-muted/65 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setActiveTab("decision")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "decision" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            5.0 Decision Path
          </button>
          <button
            onClick={() => setActiveTab("valuation")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "valuation" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            5.1 AI IP Valuation
          </button>
          <button
            onClick={() => setActiveTab("marketplace")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "marketplace" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            5.2 Marketplace Listing
          </button>
          <button
            onClick={() => setActiveTab("matchmaking")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "matchmaking" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            5.3 Matchmaking
          </button>
        </div>
      </div>

      {/* TAB 1: DECISION PATH */}
      {activeTab === "decision" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid gap-6 md:grid-cols-2">
            {/* PATH A: Sell or License */}
            <Card
              onClick={() => {
                setDecision("buyout");
                setCrossroadsPath("buyout");
              }}
              className={`rounded-2xl border-2 p-6 flex flex-col justify-between min-h-[380px] cursor-pointer transition-all duration-300 ${
                decision === "buyout" ? "border-primary bg-primary/5 shadow-md" : "border-border bg-card hover:border-primary/45"
              }`}
            >
              <div className="space-y-5">
                <div className="flex justify-between items-center">
                  <Badge className="bg-primary/10 text-primary border-0 font-bold px-2.5 py-0.5">Asset Focus</Badge>
                  {decision === "buyout" && <CheckCircle2 className="h-5 w-5 text-primary" />}
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-extrabold text-foreground">PATH A: Sell or License IP</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Monetize your intellectual property directly. List concepts on the Mondial marketplace, receive asset buyout or licensing offers from institutional partners, and finalize deals without incorporation.
                  </p>
                </div>
                <div className="space-y-2 text-xs font-semibold text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary shrink-0" /> Fast liquidity timeline (4-6 weeks)
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary shrink-0" /> Zero administrative/legal overhead
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary shrink-0" /> Retain founder equity for next ventures
                  </div>
                </div>
              </div>
              <Button variant={decision === "buyout" ? "default" : "outline"} className="w-full mt-6 rounded-xl font-bold">
                Select Path A
              </Button>
            </Card>

            {/* PATH B: Build Company */}
            <Card
              onClick={() => {
                setDecision("build");
                setCrossroadsPath("build");
              }}
              className={`rounded-2xl border-2 p-6 flex flex-col justify-between min-h-[380px] cursor-pointer transition-all duration-300 ${
                decision === "build" ? "border-primary bg-primary/5 shadow-md" : "border-border bg-card hover:border-primary/45"
              }`}
            >
              <div className="space-y-5">
                <div className="flex justify-between items-center">
                  <Badge className="bg-success-light text-success-text border-0 font-bold px-2.5 py-0.5">Startup Focus</Badge>
                  {decision === "build" && <CheckCircle2 className="h-5 w-5 text-success-text" />}
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-extrabold text-foreground">PATH B: Build a Company</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Use your concept as the foundation for a scalable startup. Unlock institutional cap table tools, raise venture matching funds, build a founding team, and transition to a verified entrepreneur.
                  </p>
                </div>
                <div className="space-y-2 text-xs font-semibold text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-success-text shrink-0" /> Raise venture capital & angel matching
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-success-text shrink-0" /> Build long-term equity enterprise value
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-success-text shrink-0" /> Hire certified services & tech builders
                  </div>
                </div>
              </div>
              <Button variant={decision === "build" ? "default" : "outline"} className="w-full mt-6 rounded-xl font-bold bg-[#00A854] text-white hover:bg-[#00A854]/95 border-0">
                Select Path B
              </Button>
            </Card>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={() => { completeStep(5, 1); setActiveTab("valuation"); }} className="rounded-xl font-bold bg-primary text-white flex items-center gap-1.5">
              Next: AI IP Valuation <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* TAB 2: AI IP VALUATION */}
      {activeTab === "valuation" && (
        <div className="grid gap-6 lg:grid-cols-3 animate-in fade-in duration-200">
          <Card className="lg:col-span-2 rounded-xl border-border/70 bg-card shadow-sm p-6 space-y-6">
            <div className="space-y-2">
              <h3 className="font-bold text-foreground">Intellectual Property Valuation</h3>
              <p className="text-xs text-muted-foreground">Model asset valuation factors for marketplace buyout proposals.</p>
            </div>

            <div className="space-y-6 pt-3">
              {/* Valuation Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-muted-foreground">Target Buyout / IP Valuation ($)</span>
                  <span className="text-foreground font-bold">${buyoutPrice.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="50000"
                  max="500000"
                  step="10000"
                  value={buyoutPrice}
                  onChange={(e) => setBuyoutPrice(Number(e.target.value))}
                  className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* Parameters checklist */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Valuation Modifiers</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-semibold text-muted-foreground">
                  <div className="p-3.5 rounded-xl border border-border bg-muted/10 flex items-center gap-2">
                    <CheckCircle2 className="h-4.5 w-4.5 text-success-text shrink-0" /> Verified OCR Codebase
                  </div>
                  <div className="p-3.5 rounded-xl border border-border bg-muted/10 flex items-center gap-2">
                    <CheckCircle2 className="h-4.5 w-4.5 text-success-text shrink-0" /> Localized South Asian Datasets
                  </div>
                  <div className="p-3.5 rounded-xl border border-border bg-muted/10 flex items-center gap-2">
                    <CheckCircle2 className="h-4.5 w-4.5 text-success-text shrink-0" /> Biometric Identity Compliant
                  </div>
                  <div className="p-3.5 rounded-xl border border-border bg-muted/10 flex items-center gap-2">
                    <CheckCircle2 className="h-4.5 w-4.5 text-success-text shrink-0" /> High Market Potential Match
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-border/40">
              <Button onClick={() => { completeStep(5, 2); setActiveTab("marketplace"); }} className="rounded-xl font-bold bg-primary text-white flex items-center gap-1.5">
                Next: Marketplace Listing <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </Card>

          {/* AI valuation breakdown */}
          <Card className="rounded-xl border-border/70 bg-card shadow-sm p-6 flex flex-col justify-between">
            <div className="space-y-5">
              <span className="text-xs font-bold text-primary uppercase tracking-widest block">AI Appraisal</span>
              <div className="relative flex items-center justify-center my-3">
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-black text-foreground leading-none">${(buyoutPrice / 1000).toFixed(0)}k</span>
                  <span className="text-[9px] uppercase font-bold text-muted-foreground mt-1 tracking-wider">Midpoint value</span>
                </div>
                <svg className="h-32 w-32 transform -rotate-90">
                  <circle cx="64" cy="64" r="42" className="text-muted/10 stroke-current" strokeWidth="6" fill="transparent" />
                  <circle cx="64" cy="64" r="42" className="text-primary stroke-current" strokeWidth="6" strokeDasharray={2 * Math.PI * 42} strokeDashoffset={2 * Math.PI * 42 * 0.15} strokeLinecap="round" fill="transparent" />
                </svg>
              </div>
              <div className="space-y-2 text-xs leading-relaxed text-muted-foreground">
                <p>Based on our transactional analysis, similar invoice processing nodes sell between <span className="font-bold text-foreground">$85,000 - $145,000</span>.</p>
              </div>
            </div>
            <div className="p-3 bg-muted/35 rounded-xl border border-border/40 text-[10px] text-muted-foreground leading-relaxed">
              Final valuation depends on patent pending validation checks and NDA execution with potential corporate acquirers.
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: MARKETPLACE LISTING */}
      {activeTab === "marketplace" && (
        <div className="grid gap-6 md:grid-cols-3 animate-in fade-in duration-200">
          <Card className="md:col-span-2 rounded-xl border-border/70 bg-card shadow-sm p-6 space-y-6">
            <div className="space-y-2">
              <h3 className="font-bold text-foreground">Configure Marketplace Terms</h3>
              <p className="text-xs text-muted-foreground">List your project on Mondial's matchmaking marketplace for investor bid review.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 pt-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Buyout Reserve Price ($)</label>
                <Input
                  type="number"
                  value={buyoutPrice}
                  onChange={(e) => setBuyoutPrice(Number(e.target.value))}
                  className="rounded-xl text-xs bg-muted/40 border-border/80 focus-visible:ring-primary/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Equity Offerd for Seed Match (%)</label>
                <Input
                  type="number"
                  value={equityWanted}
                  onChange={(e) => setEquityWanted(Number(e.target.value))}
                  className="rounded-xl text-xs bg-muted/40 border-border/80 focus-visible:ring-primary/20"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-border/40">
              <Button onClick={() => setIsListed(true)} className="rounded-xl font-bold bg-primary text-white flex items-center gap-1.5">
                {isListed ? "Listed successfully! ✓" : "List on Marketplace"}
              </Button>
              {isListed && (
                <Button onClick={() => { completeStep(5, 3); setActiveTab("matchmaking"); }} className="rounded-xl font-bold bg-primary text-white flex items-center gap-1.5">
                  Next: Matchmaking <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </Card>

          <Card className="rounded-xl border-border/70 bg-card shadow-sm p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <span className="text-xs font-bold text-primary uppercase tracking-widest block">Marketplace Status</span>
              <h4 className="font-bold text-foreground leading-snug">Public / Matchmaking Visibility</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Once listed, accredited investors matched by Mondial's AI will see a redacted summary of your concept and valuation specs.
              </p>
            </div>
            {isListed ? (
              <div className="p-3 bg-success-light/20 rounded-xl border border-success-text/30 flex items-center gap-2 text-xs text-success-text font-bold">
                <Check className="h-4 w-4 shrink-0" /> Live on Marketplace
              </div>
            ) : (
              <div className="p-3 bg-muted/35 rounded-xl border border-border/40 flex items-center gap-2 text-xs text-muted-foreground font-bold">
                <Lock className="h-4 w-4 shrink-0" /> Not Listed Yet
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 4: SMART MATCHMAKING */}
      {activeTab === "matchmaking" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-foreground">Matched Capital Profiles</h3>
              <p className="text-xs text-muted-foreground">Accredited networks matched based on model specifications.</p>
            </div>
            <Badge className="bg-primary/10 text-primary border-0 font-bold px-2 py-0.5">3 Matches Found</Badge>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {matches.map((match) => (
              <Card key={match.name} className="rounded-xl border-border/70 bg-card shadow-sm p-5 flex flex-col justify-between min-h-[220px]">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm text-foreground">{match.name}</h4>
                      <span className="text-[10px] text-muted-foreground font-medium">{match.type}</span>
                    </div>
                    <Badge className="bg-success-light text-success-text border-0 font-bold text-[10px] px-2 py-0.5">{match.matchScore}% Match</Badge>
                  </div>
                  <div className="space-y-1 text-xs font-semibold text-muted-foreground">
                    <p>Target: <span className="text-foreground">{match.targetSector}</span></p>
                    <p>Focus: <span className="text-foreground">{match.focus}</span></p>
                  </div>
                </div>
                <Button className="w-full mt-4 rounded-lg text-xs font-bold bg-primary text-white">
                  Send Proposal Link
                </Button>
              </Card>
            ))}
          </div>
          <div className="flex justify-between items-center border-t border-border pt-6 mt-8">
            <Button variant="ghost" onClick={() => setActiveTab("marketplace")} className="text-xs font-semibold">
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
            </Button>
            <Button
              onClick={() => {
                completeStep(5, 4);
                setIsNavigating(true);
                advancePhase(5);
              }}
              className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold rounded-xl py-5 px-6 text-xs flex items-center gap-1.5"
            >
              Complete Crossroads & Unlock Smart Matchmaking <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
