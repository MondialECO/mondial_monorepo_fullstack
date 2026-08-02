'use client';

import Link from 'next/link';
import { FormEvent, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, BarChart3, BriefcaseBusiness,
  CheckCircle2, ClipboardList, Eye, Info, Plus, Send,
  ShieldCheck, TrendingUp, Users, Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  SpCard, SpEmptyState, SpMetricCard, SpPage, SpPageHeader, SpSectionHeader,
  SpStatusBadge, SpTabBar,
} from '@/components/serviceprovider/ui';
import {
  useCreateGrowthTask, useGrowthTasks, useProviderAnalytics, useUpdateGrowthTaskStatus,
} from '@/hooks/queries/analytics';
import type {
  AnalyticsBreakdown, AnalyticsDashboard, AnalyticsMetric, CreateGrowthTaskPayload,
  GrowthTask,
} from '@/types/analytics';

type AnalyticsView = 'overview' | 'services' | 'proposals' | 'profile' | 'earnings' | 'clients';

const basePath = '/dashboard/serviceprovider/analytics';
const rangeOptions = [
  ['ThisMonth', 'This month'],
  ['Last7Days', 'Last 7 days'],
  ['Last30Days', 'Last 30 days'],
  ['Last90Days', 'Last 90 days'],
  ['ThisYear', 'This year'],
  ['PreviousYear', 'Previous year'],
  ['Custom', 'Custom range'],
] as const;

const views: { value: AnalyticsView; label: string }[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'services', label: 'Services' },
  { value: 'proposals', label: 'Proposals' },
  { value: 'profile', label: 'Profile' },
  { value: 'earnings', label: 'Earnings' },
  { value: 'clients', label: 'Clients' },
];

export function AnalyticsWorkspace() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = toView(searchParams.get('view'));
  const range = searchParams.get('range') || 'ThisMonth';
  const currency = (searchParams.get('currency') || 'EUR').toUpperCase();
  const from = searchParams.get('from') || '';
  const to = searchParams.get('to') || '';
  const filters = useMemo(() => ({
    range,
    currency,
    ...(range === 'Custom' && from && to ? { from, to } : {}),
  }), [range, currency, from, to]);
  const analytics = useProviderAnalytics(filters);
  const tasks = useGrowthTasks();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value); else params.delete(key);
    if (key === 'range' && value !== 'Custom') {
      params.delete('from');
      params.delete('to');
    }
    router.replace(`${pathname}?${params.toString()}`);
  }

  if (analytics.isLoading) {
    return <SpPage aria-label="Loading analytics"><Skeleton className="h-12 w-72 rounded-xl" /><Skeleton className="h-[34rem] w-full rounded-2xl" /></SpPage>;
  }

  if (analytics.isError || !analytics.data) {
    return (
      <SpPage>
        <SpEmptyState
          icon={BarChart3}
          title="Analytics could not be loaded"
          description="Check the selected dates and try again. No analytics values have been estimated."
          action={<Button variant="outline" onClick={() => analytics.refetch()}>Try again</Button>}
        />
      </SpPage>
    );
  }

  const data = analytics.data;
  const currencies = unique([data.currency, ...(data.availableCurrencies ?? [])]);

  return (
    <SpPage className="pb-10">
      <SpPageHeader
        title="Analytics & Growth"
        description="Read-time performance from your profile, proposals, completed work, and released payments."
        actions={(
          <div className="flex flex-wrap gap-2">
            <SelectControl label="Analytics date range" value={range} onChange={(value) => setParam('range', value)} options={rangeOptions.map(([value, label]) => ({ value, label }))} />
            <SelectControl label="Analytics currency" value={currency} onChange={(value) => setParam('currency', value)} options={currencies.map((value) => ({ value, label: value }))} />
          </div>
        )}
      />

      {range === 'Custom' && (
        <SpCard className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <DateControl label="From" value={from} onChange={(value) => setParam('from', value)} />
          <DateControl label="To" value={to} onChange={(value) => setParam('to', value)} />
          {(!from || !to) && <p role="status" className="pb-2 text-sm text-warning">Choose both dates to load a custom range.</p>}
        </SpCard>
      )}

      <SpTabBar
        label="Analytics views"
        items={views.map((item) => ({
          label: item.label,
          href: analyticsHref(item.value, searchParams),
          active: view === item.value,
        }))}
      />

      <p className="text-xs leading-5 text-[#6B7280]">
        {date(data.period.from)}–{date(data.period.to)} compared with {date(data.period.comparisonFrom)}–{date(data.period.comparisonTo)}. Financial values are scoped to {data.currency}.
      </p>

      {view === 'overview' && <Overview data={data} tasks={tasks.data ?? []} tasksLoading={tasks.isLoading} />}
      {view === 'services' && <ServicesView data={data} />}
      {view === 'proposals' && <ProposalsView data={data} />}
      {view === 'profile' && <ProfileView data={data} />}
      {view === 'earnings' && <EarningsView data={data} />}
      {view === 'clients' && <ClientsView data={data} />}

      <aside className="rounded-xl border border-dashed border-[#D1D5DB] bg-white px-4 py-3 text-xs leading-5 text-[#6B7280]">
        <strong className="font-semibold text-[#374151]">Data provenance:</strong> {data.dataLimitation}
      </aside>
    </SpPage>
  );
}

