'use client';

import { CheckCircle2, HelpCircle, ShieldAlert, FileText, ArrowRight } from 'lucide-react';

export default function OwnershipClaritySection() {
  const unclearItems = [
    'Founder promises',
    'informal equity discussions',
    'future employee options',
    'early contributors',
    'previous investment',
    'convertible rights',
    'unrecorded expectations',
  ];

  const spineNodes = [
    { title: 'FOUNDERS', color: 'bg-[#E2E1EC] text-[#070707] font-bold' },
    { title: 'EMPLOYEES / OPTIONS', color: 'bg-[#EEEDF8] text-[#444654]' },
    { title: 'CONTRIBUTORS', color: 'bg-[#EEEDF8] text-[#444654]' },
    { title: 'INVESTORS', color: 'bg-[#EEEDF8] text-[#444654]' },
    { title: 'FUTURE RIGHTS', color: 'border border-[#C4C5D6] text-[#747685]' },
  ];

  const clarityChecks = [
    'Who owns shares',
    'What rights exist',
    'What remains available',
    'What may convert later',
    'What a new round may change',
    'What requires legal review',
  ];

  return (
    <section
      id="section-02-ownership-clarity"
      className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#FAF8FF] border-b border-[rgba(0,0,0,0.06)] flex justify-center"
    >
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            BEFORE THE FUNDRAISE
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Ownership should be clear before
            <br />
            the conversation gets serious.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            As founders, employees, contributors and investors become part of the company, ownership can become harder to understand. Mondial helps make that structure visible before important decisions are made.
          </p>
        </div>

        {/* 3-Part Architecture */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch">
          {/* Left: Unclear State (4 cols) */}
          <div className="lg:col-span-4 bg-white/70 border border-[#E2E1EC] rounded-[24px] p-6 sm:p-7 flex flex-col justify-between gap-6 shadow-xs">
            <div className="flex flex-col gap-4">
              <span className="text-[11px] font-bold text-[#747685] uppercase tracking-wider pb-2 border-b border-[rgba(0,0,0,0.06)]">
                UNCLEAR STATE
              </span>
              <div className="flex flex-col gap-2.5">
                {unclearItems.map((item, idx) => (
                  <div
                    key={item}
                    className="p-3 rounded-[12px] bg-[#FAF8FF] border border-dashed border-[#C4C5D6] text-[14px] text-[#444654] flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C4C5D6]" />
                    <span className="italic">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <span className="text-[11px] text-[#8A8B8F] italic">
              Informal commitments create ambiguity before formal rounds.
            </span>
          </div>

          {/* Center: Structured Vertical Ownership Spine (4 cols) */}
          <div className="lg:col-span-4 bg-white border-2 border-[#3C61DD]/40 rounded-[24px] p-6 sm:p-7 flex flex-col justify-between gap-6 shadow-md">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-[rgba(0,0,0,0.06)]">
                <span className="text-[11px] font-bold text-[#3C61DD] uppercase tracking-wider">
                  STRUCTURED CAP TABLE
                </span>
                <span className="font-heading font-extrabold text-[13px] text-[#070707]">
                  NOVA SPACE SAS
                </span>
              </div>

              <div className="flex flex-col gap-2.5">
                {spineNodes.map((node, idx) => (
                  <div key={node.title} className="flex flex-col items-center">
                    <div
                      className={`w-full p-3.5 rounded-[12px] text-center text-[12px] uppercase tracking-wider ${node.color}`}
                    >
                      {node.title}
                    </div>
                    {idx < spineNodes.length - 1 && (
                      <div className="w-[1px] h-3 bg-[#C4C5D6] my-0.5" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <span className="text-[11px] text-[#3C61DD] font-bold text-center">
              A single authoritative ownership hierarchy
            </span>
          </div>

          {/* Right: Clarity Checklist (4 cols) */}
          <div className="lg:col-span-4 bg-white border border-[#E2E1EC] rounded-[24px] p-6 sm:p-7 flex flex-col justify-between gap-6 shadow-xs">
            <div className="flex flex-col gap-4">
              <span className="text-[11px] font-bold text-[#157A55] uppercase tracking-wider pb-2 border-b border-[rgba(0,0,0,0.06)]">
                STRUCTURED CLARITY
              </span>
              <div className="flex flex-col gap-3">
                {clarityChecks.map((check) => (
                  <div
                    key={check}
                    className="p-3 rounded-[12px] bg-[#FAF8FF] border border-[#E2E1EC] flex items-center gap-3 text-[14px] font-medium text-[#1A1B23]"
                  >
                    <CheckCircle2 size={16} className="text-[#3C61DD] shrink-0" />
                    <span>{check}</span>
                  </div>
                ))}
              </div>
            </div>

            <span className="text-[11px] text-[#444654] font-medium">
              Readiness checklist for investor diligence.
            </span>
          </div>
        </div>

        {/* Bottom Statement & Legal Limitation */}
        <div className="w-full p-6 sm:p-8 rounded-[20px] bg-white border border-[#E2E1EC] text-center shadow-xs flex flex-col gap-3">
          <h3 className="font-heading font-extrabold text-[16px] sm:text-[20px] text-[#070707] uppercase tracking-wide">
            CAP TABLE CLARITY IS NOT JUST ADMINISTRATION. IT AFFECTS FUTURE DECISIONS.
          </h3>
          <p className="text-[13px] sm:text-[14px] text-[#747685] max-w-[840px] mx-auto leading-relaxed">
            Mondial can structure information and scenarios. Final legal ownership and securities decisions depend on valid company records and appropriate legal processes.
          </p>
        </div>
      </div>
    </section>
  );
}
