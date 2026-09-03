'use client';

import { FileSpreadsheet, DollarSign, Scale, PieChart, Shield, CheckSquare, ArrowRight } from 'lucide-react';

export default function TermSheetSection() {
  const categories = [
    {
      title: 'INVESTMENT',
      desc: 'How much capital enters the company.',
      icon: DollarSign,
      color: 'text-[#1A47C3]',
    },
    {
      title: 'VALUATION',
      desc: 'The economic basis of the round.',
      icon: Scale,
      color: 'text-[#005F40]',
    },
    {
      title: 'OWNERSHIP',
      desc: 'What investors receive.',
      icon: PieChart,
      color: 'text-[#875301]',
    },
    {
      title: 'RIGHTS',
      desc: 'What protections or governance rights may apply.',
      icon: Shield,
      color: 'text-[#BA1A1A]',
    },
    {
      title: 'CONDITIONS',
      desc: 'What needs to happen before closing.',
      icon: CheckSquare,
      color: 'text-[#747685]',
    },
  ];

  const closingFlow = [
    'TERM SHEET',
    'REVIEW',
    'LEGAL ADVICE',
    'NEGOTIATION',
    'FINAL DOCUMENTATION',
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#FAF8FF] border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#747685] uppercase tracking-wider">
            SECTION 08 — FROM INTEREST TO TERMS
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Money is one term.
            <br />
            Not the whole deal.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            When discussions become serious, the Entrepreneur needs to understand how economics, ownership, control and conditions fit together.
          </p>
        </div>

        {/* Term Sheet Anatomy Bento */}
        <div className="p-6 sm:p-10 rounded-[28px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col items-center gap-8">
          {/* Centerpiece Header */}
          <div className="px-8 py-4 rounded-[16px] bg-[#3C61DD] text-white flex items-center gap-3 shadow-sm">
            <FileSpreadsheet size={22} />
            <h3 className="font-heading font-extrabold text-[20px] sm:text-[24px]">TERM SHEET</h3>
          </div>

          {/* 5 Categories Grid */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {categories.map((c) => {
              const Icon = c.icon;
              return (
                <div
                  key={c.title}
                  className="p-5 rounded-[18px] bg-[#FAF8FF] border border-[#E2E1EC] flex flex-col gap-2.5 shadow-2xs"
                >
                  <div className="w-8 h-8 rounded-[8px] bg-white border border-[#E2E1EC] flex items-center justify-center">
                    <Icon size={16} className={c.color} />
                  </div>
                  <h4 className="font-heading font-bold text-[14px] text-[#1A1B23]">{c.title}</h4>
                  <p className="text-[12px] text-[#444654] leading-relaxed">{c.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Illustrative Term Scenario (Dark Card) */}
        <div className="p-6 sm:p-10 rounded-[28px] bg-[#2F3038] text-white shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 flex flex-col gap-5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#9AF5C7]" />
              <span className="text-[11px] font-bold text-[#C4C5D6] uppercase tracking-wider">
                ILLUSTRATIVE SCENARIO ONLY
              </span>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="text-[15px] text-[#C4C5D6]">Investment Amount</span>
                <span className="text-[24px] font-heading font-extrabold text-white">€500K</span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="text-[15px] text-[#C4C5D6]">
                  Illustrative Valuation Context
                </span>
                <span className="text-[20px] font-heading font-bold text-white">Applied</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="p-6 sm:p-8 rounded-[24px] bg-[#1A47C3] border-2 border-[#DCE1FF]/30 flex flex-col items-center text-center gap-2 shadow-lg min-w-[220px]">
              <span className="text-[44px] sm:text-[56px] font-heading font-extrabold text-[#DCE1FF] leading-none">
                20%
              </span>
              <span className="text-[11px] font-bold text-[#B7C4FF] uppercase tracking-wider">
                NEW INVESTOR OWNERSHIP
              </span>
            </div>
          </div>
        </div>

        {/* Journey to Closing Flow */}
        <div className="p-6 sm:p-8 rounded-[24px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col gap-4">
          <span className="text-[10px] font-bold text-[#3C61DD] uppercase tracking-wider">
            JOURNEY TO CLOSING
          </span>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[12px] font-bold text-[#1A1B23]">
            {closingFlow.map((step, idx) => (
              <div key={step} className="flex items-center gap-2">
                <span className="px-3.5 py-1.5 rounded-[8px] bg-[#FAF8FF] border border-[#E2E1EC]">
                  {step}
                </span>
                {idx < closingFlow.length - 1 && <span className="text-[#3C61DD]">➔</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Legal Statement */}
        <div className="w-full p-6 sm:p-8 rounded-[20px] bg-white border border-[#E2E1EC] text-center shadow-xs flex flex-col gap-2">
          <span className="font-heading font-extrabold text-[14px] sm:text-[16px] text-[#070707] uppercase tracking-wide">
            A TERM SHEET CAN SHAPE THE COMPANY LONG AFTER THE MONEY ARRIVES.
          </span>
          <p className="text-[13px] text-[#747685]">
            Specific deal terms and legal effects should be reviewed through appropriate professional and legal processes.
          </p>
        </div>
      </div>
    </section>
  );
}
