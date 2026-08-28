"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Package,
  FileCheck,
  ShieldCheck,
  Download,
  Calendar,
  DollarSign,
  User,
  ExternalLink,
  Tag,
  CheckCircle2,
  TrendingUp,
  Layers,
  FileText,
  Palette,
  Target,
  Sparkles,
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  Lock,
  Building2,
  Briefcase,
  Users,
  Compass,
  Zap,
  Globe,
  Clock,
  HelpCircle,
  BarChart3,
  Check,
  PieChart,
  ListOrdered,
  Milestone,
  FileDown,
  ChevronDown,
  Pencil
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import marketplaceProjectsApi, {
  EquityDeal,
  PrivateMarketplaceProject,
  BuyoutSaleRecord,
  PrivateDocument
} from "@/lib/api-marketplace-projects";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  BarChart,
  Bar
} from "recharts";
import PlanForecastPrintView from "@/components/creator/PlanForecastPrintView";
import { ForecastView } from "@/components/creator/ai/ForecastView";
import type {
  BusinessPlanOutput,
  ForecastOutput,
  ForecastRevenueMonth,
  ForecastCostMonth,
  ForecastCashFlowMonth
} from "@/types/creator/ai";

interface AcquiredProjectWorkspaceProps {
  deal: EquityDeal;
  onViewAcquisitionRecord: () => void;
  backUrl?: string;
  backLabel?: string;
}

type SectionBadge = "auto_built_phase2" | "ai_researched" | "auto_built_43" | "auto_filled_31" | "used_in_phase5" | null;
const BADGE_LABEL: Record<NonNullable<SectionBadge>, string> = {
  auto_built_phase2: "Auto-built · Phase 2",
  ai_researched: "AI-researched",
  auto_built_43: "Auto-built · 4.3",
  auto_filled_31: "Auto-filled · 3.1",
  used_in_phase5: "Used in Phase 5",
};

interface DisplaySection {
  id: string;
  title: string;
  number: string;
  body: string;
  badge: SectionBadge;
  derivedSource?: string;
}

function buildSections(
  bp: BusinessPlanOutput | undefined,
  project: { problem: string; solution: string; targetUser: string; targetMarket?: string; creatorEdge?: string },
  cross: { hasForecast: boolean; hasGtm: boolean; youNeed: string[]; seedAsk: number | null }
): DisplaySection[] {
  const join = (...xs: (string | undefined)[]) => xs.filter(Boolean).join(" ");
  const sectionNum = (n: number) => String(n).padStart(2, "0");
  const opsOverview = bp?.operationsPlan?.overview ?? "";
  const risksContent = bp?.risks?.length
    ? bp.risks.map((r) => `${r.category ?? "Risk"}: ${r.description ?? ""}`).join("\n")
    : "";

  return [
    { id: "executive", number: sectionNum(1), title: "Executive Summary", body: bp?.executiveSummary?.overview ?? project.solution, badge: null },
    { id: "problem-solution", number: sectionNum(2), title: "Problem & Solution", body: join(project.problem, "—", project.solution), badge: "auto_built_phase2", derivedSource: "your clarified idea (Phase 2)" },
    { id: "target-market", number: sectionNum(3), title: "Target Market", body: join(project.targetUser, bp?.marketAnalysis?.overview || project.targetMarket), badge: "auto_built_phase2" },
    { id: "business-model", number: sectionNum(4), title: "Business Model", body: bp?.revenueModel?.summary ?? "", badge: null },
    { id: "competitive", number: sectionNum(5), title: "Competitive Landscape", body: bp?.competitorAnalysis?.overview ?? project.creatorEdge ?? "", badge: "ai_researched" },
    { id: "gtm", number: sectionNum(6), title: "Go-to-Market", body: bp?.goToMarket?.strategy ?? "", badge: cross.hasGtm ? "auto_built_43" : null },
    { id: "financials", number: sectionNum(7), title: "Financial Projections", body: cross.hasForecast ? "Bound to live forecast — revenue, costs, cash flow, and break-even." : "Financial forecast schedule.", badge: "auto_filled_31", derivedSource: "forecast" },
    { id: "team", number: sectionNum(8), title: "Team Needs", body: cross.youNeed.length ? `Key hires: ${cross.youNeed.join(", ")}.` : "Formation Generator team needs.", badge: null, derivedSource: "Formation Generator (3.4)" },
    { id: "funding", number: sectionNum(9), title: "Funding Requirements", body: cross.seedAsk ? `Target raise: €${cross.seedAsk.toLocaleString()}.` : "Venture seed funding allocation.", badge: cross.seedAsk ? "used_in_phase5" : null, derivedSource: "Phase 5 seed funding" },
    { id: "operations", number: sectionNum(10), title: "Operations & Milestones", body: opsOverview, badge: null, derivedSource: "operations plan" },
    { id: "risks", number: sectionNum(11), title: "Risk Register", body: risksContent, badge: null, derivedSource: "risk assessment" },
  ];
}

function Extras({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</h4>
      {children}
    </div>
  );
}

function Bullets({ items }: { items: string[] }) {
  return <ul className="list-disc pl-5 text-sm text-muted-foreground leading-relaxed space-y-0.5">{items.map((x, i) => <li key={i}>{x}</li>)}</ul>;
}

