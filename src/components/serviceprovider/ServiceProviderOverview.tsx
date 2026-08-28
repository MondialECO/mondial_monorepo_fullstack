'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  BriefcaseBusiness,
  CheckCircle2,
  CircleDollarSign,
  FileCheck2,
  FolderKanban,
  MessageSquareText,
  Send,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useProviderOverview } from '@/hooks/queries/analytics';
import { useProviderAvailabilityControl } from '@/hooks/useProviderAvailabilityControl';
import type { ProviderDashboardActivity, ProviderDashboardAttention } from '@/types/analytics';

type Tone = 'blue' | 'green' | 'amber' | 'red' | 'slate';

export function ServiceProviderOverview() {
  const overview = useProviderOverview('EUR');
  const availability = useProviderAvailabilityControl(overview.data?.provider.availableNow ?? true);

  if (overview.isLoading) return <OverviewSkeleton />;
  if (overview.isError || !overview.data) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#F4F5F7] p-6">
        <div className="max-w-md rounded-[18px] border border-[#E5E7EB] bg-white p-8 text-center">
          <h1 className="font-heading text-xl font-semibold">Couldn&apos;t load your dashboard</h1>
          <p className="mt-2 text-sm text-[#6B7280]">Your data was not replaced with demo values. Try the overview request again.</p>
          <Button variant="outline" className="mt-5" onClick={() => overview.refetch()}>Try Again</Button>
        </div>
      </div>
    );
  }

  const data = overview.data;
  const available = availability.available;
  const firstName = data.provider.name.split(/\s+/)[0] || 'there';

  return (
    <div className="min-h-full text-[#171717]">
      <div className="mx-auto max-w-[1440px] space-y-7">
        <section className="rounded-[20px] bg-[#3C61DD] px-5 py-6 text-white sm:px-8 lg:px-10 lg:py-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-5">
              <Avatar className="size-16 border-4 border-white/25 sm:size-20">
                {data.provider.imagePath && <AvatarImage src={data.provider.imagePath} alt={data.provider.name} />}
                <AvatarFallback className="bg-white/15 font-heading text-xl font-semibold text-white">{data.provider.initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-[30px]">Welcome back, {firstName}!</h1>
                <p className="mt-2 text-sm text-white/80 sm:text-base">{welcomeSummary(data.metrics.newLeads, data.metrics.deliverablesDueToday)}</p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-medium">
                    <BadgeCheck className="size-3.5" /> {data.provider.verificationStatus}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-medium" title="Affects match priority, not pricing">
                    {data.provider.tierLabel}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={available}
                    disabled={!availability.canUpdate || availability.pending}
                    onClick={availability.toggle}
                    className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <span className={`size-2 rounded-full ${available ? 'bg-[#6EE7B7]' : 'bg-white/45'}`} />
                    {availability.pending ? 'Updating…' : available ? 'Available Now' : 'Unavailable'}
                  </button>
                </div>
              </div>
            </div>
            <Button asChild variant="outline" className="h-12 shrink-0 border-white bg-white px-7 text-[#3C61DD] hover:bg-white/90 hover:text-[#3C61DD]">
              <Link href="/dashboard/serviceprovider/profile">Edit Public Profile</Link>
            </Button>
          </div>
          {availability.feedback && (
            <p role={availability.feedback.status === 'error' ? 'alert' : 'status'} className="mt-4 rounded-lg border border-white/30 bg-white/10 px-3 py-2 text-sm text-white">
              {availability.feedback.message}
            </p>
          )}
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard icon={Banknote} tone="green" label="Available Balance" value={money(data.metrics.availableBalance, data.currency)} detail={`${money(data.metrics.pendingEscrow, data.currency)} Pending Payment`} />
          <MetricCard icon={FolderKanban} tone="blue" label="Active Projects" value={String(data.metrics.activeEngagements)} detail={`${data.metrics.deliverablesDueThisWeek} deliverables due this week`} />
          <MetricCard icon={BriefcaseBusiness} tone="amber" label="New Leads" value={String(data.metrics.newLeads)} detail={leadExpiry(data.metrics.nearestLeadExpiryAt, data.computedAt)} urgent={data.metrics.newLeads > 0} />
          <TrustMetricCard hasEnoughData={data.trust.hasEnoughData} score={data.trust.score} status={data.trust.status} />
        </section>

        <section className="grid gap-7 xl:grid-cols-[minmax(0,3fr)_minmax(380px,2fr)]">
          <div className="space-y-4">
            <SectionHeading>Requires Attention</SectionHeading>
            {data.attention.length ? (
              <div className="space-y-4">{data.attention.map((item) => <AttentionRow key={`${item.type}-${item.title}`} item={item} computedAt={data.computedAt} />)}</div>
            ) : (
              <div className="rounded-[18px] border border-[#E5E7EB] bg-white px-7 py-10 text-center text-sm text-[#6B7280]">You&apos;re all caught up.</div>
            )}
          </div>

          <div className="space-y-4">
            <SectionHeading>Last 30 Days</SectionHeading>
            <ServiceViewsCard state={data.serviceViews.state} impressions={data.serviceViews.impressions} clicks={data.serviceViews.clicks} reason={data.serviceViews.reason} />
          </div>
        </section>

        <section className="grid overflow-hidden rounded-[18px] border border-[#E5E7EB] bg-white sm:grid-cols-2 xl:grid-cols-4">
          <SummaryMetric label="Briefs Reviewed" value={String(data.last30Days.briefsReviewed)} />
          <SummaryMetric label="Proposals Sent" value={String(data.last30Days.proposalsSent)} />
          <SummaryMetric label="Deliverables Submitted" value={String(data.last30Days.deliverablesSubmitted)} />
          <SummaryMetric label="Avg. Response Time" value={responseTime(data.last30Days.averageResponseMinutes)} accent={data.last30Days.averageResponseState === 'available'} detail={data.last30Days.averageResponseReason} />
        </section>

        <section className="space-y-4">
          <SectionHeading>Recent Activity</SectionHeading>
          <div className="rounded-[18px] border border-[#E5E7EB] bg-white px-5 py-2 sm:px-7">
            {data.recentActivity.length ? data.recentActivity.map((item) => <ActivityRow key={`${item.type}-${item.occurredAt}-${item.text}`} item={item} computedAt={data.computedAt} />) : (
              <p className="py-10 text-center text-sm text-[#6B7280]">Your proposals, deliveries, approvals, payments, and portfolio updates will appear here.</p>
            )}
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <ProgressCard label="Profile Strength" state={data.profileStrength.state} value={data.profileStrength.value} detail={data.profileStrength.detail} color="#3C61DD" />
          <ProgressCard label="Tier Progress" state={data.tierProgress.state} value={data.tierProgress.value} detail={data.tierProgress.detail} color="#047857" />
        </section>
      </div>
    </div>
  );
}

