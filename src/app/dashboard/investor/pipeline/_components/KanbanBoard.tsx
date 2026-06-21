import KanbanColumn from "./KanbanColumn";
import type { InvestorPipelineColumns } from "@/types/investor/opportunities";

interface KanbanBoardProps {
  columns: InvestorPipelineColumns;
}

const COLUMNS: Array<{
  key: keyof InvestorPipelineColumns;
  title: string;
  empty?: string;
}> = [
  { key: "newMatches", title: "New Matches", empty: "Awaiting fresh matches" },
  { key: "inReview", title: "In Review" },
  { key: "ndaSigned", title: "NDA Signed" },
  { key: "dataRoom", title: "Data Room" },
  { key: "negotiation", title: "Negotiation", empty: "Awaiting founder response" },
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
            cards={columns[c.key]}
            emptyLabel={c.empty}
          />
        ))}
      </div>
    </div>
  );
}
