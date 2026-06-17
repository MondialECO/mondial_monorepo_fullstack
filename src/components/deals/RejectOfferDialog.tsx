"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface RejectOfferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pending?: boolean;
  onConfirm: (note: string) => void;
}

export default function RejectOfferDialog({
  open,
  onOpenChange,
  pending,
  onConfirm,
}: RejectOfferDialogProps) {
  const [note, setNote] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject this offer?</DialogTitle>
          <DialogDescription>
            This ends the current offer thread. You can optionally tell the other
            party why.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="rejectNote">Reason (optional)</Label>
          <Textarea
            id="rejectNote"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Terms aren't a fit because…"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" onClick={() => onConfirm(note.trim())} disabled={pending}>
            {pending ? "Rejecting…" : "Reject offer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
