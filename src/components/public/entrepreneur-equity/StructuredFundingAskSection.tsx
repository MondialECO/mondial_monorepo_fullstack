'use client';

import { CheckCircle2, ArrowDown, ArrowRight, DollarSign, PieChart, Layers } from 'lucide-react';

export default function StructuredFundingAskSection() {
  const steps = [
    { num: 'STEP 1', label: 'CURRENT COMPANY', title: 'NOVA SPACE SAS' },
    { num: 'STEP 2', label: 'NEXT MILESTONE', title: 'Launch & validate first market' },
    {
      num: 'STEP 3',
      label: 'WHAT MUST HAPPEN',
      items: ['Complete tech', 'Onboard supply', 'Acquire customers', 'Fund ops'],
    },
    {
      num: 'STEP 4',
      label: 'RESOURCE REQUIREMENT',
      title: 'Tech + Growth + Ops + Working Capital',
    },
    { num: 'STEP 5', label: 'FUNDING NEED', amount: '€500K', isHero: true },
  ];

  const allocations = [
    { name: 'PRODUCT & TECHNOLOGY', pct: '40%', width: '40%', bg: 'bg-[#3C61DD]' },
    { name: 'GROWTH', pct: '25%', width: '25%', bg: 'bg-[#FFB865]' },
    { name: 'OPERATIONS', pct: '20%', width: '20%', bg: 'bg-[#747685]' },
    { name: 'WORKING CAPITAL', pct: '15%', width: '15%', bg: 'bg-[#DAD9E4]' },
  ];

  const equationTerms = ['FUNDING ASK', 'PURPOSE', 'MILESTONES', 'RUNWAY', 'INSTRUMENT'];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#747685] uppercase tracking-wider">
            FROM &ldquo;WE NEED MONEY&rdquo; TO A STRUCTURED ASK
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Raise for a reason.
            <br />
            Not just a number.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            A stronger funding ask connects the amount being raised to company priorities, milestones, runway and expected use of funds.
          </p>
        </div>

        {/* 2-Column Composition */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Funding Logic Flow (7 cols) */}
          <div className="lg:col-span-7 bg-[#FAF8FF] border border-[#E2E1EC] rounded-[24px] p-6 sm:p-8 flex flex-col gap-6 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[rgba(0,0,0,0.06)]">
              <span className="text-[11px] font-bold text-[#3C61DD] uppercase tracking-wider">
                ILLUSTRATIVE EXAMPLE
              </span>
              <span className="text-[11px] text-[#747685] font-bold uppercase">5-STEP LOGIC</span>
            </div>

            <div className="flex flex-col gap-3">
              {/* Step 1 */}
              <div className="p-4 rounded-[14px] bg-white border border-[#E2E1EC] flex flex-col gap-1">
                <span className="text-[10px] font-bold text-[#747685] uppercase">
                  STEP 1: CURRENT COMPANY
                </span>
                <span className="font-heading font-bold text-[16px] text-[#1A1B23]">
                  NOVA SPACE SAS
                </span>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-[14px] bg-white border border-[#E2E1EC] flex flex-col gap-1">
                <span className="text-[10px] font-bold text-[#747685] uppercase">
                  STEP 2: NEXT MILESTONE
                </span>
                <span className="font-heading font-bold text-[16px] text-[#1A1B23]">
                  Launch &amp; validate first market
                </span>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-[14px] bg-white border border-[#E2E1EC] flex flex-col gap-2">
                <span className="text-[10px] font-bold text-[#747685] uppercase">
                  STEP 3: WHAT MUST HAPPEN
                </span>
                <div className="grid grid-cols-2 gap-2 text-[13px] text-[#444654]">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-[#3C61DD]" />
                    <span>Complete tech</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-[#3C61DD]" />
                    <span>Onboard supply</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-[#3C61DD]" />
                    <span>Acquire customers</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-[#3C61DD]" />
                    <span>Fund ops</span>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="p-4 rounded-[14px] bg-white border border-[#E2E1EC] flex flex-col gap-1">
                <span className="text-[10px] font-bold text-[#747685] uppercase">
                  STEP 4: RESOURCE REQUIREMENT
                </span>
                <span className="font-medium text-[14px] text-[#1A1B23]">
                  Tech + Growth + Ops + Working Capital
                </span>
              </div>

              {/* Step 5: Funding Need (Hero) */}
              <div className="p-6 rounded-[18px] bg-[#3C61DD] text-white flex flex-col justify-between gap-2 shadow-md">
                <span className="text-[11px] font-bold text-white/80 uppercase tracking-wider">
                  STEP 5: FUNDING NEED
                </span>
                <span className="text-[36px] sm:text-[44px] font-heading font-extrabold leading-none">
                  €500K
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Use of Funds & Equation (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Allocation Card */}
            <div className="bg-[#FAF8FF] border border-[#E2E1EC] rounded-[24px] p-6 sm:p-7 flex flex-col gap-5 shadow-xs">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-bold text-[#747685] uppercase tracking-wider">
                  ILLUSTRATIVE ALLOCATION
                </span>
                <h3 className="font-heading font-extrabold text-[20px] text-[#1A1B23]">
                  Expected Use of Funds
                </h3>
              </div>

              <div className="flex flex-col gap-4">
                {allocations.map((a) => (
                  <div key={a.name} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-[#1A1B23]">{a.name}</span>
                      <span className="text-[#747685]">{a.pct}</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full overflow-hidden bg-[#E2E1EC]">
                      <div style={{ width: a.width }} className={`h-full ${a.bg}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Equation Box */}
            <div className="bg-[#F3F2FD] border border-[#E2E1EC] rounded-[24px] p-6 flex flex-col gap-4 shadow-xs">
              <span className="text-[10px] font-bold text-[#3C61DD] uppercase tracking-wider">
                STRUCTURED RAISE LOGIC
              </span>

              <div className="flex flex-wrap items-center gap-2 text-[12px] font-bold text-[#1A1B23]">
                {equationTerms.map((term, i) => (
                  <span key={term} className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-[6px] bg-white border border-[#E2E1EC]">
                      {term}
                    </span>
                    {i < equationTerms.length - 1 ? (
                      <span className="text-[#3C61DD]">+</span>
                    ) : (
                      <span className="text-[#3C61DD]">➔</span>
                    )}
                  </span>
                ))}
                <span className="px-3 py-1 rounded-[6px] bg-[#3C61DD] text-white">
                  STRUCTURED RAISE LOGIC
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Closing Banner */}
        <div className="w-full p-6 sm:p-8 rounded-[20px] bg-white border border-[#E2E1EC] text-center shadow-xs">
          <span className="font-heading font-extrabold text-[14px] sm:text-[16px] text-[#070707] uppercase tracking-wide">
            INVESTORS SHOULD BE ABLE TO SEE WHAT THE CAPITAL IS SUPPOSED TO CHANGE.
          </span>
        </div>
      </div>
    </section>
  );
}
