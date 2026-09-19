'use client';

import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  Check,
  AlertTriangle,
  Loader2,
  X,
  FileCheck,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { creatorDocumentsApi, type CreatorIdeaDocument } from '@/lib/api-creator-documents';
import type { ExtendedLegalChecklistItem } from '@/lib/api-creator-journey';
import { cn } from '@/lib/utils';

interface LegalEvidenceModalProps {
  open: boolean;
  onClose: () => void;
  ideaId: string;
  item: ExtendedLegalChecklistItem | null;
  existingDocuments: CreatorIdeaDocument[];
  onEvidenceAttached: (documentId: string) => Promise<void>;
}

export function LegalEvidenceModal({
  open,
  onClose,
  ideaId,
  item,
  existingDocuments,
  onEvidenceAttached,
}: LegalEvidenceModalProps) {
  const [selectedDocId, setSelectedDocId] = useState<string | null>(item?.evidenceDocumentId || null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAttaching, setIsAttaching] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!item) return null;

  const handleAttachExisting = async () => {
    if (!selectedDocId) return;
    try {
      setIsAttaching(true);
      await onEvidenceAttached(selectedDocId);
      onClose();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to attach evidence.');
    } finally {
      setIsAttaching(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setUploadError(null);
      const docType = item.evidenceDocType || 'legal_evidence';
      const uploaded = await creatorDocumentsApi.upload(ideaId, file, docType, item.title || item.label);
      setSelectedDocId(uploaded.id);
      await onEvidenceAttached(uploaded.id);
      onClose();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'File upload failed.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg rounded-2xl p-6 bg-card border-border">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-base font-bold text-foreground">
            Attach Legal Evidence
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {item.title || item.label}
          </DialogDescription>
        </DialogHeader>

        {uploadError && (
          <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-xl text-xs text-destructive flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        <div className="space-y-4 py-2">
          {/* Upload New File Dropzone */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-foreground uppercase tracking-wider text-[11px] block">
              Upload New Document
            </span>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'border-2 border-dashed border-border/80 hover:border-primary/60 rounded-xl p-5 text-center cursor-pointer transition-colors bg-muted/20 hover:bg-muted/40 flex flex-col items-center justify-center gap-2',
                isUploading && 'opacity-60 pointer-events-none',
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                onChange={handleFileUpload}
              />
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">
                  {isUploading ? 'Uploading file...' : 'Click to upload proof or drag & drop'}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  PDF, PNG, JPG (max 15MB). E.g. {item.evidenceLabel || 'official extract'}
                </p>
              </div>
            </div>
          </div>

          {/* Or Select Existing Documents */}
          {existingDocuments.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border/50">
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider text-[11px] block">
                Or Select From Project Vault
              </span>
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {existingDocuments.map((doc) => {
                  const isSelected = selectedDocId === doc.id;
                  return (
                    <div
                      key={doc.id}
                      onClick={() => setSelectedDocId(doc.id)}
                      className={cn(
                        'flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all',
                        isSelected
                          ? 'border-primary bg-primary/5 text-foreground'
                          : 'border-border/60 hover:bg-muted/40 text-muted-foreground hover:text-foreground',
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className={cn('w-4 h-4 shrink-0', isSelected ? 'text-primary' : 'text-muted-foreground')} />
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate text-xs">
                            {doc.title || doc.fileName}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {doc.documentType} • {new Date(doc.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 border-t border-border/50 pt-3">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs rounded-xl">
            Cancel
          </Button>
          {existingDocuments.length > 0 && selectedDocId && (
            <Button
              size="sm"
              onClick={handleAttachExisting}
              disabled={isAttaching || !selectedDocId}
              className="text-xs rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground"
            >
              {isAttaching ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Attaching...
                </>
              ) : (
                'Attach Selected Document'
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
