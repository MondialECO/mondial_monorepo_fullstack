import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import NDALockedPanel from "@/components/investor/NDALockedPanel";
import type { OpportunityDetail } from "@/types/investor/opportunities";

interface TeamTabPanelProps {
  detail: OpportunityDetail;
  onSignNda: () => void;
}

function initials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export default function TeamTabPanel({ detail, onSignNda }: TeamTabPanelProps) {
  if (!detail.ndaAccepted || !detail.team) {
    return (
      <NDALockedPanel
        title="Team Details are NDA-Protected"
        message="Sign the NDA to view the founding team, key hires, and biographies."
        onSignNda={onSignNda}
      />
    );
  }

  return (
    <Card className="border-border rounded-2xl">
      <CardHeader>
        <CardTitle className="text-base">Team</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {detail.team.map((m, i) => (
            <div
              key={`${m.name ?? "member"}-${i}`}
              className="flex items-start gap-3 rounded-xl border border-border bg-card p-3"
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold"
                aria-hidden
              >
                {initials(m.name)}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-foreground truncate">
                  {m.name ?? "—"}
                </div>
                <div className="text-xs text-muted-foreground">{m.role ?? "—"}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
