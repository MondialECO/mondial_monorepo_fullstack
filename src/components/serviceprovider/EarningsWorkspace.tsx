'use client';

// Remaining hardcoded hex on this file is deliberate, not an oversight: those values
// have no exact token equivalent. See the PENDING DESIGN-TOKEN DECISION note in
// src/app/globals.css (below the .sp-workspace block) for the full list and why.
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowRight, CircleDollarSign, Clock3, HandCoins, Landmark, LockKeyhole, WalletCards } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useEarnings } from '@/hooks/queries/workroom';
import { SpCard, SpMetricCard, SpMutationFeedback, SpPage, SpPageHeader, SpTabBar } from '@/components/serviceprovider/ui';
import { EarningsActivity } from '@/components/serviceprovider/earnings/EarningsActivity';
import { PayoutsPanel } from '@/components/serviceprovider/earnings/PayoutsPanel';
import { FinancialSettingsPanel } from '@/components/serviceprovider/earnings/FinancialSettingsPanel';
import { money } from '@/components/serviceprovider/workroom/_shared';
import type { FinancialSummary } from '@/types/workroom';
import Link from 'next/link';

type EarningsTab = 'activity' | 'payouts' | 'settings';

export function EarningsWorkspace() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = earningsTab(searchParams.get('tab'));
  const currency = (searchParams.get('currency') || 'EUR').toUpperCase();
  const query = useEarnings(currency);

  const href = (tab: EarningsTab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    params.set('currency', currency);
    return `${pathname}?${params.toString()}`;
  };
  const setCurrency = (next: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('currency', next);
    params.set('tab', activeTab);
    router.replace(`${pathname}?${params.toString()}`);
  };

  if (query.isLoading) return <EarningsLoading />;
  if (query.isError || !query.data) return <SpPage><SpPageHeader title="Earnings & Payouts" description="Your currency-scoped financial workspace." /><SpCard><SpMutationFeedback status="error">Earnings could not be loaded. Your existing financial records were not changed.</SpMutationFeedback><Button type="button" variant="outline" className="mt-4" onClick={() => query.refetch()}>Try again</Button></SpCard></SpPage>;

  const data = query.data;
  const currencies = Array.from(new Set([currency, ...data.availableCurrencies])).sort();
  return (
    <SpPage className="pb-8">
      <SpPageHeader
        title="Earnings & Payouts"
        description="Track server-recorded earnings, payment lifecycle states, payouts, invoices and tax settings."
        actions={<label className="flex items-center gap-2 text-sm font-semibold text-[#374151]"><span>Currency</span><select aria-label="Financial currency" value={currency} onChange={(event) => setCurrency(event.target.value)} className="h-10 rounded-xl border border-input bg-white px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring">{currencies.map((item) => <option key={item}>{item}</option>)}</select></label>}
      />
      <SpTabBar label="Earnings sections" items={[{ label: 'Earnings Overview', href: href('activity'), active: activeTab === 'activity' }, { label: 'Payouts', href: href('payouts'), active: activeTab === 'payouts' }, { label: 'Financial Settings', href: href('settings'), active: activeTab === 'settings' }]} />

      <AvailableBalanceHero amount={data.available} currency={currency} payoutHref={href('payouts')} />

      <EscrowPanel data={data} currency={currency} />

      {/* Every card below the hero carries the same weight on purpose. The previous split
          put On hold in a smaller row than Work in progress and Pending release, which
          inverted their urgency: On hold is the only one of the three a provider can act
          on, and the other two are equally passive. Ordered by lifecycle instead —
          approaching payout, blocked, already paid. */}
      <div className="grid gap-4 sm:grid-cols-3">
        <SpMetricCard label="Pending release" value={money(data.pending, currency)} detail="Approved, not yet in your available balance" icon={HandCoins} />
        <SpMetricCard label="On hold" value={money(data.onHold, currency)} detail="Blocked by the recorded lifecycle" icon={AlertCircle} iconClassName="bg-warning/10 text-warning" />
        <SpMetricCard label="Withdrawn" value={money(data.withdrawn, currency)} detail="Completed payouts" icon={CircleDollarSign} />
      </div>

      {activeTab === 'activity' && <EarningsActivity data={data} currency={currency} />}
      {activeTab === 'payouts' && <PayoutsPanel data={data} currency={currency} />}
      {activeTab === 'settings' && <FinancialSettingsPanel data={data} currency={currency} />}
    </SpPage>
  );
}

