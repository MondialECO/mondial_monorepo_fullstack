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
  LineChart,
  FileText,
  Building,
  RefreshCw,
  ArrowRight,
  Shield,
  Download,
  CheckCircle2,
  Lock,
  Plus,
  Send,
  PieChart,
  DollarSign,
  Briefcase,
  ChevronRight,
  Sliders,
  Check,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";

// Mock financial forecast data
const FINANCIAL_DATA = [
  { name: "Year 1", Revenue: 120000, Expenses: 104000, EBITDA: 16000 },
  { name: "Year 2", Revenue: 480000, Expenses: 336000, EBITDA: 144000 },
  { name: "Year 3", Revenue: 1500000, Expenses: 820000, EBITDA: 680000 },
];

export default function AiMasterplanPage() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "plan" | "financials" | "formation">("dashboard");
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [planProgress, setPlanProgress] = useState(45);
  const [chatInput, setChatInput] = useState("");
  const [legalJurisdiction, setLegalJurisdiction] = useState("Delaware (C-Corp)");
  const [registered, setRegistered] = useState(false);

  const [aiSuggestions, setAiSuggestions] = useState({
    executiveSummary: "AI Invoice Assistant automates receipt validation and payment routing for South Asian SMEs. By utilizing lightweight OCR models, it cuts processing costs by 80% compared to traditional bookkeeping.",
    marketGap: "Canva and other general tools do not handle specialized transactional flows. Current invoicing systems require manual accounting reconciliation. We bridge this with instant ledger mapping.",
    revenueModel: "Freemium SaaS: Free tier up to 50 invoices/month. Professional tier at $15/month for unlimited volumes. B2B telecommunication partnerships for reseller scaling.",
  });

  const handleGeneratePlan = () => {
    setIsGeneratingPlan(true);
    let progress = 45;
    const interval = setInterval(() => {
      progress += 5;
      setPlanProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setIsGeneratingPlan(false);
        setPlanProgress(100);
      }
    }, 150);
  };

  return (
    <div className="mx-auto w-full max-w-[1136px] space-y-6 bg-background pb-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold leading-tight text-foreground sm:text-[28px] flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary animate-pulse" />
            Phase 3: Project Intelligence & AI Tools
          </h1>
          <p className="text-sm font-normal text-muted-foreground mt-1">
            Build your institutional business canvas, model financials, and draft registration documents.
          </p>
        </div>

        {/* Tab buttons */}
        <div className="flex flex-wrap gap-1 bg-muted/65 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "dashboard" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab("plan")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "plan" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Business Plan
          </button>
          <button
            onClick={() => setActiveTab("financials")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "financials" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Financial Forecasts
          </button>
          <button
            onClick={() => setActiveTab("formation")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === "formation" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Company Formation
          </button>
        </div>
      </div>

      {/* TAB 1: INTELLIGENT DASHBOARD */}
      {activeTab === "dashboard" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">AI Validation Score</span>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-primary">84</span>
                <span className="text-xs text-muted-foreground font-semibold">/ 100</span>
              </div>
              <Progress value={84} className="h-1.5 bg-muted" />
              <p className="text-[11px] text-muted-foreground font-semibold">Strong product-market viability signals.</p>
            </Card>

            <Card className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Market Outlook</span>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-success-text">High</span>
                <span className="text-xs text-muted-foreground font-semibold">+14.2% CAGR</span>
              </div>
              <Progress value={78} className="h-1.5 bg-muted [&>div]:bg-success-text" />
              <p className="text-[11px] text-muted-foreground font-semibold">Fast growing B2B transaction automation.</p>
            </Card>

            <Card className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Plan Completion</span>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-foreground">{planProgress}%</span>
              </div>
              <Progress value={planProgress} className="h-1.5 bg-muted" />
              <p className="text-[11px] text-muted-foreground font-semibold">Draft business canvas saved in workspace.</p>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card className="md:col-span-2 rounded-2xl border border-border bg-card shadow-sm p-6 space-y-4">
              <h3 className="font-bold text-foreground">AI Intelligence Overview</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your concept &quot;AI Invoice Assistant&quot; has been indexed. We have simulated its target user segments and formulated a preliminary business kit. Use the tabs above to review planning materials and draft legal formation models.
              </p>
              <div className="grid grid-cols-2 gap-4 pt-3">
                <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-1.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Primary Competitors</span>
                  <span className="block text-sm font-bold text-foreground">Canva, Wave, QuickBooks</span>
                </div>
                <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-1.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Pricing Recommendation</span>
                  <span className="block text-sm font-bold text-foreground">Freemium Tier + B2B Reseller</span>
                </div>
              </div>
            </Card>

            <Card className="rounded-2xl border border-border bg-card shadow-sm p-6 flex flex-col justify-between">
              <div className="space-y-4">
                <span className="text-xs font-bold text-primary uppercase tracking-widest block">Quick Action</span>
                <h4 className="font-bold text-foreground leading-snug">Generate Complete Institutional Masterplan</h4>
                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                  Unlock institutional review features by letting our models generate P&L statements and marketing roadmaps.
                </p>
              </div>
              <Button onClick={handleGeneratePlan} disabled={isGeneratingPlan} className="w-full mt-6 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/95">
                {isGeneratingPlan ? `Generating (${planProgress}%)` : "Generate Masterplan"}
              </Button>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: AI BUSINESS PLAN GENERATOR */}
      {activeTab === "plan" && (
        <div className="grid gap-6 lg:grid-cols-3 animate-in fade-in duration-200">
          {/* Plan sections */}
          <Card className="lg:col-span-2 rounded-2xl border border-border bg-card shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-foreground">AI Business Canvas</h3>
                <p className="text-xs text-muted-foreground">Detailed strategic pillars generated by AI</p>
              </div>
              <Button variant="outline" size="sm" className="rounded-xl font-bold border-border gap-1.5 bg-card text-foreground hover:bg-muted/30">
                <RefreshCw className="h-3.5 w-3.5" /> Re-Draft
              </Button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Executive Summary</label>
                <textarea
                  value={aiSuggestions.executiveSummary}
                  onChange={(e) => setAiSuggestions({ ...aiSuggestions, executiveSummary: e.target.value })}
                  rows={4}
                  className="w-full rounded-xl border border-border bg-muted/10 px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-all resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Core Problem & Market Gap</label>
                <textarea
                  value={aiSuggestions.marketGap}
                  onChange={(e) => setAiSuggestions({ ...aiSuggestions, marketGap: e.target.value })}
                  rows={3}
                  className="w-full rounded-xl border border-border bg-muted/10 px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-all resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Revenue Model & Monetization</label>
                <textarea
                  value={aiSuggestions.revenueModel}
                  onChange={(e) => setAiSuggestions({ ...aiSuggestions, revenueModel: e.target.value })}
                  rows={3}
                  className="w-full rounded-xl border border-border bg-muted/10 px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-all resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" className="rounded-xl font-bold border-border bg-card text-foreground hover:bg-muted/30">Save Draft</Button>
              <Button onClick={() => setActiveTab("financials")} className="rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/95 flex items-center gap-1.5 py-4 px-5">
                Next: Financials <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </Card>

          {/* AI Chat Assistant */}
          <Card className="rounded-2xl border border-border bg-card shadow-sm p-6 flex flex-col justify-between min-h-[450px]">
            <div className="space-y-4 flex-1">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground">AI Masterplan Assistant</h4>
                  <p className="text-[9px] text-muted-foreground">Refine your strategic business pillars</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-muted/20 rounded-xl border border-border/30 text-xs min-h-[220px]">
                <div className="bg-muted px-3 py-2 rounded-2xl rounded-tl-none font-medium text-muted-foreground">
                  Hello! I can help customize your business canvas. Ask me to change pricing models, adjust marketing hooks, or add competitor strategies!
                </div>
                <div className="bg-primary text-primary-foreground px-3 py-2 rounded-2xl rounded-tr-none ml-auto max-w-[85%] font-medium">
                  Can we recommend a B2B channel strategy?
                </div>
                <div className="bg-muted px-3 py-2 rounded-2xl rounded-tl-none font-medium text-muted-foreground">
                  Sure! I have updated the Revenue Model block to include reselling partnerships with local telecom providers. Feel free to save or further edit.
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-border/50">
              <Input
                placeholder="Ask AI to refine plan..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="rounded-xl text-xs bg-muted/40 border-border/80 focus-visible:ring-primary/20"
              />
              <Button size="icon" aria-label="Send message" className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: FINANCIAL FORECASTS */}
      {activeTab === "financials" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Chart */}
            <Card className="md:col-span-2 rounded-2xl border border-border bg-card shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-foreground">3-Year Revenue & EBITDA Forecast</h3>
                  <p className="text-xs text-muted-foreground">Interactive forecast models based on market sizing</p>
                </div>
                <Badge className="bg-success-light text-success-text border-0 font-bold px-2 py-0.5">Live Simulation</Badge>
              </div>

              <div className="h-[280px] w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={FINANCIAL_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorEbitda" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--success-text)" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="var(--success-text)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/50" />
                    <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => (v != null ? `$${Number(v) / 1000}k` : '')} />
                    <Tooltip formatter={(v) => v != null ? [`$${Number(v).toLocaleString()}`] : []} contentStyle={{ background: "var(--card)", borderColor: "var(--border)" }} />
                    <Legend />
                    <Area type="monotone" dataKey="Revenue" stroke="var(--primary)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
                    <Area type="monotone" dataKey="EBITDA" stroke="var(--success-text)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorEbitda)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Projections breakdown */}
            <Card className="rounded-2xl border border-border bg-card shadow-sm p-6 flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="font-bold text-foreground">Forecast Parameters</h3>
                <div className="space-y-3 pt-2">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-muted-foreground">Conversion rate</span>
                      <span className="text-foreground">2.4%</span>
                    </div>
                    <Progress value={24} className="h-1.5 bg-muted" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-muted-foreground">Monthly churn</span>
                      <span className="text-foreground">4.8%</span>
                    </div>
                    <Progress value={48} className="h-1.5 bg-muted [&>div]:bg-red-500" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-muted-foreground">Annual growth rate</span>
                      <span className="text-foreground">180%</span>
                    </div>
                    <Progress value={85} className="h-1.5 bg-muted [&>div]:bg-emerald-500" />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-border/40 mt-4 space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Estimated Breakeven</span>
                  <span className="font-bold text-foreground">Month 8</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Year 3 EBITDA Margin</span>
                  <span className="font-bold text-success-text">45.3%</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Forecast table */}
          <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted/10">
              <h4 className="font-bold text-foreground text-sm">P&L Projections Table</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/30 font-bold text-muted-foreground">
                    <th className="p-4">Line Item</th>
                    <th className="p-4">Year 1</th>
                    <th className="p-4">Year 2</th>
                    <th className="p-4">Year 3</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50 font-medium text-foreground">
                  <tr>
                    <td className="p-4 font-bold">Gross Revenue</td>
                    <td className="p-4">$120,000</td>
                    <td className="p-4">$480,000</td>
                    <td className="p-4">$1,500,000</td>
                  </tr>
                  <tr>
                    <td className="p-4">Cost of Goods Sold (COGS)</td>
                    <td className="p-4">$24,000</td>
                    <td className="p-4">$86,000</td>
                    <td className="p-4">$220,000</td>
                  </tr>
                  <tr className="bg-primary/5 text-primary font-bold">
                    <td className="p-4">Gross Margin (80%)</td>
                    <td className="p-4">$96,000</td>
                    <td className="p-4">$394,000</td>
                    <td className="p-4">$1,280,000</td>
                  </tr>
                  <tr>
                    <td className="p-4">Operating Expenses (OPEX)</td>
                    <td className="p-4">$80,000</td>
                    <td className="p-4">$250,000</td>
                    <td className="p-4">$600,000</td>
                  </tr>
                  <tr className="bg-success-light/20 text-success-text font-bold">
                    <td className="p-4">EBITDA</td>
                    <td className="p-4">$16,000</td>
                    <td className="p-4">$144,000</td>
                    <td className="p-4">$680,000</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 4: COMPANY FORMATION */}
      {activeTab === "formation" && (
        <div className="grid gap-6 md:grid-cols-3 animate-in fade-in duration-200">
          <Card className="md:col-span-2 rounded-2xl border border-border bg-card shadow-sm p-6 space-y-6">
            <div className="space-y-2">
              <h3 className="font-bold text-foreground">Generate Legal Incorporation Registry Documents</h3>
              <p className="text-xs text-muted-foreground">Auto-draft standard articles of association, operating agreements, and shareholder files.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 pt-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Legal Registry Jurisdiction</label>
                <div className="grid grid-cols-1 gap-2">
                  {["Delaware (C-Corp)", "Singapore (Pte Ltd)", "Estonia (OÜ)"].map((jur) => (
                    <button
                      key={jur}
                      type="button"
                      onClick={() => setLegalJurisdiction(jur)}
                      className={`p-3.5 rounded-xl border text-xs font-bold text-left transition-all ${
                        legalJurisdiction === jur
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:bg-muted/30"
                      }`}
                    >
                      {jur}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl border border-border bg-muted/10 flex flex-col justify-between">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Incorporation Details</span>
                  <div className="space-y-1 text-xs">
                    <p className="text-muted-foreground">Entity Type: <span className="font-bold text-foreground">C-Corporation</span></p>
                    <p className="text-muted-foreground">Authorized Shares: <span className="font-bold text-foreground">10,000,000</span></p>
                    <p className="text-muted-foreground">Founder Pool: <span className="font-bold text-foreground">8,000,000 shares</span></p>
                  </div>
                </div>
                <Button onClick={() => setRegistered(true)} className="w-full mt-4 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/95">
                  {registered ? "Documents Generated!" : "Draft Articles of Incorporation"}
                </Button>
              </div>
            </div>

            {registered && (
              <div className="p-4 rounded-xl border border-success-text/20 bg-success-light/20 space-y-3 animate-in slide-in-from-bottom duration-300">
                <div className="flex items-center gap-2 text-success-text font-bold text-xs">
                  <CheckCircle2 className="h-4 w-4" /> Incorporation Documents Ready to Download
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg border border-border bg-card flex justify-between items-center">
                    <span>Articles_of_Incorporation.pdf</span>
                    <Button variant="ghost" size="icon" aria-label="Download" className="h-7 w-7"><Download className="h-4 w-4" /></Button>
                  </div>
                  <div className="p-2.5 rounded-lg border border-border bg-card flex justify-between items-center">
                    <span>Shareholder_Agreement_Draft.pdf</span>
                    <Button variant="ghost" size="icon" aria-label="Download" className="h-7 w-7"><Download className="h-4 w-4" /></Button>
                  </div>
                </div>
              </div>
            )}
          </Card>

          <Card className="rounded-2xl border border-border bg-card shadow-sm p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <span className="text-xs font-bold text-primary uppercase tracking-widest block">Regulatory Check</span>
              <h4 className="font-bold text-foreground leading-snug">Compliance & KYC Integration</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Incorporating an entity requires finalized biometric signals from your KYC gate. You have completed the prerequisite Identity Validation.
              </p>
            </div>
            <div className="p-3.5 rounded-xl border border-success-text/30 bg-success-light/20 flex items-center gap-2 text-xs text-success-text font-bold">
              <Check className="h-4 w-4 shrink-0" /> Verified AML Compliance
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
