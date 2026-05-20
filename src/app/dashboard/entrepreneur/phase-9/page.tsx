'use client';

import { useState } from 'react';
import {
  Users,
  TrendingUp,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  DollarSign,
  Calendar,
  MoreVertical,
  Download,
  MessageCircle,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEntrepreneurProgress } from '@/hooks/useEntrepreneurProgress';
import { RouteGuard } from '@/components/entrepreneur/RouteGuard';

const DEAL_STAGES = [
  { stage: 'Negotiation', status: 'In Progress', percentage: 45, icon: MessageCircle },
  { stage: 'Term Sheet', status: 'In Progress', percentage: 45, icon: FileText },
  { stage: 'Due Diligence', status: 'Pending', percentage: 0, icon: AlertCircle },
  { stage: 'Closing', status: 'Pending', percentage: 0, icon: CheckCircle2 },
];

const INVESTORS = [
  {
    id: 1,
    name: 'Acme Ventures',
    stage: 'Term Sheet Review',
    amount: '€200K',
    valuation: '€3.5M',
    progress: 65,
    lastUpdate: '2024-05-18',
  },
  {
    id: 2,
    name: 'Tech Fund Europe',
    stage: 'Initial Negotiation',
    amount: '€150K',
    valuation: '€3.2M',
    progress: 35,
    lastUpdate: '2024-05-15',
  },
  {
    id: 3,
    name: 'Angel Syndicate',
    stage: 'Due Diligence',
    amount: '€100K',
    valuation: '€3.5M',
    progress: 80,
    lastUpdate: '2024-05-20',
  },
];

const CLOSING_CHECKLIST = [
  { id: 1, item: 'Final Term Sheet Signed', completed: true, dueDate: '2024-05-25' },
  { id: 2, item: 'Legal Documents Drafted', completed: true, dueDate: '2024-05-28' },
  { id: 3, item: 'Investor Due Diligence Complete', completed: false, dueDate: '2024-06-05' },
  { id: 4, item: 'Cap Table Updated', completed: false, dueDate: '2024-06-10' },
  { id: 5, item: 'Fund Wire Instructions Received', completed: false, dueDate: '2024-06-12' },
  { id: 6, item: 'Final Signatures & Closing', completed: false, dueDate: '2024-06-15' },
];

const KEY_TERMS = [
  { term: 'Investment Amount', value: '€450K (Target)', status: 'Negotiating' },
  { term: 'Post-Money Valuation', value: '€3.5M - €4M', status: 'Negotiating' },
  { term: 'Preferred Stock Type', value: 'Series A Preferred', status: 'Agreed' },
  { term: 'Board Seats', value: '1 Investor Seat', status: 'Agreed' },
  { term: 'Liquidation Preference', value: '1x Non-Participating', status: 'Pending' },
  { term: 'Anti-Dilution', value: 'Weighted Average', status: 'Pending' },
];

