'use client';

import React, { useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type {
  ExtendedLegalChecklistItem,
  ChecklistStatus,
} from '@/lib/api-creator-journey';

export type FigmaStageTabKey = 'before_register' | 'register_launch' | 'running_business';

export interface StageTabConfig {
  key: FigmaStageTabKey;
  label: string;
  stageFilter: (item: ExtendedLegalChecklistItem) => boolean;
}

export const FIGMA_STAGE_TABS: StageTabConfig[] = [
  {
    key: 'before_register',
    label: 'Before you register',
    stageFilter: (i) => i.stage === 'before_creation',
  },
  {
    key: 'register_launch',
    label: 'Register & prepare to launch',
    stageFilter: (i) =>
      i.stage === 'company_creation' ||
      i.stage === 'before_launch' ||
      i.stage === 'before_sale',
  },
  {
    key: 'running_business',
    label: 'Running your business',
    stageFilter: (i) => i.stage === 'ongoing',
  },
];

interface LegalFigmaStageSectionProps {
  items: ExtendedLegalChecklistItem[];
  activeTab: FigmaStageTabKey;
  onTabChange: (tab: FigmaStageTabKey) => void;
  expandedItemId: string | null;
  onToggleExpand: (itemId: string) => void;
  onStatusChange: (item: ExtendedLegalChecklistItem, newStatus: ChecklistStatus) => Promise<void>;
  disclaimer?: string;
  className?: string;
}

export function getTimingGuidance(item: ExtendedLegalChecklistItem): string {
  const stage = item.stage;
  if (stage === 'before_creation') {
    return 'Review this before committing to registration or launch. Any permission identified will have its own timing.';
  }
  if (stage === 'company_creation' || stage === 'before_launch' || stage === 'before_sale') {
    return 'Handle this during official company filing and before accepting customer traffic or commercial payments.';
  }
  return 'Maintain and review this on a recurring basis throughout active commercial operations in France.';
}

export function getActionSteps(item: ExtendedLegalChecklistItem): string[] {
  const id = (item.ruleId || item.id || '').toUpperCase();
  const title = (item.title || item.label || '').toLowerCase();

  if (id.includes('CORP-001') || title.includes('capital')) {
    return [
      'Choose a registered French bank or online escrow provider.',
      'Deposit initial share capital and obtain the official deposit certificate (attestation de dépôt).',
    ];
  }
  if (id.includes('CORP-002') || title.includes('statut')) {
    return [
      'Draft constitutional bylaws defining governance, shareholding split, and corporate purpose.',
      'Sign finalized statuts with all initial co-founders.',
    ];
  }
  if (id.includes('CORP-003') || title.includes('gazette') || title.includes('jal')) {
    return [
      'Publish statutory legal announcement in an authorized legal journal (JAL).',
      'Obtain proof of publication certificate.',
    ];
  }
  if (id.includes('CORP-004') || title.includes('inpi') || title.includes('immatricul')) {
    return [
      'Prepare mandatory documents (statuts, capital cert, JAL publication, founder ID).',
      'Submit company registration on formalites.entreprises.gouv.fr (Guichet Unique).',
      'Receive official SIREN / SIRET registration and KBIS extract.',
    ];
  }
  if (id.includes('CORP-005') || title.includes('rbe') || title.includes('beneficiar')) {
    return [
      'Identify all beneficial owners holding >25% capital or voting rights.',
      'File beneficial ownership declaration (RBE) on the INPI portal.',
    ];
  }
  if (id.includes('PRIV') || id.includes('RGPD') || title.includes('gdpr') || title.includes('privacy')) {
    return [
      'Map all personal customer data collected through your application or website.',
      'Publish a comprehensive Privacy Policy specifying data retention and user rights.',
      'Ensure analytics and payment processors comply with GDPR requirements.',
    ];
  }
  if (id.includes('CONS') || id.includes('CGV') || title.includes('terms') || title.includes('sale')) {
    return [
      'Draft clear Terms of Sale specifying pricing in Euros including all statutory taxes (TTC).',
      'Include the statutory 14-day consumer retraction clause and dispute mediation contact.',
    ];
  }
  if (id.includes('INS') || title.includes('assurance') || title.includes('rc pro')) {
    return [
      'Request commercial professional liability (RC Pro) quotes suited to your sector.',
      'Underwrite coverage before entering contracts with enterprise clients.',
    ];
  }
  if (id.includes('IP') || title.includes('marque') || title.includes('name')) {
    return [
      'Verify business name and trademark availability on the INPI public register.',
      'File trademark protection to prevent brand dilution in France.',
    ];
  }
  if (item.evidenceLabel) {
    return [
      `Prepare supporting documentation: ${item.evidenceLabel}.`,
      'Review the official statutory guidance relevant to that commercial activity.',
    ];
  }

  return [
    'Confirm what customers will pay you for.',
    'Review the official statutory guidance relevant to that commercial activity.',
  ];
}

export function LegalFigmaStageSection({
  items,
  activeTab,
  onTabChange,
  expandedItemId,
  onToggleExpand,
  onStatusChange,
  disclaimer,
  className,
}: LegalFigmaStageSectionProps) {
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);

  // Filter items for current active tab
  const currentTabConfig = FIGMA_STAGE_TABS.find((t) => t.key === activeTab) || FIGMA_STAGE_TABS[0];
  const tabItems = items.filter(currentTabConfig.stageFilter);

  const handleCheckboxClick = async (item: ExtendedLegalChecklistItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const isCompleted = item.status === 'completed' || item.status === 'done' || item.status === 'reviewed';
    const newStatus: ChecklistStatus = isCompleted ? 'in_progress' : 'completed';

    try {
      setUpdatingItemId(item.id);
      await onStatusChange(item, newStatus);
    } finally {
      setUpdatingItemId(null);
    }
  };

  return (
    <div className={cn('space-y-6 pt-4', className)}>
      {/* 5.1 Section Header (Figma 57156:9158) */}
      <div className="space-y-1">
        <h2 className="text-card-title sm:text-xl font-semibold tracking-tight text-foreground font-heading">
          Your steps, organised by stage
        </h2>
        <p className="text-body text-muted-foreground leading-relaxed font-sans">
          Open a step to see why it matters, when to handle it and what to do.
        </p>
      </div>

      {/* 5.2 Segmented Nav - Stages Tabs (Figma 57156:9158) */}
      <div className="flex items-center gap-1.5 p-1 bg-muted dark:bg-muted/50 rounded-lg border border-border/60">
        {FIGMA_STAGE_TABS.map((tab) => {
          const isSelected = activeTab === tab.key;
          const count = items.filter(tab.stageFilter).length;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange(tab.key)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded text-label font-medium transition-all cursor-pointer font-sans',
                isSelected
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-card/40'
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-badge font-medium leading-none font-mono',
                  isSelected
                    ? 'bg-muted text-foreground'
                    : 'bg-card text-muted-foreground'
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 5.3 Checklist Task List Container (Figma 57156:9158) */}
      <div>
        {tabItems.length === 0 ? (
          <Card className="p-8 text-center rounded-lg border border-border/80 bg-card space-y-2">
            <p className="text-card-title font-semibold text-foreground font-heading">No requirements in this stage</p>
            <p className="text-body text-muted-foreground font-sans">
              Based on your active venture classification, no statutory tasks apply to this stage.
            </p>
          </Card>
        ) : (
          <div className="rounded-lg border border-border/80 bg-card divide-y divide-border/60 shadow-xs overflow-hidden">
            {tabItems.map((item) => {
              const isExpanded = expandedItemId === item.id;
              const isCompleted =
                item.status === 'completed' || item.status === 'done' || item.status === 'reviewed';
              const isUpdating = updatingItemId === item.id;

              return (
                <div
                  key={item.id}
                  id={`task-${item.id}`}
                  className={cn(
                    'transition-colors',
                    isExpanded ? 'bg-muted/30 dark:bg-card/90' : 'bg-card'
                  )}
                >
                  {/* Task Header Row (Figma 57156:9158) */}
                  <div
                    onClick={() => onToggleExpand(item.id)}
                    className={cn(
                      'p-5 flex items-start justify-between gap-4 cursor-pointer select-none transition-colors',
                      isExpanded ? 'hover:bg-muted/10' : 'hover:bg-muted/20'
                    )}
                  >
                    <div className="flex items-start gap-4 min-w-0 flex-1">
                      {/* Checkbox */}
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={(e) => handleCheckboxClick(item, e)}
                        aria-label={`Mark ${item.title || item.label} as ${isCompleted ? 'incomplete' : 'completed'}`}
                        className={cn(
                          'size-5 rounded flex items-center justify-center shrink-0 transition-all cursor-pointer mt-0.5',
                          isCompleted
                            ? 'bg-success-strong text-white shadow-xs'
                            : 'border border-border/90 bg-card hover:border-primary shadow-xs',
                          isUpdating && 'opacity-50 pointer-events-none'
                        )}
                      >
                        {isCompleted && <Check className="size-3.5 stroke-[2.5]" />}
                      </button>

                      {/* Task Title, Subtitle & Done Badge */}
                      <div className="min-w-0 flex-1 space-y-1">
                        <h3 className="text-section-title font-semibold text-foreground leading-snug font-heading">
                          {item.title || item.label}
                        </h3>
                        <p className="text-body text-muted-foreground leading-relaxed font-sans">
                          {item.whyItApplies || 'Someone else may already have rights to it.'}
                        </p>
                        {isCompleted && (
                          <div className="pt-0.5">
                            <span className="inline-flex items-center text-badge font-medium py-0.5 px-2.5 rounded-full bg-success-light text-success-strong dark:bg-success-strong/15 dark:text-emerald-300 font-sans">
                              Marked done by you
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Chevron */}
                    <div className="shrink-0 pt-0.5">
                      {isExpanded ? (
                        <ChevronUp className="size-4 text-primary" />
                      ) : (
                        <ChevronDown className="size-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Detail Content (Figma Task 2 Expanded - 56px indented) */}
                  {isExpanded && (
                    <div className="px-5 pb-6 pt-1 sm:pl-14 sm:pr-6 sm:pb-6 space-y-4 animate-in fade-in-0 duration-200 border-t border-border/40">
                      {/* A. WHY THIS APPLIES TO YOU */}
                      <div className="space-y-1">
                        <span className="text-caption font-bold uppercase tracking-wider text-foreground block font-heading">
                          WHY THIS APPLIES TO YOU
                        </span>
                        <p className="text-body text-muted-foreground leading-relaxed font-sans">
                          {item.whyItApplies ||
                            'Requirements depend on what your service actually provides.'}
                        </p>
                      </div>

                      {/* B. WHEN TO DO IT */}
                      <div className="space-y-1">
                        <span className="text-caption font-bold uppercase tracking-wider text-foreground block font-heading">
                          WHEN TO DO IT
                        </span>
                        <p className="text-body text-muted-foreground leading-relaxed font-sans">
                          {getTimingGuidance(item)}
                        </p>
                      </div>

                      {/* C. WHAT TO DO */}
                      <div className="space-y-1">
                        <span className="text-caption font-bold uppercase tracking-wider text-foreground block font-heading">
                          WHAT TO DO
                        </span>
                        <div className="space-y-1 text-body text-muted-foreground leading-relaxed font-sans">
                          {getActionSteps(item).map((step, idx) => (
                            <p key={idx}>{step}</p>
                          ))}
                        </div>
                      </div>

                      {/* D. OFFICIAL GUIDANCE CARD (Figma 57156:9158) */}
                      <div className="rounded border border-border/80 bg-card p-4 space-y-1 shadow-xs">
                        <div className="text-badge font-bold uppercase tracking-wider text-muted-foreground font-sans">
                          OFFICIAL GUIDANCE
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                          <p className="text-body font-semibold text-foreground leading-snug font-sans">
                            {item.officialSource?.authority
                              ? `${item.officialSource.authority} — ${item.officialSource.title || 'France’s official business information service'}`
                              : 'Service Public — France’s official business information service'}
                          </p>
                          {item.officialSource?.url && (
                            <a
                              href={item.officialSource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-label font-medium text-primary hover:underline shrink-0 inline-flex items-center gap-1 font-sans"
                            >
                              Open the official guide ↗
                            </a>
                          )}
                        </div>
                      </div>

                      {/* E. SUBTLE REMINDER (Figma 57156:9158) */}
                      <div className="pt-1">
                        <p className="text-footnote text-muted-foreground font-sans">
                          Mark this step done once you have completed the checks.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5.4 Quiet Legal Disclaimer (Figma 57156:9158) */}
      <p className="text-footnote text-muted-foreground text-center py-2 leading-relaxed font-sans">
        Checkmarks record your progress; they do not represent legal verification by MBC.
      </p>
    </div>
  );
}
