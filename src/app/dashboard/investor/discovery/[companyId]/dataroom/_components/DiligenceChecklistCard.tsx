"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Circle,
  ShieldCheck,
  RotateCcw,
  Loader2,
  Lock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useCompleteDiligence,
  useReopenDiligence,
  useUpdateChecklistOverride,
} from "@/hooks/queries/investor-diligence";
import type { DiligenceSummary, DiligenceChecklistItem } from "@/lib/api-investor-diligence";

interface DiligenceChecklistCardProps {
  summary: DiligenceSummary;
  companyId: string;
  onOpenQuestions: () => void;
}

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

function categoryStatusBadge(status: string) {
  switch (status) {
    case "complete":
      return (
        <Badge variant="outline" className="text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Complete
        </Badge>
      );
    case "in_review":
      return (
        <Badge variant="outline" className="text-[10px] text-blue-600 dark:text-blue-400 border-blue-500/30 bg-blue-500/10">
          <Clock className="mr-1 h-3 w-3" />
          In Review
        </Badge>
      );
    case "needs_attention":
      return (
        <Badge variant="outline" className="text-[10px] text-rose-600 dark:text-rose-400 border-rose-500/30 bg-rose-500/10">
          <AlertTriangle className="mr-1 h-3 w-3" />
          Needs Attention
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-[10px] text-muted-foreground border-border bg-muted/40">
          <Circle className="mr-1 h-3 w-3" />
          Not Started
        </Badge>
      );
  }
}

export default function DiligenceChecklistCard({
  summary,
  companyId,
  onOpenQuestions,
}: DiligenceChecklistCardProps) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const completeMutation = useCompleteDiligence(companyId);
  const reopenMutation = useReopenDiligence(companyId);
  const overrideMutation = useUpdateChecklistOverride(companyId);

  const isCompleted = summary.status === "completed";

  async function handleConfirmComplete() {
    await completeMutation.mutateAsync();
    setShowConfirmModal(false);
  }

  async function handleToggleCategory(item: DiligenceChecklistItem) {
    if (isCompleted) return;
    const nextStatus = item.status === "complete" ? "in_review" : "complete";
    await overrideMutation.mutateAsync({
      categoryKey: item.categoryKey,
      status: nextStatus,
    });
  }

  return (
    <>
      <Card className="border-border rounded-2xl overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Due Diligence Checklist
            </CardTitle>
            {isCompleted ? (
              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 border-emerald-500/30">
                Completed
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-[10px]">
                {summary.status === "in_progress" ? "In Progress" : "Not Started"}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-muted-foreground">
                {summary.checklistCompletedCount} of {summary.totalChecklistCategories} categories verified
              </span>
              <span className="text-lg font-bold text-foreground tabular-nums">
                {summary.percentComplete}%
              </span>
            </div>
            <Progress value={summary.percentComplete} aria-label="Diligence completion" />
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-2 pt-1 text-center">
            <div className="rounded-xl border border-border/60 bg-muted/20 p-2">
              <div className="text-sm font-bold text-foreground">{summary.reviewedDocuments}/{summary.totalDocuments}</div>
              <div className="text-[10px] text-muted-foreground">Docs Reviewed</div>
            </div>
            <button
              type="button"
              onClick={onOpenQuestions}
              className="rounded-xl border border-border/60 bg-muted/20 p-2 hover:bg-muted/40 transition-colors text-center"
            >
              <div className="text-sm font-bold text-primary">{summary.openQuestionsCount}</div>
              <div className="text-[10px] text-muted-foreground">Open Questions</div>
            </button>
            <div className="rounded-xl border border-border/60 bg-muted/20 p-2">
              <div className="text-sm font-bold text-rose-500">{summary.needsAttentionCount}</div>
              <div className="text-[10px] text-muted-foreground">Attention</div>
            </div>
          </div>

          {/* Canonical Category List */}
          <div className="space-y-2 pt-2">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Verification Areas
            </div>
            <ul className="space-y-1.5 divide-y divide-border/40">
              {summary.checklist.map((item) => (
                <li
                  key={item.categoryKey}
                  className="flex items-center justify-between pt-1.5 first:pt-0 text-xs"
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="font-medium text-foreground truncate">{item.title}</span>
                    {item.totalDocuments > 0 && (
                      <span className="text-[10px] text-muted-foreground">
                        {item.reviewedDocuments}/{item.totalDocuments} docs reviewed
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleCategory(item)}
                      disabled={isCompleted || overrideMutation.isPending}
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      {categoryStatusBadge(item.status)}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Action button */}
          <div className="pt-3 border-t border-border/60">
            {isCompleted ? (
              <div className="space-y-2">
                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-700 dark:text-emerald-300">
                  <div className="font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    Due Diligence Completed
                  </div>
                  <div className="text-[11px] mt-0.5 opacity-80">
                    Completed on {formatDate(summary.completedAt)}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs text-muted-foreground"
                  onClick={() => reopenMutation.mutate()}
                  disabled={reopenMutation.isPending}
                >
                  {reopenMutation.isPending ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  Reopen Due Diligence
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {!summary.canComplete && summary.blockedReason && (
                  <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 p-2.5 text-[11px] text-amber-700 dark:text-amber-300">
                    <Lock className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span>{summary.blockedReason}</span>
                  </div>
                )}
                <Button
                  className="w-full text-xs font-semibold"
                  size="sm"
                  onClick={() => setShowConfirmModal(true)}
                  disabled={!summary.canComplete || completeMutation.isPending}
                >
                  {completeMutation.isPending ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  Mark Due Diligence Complete
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Complete Due Diligence?</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              This confirms that you have reviewed the required data room documents, resolved open questions with the founder, and satisfied your diligence checklist.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl border border-border bg-muted/30 p-3.5 text-xs text-muted-foreground space-y-1.5">
            <p className="font-medium text-foreground">Next Steps:</p>
            <ul className="list-disc list-inside space-y-1 pl-1">
              <li>You can continue reviewing documents or reopen diligence at any time.</li>
              <li>You may proceed to create or negotiate a Term Sheet with the founder.</li>
            </ul>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setShowConfirmModal(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmComplete}
              disabled={completeMutation.isPending}
            >
              {completeMutation.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Confirm Completion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
