'use client';

import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, Target, DollarSign, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const mockData = {
  fundingProgress: 250000,
  fundingGoal: 1000000,
  fundsRaised: 250000,
  fundingNeed: 750000,
  investors: 3,
  stage: 'Pre-seed',

  projectNeeds: [
    {
      id: 1,
      category: 'Product Development',
      allocation: 35,
      current: 35000,
      goal: 100000,
    },
    {
      id: 2,
      category: 'Marketing & Sales',
      allocation: 25,
      current: 25000,
      goal: 100000,
    },
    {
      id: 3,
      category: 'Team & Operations',
      allocation: 30,
      current: 30000,
      goal: 100000,
    },
    {
      id: 4,
      category: 'Legal & Compliance',
      allocation: 10,
      current: 10000,
      goal: 100000,
    },
  ],

  advisors: [
    {
      id: 1,
      name: 'Sarah Johnson',
      role: 'Legal Advisor',
      status: 'Active',
      avatar: '👩‍⚖️',
    },
    {
      id: 2,
      name: 'Michael Chen',
      role: 'Financial Advisor',
      status: 'Active',
      avatar: '👨‍💼',
    },
    {
      id: 3,
      name: 'Emma Davis',
      role: 'Marketing Advisor',
      status: 'Pending',
      avatar: '👩‍💻',
    },
  ],

  investorMetrics: [
    {
      id: 1,
      name: 'Acme Ventures',
      type: 'VC Fund',
      matched: '92%',
      amount: '€250K',
      status: 'Interested',
    },
    {
      id: 2,
      name: 'Sarah Smith',
      type: 'Angel Investor',
      matched: '87%',
      amount: '€50K',
      status: 'Reviewing',
    },
    {
      id: 3,
      name: 'Tech Fund Europe',
      type: 'VC Fund',
      matched: '78%',
      amount: '€500K',
      status: 'New Match',
    },
  ],

  timelineData: [
    { month: 'Jan', raised: 50000 },
    { month: 'Feb', raised: 80000 },
    { month: 'Mar', raised: 150000 },
    { month: 'Apr', raised: 200000 },
    { month: 'May', raised: 250000 },
  ],
};

const StatCard = ({
  icon: Icon,
  label,
  value,
  subtext,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext?: string;
}) => (
  <div className="bg-white border-2 border-neutral-2 rounded-xl p-4 sm:p-6 space-y-3 hover:border-primary/50 transition">
    <div className="flex items-center justify-between">
      <p className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-neutral-5">{label}</p>
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">{Icon}</div>
    </div>
    <div>
      <p className="text-2xl sm:text-3xl font-bold text-neutral-1">{value}</p>
      {subtext && <p className="text-xs sm:text-sm text-neutral-5 mt-1">{subtext}</p>}
    </div>
  </div>
);

