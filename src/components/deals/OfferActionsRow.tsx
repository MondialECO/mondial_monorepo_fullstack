"use client";

import { Check, X, Reply } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OfferActionsRowProps {
  pending: boolean;
  onCounter: () => void;
  onAccept: () => void;
  onReject: () => void;
}

// Rendered only when it is the caller's turn on an open offer (turn-gating is
// decided by the parent). Shows exactly the allowed actions.
export default function OfferActionsRow({
  pending,
  onCounter,
  onAccept,
  onReject,
}: OfferActionsRowProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm" onClick={onAccept} disabled={pending}>
        <Check className="h-4 w-4" aria-hidden />
        Accept
      </Button>
      <Button size="sm" variant="outline" onClick={onCounter} disabled={pending}>
        <Reply className="h-4 w-4" aria-hidden />
        Counter
      </Button>
      <Button size="sm" variant="outline" onClick={onReject} disabled={pending}>
        <X className="h-4 w-4" aria-hidden />
        Reject
      </Button>
    </div>
  );
}
