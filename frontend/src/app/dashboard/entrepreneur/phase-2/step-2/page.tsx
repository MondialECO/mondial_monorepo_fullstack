'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileCheck, AlertCircle } from 'lucide-react';
import { useEntrepreneurProgress } from '@/hooks/useEntrepreneurProgress';
import { EntrepreneurLayout } from '@/components/entrepreneur/EntrepreneurLayout';
import { ProgressSidebar } from '@/components/entrepreneur/ProgressSidebar';
import { PhaseHeader } from '@/components/entrepreneur/PhaseHeader';
import { StepFooter } from '@/components/entrepreneur/StepFooter';
import { RouteGuard } from '@/components/entrepreneur/RouteGuard';

const requiredDocuments = [
  { id: '1', name: 'KBIS (Company Registry)', status: 'pending' as const },
  { id: '2', name: 'Articles of Association', status: 'pending' as const },
  { id: '3', name: 'Business License', status: 'pending' as const },
  { id: '4', name: 'Tax Certificate', status: 'pending' as const },
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
        ...existingData,  // Preserve Step 1 & other data
        documents: requiredDocuments.map((doc) => ({
          ...doc,
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

      // Wait for state update before navigating
      await new Promise(resolve => setTimeout(resolve, 100));
      router.push('/dashboard/entrepreneur/phase-2/step-3');
    } catch (error) {
      setValidationError('Failed to proceed. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  if (!progress) return null;

  const stepIndicators = [
    {
      step: 1 as const,
      title: 'Legal Identity',
      subtitle: 'Enter company info',
      status: (progress.completedSteps.has('2-1') ? 'completed' : progress.currentStep === 1 ? 'current' : 'pending') as const,
    },
    {
      step: 2 as const,
      title: 'Required Documentation',
      subtitle: 'Upload documents',
      status: (progress.completedSteps.has('2-2') ? 'completed' : progress.currentStep === 2 ? 'current' : 'pending') as const,
    },
    {
      step: 3 as const,
      title: 'Ownership & KYC',
      subtitle: 'Verify owners',
      status: (progress.completedSteps.has('2-3') ? 'completed' : progress.currentStep === 3 ? 'current' : 'pending') as const,
    },
    {
      step: 4 as const,
      title: 'Financial Preview',
      subtitle: 'Review summary',
      status: (progress.completedSteps.has('2-4') ? 'completed' : progress.currentStep === 4 ? 'current' : 'pending') as const,
    },
  ];

  const sidebarContent = (
    <ProgressSidebar
      title="Verification Progress"
      steps={stepIndicators}
      overallScore={40}
      scoreLabel="OVERALL SCORE"
      scoreDescription="Upload documents to unlock identity checks."
    />
  );

  return (
    <EntrepreneurLayout sidebar={sidebarContent}>
      <div className="space-y-3 sm:space-y-4 md:space-y-6">
        <PhaseHeader
          title="Required Documentation"
          subtitle="Upload necessary company documents for verification."
          progressLabel="PROGRESS"
          progressValue="Step 2 of 4"
          progressPercentage={50}
        />

        <div className="bg-neutral-3 border-2 border-neutral-4 rounded-2xl p-3 sm:p-4 md:p-6">
          <div className="space-y-4 sm:space-y-6">
            {requiredDocuments.map((doc) => {
              const isUploaded = uploadedDocs.has(doc.id);
              return (
                <div
                  key={doc.id}
                  className="border border-neutral-2 rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isUploaded ? 'bg-green-100' : 'bg-neutral-4'}`}>
                      {isUploaded ? <FileCheck className="w-5 h-5 text-green-600" /> : <Upload className="w-5 h-5 text-neutral-5" />}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-neutral-1">{doc.name}</h3>
                      <p className="text-sm text-neutral-5 mt-0.5">{isUploaded ? 'Uploaded' : 'Click to upload'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDocUpload(doc.id)}
                    className={`w-full sm:w-auto px-4 py-2 text-sm font-medium rounded-lg transition ${isUploaded ? 'bg-green-100 text-green-700' : 'bg-primary/10 text-primary hover:bg-primary/15'}`}
                  >
                    {isUploaded ? '✓ Uploaded' : 'Upload'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <StepFooter
          backUrl="/dashboard/entrepreneur/phase-2/step-1"
          nextLabel="Next"
          onNextClick={handleNextClick}
          isLoading={isValidating}
          isNextDisabled={!allDocsUploaded}
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
