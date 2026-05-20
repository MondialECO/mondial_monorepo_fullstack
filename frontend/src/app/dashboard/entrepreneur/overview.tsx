'use client';

import Link from 'next/link';
import {
  CheckCircle2,
  Clock,
  Lock,
  FileText,
  BarChart3,
  PieChart,
  Briefcase,
  FolderOpen,
  Zap,
  Users,
  Handshake,
  TrendingUp,
  ArrowRight,
  Brain,
  AlertCircle,
  MoreVertical,
} from 'lucide-react';
import { useEntrepreneurProgress } from '@/hooks/useEntrepreneurProgress';
import { cn } from '@/lib/utils';

const phases = [
  {
    phase: 1,
    title: 'Identity & Onboarding',
    description: 'KYC verified, Tier 2 access',
    icon: FileText,
    trustScore: 44,
    href: '/dashboard/entrepreneur/phase-1',
  },
  {
    phase: 2,
    title: 'Company Verification',
    description: 'Verified Company badge',
    icon: Briefcase,
    trustScore: 18,
    href: '/dashboard/entrepreneur/phase-2',
    hasSteps: true,
  },
  {
    phase: 3,
    title: 'Financial Valuation & KPI',
    description: 'Valuation €3.78M, KPI baseline',
    icon: BarChart3,
    trustScore: 22,
    href: '/dashboard/entrepreneur/phase-3',
  },
  {
    phase: 4,
    title: 'Equity Structure & Ownership',
    description: 'Cap table, ESOP, Dilution sim',
    icon: PieChart,
    trustScore: 12,
    href: '/dashboard/entrepreneur/phase-4',
  },
  {
    phase: 5,
    title: 'Needs & Funding Analysis',
    description: 'Funding ask €450K live',
    icon: TrendingUp,
    trustScore: 8,
    href: '/dashboard/entrepreneur/phase-5',
  },
  {
    phase: 6,
    title: 'Data Room',
    description: 'Secure document vault',
    icon: FolderOpen,
    trustScore: 3,
    href: '/dashboard/entrepreneur/phase-6',
  },
  {
    phase: 7,
    title: 'AI Expert Review',
    description: 'Investor-Ready Badge',
    icon: Zap,
    trustScore: 5,
    href: '/dashboard/entrepreneur/phase-7',
  },
  {
    phase: 8,
    title: 'Investor Matching',
    description: 'AI matches, handshakes',
    icon: Handshake,
    trustScore: 5,
    href: '/dashboard/entrepreneur/phase-8',
  },
  {
    phase: 9,
    title: 'Deal Execution',
    description: 'Term sheets, round close',
    icon: Users,
    trustScore: 0,
    href: '/dashboard/entrepreneur/phase-9',
  },
];

interface PhaseCardProps {
  phase: number;
  title: string;
  description: string;
  icon: typeof FileText;
  trustScore: number;
  href: string;
  hasSteps?: boolean;
  isCompleted: boolean;
  isActive: boolean;
  isLocked: boolean;
  progress?: number;
}

function PhaseCard({
  phase,
  title,
  description,
  icon: Icon,
  trustScore,
  href,
  hasSteps,
  isCompleted,
  isActive,
  isLocked,
  progress = 0,
}: PhaseCardProps) {
  return (
    <Link href={isLocked ? '#' : href}>
      <div
        className={cn(
          'border-2 rounded-2xl p-6 transition-all h-full',
          isLocked
            ? 'bg-neutral-100 border-neutral-2 opacity-50 cursor-not-allowed'
            : 'bg-neutral-3 border-neutral-4 hover:border-primary hover:shadow-md cursor-pointer'
        )}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'p-2 rounded-lg',
                isCompleted && 'bg-green-100',
                isActive && 'bg-primary/10',
                isLocked && 'bg-neutral-2'
              )}
            >
              <Icon
                className={cn(
                  'w-6 h-6',
                  isCompleted && 'text-green-600',
                  isActive && 'text-primary',
                  isLocked && 'text-neutral-4'
                )}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-neutral-1">Phase {phase}</h3>
                {isCompleted && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                {isActive && <Clock className="w-5 h-5 text-primary animate-pulse" />}
                {isLocked && <Lock className="w-5 h-5 text-neutral-2" />}
              </div>
              <p className="text-sm text-neutral-5">{title}</p>
            </div>
          </div>
          {!isLocked && <ArrowRight className="w-5 h-5 text-neutral-5" />}
        </div>

        <p className="text-sm text-neutral-5 mb-4">{description}</p>

        {hasSteps && progress > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-neutral-5">Progress</span>
              <span className="font-semibold text-primary">{progress}%</span>
            </div>
            <div className="w-full h-2 bg-neutral-2 rounded-full overflow-hidden shadow-sm">
              <div
                className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-neutral-2">
          <span className="text-xs text-neutral-5 font-medium">TRUST SCORE</span>
          <span className="text-sm font-semibold text-primary">
            {trustScore > 0 ? `+${trustScore}` : 'Finalize'}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function EntrepreneurOverview() {
  const { progress, trustScore } = useEntrepreneurProgress();

  if (!progress) return null;

  const completedPhases = progress.completedPhases.size;
  const overallProgress = (completedPhases / 9) * 100;

  return (
    <div className="min-h-screen bg-neutral-100">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Header Section */}
        <div className="space-y-4">
          <div>
            <h1 className="text-4xl font-bold text-neutral-1 mb-2">
              Entrepreneur Journey
            </h1>
            <p className="text-lg text-neutral-5">
              9 phases to unlock your full potential and secure funding
            </p>
          </div>

          {/* Progress Card */}
          <div className="bg-neutral-3 border-2 border-neutral-4 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm text-neutral-5 font-medium mb-1">OVERALL PROGRESS</p>
                <p className="text-3xl font-bold text-neutral-1">
                  {completedPhases} of 9 Phases
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-neutral-5 font-medium mb-1">TRUST SCORE</p>
                <p className="text-3xl font-bold text-primary">{trustScore}/100</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="w-full h-4 bg-neutral-2 rounded-full overflow-hidden shadow-sm">
                <div
                  className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
              <p className="text-xs text-neutral-5 text-right">{Math.round(overallProgress)}% complete</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-4">
          <Link href="/dashboard/entrepreneur/phase-2">
            <button className="w-full h-12 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition flex items-center justify-center gap-2">
              <ArrowRight className="w-4 h-4" />
              Continue Phase 2: Company Verification
            </button>
          </Link>
          <Link href="/dashboard/entrepreneur/phase-2/step-1">
            <button className="w-full h-12 bg-neutral-4 border border-neutral-2 rounded-lg font-medium hover:bg-neutral-3 transition">
              View Current Step
            </button>
          </Link>
        </div>

        {/* Phase Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {phases.map((phaseData) => (
            <PhaseCard
              key={phaseData.phase}
              {...phaseData}
              isCompleted={progress.completedPhases.has(phaseData.phase as any)}
              isActive={progress.currentPhase === phaseData.phase}
              isLocked={
                !progress.completedPhases.has(phaseData.phase as any) &&
                progress.currentPhase !== phaseData.phase
              }
            />
          ))}
        </div>

        {/* Information Banner */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 flex gap-4">
          <div className="text-blue-600 flex-shrink-0 mt-1">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">How the Entrepreneur Journey Works</h3>
            <p className="text-sm text-blue-800">
              Each phase builds on the previous one. Complete all verification steps
              (Phases 1-2) to unlock business setup (Phases 3-5). Once you have a
              verified company and funding ask, investor matching (Phase 8) becomes
              available. Each phase increases your Trust Score, which builds investor
              confidence.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
