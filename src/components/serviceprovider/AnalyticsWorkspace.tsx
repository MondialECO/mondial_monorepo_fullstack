'use client';

import Link from 'next/link';
import { FormEvent, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ArrowDownRight, ArrowRight, ArrowUpRight, BarChart3, CheckCircle2, ClipboardList, Eye, EyeOff, Info, Plus, TrendingUp, Users, Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import EmptyState from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCreateGrowthTask, useGrowthTasks, useProviderAnalytics, useUpdateGrowthTaskStatus } from '@/hooks/queries/analytics';
import type { AnalyticsBreakdown, AnalyticsDashboard, AnalyticsMetric, CreateGrowthTaskPayload } from '@/types/analytics';

const rangeOptions = [
  ['ThisMonth', 'This Month'],
  ['Last7Days', 'Last 7 days'], ['Last30Days', 'Last 30 days'], ['Last90Days', 'Last 90 days'],
  ['ThisYear', 'This year'], ['PreviousYear', 'Previous year'], ['Custom', 'Custom range'],
];

export function AnalyticsWorkspace() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = analyticsView(searchParams.get('view'));
  const [range, setRange] = useState('ThisMonth');
  const [currency, setCurrency] = useState('EUR');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const filters = useMemo(() => ({ range, currency, ...(range === 'Custom' && from && to ? { from, to } : {}) }), [range, currency, from, to]);
  const analytics = useProviderAnalytics(filters);
  const tasks = useGrowthTasks();

  if (analytics.isLoading) return <Skeleton className="h-[34rem] w-full rounded-xl" />;
  if (analytics.isError || !analytics.data) return <p className="text-sm text-destructive">Couldn&apos;t load analytics. Check the selected range and try again.</p>;
  const data = analytics.data;

  function changeDetailTab(tab: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', tab === 'revenue' ? 'earnings' : tab);
    router.replace(`${pathname}?${params.toString()}`);
  }

  if (view === 'overview') {
    return <AnalyticsOverviewPage data={data} range={range} onRangeChange={setRange} />;
  }

  return <div className="mx-auto w-full max-w-7xl space-y-6 pb-10">
    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
      <div><h1 className="text-3xl font-semibold">Analytics &amp; Growth</h1><p className="text-sm text-muted-foreground">Read-time performance from your proposals, workroom activity, and released payments.</p></div>
      <div className="flex flex-wrap gap-2">
        <Select value={range} onChange={setRange} options={rangeOptions} label="Date range" />
        {range === 'Custom' && <><Input aria-label="From date" className="w-36" type="date" value={from} onChange={(e) => setFrom(e.target.value)} /><Input aria-label="To date" className="w-36" type="date" value={to} onChange={(e) => setTo(e.target.value)} /></>}
        <Select value={currency} onChange={setCurrency} options={['EUR', 'USD', 'GBP'].map((x) => [x, x])} label="Currency" />
      </div>
    </div>

    <p className="text-xs text-muted-foreground">Computed {dateTime(data.period.computedAt)} · comparing {date(data.period.comparisonFrom)}–{date(data.period.comparisonTo)}. Financial values are scoped to {data.currency}.</p>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard label="Gross revenue" metric={data.overview.grossRevenue} />
      <MetricCard label="Completed work" metric={data.overview.completedWork} />
      <MetricCard label="Accepted proposals" metric={data.overview.acceptedProposals} />
      <MetricCard label="On-time delivery" metric={data.overview.onTimeRate} />
    </div>

    {data.emptyStates.notEnoughActivityYet && <EmptyState icon={BarChart3} title="Not Enough Activity Yet" description="Performance analytics appear after clients begin viewing your profile/services and marketplace work begins." />}

    <Tabs defaultValue="services" value={detailTab(view)} onValueChange={changeDetailTab}>
      <TabsList className="h-auto flex-wrap justify-start">
        <TabsTrigger value="services">Services</TabsTrigger><TabsTrigger value="proposals">Proposals</TabsTrigger><TabsTrigger value="profile">Profile</TabsTrigger><TabsTrigger value="revenue">Revenue</TabsTrigger><TabsTrigger value="clients">Clients</TabsTrigger><TabsTrigger value="growth">Growth</TabsTrigger>
      </TabsList>

      <TabsContent value="services" className="space-y-4">
        {data.emptyStates.noPublishedServices && <EmptyState icon={Plus} title="No Published Services" description="Publish a service to make it available to marketplace clients." action={<Button asChild><Link href="/dashboard/serviceprovider/services">Create Service</Link></Button>} />}
        {!!data.services.length && <Card><CardHeader><CardTitle>Service performance</CardTitle><CardDescription>Brief-based work without a ServiceId is grouped as Custom/Unattributed.</CardDescription></CardHeader><CardContent className="overflow-x-auto"><table className="w-full min-w-[880px] text-sm"><thead><tr className="border-b text-left text-xs text-muted-foreground"><th className="pb-3">Service</th><th>Orders</th><th>Completed</th><th>Avg. sale</th><th>Avg. delivery</th><th>On time</th><th>Repeat orders</th><th>Views</th></tr></thead><tbody>{data.services.map((service) => <tr className="border-b last:border-0" key={service.serviceId ?? 'custom'}><td className="py-4"><p className="font-medium">{service.title}</p><p className="text-xs text-muted-foreground">{service.category}</p></td><MetricCell metric={service.orders} /><MetricCell metric={service.orderCompletionRate} /><MetricCell metric={service.averageSellingPrice} /><MetricCell metric={service.averageDeliveryDays} /><MetricCell metric={service.onTimeDeliveryRate} /><MetricCell metric={service.repeatOrders} /><MetricCell metric={service.serviceViews} /></tr>)}</tbody></table></CardContent></Card>}
      </TabsContent>

      <TabsContent value="proposals"><SectionGrid title="Proposal performance" description="Acceptance uses submitted-proposal cohorts for the selected period." entries={[
        ['Submitted', data.proposals.submitted], ['Accepted', data.proposals.accepted], ['Acceptance rate', data.proposals.acceptanceRate], ['Average value', data.proposals.averageProposalValue], ['Declined', data.proposals.declined], ['Withdrawn', data.proposals.withdrawn], ['Expired', data.proposals.expired], ['Proposal view rate', data.proposals.proposalViewRate], ['Client response rate', data.proposals.clientResponseRate],
      ]} /></TabsContent>

      <TabsContent value="profile"><SectionGrid title="Profile performance" description="The upstream client browsing surface does not yet emit these events. Missing tracking is shown explicitly, never as zero." entries={[
        ['Profile views', data.profile.profileViews], ['Search appearances', data.profile.searchAppearances], ['Portfolio views', data.profile.portfolioViews], ['Profile saves', data.profile.profileSaves], ['Contact rate', data.profile.contactRate], ['Portfolio engagement', data.profile.portfolioEngagement],
      ]} /></TabsContent>

      <TabsContent value="revenue" className="space-y-4">
        {data.emptyStates.noRevenueActivity && <EmptyState icon={Wallet} title="No Revenue Activity" description="Approved and released payments will appear here." />}
        <SectionGrid title="Revenue" description="Funded escrow is protected, not earned. Refunded releases are excluded." entries={[
          ['Gross earnings', data.revenue.gross], ['Net earnings', data.revenue.net], ['Commission', data.revenue.commission], ['Available balance', data.revenue.availableBalance], ['Pending balance', data.revenue.pendingBalance], ['Protected escrow', data.revenue.protectedEscrow], ['Average project', data.revenue.averageProjectValue], ['Highest project', data.revenue.highestProjectValue],
        ]} />
        <div className="grid gap-4 lg:grid-cols-2"><Breakdown title="Revenue by service" rows={data.revenue.byService} currency={currency} /><Breakdown title="Revenue by month" rows={data.revenue.byMonth} currency={currency} /></div>
      </TabsContent>

      <TabsContent value="clients" className="space-y-4">
        <SectionGrid title="Client relationships" description="Repeat-client rate reuses the same shared calculator as the Module 4 Trust signal." entries={[
          ['Clients this period', data.clients.totalClients], ['New clients', data.clients.newClients], ['Returning clients', data.clients.returningClients], ['Repeat-client rate', data.clients.repeatClientRate], ['Repeat-client revenue', data.clients.repeatClientRevenue], ['Average projects/client', data.clients.averageProjectsPerClient], ['Average lifetime value', data.clients.averageClientLifetimeValue], ['Average client rating', data.clients.averageClientRating],
        ]} />
        {!!data.clients.mostActiveClients.length && <Card><CardHeader><CardTitle>Most active clients</CardTitle><CardDescription>Client identifiers are masked in the analytics response.</CardDescription></CardHeader><CardContent>{data.clients.mostActiveClients.map((client) => <div key={client.clientId} className="flex justify-between border-b py-3 text-sm last:border-0"><span>{client.clientId}</span><span>{client.completedProjects} completed · {money(client.netRevenue, currency)}</span></div>)}</CardContent></Card>}
      </TabsContent>

      <TabsContent value="growth" className="space-y-4">
        <Card><CardHeader><CardTitle>Growth observations</CardTitle><CardDescription>Deterministic observations are computed when this page loads. They do not create tasks or take commercial actions.</CardDescription></CardHeader><CardContent className="space-y-3">{data.observations.length ? data.observations.map((item) => <div key={item.ruleId} className="rounded-lg border p-4"><div className="flex items-center gap-2"><TrendingUp className="h-4 w-4" /><p className="font-medium">{item.title}</p>{item.tone === 'positive' && <Badge variant="secondary">Strength</Badge>}</div><p className="mt-1 text-sm text-muted-foreground">{item.message}</p><ul className="mt-3 list-inside list-disc text-sm">{item.suggestedActions.map((action) => <li key={action}>{action}</li>)}</ul></div>) : <p className="text-sm text-muted-foreground">No deterministic observation is triggered by the currently tracked metrics.</p>}{data.unavailableObservationRuleIds.length > 0 && <div className="flex gap-2 rounded-lg bg-muted p-3 text-xs text-muted-foreground"><EyeOff className="mt-0.5 h-4 w-4 shrink-0" /><span>{data.unavailableObservationRuleIds.length} observation rules are unavailable because their source metrics are not tracked yet.</span></div>}</CardContent></Card>
        <GrowthTasks loading={tasks.isLoading} tasks={tasks.data ?? []} />
      </TabsContent>
    </Tabs>

    <p className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">Data limitation: {data.dataLimitation}</p>
  </div>;
}

