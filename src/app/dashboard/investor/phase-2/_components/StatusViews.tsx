'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ShieldCheck,
  Clock,
  AlertTriangle,
  XCircle,
  FileText,
  Lock,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import type { InvestorFinanceVerification } from '@/types/investor/finance';
import Link from 'next/link';

interface StatusViewProps {
  verification: InvestorFinanceVerification;
  onEdit: () => void;
}

const TYPE_NAMES: Record<string, string> = {
  angel: 'Angel Investor',
  vc: 'VC / Venture Fund',
  family_office: 'Family Office',
  syndicate: 'Syndicate / SPV',
  corporate: 'Corporate / Strategic Investor',
  other: 'Other Professional Investor',
};

export function VerifiedView({ verification, onEdit }: StatusViewProps) {
  const formatMoney = (amount: number) => {
    const symbol = verification.currency === 'EUR' ? '€' : verification.currency === 'USD' ? '$' : '£';
    return `${symbol}${amount.toLocaleString()}`;
  };

  const verifiedDate = verification.reviewedAt || verification.updatedAt;

  return (
    <div className="space-y-6">
      {/* Verified Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-6 md:p-8 text-white shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-white/20 backdrop-blur-md text-white shadow-inner">
              <ShieldCheck className="w-9 h-9" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-2xl font-bold tracking-tight">Finance Verified</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/25 text-white">
                  Active
                </span>
              </div>
              <p className="text-emerald-100 text-sm mt-1 max-w-xl">
                Your investment capacity and investor credentials have been verified by the Mondial Compliance Team.
                You are authorized to issue term sheets and submit binding investment offers.
              </p>
              {verifiedDate && (
                <div className="text-xs text-emerald-200 mt-3 font-medium">
                  Verified on {new Date(verifiedDate).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={onEdit}
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/30 text-sm h-10 px-4"
            >
              Update Information
            </Button>
            <Button
              asChild
              className="bg-white text-emerald-800 hover:bg-emerald-50 text-sm font-semibold h-10 px-5 shadow-sm"
            >
              <Link href="/dashboard/investor/discovery">
                Discover Deals <ArrowRight className="w-4 h-4 ml-1.5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Verified Parameters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-1">
          <div className="text-xs font-medium text-slate-500 uppercase">Investor Classification</div>
          <div className="text-lg font-bold text-slate-900 dark:text-white">
            {TYPE_NAMES[verification.investorType] || verification.investorType || 'Professional Investor'}
          </div>
        </div>

        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-1">
          <div className="text-xs font-medium text-slate-500 uppercase">Public Ticket Range</div>
          <div className="text-lg font-bold text-slate-900 dark:text-white">
            {formatMoney(verification.minTicket || 10000)} – {formatMoney(verification.maxTicket || 100000)}
          </div>
        </div>

        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-1">
          <div className="text-xs font-medium text-slate-500 uppercase">Deployment Window</div>
          <div className="text-lg font-bold text-slate-900 dark:text-white">
            {verification.deploymentPeriodMonths || 12} Months
          </div>
        </div>
      </div>

      {/* Privacy Guarantee */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
        <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>
          <strong>Confidentiality Guarantee:</strong> Your exact available capital balance and uploaded financial documents remain strictly confidential and are never shared publicly or with founders.
        </span>
      </div>
    </div>
  );
}

export function UnderReviewView({ verification, onEdit }: StatusViewProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 p-6 md:p-8">
        <div className="flex items-start gap-4">
          <div className="p-3.5 rounded-2xl bg-blue-600 text-white shrink-0">
            <Clock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Finance Verification Under Review
              </h3>
              <Badge className="bg-blue-600 text-white">Review In Progress</Badge>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              Your financial capacity documents and investor classification details have been received and are currently being reviewed by our compliance team.
            </p>
            {verification.submittedAt && (
              <div className="text-xs text-slate-500 pt-2">
                Submitted on {new Date(verification.submittedAt).toLocaleDateString()} at{' '}
                {new Date(verification.submittedAt).toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
        <h4 className="font-semibold text-slate-900 dark:text-white text-base">
          What can you do while under review?
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 space-y-1">
            <div className="font-semibold text-slate-900 dark:text-white">1. Discover Startups</div>
            <p className="text-xs text-slate-500">Explore vetted opportunities, review pitch decks, and sign NDAs.</p>
          </div>
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 space-y-1">
            <div className="font-semibold text-slate-900 dark:text-white">2. Refine Thesis</div>
            <p className="text-xs text-slate-500">Tune your target sectors, check sizes, and investment criteria.</p>
          </div>
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 space-y-1">
            <div className="font-semibold text-slate-900 dark:text-white">3. Unlock Term Sheets</div>
            <p className="text-xs text-slate-500">Once approved, you will be able to submit binding offers to founders.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function NeedsUpdateView({ verification, onEdit }: StatusViewProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-amber-300 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20 p-6 md:p-8">
        <div className="flex items-start gap-4">
          <div className="p-3.5 rounded-2xl bg-amber-600 text-white shrink-0">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Information Update Requested
              </h3>
              <Badge variant="destructive" className="bg-amber-600 text-white">
                Action Required
              </Badge>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Our verification team reviewed your submission and requested additional clarification or updated documents.
            </p>

            {verification.decisionReason && (
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 text-sm font-medium text-slate-900 dark:text-white">
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 block mb-1">
                  Reviewer Note:
                </span>
                "{verification.decisionReason}"
              </div>
            )}

            <Button
              onClick={onEdit}
              className="bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold h-10 px-5"
            >
              Update Documents & Resubmit
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RejectedView({ verification, onEdit }: StatusViewProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 p-6 md:p-8">
        <div className="flex items-start gap-4">
          <div className="p-3.5 rounded-2xl bg-red-600 text-white shrink-0">
            <XCircle className="w-8 h-8" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Finance Verification Not Approved
              </h3>
              <Badge variant="destructive">Not Approved</Badge>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              We were unable to verify your investment capacity based on the submitted materials.
            </p>

            {verification.decisionReason && (
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/60 text-sm font-medium text-slate-900 dark:text-white">
                <span className="text-xs font-semibold text-red-600 dark:text-red-400 block mb-1">
                  Reason:
                </span>
                "{verification.decisionReason}"
              </div>
            )}

            <Button
              onClick={onEdit}
              className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold h-10 px-5"
            >
              Submit New Verification
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
