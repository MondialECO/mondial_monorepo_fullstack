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
      const message = error instanceof Error ? error.message : 'Failed to complete Phase 2';
      console.error('Phase 2 completion error:', message);
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-neutral-3 border-2 border-neutral-4 rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-primary/15 border-2 border-primary/30 flex items-center justify-center mb-4">
                {isPhase2SubmittedToBackend ? (
                  <BadgeCheck className="w-12 h-12 text-primary" strokeWidth={2} />
                ) : (
                  <Loader className="w-12 h-12 text-primary animate-spin" />
                )}
              </div>
              <p
                className={`inline-flex items-center gap-2 text-sm font-semibold px-3 py-1 rounded-full mb-3 ${
                  isPhase2SubmittedToBackend
                    ? 'text-primary bg-primary/10'
                    : 'text-neutral-5 bg-neutral-2'
                }`}
              >
                <BadgeCheck className="w-4 h-4" />
                {isPhase2SubmittedToBackend ? 'Awaiting Review' : 'Not Submitted'}
              </p>
              <p className="text-lg sm:text-xl font-bold text-neutral-1">
                {isPhase2SubmittedToBackend ? 'Compliance Review Pending' : 'Awaiting Submission'}
              </p>
              <p className="text-sm text-neutral-5 mt-2">
                {isPhase2SubmittedToBackend
                  ? 'A compliance officer will review your documents — verification is awarded after review.'
                  : 'Submit below to send your documents for review'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t-2 border-neutral-2">
              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-5 mb-1">
                  Submitted Date
                </p>
                <p className="text-sm font-bold text-neutral-1">{submittedDate}</p>
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-5 mb-1">
                  Review Status
                </p>
                <p className="text-sm font-bold text-neutral-1">
                  {isPhase2SubmittedToBackend ? 'Pending' : '—'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-neutral-3 border-2 border-neutral-4 rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-neutral-1">Submission Status</h3>
            </div>

            <div className="text-center py-4">
              <div className="text-3xl sm:text-4xl font-bold text-neutral-1 mb-2">
                {isPhase2SubmittedToBackend ? 'Awaiting Review' : 'Not Submitted'}
              </div>
              <p className="text-sm text-neutral-5">Trust score awarded after compliance review</p>
            </div>

            <div className="space-y-2">
              <div className="h-3 w-full rounded-full bg-neutral-4 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all"
                  style={{ width: `${overallScoreBarPct}%` }}
                />
              </div>
              <p className="text-xs text-neutral-5">
                {isPhase2SubmittedToBackend
                  ? 'Documents received. A compliance officer will review and award verification.'
                  : 'Submit your documents to begin compliance review.'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-neutral-3 border-2 border-neutral-4 rounded-2xl p-6 sm:p-8 mb-8">
          <h3 className="text-lg font-semibold text-neutral-1 mb-6">
            Features Unlocked After Compliance Review
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {features.map(({ title, description, Icon }) => (
              <div
                key={title}
                className={`bg-background border-2 rounded-xl p-4 sm:p-5 flex flex-col items-center text-center space-y-3 transition ${
                  isPhase2SubmittedToBackend
                    ? 'border-neutral-2 hover:border-primary/50'
                    : 'border-neutral-2 opacity-60'
                }`}
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-neutral-1">{title}</p>
                  <p className="text-xs text-neutral-5 mt-1">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {completionError && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-900">{completionError}</p>
            </div>
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row gap-4">
          <Button
            type="button"
            variant="outline"
            className="flex-1 gap-2 h-12"
            disabled
            onClick={() => {}}
          >
            <Download className="w-4 h-4" />
            Certificate (after review)
          </Button>
          {isPhase2SubmittedToBackend ? (
            <Button
              type="button"
              onClick={() => router.push('/dashboard/entrepreneur/phase-3')}
              className="flex-1 gap-2 h-12"
            >
              Continue to Phase 3
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
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
          )}
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
