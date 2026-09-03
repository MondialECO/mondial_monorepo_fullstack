'use client';

import { CheckCircle2, ArrowRight } from 'lucide-react';

export default function LevelUpSection() {
  const creatorData = [
    'Project Identity',
    'Problem & Solution',
    'Target Customer',
    'Positioning',
    'Business Plan',
    'Market Intelligence',
    'Financial Assumptions',
    'Risk Analysis',
    'Resource Needs',
  ];

  const transitionConditions = [
    'Creator Verified',
    'Project Structured',
    'Core Intelligence',
    'Build Yourself Selected',
  ];

  const entrepreneurModules = [
    'Company Identity',
    'Company Verification',
    'Cap Table & Equity',
    'Execution & Milestones',
    'Provider Matching',
    'Traction & KPIs',
    'Investor Readiness',
    'Data Room',
    'Funding Pipeline',
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#F9F9FA] border-t border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1224px] flex flex-col gap-10 sm:gap-14">
        {/* Header */}
        <div className="flex flex-col gap-3.5 max-w-[880px]">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F1F5FF] text-[#3C61DD] text-[11px] font-semibold tracking-wider uppercase w-fit border border-[#3C61DD]/20">
            PHASE 06 — VERIFIED ENTREPRENEUR LEVEL UP
          </div>
          <h2 className="text-[32px] sm:text-[42px] lg:text-[48px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Do not restart when the project becomes a company.
          </h2>
          <p className="text-[15px] sm:text-[16px] text-[#5E5E5E] leading-[1.6]">
            When a Creator chooses to build, relevant structured project information moves forward into the Entrepreneur journey.
          </p>
        </div>

        {/* 3 Columns Transformation Sequence */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Column: Creator / NOVA SPACE (4 cols) */}
          <div className="lg:col-span-4 bg-white border border-[rgba(0,0,0,0.08)] rounded-[24px] p-6 flex flex-col justify-between gap-5 shadow-sm min-h-[460px]">
            <div className="flex flex-col gap-3">
              <div>
                <span className="text-[11px] font-bold text-[#8A8B8F] uppercase">CREATOR</span>
                <h3 className="font-heading font-bold text-[20px] text-[#070707]">NOVA SPACE</h3>
              </div>
              <span className="text-[12px] text-[#8A8B8F] border-b border-[rgba(0,0,0,0.06)] pb-2 font-medium">
                Inherited project data:
              </span>
              <div className="flex flex-col gap-1.5 text-[13px] text-[#5E5E5E]">
                {creatorData.map((item) => (
                  <div key={item} className="flex items-center gap-2 py-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3C61DD] shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <span className="text-[11px] font-bold text-[#3C61DD]">Phase 01–05 Ready</span>
          </div>

          {/* Center Column: Level Up Transition (4 cols) */}
          <div className="lg:col-span-4 bg-[#F1F5FF] border-2 border-[#3C61DD]/30 rounded-[24px] p-6 flex flex-col justify-between gap-5 shadow-md min-h-[460px]">
            <div className="flex flex-col gap-4">
              <div>
                <span className="text-[11px] font-bold text-[#3C61DD] uppercase">TRANSITION GATEWAY</span>
                <h3 className="font-heading font-extrabold text-[20px] text-[#3C61DD] leading-tight">
                  VERIFIED ENTREPRENEUR LEVEL UP
                </h3>
              </div>
              <div className="flex flex-col gap-2.5 pt-2">
                {transitionConditions.map((cond) => (
                  <div
                    key={cond}
                    className="flex items-center justify-between p-3 rounded-[12px] bg-white border border-[rgba(0,0,0,0.04)] shadow-xs text-[13px]"
                  >
                    <span className="font-semibold text-[#070707]">{cond}</span>
                    <CheckCircle2 size={16} className="text-[#00A854]" />
                  </div>
                ))}
              </div>
            </div>
            <div className="w-full py-2 rounded-[10px] bg-[#3C61DD] text-white text-center font-bold text-[12px] uppercase tracking-wider flex items-center justify-center gap-1.5">
              <span>Automatic Qualification</span>
              <ArrowRight size={14} />
            </div>
          </div>

          {/* Right Column: Entrepreneur / NOVA SPACE (4 cols) */}
          <div className="lg:col-span-4 bg-white border border-[rgba(0,0,0,0.08)] rounded-[24px] p-6 flex flex-col justify-between gap-5 shadow-sm min-h-[460px]">
            <div className="flex flex-col gap-3">
              <div>
                <span className="text-[11px] font-bold text-[#8A8B8F] uppercase">ENTREPRENEUR</span>
                <h3 className="font-heading font-bold text-[20px] text-[#070707]">NOVA SPACE</h3>
              </div>
              <span className="text-[12px] text-[#8A8B8F] border-b border-[rgba(0,0,0,0.06)] pb-2 font-medium">
                Next modules unlocked:
              </span>
              <div className="flex flex-col gap-1.5 text-[13px] text-[#5E5E5E]">
                {entrepreneurModules.map((item) => (
                  <div key={item} className="flex items-center gap-2 py-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00A854] shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <span className="text-[11px] font-bold text-[#00A854]">Full Ecosystem Unlocked</span>
          </div>
        </div>
      </div>
    </section>
  );
}
