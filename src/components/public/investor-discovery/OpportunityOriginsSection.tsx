'use client';

import { Building2, Sparkles, Layers, ArrowRight, ArrowDown, CheckCircle2 } from 'lucide-react';

export default function OpportunityOriginsSection() {
  const streamASteps = [
    'Company Identity',
    'Execution Context',
    'Traction',
    'Ownership Context',
    'Funding Need',
    'Readiness Context',
  ];

  const streamBSteps = [
    'Project Identity',
    'Business Logic',
    'Market Context',
    'Business Plan',
    'Build / Funding Direction',
    'Entrepreneur Transition Potential',
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#FAF8FF] border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            ONE INVESTOR NETWORK. DIFFERENT OPPORTUNITY ORIGINS.
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Not every opportunity starts
            <br />
            as a funded company.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Mondial can surface both operating companies seeking capital and structured projects that originated earlier in the ecosystem.
          </p>
        </div>

        {/* 2 Symmetrical Streams Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Stream A: Entrepreneur Companies */}
          <div className="p-6 sm:p-8 rounded-[28px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(0,0,0,0.06)]">
                <div>
                  <span className="text-[10px] font-bold text-[#3C61DD] uppercase block">
                    STREAM A
                  </span>
                  <h3 className="font-heading font-bold text-[20px] text-[#1A1B23]">
                    ENTREPRENEUR COMPANIES
                  </h3>
                </div>
                <span className="px-2.5 py-0.5 rounded bg-[#FAF8FF] text-[#747685] text-[10px] font-bold">
                  Traditional equity funding path
                </span>
              </div>

              <div className="p-2.5 rounded-[10px] bg-[#E8F8EE] text-[#157A55] text-[11px] font-bold text-center">
                ORIGIN: VERIFIED COMPANY
              </div>

              <div className="grid grid-cols-2 gap-2">
                {streamASteps.map((st) => (
                  <div
                    key={st}
                    className="p-2.5 rounded-[10px] bg-[#FAF8FF] border border-[#E2E1EC] text-[11px] font-medium text-[#1A1B23]"
                  >
                    ✔ {st}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-[16px] bg-[#FAF8FF] border border-[#E2E1EC] flex items-center justify-between">
              <div>
                <strong className="text-[#1A1B23] text-[13px] block">NOVA SPACE SAS</strong>
                <span className="text-[11px] text-[#747685]">Seed • Need: €700K</span>
              </div>
              <span className="px-2.5 py-0.5 rounded bg-[#1A47C3] text-white text-[10px] font-bold">
                INVESTMENT OPPORTUNITY
              </span>
            </div>
          </div>

          {/* Stream B: Creator Originated */}
          <div className="p-6 sm:p-8 rounded-[28px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(0,0,0,0.06)]">
                <div>
                  <span className="text-[10px] font-bold text-[#3C61DD] uppercase block">
                    STREAM B
                  </span>
                  <h3 className="font-heading font-bold text-[20px] text-[#1A1B23]">
                    CREATOR ORIGINATED
                  </h3>
                </div>
                <span className="px-2.5 py-0.5 rounded bg-[#FAF8FF] text-[#747685] text-[10px] font-bold">
                  Project-first structured approach
                </span>
              </div>

              <div className="p-2.5 rounded-[10px] bg-[#F3F2FD] text-[#1A47C3] text-[11px] font-bold text-center">
                ORIGIN: STRUCTURED PROJECT
              </div>

              <div className="grid grid-cols-2 gap-2">
                {streamBSteps.map((st) => (
                  <div
                    key={st}
                    className="p-2.5 rounded-[10px] bg-[#FAF8FF] border border-[#E2E1EC] text-[11px] font-medium text-[#1A1B23]"
                  >
                    ✔ {st}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-[16px] bg-[#FAF8FF] border border-[#E2E1EC] flex items-center justify-between">
              <div>
                <strong className="text-[#1A1B23] text-[13px] block">EARLY-STAGE OPPORTUNITY</strong>
                <span className="text-[11px] text-[#747685]">Structured Project Context</span>
              </div>
              <span className="px-2.5 py-0.5 rounded bg-[#3C61DD] text-white text-[10px] font-bold">
                TRANSITION POTENTIAL
              </span>
            </div>
          </div>
        </div>

        {/* Convergence Hub Banner */}
        <div className="p-6 sm:p-8 rounded-[24px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col items-center text-center gap-4">
          <span className="text-[11px] font-bold text-[#747685] uppercase tracking-wider">
            MONDIAL OPPORTUNITY UNIVERSE
          </span>
          <p className="text-[13px] text-[#444654] max-w-[680px]">
            Unified discovery layer for all assets ➔ <strong>INVESTOR THESIS ➔ RELEVANCE FILTER</strong>
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 text-[12px] font-bold text-[#1A1B23] pt-2">
            <span className="px-3 py-1.5 rounded-[8px] bg-[#FAF8FF] border border-[#E2E1EC]">
              COMPANY OR STRUCTURED PROJECT
            </span>
            <span className="text-[#3C61DD]">➔</span>
            <span className="px-3 py-1.5 rounded-[8px] bg-[#FAF8FF] border border-[#E2E1EC]">
              INVESTMENT CONTEXT
            </span>
            <span className="text-[#3C61DD]">➔</span>
            <span className="px-4 py-1.5 rounded-[8px] bg-[#1A47C3] text-white shadow-xs">
              DISCOVERY
            </span>
          </div>
        </div>

        {/* Section Statement */}
        <div className="p-6 sm:p-7 rounded-[20px] bg-white border border-[#E2E1EC] text-center shadow-xs">
          <h3 className="font-heading font-extrabold text-[15px] sm:text-[18px] text-[#070707] uppercase tracking-wide">
            THE ORIGIN MAY DIFFER.
            <br />
            THE INVESTOR STILL NEEDS STRUCTURE, CONTEXT AND FIT.
          </h3>
        </div>
      </div>
    </section>
  );
}
