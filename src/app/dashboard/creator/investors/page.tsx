"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sparkles,
  TrendingUp,
  FileText,
  DollarSign,
  ArrowRight,
  ChevronRight,
  Check,
  Building,
  Lock,
  Eye,
  Store,
  Users,
  MessageSquare,
  Handshake,
  Calendar,
  Search,
  Filter,
} from "lucide-react";
import { useCreatorProgress } from "@/providers/CreatorProgressProvider";
import { useRouter } from "next/navigation";

export default function InvestmentDashboard() {
  const router = useRouter();
  const { state, completeStep, advancePhase } = useCreatorProgress();
  const { project, journeyState } = state;
  const [activeFilter, setActiveFilter] = useState<"all" | "nda" | "warm" | "offered">("all");
  const [showNdaModal, setShowNdaModal] = useState(false);
  const [selectedInvestor, setSelectedInvestor] = useState<string | null>(null);
  const [ndaSigned, setNdaSigned] = useState<Record<string, boolean>>({});

  const investors = [
    {
      id: "inv-1",
      name: "Marcus Soren",
      firm: "Soren Ventures",
      matchScore: 94,
      cheque: "$100k - $500k",
      status: "Reviewing Deck",
      statusColor: "text-amber-500 bg-amber-500/10 border-amber-500/20",
      avatar: "MS",
      notes: "Interested in localized B2B transaction automation. Waiting for financial projection audit.",
    },
    {
      id: "inv-2",
      name: "Dieter Hoffmann",
      firm: "Berlin Angel Syndicate",
      matchScore: 88,
      cheque: "$50k - $200k",
      status: "NDA Requested",
      statusColor: "text-blue-500 bg-blue-500/10 border-blue-500/20",
      avatar: "DH",
      notes: "Requested standard NDA before releasing custom LayoutLM validation model performance logs.",
    },
    {
      id: "inv-3",
      name: "Elena Rostova",
      firm: "Independent Angel",
      matchScore: 82,
      cheque: "$75k - $150k",
      status: "Warm Match",
      statusColor: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
      avatar: "ER",
      notes: "Active emerging market angel investor. Previously funded 2 micro-SaaS projects in Dhaka.",
    },
  ];

  const filteredInvestors = activeFilter === "all"
    ? investors
    : investors.filter(i => {
        if (activeFilter === "nda") return i.status === "NDA Requested";
        if (activeFilter === "warm") return i.status === "Warm Match";
        return false;
      });

  const handleNdaAction = (id: string) => {
    setSelectedInvestor(id);
    setShowNdaModal(true);
  };

  return (
    <div className="mx-auto w-full max-w-[1136px] space-y-6 bg-background pb-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold leading-tight text-foreground sm:text-[28px] flex items-center gap-2">
            <Handshake className="h-6 w-6 text-primary" />
            Phase 6: Smart Matchmaking Engine
          </h1>
          <p className="text-sm font-normal text-muted-foreground mt-1">
            Track warm matches, review buyout bids, sign NDAs, and initiate direct investor interactions.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 bg-muted/60 p-1 rounded-xl">
          {(["all", "nda", "warm"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                activeFilter === filter ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {filter === "all" ? "All Matches" : filter === "nda" ? "NDA Requests" : "Warm Leads"}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Left List */}
        <div className="md:col-span-2 space-y-4">
          {filteredInvestors.map((investor) => (
            <Card key={investor.id} className="rounded-xl border-border/70 bg-card p-6 shadow-sm space-y-4 hover:border-primary/20 transition-all duration-300">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border border-border shrink-0">
                    <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                      {investor.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-bold text-sm text-foreground leading-none">{investor.name}</h3>
                    <span className="text-[10px] text-muted-foreground font-semibold mt-1 block">{investor.firm}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <Badge className={`border px-2 py-0.5 text-[10px] font-bold rounded-lg ${investor.statusColor}`}>
                    {investor.status}
                  </Badge>
                  <Badge className="bg-primary/10 text-primary border-0 font-bold text-[10px] px-2 py-0.5">
                    {investor.matchScore}% Match
                  </Badge>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {investor.notes}
              </p>

              <div className="flex items-center justify-between pt-3 border-t border-border/50 text-xs">
                <span className="text-muted-foreground font-semibold">Typical Cheque Size: <strong className="text-foreground">{investor.cheque}</strong></span>
                <div className="flex gap-2">
                  {investor.status === "NDA Requested" && !ndaSigned[investor.id] ? (
                    <Button onClick={() => handleNdaAction(investor.id)} size="sm" className="rounded-lg text-xs font-bold bg-primary text-white">
                      Sign NDA
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        completeStep(6, 2);
                        router.push('/dashboard/creator/messages');
                      }}
                      variant="outline"
                      size="sm"
                      className="rounded-lg text-xs font-bold border-border"
                    >
                      Message
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="rounded-lg text-xs font-bold text-primary hover:bg-primary/5">
                    View Profile
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Right Info Panel */}
        <div className="space-y-4">
          <Card className="rounded-xl border-border/70 bg-card p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-foreground uppercase tracking-wider">Matchmaking Activity</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-foreground">Dieter Hoffmann requested NDA access</p>
                  <span className="text-[10px] text-muted-foreground font-medium">10 mins ago</span>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="h-2 w-2 rounded-full bg-success-text mt-1.5 shrink-0" />
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-foreground">Soren Ventures matched with "AI Invoice Assistant"</p>
                  <span className="text-[10px] text-muted-foreground font-medium">2 hours ago</span>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-700 mt-1.5 shrink-0" />
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-foreground">Elena Rostova viewed your branding deck</p>
                  <span className="text-[10px] text-muted-foreground font-medium">1 day ago</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="rounded-xl border-border/70 bg-card p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-foreground uppercase tracking-wider">Security & Compliance</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Mondial enforces strict NDA gating for all patent, financial, and cap table assets. Acquirers cannot see proprietary details until you approve their access request.
            </p>
            <div className="p-3 bg-muted/40 rounded-xl border border-border/40 text-[10px] text-muted-foreground leading-relaxed">
              Standard compliance models are fully compliant under EU AML guidelines and local SEC match frameworks.
            </div>
          </Card>

          <Card className="rounded-xl border-border bg-card p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-foreground uppercase tracking-wider">Finish Journey</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Once you have finished matching or reviewing offers, you can complete the creator journey.
            </p>
            <Button
              onClick={() => {
                completeStep(6, 3);
                advancePhase(6);
                router.push('/dashboard/creator');
              }}
              className="w-full rounded-xl font-bold bg-primary text-white"
            >
              Finish Stage 6 🎉
            </Button>
          </Card>
        </div>
      </div>

      {/* NDA Modal Demo */}
      {showNdaModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full rounded-2xl border-0 p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="font-extrabold text-lg text-foreground">Execute Non-Disclosure Agreement</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              By signing this NDA, you agree to exchange confidential validation data and technical benchmarks with Berlin Angel Syndicate (Dieter Hoffmann).
            </p>
            <div className="border border-border rounded-xl p-3 bg-muted/20 text-[11px] text-muted-foreground max-h-[120px] overflow-y-auto font-mono">
              STANDARD MUTUAL NON-DISCLOSURE AGREEMENT...
              This Non-Disclosure Agreement (the "Agreement") is entered into by and between the disclosing creator and the matched investor syndicate...
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowNdaModal(false)} className="rounded-xl font-bold">
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setNdaSigned((prev) => ({ ...prev, [selectedInvestor || '']: true }));
                  completeStep(6, 1);
                  setShowNdaModal(false);
                }}
                className="rounded-xl font-bold bg-primary text-white"
              >
                Sign & Accept Terms
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
