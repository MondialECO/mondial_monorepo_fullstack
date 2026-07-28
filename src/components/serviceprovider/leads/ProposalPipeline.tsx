'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { CheckCircle2, FileText, Hourglass, Search, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  SpCard,
  SpEmptyState,
  SpFilterBar,
  SpMetricCard,
  SpMutationFeedback,
  SpStatusBadge,
} from '@/components/serviceprovider/ui';
import { useProposals } from '@/hooks/queries/leads';
import type { Proposal, ProposalStatus } from '@/types/leads';
import {
  expirationLabel,
  formatDate,
  formatEnum,
  money,
  proposalStatusTone,
  type NavigationChange,
} from './_shared';

const statusOptions: Array<ProposalStatus | ''> = ['', 'Draft', 'Submitted', 'Viewed', 'ChangesRequested', 'Revised', 'ClientReviewing', 'Accepted', 'ConvertedToProject', 'Declined', 'Withdrawn', 'Expired'];

const groups: Array<{ title: string; description: string; statuses: ProposalStatus[] }> = [
  { title: 'Drafts', description: 'Editable proposals not yet sent', statuses: ['Draft'] },
  { title: 'Sent', description: 'Waiting for client activity', statuses: ['Submitted'] },
  { title: 'Client activity', description: 'Viewed, changing, or under review', statuses: ['Viewed', 'ChangesRequested', 'Revised', 'ClientReviewing'] },
  { title: 'Accepted', description: 'Accepted or converted to Workroom', statuses: ['Accepted', 'ConvertedToProject'] },
  { title: 'Closed', description: 'Declined, withdrawn, or expired', statuses: ['Declined', 'Withdrawn', 'Expired'] },
];

