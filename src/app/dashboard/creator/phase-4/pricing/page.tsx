'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { Phase4ProfileGuard } from '@/components/creator/phase4/Phase4ProfileGuard';
import { PricingStrategyView } from '@/components/creator/phase4/PricingStrategyView';
import { useCreatorProgress } from '@/providers/CreatorProgressProvider';
import {
  getPricingStrategy,
  generatePricingStrategy,
  refreshPricingStrategy,
  updatePricingOffer,
} from '@/lib/api-creator-pricing';
import type {
  PricingStrategyResponse,
  UpdatePricingOfferRequest,
} from '@/types/creator/pricing';

export default function CreatorPhase4PricingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground font-mono text-sm">
          Loading Pricing & Revenue Model Engine...
        </div>
      }
    >
      <CreatorPhase4PricingInner />
    </Suspense>
  );
}

function CreatorPhase4PricingInner() {
  const searchParams = useSearchParams();
  const { state: progressState } = useCreatorProgress();
  const ideaId = searchParams.get('ideaId') || progressState?.activeIdeaId || '';

  return (
    <Phase4ProfileGuard>
      <PricingPageContent ideaId={ideaId} />
    </Phase4ProfileGuard>
  );
}

function PricingPageContent({ ideaId }: { ideaId: string }) {
  const { state: progressState, refetch } = useCreatorProgress();
  const effectiveIdeaId = ideaId || progressState?.activeIdeaId || '';
  const projectName = progressState?.project?.name || 'Your Project';

  const [data, setData] = useState<PricingStrategyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gateError, setGateError] = useState<{ code: string; message: string } | null>(null);

  const fetchData = useCallback(async () => {
    if (!effectiveIdeaId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      setGateError(null);
      const res = await getPricingStrategy(effectiveIdeaId);
      setData(res);
    } catch (err: any) {
      if (err.message && err.message.includes('404')) {
        setData(null);
      } else if (
        err.message &&
        (err.message.includes('Phase 3') ||
          err.message.includes('Snapshot') ||
          err.message.includes('Roadmap') ||
          err.message.includes('Needs') ||
          err.message.includes('Skills') ||
          err.message.includes('HumainX'))
      ) {
        setGateError({ code: 'PREREQUISITE_FAILED', message: err.message });
      } else {
        setError(err.message || "We couldn't load your pricing strategy.");
      }
    } finally {
      setLoading(false);
    }
  }, [effectiveIdeaId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleGenerate = async () => {
    if (!effectiveIdeaId) {
      setError('ideaId is required. Please open your project from the dashboard.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      setGateError(null);
      const res = await generatePricingStrategy(effectiveIdeaId);
      setData(res);
      await refetch(effectiveIdeaId);
    } catch (err: any) {
      if (err.code) {
        setGateError({ code: err.code, message: err.message });
      } else if (
        err.message &&
        (err.message.includes('Phase 3') ||
          err.message.includes('Snapshot') ||
          err.message.includes('Roadmap') ||
          err.message.includes('Needs') ||
          err.message.includes('Skills') ||
          err.message.includes('HumainX'))
      ) {
        setGateError({ code: 'PREREQUISITE_FAILED', message: err.message });
      } else {
        setError(err.message || "We couldn't generate your pricing strategy.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!effectiveIdeaId) return;
    try {
      setLoading(true);
      setError(null);
      setGateError(null);
      const res = await refreshPricingStrategy(effectiveIdeaId);
      setData(res);
      await refetch(effectiveIdeaId);
    } catch (err: any) {
      if (err.code) {
        setGateError({ code: err.code, message: err.message });
      } else {
        setError(err.message || "We couldn't refresh your pricing strategy.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOffer = async (offerKey: string, req: UpdatePricingOfferRequest) => {
    if (!effectiveIdeaId) return;
    try {
      const res = await updatePricingOffer(effectiveIdeaId, offerKey, req);
      setData(res);
      await refetch(effectiveIdeaId);
    } catch (err: any) {
      setError(err.message || "Couldn't update your offer.");
      throw err;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Banner Navigation */}
      <div className="border-b border-border bg-card/60 backdrop-blur sticky top-0 z-10 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link
            href={`/dashboard/creator/phase-4/support?ideaId=${effectiveIdeaId}`}
            className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Step 4.5 Aids & Grants
          </Link>
          <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
            <span>4.1 Snapshot ✓</span>
            <span>4.2 Roadmap ✓</span>
            <span>4.3 Needs ✓</span>
            <span>4.4 Skills ✓</span>
            <span>4.5 Grants ✓</span>
            <span className="text-primary font-semibold">4.6 Pricing (Current)</span>
            <Link
              href={`/dashboard/creator/phase-4/gtm?ideaId=${effectiveIdeaId}`}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              4.7 GTM →
            </Link>
          </div>
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="max-w-7xl mx-auto p-6">
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-foreground">Error</h4>
              <p className="text-xs text-muted-foreground">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-xs text-muted-foreground hover:text-foreground font-semibold"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main View */}
      <PricingStrategyView
        ideaId={effectiveIdeaId}
        projectName={projectName}
        strategy={data?.strategy || data?.pricingStrategy || null}
        updateAvailable={data?.updateAvailable || false}
        changedSources={data?.changedSources || []}
        isLoading={loading}
        gateError={gateError}
        onGenerate={handleGenerate}
        onRefresh={handleRefresh}
        onUpdateOffer={handleUpdateOffer}
      />
    </div>
  );
}
