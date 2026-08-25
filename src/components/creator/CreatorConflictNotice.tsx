"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCreatorProgress } from "@/providers/CreatorProgressProvider";

export function CreatorConflictNotice() {
  const { error, refetch } = useCreatorProgress();
  const [dismissed, setDismissed] = useState(false);
  const status = (error as { response?: { status?: number } } | null)?.response?.status;
  if (dismissed || status !== 409) return null;

  return (
    <div className="mx-auto mt-3 flex w-full max-w-6xl items-center justify-between gap-3 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-foreground">
      <span>This idea was updated in another tab. Refresh to load the latest version before continuing.</span>
      <div className="flex shrink-0 gap-2">
        <Button size="sm" onClick={() => { setDismissed(false); void refetch(); }}>Refresh</Button>
        <Button size="sm" variant="outline" onClick={() => setDismissed(true)}>Stay here</Button>
      </div>
    </div>
  );
}
