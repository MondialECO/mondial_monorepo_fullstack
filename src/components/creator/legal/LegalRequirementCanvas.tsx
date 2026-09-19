'use client';

import React, { useState } from 'react';
import {
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileText,
  Upload,
  ChevronRight,
  ShieldCheck,
  HelpCircle,
  Sparkles,
  Layers,
  ArrowRight,
  Info,
  FolderCheck,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  type ExtendedLegalChecklistItem,
  type ChecklistStatus,
  type LegalEvidenceLinkDto,
} from '@/lib/api-creator-journey';
import { type CreatorIdeaDocument } from '@/lib/api-creator-documents';
import { cn } from '@/lib/utils';

interface LegalRequirementCanvasProps {
  selectedStage: string;
  stageName: string;
  items: ExtendedLegalChecklistItem[];
  selectedItem: ExtendedLegalChecklistItem | null;
  onSelectItem: (item: ExtendedLegalChecklistItem) => void;
  onStatusChange: (item: ExtendedLegalChecklistItem, newStatus: ChecklistStatus) => Promise<void>;
  onOpenEvidenceModal: (item: ExtendedLegalChecklistItem) => void;
  documents: CreatorIdeaDocument[];
  detectedArchetypes: string[];
  planningReadinessPct: number;
  onGoToStage: (stageKey: string) => void;
  evidenceLinks?: LegalEvidenceLinkDto[];
  onViewInVault?: (stage: string, requirementId: string) => void;
  onOpenAiGuide?: () => void;
  className?: string;
}

const STATUS_LABELS: Record<ChecklistStatus, { label: string; badgeVariant: 'default' | 'secondary' | 'outline' | 'destructive' | 'success' | 'warning' | 'info'; icon: React.ComponentType<{ className?: string }> }> = {
  not_started: { label: 'Not Started', badgeVariant: 'outline', icon: Clock },
  pending: { label: 'Pending', badgeVariant: 'outline', icon: Clock },
  action_required: { label: 'Action Required', badgeVariant: 'destructive', icon: AlertTriangle },
  in_progress: { label: 'In Progress', badgeVariant: 'warning', icon: Clock },
  needs_information: { label: 'Needs Information', badgeVariant: 'warning', icon: HelpCircle },
  ready_for_review: { label: 'Ready for Review', badgeVariant: 'info', icon: Info },
  reviewed: { label: 'Reviewed', badgeVariant: 'info', icon: CheckCircle2 },
  completed: { label: 'Completed', badgeVariant: 'success', icon: CheckCircle2 },
  done: { label: 'Completed', badgeVariant: 'success', icon: CheckCircle2 },
  not_applicable: { label: 'Not Applicable', badgeVariant: 'secondary', icon: Info },
};

const NEXT_STATUS_MAP: Record<ChecklistStatus, ChecklistStatus> = {
  not_started: 'in_progress',
  pending: 'in_progress',
  action_required: 'in_progress',
  needs_information: 'in_progress',
  in_progress: 'completed',
  ready_for_review: 'completed',
  reviewed: 'completed',
  completed: 'in_progress',
  done: 'in_progress',
  not_applicable: 'not_applicable',
};

