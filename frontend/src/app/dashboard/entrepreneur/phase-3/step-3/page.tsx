'use client';

import { useState } from 'react';
import { DollarSign, Target, Calendar, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useEntrepreneurProgress } from '@/hooks/useEntrepreneurProgress';
import { RouteGuard } from '@/components/entrepreneur/RouteGuard';

const PHASE_3_STEPS = [
  { step: 1 as const, title: 'Revenue Input', subtitle: 'Enter financial data' },
  { step: 2 as const, title: 'Equity Structure', subtitle: 'Cap table setup' },
  { step: 3 as const, title: 'Funding Ask', subtitle: 'Set raise amount' },
];

function Phase3Step3Client() {
  const { progress } = useEntrepreneurProgress();
  const [fundingAmount, setFundingAmount] = useState('450000');
  const [timeline, setTimeline] = useState('18');
  const [isLoading, setIsLoading] = useState(false);

  if (!progress) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-neutral-5 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  const amount = parseInt(fundingAmount) || 0;
  const months = parseInt(timeline) || 0;
  const monthlyBurn = months > 0 ? Math.round(amount / months) : 0;

  const statusMap = {
    1: progress.completedSteps.has('3-1') ? 'completed' : progress.currentStep === 1 ? 'current' : 'pending',
    2: progress.completedSteps.has('3-2') ? 'completed' : progress.currentStep === 2 ? 'current' : 'pending',
    3: progress.completedSteps.has('3-3') ? 'completed' : progress.currentStep === 3 ? 'current' : 'pending',
  };

  const handleContinue = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      window.location.href = '/dashboard/entrepreneur/phase-3/dashboard';
    } finally {
      setIsLoading(false);
    }
  };

  const stepIndicators = PHASE_3_STEPS.map((step) => ({
    ...step,
    status: statusMap[step.step as keyof typeof statusMap] as any,
  }));

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Header */}
      <header className="bg-white border-b border-neutral-2">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-neutral-1">Funding Ask</h1>
              <p className="text-sm text-neutral-5 mt-1">Define your capital requirements and timeline</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-neutral-5 font-semibold uppercase tracking-wide mb-1">PROGRESS</p>
              <p className="text-sm font-semibold text-neutral-1">Step 3 of 3</p>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center gap-2">
            {stepIndicators.map((step, idx) => (
              <div key={step.step} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
                    step.status === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : step.status === 'current'
                      ? 'bg-primary text-white'
                      : 'bg-neutral-200 text-neutral-5'
                  }`}
                >
                  {step.status === 'completed' ? <CheckCircle2 className="w-5 h-5" /> : step.step}
                </div>
                {idx < stepIndicators.length - 1 && (
                  <div className="w-8 h-0.5 bg-neutral-2" />
                )}
              </div>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Funding Amount */}
            <div className="bg-white border-2 border-neutral-2 rounded-2xl p-6 space-y-4">
              <h3 className="text-lg font-bold text-neutral-1 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Total Funding Ask
              </h3>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-neutral-1">Amount (EUR)</label>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-neutral-5">€</span>
                  <Input
                    type="number"
                    value={fundingAmount}
                    onChange={(e) => setFundingAmount(e.target.value)}
                    placeholder="0"
                    className="h-12 text-lg"
                  />
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  <span className="font-semibold">💡 Tip:</span> Base your ask on your 18-24 month runway needs plus operational cushion (20-30%).
                </p>
              </div>
            </div>

            {/* Timeline & Burn Rate */}
            <div className="bg-white border-2 border-neutral-2 rounded-2xl p-6 space-y-4">
              <h3 className="text-lg font-bold text-neutral-1 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Funding Timeline
              </h3>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-neutral-1">Expected Runway (Months)</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={timeline}
                    onChange={(e) => setTimeline(e.target.value)}
                    placeholder="Months"
                    className="h-12"
                  />
                  <span className="text-sm text-neutral-5 font-semibold">months</span>
                </div>
              </div>

              <div className="pt-4 border-t-2 border-neutral-2 space-y-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-5 mb-1">
                    Monthly Burn Rate
                  </p>
                  <p className="text-2xl font-bold text-neutral-1">
                    €{monthlyBurn.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-5 mb-1">
                    Target Closing
                  </p>
                  <p className="text-lg font-semibold text-neutral-1">Q2 2026</p>
                </div>
              </div>
            </div>

            {/* Use of Funds */}
            <div className="bg-white border-2 border-neutral-2 rounded-2xl p-6 space-y-4">
              <h3 className="text-lg font-bold text-neutral-1 flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Proposed Use of Funds
              </h3>

              <div className="space-y-3">
                {[
                  { category: 'Product Development', allocation: 35 },
                  { category: 'Sales & Marketing', allocation: 25 },
                  { category: 'Operations & Team', allocation: 30 },
                  { category: 'Legal & Compliance', allocation: 10 },
                ].map((item) => (
                  <div key={item.category}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-neutral-1">{item.category}</p>
                      <span className="text-xs font-bold text-primary">{item.allocation}%</span>
                    </div>
                    <div className="w-full h-3 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full"
                        style={{ width: `${item.allocation}%` }}
                      />
                    </div>
                    <p className="text-xs text-neutral-5 mt-1">
                      €{Math.round((amount * (item.allocation / 100)) / 1000).toLocaleString()}K
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Summary & Validation */}
          <div className="space-y-6">
            {/* Summary Card */}
            <div className="bg-white border-2 border-neutral-2 rounded-2xl p-6 space-y-4 sticky top-24">
              <h3 className="text-lg font-bold text-neutral-1">Funding Summary</h3>

              <div className="space-y-4">
                <div className="bg-neutral-50 rounded-lg p-4">
                  <p className="text-xs text-neutral-5 font-semibold uppercase tracking-wide mb-1">
                    Target Raise
                  </p>
                  <p className="text-3xl font-bold text-primary">€{parseInt(fundingAmount).toLocaleString()}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs text-blue-900 font-semibold uppercase tracking-wide mb-1">
                      Monthly Burn
                    </p>
                    <p className="text-lg font-bold text-blue-700">€{monthlyBurn.toLocaleString()}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-xs text-green-900 font-semibold uppercase tracking-wide mb-1">
                      Runway
                    </p>
                    <p className="text-lg font-bold text-green-700">{months}mo</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-neutral-5 font-semibold uppercase tracking-wide mb-2">
                    Key Metrics
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-neutral-5">Series Round Size</span>
                      <span className="font-semibold text-neutral-1">Series A</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-5">Implied Valuation</span>
                      <span className="font-semibold text-neutral-1">€3.5M - €4M</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-5">Equity Dilution</span>
                      <span className="font-semibold text-neutral-1">10-12%</span>
                    </div>
                  </div>
                </div>
              </div>

              {months >= 18 ? (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-green-800">Runway is sufficient for Series A execution.</p>
                </div>
              ) : (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-yellow-800">Consider extending runway to 18+ months for operational cushion.</p>
                </div>
              )}
            </div>

            {/* Investor Types */}
            <div className="bg-neutral-50 border-2 border-neutral-2 rounded-2xl p-6 space-y-3">
              <h3 className="text-sm font-bold text-neutral-1">Recommended Investor Types</h3>
              <div className="space-y-2 text-sm">
                {[
                  'Venture Capital Firms',
                  'Corporate Venture Arms',
                  'Experienced Angel Syndicates',
                ].map((type) => (
                  <div key={type} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-neutral-1">{type}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 h-11" onClick={() => window.location.href = '/dashboard/entrepreneur/phase-3/step-2'}>
            Back
          </Button>
          <Button className="flex-1 h-11 gap-2" onClick={handleContinue} disabled={isLoading || amount === 0 || months === 0}>
            {isLoading ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Completing...
              </>
            ) : (
              <>
                Complete Phase 3
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Phase3Step3Page() {
  return (
    <RouteGuard requiredPhase={3} requiredStep={3}>
      <Phase3Step3Client />
    </RouteGuard>
  );
}
