"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Compass,
  Link2,
  Search,
  Filter,
  ArrowRight,
  Loader2,
  ShieldCheck,
  Tag,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  DollarSign,
  UserCheck,
  ChevronRight,
  Briefcase,
  Layers,
  Sparkles,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import marketplaceProjectsApi, {
  type EntrepreneurProjectConnection
} from "@/lib/api-marketplace-projects";

export default function MyProjectConnectionsPage() {
  const router = useRouter();
  const [connections, setConnections] = useState<EntrepreneurProjectConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDealType, setSelectedDealType] = useState<string>("all");

  const loadConnections = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await marketplaceProjectsApi.getMyProjectConnections();
      setConnections(data || []);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e.response?.data?.message || e.message || "Failed to load connected projects.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConnections();
  }, []);

  // Summary counts
  const counts = useMemo(() => {
    const total = connections.length;
    const active = connections.filter((c) => c.category === "Active").length;
    const pending = connections.filter((c) => c.category === "Pending").length;
    const completed = connections.filter((c) => c.category === "Completed").length;
    return { total, active, pending, completed };
  }, [connections]);

  // Filtered connections
  const filteredConnections = useMemo(() => {
    return connections.filter((c) => {
      // Category filter
      if (selectedCategory !== "all" && c.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }

      // Deal type filter
      if (selectedDealType !== "all") {
        const dt = (c.dealType || c.selectedDealMode || "").toLowerCase();
        if (selectedDealType === "full_buyout" && !dt.includes("buyout")) return false;
        if (selectedDealType === "equity_partnership" && !dt.includes("equity") && !dt.includes("partnership")) return false;
      }

      // Search term
      if (search.trim()) {
        const query = search.trim().toLowerCase();
        const matchesName = c.projectName.toLowerCase().includes(query);
        const matchesCreator = c.creatorName.toLowerCase().includes(query);
        const matchesSummary = (c.projectSummary || "").toLowerCase().includes(query);
        const matchesProblem = (c.problemStatement || "").toLowerCase().includes(query);
        const matchesSector = (c.sector || "").toLowerCase().includes(query);
        if (!matchesName && !matchesCreator && !matchesSummary && !matchesProblem && !matchesSector) {
          return false;
        }
      }

      return true;
    });
  }, [connections, selectedCategory, selectedDealType, search]);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "Recently";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
    } catch {
      return "Recently";
    }
  };

  const getStatusBadgeConfig = (conn: EntrepreneurProjectConnection) => {
    const status = conn.displayStatus;
    const cat = conn.category;

    if (status === "SOLD" || conn.projectOutcome === "SOLD") {
      return {
        label: "SOLD",
        className: "bg-emerald-600/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold",
        icon: CheckCircle2
      };
    }

    if (status === "Partnership Active" || conn.projectOutcome === "PARTNERSHIP_ACTIVE") {
      return {
        label: "Partnership Active",
        className: "bg-blue-600/15 text-blue-600 dark:text-blue-400 border-blue-500/30 font-bold",
        icon: Sparkles
      };
    }

    if (cat === "Completed" || conn.projectOutcome === "DECLINED" || conn.projectOutcome === "CLOSED") {
      return {
        label: status,
        className: "bg-muted text-muted-foreground border-border font-medium",
        icon: CheckCircle2
      };
    }

    if (cat === "Active") {
      return {
        label: status,
        className: "bg-primary/15 text-primary border-primary/30 font-semibold",
        icon: Briefcase
      };
    }

    // Pending
    return {
      label: status,
      className: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-semibold",
      icon: Clock
    };
  };

  const getPrimaryActionLabel = (conn: EntrepreneurProjectConnection) => {
    if (conn.projectOutcome === "SOLD" || conn.displayStatus === "SOLD") {
      return "View Acquired Project";
    }
    if (conn.projectOutcome === "PARTNERSHIP_ACTIVE" || conn.displayStatus === "Partnership Active") {
      return "Open Partnership";
    }
    if (conn.dealExecutionId) {
      return "Continue Deal";
    }
    if (conn.interestStatus === "accepted") {
      return "Continue Project";
    }
    return "View Project";
  };

  return (
    <div className="w-full min-h-screen bg-background text-foreground">
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Navigation Tabs Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-2 bg-muted/60 p-1 rounded-xl border border-border">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              <Link href="/dashboard/entrepreneur/discover" className="flex items-center gap-1.5">
                <Compass className="w-4 h-4" />
                Explore Discover
              </Link>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="rounded-lg text-xs font-bold bg-background text-foreground shadow-sm flex items-center gap-1.5"
            >
              <Link2 className="w-4 h-4 text-primary" />
              My Project Connections
              {counts.total > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-primary/10 text-primary">
                  {counts.total}
                </span>
              )}
            </Button>
          </div>

          <Button
            asChild
            variant="outline"
            size="sm"
            className="rounded-xl border-border bg-card text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <Link href="/dashboard/entrepreneur/discover">
              <Compass className="w-3.5 h-3.5 mr-1.5 text-primary" />
              Discover More Projects
            </Link>
          </Button>
        </div>

        {/* Page Hero Banner */}
        <div className="rounded-3xl border border-border bg-gradient-to-br from-card via-card to-primary/5 p-6 sm:p-8 relative overflow-hidden shadow-sm">
          <div className="max-w-3xl space-y-2 relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Link2 className="h-3.5 w-3.5" /> Working Project Portfolio
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              My Project Connections
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Projects you have connected with, expressed interest in, or started a deal with. Click any project to open its dedicated Discover workspace.
            </p>
          </div>
        </div>

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card
            onClick={() => setSelectedCategory("all")}
            className={`p-4 rounded-2xl border transition cursor-pointer ${
              selectedCategory === "all"
                ? "bg-primary/5 border-primary/40 shadow-sm"
                : "bg-card border-border hover:border-border/80"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">All Projects</span>
              <Layers className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-extrabold text-foreground mt-2">{counts.total}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Total working connections</p>
          </Card>

          <Card
            onClick={() => setSelectedCategory("active")}
            className={`p-4 rounded-2xl border transition cursor-pointer ${
              selectedCategory === "active"
                ? "bg-primary/5 border-primary/40 shadow-sm"
                : "bg-card border-border hover:border-border/80"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-primary">Active Deals</span>
              <Briefcase className="w-4 h-4 text-primary" />
            </div>
            <p className="text-2xl font-extrabold text-foreground mt-2">{counts.active}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">In formation or review</p>
          </Card>

          <Card
            onClick={() => setSelectedCategory("pending")}
            className={`p-4 rounded-2xl border transition cursor-pointer ${
              selectedCategory === "pending"
                ? "bg-primary/5 border-primary/40 shadow-sm"
                : "bg-card border-border hover:border-border/80"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-500">Pending Actions</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-extrabold text-foreground mt-2">{counts.pending}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Interest or NDA awaiting</p>
          </Card>

          <Card
            onClick={() => setSelectedCategory("completed")}
            className={`p-4 rounded-2xl border transition cursor-pointer ${
              selectedCategory === "completed"
                ? "bg-primary/5 border-primary/40 shadow-sm"
                : "bg-card border-border hover:border-border/80"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-500">Completed</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-extrabold text-foreground mt-2">{counts.completed}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Acquired or co-founded</p>
          </Card>
        </div>

        {/* Filter Bar */}
        <div className="space-y-3 pt-1">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search connected projects by name, creator, or topic..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-10 bg-card border-border rounded-xl text-sm"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-muted-foreground mr-1 flex items-center gap-1">
                <Filter className="h-3.5 w-3.5" /> Status:
              </span>
              {[
                { id: "all", label: "All" },
                { id: "active", label: "Active" },
                { id: "pending", label: "Pending" },
                { id: "completed", label: "Completed" }
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`rounded-lg border px-3 py-1 text-xs font-medium transition ${
                    selectedCategory === cat.id
                      ? "border-primary bg-primary/10 text-primary font-semibold"
                      : "border-border bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Deal Type Pills */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground mr-1 flex items-center gap-1">
                <Tag className="h-3.5 w-3.5" /> Type:
              </span>
              {[
                { id: "all", label: "All" },
                { id: "full_buyout", label: "Buyout" },
                { id: "equity_partnership", label: "Equity" }
              ].map((dt) => (
                <button
                  key={dt.id}
                  onClick={() => setSelectedDealType(dt.id)}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                    selectedDealType === dt.id
                      ? "border-primary bg-primary/10 text-primary font-semibold"
                      : "border-border bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {dt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Project Connections Feed */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground font-medium">Loading your project connections...</p>
          </div>
        ) : error ? (
          <Card className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center space-y-3">
            <AlertCircle className="h-8 w-8 mx-auto text-destructive" />
            <h3 className="text-base font-bold text-foreground">Could not load connections</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">{error}</p>
            <Button size="sm" onClick={loadConnections} variant="outline" className="rounded-xl">
              Retry
            </Button>
          </Card>
        ) : connections.length === 0 ? (
          /* Empty State — No connections at all */
          <Card className="rounded-3xl border border-border bg-card p-12 text-center space-y-4 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary">
              <Link2 className="w-7 h-7" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-lg font-bold text-foreground">No project connections yet</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Discover Creator projects and express interest to start building your project pipeline.
              </p>
            </div>
            <Button asChild size="lg" className="rounded-xl px-6 font-bold shadow-sm">
              <Link href="/dashboard/entrepreneur/discover">
                <Compass className="w-4 h-4 mr-2" />
                Discover Projects
              </Link>
            </Button>
          </Card>
        ) : filteredConnections.length === 0 ? (
          /* Empty State — Filter match */
          <Card className="rounded-2xl border border-border bg-card p-10 text-center space-y-3">
            <Search className="h-8 w-8 mx-auto text-muted-foreground" />
            <h3 className="text-base font-bold">No matching connections</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              No projects matched your current search or filter criteria. Try resetting filters.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedCategory("all");
                setSelectedDealType("all");
                setSearch("");
              }}
              className="rounded-xl text-xs"
            >
              Reset Filters
            </Button>
          </Card>
        ) : (
          /* Grid of Connection Cards */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredConnections.map((conn) => {
              const statusCfg = getStatusBadgeConfig(conn);
              const StatusIcon = statusCfg.icon;
              const actionLabel = getPrimaryActionLabel(conn);

              const isBuyout = (conn.dealType || conn.selectedDealMode || "").toLowerCase().includes("buyout");
              const isEquity = (conn.dealType || conn.selectedDealMode || "").toLowerCase().includes("equity");

              return (
                <Card
                  key={conn.ideaId}
                  onClick={() => router.push(`/dashboard/entrepreneur/discover/${conn.ideaId}`)}
                  className="rounded-2xl border border-border bg-card p-5 sm:p-6 flex flex-col justify-between hover:border-primary/50 transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer group"
                >
                  <div className="space-y-4">
                    {/* Top Row: Sector, Deal Type & Status Badges */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge variant="outline" className="text-[11px] font-medium border-border bg-muted/40 text-foreground">
                          {conn.sector || "General"}
                        </Badge>

                        {isBuyout && (
                          <Badge variant="outline" className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                            Full Buyout
                          </Badge>
                        )}
                        {isEquity && (
                          <Badge variant="outline" className="text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
                            Co-founder / Equity
                          </Badge>
                        )}

                        {conn.ndaRequired && (
                          <Badge variant="secondary" className="text-[10px] gap-1 font-normal text-muted-foreground">
                            <ShieldCheck className={`h-3 w-3 ${conn.ndaStatus === "SIGNED" ? "text-success-strong" : "text-warning"}`} />
                            {conn.ndaStatus === "SIGNED" ? "NDA Signed" : "NDA Gated"}
                          </Badge>
                        )}
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] border ${statusCfg.className}`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {statusCfg.label}
                      </span>
                    </div>

                    {/* Project Header & Creator Details */}
                    <div>
                      <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition line-clamp-1">
                        {conn.projectName}
                      </h3>

                      <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-primary" />
                          <span className="font-medium text-foreground">{conn.creatorName}</span>
                        </div>
                        <span>•</span>
                        <span>Active {formatDate(conn.lastActivityAt)}</span>
                      </div>

                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                        {conn.projectSummary || conn.problemStatement || "Validated early-stage creator project in formation."}
                      </p>
                    </div>

                    {/* Stage / Context Info Strip */}
                    <div className="p-3 rounded-xl bg-muted/40 border border-border/80 flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">Current Stage:</span>
                        <span className="text-foreground font-semibold">
                          {conn.dealStage
                            ? conn.dealStage.replace(/_/g, " ")
                            : conn.displayStatus}
                        </span>
                      </div>
                      <div className="text-[11px]">
                        Clarity <span className="font-bold text-foreground">{conn.clarityScore}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="pt-4 mt-4 border-t border-border/70 flex items-center justify-between gap-3">
                    <div className="text-xs text-muted-foreground">
                      Connected {formatDate(conn.createdAt)}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/dashboard/entrepreneur/discover/${conn.ideaId}`);
                        }}
                        className="h-9 gap-1.5 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-sm"
                      >
                        {actionLabel}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
