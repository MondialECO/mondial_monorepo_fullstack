'use client';

import { ArrowRight, Layers, Lightbulb, Users, Wrench, Building2, CheckCircle2 } from 'lucide-react';

export default function PathsToExecutionSection() {
  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#FAF8FF] border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#747685] uppercase tracking-wider">
            START FROM YOUR REAL SITUATION
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Continue what you have.
            <br />
            Or bring something new in.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Entrepreneurs can keep building an existing company project or discover a structured Creator opportunity that fits the company’s direction.
          </p>
        </div>

        {/* 2 Paths Split Composition */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Left Path: Existing Company Project */}
          <div className="bg-white border border-[#E2E1EC] rounded-[24px] p-6 sm:p-8 flex flex-col justify-between gap-6 shadow-xs">
            <div className="flex flex-col gap-5">
              <div>
                <span className="text-[11px] font-bold text-[#3C61DD] uppercase tracking-wider">
                  01 / Existing company project
                </span>
                <h3 className="text-[32px] sm:text-[40px] font-heading font-extrabold text-[#070707] leading-tight">
                  NOVA SPACE
                </h3>
              </div>

              {/* Step Timeline */}
              <div className="flex flex-col gap-3.5 pl-3 border-l-2 border-[#E2E1EC] text-[13px]">
                <div className="flex items-center gap-2 text-[#005F40] font-bold text-[12px]">
                  <span className="w-2 h-2 rounded-full bg-[#005F40]" />
                  <span>PROJECT ALREADY EXISTS</span>
                </div>

                <div className="flex items-center gap-2 text-[#444654]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C4C5D6]" />
                  <span>Business priorities are known</span>
                </div>

                <div className="p-4 rounded-[14px] bg-[#FAF8FF] border border-[#E2E1EC] flex flex-col gap-2.5">
                  <span className="font-bold text-[#070707] text-[14px]">
                    Resource needs become visible
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[#747685] uppercase">
                      CURRENT PRIORITY:
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#F1F5FF] text-[#3C61DD] text-[10px] font-bold uppercase">
                      MARKETPLACE MVP
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] font-bold text-[#747685] uppercase">NEEDS:</span>
                    <span className="px-2 py-0.5 rounded bg-[#E8E7F2] text-[#444654] text-[10px] font-bold">
                      BACKEND
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#E8E7F2] text-[#444654] text-[10px] font-bold">
                      WORKSPACE
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#E8E7F2] text-[#444654] text-[10px] font-bold">
                      ACQUISITION
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[#444654]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C4C5D6]" />
                  <span>People and Providers are connected</span>
                </div>

                <div className="flex items-center gap-2 text-[#444654]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C4C5D6]" />
                  <span>Execution continues</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[rgba(0,0,0,0.06)]">
              <button
                type="button"
                className="font-heading font-bold text-[14px] text-[#070707] hover:text-[#3C61DD] inline-flex items-center gap-2 uppercase tracking-wide transition-colors"
              >
                <span>CONTINUE BUILDING</span>
                <ArrowRight size={15} className="text-[#3C61DD]" />
              </button>
            </div>
          </div>

          {/* Right Path: Creator Opportunity */}
          <div className="bg-[#F3F2FD] border border-[#E2E1EC] rounded-[24px] p-6 sm:p-8 flex flex-col justify-between gap-6 shadow-xs">
            <div className="flex flex-col gap-5">
              <div>
                <span className="text-[11px] font-bold text-[#965F11] uppercase tracking-wider">
                  02 / CREATOR PROJECT
                </span>
                <h3 className="text-[26px] sm:text-[32px] font-heading font-bold text-[#070707] leading-tight">
                  STRUCTURED PROJECT DISCOVERY
                </h3>
              </div>

              <div className="flex flex-col gap-4 text-[13px]">
                <div className="p-3.5 rounded-[12px] bg-white border border-[#E2E1EC] flex flex-col gap-1">
                  <div className="flex items-center gap-2 font-bold text-[#070707]">
                    <span className="w-2 h-2 rounded-full bg-[#965F11]" />
                    <span>CREATOR PROJECT</span>
                  </div>
                  <p className="text-[12px] text-[#444654]">
                    Initial identification of high-potential market opportunities.
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-bold text-[#747685] uppercase">
                    STRATEGIC FIT OPTIONS:
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="p-3 rounded-[10px] bg-white border border-[#E2E1EC] flex flex-col gap-0.5">
                      <span className="text-[9px] font-bold text-[#747685] uppercase">OPTION A</span>
                      <span className="font-bold text-[#070707]">FULL BUYOUT</span>
                    </div>
                    <div className="p-3 rounded-[10px] bg-white border border-[#E2E1EC] flex flex-col gap-0.5">
                      <span className="text-[9px] font-bold text-[#747685] uppercase">OPTION B</span>
                      <span className="font-bold text-[#070707]">CO-FOUNDER / EQUITY</span>
                    </div>
                    <div className="p-3 rounded-[10px] bg-white border border-[#E2E1EC] flex flex-col gap-0.5">
                      <span className="text-[9px] font-bold text-[#747685] uppercase">OPTION C</span>
                      <span className="font-bold text-[#070707]">STRATEGIC PROJECT OPPORTUNITY</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-[10px] bg-white/80 border border-[#E2E1EC] text-[12px] font-semibold text-[#444654] text-center">
                  ACQUISITION &amp; COLLABORATION
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Convergence Architecture Box */}
        <div className="w-full bg-white border-2 border-[#3C61DD]/30 rounded-[24px] p-6 sm:p-10 flex flex-col items-center gap-6 text-center shadow-md">
          <span className="text-[11px] font-bold text-[#3C61DD] uppercase tracking-wider">
            CONVERGENCE
          </span>

          <h3 className="text-[26px] sm:text-[34px] font-heading font-extrabold text-[#070707]">
            ONE COMPANY. ONE EXECUTION CONTEXT.
          </h3>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-[13px] font-bold">
            <span className="px-4 py-2 rounded-[10px] bg-[#FAF8FF] border border-[#E2E1EC] text-[#1A1B23]">
              PROJECT
            </span>
            <span className="text-[#3C61DD] text-[18px]">+</span>
            <span className="px-4 py-2 rounded-[10px] bg-[#FAF8FF] border border-[#E2E1EC] text-[#1A1B23]">
              PEOPLE
            </span>
            <span className="text-[#3C61DD] text-[18px]">+</span>
            <span className="px-4 py-2 rounded-[10px] bg-[#FAF8FF] border border-[#E2E1EC] text-[#1A1B23]">
              RESOURCES
            </span>
            <span className="text-[#3C61DD] text-[18px]">➔</span>
            <span className="px-5 py-2 rounded-[10px] bg-[#3C61DD] text-white shadow-xs">
              THE COMPANY
            </span>
            <span className="text-[#3C61DD] text-[18px]">➔</span>
            <span className="px-4 py-2 rounded-[10px] bg-[#157A55] text-white shadow-xs">
              BUILD &amp; EXECUTE
            </span>
          </div>

          <div className="pt-4 border-t border-[rgba(0,0,0,0.06)] w-full">
            <p className="font-heading font-bold text-[13px] sm:text-[15px] text-[#444654] uppercase tracking-wide">
              MONDIAL DOES NOT FORCE ONE WAY TO GROW. IT HELPS THE ENTREPRENEUR STRUCTURE THE NEXT MOVE.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
