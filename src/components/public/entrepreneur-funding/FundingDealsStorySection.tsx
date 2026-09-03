'use client';

import { Sparkles, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function FundingDealsStorySection() {
  const sevenSteps = [
    { title: 'MATCH', desc: 'Find investors whose thesis fits' },
    { title: 'ACCESS', desc: 'Control shared info' },
    { title: 'DILIGENCE', desc: 'Answer with evidence' },
    { title: 'ALIGN', desc: 'Understand mutual fit' },
    { title: 'TERMS', desc: 'Structure the deal' },
    { title: 'NEGOTIATE', desc: 'Resolve economics' },
    { title: 'EXECUTE', desc: 'Complete transaction' },
  ];

  const equation = [
    'RIGHT INVESTOR',
    'RIGHT INFORMATION',
    'RIGHT TIMING',
    'CLEAR TERMS',
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            FUNDING &amp; DEALS
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            From readiness to a real investor process.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            A systematic approach to transforming your prepared data room into a structured capital event.
          </p>
        </div>

        {/* 7-Step Story Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3.5">
          {sevenSteps.map((step, idx) => (
            <div
              key={step.title}
              className="p-4 rounded-[18px] bg-[#FAF8FF] border border-[#E2E1EC] flex flex-col justify-between gap-3 shadow-xs"
            >
              <span className="font-mono text-[10px] font-bold text-[#3C61DD]">0{idx + 1}</span>
              <div>
                <h3 className="font-heading font-bold text-[14px] text-[#1A1B23]">{step.title}</h3>
                <p className="text-[12px] text-[#444654] mt-0.5 leading-snug">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Structured Deal Equation Box */}
        <div className="bg-[#FAF8FF] border-2 border-[#3C61DD]/30 rounded-[28px] p-6 sm:p-10 flex flex-col items-center gap-5 text-center shadow-md">
          <span className="text-[11px] font-bold text-[#3C61DD] uppercase tracking-wider">
            STRUCTURED DEAL EQUATION
          </span>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-[12px] sm:text-[13px] font-bold">
            {equation.map((term, idx) => (
              <span key={term} className="flex items-center gap-2">
                <span className="px-3.5 py-1.5 rounded-[8px] bg-white border border-[#E2E1EC] text-[#1A1B23]">
                  {term}
                </span>
                {idx < equation.length - 1 ? (
                  <span className="text-[#3C61DD]">+</span>
                ) : (
                  <span className="text-[#3C61DD]">➔</span>
                )}
              </span>
            ))}
            <span className="px-4 py-1.5 rounded-[8px] bg-[#3C61DD] text-white shadow-xs">
              STRUCTURED DEAL PROCESS
            </span>
          </div>

          <span className="text-[11px] font-bold text-[#747685] tracking-wide uppercase pt-1">
            (Not: GUARANTEED FUNDING)
          </span>
        </div>
      </div>
    </section>
  );
}
