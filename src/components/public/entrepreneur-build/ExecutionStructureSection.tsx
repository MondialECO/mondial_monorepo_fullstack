'use client';

import { AlertTriangle, CheckCircle2, Clock, GitBranch, ArrowRight, Info } from 'lucide-react';

export default function ExecutionStructureSection() {
  const workstreams = [
    {
      area: 'PRODUCT',
      owner: 'FOUNDER',
      title: 'Marketplace experience',
      ownerBg: 'bg-[#1A1B23] text-white',
    },
    {
      area: 'TECHNOLOGY',
      owner: 'PROVIDER',
      title: 'Booking + payment infrastructure',
      ownerBg: 'bg-[#E2E1EC] text-[#444654]',
    },
    {
      area: 'OPERATIONS',
      owner: 'INTERNAL TEAM',
      title: 'Workspace onboarding',
      ownerBg: 'bg-[#E2E1EC] text-[#444654]',
    },
    {
      area: 'GO-TO-MARKET',
      owner: 'GROWTH',
      title: 'Pilot supply + early users',
      ownerBg: 'bg-[#E2E1EC] text-[#444654]',
    },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#FAF8FF] border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#747685] uppercase tracking-wider">
            EXECUTION STRUCTURE
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Make progress visible before it
            <br />
            becomes late.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Mondial connects business objectives to workstreams, responsibilities, dependencies and milestones — so the Entrepreneur can understand what must happen before the next outcome is possible.
          </p>
        </div>

        {/* 2-Column Composition */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: Workstreams (5 cols) */}
          <div className="lg:col-span-5 bg-white border border-[#E2E1EC] rounded-[24px] p-6 sm:p-8 flex flex-col justify-between gap-6 shadow-xs">
            <div className="flex flex-col gap-5">
              <h3 className="font-heading font-extrabold text-[26px] sm:text-[32px] text-[#1A1B23] leading-tight">
                LAUNCH
                <br />
                NOVA SPACE
                <br />
                MVP
              </h3>

              <div className="flex flex-col gap-3">
                {workstreams.map((ws) => (
                  <div
                    key={ws.area}
                    className="p-4 rounded-[14px] bg-[#FAF8FF] border border-[#E2E1EC] flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#747685] uppercase tracking-wider">
                        {ws.area}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${ws.ownerBg}`}
                      >
                        {ws.owner}
                      </span>
                    </div>
                    <span className="font-heading font-bold text-[15px] text-[#1A1B23]">
                      {ws.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Critical Path Dependency (7 cols) */}
          <div className="lg:col-span-7 bg-white border border-[#E2E1EC] rounded-[24px] p-6 sm:p-8 flex flex-col justify-between gap-6 shadow-xs text-[13px]">
            <div className="flex flex-col gap-5">
              <span className="text-[11px] font-bold text-[#747685] uppercase tracking-wider pb-2 border-b border-[rgba(0,0,0,0.06)]">
                CRITICAL PATH DEPENDENCY
              </span>

              {/* Timeline Steps */}
              <div className="flex flex-col gap-4 pl-4 border-l-2 border-[#E2E1EC]">
                {/* Step 1 */}
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#157A55]" />
                    <h4 className="font-heading font-bold text-[16px] text-[#1A1B23]">
                      BACKEND COMPLETE
                    </h4>
                  </div>
                  <p className="text-[12px] text-[#444654] pl-4">Core API architecture finalized.</p>
                </div>

                {/* Step 2: Blocker (Highlighted) */}
                <div className="p-4 sm:p-5 rounded-[18px] bg-amber-50/70 border-2 border-amber-300 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={16} className="text-[#875301]" />
                      <h4 className="font-heading font-bold text-[16px] text-[#875301]">
                        PAYMENT INTEGRATION
                      </h4>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-[#875301] text-white text-[9px] font-bold uppercase">
                      BLOCKER
                    </span>
                  </div>

                  <p className="text-[12px] text-[#444654] leading-relaxed">
                    Stripe API webhook configuration delayed due to missing KYC documentation from operational entity.
                  </p>

                  <div className="p-3 rounded-[10px] bg-white border border-amber-200 flex items-start gap-2 text-[11px] text-[#444654]">
                    <Info size={14} className="text-[#1A1B23] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-[#1A1B23] block">WHY THIS MATTERS:</strong>
                      A milestone can be delayed even when other work is moving. Dependencies explain the reason.
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex flex-col gap-0.5 opacity-70">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#C4C5D6]" />
                    <h4 className="font-heading font-bold text-[15px] text-[#1A1B23]">
                      TRANSACTION TESTING
                    </h4>
                  </div>
                  <p className="text-[12px] text-[#444654] pl-4">
                    Blocked until Payment Integration completes.
                  </p>
                </div>

                {/* Step 4 & 5 */}
                <div className="flex items-center gap-2 opacity-50">
                  <span className="w-2 h-2 rounded-full bg-[#C4C5D6]" />
                  <span className="font-heading font-bold text-[14px] text-[#747685]">
                    PILOT READY
                  </span>
                </div>
                <div className="flex items-center gap-2 opacity-50">
                  <span className="w-2 h-2 rounded-full bg-[#C4C5D6]" />
                  <span className="font-heading font-bold text-[14px] text-[#747685]">
                    MVP LAUNCH
                  </span>
                </div>
              </div>
            </div>

            <span className="text-[10px] text-[#8A8B8F] italic">
              Illustrative execution dependency demonstration.
            </span>
          </div>
        </div>

        {/* Closing Banner */}
        <div className="w-full p-6 sm:p-8 rounded-[20px] bg-white border border-[#E2E1EC] text-center shadow-xs">
          <span className="font-heading font-extrabold text-[14px] sm:text-[16px] text-[#070707] uppercase tracking-wide">
            MILESTONES SHOW WHERE THE COMPANY IS GOING. DEPENDENCIES EXPLAIN WHAT CAN STOP IT.
          </span>
        </div>
      </div>
    </section>
  );
}
