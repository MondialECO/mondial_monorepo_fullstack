"use client";

import { useState } from "react";
import { CheckCircle2, PartyPopper } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DealCardBase from "@/components/investor/DealCardBase";
import CloseDealDialog from "./CloseDealDialog";
import { useCloseDeal } from "@/hooks/queries/deals";
import {
  canCloseDeal,
  completionTimestamp,
  deriveSignatures,
  formatDateTime,
  isClosed,
} from "@/lib/deal-utils";
import type { DealActivityEntry, DealRole, DealStatus } from "@/types/deals";

interface DealCompletionPanelProps {
  deal: DealStatus;
  activity: DealActivityEntry[];
  myRole: DealRole | null;
  dealId: string;
}

export default function DealCompletionPanel({
  deal,
  activity,
  myRole,
  dealId,
}: DealCompletionPanelProps) {
  const close = useCloseDeal(dealId);
  const [open, setOpen] = useState(false);

  const closed = isClosed(deal);
  const { bothSigned } = deriveSignatures(deal, activity);
  const lifecycleDesynced = bothSigned && deal.status !== "signed" && !closed;

  // Nothing to show until both parties have signed (signatures panel covers
  // the earlier stages).
  if (!closed && !bothSigned) return null;

  if (closed) {
    const closedAt = completionTimestamp(activity);
    return (
      <DealCardBase className="border-success-text/30 bg-success-light/40">
        <div className="flex items-start gap-3">
          <PartyPopper className="mt-0.5 h-5 w-5 shrink-0 text-success-text" aria-hidden />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">Deal completed</h3>
              <Badge variant="success">Completed</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              This deal is closed and final.
              {closedAt ? ` Completed ${formatDateTime(closedAt)}.` : ""}
            </p>
          </div>
        </div>
      </DealCardBase>
    );
  }

  if (lifecycleDesynced) {
    return (
      <DealCardBase>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Deal completion</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Finalizing signature status… Close will become available when the signed deal status is confirmed.
            </p>
          </div>
          <Badge variant="warning">Finalizing</Badge>
        </div>
      </DealCardBase>
    );
  }

  const confirm = async () => {
    await close.mutateAsync().catch(() => {});
    setOpen(false);
  };

  return (
    <DealCardBase>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">Deal completion</h3>
        <Badge variant="info">Ready to close</Badge>
      </div>
      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <CheckCircle2 className="h-4 w-4 text-success-text" aria-hidden />
        Both parties have signed the term sheet.
      </p>

      <div className="mt-4">
        {canCloseDeal(deal, myRole) ? (
          <Button size="sm" onClick={() => setOpen(true)} disabled={close.isPending}>
            Close deal
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">
            Waiting for the founder to close the deal.
          </p>
        )}
      </div>

      <CloseDealDialog
        open={open}
        onOpenChange={setOpen}
        pending={close.isPending}
        onConfirm={confirm}
      />
    </DealCardBase>
  );
}
