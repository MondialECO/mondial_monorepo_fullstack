'use client';

import { Layers } from 'lucide-react';
import { MilestoneCard } from './MilestoneCard';
import type { WorkroomDetail } from '@/types/workroom';

export function MilestonesPanel({ detail }: { detail: WorkroomDetail }) {
  const { milestones, deliverables, revisionRequests, contract } = detail;
  const contractSigned = contract.status === 'Signed';

  const ordered = [...milestones].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 font-semibold text-foreground">
        <Layers className="size-4" />
        Milestones
      </h2>

      {ordered.length === 0 ? (
        <p className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
          No milestones on this engagement yet.
        </p>
      ) : (
        <div className="space-y-3">
          {ordered.map((m) => (
            <MilestoneCard
              key={m.id}
              milestone={m}
              contractSigned={contractSigned}
              deliverables={deliverables.filter((d) => d.milestoneId === m.id)}
              revisionRequests={revisionRequests.filter((r) => r.milestoneId === m.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
