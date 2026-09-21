'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { Phase4ProfileGuard } from '@/components/creator/phase4/Phase4ProfileGuard';
import { PricingStrategyView } from '@/components/creator/phase4/PricingStrategyView';
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
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-mono text-sm">
          Loading Pricing & Revenue Model Engine...
        </div>
      }
    >
      <Phase4ProfileGuard>
        <PricingPageContent />
      </Phase4ProfileGuard>
    </Suspense>
  );
}

function PricingPageContent() {
  const searchParams = useSearchParams();
  const ideaId = searchParams.get('ideaId') || '';

  const [data, setData] = useState<PricingStrategyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gateError, setGateError] = useState<{ code: string; message: string } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      setGateError(null);
      const res = await getPricingStrategy(ideaId);
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
  };

  useEffect(() => {
    fetchData();
  }, [ideaId]);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError(null);
      setGateError(null);
      const res = await generatePricingStrategy(ideaId);
      setData(res);
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
    try {
      setLoading(true);
      setError(null);
      setGateError(null);
      const res = await refreshPricingStrategy(ideaId);
      setData(res);
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
    try {
      const res = await updatePricingOffer(ideaId, offerKey, req);
      setData(res);
    } catch (err: any) {
      setError(err.message || "Couldn't update your offer.");
      throw err;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top Banner Navigation */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-10 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link
            href={`/dashboard/creator/phase-4/support?ideaId=${ideaId}`}
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Step 4.5 Aids & Grants
          </Link>
          <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
            <span>4.1 Snapshot ✓</span>
            <span>4.2 Roadmap ✓</span>
            <span>4.3 Needs ✓</span>
            <span>4.4 Skills ✓</span>
            <span>4.5 Grants ✓</span>
            <span className="text-emerald-400 font-semibold">4.6 Pricing (Current)</span>
            <Link
              href={`/dashboard/creator/phase-4/gtm?ideaId=${ideaId}`}
              className="text-slate-400 hover:text-emerald-400 transition-colors"
            >
              4.7 GTM →
            </Link>
          </div>
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="max-w-7xl mx-auto p-6">
          <div className="bg-red-950/40 border border-red-800/60 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-red-200">Error</h4>
              <p className="text-xs text-red-300/80">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-xs text-red-400 hover:text-red-200"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main View */}
      <PricingStrategyView
        ideaId={ideaId}
        projectName="Your Project"
        strategy={data?.pricingStrategy || null}
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
