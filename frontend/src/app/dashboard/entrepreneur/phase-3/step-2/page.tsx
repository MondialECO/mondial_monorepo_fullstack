'use client';

import { useState } from 'react';
import { PieChart, Users, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useEntrepreneurProgress } from '@/hooks/useEntrepreneurProgress';
import { RouteGuard } from '@/components/entrepreneur/RouteGuard';

const PHASE_3_STEPS = [
  { step: 1 as const, title: 'Revenue Input', subtitle: 'Enter financial data' },
  { step: 2 as const, title: 'Equity Structure', subtitle: 'Cap table setup' },
  { step: 3 as const, title: 'Funding Ask', subtitle: 'Set raise amount' },
];

function Phase3Step2Client() {
  const { progress } = useEntrepreneurProgress();
  const [founders, setFounders] = useState([
    { id: 1, name: 'Founder A', shares: 450000, percentage: 45 },
    { id: 2, name: 'Founder B', shares: 350000, percentage: 35 },
  ]);
  const [investors, setInvestors] = useState([
    { id: 1, name: 'Early Investor', shares: 120000, percentage: 12 },
  ]);
  const [esopPool, setEsopPool] = useState({ shares: 30000, percentage: 3 });
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

  const totalShares = 1000000;
  const allocatedShares = founders.reduce((sum, f) => sum + f.shares, 0) +
                          investors.reduce((sum, i) => sum + i.shares, 0) +
                          esopPool.shares;
  const allocationComplete = allocatedShares === totalShares;

  const statusMap = {
    1: progress.completedSteps.has('3-1') ? 'completed' : progress.currentStep === 1 ? 'current' : 'pending',
    2: progress.completedSteps.has('3-2') ? 'completed' : progress.currentStep === 2 ? 'current' : 'pending',
    3: progress.completedSteps.has('3-3') ? 'completed' : progress.currentStep === 3 ? 'current' : 'pending',
  };

  const handleNextClick = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      window.location.href = '/dashboard/entrepreneur/phase-3/step-3';
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
              <h1 className="text-2xl md:text-3xl font-bold text-neutral-1">Equity Structure</h1>
              <p className="text-sm text-neutral-5 mt-1">Define your cap table and share allocation</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-neutral-5 font-semibold uppercase tracking-wide mb-1">PROGRESS</p>
              <p className="text-sm font-semibold text-neutral-1">Step 2 of 3</p>
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
            {/* Founders */}
            <div className="bg-white border-2 border-neutral-2 rounded-2xl p-6 space-y-4">
              <h3 className="text-lg font-bold text-neutral-1 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Founders & Key Shareholders
              </h3>

              <div className="space-y-4">
                {founders.map((founder) => (
                  <div key={founder.id} className="space-y-2">
                    <label className="block text-sm font-semibold text-neutral-1">{founder.name}</label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={founder.shares}
                        placeholder="Shares"
                        className="h-10"
                        disabled
                      />
                      <span className="text-sm font-semibold text-neutral-5 w-16 text-right">
                        {founder.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t-2 border-neutral-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-5 mb-1">
                  Total Founder Ownership
                </p>
                <p className="text-2xl font-bold text-neutral-1">
                  {Math.round(
                    (founders.reduce((sum, f) => sum + f.shares, 0) / totalShares) * 100
                  )}%
                </p>
              </div>
            </div>

            {/* Investors */}
            <div className="bg-white border-2 border-neutral-2 rounded-2xl p-6 space-y-4">
              <h3 className="text-lg font-bold text-neutral-1">Early Investors</h3>

              <div className="space-y-4">
                {investors.map((investor) => (
                  <div key={investor.id} className="space-y-2">
                    <label className="block text-sm font-semibold text-neutral-1">{investor.name}</label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={investor.shares}
                        placeholder="Shares"
                        className="h-10"
                        disabled
                      />
                      <span className="text-sm font-semibold text-neutral-5 w-16 text-right">
                        {investor.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t-2 border-neutral-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-5 mb-1">
                  Total Investor Ownership
                </p>
                <p className="text-2xl font-bold text-neutral-1">
                  {Math.round(
                    (investors.reduce((sum, i) => sum + i.shares, 0) / totalShares) * 100
                  )}%
                </p>
              </div>
            </div>

            {/* ESOP Pool */}
            <div className="bg-white border-2 border-neutral-2 rounded-2xl p-6 space-y-4">
              <h3 className="text-lg font-bold text-neutral-1">Employee Stock Option Pool (ESOP)</h3>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-neutral-1">ESOP Pool Shares</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={esopPool.shares}
                    placeholder="Shares"
                    className="h-10"
                    disabled
                  />
                  <span className="text-sm font-semibold text-neutral-5 w-16 text-right">
                    {esopPool.percentage}%
                  </span>
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                <p className="text-sm font-semibold text-blue-900">💡 ESOP Best Practice</p>
                <p className="text-sm text-blue-800">
                  Maintain 10-15% ESOP pool for employee incentives. Current: {esopPool.percentage}%
                </p>
              </div>
            </div>
          </div>

          {/* Visualization & Summary */}
          <div className="space-y-6">
            {/* Cap Table Summary */}
            <div className="bg-white border-2 border-neutral-2 rounded-2xl p-6 space-y-4">
              <h3 className="text-lg font-bold text-neutral-1 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-primary" />
                Cap Table Summary
              </h3>

              <div className="space-y-3">
                {[
                  { label: 'Founders', value: Math.round((founders.reduce((sum, f) => sum + f.shares, 0) / totalShares) * 100), color: 'bg-primary' },
                  { label: 'Investors', value: Math.round((investors.reduce((sum, i) => sum + i.shares, 0) / totalShares) * 100), color: 'bg-blue-500' },
                  { label: 'ESOP Pool', value: esopPool.percentage, color: 'bg-green-500' },
                  { label: 'Reserved', value: 100 - allocatedShares / (totalShares / 100), color: 'bg-neutral-300' },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-neutral-1">{item.label}</span>
                      <span className="font-bold text-primary">{item.value}%</span>
                    </div>
                    <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full`}
                        style={{ width: `${item.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t-2 border-neutral-2 space-y-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-5">Total Shares</p>
                  <p className="text-2xl font-bold text-neutral-1">1,000,000</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-5">Fully Diluted</p>
                  <p className="text-2xl font-bold text-neutral-1">100%</p>
                </div>
              </div>

              {!allocationComplete && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-yellow-800">
                    Cap table allocation not complete. Review share distribution.
                  </p>
                </div>
              )}

              {allocationComplete && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-green-800">Cap table allocation verified.</p>
                </div>
              )}
            </div>

            {/* Key Metrics */}
            <div className="bg-neutral-50 border-2 border-neutral-2 rounded-2xl p-6 space-y-3">
              <h3 className="font-bold text-neutral-1 text-sm">Key Metrics</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-5">Founder Control</span>
                  <span className="font-bold text-neutral-1">
                    {Math.round((founders.reduce((sum, f) => sum + f.shares, 0) / totalShares) * 100)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-5">Investor Dilution</span>
                  <span className="font-bold text-neutral-1">
                    {Math.round((investors.reduce((sum, i) => sum + i.shares, 0) / totalShares) * 100)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-5">Available Pool</span>
                  <span className="font-bold text-neutral-1">{esopPool.percentage}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 h-11" onClick={() => window.location.href = '/dashboard/entrepreneur/phase-3/step-1'}>
            Back
          </Button>
          <Button className="flex-1 h-11 gap-2" onClick={handleNextClick} disabled={isLoading || !allocationComplete}>
            {isLoading ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Continuing...
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Phase3Step2Page() {
  return (
    <RouteGuard requiredPhase={3} requiredStep={2}>
      <Phase3Step2Client />
    </RouteGuard>
  );
}
