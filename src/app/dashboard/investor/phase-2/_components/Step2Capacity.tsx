'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign, Clock, AlertCircle } from 'lucide-react';

interface Step2Props {
  currency: string;
  declaredAvailableCapital: number;
  minTicket: number;
  maxTicket: number;
  deploymentPeriodMonths: number;
  onChange: (field: string, value: any) => void;
}

const CURRENCIES = [
  { code: 'EUR', symbol: '€', label: 'EUR (€)' },
  { code: 'USD', symbol: '$', label: 'USD ($)' },
  { code: 'GBP', symbol: '£', label: 'GBP (£)' },
];

const DEPLOYMENT_PERIODS = [
  { months: 6, label: '6 Months' },
  { months: 12, label: '12 Months (1 Year)' },
  { months: 18, label: '18 Months' },
  { months: 24, label: '24 Months (2 Years)' },
  { months: 36, label: '36 Months (3 Years)' },
];

export default function Step2Capacity({
  currency,
  declaredAvailableCapital,
  minTicket,
  maxTicket,
  deploymentPeriodMonths,
  onChange,
}: Step2Props) {
  const curr = CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0];

  const hasMaxLowerThanMin = maxTicket > 0 && minTicket > 0 && maxTicket < minTicket;
  const hasCapitalLowerThanMax =
    declaredAvailableCapital > 0 && maxTicket > 0 && declaredAvailableCapital < maxTicket;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Investment Capacity & Check Sizes
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Specify your available investment capital and individual ticket size range. Note that total capacity
          is your deployment pool, while ticket size represents your check per deal.
        </p>
      </div>

      {/* Currency Selector */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Preferred Investment Currency
        </Label>
        <div className="grid grid-cols-3 gap-3">
          {CURRENCIES.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => onChange('currency', c.code)}
              className={`p-3 rounded-lg border text-sm font-semibold transition-all ${
                currency === c.code
                  ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
                  : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Available Investment Capital */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="availableCapital" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Available Investment Capital ({curr.symbol})
          </Label>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Total liquid/allocatable capital
          </span>
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-semibold">
            {curr.symbol}
          </div>
          <Input
            id="availableCapital"
            type="number"
            min={1000}
            step={5000}
            placeholder="e.g. 500000"
            value={declaredAvailableCapital || ''}
            onChange={(e) => onChange('declaredAvailableCapital', parseFloat(e.target.value) || 0)}
            className="pl-8 text-base font-medium"
          />
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Kept strictly confidential. This figure is never published or shown to founders.
        </p>
      </div>

      {/* Ticket Size Range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="minTicket" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Minimum Check Size ({curr.symbol})
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-semibold">
              {curr.symbol}
            </div>
            <Input
              id="minTicket"
              type="number"
              min={500}
              step={1000}
              placeholder="e.g. 25000"
              value={minTicket || ''}
              onChange={(e) => onChange('minTicket', parseFloat(e.target.value) || 0)}
              className="pl-8 font-medium"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxTicket" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Maximum Check Size ({curr.symbol})
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-semibold">
              {curr.symbol}
            </div>
            <Input
              id="maxTicket"
              type="number"
              min={1000}
              step={5000}
              placeholder="e.g. 100000"
              value={maxTicket || ''}
              onChange={(e) => onChange('maxTicket', parseFloat(e.target.value) || 0)}
              className="pl-8 font-medium"
            />
          </div>
        </div>
      </div>

      {hasMaxLowerThanMin && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Maximum check size cannot be less than minimum check size.</span>
        </div>
      )}

      {hasCapitalLowerThanMax && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Total available capital is typically equal to or higher than your maximum check size.</span>
        </div>
      )}

      {/* Deployment Period */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Expected Deployment Horizon
        </Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {DEPLOYMENT_PERIODS.map((p) => (
            <button
              key={p.months}
              type="button"
              onClick={() => onChange('deploymentPeriodMonths', p.months)}
              className={`p-2.5 rounded-lg border text-xs font-semibold transition-all ${
                deploymentPeriodMonths === p.months
                  ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
                  : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