type AnalyticsView = 'overview' | 'profile' | 'earnings' | 'clients' | 'services' | 'proposals' | 'growth';

function AnalyticsOverviewPage({ data, range, onRangeChange }: { data: AnalyticsDashboard; range: string; onRangeChange: (value: string) => void }) {
  const profileViews = data.profile.profileViews;
  const earnings = data.revenue.net;
  const repeatClients = data.clients.repeatClientRate;
  const rating = data.clients.averageClientRating;
  const isNewProvider = !data.hasMinimumHistory;

  return (
    <div className="min-h-full pb-4 text-[#171717]">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-[-0.02em]">Analytics &amp; Growth</h1>
            <p className="mt-1 text-sm text-[#6B7280]">Your performance across profile, earnings, and clients.</p>
          </div>
          <select
            aria-label="Analytics time range"
            className="h-10 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 text-sm text-[#374151] outline-none focus-visible:ring-2 focus-visible:ring-[#3C61DD] sm:w-40"
            value={range}
            onChange={(event) => onRangeChange(event.target.value)}
          >
            {rangeOptions.filter(([key]) => key !== 'Custom').map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </header>

        <OverviewTabBar />

        {isNewProvider ? (
          <section className="flex min-h-72 items-center justify-center rounded-2xl border border-[#E5E7EB] bg-white px-6 text-center shadow-none">
            <div className="max-w-lg">
              <BarChart3 aria-hidden="true" className="mx-auto size-9 text-[#0D9488]" />
              <h2 className="mt-4 font-heading text-xl font-bold">Your analytics are warming up</h2>
              <p className="mt-2 text-sm leading-6 text-[#6B7280]">Analytics populate once your profile has been live for 7 days across all three areas.</p>
            </div>
          </section>
        ) : (
          <>
            <section aria-label="Analytics snapshots" className="grid gap-4 lg:grid-cols-3">
              <SnapshotCard
                icon={Eye}
                iconClassName="bg-[#E6F5F3] text-[#0D9488]"
                title="Profile"
                metric={profileViews}
                value={profileViews.state === 'available' ? `${integer(profileViews.value)} Views` : '—'}
                caption={profileCaption(data)}
                href="/dashboard/serviceprovider/analytics?view=profile"
                linkLabel="View Profile Analytics"
              />
              <SnapshotCard
                icon={Wallet}
                iconClassName="bg-[#E8F3EE] text-[#157A55]"
                title="Earnings"
                metric={earnings}
                value={earnings.state === 'available' ? money(earnings.value ?? 0, data.currency) : '—'}
                caption={`Avg project value ${metricCompact(data.revenue.averageProjectValue)}.`}
                href="/dashboard/serviceprovider/analytics?view=earnings"
                linkLabel="View Earnings Overview"
              />
              <SnapshotCard
                icon={Users}
                iconClassName="bg-[#FBF2E7] text-[#965F11]"
                title="Clients"
                metric={repeatClients}
                value={repeatClients.state === 'available' ? `${decimal(repeatClients.value)}% Repeat Clients` : '—'}
                caption={`Avg rating ${rating.state === 'available' ? decimal(rating.value) : 'not enough activity'}.`}
                href="/dashboard/serviceprovider/analytics?view=clients"
                linkLabel="View Client Insights"
              />
            </section>

            <CombinedTrendCard profile={profileViews} earnings={earnings} satisfaction={rating} currency={data.currency} />
            <CorrelatedInsight data={data} />
            <QuickWins data={data} />
          </>
        )}
      </div>
    </div>
  );
}

function OverviewTabBar() {
  return (
    <nav aria-label="Analytics detail views" className="overflow-x-auto border-b border-[#E5E7EB]">
      <div role="tablist" aria-label="Analytics sections" className="flex min-w-max gap-8">
        {[
          ['Profile', '/dashboard/serviceprovider/analytics?view=profile'],
          ['Earnings', '/dashboard/serviceprovider/analytics?view=earnings'],
          ['Clients', '/dashboard/serviceprovider/analytics?view=clients'],
        ].map(([label, href]) => (
          <Link
            key={label}
            role="tab"
            aria-selected="false"
            href={href}
            className="border-b-2 border-transparent px-1 pb-3 text-sm font-semibold text-[#4B5563] outline-none hover:text-[#171717] focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-[#3C61DD] focus-visible:ring-offset-2"
          >
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

function SnapshotCard({ icon: Icon, iconClassName, title, metric, value, caption, href, linkLabel }: {
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  iconClassName: string;
  title: string;
  metric: AnalyticsMetric;
  value: string;
  caption: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <article className="flex min-h-60 flex-col rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-none sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className={`flex size-10 items-center justify-center rounded-xl ${iconClassName}`}><Icon aria-hidden={true} className="size-5" /></div>
        <Trend metric={metric} />
      </div>
      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-[#6B7280]">{title}</p>
      <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#171717] sm:text-[26px]">{value}</p>
      <p className="mt-2 min-h-10 text-sm leading-5 text-[#6B7280]">{caption}</p>
      <Link href={href} className="mt-auto inline-flex w-fit items-center gap-1 pt-4 text-sm font-semibold text-[#374151] outline-none hover:text-[#0D9488] focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-[#3C61DD]">
        {linkLabel}<ArrowRight aria-hidden="true" className="size-4" />
      </Link>
    </article>
  );
}

function Trend({ metric }: { metric: AnalyticsMetric }) {
  if (metric.state !== 'available') return <span className="text-xs font-medium text-[#6B7280]">Not tracked yet</span>;
  if (metric.changePercentage == null) return <span className="text-xs font-medium text-[#6B7280]">No comparison</span>;
  const positive = metric.changePercentage >= 0;
  const Icon = positive ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${positive ? 'text-[#157A55]' : 'text-[#965F11]'}`}>
      <Icon aria-hidden="true" className="size-4" />{positive ? '+' : ''}{decimal(metric.changePercentage)}%
      <span className="sr-only">{positive ? 'Increased' : 'Decreased'} by {decimal(Math.abs(metric.changePercentage))} percent compared with the previous period.</span>
    </span>
  );
}

function CombinedTrendCard({ profile, earnings, satisfaction, currency }: { profile: AnalyticsMetric; earnings: AnalyticsMetric; satisfaction: AnalyticsMetric; currency: string }) {
  return (
    <section className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-none sm:p-6" aria-labelledby="combined-trend-title">
      <div>
        <h2 id="combined-trend-title" className="font-heading text-lg font-bold">Combined trend</h2>
        <p className="mt-1 text-sm text-[#6B7280]">How your three key areas have moved together this period.</p>
      </div>
      <div className="mt-6 overflow-hidden rounded-xl bg-[#F9FAFB] px-3 py-4 sm:px-5">
        <svg viewBox="0 0 700 174" className="h-auto min-h-44 w-full" role="img" aria-labelledby="trend-chart-title trend-chart-description">
          <title id="trend-chart-title">Profile views, earnings, and satisfaction trends</title>
          <desc id="trend-chart-description">Each row compares the previous period value with the current period value. Unavailable metrics are labeled as not tracked.</desc>
          <SparklineRow y={20} label="Views" metric={profile} color="#6B7280" formatter={(value) => integer(value)} />
          <SparklineRow y={76} label="Earnings" metric={earnings} color="#157A55" formatter={(value) => money(value, currency)} />
          <SparklineRow y={132} label="Satisfaction" metric={satisfaction} color="#0D9488" formatter={(value) => `${decimal(value)} / 5`} />
        </svg>
        <div className="sr-only">
          <p>{sparklineDescription('Views', profile, (value) => integer(value))}</p>
          <p>{sparklineDescription('Earnings', earnings, (value) => money(value, currency))}</p>
          <p>{sparklineDescription('Satisfaction', satisfaction, (value) => `${decimal(value)} out of 5`)}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-[#6B7280]">
        <Legend color="#6B7280" label="Views" state={profile.state} />
        <Legend color="#157A55" label="Earnings" state={earnings.state} />
        <Legend color="#0D9488" label="Satisfaction" state={satisfaction.state} />
      </div>
    </section>
  );
}

function SparklineRow({ y, label, metric, color, formatter }: { y: number; label: string; metric: AnalyticsMetric; color: string; formatter: (value: number) => string }) {
  const available = metric.state === 'available' && metric.value != null && metric.previousValue != null;
  const rising = available && metric.value! > metric.previousValue!;
  const falling = available && metric.value! < metric.previousValue!;
  const startY = rising ? y + 15 : falling ? y - 15 : y;
  const endY = rising ? y - 15 : falling ? y + 15 : y;
  const description = available
    ? `${label}: ${formatter(metric.previousValue!)} previously and ${formatter(metric.value!)} now.`
    : `${label}: ${metric.state === 'notTracked' ? 'not tracked yet' : 'not enough activity'}.`;
  return (
    <g>
      <text x="0" y={y + 4} fill="#6B7280" fontSize="12">{label}</text>
      <line x1="100" y1={y} x2="680" y2={y} stroke="#E5E7EB" strokeWidth="1" />
      {available ? <path d={`M 100 ${startY} L 680 ${endY}`} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"><title>{description}</title></path> : <line x1="100" y1={y} x2="680" y2={y} stroke="#D1D5DB" strokeWidth="2" strokeDasharray="6 7"><title>{description}</title></line>}
      <text x="675" y={y - 8} textAnchor="end" fill="#6B7280" fontSize="10">{available ? formatter(metric.value!) : 'Unavailable'}</text>
    </g>
  );
}

function Legend({ color, label, state }: { color: string; label: string; state: AnalyticsMetric['state'] }) {
  return <span className="inline-flex items-center gap-2"><span aria-hidden="true" className="size-2 rounded-full" style={{ backgroundColor: color }} />{label}{state === 'notTracked' ? ' · not tracked' : ''}</span>;
}

function CorrelatedInsight({ data }: { data: AnalyticsDashboard }) {
  return (
    <section className="rounded-2xl border border-[#E5E7EB] border-l-4 border-l-[#0D9488] bg-white p-5 shadow-none sm:p-6" aria-labelledby="correlated-insight-title">
      <div className="flex gap-3">
        <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-[#0D9488]" />
        <div>
          <h2 id="correlated-insight-title" className="font-heading text-base font-bold">Performance observation</h2>
          <p className="mt-1 text-sm leading-6 text-[#4B5563]">{correlatedCopy(data)}</p>
        </div>
      </div>
    </section>
  );
}

function QuickWins({ data }: { data: AnalyticsDashboard }) {
  const returning = data.clients.returningClients.state === 'available' ? data.clients.returningClients.value ?? 0 : 0;
  const wins = [
    { text: 'Add a recent case study to strengthen your public profile', href: '/dashboard/serviceprovider/profile' },
    { text: 'Review the work contributing most to your earnings', href: '/dashboard/serviceprovider/analytics?view=earnings' },
    { text: returning > 0 ? `Follow up with ${integer(returning)} returning ${returning === 1 ? 'client' : 'clients'}` : 'Review your client relationships for repeat-work opportunities', href: '/dashboard/serviceprovider/analytics?view=clients' },
  ];
  return (
    <section className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-none sm:p-6" aria-labelledby="quick-wins-title">
      <h2 id="quick-wins-title" className="font-heading text-lg font-bold">Quick wins</h2>
      <ul className="mt-4 divide-y divide-[#E5E7EB]">
        {wins.map((win) => (
          <li key={win.text} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
            <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-[#0D9488]" />
            <Link href={win.href} className="group inline-flex items-start gap-1 text-sm font-medium leading-6 text-[#374151] outline-none hover:text-[#0D9488] focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-[#3C61DD]">
              {win.text}<ArrowRight aria-hidden="true" className="mt-1 size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function analyticsView(value: string | null): AnalyticsView {
  return value === 'profile' || value === 'earnings' || value === 'clients' || value === 'services' || value === 'proposals' || value === 'growth' ? value : 'overview';
}

function detailTab(view: Exclude<AnalyticsView, 'overview'>) { return view === 'earnings' ? 'revenue' : view; }

function profileCaption(data: AnalyticsDashboard) {
  const searches = data.profile.searchAppearances;
  if (searches.state !== 'available') return 'Search appearances and average position are not tracked yet.';
  return `Appeared in ${integer(searches.value)} searches. Average position is not tracked yet.`;
}

function metricCompact(metric: AnalyticsMetric) {
  return metric.state === 'available' ? formatValue(metric.value ?? 0, metric.unit) : 'not enough activity';
}

function correlatedCopy(data: AnalyticsDashboard) {
  const profile = data.profile.profileViews;
  const earnings = data.revenue.net;
  const clients = data.clients.repeatClientRate;
  if (profile.changePercentage != null && earnings.changePercentage != null) {
    return `Profile views ${movement(profile.changePercentage)} this period, while earnings ${movement(earnings.changePercentage)} in the same window. Review both detailed reports to understand how visibility is translating into income.`;
  }
  if (earnings.changePercentage != null && clients.changePercentage != null) {
    return `Earnings ${movement(earnings.changePercentage)} this period, while repeat-client rate ${movement(clients.changePercentage)}. Profile visibility is not tracked yet, so no visibility-to-income claim is made.`;
  }
  return 'Earnings and client relationships are calculated from completed work and released payments. Profile visibility remains not tracked, so this overview does not invent a correlation.';
}

function movement(change: number) { return `${change >= 0 ? 'rose' : 'fell'} ${decimal(Math.abs(change))}%`; }
function sparklineDescription(label: string, metric: AnalyticsMetric, formatter: (value: number) => string) {
  return metric.state === 'available' && metric.value != null && metric.previousValue != null
    ? `${label}: ${formatter(metric.previousValue)} in the previous period and ${formatter(metric.value)} in the current period.`
    : `${label}: ${metric.state === 'notTracked' ? 'not tracked yet' : 'not enough activity'}.`;
}
function integer(value?: number | null) { return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value ?? 0); }
function decimal(value?: number | null) { return new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value ?? 0); }

function GrowthTasks({ loading, tasks }: { loading: boolean; tasks: import('@/types/analytics').GrowthTask[] }) {
  const create = useCreateGrowthTask(); const update = useUpdateGrowthTaskStatus();
  const [form, setForm] = useState<CreateGrowthTaskPayload>({ taskType: 'General', title: '', description: '' });
  function submit(event: FormEvent) { event.preventDefault(); create.mutate(form, { onSuccess: () => setForm({ taskType: 'General', title: '', description: '' }) }); }
  return <div className="grid gap-4 lg:grid-cols-[2fr_1fr]"><Card><CardHeader><CardTitle>Manual growth tasks</CardTitle><CardDescription>Only you create and update these tasks; observations never fan out persisted work.</CardDescription></CardHeader><CardContent>{loading ? <Skeleton className="h-24" /> : tasks.length ? <div className="space-y-2">{tasks.map((task) => <div key={task.id} className="flex flex-col justify-between gap-3 rounded-lg border p-3 sm:flex-row sm:items-center"><div><p className="text-sm font-medium">{task.title}</p><p className="text-xs text-muted-foreground">{task.description}</p></div><div className="flex items-center gap-2"><Badge variant="outline">{words(task.status)}</Badge>{task.status === 'Open' && <Button size="sm" variant="outline" disabled={update.isPending} onClick={() => update.mutate({ id: task.id, status: 'InProgress' })}>Start</Button>}{['Open', 'InProgress'].includes(task.status) && <Button size="sm" disabled={update.isPending} onClick={() => update.mutate({ id: task.id, status: 'Completed' })}><CheckCircle2 className="mr-1 h-4 w-4" />Done</Button>}</div></div>)}</div> : <EmptyState size="sm" icon={ClipboardList} title="No manual growth tasks" />}</CardContent></Card><Card><CardHeader><CardTitle>Add task</CardTitle></CardHeader><CardContent><form className="space-y-3" onSubmit={submit}><Field label="Title"><Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field><Field label="Description"><Input required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field><Button className="w-full" disabled={create.isPending || !form.title.trim() || !form.description.trim()} type="submit"><Plus className="mr-1 h-4 w-4" />Add task</Button></form></CardContent></Card></div>;
}

function SectionGrid({ title, description, entries }: { title: string; description: string; entries: [string, AnalyticsMetric][] }) { return <Card><CardHeader><CardTitle>{title}</CardTitle><CardDescription>{description}</CardDescription></CardHeader><CardContent><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{entries.map(([label, metric]) => <MetricCard key={label} label={label} metric={metric} />)}</div></CardContent></Card>; }
function MetricCard({ label, metric }: { label: string; metric: AnalyticsMetric }) { return <div className="rounded-lg border p-4"><p className="text-xs text-muted-foreground">{label}</p>{metric.state === 'available' ? <><div className="mt-1 flex items-baseline justify-between gap-2"><p className="text-2xl font-semibold">{metricValue(metric)}</p>{metric.changePercentage != null && <Badge variant={metric.changePercentage >= 0 ? 'secondary' : 'outline'}>{metric.changePercentage >= 0 ? '+' : ''}{metric.changePercentage}%</Badge>}</div>{metric.previousValue != null && <p className="mt-1 text-xs text-muted-foreground">Previous: {formatValue(metric.previousValue, metric.unit)}</p>}</> : <><p className="mt-2 font-medium">{metric.state === 'notTracked' ? 'Not tracked yet' : 'Not enough activity'}</p><p className="mt-1 text-xs text-muted-foreground">{metric.reason}</p></>}</div>; }
function MetricCell({ metric }: { metric: AnalyticsMetric }) { return <td className="pr-4">{metric.state === 'available' ? metricValue(metric) : <span title={metric.reason ?? ''} className="text-xs text-muted-foreground">Not tracked</span>}</td>; }
function Breakdown({ title, rows, currency }: { title: string; rows: AnalyticsBreakdown[]; currency: string }) { return <Card><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent>{rows.length ? rows.map((row) => <div key={row.key} className="flex justify-between border-b py-3 text-sm last:border-0"><span>{row.label}</span><span className="font-medium">{money(row.net, currency)}</span></div>) : <p className="text-sm text-muted-foreground">No released revenue in this period.</p>}</CardContent></Card>; }
function Select({ value, onChange, options, label }: { value: string; onChange: (value: string) => void; options: string[][]; label: string }) { return <select aria-label={label} className="h-9 rounded-md border bg-background px-3 text-sm" value={value} onChange={(e) => onChange(e.target.value)}>{options.map(([key, text]) => <option key={key} value={key}>{text}</option>)}</select>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-2"><Label>{label}</Label>{children}</div>; }
function metricValue(metric: AnalyticsMetric) { return formatValue(metric.value ?? 0, metric.unit); }
function formatValue(value: number, unit: string) { if (unit.length === 3 && unit === unit.toUpperCase()) return money(value, unit); if (unit === 'percent') return `${value.toFixed(1)}%`; if (unit === 'days') return `${value.toFixed(1)} days`; if (unit === 'rating') return `${value.toFixed(1)} / 5`; if (unit === 'projects') return `${value.toFixed(2)} projects`; return new Intl.NumberFormat().format(value); }
function money(value: number, currency: string) { try { return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value); } catch { return `${currency} ${value.toFixed(2)}`; } }
function date(value: string) { return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value)); }
function dateTime(value: string) { return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)); }
function words(value: string) { return value.replace(/([A-Z])/g, ' $1').trim(); }
