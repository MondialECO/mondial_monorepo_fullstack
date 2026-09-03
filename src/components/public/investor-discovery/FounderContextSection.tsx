'use client';

import { UserCheck, Users, ShieldCheck, Briefcase, CheckCircle2, ArrowRight } from 'lucide-react';

export default function FounderContextSection() {
  const dimensions = [
    {
      title: 'Role',
      desc: 'Relevant Experience mapping to current operational demands.',
    },
    {
      title: 'Ownership Context',
      desc: 'Cap table structure and alignment of long-term incentives.',
    },
    {
      title: 'Current Commitment',
      desc: 'Operational focus, secondary ventures, and bandwidth allocation.',
    },
    {
      title: 'Execution Responsibility',
      desc: 'Direct oversight vs. delegated functional leadership within the current scaling phase.',
    },
    {
      title: 'Team Composition',
      desc: 'Key hires, structural gaps, and the supporting cast surrounding the core founding team.',
    },
  ];

  const nodes = [
    { title: 'BUSINESS', val: 'Marketplace Model' },
    { title: 'EXECUTION', val: 'MVP Pilot Active' },
    { title: 'FUNDING', val: '€700K Raise Target' },
    { title: 'TEAM CONTEXT', val: 'Product, Operations, Technical capability' },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#FAF8FF] border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            BEHIND THE COMPANY
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Investors do not only evaluate the company.
            <br />
            They evaluate who is building it.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Mondial connects opportunity context with the founder and team behind the business so Investors can understand the people responsible for execution.
          </p>
        </div>

        {/* Layered Company Architecture & Dimensions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left: Central Asset & Founder (5 cols) */}
          <div className="lg:col-span-5 p-6 sm:p-8 rounded-[28px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-5">
            <div>
              <span className="text-[10px] font-bold text-[#747685] uppercase block">
                TARGET ASSET
              </span>
              <h3 className="font-heading font-bold text-[20px] text-[#1A1B23]">
                NOVA SPACE SAS
              </h3>

              <div className="p-4 rounded-[18px] bg-[#FAF8FF] border border-[#E2E1EC] mt-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#E2E1EC] flex items-center justify-center font-heading font-bold text-[#1A1B23] text-[16px]">
                  HM
                </div>
                <div>
                  <h4 className="font-heading font-bold text-[14px] text-[#1A1B23]">
                    Henry Martin
                  </h4>
                  <span className="text-[11px] text-[#3C61DD] font-bold">FOUNDER / CEO</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-3">
                {nodes.map((n) => (
                  <div key={n.title} className="p-2.5 rounded-[10px] bg-[#FAF8FF] border border-[#E2E1EC]">
                    <span className="text-[9px] font-bold text-[#747685] uppercase block">{n.title}</span>
                    <strong className="text-[11px] text-[#1A1B23]">{n.val}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-[11px] text-[#747685]">Verified Execution Context</div>
          </div>

          {/* Right: 5 Founder Context Dimensions (7 cols) */}
          <div className="lg:col-span-7 p-6 sm:p-8 rounded-[28px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-4">
            <span className="text-[11px] font-bold text-[#747685] uppercase tracking-wider">
              FOUNDER CONTEXT EVALUATION DIMENSIONS
            </span>

            <div className="space-y-2.5">
              {dimensions.map((dim) => (
                <div
                  key={dim.title}
                  className="p-3 rounded-[12px] bg-[#FAF8FF] border border-[#E2E1EC] text-[12px]"
                >
                  <strong className="text-[#1A1B23] block">{dim.title}</strong>
                  <p className="text-[#444654] mt-0.5">{dim.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Core Statement & Sequence */}
        <div className="p-6 sm:p-8 rounded-[24px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col items-center text-center gap-4">
          <h3 className="font-heading font-extrabold text-[15px] sm:text-[18px] text-[#070707] uppercase tracking-wide">
            A STRONG COMPANY STORY STILL NEEDS A HUMAN CONVERSATION.
          </h3>

          <div className="flex flex-wrap items-center justify-center gap-2 text-[12px] font-bold text-[#1A1B23] pt-2">
            <span className="px-3 py-1.5 rounded-[8px] bg-[#FAF8FF] border border-[#E2E1EC]">
              Company Context
            </span>
            <span className="text-[#3C61DD]">➔</span>
            <span className="px-3 py-1.5 rounded-[8px] bg-[#FAF8FF] border border-[#E2E1EC]">
              Founder Context
            </span>
            <span className="text-[#3C61DD]">➔</span>
            <span className="px-4 py-1.5 rounded-[8px] bg-[#1A47C3] text-white shadow-xs">
              Meeting
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
