"use client";

import React, { useState } from "react";
import { Sparkles, Plus } from "lucide-react";
import { useAiCredits } from "@/hooks/queries/creator-ai";
import { BuyCreditsModal } from "@/components/credits/BuyCreditsModal";

/**
 * Persistent topbar badge showing the user's available AI credit balance,
 * with a direct action to open the Buy Credits modal.
 * Reads from the single authoritative endpoint (GET /ai/credits).
 */
export function AiCreditBadge() {
  const { data, isLoading } = useAiCredits();
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);

  if (isLoading || !data) return null;

  return (
    <>
      <div
        className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold pl-2.5 pr-1.5 py-1 rounded-lg border border-primary/20 bg-primary/5 text-primary select-none"
        title={`Lifetime: ${data.lifetimeGranted} granted, ${data.lifetimeSpent} spent`}
      >
        <Sparkles className="h-3.5 w-3.5" />
        <span>{data.balance} credits</span>
        <button
          type="button"
          onClick={() => setIsBuyModalOpen(true)}
          className="ml-1 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-[10px] font-bold"
          aria-label="Buy AI Credits"
        >
          <Plus className="h-2.5 w-2.5" />
          <span>Buy</span>
        </button>
      </div>

      <BuyCreditsModal
        isOpen={isBuyModalOpen}
        onClose={() => setIsBuyModalOpen(false)}
      />
    </>
  );
}
