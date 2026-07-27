'use client';

import Link from 'next/link';
import { FormEvent, useMemo, useState } from 'react';
import { BarChart3, CheckCircle2, ClipboardList, EyeOff, Plus, TrendingUp, Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import EmptyState from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCreateGrowthTask, useGrowthTasks, useProviderAnalytics, useUpdateGrowthTaskStatus } from '@/hooks/queries/analytics';
import type { AnalyticsBreakdown, AnalyticsMetric, CreateGrowthTaskPayload } from '@/types/analytics';

const rangeOptions = [
  ['Last7Days', 'Last 7 days'], ['Last30Days', 'Last 30 days'], ['Last90Days', 'Last 90 days'],
  ['ThisYear', 'This year'], ['PreviousYear', 'Previous year'], ['Custom', 'Custom range'],
];

export function AnalyticsWorkspace() {
  const [range, setRange] = useState('Last30Days');
  const [currency, setCurrency] = useState('EUR');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const filters = useMemo(() => ({ range, currency, ...(range === 'Custom' && from && to ? { from, to } : {}) }), [range, currency, from, to]);
  const analytics = useProviderAnalytics(filters);
  const tasks = useGrowthTasks();

  if (analytics.isLoading) return <Skeleton className="h-[34rem] w-full rounded-xl" />;
  if (analytics.isError || !analytics.data) return <p className="text-sm text-destructive">Couldn&apos;t load analytics. Check the selected range and try again.</p>;
  const data = analytics.data;

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

    <Tabs defaultValue="services">
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
