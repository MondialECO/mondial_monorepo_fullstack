'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Layers,
  RefreshCw,
  UserCheck,
  ShieldAlert,
  Wallet,
  Gavel,
  Cpu,
  BadgeCheck,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AdminPageHeader,
  AdminErrorState,
} from '@/components/admin/shared';
import { OperationalQueuesSummary } from '@/types/admin-system';
import { getOperationalQueues } from '@/lib/api-admin-system';

export default function AdminOperationalQueuesPage() {
  const [queues, setQueues] = useState<OperationalQueuesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQueues = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getOperationalQueues();
      setQueues(data);
    } catch (err: any) {
      console.error('Failed to load operational queues', err);
      setError('Unable to load operational queues metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueues();
  }, []);

  const queueCards = [
    {
      title: 'Pending User KYC Identities',
      count: queues?.pendingKycCount ?? 0,
      description: 'Submitted identity documents awaiting administrative review and approval.',
      href: '/dashboard/admin/verifications/kyc',
      linkText: 'Open KYC Queue',
      icon: <UserCheck className="h-5 w-5 text-primary" />,
      tag: 'Verification Hub',
    },
    {
      title: 'Investor Proof-of-Funds',
      count: queues?.pendingInvestorVerificationsCount ?? 0,
      description: 'Accreditation and bank liquidity verification requests.',
      href: '/dashboard/admin/verifications/investors',
      linkText: 'Open Investor Queue',
      icon: <BadgeCheck className="h-5 w-5 text-emerald-500" />,
      tag: 'Investor Finance',
    },
    {
      title: 'Service Provider Credentials',
      count: queues?.pendingServiceProviderVerificationsCount ?? 0,
      description: 'Professional licenses, certifications, and business verification submissions.',
      href: '/dashboard/admin/verifications/service-providers',
      linkText: 'Open Provider Queue',
      icon: <BadgeCheck className="h-5 w-5 text-indigo-500" />,
      tag: 'Provider Hub',
    },
    {
      title: 'Open Reports & Abuse Flags',
      count: queues?.openReportsCount ?? 0,
      description: 'Community user reports across listings, offers, reviews, and profiles.',
      href: '/dashboard/admin/reports',
      linkText: 'Open Reports Queue',
      icon: <ShieldAlert className="h-5 w-5 text-rose-500" />,
      tag: 'Trust & Safety',
    },
    {
      title: 'Milestone Commercial Disputes',
      count: queues?.openDisputesCount ?? 0,
      description: 'Workroom contract milestones in dispute awaiting administrator arbitration.',
      href: '/dashboard/admin/disputes',
      linkText: 'Open Disputes Hub',
      icon: <Gavel className="h-5 w-5 text-amber-500" />,
      tag: 'Commerce & Disputes',
    },
    {
      title: 'Pending Payout Requests',
      count: queues?.pendingPayoutsCount ?? 0,
      description: 'Provider earnings withdrawal requests pending approval or payout processing.',
      href: '/dashboard/admin/payouts',
      linkText: 'Open Payouts Ledger',
      icon: <Wallet className="h-5 w-5 text-blue-500" />,
      tag: 'Finance & Payouts',
    },
    {
      title: 'Failed Background Jobs',
      count: queues?.failedJobsCount ?? 0,
      description: 'Hangfire worker jobs that failed during execution and may require safe retry.',
      href: '/dashboard/admin/system/jobs',
      linkText: 'Open Jobs Monitor',
      icon: <Cpu className="h-5 w-5 text-rose-500" />,
      tag: 'System Workers',
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-6">
      {/* Shared Admin Header */}
      <AdminPageHeader
        title="Operational Queues & Backlogs"
        description="Aggregated operational overview across all administrative backlogs. Jump directly into specialized review queues."
        badge="OPERATIONS"
        icon={Layers}
        backHref="/dashboard/admin/system"
        backLabel="Back to System Operations"
        actions={
          <Button
            onClick={() => fetchQueues()}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />

      {/* Shared Error State */}
      {error && (
        <AdminErrorState
          title="Failed to load queues"
          message={error}
          onRetry={fetchQueues}
        />
      )}

      {/* Queue Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {queueCards.map((card) => (
          <div
            key={card.title}
            className="flex flex-col justify-between rounded-xl border border-border bg-card p-6 shadow-sm hover:border-border/80 transition"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-accent p-2.5">{card.icon}</div>
                <Badge variant="outline" className="text-xs font-semibold bg-accent/40">
                  {card.tag}
                </Badge>
              </div>

              <div className="mt-4">
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  Queue Backlog
                </span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className={`text-3xl font-extrabold ${card.count > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {loading ? '...' : card.count}
                  </span>
                  <span className="text-xs text-muted-foreground">pending items</span>
                </div>
              </div>

              <h3 className="mt-3 font-bold text-foreground text-base">{card.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{card.description}</p>
            </div>

            <div className="mt-6 border-t border-border pt-4">
              <Link
                href={card.href}
                className="flex items-center justify-between font-semibold text-xs text-primary hover:underline"
              >
                <span>{card.linkText}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-muted/20 p-4 text-xs text-muted-foreground flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span>Counts aggregated live across database collections.</span>
        </div>
        <span>Last computed: {queues?.generatedAt ? new Date(queues.generatedAt).toLocaleTimeString() : 'Just now'}</span>
      </div>
    </div>
  );
}
