'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { UserCheck, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { creatorProfileApi } from '@/lib/api-creator-profile';

interface HumainXDashboardCardProps {
  ideaId?: string | null;
}

export function HumainXDashboardCard({ ideaId }: HumainXDashboardCardProps) {
  const { data: completeness, isLoading } = useQuery({
    queryKey: ['creator', 'profile-completeness'],
    queryFn: () => creatorProfileApi.getCompleteness(),
    staleTime: 30000,
  });

  const completion = completeness?.profileCompletion ?? 0;
  const isComplete = completion === 100;
  const isStarted = completion > 0;

  const queryParams = new URLSearchParams();
  if (isComplete) queryParams.set('mode', 'view');
  if (ideaId) queryParams.set('ideaId', ideaId);
  const queryString = queryParams.toString();
  const ctaHref = `/dashboard/creator/profile${queryString ? `?${queryString}` : ''}`;

  const ctaLabel = isComplete
    ? 'View My Profile'
    : isStarted
      ? 'Continue My Profile'
      : 'Build My Profile';

  return (
    <Card className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-card via-card to-primary/[0.03] p-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              PERSONALIZE YOUR JOURNEY
            </span>
            {isComplete && (
              <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-xs font-semibold px-2 py-0.5">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Phase 4 Ready
              </Badge>
            )}
          </div>
          <h2 className="font-heading text-lg sm:text-xl font-bold text-foreground">
            Build your professional profile
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Help MBC understand your experience, skills and availability so your roadmap, training and recommendations can be personalized.
          </p>

          <div className="pt-2 space-y-1.5 max-w-md">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-foreground">Builder Profile</span>
              <span className="font-mono font-semibold text-primary">
                {isLoading ? '...' : `${completion}% complete`}
              </span>
            </div>
            <Progress value={completion} className="h-2 rounded-full bg-secondary" />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <Button
            asChild
            className="rounded-xl bg-primary text-primary-foreground font-semibold text-xs px-5 h-10 shadow-sm hover:bg-primary/90 transition-colors"
          >
            <Link href={ctaHref}>
              <UserCheck className="w-4 h-4 mr-2" />
              {ctaLabel}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
