'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface RevenueInputFormProps {
  revenues: {
    q1: number;
    q2: number;
    q3: number;
    q4: number;
  };
  onRevenuesChange: (revenues: { q1: number; q2: number; q3: number; q4: number }) => void;
}

export function RevenueInputForm({
  revenues,
  onRevenuesChange,
}: RevenueInputFormProps) {
  const handleInputChange = (quarter: keyof typeof revenues, value: string) => {
    const numValue = parseFloat(value) || 0;
    onRevenuesChange({
      ...revenues,
      [quarter]: numValue,
    });
  };

  const formatCurrency = (value: number) => {
    return value === 0 ? '€ 0.00' : `€ ${value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Q1 */}
      <div className="space-y-2 sm:space-y-3">
        <label htmlFor="q1" className="text-xs sm:text-sm font-medium text-neutral-1 uppercase block">
          Q1 REVENUE (JAN - MAR)
        </label>
        <div className="bg-neutral-3 border border-neutral-2 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 flex items-center">
          <input
            id="q1"
            type="number"
            value={revenues.q1 || ''}
            onChange={(e) => handleInputChange('q1', e.target.value)}
            placeholder="0.00"
            className="flex-1 bg-transparent text-sm sm:text-base text-neutral-1 placeholder-neutral-5 outline-none"
          />
        </div>
      </div>

      {/* Q2 */}
      <div className="space-y-2 sm:space-y-3">
        <label htmlFor="q2" className="text-xs sm:text-sm font-medium text-neutral-1 uppercase block">
          Q2 REVENUE (APR - JUN)
        </label>
        <div className="bg-neutral-3 border border-neutral-2 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 flex items-center">
          <input
            id="q2"
            type="number"
            value={revenues.q2 || ''}
            onChange={(e) => handleInputChange('q2', e.target.value)}
            placeholder="0.00"
            className="flex-1 bg-transparent text-sm sm:text-base text-neutral-1 placeholder-neutral-5 outline-none"
          />
        </div>
      </div>

      {/* Q3 */}
      <div className="space-y-2 sm:space-y-3">
        <label htmlFor="q3" className="text-xs sm:text-sm font-medium text-neutral-1 uppercase block">
          Q3 REVENUE (JUL - SEP)
        </label>
        <div className="bg-neutral-3 border border-neutral-2 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 flex items-center">
          <input
            id="q3"
            type="number"
            value={revenues.q3 || ''}
            onChange={(e) => handleInputChange('q3', e.target.value)}
            placeholder="0.00"
            className="flex-1 bg-transparent text-sm sm:text-base text-neutral-1 placeholder-neutral-5 outline-none"
          />
        </div>
      </div>

      {/* Q4 */}
      <div className="space-y-2 sm:space-y-3">
        <label htmlFor="q4" className="text-xs sm:text-sm font-medium text-neutral-1 uppercase block">
          Q4 REVENUE (OCT - DEC)
        </label>
        <div className="bg-neutral-3 border border-neutral-2 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 flex items-center">
          <input
            id="q4"
            type="number"
            value={revenues.q4 || ''}
            onChange={(e) => handleInputChange('q4', e.target.value)}
            placeholder="0.00"
            className="flex-1 bg-transparent text-sm sm:text-base text-neutral-1 placeholder-neutral-5 outline-none"
          />
        </div>
      </div>

      {/* Recalculate Button */}
      <Button
        className="w-full bg-primary hover:bg-primary/90 text-white font-medium min-h-[44px] sm:min-h-[48px] gap-2"
        size="lg"
      >
        Recalculate
        <ArrowRight className="w-5 h-5" />
      </Button>
    </div>
  );
}
