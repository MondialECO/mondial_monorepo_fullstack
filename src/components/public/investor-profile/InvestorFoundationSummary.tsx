'use client';

import { ShieldCheck, CheckCircle2, Target, Eye, ArrowDown, Sparkles } from 'lucide-react';

export default function InvestorFoundationSummary() {
  const narrativeSteps = [
    { title: 'VERIFY', desc: 'Establish rigorous institutional identity and baseline trust.' },
    { title: 'VALIDATE', desc: 'Structure comprehensive financial capacity context securely.' },
    { title: 'DEFINE', desc: 'Construct the core investment thesis parameters.' },
    { title: 'FOCUS & STRUCTURE', desc: 'Set precise sector, stage, geography, ticket size and preferred investment structures.' },
    { title: 'PUBLISH & DISCOVER', desc: 'Deploy the complete Investor Profile to drive targeted opportunity matching.' },
  ];

  const equation = [
    'VERIFIED IDENTITY',
    'FINANCIAL CONTEXT',
    'INVESTMENT THESIS',
    'VISIBILITY SETTINGS',
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            INVESTOR PROFILE &amp; THESIS
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Know who you are.
            <br />
            Know what you are looking for.
          </h2>
        </div>

        {/* 5-Step Architecture of Discovery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-stretch">
          {narrativeSteps.map((st, idx) => (
            <div
              key={st.title}
              className="p-5 rounded-[22px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-2xs flex flex-col justify-between gap-3"
            >
              <div>
                <span className="text-[10px] font-bold text-[#3C61DD] uppercase">0{idx + 1}</span>
                <h4 className="font-heading font-bold text-[14px] text-[#1A1B23] mt-1">
                  {st.title}
                </h4>
                <p className="text-[11px] text-[#444654] leading-relaxed mt-2">{st.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Profile Equation Banner */}
        <div className="p-6 sm:p-10 rounded-[28px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-xs flex flex-col items-center gap-4 text-center">
          <span className="text-[11px] font-bold text-[#747685] uppercase tracking-wider">
            PROFILE EQUATION
          </span>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-[11px] sm:text-[12px] font-bold text-[#1A1B23]">
            {equation.map((term, idx) => (
              <span key={term} className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-[8px] bg-white border border-[#E2E1EC]">
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
              DISCOVERY-READY INVESTOR PROFILE
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
