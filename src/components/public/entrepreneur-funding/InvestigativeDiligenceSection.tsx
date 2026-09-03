'use client';

import { Search, AlertCircle, HelpCircle, ArrowRight, ShieldAlert } from 'lucide-react';

export default function InvestigativeDiligenceSection() {
  const branches = [
    { title: 'MARKET', q: 'What evidence supports demand?' },
    { title: 'FINANCIAL', q: 'What does scaling cost?' },
    { title: 'EXECUTION', q: 'What has already been delivered?' },
    { title: 'TEAM', q: 'Who owns the critical capabilities?' },
    { title: 'LEGAL', q: 'Is the company structure clear?' },
    { title: 'EQUITY', q: 'Who owns what?' },
    { title: 'RISK', q: 'What assumptions remain unresolved?' },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#FAF8FF] border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#747685] uppercase tracking-wider">
            GO DEEPER THAN THE PITCH
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Diligence begins when the
            <br />
            questions get harder.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Investor diligence can test the company’s legal structure, financial logic, market assumptions, execution evidence and ownership context before a decision is made.
          </p>
        </div>

        {/* Investigation Map */}
        <div className="p-6 sm:p-10 rounded-[28px] bg-white border border-[#E2E1EC] flex flex-col items-center gap-8 shadow-xs">
          {/* Central Claim Node */}
          <div className="p-6 rounded-[20px] bg-[#FAF8FF] border-2 border-[#3C61DD]/30 text-center flex flex-col items-center gap-1 shadow-sm max-w-[420px]">
            <span className="text-[10px] font-bold text-[#3C61DD] uppercase tracking-wider">
              COMPANY CLAIM
            </span>
            <h3 className="font-heading font-extrabold text-[18px] sm:text-[20px] text-[#1A1B23]">
              &ldquo;We can scale the marketplace.&rdquo;
            </h3>
          </div>

          {/* 7 Branches Grid */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {branches.map((b) => (
              <div
                key={b.title}
                className="p-4 rounded-[14px] bg-[#FAF8FF] border border-[#E2E1EC] flex flex-col gap-1 shadow-2xs"
              >
                <span className="text-[11px] font-bold text-[#3C61DD] uppercase tracking-wider">
                  {b.title}
                </span>
                <p className="text-[13px] text-[#444654]">{b.q}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 3 Diligence Stories */}
        <div className="flex flex-col gap-5">
          <span className="text-[11px] font-bold text-[#747685] uppercase tracking-wider">
            ILLUSTRATIVE EXAMPLES
          </span>

          {/* Story 01 */}
          <div className="p-5 sm:p-6 rounded-[20px] bg-white border border-[#E2E1EC] shadow-xs grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-2">
              <span className="text-[9px] font-bold text-[#3C61DD] uppercase block">CLAIM</span>
              <span className="font-heading font-bold text-[15px] text-[#1A1B23]">
                Strong demand
              </span>
            </div>
            <div className="md:col-span-3">
              <span className="text-[9px] font-bold text-[#747685] uppercase block">EVIDENCE</span>
              <span className="text-[13px] text-[#444654]">42 early users, 18 interviews</span>
            </div>
            <div className="md:col-span-3">
              <span className="text-[9px] font-bold text-[#747685] uppercase block">QUESTION</span>
              <span className="text-[13px] text-[#444654]">Any paid transactions?</span>
              <span className="text-[11px] font-bold text-[#1A1B23] block mt-0.5">Answer: Not yet</span>
            </div>
            <div className="md:col-span-4 p-3 rounded-[12px] bg-[#F3F2FD] border border-[#E2E1EC]">
              <span className="text-[9px] font-bold text-[#3C61DD] uppercase block">INTERPRETATION</span>
              <span className="text-[12px] font-medium text-[#1A1B23]">
                Demand still needs commercial validation.
              </span>
            </div>
          </div>

          {/* Story 02 */}
          <div className="p-5 sm:p-6 rounded-[20px] bg-white border border-[#E2E1EC] shadow-xs grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-2">
              <span className="text-[9px] font-bold text-[#3C61DD] uppercase block">CLAIM</span>
              <span className="font-heading font-bold text-[15px] text-[#1A1B23]">
                MVP launch is close
              </span>
            </div>
            <div className="md:col-span-3">
              <span className="text-[9px] font-bold text-[#747685] uppercase block">EVIDENCE</span>
              <span className="text-[13px] text-[#444654]">Interface complete</span>
            </div>
            <div className="md:col-span-3">
              <span className="text-[9px] font-bold text-[#747685] uppercase block">OPEN ISSUE</span>
              <span className="text-[13px] text-[#444654]">Backend dependency</span>
            </div>
            <div className="md:col-span-4 p-3 rounded-[12px] bg-[#F3F2FD] border border-[#E2E1EC]">
              <span className="text-[9px] font-bold text-[#3C61DD] uppercase block">INTERPRETATION</span>
              <span className="text-[12px] font-medium text-[#1A1B23]">Execution risk remains.</span>
            </div>
          </div>

          {/* Story 03 */}
          <div className="p-5 sm:p-6 rounded-[20px] bg-white border border-[#E2E1EC] shadow-xs grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-2">
              <span className="text-[9px] font-bold text-[#3C61DD] uppercase block">CLAIM</span>
              <span className="font-heading font-bold text-[15px] text-[#1A1B23]">
                €500K funding need
              </span>
            </div>
            <div className="md:col-span-6">
              <span className="text-[9px] font-bold text-[#747685] uppercase block">FORECAST</span>
              <span className="text-[13px] text-[#444654]">€720K modeled cash requirement</span>
            </div>
            <div className="md:col-span-4 p-3 rounded-[12px] bg-[#F3F2FD] border border-[#E2E1EC]">
              <span className="text-[9px] font-bold text-[#3C61DD] uppercase block">INTERPRETATION</span>
              <span className="text-[12px] font-medium text-[#1A1B23]">
                Funding logic requires review.
              </span>
            </div>
          </div>
        </div>

        {/* Footer Statement */}
        <div className="w-full p-6 sm:p-8 rounded-[20px] bg-white border border-[#E2E1EC] text-center shadow-xs">
          <span className="font-heading font-extrabold text-[15px] sm:text-[18px] text-[#070707] uppercase tracking-wide">
            DILIGENCE IS NOT ABOUT FINDING A PERFECT COMPANY. IT IS ABOUT UNDERSTANDING THE REAL ONE.
          </span>
        </div>
      </div>
    </section>
  );
}