export default function Phase2DashboardPage() {
  const progressPercent = (mockData.fundingProgress / mockData.fundingGoal) * 100;

  return (
    <div className="min-h-screen bg-neutral-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header with Progress */}
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20 rounded-2xl p-6 sm:p-8 md:p-10">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl font-bold text-neutral-1 mb-2">
                Your Fundraising Journey
              </h1>
              <p className="text-sm sm:text-base text-neutral-5">
                Phase 2 Complete • Ready to start raising
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur rounded-xl p-4 sm:p-6 border border-white shrink-0 text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-5 mb-2">
                Verification Status
              </p>
              <div className="flex items-center justify-center gap-2 mb-3">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                <p className="text-lg font-bold text-green-700">Verified</p>
              </div>
              <p className="text-xs text-neutral-5">100% Complete</p>
            </div>
          </div>

          {/* Funding Progress */}
          <div className="mt-8 pt-8 border-t-2 border-primary/20">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <h3 className="text-lg font-bold text-neutral-1">
                Funding Progress: €{(mockData.fundingProgress / 1000).toFixed(0)}K / €{(mockData.fundingGoal / 1000).toFixed(0)}K
              </h3>
              <span className="text-2xl font-bold text-primary">{Math.round(progressPercent)}%</span>
            </div>
            <div className="h-4 bg-white/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<DollarSign className="w-6 h-6 text-primary" />}
            label="Funds Raised"
            value={`€${(mockData.fundsRaised / 1000).toFixed(0)}K`}
            subtext="From 3 investors"
          />
          <StatCard
            icon={<Target className="w-6 h-6 text-primary" />}
            label="Still Needed"
            value={`€${(mockData.fundingNeed / 1000).toFixed(0)}K`}
            subtext="75% of goal"
          />
          <StatCard
            icon={<Users className="w-6 h-6 text-primary" />}
            label="Active Investors"
            value={mockData.investors}
            subtext="In current round"
          />
          <StatCard
            icon={<TrendingUp className="w-6 h-6 text-primary" />}
            label="Current Stage"
            value={mockData.stage}
            subtext="Pre-seed round"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Funding Chart & Project Needs */}
          <div className="lg:col-span-2 space-y-8">
            {/* Funding Timeline Chart */}
            <div className="bg-white border-2 border-neutral-2 rounded-xl p-6">
              <h3 className="text-lg font-bold text-neutral-1 mb-6">Funding Timeline</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={mockData.timelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis dataKey="month" stroke="#999" />
                  <YAxis stroke="#999" />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="raised"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Project Needs */}
            <div className="bg-white border-2 border-neutral-2 rounded-xl p-6">
              <h3 className="text-lg font-bold text-neutral-1 mb-6">Capital Allocation</h3>
              <div className="space-y-4">
                {mockData.projectNeeds.map((need) => (
                  <div key={need.id}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-neutral-1">{need.category}</p>
                      <span className="text-xs font-bold text-primary">{need.allocation}%</span>
                    </div>
                    <div className="h-3 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-primary/70"
                        style={{ width: `${need.allocation}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Service Providers */}
          <div className="bg-white border-2 border-neutral-2 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-neutral-1">Your Advisors</h3>
              <Link href="/dashboard/entrepreneur/marketplace">
                <Button variant="ghost" size="sm" className="text-primary">
                  View More
                </Button>
              </Link>
            </div>

            <div className="space-y-3">
              {mockData.advisors.map((advisor) => (
                <div
                  key={advisor.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-neutral-50 border border-neutral-2 hover:bg-primary/5 transition"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">
                    {advisor.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-neutral-1 truncate">{advisor.name}</p>
                    <p className="text-xs text-neutral-5">{advisor.role}</p>
                  </div>
                  <div
                    className={`px-2 py-0.5 rounded text-xs font-semibold shrink-0 ${
                      advisor.status === 'Active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {advisor.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Investor Insights Table */}
        <div className="bg-white border-2 border-neutral-2 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-neutral-1">Investor Matches</h3>
            <Button asChild>
              <Link href="/dashboard/entrepreneur/investors">View All</Link>
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-neutral-2">
                  <th className="px-4 py-3 text-left font-semibold text-neutral-1">Investor Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-neutral-1">Type</th>
                  <th className="px-4 py-3 text-left font-semibold text-neutral-1">Match Score</th>
                  <th className="px-4 py-3 text-left font-semibold text-neutral-1">Ticket Size</th>
                  <th className="px-4 py-3 text-left font-semibold text-neutral-1">Status</th>
                </tr>
              </thead>
              <tbody>
                {mockData.investorMetrics.map((investor, idx) => (
                  <tr key={investor.id} className={idx !== mockData.investorMetrics.length - 1 ? 'border-b border-neutral-2' : ''}>
                    <td className="px-4 py-4 font-medium text-neutral-1">{investor.name}</td>
                    <td className="px-4 py-4 text-neutral-5">{investor.type}</td>
                    <td className="px-4 py-4">
                      <div className="w-24 h-2 bg-neutral-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${parseInt(investor.matched)}%` }}
                        />
                      </div>
                      <p className="text-xs font-semibold text-neutral-5 mt-1">{investor.matched}</p>
                    </td>
                    <td className="px-4 py-4 font-semibold text-primary">{investor.amount}</td>
                    <td className="px-4 py-4">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                        {investor.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-blue-900 mb-2">Ready to start pitching?</h3>
            <p className="text-sm text-blue-800">
              Your company is now verified and ready. Start connecting with investors matched to your stage.
            </p>
          </div>
          <Link href="/dashboard/entrepreneur/investors">
            <Button className="whitespace-nowrap gap-2">
              Start Pitching <TrendingUp className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
