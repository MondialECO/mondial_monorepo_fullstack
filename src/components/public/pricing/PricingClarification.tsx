'use client';

import { AlertCircle } from 'lucide-react';

export default function PricingClarification() {
  const platformPrices = [
    { role: 'Creator', price: '€0' },
    { role: 'Entrepreneur', price: '€0' },
    { role: 'Provider', price: '€9.99/mo' },
    { role: 'Investor', price: '€9.99/mo' },
  ];

  const externalCosts = [
    'Professional services',
    'Company registration',
    'Legal advice',
    'Accounting',
    'Banking',
    'Taxes',
    'Payment processing',
    'Other third-party costs',
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#FAF8FF] flex justify-center border-b border-[rgba(0,0,0,0.06)]">
      <div className="w-full max-w-[1240px] flex flex-col gap-8 sm:gap-10">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#BA1A1A] uppercase tracking-wider">
            TRANSPARENCY &amp; BOUNDARIES
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Important Clarification
          </h2>
        </div>

        {/* Warning Alert Banner (Figma same-to-same #FFDAD6 / #93000A) */}
        <div className="p-5 sm:p-6 rounded-[20px] bg-[#FFDAD6] border border-[#BA1A1A]/30 flex items-start sm:items-center gap-3.5 shadow-2xs">
          <AlertCircle size={22} className="text-[#93000A] shrink-0 mt-0.5 sm:mt-0" />
          <p className="text-[13px] sm:text-[15px] font-heading font-bold text-[#93000A] leading-snug">
            FREE MONDIAL ACCESS does NOT automatically mean EVERY REAL-WORLD BUSINESS COST IS FREE.
          </p>
        </div>

        {/* 2 Comparison Cards: Mondial Platform Price vs Possible External Costs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {/* Card 1: MONDIAL PLATFORM PRICE */}
          <div className="p-6 sm:p-8 rounded-[28px] bg-white border border-[#E2E1EC] shadow-2xs flex flex-col justify-between gap-6">
            <div>
              <span className="text-[11px] font-extrabold text-[#3C61DD] uppercase tracking-wider block mb-4">
                MONDIAL PLATFORM PRICE
              </span>
              <div className="space-y-3">
                {platformPrices.map((p) => (
                  <div
                    key={p.role}
                    className="p-3.5 rounded-[14px] bg-[#FAF8FF] border border-[#E2E1EC] flex items-center justify-between"
                  >
                    <span className="font-heading font-bold text-[14px] text-[#1A1B23]">
                      {p.role}
                    </span>
                    <span className="font-heading font-extrabold text-[15px] text-[#1A1B23]">
                      {p.price}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-[12px] text-[#747685] italic pt-2">
              Fixed platform access fee per active ecosystem role.
            </p>
          </div>

          {/* Card 2: POSSIBLE EXTERNAL COSTS */}
          <div className="p-6 sm:p-8 rounded-[28px] bg-white border border-[#E2E1EC] shadow-2xs flex flex-col justify-between gap-6">
            <div>
              <span className="text-[11px] font-extrabold text-[#747685] uppercase tracking-wider block mb-4">
                POSSIBLE EXTERNAL COSTS
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {externalCosts.map((cost) => (
                  <div
                    key={cost}
                    className="p-3 rounded-[12px] bg-[#FAF8FF] border border-[#E2E1EC] text-[12px] font-medium text-[#444654] flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#747685]" />
                    <span>{cost}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-[12px] text-[#747685] italic pt-2">
              External costs paid directly to third parties, regulators, or government agencies.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