/**
 * The one number this page exists to answer, and the only one with an action behind it.
 * It previously sat as one of seven equal boxes with the text "Eligible for a payout
 * request" and no way to make one — the request form was a tab away. Size and the CTA are
 * the same argument: this is the actionable figure, so it looks and behaves like it.
 */
export function AvailableBalanceHero({ amount, currency, payoutHref }: { amount: number; currency: string; payoutHref: string }) {
  return (
    <SpCard className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#E8F7F0] text-[#157A55]">
            <WalletCards className="size-5" aria-hidden="true" />
          </span>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Available balance</p>
        </div>
        <p className="mt-4 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">{money(amount, currency)}</p>
        <p className="mt-2 text-sm text-muted-foreground">Released, clear of any hold, and eligible for a payout request.</p>
      </div>
      <Button asChild className="shrink-0">
        <Link href={payoutHref}>
          Request a payout
          <ArrowRight aria-hidden="true" className="ml-2 size-4" />
        </Link>
      </Button>
    </SpCard>
  );
}

/**
 * Protected funds is NOT a seventh pool of money, and presenting it as a peer card implied
 * it was. Traced through WorkroomService: it is every milestone whose escrow is Funded and
 * whose status is neither Approved nor Paid — which makes Work in progress a strict SUBSET
 * of it (all three of its statuses are inside that set), and funded In review milestones
 * subsets too. A provider adding the old seven boxes got a total well above their real
 * money.
 *
 * So it is shown as the total with its stages nested inside it. The stages deliberately do
 * not add up to it, and the note says so rather than leaving the arithmetic looking broken:
 *
 *   - Milestones in revision or dispute are inside the total but are not a listed stage.
 *     Before this change the total was the ONLY place that money appeared at all, so it
 *     must not be dropped in the reframe.
 *   - In review is not escrow-filtered upstream, so a submitted milestone whose escrow went
 *     On hold counts under On hold instead of here.
 *
 * No remainder is computed. protectedEscrow - workInProgress - inReview can legitimately go
 * negative for exactly the second reason above, so a "everything else" figure would be a
 * fabricated number on a page where every other figure is server-recorded.
 */
export function EscrowPanel({ data, currency }: { data: FinancialSummary; currency: string }) {
  return (
    <SpCard aria-labelledby="escrow-total-title">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#F3F4F6] text-[#4B5563]">
              <Landmark className="size-5" aria-hidden="true" />
            </span>
            <p id="escrow-total-title" className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Held in escrow</p>
          </div>
          <p className="mt-4 text-3xl font-semibold tracking-tight text-foreground">{money(data.protectedEscrow, currency)}</p>
          <p className="mt-2 text-sm text-muted-foreground">Client funds held against milestones that have not been released.</p>
        </div>
      </div>

      <div className="mt-6 border-t border-border pt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">Included in the amount above</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <SpMetricCard className="min-h-0 bg-[#F9FAFB]" label="Work in progress" value={money(data.workInProgress, currency)} detail="Funded work still in delivery" icon={Clock3} />
          <SpMetricCard className="min-h-0 bg-[#F9FAFB]" label="In review" value={money(data.inReview, currency)} detail="Submitted, awaiting client action" icon={LockKeyhole} iconClassName="bg-warning/10 text-warning" />
        </div>
        <p className="mt-4 text-xs leading-5 text-muted-foreground">
          These are parts of the total above, not amounts to add to it. Milestones in revision or dispute are also included in the total but are not listed as a stage, and anything whose escrow has been placed on hold is counted under On hold instead.
        </p>
      </div>
    </SpCard>
  );
}

/**
 * Mirrors the real layout block for block: hero, escrow panel, three cards, content. The
 * previous version rendered four card skeletons and nothing for the second row, so the row
 * appeared unaccounted-for on every load.
 */
export function EarningsLoading() {
  return (
    <SpPage className="pb-8">
      <div className="flex items-center justify-between">
        <Skeleton className="h-16 w-72 rounded-xl" />
        <Skeleton className="h-10 w-28 rounded-xl" />
      </div>
      <Skeleton className="h-14 w-full rounded-xl" />
      <Skeleton className="h-40 rounded-2xl" />
      <Skeleton className="h-72 rounded-2xl" />
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-44 rounded-2xl" />)}
      </div>
      <Skeleton className="h-96 rounded-2xl" />
    </SpPage>
  );
}

function earningsTab(value: string | null): EarningsTab {
  if (value === 'payouts') return 'payouts';
  if (value === 'settings' || value === 'invoices') return 'settings';
  return 'activity';
}
