'use client';

import { User, Users, History, FileText, CheckCircle2 } from 'lucide-react';

export default function CapTableClaritySection() {
  const concepts = [
    {
      num: '01',
      title: 'ISSUED',
      desc: 'Finalized and granted shares. Legally binding ownership records.',
    },
    {
      num: '02',
      title: 'RESERVED',
      desc: 'Shares set aside for future use, typically for hiring or acquisitions.',
    },
    {
      num: '03',
      title: 'VESTING',
      desc: 'Ownership earned over time, ensuring long-term alignment.',
    },
    {
      num: '04',
      title: 'OPTION POOL',
      desc: 'Dedicated equity for future employees and key contributors.',
    },
    {
      num: '05',
      title: 'CONVERTIBLE',
      desc: 'Rights that may become shares upon specific triggering events.',
    },
    {
      num: '06',
      title: 'FULLY DILUTED',
      desc: 'Total possible ownership count including all potential shares.',
    },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            OWNERSHIP, MADE LEGIBLE
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            See the company behind
            <br />
            the percentages.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            A cap table should help the Entrepreneur understand the people, securities and ownership relationships behind the company — not just display a spreadsheet.
          </p>
        </div>

        {/* Nova Space Ownership Structure */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between pb-3 border-b border-[rgba(0,0,0,0.06)]">
            <h3 className="font-heading font-extrabold text-[20px] sm:text-[24px] text-[#070707]">
              NOVA SPACE SAS
            </h3>
            <span className="px-3 py-1 rounded-full bg-[#F3F2FD] text-[#3C61DD] font-bold text-[11px] uppercase tracking-wider">
              100% COMPANY OWNERSHIP
            </span>
          </div>

          {/* 3 Primary Ownership Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {/* Card 1: Founders (80%) */}
            <div className="bg-[#3C61DD] text-white rounded-[24px] p-6 sm:p-8 flex flex-col justify-between gap-8 shadow-md">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-bold text-white/80 uppercase tracking-wider block">
                    FOUNDERS
                  </span>
                  <h4 className="font-heading font-extrabold text-[22px]">Equity Core</h4>
                </div>
                <span className="text-[48px] sm:text-[56px] font-heading font-extrabold leading-none">
                  80%
                </span>
              </div>

              <div className="pt-4 border-t border-white/20 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-[14px]">
                  HM
                </div>
                <div>
                  <span className="font-bold text-[15px] block leading-tight">Henry Martin</span>
                  <span className="text-[12px] text-white/80">Managing Director</span>
                </div>
              </div>
            </div>

            {/* Card 2: Option Pool (10%) */}
            <div className="bg-[#FFB865] text-[#774800] rounded-[24px] p-6 sm:p-8 flex flex-col justify-between gap-8 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-bold text-[#774800]/80 uppercase tracking-wider block">
                    OPTIONS
                  </span>
                  <h4 className="font-heading font-extrabold text-[22px]">Incentive Pool</h4>
                </div>
                <span className="text-[48px] sm:text-[56px] font-heading font-extrabold leading-none">
                  10%
                </span>
              </div>

              <div className="pt-4 border-t border-[#774800]/20 flex items-center gap-2 text-[14px] font-bold">
                <Users size={18} />
                <span>EMPLOYEE POOL</span>
              </div>
            </div>

            {/* Card 3: Early (10%) */}
            <div className="bg-[#E8E7F2] text-[#1A1B23] rounded-[24px] p-6 sm:p-8 flex flex-col justify-between gap-8 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-bold text-[#747685] uppercase tracking-wider block">
                    EARLY
                  </span>
                  <h4 className="font-heading font-extrabold text-[22px]">Angel Round</h4>
                </div>
                <span className="text-[48px] sm:text-[56px] font-heading font-extrabold leading-none text-[#1A1B23]">
                  10%
                </span>
              </div>

              <div className="pt-4 border-t border-[rgba(0,0,0,0.1)] flex items-center gap-2 text-[14px] font-bold text-[#444654]">
                <History size={18} />
                <span>HISTORICAL</span>
              </div>
            </div>
          </div>
        </div>

        {/* 6 Concept Grid Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {concepts.map((c) => (
            <div
              key={c.num}
              className="p-6 rounded-[20px] bg-[#FAF8FF] border border-[#E2E1EC] flex flex-col justify-between gap-4 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[13px] font-bold text-[#3C61DD]">{c.num}</span>
                <span className="font-heading font-bold text-[14px] text-[#747685] tracking-wider">
                  {c.title}
                </span>
              </div>
              <p className="text-[13px] sm:text-[14px] text-[#444654] leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>

        {/* Big Statement Banner */}
        <div className="w-full p-8 sm:p-12 rounded-[24px] bg-[#FAF8FF] border border-[#E2E1EC] text-center flex flex-col items-center gap-2 shadow-xs">
          <span className="text-[28px] sm:text-[48px] lg:text-[64px] font-heading font-extrabold text-[#070707] leading-none">
            THE PERCENTAGE
          </span>
          <span className="text-[28px] sm:text-[48px] lg:text-[64px] font-heading font-extrabold text-[#3C61DD] leading-none">
            IS THE OUTPUT
          </span>
        </div>
      </div>
    </section>
  );
}
