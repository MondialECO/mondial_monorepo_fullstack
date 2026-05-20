'use client';

import { useState } from 'react';
import { Zap, TrendingUp, ArrowRight, DollarSign, Target, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useEntrepreneurProgress } from '@/hooks/useEntrepreneurProgress';
import { RouteGuard } from '@/components/entrepreneur/RouteGuard';

const USE_OF_FUNDS = [
  { category: 'Product Development', percentage: 35, amount: 157500, color: 'bg-primary' },
  { category: 'Sales & Marketing', percentage: 25, amount: 112500, color: 'bg-blue-500' },
  { category: 'Operations & Admin', percentage: 20, amount: 90000, color: 'bg-green-500' },
  { category: 'Team & HR', percentage: 15, amount: 67500, color: 'bg-yellow-500' },
  { category: 'Legal & Compliance', percentage: 5, amount: 22500, color: 'bg-red-500' },
];

const MARKET_DATA = [
  { metric: 'Total Addressable Market (TAM)', value: '€2.5B', description: 'Global market opportunity' },
  { metric: 'Serviceable Available Market (SAM)', value: '€450M', description: 'Market we can reach' },
  { metric: 'Serviceable Obtainable Market (SOM)', value: '€25M', description: '5-year target market' },
];

const PROJECTIONS = [
  { year: 'Y1', revenue: '€500K', burn: '€800K', runway: '8 months' },
  { year: 'Y2', revenue: '€2.5M', burn: '€600K', runway: '14 months' },
  { year: 'Y3', revenue: '€8M', burn: '€0K', runway: 'Break-even' },
];

