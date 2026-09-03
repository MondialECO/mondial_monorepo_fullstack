'use client';

import { Building2, CheckCircle2, XCircle, ArrowRight, Sparkles, Filter } from 'lucide-react';

export default function InvestorDiscoverySection() {
  const companyFields = [
    { label: 'Sector', val: 'Future of Work' },
    { label: 'Stage', val: 'Early Market' },
    { label: 'Geography', val: 'France / Europe' },
    { label: 'Funding Ask', val: '€500K' },
    { label: 'Business Model', val: 'Marketplace' },
    { label: 'Current Evidence', val: 'MVP, Pilot Supply, Early Users' },
  ];

  const fitCriteria = ['SECTOR', 'STAGE', 'TICKET', 'GEOGRAPHY', 'THESIS'];

  const archetypes = [
    {
      title: '1. EARLY-STAGE MARKETPLACE INVESTOR',
      fit: 'FIT: HIGH',
      isHigh: true,
      why: 'Why: Stage + sector alignment.',
    },
    {
      title: '2. GENERALIST SEED FUND',
      fit: 'FIT: HIGH',
      isHigh: true,
      why: 'Why: Ticket + geography alignment.',
    },
    {
      title: '3. LATE-STAGE GROWTH FUND',
      fit: 'FIT: LOW',
      isHigh: false,
      why: 'Why: Stage mismatch.',
    },
  ];

  return (
    <section
      id="section-02-investor-discovery"
      className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#FAF8FF] border-b border-[rgba(0,0,0,0.06)] flex justify-center"
    >
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#747685] uppercase tracking-wider">
            INVESTOR DISCOVERY
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            The goal is not more investor
            <br />
            names. It is better fit.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Mondial connects the company’s stage, sector, geography, funding ask and business context with investor preferences before outreach begins.
          </p>
        </div>

        {/* 3-Column Asymmetric Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left: The Company (4 cols) */}
          <div className="lg:col-span-4 bg-white border border-[#E2E1EC] rounded-[24px] p-6 sm:p-7 flex flex-col justify-between gap-6 shadow-xs text-[13px]">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-[rgba(0,0,0,0.06)]">
                <span className="text-[10px] font-bold text-[#747685] uppercase tracking-wider">
                  THE COMPANY
                </span>
                <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 uppercase">
                  DEMO
                </span>
              </div>

              <h3 className="font-heading font-extrabold text-[20px] text-[#1A1B23]">
                NOVA SPACE SAS
              </h3>

              <div className="flex flex-col gap-2.5">
                {companyFields.map((f) => (
                  <div
                    key={f.label}
                    className="flex items-center justify-between pb-2 border-b border-[rgba(0,0,0,0.04)]"
                  >
                    <span className="text-[#747685] text-[12px]">{f.label}</span>
                    <span className="font-semibold text-[#1A1B23] text-right">{f.val}</span>
                  </div>
                ))}
              </div>
            </div>

            <span className="text-[10px] text-[#8A8B8F] italic">ILLUSTRATIVE EXAMPLE</span>
          </div>

          {/* Center: Fit Logic (4 cols) */}
          <div className="lg:col-span-4 bg-[#F3F2FD] border-2 border-[#3C61DD]/30 rounded-[24px] p-6 sm:p-7 flex flex-col justify-between gap-6 shadow-xs">
            <div className="flex flex-col gap-4">
              <span className="text-[10px] font-bold text-[#3C61DD] uppercase tracking-wider pb-2 border-b border-[rgba(0,0,0,0.06)]">
                FIT CRITERIA
              </span>

              <div className="flex flex-wrap gap-2">
                {fitCriteria.map((c) => (
                  <span
                    key={c}
                    className="px-3 py-1.5 rounded-[8px] bg-white border border-[#E2E1EC] text-[11px] font-bold text-[#3C61DD]"
                  >
                    {c}
                  </span>
                ))}
              </div>

              <div className="p-4 rounded-[14px] bg-white border border-[#E2E1EC] text-[12px] font-medium text-[#444654] leading-relaxed flex flex-col gap-1">
                <span className="font-bold text-[#1A1B23]">MATCH EQUATION</span>
                <span>COMPANY CONTEXT</span>
                <span className="text-[#3C61DD] font-bold">+ INVESTOR PREFERENCE</span>
                <span className="text-[#005F40] font-bold">= RELEVANT INTRODUCTION</span>
              </div>
            </div>

            <span className="text-[10px] text-[#3C61DD] font-bold text-center">
              Relevance filters prevent wasted founder outreach
            </span>
          </div>

          {/* Right: Investor Archetypes (4 cols) */}
          <div className="lg:col-span-4 bg-white border border-[#E2E1EC] rounded-[24px] p-6 sm:p-7 flex flex-col justify-between gap-6 shadow-xs">
            <div className="flex flex-col gap-4">
              <span className="text-[10px] font-bold text-[#747685] uppercase tracking-wider pb-2 border-b border-[rgba(0,0,0,0.06)]">
                INVESTOR ARCHETYPES
              </span>

              <div className="flex flex-col gap-3">
                {archetypes.map((a) => (
                  <div
                    key={a.title}
                    className="p-3.5 rounded-[14px] bg-[#FAF8FF] border border-[#E2E1EC] flex flex-col gap-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-heading font-bold text-[12px] text-[#1A1B23]">
                        {a.title}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 ${
                          a.isHigh
                            ? 'bg-[#E8F8EE] text-[#005F40]'
                            : 'bg-red-50 text-[#BA1A1A] border border-red-200'
                        }`}
                      >
                        {a.fit}
                      </span>
                    </div>
                    <span className="text-[11px] text-[#747685]">{a.why}</span>
                  </div>
                ))}
              </div>
            </div>

            <span className="text-[10px] text-[#8A8B8F] italic">
              Demonstration investor profiles.
            </span>
          </div>
        </div>

        {/* Discovery Closing Banner */}
        <div className="w-full p-6 sm:p-8 rounded-[20px] bg-white border border-[#E2E1EC] text-center shadow-xs flex flex-col gap-2">
          <span className="text-[11px] font-bold text-[#747685] uppercase">
            A GOOD MATCH CONSIDERS BOTH SIDES • COMPANY NEEDS ↔ INVESTOR THESIS
          </span>
          <h3 className="font-heading font-extrabold text-[16px] sm:text-[20px] text-[#070707] uppercase tracking-wide">
            MORE OUTREACH IS NOT ALWAYS BETTER FUNDRAISING. RELEVANCE MATTERS.
          </h3>
        </div>
      </div>
    </section>
  );
}
