"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CloseDealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pending?: boolean;
  onConfirm: () => void;
}

export default function CloseDealDialog({
  open,
  onOpenChange,
  pending,
  onConfirm,
}: CloseDealDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Close this deal?</DialogTitle>
          <DialogDescription>
            Both parties have signed the term sheet. Closing marks the deal as
            completed. This is final and cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onConfirm} disabled={pending}>
            {pending ? "Closing…" : "Close deal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
