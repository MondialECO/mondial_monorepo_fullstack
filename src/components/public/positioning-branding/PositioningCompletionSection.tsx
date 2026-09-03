'use client';

import { CheckCircle2, PenTool, Cpu } from 'lucide-react';

export default function PositioningCompletionSection() {
  const matrixItems = [
    'Identity',
    'Concept',
    'Problem',
    'Solution',
    'Customer',
    'Positioning',
    'Value Proposition',
    'Brand Direction',
    'Project Presentation',
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#F9F9FA] border-t border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1000px] flex flex-col gap-10 sm:gap-14 items-center text-center">
        {/* Header */}
        <div className="flex flex-col items-center gap-4 max-w-[800px]">
          <span className="px-3.5 py-1 rounded-full bg-[#E8F8EE] text-[#00A854] text-[12px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 border border-[#00A854]/20">
            <CheckCircle2 size={15} />
            <span>PHASE 02 — FOUNDATION COMPLETE</span>
          </span>

          <h2 className="text-[32px] sm:text-[42px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            The project is clear.
            <br />
            Now challenge the business logic.
          </h2>

          <p className="text-[15px] sm:text-[17px] text-[#5E5E5E] leading-[1.6]">
            Your foundation for “NOVA SPACE” is established. The identity is set. It's time to test assumptions with structured intelligence.
          </p>
        </div>

        {/* Phase Transition Graphic */}
        <div className="w-full p-4 sm:p-5 rounded-[18px] bg-white border border-[rgba(0,0,0,0.06)] shadow-xs flex flex-wrap items-center justify-center gap-4 text-[13px]">
          <div className="flex items-center gap-2 font-bold text-[#5E5E5E]">
            <PenTool size={16} className="text-[#3C61DD]" />
            <span>PHASE 02 (PROJECT IDENTITY &amp; BRANDING)</span>
          </div>
          <span className="text-[#8A8B8F]">➔</span>
          <div className="flex items-center gap-2 font-bold text-[#3C61DD]">
            <Cpu size={16} className="text-[#3C61DD]" />
            <span>PHASE 03 (PROJECT INTELLIGENCE &amp; AI TOOLS)</span>
          </div>
        </div>

        {/* Project Foundation Matrix Card */}
        <div className="w-full bg-white border border-[rgba(0,0,0,0.08)] rounded-[24px] p-6 sm:p-8 shadow-sm flex flex-col gap-6 text-left">
          {/* Card Top */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-5 border-b border-[rgba(0,0,0,0.06)] gap-3">
            <div>
              <h3 className="font-heading font-bold text-[20px] text-[#070707]">NOVA SPACE</h3>
              <span className="text-[13px] text-[#5E5E5E]">Project Foundation Matrix</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[20px] font-bold text-[#00A854]">100%</span>
              <span className="px-2.5 py-1 rounded-full bg-[#E8F8EE] text-[#00A854] text-[11px] font-bold">
                9/9 Complete
              </span>
            </div>
          </div>

          {/* Matrix 9 Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-[13px]">
            {matrixItems.map((item) => (
              <div
                key={item}
                className="p-3.5 rounded-[12px] bg-[#F9F9FA] border border-[rgba(0,0,0,0.04)] flex items-center justify-between shadow-2xs"
              >
                <span className="font-semibold text-[#070707]">{item}</span>
                <CheckCircle2 size={16} className="text-[#00A854]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