function OverviewSkeleton() {
  return <div className="min-h-full space-y-6"><Skeleton className="h-48 rounded-[20px]" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-44 rounded-[18px]" />)}</div><div className="grid gap-6 xl:grid-cols-2"><Skeleton className="h-96 rounded-[18px]" /><Skeleton className="h-96 rounded-[18px]" /></div></div>;
}

function MetricCard({ icon: Icon, tone, label, value, detail, urgent = false }: { icon: LucideIcon; tone: Tone; label: string; value: string; detail: string; urgent?: boolean }) {
  return <div className="min-h-44 rounded-[18px] border border-[#E5E7EB] bg-white p-6"><div className="flex items-start justify-between gap-4"><p className="text-xs font-medium uppercase tracking-[0.13em] text-[#6B7280]">{label}</p><IconBubble icon={Icon} tone={tone} /></div><p className="mt-7 text-[30px] font-semibold tracking-tight">{value}</p><p className={`mt-2 text-sm ${urgent ? 'font-medium text-warning' : 'text-[#6B7280]'}`}>{detail}</p></div>;
}

function TrustMetricCard({ hasEnoughData, score, status }: { hasEnoughData: boolean; score?: number | null; status: string }) {
  return <div className="min-h-44 rounded-[18px] border border-[#E5E7EB] bg-white p-6"><div className="flex items-start justify-between gap-4"><p className="text-xs font-medium uppercase tracking-[0.13em] text-[#6B7280]">Trust Score</p><IconBubble icon={ShieldCheck} tone="slate" /></div><p className={`mt-7 text-[30px] font-semibold tracking-tight ${hasEnoughData ? '' : 'text-[#9CA3AF]'}`}>{hasEnoughData && score != null ? Math.round(score) : '—'}</p><p className={`mt-2 text-sm ${hasEnoughData ? 'font-medium text-[#047857]' : 'text-[#6B7280]'}`}>{hasEnoughData ? `Status: ${status}` : status}</p></div>;
}

