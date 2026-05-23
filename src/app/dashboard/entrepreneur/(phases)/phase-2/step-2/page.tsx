'use client';

import { useState, useRef } from 'react';
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
  { id: 'kbis', name: 'KBIS (Company Registry)', description: 'Official registry extract' },
  { id: 'articles', name: 'Articles of Association', description: 'Company bylaws/charter' },
  { id: 'license', name: 'Business License', description: 'Operating authorization' },
  { id: 'tax', name: 'Tax Certificate', description: 'Recent tax filing proof' },
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
  const { progress, savePhaseData, moveToNextStep, getPhaseData } = useEntrepreneurProgress();

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

  if (!progress) return null;

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

        <div className="bg-neutral-3 border-2 border-neutral-4 rounded-2xl p-4 sm:p-6 md:p-8 space-y-4">
          <div className="grid gap-4">
            {requiredDocuments.map((doc) => {
              const isUploaded = uploadedDocs.has(doc.id);
              const isUploading = uploadingDocs.has(doc.id);
              return (
                <div
                  key={doc.id}
                  className={`border-2 rounded-xl p-4 sm:p-5 transition ${
                    isUploaded
                      ? 'bg-green-50 border-green-200'
                      : 'bg-background border-neutral-2 hover:border-primary/50'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isUploaded ? 'bg-green-100' : 'bg-neutral-100'
                      }`}>
                        {isUploaded ? (
                          <FileCheck className="w-6 h-6 text-green-600" />
                        ) : isUploading ? (
                          <Loader className="w-6 h-6 text-neutral-5 animate-spin" />
                        ) : (
                          <Archive className="w-6 h-6 text-neutral-5" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm sm:text-base font-semibold text-neutral-1">{doc.name}</h3>
                        <p className="text-xs sm:text-sm text-neutral-5 mt-1">{doc.description}</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleDocUpload(doc.id)}
                      variant={isUploaded ? 'outline' : 'default'}
                      size="sm"
                      className="w-full sm:w-auto gap-2"
                      disabled={isUploaded || isUploading}
                    >
                      {isUploaded ? (
                        <>
                          <FileCheck className="w-4 h-4" />
                          Uploaded
                        </>
                      ) : isUploading ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          Uploading
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Upload
                        </>
                      )}
                    </Button>
                  </div>
                  <input
                    ref={(el) => { if (el) fileInputRefs.current[doc.id] = el; }}
                    type="file"
                    onChange={(e) => handleFileSelected(doc.id, e)}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-900 mb-1">Document Security</p>
            <p className="text-sm text-blue-800">
              All documents are encrypted using AES-256 and stored securely. Only authorized compliance officers can access your files.
            </p>
          </div>
        </div>

        <StepFooter
          backUrl="/dashboard/entrepreneur/phase-2/step-1"
          onNextClick={handleNextClick}
          isLoading={isValidating}
          isNextDisabled={!allDocsUploaded}
          nextLabel="Next"
          nextValidationError={validationError}
        />
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
