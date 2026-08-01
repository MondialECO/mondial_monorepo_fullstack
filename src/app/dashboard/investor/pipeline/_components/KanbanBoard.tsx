import KanbanColumn from "./KanbanColumn";
import type { InvestorPipelineColumns } from "@/types/investor/opportunities";

interface KanbanBoardProps {
  columns: InvestorPipelineColumns;
}

const COLUMNS: Array<{
  key: keyof InvestorPipelineColumns;
  title: string;
  status: "new" | "review" | "nda" | "dataroom" | "negotiation";
  empty?: string;
}> = [
  { key: "newMatches", title: "New Matches", status: "new", empty: "Awaiting fresh matches" },
  { key: "inReview", title: "In Review", status: "review" },
  { key: "ndaSigned", title: "NDA Signed", status: "nda" },
  { key: "dataRoom", title: "Data Room", status: "dataroom" },
  { key: "negotiation", title: "Negotiation", status: "negotiation", empty: "Awaiting founder response" },
];

export default function KanbanBoard({ columns }: KanbanBoardProps) {
  return (
    <div className="overflow-x-auto">
      <div
        className="grid auto-cols-[minmax(280px,1fr)] grid-flow-col gap-4 pb-2 md:auto-cols-fr"
        role="list"
      >
        {COLUMNS.map((c) => (
          <KanbanColumn
            key={c.key}
            title={c.title}
            status={c.status}
            cards={columns[c.key]}
            emptyLabel={c.empty}
          />
        ))}
      </div>
    </div>
  );
}
