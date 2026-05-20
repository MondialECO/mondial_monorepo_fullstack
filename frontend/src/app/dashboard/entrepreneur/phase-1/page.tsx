'use client';

import Link from 'next/link';
import {
  CheckCircle2,
  FileText,
  ArrowRight,
  Shield,
  Zap,
  Lock,
  Users,
  TrendingUp,
  Clock,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEntrepreneurDashboard } from '@/hooks/useEntrepreneurDashboard';
import { RouteGuard } from '@/components/entrepreneur/RouteGuard';

function Phase1PageContent() {
  const { phaseProgress, isPhaseLoading, phaseError } = useEntrepreneurDashboard();

  if (isPhaseLoading) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-neutral-5">Loading your progress...</p>
        </div>
      </div>
    );
  }

  if (phaseError) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <div className="max-w-md">
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <h3 className="font-bold text-red-900">Error Loading Progress</h3>
            </div>
            <p className="text-red-800 text-sm mb-4">{phaseError}</p>
            <Button className="w-full" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!phaseProgress) return null;

  const { overallProgressPercent, trustScore, currentPhase } = phaseProgress;

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Header */}
      <header className="bg-white border-b border-neutral-2 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 h-16 md:h-20 flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-neutral-1">Identity & Onboarding</h1>
            <p className="text-sm text-neutral-5 mt-0.5">KYC verified, Tier 2 access unlocked</p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8 space-y-8">
        {/* Success Banner */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-green-900 mb-2">Identity Verified</h2>
              <p className="text-green-800 mb-4">
                Your personal identity has been successfully verified. You now have full access to the Mondial.eco platform and can begin your fundraising journey.
              </p>
              <div className="flex items-center gap-6 text-sm">
                <div>
                  <p className="text-xs text-green-700 font-semibold uppercase tracking-wide mb-1">
                    Verification Date
                  </p>
                  <p className="font-semibold text-green-900">{new Date().toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-green-700 font-semibold uppercase tracking-wide mb-1">
                    Access Level
                  </p>
                  <p className="font-semibold text-green-900">Tier 2 - Full Access</p>
                </div>
                <div>
                  <p className="text-xs text-green-700 font-semibold uppercase tracking-wide mb-1">
                    Trust Score
                  </p>
                  <p className="font-semibold text-green-900">+44 points</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Score Card */}
        <div className="bg-white border-2 border-neutral-2 rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-neutral-1 flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Trust Score Progress
            </h3>
            <div className="text-right">
              <p className="text-3xl font-bold text-primary">{trustScore}</p>
              <p className="text-xs text-neutral-5">/ 100</p>
            </div>
          </div>

          <div className="w-full h-4 bg-neutral-100 rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full"
              style={{ width: `${trustScore}%` }}
            />
          </div>

          <p className="text-sm text-neutral-5">
            Your trust score increases with each completed phase. Higher scores unlock better investor matches and lower platform fees.
          </p>
        </div>

        {/* Verification Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Verification Status */}
          <div className="bg-white border-2 border-neutral-2 rounded-xl p-6">
            <h3 className="text-lg font-bold text-neutral-1 mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Verification Status
            </h3>

            <div className="space-y-3">
              {[
                { label: 'Legal Name', status: 'verified' },
                { label: 'Email Address', status: 'verified' },
                { label: 'Phone Number', status: 'verified' },
                { label: 'Government ID', status: 'verified' },
                { label: 'Address Verification', status: 'verified' },
                { label: 'KYC Check', status: 'verified' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <span className="font-medium text-neutral-1">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">Verified</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-900">
                <span className="font-semibold">All checks passed.</span> Your identity is secure and verified across all required metrics.
              </p>
            </div>
          </div>

          {/* Access & Permissions */}
          <div className="bg-white border-2 border-neutral-2 rounded-xl p-6">
            <h3 className="text-lg font-bold text-neutral-1 mb-6 flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              Access & Permissions
            </h3>

            <div className="space-y-4">
              {[
                {
                  title: 'Platform Access',
                  description: 'Full access to all Mondial.eco features',
                  icon: Users,
                },
                {
                  title: 'Company Setup',
                  description: 'Create and verify company profile',
                  icon: FileText,
                },
                {
                  title: 'Investor Matching',
                  description: 'Access to AI-powered investor discovery',
                  icon: TrendingUp,
                },
                {
                  title: 'Data Room',
                  description: 'Secure document vault for due diligence',
                  icon: Lock,
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-neutral-1">{item.title}</p>
                      <p className="text-xs text-neutral-5 mt-1">{item.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 9-Phase Journey Overview */}
        <div className="bg-white border-2 border-neutral-2 rounded-xl p-6">
          <h3 className="text-lg font-bold text-neutral-1 mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Your 9-Phase Journey
          </h3>

          <div className="space-y-3">
            {[
              { phase: '1', title: 'Identity & Onboarding', status: 'completed', color: 'bg-green-100 text-green-700' },
              { phase: '2', title: 'Company Verification', status: 'available', color: 'bg-primary/10 text-primary' },
              { phase: '3', title: 'Financial Valuation & KPI', status: 'available', color: 'bg-primary/10 text-primary' },
              { phase: '4', title: 'Equity Structure & Ownership', status: 'locked', color: 'bg-neutral-100 text-neutral-4' },
              { phase: '5', title: 'Needs & Funding Analysis', status: 'locked', color: 'bg-neutral-100 text-neutral-4' },
              { phase: '6', title: 'Data Room', status: 'locked', color: 'bg-neutral-100 text-neutral-4' },
              { phase: '7', title: 'AI Expert Review', status: 'locked', color: 'bg-neutral-100 text-neutral-4' },
              { phase: '8', title: 'Investor Matching', status: 'locked', color: 'bg-neutral-100 text-neutral-4' },
              { phase: '9', title: 'Deal Execution', status: 'locked', color: 'bg-neutral-100 text-neutral-4' },
            ].map((item) => (
              <div
                key={item.phase}
                className={`flex items-center gap-4 p-4 rounded-lg border-2 transition ${
                  item.status === 'completed'
                    ? 'border-green-200 bg-green-50'
                    : item.status === 'available'
                    ? 'border-primary/20 bg-primary/5'
                    : 'border-neutral-200 bg-neutral-50'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${item.color}`}>
                  {item.status === 'completed' ? <CheckCircle2 className="w-6 h-6" /> : item.phase}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-neutral-1">{item.title}</p>
                  <p className="text-xs text-neutral-5 mt-0.5">
                    {item.status === 'completed' && 'Completed'}
                    {item.status === 'available' && 'Ready to start'}
                    {item.status === 'locked' && 'Locked - Complete previous phases'}
                  </p>
                </div>
                <span className="text-xs font-semibold uppercase tracking-wide text-neutral-5">
                  Phase {item.phase}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <span className="font-semibold">💡 Next Step:</span> Proceed to Phase 2 to verify your company information and unlock the full verification badge.
            </p>
          </div>
        </div>

        {/* Key Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Time on Platform', value: 'Today', icon: Clock },
            { label: 'Account Status', value: 'Verified', icon: CheckCircle2 },
            { label: 'Access Tier', value: 'Tier 2', icon: Shield },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-white border-2 border-neutral-2 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4 text-primary" />
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-5">{stat.label}</p>
                </div>
                <p className="text-lg font-bold text-neutral-1">{stat.value}</p>
              </div>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="flex gap-3 flex-col sm:flex-row">
          <Button variant="outline" asChild className="flex-1 h-12">
            <Link href="/dashboard/entrepreneur">Back to Overview</Link>
          </Button>
          <Button asChild className="flex-1 h-12 gap-2">
            <Link href="/dashboard/entrepreneur/phase-2">
              Continue to Phase 2
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Phase1Page() {
  return (
    <RouteGuard requiredPhase={1}>
      <Phase1PageContent />
    </RouteGuard>
  );
}
