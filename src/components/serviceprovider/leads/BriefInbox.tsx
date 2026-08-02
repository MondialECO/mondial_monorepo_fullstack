'use client';

import { useMemo, useState, type ReactNode } from 'react';
import {
  Bookmark,
  BriefcaseBusiness,
  Clock3,
  MapPin,
  Search,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  SpCard,
  SpEmptyState,
  SpFilterBar,
  SpMutationFeedback,
  SpStatusBadge,
} from '@/components/serviceprovider/ui';
import { useLeadInbox, useUpdateLeadInteraction } from '@/hooks/queries/leads';
import type { ClientBrief, LeadQuery } from '@/types/leads';
import { SERVICE_CATEGORIES } from '@/types/service-provider';
import {
  apiError,
  briefIsExpired,
  expirationLabel,
  formatEnum,
  money,
  type NavigationChange,
} from './_shared';

const sourceOptions = ['', 'Marketplace', 'DirectInvitation', 'FeaturedPush', 'ServiceInquiry'];
const sortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'highestbudget', label: 'Highest budget' },
  { value: 'closestdeadline', label: 'Closest deadline' },
  { value: 'bestmatch', label: 'Best skill match' },
  { value: 'previouslyviewed', label: 'Previously viewed' },
];

export function BriefInbox({
  savedOnly,
  searchParams,
  onNavigate,
  onOpen,
}: {
  savedOnly: boolean;
  searchParams: { get: (name: string) => string | null };
  onNavigate: NavigationChange;
  onOpen: (id: string) => void;
}) {
  const [filters, setFilters] = useState(() => ({
    q: searchParams.get('q') ?? '',
    category: searchParams.get('category') ?? '',
    skill: searchParams.get('skill') ?? '',
    budgetMinimum: searchParams.get('budgetMinimum') ?? '',
    budgetMaximum: searchParams.get('budgetMaximum') ?? '',
    source: searchParams.get('source') ?? '',
    remote: searchParams.get('remote') ?? '',
    deadlineBefore: searchParams.get('deadlineBefore') ?? '',
  }));
  const [dismissTarget, setDismissTarget] = useState<ClientBrief | null>(null);
  const [feedback, setFeedback] = useState<{ status: 'success' | 'error'; message: string } | null>(null);
  const sort = searchParams.get('sort') ?? 'newest';

  const serverQuery: LeadQuery = {
    savedOnly,
    sort,
    category: searchParams.get('category') || undefined,
    skill: searchParams.get('skill') || undefined,
    budgetMinimum: numberOrUndefined(searchParams.get('budgetMinimum')),
    budgetMaximum: numberOrUndefined(searchParams.get('budgetMaximum')),
    source: searchParams.get('source') || undefined,
    remoteAllowed:
      searchParams.get('remote') === 'true'
        ? true
        : searchParams.get('remote') === 'false'
          ? false
          : undefined,
    deadlineBefore: searchParams.get('deadlineBefore') || undefined,
  };

  const inbox = useLeadInbox(serverQuery);
  const interaction = useUpdateLeadInteraction();
  const query = (searchParams.get('q') ?? '').trim().toLocaleLowerCase();
  const rows = useMemo(
    () =>
      (inbox.data ?? []).filter((brief) =>
        !query ||
        [brief.title, brief.description, brief.serviceCategory, ...brief.requiredSkills, ...brief.industries]
          .join(' ')
          .toLocaleLowerCase()
          .includes(query),
      ),
    [inbox.data, query],
  );

  const applyFilters = () => {
    onNavigate({
      q: filters.q.trim() || null,
      category: filters.category || null,
      skill: filters.skill.trim() || null,
      budgetMinimum: filters.budgetMinimum || null,
      budgetMaximum: filters.budgetMaximum || null,
      source: filters.source || null,
      remote: filters.remote || null,
      deadlineBefore: filters.deadlineBefore || null,
      brief: null,
    }, true);
  };

  const clearFilters = () => {
    setFilters({ q: '', category: '', skill: '', budgetMinimum: '', budgetMaximum: '', source: '', remote: '', deadlineBefore: '' });
    onNavigate({
      q: null,
      category: null,
      skill: null,
      budgetMinimum: null,
      budgetMaximum: null,
      source: null,
      remote: null,
      deadlineBefore: null,
      sort: null,
    }, true);
  };

  const toggleSaved = async (brief: ClientBrief) => {
    setFeedback(null);
    try {
      await interaction.mutateAsync({ id: brief.id, saved: !brief.saved });
      setFeedback({
        status: 'success',
        message: brief.saved ? 'Brief removed from Saved.' : 'Brief saved for later.',
      });
    } catch (error) {
      setFeedback({ status: 'error', message: apiError(error, 'The saved state could not be updated.') });
    }
  };

  const dismiss = async () => {
    if (!dismissTarget) return;
    try {
      await interaction.mutateAsync({ id: dismissTarget.id, dismissed: true });
      setFeedback({ status: 'success', message: 'Brief dismissed from your inbox.' });
      setDismissTarget(null);
    } catch (error) {
      setFeedback({ status: 'error', message: apiError(error, 'The brief could not be dismissed.') });
    }
  };

  return (
    <div className="space-y-5">
      <SpFilterBar className="items-start">
        <div className="grid min-w-0 flex-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9CA3AF]" aria-hidden="true" />
            <Input
              aria-label="Search client briefs"
              value={filters.q}
              onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))}
              onKeyDown={(event) => event.key === 'Enter' && applyFilters()}
              placeholder="Search titles, skills, industries, or descriptions"
              className="pl-9"
            />
          </div>
          <FilterSelect label="Category" value={filters.category} onChange={(value) => setFilters((current) => ({ ...current, category: value }))}>
            <option value="">All categories</option>
            {SERVICE_CATEGORIES.map((item) => <option key={item} value={item}>{formatEnum(item)}</option>)}
          </FilterSelect>
          <Input aria-label="Required skill" value={filters.skill} onChange={(event) => setFilters((current) => ({ ...current, skill: event.target.value }))} placeholder="Required skill" />
          <Input aria-label="Minimum client budget" type="number" min={0} value={filters.budgetMinimum} onChange={(event) => setFilters((current) => ({ ...current, budgetMinimum: event.target.value }))} placeholder="Minimum budget" />
          <Input aria-label="Maximum client budget" type="number" min={0} value={filters.budgetMaximum} onChange={(event) => setFilters((current) => ({ ...current, budgetMaximum: event.target.value }))} placeholder="Maximum budget" />
          <FilterSelect label="Brief source" value={filters.source} onChange={(value) => setFilters((current) => ({ ...current, source: value }))}>
            {sourceOptions.map((item) => <option key={item || 'all'} value={item}>{item ? formatEnum(item) : 'All sources'}</option>)}
          </FilterSelect>
          <FilterSelect label="Remote availability" value={filters.remote} onChange={(value) => setFilters((current) => ({ ...current, remote: value }))}>
            <option value="">Any location mode</option>
            <option value="true">Remote allowed</option>
            <option value="false">On-site only</option>
          </FilterSelect>
          <Input aria-label="Deadline before" type="date" value={filters.deadlineBefore} onChange={(event) => setFilters((current) => ({ ...current, deadlineBefore: event.target.value }))} />
          <FilterSelect label="Sort client briefs" value={sort} onChange={(value) => onNavigate({ sort: value === 'newest' ? null : value }, true)}>
            {sortOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </FilterSelect>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={clearFilters}>Clear</Button>
          <Button type="button" onClick={applyFilters}>Apply filters</Button>
        </div>
      </SpFilterBar>

      {feedback && <SpMutationFeedback status={feedback.status}>{feedback.message}</SpMutationFeedback>}

      {inbox.isLoading ? (
        <div className="grid gap-4" aria-label="Loading client briefs">
          {Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-64 rounded-2xl" />)}
        </div>
      ) : inbox.isError ? (
        <SpMutationFeedback status="error">
          <div className="flex flex-wrap items-center gap-3">
            <span>Client briefs could not be loaded.</span>
            <button type="button" onClick={() => inbox.refetch()} className="font-semibold underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3C61DD]">Try again</button>
          </div>
        </SpMutationFeedback>
      ) : rows.length === 0 ? (
        <SpEmptyState
          icon={savedOnly ? Bookmark : BriefcaseBusiness}
          title={savedOnly ? 'No saved client briefs' : 'No client briefs match these filters'}
          description={savedOnly ? 'Save a relevant client brief to return to it here.' : 'New eligible briefs appear when they match your verified profile, availability, and capacity.'}
          action={<Button type="button" variant="outline" onClick={clearFilters}>Clear filters</Button>}
        />
      ) : (
        <div className="grid gap-4">
          {rows.map((brief) => (
            <BriefCard
              key={brief.id}
              brief={brief}
              savedOnly={savedOnly}
              onOpen={() => onOpen(brief.id)}
              onSave={() => toggleSaved(brief)}
              onDismiss={() => setDismissTarget(brief)}
              pending={interaction.isPending}
            />
          ))}
        </div>
      )}

      <Dialog open={!!dismissTarget} onOpenChange={(open) => !open && setDismissTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dismiss this client brief?</DialogTitle>
            <DialogDescription>
              It will be removed from your inbox. Saving a brief takes priority over dismissal, so save it instead if you may return later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDismissTarget(null)} disabled={interaction.isPending}>Cancel</Button>
            <Button type="button" variant="destructive" onClick={dismiss} disabled={interaction.isPending}>
              {interaction.isPending ? 'Dismissing…' : 'Dismiss brief'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BriefCard({
  brief,
  savedOnly,
  onOpen,
  onSave,
  onDismiss,
  pending,
}: {
  brief: ClientBrief;
  savedOnly: boolean;
  onOpen: () => void;
  onSave: () => void;
  onDismiss: () => void;
  pending: boolean;
}) {
  const expiry = expirationLabel(brief.expiresAt);
  const expired = briefIsExpired(brief);

  return (
    <SpCard>
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <SpStatusBadge tone="info">{formatEnum(brief.source)}</SpStatusBadge>
            <SpStatusBadge tone={expired ? 'negative' : expiry.urgent ? 'warning' : 'neutral'}>{expiry.label}</SpStatusBadge>
            {brief.viewed && <SpStatusBadge>Viewed</SpStatusBadge>}
          </div>
          <h2 className="mt-4 font-heading text-xl font-semibold text-[#171717]">{brief.title}</h2>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#6B7280]">{brief.description}</p>
        </div>
        <div className="shrink-0 rounded-xl bg-[#F9FAFB] px-4 py-3 text-center">
          <p className="text-2xl font-semibold text-[#171717]">{Math.round(brief.matchScore * 100)}%</p>
          <p className="text-xs text-[#6B7280]">Skill match</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 border-y border-[#E5E7EB] py-4 sm:grid-cols-2 xl:grid-cols-4">
        <BriefMetric label="Budget" value={`${money(brief.budgetMinimum, brief.currency)} – ${money(brief.budgetMaximum, brief.currency)}`} />
        <BriefMetric label="Pricing" value={formatEnum(brief.pricingType)} />
        <BriefMetric label="Duration" value={brief.expectedDuration || 'Flexible'} icon={Clock3} />
        <BriefMetric label="Location" value={brief.remoteAllowed ? 'Remote allowed' : brief.location || 'On-site'} icon={MapPin} />
      </div>

      <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <ul className="flex flex-wrap gap-2" aria-label="Required skills">
          {brief.requiredSkills.slice(0, 6).map((skill) => <li key={skill}><SpStatusBadge>{skill}</SpStatusBadge></li>)}
        </ul>
        <div className="flex shrink-0 flex-wrap gap-2">
          {!savedOnly && (
            <Button type="button" size="sm" variant="ghost" onClick={onDismiss} disabled={pending || expired}>
              <Trash2 className="size-4" aria-hidden="true" /> Dismiss
            </Button>
          )}
          <Button type="button" size="sm" variant="outline" aria-pressed={brief.saved} onClick={onSave} disabled={pending}>
            <Bookmark className={`size-4 ${brief.saved ? 'fill-current' : ''}`} aria-hidden="true" />
            {brief.saved ? 'Saved' : 'Save'}
          </Button>
          <Button type="button" size="sm" onClick={onOpen}>Review brief</Button>
        </div>
      </div>
    </SpCard>
  );
}

function BriefMetric({ label, value, icon: Icon }: { label: string; value: string; icon?: typeof Clock3 }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#6B7280]">{label}</p>
      <p className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold text-[#171717]">
        {Icon && <Icon className="size-4 text-[#6B7280]" aria-hidden="true" />}
        {value}
      </p>
    </div>
  );
}

function FilterSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: ReactNode }) {
  return (
    <select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded-lg border border-[#D1D5DB] bg-white px-3 text-sm text-[#171717] outline-none focus-visible:ring-2 focus-visible:ring-[#3C61DD]">
      {children}
    </select>
  );
}

function numberOrUndefined(value: string | null) {
  if (!value) return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}
