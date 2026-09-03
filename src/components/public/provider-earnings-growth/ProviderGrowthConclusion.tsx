'use client';

import { DollarSign, Star, TrendingUp, ShieldCheck } from 'lucide-react';

export default function ProviderGrowthConclusion() {
  const loopParts = [
    {
      num: '01',
      title: 'Deliver & Get Paid',
      desc: 'Complete projects successfully to release escrowed funds.',
      icon: DollarSign,
    },
    {
      num: '02',
      title: 'Build Reputation',
      desc: 'Receive feedback and build your Mondial Score.',
      icon: Star,
    },
    {
      num: '03',
      title: 'Improve Tier',
      desc: 'Gain stronger visibility and access to premium opportunities.',
      icon: TrendingUp,
    },
  ];

  const tiers = [
    { num: 'TIER 1', name: 'Identity', desc: 'Basic profile setup and verification.', comm: '—' },
    { num: 'TIER 2', name: 'Paid Work', desc: 'Progression depends on history, Mondial Score, Skills Test.', comm: '12% Comm.' },
    { num: 'TIER 3', name: 'Verified Pro', desc: 'Access to premium opportunities. Requires Application + Human Review.', comm: '8% Comm.' },
    { num: 'TIER 4', name: 'Vetted', desc: 'Featured profiles with priority placement.', comm: '5% Comm.' },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            EARNINGS &amp; GROWTH
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Each completed project
            <br />
            can strengthen the next one.
          </h2>
        </div>

        {/* 3-Part Growth Loop */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {loopParts.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.title}
                className="p-6 rounded-[24px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#3C61DD] uppercase">{p.num}</span>
                  <Icon size={18} className="text-[#3C61DD]" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-[18px] text-[#1A1B23]">{p.title}</h3>
                  <p className="text-[13px] text-[#444654] mt-1">{p.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tier Progression Grid */}
        <div className="p-6 sm:p-8 rounded-[28px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-xs flex flex-col gap-6">
          <span className="text-[11px] font-bold text-[#747685] uppercase tracking-wider">
            CURRENT PLATFORM TIER PROGRESSION
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {tiers.map((t) => (
              <div
                key={t.num}
                className="p-5 rounded-[20px] bg-white border border-[#E2E1EC] flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#747685] uppercase">{t.num}</span>
                    <span className="text-[10px] font-bold text-[#3C61DD]">{t.comm}</span>
                  </div>
                  <h4 className="font-heading font-bold text-[15px] text-[#1A1B23] mt-1">{t.name}</h4>
                  <p className="text-[11px] text-[#747685] mt-1">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tier Statement */}
        <div className="p-6 sm:p-7 rounded-[20px] bg-[#FAF8FF] border border-[#E2E1EC] text-center shadow-xs">
          <h3 className="font-heading font-extrabold text-[15px] sm:text-[18px] text-[#070707] uppercase tracking-wide">
            A HIGHER TIER SHOULD REPRESENT STRONGER TRUST AND HISTORY.
            <br />
            NOT A PURCHASED STATUS.
          </h3>
        </div>
      </div>
    </section>
  );
}
