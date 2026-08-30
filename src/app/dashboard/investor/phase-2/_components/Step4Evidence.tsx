'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UploadCloud, FileText, Trash2, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import type { InvestorFinanceDocument } from '@/types/investor/finance';

interface Step4Props {
  documents: InvestorFinanceDocument[];
  onUpload: (file: File, docType: string) => Promise<void>;
  onDelete: (documentId: string) => Promise<void>;
  isUploading: boolean;
}

const DOCUMENT_CATEGORIES = [
  { id: 'bank_statement', label: 'Bank Statement (Recent 3 months)' },
  { id: 'proof_of_funds_letter', label: 'Proof of Funds Letter (Bank / Legal Attestation)' },
  { id: 'investment_account_statement', label: 'Brokerage / Investment Account Statement' },
  { id: 'audited_financials', label: 'Audited Financial Statements (Fund / Corporate)' },
  { id: 'fund_mandate', label: 'Fund Mandate / LP Commitment Confirmation' },
  { id: 'treasury_confirmation', label: 'Corporate Treasury Allocation Confirmation' },
  { id: 'proof_of_assets', label: 'Proof of Liquid Assets / Custody Statement' },
  { id: 'other_evidence', label: 'Other Legitimate Supporting Evidence' },
];

export default function Step4Evidence({
  documents,
  onUpload,
  onDelete,
  isUploading,
}: Step4Props) {
  const [selectedCategory, setSelectedCategory] = useState(DOCUMENT_CATEGORIES[0].id);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      setErrorMsg('File exceeds maximum size of 20MB.');
      return;
    }

    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowed.includes(file.type) && !file.name.match(/\.(pdf|jpg|jpeg|png)$/i)) {
      setErrorMsg('Only PDF, JPG, JPEG, and PNG files are accepted.');
      return;
    }

    try {
      await onUpload(file, selectedCategory);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.error || 'Failed to upload document. Please try again.');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getCategoryLabel = (id: string) => {
    return DOCUMENT_CATEGORIES.find((c) => c.id === id)?.label || id;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Supporting Financial Evidence
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Upload at least one verifying document to demonstrate investment capacity. Documents are encrypted,
          restricted to compliance team access, and never shown to entrepreneurs.
        </p>
      </div>

      {/* Document Category & Upload Box */}
      <div className="p-5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Document Category
            </Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="bg-white dark:bg-slate-950">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_CATEGORIES.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={handleFileChange}
              id="evidence-file-input"
            />
            <Button
              type="button"
              variant="outline"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-10 border-emerald-600 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40 font-medium"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4 mr-2" />
                  Choose File (PDF, JPG, PNG)
                </>
              )}
            </Button>
          </div>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Uploaded Documents List */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <Label className="text-sm font-semibold text-slate-900 dark:text-white">
            Attached Documents ({documents.length})
          </Label>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Min. 1 document required for submission
          </span>
        </div>

        {documents.length === 0 ? (
          <div className="p-8 text-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-sm">
            No supporting documents uploaded yet.
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.documentId}
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-slate-900 dark:text-white text-sm truncate">
                      {doc.originalFilename}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>{getCategoryLabel(doc.documentType)}</span>
                      <span>•</span>
                      <span>{formatFileSize(doc.fileSize)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-4">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(doc.documentId)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 p-2 h-8 w-8"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
