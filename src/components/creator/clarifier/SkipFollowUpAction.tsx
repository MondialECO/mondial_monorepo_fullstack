import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import type { ClarifierChatMessage } from "@/types/creator/journey-api";

type Props = {
  /** The latest transcript message; the action shows only while it is an AI follow-up. */
  message: ClarifierChatMessage | undefined;
  disabled?: boolean;
  onSkip: () => void;
};

/** Quiet "Skip — keep my answer" next to the chips. Keeps the answer as a thin one and moves on; no AI call. */
export function SkipFollowUpAction({ message, disabled, onSkip }: Props) {
  const { t } = useTranslation();
  if (message?.sender !== "ai" || message.kind !== "followup") return null;

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={disabled}
      onClick={onSkip}
      className="text-muted-foreground hover:text-foreground"
    >
      {t("creator.phase2.clarifier.skipFollowUp")}
    </Button>
  );
}
