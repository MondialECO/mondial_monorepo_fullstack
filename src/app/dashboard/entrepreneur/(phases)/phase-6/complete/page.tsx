'use client';

import { useEffect, useState } from 'react';
import { FolderOpen, ShieldCheck, Sparkles } from 'lucide-react';
import { RouteGuard } from '@/components/entrepreneur/RouteGuard';
import { EntrepreneurLayout } from '@/components/entrepreneur/EntrepreneurLayout';
import { PhaseCompletionScreen } from '@/components/entrepreneur/PhaseCompletionScreen';
import entrepreneurApi, {
  type CompanyProgressResponse,
  type DataRoomStatusResponse,
} from '@/lib/api-entrepreneur';

function Phase6CompleteContent() {
  const [prog, setProg] = useState<CompanyProgressResponse | null>(null);
  const [room, setRoom] = useState<DataRoomStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const p = await entrepreneurApi.getCurrentPhase();
        if (cancelled) return;
        setProg(p);
        if (p.companyId) {
          const r = await entrepreneurApi.getDataRoom(p.companyId).catch(() => null);
          if (!cancelled) setRoom(r);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center" role="status" aria-live="polite">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  const docs = room ? (room.totalDocuments || room.documents?.length || 0) : 0;
  const grants = room?.accessGrants?.length ?? 0;
  const ndaActive = !!room?.ndaRequired;

  return (
    <PhaseCompletionScreen
      icon={ShieldCheck}
      eyebrow="Data room live"
      title="Phase 6 — Data Room Complete!"
      subtitle="Your secure document vault is published and sent for compliance review. Investors with access can now request documents."
      statusCards={[
        { icon: FolderOpen, label: 'Data room', value: docs > 0 ? `${docs} docs` : undefined, unavailable: docs > 0 ? undefined : 'unavailable', sub: `${grants} investor${grants === 1 ? '' : 's'}` },
        { icon: ShieldCheck, label: 'NDA protection', value: ndaActive ? 'Active' : 'Off', tone: ndaActive ? 'success' : undefined, sub: 'Per access grant' },
        { icon: Sparkles, label: 'Phase 7', value: 'Unlocked', tone: 'success', sub: 'AI Expert Review' },
      ]}
      score={null}
      unlocked={[
        { label: 'Data room published', sub: 'Sent for compliance review' },
        { label: 'Phase 7 — AI Expert Review now accessible' },
        { label: 'Access log active', sub: 'Track investor views & downloads' },
        { label: 'Investor-Ready Score updated' },
      ]}
      next={{ chip: 'Next', title: 'Phase 7 — AI Expert Review', desc: 'Run the readiness review across your verified phases, review recommendations, and work toward the investor-ready badge.' }}
      continueHref="/dashboard/entrepreneur/phase-7"
      continueLabel="Continue to Phase 7"
      completedPhases={prog?.completedPhases ?? []}
      currentPhase={prog?.currentPhase ?? 7}
    />
  );
}

export default function Phase6CompletePage() {
  return (
    <RouteGuard requiredPhase={6}>
      <EntrepreneurLayout sidebar={<div />}>
        <Phase6CompleteContent />
      </EntrepreneurLayout>
    </RouteGuard>
  );
}
