import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SkipFollowUpAction } from "@/components/creator/clarifier/SkipFollowUpAction";
import { useTranslation } from "@/hooks/useTranslation";
import { splitAiReply } from "@/lib/clarifier-answers";
import type { ClarifierChatMessage } from "@/types/creator/journey-api";

type Props = {
  message: ClarifierChatMessage;
  /** The latest message while its topic is still being asked: only then chips and Skip show. */
  active: boolean;
  disabled?: boolean;
  /** A chip only fills the input; it never sends. */
  onChip: (chip: string) => void;
  onSkip: () => void;
};

/** An AI follow-up: acknowledgement, the question, then (while active) the idea's chips and Skip. */
export function FollowUpCard({ message, active, disabled, onChip, onSkip }: Props) {
  const { t } = useTranslation();
  const { ack, question } = splitAiReply(message.text);
  const chips = active ? message.chips ?? [] : [];

  return (
    <div className="flex w-full max-w-[712px] flex-col gap-4 rounded-2xl border border-foreground/20 bg-popover p-5 shadow-sm">
      <span className="sr-only">{t("creator.phase2.clarifier.sr.assistantPrefix", "Assistant: ")}</span>
      <div className="flex flex-col gap-0.5 font-sans text-body leading-relaxed text-foreground">
        {ack && <p className="whitespace-pre-line">{ack}</p>}
        <p className="whitespace-pre-line font-medium">{question}</p>
      </div>

      {active && (
        <div className="flex flex-col gap-2.5">
          <Separator />
          {chips.length > 0 && (
            <>
              <p className="text-badge font-medium text-muted-foreground">{t("creator.phase2.clarifier.chipsPrompt")}</p>
              <div role="group" aria-label={t("creator.phase2.clarifier.chipsLabel")} className="flex flex-wrap gap-2">
                {chips.map((chip) => (
                  <Button
                    key={chip}
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={disabled}
                    onClick={() => onChip(chip)}
                    className="h-auto whitespace-normal rounded-full bg-popover px-4 py-2 text-left font-sans text-body font-normal text-foreground"
                  >
                    {chip}
                  </Button>
                ))}
              </div>
            </>
          )}
          <div>
            <SkipFollowUpAction message={message} disabled={disabled} onSkip={onSkip} />
          </div>
        </div>
      )}
    </div>
  );
}
