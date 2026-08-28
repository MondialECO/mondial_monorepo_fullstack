"use client";

import { useState } from "react";
import KanbanColumn from "./KanbanColumn";
import type { InvestorPipelineColumns } from "@/types/investor/opportunities";
import { Button } from "@/components/ui/button";

interface KanbanBoardProps {
  columns: InvestorPipelineColumns;
}

type ViewMode = "active" | "all" | "terminal";

const ACTIVE_COLUMNS: Array<{
  key: keyof InvestorPipelineColumns;
  title: string;
  status: "new" | "review" | "nda" | "dataroom" | "negotiation" | "won" | "lost";
  empty?: string;
}> = [
  { key: "newMatches", title: "New Matches", status: "new", empty: "Awaiting fresh matches" },
  { key: "inReview", title: "In Review", status: "review" },
  { key: "ndaSigned", title: "NDA Signed", status: "nda" },
  { key: "dataRoom", title: "Data Room", status: "dataroom" },
  { key: "negotiation", title: "Negotiation", status: "negotiation", empty: "Awaiting founder response" },
];

const TERMINAL_COLUMNS: Array<{
  key: keyof InvestorPipelineColumns;
  title: string;
  status: "new" | "review" | "nda" | "dataroom" | "negotiation" | "won" | "lost";
  empty?: string;
}> = [
  { key: "won", title: "Won / Portfolio", status: "won", empty: "No completed deals in portfolio yet" },
  { key: "lost", title: "Lost / Passed", status: "lost", empty: "No archived or passed opportunities" },
];

const ALL_COLUMNS = [...ACTIVE_COLUMNS, ...TERMINAL_COLUMNS];

export default function KanbanBoard({ columns }: KanbanBoardProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("active");

  const visibleColumns =
    viewMode === "active"
      ? ACTIVE_COLUMNS
      : viewMode === "terminal"
      ? TERMINAL_COLUMNS
      : ALL_COLUMNS;

  const wonCount = columns.won?.length || 0;
  const lostCount = columns.lost?.length || 0;

  return (
    <div className="space-y-4">
      {/* VIEW FILTER TABS */}
      <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={viewMode === "active" ? "default" : "outline"}
            onClick={() => setViewMode("active")}
            className="text-xs h-8"
          >
            Active Pipeline
          </Button>
          <Button
            size="sm"
            variant={viewMode === "all" ? "default" : "outline"}
            onClick={() => setViewMode("all")}
            className="text-xs h-8"
          >
            All Stages (7)
          </Button>
          <Button
            size="sm"
            variant={viewMode === "terminal" ? "default" : "outline"}
            onClick={() => setViewMode("terminal")}
            className="text-xs h-8 gap-1.5"
          >
            Won & Lost
            {(wonCount > 0 || lostCount > 0) && (
              <span className="ml-1 rounded-full bg-muted px-1.5 py-0.2 text-[10px] font-bold">
                {wonCount + lostCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div
          className="grid auto-cols-[minmax(280px,1fr)] grid-flow-col gap-4 pb-2 md:auto-cols-fr"
          role="list"
        >
          {visibleColumns.map((c) => (
            <KanbanColumn
              key={c.key}
              title={c.title}
              status={c.status}
              cards={columns[c.key] || []}
              emptyLabel={c.empty}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
