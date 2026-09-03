'use client';

import { CheckCircle2 } from 'lucide-react';

export default function OwnershipPathsSection() {
  const paths = [
    {
      num: 'PATH 01: FULL BUYOUT',
      desc: 'Transfer ownership through an acquisition agreement.',
      steps: 'PROJECT OPPORTUNITY → MATCH → REVIEW → NEGOTIATION → AGREEMENT → OWNERSHIP TRANSFER',
    },
    {
      num: 'PATH 02: CO-FOUNDER / EQUITY',
      desc: 'Bring in a co-founder through agreed equity structure.',
      steps: 'FOUNDER MATCH → ROLE ALIGNMENT → CONTRIBUTION → EQUITY DISCUSSION → AGREEMENT → BUILD TOGETHER',
    },
    {
      num: 'PATH 03: BUILD YOURSELF',
      desc: 'Keep the project and build independently as the sole entrepreneur.',
      steps: 'PROJECT → READINESS REVIEW → VERIFIED ENTREPRENEUR → LEVEL UP',
    },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-t border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1224px] flex flex-col gap-10 sm:gap-12">
        {/* Header Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Title & Subtitle (6 cols) */}
          <div className="lg:col-span-6 flex flex-col gap-3.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F1F5FF] text-[#3C61DD] text-[11px] font-semibold tracking-wider uppercase w-fit border border-[#3C61DD]/20">
              CHAPTER III — DECIDE | PHASE 05
            </div>
            <h2 className="text-[32px] sm:text-[40px] lg:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
              One project. Three ways forward.
            </h2>
            <p className="text-[15px] sm:text-[16px] text-[#5E5E5E] leading-[1.6]">
              After testing, validating, structuring — you choose the next step with a clear view of everything built.
            </p>
          </div>

          {/* Right Summary Card (6 cols) */}
          <div className="lg:col-span-6 bg-[#F9F9FA] border border-[rgba(0,0,0,0.08)] rounded-[20px] p-5 sm:p-6 flex flex-col gap-3.5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(0,0,0,0.06)]">
              <div>
                <h3 className="font-heading font-bold text-[16px] text-[#070707]">NOVA SPACE</h3>
                <p className="text-[12px] text-[#8A8B8F]">Henry&apos;s Workspace</p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#D4FFE5] text-[#00A854] text-[11px] font-bold">
                <CheckCircle2 size={13} />
                <span>Project Ready</span>
              </span>
            </div>
            <div className="flex flex-col gap-1 text-[13px]">
              <span className="font-bold text-[#3C61DD]">NOVA SPACE — READY FOR NEXT DECISION</span>
              <p className="text-[#5E5E5E]">All documents, metrics and business parameters verified in full.</p>
            </div>
          </div>
        </div>

        {/* 3 Path Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {paths.map((p, idx) => (
            <div
              key={idx}
              className="bg-white border border-[rgba(0,0,0,0.08)] rounded-[20px] p-6 sm:p-7 flex flex-col justify-between gap-5 shadow-sm hover:border-[#3C61DD]/30 transition-all hover:shadow-md group"
            >
              <div className="flex flex-col gap-3.5">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#3C61DD]" />
                  <h3 className="font-heading font-bold text-[15px] sm:text-[16px] text-[#070707] group-hover:text-[#3C61DD] transition-colors">
                    {p.num}
                  </h3>
                </div>
                <p className="text-[13px] text-[#5E5E5E] leading-[1.5]">{p.desc}</p>
              </div>

              <div className="pt-3 border-t border-[rgba(0,0,0,0.06)] flex flex-col gap-1.5">
                <span className="text-[10px] uppercase tracking-wider font-bold text-[#3C61DD]">
                  STEPS
                </span>
                <p className="text-[11px] font-medium text-[#3E3E3E] leading-[1.6]">
                  {p.steps}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