function SectionExtras({ id, bp }: { id: string; bp?: BusinessPlanOutput }) {
  if (!bp) return null;
  const blocks: React.ReactNode[] = [];
  const es = bp.executiveSummary,
    ma = bp.marketAnalysis,
    ca = bp.competitorAnalysis,
    rm = bp.revenueModel,
    gtm = bp.goToMarket,
    op = bp.operationsPlan,
    rk = bp.risks;

  if (id === "executive") {
    if (es?.valueProposition) blocks.push(<Extras key="vp" label="Value proposition"><p className="text-sm text-muted-foreground leading-relaxed">{es.valueProposition}</p></Extras>);
    if (es?.highlights?.length) blocks.push(<Extras key="hl" label="Highlights"><Bullets items={es.highlights} /></Extras>);
  } else if (id === "target-market") {
    if (ma?.targetSegments?.length) blocks.push(<Extras key="seg" label="Segments"><Bullets items={ma.targetSegments} /></Extras>);
    if (ma?.marketSizeQualitative) blocks.push(<Extras key="size" label="Market size"><p className="text-sm text-muted-foreground leading-relaxed">{ma.marketSizeQualitative}</p></Extras>);
    if (ma?.trends?.length) blocks.push(<Extras key="tr" label="Trends"><Bullets items={ma.trends} /></Extras>);
  } else if (id === "business-model") {
    if (rm?.revenueStreams?.length) blocks.push(<Extras key="rs" label="Revenue streams"><Bullets items={rm.revenueStreams.map((s) => [s.name, s.description].filter(Boolean).join(" — "))} /></Extras>);
    if (rm?.pricingStrategy) blocks.push(<Extras key="ps" label="Pricing strategy"><p className="text-sm text-muted-foreground leading-relaxed">{rm.pricingStrategy}</p></Extras>);
    if (rm?.keyMetrics?.length) blocks.push(<Extras key="km" label="Key metrics"><Bullets items={rm.keyMetrics} /></Extras>);
  } else if (id === "competitive") {
    if (ca?.competitors?.length) blocks.push(
      <Extras key="cmp" label="Competitors">
        <div className="space-y-2">
          {ca.competitors.map((c, i) => (
            <div key={i} className="rounded-lg border border-border p-3 space-y-0.5">
              <div className="text-sm font-semibold text-foreground">{c.name ?? "Competitor"}{c.positioning ? ` — ${c.positioning}` : ""}</div>
              {c.strengths?.length && <div className="text-xs text-muted-foreground"><span className="font-semibold">Strengths:</span> {c.strengths.join(", ")}</div>}
              {c.weaknesses?.length && <div className="text-xs text-muted-foreground"><span className="font-semibold">Weaknesses:</span> {c.weaknesses.join(", ")}</div>}
              {c.ourAdvantage && <div className="text-xs text-foreground"><span className="font-semibold">Our advantage:</span> {c.ourAdvantage}</div>}
            </div>
          ))}
        </div>
      </Extras>
    );
  } else if (id === "gtm") {
    if (gtm?.channels?.length) blocks.push(<Extras key="ch" label="Channels"><Bullets items={gtm.channels} /></Extras>);
    if (gtm?.phases?.length) blocks.push(<Extras key="ph" label="Phases"><Bullets items={gtm.phases.map((p) => [p.name, p.description].filter(Boolean).join(" — "))} /></Extras>);
  } else if (id === "operations") {
    if (op?.keyActivities?.length) blocks.push(<Extras key="act" label="Key Activities"><Bullets items={op.keyActivities} /></Extras>);
    if (op?.resources?.length) blocks.push(<Extras key="res" label="Resources"><Bullets items={op.resources} /></Extras>);
    if (op?.milestones?.length) blocks.push(
      <Extras key="ms" label="Milestones">
        <div className="space-y-1">
          {op.milestones.map((m, i) => (
            <p key={i} className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{m.title}</span>
              {m.timeframe ? ` (${m.timeframe})` : ""}
              {m.description ? ` — ${m.description}` : ""}
            </p>
          ))}
        </div>
      </Extras>
    );
  } else if (id === "risks") {
    if (rk?.length) blocks.push(
      <Extras key="rk" label="Risk Assessment Matrix">
        <div className="space-y-2">
          {rk.map((r, i) => (
            <div key={i} className="rounded-lg border border-border p-3 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground text-sm">{r.category || "Risk"}</span>
                {r.likelihood && <Badge variant="outline" className="text-[10px]">L: {r.likelihood}</Badge>}
              </div>
              {r.description && <p className="text-xs text-muted-foreground">{r.description}</p>}
              {r.mitigation && <p className="text-xs text-foreground"><span className="font-semibold">Mitigation:</span> {r.mitigation}</p>}
            </div>
          ))}
        </div>
      </Extras>
    );
  }

  if (blocks.length === 0) return null;
  return <div className="mt-3 space-y-3 border-t border-border/60 pt-3">{blocks}</div>;
}

function mapAcquiredBusinessPlanToCreatorOutput(project: PrivateMarketplaceProject): BusinessPlanOutput {
  const bp = project.businessPlan;
  return {
    schemaVersion: 1,
    executiveSummary: {
      overview: bp.executiveSummary || project.solution || bp.summary || undefined,
      valueProposition: bp.valueProposition || undefined,
      highlights: bp.highlights?.length ? bp.highlights : undefined,
    },
    marketAnalysis: {
      overview: bp.marketOpportunity || project.targetMarket || undefined,
      targetSegments: bp.targetSegments?.length ? bp.targetSegments : (project.targetUser ? [project.targetUser] : undefined),
      marketSizeQualitative: bp.marketSizeQualitative || undefined,
      trends: bp.trends?.length ? bp.trends : undefined,
    },
    competitorAnalysis: {
      overview: project.creatorEdge ? `Differentiation: ${project.creatorEdge}` : undefined,
      competitors: bp.competitors?.map((c) => ({
        name: c.name,
        positioning: c.positioning || undefined,
        strengths: c.strengths?.length ? c.strengths : undefined,
        weaknesses: c.weaknesses?.length ? c.weaknesses : undefined,
        ourAdvantage: c.ourAdvantage || undefined,
      })) || (project.existingAlternatives ? [{
        name: project.existingAlternatives,
        positioning: "Alternative Solution",
        strengths: ["Established user base"],
        weaknesses: ["Lack of automation"],
        ourAdvantage: project.creatorEdge || project.marketGap || "Proprietary modern platform",
      }] : undefined),
    },
    revenueModel: {
      summary: bp.revenueModel || project.pricing?.pricingModel || undefined,
      revenueStreams: bp.revenueStreams?.map((r) => ({
        name: r.name,
        description: r.description || undefined,
      })) || undefined,
      pricingStrategy: bp.pricingStrategy || (project.pricing?.pricingModel ? `Model: ${project.pricing.pricingModel}` : undefined),
      keyMetrics: bp.keyMetrics?.length ? bp.keyMetrics : undefined,
    },
    goToMarket: {
      strategy: bp.gtmStrategy || (project.gtmPlan?.primaryChannels?.length ? `Multi-channel acquisition strategy across ${project.gtmPlan.primaryChannels.join(", ")}` : undefined),
      channels: bp.gtmChannels?.length ? bp.gtmChannels : project.gtmPlan?.primaryChannels,
      phases: bp.gtmPhases?.map((p) => ({
        name: p.name,
        description: p.description || undefined,
      })) || undefined,
    },
    operationsPlan: {
      overview: (project.resourcePlan?.teamRolesNeeded?.length ? `Core execution team requiring ${project.resourcePlan.teamRolesNeeded.join(", ")}` : undefined),
      keyActivities: bp.keyActivities?.length ? bp.keyActivities : undefined,
      resources: bp.resources?.length ? bp.resources : project.resourcePlan?.teamRolesNeeded,
      milestones: bp.milestones?.map((m) => ({
        title: m.deliverable || m.phase,
        timeframe: m.timeframe || undefined,
        description: m.phase ? `Phase: ${m.phase}` : undefined,
      })) || undefined,
    },
    risks: bp.risks?.map((r) => ({
      category: r.category,
      description: r.risk,
      mitigation: r.mitigation,
      likelihood: "Medium",
      impact: "Moderate",
    })) || (project.riskiestAssumption ? [{
      category: "Assumption Risk",
      description: project.riskiestAssumption,
      mitigation: "Validation testing and milestone tracking",
      likelihood: "Medium",
      impact: "Moderate",
    }] : undefined),
  };
}