function SectionHeading({ children }: { children: React.ReactNode }) { return <h2 className="font-heading text-lg font-semibold tracking-tight">{children}</h2>; }

function AttentionRow({ item, computedAt }: { item: ProviderDashboardAttention; computedAt: string }) {
  const detail = item.dueAt && item.type === 'deliverableDue' ? formatDue(item.dueAt, computedAt) : item.detail;
  return <div className="flex min-h-28 flex-col justify-between gap-4 rounded-[18px] border border-[#E5E7EB] bg-white px-5 py-5 sm:flex-row sm:items-center sm:px-7"><div><p className="font-medium">{item.title}</p><p className={`mt-1 text-sm ${item.tone === 'amber' ? 'font-medium text-warning' : item.tone === 'blue' ? 'font-medium text-[#3C61DD]' : 'text-[#6B7280]'}`}>{detail}</p></div><Button asChild variant="outline" className="border-[#D1D5DB] bg-white text-[#374151] shadow-none hover:bg-[#F9FAFB]"><Link href={item.href}>{item.action}</Link></Button></div>;
}

function ServiceViewsCard({ state, impressions, clicks, reason }: { state: string; impressions?: number | null; clicks?: number | null; reason: string }) {
  const tracked = state === 'available';
  return <div className="min-h-[368px] rounded-[18px] border border-[#E5E7EB] bg-white p-6"><p className="text-xs font-medium uppercase tracking-[0.14em] text-[#6B7280]">Service Views</p>{tracked ? <div className="mt-16 grid grid-cols-2 gap-5"><ChartMetric label="Impressions" value={number(impressions ?? 0)} /><ChartMetric label="Service Clicks" value={number(clicks ?? 0)} /></div> : <div className="flex min-h-56 flex-col items-center justify-center text-center"><div className="flex size-12 items-center justify-center rounded-full bg-[#F3F4F6]"><ArrowRight className="size-5 text-[#9CA3AF]" /></div><p className="mt-4 font-medium">30-day view trends are not tracked yet</p><p className="mt-2 max-w-sm text-sm text-[#6B7280]">{reason}</p></div>}<Link href="/dashboard/serviceprovider/analytics" className="mt-6 flex items-center justify-center gap-2 text-sm text-[#6B7280] hover:text-[#171717]">View service analytics report <ArrowRight className="size-4" /></Link></div>;
}

function ChartMetric({ label, value }: { label: string; value: string }) { return <div><p className="text-xs text-[#6B7280]">{label}</p><strong className="mt-1 block text-2xl font-semibold">{value}</strong></div>; }

function SummaryMetric({ label, value, accent = false, detail }: { label: string; value: string; accent?: boolean; detail?: string | null }) {
  return <div className="border-b border-[#E5E7EB] px-6 py-6 last:border-b-0 sm:[&:nth-child(odd)]:border-r xl:border-b-0 xl:border-r xl:last:border-r-0"><p className="text-xs font-medium uppercase tracking-[0.13em] text-[#6B7280]">{label}</p><p className={`mt-2 text-2xl font-semibold ${accent ? 'text-[#047857]' : ''}`}>{value}</p>{detail && <p className="mt-1 text-xs text-[#9CA3AF]">{detail}</p>}</div>;
}

function ActivityRow({ item, computedAt }: { item: ProviderDashboardActivity; computedAt: string }) {
  const Icon = activityIcon(item.type);
  return <Link href={item.href} className="flex items-center gap-4 border-b border-[#E5E7EB] py-4 last:border-b-0 hover:text-[#3C61DD]"><IconBubble icon={Icon} tone={item.tone} small /><p className="min-w-0 flex-1 truncate text-sm sm:text-base">{item.text}</p><time dateTime={item.occurredAt} className="shrink-0 text-xs text-[#6B7280] sm:text-sm">{relativeTime(item.occurredAt, computedAt)}</time></Link>;
}

