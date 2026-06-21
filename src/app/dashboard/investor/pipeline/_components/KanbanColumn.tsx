"use client";

import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import DealCardCompact from "@/components/investor/DealCardCompact";
import EmptyColumnPlaceholder from "./EmptyColumnPlaceholder";
import type { OpportunityCard } from "@/types/investor/opportunities";

interface KanbanColumnProps {
  title: string;
  accent?: "default" | "primary";
  cards: OpportunityCard[];
  emptyLabel?: string;
}

export default function KanbanColumn({ title, accent = "default", cards, emptyLabel }: KanbanColumnProps) {
  return (
    <div className="flex h-full min-w-[280px] flex-col rounded-2xl border border-border bg-muted/30 p-3">
      <div className="mb-3 flex items-center justify-between gap-2 px-1">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <Badge
          variant={accent === "primary" ? "default" : "secondary"}
          className="text-[10px]"
        >
          {cards.length}
        </Badge>
      </div>

      {cards.length === 0 ? (
        <EmptyColumnPlaceholder label={emptyLabel} />
      ) : (
        <ScrollArea className="flex-1 max-h-[560px] pr-1">
          <div className="space-y-2">
            {cards.map((c) => (
              <DealCardCompact key={c.companyId} card={c} />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
