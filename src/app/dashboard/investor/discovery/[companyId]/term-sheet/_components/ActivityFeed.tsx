import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  type ActivityEntry,
  STAGE_LABEL,
} from "@/lib/term-sheet-derivation";

interface ActivityFeedProps {
  entries: ActivityEntry[];
}

function formatAbsolute(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function formatRelative(iso: string): string {
  try {
    const t = new Date(iso).getTime();
    const diff = Date.now() - t;
    const mins = Math.round(diff / 60_000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.round(mins / 60);
    if (hours < 24) return `${hours} hr ago`;
    const days = Math.round(hours / 24);
    return `${days} day${days === 1 ? "" : "s"} ago`;
  } catch {
    return "—";
  }
}

export default function ActivityFeed({ entries }: ActivityFeedProps) {
  if (entries.length === 0) {
    return (
      <Card className="border-border rounded-2xl">
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No activity to display yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border rounded-2xl">
      <CardHeader>
        <CardTitle className="text-base">Activity</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-border">
          {entries.map((e) => (
            <li key={e.id} className="flex items-start gap-3 px-5 py-3">
              <span
                className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <div className="text-sm text-foreground">{e.event}</div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                  <span>{e.actor}</span>
                  <span>·</span>
                  <span title={e.timestamp}>{formatAbsolute(e.timestamp)}</span>
                  <span>·</span>
                  <span>{formatRelative(e.timestamp)}</span>
                </div>
              </div>
              <Badge variant="outline" className="shrink-0 text-[10px]">
                {STAGE_LABEL[e.stage]}
              </Badge>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
