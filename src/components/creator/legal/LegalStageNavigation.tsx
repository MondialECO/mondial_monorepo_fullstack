'use client';

import React from 'react';
import {
  Layers,
  Building2,
  FileCheck2,
  Rocket,
  ShoppingBag,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Circle,
  FileText,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { LegalStageBreakdownDto } from '@/lib/api-creator-journey';

export interface StageNavOption {
  key: string;
  label: string;
  subLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const WORKSPACE_STAGES: StageNavOption[] = [
  {
    key: 'overview',
    label: 'Overview',
    subLabel: 'Roadmap & readiness summary',
    icon: Layers,
  },
  {
    key: 'before_creation',
    label: 'Before Company Creation',
    subLabel: 'Legal structure, statuts, capital',
    icon: FileCheck2,
  },
  {
    key: 'company_creation',
    label: 'Company Creation',
    subLabel: 'INPI immatriculation & RBE',
    icon: Building2,
  },
  {
    key: 'before_launch',
    label: 'Before Launch',
    subLabel: 'RGPD, privacy, mentions légales',
    icon: Rocket,
  },
  {
    key: 'before_sale',
    label: 'Before First Sale',
    subLabel: 'CGV, DSP2 payments, cancellation',
    icon: ShoppingBag,
  },
  {
    key: 'ongoing',
    label: 'Ongoing Operations',
    subLabel: 'RC Pro, URSSAF & invoicing',
    icon: RefreshCw,
  },
];

interface LegalStageNavigationProps {
  selectedStage: string;
  onSelectStage: (stageKey: string) => void;
  planningReadinessPct: number;
  stageBreakdown: LegalStageBreakdownDto[];
  totalApplicableCount: number;
  totalCompletedCount: number;
  needsInfoCount: number;
  actionRequiredCount: number;
  className?: string;
}

export function LegalStageNavigation({
  selectedStage,
  onSelectStage,
  planningReadinessPct,
  stageBreakdown,
  totalApplicableCount,
  totalCompletedCount,
  needsInfoCount,
  actionRequiredCount,
  evidenceVaultCount,
  className,
}: LegalStageNavigationProps & { evidenceVaultCount?: number }) {
  return (
    <aside
      aria-label="Legal Roadmap Stages"
      className={cn(
        'w-full md:w-64 lg:w-72 shrink-0 flex flex-col gap-4 bg-card/60 border border-border/70 rounded-2xl p-4 shadow-sm',
        className,
      )}
    >
      {/* Top Summary Card */}
      <div className="space-y-2 p-3 bg-muted/30 border border-border/50 rounded-xl">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
            Planning Readiness
          </span>
          <span className="font-bold text-sm text-foreground font-mono">
            {Math.round(planningReadinessPct)}%
          </span>
        </div>
        <Progress value={planningReadinessPct} className="h-1.5 bg-muted" />
        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
          <span>{totalCompletedCount} of {totalApplicableCount} satisfied</span>
          <span>France MVP</span>
        </div>
        {(actionRequiredCount > 0 || needsInfoCount > 0) && (
          <div className="flex flex-wrap gap-1.5 pt-1 text-[10px]">
            {actionRequiredCount > 0 && (
              <Badge variant="outline" className="px-1.5 py-0 border-primary/30 text-primary bg-primary/5">
                {actionRequiredCount} action{actionRequiredCount > 1 ? 's' : ''}
              </Badge>
            )}
            {needsInfoCount > 0 && (
              <Badge variant="warning" className="px-1.5 py-0">
                {needsInfoCount} to clarify
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Navigation Stage List */}
      <nav className="flex flex-col gap-1">
        {WORKSPACE_STAGES.map((stage) => {
          const isSelected = selectedStage === stage.key;
          const Icon = stage.icon;

          if (stage.key === 'overview') {
            return (
              <button
                key={stage.key}
                type="button"
                onClick={() => onSelectStage(stage.key)}
                className={cn(
                  'flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-xl transition-colors text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  isSelected
                    ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                    : 'text-foreground hover:bg-muted/50 hover:text-foreground',
                )}
              >
                <Icon className={cn('w-4 h-4 shrink-0', isSelected ? 'text-primary-foreground' : 'text-primary')} />
                <div className="flex-1 min-w-0">
                  <div className="truncate">{stage.label}</div>
                  <div className={cn('text-[10px] truncate', isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
                    {stage.subLabel}
                  </div>
                </div>
              </button>
            );
          }

          const stageInfo = stageBreakdown.find((s) => s.stage === stage.key);
          const total = stageInfo?.totalCount ?? 0;
          const completed = stageInfo?.completedCount ?? 0;
          const isAllDone = total > 0 && completed === total;
          const isInProgress = total > 0 && completed > 0 && completed < total;

          return (
            <button
              key={stage.key}
              type="button"
              onClick={() => onSelectStage(stage.key)}
              className={cn(
                'flex items-center justify-between gap-2.5 w-full text-left px-3 py-2.5 rounded-xl transition-colors text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                isSelected
                  ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                  : 'text-foreground hover:bg-muted/50 hover:text-foreground',
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon className={cn('w-4 h-4 shrink-0', isSelected ? 'text-primary-foreground' : 'text-muted-foreground')} />
                <div className="min-w-0">
                  <div className="truncate text-xs font-semibold leading-snug">{stage.label}</div>
                  <div className={cn('text-[10px] truncate', isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
                    {stage.subLabel}
                  </div>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-1.5 pl-1">
                {total > 0 ? (
                  <>
                    <span
                      className={cn(
                        'text-[10px] font-mono font-medium',
                        isSelected ? 'text-primary-foreground/90' : 'text-muted-foreground',
                      )}
                    >
                      {completed}/{total}
                    </span>
                    {isAllDone ? (
                      <CheckCircle2 className={cn('w-3.5 h-3.5', isSelected ? 'text-primary-foreground' : 'text-success-text')} />
                    ) : isInProgress ? (
                      <div className={cn('w-2 h-2 rounded-full', isSelected ? 'bg-primary-foreground' : 'bg-primary')} />
                    ) : (
                      <Circle className={cn('w-3 h-3', isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground/40')} />
                    )}
                  </>
                ) : (
                  <span className={cn('text-[10px]', isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground/50')}>
                    —
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Stage 8 Dedicated Evidence Vault Link */}
      <div className="pt-3 border-t border-border/60">
        <button
          type="button"
          onClick={() => onSelectStage('evidence_vault')}
          className={cn(
            'flex items-center justify-between gap-2.5 w-full text-left px-3 py-2.5 rounded-xl transition-colors text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
            selectedStage === 'evidence_vault'
              ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
              : 'text-foreground hover:bg-muted/50 hover:text-foreground',
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <FileText className={cn('w-4 h-4 shrink-0', selectedStage === 'evidence_vault' ? 'text-primary-foreground' : 'text-primary')} />
            <div className="min-w-0">
              <div className="truncate text-xs font-semibold leading-snug">Evidence Vault</div>
              <div className={cn('text-[10px] truncate', selectedStage === 'evidence_vault' ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
                Proof repository & audit
              </div>
            </div>
          </div>

          {typeof evidenceVaultCount === 'number' && evidenceVaultCount > 0 && (
            <Badge
              variant={selectedStage === 'evidence_vault' ? 'secondary' : 'outline'}
              className="text-[10px] px-1.5 py-0 font-mono"
            >
              {evidenceVaultCount}
            </Badge>
          )}
        </button>
      </div>
    </aside>
  );
}
