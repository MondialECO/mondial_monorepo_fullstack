"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Download, ExternalLink, AlertCircle, FileText } from "lucide-react";
import { viewDataRoomDocument, trackDocumentView } from "@/lib/api-investor-opportunities";
import type { InvestorDocumentListItem } from "@/types/investor/opportunities";

interface DocumentPreviewModalProps {
  companyId: string;
  doc: InvestorDocumentListItem | null;
  isOpen: boolean;
  canDownload: boolean;
  onClose: () => void;
  onDownload: (doc: InvestorDocumentListItem) => void;
}

export default function DocumentPreviewModal({
  companyId,
  doc,
  isOpen,
  canDownload,
  onClose,
  onDownload,
}: DocumentPreviewModalProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !doc) {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        setBlobUrl(null);
      }
      setTextContent(null);
      setError(null);
      return;
    }

    let isMounted = true;

    async function loadPreview() {
      if (!doc) return;
      setLoading(true);
      setError(null);
      try {
        // Track the view event (fire and forget)
        void trackDocumentView(companyId, doc.documentId).catch(() => {});

        const blob = await viewDataRoomDocument(companyId, doc.documentId);
        if (!isMounted) return;

        const mime = doc.MimeType || blob.type || "";
        const fileName = (doc.fileName || doc.title || "").toLowerCase();

        if (
          mime.startsWith("text/") ||
          mime.includes("json") ||
          fileName.endsWith(".txt") ||
          fileName.endsWith(".json") ||
          fileName.endsWith(".csv") ||
          fileName.endsWith(".md")
        ) {
          const text = await blob.text();
          if (isMounted) setTextContent(text);
        } else {
          const url = URL.createObjectURL(blob);
          if (isMounted) setBlobUrl(url);
        }
      } catch (err: any) {
        if (!isMounted) return;
        const msg = err?.response?.data?.error || err?.message || "Failed to load document preview.";
        setError(msg);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void loadPreview();

    return () => {
      isMounted = false;
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [isOpen, doc, companyId]);

  if (!doc) return null;

  const fileName = (doc.fileName || doc.title || "").toLowerCase();
  const mime = (doc.MimeType || "").toLowerCase();
  const isPdf = mime.includes("pdf") || fileName.endsWith(".pdf");
  const isImage =
    mime.startsWith("image/") ||
    fileName.endsWith(".png") ||
    fileName.endsWith(".jpg") ||
    fileName.endsWith(".jpeg") ||
    fileName.endsWith(".svg") ||
    fileName.endsWith(".webp");
  const isText =
    textContent !== null ||
    mime.startsWith("text/") ||
    mime.includes("json") ||
    fileName.endsWith(".txt") ||
    fileName.endsWith(".json") ||
    fileName.endsWith(".csv") ||
    fileName.endsWith(".md");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-background">
        <DialogHeader className="p-4 border-b border-border flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2 min-w-0 pr-4">
            <FileText className="h-5 w-5 text-primary shrink-0" />
            <DialogTitle className="text-base font-semibold truncate">
              {doc.title || doc.fileName || "Document Preview"}
            </DialogTitle>
          </div>
          <div className="flex items-center gap-2 shrink-0 pr-6">
            {blobUrl && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={() => window.open(blobUrl, "_blank")}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open Tab
              </Button>
            )}
            {canDownload && (
              <Button
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={() => {
                  onDownload(doc);
                }}
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-[450px] max-h-[75vh] overflow-auto flex items-center justify-center p-4 bg-muted/20">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Loading document preview...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center gap-3 text-center max-w-md p-6">
              <AlertCircle className="h-10 w-10 text-destructive" />
              <h3 className="text-sm font-semibold text-foreground">Preview Failed</h3>
              <p className="text-xs text-muted-foreground">{error}</p>
              {canDownload && (
                <Button size="sm" variant="outline" className="mt-2 text-xs" onClick={() => onDownload(doc)}>
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  Try Direct Download
                </Button>
              )}
            </div>
          ) : isPdf && blobUrl ? (
            <iframe
              src={blobUrl}
              title={doc.title || "PDF Preview"}
              className="w-full h-[70vh] rounded border border-border bg-white"
            />
          ) : isImage && blobUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={blobUrl}
              alt={doc.title || "Image Preview"}
              className="max-w-full max-h-[70vh] object-contain rounded shadow-sm"
            />
          ) : isText && textContent !== null ? (
            <pre className="w-full h-[70vh] p-4 text-xs font-mono bg-muted/40 rounded-lg overflow-auto whitespace-pre-wrap break-words border border-border text-foreground">
              {textContent}
            </pre>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 text-center max-w-md p-6">
              <FileText className="h-12 w-12 text-muted-foreground/60" />
              <h3 className="text-sm font-semibold text-foreground">
                Inline Preview Unavailable
              </h3>
              <p className="text-xs text-muted-foreground">
                This file format ({doc.fileName?.split(".").pop()?.toUpperCase() || "binary"}) cannot be rendered in browser preview.
              </p>
              {canDownload ? (
                <Button size="sm" className="mt-2 text-xs" onClick={() => onDownload(doc)}>
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  Download File
                </Button>
              ) : (
                <p className="text-xs text-muted-foreground font-medium">
                  Your current grant allows viewing only.
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
