'use client';

// Remaining hardcoded hex on this file is deliberate, not an oversight: those values
// have no exact token equivalent. See the PENDING DESIGN-TOKEN DECISION note in
// src/app/globals.css (below the .sp-workspace block) for the full list and why.
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, CircleDollarSign, Clock3, HandCoins, Landmark, LockKeyhole, WalletCards } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useEarnings } from '@/hooks/queries/workroom';
import { SpCard, SpMetricCard, SpMutationFeedback, SpPage, SpPageHeader, SpTabBar } from '@/components/serviceprovider/ui';
import { EarningsActivity } from '@/components/serviceprovider/earnings/EarningsActivity';
import { PayoutsPanel } from '@/components/serviceprovider/earnings/PayoutsPanel';
import { FinancialSettingsPanel } from '@/components/serviceprovider/earnings/FinancialSettingsPanel';
import { money } from '@/components/serviceprovider/workroom/_shared';

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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SpMetricCard label="Available balance" value={money(data.available, currency)} detail="Eligible for a payout request" icon={WalletCards} iconClassName="bg-[#E8F7F0] text-[#157A55]" />
        <SpMetricCard label="Work in progress" value={money(data.workInProgress, currency)} detail="Funded project work still in delivery" icon={Clock3} />
        <SpMetricCard label="In review" value={money(data.inReview, currency)} detail="Submitted work awaiting client action" icon={LockKeyhole} iconClassName="bg-warning/10 text-warning" />
        <SpMetricCard label="Pending release" value={money(data.pending, currency)} detail="Approved lifecycle amount not yet available" icon={HandCoins} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <CompactMetric label="Protected funds" value={data.protectedEscrow} currency={currency} icon={Landmark} note="Held for funded milestones" />
        <CompactMetric label="On hold" value={data.onHold} currency={currency} icon={AlertCircle} note="Blocked by the recorded lifecycle" warning />
        <CompactMetric label="Withdrawn" value={data.withdrawn} currency={currency} icon={CircleDollarSign} note="Completed payouts" />
      </div>

      {activeTab === 'activity' && <EarningsActivity data={data} currency={currency} />}
      {activeTab === 'payouts' && <PayoutsPanel data={data} currency={currency} />}
      {activeTab === 'settings' && <FinancialSettingsPanel data={data} currency={currency} />}
    </SpPage>
  );
}

function CompactMetric({ label, value, currency, icon: Icon, note, warning = false }: { label: string; value: number; currency: string; icon: typeof Landmark; note: string; warning?: boolean }) {
  return <SpCard className="flex items-center gap-4"><span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${warning ? 'bg-warning/10 text-warning' : 'bg-[#F3F4F6] text-[#4B5563]'}`}><Icon className="size-5" aria-hidden="true" /></span><div><p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">{label}</p><p className="mt-1 text-xl font-semibold text-foreground">{money(value, currency)}</p><p className="mt-1 text-xs text-muted-foreground">{note}</p></div></SpCard>;
}

function EarningsLoading() {
  return <SpPage className="pb-8"><div className="flex items-center justify-between"><Skeleton className="h-16 w-72 rounded-xl" /><Skeleton className="h-10 w-28 rounded-xl" /></div><Skeleton className="h-14 w-full rounded-xl" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-44 rounded-2xl" />)}</div><Skeleton className="h-96 rounded-2xl" /></SpPage>;
}

function earningsTab(value: string | null): EarningsTab {
  if (value === 'payouts') return 'payouts';
  if (value === 'settings' || value === 'invoices') return 'settings';
  return 'activity';
}
