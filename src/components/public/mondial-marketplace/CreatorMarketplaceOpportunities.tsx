'use client';

import Image from 'next/image';

export default function CreatorMarketplaceOpportunities() {
  const transactionFlow = [
    'PROJECT',
    'ENTREPRENEUR INTEREST',
    'CONTROLLED REVIEW',
    'NEGOTIATION',
    'AGREEMENT',
    'OWNERSHIP TRANSFER',
  ];

  const collaborationFlow = [
    'PROJECT',
    'CO-FOUNDER INTEREST',
    'ROLE ALIGNMENT',
    'CONTRIBUTION',
    'EQUITY DISCUSSION',
    'AGREEMENT',
    'BUILD TOGETHER',
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#747685] uppercase tracking-wider">
            CREATOR PROJECT OPPORTUNITIES
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            A structured idea can become
            <br />
            something another person can act on.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            When a Creator chooses to bring a project into the Marketplace, the public opportunity should communicate enough context for relevant Entrepreneurs to understand what kind of relationship is being offered.
          </p>
        </div>

        {/* Central Project Opportunity: NOVA SPACE */}
        <div className="p-6 sm:p-8 lg:p-10 rounded-[28px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-xs flex flex-col gap-8">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[rgba(0,0,0,0.06)]">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-[#EBF0FF] text-[#1A47C3] font-bold text-[10px] uppercase tracking-wider">
                STRUCTURED PROJECT
              </span>
              <h3 className="font-heading font-extrabold text-[22px] sm:text-[26px] text-[#1A1B23]">
                NOVA SPACE
              </h3>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full overflow-hidden bg-[#E2E1EC] relative">
                <Image
                  src="/marketplace-public/creator_avatar_small.png"
                  alt="Creator Avatar"
                  width={28}
                  height={28}
                  className="object-cover"
                />
              </div>
              <div className="text-[11px]">
                <span className="text-[#747685] block">Creator Context:</span>
                <span className="font-bold text-[#1A1B23]">Maya Rahman (Expert Consultant)</span>
              </div>
            </div>
          </div>

          {/* 4 Modules: Context, Market, Status, Intelligence */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Module 1: Context */}
            <div className="p-5 rounded-[20px] bg-white border border-[#E2E1EC] shadow-2xs flex flex-col justify-between gap-3">
              <span className="text-[10px] font-bold text-[#3C61DD] uppercase">
                Context
              </span>
              <div className="space-y-2 text-[12px]">
                <div>
                  <strong className="text-[#747685] block text-[10px] uppercase">Problem</strong>
                  <span className="text-[#1A1B23] font-medium">Fragmented satellite data access</span>
                </div>
                <div>
                  <strong className="text-[#747685] block text-[10px] uppercase">Solution</strong>
                  <span className="text-[#1A1B23] font-medium">Unified API for orbital intelligence</span>
                </div>
              </div>
            </div>

            {/* Module 2: Market */}
            <div className="p-5 rounded-[20px] bg-white border border-[#E2E1EC] shadow-2xs flex flex-col justify-between gap-3">
              <span className="text-[10px] font-bold text-[#3C61DD] uppercase">
                Market
              </span>
              <div className="space-y-2 text-[12px]">
                <div>
                  <strong className="text-[#747685] block text-[10px] uppercase">Target Market</strong>
                  <span className="text-[#1A1B23] font-medium">AgTech, Logistics, Defense</span>
                </div>
                <div>
                  <strong className="text-[#747685] block text-[10px] uppercase">Business Model</strong>
                  <span className="text-[#1A1B23] font-medium">Usage-based API</span>
                </div>
              </div>
            </div>

            {/* Module 3: Status */}
            <div className="p-5 rounded-[20px] bg-white border border-[#E2E1EC] shadow-2xs flex flex-col justify-between gap-3">
              <span className="text-[10px] font-bold text-[#3C61DD] uppercase">
                Status
              </span>
              <div className="space-y-2 text-[12px]">
                <div>
                  <strong className="text-[#747685] block text-[10px] uppercase">Readiness</strong>
                  <span className="text-[#1A1B23] font-medium">Phase 03 Complete</span>
                </div>
                <div>
                  <strong className="text-[#747685] block text-[10px] uppercase">Resource Context</strong>
                  <span className="text-[#1A1B23] font-medium">Backend complete, Needs Growth support</span>
                </div>
              </div>
            </div>

            {/* Module 4: Intelligence */}
            <div className="p-5 rounded-[20px] bg-white border border-[#E2E1EC] shadow-2xs flex flex-col justify-between gap-2 text-center">
              <span className="text-[10px] font-bold text-[#747685] uppercase">
                Intelligence
              </span>
              <div>
                <span className="font-heading font-extrabold text-[36px] text-[#3C61DD] leading-none">
                  85%
                </span>
                <span className="text-[10px] font-bold text-[#747685] uppercase block mt-1">
                  CONFIDENCE SCORE
                </span>
              </div>
              <span className="text-[9px] text-[#747685] italic">Illustrative / Demo Context</span>
            </div>
          </div>
        </div>

        {/* MVP Paths: Path 01 Full Buyout vs Path 02 Co-founder / Equity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {/* Path 01: FULL BUYOUT */}
          <div className="p-6 sm:p-8 rounded-[28px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-2xs flex flex-col justify-between gap-6">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded bg-white text-[#3C61DD] font-bold text-[10px] uppercase">
                  PATH 01
                </span>
                <span className="text-[10px] font-bold text-[#747685] uppercase">
                  (ACQUISITION / OWNERSHIP TRANSFER)
                </span>
              </div>
              <h3 className="font-heading font-bold text-[22px] text-[#1A1B23]">
                FULL BUYOUT
              </h3>
              <p className="text-[13px] text-[#444654] leading-relaxed">
                The Creator is open to selling the project / IP through an ownership-transfer transaction.
              </p>
            </div>

            {/* Transaction Flow */}
            <div className="p-4 rounded-[16px] bg-white border border-[#E2E1EC] flex flex-col gap-2">
              <span className="text-[10px] font-bold text-[#747685] uppercase tracking-wider">
                TRANSACTION FLOW
              </span>
              <div className="flex flex-wrap items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-[#1A1B23]">
                {transactionFlow.map((st, idx) => (
                  <span key={st} className="flex items-center gap-1.5">
                    <span className="px-2.5 py-1 rounded bg-[#FAF8FF] border border-[#E2E1EC]">
                      {st}
                    </span>
                    {idx < transactionFlow.length - 1 && <span className="text-[#3C61DD]">➔</span>}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Path 02: CO-FOUNDER / EQUITY */}
          <div className="p-6 sm:p-8 rounded-[28px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-2xs flex flex-col justify-between gap-6">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded bg-white text-[#157A55] font-bold text-[10px] uppercase">
                  PATH 02
                </span>
                <span className="text-[10px] font-bold text-[#747685] uppercase">
                  (COLLABORATIVE GROWTH)
                </span>
              </div>
              <h3 className="font-heading font-bold text-[22px] text-[#1A1B23]">
                CO-FOUNDER / EQUITY
              </h3>
              <p className="text-[13px] text-[#444654] leading-relaxed">
                The Creator wants to continue building with another person through an agreed contribution and equity relationship.
              </p>
            </div>

            {/* Collaboration Flow */}
            <div className="p-4 rounded-[16px] bg-white border border-[#E2E1EC] flex flex-col gap-2">
              <span className="text-[10px] font-bold text-[#747685] uppercase tracking-wider">
                COLLABORATION FLOW
              </span>
              <div className="flex flex-wrap items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-[#1A1B23]">
                {collaborationFlow.map((st, idx) => (
                  <span key={st} className="flex items-center gap-1.5">
                    <span className="px-2.5 py-1 rounded bg-[#FAF8FF] border border-[#E2E1EC]">
                      {st}
                    </span>
                    {idx < collaborationFlow.length - 1 && <span className="text-[#157A55]">➔</span>}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section Statement */}
        <div className="p-6 sm:p-8 rounded-[24px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-xs flex flex-col items-center text-center gap-4">
          <h3 className="font-heading font-extrabold text-[15px] sm:text-[18px] text-[#070707] uppercase tracking-wide leading-relaxed">
            THE PROJECT MAY BE THE SAME.
            <br />
            THE RELATIONSHIP BEING OFFERED CAN BE COMPLETELY DIFFERENT.
          </h3>

          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-bold text-[#1A1B23] pt-1">
            <span className="px-3 py-1.5 rounded-[8px] bg-white border border-[#E2E1EC]">
              PROJECT CONTEXT
            </span>
            <span className="text-[#3C61DD]">+</span>
            <span className="px-3 py-1.5 rounded-[8px] bg-white border border-[#E2E1EC]">
              OFFER TYPE
            </span>
            <span className="text-[#3C61DD]">=</span>
            <span className="px-3.5 py-1.5 rounded-[8px] bg-[#3C61DD] text-white">
              UNDERSTANDABLE OPPORTUNITY
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
