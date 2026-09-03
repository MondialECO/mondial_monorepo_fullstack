'use client';

import { ShieldCheck, TrendingDown, ArrowRight, ArrowDown, Award } from 'lucide-react';

export default function PlatformEconomicsSection() {
  const tiers = [
    {
      num: 'Tier 1',
      title: 'IDENTITY',
      paidWork: 'Not available.',
      commission: '—',
      calc: null,
    },
    {
      num: 'Tier 2',
      title: 'BASIC VERIFIED',
      paidWork: 'Available',
      commission: '12%',
      calc: { fee: '$240', payout: '$1,760' },
    },
    {
      num: 'Tier 3',
      title: 'VERIFIED PROFESSIONAL',
      paidWork: 'Premium Opportunities',
      commission: '8%',
      calc: { fee: '$160', payout: '$1,840' },
    },
    {
      num: 'Tier 4',
      title: 'VETTED',
      paidWork: 'Featured + Priority',
      commission: '5%',
      calc: { fee: '$100', payout: '$1,900' },
    },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#747685] uppercase tracking-wider">
            PLATFORM ECONOMICS
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Your Provider tier
            <br />
            changes more than a badge.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Eligible Provider tiers can affect platform commission and access to stronger opportunity visibility.
          </p>
        </div>

        {/* 4-Tier Model & Illustrative $2,000 Calculation Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
          {tiers.map((t) => (
            <div
              key={t.num}
              className={`p-6 rounded-[24px] border flex flex-col justify-between gap-5 transition-all ${
                t.num === 'Tier 3'
                  ? 'bg-white border-2 border-[#3C61DD] shadow-md relative'
                  : 'bg-[#FAF8FF] border-[#E2E1EC] shadow-2xs'
              }`}
            >
              {t.num === 'Tier 3' && (
                <div className="absolute -top-3 right-6 px-2.5 py-0.5 rounded-full bg-[#3C61DD] text-white text-[9px] font-extrabold uppercase">
                  ACTIVE BENCHMARK
                </div>
              )}

              <div className="flex flex-col gap-3">
                <div>
                  <span className="text-[10px] font-bold text-[#747685] uppercase">{t.num}</span>
                  <h3 className="font-heading font-bold text-[16px] text-[#1A1B23]">{t.title}</h3>
                </div>

                <div className="space-y-1.5 text-[12px]">
                  <div>
                    <span className="text-[#747685]">Paid Work:</span>{' '}
                    <strong className="text-[#1A1B23]">{t.paidWork}</strong>
                  </div>
                  <div>
                    <span className="text-[#747685]">Commission:</span>{' '}
                    <strong className="text-[#3C61DD]">{t.commission}</strong>
                  </div>
                </div>
              </div>

              {t.calc && (
                <div className="p-3 rounded-[12px] bg-white border border-[#E2E1EC] text-[11px] flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-[#747685] uppercase">
                    ON $2,000 PROJECT:
                  </span>
                  <div className="flex justify-between text-[#BA1A1A]">
                    <span>Fee:</span>
                    <span>{t.calc.fee}</span>
                  </div>
                  <div className="flex justify-between text-[#157A55] font-bold">
                    <span>Provider:</span>
                    <span>{t.calc.payout}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Conceptual Relationship */}
        <div className="p-5 sm:p-6 rounded-[20px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-2xs flex flex-wrap items-center justify-center gap-3 text-[12px] sm:text-[13px] font-bold text-[#1A1B23]">
          <span className="px-4 py-2 rounded-[10px] bg-white border border-[#E2E1EC]">
            STRONGER VERIFIED STATUS
          </span>
          <span className="text-[#3C61DD]">➔</span>
          <span className="px-4 py-2 rounded-[10px] bg-white border border-[#E2E1EC]">
            LOWER COMMISSION
          </span>
          <span className="text-[#3C61DD]">➔</span>
          <span className="px-5 py-2 rounded-[10px] bg-[#1A47C3] text-white shadow-xs">
            STRONGER OPPORTUNITY ACCESS
          </span>
        </div>

        {/* Mandatory Disclaimer */}
        <div className="p-4 rounded-[16px] bg-[#FAF8FF] border border-[#E2E1EC] text-center text-[12px] text-[#747685]">
          *TIER PROGRESSION DOES NOT GUARANTEE MORE CLIENTS OR MORE INCOME.
        </div>
      </div>
    </section>
  );
}
