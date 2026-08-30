"use client";

import { useState } from "react";
import { MessageSquare, Loader2, Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAskFounderQuestion } from "@/hooks/queries/investor-diligence";

interface AskFounderModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  documentId?: string | null;
  documentTitle?: string | null;
  onSuccess?: () => void;
}

export default function AskFounderModal({
  isOpen,
  onClose,
  companyId,
  documentId,
  documentTitle,
  onSuccess,
}: AskFounderModalProps) {
  const [question, setQuestion] = useState("");
  const askMutation = useAskFounderQuestion(companyId);

  async function handleSend() {
    if (!question.trim()) return;
    await askMutation.mutateAsync({
      documentId: documentId || undefined,
      documentTitle: documentTitle || "General Diligence",
      question: question.trim(),
    });
    setQuestion("");
    onSuccess?.();
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <MessageSquare className="h-5 w-5" />
            <DialogTitle>Ask Founder a Question</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            {documentTitle
              ? `Your question will be linked to "${documentTitle}". `
              : "Ask a general due diligence question. "}
            The founder will be notified and can answer directly in their data room.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {documentTitle && (
            <div className="rounded-lg border border-border bg-muted/30 p-2.5 text-xs">
              <span className="font-medium text-foreground">Related Document:</span>{" "}
              <span className="text-muted-foreground">{documentTitle}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Your Question</label>
            <Textarea
              placeholder="e.g. What assumptions support the 2027 revenue forecast? Does this contract renew automatically?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={4}
              className="resize-none text-sm"
              autoFocus
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" size="sm" onClick={onClose} disabled={askMutation.isPending}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSend}
            disabled={!question.trim() || askMutation.isPending}
          >
            {askMutation.isPending ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="mr-1.5 h-3.5 w-3.5" />
            )}
            Send Question
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
