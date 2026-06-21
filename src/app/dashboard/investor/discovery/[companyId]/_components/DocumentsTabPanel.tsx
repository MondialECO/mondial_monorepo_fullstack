"use client";

import Link from "next/link";
import { FileText, FileSpreadsheet, FileBadge2, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import NDALockedPanel from "@/components/investor/NDALockedPanel";
import { useOpportunityDocuments } from "@/hooks/queries/investor-opportunities";
import type { OpportunityDetail } from "@/types/investor/opportunities";

interface DocumentsTabPanelProps {
  detail: OpportunityDetail;
  onSignNda: () => void;
}

function formatBytes(n: number): string {
  if (!n) return "—";
  if (n >= 1_048_576) return `${(n / 1_048_576).toFixed(1)} MB`;
  if (n >= 1024) return `${Math.round(n / 1024)} KB`;
  return `${n} B`;
}

function iconForCategory(category: string | null) {
  switch (category) {
    case "financial":
      return FileSpreadsheet;
    case "legal":
      return FileBadge2;
    default:
      return FileText;
  }
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

export default function DocumentsTabPanel({ detail, onSignNda }: DocumentsTabPanelProps) {
  const { data, isLoading, isError } = useOpportunityDocuments(
    detail.ndaAccepted ? detail.companyId : null
  );

  if (!detail.ndaAccepted) {
    return (
      <NDALockedPanel
        title="Data Room is NDA-Protected"
        message="Sign the NDA to access the pitch deck, financial model, cap table, and legal documents."
        onSignNda={onSignNda}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Card className="border-border rounded-2xl">
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Couldn&apos;t load documents. Refresh to retry.
        </CardContent>
      </Card>
    );
  }

  if (data.items.length === 0) {
    return (
      <Card className="border-border rounded-2xl">
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No documents have been published in this data room yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Data Room ({data.items.length})</CardTitle>
        <Link
          href={`/dashboard/investor/discovery/${detail.companyId}/dataroom`}
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          Open full Data Room
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-border">
          {data.items.map((d) => {
            const Icon = iconForCategory(d.category);
            return (
              <li key={d.documentId} className="flex items-center justify-between gap-3 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"
                    aria-hidden
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">
                      {d.title ?? d.fileName ?? "Untitled"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {d.category ? `${d.category} · ` : ""}
                      {d.fileName ?? "—"} · {formatBytes(d.fileSize)} · {formatDate(d.uploadedAt)}
                    </div>
                  </div>
                </div>
                {/* Per-row download lives on the full Data Room route. */}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
