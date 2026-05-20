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
  TrendingUp,
} from 'lucide-react';
import { useEntrepreneurProgress } from '@/hooks/useEntrepreneurProgress';
import { Button } from '@/components/ui/button';
import { RouteGuard } from '@/components/entrepreneur/RouteGuard';

function Phase2Step4PageContent() {
  const router = useRouter();
  const [isCompleting, setIsCompleting] = useState(false);
  const { savePhaseData, moveToNextStep, getPhaseData } = useEntrepreneurProgress();

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
      await new Promise((r) => setTimeout(r, 300));
      router.push('/dashboard/entrepreneur');
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
    'Legal Identity',
    'Documents',
    'Ownership & KYC',
    'Final Review',
  ];

  const features = [
    {
      title: 'Investor Visibility',
      description: 'Featured in matching results',
      Icon: Eye,
    },
    {
      title: 'Data Room',
      description: 'Secure document hosting',
      Icon: FolderLock,
    },
    {
      title: 'Funding Portal',
      description: 'Access pre-seed rounds',
      Icon: Rocket,
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-100 p-4 sm:p-6 md:p-8 lg:p-10">
      <div className="mx-auto w-full max-w-4xl">
        {/* Header Section with Background */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/20 rounded-2xl p-6 sm:p-8 md:p-10 mb-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                  <BadgeCheck className="w-8 h-8 text-primary" strokeWidth={2} />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-1">
                    Company Verified
                  </h1>
                  <p className="text-sm sm:text-base text-neutral-5 mt-1">
                    Congratulations! All verification steps completed
                  </p>
                </div>
              </div>
            </div>

            {/* Score Card */}
            <div className="bg-white border-2 border-primary/30 rounded-xl p-4 text-center shrink-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-5 mb-2">
                Overall Score
              </p>
              <p className="text-4xl font-bold text-neutral-1">100%</p>
              <div className="mt-3 h-2 w-24 rounded-full bg-neutral-200 overflow-hidden mx-auto">
                <div className="h-full w-full bg-primary rounded-full" />
              </div>
            </div>
          </div>

          {/* Verification Roadmap */}
          <div className="pt-4 border-t-2 border-primary/20">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-5 mb-3">
              Verification Path
            </p>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {roadmap.map((item, idx) => {
                const isLast = idx === roadmap.length - 1;
                return (
                  <div key={item} className="flex items-center gap-2">
                    <div className="px-3 py-1 bg-white rounded-full text-neutral-1 font-medium text-xs sm:text-sm">
                      {item}
                    </div>
                    {!isLast && (
                      <ChevronRight className="w-4 h-4 text-primary/60 flex-shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Issued Certificate & Trust Score */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Certificate Card */}
          <div className="bg-neutral-3 border-2 border-neutral-4 rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-primary/15 border-2 border-primary/30 flex items-center justify-center mb-4">
                <BadgeCheck className="w-12 h-12 text-primary" strokeWidth={2} />
              </div>
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full mb-3">
                <BadgeCheck className="w-4 h-4" />
                Verified Status
              </p>
              <p className="text-lg sm:text-xl font-bold text-neutral-1">
                Mondial.eco Certified
              </p>
              <p className="text-sm text-neutral-5 mt-2">
                Official business verification badge
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t-2 border-neutral-2">
              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-5 mb-1">
                  Issued Date
                </p>
                <p className="text-sm font-bold text-neutral-1">
                  {issuedDate}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-5 mb-1">
                  Valid Until
                </p>
                <p className="text-sm font-bold text-neutral-1">
                  {new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Trust Score Card */}
          <div className="bg-neutral-3 border-2 border-neutral-4 rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-neutral-1">
                Trust Score
              </h3>
              <div className="flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1 rounded-full text-xs font-semibold">
                <TrendingUp className="w-4 h-4" />
                +30 pts
              </div>
            </div>

            <div className="text-center py-4">
              <div className="text-5xl sm:text-6xl font-bold text-neutral-1 mb-2">
                85
              </div>
              <p className="text-sm text-neutral-5">/100 Investor Ready Score</p>
            </div>

            <div className="space-y-2">
              <div className="h-3 w-full rounded-full bg-neutral-4 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full"
                  style={{ width: '85%' }}
                />
              </div>
              <p className="text-xs text-neutral-5">
                Excellent score. Higher scores unlock lower platform fees and better matching.
              </p>
            </div>
          </div>
        </div>

        {/* Features Unlocked */}
        <div className="bg-neutral-3 border-2 border-neutral-4 rounded-2xl p-6 sm:p-8 mb-8">
          <h3 className="text-lg font-semibold text-neutral-1 mb-6">
            Features Now Unlocked
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {features.map(({ title, description, Icon }) => (
              <div
                key={title}
                className="bg-background border-2 border-neutral-2 rounded-xl p-4 sm:p-5 flex flex-col items-center text-center space-y-3 hover:border-primary/50 transition"
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

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row gap-4">
          <Button
            type="button"
            variant="outline"
            className="flex-1 gap-2 h-12"
            onClick={() => {}}
          >
            <Download className="w-4 h-4" />
            Download Certificate
          </Button>
          <Button
            type="button"
            onClick={handleContinue}
            disabled={isCompleting}
            className="flex-1 gap-2 h-12"
          >
            {isCompleting ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Continuing...
              </>
            ) : (
              <>
                Continue to Dashboard
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
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
