'use client';

// Fully token-driven as of the Earnings visual redesign — no hex literals remain on this
// file. Greens use --success-light / --success-strong; the latter was added because
// --success-text is 2.80:1 on --success-light and fails AA. See globals.css.
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, WalletCards } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useEarnings } from '@/hooks/queries/workroom';
import { SpCard, SpMutationFeedback, SpPage, SpPageHeader, SpTabBar } from '@/components/serviceprovider/ui';
import { EarningsActivity } from '@/components/serviceprovider/earnings/EarningsActivity';
import { PayoutsPanel } from '@/components/serviceprovider/earnings/PayoutsPanel';
import { FinancialSettingsPanel } from '@/components/serviceprovider/earnings/FinancialSettingsPanel';
import { money } from '@/components/serviceprovider/workroom/_shared';
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
        actions={<label className="flex items-center gap-2 text-sm font-semibold text-foreground"><span>Currency</span><select aria-label="Financial currency" value={currency} onChange={(event) => setCurrency(event.target.value)} className="h-10 rounded-xl border border-input bg-white px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring">{currencies.map((item) => <option key={item}>{item}</option>)}</select></label>}
      />
      <SpTabBar label="Earnings sections" items={[{ label: 'Earnings Overview', href: href('activity'), active: activeTab === 'activity' }, { label: 'Payouts', href: href('payouts'), active: activeTab === 'payouts' }, { label: 'Financial Settings', href: href('settings'), active: activeTab === 'settings' }]} />

      <AvailableBalanceHero amount={data.available} currency={currency} payoutHref={href('payouts')} />

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
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-success-light text-success-strong">
            <WalletCards className="size-5" aria-hidden="true" />
          </span>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Available balance</p>
        </div>
        {/* Leads the page. One step up from the 3xl the escrow total uses, so the hierarchy
            is readable at a glance rather than by comparison. */}
        <p className="mt-5 font-heading text-5xl font-bold tracking-tight text-success-strong sm:text-6xl">{money(amount, currency)}</p>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">Released, clear of any hold, and eligible for a payout request.</p>
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
      <Skeleton className="h-96 rounded-2xl" />
    </SpPage>
  );
}

function earningsTab(value: string | null): EarningsTab {
  if (value === 'payouts') return 'payouts';
  if (value === 'settings' || value === 'invoices') return 'settings';
  return 'activity';
}
