import { cn } from "@/lib/utils";
import { formatClockTime } from "@/lib/messaging-utils";
import type { ChatMessage } from "@/types/chat";

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
}

export default function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  return (
    <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm",
          isOwn
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-muted text-foreground rounded-bl-md"
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.message}</p>
        <div
          className={cn(
            "mt-1 text-[10px] tabular-nums",
            isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
          )}
        >
          {formatClockTime(message.createdAt)}
        </div>
      </div>
    </div>
  );
}
