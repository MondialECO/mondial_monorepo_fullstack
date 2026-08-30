"use client";

import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface IncompleteDiligenceWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: () => void;
  blockedReason?: string | null;
}

export default function IncompleteDiligenceWarningModal({
  isOpen,
  onClose,
  onProceed,
  blockedReason,
}: IncompleteDiligenceWarningModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-amber-500">
            <AlertTriangle className="h-5 w-5" />
            <DialogTitle>Due Diligence In Progress</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground pt-1">
            {blockedReason
              ? `Note: ${blockedReason}`
              : "Due diligence has not been marked complete for this opportunity."}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-muted-foreground space-y-2">
          <p className="font-medium text-foreground">
            You may still proceed to structure a Term Sheet or Make an Offer.
          </p>
          <p>
            Completing due diligence is recommended before submitting binding offers, but finance verification remains the sole hard investment gate.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" size="sm" onClick={onClose}>
            Continue Reviewing
          </Button>
          <Button
            size="sm"
            onClick={() => {
              onClose();
              onProceed();
            }}
          >
            Proceed to Offer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
