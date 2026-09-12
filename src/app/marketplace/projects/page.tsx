'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  SlidersHorizontal,
  Building2,
  DollarSign,
  ShieldCheck,
  Tag,
  ArrowRight,
  Sparkles,
  Rocket,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import AuthGuard from '@/components/layout/AuthGuard';
import marketplaceProjectsApi, {
  type MarketplaceProject,
  type MarketplaceProjectsQuery,
} from '@/lib/api-marketplace-projects';

const SECTORS = [
  'Fintech',
  'Healthtech',
  'SaaS',
  'E-Commerce',
  'AI & Machine Learning',
  'CleanTech',
  'Education',
  'Logistics',
  'Consumer',
  'Other',
];

const DEAL_MODES = [
  { value: 'all', label: 'All Modes' },
  { value: 'full_buyout', label: 'Full Buyout' },
  { value: 'equity_partnership', label: 'Equity / Co-Founder' },
];

export default function MarketplaceProjectsPage() {
  return (
    <AuthGuard>
      <MarketplaceProjectsContent />
    </AuthGuard>
  );
}

function MarketplaceProjectsContent() {
  const searchParams = useSearchParams();

  const [projects, setProjects] = useState<MarketplaceProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [selectedSector, setSelectedSector] = useState(searchParams.get('sector') ?? 'all');
  const [selectedDealMode, setSelectedDealMode] = useState(searchParams.get('dealMode') ?? 'all');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const query: MarketplaceProjectsQuery = {};
      if (selectedSector && selectedSector !== 'all') query.sector = selectedSector;
      if (selectedDealMode && selectedDealMode !== 'all') query.dealMode = selectedDealMode;
      if (search.trim()) query.search = search.trim();

      const data = await marketplaceProjectsApi.getProjects(query);
      setProjects(data || []);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e.response?.data?.message || e.message || 'Failed to load marketplace projects.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedSector, selectedDealMode, search]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleResetFilters = useCallback(() => {
    setSearch('');
    setSelectedSector('all');
    setSelectedDealMode('all');
  }, []);

  const hasActiveFilters = !!(
    (search && search.trim() !== '') ||
    selectedSector !== 'all' ||
    selectedDealMode !== 'all'
  );

  const renderFilters = () => (
    <div className="space-y-6">
      {/* Sector filter */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Industry Sector
        </h3>
        <div className="flex flex-wrap gap-1.5 lg:flex-col lg:gap-1">
          <Button
            variant={selectedSector === 'all' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSelectedSector('all')}
            className="justify-start text-xs h-8"
          >
            All Sectors
          </Button>
          {SECTORS.map((sec) => (
            <Button
              key={sec}
              variant={selectedSector === sec ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedSector(sec)}
              className="justify-start text-xs h-8 truncate"
            >
              {sec}
            </Button>
          ))}
        </div>
      </div>

      {/* Deal Mode filter */}
      <div className="space-y-3 pt-2 border-t border-border">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Deal Structure
        </h3>
        <div className="flex flex-wrap gap-1.5 lg:flex-col lg:gap-1">
          {DEAL_MODES.map((dm) => (
            <Button
              key={dm.value}
              variant={selectedDealMode === dm.value ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedDealMode(dm.value)}
              className="justify-start text-xs h-8"
            >
              {dm.label}
            </Button>
          ))}
        </div>
      </div>

      {hasActiveFilters && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleResetFilters}
          className="w-full text-xs flex items-center gap-2"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset Filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-start justify-between gap-4 px-4 py-6 md:px-6">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
                Project Marketplace
              </h1>
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs">
                Verified Projects
              </Badge>
            </div>
            <p className="mt-1 text-xs md:text-sm text-muted-foreground">
              Discover verified creator ventures, acquire intellectual property, or explore equity partnerships.
            </p>
          </div>

          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="shrink-0 lg:hidden">
                <SlidersHorizontal className="mr-2 size-4" />
                Filters
                {hasActiveFilters && (
                  <span className="ml-2 rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
                    Active
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="mt-6">{renderFilters()}</div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Search Header */}
      <div className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-3 md:px-6">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by project name, concept, sector, or keywords…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 rounded-full pl-11 pr-4 bg-muted/40 border-border text-sm"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <div className="flex gap-6">
          <aside className="sticky top-20 hidden max-h-[calc(100vh-6rem)] w-60 shrink-0 self-start lg:block">
            <ScrollArea className="h-full pr-3">{renderFilters()}</ScrollArea>
          </aside>

          <div className="min-w-0 flex-1">
            {error && (
              <div className="mb-6 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive flex items-center justify-between">
                <span>{error}</span>
                <Button variant="ghost" size="sm" onClick={fetchProjects} className="h-7 px-2">
                  Retry
                </Button>
              </div>
            )}

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="rounded-2xl border-border bg-card p-5 space-y-4">
                    <Skeleton className="h-6 w-3/4 rounded-md" />
                    <Skeleton className="h-4 w-full rounded-md" />
                    <Skeleton className="h-4 w-5/6 rounded-md" />
                    <div className="pt-3 border-t border-border flex justify-between">
                      <Skeleton className="h-4 w-20 rounded-md" />
                      <Skeleton className="h-4 w-16 rounded-md" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : projects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {projects.map((proj) => (
                  <Card
                    key={proj.ideaId}
                    className="rounded-2xl border-border bg-card hover:border-primary/40 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
                  >
                    <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">
                              {proj.sector || 'Ventures'}
                            </span>
                            <h3 className="font-bold text-foreground text-lg leading-snug group-hover:text-primary transition-colors line-clamp-1">
                              {proj.projectName || 'Untitled Venture'}
                            </h3>
                          </div>
                          {proj.ndaRequired && (
                            <Badge variant="outline" className="text-[10px] bg-muted/60 text-muted-foreground border-border shrink-0 flex items-center gap-1">
                              <ShieldCheck className="h-3 w-3 text-primary" />
                              NDA
                            </Badge>
                          )}
                        </div>

                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                          {proj.tagline || proj.problem || proj.solution || 'No detailed concept summary provided.'}
                        </p>
                      </div>

                      <div className="space-y-3 pt-3 border-t border-border/60">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Clarity Score</span>
                          <span className="font-bold text-foreground">{proj.clarityScore || 0}%</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Readiness</span>
                          <span className="font-bold text-foreground">{proj.readinessScore || 0}%</span>
                        </div>

                        {proj.askingPrice != null && proj.askingPrice > 0 && (
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Asking Price</span>
                            <span className="font-bold text-foreground">
                              ${proj.askingPrice.toLocaleString()}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-1.5 pt-1">
                          {proj.dealModes?.map((mode) => (
                            <Badge key={mode} variant="secondary" className="text-[10px] font-medium">
                              {mode === 'full_buyout'
                                ? 'Full Buyout'
                                : mode === 'equity_partnership'
                                ? 'Equity'
                                : mode}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 px-4 bg-card rounded-2xl border border-border space-y-3">
                <Rocket className="h-10 w-10 text-muted-foreground/30 mx-auto" />
                <h3 className="text-base font-bold text-foreground">No marketplace projects found</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  {hasActiveFilters
                    ? 'No projects matched your selected filters. Try resetting the filters or modifying your search term.'
                    : 'Projects published by creators will appear in this marketplace for discovery, partnerships, and buyouts.'}
                </p>
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" onClick={handleResetFilters} className="text-xs mt-2">
                    Clear all filters
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
