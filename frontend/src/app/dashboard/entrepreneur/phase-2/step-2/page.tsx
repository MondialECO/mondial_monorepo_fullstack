'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileCheck, AlertCircle, Archive } from 'lucide-react';
import { useEntrepreneurProgress } from '@/hooks/useEntrepreneurProgress';
import { EntrepreneurLayout } from '@/components/entrepreneur/EntrepreneurLayout';
import { ProgressSidebar } from '@/components/entrepreneur/ProgressSidebar';
import { PhaseHeader } from '@/components/entrepreneur/PhaseHeader';
import { StepFooter } from '@/components/entrepreneur/StepFooter';
import { RouteGuard } from '@/components/entrepreneur/RouteGuard';
import { Button } from '@/components/ui/button';

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
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string>('');
  const { progress, savePhaseData, moveToNextStep, getPhaseData } = useEntrepreneurProgress();

  const savedData = getPhaseData(2) as { documents?: { id: string; status: string }[] } | undefined;
  const initialDocs = new Set(
    savedData?.documents?.filter((doc) => doc.status === 'uploaded').map((doc) => doc.id) || []
  );
  const [uploadedDocs, setUploadedDocs] = useState<Set<string>>(initialDocs);

  const allDocsUploaded = uploadedDocs.size === requiredDocuments.length;

  const handleDocUpload = (docId: string) => {
    const newDocs = new Set(uploadedDocs);
    newDocs.add(docId);
    setUploadedDocs(newDocs);
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

      const existingData = getPhaseData(2) || {};
      const formData = {
        ...existingData,
        documents: requiredDocuments.map((doc) => ({
          id: doc.id,
          name: doc.name,
          status: uploadedDocs.has(doc.id) ? 'uploaded' : 'pending',
        })),
      };

      savePhaseData(2, formData);
      await new Promise(resolve => setTimeout(resolve, 500));
      const moveResult = moveToNextStep(2, 2);

      if (!moveResult) {
        setValidationError('Failed to advance to next step');
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 100));
      router.push('/dashboard/entrepreneur/phase-2/step-3');
    } catch (error) {
      setValidationError('Failed to proceed. Please try again.');
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
                      disabled={isUploaded}
                    >
                      {isUploaded ? (
                        <>
                          <FileCheck className="w-4 h-4" />
                          Uploaded
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Upload
                        </>
                      )}
                    </Button>
                  </div>
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
