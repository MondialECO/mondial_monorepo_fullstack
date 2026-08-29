'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  CheckCircle2,
  ExternalLink,
  Layers,
  Loader2,
  Radio,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { useEntrepreneurProgress } from '@/providers/EntrepreneurProgressProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getPhaseConfig } from '@/lib/entrepreneur';
import { PhaseNumber } from '@/types/entrepreneur';

export default function MyCompaniesPage() {
  const router = useRouter();
  const {
    companies,
    activeCompanyId,
    switchCompany,
    isSwitching,
    isLoading,
    refreshCompanies,
  } = useEntrepreneurProgress();
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  const handleSetActive = async (companyId: string) => {
    setSwitchingId(companyId);
    try {
      const success = await switchCompany(companyId);
      if (success) {
        await refreshCompanies();
      }
    } finally {
      setSwitchingId(null);
    }
  };

  const handleOpenCompany = async (companyId: string, currentPhase: number) => {
    if (companyId !== activeCompanyId) {
      setSwitchingId(companyId);
      const success = await switchCompany(companyId);
      setSwitchingId(null);
      if (!success) return;
    }
    const safePhase = Math.min(10, Math.max(1, currentPhase)) as PhaseNumber;
    const config = getPhaseConfig(safePhase);
    router.push(
      `/dashboard/entrepreneur/phase-${safePhase}${config.hasSteps ? '/step-1' : ''}`
    );
  };

  if (isLoading && (!companies || companies.length === 0)) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <div className="space-y-2">
          <div className="h-8 w-48 rounded bg-muted animate-pulse" />
          <div className="h-4 w-96 rounded bg-muted/60 animate-pulse" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-48 rounded-xl border border-border/60 bg-card p-6 animate-pulse" />
          <div className="h-48 rounded-xl border border-border/60 bg-card p-6 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            My Companies
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your operating companies and switch your active context across the Entrepreneur dashboard.
          </p>
        </div>
      </div>

      {/* Companies List */}
      {!companies || companies.length === 0 ? (
        <Card className="border-border/60 bg-card/60">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-primary/10 p-4 text-primary mb-4">
              <Building2 className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">No Companies Found</h3>
            <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
              You do not have any registered companies yet. Level up an idea from the Creator studio to create your first company.
            </p>
            <Button asChild className="mt-6">
              <Link href="/dashboard/creator/myideas">
                Go to Creator Studio
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {companies.map((company) => {
            const isActive = company.id === activeCompanyId || company.isActive;
            const isCurrentlySwitching = switchingId === company.id;

            return (
              <Card
                key={company.id}
                className={cn(
                  'relative transition-all duration-200 border overflow-hidden',
                  isActive
                    ? 'border-primary shadow-sm ring-1 ring-primary/20 bg-card'
                    : 'border-border/80 bg-card hover:border-border hover:shadow-sm'
                )}
              >
                {isActive && (
                  <div className="absolute top-0 right-0 left-0 h-1 bg-primary" />
                )}

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-bold text-sm',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {company.companyName?.charAt(0).toUpperCase() || 'C'}
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold text-foreground">
                          {company.companyName || 'Unnamed Company'}
                        </CardTitle>
                        {company.legalName && company.legalName !== company.companyName ? (
                          <p className="text-xs text-muted-foreground">
                            {company.legalName}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    {isActive ? (
                      <Badge className="bg-primary text-primary-foreground font-semibold flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Active Context
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground font-normal">
                        Inactive
                      </Badge>
                    )}
                  </div>

                  {company.tagline && (
                    <CardDescription className="pt-2 text-xs italic text-muted-foreground line-clamp-2">
                      &ldquo;{company.tagline}&rdquo;
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent className="space-y-4 pt-1">
                  {/* Meta Details */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-muted/30 p-3 rounded-lg border border-border/40">
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Industry</span>
                      <span className="font-medium text-foreground">
                        {company.industry || 'Not specified'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Legal Structure</span>
                      <span className="font-medium text-foreground">
                        {company.legalStructure || 'Not formed'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Current Phase</span>
                      <span className="font-medium text-primary">
                        Phase {company.currentPhase}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Investor Readiness</span>
                      <span className="font-medium text-foreground flex items-center gap-1">
                        {company.isInvestorReady ? (
                          <span className="text-success-text inline-flex items-center gap-1">
                            <ShieldCheck className="h-3.5 w-3.5" /> Ready
                          </span>
                        ) : (
                          <span className="text-muted-foreground">In Progress</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
                    {!isActive ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isSwitching}
                        onClick={() => handleSetActive(company.id)}
                        className="text-xs h-8"
                      >
                        {isCurrentlySwitching ? (
                          <>
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            Activating...
                          </>
                        ) : (
                          <>
                            <Radio className="mr-1.5 h-3.5 w-3.5" />
                            Set Active
                          </>
                        )}
                      </Button>
                    ) : null}

                    <Button
                      size="sm"
                      disabled={isSwitching}
                      onClick={() => handleOpenCompany(company.id, company.currentPhase)}
                      className="text-xs h-8"
                    >
                      <span>Open Dashboard</span>
                      <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
