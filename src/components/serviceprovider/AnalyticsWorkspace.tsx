'use client';

// Remaining hardcoded hex on this file is deliberate, not an oversight: those values
// have no exact token equivalent. See the PENDING DESIGN-TOKEN DECISION note in
// src/app/globals.css (below the .sp-workspace block) for the full list and why.
import Link from 'next/link';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
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
// money/words come from the shared SP helpers rather than local copies, matching
// EarningsWorkspace. Two deliberate behaviour changes, both checked rather than assumed:
//
//   money  — the shared version pins maximumFractionDigits: 2. Reachable here: the
//            analytics currency is a real user-selectable dropdown fed by
//            AvailableCurrencies, so a zero-decimal currency (JPY) or three-decimal one
//            (KWD) will now render with 2 decimals instead of its locale convention.
//            Consistent with every other SP money figure, which is the point.
//
//   words  — the local copy also replaced underscores with spaces; the shared one does
//            not (it guards null instead, which the local copy did not). Verified this
//            loses nothing TODAY: the only values reaching words() here are
//            profile.verificationStatus, service.status and task.status, whose sources
//            are ServiceProviderVerificationStatus, CatalogStatus and GrowthTaskStatus
//            (13 members, no underscores) plus the literals "Custom", "Historical" and
//            "Unattributed". If a snake_case value ever reaches this file, it will render
//            with the underscore visible — that is a known trade, not an oversight.
import { money, words } from '@/components/serviceprovider/workroom/_shared';
import type {
  AnalyticsBreakdown, AnalyticsDashboard, AnalyticsMetric, CreateGrowthTaskPayload,
  GrowthTask, ProfileFunnel, ServiceAnalytics, TopService,
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

      <p className="text-xs leading-5 text-muted-foreground">
        {date(data.period.from)}–{date(data.period.to)} compared with {date(data.period.comparisonFrom)}–{date(data.period.comparisonTo)}. Financial values are scoped to {data.currency}.
      </p>

      {view === 'overview' && <Overview data={data} tasks={tasks.data ?? []} tasksLoading={tasks.isLoading} />}
      {view === 'services' && <ServicesView data={data} />}
      {view === 'proposals' && <ProposalsView data={data} />}
      {view === 'profile' && <ProfileView data={data} />}
      {view === 'earnings' && <EarningsView data={data} />}
      {view === 'clients' && <ClientsView data={data} />}

      <aside className="rounded-xl border border-dashed border-input bg-white px-4 py-3 text-xs leading-5 text-muted-foreground">
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
      <section aria-label="Analytics overview" className="grid gap-4 lg:grid-cols-3">
        <HeadlineCard
          icon={ShieldCheck}
          label="Profile"
          headline={data.profile.trustScore}
          detailLabel="Profile completion"
          detail={data.profile.profileCompleteness}
          linkLabel="View Profile Analytics"
          href="/dashboard/serviceprovider/profile?view=trust"
        />
        <HeadlineCard
          icon={Wallet}
          label="Earnings"
          headline={data.revenue.net}
          detailLabel="Average project value"
          detail={data.revenue.averageProjectValue}
          linkLabel="View Earnings Overview"
          href="/dashboard/serviceprovider/earnings?tab=activity"
        />
        <HeadlineCard
          icon={Users}
          label="Clients"
          headline={data.clients.repeatClientRate}
          detailLabel="Average rating"
          detail={data.clients.averageClientRating}
          linkLabel="View Client Insights"
          href={`${basePath}?view=clients`}
        />
      </section>

      <TrendChart data={data} />

      <GrowthTasks tasks={tasks} loading={tasksLoading} />
    </div>
  );
}

/**
 * Briefs shown -> proposals sent -> hired, with the conversion rate between each pair.
 *
 * Three steps because three are real. Anything upstream of "a brief was surfaced to me"
 * (profile views, search appearances) has no data source on this platform, so a wider
 * funnel could only be padded with invented stages.
 *
 * The rates are rendered as their own step between the counts rather than as a caption,
 * because the drop between stages is the thing worth reading. A rate with no denominator
 * shows its state instead of 0% — nothing entered that step, which is not the same as
 * nothing converting.
 *
 * REASON HANDLING, resolving the contradiction an audit found with MetricTile's rule that
 * "a tile that lost its inline reason would simply stop explaining itself":
 *
 *   Step cards follow MetricTile exactly — state label plus the reason inline. They are
 *   shaped like tiles and have the room, and this funnel has no TrackingGaps sibling to
 *   defer explanation to.
 *
 *   Rate chips deviate deliberately. A pill between two cards cannot carry a paragraph
 *   without becoming the widest thing in the row. The state label stays VISIBLE, and the
 *   reason reaches both pointer users (title) and assistive tech (sr-only) — so it is not
 *   hover-only, which was the actual defect. That is the narrowest deviation that keeps
 *   the layout, not a silent drop.
 */
