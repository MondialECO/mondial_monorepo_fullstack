'use client';

import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useEntrepreneurProgress } from '@/hooks/useEntrepreneurProgress';
import { EntrepreneurLayout } from '@/components/entrepreneur/EntrepreneurLayout';
import { ProgressSidebar } from '@/components/entrepreneur/ProgressSidebar';
import { PhaseHeader } from '@/components/entrepreneur/PhaseHeader';
import { StepFooter } from '@/components/entrepreneur/StepFooter';
import { ArrowRight, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const PHASE_3_STEPS = [
  { step: 1 as const, title: 'Revenue Input', subtitle: 'Enter financial data' },
  { step: 2 as const, title: 'Equity Structure', subtitle: 'Cap table setup' },
  { step: 3 as const, title: 'Funding Ask', subtitle: 'Set raise amount' },
];

export function Phase3RevenueInputClient() {
  const { progress } = useEntrepreneurProgress();
  const [revenues, setRevenues] = useState({
    q1: '150000',
    q2: '200000',
    q3: '280000',
    q4: '350000',
  });
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

  const chartData = [
    { quarter: 'Q1', revenue: parseFloat(revenues.q1) || 0 },
    { quarter: 'Q2', revenue: parseFloat(revenues.q2) || 0 },
    { quarter: 'Q3', revenue: parseFloat(revenues.q3) || 0 },
    { quarter: 'Q4', revenue: parseFloat(revenues.q4) || 0 },
  ];

  const totalRevenue = chartData.reduce((sum, item) => sum + item.revenue, 0);
  const avgRevenue = totalRevenue / chartData.length;
  const growthRate = chartData.length > 1
    ? (((chartData[chartData.length - 1].revenue - chartData[0].revenue) / chartData[0].revenue) * 100).toFixed(1)
    : '0';

  const handleRevenueChange = (quarter: string, value: string) => {
    setRevenues(prev => ({
      ...prev,
      [quarter]: value,
    }));
  };

  const handleNextClick = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      window.location.href = '/dashboard/entrepreneur/phase-3/step-2';
    } finally {
      setIsLoading(false);
    }
  };

  const statusMap = {
    1: progress.completedSteps.has('3-1') ? 'completed' : progress.currentStep === 1 ? 'current' : 'pending',
    2: progress.completedSteps.has('3-2') ? 'completed' : progress.currentStep === 2 ? 'current' : 'pending',
    3: progress.completedSteps.has('3-3') ? 'completed' : progress.currentStep === 3 ? 'current' : 'pending',
  };

  const stepIndicators = PHASE_3_STEPS.map((step) => ({
    ...step,
    status: statusMap[step.step as keyof typeof statusMap] as any,
  }));

  const sidebarContent = (
    <ProgressSidebar
      title="Financial Verification"
      steps={stepIndicators}
      overallScore={50}
      scoreLabel="OVERALL SCORE"
      scoreDescription="Complete financial data to unlock funding."
    />
  );

  return (
    <EntrepreneurLayout sidebar={sidebarContent}>
      <div className="space-y-4 md:space-y-6">
        <PhaseHeader
          title="Revenue Input"
          subtitle="Enter your quarterly revenue data. This helps us calculate your valuation and investor readiness score."
          progressLabel="PROGRESS"
          progressValue="Step 1 of 3"
          progressPercentage={33}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-neutral-3 border-2 border-neutral-4 rounded-2xl p-6 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-neutral-1 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Quarterly Revenue
                </h3>
                <p className="text-sm text-neutral-5 mb-6">
                  Enter your revenue for each quarter (in EUR)
                </p>

                <div className="space-y-4">
                  {['q1', 'q2', 'q3', 'q4'].map((quarter, idx) => (
                    <div key={quarter}>
                      <label className="block text-sm font-semibold text-neutral-1 mb-2">
                        Q{idx + 1} 2024
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-neutral-5">€</span>
                        <Input
                          type="number"
                          value={revenues[quarter as keyof typeof revenues]}
                          onChange={(e) => handleRevenueChange(quarter, e.target.value)}
                          placeholder="0"
                          className="h-10 bg-background border-neutral-2 placeholder:text-neutral-5 flex-1"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t-2 border-neutral-2 space-y-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-5 mb-1">
                    Total Revenue
                  </p>
                  <p className="text-2xl font-bold text-neutral-1">
                    €{(totalRevenue / 1000).toFixed(0)}K
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-5 mb-1">
                    Avg per Quarter
                  </p>
                  <p className="text-xl font-bold text-neutral-1">
                    €{(avgRevenue / 1000).toFixed(1)}K
                  </p>
                </div>
              </div>

              <Button className="w-full h-11 gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Save Revenue Data
              </Button>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-neutral-3 border-2 border-neutral-4 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-neutral-1 mb-6">Revenue Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis dataKey="quarter" stroke="#999" />
                  <YAxis stroke="#999" />
                  <Tooltip
                    formatter={(value: number) => `€${(value / 1000).toFixed(1)}K`}
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px' }}
                  />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border-2 border-neutral-2 rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-5">
                  Growth Rate
                </p>
                <p className="text-3xl font-bold text-neutral-1">{growthRate}%</p>
                <p className="text-xs text-neutral-5">Q1 to Q4</p>
              </div>
              <div className="bg-white border-2 border-neutral-2 rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-5">
                  Health Score
                </p>
                <p className="text-3xl font-bold text-green-600">85%</p>
                <p className="text-xs text-neutral-5">Very good</p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-900 mb-1">Financial Verification</p>
                <p className="text-sm text-blue-800">
                  Your revenue data will be verified and used to calculate your company valuation for investor matching.
                </p>
              </div>
            </div>
          </div>
        </div>

        <StepFooter
          backUrl="/dashboard/entrepreneur/phase-2/dashboard"
          onNextClick={handleNextClick}
          isLoading={isLoading}
          nextLabel="Continue"
        />
      </div>
    </EntrepreneurLayout>
  );
}
