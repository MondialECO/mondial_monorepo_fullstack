'use client';

import Link from 'next/link';
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Briefcase,
  CheckCircle2,
  Clock,
  FileText,
  FolderOpen,
  Handshake,
  Lock,
  PieChart,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { useEntrepreneurProgress } from '@/hooks/useEntrepreneurProgress';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

type PhaseItem = {
  phase: number;
  title: string;
  description: string;
  icon: typeof FileText;
  trustScore: number;
  href: string;
  hasSteps?: boolean;
};

const phases: PhaseItem[] = [
  {
    phase: 1,
    title: 'Identity and Onboarding',
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
    title: 'Financial Valuation and KPI',
    description: 'Valuation EUR 3.78M, KPI baseline',
    icon: BarChart3,
    trustScore: 22,
    href: '/dashboard/entrepreneur/phase-3',
    hasSteps: true,
  },
  {
    phase: 4,
    title: 'Equity Structure and Ownership',
    description: 'Cap table, ESOP, dilution simulation',
    icon: PieChart,
    trustScore: 12,
    href: '/dashboard/entrepreneur/phase-4',
  },
  {
    phase: 5,
    title: 'Needs and Funding Analysis',
    description: 'Funding ask EUR 450K live',
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
    description: 'Investor-ready badge',
    icon: Zap,
    trustScore: 5,
    href: '/dashboard/entrepreneur/phase-7',
  },
  {
    phase: 8,
    title: 'Investor Matching',
    description: 'AI matches and handshakes',
    icon: Handshake,
    trustScore: 5,
    href: '/dashboard/entrepreneur/phase-8',
  },
  {
    phase: 9,
    title: 'Deal Execution',
    description: 'Term sheets and close',
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
}

function PhaseCard({
  phase,
  title,
  description,
  icon: Icon,
  trustScore,
  href,
  isCompleted,
  isActive,
  isLocked,
}: PhaseCardProps) {
  return (
    <Link href={isLocked ? '#' : href} aria-disabled={isLocked}>
      <Card
        className={cn(
          'h-full border transition-all',
          isLocked
            ? 'bg-muted/40 opacity-70 cursor-not-allowed'
            : 'hover:border-primary/40 hover:shadow-md cursor-pointer',
          isActive && 'border-primary/40'
        )}
      >
        <CardHeader className="gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'rounded-lg p-2.5',
                  isCompleted && 'bg-green-100',
                  isActive && 'bg-primary/10',
                  isLocked && 'bg-muted'
                )}
              >
                <Icon
                  className={cn(
                    'h-5 w-5',
                    isCompleted && 'text-green-600',
                    isActive && 'text-primary',
                    isLocked && 'text-muted-foreground'
                  )}
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-foreground">Phase {phase}</p>
                  {isCompleted && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                  {isActive && <Clock className="h-4 w-4 text-primary" />}
                  {isLocked && <Lock className="h-4 w-4 text-muted-foreground" />}
                </div>
                <p className="text-sm text-muted-foreground">{title}</p>
              </div>
            </div>
            {!isLocked && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
          </div>
          <CardDescription className="text-sm">{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between border-t pt-4">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">Trust score</span>
          <span className="text-sm font-semibold text-primary">
            {trustScore > 0 ? `+${trustScore}` : 'Finalize'}
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function EntrepreneurOverview() {
  const { progress, trustScore } = useEntrepreneurProgress();

  if (!progress) return null;

  const completedPhases = progress.completedPhases.size;
  const overallProgress = Math.round((completedPhases / 9) * 100);
  const activePhase = phases.find((phase) => phase.phase === progress.currentPhase) ?? phases[0];

  const primaryActionHref = activePhase.hasSteps
    ? `/dashboard/entrepreneur/phase-${progress.currentPhase}/step-${progress.currentStep}`
    : activePhase.href;

  const nextPhase = phases.find((phase) => phase.phase === progress.currentPhase + 1);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-8">
      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-2">
              <Badge variant="secondary" className="w-fit">
                Entrepreneur Journey
              </Badge>
              <CardTitle className="text-4xl">Build investor trust step by step</CardTitle>
              <CardDescription className="text-base">
                You are in Phase {progress.currentPhase}. Follow the recommended next action to avoid getting blocked.
              </CardDescription>
            </div>
            <div className="rounded-xl border bg-background px-5 py-4 text-right">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Trust score</p>
              <p className="text-3xl font-bold text-primary">{trustScore}/100</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Overall progress</span>
              <span className="font-semibold text-foreground">{completedPhases} of 9 phases complete</span>
            </div>
            <Progress value={overallProgress} className="h-3" />
            <p className="text-xs text-muted-foreground">{overallProgress}% complete</p>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="gap-2">
          <CardTitle className="text-xl">Recommended next action</CardTitle>
          <CardDescription>
            Current step: Phase {progress.currentPhase}
            {activePhase.hasSteps ? `, Step ${progress.currentStep}` : ''}.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <Button asChild className="h-11 justify-between">
            <Link href={primaryActionHref}>
              Continue {activePhase.title}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          {nextPhase ? (
            <Button asChild variant="outline" className="h-11 justify-between">
              <Link href={nextPhase.href}>
                Preview Phase {nextPhase.phase}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button variant="outline" className="h-11 justify-between" disabled>
              Final phase reached
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {phases.map((phaseData) => (
          <PhaseCard
            key={phaseData.phase}
            {...phaseData}
            isCompleted={progress.completedPhases.has(phaseData.phase as never)}
            isActive={progress.currentPhase === phaseData.phase}
            isLocked={
              !progress.completedPhases.has(phaseData.phase as never) &&
              progress.currentPhase !== phaseData.phase
            }
          />
        ))}
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="flex flex-row items-start gap-3 space-y-0">
          <AlertCircle className="mt-1 h-5 w-5 text-primary" />
          <div>
            <CardTitle className="text-lg">How this journey works</CardTitle>
            <CardDescription className="mt-1 text-sm leading-6 text-foreground/80">
              Complete verification first (Phases 1-2), then unlock core business and funding work (Phases 3-6).
              Final phases focus on investor matching and deal execution. Each completed phase raises trust score.
            </CardDescription>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}
