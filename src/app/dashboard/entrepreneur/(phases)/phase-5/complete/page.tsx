'use client';

import { useEffect, useState } from 'react';
import { Rocket, PieChart, Clock } from 'lucide-react';
import { RouteGuard } from '@/components/entrepreneur/RouteGuard';
import { EntrepreneurLayout } from '@/components/entrepreneur/EntrepreneurLayout';
import { PhaseCompletionScreen } from '@/components/entrepreneur/PhaseCompletionScreen';
import entrepreneurApi, {
  type CompanyProgressResponse,
  type FundingProfileResponse,
} from '@/lib/api-entrepreneur';

const eur = (n: number) =>
  new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', notation: 'compact', maximumFractionDigits: 1 }).format(n || 0);

function Phase5CompleteContent() {
  const [prog, setProg] = useState<CompanyProgressResponse | null>(null);
  const [funding, setFunding] = useState<FundingProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const p = await entrepreneurApi.getCurrentPhase();
        if (cancelled) return;
        setProg(p);
        if (p.companyId) {
          const f = await entrepreneurApi.getFundingProfile(p.companyId).catch(() => null);
          if (!cancelled) setFunding(f);
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

  const raise = funding?.fundingAskAmount ?? 0;
  const equity = funding?.equityOfferedPercent ?? 0;

  return (
    <PhaseCompletionScreen
      icon={Rocket}
      eyebrow="Funding ask live"
      title="Phase 5 Complete!"
      subtitle="Your funding ask is submitted for compliance review and your profile advances to the data room stage."
      statusCards={[
        { icon: Rocket, label: 'Funding ask', value: raise > 0 ? eur(raise) : undefined, unavailable: raise > 0 ? undefined : 'unavailable', sub: funding?.fundingRoundType ?? undefined, tone: 'success' },
        { icon: PieChart, label: 'Equity offered', value: equity > 0 ? `${equity}%` : undefined, unavailable: equity > 0 ? undefined : 'unavailable' },
        { icon: Clock, label: 'Runway', unavailable: 'unavailable' },
      ]}
      score={null}
      unlocked={[
        { label: 'Funding ask submitted for compliance review', sub: funding?.hasOutreachCampaign ? 'Published to the investor marketplace' : 'Publishes after review' },
        { label: 'Phase 6 — Data Room setup', sub: 'Upload & organise your documents' },
        { label: 'Phase 7 — AI Expert Review unlocks later' },
        { label: 'AI investor pre-screening', gap: true },
      ]}
      next={{ chip: 'Next', title: 'Phase 6 — Data Room', desc: 'Upload and organise your documents, configure NDA + investor access, and publish your secure data room.' }}
      continueHref="/dashboard/entrepreneur/phase-6"
      continueLabel="Continue to Phase 6"
      completedPhases={prog?.completedPhases ?? []}
      currentPhase={prog?.currentPhase ?? 6}
    />
  );
}

export default function Phase5CompletePage() {
  return (
    <RouteGuard requiredPhase={5}>
      <EntrepreneurLayout sidebar={<div />}>
        <Phase5CompleteContent />
      </EntrepreneurLayout>
    </RouteGuard>
  );
}
