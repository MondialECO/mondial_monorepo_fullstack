'use client';

import { Target, Layers, Globe, DollarSign, Briefcase, TrendingUp, ArrowRight } from 'lucide-react';

export default function InvestmentThesisSection() {
  const dimensions = [
    { title: 'SECTOR', desc: 'B2B SaaS, FinTech, Future of Work, Climate' },
    { title: 'STAGE', desc: 'Idea, Prototype, Early Revenue, Scaling' },
    { title: 'GEOGRAPHY', desc: 'France, European Union, Selected International Markets' },
    { title: 'TICKET', desc: 'Minimum, Preferred, Maximum deployment range' },
    { title: 'DEAL STRUCTURE', desc: 'Equity, SAFE, Convertible Note, Debt, Revenue Share, Custom Deal' },
    { title: 'INVESTMENT APPROACH', desc: 'Lead, Co-Invest, Follow, Strategic participation' },
  ];

  const flow = ['THESIS', 'MATCHING', 'DISCOVERY', 'REVIEW'];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#747685] uppercase tracking-wider">
            DEFINE WHAT FIT MEANS
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            An investment thesis turns
            <br />
            preference into structure.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Rather than browsing every company, the Investor defines the characteristics that make an opportunity relevant to their strategy.
          </p>
        </div>

        {/* 6-Dimension Hub Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {dimensions.map((dim) => (
            <div
              key={dim.title}
              className="p-5 rounded-[22px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-2xs flex flex-col justify-between gap-3"
            >
              <span className="text-[10px] font-bold text-[#3C61DD] uppercase">{dim.title}</span>
              <p className="text-[12px] text-[#1A1B23] font-medium leading-relaxed">{dim.desc}</p>
            </div>
          ))}
        </div>

        {/* Thesis Clarification & Flow Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left: What thesis is / is not (6 cols) */}
          <div className="lg:col-span-6 p-6 sm:p-8 rounded-[24px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-4">
            <span className="text-[11px] font-bold text-[#747685] uppercase tracking-wider">
              THESIS DEFINITION
            </span>

            <div className="space-y-2 text-[12px]">
              <div className="p-3 rounded-[12px] bg-white border border-[#E2E1EC] text-[#BA1A1A] font-bold">
                THESIS is NOT: &ldquo;show me good startups.&rdquo;
              </div>
              <div className="p-3 rounded-[12px] bg-[#E8F8EE] border border-[#157A55]/30 text-[#157A55] font-bold">
                THESIS IS: WHERE + WHEN + WHAT + HOW MUCH + HOW
              </div>
            </div>
          </div>

          {/* Right: Progression Flow (6 cols) */}
          <div className="lg:col-span-6 p-6 sm:p-8 rounded-[24px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-4">
            <span className="text-[11px] font-bold text-[#747685] uppercase tracking-wider">
              DISCOVERY PROGRESSION
            </span>

            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-[12px] bg-white border border-[#E2E1EC] text-[12px] font-bold text-[#1A1B23]">
              {flow.map((st, idx) => (
                <span key={st} className="flex items-center gap-2">
                  <span>{st}</span>
                  {idx < flow.length - 1 && <span className="text-[#3C61DD]">➔</span>}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Section Statement */}
        <div className="p-6 sm:p-7 rounded-[20px] bg-[#FAF8FF] border border-[#E2E1EC] text-center shadow-xs">
          <h3 className="font-heading font-extrabold text-[15px] sm:text-[18px] text-[#070707] uppercase tracking-wide">
            THE BETTER THE INVESTOR DEFINES FIT,
            <br />
            THE LESS DISCOVERY HAS TO RELY ON NOISE.
          </h3>
        </div>
      </div>
    </section>
  );
}
