import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import NDALockedPanel from "@/components/investor/NDALockedPanel";
import type { OpportunityDetail } from "@/types/investor/opportunities";

interface CapTableTabPanelProps {
  detail: OpportunityDetail;
  onSignNda: () => void;
}

const TYPE_LABEL: Record<string, string> = {
  founder: "Founder",
  investor: "Investor",
  esop: "ESOP Pool",
  advisor: "Advisor",
};

export default function CapTableTabPanel({ detail, onSignNda }: CapTableTabPanelProps) {
  if (!detail.ndaAccepted || !detail.capTableSummary) {
    return (
      <NDALockedPanel
        title="Cap Table is NDA-Protected"
        message="Sign the NDA to unlock the full cap table, founder ownership, and ESOP allocation."
        onSignNda={onSignNda}
      />
    );
  }

  const { totalShares, esopPoolPercent, entries } = detail.capTableSummary;

  return (
    <Card className="border-border rounded-2xl">
      <CardHeader>
        <CardTitle className="text-base">Ownership Structure</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="mb-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Total Shares</dt>
            <dd className="font-semibold text-foreground tabular-nums">
              {totalShares.toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">ESOP Pool</dt>
            <dd className="font-semibold text-foreground tabular-nums">{esopPoolPercent}%</dd>
          </div>
        </dl>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                <th className="py-2 font-medium">Stakeholder</th>
                <th className="py-2 font-medium">Type</th>
                <th className="py-2 font-medium text-right">Shares</th>
                <th className="py-2 font-medium text-right">% Diluted</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => {
                const pct = totalShares > 0 ? (e.sharesOwned / totalShares) * 100 : 0;
                return (
                  <tr key={`${e.stakeholderName ?? "row"}-${i}`} className="border-b border-border/60">
                    <td className="py-3 text-foreground">{e.stakeholderName ?? "—"}</td>
                    <td className="py-3 text-muted-foreground">
                      {e.type ? TYPE_LABEL[e.type] ?? e.type : "—"}
                    </td>
                    <td className="py-3 text-right text-foreground tabular-nums">
                      {e.sharesOwned.toLocaleString()}
                    </td>
                    <td className="py-3 text-right text-foreground tabular-nums">
                      {pct.toFixed(2)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
