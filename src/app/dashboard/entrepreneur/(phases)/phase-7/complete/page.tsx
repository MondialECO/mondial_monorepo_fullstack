'use client';

import { useEffect, useState } from 'react';
import { Trophy, BadgeCheck, Rocket } from 'lucide-react';
import { RouteGuard } from '@/components/entrepreneur/RouteGuard';
import { EntrepreneurLayout } from '@/components/entrepreneur/EntrepreneurLayout';
import { PhaseCompletionScreen } from '@/components/entrepreneur/PhaseCompletionScreen';
import entrepreneurApi, {
  type CompanyProgressResponse,
  type AiReviewResponse,
} from '@/lib/api-entrepreneur';

function Phase7CompleteContent() {
  const [prog, setProg] = useState<CompanyProgressResponse | null>(null);
  const [review, setReview] = useState<AiReviewResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const p = await entrepreneurApi.getCurrentPhase();
        if (cancelled) return;
        setProg(p);
        if (p.companyId) {
          const r = await entrepreneurApi.getAiReview(p.companyId).catch(() => null);
          if (!cancelled) setReview(r);
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

  const overall = review?.overallScore ?? null;
  const badge = !!review?.investorReadyBadge;

  return (
    <PhaseCompletionScreen
      icon={Trophy}
      eyebrow="Investor-ready badge"
      title="Investor-Ready Badge Claimed!"
      subtitle="Your profile is verified, scored, and live for investor matching. Phase 8 is now active."
      statusCards={[
        { icon: Trophy, label: 'Readiness score', value: overall != null ? `${overall}/100` : undefined, unavailable: overall != null ? undefined : 'unavailable', sub: 'AI review' },
        { icon: BadgeCheck, label: 'Badge status', value: badge ? 'Active' : 'Pending', tone: badge ? 'success' : undefined, sub: badge ? 'On your profile' : 'Below threshold' },
        { icon: Rocket, label: 'Phase 8', value: 'Live now', tone: 'success', sub: 'Investor matching' },
      ]}
      score={prog ? prog.trustScore : null}
      scoreSub="Backend-awarded after Phase 7"
      unlocked={[
        { label: 'Investor-Ready Badge', sub: badge ? 'Visible on your public profile' : 'Awarded at threshold' },
        { label: 'Phase 8 — Investor Matching is now live' },
        { label: 'Data room visible to matched investors', sub: 'After NDA signature' },
        { label: 'Priority listing in the marketplace', gap: true },
      ]}
      next={{ chip: 'Live', title: 'Phase 8 — Investor Matching', desc: 'Review your matched investors, express interest, log interactions, and begin building your deal pipeline.' }}
      continueHref="/dashboard/entrepreneur/phase-8"
      continueLabel="Continue to Phase 8"
      completedPhases={prog?.completedPhases ?? []}
      currentPhase={prog?.currentPhase ?? 8}
    />
  );
}

export default function Phase7CompletePage() {
  return (
    <RouteGuard requiredPhase={7}>
      {/* <EntrepreneurLayout sidebar={<div />}> */}
        <Phase7CompleteContent />
      {/* </EntrepreneurLayout> */}
    </RouteGuard>
  );
}
