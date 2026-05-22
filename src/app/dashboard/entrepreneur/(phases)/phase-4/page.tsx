'use client';

import { useState } from 'react';
import { PieChart, TrendingUp, ChevronDown, Plus, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEntrepreneurProgress } from '@/hooks/useEntrepreneurProgress';
import { RouteGuard } from '@/components/entrepreneur/RouteGuard';

const STAKEHOLDERS = [
  { id: 1, name: 'Founder A', role: 'Founder', ownership: '45%', vested: '75%', status: 'Founder' },
  { id: 2, name: 'Founder B', role: 'Co-Founder', ownership: '35%', vested: '75%', status: 'Co-Founder' },
  { id: 3, name: 'Early Investor', role: 'Investor', ownership: '12%', vested: '100%', status: 'Investor' },
  { id: 4, name: 'Advisor', role: 'Advisor', ownership: '5%', vested: '25%', status: 'Advisor' },
  { id: 5, name: 'Employee Pool', role: 'ESOP', ownership: '3%', vested: '0%', status: 'Reserved' },
];

const ROUNDS = [
  { phase: 'Pre-Seed', founders: '80%', investors: '20%' },
  { phase: 'Seed', founders: '64%', investors: '32%', new: '4%' },
  { phase: 'Series A', founders: '52%', investors: '40%', new: '8%' },
  { phase: 'Series B', founders: '42%', investors: '48%', new: '10%' },
];

