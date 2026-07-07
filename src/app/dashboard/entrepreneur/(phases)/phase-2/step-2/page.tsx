'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload,
  FileCheck,
  AlertCircle,
  Loader,
  FileText,
  Building2,
  Receipt,
  ShieldCheck,
  Lightbulb,
  Lock,
} from 'lucide-react';
import { useEntrepreneurProgress } from '@/hooks/useEntrepreneurProgress';
import entrepreneurApi from '@/lib/api-entrepreneur';
import { RouteGuard } from '@/components/entrepreneur/RouteGuard';
import { Button } from '@/components/ui/button';
import { Phase2Data } from '@/types/entrepreneur';

const requiredDocuments = [
  {
    id: 'kbis',
    name: 'KBIS / Extrait Kbis',
    description: 'Official company registration extract from the French national trade registry (Registre du Commerce)',
    mandatory: true,
    icon: FileText,
  },
  {
    id: 'rib',
    name: "Bank RIB / Relevé d'Identité Bancaire",
    description: 'Your company bank account details for payment verification and fund transfers',
    mandatory: true,
    icon: Building2,
  },
  {
    id: 'tax',
    name: 'Tax Certificate / Attestation Fiscale',
    description: 'Certificate of tax compliance issued by the Direction Générale des Finances Publiques',
    mandatory: true,
    icon: Receipt,
  },
  {
    id: 'insurance',
    name: 'Professional Insurance / Attestation RC Pro',
    description: 'Valid professional liability insurance certificate covering your current business activities',
    mandatory: true,
    icon: ShieldCheck,
  },
];

