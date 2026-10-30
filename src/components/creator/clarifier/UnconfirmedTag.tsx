import Link from "next/link";
import { useTranslation } from "@/hooks/useTranslation";

type Props = {
  /** Clarifier topic (1–6) to open for a re-judged edit. */
  topic: number;
  ideaId: string | null | undefined;
};

/** Amber "Unconfirmed — thin answer" marker with a "Fix it" link into that topic's edit. Never blocks progress. */
export function UnconfirmedTag({ topic, ideaId }: Props) {
  const { t } = useTranslation();
  const params = new URLSearchParams({ fix: String(topic) });
  if (ideaId) params.set("ideaId", ideaId);

  return (
    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
      <span
        className="rounded-full border px-2 py-0.5 text-caption font-medium"
        style={{ backgroundColor: "var(--dr-bg-yellow)", borderColor: "var(--dr-yellow)", color: "var(--foreground)" }}
      >
        {t("creator.phase2.ideaSummary.unconfirmedTag")}
      </span>
      <Link
        href={`/dashboard/creator/phase-2/clarifier?${params.toString()}`}
        className="text-caption font-medium underline-offset-2 hover:underline"
        style={{ color: "var(--primary)" }}
      >
        {t("creator.phase2.ideaSummary.fixIt")}
      </Link>
    </span>
  );
}
