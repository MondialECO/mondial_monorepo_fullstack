"use client";

import { useState } from "react";
import {
  MessageSquare,
  CheckCircle2,
  Clock,
  ExternalLink,
  MessageCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { DiligenceQuestion } from "@/lib/api-investor-diligence";
import Link from "next/link";

interface DiligenceQuestionsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  questions: DiligenceQuestion[];
  onOpenAskModal: () => void;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

export default function DiligenceQuestionsDrawer({
  isOpen,
  onClose,
  questions,
  onOpenAskModal,
}: DiligenceQuestionsDrawerProps) {
  const [tab, setTab] = useState<"open" | "answered">("open");

  const openQuestions = questions.filter((q) => q.status === "open");
  const answeredQuestions = questions.filter((q) => q.status === "answered" || q.status === "closed");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[650px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <DialogTitle>Founder Q&A Ledger</DialogTitle>
            </div>
            <Button
              size="sm"
              onClick={() => {
                onClose();
                onOpenAskModal();
              }}
            >
              Ask New Question
            </Button>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Track structured due diligence questions submitted to the founder and their answers.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          defaultValue="open"
          value={tab}
          onValueChange={(v) => setTab(v as "open" | "answered")}
          className="flex-1 flex flex-col min-h-0"
        >
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="open" className="text-xs">
              Open Questions ({openQuestions.length})
            </TabsTrigger>
            <TabsTrigger value="answered" className="text-xs">
              Answered ({answeredQuestions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="open" className="flex-1 overflow-y-auto space-y-3 mt-3 pr-1">
            {openQuestions.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                No open questions pending founder response.
              </div>
            ) : (
              openQuestions.map((q) => (
                <div
                  key={q.id}
                  className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10">
                        <Clock className="mr-1 h-3 w-3" />
                        Awaiting Response
                      </Badge>
                      {q.documentTitle && (
                        <span className="text-xs text-muted-foreground font-medium truncate max-w-[220px]">
                          {q.documentTitle}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground">{formatDate(q.askedAt)}</span>
                  </div>

                  <p className="text-sm font-medium text-foreground">{q.question}</p>

                  <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground">
                    <span>Asked by you</span>
                    {q.matchId && (
                      <Link
                        href={`/dashboard/investor/pipeline`}
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                        onClick={onClose}
                      >
                        <MessageCircle className="h-3 w-3" />
                        Open Conversation
                      </Link>
                    )}
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="answered" className="flex-1 overflow-y-auto space-y-3 mt-3 pr-1">
            {answeredQuestions.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                No answered questions yet.
              </div>
            ) : (
              answeredQuestions.map((q) => (
                <div
                  key={q.id}
                  className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Answered
                      </Badge>
                      {q.documentTitle && (
                        <span className="text-xs text-muted-foreground font-medium truncate max-w-[220px]">
                          {q.documentTitle}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground">{formatDate(q.askedAt)}</span>
                  </div>

                  <p className="text-sm font-medium text-foreground">{q.question}</p>

                  {q.founderResponse && (
                    <div className="rounded-lg border border-border bg-background p-3 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-primary">
                        <span>Founder Response</span>
                        {q.respondedAt && (
                          <span className="text-[10px] text-muted-foreground font-normal">
                            {formatDate(q.respondedAt)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-foreground whitespace-pre-wrap">{q.founderResponse}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
