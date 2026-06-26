"use client";

import { useState } from "react";
import { Download, FileText, FileSpreadsheet, FileBadge2, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { downloadDataRoomDocument } from "@/lib/api-investor-opportunities";
import { useTrackDocumentDownload } from "@/hooks/queries/investor-opportunities";
import type { InvestorDocumentListItem } from "@/types/investor/opportunities";

interface DocumentsSectionProps {
  companyId: string;
  items: InvestorDocumentListItem[];
}

function formatBytes(n: number): string {
  if (!n) return "—";
  if (n >= 1_048_576) return `${(n / 1_048_576).toFixed(1)} MB`;
  if (n >= 1024) return `${Math.round(n / 1024)} KB`;
  return `${n} B`;
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

function totalSize(items: InvestorDocumentListItem[]): string {
  return formatBytes(items.reduce((sum, d) => sum + (d.fileSize || 0), 0));
}

export default function DocumentsSection({ companyId, items }: DocumentsSectionProps) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);
  const trackDownload = useTrackDocumentDownload();

  async function handleDownload(doc: InvestorDocumentListItem) {
    setErrorId(null);
    setDownloadingId(doc.documentId);
    try {
      const blob = await downloadDataRoomDocument(companyId, doc.documentId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.fileName ?? doc.title ?? "document";
      document.body.appendChild(a);
      a.click();
      a.remove();
      // Defer revoke so the browser can complete the download.
      setTimeout(() => URL.revokeObjectURL(url), 1_000);
      // Best-effort engagement tracking — never blocks or fails the download.
      trackDownload.mutate({ companyId, documentId: doc.documentId });
    } catch {
      setErrorId(doc.documentId);
    } finally {
      setDownloadingId(null);
    }
  }

  if (items.length === 0) {
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
      <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-3">
        <CardTitle className="text-base">Documents</CardTitle>
        <span className="text-xs text-muted-foreground">
          {items.length} {items.length === 1 ? "file" : "files"} · {totalSize(items)} total
        </span>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-border">
          {items.map((d) => {
            const Icon = iconForCategory(d.category);
            const isDownloading = downloadingId === d.documentId;
            const hasError = errorId === d.documentId;
            return (
              <li
                key={d.documentId}
                className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"
                    aria-hidden
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">
                      {d.title ?? d.fileName ?? "Untitled"}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {d.fileName ?? "—"} · {formatBytes(d.fileSize)} ·{" "}
                      uploaded {formatDate(d.uploadedAt)}
                    </div>
                    {hasError ? (
                      <div className="mt-1 text-xs text-destructive">
                        Couldn&apos;t download. The file may not be available.
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center gap-2 md:shrink-0">
                  {d.category ? (
                    <Badge variant="outline" className="capitalize">
                      {d.category}
                    </Badge>
                  ) : null}
                  <Badge variant="secondary" className="text-[10px]">
                    Published
                  </Badge>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(d)}
                    disabled={isDownloading}
                    aria-label={`Download ${d.title ?? d.fileName ?? "document"}`}
                  >
                    {isDownloading ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    ) : (
                      <Download className="h-4 w-4" aria-hidden />
                    )}
                    {isDownloading ? "Downloading…" : "Download"}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
