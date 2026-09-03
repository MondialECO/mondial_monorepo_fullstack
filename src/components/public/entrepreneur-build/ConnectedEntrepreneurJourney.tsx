'use client';

import { Building2, Layers, CheckCircle2, ArrowRight } from 'lucide-react';

export default function ConnectedEntrepreneurJourney() {
  const stages = [
    {
      num: 'STAGE 01',
      title: 'COMPANY & VERIFICATION',
      side: 'right',
      items: [
        'Verified Company Identity',
        'Financial Foundation',
        'Compliance Context',
        'Permissions',
      ],
    },
    {
      num: 'STAGE 02',
      title: 'BUILD & EXECUTE',
      side: 'left',
      active: true,
      items: [
        'Projects',
        'Resource Decisions',
        'Team Responsibilities',
        'Provider Engagements',
        'Milestones',
        'Execution Evidence',
        'Traction Signals',
      ],
    },
    {
      num: 'STAGE 03',
      title: 'EQUITY & READINESS',
      side: 'right',
      items: [
        'Cap Table',
        'Ownership',
        'Valuation Context',
        'Investor Readiness',
        'Funding Ask',
      ],
    },
    {
      num: 'STAGE 04',
      title: 'FUNDING & DEALS',
      side: 'left',
      items: [
        'Data Room',
        'Investor Matching',
        'Diligence',
        'Term Sheet',
        'Deal Process',
        'Funding Pipeline',
      ],
    },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            SECTION 09 — ONE CONNECTED ENTREPRENEUR JOURNEY
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#1A1B23] leading-[1.15] tracking-tight">
            The company should not
            <br />
            restart at every stage.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Build &amp; Execute adds operating context to the same company record so relevant work can support later ownership, readiness and funding decisions.
          </p>
        </div>

        {/* Central Anchor Badge */}
        <div className="w-fit mx-auto p-4 px-6 rounded-[20px] bg-[#FAF8FF] border-2 border-[#3C61DD]/30 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-[10px] bg-[#3C61DD] text-white flex items-center justify-center font-bold">
            <Building2 size={20} />
          </div>
          <div>
            <h4 className="font-heading font-extrabold text-[16px] text-[#1A1B23]">
              NOVA SPACE SAS
            </h4>
            <span className="text-[10px] font-bold text-[#3C61DD] uppercase tracking-wider">
              CONTINUOUS RECORD
            </span>
          </div>
        </div>

        {/* Alternating Spine Architecture */}
        <div className="flex flex-col gap-8">
          {stages.map((st) => (
            <div
              key={st.num}
              className={`p-6 sm:p-8 rounded-[24px] border transition-all ${
                st.active
                  ? 'bg-[#F3F2FD]/80 border-2 border-[#3C61DD] shadow-md'
                  : 'bg-[#FAF8FF] border-[#E2E1EC] shadow-xs'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[rgba(0,0,0,0.06)] gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-bold text-[#3C61DD] uppercase tracking-wider">
                    {st.num}
                  </span>
                  <h3 className="font-heading font-bold text-[20px] sm:text-[24px] text-[#1A1B23]">
                    {st.title}
                  </h3>
                </div>
                {st.active && (
                  <span className="px-3 py-0.5 rounded-full bg-[#3C61DD] text-white text-[10px] font-bold uppercase w-fit">
                    ACTIVE WORKSPACE
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-4">
                {st.items.map((item) => (
                  <span
                    key={item}
                    className={`px-3 py-1.5 rounded-[10px] text-[12px] font-medium transition-colors ${
                      item === 'Execution Evidence'
                        ? 'bg-[#3C61DD] text-white font-bold shadow-xs'
                        : 'bg-white border border-[#E2E1EC] text-[#444654]'
                    }`}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Context Equation Box */}
        <div className="bg-[#FAF8FF] border-2 border-[#3C61DD]/30 rounded-[24px] p-6 sm:p-10 flex flex-col items-center gap-6 text-center shadow-md">
          <span className="text-[11px] font-bold text-[#3C61DD] uppercase tracking-wider">
            CONTINUOUS RECORD EQUATION
          </span>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-[12px] sm:text-[13px] font-bold">
            <span className="px-3.5 py-1.5 rounded-[8px] bg-white border border-[#E2E1EC] text-[#1A1B23]">
              COMPANY FOUNDATION
            </span>
            <span className="text-[#3C61DD]">+</span>
            <span className="px-3.5 py-1.5 rounded-[8px] bg-white border border-[#E2E1EC] text-[#1A1B23]">
              EXECUTION EVIDENCE
            </span>
            <span className="text-[#3C61DD]">+</span>
            <span className="px-3.5 py-1.5 rounded-[8px] bg-white border border-[#E2E1EC] text-[#1A1B23]">
              OWNERSHIP CONTEXT
            </span>
            <span className="text-[#3C61DD]">+</span>
            <span className="px-3.5 py-1.5 rounded-[8px] bg-white border border-[#E2E1EC] text-[#1A1B23]">
              FUNDING CONTEXT
            </span>
            <span className="text-[#3C61DD]">➔</span>
            <span className="px-4 py-1.5 rounded-[8px] bg-[#3C61DD] text-white shadow-xs">
              ONE CONTINUOUS COMPANY RECORD
            </span>
          </div>

          <p className="text-[12px] text-[#747685] italic">
            Relevant information can move forward. Visibility still depends on permissions and readiness.
          </p>
        </div>

        {/* Closing Banner */}
        <div className="w-full p-6 sm:p-8 rounded-[20px] bg-white border border-[#E2E1EC] text-center shadow-xs">
          <span className="font-heading font-extrabold text-[14px] sm:text-[16px] text-[#070707] uppercase tracking-wide">
            MORE PROGRESS SHOULD CREATE MORE CONTEXT. NOT MORE RESTARTING.
          </span>
        </div>
      </div>
    </section>
  );
}
