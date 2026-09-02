'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Percent,
  Calculator,
  ShieldCheck,
  Lock,
  Layers,
  Info,
  Loader2,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import {
  AdminPageHeader,
  AdminStatCard,
  AdminErrorState,
  AdminTable,
  AdminStatusBadge,
} from '@/components/admin/shared';
import {
  fetchAdminCommissionConfig,
  AdminCommissionConfigDto,
} from '@/lib/api-admin-commerce';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export default function AdminCommissionPage() {
  const { data: config, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-commission-config'],
    queryFn: fetchAdminCommissionConfig,
  });

  // Live Calculator state
  const [calcAmount, setCalcAmount] = useState<number>(1000);
  const [calcCategory, setCalcCategory] = useState<string>('default');

  const effectiveRate = config?.defaultCommissionPercentage ?? 12;
  const effectiveCurrency = config?.currency ?? 'EUR';
  const categoryOverrides = config?.categoryOverrides ?? {};
  const tiers = config?.tiers ?? [
    { tierLevel: 1, tierName: 'Tier 1 — Standard', commissionPercentage: 12, eligibility: 'Default / Onboarding', matchingPriority: 'Standard Matching Queue' },
    { tierLevel: 2, tierName: 'Tier 2 — Verified', commissionPercentage: 12, eligibility: 'Credential / Profile Verification Approved', matchingPriority: 'Elevated Matching & Search Rank' },
    { tierLevel: 3, tierName: 'Tier 3 — Pro', commissionPercentage: 12, eligibility: 'Server-Side Performance & Volume Evaluation', matchingPriority: 'Priority Client Matching' },
    { tierLevel: 4, tierName: 'Tier 4 — Elite', commissionPercentage: 12, eligibility: 'Top 1% Quality, Dispute-Free & High-Volume', matchingPriority: 'Dedicated Enterprise Matching' },
  ];

  const activeRate =
    calcCategory !== 'default' && categoryOverrides[calcCategory] !== undefined
      ? categoryOverrides[calcCategory]
      : effectiveRate;

  // Calculator computations
  const feeAmount = (calcAmount * activeRate) / 100;
  const netAmount = Math.max(calcAmount - feeAmount, 0);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: effectiveCurrency,
    }).format(amount);
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Shared Admin Page Header */}
      <AdminPageHeader
        title="Platform Commission & Fee Configuration"
        description="Authoritative platform fee policy and Service Provider tier matching specifications across the marketplace."
        badge="COMMERCE"
        icon={Percent}
        backHref="/dashboard/admin/commerce"
        backLabel="Back to Commerce Hub"
      />

      {/* Shared Error State */}
      {error && (
        <AdminErrorState
          title="Failed to load commission structure"
          message="Unable to reach the server to fetch current platform commission and tier specifications."
          onRetry={() => refetch()}
        />
      )}

      {isLoading ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-border bg-card">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : !error && (
        <div className="space-y-6">
          {/* Policy Lock Banner */}
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mt-0.5 sm:mt-0">
                <Lock className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground text-sm sm:text-base">
                    Platform Commission Policy — Locked Standard
                  </h3>
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 text-xs">
                    Immutable Authority
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  {config?.policyStatement ||
                    'Flat 12% platform commission across all marketplace engagements. Service provider tiers govern matching priority and profile ranking only.'}
                </p>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-2 text-xs font-medium text-muted-foreground bg-background/80 px-3 py-1.5 rounded-md border border-border">
              <ShieldCheck className="size-4 text-emerald-500" />
              Audit Verified
            </div>
          </div>

          {/* Stat Cards Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <AdminStatCard
              label="Standard Take-Rate"
              value={`${effectiveRate.toFixed(1)}%`}
              icon={Percent}
              variant="primary"
              subtitle="Flat rate across all categories"
            />
            <AdminStatCard
              label="Commission Model"
              value="Fixed Single-Tier"
              icon={Layers}
              variant="default"
              subtitle="Governed by PlatformCommerceConstants"
            />
            <AdminStatCard
              label="Tier Progression Impact"
              value="Matching Priority"
              icon={TrendingUp}
              variant="success"
              subtitle="Tiers never vary commission percentage"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-12">
            {/* Left 7 cols: Service Provider Tier Ladder Table */}
            <div className="lg:col-span-7 space-y-6">
              <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div>
                    <h3 className="font-semibold text-foreground text-base">Service Provider Tier Ladder</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Platform tier progression governs matching rank, not fee percentages.
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs font-normal">
                    4 Active Tiers
                  </Badge>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-border text-xs font-semibold uppercase text-muted-foreground">
                      <tr>
                        <th className="py-2.5 px-3">Tier</th>
                        <th className="py-2.5 px-3">Commission</th>
                        <th className="py-2.5 px-3">Eligibility Requirement</th>
                        <th className="py-2.5 px-3">Matching Rule</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-xs sm:text-sm">
                      {tiers.map((tier) => (
                        <tr key={tier.tierLevel} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-3 font-semibold text-foreground whitespace-nowrap">
                            {tier.tierName}
                          </td>
                          <td className="py-3 px-3 font-bold text-primary whitespace-nowrap">
                            {tier.commissionPercentage.toFixed(1)}%
                          </td>
                          <td className="py-3 px-3 text-muted-foreground">
                            {tier.eligibility}
                          </td>
                          <td className="py-3 px-3 text-muted-foreground">
                            {tier.matchingPriority}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-3 bg-muted/40 rounded-lg text-xs text-muted-foreground flex items-start gap-2 border border-border/60">
                  <Info className="size-4 text-primary shrink-0 mt-0.5" />
                  <span>
                    <strong>Rule of Record:</strong> Service provider tiers strictly regulate platform trust, proposal search order, and lead allocation. Milestone release calculations always consume the shared 12% constant at settlement time.
                  </span>
                </div>
              </div>

              {/* Category Overrides Card (if any exist) */}
              {Object.keys(categoryOverrides).length > 0 && (
                <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <div>
                      <h3 className="font-semibold text-foreground text-base">Category-Specific Overrides</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Specific sectors with customized rate terms.
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs font-normal">
                      {Object.keys(categoryOverrides).length} Overrides
                    </Badge>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-border text-xs font-semibold uppercase text-muted-foreground">
                        <tr>
                          <th className="py-2.5 px-3">Category Name</th>
                          <th className="py-2.5 px-3 text-right">Take-Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border text-xs sm:text-sm">
                        {Object.entries(categoryOverrides).map(([cat, rate]) => (
                          <tr key={cat}>
                            <td className="py-3 px-3 font-medium text-foreground">{cat}</td>
                            <td className="py-3 px-3 text-right font-bold text-primary">{String(rate)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Right 5 cols: Live Commission Fee Simulator */}
            <div className="lg:col-span-5 space-y-6">
              <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 font-semibold text-foreground border-b border-border pb-3">
                  <Calculator className="size-5 text-primary" />
                  Fee & Payout Estimator
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Milestone / Order Value ({effectiveCurrency})
                    </label>
                    <Input
                      type="number"
                      min="1"
                      step="50"
                      value={calcAmount}
                      onChange={(e) => setCalcAmount(parseFloat(e.target.value) || 0)}
                      className="text-lg font-bold"
                    />
                  </div>

                  {Object.keys(categoryOverrides).length > 0 && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Service Sector
                      </label>
                      <select
                        value={calcCategory}
                        onChange={(e) => setCalcCategory(e.target.value)}
                        className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <option value="default">Default Global Rate ({effectiveRate}%)</option>
                        {Object.entries(categoryOverrides).map(([cat, rate]) => (
                          <option key={cat} value={cat}>
                            {cat} ({String(rate)}%)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Calculation Breakdown Result Box */}
                  <div className="rounded-xl bg-muted/50 p-4 border border-border space-y-3 mt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Gross Value:</span>
                      <span className="font-semibold text-foreground">{formatMoney(calcAmount)}</span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Platform Fee ({activeRate}%):</span>
                      <span className="font-semibold text-primary">{formatMoney(feeAmount)}</span>
                    </div>

                    <div className="border-t border-border pt-2 flex justify-between text-base">
                      <span className="font-medium text-foreground">Provider Net Payout:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {formatMoney(netAmount)}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-muted-foreground text-center">
                    Computed live using standard <code>PlatformCommerceConstants.CommissionRate</code> (12%).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