function Overview({ data, tasks, tasksLoading }: { data: AnalyticsDashboard; tasks: GrowthTask[]; tasksLoading: boolean }) {
  if (!data.hasMinimumHistory) {
    return (
      <SpEmptyState
        icon={BarChart3}
        title="Your analytics are warming up"
        description="Analytics populate once your profile has been live for 7 days. Profile tracking gaps remain labeled separately when history becomes available."
      />
    );
  }

  return (
    <div className="space-y-6">
      <section aria-label="Analytics overview" className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <SpMetricCard label="Profile strength" icon={ShieldCheck} value={metricText(data.profile.profileCompleteness)} detail="Public profile completion" />
        <SpMetricCard label="Published services" icon={BriefcaseBusiness} value={metricText(data.profile.publishedServices)} detail="Live catalogue listings" />
        <SpMetricCard label="Accepted proposals" icon={Send} value={metricText(data.proposals.accepted)} detail={<Trend metric={data.proposals.accepted} />} />
        <SpMetricCard label="Net earnings" icon={Wallet} value={metricText(data.revenue.net)} detail={<Trend metric={data.revenue.net} />} />
        <SpMetricCard label="Repeat clients" icon={Users} value={metricText(data.clients.repeatClientRate)} detail="Shared Workroom relationship calculation" />
      </section>

      <ComparisonPanel data={data} />

      <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
        <Observations data={data} />
        <GrowthTasks tasks={tasks} loading={tasksLoading} />
      </div>

      <QuickLinks />
    </div>
  );
}

function ComparisonPanel({ data }: { data: AnalyticsDashboard }) {
  const metrics = [
    ['Net earnings', data.revenue.net],
    ['Accepted proposals', data.proposals.accepted],
    ['Completed engagements', data.clients.completedEngagements],
    ['On-time delivery', data.clients.onTimeDeliveryRate],
  ] as const;
  return (
    <SpCard aria-labelledby="period-comparison-title">
      <SpSectionHeader title="Period comparison" description="Current values against the directly preceding comparison window; no interpolated time series." />
      <div id="period-comparison-title" className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([label, metric]) => <MetricTile key={label} label={label} metric={metric} />)}
      </div>
    </SpCard>
  );
}

function Observations({ data }: { data: AnalyticsDashboard }) {
  return (
    <SpCard aria-labelledby="observations-title">
      <SpSectionHeader title="Growth observations" description="Deterministic rules evaluate the current response when this page loads. They never create tasks or change marketplace data." />
      <div id="observations-title" className="mt-5 space-y-3">
        {data.observations.length ? data.observations.map((item) => (
          <article key={item.ruleId} className="rounded-xl border border-[#BBE8D3] border-l-4 border-l-[#0D9488] bg-[#F7FCFA] p-4">
            <div className="flex items-center gap-2"><TrendingUp aria-hidden="true" className="size-4 text-[#157A55]" /><h3 className="font-heading text-sm font-semibold text-[#171717]">{item.title}</h3></div>
            <p className="mt-2 text-sm leading-6 text-[#4B5563]">{item.message}</p>
            {item.suggestedActions.length > 0 && <ul className="mt-2 list-inside list-disc text-sm text-[#4B5563]">{item.suggestedActions.map((action) => <li key={action}>{action}</li>)}</ul>}
          </article>
        )) : <p className="text-sm leading-6 text-[#6B7280]">No rule-based observation is triggered by the metrics currently available.</p>}
        {data.unavailableObservationRuleIds.length > 0 && (
          <div className="flex gap-2 rounded-xl bg-[#F4F5F7] p-3 text-xs leading-5 text-[#6B7280]">
            <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <span>{data.unavailableObservationRuleIds.length} observation rules cannot run because their source metrics are not tracked yet.</span>
          </div>
        )}
      </div>
    </SpCard>
  );
}

