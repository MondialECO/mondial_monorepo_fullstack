'use client';

import { PieChart, Table, GitBranch, Compass, DollarSign, ShieldCheck, ArrowRight } from 'lucide-react';

export default function EquityReadinessSummary() {
  const nodes = [
    { title: 'OWNERSHIP', desc: 'Who owns what', icon: PieChart },
    { title: 'CAP TABLE', desc: 'How equity is structured', icon: Table },
    { title: 'SCENARIOS', desc: 'What a future round could change', icon: GitBranch },
    { title: 'VALUATION CONTEXT', desc: 'What evidence supports the discussion', icon: Compass },
    { title: 'FUNDING ASK', desc: 'What capital is needed and why', icon: DollarSign },
    { title: 'READINESS', desc: 'What still needs work before outreach', icon: ShieldCheck },
  ];

  const equationTerms = ['OWNERSHIP', 'COMPANY EVIDENCE', 'FINANCIAL CONTEXT', 'FUNDING LOGIC'];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            EQUITY &amp; READINESS
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Understand the structure before entering the deal.
          </h2>
        </div>

        {/* 6 Vertical Summary Journey Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {nodes.map((n, i) => {
            const Icon = n.icon;
            return (
              <div
                key={n.title}
                className="p-6 rounded-[20px] bg-[#FAF8FF] border border-[#E2E1EC] flex items-start gap-4 shadow-xs"
              >
                <div className="w-10 h-10 rounded-[10px] bg-[#DCE1FF] flex items-center justify-center text-[#1A47C3] shrink-0">
                  <Icon size={20} />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="font-heading font-bold text-[16px] text-[#1A1B23]">{n.title}</h3>
                  <p className="text-[13px] text-[#444654]">{n.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Equation Box */}
        <div className="bg-[#FAF8FF] border-2 border-[#3C61DD]/30 rounded-[24px] p-6 sm:p-10 flex flex-col items-center gap-6 text-center shadow-md">
          <span className="text-[11px] font-bold text-[#3C61DD] uppercase tracking-wider">
            INVESTOR-READY CONTEXT EQUATION
          </span>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-[12px] sm:text-[13px] font-bold">
            {equationTerms.map((term, idx) => (
              <span key={term} className="flex items-center gap-2">
                <span className="px-3.5 py-1.5 rounded-[8px] bg-white border border-[#E2E1EC] text-[#1A1B23]">
                  {term}
                </span>
                {idx < equationTerms.length - 1 ? (
                  <span className="text-[#3C61DD]">+</span>
                ) : (
                  <span className="text-[#3C61DD]">➔</span>
                )}
              </span>
            ))}
            <span className="px-4 py-1.5 rounded-[8px] bg-[#3C61DD] text-white shadow-xs">
              INVESTOR-READY CONTEXT
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
