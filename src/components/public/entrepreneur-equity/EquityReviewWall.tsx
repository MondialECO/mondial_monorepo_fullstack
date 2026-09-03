'use client';

import { ArrowDown, AlertTriangle, CheckCircle2, Search, HelpCircle, FileText, ArrowRight } from 'lucide-react';

export default function EquityReviewWall() {
  const processSteps = [
    {
      title: 'COMPARE',
      desc: 'Identify connected claims across different documents.',
      color: 'bg-[#1A47C3]',
    },
    {
      title: 'QUESTION',
      desc: 'Surface logical inconsistencies or gaps.',
      color: 'bg-[#875301]',
    },
    {
      title: 'EXPLAIN IMPACT',
      desc: 'Articulate why this matters to an investor.',
      color: 'bg-[#005F40]',
    },
    {
      title: 'SUGGEST NEXT REVIEW',
      desc: 'Propose actionable steps to align the logic.',
      color: 'bg-[#3C61DD]',
    },
  ];

  const examples = [
    {
      num: 'EXAMPLE 01',
      left: { title: 'FUNDING ASK', val: '€500K' },
      right: { title: 'FINANCIAL FORECAST', val: 'Cash need: €720K' },
      finding: 'FINDING: ASK MAY NOT COVER THE PLAN',
      action: 'Action: Review funding amount or assumptions.',
    },
    {
      num: 'EXAMPLE 02',
      left: { title: 'CAP TABLE', val: 'Option Pool: 5%' },
      right: { title: 'HIRING PLAN', val: '8 future hires' },
      finding: 'FINDING: OPTION POOL MAY NEED REVIEW',
      action: 'Action: Align option allocation with planned key hires.',
    },
    {
      num: 'EXAMPLE 03',
      left: { title: 'GROWTH CLAIM', val: '"Strong market demand"' },
      right: { title: 'EVIDENCE', val: '18 interviews, No paid transactions yet' },
      finding: 'FINDING: CLAIM NEEDS BETTER QUALIFICATION',
      action: 'Action: Differentiate customer feedback from revenue traction.',
    },
    {
      num: 'EXAMPLE 04',
      left: { title: 'VALUATION NARRATIVE', val: 'Growth-stage framing' },
      right: { title: 'COMPANY STAGE', val: 'Pre-launch MVP' },
      finding: 'FINDING: POSITIONING MAY BE TOO ADVANCED',
      action: 'Action: Frame valuation expectations around early development stage.',
    },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#FAF8FF] border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#747685] uppercase tracking-wider">
            CONNECT THE COMPANY LOGIC
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Before investors ask, find the
            <br />
            contradictions yourself.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Mondial can help compare connected company information to surface gaps, inconsistencies and questions that deserve review before fundraising begins.
          </p>
        </div>

        {/* 2-Column Composition */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Process Logic Flow (4 cols) */}
          <div className="lg:col-span-4 bg-white border border-[#E2E1EC] rounded-[24px] p-6 sm:p-7 flex flex-col justify-between gap-6 shadow-xs">
            <div className="flex flex-col gap-5">
              <span className="text-[11px] font-bold text-[#3C61DD] uppercase tracking-wider pb-2 border-b border-[rgba(0,0,0,0.06)]">
                MONDIAL REVIEW LOGIC
              </span>

              <div className="flex flex-col gap-4 pl-3 border-l-2 border-[#E2E1EC]">
                {processSteps.map((step, idx) => (
                  <div key={step.title} className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${step.color}`} />
                      <h4 className="font-heading font-bold text-[15px] text-[#1A1B23]">
                        {step.title}
                      </h4>
                    </div>
                    <p className="text-[12px] text-[#444654] pl-4">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <span className="text-[10px] text-[#8A8B8F] italic">
              Demonstration review protocol for founder preparation.
            </span>
          </div>

          {/* Right Column: Review Examples Bento Grid (8 cols) */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {examples.map((ex) => (
              <div
                key={ex.num}
                className="bg-white border border-[#E2E1EC] rounded-[20px] p-5 sm:p-6 flex flex-col justify-between gap-4 shadow-xs"
              >
                <div className="flex flex-col gap-3">
                  <span className="text-[10px] font-bold text-[#747685] uppercase tracking-wider">
                    {ex.num}
                  </span>

                  {/* Left VS Right Comparison */}
                  <div className="flex flex-col gap-2">
                    <div className="p-3 rounded-[10px] bg-[#FAF8FF] border border-[#E2E1EC] flex flex-col">
                      <span className="text-[9px] font-bold text-[#747685] uppercase">
                        {ex.left.title}
                      </span>
                      <span className="font-heading font-bold text-[15px] text-[#1A1B23]">
                        {ex.left.val}
                      </span>
                    </div>

                    <div className="flex items-center justify-center -my-1">
                      <span className="px-2 py-0.5 rounded-full bg-[#FAF8FF] border border-[#E2E1EC] text-[#747685] text-[9px] font-bold">
                        VS
                      </span>
                    </div>

                    <div className="p-3 rounded-[10px] bg-[#FAF8FF] border border-[#E2E1EC] flex flex-col">
                      <span className="text-[9px] font-bold text-[#747685] uppercase">
                        {ex.right.title}
                      </span>
                      <span className="font-heading font-bold text-[14px] text-[#1A1B23]">
                        {ex.right.val}
                      </span>
                    </div>
                  </div>

                  {/* Finding Alert Box */}
                  <div className="p-3 rounded-[10px] bg-amber-50 border border-amber-200 text-amber-900 flex flex-col gap-1 text-[11px]">
                    <span className="font-bold flex items-center gap-1">
                      <AlertTriangle size={12} className="text-amber-700" />
                      {ex.finding}
                    </span>
                    <span className="text-amber-800/90">{ex.action}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Statement */}
        <div className="w-full p-6 sm:p-8 rounded-[20px] bg-white border border-[#E2E1EC] text-center shadow-xs">
          <span className="font-heading font-extrabold text-[15px] sm:text-[18px] text-[#070707] uppercase tracking-wide">
            THE GOAL IS NOT TO MAKE THE COMPANY LOOK PERFECT. THE GOAL IS TO MAKE THE COMPANY LOGIC COHERENT.
          </span>
        </div>
      </div>
    </section>
  );
}