export function ProposalPipeline({
  searchParams,
  onNavigate,
  onOpen,
}: {
  searchParams: { get: (name: string) => string | null };
  onNavigate: NavigationChange;
  onOpen: (id: string) => void;
}) {
  const query = useProposals();
  const [search, setSearch] = useState(searchParams.get('pq') ?? '');
  const status = (searchParams.get('status') ?? '') as ProposalStatus | '';
  const normalizedSearch = (searchParams.get('pq') ?? '').trim().toLocaleLowerCase();
  const rows = useMemo(() => (query.data ?? []).filter((proposal) => {
    if (status && proposal.status !== status) return false;
    if (!normalizedSearch) return true;
    return [proposal.title, proposal.proposalSource, proposal.status, proposal.currency].join(' ').toLocaleLowerCase().includes(normalizedSearch);
  }), [normalizedSearch, query.data, status]);

  const all = query.data ?? [];
  const activeStatuses: ProposalStatus[] = ['Submitted', 'Viewed', 'ChangesRequested', 'Revised', 'ClientReviewing'];
  const clear = () => {
    setSearch('');
    onNavigate({ pq: null, status: null }, true);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SpMetricCard label="All proposals" value={all.length} icon={FileText} detail="Across every server status" />
        <SpMetricCard label="Drafts" value={all.filter((item) => item.status === 'Draft').length} icon={Hourglass} detail="Ready to continue" />
        <SpMetricCard label="In progress" value={all.filter((item) => activeStatuses.includes(item.status)).length} icon={Send} detail="Sent or in client review" />
        <SpMetricCard label="Accepted" value={all.filter((item) => item.status === 'Accepted' || item.status === 'ConvertedToProject').length} icon={CheckCircle2} iconClassName="bg-[#E8F7F0] text-[#157A55]" detail="Includes Workroom conversions" />
      </div>

      <SpFilterBar>
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9CA3AF]" aria-hidden="true" />
          <Input aria-label="Search proposals" value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && onNavigate({ pq: search.trim() || null }, true)} placeholder="Search proposal title, source, or status" className="pl-9" />
        </div>
        <FilterSelect label="Filter proposals by status" value={status} onChange={(value) => onNavigate({ status: value || null }, true)}>
          {statusOptions.map((item) => <option key={item || 'all'} value={item}>{item ? formatEnum(item) : 'All statuses'}</option>)}
        </FilterSelect>
        <Button type="button" variant="outline" onClick={clear}>Clear</Button>
        <Button type="button" onClick={() => onNavigate({ pq: search.trim() || null }, true)}>Search</Button>
      </SpFilterBar>

      {query.isLoading ? (
        <div className="grid gap-4 xl:grid-cols-3" aria-label="Loading proposal pipeline">{Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-80 rounded-2xl" />)}</div>
      ) : query.isError ? (
        <SpMutationFeedback status="error"><div className="flex flex-wrap items-center gap-3"><span>Proposals could not be loaded.</span><button type="button" onClick={() => query.refetch()} className="font-semibold underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3C61DD]">Try again</button></div></SpMutationFeedback>
      ) : rows.length === 0 ? (
        <SpEmptyState icon={FileText} title={all.length ? 'No proposals match these filters' : 'No proposals yet'} description={all.length ? 'Clear or change the current search and status filter.' : 'Open a relevant client brief to prepare your first proposal draft.'} action={<Button type="button" variant="outline" onClick={() => all.length ? clear() : onNavigate({ view: 'leads', pq: null, status: null })}>{all.length ? 'Clear filters' : 'Browse client briefs'}</Button>} />
      ) : (
        <div className="overflow-x-auto pb-2" aria-label="Proposal pipeline grouped by server status">
          <div className="grid min-w-[1120px] grid-cols-5 gap-4 xl:min-w-0">
            {groups.map((group) => {
              const items = rows.filter((proposal) => group.statuses.includes(proposal.status));
              return (
                <section key={group.title} aria-labelledby={`pipeline-${group.title.toLocaleLowerCase().replace(' ', '-')}`} className="rounded-2xl bg-[#ECEEF2] p-3">
                  <div className="flex items-start justify-between gap-3 px-1 py-2">
                    <div><h2 id={`pipeline-${group.title.toLocaleLowerCase().replace(' ', '-')}`} className="font-heading text-sm font-semibold text-[#171717]">{group.title}</h2><p className="mt-1 text-xs leading-5 text-[#6B7280]">{group.description}</p></div>
                    <SpStatusBadge>{items.length}</SpStatusBadge>
                  </div>
                  <div className="mt-2 space-y-3">
                    {items.length ? items.map((proposal) => <PipelineCard key={proposal.id} proposal={proposal} onOpen={() => onOpen(proposal.id)} />) : <div className="rounded-xl border border-dashed border-[#D1D5DB] bg-white/60 px-3 py-8 text-center text-xs text-[#6B7280]">No proposals in this stage</div>}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      )}

      <SpMutationFeedback status="info">Pipeline columns reflect server-owned proposal states and are intentionally read-only. Client actions and state transitions cannot be changed by dragging cards.</SpMutationFeedback>
    </div>
  );
}

function PipelineCard({ proposal, onOpen }: { proposal: Proposal; onOpen: () => void }) {
  const expiry = expirationLabel(proposal.expiresAt);
  const approvalRequired = proposal.status === 'Submitted' && proposal.acceptanceTrigger === 'ProviderApprovalRequired';
  return (
    <SpCard className="p-0 sm:p-0">
      <button type="button" onClick={onOpen} className="w-full rounded-2xl p-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-[#3C61DD] focus-visible:ring-offset-2">
        <div className="flex flex-wrap items-center gap-2">
          <SpStatusBadge tone={proposalStatusTone(proposal.status)}>{formatEnum(proposal.status)}</SpStatusBadge>
          {approvalRequired && <SpStatusBadge tone="warning">Approval required</SpStatusBadge>}
        </div>
        <h3 className="mt-3 line-clamp-2 text-sm font-semibold leading-5 text-[#171717]">{proposal.title || 'Untitled proposal'}</h3>
        <p className="mt-1 text-xs text-[#6B7280]">{formatEnum(proposal.proposalSource)}</p>
        <dl className="mt-4 space-y-2 border-t border-[#E5E7EB] pt-3">
          <CardRow label="Gross" value={money(proposal.earningsPreview.price, proposal.earningsPreview.currency)} />
          <CardRow label="Net earnings" value={money(proposal.earningsPreview.net, proposal.earningsPreview.currency)} positive />
          <CardRow label="Updated" value={formatDate(proposal.updatedAt)} />
        </dl>
        <p className={`mt-3 text-xs font-medium ${expiry.urgent ? 'text-[#965F11]' : 'text-[#6B7280]'}`}>{expiry.label}</p>
      </button>
    </SpCard>
  );
}

function CardRow({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return <div className="flex items-start justify-between gap-2"><dt className="text-xs text-[#6B7280]">{label}</dt><dd className={`text-right text-xs font-semibold ${positive ? 'text-[#157A55]' : 'text-[#171717]'}`}>{value}</dd></div>;
}

function FilterSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: ReactNode }) {
  return <select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} className="h-10 min-w-48 rounded-lg border border-[#D1D5DB] bg-white px-3 text-sm text-[#171717] outline-none focus-visible:ring-2 focus-visible:ring-[#3C61DD]">{children}</select>;
}