function mapAcquiredForecastToCreatorOutput(project: PrivateMarketplaceProject): ForecastOutput {
  const f = project.financialForecast;
  const currency = f.currency || "EUR";

  let revenueMonthly: ForecastRevenueMonth[] = [];
  if (f.revenueMonthly?.length) {
    revenueMonthly = f.revenueMonthly.map((m) => ({
      month: m.month,
      amount: m.amount,
      notes: m.notes || undefined,
    }));
  }

  let costMonthly: ForecastCostMonth[] = [];
  if (f.costMonthly?.length) {
    costMonthly = f.costMonthly.map((m) => ({
      month: m.month,
      fixedCosts: m.fixedCosts,
      variableCosts: m.variableCosts,
      notes: m.notes || undefined,
    }));
  }

  let cashFlowMonthly: ForecastCashFlowMonth[] = [];
  if (f.cashFlowMonthly?.length) {
    cashFlowMonthly = f.cashFlowMonthly.map((m) => ({
      month: m.month,
      netCashFlow: m.netCashFlow,
      endingBalance: m.endingBalance,
      notes: m.notes || undefined,
    }));
  }

  if (!revenueMonthly.length && (f.projectedArr || f.arpu || f.tam)) {
    const startRev = f.projectedArr ? Math.round(f.projectedArr / 24) : 2500;
    const growth = (f.monthlyGrowthPct || 10) / 100;
    const monthlyOpex = project.resourcePlan?.monthlyRunningCost || 2000;
    let balance = project.resourcePlan?.launchBudgetMax || 25000;

    for (let m = 1; m <= 12; m++) {
      const revAmount = Math.round(startRev * Math.pow(1 + growth, m - 1));
      const fixed = Math.round(monthlyOpex * 0.7);
      const variable = Math.round(monthlyOpex * 0.3 + revAmount * 0.08);
      const net = revAmount - (fixed + variable);
      balance += net;

      revenueMonthly.push({ month: m, amount: revAmount, notes: m === 1 ? "Launch" : undefined });
      costMonthly.push({ month: m, fixedCosts: fixed, variableCosts: variable, notes: undefined });
      cashFlowMonthly.push({ month: m, netCashFlow: net, endingBalance: balance, notes: undefined });
    }
  }

  const isAchieved =
    f.breakEvenMonth !== null &&
    f.breakEvenMonth !== undefined &&
    f.breakEvenMonth > 0 &&
    f.breakEvenMonth <= (revenueMonthly.length || 12);

  return {
    schemaVersion: 1,
    aiMonthCount: revenueMonthly.length,
    revenueForecast: {
      currency,
      summary: f.revenueSummary || `12-month revenue trajectory targeting €${(f.projectedArr || 0).toLocaleString()} ARR.`,
      monthly: revenueMonthly,
    },
    costForecast: {
      currency,
      summary: f.costSummary || `Operating expenditures across infrastructure, team, and marketing.`,
      monthly: costMonthly,
    },
    cashFlowProjection: {
      currency,
      summary: f.cashFlowSummary || `Cumulative runway and cash flow balancing.`,
      monthly: cashFlowMonthly,
    },
    breakEvenAnalysis: {
      breakEvenMonth: f.breakEvenMonth || undefined,
      summary: f.breakEvenSummary || (isAchieved ? `Break-even achieved at Month ${f.breakEvenMonth}.` : "Break-even projected beyond initial forecast horizon."),
      isAchievedWithinHorizon: isAchieved,
    },
    assumptions: f.assumptions?.length ? f.assumptions : [
      `TAM benchmarked at €${(f.tam || 0).toLocaleString()}`,
      `Target ARPU of €${(f.arpu || 0).toLocaleString()} per unit/subscriber`,
      `Target monthly compound growth of ${f.monthlyGrowthPct || 10}%`,
    ],
    risks: f.risks?.map((r) => ({
      category: r.category,
      description: r.risk,
      likelihood: "Medium",
      mitigation: r.mitigation,
    })) || [
      {
        category: "Market Adoption",
        description: "Customer acquisition cost may exceed initial target during early launch.",
        likelihood: "Medium",
      },
    ],
  };
}

function toChartData(output?: ForecastOutput) {
  const rev = output?.revenueForecast?.monthly ?? [];
  const cost = output?.costForecast?.monthly ?? [];
  const cash = output?.cashFlowProjection?.monthly ?? [];
  const months = Math.max(rev.length, cost.length, cash.length);
  return Array.from({ length: months }, (_, i) => ({
    name: `M${i + 1}`,
    Revenue: rev[i]?.amount ?? null,
    Cost: cost[i] != null ? (cost[i].fixedCosts ?? 0) + (cost[i].variableCosts ?? 0) : null,
    Cashflow: cash[i]?.netCashFlow ?? null,
  }));
}

