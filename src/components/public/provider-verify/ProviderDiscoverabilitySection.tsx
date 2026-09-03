'use client';

import { CheckCircle2, PauseCircle, ArrowRight, UserCheck, Check } from 'lucide-react';

export default function ProviderDiscoverabilitySection() {
  const contributors = [
    { label: 'Photo', weight: '10%' },
    { label: 'Bio', weight: '10%' },
    { label: 'Intro Video', weight: '15%' },
    { label: 'Skills Test', weight: '15%' },
    { label: 'Portfolio', weight: '20%' },
    { label: 'Live Service', weight: '20%' },
    { label: 'Social Links', weight: '10%' },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#747685] uppercase tracking-wider">
            BE READY TO BE DISCOVERED
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            A strong profile matters.
            <br />
            So does being available.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Mondial combines profile completeness with real capacity signals so the ecosystem can understand whether a Provider is ready for new work.
          </p>
        </div>

        {/* 2 Main Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left: Profile Strength (6 cols) */}
          <div className="lg:col-span-6 p-6 sm:p-8 rounded-[28px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-6">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded bg-[#E8E7F2] text-[#444654] text-[10px] font-bold uppercase">
                ILLUSTRATIVE EXAMPLE
              </span>
              <span className="text-[10px] font-bold text-[#3C61DD] uppercase">
                CURRENT MODEL
              </span>
            </div>

            {/* Circular Composition & Center Score */}
            <div className="flex flex-col items-center gap-6 py-4">
              <div className="w-[180px] h-[180px] rounded-full bg-white border-4 border-[#3C61DD] shadow-md flex flex-col items-center justify-center text-center p-4">
                <span className="text-[10px] font-bold text-[#747685] uppercase">
                  PROFILE STRENGTH
                </span>
                <span className="text-[44px] font-heading font-extrabold text-[#3C61DD] leading-none my-1">
                  82%
                </span>
              </div>

              {/* Contributors Grid */}
              <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px]">
                {contributors.map((c) => (
                  <div
                    key={c.label}
                    className="p-2 rounded-[8px] bg-white border border-[#E2E1EC] flex items-center justify-between"
                  >
                    <span className="font-bold text-[#1A1B23]">{c.label}</span>
                    <span className="text-[#3C61DD] font-semibold">{c.weight}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Real Capacity (6 cols) */}
          <div className="lg:col-span-6 flex flex-col justify-between gap-6">
            {/* Available Now Card */}
            <div className="p-6 sm:p-8 rounded-[28px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col gap-6">
              <div className="flex items-center gap-3 pb-3 border-b border-[rgba(0,0,0,0.06)]">
                <span className="w-3 h-3 rounded-full bg-[#157A55] animate-pulse" />
                <h3 className="font-heading font-extrabold text-[20px] text-[#1A1B23]">
                  AVAILABLE NOW
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 rounded-[12px] bg-[#FAF8FF] border border-[#E2E1EC]">
                  <span className="text-[10px] font-bold text-[#747685] uppercase block">
                    Current Projects
                  </span>
                  <span className="text-[20px] font-heading font-extrabold text-[#1A1B23] block mt-1">
                    2
                  </span>
                </div>

                <div className="p-3 rounded-[12px] bg-[#FAF8FF] border border-[#E2E1EC]">
                  <span className="text-[10px] font-bold text-[#747685] uppercase block">
                    Maximum Capacity
                  </span>
                  <span className="text-[20px] font-heading font-extrabold text-[#1A1B23] block mt-1">
                    4
                  </span>
                </div>

                <div className="p-3 rounded-[12px] bg-[#E8F8EE] border border-[#157A55]/30">
                  <span className="text-[10px] font-bold text-[#157A55] uppercase block">
                    Open Capacity
                  </span>
                  <span className="text-[20px] font-heading font-extrabold text-[#157A55] block mt-1">
                    2
                  </span>
                </div>

                <div className="p-3 rounded-[12px] bg-[#FAF8FF] border border-[#E2E1EC]">
                  <span className="text-[10px] font-bold text-[#747685] uppercase block">
                    Vacation Mode
                  </span>
                  <span className="text-[20px] font-heading font-extrabold text-[#1A1B23] block mt-1">
                    Off
                  </span>
                </div>
              </div>
            </div>

            {/* Matching Logic Transitions */}
            <div className="p-6 rounded-[24px] bg-[#FAF8FF] border border-[#E2E1EC] flex flex-col gap-3">
              {/* Success logic */}
              <div className="p-3.5 rounded-[14px] bg-[#E8F8EE] border border-[#157A55]/30 flex flex-wrap items-center justify-between gap-3 text-[12px]">
                <span className="font-bold text-[#1A1B23]">
                  PROFILE COMPLETE + AVAILABLE CAPACITY
                </span>
                <span className="text-[#157A55] font-extrabold uppercase">
                  ➔ ELIGIBLE FOR RELEVANT MATCHING
                </span>
              </div>

              {/* Capacity reached */}
              <div className="p-3.5 rounded-[14px] bg-white border border-[#E2E1EC] flex flex-wrap items-center justify-between gap-3 text-[12px]">
                <span className="font-bold text-[#747685]">CAPACITY REACHED</span>
                <span className="text-[#875301] font-extrabold uppercase">
                  ➔ NEW ECOSYSTEM LEADS AUTO-PAUSE
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Closing Statement */}
        <div className="p-5 sm:p-6 rounded-[20px] bg-[#FAF8FF] border border-[#E2E1EC] text-center shadow-xs">
          <p className="font-heading font-extrabold text-[14px] sm:text-[16px] text-[#070707] uppercase tracking-wide">
            DISCOVERABILITY SHOULD REFLECT BOTH TRUST AND REAL CAPACITY.
          </p>
        </div>
      </div>
    </section>
  );
}