function Phase2Step2PageContent() {
  const router = useRouter();
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string>('');
  const [uploadingDocs, setUploadingDocs] = useState<Set<string>>(new Set());
  const [uploadedDocs, setUploadedDocs] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const { progress, savePhaseData, moveToNextStep, getPhaseData } = useEntrepreneurProgress();

  // Fetch existing documents on mount
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setIsLoading(true);
        const existingData: Phase2Data = getPhaseData<Phase2Data>(2) ?? {};
        let companyId = existingData.__companyId;

        if (!companyId) {
          const phaseProgress = await entrepreneurApi.getCurrentPhase();
          companyId = phaseProgress?.companyId;
        }

        if (companyId) {
          const documents = await entrepreneurApi.getDocuments(companyId);
          if (documents && documents.length > 0) {
            const docIds = new Set<string>();
            documents.forEach((doc: any) => {
              const docType = doc.type?.toLowerCase() || doc.documentType?.toLowerCase();
              if (docType) {
                docIds.add(docType);
              }
            });
            setUploadedDocs(docIds);
          }
        }
      } catch (error) {
        console.warn('Failed to fetch documents:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (progress) {
      fetchDocuments();
    }
  }, [progress, getPhaseData]);

  const allDocsUploaded = uploadedDocs.size === requiredDocuments.length;

  const handleDocUpload = async (docId: string) => {
    const fileInput = fileInputRefs.current[docId];
    if (!fileInput) return;
    fileInput.click();
  };

  const handleFileSelected = async (docId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingDocs((prev) => new Set(prev).add(docId));
    try {
      const existingData: Phase2Data = getPhaseData<Phase2Data>(2) ?? {};
      let companyId = existingData.__companyId;

      if (!companyId) {
        const phaseProgress = await entrepreneurApi.getCurrentPhase();
        companyId = phaseProgress?.companyId;
        if (!companyId) throw new Error('No company found');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', docId);

      await entrepreneurApi.uploadDocument(companyId, formData);

      const newDocs = new Set(uploadedDocs);
      newDocs.add(docId);
      setUploadedDocs(newDocs);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Upload failed';
      setValidationError(`Failed to upload ${docId}: ${msg}`);
    } finally {
      setUploadingDocs((prev) => {
        const newSet = new Set(prev);
        newSet.delete(docId);
        return newSet;
      });
    }
  };

  const handleSaveForLater = () => {
    const existingData: Phase2Data = getPhaseData<Phase2Data>(2) ?? {};
    savePhaseData(2, { ...existingData, uploadedDocuments: Array.from(uploadedDocs) });
  };

  const handleNextClick = async () => {
    setValidationError('');
    setIsValidating(true);

    try {
      if (!allDocsUploaded) {
        setValidationError('Please upload all required documents');
        setIsValidating(false);
        return;
      }

      const existingData: Phase2Data = getPhaseData<Phase2Data>(2) ?? {};
      let companyId = existingData.__companyId;

      if (!companyId) {
        const phaseProgress = await entrepreneurApi.getCurrentPhase();
        companyId = phaseProgress?.companyId;
        if (!companyId) throw new Error('No company found');
      }

      // Verify documents persisted in backend
      const backendDocs = await entrepreneurApi.getDocuments(companyId);
      if (!backendDocs || backendDocs.length === 0) {
        throw new Error('Documents not persisted in backend');
      }

      savePhaseData(2, { ...existingData, documentsVerified: true });
      moveToNextStep(2, 2);

      await new Promise((resolve) => setTimeout(resolve, 300));
      router.push('/dashboard/entrepreneur/phase-2/step-3');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to proceed';
      setValidationError(msg);
    } finally {
      setIsValidating(false);
    }
  };

  if (!progress || isLoading) return null;

  return (
    <div className="w-full  space-y-6">
      {/* Main Card */}
      <div className="flex flex-col gap-8 bg-card border-2 border-background rounded-[20px] shadow-sm">
        {/* Header Section */}
        <div className="flex flex-col gap-4 border-b border-border p-6 md:flex-row md:items-end md:gap-8">
          <div className="min-w-0 flex-1 space-y-2">
            <h1 className="text-2xl sm:text-3xl font-medium text-foreground leading-tight">Document Submission</h1>
            <p className="text-sm text-muted-foreground">
              Please provide the following legal documents to certify your company&apos;s existence and compliance. Only PDF, JPG, or PNG formats are accepted.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-[18px]">
            <div className="flex flex-col items-end gap-1 text-right">
              <p className="text-[13px] text-muted-foreground">PROGRESS</p>
              <p className="text-base font-medium text-foreground">
                {uploadedDocs.size} of {requiredDocuments.length} Required
              </p>
            </div>
            <div className="flex size-12 items-center justify-center rounded-full bg-primary">
              <FileText className="size-6 text-primary-foreground" />
            </div>
          </div>
        </div>

        {/* 2x2 Grid of Document Cards */}
        <div className="grid grid-cols-1 gap-6 px-6 md:grid-cols-2">
          {requiredDocuments.map((doc) => {
            const isUploaded = uploadedDocs.has(doc.id);
            const isUploading = uploadingDocs.has(doc.id);
            const DocIcon = doc.icon;
            return (
              <div key={doc.id} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
                {/* Document Header with Mandatory Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="mb-1 text-base font-semibold text-foreground">{doc.name}</h3>
                    <p className="text-xs leading-relaxed text-muted-foreground">{doc.description}</p>
                  </div>
                  {doc.mandatory && (
                    <div className="flex-shrink-0 rounded-md bg-[var(--dr-bg-yellow)] px-2 py-1">
                      <span className="text-xs font-semibold text-[var(--dr-yellow)]">Mandatory</span>
                    </div>
                  )}
                </div>

                {/* Dashed Upload Zone */}
                <div
                  onClick={() => !isUploaded && !isUploading && handleDocUpload(doc.id)}
                  className={`flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition ${
                    isUploaded
                      ? 'border-success-text/30 bg-success-light'
                      : 'border-border bg-muted hover:border-primary/50 hover:bg-accent'
                  }`}
                >
                  <div className="flex flex-col items-center gap-3">
                    {isUploaded ? (
                      <FileCheck className="h-9 w-9 text-success-text" />
                    ) : isUploading ? (
                      <Loader className="h-9 w-9 animate-spin text-muted-foreground" />
                    ) : (
                      <DocIcon className="h-9 w-9 text-muted-foreground opacity-60" />
                    )}
                    <p className="text-center text-sm text-muted-foreground">
                      {isUploaded
                        ? 'Document Uploaded'
                        : isUploading
                        ? 'Uploading...'
                        : 'Click to upload document or drag and drop'}
                    </p>
                  </div>
                </div>

                {/* File Hint */}
                <div className="flex items-center gap-2 rounded-lg border border-border bg-muted px-4 py-3">
                  <Upload className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">PDF, JPG, PNG — max 10MB</p>
                </div>

                <input
                  ref={(el) => {
                    if (el) fileInputRefs.current[doc.id] = el;
                  }}
                  type="file"
                  onChange={(e) => handleFileSelected(doc.id, e)}
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                />
              </div>
            );
          })}
        </div>

        {validationError && (
          <div className="mx-6 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {validationError}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t-2 border-background p-6">
          <button
            onClick={handleSaveForLater}
            className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            Save For Later
          </button>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/entrepreneur/phase-2/step-1')}
              className="px-6"
            >
              Cancel
            </Button>
            <Button onClick={handleNextClick} disabled={!allDocsUploaded || isValidating} className="gap-2 px-6">
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Info Panel */}
      <div className="flex gap-4 rounded-2xl border border-border bg-secondary p-6">
        <Lightbulb className="h-6 w-6 flex-shrink-0 text-primary" />
        <div className="space-y-1">
          <p className="font-semibold text-foreground">Why need this information</p>
          <p className="text-sm text-muted-foreground">
            These documents are required for legal compliance and to protect the mondial.eco ecosystem. We use them to verify that your business is in good standing before unlocking access to specialized eco-funding and commercial partnerships.
          </p>
        </div>
      </div>

      {/* Next Step Preview (locked) */}
      <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-6 opacity-60">
        <div className="flex items-center gap-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-sm font-semibold text-muted-foreground">
            3
          </div>
          <div>
            <p className="font-semibold text-foreground">Ownership &amp; KYC Checks</p>
            <p className="text-sm text-muted-foreground">Identity verification for legal representatives</p>
          </div>
        </div>
        <Lock className="h-5 w-5 text-muted-foreground" />
      </div>
    </div>
  );
}

export default function Phase2Step2Page() {
  return (
    <RouteGuard requiredPhase={2} requiredStep={2}>
      <Phase2Step2PageContent />
    </RouteGuard>
  );
}
