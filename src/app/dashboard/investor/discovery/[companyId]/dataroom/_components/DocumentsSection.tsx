"use client";

import { useState } from "react";
import {
  Download,
  Eye,
  FileText,
  FileSpreadsheet,
  FileBadge2,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  FileEdit,
  MessageSquarePlus,
  Lock,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { downloadDataRoomDocument, trackDocumentDownload } from "@/lib/api-investor-opportunities";
import { useUpdateDocumentReview } from "@/hooks/queries/investor-diligence";
import type { InvestorDocumentListItem } from "@/types/investor/opportunities";
import type { DiligenceReview } from "@/lib/api-investor-diligence";
import DocumentPreviewModal from "./DocumentPreviewModal";

interface DocumentsSectionProps {
  companyId: string;
  items: InvestorDocumentListItem[];
  reviews?: DiligenceReview[];
  canDownload?: boolean;
  onAddNote: (documentId: string, documentTitle: string) => void;
  onAskFounder: (documentId: string, documentTitle: string) => void;
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

export default function DocumentsSection({
  companyId,
  items,
  reviews = [],
  canDownload = true,
  onAddNote,
  onAskFounder,
}: DocumentsSectionProps) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<InvestorDocumentListItem | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const updateReviewMutation = useUpdateDocumentReview(companyId);

  const reviewMap = new Map<string, DiligenceReview>();
  reviews.forEach((r) => reviewMap.set(r.documentId, r));

  function handleView(doc: InvestorDocumentListItem) {
    setErrorId(null);
    setPreviewDoc(doc);
    setIsPreviewOpen(true);
  }

  async function handleDownload(doc: InvestorDocumentListItem) {
    if (!canDownload) return;
    setErrorId(null);
    setDownloadingId(doc.documentId);
    try {
      // Fire-and-forget download tracking
      void trackDocumentDownload(companyId, doc.documentId).catch(() => {});

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
    } catch {
      setErrorId(doc.documentId);
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleToggleReviewed(documentId: string, currentStatus: string) {
    const nextStatus = currentStatus === "reviewed" ? "not_reviewed" : "reviewed";
    await updateReviewMutation.mutateAsync({ documentId, status: nextStatus });
  }

  async function handleFlagNeedsAttention(documentId: string, currentStatus: string) {
    const nextStatus = currentStatus === "needs_attention" ? "not_reviewed" : "needs_attention";
    await updateReviewMutation.mutateAsync({ documentId, status: nextStatus });
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
    <>
      <Card className="border-border rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-3">
          <CardTitle className="text-base">Data Room Documents</CardTitle>
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
              const review = reviewMap.get(d.documentId);
              const status = review?.status ?? "not_reviewed";
              const notesCount = review?.notesCount ?? 0;
              const title = d.title ?? d.fileName ?? "Untitled";

              return (
                <li
                  key={d.documentId}
                  className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between hover:bg-muted/10 transition-colors"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
                      aria-hidden
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-foreground truncate max-w-[280px] sm:max-w-md">
                          {title}
                        </span>

                        {/* Review State Badges */}
                        {status === "reviewed" ? (
                          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 border-emerald-500/30 text-[10px]">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Reviewed
                          </Badge>
                        ) : status === "needs_attention" ? (
                          <Badge variant="destructive" className="text-[10px]">
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            Needs Attention
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground">
                            <Clock className="mr-1 h-3 w-3" />
                            Not Reviewed
                          </Badge>
                        )}

                        {notesCount > 0 && (
                          <Badge variant="secondary" className="text-[10px] gap-1">
                            <Lock className="h-2.5 w-2.5" />
                            {notesCount} {notesCount === 1 ? "note" : "notes"}
                          </Badge>
                        )}
                      </div>

                      <div className="mt-1 text-xs text-muted-foreground flex items-center gap-2">
                        <span>{d.fileName ?? "—"}</span>
                        <span>·</span>
                        <span>{formatBytes(d.fileSize)}</span>
                        <span>·</span>
                        <span>uploaded {formatDate(d.uploadedAt)}</span>
                      </div>

                      {hasError ? (
                        <div className="mt-1 text-xs text-destructive">
                          Couldn&apos;t download. {canDownload ? "The file may not be available." : "Your access allows viewing but not downloading."}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Diligence Action Buttons */}
                  <div className="flex items-center flex-wrap gap-1.5 lg:shrink-0 pt-1 lg:pt-0">
                    <Button
                      type="button"
                      size="sm"
                      variant={status === "reviewed" ? "default" : "outline"}
                      className="h-8 text-xs gap-1"
                      onClick={() => handleToggleReviewed(d.documentId, status)}
                      disabled={updateReviewMutation.isPending}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {status === "reviewed" ? "Reviewed" : "Mark Reviewed"}
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant={status === "needs_attention" ? "destructive" : "outline"}
                      className="h-8 text-xs gap-1"
                      onClick={() => handleFlagNeedsAttention(d.documentId, status)}
                      disabled={updateReviewMutation.isPending}
                    >
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Needs Attention
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs gap-1"
                      onClick={() => onAddNote(d.documentId, title)}
                    >
                      <FileEdit className="h-3.5 w-3.5" />
                      Note
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs gap-1"
                      onClick={() => onAskFounder(d.documentId, title)}
                    >
                      <MessageSquarePlus className="h-3.5 w-3.5" />
                      Ask Founder
                    </Button>

                    {/* View / Preview Button */}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs gap-1"
                      onClick={() => handleView(d)}
                      aria-label={`View ${title}`}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </Button>

                    {/* Download Button */}
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-8 text-xs gap-1"
                      onClick={() => handleDownload(d)}
                      disabled={isDownloading || !canDownload}
                      title={canDownload ? `Download ${title}` : "Your access allows viewing only"}
                      aria-label={`Download ${title}`}
                    >
                      {isDownloading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Download className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        companyId={companyId}
        doc={previewDoc}
        isOpen={isPreviewOpen}
        canDownload={canDownload}
        onClose={() => {
          setIsPreviewOpen(false);
          setPreviewDoc(null);
        }}
        onDownload={(d) => {
          void handleDownload(d);
        }}
      />
    </>
  );
}