function Phase4PageContent() {
  const { progress } = useEntrepreneurProgress();
  const [activeTab, setActiveTab] = useState('overview');

  if (!progress) return null;

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Header */}
      <header className="bg-white border-b border-neutral-2 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 h-16 md:h-20 flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-neutral-1">Equity Structure & Ownership</h1>
            <p className="text-sm text-neutral-5 mt-0.5">Define cap table, ESOP, and analyze dilution scenarios</p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8 space-y-6 md:space-y-8">
        {/* Progress Tabs */}
        <div className="flex gap-2 border-b border-neutral-2 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'cap-table', label: 'Cap Table' },
            { id: 'esop', label: 'ESOP' },
            { id: 'dilution', label: 'Dilution Sim' },
            { id: 'history', label: 'History' },
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
            {/* Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Shares Issued', value: '1,000,000' },
                { label: 'Founder Ownership', value: '80%' },
                { label: 'Investor Ownership', value: '17%' },
                { label: 'Reserved Pool', value: '3%' },
              ].map((metric) => (
                <div key={metric.label} className="bg-white border-2 border-neutral-2 rounded-xl p-4 sm:p-6 space-y-3 hover:border-primary/50 transition">
                  <p className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-neutral-5">
                    {metric.label}
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-neutral-1">{metric.value}</p>
                </div>
              ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Investor Insights Table */}
              <div className="lg:col-span-2 bg-white border-2 border-neutral-2 rounded-xl p-4 sm:p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-neutral-1">Current Stakeholders</h3>
                  <Button size="sm" variant="outline" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Stakeholder
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-neutral-2">
                        <th className="px-4 py-3 text-left font-semibold text-neutral-1">Name</th>
                        <th className="px-4 py-3 text-left font-semibold text-neutral-1">Role</th>
                        <th className="px-4 py-3 text-left font-semibold text-neutral-1">Ownership</th>
                        <th className="px-4 py-3 text-left font-semibold text-neutral-1">Vested</th>
                        <th className="px-4 py-3 text-left font-semibold text-neutral-1">Status</th>
                        <th className="px-4 py-3 text-right font-semibold text-neutral-1">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {STAKEHOLDERS.map((stakeholder, idx) => (
                        <tr
                          key={stakeholder.id}
                          className={idx !== STAKEHOLDERS.length - 1 ? 'border-b border-neutral-2' : ''}
                        >
                          <td className="px-4 py-4 font-medium text-neutral-1">{stakeholder.name}</td>
                          <td className="px-4 py-4 text-neutral-5">{stakeholder.role}</td>
                          <td className="px-4 py-4 font-semibold text-primary">{stakeholder.ownership}</td>
                          <td className="px-4 py-4">
                            <div className="w-16 h-2 bg-neutral-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full"
                                style={{ width: stakeholder.vested }}
                              />
                            </div>
                            <p className="text-xs text-neutral-5 mt-1">{stakeholder.vested}</p>
                          </td>
                          <td className="px-4 py-4">
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                              {stakeholder.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <button className="p-2 hover:bg-neutral-100 rounded-lg transition">
                              <MoreVertical className="w-4 h-4 text-neutral-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Total Share Info */}
                <div className="mt-6 pt-6 border-t-2 border-neutral-2 space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-5">Total Allocated</p>
                      <p className="text-xl font-bold text-neutral-1">97%</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-5">Reserved Pool</p>
                      <p className="text-xl font-bold text-neutral-1">3%</p>
                    </div>
                    <div className="text-right">
                      <Button size="sm" variant="outline" className="gap-2">
                        <Plus className="w-4 h-4" />
                        Add Stakeholder
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ownership Valuation */}
              <div className="bg-white border-2 border-neutral-2 rounded-xl p-4 sm:p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-neutral-1">Ownership</h3>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                    Current
                  </span>
                </div>

                {/* Simple Pie Chart Visualization */}
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-primary to-primary/40 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-white">3</p>
                      <p className="text-xs text-white/80">Holders</p>
                    </div>
                  </div>
                </div>

                {/* Stakeholders List */}
                <div className="space-y-3">
                  {[
                    { name: 'Founders', percentage: '80%', color: 'bg-primary' },
                    { name: 'Investors', percentage: '17%', color: 'bg-blue-500' },
                    { name: 'Reserved', percentage: '3%', color: 'bg-neutral-400' },
                  ].map((item) => (
                    <div key={item.name} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-neutral-1">{item.name}</span>
                        <span className="font-bold text-primary">{item.percentage}</span>
                      </div>
                      <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                        <div className={`h-full ${item.color} rounded-full`} style={{ width: item.percentage }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-900">
                    <span className="font-semibold">Majority Control:</span> Founders maintain majority control with combined 80% ownership.
                  </p>
                </div>
              </div>
            </div>

            {/* Ownership Journey */}
            <div className="bg-white border-2 border-neutral-2 rounded-xl p-4 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-neutral-1">Ownership Journey</h3>
                <Button size="sm" variant="outline">
                  View Projections
                </Button>
              </div>

              <div className="overflow-x-auto">
                <div className="min-w-full inline-flex gap-4 pb-4">
                  {ROUNDS.map((round, idx) => (
                    <div
                      key={idx}
                      className="flex-shrink-0 w-64 bg-neutral-50 border-2 border-neutral-2 rounded-lg p-4 space-y-4"
                    >
                      <h4 className="font-semibold text-neutral-1">{round.phase}</h4>

                      <div className="space-y-3">
                        {Object.entries(round).map(([key, value]) => {
                          if (key === 'phase') return null;
                          return (
                            <div key={key}>
                              <div className="flex items-center justify-between text-sm mb-1">
                                <span className="capitalize text-neutral-5">{key}</span>
                                <span className="font-bold text-neutral-1">{value}</span>
                              </div>
                              <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full"
                                  style={{ width: value }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-900">
                  <span className="font-semibold">Dilution Forecast:</span> Founders are projected to retain 42% ownership after Series B with current allocation strategy.
                </p>
              </div>
            </div>

            {/* Distribution Overview */}
            <div className="bg-white border-2 border-neutral-2 rounded-xl p-4 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-neutral-1">Allocation Breakdown</h3>
                <Button size="sm" variant="outline">
                  Edit Allocation
                </Button>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="font-semibold text-neutral-1">Total Share Distribution</span>
                    <span className="text-primary font-bold">100%</span>
                  </div>
                  <div className="w-full h-3 bg-neutral-100 rounded-full overflow-hidden">
                    <div className="h-full flex">
                      <div className="h-full bg-primary" style={{ width: '80%' }} />
                      <div className="h-full bg-blue-500" style={{ width: '17%' }} />
                      <div className="h-full bg-neutral-400" style={{ width: '3%' }} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Founders', value: '800K', percentage: '80%' },
                    { label: 'Investors', value: '170K', percentage: '17%' },
                    { label: 'Reserved', value: '30K', percentage: '3%' },
                  ].map((item) => (
                    <div key={item.label} className="text-center p-4 bg-neutral-50 rounded-lg border border-neutral-2">
                      <p className="text-xs text-neutral-5 mb-1">{item.label}</p>
                      <p className="text-lg font-bold text-neutral-1">{item.value}</p>
                      <p className="text-xs text-neutral-5 mt-1">{item.percentage}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'cap-table' && (
          <div className="bg-white border-2 border-neutral-2 rounded-xl p-6 text-center py-16">
            <PieChart className="w-12 h-12 text-neutral-5 mx-auto mb-4" />
            <p className="text-neutral-1 font-semibold mb-2">Cap Table View</p>
            <p className="text-sm text-neutral-5">Detailed cap table management coming soon</p>
          </div>
        )}

        {activeTab === 'esop' && (
          <div className="bg-white border-2 border-neutral-2 rounded-xl p-6 text-center py-16">
            <TrendingUp className="w-12 h-12 text-neutral-5 mx-auto mb-4" />
            <p className="text-neutral-1 font-semibold mb-2">ESOP Program</p>
            <p className="text-sm text-neutral-5">Employee Stock Ownership Plan details coming soon</p>
          </div>
        )}

        {activeTab === 'dilution' && (
          <div className="bg-white border-2 border-neutral-2 rounded-xl p-6 text-center py-16">
            <TrendingUp className="w-12 h-12 text-neutral-5 mx-auto mb-4" />
            <p className="text-neutral-1 font-semibold mb-2">Dilution Simulator</p>
            <p className="text-sm text-neutral-5">Model funding round scenarios coming soon</p>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white border-2 border-neutral-2 rounded-xl p-6 text-center py-16">
            <ChevronDown className="w-12 h-12 text-neutral-5 mx-auto mb-4" />
            <p className="text-neutral-1 font-semibold mb-2">Change History</p>
            <p className="text-sm text-neutral-5">Ownership changes and milestones coming soon</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Phase4Page() {
  return (
    <RouteGuard requiredPhase={4}>
      <Phase4PageContent />
    </RouteGuard>
  );
}
