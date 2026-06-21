'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  BadgeCheck,
  ChevronRight,
  ArrowRight,
  Download,
  Eye,
  FolderLock,
  Loader,
  Rocket,
  Check,
} from 'lucide-react';
import { useEntrepreneurProgress } from '@/hooks/useEntrepreneurProgress';
import entrepreneurApi from '@/lib/api-entrepreneur';
import { Button } from '@/components/ui/button';
import { RouteGuard } from '@/components/entrepreneur/RouteGuard';
import { Phase2Data } from '@/types/entrepreneur';

function Phase2Step4PageContent() {
  const router = useRouter();
  const [isCompleting, setIsCompleting] = useState(false);
  const [completionError, setCompletionError] = useState<string>('');
  const {
    progress,
    savePhaseData,
    moveToNextStep,
    getPhaseData,
    applyBackendResponse,
    currentPhase,
  } = useEntrepreneurProgress();

  // Backend-authoritative submission state. UI shows pending until backend confirms
  // Phase 2 completion. NOTE: this means "documents submitted, awaiting review" —
  // NOT "verified by a compliance officer". Wording below follows that semantic.
  const isPhase2SubmittedToBackend =
    !!progress &&
    progress.completedPhases.has(2) &&
    progress.currentPhase === 3;

  const handleContinue = async () => {
    setIsCompleting(true);
    setCompletionError('');
    try {
      const existingData: Phase2Data = getPhaseData<Phase2Data>(2) ?? {};

      let companyId = existingData.__companyId;
      if (!companyId) {
        const phaseProgress = await entrepreneurApi.getCurrentPhase();
        companyId = phaseProgress?.companyId;
        if (!companyId) {
          throw new Error('No company found in backend');
        }
      }

      const advanceResponse = await entrepreneurApi.advancePhase(companyId, 2, {});

      if (advanceResponse?.currentPhase !== 3) {
        throw new Error(
          `Phase advancement failed - expected currentPhase=3, got ${advanceResponse?.currentPhase}`
        );
      }
      if (!advanceResponse?.completedPhases?.includes(2)) {
        throw new Error('Phase 2 not marked as completed in backend response');
      }

      // Persist backend confirmation as authoritative source.
      applyBackendResponse(advanceResponse);

      savePhaseData(2, {
        ...existingData,
        submittedAt: new Date().toISOString(),
      });
      moveToNextStep(2, 4);

      await new Promise((r) => setTimeout(r, 300));
      router.push('/dashboard/entrepreneur/phase-3');
    } catch (error) {
      let message = 'Failed to complete Phase 2';

      // Try to extract meaningful error from various formats
      if (error instanceof Error) {
        message = error.message;
      }

      const anyError = error as any;
      if (anyError?.response?.data?.error) {
        message = anyError.response.data.error;
      } else if (anyError?.response?.data?.message) {
        message = anyError.response.data.message;
      } else if (anyError?.response?.statusText) {
        message = anyError.response.statusText;
      }

      console.error('Phase 2 completion error:', message, error);
      setCompletionError(message);
      setIsCompleting(false);
    }
  };

  const submittedDate = isPhase2SubmittedToBackend
    ? new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : '—';

  const roadmap = ['Legal Identity', 'Documents', 'Ownership & KYC', 'Final Review'];

  const features = [
    { title: 'Investor Visibility', description: 'Featured in matching results', Icon: Eye },
    { title: 'Data Room', description: 'Secure document hosting', Icon: FolderLock },
    { title: 'Funding Portal', description: 'Access pre-seed rounds', Icon: Rocket },
  ];

  const heading = isPhase2SubmittedToBackend ? 'Documents Submitted' : 'Final Review';
  const headingSubtitle = isPhase2SubmittedToBackend
    ? 'All required documents submitted — compliance review pending'
    : 'Submit your documents to complete Phase 2 — verification happens during review';
  const overallScore = isPhase2SubmittedToBackend ? 'Submitted' : 'Pending';
  const overallScoreBarPct = isPhase2SubmittedToBackend ? 100 : 0;
  const submissionBadgeIcon = isPhase2SubmittedToBackend ? (
    <BadgeCheck className="w-8 h-8 text-primary" strokeWidth={2} />
  ) : (
    <Loader className="w-8 h-8 text-primary animate-spin" />
  );

  return (
    <div className="min-h-screen bg-neutral-100 p-4 sm:p-6 md:p-8 lg:p-10">
      <div className="mx-auto w-full max-w-4xl">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/20 rounded-2xl p-6 sm:p-8 md:p-10 mb-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                  {submissionBadgeIcon}
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-1">
                    {heading}
                  </h1>
                  <p className="text-sm sm:text-base text-neutral-5 mt-1">{headingSubtitle}</p>
                </div>
              </div>
            </div>

            <div className="bg-white border-2 border-primary/30 rounded-xl p-4 text-center shrink-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-5 mb-2">
                Overall Score
              </p>
              <p className="text-4xl font-bold text-neutral-1">{overallScore}</p>
              <div className="mt-3 h-2 w-24 rounded-full bg-neutral-200 overflow-hidden mx-auto">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${overallScoreBarPct}%` }}
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t-2 border-primary/20">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-5 mb-3">
              Submission Path
            </p>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {roadmap.map((item, idx) => {
                const isLast = idx === roadmap.length - 1;
                return (
                  <div key={item} className="flex items-center gap-2">
                    <div className="px-3 py-1 bg-white rounded-full text-neutral-1 font-medium text-xs sm:text-sm">
                      {item}
                    </div>
                    {!isLast && <ChevronRight className="w-4 h-4 text-primary/60 flex-shrink-0" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Verification Cards - 2 Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Left: Certificate Card */}
          <div className="bg-blue-50 border-2 border-white rounded-2xl p-8 space-y-8">
            <div className="border-b border-blue-100 pb-8">
              <div className="flex flex-col items-center gap-4">
                {/* Logo Placeholder */}
                <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center">
                  <div className="text-white font-bold text-lg">🌍</div>
                </div>

                {/* Verified Badge */}
                <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full">
                  <Check className="w-4 h-4 text-blue-600" />
                  <p className="text-xs font-semibold text-blue-600">Verified Company</p>
                </div>

                {/* Certificate Title */}
                <h3 className="text-xl font-semibold text-neutral-1 text-center">
                  Mondial.eco Certified Business
                </h3>
              </div>
            </div>

            {/* Issue Dates */}
            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <p className="text-xs font-semibold text-neutral-5 uppercase mb-1">Issued</p>
                <p className="text-sm font-semibold text-neutral-1">November 12, 2026</p>
              </div>
              <div className="w-px h-8 bg-neutral-3" />
              <div className="text-center flex-1">
                <p className="text-xs font-semibold text-neutral-5 uppercase mb-1">Expires</p>
                <p className="text-sm font-semibold text-neutral-1">November 12, 2026</p>
              </div>
            </div>
          </div>

          {/* Right: Trust Score Card */}
          <div className="bg-background border border-neutral-2 rounded-2xl p-8 space-y-6">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-base font-semibold text-neutral-1">Executive Trust Score</h3>
              <div className="bg-green-50 px-3 py-1 rounded-full">
                <p className="text-xs font-semibold text-green-700">+20 pts</p>
              </div>
            </div>

            {/* Score Display */}
            <div className="text-center py-6">
              <div className="inline-block">
                <p className="text-5xl font-bold text-neutral-1">60</p>
                <p className="text-sm text-neutral-5">/100</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="h-3 w-full rounded-full bg-neutral-200 overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: '60%' }}
                />
              </div>
              <p className="text-xs text-neutral-5">
                Your score increased significantly after document verification. Higher scores unlock lower platform fees.
              </p>
            </div>
          </div>
        </div>

        {/* Features Unlocked Section */}
        <div className="bg-neutral-3 border-2 border-neutral-4 rounded-2xl p-6 sm:p-8 mb-8 space-y-6">
          <div>
            <p className="text-xs font-semibold text-neutral-5 uppercase tracking-wide mb-2">Features Now Unlocked</p>
            <h3 className="text-lg font-semibold text-neutral-1">
              Unlock Exclusive Features
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {features.map(({ title, description, Icon }) => (
              <div
                key={title}
                className="bg-background border border-neutral-2 rounded-2xl p-5 flex flex-col items-center text-center space-y-3"
              >
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-1">{title}</p>
                  <p className="text-xs text-neutral-5 mt-1">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {completionError && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 mb-6 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-900">{completionError}</p>
            </div>
          </div>
        )}

        {/* Footer Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1 gap-2 h-12"
            disabled
            onClick={() => {}}
          >
            <Download className="w-4 h-4" />
            Download Certificate
          </Button>
          {isPhase2SubmittedToBackend ? (
            <Button
              type="button"
              onClick={() => router.push('/dashboard/entrepreneur/phase-3')}
              className="flex-1 gap-2 h-12"
            >
              Continue to Phase 3: Investor Outreach
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : currentPhase! <= 2 ? (
            <Button
              type="button"
              onClick={handleContinue}
              disabled={isCompleting}
              className="flex-1 gap-2 h-12"
            >
              {isCompleting ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting…
                </>
              ) : (
                <>
                  Submit & Complete Phase 2
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function Phase2Step4Page() {
  return (
    <RouteGuard requiredPhase={2} requiredStep={4}>
      <Phase2Step4PageContent />
    </RouteGuard>
  );
}
