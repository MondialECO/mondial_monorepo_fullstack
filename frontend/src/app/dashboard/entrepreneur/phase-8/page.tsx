'use client';

import { useState } from 'react';
import { Users, MessageCircle, Handshake, Eye, CheckCircle2, ChevronRight, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';

const METRICS = [
  { icon: Users, label: 'Total Investor Views', value: '1,234' },
  { icon: MessageCircle, label: 'Expression of Interest', value: '42' },
  { icon: Handshake, label: 'Handshakes', value: '18' },
  { icon: Eye, label: 'Profile Views', value: '856' },
];

const FILTER_BUTTONS = [
  { id: 'all', label: 'All Investors', count: 48 },
  { id: 'interested', label: 'Interested', count: 12 },
  { id: 'reviewing', label: 'Reviewing', count: 8 },
  { id: 'matched', label: 'High Match', count: 28 },
];

const INVESTOR_CARDS = [
  {
    id: 1,
    name: 'Acme Ventures',
    type: 'Venture Capital',
    matchScore: 92,
    investmentRange: '€100K - €500K',
    sectors: ['B2B SaaS', 'MarketTech'],
    stage: 'Pre-seed, Seed',
    status: 'Interested',
  },
  {
    id: 2,
    name: 'Sarah Chen',
    type: 'Angel Investor',
    matchScore: 87,
    investmentRange: '€50K - €150K',
    sectors: ['AI/ML', 'FinTech'],
    stage: 'Pre-seed',
    status: 'Reviewing',
  },
  {
    id: 3,
    name: 'Tech Fund Europe',
    type: 'VC Fund',
    matchScore: 78,
    investmentRange: '€500K - €2M',
    sectors: ['Deep Tech', 'Climate'],
    stage: 'Seed, Series A',
    status: 'New Match',
  },
  {
    id: 4,
    name: 'Innovation Partners',
    type: 'Corporate VC',
    matchScore: 85,
    investmentRange: '€200K - €1M',
    sectors: ['Mobile', 'DevTools'],
    stage: 'Pre-seed, Seed',
    status: 'Interested',
  },
  {
    id: 5,
    name: 'Global Growth Fund',
    type: 'PE Fund',
    matchScore: 81,
    investmentRange: '€1M - €5M',
    sectors: ['SaaS', 'MarketTech', 'Enterprise'],
    stage: 'Series A, Series B',
    status: 'Interested',
  },
  {
    id: 6,
    name: 'European Tech Alliance',
    type: 'Fund of Funds',
    matchScore: 76,
    investmentRange: '€100K - €2M',
    sectors: ['Climate Tech', 'CleanTech'],
    stage: 'Seed, Series A',
    status: 'New Match',
  },
];

export default function Phase8InvestorMatchingPage() {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedTab, setSelectedTab] = useState('all');

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Header */}
      <header className="bg-white border-b border-neutral-2 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 h-16 md:h-20 flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-neutral-1">Investor Matching</h1>
            <p className="text-sm text-neutral-5 mt-0.5">Find and connect with investors who match your profile</p>
          </div>
          <Button className="gap-2 ml-4 whitespace-nowrap">
            <span>Next Matches</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8 space-y-6 md:space-y-8">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {METRICS.map(({ icon: Icon, label, value }) => (
            <div
              key={label}
              className="bg-white border-2 border-neutral-2 rounded-xl p-4 sm:p-6 space-y-3 hover:border-primary/50 transition"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-neutral-5">
                  {label}
                </p>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-neutral-1">{value}</p>
            </div>
          ))}
        </div>

        {/* Investor Status Bar */}
        <div className="bg-white border-2 border-neutral-2 rounded-xl p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
              <span className="text-neutral-5">Your Status:</span>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-neutral-1">Verified Company</span>
              </div>
              <div className="w-1 h-6 bg-neutral-2 hidden sm:block"></div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-primary"></div>
                <span className="font-semibold text-neutral-1">Investor Ready</span>
              </div>
              <div className="w-1 h-6 bg-neutral-2 hidden sm:block"></div>
              <span className="text-neutral-5">Match: 85%</span>
            </div>
            <Button variant="outline" size="sm" className="gap-2 whitespace-nowrap">
              <Filter className="w-4 h-4" />
              Advanced
            </Button>
          </div>
        </div>

        {/* Tabs and Filters */}
        <div className="space-y-4 md:space-y-6">
          {/* Tabs */}
          <div className="flex gap-2 border-b border-neutral-2 overflow-x-auto">
            {[
              { id: 'all', label: 'All Investors' },
              { id: 'matched', label: 'Matched' },
              { id: 'interested', label: 'Interested' },
              { id: 'recent', label: 'Recent' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`px-3 md:px-4 py-3 text-xs md:text-sm font-medium border-b-2 transition whitespace-nowrap ${
                  selectedTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-neutral-5 hover:text-neutral-1'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            {FILTER_BUTTONS.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setSelectedFilter(filter.id)}
                className={`px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition whitespace-nowrap ${
                  selectedFilter === filter.id
                    ? 'bg-primary text-white'
                    : 'bg-white border-2 border-neutral-2 text-neutral-1 hover:border-primary/50'
                }`}
              >
                {filter.label}
                <span className="ml-1.5 text-xs opacity-75">({filter.count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Investor Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {INVESTOR_CARDS.map((investor) => (
            <div
              key={investor.id}
              className="bg-white border-2 border-neutral-2 rounded-xl p-4 sm:p-6 space-y-4 hover:border-primary/50 transition flex flex-col"
            >
              {/* Header */}
              <div className="flex items-start justify-between pb-4 border-b border-neutral-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base md:text-lg font-bold text-neutral-1 truncate">
                    {investor.name}
                  </h3>
                  <p className="text-xs md:text-sm text-neutral-5 mt-0.5">{investor.type}</p>
                </div>
                <div className="text-right ml-2 flex-shrink-0">
                  <div className="text-2xl md:text-3xl font-bold text-primary">{investor.matchScore}</div>
                  <p className="text-xs text-neutral-5 mt-0.5">Match</p>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-3 flex-1">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-5 mb-1">
                    Investment
                  </p>
                  <p className="text-xs md:text-sm font-semibold text-neutral-1">{investor.investmentRange}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-5 mb-1.5">
                    Focus Areas
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {investor.sectors.slice(0, 2).map((sector) => (
                      <span
                        key={sector}
                        className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium"
                      >
                        {sector}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-5 mb-1">
                    Stages
                  </p>
                  <p className="text-xs md:text-sm text-neutral-1">{investor.stage}</p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-neutral-2">
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    investor.status === 'Interested'
                      ? 'bg-green-100 text-green-700'
                      : investor.status === 'Reviewing'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {investor.status}
                </span>
                <Button size="sm" variant="outline" className="gap-2">
                  <MessageCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Message</span>
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Load More */}
        <div className="flex justify-center pt-4 md:pt-8">
          <Button variant="outline" size="lg" className="gap-2">
            Load More Investors
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