function Phase5PageContent() {
  const { progress } = useEntrepreneurProgress();
  const [fundingAsk, setFundingAsk] = useState('450000');
  const [activeTab, setActiveTab] = useState('overview');

  if (!progress) return null;

  const fundingAskValue = parseInt(fundingAsk) || 450000;

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Header */}
      <header className="bg-white border-b border-neutral-2 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 h-16 md:h-20 flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-neutral-1">Funding Requirements & Strategy</h1>
            <p className="text-sm text-neutral-5 mt-0.5">Define your funding needs and capital allocation strategy</p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8 space-y-6 md:space-y-8">
        {/* Tabs */}
        <div className="flex gap-2 border-b border-neutral-2 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'allocation', label: 'Use of Funds' },
            { id: 'market', label: 'Market Analysis' },
            { id: 'projections', label: 'Projections' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 md:px-4 py-3 text-xs md:text-sm font-medium border-b-2 transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-neutral-5 hover:text-neutral-1'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <>
            {/* Funding Ask Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Funding Ask Input */}
              <div className="lg:col-span-2 bg-white border-2 border-neutral-2 rounded-xl p-4 sm:p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-neutral-1 mb-2 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-primary" />
                    Total Funding Ask
                  </h3>
                  <p className="text-sm text-neutral-5 mb-4">
                    Define the total amount of capital you need to raise for the next 24 months
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-1 mb-2">
                      Funding Amount (EUR)
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold text-neutral-5">€</span>
                      <Input
                        type="number"
                        value={fundingAsk}
                        onChange={(e) => setFundingAsk(e.target.value)}
                        className="h-12 text-lg"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t-2 border-neutral-2 space-y-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-5 mb-1">
                        Monthly Burn Rate
                      </p>
                      <p className="text-2xl font-bold text-neutral-1">€33,333</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-5 mb-1">
                        Projected Runway
                      </p>
                      <p className="text-2xl font-bold text-green-600">13.5 months</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                  <p className="text-sm font-semibold text-blue-900">💡 Funding Timeline</p>
                  <p className="text-sm text-blue-800">
                    Target closing date: Q2 2026. This gives you sufficient runway to reach key milestones.
                  </p>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="bg-white border-2 border-neutral-2 rounded-xl p-4 sm:p-6 space-y-4">
                <h3 className="text-lg font-bold text-neutral-1">Key Metrics</h3>

                <div className="space-y-4">
                  {[
                    { icon: DollarSign, label: 'Current Raised', value: '€250K', color: 'bg-primary/10 text-primary' },
                    { icon: Target, label: 'Funding Goal', value: '€450K', color: 'bg-blue-100 text-blue-700' },
                    { icon: TrendingUp, label: 'Still Needed', value: '€200K', color: 'bg-green-100 text-green-700' },
                    { icon: Users, label: 'Active Investors', value: '3', color: 'bg-yellow-100 text-yellow-700' },
                  ].map((metric) => {
                    const Icon = metric.icon;
                    return (
                      <div key={metric.label} className={`p-3 rounded-lg ${metric.color} space-y-1`}>
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
                          <Icon className="w-4 h-4" />
                          {metric.label}
                        </div>
                        <p className="text-xl font-bold">{metric.value}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Use of Funds Preview */}
            <div className="bg-white border-2 border-neutral-2 rounded-xl p-4 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-neutral-1">Capital Allocation Preview</h3>
                <Button size="sm" variant="outline">
                  View Detailed Breakdown
                </Button>
              </div>

              <div className="space-y-4">
                {USE_OF_FUNDS.map((item) => (
                  <div key={item.category}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-neutral-1">{item.category}</p>
                      <span className="text-xs font-bold text-primary">{item.percentage}%</span>
                    </div>
                    <div className="w-full h-3 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full`}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-neutral-5 mt-1">€{(item.amount / 1000).toFixed(0)}K</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'allocation' && (
          <div className="space-y-6">
            <div className="bg-white border-2 border-neutral-2 rounded-xl p-4 sm:p-6">
              <h3 className="text-lg font-bold text-neutral-1 mb-6">Use of Funds Breakdown</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Allocation Chart */}
                <div className="space-y-6">
                  {USE_OF_FUNDS.map((item) => (
                    <div key={item.category}>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-semibold text-neutral-1">{item.category}</p>
                          <p className="text-xs text-neutral-5">€{(item.amount / 1000).toFixed(1)}K</p>
                        </div>
                        <span className="text-lg font-bold text-primary">{item.percentage}%</span>
                      </div>
                      <div className="w-full h-4 bg-neutral-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${item.color} rounded-full`}
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div className="bg-neutral-50 border-2 border-neutral-2 rounded-xl p-6 space-y-4">
                  <h4 className="font-bold text-neutral-1">Allocation Summary</h4>
                  <div className="space-y-3">
                    {USE_OF_FUNDS.map((item) => (
                      <div key={item.category} className="flex items-center justify-between">
                        <span className="text-sm text-neutral-5">{item.category}</span>
                        <span className="font-semibold text-neutral-1">€{(item.amount / 1000).toFixed(1)}K</span>
                      </div>
                    ))}
                    <div className="pt-3 border-t-2 border-neutral-2 flex items-center justify-between">
                      <span className="font-semibold text-neutral-1">Total</span>
                      <span className="font-bold text-primary text-lg">€450K</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'market' && (
          <div className="space-y-6">
            <div className="bg-white border-2 border-neutral-2 rounded-xl p-4 sm:p-6">
              <h3 className="text-lg font-bold text-neutral-1 mb-6">Market Analysis</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {MARKET_DATA.map((item) => (
                  <div key={item.metric} className="border-2 border-neutral-2 rounded-lg p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-neutral-5 mb-2">
                      {item.metric}
                    </p>
                    <p className="text-3xl font-bold text-primary mb-2">{item.value}</p>
                    <p className="text-sm text-neutral-5">{item.description}</p>
                  </div>
                ))}
              </div>

              {/* Market Hierarchy Visualization */}
              <div className="space-y-4">
                <h4 className="font-semibold text-neutral-1">Market Opportunity Hierarchy</h4>
                <div className="space-y-3">
                  {[
                    { label: 'TAM', value: '€2.5B', width: 'w-full', color: 'bg-primary/20' },
                    { label: 'SAM', value: '€450M', width: 'w-1/6', color: 'bg-primary/40' },
                    { label: 'SOM', value: '€25M', width: 'w-1/50', color: 'bg-primary' },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-neutral-1">{item.label}</span>
                        <span className="text-sm font-semibold text-primary">{item.value}</span>
                      </div>
                      <div className="w-full h-8 bg-neutral-100 rounded-lg overflow-hidden">
                        <div className={`h-full ${item.color} rounded-lg`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'projections' && (
          <div className="space-y-6">
            <div className="bg-white border-2 border-neutral-2 rounded-xl p-4 sm:p-6">
              <h3 className="text-lg font-bold text-neutral-1 mb-6">Financial Projections</h3>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-neutral-2">
                      <th className="px-4 py-3 text-left font-semibold text-neutral-1">Year</th>
                      <th className="px-4 py-3 text-left font-semibold text-neutral-1">Projected Revenue</th>
                      <th className="px-4 py-3 text-left font-semibold text-neutral-1">Monthly Burn Rate</th>
                      <th className="px-4 py-3 text-left font-semibold text-neutral-1">Runway</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PROJECTIONS.map((proj, idx) => (
                      <tr key={proj.year} className={idx !== PROJECTIONS.length - 1 ? 'border-b border-neutral-2' : ''}>
                        <td className="px-4 py-4 font-semibold text-neutral-1">{proj.year}</td>
                        <td className="px-4 py-4 font-semibold text-primary">{proj.revenue}</td>
                        <td className="px-4 py-4 text-neutral-1">{proj.burn}</td>
                        <td className="px-4 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              proj.runway === 'Break-even' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {proj.runway}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-900">
                  <span className="font-semibold">Growth Trajectory:</span> Revenue grows 5x in Year 2 and reaches profitability by Year 3 with disciplined spending.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Phase5Page() {
  return (
    <RouteGuard requiredPhase={5}>
      <Phase5PageContent />
    </RouteGuard>
  );
}
