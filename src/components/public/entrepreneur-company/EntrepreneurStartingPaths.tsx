'use client';

import { Lightbulb, Building2, CheckCircle2, ArrowDown, Sparkles } from 'lucide-react';

export default function EntrepreneurStartingPaths() {
  const creatorContext = [
    'Project Identity',
    'Problem & Solution',
    'Target Customer',
    'Positioning',
    'Business Plan',
    'Market Intelligence',
    'Financial Assumptions',
    'Resource Needs',
  ];

  const entrepreneurContext = [
    'Company Registration',
    'Legal Identity',
    'Operating Activity',
    'Bank Information',
    'Financial History',
    'Team',
    'Customers / Traction',
  ];

  const convergencePills = [
    'COMPANY IDENTITY',
    'VERIFICATION',
    'FINANCIAL FOUNDATION',
    'COMPLIANCE',
    'READINESS',
  ];

  return (
    <section
      id="section-02-two-ways-in"
      className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#F9F9FA] border-b border-[rgba(0,0,0,0.06)] flex justify-center"
    >
      <div className="w-full max-w-[1104px] flex flex-col gap-10 sm:gap-14">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[760px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            START WHERE YOU ARE
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Already have a company? Or
            <br />
            bringing a project forward?
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Mondial adapts to the Entrepreneur’s starting point instead of forcing everyone through the same path.
          </p>
        </div>

        {/* Y-Convergence System */}
        <div className="flex flex-col gap-6 items-center">
          {/* Top 2 Branches */}
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {/* Left Path: Creator / Project Context */}
            <div className="bg-white border border-[#E2E1EC] rounded-[24px] p-6 sm:p-8 flex flex-col justify-between gap-5 shadow-xs">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 pb-3 border-b border-[rgba(0,0,0,0.06)]">
                  <div className="w-10 h-10 rounded-[10px] bg-[#F3F2FD] flex items-center justify-center text-[#3C61DD]">
                    <Lightbulb size={20} />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-[18px] text-[#1A1B23]">NOVA SPACE</h3>
                    <span className="text-[11px] font-bold text-[#3C61DD] uppercase tracking-wider">
                      PROJECT CONTEXT AVAILABLE
                    </span>
                  </div>
                </div>

                <p className="text-[13px] text-[#444654] font-medium">Existing structured context:</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12px]">
                  {creatorContext.map((item) => (
                    <div key={item} className="flex items-center gap-1.5 text-[#1A1B23]">
                      <CheckCircle2 size={14} className="text-[#157A55] shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Path: Existing Entrepreneur */}
            <div className="bg-white border border-[#E2E1EC] rounded-[24px] p-6 sm:p-8 flex flex-col justify-between gap-5 shadow-xs">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 pb-3 border-b border-[rgba(0,0,0,0.06)]">
                  <div className="w-10 h-10 rounded-[10px] bg-[#F3F2FD] flex items-center justify-center text-[#3C61DD]">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-[18px] text-[#1A1B23]">NOVA SPACE SAS</h3>
                    <span className="text-[11px] font-bold text-[#3C61DD] uppercase tracking-wider">
                      COMPANY ALREADY EXISTS
                    </span>
                  </div>
                </div>

                <p className="text-[13px] text-[#444654] font-medium">Existing business context:</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12px]">
                  {entrepreneurContext.map((item) => (
                    <div key={item} className="flex items-center gap-1.5 text-[#1A1B23]">
                      <CheckCircle2 size={14} className="text-[#747685] shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Convergence Down Indicator */}
          <div className="flex items-center justify-center -my-1">
            <div className="w-8 h-8 rounded-full bg-[#3C61DD] text-white flex items-center justify-center shadow-sm">
              <ArrowDown size={16} />
            </div>
          </div>

          {/* Convergence Destination Box */}
          <div className="w-full bg-[#F3F2FD]/80 border-2 border-[#3C61DD]/30 rounded-[24px] p-6 sm:p-8 flex flex-col items-center gap-4 text-center shadow-sm">
            <div className="flex items-center gap-2">
              <span className="px-3 py-0.5 rounded-full bg-[#3C61DD] text-white text-[10px] font-bold uppercase tracking-wider">
                CONVERGENCE POINT
              </span>
              <h3 className="font-heading font-bold text-[18px] sm:text-[20px] text-[#1A1B23]">
                MONDIAL ENTREPRENEUR FOUNDATION
              </h3>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
              {convergencePills.map((pill) => (
                <span
                  key={pill}
                  className="px-3 py-1 rounded-[8px] bg-white border border-[#3C61DD]/20 text-[#3C61DD] text-[11px] font-bold shadow-2xs"
                >
                  {pill}
                </span>
              ))}
            </div>

            <div className="pt-2 border-t border-[#3C61DD]/10 w-full">
              <p className="font-heading font-bold text-[12px] sm:text-[13px] text-[#444654] uppercase tracking-wide">
                START FROM THE CONTEXT YOU ALREADY HAVE. DO NOT REBUILD WHAT ALREADY EXISTS.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
