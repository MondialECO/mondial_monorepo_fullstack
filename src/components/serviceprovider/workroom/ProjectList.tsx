'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { BriefcaseBusiness, CalendarDays, Search, ShieldCheck, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  SpCard,
  SpEmptyState,
  SpFilterBar,
  SpMutationFeedback,
  SpStatusBadge,
} from '@/components/serviceprovider/ui';
import { useEngagements } from '@/hooks/queries/workroom';
import type { Engagement } from '@/types/workroom';
import {
  engagementTone,
  formatDate,
  money,
  terminalEngagement,
  words,
  type NavigationChange,
} from './_shared';

const activeStatuses = ['', 'ContractPending', 'EscrowPending', 'ReadyToStart', 'Active', 'Paused', 'ClientInputRequired', 'MilestoneReview', 'RevisionInProgress', 'FinalDelivery', 'Disputed'];
// Archived and Cancelled are omitted: neither engagement state has a backend writer, so
// offering them produced a filter that always returned nothing.
const completedStatuses = ['', 'Completed'];

export function ProjectList({
  view,
  searchParams,
  onNavigate,
  onOpen,
}: {
  view: 'active' | 'completed';
  searchParams: { get: (name: string) => string | null };
  onNavigate: NavigationChange;
  onOpen: (id: string) => void;
}) {
  const query = useEngagements();
  const [search, setSearch] = useState(searchParams.get('wq') ?? '');
  const status = searchParams.get('wstatus') ?? '';
  const normalizedSearch = (searchParams.get('wq') ?? '').trim().toLocaleLowerCase();
  const rows = useMemo(() => (query.data ?? []).filter((engagement) => {
    if (view === 'completed' ? !terminalEngagement(engagement) : terminalEngagement(engagement)) return false;
    if (status && engagement.engagementStatus !== status) return false;
    if (!normalizedSearch) return true;
    return [engagement.title, engagement.description, engagement.clientDisplayName, engagement.engagementStatus]
      .join(' ').toLocaleLowerCase().includes(normalizedSearch);
  }), [normalizedSearch, query.data, status, view]);

  const clear = () => {
    setSearch('');
    onNavigate({ wq: null, wstatus: null }, true);
  };

  return (
    <div className="space-y-5">
      <SpFilterBar>
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9CA3AF]" aria-hidden="true" />
          <Input
            aria-label={`Search ${view} projects`}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && onNavigate({ wq: search.trim() || null }, true)}
            placeholder="Search project, description, or client"
            className="pl-9"
          />
        </div>
        <FilterSelect label="Filter projects by status" value={status} onChange={(value) => onNavigate({ wstatus: value || null }, true)}>
          {(view === 'completed' ? completedStatuses : activeStatuses).map((item) => <option key={item || 'all'} value={item}>{item ? words(item) : 'All statuses'}</option>)}
        </FilterSelect>
        <Button type="button" variant="outline" onClick={clear}>Clear</Button>
        <Button type="button" onClick={() => onNavigate({ wq: search.trim() || null }, true)}>Search</Button>
      </SpFilterBar>

      {query.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2" aria-label="Loading projects">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-72 rounded-2xl" />)}</div>
      ) : query.isError ? (
        <SpMutationFeedback status="error"><div className="flex flex-wrap items-center gap-3"><span>Projects could not be loaded.</span><button type="button" onClick={() => query.refetch()} className="font-semibold underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3C61DD]">Try again</button></div></SpMutationFeedback>
      ) : rows.length === 0 ? (
        <SpEmptyState
          icon={BriefcaseBusiness}
          title={(query.data ?? []).length ? `No ${view} projects match these filters` : view === 'completed' ? 'No completed projects' : 'No active projects'}
          description={(query.data ?? []).length ? 'Clear or adjust the current search and status filters.' : view === 'completed' ? 'Completed, archived, and cancelled engagement history will appear here.' : 'Projects appear here once a client accepts your proposal. Setting one up takes a moment after acceptance.'}
          action={(query.data ?? []).length ? <Button type="button" variant="outline" onClick={clear}>Clear filters</Button> : undefined}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((engagement) => <ProjectCard key={engagement.id} engagement={engagement} onOpen={() => onOpen(engagement.id)} />)}
        </div>
      )}
    </div>
  );
}

function ProjectCard({ engagement, onOpen }: { engagement: Engagement; onOpen: () => void }) {
  const progress = Math.max(0, Math.min(100, engagement.completionPercentage));
  return (
    <SpCard className="flex flex-col p-0 sm:p-0">
      <button type="button" onClick={onOpen} className="flex h-full flex-col rounded-2xl p-5 text-left outline-none focus-visible:ring-2 focus-visible:ring-[#3C61DD] focus-visible:ring-offset-2 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0"><h2 className="font-heading text-lg font-semibold text-[#171717]">{engagement.title}</h2><p className="mt-1 line-clamp-2 text-sm leading-6 text-[#6B7280]">{engagement.description || 'No project description.'}</p></div>
          <SpStatusBadge tone={engagementTone(engagement.engagementStatus)}>{words(engagement.engagementStatus)}</SpStatusBadge>
        </div>

        <dl className="mt-5 grid gap-4 border-y border-[#E5E7EB] py-4 sm:grid-cols-2">
          <CardMetric icon={UserRound} label="Client" value={engagement.clientDisplayName || 'Client'} />
          <CardMetric icon={CalendarDays} label="Schedule" value={`${formatDate(engagement.startDate)} – ${formatDate(engagement.actualEndDate ?? engagement.expectedEndDate)}`} />
          <CardMetric icon={BriefcaseBusiness} label="Contract value" value={money(engagement.contractValue, engagement.currency)} />
          <CardMetric icon={ShieldCheck} label="Payment state" value={words(engagement.escrowStatus)} />
        </dl>

        <div className="mt-auto pt-5">
          <div className="flex items-center justify-between gap-4 text-xs"><span className="font-semibold text-[#374151]">Project progress</span><span className="text-[#6B7280]">{Math.round(progress)}%</span></div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#ECEEF2]" role="progressbar" aria-label={`${engagement.title} completion`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}><div className="h-full rounded-full bg-[#3C61DD]" style={{ width: `${progress}%` }} /></div>
          <div className="mt-4 flex items-center justify-between gap-3"><span className="text-xs text-[#6B7280]">Updated {formatDate(engagement.updatedAt, true)}</span><span className="text-sm font-semibold text-[#3C61DD]">Open project →</span></div>
        </div>
      </button>
    </SpCard>
  );
}

function CardMetric({ icon: Icon, label, value }: { icon: typeof UserRound; label: string; value: string }) {
  return <div className="flex items-start gap-2"><Icon className="mt-0.5 size-4 shrink-0 text-[#6B7280]" aria-hidden="true" /><div><dt className="text-xs text-[#6B7280]">{label}</dt><dd className="mt-0.5 text-sm font-semibold text-[#171717]">{value}</dd></div></div>;
}

function FilterSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: ReactNode }) {
  return <select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} className="h-10 min-w-48 rounded-lg border border-[#D1D5DB] bg-white px-3 text-sm text-[#171717] outline-none focus-visible:ring-2 focus-visible:ring-[#3C61DD]">{children}</select>;
}
