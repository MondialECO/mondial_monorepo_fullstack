"use client";

import { useState } from "react";
import { SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface MessageComposerProps {
  disabled?: boolean;
  sending?: boolean;
  onSend: (text: string) => void;
}

export default function MessageComposer({
  disabled,
  sending,
  onSend,
}: MessageComposerProps) {
  const [value, setValue] = useState("");

  const submit = () => {
    const text = value.trim();
    if (!text || disabled || sending) return;
    onSend(text);
    setValue("");
  };

  return (
    <div className="flex items-end gap-2 border-t border-border bg-card p-3">
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder="Write a message…"
        rows={1}
        disabled={disabled}
        className="max-h-32 min-h-[42px] resize-none"
        aria-label="Message"
      />
      <Button
        type="button"
        size="icon"
        onClick={submit}
        disabled={disabled || sending || !value.trim()}
        className="h-[42px] w-[42px] shrink-0"
        aria-label="Send message"
      >
        <SendHorizontal className="h-4 w-4" />
      </Button>
    </div>
  );
}
