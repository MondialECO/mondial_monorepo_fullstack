import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShieldAlert,
  Loader2,
  Lock,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCreatorProgress } from '@/providers/CreatorProgressProvider';
import { creatorProfileApi } from '@/lib/api-creator-profile';

interface Phase4ProfileGuardProps {
  children: React.ReactNode;
}

const CHECKLIST_DEFINITIONS = [
  { key: 'Skills', label: 'Skills' },
  { key: 'CurrentSituation', label: 'Current situation' },
  { key: 'WeeklyAvailability', label: 'Weekly availability' },
  { key: 'Region', label: 'Region' },
  { key: 'ProgressPreference', label: 'Progress preference (learning or delegation)' },
] as const;

export function Phase4ProfileGuard({ children }: Phase4ProfileGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { state, isLoading: journeyLoading } = useCreatorProgress();
  const activeIdeaId = searchParams.get('ideaId') || state.activeIdeaId;

  const { data: completeness, isLoading: completenessLoading, refetch } = useQuery({
    queryKey: ['creator', 'profile-completeness'],
    queryFn: () => creatorProfileApi.getCompleteness(),
    staleTime: 5000,
  });

  const isLoading = journeyLoading || completenessLoading;

  // Gate 1: Phase 3 completion
  const isPhase3Done = state.journeyState.phase3.status === 'completed';

  // Gate 2: Core HumainX profile readiness for Phase 4 (Skills, Situation, Availability, Region, Preferences)
  const isProfileReady = completeness?.phase4Ready ?? false;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64 rounded-xl" />
        <Skeleton className="h-4 w-96 rounded-lg" />
        <div className="grid gap-4 sm:grid-cols-2 pt-4">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      </div>
    );
  }

  // Gate 1: Phase 3 completion
  if (!isPhase3Done) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4">
        <Card className="rounded-3xl border border-warning/30 bg-card p-8 text-center space-y-6 shadow-sm">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-warning/10 flex items-center justify-center text-warning">
            <Lock className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold font-heading text-foreground">
              Phase 3 Must Be Completed First
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              Complete your business intelligence, market study, and forecasts in Phase 3 before configuring Phase 4 offer pricing.
            </p>
          </div>
          <Button asChild className="rounded-xl font-semibold px-6">
            <Link href={`/dashboard/creator/phase-3${activeIdeaId ? `?ideaId=${encodeURIComponent(activeIdeaId)}` : ''}`}>
              Return to Phase 3
            </Link>
          </Button>
        </Card>
      </div>
    );
  }

  // Gate 2: HumainX Profile Completeness Gate
  if (!isProfileReady) {
    const missingKeys = completeness?.missingForPhase4 ?? [];
    const returnTo = pathname;
    const profileUrl = `/dashboard/creator/profile?returnTo=${encodeURIComponent(returnTo)}${
      activeIdeaId ? `&ideaId=${encodeURIComponent(activeIdeaId)}` : ''
    }`;

    return (
      <div className="max-w-3xl mx-auto py-12 px-4 font-sans">
        <Card className="rounded-3xl border border-primary/20 bg-gradient-to-br from-card via-card to-primary/[0.02] p-8 sm:p-10 space-y-8 shadow-sm">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                PHASE 4 PERSONALIZATION GATE
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-foreground tracking-tight">
              Personalize your construction plan
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              We already understand your business. Now we need a little more information about you so MBC can build a realistic roadmap, training plan and resource strategy.
            </p>
          </div>

          {/* Missing items checklist */}
          <div className="space-y-3 rounded-2xl border border-border bg-background/50 p-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Required Profile Information
            </h3>
            <ul className="space-y-2.5 pt-1">
              {CHECKLIST_DEFINITIONS.map((item) => {
                const isMissing = missingKeys.includes(item.key);
                return (
                  <li
                    key={item.key}
                    className={`flex items-center gap-3 text-sm font-medium ${
                      isMissing ? 'text-destructive font-semibold' : 'text-foreground'
                    }`}
                  >
                    {isMissing ? (
                      <XCircle className="h-5 w-5 text-destructive shrink-0" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5 text-success-text shrink-0" />
                    )}
                    <span>{item.label}</span>
                    {isMissing && (
                      <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full font-bold ml-auto">
                        Missing
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <Button
              asChild
              className="w-full sm:w-auto rounded-xl bg-primary text-primary-foreground font-semibold px-6 h-11 shadow-sm hover:bg-primary/90"
            >
              <Link href={profileUrl}>
                Complete My Profile
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button
              variant="outline"
              onClick={() => void refetch()}
              className="w-full sm:w-auto rounded-xl border-border"
            >
              Recheck Profile Status
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Passed all gates: render Phase 4 children
  return <>{children}</>;
}
