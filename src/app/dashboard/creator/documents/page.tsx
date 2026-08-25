'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Download, FileText, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCreatorProgress } from '@/providers/CreatorProgressProvider';
import { creatorDocumentsApi, type CreatorIdeaDocument } from '@/lib/api-creator-documents';

const formatDate = (value: string) => new Intl.DateTimeFormat('en-US', {
  month: 'short', day: 'numeric', year: 'numeric',
}).format(new Date(value));

const formatBytes = (sizeBytes: number | null) => {
  if (sizeBytes == null || !Number.isFinite(sizeBytes)) return null;
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  if (sizeBytes < 1024 * 1024) return `${Math.round(sizeBytes / 1024)} KB`;
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
};

const documentTypeLabel = (documentType: CreatorIdeaDocument['documentType']) =>
  documentType === 'business_plan' ? 'Business Plan' : 'Financial Forecast';

const errorMessage = (error: unknown) =>
  (error as { response?: { data?: { message?: string } } })?.response?.data?.message
  ?? (error instanceof Error ? error.message : "Couldn't load documents.");

export default function CreatorDocumentsPage() {
  const router = useRouter();
  const { state: { activeIdeaId } } = useCreatorProgress();
  const [documents, setDocuments] = useState<CreatorIdeaDocument[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(activeIdeaId));
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const retry = useCallback(() => setRetryKey((value) => value + 1), []);

  useEffect(() => {
    let cancelled = false;
    if (!activeIdeaId) {
      setDocuments([]);
      setError(null);
      setIsLoading(false);
      return () => { cancelled = true; };
    }

    setIsLoading(true);
    setError(null);
    setDocuments([]);
    creatorDocumentsApi.list(activeIdeaId)
      .then((result) => {
        if (!cancelled) setDocuments(result);
      })
      .catch((caught) => {
        if (!cancelled) setError(errorMessage(caught));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [activeIdeaId, retryKey]);

  const download = async (document: CreatorIdeaDocument) => {
    if (!activeIdeaId || !document.downloadable) return;
    setDownloadingId(document.id);
    try {
      const file = await creatorDocumentsApi.download(activeIdeaId, document.id);
      const url = URL.createObjectURL(file);
      const anchor = window.document.createElement('a');
      anchor.href = url;
      anchor.download = document.fileName;
      window.document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="w-full max-w-[1136px] mx-auto space-y-6 pb-8 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="space-y-1">
          <h1 className="text-[28px] font-bold leading-tight text-foreground">Document Vault</h1>
          <p className="text-sm font-normal text-muted-foreground">
            Real files generated or stored for this idea appear here.
          </p>
        </div>
      </div>

      {error && (
        <Card className="border-destructive/30 bg-destructive/5 p-4 flex items-center justify-between gap-4">
          <div className="flex items-start gap-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={retry} className="shrink-0 gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </Button>
        </Card>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" aria-label="Loading documents">
          {[0, 1].map((item) => <Card key={item} className="h-[74px] animate-pulse rounded-xl border-border bg-muted/40" />)}
        </div>
      ) : documents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documents.map((document) => {
            const size = formatBytes(document.sizeBytes);
            return (
              <Card key={document.id} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between hover:border-primary/20 shadow-sm">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-primary/10 text-primary">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-xs text-foreground block truncate">{document.title || document.fileName}</span>
                    <span className="text-[10px] text-muted-foreground font-medium flex flex-wrap items-center gap-1.5 mt-0.5">
                      <span>{documentTypeLabel(document.documentType)}</span>
                      {size && <><span>/</span><span>{size}</span></>}
                      <span>/</span><span>{formatDate(document.createdAt)}</span>
                    </span>
                  </div>
                </div>
                {document.downloadable && (
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Download ${document.fileName}`}
                    disabled={downloadingId === document.id}
                    onClick={() => download(document)}
                    className="rounded-lg h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
                  >
                    {downloadingId === document.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      ) : !error ? (
        <Card className="rounded-2xl border-border bg-card p-10 text-center flex flex-col items-center justify-center max-w-xl mx-auto mt-12 space-y-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center"><FileText className="w-8 h-8" /></div>
          <div className="space-y-2">
            <CardTitle className="text-xl font-bold">No documents yet</CardTitle>
            <CardDescription className="text-sm max-w-sm">Documents generated for this idea will appear here.</CardDescription>
          </div>
          <Button onClick={() => router.push('/dashboard/creator/phase-3/business-plan')} className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold rounded-xl px-6">
            <Sparkles className="w-4 h-4 mr-1.5" /> Create Business Plan
          </Button>
        </Card>
      ) : null}
    </div>
  );
}
