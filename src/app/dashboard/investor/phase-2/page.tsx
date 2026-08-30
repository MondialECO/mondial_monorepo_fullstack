'use client';

import React, { useState } from 'react';
import { useInvestorFinanceVerification } from '@/hooks/queries/investor-finance';
import FinanceVerificationWizard from './_components/FinanceVerificationWizard';
import {
  VerifiedView,
  UnderReviewView,
  NeedsUpdateView,
  RejectedView,
} from './_components/StatusViews';
import { Skeleton } from '@/components/ui/skeleton';
import { ShieldCheck } from 'lucide-react';

export default function InvestorPhase2Page() {
  const { data: verification, isLoading, isError, refetch } = useInvestorFinanceVerification();
  const [isEditing, setIsEditing] = useState(false);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-[450px] w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !verification) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 space-y-3">
        <div className="text-red-700 dark:text-red-400 font-semibold">
          Failed to load finance verification details.
        </div>
        <button
          onClick={() => refetch()}
          className="text-xs text-emerald-600 font-semibold hover:underline"
        >
          Try Again
        </button>
      </div>
    );
  }

  const status = verification.status;
  const showWizard =
    isEditing || status === 'not_started' || status === 'draft';

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-xs uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" /> Phase 2 • Verification
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
          Finance & Capital Verification
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
          Verify your investment classification, ticket range, and source of funds to earn the Finance Verified Badge and unlock binding term sheet issuance.
        </p>
      </div>

      {/* Main Content Area */}
      {showWizard ? (
        <FinanceVerificationWizard
          initialData={verification}
          onSubmitted={() => {
            setIsEditing(false);
            refetch();
          }}
          onCancel={isEditing ? () => setIsEditing(false) : undefined}
        />
      ) : status === 'verified' ? (
        <VerifiedView verification={verification} onEdit={() => setIsEditing(true)} />
      ) : status === 'under_review' || status === 'submitted' ? (
        <UnderReviewView verification={verification} onEdit={() => setIsEditing(true)} />
      ) : status === 'needs_update' ? (
        <NeedsUpdateView verification={verification} onEdit={() => setIsEditing(true)} />
      ) : status === 'rejected' ? (
        <RejectedView verification={verification} onEdit={() => setIsEditing(true)} />
      ) : null}
    </div>
  );
}
