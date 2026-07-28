'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { SpPage, SpPageHeader, SpTabBar } from '@/components/serviceprovider/ui';
import { ProjectList } from './workroom/ProjectList';
import { ProjectDetail, type WorkroomTab } from './workroom/ProjectDetail';
import type { NavigationChange } from './workroom/_shared';

const BASE_ROUTE = '/dashboard/serviceprovider/workroom';

export function WorkroomWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = searchParams.get('view') === 'completed' ? 'completed' : 'active';
  const projectId = searchParams.get('project');
  const tab = normalizeTab(searchParams.get('tab'));
  const milestoneId = searchParams.get('milestone');

  const navigate: NavigationChange = (change, replace = false) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(change).forEach(([key, value]) => {
      if (value === null) params.delete(key);
      else params.set(key, value);
    });
    const href = `${BASE_ROUTE}?${params.toString()}`;
    if (replace) router.replace(href);
    else router.push(href);
  };

  if (projectId) {
    return (
      <ProjectDetail
        id={projectId}
        view={view}
        tab={tab}
        milestoneId={milestoneId}
        onBack={() => navigate({ project: null, tab: null, milestone: null })}
        onTab={(next) => navigate({ tab: next === 'overview' ? null : next, milestone: next === 'milestones' ? milestoneId : null }, true)}
        onMilestone={(id) => navigate({ tab: 'milestones', milestone: id }, true)}
      />
    );
  }

  const title = view === 'completed' ? 'Completed Projects' : 'Active Projects';
  const description = view === 'completed'
    ? 'Review completed engagements, delivery history, and verified client feedback.'
    : 'Manage live contracts, milestones, delivery, coordination, and project status.';

  return (
    <SpPage>
      <SpPageHeader title={title} description={description} />
      <SpTabBar
        label="Project workroom sections"
        items={[
          { label: 'Active Projects', href: `${BASE_ROUTE}?view=active`, active: view === 'active' },
          { label: 'Completed Projects', href: `${BASE_ROUTE}?view=completed`, active: view === 'completed' },
        ]}
      />
      <ProjectList
        key={searchParams.toString()}
        view={view}
        searchParams={searchParams}
        onNavigate={navigate}
        onOpen={(id) => navigate({ project: id, tab: null, milestone: null })}
      />
    </SpPage>
  );
}

function normalizeTab(value: string | null): WorkroomTab {
  return value === 'milestones' || value === 'deliveries' || value === 'coordination' || value === 'contract' || value === 'time'
    ? value
    : 'overview';
}