function Phase9PageContent() {
  const { progress } = useEntrepreneurProgress();
  const [activeTab, setActiveTab] = useState('overview');

  if (!progress) return null;

  const completedSteps = CLOSING_CHECKLIST.filter((item) => item.completed).length;

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Header */}
      <header className="bg-white border-b border-neutral-2 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 h-16 md:h-20 flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-neutral-1">Deal Execution</h1>
            <p className="text-sm text-neutral-5 mt-0.5">Manage term sheets, negotiations, and closing process</p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8 space-y-6 md:space-y-8">
        {/* Tabs */}
        <div className="flex gap-2 border-b border-neutral-2 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'investors', label: 'Investors' },
            { id: 'terms', label: 'Key Terms' },
            { id: 'checklist', label: 'Closing Checklist' },
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
            {/* Deal Pipeline */}
            <div className="bg-white border-2 border-neutral-2 rounded-xl p-4 sm:p-6">
              <h3 className="text-lg font-bold text-neutral-1 mb-6">Deal Pipeline</h3>
              <div className="space-y-4">
                {DEAL_STAGES.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.stage}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Icon className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-neutral-1">{item.stage}</p>
                            <p className="text-xs text-neutral-5">{item.status}</p>
                          </div>
                        </div>
                        <span className="text-lg font-bold text-primary">{item.percentage}%</span>
                      </div>
                      <div className="w-full h-3 bg-neutral-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  label: 'Active Investors',
                  value: '3',
                  icon: Users,
                  color: 'bg-primary/10 text-primary',
                },
                {
                  label: 'Total Raising',
                  value: '€450K',
                  icon: DollarSign,
                  color: 'bg-green-100 text-green-700',
                },
                {
                  label: 'Closing Checklist',
                  value: `${completedSteps}/${CLOSING_CHECKLIST.length}`,
                  icon: CheckCircle2,
                  color: 'bg-blue-100 text-blue-700',
                },
              ].map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.label} className={`${card.color} border-2 border-current rounded-lg p-4`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-5 h-5" />
                      <p className="text-xs font-semibold uppercase tracking-wide opacity-75">{card.label}</p>
                    </div>
                    <p className="text-3xl font-bold">{card.value}</p>
                  </div>
                );
              })}
            </div>

            {/* Recent Activity */}
            <div className="bg-white border-2 border-neutral-2 rounded-xl p-4 sm:p-6">
              <h3 className="text-lg font-bold text-neutral-1 mb-6">Recent Updates</h3>
              <div className="space-y-4">
                {[
                  {
                    investor: 'Acme Ventures',
                    action: 'Submitted revised term sheet',
                    date: '2024-05-18',
                    status: 'pending',
                  },
                  {
                    investor: 'Angel Syndicate',
                    action: 'Completed technical DD',
                    date: '2024-05-17',
                    status: 'completed',
                  },
                  {
                    investor: 'Tech Fund Europe',
                    action: 'Initial call scheduled',
                    date: '2024-05-16',
                    status: 'pending',
                  },
                ].map((update, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-4 pb-4 border-b border-neutral-2 last:border-0 last:pb-0"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <MessageCircle className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-neutral-1">{update.investor}</p>
                      <p className="text-sm text-neutral-5 mt-1">{update.action}</p>
                      <p className="text-xs text-neutral-5 mt-2">{update.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'investors' && (
          <div className="bg-white border-2 border-neutral-2 rounded-xl overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-neutral-2">
              <h3 className="font-bold text-neutral-1">Active Investment Discussions</h3>
              <p className="text-sm text-neutral-5 mt-1">{INVESTORS.length} investors in active negotiations</p>
            </div>

            <div className="space-y-4 p-4 sm:p-6">
              {INVESTORS.map((investor) => (
                <div key={investor.id} className="border-2 border-neutral-2 rounded-lg p-4 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-neutral-1">{investor.name}</h4>
                      <p className="text-sm text-neutral-5 mt-1">{investor.stage}</p>
                    </div>
                    <button className="p-2 hover:bg-neutral-100 rounded-lg transition">
                      <MoreVertical className="w-4 h-4 text-neutral-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-neutral-5 font-semibold uppercase tracking-wide">Amount</p>
                      <p className="text-lg font-bold text-primary mt-1">{investor.amount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-5 font-semibold uppercase tracking-wide">Valuation</p>
                      <p className="text-lg font-bold text-neutral-1 mt-1">{investor.valuation}</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-5 font-semibold uppercase tracking-wide">Last Update</p>
                      <p className="text-lg font-bold text-neutral-1 mt-1">{investor.lastUpdate}</p>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-neutral-5">Deal Progress</span>
                      <span className="text-sm font-bold text-primary">{investor.progress}%</span>
                    </div>
                    <div className="w-full h-3 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full"
                        style={{ width: `${investor.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1 gap-2">
                      <MessageCircle className="w-4 h-4" />
                      Message
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 gap-2">
                      <FileText className="w-4 h-4" />
                      Documents
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'terms' && (
          <div className="bg-white border-2 border-neutral-2 rounded-xl overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-neutral-2">
              <h3 className="font-bold text-neutral-1">Key Term Tracking</h3>
              <p className="text-sm text-neutral-5 mt-1">Monitor negotiation status of critical deal terms</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-2 bg-neutral-50">
                    <th className="px-4 py-3 text-left font-semibold text-neutral-1">Term</th>
                    <th className="px-4 py-3 text-left font-semibold text-neutral-1">Proposed Value</th>
                    <th className="px-4 py-3 text-left font-semibold text-neutral-1">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {KEY_TERMS.map((item, idx) => (
                    <tr
                      key={item.term}
                      className={idx !== KEY_TERMS.length - 1 ? 'border-b border-neutral-2' : ''}
                    >
                      <td className="px-4 py-4 font-medium text-neutral-1">{item.term}</td>
                      <td className="px-4 py-4 text-neutral-5">{item.value}</td>
                      <td className="px-4 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            item.status === 'Agreed'
                              ? 'bg-green-100 text-green-700'
                              : item.status === 'Negotiating'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 sm:p-6 bg-blue-50 border-t border-blue-200">
              <p className="text-sm text-blue-900">
                <span className="font-semibold">Progress:</span> 4 of 6 key terms agreed upon. Continue negotiating
                remaining items.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'checklist' && (
          <div className="bg-white border-2 border-neutral-2 rounded-xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-neutral-1">Closing Checklist</h3>
              <span className="text-sm font-semibold text-primary">
                {completedSteps} of {CLOSING_CHECKLIST.length} complete
              </span>
            </div>

            <div className="mb-6">
              <div className="w-full h-3 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full"
                  style={{ width: `${(completedSteps / CLOSING_CHECKLIST.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="space-y-3">
              {CLOSING_CHECKLIST.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-4 border-2 border-neutral-2 rounded-lg hover:border-primary/50 transition"
                >
                  <input
                    type="checkbox"
                    checked={item.completed}
                    disabled
                    className="w-6 h-6 rounded border-2 border-neutral-2"
                  />
                  <div className="flex-1">
                    <p className={`font-medium ${item.completed ? 'text-neutral-5 line-through' : 'text-neutral-1'}`}>
                      {item.item}
                    </p>
                    <p className="text-xs text-neutral-5 mt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Due: {item.dueDate}
                    </p>
                  </div>
                  {item.completed ? (
                    <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                  ) : (
                    <Clock className="w-6 h-6 text-yellow-600 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-900">
                <span className="font-semibold">Timeline:</span> On track for June 15 closing date. Keep all
                stakeholders updated on progress.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Phase9Page() {
  return (
    <RouteGuard requiredPhase={9}>
      <Phase9PageContent />
    </RouteGuard>
  );
}
