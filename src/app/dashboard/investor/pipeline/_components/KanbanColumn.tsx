"use client";

import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import DealCardCompact from "@/components/investor/DealCardCompact";
import EmptyColumnPlaceholder from "./EmptyColumnPlaceholder";
import type { OpportunityCard } from "@/types/investor/opportunities";

interface KanbanColumnProps {
  title: string;
  status?: "new" | "review" | "nda" | "dataroom" | "negotiation" | "closed" | "won" | "lost";
  accent?: "default" | "primary";
  cards: OpportunityCard[];
  emptyLabel?: string;
}

const statusColors: Record<string, { bg: string; border: string }> = {
  new: { bg: "bg-blue-50 border-blue-200", border: "border-l-4 border-l-blue-500" },
  review: { bg: "bg-amber-50 border-amber-200", border: "border-l-4 border-l-amber-500" },
  nda: { bg: "bg-emerald-50 border-emerald-200", border: "border-l-4 border-l-emerald-500" },
  dataroom: { bg: "bg-teal-50 border-teal-200", border: "border-l-4 border-l-teal-500" },
  negotiation: { bg: "bg-orange-50 border-orange-200", border: "border-l-4 border-l-orange-500" },
  won: { bg: "bg-emerald-50 border-emerald-200", border: "border-l-4 border-l-emerald-600" },
  lost: { bg: "bg-red-50 border-red-200", border: "border-l-4 border-l-red-500" },
  closed: { bg: "bg-gray-50 border-gray-200", border: "border-l-4 border-l-gray-500" },
};

export default function KanbanColumn({ title, status = "new", accent = "default", cards, emptyLabel }: KanbanColumnProps) {
  const colors = statusColors[status] || statusColors.new;

  return (
    <div className={`flex h-full min-w-[280px] flex-col rounded-2xl border ${colors.bg} p-3 ${colors.border.split(" ")[0]}`}>
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
              <DealCardCompact key={c.companyId} card={c} columnStatus={status} />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