function ProgressCard({ label, state, value, detail, color }: { label: string; state: string; value?: number | null; detail: string; color: string }) {
  const tracked = state === 'available' && value != null;
  return <div className="rounded-[18px] border border-[#E5E7EB] bg-white p-6"><div className="flex items-center justify-between gap-4"><p className="text-xs font-medium uppercase tracking-[0.13em] text-[#6B7280]">{label}</p><p className={`font-semibold ${tracked ? '' : 'text-[#9CA3AF]'}`}>{tracked ? `${value}%` : 'Not tracked'}</p></div>{tracked && <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#E5E7EB]"><div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: color }} /></div>}<p className="mt-4 text-sm text-[#6B7280]">{detail}</p></div>;
}

function IconBubble({ icon: Icon, tone, small = false }: { icon: LucideIcon; tone: Tone; small?: boolean }) {
  const tones: Record<Tone, string> = { blue: 'bg-[#E8ECFF] text-[#3C61DD]', green: 'bg-[#DDF8EC] text-[#047857]', amber: 'bg-[#FFF0DA] text-[#965F11]', red: 'bg-[#FDE8E8] text-[#C24141]', slate: 'bg-[#E7F4F3] text-[#0F766E]' };
  return <span className={`flex shrink-0 items-center justify-center rounded-xl ${tones[tone]} ${small ? 'size-9 rounded-full' : 'size-11'}`}><Icon className={small ? 'size-4' : 'size-5'} /></span>;
}

function activityIcon(type: string): LucideIcon {
  if (type === 'proposalSubmitted') return Send;
  if (type === 'milestoneApproved') return CheckCircle2;
  if (type === 'revisionRequested') return FileCheck2;
  if (type === 'paymentReleased') return CircleDollarSign;
  if (type === 'portfolioAdded') return Upload;
  if (type === 'messageReceived') return MessageSquareText;
  return BriefcaseBusiness;
}

function welcomeSummary(leads: number, dueToday: number) {
  if (leads === 0 && dueToday === 0) return 'You have no new leads or deliveries due today.';
  return `You have ${leads} new ${leads === 1 ? 'lead' : 'leads'} and ${dueToday} ${dueToday === 1 ? 'delivery' : 'deliveries'} due today.`;
}

function money(value: number, currency: string) { try { return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value); } catch { return `${currency} ${value.toFixed(2)}`; } }
function number(value: number) { return new Intl.NumberFormat().format(value); }
function responseTime(value?: number | null) { if (value == null) return '—'; return value < 60 ? `${Math.round(value)} mins` : `${(value / 60).toFixed(value < 600 ? 1 : 0)} hrs`; }
function leadExpiry(value: string | null | undefined, computedAt: string) { if (!value) return 'No unread client briefs'; const hours = Math.max(0, Math.ceil((new Date(value).getTime() - new Date(computedAt).getTime()) / 3_600_000)); return `Nearest lead expires in ${hours} ${hours === 1 ? 'hour' : 'hours'}`; }
function formatDue(value: string, computedAt: string) { const hours = Math.ceil((new Date(value).getTime() - new Date(computedAt).getTime()) / 3_600_000); if (hours < 0) return `Overdue by ${Math.abs(hours)} ${Math.abs(hours) === 1 ? 'hour' : 'hours'}`; if (hours < 48) return `Due in ${hours} ${hours === 1 ? 'hour' : 'hours'}`; return `Due in ${Math.ceil(hours / 24)} days`; }
function relativeTime(value: string, computedAt: string) { const minutes = Math.max(0, Math.floor((new Date(computedAt).getTime() - new Date(value).getTime()) / 60_000)); if (minutes < 60) return minutes <= 1 ? 'Just now' : `${minutes} mins ago`; const hours = Math.floor(minutes / 60); if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`; const days = Math.floor(hours / 24); return days === 1 ? 'Yesterday' : `${days} days ago`; }