function QuickLinks() {
  const links = [
    ['Complete or refresh your profile', '/dashboard/serviceprovider/profile'],
    ['Review your service catalogue', '/dashboard/serviceprovider/services'],
    ['Follow up on active proposals', '/dashboard/serviceprovider/leads?view=proposals'],
    ['Review available earnings', '/dashboard/serviceprovider/earnings?tab=activity'],
  ];
  return (
    <SpCard>
      <SpSectionHeader title="Quick links" description="Navigate to the source workspace to take action." />
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {links.map(([label, href]) => <li key={href}><Link href={href} className="inline-flex items-center gap-1 text-sm font-semibold text-[#374151] outline-none hover:text-[#0D9488] focus-visible:rounded focus-visible:ring-2 focus-visible:ring-[#3C61DD]">{label}<ArrowRight aria-hidden="true" className="size-4" /></Link></li>)}
      </ul>
    </SpCard>
  );
}

function ServicesView({ data }: { data: AnalyticsDashboard }) {
  return (
    <div className="space-y-6">
      <MetricGrid entries={[
        ['Completed work', data.overview.completedWork],
        ['Gross revenue', data.overview.grossRevenue],
        ['Net revenue', data.overview.netRevenue],
        ['Published services', data.profile.publishedServices],
      ]} />
      {data.services.length === 0 ? (
        <SpEmptyState icon={BriefcaseBusiness} title="No service analytics yet" description="Publish a service or complete custom brief-based work to populate this view." action={<Button asChild variant="outline"><Link href="/dashboard/serviceprovider/services">Open Service Catalog</Link></Button>} />
      ) : (
        <SpCard>
          <SpSectionHeader title="Service performance" description="Brief-based work without a ServiceId is grouped under Custom/Unattributed. Traffic metrics remain unavailable until dated view events exist." />
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead><tr className="border-b border-[#E5E7EB] text-xs uppercase tracking-wide text-[#6B7280]"><th className="pb-3 pr-4">Service</th><th className="pb-3 pr-4">Status</th><th className="pb-3 pr-4">Orders</th><th className="pb-3 pr-4">Gross</th><th className="pb-3 pr-4">Net</th><th className="pb-3 pr-4">Avg sale</th><th className="pb-3 pr-4">Completion</th><th className="pb-3 pr-4">On time</th><th className="pb-3">Traffic</th></tr></thead>
              <tbody>{data.services.map((service) => (
                <tr key={service.serviceId ?? 'custom'} className="border-b border-[#E5E7EB] last:border-0">
                  <td className="py-4 pr-4"><p className="font-semibold text-[#171717]">{service.title}</p><p className="mt-1 text-xs text-[#6B7280]">{service.category}</p></td>
                  <td className="pr-4"><SpStatusBadge tone={service.status === 'Published' ? 'positive' : 'neutral'}>{words(service.status)}</SpStatusBadge></td>
                  <MetricCell metric={service.orders} /><MetricCell metric={service.grossRevenue} /><MetricCell metric={service.netRevenue} /><MetricCell metric={service.averageSellingPrice} /><MetricCell metric={service.orderCompletionRate} /><MetricCell metric={service.onTimeDeliveryRate} />
                  <td><NotTrackedInline metric={service.serviceViews} /></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </SpCard>
      )}
      <TrackingGaps title="Service metrics not tracked yet" metrics={[
        ['Impressions', data.services[0]?.impressions],
        ['Clicks', data.services[0]?.serviceViews],
        ['Click-through rate', data.services[0]?.clickThroughRate],
        ['Enquiries', data.services[0]?.enquiries],
        ['Date-filtered conversion', data.services[0]?.conversionRate],
        ['Cancellation rate', data.services[0]?.cancellationRate],
      ]} fallback="Date-stamped service traffic, enquiry, and cancellation events do not exist upstream yet." />
    </div>
  );
}

function ProposalsView({ data }: { data: AnalyticsDashboard }) {
  const proposal = data.proposals;
  return (
    <div className="space-y-6">
      <MetricGrid entries={[
        ['Submitted', proposal.submitted], ['Accepted', proposal.accepted],
        ['Acceptance rate', proposal.acceptanceRate], ['Average value', proposal.averageProposalValue],
      ]} />
      <SpCard>
        <SpSectionHeader title="Proposal pipeline" description="Each status count is the proposal's current state within the selected submitted cohort. Drafts use their creation date because they have no submission timestamp." action={<Button asChild variant="outline"><Link href="/dashboard/serviceprovider/leads?view=proposals">Open Pipeline</Link></Button>} />
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[
            ['Draft', proposal.drafts], ['Submitted', proposal.submitted], ['Viewed', proposal.viewed],
            ['Changes requested', proposal.changesRequested], ['Revised', proposal.revised],
            ['Client reviewing', proposal.clientReviewing], ['Accepted', proposal.accepted],
            ['Declined', proposal.declined], ['Withdrawn', proposal.withdrawn], ['Expired', proposal.expired],
            ['Converted to project', proposal.convertedToProject],
          ].map(([label, metric]) => <MetricTile key={label as string} label={label as string} metric={metric as AnalyticsMetric} />)}
        </div>
      </SpCard>
      <TrackingGaps title="Proposal metrics not tracked yet" metrics={[
        ['Proposal view rate', proposal.proposalViewRate],
        ['Client response rate', proposal.clientResponseRate],
      ]} />
    </div>
  );
}

function ProfileView({ data }: { data: AnalyticsDashboard }) {
  const profile = data.profile;
  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SpMetricCard label="Trust score" icon={ShieldCheck} value={metricText(profile.trustScore)} detail={profile.trustScore.state === 'available' ? 'Calculated from qualifying signals' : profile.trustScore.reason} />
        <SpMetricCard label="Profile completion" icon={CheckCircle2} value={metricText(profile.profileCompleteness)} detail="Required public profile fields" />
        <SpMetricCard label="Verification" icon={ShieldCheck} value={words(profile.verificationStatus)} detail="Provider profile status" />
        <SpMetricCard label="Tier" icon={TrendingUp} value={`Tier ${profile.tierLevel}`} detail={profile.tierMeaning} />
      </section>
      <SpCard>
        <SpSectionHeader title="Trust breakdown" description="The existing Trust calculation is shown read-only. Signals without data are excluded from the score." action={<Button asChild variant="outline"><Link href="/dashboard/serviceprovider/profile?view=trust">Open Trust details</Link></Button>} />
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {profile.trustSignals.map((signal) => (
            <div key={signal.key} className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-4">
              <div className="flex items-center justify-between gap-3"><h3 className="text-sm font-semibold text-[#171717]">{signal.label}</h3><span className="text-xs text-[#6B7280]">{number(signal.weight)}% weight</span></div>
              <p className="mt-3 text-2xl font-semibold text-[#171717]">{signal.hasData && signal.value != null ? `${number(signal.value)} / 100` : 'Not enough activity'}</p>
            </div>
          ))}
          <MetricTile label="Dispute penalty" metric={profile.disputePenalty} />
        </div>
      </SpCard>
      <MetricGrid entries={[
        ['Skills tests taken', profile.skillsTestsTaken], ['Skills tests passed', profile.skillsTestsPassed],
        ['Latest test score', profile.latestSkillsTestScore], ['Portfolio items', profile.portfolioItems],
        ['Published services', profile.publishedServices],
      ]} />
      <TrackingGaps title="Profile metrics not tracked yet" metrics={[
        ['Profile views', profile.profileViews], ['Search appearances', profile.searchAppearances],
        ['Portfolio views', profile.portfolioViews], ['Profile saves', profile.profileSaves],
        ['Contact rate', profile.contactRate], ['Portfolio engagement', profile.portfolioEngagement],
      ]} />
    </div>
  );
}

function EarningsView({ data }: { data: AnalyticsDashboard }) {
  const revenue = data.revenue;
  return (
    <div className="space-y-6">
      <MetricGrid entries={[
        ['Gross earnings', revenue.gross], ['Platform commission', revenue.commission],
        ['Net earnings', revenue.net], ['Average engagement', revenue.averageProjectValue],
        ['Available balance', revenue.availableBalance], ['Pending balance', revenue.pendingBalance],
        ['Protected funding', revenue.protectedEscrow], ['Withdrawn', revenue.withdrawn],
      ]} />
      <SpCard className="border-l-4 border-l-[#0D9488]">
        <div className="flex gap-3"><Info aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-[#0D9488]" /><p className="text-sm leading-6 text-[#4B5563]">All gross, commission, and net values come from server-created financial records. This screen performs no commission calculation. Payment movement is currently gateway-stub backed; protected funding is not earned income.</p></div>
      </SpCard>
      <div className="grid gap-6 xl:grid-cols-2">
        <Breakdown title="By service" rows={revenue.byService} currency={data.currency} />
        <Breakdown title="By month" rows={revenue.byMonth} currency={data.currency} />
        <Breakdown title="By category" rows={revenue.byCategory} currency={data.currency} />
        <Breakdown title="By client" rows={revenue.byClient} currency={data.currency} />
      </div>
      <div><Button asChild variant="outline"><Link href="/dashboard/serviceprovider/earnings?tab=activity">Open Earnings & Payouts<ArrowRight aria-hidden="true" className="ml-2 size-4" /></Link></Button></div>
    </div>
  );
}

function ClientsView({ data }: { data: AnalyticsDashboard }) {
  const clients = data.clients;
  return (
    <div className="space-y-6">
      <MetricGrid entries={[
        ['Clients this period', clients.totalClients], ['New clients', clients.newClients],
        ['Returning clients', clients.returningClients], ['Repeat clients', clients.repeatClients],
        ['Repeat-client rate', clients.repeatClientRate], ['Completed engagements', clients.completedEngagements],
        ['On-time delivery', clients.onTimeDeliveryRate], ['Average engagement value', clients.averageClientLifetimeValue],
      ]} />
      <SpCard>
        <SpSectionHeader title="Client satisfaction" description="Verified reviews submitted during the selected period." />
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricTile label="Overall rating" metric={clients.averageClientRating} />
          <MetricTile label="Quality" metric={clients.averageQualityRating} />
          <MetricTile label="Communication" metric={clients.averageCommunicationRating} />
          <MetricTile label="Delivery" metric={clients.averageDeliveryRating} />
          <MetricTile label="Verified reviews" metric={clients.reviewCount} />
        </div>
      </SpCard>
      <SpCard>
        <SpSectionHeader title="Disputes" description="Counts use the stored dispute-opened timestamp and recorded resolution outcome." />
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <MetricTile label="Opened" metric={clients.disputesOpened} />
          <MetricTile label="Resolved" metric={clients.disputesResolved} />
          <MetricTile label="Client-favoured" metric={clients.adverseDisputes} />
        </div>
      </SpCard>
      <SpCard>
        <SpSectionHeader title="Most active clients" description="Identifiers are masked by the API; no client identity is inferred in the browser." />
        {clients.mostActiveClients.length ? (
          <ul className="mt-4 divide-y divide-[#E5E7EB]">{clients.mostActiveClients.map((client) => (
            <li key={client.clientId} className="flex flex-col justify-between gap-1 py-3 text-sm sm:flex-row sm:items-center"><span className="font-semibold text-[#171717]">{client.clientId}</span><span className="text-[#6B7280]">{client.completedProjects} completed · {money(client.netRevenue, data.currency)} net</span></li>
          ))}</ul>
        ) : <p className="mt-4 text-sm text-[#6B7280]">No completed client relationships exist in this period.</p>}
      </SpCard>
    </div>
  );
}

function GrowthTasks({ tasks, loading }: { tasks: GrowthTask[]; loading: boolean }) {
  const create = useCreateGrowthTask();
  const update = useUpdateGrowthTaskStatus();
  const [form, setForm] = useState<CreateGrowthTaskPayload>({ taskType: 'General', title: '', description: '' });

  function submit(event: FormEvent) {
    event.preventDefault();
    create.mutate(form, { onSuccess: () => setForm({ taskType: 'General', title: '', description: '' }) });
  }

  return (
    <SpCard aria-labelledby="growth-tasks-title">
      <SpSectionHeader title="Manual growth tasks" description="Only you create and update these tasks. Observations never persist tasks automatically." />
      <div id="growth-tasks-title" className="mt-5 space-y-5">
        {loading ? <Skeleton className="h-24 w-full rounded-xl" /> : tasks.length ? (
          <ul className="space-y-2">{tasks.map((task) => (
            <li key={task.id} className="rounded-xl border border-[#E5E7EB] p-3">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div><p className="text-sm font-semibold text-[#171717]">{task.title}</p><p className="mt-1 text-xs leading-5 text-[#6B7280]">{task.description}</p></div>
                <SpStatusBadge tone={task.status === 'Completed' ? 'positive' : 'neutral'}>{words(task.status)}</SpStatusBadge>
              </div>
              {['Open', 'InProgress'].includes(task.status) && <div className="mt-3 flex flex-wrap gap-2">{task.status === 'Open' && <Button size="sm" variant="outline" disabled={update.isPending} onClick={() => update.mutate({ id: task.id, status: 'InProgress' })}>Start</Button>}<Button size="sm" variant="outline" disabled={update.isPending} onClick={() => update.mutate({ id: task.id, status: 'Completed' })}>Mark complete</Button><Button size="sm" variant="outline" disabled={update.isPending} onClick={() => update.mutate({ id: task.id, status: 'Dismissed' })}>Dismiss</Button></div>}
            </li>
          ))}</ul>
        ) : <SpEmptyState className="min-h-40" icon={ClipboardList} title="No manual tasks" description="Create a task when you decide an observation needs follow-up." />}

        <form className="space-y-3 border-t border-[#E5E7EB] pt-5" onSubmit={submit}>
          <h3 className="font-heading text-sm font-semibold text-[#171717]">Add a task</h3>
          <label className="block text-sm font-semibold text-[#374151]" htmlFor="growth-task-title">Title</label>
          <Input id="growth-task-title" required maxLength={160} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          <label className="block text-sm font-semibold text-[#374151]" htmlFor="growth-task-description">Description</label>
          <Input id="growth-task-description" required maxLength={500} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          {create.isError && <p role="alert" className="text-sm text-[#B42318]">The task could not be created. Try again.</p>}
          {create.isSuccess && <p role="status" className="text-sm text-[#157A55]">Task created.</p>}
          {update.isError && <p role="alert" className="text-sm text-[#B42318]">The task status could not be updated.</p>}
          <Button type="submit" variant="outline" disabled={create.isPending || !form.title.trim() || !form.description.trim()}><Plus aria-hidden="true" className="mr-2 size-4" />Add task</Button>
        </form>
      </div>
    </SpCard>
  );
}

function MetricGrid({ entries }: { entries: [string, AnalyticsMetric][] }) {
  return <section aria-label="Key metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{entries.map(([label, metric]) => <SpMetricCard key={label} label={label} value={metricText(metric)} detail={<Trend metric={metric} />} />)}</section>;
}

function MetricTile({ label, metric }: { label: string; metric: AnalyticsMetric }) {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#6B7280]">{label}</p>
      {metric.state === 'available' ? <><p className="mt-2 text-xl font-semibold text-[#171717]">{metricText(metric)}</p><div className="mt-1"><Trend metric={metric} /></div></> : <><p className="mt-2 text-sm font-semibold text-[#4B5563]">{stateLabel(metric)}</p><p className="mt-1 text-xs leading-5 text-[#6B7280]">{metric.reason}</p></>}
    </div>
  );
}

function TrackingGaps({ title, metrics, fallback }: { title: string; metrics: [string, AnalyticsMetric | undefined][]; fallback?: string }) {
  const gaps = metrics.filter((entry): entry is [string, AnalyticsMetric] => !!entry[1] && entry[1].state !== 'available');
  if (!gaps.length && !fallback) return null;
  return (
    <SpCard className="border-l-4 border-l-warning">
      <SpSectionHeader title={title} description="These are honest upstream data gaps, not zero-valued performance." />
      <ul className="mt-4 space-y-3">{gaps.map(([label, metric]) => <li key={label} className="flex gap-3 text-sm leading-6"><Eye aria-hidden="true" className="mt-1 size-4 shrink-0 text-warning" /><span><strong className="font-semibold text-[#374151]">{label}:</strong> <span className="text-[#6B7280]">{metric.reason}</span></span></li>)}</ul>
      {!gaps.length && fallback && <p className="mt-4 text-sm leading-6 text-[#6B7280]">{fallback}</p>}
    </SpCard>
  );
}

function Breakdown({ title, rows, currency }: { title: string; rows: AnalyticsBreakdown[]; currency: string }) {
  return (
    <SpCard>
      <SpSectionHeader title={title} />
      {rows.length ? <ul className="mt-4 divide-y divide-[#E5E7EB]">{rows.map((row) => <li key={row.key} className="flex items-center justify-between gap-4 py-3 text-sm"><span className="min-w-0 truncate font-medium text-[#374151]">{row.label}</span><span className="shrink-0 font-semibold text-[#171717]">{money(row.net, currency)} net</span></li>)}</ul> : <p className="mt-4 text-sm text-[#6B7280]">No released revenue exists in this period.</p>}
    </SpCard>
  );
}

function Trend({ metric }: { metric: AnalyticsMetric }) {
  if (metric.state !== 'available') return <span className="text-xs text-[#6B7280]">{stateLabel(metric)}</span>;
  if (metric.changePercentage == null) return <span className="text-xs text-[#6B7280]">No comparable prior value</span>;
  const positive = metric.changePercentage >= 0;
  const Icon = positive ? ArrowUpRight : ArrowDownRight;
  return <span className={`inline-flex items-center gap-1 text-xs font-semibold ${positive ? 'text-[#157A55]' : 'text-[#965F11]'}`}><Icon aria-hidden="true" className="size-3.5" />{positive ? '+' : ''}{number(metric.changePercentage)}%<span className="sr-only">{positive ? 'increase' : 'decrease'} compared with the previous period</span></span>;
}

function MetricCell({ metric }: { metric: AnalyticsMetric }) {
  return <td className="pr-4 font-medium text-[#374151]">{metric.state === 'available' ? metricText(metric) : <NotTrackedInline metric={metric} />}</td>;
}

function NotTrackedInline({ metric }: { metric: AnalyticsMetric }) {
  return <span title={metric.reason ?? undefined} className="text-xs text-[#6B7280]">{stateLabel(metric)}</span>;
}

function SelectControl({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }) {
  return <select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-lg border border-[#D1D5DB] bg-white px-3 text-sm font-medium text-[#374151] outline-none focus-visible:ring-2 focus-visible:ring-[#3C61DD]">{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>;
}

function DateControl({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const id = `analytics-${label.toLowerCase()}`;
  return <div className="space-y-2"><label htmlFor={id} className="text-sm font-semibold text-[#374151]">{label}</label><Input id={id} type="date" value={value} onChange={(event) => onChange(event.target.value)} className="w-full sm:w-44" /></div>;
}

function analyticsHref(view: AnalyticsView, current: URLSearchParams) {
  const params = new URLSearchParams(current.toString());
  if (view === 'overview') params.delete('view'); else params.set('view', view);
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

function toView(value: string | null): AnalyticsView {
  if (value === 'services' || value === 'proposals' || value === 'profile' || value === 'earnings' || value === 'clients') return value;
  return 'overview';
}

function metricText(metric: AnalyticsMetric) {
  if (metric.state !== 'available' || metric.value == null) return stateLabel(metric);
  return formatValue(metric.value, metric.unit);
}

function stateLabel(metric: AnalyticsMetric) {
  return metric.state === 'notTracked' ? 'Not tracked yet' : 'Not enough activity';
}

function formatValue(value: number, unit: string) {
  if (unit.length === 3 && unit === unit.toUpperCase()) return money(value, unit);
  if (unit === 'percent') return `${number(value)}%`;
  if (unit === 'days') return `${number(value)} days`;
  if (unit === 'rating') return `${number(value)} / 5`;
  if (unit === 'projects') return `${number(value)} projects`;
  if (unit === 'score') return `${number(value)} / 100`;
  if (unit === 'points') return `${number(value)} pts`;
  return integer(value);
}

function money(value: number, currency: string) {
  try { return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value); }
  catch { return `${currency} ${value.toFixed(2)}`; }
}

function unique(values: string[]) { return [...new Set(values.filter(Boolean))]; }
function integer(value: number) { return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value); }
function number(value: number) { return new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value); }
function date(value: string) { return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value)); }
function words(value: string) { return value.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' '); }