export const AcquiredProjectWorkspace: React.FC<AcquiredProjectWorkspaceProps> = ({
  deal,
  onViewAcquisitionRecord,
  backUrl = "/dashboard/entrepreneur/acquisitions",
  backLabel = "Back to My Acquisitions",
}) => {
  const [projectData, setProjectData] = useState<PrivateMarketplaceProject | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingDocId, setDownloadingDocId] = useState<string | null>(null);
  const [showExport, setShowExport] = useState<boolean>(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["executive", "problem-solution", "target-market", "business-model", "competitive", "gtm", "financials", "team", "funding", "operations", "risks"])
  );
  const [activeTab, setActiveTab] = useState<
    "overview" | "intelligence" | "business-plan" | "forecast" | "pricing-gtm" | "brand" | "documents"
  >("overview");

  const loadProject = async () => {
    if (!deal.ideaId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await marketplaceProjectsApi.getPrivateProject(deal.ideaId);
      setProjectData(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to load acquired project intelligence.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProject();
  }, [deal.ideaId]);

  const handleDownloadDoc = async (docId: string, filename: string) => {
    if (!deal.ideaId) return;
    try {
      setDownloadingDocId(docId);
      const blob = await marketplaceProjectsApi.downloadDocument(deal.ideaId, docId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename || "document.pdf";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(err?.message || "Failed to download document.");
    } finally {
      setDownloadingDocId(null);
    }
  };

  const saleRecord = deal.buyoutSaleRecord;
  const purchasePrice =
    saleRecord?.purchasePrice ??
    deal.buyoutClosing?.purchasePrice ??
    deal.buyoutTerms?.purchasePrice ??
    0;
  const currency =
    saleRecord?.currency ??
    deal.buyoutClosing?.currency ??
    deal.buyoutTerms?.currency ??
    "EUR";
  const soldAt = saleRecord?.soldAt || deal.updatedAt || deal.createdAt;

  const adaptedBusinessPlan = useMemo(() => {
    if (!projectData) return null;
    return mapAcquiredBusinessPlanToCreatorOutput(projectData);
  }, [projectData]);

  const adaptedForecast = useMemo(() => {
    if (!projectData) return null;
    return mapAcquiredForecastToCreatorOutput(projectData);
  }, [projectData]);

  const chartData = useMemo(() => {
    return toChartData(adaptedForecast || undefined);
  }, [adaptedForecast]);

  const displaySections = useMemo(() => {
    if (!projectData) return [];
    const projectSummary = {
      problem: projectData.problem || "",
      solution: projectData.solution || "",
      targetUser: projectData.targetUser || "",
      targetMarket: projectData.targetMarket,
      creatorEdge: projectData.creatorEdge,
    };
    const crossData = {
      hasForecast: !!projectData.financialForecast?.available,
      hasGtm: !!projectData.gtmPlan?.available,
      youNeed: projectData.intelligence?.formation?.youNeed?.map((n) => n.label) || projectData.resourcePlan?.teamRolesNeeded || [],
      seedAsk: projectData.resourcePlan?.launchBudgetMax || null,
    };
    return buildSections(adaptedBusinessPlan || undefined, projectSummary, crossData);
  }, [projectData, adaptedBusinessPlan]);

  const lastMonthRev = adaptedForecast?.revenueForecast?.monthly?.slice(-1)?.[0]?.amount ?? 0;
  const year3Arr = (lastMonthRev * 12) || projectData?.financialForecast?.projectedArr || 0;
  const growthPct = projectData?.financialForecast?.monthlyGrowthPct ?? 10;
  const breakEvenMonth = projectData?.financialForecast?.breakEvenMonth ?? 8;
  const lastMonthCash = adaptedForecast?.cashFlowProjection?.monthly?.slice(-1)?.[0]?.netCashFlow ?? 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 text-foreground font-sans">
      {/* EXPORT OVERLAY VIEW (PRINT/PDF) */}
      <PlanForecastPrintView
        open={showExport}
        onClose={() => setShowExport(false)}
        projectName={projectData?.projectName || deal.projectName || "Acquired Project"}
        project={{
          problem: projectData?.problem || "",
          solution: projectData?.solution || "",
          targetUser: projectData?.targetUser || "",
        }}
        plan={adaptedBusinessPlan}
        forecast={adaptedForecast}
        forecastInputs={{
          arpu: projectData?.financialForecast?.arpu,
          opex: projectData?.resourcePlan?.monthlyRunningCost,
          monthlyGrowthPct: projectData?.financialForecast?.monthlyGrowthPct,
          tam: projectData?.financialForecast?.tam,
          monthlyChurnPct: 3,
        }}
        cross={{
          youNeed: projectData?.intelligence?.formation?.youNeed?.map((n) => n.label) || projectData?.resourcePlan?.teamRolesNeeded || [],
          seedAsk: projectData?.resourcePlan?.launchBudgetMax || null,
        }}
      />

      {/* TOP BAR / BREADCRUMB */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="gap-2 text-xs text-muted-foreground hover:text-foreground w-fit"
        >
          <Link href={backUrl}>
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onViewAcquisitionRecord}
            className="gap-2 text-xs font-semibold border-border bg-background hover:bg-muted"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            View Acquisition Record &amp; Handover
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={loadProject}
            disabled={loading}
            className="gap-2 text-xs border-border bg-background hover:bg-muted"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* SOLD HERO HEADER */}
      <Card className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <Badge className="bg-success-light text-success-strong border-success-strong/30 text-xs font-bold uppercase tracking-wider px-3 py-0.5 rounded-full">
                Acquired Project
              </Badge>
              {saleRecord?.auditReference && (
                <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                  Ref: {saleRecord.auditReference}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight font-syne">
              {deal.projectName || projectData?.projectName || "Acquired Venture"}
            </h1>
            {projectData?.tagline && (
              <p className="text-sm text-muted-foreground font-medium max-w-2xl">
                {projectData.tagline}
              </p>
            )}
          </div>

          {/* QUICK METRICS */}
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <div className="p-3 bg-background border border-border rounded-xl text-right">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                Purchase Price
              </span>
              <span className="text-lg font-extrabold text-foreground">
                €{purchasePrice.toLocaleString()} {currency}
              </span>
            </div>

            <div className="p-3 bg-background border border-border rounded-xl text-right">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                Acquisition Date
              </span>
              <span className="text-xs font-bold text-foreground">
                {new Date(soldAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
              </span>
            </div>
          </div>
        </div>

        {/* METADATA STRIP */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-3 border-t border-border text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-primary shrink-0" />
            <span>
              Previous Creator: <strong className="text-foreground">{deal.creatorName || saleRecord?.sellerName || "Creator"}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-primary shrink-0" />
            <span>
              Sector: <strong className="text-foreground">{projectData?.sector || "General"}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary shrink-0" />
            <span>
              Geography: <strong className="text-foreground">{projectData?.geography || projectData?.country || "Global"}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-success-strong shrink-0" />
            <span>
              Transferred Assets: <strong className="text-foreground">{saleRecord?.transferredAssets?.length || deal.buyoutHandover?.assets?.length || 0} Deliverables</strong>
            </span>
          </div>
        </div>
      </Card>

      {/* ERROR STATE */}
      {error && (
        <Card className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-center justify-between">
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={loadProject} className="text-xs">
            Retry
          </Button>
        </Card>
      )}

      {/* MAIN PROJECT NAVIGATION TABS */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-border text-xs font-semibold scrollbar-none">
        {[
          { id: "overview", label: "Overview", icon: Layers },
          { id: "intelligence", label: "Project Intelligence", icon: Sparkles },
          { id: "business-plan", label: "Business Plan", icon: FileText },
          { id: "forecast", label: "Financial Forecast", icon: TrendingUp },
          { id: "pricing-gtm", label: "Pricing & GTM", icon: Target },
          { id: "brand", label: "Brand & Assets", icon: Palette },
          { id: "documents", label: "Project Documents", icon: FileCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-t-xl transition-all border-b-2 whitespace-nowrap ${
                isActive
                  ? "border-primary text-primary bg-primary/5 font-bold"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* LOADING SPINNER */}
      {loading && (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <RefreshCw className="h-7 w-7 animate-spin text-primary" />
          <p className="text-sm font-medium">Loading acquired project details...</p>
        </div>
      )}

      {!loading && (
        <>
          {/* ======================================================== */}
          {/* TAB 1: OVERVIEW */}
          {/* ======================================================== */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* CORE PROBLEM / SOLUTION / AUDIENCE */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-border">
                    <Target className="h-5 w-5 text-primary" />
                    <h3 className="text-base font-bold text-foreground font-syne">The Problem</h3>
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
                    {projectData?.problem || "No problem statement recorded."}
                  </p>
                </Card>

                <Card className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-border">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <h3 className="text-base font-bold text-foreground font-syne">The Solution</h3>
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
                    {projectData?.solution || "No solution description recorded."}
                  </p>
                </Card>

                <Card className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-border">
                    <User className="h-5 w-5 text-primary" />
                    <h3 className="text-base font-bold text-foreground font-syne">Target User &amp; Market</h3>
                  </div>
                  <div className="space-y-2 text-sm text-foreground/90 leading-relaxed">
                    <p><strong>Target User:</strong> {projectData?.targetUser || "General audience / market."}</p>
                    {projectData?.targetMarket && (
                      <p><strong>Target Market:</strong> {projectData.targetMarket}</p>
                    )}
                    {projectData?.concept && (
                      <p><strong>Concept Detail:</strong> {projectData.concept}</p>
                    )}
                  </div>
                </Card>

                <Card className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-border">
                    <ShieldCheck className="h-5 w-5 text-success-strong" />
                    <h3 className="text-base font-bold text-foreground font-syne">Acquisition Invariants</h3>
                  </div>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success-strong shrink-0" />
                      <span>Intellectual property &amp; deliverables transferred to buyer.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success-strong shrink-0" />
                      <span>Independent project asset (not automatically bound to company Cap Table).</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success-strong shrink-0" />
                      <span>Full historical transaction and signing package sealed permanently.</span>
                    </div>
                  </div>
                </Card>
              </div>

              {/* STRATEGIC DIFFERENTIATION & FOUNDATION */}
              <Card className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
                <h3 className="text-base font-bold font-syne text-foreground">Strategic Foundation &amp; Validation</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 bg-background border border-border rounded-xl space-y-1.5">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Creator Edge</span>
                    <p className="text-sm font-semibold text-foreground">{projectData?.creatorEdge || projectData?.businessPlan?.competitiveAdvantage || "Proprietary execution advantage."}</p>
                  </div>
                  <div className="p-4 bg-background border border-border rounded-xl space-y-1.5">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Market Gap</span>
                    <p className="text-sm font-semibold text-foreground">{projectData?.marketGap || "Underserved market opportunity."}</p>
                  </div>
                  <div className="p-4 bg-background border border-border rounded-xl space-y-1.5">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Existing Alternatives</span>
                    <p className="text-sm font-semibold text-foreground">{projectData?.existingAlternatives || "Legacy/manual workflows."}</p>
                  </div>
                  <div className="p-4 bg-background border border-border rounded-xl space-y-1.5">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Why Now</span>
                    <p className="text-sm font-semibold text-foreground">{projectData?.whyNow || "Market readiness and regulatory shifts."}</p>
                  </div>
                  <div className="p-4 bg-background border border-border rounded-xl space-y-1.5">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Riskiest Assumption</span>
                    <p className="text-sm font-semibold text-foreground">{projectData?.riskiestAssumption || "Initial customer adoption speed."}</p>
                  </div>
                  <div className="p-4 bg-background border border-border rounded-xl space-y-1.5">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Category &amp; Stage</span>
                    <p className="text-sm font-semibold text-foreground">{projectData?.category || "Technology"} • {projectData?.stage || "Concept"}</p>
                  </div>
                </div>

                {projectData?.tags && projectData.tags.length > 0 && (
                  <div className="pt-2">
                    <span className="text-xs font-bold text-muted-foreground block mb-2">Project Tags:</span>
                    <div className="flex flex-wrap gap-2">
                      {projectData.tags.map((tag, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs font-semibold px-2.5 py-0.5">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: PROJECT INTELLIGENCE */}
          {/* ======================================================== */}
          {activeTab === "intelligence" && (
            <div className="space-y-6">
              {/* INVESTOR READINESS SCORE BREAKDOWN */}
              {projectData?.intelligence?.investorReadiness && (
                <Card className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      <h3 className="text-base font-bold text-foreground font-syne">Investor Readiness Evaluation</h3>
                    </div>
                    <Badge className="bg-primary/10 text-primary border-primary/30 text-xs font-bold">
                      {projectData.intelligence.investorReadiness.label || "Evaluated"} (Score: {projectData.intelligence.investorReadiness.total}/100)
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="p-3 bg-background border border-border rounded-xl text-center">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block">Concept Clarity</span>
                      <span className="text-lg font-bold text-foreground mt-1 block">
                        {projectData.intelligence.investorReadiness.conceptClarity}%
                      </span>
                    </div>
                    <div className="p-3 bg-background border border-border rounded-xl text-center">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block">Market Evidence</span>
                      <span className="text-lg font-bold text-foreground mt-1 block">
                        {projectData.intelligence.investorReadiness.marketEvidence}%
                      </span>
                    </div>
                    <div className="p-3 bg-background border border-border rounded-xl text-center">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block">Financial Model</span>
                      <span className="text-lg font-bold text-foreground mt-1 block">
                        {projectData.intelligence.investorReadiness.financialModel}%
                      </span>
                    </div>
                    <div className="p-3 bg-background border border-border rounded-xl text-center">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block">Legal Readiness</span>
                      <span className="text-lg font-bold text-foreground mt-1 block">
                        {projectData.intelligence.investorReadiness.legalReadiness}%
                      </span>
                    </div>
                    <div className="p-3 bg-background border border-border rounded-xl text-center">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block">Team Credibility</span>
                      <span className="text-lg font-bold text-foreground mt-1 block">
                        {projectData.intelligence.investorReadiness.teamCredibility}%
                      </span>
                    </div>
                  </div>
                </Card>
              )}

              {/* MARKET & COMPETITIVE ANALYSIS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-3">
                  <h3 className="text-sm font-bold text-foreground font-syne uppercase tracking-wider text-primary">
                    Market Opportunity
                  </h3>
                  <p className="text-sm text-foreground/90 leading-relaxed">
                    {projectData?.businessPlan?.marketOpportunity || projectData?.targetMarket || "Market analysis and validation data recorded during project development."}
                  </p>
                </Card>

                <Card className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-3">
                  <h3 className="text-sm font-bold text-foreground font-syne uppercase tracking-wider text-primary">
                    Competitive Advantage
                  </h3>
                  <p className="text-sm text-foreground/90 leading-relaxed">
                    {projectData?.businessPlan?.competitiveAdvantage || projectData?.creatorEdge || "Unique differentiation and Creator edge developed for this venture."}
                  </p>
                </Card>
              </div>

              {/* COMPANY FORMATION & CO-FOUNDER INTELLIGENCE */}
              {projectData?.intelligence?.formation && (
                <Card className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-border">
                    <Building2 className="h-5 w-5 text-primary" />
                    <h3 className="text-base font-bold text-foreground font-syne">Corporate Formation &amp; Skill Analysis</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 bg-background border border-border rounded-xl space-y-2">
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Recommended Entity</span>
                      <p className="text-sm font-bold text-foreground">{projectData.intelligence.formation.recommendedType || "SAS / SARL"}</p>
                      <p className="text-muted-foreground">{projectData.intelligence.formation.recommendationReason || "Standard corporate structure for venture scaling."}</p>
                    </div>

                    {projectData.intelligence.formation.cofounderDraft && (
                      <div className="p-4 bg-background border border-border rounded-xl space-y-2">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">Co-Founder Preferences</span>
                        <p className="text-sm font-bold text-foreground">Role Needed: {projectData.intelligence.formation.cofounderDraft.roleNeeded || "Technical / Marketing"}</p>
                        <p className="text-muted-foreground">Equity Range: {projectData.intelligence.formation.cofounderDraft.equityRange || "10% - 25%"} • Location: {projectData.intelligence.formation.cofounderDraft.locationPreference || "Remote / Hybrid"}</p>
                      </div>
                    )}
                  </div>

                  {projectData.intelligence.formation.options && projectData.intelligence.formation.options.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <span className="text-xs font-bold text-muted-foreground block">Evaluated Formation Options:</span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {projectData.intelligence.formation.options.map((opt, idx) => (
                          <div key={idx} className="p-3 bg-background border border-border rounded-xl space-y-1 text-xs">
                            <span className="font-bold text-foreground block">{opt.code}</span>
                            <p className="text-[11px] text-muted-foreground">{opt.description}</p>
                            <div className="text-[11px] text-foreground font-medium pt-1">
                              Capital: {opt.capital} • Time: {opt.formationTime}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              )}

              {/* LEGAL COMPLIANCE CHECKLIST */}
              {projectData?.intelligence?.legalChecklist?.items && projectData.intelligence.legalChecklist.items.length > 0 && (
                <Card className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <div className="flex items-center gap-2">
                      <FileCheck className="h-5 w-5 text-primary" />
                      <h3 className="text-base font-bold text-foreground font-syne">Legal &amp; Regulatory Checklist</h3>
                    </div>
                    <span className="text-xs font-bold text-muted-foreground">
                      {projectData.intelligence.legalChecklist.completedCount} of {projectData.intelligence.legalChecklist.totalCount} Completed
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {projectData.intelligence.legalChecklist.items.map((item, idx) => (
                      <div key={idx} className="p-3 bg-background border border-border rounded-xl flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2 className={`h-4 w-4 shrink-0 ${item.status === "done" ? "text-success-strong" : "text-muted-foreground"}`} />
                          <div>
                            <span className="font-semibold text-foreground block">{item.label}</span>
                            <span className="text-[10px] text-muted-foreground">{item.category} {item.spSpecialty ? `• ${item.spSpecialty}` : ""}</span>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[10px] font-semibold">
                          {item.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: BUSINESS PLAN (100% CANONICAL CREATOR 11-SECTION LAYOUT) */}
          {/* ======================================================== */}
          {activeTab === "business-plan" && (
            <div className="space-y-6">
              {!adaptedBusinessPlan || (!projectData?.businessPlan?.available && !projectData?.solution) ? (
                <Card className="p-12 text-center border-dashed border-border bg-card rounded-2xl space-y-2">
                  <p className="text-sm font-semibold text-foreground">No Business Plan data available.</p>
                  <p className="text-xs text-muted-foreground">The purchased project does not have a formal business plan document attached.</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {/* DOCUMENT PREVIEW / EXPORT BAR */}
                  <Card className="rounded-2xl border border-border bg-card p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-sm text-foreground">{projectData.projectName || deal.projectName} — Business Plan</h3>
                          <p className="text-xs text-muted-foreground mt-1">Read-Only Acquired Document • Sealed Output • Complete 11 Sections</p>
                        </div>
                      </div>
                      <div className="flex gap-3 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowExport(true)}
                          className="flex items-center gap-1.5 text-xs font-semibold border-border bg-background hover:bg-muted"
                        >
                          <FileDown className="h-4 w-4" /> Download Report
                        </Button>
                      </div>
                    </div>
                  </Card>

                  {/* 11 CANONICAL BUSINESS PLAN SECTIONS */}
                  <div className="space-y-3">
                    {displaySections.map((s) => {
                      const isExpanded = expandedSections.has(s.id);
                      const toggleExpanded = () => {
                        const next = new Set(expandedSections);
                        if (isExpanded) next.delete(s.id);
                        else next.add(s.id);
                        setExpandedSections(next);
                      };

                      return (
                        <Card key={s.id} className="rounded-2xl border border-border bg-card overflow-hidden">
                          <button
                            onClick={toggleExpanded}
                            className="w-full p-5 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1 text-left">
                              <ChevronDown className={`h-5 w-5 text-muted-foreground shrink-0 transition-transform ${isExpanded ? "" : "-rotate-90"}`} />
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-bold text-sm">
                                  <span className="text-muted-foreground">{s.number}</span> {s.title}
                                </h3>
                                {s.badge && (
                                  <Badge variant="outline" className="gap-1 text-[10px]">
                                    <Sparkles className="h-3 w-3" /> {BADGE_LABEL[s.badge]}
                                  </Badge>
                                )}
                                <Badge variant="outline" className="gap-1 text-[10px] text-muted-foreground">
                                  <Lock className="h-3 w-3" /> Read-Only
                                </Badge>
                              </div>
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="px-5 pb-5 space-y-3 border-t border-border pt-4">
                              {s.body && (
                                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                                  {s.body}
                                </p>
                              )}
                              <SectionExtras id={s.id} bp={adaptedBusinessPlan} />
                            </div>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: FINANCIAL FORECAST (100% CANONICAL CREATOR RECHARTS & FORECASTVIEW) */}
          {/* ======================================================== */}
          {activeTab === "forecast" && (
            <div className="space-y-6">
              {!adaptedForecast || !projectData?.financialForecast?.available ? (
                <Card className="p-12 text-center border-dashed border-border bg-card rounded-2xl space-y-2">
                  <p className="text-sm font-semibold text-foreground">No Financial Forecast available.</p>
                  <p className="text-xs text-muted-foreground">The seller did not attach a financial projection model to this project concept.</p>
                </Card>
              ) : (
                <div className="space-y-6">
                  {/* TOP HEADER & EXPORT ACTION */}
                  <div className="flex items-start justify-between gap-4 pb-2 border-b border-border">
                    <div>
                      <h3 className="font-bold text-lg font-syne text-foreground">Your 3-Year Financial Forecast</h3>
                      <p className="text-sm text-muted-foreground">
                        Projection based on subscription growth and operational scaling data. Set to 95% confidence.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowExport(true)}
                      className="gap-2 shrink-0 text-xs font-semibold border-border bg-background hover:bg-muted"
                    >
                      <FileDown className="h-4 w-4" /> Download Report
                    </Button>
                  </div>

                  {/* 3 CREATOR SUMMARY CARDS WITH LIVE RECHARTS */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Revenue Growth Card */}
                    <Card className="rounded-2xl border border-border/60 bg-card p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Revenue Growth</p>
                          <p className="text-2xl font-bold mt-2">€{Math.round(year3Arr).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold text-primary">3 Year Forecast</p>
                          <p className="text-sm font-bold text-primary">{growthPct}% MoM</p>
                        </div>
                      </div>
                      <div className="h-20 w-full mb-3">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData.slice(-12)} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                            <defs>
                              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="0" vertical={false} horizontal={false} />
                            <XAxis dataKey="name" hide />
                            <YAxis hide />
                            <Tooltip
                              formatter={(v) => (v != null ? `€${Number(v).toLocaleString()}` : "")}
                              contentStyle={{ background: "var(--card)", borderColor: "var(--border)", borderRadius: "8px", fontSize: "12px" }}
                            />
                            <Area type="monotone" dataKey="Revenue" stroke="var(--primary)" strokeWidth={2} fill="url(#revGrad)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                      <p className="text-xs text-muted-foreground">Projected growth based on {growthPct}% MoM subscriber acquisition increase.</p>
                    </Card>

                    {/* Cost vs Revenue - Break-even Point Card */}
                    <Card className="rounded-2xl border border-border/60 bg-card p-6">
                      <div className="mb-4">
                        <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Cost vs Revenue</p>
                        <p className="text-2xl font-bold mt-2">Break-even Point</p>
                      </div>
                      <div className="h-20 w-full mb-3 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData.slice(0, 20)} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="0" vertical={false} horizontal={false} />
                            <XAxis dataKey="name" hide />
                            <YAxis hide />
                            <Tooltip
                              formatter={(v) => (v != null ? `€${Number(v).toLocaleString()}` : "")}
                              contentStyle={{ background: "var(--card)", borderColor: "var(--border)", borderRadius: "8px", fontSize: "12px" }}
                            />
                            <Legend wrapperStyle={{ paddingTop: "8px", fontSize: "12px" }} />
                            <Line type="monotone" dataKey="Revenue" stroke="var(--primary)" strokeWidth={2} dot={false} />
                            <Line type="monotone" dataKey="Cost" stroke="var(--destructive)" strokeWidth={2} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">Profit Month {breakEvenMonth}</span>
                        <br />Operationally leaner structure expected after break-even at Month {breakEvenMonth}.
                      </p>
                    </Card>

                    {/* Cash Flow (Year 3) Card */}
                    <Card className="rounded-2xl border border-border/60 bg-card p-6">
                      <div className="mb-4">
                        <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Cashflow (Year : 3)</p>
                        <p className="text-2xl font-bold mt-2">€{Math.round(lastMonthCash).toLocaleString()}</p>
                      </div>
                      <div className="h-20 w-full mb-3">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData.slice(-8)} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="0" vertical={false} horizontal={false} />
                            <XAxis dataKey="name" hide />
                            <YAxis hide />
                            <Tooltip
                              formatter={(v) => (v != null ? `€${Number(v).toLocaleString()}` : "")}
                              contentStyle={{ background: "var(--card)", borderColor: "var(--border)", borderRadius: "8px", fontSize: "12px" }}
                            />
                            <Bar dataKey="Revenue" fill="var(--destructive)" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Cashflow" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <p className="text-xs text-muted-foreground">Burn rate stabilizes as revenue scales towards positive ending balance.</p>
                    </Card>
                  </div>

                  {/* INPUTS USED STRIP */}
                  <Card className="rounded-2xl border border-border bg-card p-4">
                    <div className="text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">Inputs used:</span>{" "}
                      ARPU €{projectData.financialForecast.arpu ?? "—"}/mo · OPEX €{projectData.resourcePlan?.monthlyRunningCost ?? "—"}/mo · Growth{" "}
                      {projectData.financialForecast.monthlyGrowthPct ?? "—"}%/mo · TAM €{(projectData.financialForecast.tam ?? 0).toLocaleString()} · Churn 3%/mo
                    </div>
                  </Card>

                  {/* CANONICAL CONSOLIDATED TABLE + BREAK-EVEN + ASSUMPTIONS + RISKS */}
                  <ForecastView output={adaptedForecast} />
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 5: PRICING & GTM */}
          {/* ======================================================== */}
          {activeTab === "pricing-gtm" && (
            <div className="space-y-6">
              {/* PRICING TIERS */}
              {projectData?.pricing?.tiers && projectData.pricing.tiers.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold font-syne text-foreground">Pricing Strategy &amp; Commercial Tiers</h3>
                    <Badge variant="outline" className="text-xs uppercase font-bold tracking-wider">
                      Model: {projectData.pricing.pricingModel || "Tiered"}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                    {projectData.pricing.tiers.map((tier: any, idx: number) => (
                      <Card
                        key={idx}
                        className={`p-6 rounded-2xl border transition-all flex flex-col justify-between ${
                          tier.isHighlighted ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-card"
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-base text-foreground font-syne">{tier.name}</h4>
                            {tier.isHighlighted && (
                              <Badge className="bg-primary text-primary-foreground text-[10px] font-bold">Popular</Badge>
                            )}
                          </div>
                          <div className="text-2xl font-black text-foreground">
                            €{tier.price?.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">/{tier.billingCycle || "mo"}</span>
                          </div>
                          {tier.features && tier.features.length > 0 && (
                            <ul className="pt-3 space-y-1.5 text-xs text-muted-foreground border-t border-border">
                              {tier.features.map((feat: string, fIdx: number) => (
                                <li key={fIdx} className="flex items-center gap-2">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                                  <span>{feat}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* RESOURCE & LAUNCH CALCULATION */}
              {projectData?.resourcePlan?.available && (
                <Card className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
                  <h3 className="text-base font-bold font-syne text-foreground">Resource Plan &amp; Launch Budget</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 bg-background border border-border rounded-xl">
                      <span className="text-[11px] text-muted-foreground uppercase tracking-wider block">Launch Budget</span>
                      <span className="text-base font-bold text-foreground mt-1 block">
                        €{projectData.resourcePlan.launchBudgetMin?.toLocaleString() || "0"} - €{projectData.resourcePlan.launchBudgetMax?.toLocaleString() || "0"}
                      </span>
                    </div>
                    <div className="p-4 bg-background border border-border rounded-xl">
                      <span className="text-[11px] text-muted-foreground uppercase tracking-wider block">Monthly Running Cost</span>
                      <span className="text-base font-bold text-foreground mt-1 block">
                        €{projectData.resourcePlan.monthlyRunningCost?.toLocaleString() || "0"} / mo
                      </span>
                    </div>
                    <div className="p-4 bg-background border border-border rounded-xl">
                      <span className="text-[11px] text-muted-foreground uppercase tracking-wider block">Time to Launch</span>
                      <span className="text-base font-bold text-foreground mt-1 block">
                        {projectData.resourcePlan.timeToLaunchWeeksMin || "0"} - {projectData.resourcePlan.timeToLaunchWeeksMax || "0"} Weeks
                      </span>
                    </div>
                  </div>

                  {projectData.resourcePlan.teamRequirements && projectData.resourcePlan.teamRequirements.length > 0 && (
                    <div className="pt-2 space-y-2">
                      <span className="text-xs font-bold text-muted-foreground block">Key Team Roles &amp; Allocation:</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        {projectData.resourcePlan.teamRequirements.map((tr, idx) => (
                          <div key={idx} className="p-3 bg-background border border-border rounded-xl flex items-center justify-between">
                            <strong className="text-foreground">{tr.role}</strong>
                            <span className="text-muted-foreground">€{tr.cost?.toLocaleString()} ({tr.durationMonths} mo)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {projectData.resourcePlan.saasStack && projectData.resourcePlan.saasStack.length > 0 && (
                    <div className="pt-2 space-y-2">
                      <span className="text-xs font-bold text-muted-foreground block">Recommended SaaS &amp; Tooling Stack:</span>
                      <div className="flex flex-wrap gap-2 text-xs">
                        {projectData.resourcePlan.saasStack.map((s, idx) => (
                          <Badge key={idx} variant="outline" className="px-3 py-1 text-xs">
                            {s.name}: €{s.monthlyCost}/mo
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              )}

              {/* GO-TO-MARKET STRATEGY */}
              {projectData?.gtmPlan?.available && (
                <Card className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
                  <h3 className="text-base font-bold font-syne text-foreground">Go-to-Market Strategy</h3>
                  {projectData.gtmPlan.primaryChannels && projectData.gtmPlan.primaryChannels.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-muted-foreground block">Acquisition Channels:</span>
                      <div className="flex flex-wrap gap-2">
                        {projectData.gtmPlan.primaryChannels.map((ch: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs font-semibold px-3 py-1">
                            {ch}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {projectData.gtmPlan.targetAudiences && projectData.gtmPlan.targetAudiences.length > 0 && (
                    <div className="space-y-1.5 pt-3 border-t border-border">
                      <span className="text-xs font-bold text-muted-foreground block">Audience Segments:</span>
                      <div className="flex flex-wrap gap-2">
                        {projectData.gtmPlan.targetAudiences.map((aud: string, idx: number) => (
                          <Badge key={idx} variant="secondary" className="text-xs font-semibold px-3 py-1">
                            {aud}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {projectData.gtmPlan.benchmarkGtmWeeks && projectData.gtmPlan.benchmarkGtmWeeks.length > 0 && (
                    <div className="space-y-2 pt-3 border-t border-border">
                      <span className="text-xs font-bold text-muted-foreground block">Benchmark GTM Execution Timeline:</span>
                      <div className="space-y-2 text-xs">
                        {projectData.gtmPlan.benchmarkGtmWeeks.map((wk, idx) => (
                          <div key={idx} className="p-3 bg-background border border-border rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <CheckCircle2 className={`h-4 w-4 ${wk.completed ? "text-success-strong" : "text-muted-foreground"}`} />
                              <div>
                                <strong className="text-foreground block">Week {wk.week}: {wk.title}</strong>
                                {wk.tasks && wk.tasks.length > 0 && (
                                  <span className="text-[11px] text-muted-foreground">{wk.tasks.join(" • ")}</span>
                                )}
                              </div>
                            </div>
                            <Badge variant="outline" className="text-[10px]">
                              {wk.completed ? "Done" : "Planned"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 6: BRAND & ASSETS */}
          {/* ======================================================== */}
          {activeTab === "brand" && (
            <div className="space-y-6">
              <Card className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
                <h3 className="text-base font-bold font-syne text-foreground">Brand Identity &amp; Visual Design</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="p-4 bg-background border border-border rounded-xl space-y-2">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Palette Name</span>
                    <span className="text-base font-bold text-foreground block">
                      {projectData?.branding?.paletteName || "Canonical Mondial"}
                    </span>
                    {projectData?.branding?.colorPalette && projectData.branding.colorPalette.length > 0 && (
                      <div className="flex items-center gap-2 pt-2">
                        {projectData.branding.colorPalette.map((col: string, idx: number) => (
                          <div
                            key={idx}
                            title={col}
                            className="h-8 w-8 rounded-lg border border-border shadow-xs flex items-center justify-center text-[9px] font-mono text-foreground font-bold"
                            style={{ backgroundColor: col }}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-background border border-border rounded-xl space-y-2">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Typography Pairing</span>
                    <span className="text-base font-bold text-foreground block">
                      {projectData?.branding?.typographyPairing || "Syne (Headings) / DM Sans (Body)"}
                    </span>
                    {projectData?.branding?.logoType && (
                      <span className="text-xs text-muted-foreground block pt-2">
                        Logo Method: <strong className="text-foreground capitalize">{projectData.branding.logoType}</strong>
                      </span>
                    )}
                  </div>
                </div>
              </Card>

              {/* TRANSFERRED HANDOVER DELIVERABLES SUMMARY */}
              <Card className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold font-syne text-foreground">Transferred Handover Deliverables</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onViewAcquisitionRecord}
                    className="text-xs text-primary hover:underline gap-1 p-0 h-auto"
                  >
                    <span>View Handover Workspace</span>
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>

                <div className="space-y-2">
                  {deal.buyoutHandover?.assets && deal.buyoutHandover.assets.length > 0 ? (
                    deal.buyoutHandover.assets.map((asset, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-background border border-border rounded-xl flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2 className="h-4 w-4 text-success-strong shrink-0" />
                          <div>
                            <strong className="text-foreground block">{asset.displayName}</strong>
                            <span className="text-[11px] text-muted-foreground">{asset.assetType} • {asset.deliveryType}</span>
                          </div>
                        </div>
                        <Badge className="bg-success-light text-success-strong border-success-strong/30 text-[10px] font-bold">
                          {asset.status}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground">Deliverables verified in canonical handover package.</p>
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 7: PROJECT DOCUMENTS */}
          {/* ======================================================== */}
          {activeTab === "documents" && (
            <div className="space-y-6">
              <Card className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div>
                    <h3 className="text-base font-bold font-syne text-foreground">Transferred Project Documents</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Downloadable files transferred as part of the acquisition.
                    </p>
                  </div>
                </div>

                {projectData?.documents && projectData.documents.length > 0 ? (
                  <div className="space-y-3">
                    {projectData.documents.map((doc: PrivateDocument) => (
                      <div
                        key={doc.id}
                        className="p-4 bg-background border border-border rounded-xl flex items-center justify-between gap-4 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div>
                            <strong className="text-foreground block text-sm font-semibold">{doc.title || doc.fileName}</strong>
                            <span className="text-[11px] text-muted-foreground">
                              {doc.documentType} • {(doc.sizeBytes / 1024).toFixed(1)} KB
                            </span>
                          </div>
                        </div>

                        {doc.downloadable && deal.ideaId && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadDoc(doc.id, doc.fileName || `${doc.title || "document"}.pdf`)}
                            disabled={downloadingDocId === doc.id}
                            className="text-xs gap-1.5 bg-background border-border"
                          >
                            <Download className="h-3.5 w-3.5" />
                            {downloadingDocId === doc.id ? "Downloading..." : "Download"}
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <Card className="p-8 text-center border-dashed border-border bg-muted/20 rounded-xl space-y-1">
                    <p className="text-xs font-semibold text-foreground">No Additional Uploaded Documents</p>
                    <p className="text-[11px] text-muted-foreground">
                      All deliverables and legal transfer schedules are sealed in the Acquisition Record.
                    </p>
                  </Card>
                )}
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
};
