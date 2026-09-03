'use client';

import { Compass, CheckCircle2, ArrowRight } from 'lucide-react';

export default function InvestorDiscoveryJourney() {
  const steps = [
    'START WITH THESIS',
    'DISCOVER',
    'UNDERSTAND',
    'COMPARE',
    'MEET',
    'ALIGN',
    'REQUEST ACCESS',
  ];

  const equation = [
    'INVESTMENT THESIS',
    'STRUCTURED COMPANY CONTEXT',
    'EXPLAINABLE FIT',
    'MUTUAL INTEREST',
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#FAF8FF] border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            DISCOVER &amp; MATCH
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            From a broad market
            <br />
            to one conversation worth pursuing.
          </h2>
        </div>

        {/* 7-Step Journey Banner */}
        <div className="p-4 sm:p-5 rounded-[20px] bg-white border border-[#E2E1EC] shadow-2xs flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-[11px] sm:text-[12px] font-bold text-[#1A1B23]">
          {steps.map((st, idx) => (
            <span key={st} className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-[8px] bg-[#FAF8FF] border border-[#E2E1EC]">
                0{idx + 1} {st}
              </span>
              {idx < steps.length - 1 && <span className="text-[#3C61DD]">➔</span>}
            </span>
          ))}
        </div>

        {/* Discovery Equation Banner */}
        <div className="p-6 sm:p-10 rounded-[28px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col items-center gap-4 text-center">
          <span className="text-[11px] font-bold text-[#747685] uppercase tracking-wider">
            DISCOVERY EQUATION
          </span>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-[11px] sm:text-[12px] font-bold text-[#1A1B23]">
            {equation.map((term, idx) => (
              <span key={term} className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-[8px] bg-[#FAF8FF] border border-[#E2E1EC]">
                  {term}
                </span>
                {idx < equation.length - 1 ? (
                  <span className="text-[#3C61DD]">+</span>
                ) : (
                  <span className="text-[#3C61DD]">➔</span>
                )}
              </span>
            ))}
            <span className="px-4 py-1.5 rounded-[8px] bg-[#1A47C3] text-white shadow-xs">
              DILIGENCE-READY RELATIONSHIP
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