export function LegalRequirementCanvas({
  selectedStage,
  stageName,
  items,
  selectedItem,
  onSelectItem,
  onStatusChange,
  onOpenEvidenceModal,
  documents,
  detectedArchetypes,
  planningReadinessPct,
  onGoToStage,
  evidenceLinks,
  onViewInVault,
  onOpenAiGuide,
  className,
}: LegalRequirementCanvasProps) {
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);

  const handleStatusToggle = async (item: ExtendedLegalChecklistItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextStatus = NEXT_STATUS_MAP[item.status] || 'completed';
    try {
      setUpdatingItemId(item.id);
      await onStatusChange(item, nextStatus);
    } finally {
      setUpdatingItemId(null);
    }
  };

  // 1. Overview Mode Render
  if (selectedStage === 'overview') {
    const applicableItems = items.filter((i) => i.status !== 'not_applicable');
    const completedCount = applicableItems.filter((i) => i.status === 'completed' || i.status === 'done' || i.status === 'reviewed').length;
    const actionRequiredItems = applicableItems.filter((i) => i.status === 'action_required' || i.status === 'not_started' || i.status === 'pending');
    const needsInfoItems = applicableItems.filter((i) => i.status === 'needs_information' || i.evaluationStatus === 'needs_information');

    // Next recommended action derivation
    const nextAction = actionRequiredItems[0] || needsInfoItems[0] || applicableItems[0];

    return (
      <div className={cn('flex-1 min-w-0 space-y-6', className)}>
        {/* Overview Header Banner */}
        <div className="bg-card/70 border border-border/70 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-badge font-semibold uppercase tracking-wider text-muted-foreground">
                Executive Synthesis
              </span>
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                France Statutory Intelligence
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Deterministic statutory obligations personalized from your business plan, revenue model, and privacy profile.
              </p>
            </div>
            <div className="text-right shrink-0">
              <div className="text-3xl font-black text-foreground font-mono">
                {Math.round(planningReadinessPct)}%
              </div>
              <span className="text-caption text-muted-foreground">Planning Readiness</span>
            </div>
          </div>

          {/* Business Profile Badges */}
          <div className="pt-2 border-t border-border/50">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
              Classified Business Profile
            </span>
            <div className="flex flex-wrap gap-2">
              {detectedArchetypes.map((archetype, idx) => (
                <Badge key={idx} variant="secondary" className="px-2.5 py-1 text-xs font-medium border border-border/50">
                  {archetype}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Next Action Box */}
        {nextAction && (
          <Card className="rounded-2xl border-primary/30 bg-primary/5 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-badge font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Next Recommended Action
              </span>
              <Badge variant="outline" className="text-[10px] uppercase font-bold text-primary border-primary/20">
                {nextAction.priority || 'High'} Priority
              </Badge>
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                {nextAction.title || nextAction.label}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                {nextAction.whyItApplies || 'Statutory French requirement based on your active business model.'}
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                onGoToStage(nextAction.stage || 'before_launch');
                onSelectItem(nextAction);
              }}
              className="rounded-xl text-xs gap-1.5 bg-primary hover:bg-primary/95 text-primary-foreground font-medium"
            >
              Open Requirement <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Card>
        )}

        {/* Quick Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className="rounded-2xl border-border/60 bg-card p-4 space-y-1 text-center">
            <span className="text-caption text-muted-foreground block">Applicable Laws</span>
            <span className="text-2xl font-bold text-foreground">{applicableItems.length}</span>
            <span className="text-[11px] text-muted-foreground block">Curated French statutes</span>
          </Card>
          <Card className="rounded-2xl border-border/60 bg-card p-4 space-y-1 text-center">
            <span className="text-caption text-muted-foreground block">Actions Needed</span>
            <span className="text-2xl font-bold text-warning">{actionRequiredItems.length}</span>
            <span className="text-[11px] text-muted-foreground block">To satisfy before launch</span>
          </Card>
          <Card className="rounded-2xl border-border/60 bg-card p-4 space-y-1 text-center">
            <span className="text-caption text-muted-foreground block">Satisfied</span>
            <span className="text-2xl font-bold text-success-text">{completedCount}</span>
            <span className="text-[11px] text-muted-foreground block">Milestones fulfilled</span>
          </Card>
        </div>
      </div>
    );
  }

  // 2. Stage Specific Items
  const stageItems = items.filter((i) => i.stage === selectedStage);

  if (stageItems.length === 0) {
    return (
      <div className={cn('flex-1 flex flex-col items-center justify-center p-12 text-center bg-card/40 border border-dashed border-border rounded-2xl', className)}>
        <Layers className="w-8 h-8 text-muted-foreground/40 mb-3" />
        <h3 className="text-sm font-bold text-foreground">No requirements identified for this stage</h3>
        <p className="text-xs text-muted-foreground max-w-sm mt-1 leading-relaxed">
          Based on your current Business Plan, MBC has not identified an applicable statutory obligation for this phase.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('flex-1 min-w-0 space-y-6', className)}>
      {/* Stage Header */}
      <div className="flex items-center justify-between border-b border-border/60 pb-4">
        <div>
          <span className="text-badge font-semibold uppercase tracking-wider text-muted-foreground">
            Stage Requirements
          </span>
          <h2 className="text-lg font-bold text-foreground">{stageName}</h2>
        </div>
        <Badge variant="outline" className="text-xs font-mono font-semibold bg-muted/30">
          {stageItems.filter((i) => i.status === 'completed' || i.status === 'done').length} / {stageItems.length} Done
        </Badge>
      </div>

      {/* Main Working Split: List on top/left, Selected Detail view below/right */}
      <div className="space-y-4">
        {/* Requirement Cards List */}
        <div className="grid grid-cols-1 gap-2.5">
          {stageItems.map((item) => {
            const isSelected = selectedItem?.id === item.id;
            const statusConfig = STATUS_LABELS[item.status] || STATUS_LABELS.not_started;
            const StatusIcon = statusConfig.icon;
            const hasEvidence = Boolean(item.evidenceDocumentId);

            return (
              <div
                key={item.id}
                onClick={() => onSelectItem(item)}
                className={cn(
                  'group p-4 rounded-2xl border transition-all cursor-pointer bg-card shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4',
                  isSelected
                    ? 'border-primary ring-1 ring-primary/40 bg-primary/[0.02]'
                    : 'border-border/70 hover:border-border hover:bg-muted/20',
                )}
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                      {item.title || item.label}
                    </h3>
                    <Badge variant={statusConfig.badgeVariant} className="text-[10px] gap-1 px-2 py-0">
                      <StatusIcon className="w-3 h-3" />
                      {statusConfig.label}
                    </Badge>
                    {item.isNewRequirement && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold">
                        + NEW
                      </Badge>
                    )}
                    {item.priority === 'critical' && (
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0 uppercase">
                        Critical
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {item.whyItApplies || 'Statutory requirement based on project classification.'}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground pt-1">
                    {item.officialSource?.authority && (
                      <span className="flex items-center gap-1 font-medium text-foreground/80">
                        🏛 {item.officialSource.authority}
                      </span>
                    )}
                    {item.requiresEvidence && (
                      <span className={cn('flex items-center gap-1 font-medium', hasEvidence ? 'text-success-text' : 'text-amber-600 dark:text-amber-400')}>
                        <FileText className="w-3 h-3" />
                        {hasEvidence ? 'Evidence attached' : 'Evidence required'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <Button
                    size="sm"
                    variant={item.status === 'completed' || item.status === 'done' ? 'secondary' : 'outline'}
                    onClick={(e) => handleStatusToggle(item, e)}
                    disabled={updatingItemId === item.id}
                    className="text-xs rounded-xl h-8 px-3 border-border font-medium"
                  >
                    {item.status === 'completed' || item.status === 'done' ? 'Completed' : 'Mark Completed'}
                  </Button>
                  <ChevronRight className={cn('w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform', isSelected && 'text-primary rotate-90 sm:rotate-0')} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Requirement Deep Detail Card */}
        {selectedItem && (
          <Card className="rounded-2xl border-border bg-card p-6 space-y-5 shadow-sm mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] font-mono uppercase bg-muted/30">
                    {selectedItem.ruleId || selectedItem.id}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px] uppercase">
                    {selectedItem.category}
                  </Badge>
                </div>
                <h3 className="text-base font-bold text-foreground mt-1.5">
                  {selectedItem.title || selectedItem.label}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                {onOpenAiGuide && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onOpenAiGuide}
                    className="3xl:hidden rounded-xl text-xs gap-1.5 h-8 font-medium border-border hover:bg-muted/60"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    AI Guide
                  </Button>
                )}
                <Button
                  size="sm"
                  variant={selectedItem.status === 'completed' || selectedItem.status === 'done' ? 'secondary' : 'default'}
                  onClick={(e) => handleStatusToggle(selectedItem, e)}
                  disabled={updatingItemId === selectedItem.id}
                  className={cn(
                    'rounded-xl text-xs gap-1.5 h-8 font-medium',
                    (selectedItem.status === 'completed' || selectedItem.status === 'done') && 'text-success-text bg-success-light/30 hover:bg-success-light/50 border border-success-text/30',
                  )}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {selectedItem.status === 'completed' || selectedItem.status === 'done' ? 'Completed' : 'Mark Completed'}
                </Button>
              </div>
            </div>

            {/* Why This Applies Section */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-primary uppercase tracking-wider block">
                Why this applies to your business
              </span>
              <p className="text-xs text-foreground leading-relaxed bg-muted/20 border border-border/50 p-3.5 rounded-xl">
                {selectedItem.whyItApplies || 'MBC identified this requirement based on your business classification in France.'}
              </p>
            </div>

            {/* Official Source Card */}
            {selectedItem.officialSource && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                  Official Public French Source
                </span>
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/30 border border-border/60 text-xs">
                  <div className="min-w-0 pr-3">
                    <span className="font-bold text-foreground block">
                      {selectedItem.officialSource.authority}
                    </span>
                    <span className="text-muted-foreground block truncate">
                      {selectedItem.officialSource.title}
                    </span>
                    {selectedItem.officialSource.articleReference && (
                      <span className="text-[10px] text-muted-foreground/80 font-mono block mt-0.5">
                        {selectedItem.officialSource.articleReference}
                      </span>
                    )}
                  </div>
                  <Button asChild size="sm" variant="outline" className="rounded-lg h-7 text-xs gap-1 shrink-0 border-border">
                    <a href={selectedItem.officialSource.url} target="_blank" rel="noopener noreferrer">
                      View source <ExternalLink className="w-3 h-3" />
                    </a>
                  </Button>
                </div>
              </div>
            )}

            {/* Evidence Link / Attachment Area */}
            <div className="space-y-3 pt-3 border-t border-border/50">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Supporting Legal Evidence
                </span>
                <div className="flex items-center gap-2">
                  {onViewInVault && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onViewInVault(selectedItem.stage || 'company_creation', selectedItem.id)}
                      className="rounded-lg text-xs h-7 gap-1 text-primary hover:bg-primary/10"
                    >
                      <FolderCheck className="w-3 h-3" /> View in Vault
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onOpenEvidenceModal(selectedItem)}
                    className="rounded-lg text-xs h-7 gap-1.5 border-border"
                  >
                    <Upload className="w-3 h-3" />
                    {selectedItem.evidenceDocumentId ? 'Add / Replace' : 'Attach Evidence'}
                  </Button>
                </div>
              </div>

              {(() => {
                const itemLinks = evidenceLinks?.filter((l) => l.requirementId === selectedItem.id) || [];
                const hasPrimaryDoc = Boolean(selectedItem.evidenceDocumentId);

                if (itemLinks.length > 0) {
                  return (
                    <div className="space-y-2">
                      <div className="text-[11px] text-muted-foreground font-medium">
                        {itemLinks.length} document{itemLinks.length > 1 ? 's' : ''} attached as compliance evidence:
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {itemLinks.map((link) => (
                          <div
                            key={link.id}
                            className="flex items-center justify-between p-3 bg-card border border-border/80 rounded-xl text-xs shadow-xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <FileText className="w-4 h-4 text-primary shrink-0" />
                              <div className="min-w-0">
                                <span className="font-bold text-foreground truncate block">
                                  {link.documentTitle || link.documentFileName}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-mono">
                                  {link.documentFileName}
                                </span>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-[10px] px-2 py-0 border-primary/30 text-primary bg-primary/5">
                              {link.status.replace(/_/g, ' ')}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }

                if (hasPrimaryDoc) {
                  const attachedDoc = documents.find((d) => d.id === selectedItem.evidenceDocumentId);
                  return (
                    <div className="flex items-center justify-between p-3 bg-success-light/10 border border-success-text/30 rounded-xl text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className="w-4 h-4 text-success-text shrink-0" />
                        <div className="min-w-0">
                          <span className="font-bold text-foreground truncate block">
                            {attachedDoc?.title || attachedDoc?.fileName || 'Attached Evidence Document'}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {attachedDoc?.documentType || 'Uploaded'}
                          </span>
                        </div>
                      </div>
                      <Badge variant="success" className="text-[10px] px-2 py-0">
                        Linked
                      </Badge>
                    </div>
                  );
                }

                return (
                  <p className="text-caption text-muted-foreground leading-relaxed italic bg-muted/10 p-3 rounded-xl border border-dashed border-border">
                    No proof document attached yet. {selectedItem.evidenceLabel ? `Expected: ${selectedItem.evidenceLabel}` : 'You can attach an official certificate, contract, or policy PDF.'}
                  </p>
                );
              })()}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