export function ProfileFunnelSection({ funnel }: { funnel: ProfileFunnel }) {
  const steps = [
    { label: 'Briefs shown', metric: funnel.briefsShown, icon: Eye },
    { label: 'Proposals sent', metric: funnel.proposalsSent, icon: Send },
    { label: 'Hired', metric: funnel.hired, icon: CheckCircle2 },
  ];
  const rates = [funnel.proposalRate, funnel.hireRate];

  return (
    <SpCard aria-labelledby="funnel-title">
      <SpSectionHeader
        titleId="funnel-title"
        title="From brief to hire"
        description="Every step is counted within the selected period. Rates compare each step with the one before it."
      />
      <ol className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-stretch">
        {steps.map((step, index) => (
          <li key={step.label} className="flex flex-1 flex-col gap-3 lg:flex-row lg:items-center">
            <div className="flex-1 rounded-xl border border-border bg-[#F9FAFB] p-4">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                <step.icon aria-hidden="true" className="size-4" />
                {step.label}
              </p>
              {step.metric.state === 'available' ? (
                <p className="mt-2 text-2xl font-semibold text-foreground">{metricText(step.metric)}</p>
              ) : (
                <>
                  <p className="mt-2 text-sm font-semibold text-[#4B5563]">{stateLabel(step.metric)}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{step.metric.reason}</p>
                </>
              )}
            </div>
            {index < rates.length && (
              <div className="flex items-center justify-center px-1 text-xs font-semibold text-muted-foreground">
                <span className="rounded-full bg-muted px-2 py-1" title={rates[index].reason ?? undefined}>
                  {rates[index].state === 'available' ? metricText(rates[index]) : stateLabel(rates[index])}
                  {rates[index].state !== 'available' && rates[index].reason && (
                    <span className="sr-only"> — {rates[index].reason}</span>
                  )}
                </span>
              </div>
            )}
          </li>
        ))}
      </ol>
    </SpCard>
  );
}

/**
 * The provider's listings ranked by clicks in the period. Services only — no portfolio or
 * case-study rows, because neither has any tracked engagement to rank.
 *
 * Reuses the "Most active clients" list shape rather than inventing a second ranked-list
 * treatment on the same page.
 */
