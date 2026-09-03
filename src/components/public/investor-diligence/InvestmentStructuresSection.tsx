'use client';

import { Scale, ArrowRight, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function InvestmentStructuresSection() {
  const structures = [
    {
      num: '01',
      title: 'EQUITY',
      desc: 'Investor receives ownership through an equity financing.',
      q: 'What ownership is being acquired?',
    },
    {
      num: '02',
      title: 'SAFE',
      desc: 'Investment now, with rights to future equity under the applicable agreement.',
      q: 'What conversion terms apply?',
    },
    {
      num: '03',
      title: 'CONVERTIBLE NOTE',
      desc: 'Debt instrument that may convert into equity under defined terms.',
      q: 'What interest, maturity and conversion terms apply?',
    },
    {
      num: '04',
      title: 'DEBT',
      desc: 'Capital structured with repayment obligations.',
      q: 'What repayment obligations apply?',
    },
    {
      num: '05',
      title: 'REVENUE SHARE',
      desc: 'Repayment or return linked to defined revenue terms.',
      q: 'What revenue definition and repayment mechanics apply?',
    },
    {
      num: '06',
      title: 'CUSTOM DEAL',
      desc: 'A transaction requiring a specifically structured agreement.',
      q: 'What custom governance, liquidation or operational terms apply?',
    },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#FAF8FF] border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            THE CAPITAL CAN ENTER IN DIFFERENT WAYS
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            The company can fit.
            <br />
            The investment structure still needs to fit too.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Mondial can support different investment structures while keeping the economic and legal implications visible for later professional review.
          </p>
        </div>

        {/* 6 Structures Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {structures.map((st) => (
            <div
              key={st.num}
              className="p-6 rounded-[24px] bg-white border border-[#E2E1EC] shadow-2xs flex flex-col justify-between gap-4"
            >
              <div>
                <span className="text-[10px] font-bold text-[#3C61DD] uppercase block">
                  {`${st.num} / STRUCTURE`}
                </span>
                <h3 className="font-heading font-bold text-[18px] text-[#1A1B23] mt-1">
                  {st.title}
                </h3>
                <p className="text-[12px] text-[#444654] mt-2 leading-relaxed">{st.desc}</p>
              </div>

              <div className="p-2.5 rounded-[10px] bg-[#FAF8FF] border border-[#E2E1EC] text-[11px] text-[#747685]">
                <strong className="text-[#1A1B23] block">Key Diligence Question:</strong>
                <span className="mt-0.5 block">{st.q}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Structure Relationship & Professional Advice Note */}
        <div className="p-6 sm:p-8 rounded-[28px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col items-center text-center gap-4">
          <span className="text-[11px] font-bold text-[#747685] uppercase tracking-wider">
            DEAL STRUCTURE RELATIONSHIP
          </span>

          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] sm:text-[12px] font-bold text-[#1A1B23]">
            <span className="px-3 py-1.5 rounded-[8px] bg-[#FAF8FF] border border-[#E2E1EC]">
              COMPANY NEED
            </span>
            <span className="text-[#3C61DD]">+</span>
            <span className="px-3 py-1.5 rounded-[8px] bg-[#FAF8FF] border border-[#E2E1EC]">
              INVESTOR PREFERENCE
            </span>
            <span className="text-[#3C61DD]">+</span>
            <span className="px-3 py-1.5 rounded-[8px] bg-[#FAF8FF] border border-[#E2E1EC]">
              LEGAL / FINANCIAL CONTEXT
            </span>
            <span className="text-[#3C61DD]">➔</span>
            <span className="px-4 py-1.5 rounded-[8px] bg-[#1A47C3] text-white shadow-xs">
              POTENTIAL DEAL STRUCTURE
            </span>
          </div>

          <h3 className="font-heading font-extrabold text-[14px] sm:text-[16px] text-[#070707] uppercase tracking-wide pt-2">
            MATCHING THE COMPANY IS ONLY HALF THE DECISION.
            <br />
            THE STRUCTURE DEFINES HOW CAPITAL AND RIGHTS INTERACT.
          </h3>

          <p className="text-[11px] text-[#747685] max-w-[760px] pt-1">
            Deal structures can have material legal, tax and financial consequences. Appropriate professional advice may be required before execution.
          </p>
        </div>
      </div>
    </section>
  );
}
