'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import {
  SpPage,
  SpPageHeader,
  SpTabBar,
} from '@/components/serviceprovider/ui';
import { BriefInbox } from './leads/BriefInbox';
import { BriefDetail } from './leads/BriefDetail';
import { ProposalDetail } from './leads/ProposalDetail';
import { ProposalEditor } from './leads/ProposalEditor';
import { ProposalPipeline } from './leads/ProposalPipeline';

export type LeadView = 'leads' | 'proposals' | 'saved';
const BASE_ROUTE = '/dashboard/serviceprovider/leads';

export function LeadsWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = normalizeView(searchParams.get('view'));
  const briefId = searchParams.get('brief');
  const proposalId = searchParams.get('proposal');
  const mode = searchParams.get('mode');

  const navigate = (change: Record<string, string | null>, replace = false) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(change).forEach(([key, value]) => {
      if (value === null) params.delete(key);
      else params.set(key, value);
    });
    const href = `${BASE_ROUTE}?${params.toString()}`;
    if (replace) router.replace(href);
    else router.push(href);
  };

  const openBrief = (id: string) =>
    navigate({ brief: id, proposal: null, mode: null });
  const closeBrief = () => navigate({ brief: null, mode: null });
  const startProposal = (id: string) =>
    navigate({ brief: id, proposal: null, mode: 'proposal' });
  const openProposal = (id: string) =>
    navigate({ view: 'proposals', proposal: id, brief: null, mode: null });
  const editProposal = (id: string) =>
    navigate({ view: 'proposals', proposal: id, brief: null, mode: 'edit' });
  const closeProposal = () => navigate({ proposal: null, mode: null });

  if (briefId && mode === 'proposal') {
    return (
      <ProposalEditor
        briefId={briefId}
        onBack={() => navigate({ brief: briefId, mode: null })}
        onPersisted={(id) => editProposal(id)}
        onSubmitted={(id) => openProposal(id)}
      />
    );
  }

  if (briefId) {
    return (
      <BriefDetail
        id={briefId}
        onBack={closeBrief}
        onStartProposal={() => startProposal(briefId)}
        onViewPipeline={() => navigate({ view: 'proposals', brief: null, mode: null })}
      />
    );
  }

  if (proposalId && mode === 'edit') {
    return (
      <ProposalEditor
        proposalId={proposalId}
        onBack={() => navigate({ proposal: proposalId, mode: null })}
        onPersisted={() => navigate({ proposal: proposalId, mode: 'edit' }, true)}
        onSubmitted={() => navigate({ proposal: proposalId, mode: null })}
      />
    );
  }

  if (proposalId) {
    return (
      <ProposalDetail
        id={proposalId}
        onBack={closeProposal}
        onEdit={() => editProposal(proposalId)}
        onOpen={openProposal}
      />
    );
  }

  const title = view === 'proposals' ? 'Proposal Pipeline' : view === 'saved' ? 'Saved Client Briefs' : 'Client Briefs';
  const description =
    view === 'proposals'
      ? 'Track drafts, submitted proposals, client decisions, and completed acquisition outcomes.'
      : view === 'saved'
        ? 'Return to client briefs you saved for later review.'
        : 'Review client briefs surfaced by the existing matching and invitation rules.';

  return (
    <SpPage>
      <SpPageHeader title={title} description={description} />
      <SpTabBar
        label="Lead workspace sections"
        items={[
          { label: 'Client Briefs', href: `${BASE_ROUTE}?view=leads`, active: view === 'leads' },
          { label: 'Pipeline', href: `${BASE_ROUTE}?view=proposals`, active: view === 'proposals' },
          { label: 'Saved', href: `${BASE_ROUTE}?view=saved`, active: view === 'saved' },
        ]}
      />

      {view === 'proposals' ? (
        <ProposalPipeline key={searchParams.toString()} searchParams={searchParams} onNavigate={navigate} onOpen={openProposal} />
      ) : (
        <BriefInbox
          key={searchParams.toString()}
          savedOnly={view === 'saved'}
          searchParams={searchParams}
          onNavigate={navigate}
          onOpen={openBrief}
        />
      )}
    </SpPage>
  );
}

function normalizeView(value: string | null): LeadView {
  return value === 'proposals' || value === 'saved' ? value : 'leads';
}
