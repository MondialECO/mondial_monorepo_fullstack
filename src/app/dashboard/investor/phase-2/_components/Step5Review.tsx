'use client';

import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import type { InvestorFinanceDocument } from '@/types/investor/finance';

interface Step5Props {
  investorType: string;
  currency: string;
  declaredAvailableCapital: number;
  minTicket: number;
  maxTicket: number;
  deploymentPeriodMonths: number;
  sourceOfFunds: string[];
  sourceOfFundsExplanation: string;
  documents: InvestorFinanceDocument[];
  declarationConfirmed: boolean;
  onDeclarationChange: (confirmed: boolean) => void;
}

const TYPE_NAMES: Record<string, string> = {
  angel: 'Angel Investor',
  vc: 'VC / Venture Fund',
  family_office: 'Family Office',
  syndicate: 'Syndicate / SPV',
  corporate: 'Corporate / Strategic Investor',
  other: 'Other Professional Investor',
};

export default function Step5Review({
  investorType,
  currency,
  declaredAvailableCapital,
  minTicket,
  maxTicket,
  deploymentPeriodMonths,
  sourceOfFunds,
  sourceOfFundsExplanation,
  documents,
  declarationConfirmed,
  onDeclarationChange,
}: Step5Props) {
  const formatMoney = (amount: number) => {
    const symbol = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : '£';
    return `${symbol}${amount.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Review & Legal Declaration
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Please review your submitted financial capacity information and sign the accuracy declaration before submitting.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Classification & Deployment */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Classification & Deployment
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Investor Type:</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {TYPE_NAMES[investorType] || investorType || 'Not specified'}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Deployment Horizon:</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {deploymentPeriodMonths} Months
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Currency:</span>
              <span className="font-semibold text-slate-900 dark:text-white">{currency}</span>
            </div>
          </div>
        </div>

        {/* Capital & Check Sizes */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Capital & Check Sizes
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Available Capital:</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {formatMoney(declaredAvailableCapital)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Ticket Size Range:</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {formatMoney(minTicket)} – {formatMoney(maxTicket)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sources of Funds */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Source of Funds
        </div>
        <div className="flex flex-wrap gap-2">
          {sourceOfFunds.map((s) => (
            <Badge key={s} variant="secondary" className="px-3 py-1 text-xs">
              {s}
            </Badge>
          ))}
        </div>
        {sourceOfFundsExplanation && (
          <p className="text-xs text-slate-500 italic mt-2">
            Note: {sourceOfFundsExplanation}
          </p>
        )}
      </div>

      {/* Uploaded Documents */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Supporting Documents ({documents.length})
        </div>
        <div className="space-y-1.5">
          {documents.map((doc) => (
            <div key={doc.documentId} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              <span>{doc.originalFilename}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Declaration Checkbox */}
      <div className="p-4 rounded-xl border-2 border-emerald-600/30 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-3">
        <label
          className="flex items-start gap-3 cursor-pointer"
        >
          <Checkbox
            checked={declarationConfirmed}
            onChange={(e) => onDeclarationChange(e.target.checked)}
            id="declaration-checkbox"
            className="mt-0.5"
          />
          <div className="text-sm font-medium text-slate-900 dark:text-white select-none">
            I confirm that the information provided is accurate and that I am authorized to invest or represent the capital described above.
          </div>
        </label>
      </div>
    </div>
  );
}