export function TopServicesSection({ services }: { services: TopService[] }) {
  return (
    <SpCard aria-labelledby="top-services-title">
      <SpSectionHeader
        titleId="top-services-title"
        title="Top performing services"
        description="Ranked by clicks in the selected period. Impressions are shown for context — a listing seen often but rarely clicked is not performing well."
      />
      {services.length ? (
        <ul className="mt-4 divide-y divide-border">
          {services.map((service) => (
            <li key={service.serviceId} className="flex flex-col justify-between gap-1 py-3 text-sm sm:flex-row sm:items-center">
              <span className="font-semibold text-foreground">{service.title}</span>
              <span className="text-muted-foreground">
                <span className="font-semibold text-foreground">{integer(service.clicks)}</span>
                {service.clicks === 1 ? ' click' : ' clicks'} · {integer(service.impressions)} impressions
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          No listing received a click in this period. Rankings appear once visitors start interacting with your services.
        </p>
      )}
    </SpCard>
  );
}

/**
 * One of the three Overview headline cards: a prominent metric, a supporting one, and a
 * link to the workspace that owns the subject.
 *
 * Prominence does not buy an exemption from the honest-state discipline. When a metric is
 * unavailable the card shows its state and the server's reason instead of the number —
 * "Trust score appears after the first qualifying trust signal" rather than a zero or a
 * dash. That reason is exactly the "building your trust score" framing the rest of the SP
 * surface uses, so it is read from the response instead of being restated here and left
 * to drift.
 */
export function HeadlineCard({
  icon: Icon, label, headline, detailLabel, detail, linkLabel, href,
}: {
  icon: typeof ShieldCheck;
  label: string;
  headline: AnalyticsMetric;
  detailLabel: string;
  detail: AnalyticsMetric;
  linkLabel: string;
  href: string;
}) {
  const available = headline.state === 'available';
  return (
    <SpCard>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        <Icon aria-hidden="true" className="size-4" />
        {label}
      </div>

      {available ? (
        <>
          <p className="mt-3 text-3xl font-semibold text-foreground">{metricText(headline)}</p>
          <div className="mt-1"><Trend metric={headline} /></div>
        </>
      ) : (
        <>
          <p className="mt-3 text-lg font-semibold text-[#4B5563]">{stateLabel(headline)}</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{headline.reason}</p>
        </>
      )}

      <p className="mt-4 border-t border-border pt-3 text-sm text-muted-foreground">
        {detailLabel}{' '}
        <span className="font-semibold text-foreground">
          {detail.state === 'available' ? metricText(detail) : stateLabel(detail)}
        </span>
      </p>

      <Link
        href={href}
        className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary outline-none hover:underline focus-visible:rounded focus-visible:ring-2 focus-visible:ring-ring"
      >
        {linkLabel}
        <ArrowRight aria-hidden="true" className="size-4" />
      </Link>
    </SpCard>
  );
}

/**
 * Earnings and average rating over the selected period.
 *
 * Two series on one chart with two axes, because they share a time axis and nothing else:
 * earnings are currency on an open-ended scale, ratings are 1-5. A single axis would
 * flatten the rating line into the baseline.
 *
 * Bucket width is the server's decision (day / week / month, chosen from the span), so the
 * heading reports which one is in use rather than assuming weeks. Recharts is already the
 * charting library on the SP surface — see the impressions/clicks chart in
 * ServicesWorkspace — so this reuses it rather than introducing a second one.
 *
 * A rating gap is a real gap: averageRating is null for a bucket with no reviews, and
 * connectNulls is deliberately off so the line breaks instead of implying a rating that
 * was never given.
 */
export function TrendChart({ data }: { data: AnalyticsDashboard }) {
  const points = data.trend ?? [];
  const hasEarnings = points.some((point) => point.netEarnings > 0);
  const hasRatings = points.some((point) => point.averageRating != null);
  const granularity = data.trendGranularity === 'month' ? 'Monthly' : data.trendGranularity === 'day' ? 'Daily' : 'Weekly';

  return (
    <SpCard aria-labelledby="trend-title">
      <SpSectionHeader
        titleId="trend-title"
        title={`${granularity} trend`}
        description="Net earnings released and the average rating of reviews submitted, bucketed across the selected period."
      />
      {!points.length || (!hasEarnings && !hasRatings) ? (
        <SpEmptyState
          className="mt-5 border-0 bg-[#F9FAFB]"
          icon={BarChart3}
          title="No activity in this period"
          description="Released payments and submitted reviews appear here once the first one lands in the selected range."
        />
      ) : (
        <div className="mt-5">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={points}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="earnings" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="rating" orientation="right" domain={[0, 5]} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line yAxisId="earnings" type="monotone" dataKey="netEarnings" name={`Net earnings (${data.currency})`} stroke="#3C61DD" dot={false} />
              <Line yAxisId="rating" type="monotone" dataKey="averageRating" name="Average rating" stroke="#0D9488" strokeDasharray="5 5" connectNulls={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
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
          <SpSectionHeader title="Service performance" description="Impressions, clicks and conversion come from dated traffic events per listing. Brief-based work without a ServiceId is grouped under Custom/Unattributed and has no listing to measure, so its funnel columns stay untracked." />
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[1280px] text-left text-sm">
              <thead><tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground"><th className="pb-3 pr-4">Service</th><th className="pb-3 pr-4">Status</th><th className="pb-3 pr-4">Orders</th><th className="pb-3 pr-4">Gross</th><th className="pb-3 pr-4">Net</th><th className="pb-3 pr-4">Avg sale</th><th className="pb-3 pr-4">Completion</th><th className="pb-3 pr-4">On time</th><th className="pb-3 pr-4">Impressions</th><th className="pb-3 pr-4">Clicks</th><th className="pb-3">Conv.</th></tr></thead>
              <tbody>{data.services.map((service) => (
                <tr key={service.serviceId ?? 'custom'} className="border-b border-border last:border-0">
                  <td className="py-4 pr-4"><p className="font-semibold text-foreground">{service.title}</p><p className="mt-1 text-xs text-muted-foreground">{service.category}</p></td>
                  <td className="pr-4"><SpStatusBadge tone={service.status === 'Published' ? 'positive' : 'neutral'}>{words(service.status)}</SpStatusBadge></td>
                  <MetricCell metric={service.orders} /><MetricCell metric={service.grossRevenue} /><MetricCell metric={service.netRevenue} /><MetricCell metric={service.averageSellingPrice} /><MetricCell metric={service.orderCompletionRate} /><MetricCell metric={service.onTimeDeliveryRate} />
                  <MetricCell metric={service.impressions} /><ClicksCell service={service} /><MetricCell metric={service.conversionRate} />
                </tr>
              ))}</tbody>
            </table>
          </div>
        </SpCard>
      )}
      {/* Impressions, clicks, click-through and conversion used to be listed here as
          permanently untracked. They are now sourced per listing from AnalyticsDailyBuckets,
          so they belong to the row rather than to this panel — a Custom/Unattributed row
          still reports them as untracked in its own cells, because it has no ListingId to
          aggregate against.

          Only the two that remain structurally untracked for EVERY row are left. Sampling
          services[0] is sound for exactly that reason: these two never vary by row. */}
      <TrackingGapsNote metrics={[
        ['Enquiries', data.services[0]?.enquiries],
        ['Cancellation rate', data.services[0]?.cancellationRate],
      ]} />
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
      <TrackingGapsNote metrics={[
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
        {/* The link is attached here because removing the Trust breakdown card removed the
            only route from this tab to the Trust page — and the breakdown was only safe to
            remove BECAUSE that route existed. The per-signal detail and the skills test
            live there; this tab keeps the headline number and the way to reach them. */}
        <SpMetricCard
          label="Trust score"
          icon={ShieldCheck}
          value={metricText(profile.trustScore)}
          detail={
            <>
              <span className="block">
                {profile.trustScore.state === 'available' ? 'Calculated from qualifying signals' : profile.trustScore.reason}
              </span>
              <Link
                href="/dashboard/serviceprovider/profile?view=trust"
                className="mt-1 inline-flex items-center gap-1 font-semibold text-primary outline-none hover:underline focus-visible:rounded focus-visible:ring-2 focus-visible:ring-ring"
              >
                View Trust details
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </>
          }
        />
        <SpMetricCard label="Profile completion" icon={CheckCircle2} value={metricText(profile.profileCompleteness)} detail="Required public profile fields" />
        <SpMetricCard label="Verification" icon={ShieldCheck} value={words(profile.verificationStatus)} detail="Provider profile status" />
        <SpMetricCard label="Tier" icon={TrendingUp} value={`Tier ${profile.tierLevel}`} detail={profile.tierMeaning} />
      </section>
      <ProfileFunnelSection funnel={profile.funnel} />

      <TopServicesSection services={profile.topServices} />

      <MetricGrid entries={[
        ['Skills tests taken', profile.skillsTestsTaken], ['Skills tests passed', profile.skillsTestsPassed],
        ['Latest test score', profile.latestSkillsTestScore], ['Portfolio items', profile.portfolioItems],
      ]} />
      <TrackingGapsNote metrics={[
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
          <ul className="mt-4 divide-y divide-border">{clients.mostActiveClients.map((client) => (
            <li key={client.clientId} className="flex flex-col justify-between gap-1 py-3 text-sm sm:flex-row sm:items-center"><span className="font-semibold text-foreground">{client.clientId}</span><span className="text-muted-foreground">{client.completedProjects} completed · {money(client.netRevenue, data.currency)} net</span></li>
          ))}</ul>
        ) : <p className="mt-4 text-sm text-muted-foreground">No completed client relationships exist in this period.</p>}
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
      <SpSectionHeader title="Quick wins" description="Your own checklist. Every task here is one you created — nothing on this page generates them for you." />
      <div id="growth-tasks-title" className="mt-5 space-y-5">
        {loading ? <Skeleton className="h-24 w-full rounded-xl" /> : tasks.length ? (
          <ul className="space-y-2">{tasks.map((task) => (
            <li key={task.id} className="rounded-xl border border-border p-3">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div><p className="text-sm font-semibold text-foreground">{task.title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{task.description}</p></div>
                <SpStatusBadge tone={task.status === 'Completed' ? 'positive' : 'neutral'}>{words(task.status)}</SpStatusBadge>
              </div>
              {['Open', 'InProgress'].includes(task.status) && <div className="mt-3 flex flex-wrap gap-2">{task.status === 'Open' && <Button size="sm" variant="outline" disabled={update.isPending} onClick={() => update.mutate({ id: task.id, status: 'InProgress' })}>Start</Button>}<Button size="sm" variant="outline" disabled={update.isPending} onClick={() => update.mutate({ id: task.id, status: 'Completed' })}>Mark complete</Button><Button size="sm" variant="outline" disabled={update.isPending} onClick={() => update.mutate({ id: task.id, status: 'Dismissed' })}>Dismiss</Button></div>}
            </li>
          ))}</ul>
        ) : <SpEmptyState className="min-h-40" icon={ClipboardList} title="No manual tasks" description="Create a task when you decide an observation needs follow-up." />}

        <form className="space-y-3 border-t border-border pt-5" onSubmit={submit}>
          <h3 className="font-heading text-sm font-semibold text-foreground">Add a task</h3>
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

/**
 * The tab's headline KPI row. Rendered with the shared SpMetricCard, always as the
 * top-level section of a view — never nested inside a card.
 *
 * Deliberately NOT the same component as MetricTile below, and the difference is
 * functional rather than stylistic: SpMetricCard shows only metricText(), so an
 * unavailable metric reads "Not tracked yet" / "Not enough activity" with NO reason.
 * That is fine here because every view using MetricGrid for a metric that can be
 * permanently untracked also renders a TrackingGaps panel, which is where those reasons
 * are explained at length.
 *
 * See the note on MetricTile before merging the two.
 */
function MetricGrid({ entries }: { entries: [string, AnalyticsMetric][] }) {
  return <section aria-label="Key metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{entries.map(([label, metric]) => <SpMetricCard key={label} label={label} value={metricText(metric)} detail={<Trend metric={metric} />} />)}</section>;
}

/**
 * A dense secondary metric, always nested inside an SpCard next to its siblings —
 * proposal-pipeline status counts, trust-signal breakdown, rating dimensions, dispute
 * counts.
 *
 * The load-bearing difference from MetricGrid: this renders metric.reason INLINE when the
 * metric is not available, because these metrics have nowhere else to explain themselves.
 * TrackingGaps carries a curated list of permanently-untracked metrics, and — verified
 * across all three views that render both — that list is always DISJOINT from whatever
 * the tiles show:
 *
 *   ProposalsView  tiles = 11 pipeline status counts;  gaps = view rate, response rate
 *   ProfileView    tile  = dispute penalty;            gaps = 6 profile-traffic metrics
 *   ServicesView   (no tiles)                          gaps = 6 service-traffic metrics
 *
 * So a tile's reason is never a duplicate of the panel's, and the panel never covers a
 * tile's metric. A tile that lost its inline reason would simply stop explaining itself.
 *
 * DO NOT naively merge these two into one component. Either outcome is a regression:
 * give the merged component an inline reason and ProposalsView/ProfileView print the
 * same explanation twice for metrics that ARE in TrackingGaps; take the reason away and
 * the tiles in ClientsView — which has no TrackingGaps sibling at all — silently drop it. If they ever are unified, the real prerequisite is
 * deciding where reasons belong, not extracting shared markup.
 */
function MetricTile({ label, metric }: { label: string; metric: AnalyticsMetric }) {
  return (
    <div className="rounded-xl border border-border bg-[#F9FAFB] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">{label}</p>
      {metric.state === 'available' ? <><p className="mt-2 text-xl font-semibold text-foreground">{metricText(metric)}</p><div className="mt-1"><Trend metric={metric} /></div></> : <><p className="mt-2 text-sm font-semibold text-[#4B5563]">{stateLabel(metric)}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{metric.reason}</p></>}
    </div>
  );
}

/**
 * A one-line note that N metrics are waiting on upstream tracking, with each reason on
 * hover.
 *
 * This replaced a bordered card listing every gap in full. That card rendered on every
 * visit and never changed: profile traffic needs a public browsing/search surface that
 * does not exist, and proposal view/response rates need durable event history that is not
 * recorded. Giving permanent, unactionable gaps the same visual weight as live results
 * trains people to skip the page furniture — the same reasoning that consolidated ten
 * STUB banners into one notice.
 *
 * The information is not removed, only de-emphasised: the count is visible and every
 * reason is still one hover away. Styled to match the "Data provenance" aside, which is
 * the established weight for a standing caveat on this page.
 */
export function TrackingGapsNote({ metrics }: { metrics: [string, AnalyticsMetric | undefined][] }) {
  const gaps = metrics.filter((entry): entry is [string, AnalyticsMetric] => !!entry[1] && entry[1].state !== 'available');
  if (!gaps.length) return null;
  return (
    <aside className="rounded-xl border border-dashed border-input bg-white px-4 py-3 text-xs leading-5 text-muted-foreground">
      <Eye aria-hidden="true" className="mr-1.5 inline size-3.5 align-[-2px]" />
      {gaps.length} {gaps.length === 1 ? 'metric awaits' : 'metrics await'} upstream tracking infrastructure:{' '}
      {gaps.map(([label, metric], index) => (
        <span key={label}>
          {index > 0 && ', '}
          <span title={metric.reason ?? undefined} className="underline decoration-dotted underline-offset-2">
            {label}
          </span>
        </span>
      ))}
      .
    </aside>
  );
}

function Breakdown({ title, rows, currency }: { title: string; rows: AnalyticsBreakdown[]; currency: string }) {
  return (
    <SpCard>
      <SpSectionHeader title={title} />
      {rows.length ? <ul className="mt-4 divide-y divide-border">{rows.map((row) => <li key={row.key} className="flex items-center justify-between gap-4 py-3 text-sm"><span className="min-w-0 truncate font-medium text-[#374151]">{row.label}</span><span className="shrink-0 font-semibold text-foreground">{money(row.net, currency)} net</span></li>)}</ul> : <p className="mt-4 text-sm text-muted-foreground">No released revenue exists in this period.</p>}
    </SpCard>
  );
}

function Trend({ metric }: { metric: AnalyticsMetric }) {
  if (metric.state !== 'available') return <span className="text-xs text-muted-foreground">{stateLabel(metric)}</span>;
  if (metric.changePercentage == null) return <span className="text-xs text-muted-foreground">No comparable prior value</span>;
  const positive = metric.changePercentage >= 0;
  const Icon = positive ? ArrowUpRight : ArrowDownRight;
  return <span className={`inline-flex items-center gap-1 text-xs font-semibold ${positive ? 'text-[#157A55]' : 'text-[#965F11]'}`}><Icon aria-hidden="true" className="size-3.5" />{positive ? '+' : ''}{number(metric.changePercentage)}%<span className="sr-only">{positive ? 'increase' : 'decrease'} compared with the previous period</span></span>;
}

/**
 * Clicks, with click-through rate as a muted second line. Exported for tests, matching
 * the precedent set by financialTaxForm in FinancialSettingsPanel.
 *
 * CTR gets no column of its own because it is derived from exactly the two columns either
 * side of it — impressions and clicks — so a third column would restate what the row
 * already shows, on a table that already scrolls horizontally.
 *
 * The sub-line is omitted rather than labelled when CTR is unavailable. That is not
 * hiding a gap: CTR is unavailable precisely when there are no impressions, and the
 * Impressions cell immediately to the left already says so. Printing "Not enough activity"
 * twice on one row would be noise, not honesty.
 */
export function ClicksCell({ service }: { service: ServiceAnalytics }) {
  const ctr = service.clickThroughRate;
  return (
    <td className="pr-4 font-medium text-[#374151]">
      {service.serviceViews.state === 'available' ? (
        <>
          {metricText(service.serviceViews)}
          {ctr.state === 'available' && (
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              ({metricText(ctr)} CTR)
            </span>
          )}
        </>
      ) : (
        <NotTrackedInline metric={service.serviceViews} />
      )}
    </td>
  );
}

export function MetricCell({ metric }: { metric: AnalyticsMetric }) {
  return <td className="pr-4 font-medium text-[#374151]">{metric.state === 'available' ? metricText(metric) : <NotTrackedInline metric={metric} />}</td>;
}

function NotTrackedInline({ metric }: { metric: AnalyticsMetric }) {
  return <span title={metric.reason ?? undefined} className="text-xs text-muted-foreground">{stateLabel(metric)}</span>;
}

function SelectControl({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }) {
  return <select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-lg border border-input bg-white px-3 text-sm font-medium text-[#374151] outline-none focus-visible:ring-2 focus-visible:ring-ring">{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>;
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

function unique(values: string[]) { return [...new Set(values.filter(Boolean))]; }
function integer(value: number) { return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value); }
function number(value: number) { return new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value); }
function date(value: string) { return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value)); }
