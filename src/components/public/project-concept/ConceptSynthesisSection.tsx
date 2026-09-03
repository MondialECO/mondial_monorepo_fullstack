'use client';

import { CheckCircle2, ArrowRight } from 'lucide-react';

export default function ConceptSynthesisSection() {
  const nextRequirements = [
    { title: 'Positioning', desc: 'Define market placement.' },
    { title: 'Value Proposition', desc: 'Articulate core benefits.' },
    { title: 'Brand Direction', desc: 'Establish visual language.' },
    { title: 'Project Summary', desc: 'Synthesise core concept.' },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#F9F9FA] border-t border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1224px] flex flex-col gap-10 sm:gap-14">
        {/* Section Header */}
        <div className="flex flex-col gap-3.5 max-w-[900px]">
          <div className="flex items-center gap-2 text-[12px] font-bold">
            <span className="text-[#8A8B8F] uppercase">SECTION 07</span>
            <span className="w-1 h-3 bg-[rgba(0,0,0,0.2)]" />
            <span className="text-[#3C61DD] uppercase">YOUR PROJECT TAKES SHAPE</span>
          </div>
          <h2 className="text-[32px] sm:text-[42px] lg:text-[48px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            One project. One clear definition.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#5E5E5E] leading-[1.6]">
            The information created throughout this page comes together into a reusable Project Identity.
          </p>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Reusable Project Identity Card (7 cols) */}
          <div className="lg:col-span-7 bg-white border border-[rgba(0,0,0,0.08)] rounded-[24px] overflow-hidden shadow-sm flex flex-col">
            {/* Header */}
            <div className="p-6 bg-[#FAF8FF] border-b border-[rgba(0,0,0,0.06)] flex items-center justify-between">
              <div>
                <h3 className="font-heading font-bold text-[24px] text-[#070707]">NOVA SPACE</h3>
                <span className="text-[12px] text-[#5E5E5E]">PROJECT TYPE: Marketplace</span>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#E8F8EE] text-[#00A854] text-[11px] font-bold inline-flex items-center gap-1">
                <CheckCircle2 size={13} />
                <span>DEFINED (88%)</span>
              </span>
            </div>

            {/* Content Body */}
            <div className="p-6 flex flex-col gap-4 text-[13px]">
              <div>
                <span className="text-[10px] font-bold text-[#8A8B8F] uppercase block">ONE-LINE CONCEPT</span>
                <p className="font-semibold text-[#070707]">
                  A marketplace where independent professionals can book verified local workspaces by the hour.
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-[#8A8B8F] uppercase block">PROBLEM</span>
                <p className="text-[#5E5E5E]">
                  Professionals need flexible workspace access without long commitments while many commercial spaces remain underused.
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-[#8A8B8F] uppercase block">SOLUTION</span>
                <p className="text-[#5E5E5E]">
                  Connect available workspaces with professionals through flexible hourly booking.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[rgba(0,0,0,0.04)]">
                <div>
                  <span className="text-[10px] font-bold text-[#8A8B8F] uppercase block">PRIMARY CUSTOMER</span>
                  <p className="font-medium text-[#070707]">Independent Professionals</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#8A8B8F] uppercase block">SECONDARY CUSTOMER</span>
                  <p className="font-medium text-[#070707]">Small Teams</p>
                </div>
              </div>
            </div>

            {/* Progress Bar Footer */}
            <div className="px-6 py-3 bg-[#FAF8FF] border-t border-[rgba(0,0,0,0.06)] flex items-center gap-3">
              <span className="text-[11px] font-bold text-[#3C61DD]">Phase 02 Synthesis</span>
              <div className="flex-1 h-2 rounded-full bg-[#EDEDED] overflow-hidden">
                <div className="w-[88%] h-full bg-[#3C61DD]" />
              </div>
              <span className="text-[11px] font-bold text-[#3C61DD]">88%</span>
            </div>
          </div>

          {/* Right Column: Next Phase Requirements (5 cols) */}
          <div className="lg:col-span-5 bg-[#FAF8FF] border border-[#3C61DD]/20 rounded-[24px] p-6 sm:p-7 flex flex-col gap-4 shadow-sm">
            <h4 className="font-heading font-bold text-[18px] text-[#070707]">Next Phase Requirements</h4>

            <div className="flex flex-col gap-2.5">
              {nextRequirements.map((req) => (
                <div
                  key={req.title}
                  className="p-3.5 rounded-[12px] bg-white border border-[rgba(0,0,0,0.06)] flex items-center justify-between gap-3 shadow-xs"
                >
                  <div className="flex flex-col">
                    <span className="font-heading font-bold text-[13px] text-[#070707]">{req.title}</span>
                    <span className="text-[12px] text-[#5E5E5E]">{req.desc}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-[4px] bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200 uppercase">
                    NEXT
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
