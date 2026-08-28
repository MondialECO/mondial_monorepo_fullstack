"use client";

import { useState, useEffect } from "react";
import { Search, Store, Sparkles, Filter, ArrowRight, Loader2, ShieldCheck, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { marketplaceProjectsApi, type MarketplaceProject } from "@/lib/api-marketplace-projects";

export default function EntrepreneurDiscoverPage() {
  const [projects, setProjects] = useState<MarketplaceProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedSector, setSelectedSector] = useState<string>("All");
  const [selectedDealMode, setSelectedDealMode] = useState<string>("all");

  const sectors = ["All", "Fintech", "SaaS", "Healthtech", "AI & Data", "E-Commerce", "General"];

  const loadProjects = async () => {
    setLoading(true);
    try {
      const query: { sector?: string; dealMode?: string; search?: string } = {};
      if (selectedSector !== "All") query.sector = selectedSector;
      if (selectedDealMode !== "all") query.dealMode = selectedDealMode;
      if (search.trim()) query.search = search.trim();

      const data = await marketplaceProjectsApi.getProjects(query);
      setProjects(data || []);
    } catch (err) {
      console.error("Failed to load marketplace projects", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
    /* eslint-disable-next-line */
  }, [selectedSector, selectedDealMode]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadProjects();
  };

  const fmt = (n: number) => `€${Math.round(n).toLocaleString()}`;

  return (
    <div className="w-full min-h-screen bg-background text-foreground">
      <main className="max-w-6xl mx-auto w-full p-6 space-y-6">
        {/* Header Banner */}
        <div className="rounded-3xl border border-border bg-gradient-to-br from-card via-card to-primary/5 p-8 relative overflow-hidden">
          <div className="max-w-2xl space-y-3 relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Project Discovery & Acquisition
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Discover High-Potential Projects
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Explore validated creator projects available for outright buyout or active co-founder equity partnership. Connect directly with creators.
            </p>
          </div>
        </div>

        {/* Filters & Search Bar */}
        <div className="space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects by name, keyword, or problem..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11 bg-card border-border rounded-xl"
              />
            </div>
            <Button type="submit" className="h-11 px-5 gap-2 rounded-xl">
              Search
            </Button>
          </form>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
            {/* Sector filter pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-muted-foreground mr-1 flex items-center gap-1">
                <Filter className="h-3.5 w-3.5" /> Sector:
              </span>
              {sectors.map((sec) => (
                <button
                  key={sec}
                  onClick={() => setSelectedSector(sec)}
                  className={`rounded-lg border px-3 py-1 text-xs font-medium transition ${
                    selectedSector === sec
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {sec}
                </button>
              ))}
            </div>

            {/* Deal mode pills */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground mr-1 flex items-center gap-1">
                <Tag className="h-3.5 w-3.5" /> Deal Type:
              </span>
              {[
                { id: "all", label: "All Types" },
                { id: "full_buyout", label: "Buyout Only" },
                { id: "equity_partnership", label: "Co-founder / Equity" },
              ].map((dm) => (
                <button
                  key={dm.id}
                  onClick={() => setSelectedDealMode(dm.id)}
                  className={`rounded-lg border px-3 py-1 text-xs font-medium transition ${
                    selectedDealMode === dm.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {dm.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Project Feed */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading discovery feed...</p>
          </div>
        ) : projects.length === 0 ? (
          <Card className="rounded-2xl border border-border bg-card p-12 text-center space-y-3">
            <Store className="h-10 w-10 mx-auto text-muted-foreground" />
            <h3 className="text-base font-bold">No projects found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              No published projects matched your current filters. Try changing sector, deal type, or search term.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((p) => {
              const hasBuyout = p.dealModes?.includes("full_buyout");
              const hasEquity = p.dealModes?.includes("equity_partnership");

              return (
                <Card
                  key={p.ideaId}
                  className="rounded-2xl border border-border bg-card p-5 flex flex-col justify-between hover:border-primary/50 transition duration-200 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline" className="text-[11px] font-medium border-primary/20 bg-primary/5 text-primary">
                        {p.sector || "General"}
                      </Badge>
                      {p.ndaRequired && (
                        <Badge variant="secondary" className="text-[10px] gap-1 font-normal text-muted-foreground">
                          <ShieldCheck className="h-3 w-3 text-warning" /> NDA Gated
                        </Badge>
                      )}
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-foreground group-hover:text-primary transition line-clamp-1">
                        {p.projectName}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                        {p.tagline || p.problem || "Validated early-stage creator project."}
                      </p>
                    </div>

                    {/* Deal Modes Badges */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {hasBuyout && (
                        <Badge variant="default" className="text-[10px] font-semibold bg-emerald-600/15 text-emerald-500 border-emerald-500/20">
                          Full Buyout
                        </Badge>
                      )}
                      {hasEquity && (
                        <Badge variant="default" className="text-[10px] font-semibold bg-blue-600/15 text-blue-500 border-blue-500/20">
                          Co-founder / Equity
                        </Badge>
                      )}
                    </div>

                    {/* Asking Price if Buyout */}
                    {hasBuyout && p.askingPrice != null && (
                      <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Asking Price</span>
                        <span className="text-sm font-extrabold text-foreground">{fmt(p.askingPrice)}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 mt-3 border-t border-border/60 flex items-center justify-between">
                    <div className="text-[11px] text-muted-foreground">
                      Clarity <span className="font-semibold text-foreground">{p.clarityScore}</span>
                    </div>
                    <Button asChild size="sm" variant="ghost" className="h-8 gap-1 text-xs text-primary font-semibold hover:text-primary hover:bg-primary/10">
                      <Link href={`/dashboard/entrepreneur/discover/${p.ideaId}`}>
                        View Project <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
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
