'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  ConstructionSnapshot, 
  ConstructionSnapshotItem, 
  ConstructionStatus, 
  ConstructionPriority,
  ConstructionCategory 
} from '@/types/creator/phase4';
import { 
  AlertTriangle, 
  RefreshCw, 
  ArrowRight, 
  ArrowLeft,
  ArrowDownRight,
  ChevronDown,
  Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const CANONICAL_CATEGORIES: ConstructionCategory[] = [
  'Business Foundation',
  'Brand',
  'Market',
  'Business Model',
  'Finance',
  'Legal & Administration',
  'Team',
  'Skills',
  'Services',
  'Technology',
  'Funding',
  'Pricing',
  'Go-to-Market',
  'Launch Assets',
  'Operations',
];

const CATEGORY_REQUIREMENT_CONTEXT: Record<string, { needed: string; defaultImpact: string }> = {
  'Business Foundation': {
    needed: 'A validated project concept, business model, and coherent executive plan to guide venture development.',
    defaultImpact: 'The foundational structure aligns strategy and ensures all execution tracks build on a consistent business premise.',
  },
  'Brand': {
    needed: 'A defined brand identity, naming assets, typography, and visual assets for customer-facing communication.',
    defaultImpact: 'Consistent branding establishes credibility with early adopters and pilot customers.',
  },
  'Market': {
    needed: 'Clear customer persona definitions, market sizing, competitor differentiation, and demand signals.',
    defaultImpact: 'Validates that the solution addresses genuine market demand and informs go-to-market priorities.',
  },
  'Business Model': {
    needed: 'An articulated revenue model, cost structure, key partners, and channel distribution plan.',
    defaultImpact: 'Defines how the venture creates, delivers, and captures sustainable economic value.',
  },
  'Finance': {
    needed: 'Realistic 3-year revenue projections, expense modeling, cash flow trajectory, and working capital requirements.',
    defaultImpact: 'Guides resource allocation, pricing models, and financial milestone planning.',
  },
  'Legal & Administration': {
    needed: 'Appropriate legal form selection, regulatory compliance roadmap, and registration prerequisites.',
    defaultImpact: 'Protects intellectual property and ensures compliant commercial operation.',
  },
  'Team': {
    needed: 'Sufficient team capacity, defined roles, or identified collaborator coverage for core workstreams.',
    defaultImpact: 'Ensures operational capacity to execute the roadmap without critical staffing bottlenecks.',
  },
  'Skills': {
    needed: 'The essential technical, operational, or domain skills required to build and deliver the venture’s core offering.',
    defaultImpact: 'Uncovered skill gaps can delay execution or create delivery risks if not mitigated early.',
  },
  'Services': {
    needed: 'Access to external specialists (accounting, legal, technical, or advisory) where internal skills are insufficient.',
    defaultImpact: 'Fills key operational gaps with vetted external support during construction.',
  },
  'Technology': {
    needed: 'A defined technical stack, tooling infrastructure, or delivery architecture for the product or service.',
    defaultImpact: 'Ensures the product or operational platform can be built, hosted, and maintained reliably.',
  },
  'Funding': {
    needed: 'Identified capital sources, grant eligibility, or self-funding plan matched to launch cash requirements.',
    defaultImpact: 'Ensures the venture has sufficient runway to reach cash-flow milestones or external milestones.',
  },
  'Pricing': {
    needed: 'Defined pricing models, tier structures, willingness-to-pay assumptions, and gross margin targets.',
    defaultImpact: 'Directly determines revenue velocity, payback periods, and unit economic sustainability.',
  },
  'Go-to-Market': {
    needed: 'A structured pilot launch approach, initial lead channels, and customer acquisition messaging.',
    defaultImpact: 'Drives initial customer adoption and creates predictable early validation feedback loops.',
  },
  'Launch Assets': {
    needed: 'A high-converting landing page, presentation collateral, demo environment, or onboarding materials.',
    defaultImpact: 'Enables effective conversion of target leads during early pilot campaigns.',
  },
  'Operations': {
    needed: 'Standard operating procedures, support workflows, and day-to-day execution tools.',
    defaultImpact: 'Allows the team to deliver consistent customer outcomes efficiently as operations begin.',
  },
};

function getSourceUrl(source: string, ideaId: string): string {
  const s = source.toLowerCase();
  if (s.includes('brand') || s.includes('logo') || s.includes('identity')) {
    return `/dashboard/creator/phase-2?ideaId=${encodeURIComponent(ideaId)}`;
  }
  if (s.includes('profile') || s.includes('skill') || s.includes('humainx')) {
    return `/dashboard/creator/profile?ideaId=${encodeURIComponent(ideaId)}`;
  }
  if (s.includes('market')) {
    return `/dashboard/creator/phase-3/market-study?ideaId=${encodeURIComponent(ideaId)}`;
  }
  if (s.includes('model') || s.includes('canvas')) {
    return `/dashboard/creator/phase-3/business-model?ideaId=${encodeURIComponent(ideaId)}`;
  }
  if (s.includes('forecast') || s.includes('finance')) {
    return `/dashboard/creator/phase-3/forecast?ideaId=${encodeURIComponent(ideaId)}`;
  }
  if (s.includes('plan')) {
    return `/dashboard/creator/phase-3/business-plan?ideaId=${encodeURIComponent(ideaId)}`;
  }
  if (s.includes('legal') || s.includes('compliance') || s.includes('formation') || s.includes('team')) {
    return `/dashboard/creator/phase-3/formation?ideaId=${encodeURIComponent(ideaId)}`;
  }
  return `/dashboard/creator/phase-3?ideaId=${encodeURIComponent(ideaId)}`;
}

interface ConstructionSnapshotViewProps {
  ideaId?: string;
  projectName?: string;
  snapshot: ConstructionSnapshot | null;
  updateAvailable: boolean;
  changedSources: string[];
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
  onGenerate: () => Promise<void>;
  onRefresh: () => Promise<void>;
  onDismissStale?: () => void;
}

export function ConstructionSnapshotView({
  ideaId = '',
  projectName = 'Your Project',
  snapshot,
  updateAvailable,
  changedSources,
  isLoading,
  isGenerating,
  error,
  onGenerate,
  onRefresh,
  onDismissStale,
}: ConstructionSnapshotViewProps) {
  const [staleDismissed, setStaleDismissed] = useState(false);
  
  // Track open/collapsed state for categories and item explanations
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
    // Expand first critical or item with gap by default
  });

  // Collect and deduplicate all snapshot items
  const allItems = useMemo(() => {
    if (!snapshot) return [];
    const itemMap = new Map<string, ConstructionSnapshotItem>();
    
    // Add in canonical order
    const lists = [
      snapshot.criticalItems || [],
      snapshot.readyItems || [],
      snapshot.partialItems || [],
      snapshot.missingItems || [],
      snapshot.optionalItems || [],
    ];
    
    lists.forEach((list) => {
      list.forEach((item) => {
        if (!itemMap.has(item.key)) {
          itemMap.set(item.key, item);
        }
      });
    });

    return Array.from(itemMap.values());
  }, [snapshot]);

  // Group items by category
  const itemsByCategory = useMemo(() => {
    const grouped: Record<string, ConstructionSnapshotItem[]> = {};
    CANONICAL_CATEGORIES.forEach((cat) => {
      grouped[cat] = [];
    });
    allItems.forEach((item) => {
      if (grouped[item.category]) {
        grouped[item.category].push(item);
      } else {
        grouped[item.category] = [item];
      }
    });
    return grouped;
  }, [allItems]);

  // 1. Loading State
  if (isLoading || isGenerating) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center p-8 text-center bg-card border border-border rounded-2xl">
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <Layers className="w-6 h-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <h3 className="text-section-title font-semibold text-foreground mb-2">
          Building your construction snapshot…
        </h3>
        <p className="text-muted-foreground max-w-md text-body">
          MBC is combining your business plan, project data and professional profile.
        </p>
      </div>
    );
  }

  // 2. Error State
  if (error && !snapshot) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center bg-rose-950/10 border border-rose-500/30 rounded-2xl">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="text-section-title font-semibold text-foreground mb-2">
          We couldn't build your construction snapshot.
        </h3>
        <p className="text-muted-foreground max-w-md text-body mb-6">
          Your existing project data is safe. ({error})
        </p>
        <button
          onClick={onGenerate}
          className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl transition-colors inline-flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    );
  }

  // 3. Empty State
  if (!snapshot) {
    return (
      <div className="min-h-[450px] flex flex-col items-center justify-center p-12 text-center bg-card border border-border rounded-2xl">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-6 shadow-inner">
          <Layers className="w-8 h-8" />
        </div>
        <h2 className="text-page-heading font-bold text-foreground mb-3">
          Your construction snapshot is ready to be generated.
        </h2>
        <p className="text-muted-foreground max-w-lg text-body leading-relaxed mb-8">
          MBC analyzes your Phase 2 branding, Phase 3 business intelligence, and HumainX professional profile to diagnose what is ready, what is partial, and what requires attention before building.
        </p>
        <button
          onClick={onGenerate}
          className="px-8 py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl transition-all duration-200 shadow-md hover:scale-[1.02] flex items-center gap-2"
        >
          Generate My Snapshot
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Metric counts derived dynamically from actual items
  const readyCount = snapshot.readyItems?.length || 0;
  const partialCount = snapshot.partialItems?.length || 0;
  const missingCount = snapshot.missingItems?.length || 0;
  const criticalCount = snapshot.criticalItems?.length || 0;
  const optionalCount = snapshot.optionalItems?.length || 0;
  const totalRequirements = allItems.length;

  const criticalItems = snapshot.criticalItems || [];
  const displayProjectName = (projectName || 'PROJECT').toUpperCase();

  const toggleCategory = (category: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const toggleItem = (key: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleScrollToCategory = (category: string, itemKey?: string) => {
    // Ensure category is un-collapsed
    setCollapsedCategories((prev) => ({ ...prev, [category]: false }));
    if (itemKey) {
      setExpandedItems((prev) => ({ ...prev, [itemKey]: true }));
    }
    const element = document.getElementById(`category-${category.toLowerCase().replace(/\s+/g, '-')}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* COMPONENT 1: STATUS SUMMARY */}
      <div className="bg-card text-card-foreground border border-border rounded-xl p-6 shadow-sm">
        {/* 5 Status Columns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 lg:divide-x lg:divide-border">
          {/* 1. Ready */}
          <div className="space-y-1.5 lg:pr-6">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-500" />
              <span className="text-body font-normal text-muted-foreground">Ready</span>
            </div>
            <div className="font-mono text-stat-lg font-semibold text-foreground">
              {readyCount}
            </div>
          </div>

          {/* 2. Partial */}
          <div className="space-y-1.5 lg:px-6">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-500 dark:bg-slate-400" />
              <span className="text-body font-normal text-muted-foreground">Partial</span>
            </div>
            <div className="font-mono text-stat-lg font-semibold text-foreground">
              {partialCount}
            </div>
            <p className="text-badge text-muted-foreground font-normal">
              Includes items needing review
            </p>
          </div>

          {/* 3. Missing */}
          <div className="space-y-1.5 lg:px-6">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-600 dark:bg-amber-500" />
              <span className="text-body font-normal text-muted-foreground">Missing</span>
            </div>
            <div className="font-mono text-stat-lg font-semibold text-foreground">
              {missingCount}
            </div>
          </div>

          {/* 4. Critical */}
          <div className="space-y-1.5 lg:px-6">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-700 dark:bg-rose-500" />
              <span className="text-body font-normal text-muted-foreground">Critical</span>
            </div>
            <div className="font-mono text-stat-lg font-semibold text-foreground">
              {criticalCount}
            </div>
          </div>

          {/* 5. Optional */}
          <div className="space-y-1.5 lg:pl-6">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />
              <span className="text-body font-normal text-muted-foreground">Optional</span>
            </div>
            <div className="font-mono text-stat-lg font-semibold text-foreground">
              {optionalCount}
            </div>
          </div>
        </div>

        {/* Sub-strip Divider */}
        <div className="pt-4 mt-6 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="text-body text-muted-foreground font-normal">
            <span className="font-mono">{totalRequirements}</span> requirements identified from your project and Creator profile.
          </div>
          <div className="text-badge font-mono font-medium text-muted-foreground uppercase tracking-wider">
            {displayProjectName} · SCOPE V1
          </div>
        </div>
      </div>

      {/* COMPONENT 2: CRITICAL HIGHLIGHT ATTENTION STRIP */}
      {criticalItems.length > 0 && (
        <div className="bg-card border border-amber-500/30 dark:border-amber-500/40 rounded-xl px-5 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0" />
            <span className="text-body font-bold text-foreground">
              Critical item identified
            </span>
            <span className="text-badge font-medium px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
              {criticalItems[0].title}
            </span>
          </div>
          <button
            onClick={() => handleScrollToCategory(criticalItems[0].category, criticalItems[0].key)}
            className="text-body text-muted-foreground hover:text-foreground font-medium flex items-center gap-1 transition-colors group cursor-pointer"
          >
            <span>Detailed under {criticalItems[0].category} category below</span>
            <ArrowDownRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:translate-y-0.5 transition-transform" />
          </button>
        </div>
      )}

      {/* UPDATE AVAILABLE NOTATION */}
      {updateAvailable && !staleDismissed && (
        <div className="bg-muted/50 border border-border rounded-xl px-5 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <RefreshCw className="w-4 h-4 text-primary shrink-0" />
            <span className="text-body font-semibold text-foreground">
              Update available · Changes to your project information may affect this snapshot.
            </span>
            {changedSources && changedSources.length > 0 && (
              <div className="flex flex-wrap gap-1.5 items-center">
                {changedSources.map((source) => (
                  <span key={source} className="text-badge px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                    {source}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => {
                setStaleDismissed(true);
                onDismissStale?.();
              }}
              className="text-badge text-muted-foreground hover:text-foreground font-medium px-3 py-1.5 rounded-lg border border-border hover:bg-muted/80 transition-colors"
            >
              Keep current version
            </button>
            <button
              onClick={onRefresh}
              className="text-badge text-primary-foreground bg-primary hover:bg-primary/90 font-semibold px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Review changes
            </button>
          </div>
        </div>
      )}

      {/* COMPONENT 3, 4, 5: CATEGORY LIST (15 Canonical Categories) */}
      <div className="space-y-3">
        {CANONICAL_CATEGORIES.map((categoryName) => {
          const categoryItems = itemsByCategory[categoryName] || [];
          const isCollapsed = !!collapsedCategories[categoryName];
          const itemCount = categoryItems.length;
          const categoryDomId = `category-${categoryName.toLowerCase().replace(/\s+/g, '-')}`;

          return (
            <div
              key={categoryName}
              id={categoryDomId}
              className="bg-card text-card-foreground border border-border rounded-xl p-5 md:p-6 shadow-sm transition-all"
            >
              {/* Category Header (Trigger) */}
              <div
                role="button"
                tabIndex={0}
                aria-expanded={!isCollapsed}
                onClick={() => toggleCategory(categoryName)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleCategory(categoryName);
                  }
                }}
                className={cn(
                  "flex items-center justify-between gap-4 cursor-pointer select-none group focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg",
                  !isCollapsed && itemCount > 0 && "pb-4 border-b border-border"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <h3 className="text-section-title font-semibold text-foreground tracking-tight group-hover:text-primary transition-colors">
                    {categoryName}
                  </h3>
                  <span className="text-badge font-normal px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/50">
                    <span className="font-mono">{itemCount}</span> {itemCount === 1 ? 'item' : 'items'}
                  </span>
                </div>

                <div className="text-muted-foreground group-hover:text-foreground transition-colors p-1">
                  <ChevronDown
                    className={cn(
                      "w-4 h-4 transition-transform duration-200",
                      !isCollapsed ? "rotate-180" : ""
                    )}
                  />
                </div>
              </div>

              {/* Category Items List (Component 4 & 5) */}
              {!isCollapsed && itemCount > 0 && (
                <div className="pt-3 space-y-3">
                  {categoryItems.map((item) => {
                    const isItemExpanded = expandedItems[item.key] ?? (item.status === 'Critical');
                    const categoryContext = CATEGORY_REQUIREMENT_CONTEXT[item.category] || {
                      needed: 'Core operational requirement for venture readiness and execution.',
                      defaultImpact: 'Ensures structured milestone execution without unexpected blockers.',
                    };
                    const whatIsNeeded = categoryContext.needed;
                    const whatWeKnow = item.reason || 'Diagnostic evaluated from current project inputs and founder profile.';
                    const whyThisMatters = item.recommendedNextStep || categoryContext.defaultImpact;
                    const primarySource = (item.source && item.source.length > 0) ? item.source[0] : 'Phase 3';
                    const sourceUrl = getSourceUrl(primarySource, ideaId);

                    return (
                      <div
                        key={item.key}
                        className={cn(
                          "rounded-xl border transition-all",
                          isItemExpanded ? "border-border bg-card" : "border-transparent hover:bg-muted/40"
                        )}
                      >
                        {/* Item Row Header (Component 4) */}
                        <div
                          role="button"
                          tabIndex={0}
                          aria-expanded={isItemExpanded}
                          onClick={() => toggleItem(item.key)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              toggleItem(item.key);
                            }
                          }}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
                        >
                          <div className="flex items-center gap-3">
                            <StatusIndicatorDot status={item.status} />
                            <span className="text-body font-medium text-foreground">
                              {item.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                            {item.blocking && (
                              <span className="text-badge font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/40">
                                Blocking
                              </span>
                            )}
                            <PriorityLabel priority={item.priority} />
                            <StatusBadge status={item.status} />
                          </div>
                        </div>

                        {/* COMPONENT 5: EXPANDED EXPLANATION */}
                        {isItemExpanded && (
                          <div className="p-5 md:p-6 bg-muted/40 dark:bg-muted/20 rounded-b-xl border-t border-border/80 space-y-5">
                            {/* 3-Column Diagnostic Breakdown */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              {/* 1. What is needed */}
                              <div className="space-y-1.5">
                                <h4 className="text-badge font-semibold uppercase tracking-wider text-muted-foreground">
                                  WHAT IS NEEDED
                                </h4>
                                <p className="text-body text-foreground leading-relaxed">
                                  {whatIsNeeded}
                                </p>
                              </div>

                              {/* 2. What we know */}
                              <div className="space-y-1.5">
                                <h4 className="text-badge font-semibold uppercase tracking-wider text-muted-foreground">
                                  WHAT WE KNOW
                                </h4>
                                <p className="text-body text-foreground leading-relaxed">
                                  {whatWeKnow}
                                </p>
                              </div>

                              {/* 3. Why this matters */}
                              <div className="space-y-1.5">
                                <h4 className="text-badge font-semibold uppercase tracking-wider text-muted-foreground">
                                  WHY THIS MATTERS
                                </h4>
                                <p className="text-body text-foreground leading-relaxed">
                                  {whyThisMatters}
                                </p>
                              </div>
                            </div>

                            {/* Provenance / Source Footer */}
                            <div className="pt-4 border-t border-border/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-badge text-muted-foreground font-normal">
                                  Built from
                                </span>
                                {item.source && item.source.length > 0 ? (
                                  item.source.map((src, idx) => (
                                    <span
                                      key={idx}
                                      className="text-badge font-medium px-2.5 py-0.5 rounded-md bg-card text-foreground border border-border shadow-2xs"
                                    >
                                      {src}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-badge font-medium px-2.5 py-0.5 rounded-md bg-card text-foreground border border-border shadow-2xs">
                                    Project Intelligence
                                  </span>
                                )}
                              </div>

                              <Link
                                href={sourceUrl}
                                className="text-badge font-medium text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1 group"
                              >
                                <span>View source</span>
                                <span className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">↗</span>
                              </Link>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Clean Empty Category Placeholder */}
              {!isCollapsed && itemCount === 0 && (
                <div className="pt-3 pb-1 text-badge text-muted-foreground font-normal">
                  No evaluated requirements in this category yet.
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* COMPONENT 6: QUIET JOURNEY FOOTER */}
      <div className="pt-6 mt-10 border-t border-border flex items-center justify-between">
        <Link
          href={`/dashboard/creator/phase-3?ideaId=${encodeURIComponent(ideaId)}`}
          className="text-body font-medium text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Link>
        <Link
          href={`/dashboard/creator/phase-4/roadmap?ideaId=${encodeURIComponent(ideaId)}`}
          className="text-button font-medium text-primary-foreground bg-primary hover:bg-primary/90 px-6 py-2.5 rounded-xl transition-all inline-flex items-center gap-2 shadow-sm"
        >
          <span>Continue to Roadmap</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

function StatusIndicatorDot({ status }: { status: ConstructionStatus }) {
  switch (status) {
    case 'Ready':
      return <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 dark:bg-emerald-500 shrink-0" />;
    case 'NeedsReview':
      return <span className="w-2.5 h-2.5 rounded-full bg-slate-500 dark:bg-slate-400 shrink-0" />;
    case 'Partial':
      return <span className="w-2.5 h-2.5 rounded-full bg-slate-500 dark:bg-slate-400 shrink-0" />;
    case 'Missing':
      return <span className="w-2.5 h-2.5 rounded-full bg-amber-600 dark:bg-amber-500 shrink-0" />;
    case 'Critical':
      return <span className="w-2.5 h-2.5 rounded-full bg-amber-700 dark:bg-rose-500 shrink-0" />;
    case 'Optional':
      return <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />;
    default:
      return <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0" />;
  }
}

function PriorityLabel({ priority }: { priority: ConstructionPriority }) {
  const isCritical = priority === 'Critical';

  return (
    <span
      className={cn(
        "text-badge font-normal",
        isCritical
          ? "text-amber-700 dark:text-amber-400 font-medium"
          : "text-muted-foreground"
      )}
    >
      {priority} priority
    </span>
  );
}

function StatusBadge({ status }: { status: ConstructionStatus }) {
  switch (status) {
    case 'Ready':
      return (
        <span className="text-badge font-medium px-2.5 py-0.5 rounded border bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800">
          Ready
        </span>
      );
    case 'NeedsReview':
      return (
        <span className="text-badge font-medium px-2.5 py-0.5 rounded border bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
          Needs Review
        </span>
      );
    case 'Partial':
      return (
        <span className="text-badge font-medium px-2.5 py-0.5 rounded border bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
          Partial
        </span>
      );
    case 'Critical':
      return (
        <span className="text-badge font-medium px-2.5 py-0.5 rounded border border-transparent bg-amber-700 text-white dark:bg-rose-700 dark:text-white shadow-2xs">
          Critical
        </span>
      );
    case 'Missing':
      return (
        <span className="text-badge font-medium px-2.5 py-0.5 rounded border bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800">
          Missing
        </span>
      );
    case 'Optional':
      return (
        <span className="text-badge font-medium px-2.5 py-0.5 rounded border border-border text-muted-foreground bg-transparent">
          Optional
        </span>
      );
    default:
      return null;
  }
}
