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
