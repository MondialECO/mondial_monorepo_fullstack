'use client';

import { useState } from 'react';
import { useEntrepreneurProgress } from '@/hooks/useEntrepreneurProgress';
import { EntrepreneurLayout } from '@/components/entrepreneur/EntrepreneurLayout';
import { ProgressSidebar } from '@/components/entrepreneur/ProgressSidebar';
import { ArrowRight } from 'lucide-react';
import { RevenueInputForm } from '@/components/phase-3/RevenueInputForm';
import { RevenueChart } from '@/components/phase-3/RevenueChart';
import { VerificationStatusCard } from '@/components/phase-3/VerificationStatusCard';

const PHASE_3_STEPS = [
  {
    step: 1 as const,
    title: 'Revenue Input',
    subtitle: 'Enter quarterly revenue data',
  },
  {
    step: 2 as const,
    title: 'Automated Valuation',
    subtitle: 'System-generated valuation',
  },
  {
    step: 3 as const,
    title: 'Live KPI Tracking',
    subtitle: 'Connect data sources',
  },
  {
    step: 4 as const,
    title: 'Concept Overview',
    subtitle: 'Explain your concept',
  },
];

export function Phase3RevenueInputClient() {
  const { progress } = useEntrepreneurProgress();
  const [revenues, setRevenues] = useState({
    q1: 0,
    q2: 0,
    q3: 0,
    q4: 0,
  });

  if (!progress) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-neutral-5 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Build step indicators with status
  const statusMap = {
    1: progress.completedSteps.has('3-1')
      ? 'completed'
      : progress.currentStep === 1 && progress.currentPhase === 3
        ? 'current'
        : 'pending',
    2: progress.completedSteps.has('3-2')
      ? 'completed'
      : progress.currentStep === 2 && progress.currentPhase === 3
        ? 'current'
        : 'pending',
    3: progress.completedSteps.has('3-3')
      ? 'completed'
      : progress.currentStep === 3 && progress.currentPhase === 3
        ? 'current'
        : 'pending',
    4: progress.completedSteps.has('3-4')
      ? 'completed'
      : progress.currentStep === 4 && progress.currentPhase === 3
        ? 'current'
        : 'pending',
  } as const;

  const stepIndicators = PHASE_3_STEPS.map((step) => ({
    ...step,
    status: statusMap[step.step],
  }));

  const sidebarContent = (
    <ProgressSidebar
      title="Verification Progress"
      steps={stepIndicators}
      overallScore={progress.overallScore ?? 25}
      scoreLabel="OVERALL SCORE"
      scoreDescription="Complete Step 1 to unlock to identity checks module."
    />
  );

  return (
    <EntrepreneurLayout sidebar={sidebarContent}>
      <div className="space-y-4 md:space-y-6">
        {/* Top Header */}
        <div className="bg-neutral-3 border-2 border-neutral-4 rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3 sm:gap-4 md:gap-8 pb-4 md:pb-6 border-b border-neutral-2">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-1 mb-1.5 leading-tight">
                Revenue Input
              </h1>
              <p className="text-sm sm:text-base text-neutral-5">
                Please provide your company&apos;s revenue data for the last four
                quarters to calculate your valuation.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav
          aria-label="Section breadcrumb"
          className="flex gap-2 items-center px-4 sm:px-5 md:px-6 text-sm"
        >
          <span className="text-neutral-5">Entrepreneur Verification</span>
          <ArrowRight className="w-3.5 h-3.5 text-neutral-5" />
          <span className="font-semibold text-primary">Financial Valuation</span>
        </nav>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Left Column - Revenue Input Form */}
          <div className="bg-neutral-4 border border-neutral-2 rounded-xl p-5 sm:p-6">
            <h2 className="text-lg font-semibold tracking-tight text-neutral-1 mb-5">
              Quarterly Revenue (EUR)
            </h2>
            <RevenueInputForm
              revenues={revenues}
              onRevenuesChange={setRevenues}
            />
          </div>

          {/* Right Column - Chart and Status Cards */}
          <div className="space-y-4">
            {/* Revenue Chart */}
            <div className="bg-neutral-4 border border-neutral-2 rounded-xl p-5 sm:p-6">
              <h2 className="text-lg font-semibold tracking-tight text-neutral-1 mb-5">
                Revenue Growth Report Card
              </h2>
              <RevenueChart revenues={revenues} />
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <VerificationStatusCard
                title="VERIFICATION STATUS"
                status="Institutional Ready"
                description="Compliance documentation verified"
              />
              <VerificationStatusCard
                title="FINANCIAL HEALTH"
                status="Institutional Ready"
                description="Compliance documentation verified"
              />
            </div>
          </div>
        </div>
      </div>
    </EntrepreneurLayout>
  );
}
