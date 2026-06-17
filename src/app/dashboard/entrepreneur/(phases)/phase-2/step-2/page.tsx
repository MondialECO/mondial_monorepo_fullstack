'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileCheck, AlertCircle, Archive, Loader } from 'lucide-react';
import { useEntrepreneurProgress } from '@/hooks/useEntrepreneurProgress';
import entrepreneurApi from '@/lib/api-entrepreneur';
import { EntrepreneurLayout } from '@/components/entrepreneur/EntrepreneurLayout';
import { ProgressSidebar } from '@/components/entrepreneur/ProgressSidebar';
import { PhaseHeader } from '@/components/entrepreneur/PhaseHeader';
import { StepFooter } from '@/components/entrepreneur/StepFooter';
import { RouteGuard } from '@/components/entrepreneur/RouteGuard';
import { Button } from '@/components/ui/button';
import { Phase2Data } from '@/types/entrepreneur';

const requiredDocuments = [
  {
    id: 'kbis',
    name: 'KBIS / Extrait Kbis',
    description: 'Official company registration extract from the French national trade registry (Registre du Commerce)',
    mandatory: true
  },
  {
    id: 'articles',
    name: 'Articles of Association',
    description: 'Official articles of association or corporate bylaws filed with the commercial register',
    mandatory: true
  },
  {
    id: 'license',
    name: 'Business License',
    description: 'Professional license or permit required to conduct your specific business activities',
    mandatory: true
  },
  {
    id: 'tax',
    name: 'Tax Certificate / Attestation Fiscale',
    description: 'Certificate of tax compliance issued by the Direction Générale des Finances Publiques',
    mandatory: true
  },
];

