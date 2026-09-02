'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  DollarSign,
  Briefcase,
  Gavel,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Receipt,
  Wallet
} from 'lucide-react';
import { fetchCommerceMetrics } from '@/lib/api-admin-commerce';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  AdminPageHeader,
  AdminStatCard,
  AdminErrorState,
} from '@/components/admin/shared';

export default function AdminCommerceOverviewPage() {
  const { data: metrics, isLoading, error } = useQuery({
    queryKey: ['admin-commerce-metrics'],
    queryFn: fetchCommerceMetrics,
    staleTime: 30_000,
  });

  const formatCurrency = (val: number, cur = 'EUR') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: cur,
      maximumFractionDigits: 2,
    }).format(val || 0);
  };

  return (
    <div className="space-y-8 p-4 sm:p-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <AdminPageHeader
        icon={DollarSign}
        title="Commerce & Financial Operations"
        description="Real-time platform commerce health, workroom engagement governance, dispute triage, and payout processing."
      />

      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <AdminStatCard label="Total Escrow Held" value="..." loading variant="amber" />
          <AdminStatCard label="Platform Revenue" value="..." loading variant="green" />
          <AdminStatCard label="Active Disputes" value="..." loading variant="red" />
          <AdminStatCard label="Pending Payouts" value="..." loading variant="blue" />
        </div>
      ) : error ? (
        <AdminErrorState
          title="Failed to load commerce operations metrics"
          message={error instanceof Error ? error.message : 'Unknown network error occurred.'}
        />
      ) : (
        <>
          {/* Key Financial & Operations Metrics Cards */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <AdminStatCard
              label="Total Escrow Held"
              value={formatCurrency(metrics?.totalEscrowHeld ?? 0, metrics?.currency)}
              icon={Clock}
              variant="amber"
              subtitle={`${metrics?.activeEscrowContractsCount ?? metrics?.activeEngagements ?? 0} active contracts`}
            />

            <AdminStatCard
              label="Platform Revenue"
              value={formatCurrency(metrics?.totalPlatformRevenue ?? 0, metrics?.currency)}
              icon={DollarSign}
              variant="green"
              subtitle={
                <span>
                  All-time GMV: <span>{formatCurrency(metrics?.allTimeGMV ?? 0, metrics?.currency)}</span>
                </span>
              }
            />

            <AdminStatCard
              label="Active Disputes"
              value={metrics?.openDisputesCount ?? metrics?.openDisputes ?? 0}
              icon={Gavel}
              variant={Number(metrics?.openDisputesCount ?? metrics?.openDisputes ?? 0) > 0 ? "red" : "gray"}
              subtitle={Number(metrics?.openDisputesCount ?? metrics?.openDisputes ?? 0) > 0 ? "Requires admin mediation" : "No open disputes"}
            />

            <AdminStatCard
              label="Pending Payouts"
              value={formatCurrency(metrics?.pendingPayoutsAmount ?? 0, metrics?.currency)}
              icon={Wallet}
              variant="blue"
              subtitle={`${metrics?.pendingPayoutsCount ?? 0} withdrawal requests`}
            />
          </div>

          {/* Operational Directory Navigation Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Workroom Engagements */}
            <Card className="border-border/60 hover:border-primary/40 transition-all shadow-sm flex flex-col justify-between bg-card">
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="rounded-xl bg-blue-500/10 p-2.5 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    <Briefcase className="size-5" />
                  </div>
                  <span className="rounded-md bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
                    {metrics?.activeEngagements ?? 0} Active
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-foreground font-syne">Workroom Engagements</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Monitor deliverables, milestone progression, and active client-creator contracts.
                  </p>
                </div>
              </div>
              <div className="border-t border-border/40 p-4 bg-muted/20">
                <Button asChild variant="outline" size="sm" className="w-full justify-between text-xs bg-background">
                  <Link href="/dashboard/admin/engagements">
                    Inspect Engagements <ChevronRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </Card>

            {/* Disputes Hub */}
            <Card className="border-border/60 hover:border-primary/40 transition-all shadow-sm flex flex-col justify-between bg-card">
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="rounded-xl bg-rose-500/10 p-2.5 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                    <Gavel className="size-5" />
                  </div>
                  <span className="rounded-md bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
                    {metrics?.openDisputesCount ?? metrics?.openDisputes ?? 0} Open
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-foreground font-syne">Disputes Hub</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Investigate contested milestones, examine evidence logs, and execute binding escrow payouts.
                  </p>
                </div>
              </div>
              <div className="border-t border-border/40 p-4 bg-muted/20">
                <Button asChild variant="outline" size="sm" className="w-full justify-between text-xs bg-background">
                  <Link href="/dashboard/admin/disputes">
                    Resolve Disputes <ChevronRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </Card>

            {/* Transactions Ledger */}
            <Card className="border-border/60 hover:border-primary/40 transition-all shadow-sm flex flex-col justify-between bg-card">
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="rounded-xl bg-purple-500/10 p-2.5 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                    <Receipt className="size-5" />
                  </div>
                  <span className="rounded-md bg-purple-500/10 px-2.5 py-0.5 text-xs font-semibold text-purple-600 dark:text-purple-400">
                    Full Ledger
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-foreground font-syne">Financial Transactions</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Audit platform balance transfers, fee deductions, payment processor IDs, and refunds.
                  </p>
                </div>
              </div>
              <div className="border-t border-border/40 p-4 bg-muted/20">
                <Button asChild variant="outline" size="sm" className="w-full justify-between text-xs bg-background">
                  <Link href="/dashboard/admin/transactions">
                    View Ledger <ChevronRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </Card>

            {/* Payouts Processing */}
            <Card className="border-border/60 hover:border-primary/40 transition-all shadow-sm flex flex-col justify-between bg-card">
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    <Wallet className="size-5" />
                  </div>
                  <span className="rounded-md bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                    {metrics?.pendingPayoutsCount ?? 0} Pending
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-foreground font-syne">Payout Requests</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Review and authorize withdrawal requests to external bank accounts and Stripe accounts.
                  </p>
                </div>
              </div>
              <div className="border-t border-border/40 p-4 bg-muted/20">
                <Button asChild variant="outline" size="sm" className="w-full justify-between text-xs bg-background">
                  <Link href="/dashboard/admin/payouts">
                    Process Payouts <ChevronRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </Card>

            {/* Commission & Fee Structure */}
            <Card className="border-border/60 hover:border-primary/40 transition-all shadow-sm flex flex-col justify-between bg-card">
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <TrendingUp className="size-5" />
                  </div>
                  <span className="rounded-md bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    Revenue Tiers
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-foreground font-syne">Commission & Tiers</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Inspect active platform commission rates, volume discount tiers, and provider categories.
                  </p>
                </div>
              </div>
              <div className="border-t border-border/40 p-4 bg-muted/20">
                <Button asChild variant="outline" size="sm" className="w-full justify-between text-xs bg-background">
                  <Link href="/dashboard/admin/commission">
                    Inspect Tiers <ChevronRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
