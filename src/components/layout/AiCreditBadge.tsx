"use client";

import { Sparkles } from "lucide-react";
import { useAiCredits } from "@/hooks/queries/creator-ai";

/**
 * Persistent topbar badge showing the user's available AI credit balance.
 * Reads from the single authoritative endpoint (GET /ai/credits).
 * Does not display a support path — there is none.
 */
export function AiCreditBadge() {
  const { data, isLoading } = useAiCredits();

  if (isLoading || !data) return null;

  return (
    <div
      className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border border-primary/20 bg-primary/5 text-primary select-none"
      title={`Lifetime: ${data.lifetimeGranted} granted, ${data.lifetimeSpent} spent`}
    >
      <Sparkles className="h-3.5 w-3.5" />
      <span>{data.balance} credits</span>
    </div>
  );
}
