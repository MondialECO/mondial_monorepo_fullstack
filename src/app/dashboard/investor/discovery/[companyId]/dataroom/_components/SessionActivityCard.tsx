import { Eye, Download, Clock, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { InvestorSession } from "@/types/investor/opportunities";

interface SessionActivityCardProps {
  session: InvestorSession;
}

function formatRelative(iso: string | null): string {
  if (!iso) return "Never";
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

function formatDate(iso: string | null): string {
  if (!iso) return "—";
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

export default function SessionActivityCard({ session }: SessionActivityCardProps) {
  const hasAccess = session.lastAccessAt !== null;

  return (
    <Card className="border-border rounded-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">Session Activity</CardTitle>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary border border-primary/30">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary animate-pulse" aria-hidden />
            Active now
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border bg-muted/30 p-3">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
              <Eye className="h-3 w-3" aria-hidden />
              Views
            </div>
            <div className="mt-1 text-xl font-bold text-foreground tabular-nums">
              {session.viewEventsCount}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-muted/30 p-3">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
              <Download className="h-3 w-3" aria-hidden />
              Downloads
            </div>
            <div className="mt-1 text-xl font-bold text-foreground tabular-nums">
              {session.downloadEventsCount}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Documents reviewed</span>
          <span className="font-semibold text-foreground tabular-nums">
            {session.viewedDocsCount} of {session.totalDocsCount}
          </span>
        </div>

        <Separator />

        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3 w-3" aria-hidden />
              Last access
            </span>
            <span className="text-foreground" title={session.lastAccessAt ?? ""}>
              {formatRelative(session.lastAccessAt)}
            </span>
          </div>
          {hasAccess ? (
            <div className="flex items-center justify-between text-muted-foreground">
              <span>First access</span>
              <span title={session.firstAccessAt ?? ""}>
                {formatDate(session.firstAccessAt)}
              </span>
            </div>
          ) : null}
        </div>

        {session.reviewedDocuments.length > 0 ? (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="text-xs font-semibold text-foreground">
                Recently reviewed
              </div>
              <ul className="space-y-1.5">
                {session.reviewedDocuments.slice(0, 5).map((d) => (
                  <li key={d.documentId} className="flex items-center gap-2 text-xs">
                    <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                    <span className="min-w-0 truncate text-foreground">
                      {d.title ?? "Document"}
                    </span>
                    <span className="ml-auto shrink-0 text-muted-foreground">
                      {formatRelative(d.viewedAt)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
