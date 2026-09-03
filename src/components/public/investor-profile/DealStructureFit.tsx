'use client';

import { CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, FileSpreadsheet } from 'lucide-react';

export default function DealStructureFit() {
  const options = [
    { title: 'EQUITY', status: 'COMPATIBLE', isCompatible: true, isDisc: false },
    { title: 'SAFE', status: 'COMPATIBLE', isCompatible: true, isDisc: false },
    { title: 'CONVERTIBLE NOTE', status: 'NEEDS DISCUSSION', isCompatible: false, isDisc: true },
    { title: 'DEBT', status: 'NEEDS DISCUSSION', isCompatible: false, isDisc: true },
    { title: 'REVENUE SHARE', status: 'EXPLORATORY', isCompatible: false, isDisc: false },
    { title: 'CUSTOM DEAL', status: 'HYBRID STRUCTURE', isCompatible: false, isDisc: false },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#747685] uppercase tracking-wider">
            HOW YOU INVEST ALSO MATTERS
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Two investors can like the same company
            <br />
            and still want different deals.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Investment preferences can include the structure through which capital may be provided, not only the type of company being considered.
          </p>
        </div>

        {/* Center Target Company + 6 Orbiting Deal Structures Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Target Company (4 cols) */}
          <div className="lg:col-span-4 p-6 sm:p-8 rounded-[28px] bg-[#FAF8FF] border-2 border-[#3C61DD] shadow-md flex flex-col items-center justify-center text-center gap-2">
            <span className="text-[10px] font-bold text-[#747685] uppercase">
              TARGET COMPANY
            </span>
            <h3 className="font-heading font-extrabold text-[22px] text-[#1A1B23]">
              NOVA SPACE SAS
            </h3>
            <div className="text-[28px] font-heading font-extrabold text-[#157A55] my-1">
              €700K
            </div>
            <p className="text-[12px] text-[#747685]">Seeking Seed Round</p>
          </div>

          {/* 6 Structures (8 cols) */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {options.map((opt) => (
              <div
                key={opt.title}
                className="p-4 rounded-[18px] bg-[#FAF8FF] border border-[#E2E1EC] flex flex-col justify-between gap-2"
              >
                <span className="text-[10px] font-bold text-[#747685] uppercase">{opt.title}</span>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded max-w-fit ${
                    opt.isCompatible
                      ? 'bg-[#E8F8EE] text-[#157A55]'
                      : opt.isDisc
                      ? 'bg-amber-50 text-amber-800'
                      : 'bg-white text-[#747685]'
                  }`}
                >
                  {opt.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Deal-Fit Equation & Statement */}
        <div className="p-6 sm:p-8 rounded-[24px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-xs flex flex-col items-center text-center gap-4">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-[12px] sm:text-[13px] font-bold text-[#1A1B23]">
            <span className="px-3 py-1.5 rounded-[8px] bg-white border border-[#E2E1EC]">COMPANY</span>
            <span className="text-[#3C61DD]">+</span>
            <span className="px-3 py-1.5 rounded-[8px] bg-white border border-[#E2E1EC]">INVESTOR</span>
            <span className="text-[#3C61DD]">+</span>
            <span className="px-3 py-1.5 rounded-[8px] bg-white border border-[#E2E1EC]">DEAL STRUCTURE</span>
            <span className="text-[#3C61DD]">➔</span>
            <span className="px-4 py-1.5 rounded-[8px] bg-[#1A47C3] text-white shadow-xs">
              POTENTIAL INVESTMENT FIT
            </span>
          </div>

          <h3 className="font-heading font-extrabold text-[14px] sm:text-[16px] text-[#070707] uppercase tracking-wide pt-2">
            MATCHING THE COMPANY DOES NOT AUTOMATICALLY MATCH THE DEAL.
          </h3>
        </div>

        {/* Legal Disclaimer */}
        <div className="p-4 rounded-[16px] bg-[#FAF8FF] border border-[#E2E1EC] text-center text-[12px] text-[#747685]">
          *Specific transaction structures, rights and legal effects belong to later diligence and deal discussions.
        </div>
      </div>
    </section>
  );
}
