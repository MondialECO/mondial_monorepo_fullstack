"use client";

import Link from "next/link";
import { Info } from "lucide-react";
import { useCreatorProgress } from "@/providers/CreatorProgressProvider";
import { useTranslation } from "@/hooks/useTranslation";
import { weakTopics } from "@/lib/clarifier-answers";

/**
 * Quiet notice for Phase 3 screens that consume the C-2 summary. Reads the live per-topic status,
 * so it disappears as soon as no topic is weak. Renders nothing otherwise; never blocks progress.
 */
export function ThinAnswersBanner() {
  const { t } = useTranslation();
  const { state } = useCreatorProgress();
  const count = weakTopics(state.journeyState?.phase2?.clarifierAnswers).length;
  if (count === 0) return null;

  return (
    <div
      role="note"
      className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border px-4 py-3 text-caption"
      style={{ backgroundColor: "var(--card)", borderColor: "var(--border)", color: "var(--muted-foreground)" }}
    >
      <Info className="size-4 shrink-0" style={{ color: "var(--dr-yellow)" }} aria-hidden="true" />
      <span className="flex-1 min-w-0">
        {count === 1
          ? t("creator.phase3.thinAnswersBanner.one")
          : t("creator.phase3.thinAnswersBanner.many", { count })}
      </span>
      <Link href="/dashboard/creator/phase-2/idea-summary" className="font-medium underline-offset-2 hover:underline" style={{ color: "var(--primary)" }}>
        {t("creator.phase3.thinAnswersBanner.review")}
      </Link>
    </div>
  );
}
