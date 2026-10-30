"use client";

import { History, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";

type Props = {
  /** Server-computed: the output was built from an upstream input that has since changed. */
  stale: boolean | undefined;
  onRegenerate: () => void;
  /** From the credits API; null while unknown (the label then omits the price). */
  cost: number | null | undefined;
  disabled?: boolean;
};

/** Quiet "built on an older version" notice. Regenerating needs an explicit click; nothing runs automatically. */
export function StaleUpstreamNotice({ stale, onRegenerate, cost, disabled }: Props) {
  const { t } = useTranslation();
  if (!stale) return null;

  return (
    <div
      role="status"
      className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border px-4 py-3 text-caption"
      style={{ backgroundColor: "var(--card)", borderColor: "var(--border)", color: "var(--muted-foreground)" }}
    >
      <History className="size-4 shrink-0" style={{ color: "var(--dr-yellow)" }} aria-hidden="true" />
      <span className="flex-1 min-w-0">{t("creator.phase3.staleUpstream.message")}</span>
      <Button variant="outline" size="sm" onClick={onRegenerate} disabled={disabled} className="gap-1.5">
        <RotateCw className="size-3.5" aria-hidden="true" />
        {cost != null
          ? t("creator.phase3.staleUpstream.regenerateWithCost", { cost })
          : t("creator.phase3.staleUpstream.regenerate")}
      </Button>
    </div>
  );
}
