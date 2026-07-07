'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, ChevronRight, ArrowRight, Download, Eye, FolderLock, Rocket, Check } from 'lucide-react';
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
    ? new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : '—';

  const roadmap = ['Concept Overview', 'Document Updates', 'Ownership & KYC', 'Final Overview'];

  const features = [
    { title: 'Investor Visibility', description: 'Featured in matching results', Icon: Eye },
    { title: 'Data Room', description: 'Secure Document Hosting', Icon: FolderLock },
    { title: 'Funding Portal', description: 'Apply for pre-seed rounds', Icon: Rocket },
  ];

  const headingSubtitle = isPhase2SubmittedToBackend
    ? 'All 4 verification milestone achieved'
    : 'Submit your documents to complete Phase 2 — verification happens during review';
  const overallScore = isPhase2SubmittedToBackend ? '100%' : 'Pending';
  const overallScoreBarPct = isPhase2SubmittedToBackend ? 100 : 0;

  return (
    <div className="w-full ">
      <div className="flex flex-col gap-8 rounded-[20px] border-2 border-background bg-card shadow-sm">
        {/* Header */}
        <div className="flex flex-col gap-4 border-b border-border p-6 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-medium text-foreground leading-tight">Company verification</h1>
            <p className="mt-2 text-sm text-muted-foreground">{headingSubtitle}</p>
          </div>
          <div className="shrink-0 md:text-right">
            <p className="text-sm font-medium text-foreground">Overall Score {overallScore}</p>
            <div className="mt-2 h-1.5 w-full min-w-[140px] overflow-hidden rounded-full bg-border">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${overallScoreBarPct}%` }} />
            </div>
          </div>
        </div>

        {/* Verification Roadmap */}
        <div className="px-6">
          <h3 className="mb-3 text-lg font-medium text-foreground">Verification Roadmap</h3>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {roadmap.map((item, idx) => {
              const isLast = idx === roadmap.length - 1;
              return (
                <div key={item} className="flex items-center gap-2">
                  <span className={isLast ? 'font-medium text-primary' : 'text-muted-foreground'}>{item}</span>
                  {!isLast && <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Certificate + Trust Score */}
        <div className="grid grid-cols-1 gap-6 px-6 md:grid-cols-2">
          {/* Certificate Card */}
          <div className="flex flex-col gap-8 rounded-2xl border border-border bg-secondary p-8">
            <div className="flex flex-col items-center gap-4 border-b border-border pb-8">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary/70 to-primary text-2xl">
                🌍
              </div>
              <div className="flex items-center gap-2 rounded-full bg-popover px-3 py-1">
                <Check className="h-4 w-4 text-primary" />
                <p className="text-xs font-semibold text-primary">Verified Company</p>
              </div>
              <h3 className="text-center text-xl font-semibold text-foreground">Mondial.eco Certified Business</h3>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex-1 text-center">
                <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Issued</p>
                <p className="text-sm font-semibold text-foreground">{submittedDate}</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="flex-1 text-center">
                <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Issued</p>
                <p className="text-sm font-semibold text-foreground">{submittedDate}</p>
              </div>
            </div>
          </div>

          {/* Trust Score Card */}
          <div className="flex flex-col gap-6 rounded-2xl border border-border bg-popover p-8">
            <div className="flex items-center gap-3">
              <h3 className="text-base font-semibold text-foreground">Executive Trust Score</h3>
              <div className="rounded-full bg-success-light px-3 py-1">
                <p className="text-xs font-semibold text-success-text">+20 pts</p>
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <p className="text-5xl font-bold text-foreground">60</p>
              <p className="text-sm text-muted-foreground">/100</p>
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full overflow-hidden rounded-full bg-border">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: '60%' }} />
              </div>
              <p className="text-xs text-muted-foreground">
                Your score increased significantly after document verification. Higher scores unlock lower platform fees.
              </p>
            </div>
          </div>
        </div>

        {/* Features Now Unlocked */}
        <div className="px-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Features Now Unlocked</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {features.map(({ title, description, Icon }) => (
              <div key={title} className="flex items-center gap-3 rounded-2xl border border-border bg-popover p-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{title}</p>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {completionError && (
          <div className="mx-6 flex gap-3 rounded-xl border border-destructive/20 bg-destructive/10 p-4">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-destructive" />
            <p className="text-sm font-semibold text-destructive">{completionError}</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex flex-col gap-3 border-t-2 border-background p-6 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" className="gap-2" disabled onClick={() => {}}>
            <Download className="h-4 w-4" />
            Download Certificate
          </Button>
          {isPhase2SubmittedToBackend ? (
            <Button type="button" onClick={() => router.push('/dashboard/entrepreneur/phase-3')} className="gap-2">
              Continue to Phase 3: Investor Outreach
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : currentPhase! <= 2 ? (
            <Button type="button" onClick={handleContinue} disabled={isCompleting} className="gap-2">
              {isCompleting ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Submitting…
                </>
              ) : (
                <>
                  Submit &amp; Complete Phase 2
                  <ArrowRight className="h-4 w-4" />
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
