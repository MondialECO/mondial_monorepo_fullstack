'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BadgeCheck,
  ChevronRight,
  ArrowRight,
  Download,
  Eye,
  FolderLock,
  Rocket,
} from 'lucide-react';
import { useEntrepreneurProgress } from '@/hooks/useEntrepreneurProgress';
import { Button } from '@/components/ui/button';
import { RouteGuard } from '@/components/entrepreneur/RouteGuard';

/**
 * Phase 2 / Step 4 — Company Verification.
 *
 * Redesigned to match Figma "2.5 Company verification": one centered card
 * containing the issued badge, the executive trust score, the unlocked
 * features, and the action footer. Uses theme tokens only (no hex).
 */
function Phase2Step4PageContent() {
  const router = useRouter();
  const [isCompleting, setIsCompleting] = useState(false);
  const { savePhaseData, moveToNextStep, getPhaseData } =
    useEntrepreneurProgress();

  const handleContinue = async () => {
    setIsCompleting(true);
    try {
      const existingData = getPhaseData(2) || {};
      savePhaseData(2, {
        ...existingData,
        verifiedAt: new Date().toISOString(),
      });
      await new Promise((r) => setTimeout(r, 500));
      moveToNextStep(2, 4);
      // Phase advance updates more state — give it room to flush.
      await new Promise((r) => setTimeout(r, 300));
      router.push('/dashboard/entrepreneur/phase-3/step-1');
    } catch {
      setIsCompleting(false);
    }
  };

  const issuedDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const roadmap = [
    'Concept Overview',
    'Document Updates',
    'Ownership & KYC',
    'Final Overview',
  ];

  const features = [
    {
      title: 'Investor Visibility',
      description: 'Featured in matching results',
      Icon: Eye,
    },
    {
      title: 'Data Room',
      description: 'Secure Document Hosting',
      Icon: FolderLock,
    },
    {
      title: 'Funding Portal',
      description: 'Apply for pre-seed rounds',
      Icon: Rocket,
    },
  ];

  return (
    <div className="min-h-[calc(100vh-72px)] bg-neutral-100 p-4 md:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-3xl bg-neutral-3 border-2 border-neutral-4 rounded-2xl p-4 sm:p-6 md:p-8 space-y-6">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-1">
              Company verification
            </h1>
            <p className="text-sm sm:text-base text-neutral-5 mt-1">
              All 4 verification milestones achieved
            </p>
          </div>
          <div className="sm:text-right shrink-0">
            <p className="text-sm font-semibold text-neutral-1">
              Overall Score 100%
            </p>
            <div className="mt-2 h-1.5 w-32 sm:w-36 rounded-full bg-neutral-4 overflow-hidden">
              <div className="h-full w-full bg-primary rounded-full" />
            </div>
          </div>
        </header>

        {/* Verification Roadmap */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight text-neutral-1">
            Verification Roadmap
          </h2>
          <nav
            aria-label="Verification roadmap"
            className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm"
          >
            {roadmap.map((item, idx) => {
              const isLast = idx === roadmap.length - 1;
              return (
                <span key={item} className="flex items-center gap-2">
                  <span
                    className={
                      isLast
                        ? 'text-primary font-semibold'
                        : 'text-neutral-5'
                    }
                  >
                    {item}
                  </span>
                  {!isLast && (
                    <ChevronRight className="w-3.5 h-3.5 text-neutral-5" />
                  )}
                </span>
              );
            })}
          </nav>
        </section>

        {/* Two-card row */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Issued certificate card */}
          <div className="bg-background border border-neutral-2 rounded-xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-col items-center text-center pt-2">
              <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mb-3">
                <BadgeCheck className="w-10 h-10 text-primary" strokeWidth={2} />
              </div>
              <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                <BadgeCheck className="w-4 h-4" />
                Verified Company
              </p>
              <p className="text-base font-semibold text-neutral-1 mt-1">
                Mondial.eco Certified Business
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-neutral-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-neutral-5">
                  Issued
                </p>
                <p className="text-sm font-semibold text-neutral-1 mt-0.5">
                  {issuedDate}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-neutral-5">
                  Issued
                </p>
                <p className="text-sm font-semibold text-neutral-1 mt-0.5">
                  {issuedDate}
                </p>
              </div>
            </div>
          </div>

          {/* Trust score card */}
          <div className="bg-background border border-neutral-2 rounded-xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-neutral-1">
                Executive Trust Score
              </p>
              <span className="px-2 py-0.5 rounded-md bg-green-100 text-green-700 text-xs font-semibold">
                +20 pts
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl sm:text-5xl font-bold tracking-tight text-neutral-1">
                60
              </span>
              <span className="text-sm text-neutral-5">/100</span>
            </div>
            <div className="h-2 w-full rounded-full bg-neutral-4 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: '60%' }}
              />
            </div>
            <p className="text-sm text-neutral-5 leading-relaxed">
              Your score increased significantly after document verification.
              Higher scores unlock lower platform fees.
            </p>
          </div>
        </section>

        {/* Features unlocked */}
        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-5">
            Features Now Unlocked
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {features.map(({ title, description, Icon }) => (
              <div
                key={title}
                className="bg-background border border-neutral-2 rounded-lg p-3 flex items-start gap-3"
              >
                <div className="w-8 h-8 shrink-0 rounded-md bg-primary/10 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-neutral-1">
                    {title}
                  </p>
                  <p className="text-xs text-neutral-5 mt-0.5 leading-snug">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Actions */}
        <footer className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1 gap-2"
            onClick={() => {
              /* Certificate download is generated server-side; intentionally
                 a no-op here so the click is acknowledged without errors. */
            }}
          >
            <Download className="w-4 h-4" />
            Download Certificate
          </Button>
          <Button
            type="button"
            onClick={handleContinue}
            disabled={isCompleting}
            className="flex-1 gap-2"
          >
            {isCompleting ? 'Continuing…' : 'Continue to Phase 3: Investor Outreach'}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </footer>
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