const PHASE_2_STEPS = [
  { step: 1 as const, title: 'Legal Identity', subtitle: 'Enter company info' },
  { step: 2 as const, title: 'Required Documentation', subtitle: 'Upload documents' },
  { step: 3 as const, title: 'Ownership & KYC', subtitle: 'Verify owners' },
  { step: 4 as const, title: 'Financial Preview', subtitle: 'Review summary' },
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

    setUploadingDocs(prev => new Set(prev).add(docId));
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
      setUploadingDocs(prev => {
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

      await new Promise(resolve => setTimeout(resolve, 300));
      router.push('/dashboard/entrepreneur/phase-2/step-3');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to proceed';
      setValidationError(msg);
    } finally {
      setIsValidating(false);
    }
  };

  if (!progress || isLoading) return null;

  const statusMap = {
    1: progress.completedSteps.has('2-1') ? 'completed' : progress.currentStep === 1 ? 'current' : 'pending',
    2: progress.completedSteps.has('2-2') ? 'completed' : progress.currentStep === 2 ? 'current' : 'pending',
    3: progress.completedSteps.has('2-3') ? 'completed' : progress.currentStep === 3 ? 'current' : 'pending',
    4: progress.completedSteps.has('2-4') ? 'completed' : progress.currentStep === 4 ? 'current' : 'pending',
  };

  const stepIndicators = PHASE_2_STEPS.map((step) => ({
    ...step,
    status: statusMap[step.step as keyof typeof statusMap] as any,
  }));

  const sidebarContent = (
    <ProgressSidebar
      title="Verification Progress"
      steps={stepIndicators}
      overallScore={40}
      scoreLabel="OVERALL SCORE"
      scoreDescription="Upload all documents to continue."
    />
  );

  return (
    <EntrepreneurLayout sidebar={sidebarContent}>
      <div className="space-y-4 md:space-y-6">
        <PhaseHeader
          title="Document Upload"
          subtitle="Upload required company documents for verification. These documents will be securely stored and reviewed by our compliance team."
          progressLabel="PROGRESS"
          progressValue="Step 2 of 4"
          progressPercentage={50}
        />

        {/* Header Section with Progress */}
        <div className="bg-neutral-3 border-2 border-neutral-4 rounded-2xl p-4 sm:p-6 md:p-8">
          <div className="flex items-start justify-between gap-4 mb-6 pb-6 border-b border-neutral-2">
            <div className="flex-1">
              <h2 className="text-2xl sm:text-3xl font-semibold text-neutral-1 mb-2">Document Submission</h2>
              <p className="text-sm text-neutral-4">
                Please provide the following legal documents to certify your company's existence and compliance. Only PDF, JPG, or PNG formats are accepted.
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs font-semibold text-neutral-5 uppercase mb-1">PROGRESS</p>
              <p className="text-base font-semibold text-neutral-1">{uploadedDocs.size} of {requiredDocuments.length} Required</p>
            </div>
          </div>

          {/* 2x2 Grid of Document Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {requiredDocuments.map((doc) => {
              const isUploaded = uploadedDocs.has(doc.id);
              const isUploading = uploadingDocs.has(doc.id);
              return (
                <div
                  key={doc.id}
                  className="bg-background border border-neutral-2 rounded-2xl p-5 flex flex-col gap-4"
                >
                  {/* Document Header with Mandatory Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-neutral-1 mb-1">{doc.name}</h3>
                      <p className="text-xs text-neutral-5 leading-relaxed">{doc.description}</p>
                    </div>
                    {doc.mandatory && (
                      <div className="flex-shrink-0 bg-yellow-100 px-2 py-1 rounded-sm">
                        <span className="text-xs font-semibold text-yellow-700">Mandatory</span>
                      </div>
                    )}
                  </div>

                  {/* Dashed Upload Zone */}
                  <div
                    onClick={() => !isUploaded && !isUploading && handleDocUpload(doc.id)}
                    className={`border-2 border-dashed rounded-lg p-6 min-h-48 flex flex-col items-center justify-center cursor-pointer transition ${
                      isUploaded
                        ? 'bg-green-50 border-green-200'
                        : 'bg-neutral-100 border-neutral-300 hover:border-primary/50 hover:bg-neutral-150'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-3">
                      {isUploaded ? (
                        <FileCheck className="w-9 h-9 text-green-600" />
                      ) : isUploading ? (
                        <Loader className="w-9 h-9 text-neutral-5 animate-spin" />
                      ) : (
                        <Upload className="w-9 h-9 text-neutral-5 opacity-60" />
                      )}
                      <p className="text-sm text-neutral-5 text-center">
                        {isUploaded ? 'Document Uploaded' : isUploading ? 'Uploading...' : 'Click to upload document or drag and drop'}
                      </p>
                    </div>
                  </div>

                  {/* File Hint */}
                  <div className="bg-neutral-100 border border-neutral-300 rounded-lg px-4 py-3 flex items-center gap-2">
                    <Archive className="w-5 h-5 text-neutral-5 flex-shrink-0" />
                    <p className="text-xs text-neutral-4">PDF, JPG, PNG — max 10MB</p>
                  </div>

                  <input
                    ref={(el) => { if (el) fileInputRefs.current[doc.id] = el; }}
                    type="file"
                    onChange={(e) => handleFileSelected(doc.id, e)}
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Info Panel */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 flex gap-4">
          <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-900 mb-2">Why need this information</p>
            <p className="text-sm text-blue-800">
              These documents are required for legal compliance and to protect the mondial.eco ecosystem. We use them to verify that your business is in good standing before unlocking access to specialized eco-funding and commercial partnerships.
            </p>
          </div>
        </div>

        <div className="border-t border-neutral-2 pt-6 flex items-center justify-between">
          <button
            onClick={handleSaveForLater}
            className="text-sm text-neutral-4 font-medium hover:text-neutral-1 transition"
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
            <Button
              onClick={handleNextClick}
              disabled={!allDocsUploaded || isValidating}
              className="px-6 gap-2"
            >
              Next
            </Button>
          </div>
        </div>
        {validationError && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {validationError}
          </div>
        )}
      </div>
    </EntrepreneurLayout>
  );
}

export default function Phase2Step2Page() {
  return (
    <RouteGuard requiredPhase={2} requiredStep={2}>
      <Phase2Step2PageContent />
    </RouteGuard>
  );
}
