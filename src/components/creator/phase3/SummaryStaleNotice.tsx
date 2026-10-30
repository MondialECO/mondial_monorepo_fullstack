"use client";

import Link from "next/link";
import { Info } from "lucide-react";
import { useCreatorProgress } from "@/providers/CreatorProgressProvider";
import { useTranslation } from "@/hooks/useTranslation";
import { summaryIsStale } from "@/lib/clarifier-answers";

/** Same rule as the clarifier CTA and idea-summary: an answer changed after the last C-2 summary. */
export function useClarifierSummaryStale(): boolean {
  const { state } = useCreatorProgress();
  const p2 = state.journeyState?.phase2;
  return !!p2?.clarifierSessionId && summaryIsStale(p2?.clarifierAnswers ?? [], p2?.clarifierSummarizedAt);
}

/**
 * Phase 3 notice for the window between changing an answer (e.g. "Fix it") and regenerating the
 * summary. Points to the idea summary; offers no Phase 3 regenerate, which would still run on the
 * old summary. Nothing runs automatically.
 */
export function SummaryStaleNotice() {
  const { t } = useTranslation();
  if (!useClarifierSummaryStale()) return null;

  return (
    <div
      role="status"
      className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border px-4 py-3 text-caption"
      style={{ backgroundColor: "var(--card)", borderColor: "var(--border)", color: "var(--muted-foreground)" }}
    >
      <Info className="size-4 shrink-0" style={{ color: "var(--dr-yellow)" }} aria-hidden="true" />
      <span className="flex-1 min-w-0">{t("creator.phase3.summaryStale.message")}</span>
      <Link href="/dashboard/creator/phase-2/idea-summary" className="font-medium underline-offset-2 hover:underline" style={{ color: "var(--primary)" }}>
        {t("creator.phase3.summaryStale.action")}
      </Link>
    </div>
  );
}
