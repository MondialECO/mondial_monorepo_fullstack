'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ShieldCheck, Lock } from 'lucide-react';

interface Step3Props {
  sourceOfFunds: string[];
  sourceOfFundsExplanation: string;
  onChange: (field: string, value: any) => void;
}

const SOURCES = [
  { id: 'Personal Savings', label: 'Personal Savings & Retained Capital' },
  { id: 'Business Income', label: 'Operating Business Revenue / Profits' },
  { id: 'Investment Proceeds', label: 'Realized Investment Exits / Capital Gains' },
  { id: 'Family Office Capital', label: 'Family Office Allocation / Trust Assets' },
  { id: 'Fund Capital', label: 'Committed Fund Capital (LP Drawdowns)' },
  { id: 'Corporate Treasury', label: 'Corporate Balance Sheet / Treasury' },
  { id: 'Syndicated Capital', label: 'Syndicated / Co-investor Commitments' },
  { id: 'Other Legitimate Source', label: 'Other Verified Legitimate Source' },
];

export default function Step3SourceOfFunds({
  sourceOfFunds,
  sourceOfFundsExplanation,
  onChange,
}: Step3Props) {
  const toggleSource = (sourceId: string) => {
    if (sourceOfFunds.includes(sourceId)) {
      onChange(
        'sourceOfFunds',
        sourceOfFunds.filter((s) => s !== sourceId)
      );
    } else {
      onChange('sourceOfFunds', [...sourceOfFunds, sourceId]);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Source of Investment Funds
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Select all applicable origin sources for the capital you intend to deploy on Mondial. This information
          is used exclusively for AML and investor qualification compliance.
        </p>
      </div>

      {/* Structured Source Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {SOURCES.map((s) => {
          const isChecked = sourceOfFunds.includes(s.id);
          return (
            <label
              key={s.id}
              className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                isChecked
                  ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-500'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
              }`}
            >
              <Checkbox
                checked={isChecked}
                onChange={() => toggleSource(s.id)}
                className="mt-0.5"
              />
              <span className="text-sm font-medium text-slate-800 dark:text-slate-200 select-none">
                {s.label}
              </span>
            </label>
          );
        })}
      </div>

      {/* Optional Explanation */}
      <div className="space-y-2 pt-2">
        <Label htmlFor="explanation" className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Additional Context / Explanatory Notes (Optional)
        </Label>
        <Textarea
          id="explanation"
          rows={3}
          placeholder="Add any context regarding corporate holding structure, fund vintage, or deployment entities..."
          value={sourceOfFundsExplanation}
          onChange={(e) => onChange('sourceOfFundsExplanation', e.target.value)}
          className="text-sm"
        />
      </div>

      {/* Security & Confidentiality Banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
        <Lock className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-800 dark:text-slate-100">
            Confidentiality & Compliance Protection:
          </span>{' '}
          Mondial never requests bank logins, passwords, PINs, or trading credentials. All declarations are encrypted and reviewed solely by Mondial compliance officers.
        </div>
      </div>
    </div>
  );
}
