"use client";

import { useState } from "react";
import { CheckCircle2, Clock, PenLine } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DealCardBase from "@/components/investor/DealCardBase";
import SignTermSheetDialog from "./SignTermSheetDialog";
import { useSignTermSheet } from "@/hooks/queries/deals";
import { deriveSignatures } from "@/lib/deal-utils";
import type { DealActivityEntry, DealRole, DealStatus } from "@/types/deals";

interface SignaturePanelProps {
  deal: DealStatus;
  activity: DealActivityEntry[];
  myRole: DealRole | null;
  dealId: string;
}

function SlotRow({ label, signed }: { label: string; signed: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-3 py-2.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {signed ? (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success-text">
          <CheckCircle2 className="h-4 w-4" aria-hidden />
          Signed
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-4 w-4" aria-hidden />
          Pending
        </span>
      )}
    </div>
  );
}

export default function SignaturePanel({ deal, activity, myRole, dealId }: SignaturePanelProps) {
  const { founderSigned, investorSigned, bothSigned } = deriveSignatures(deal, activity);
  const sign = useSignTermSheet(dealId);
  const [open, setOpen] = useState(false);

  const mySlotSigned = myRole === "founder" ? founderSigned : myRole === "investor" ? investorSigned : true;
  const roleLabel = myRole === "founder" ? "Founder" : "Investor";
  const counterpartyLabel = myRole === "founder" ? "investor" : "founder";

  const confirm = async (file: File) => {
    await sign.mutateAsync(file).catch(() => {});
    setOpen(false);
  };

  return (
    <DealCardBase>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">Signatures</h3>
        {bothSigned ? (
          <Badge variant="success">Both signed</Badge>
        ) : (
          <Badge variant="info">Ready for signatures</Badge>
        )}
      </div>

      <div className="space-y-2">
        <SlotRow label="Founder" signed={founderSigned} />
        <SlotRow label="Investor" signed={investorSigned} />
      </div>

      {bothSigned ? (
        <div className="mt-4 rounded-xl border border-success-text/30 bg-success-light/40 p-3">
          <p className="text-sm font-medium text-success-text">
            Both parties have signed the term sheet.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {myRole && !mySlotSigned ? (
            <Button size="sm" onClick={() => setOpen(true)} disabled={sign.isPending}>
              <PenLine className="h-4 w-4" aria-hidden />
              Sign as {roleLabel}
            </Button>
          ) : mySlotSigned ? (
            <p className="text-sm text-muted-foreground">
              You&apos;ve signed. Waiting for the {counterpartyLabel} to sign.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Awaiting signatures from both parties.
            </p>
          )}
        </div>
      )}

      {myRole ? (
        <SignTermSheetDialog
          open={open}
          onOpenChange={setOpen}
          roleLabel={roleLabel}
          pending={sign.isPending}
          onConfirm={confirm}
        />
      ) : null}
    </DealCardBase>
  );
}
