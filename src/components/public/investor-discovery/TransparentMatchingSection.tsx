'use client';

import { Target, CheckCircle2, AlertTriangle, ArrowRight, Sparkles } from 'lucide-react';

export default function TransparentMatchingSection() {
  const factors = ['SECTOR', 'STAGE', 'GEOGRAPHY', 'TICKET', 'STRUCTURE'];

  return (
    <section
      id="section-03-transparent-matching"
      className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[rgba(0,0,0,0.06)] flex justify-center"
    >
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            TRANSPARENT MATCHING
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            A match score without a reason
            <br />
            is not enough.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Mondial should show the investment criteria behind relevance so Investors can understand what aligns — and what does not.
          </p>
        </div>

        {/* 3-Column Matching Logic Grid (Thesis + Factors + Opportunity) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left: Investor Thesis (4 cols) */}
          <div className="lg:col-span-4 p-6 sm:p-8 rounded-[28px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold text-[#3C61DD] uppercase block">
                INVESTOR THESIS
              </span>
              <h3 className="font-heading font-bold text-[18px] text-[#1A1B23] mt-1">
                Horizon Capital
              </h3>

              <div className="space-y-1.5 pt-3 text-[12px] text-[#444654]">
                <div><strong>Sector:</strong> B2B SaaS</div>
                <div><strong>Stage:</strong> Seed / Early Rev</div>
                <div><strong>Geo:</strong> France / EU</div>
                <div><strong>Ticket:</strong> €250K–€1M</div>
                <div><strong>Deal Pref:</strong> Equity / SAFE</div>
              </div>
            </div>
            <div className="text-[10px] text-[#747685]">Defined Mandate</div>
          </div>

          {/* Center: Fit Factors (4 cols) */}
          <div className="lg:col-span-4 p-6 sm:p-8 rounded-[28px] bg-white border-2 border-[#3C61DD] shadow-md flex flex-col justify-between gap-4 text-center">
            <span className="text-[10px] font-bold text-[#747685] uppercase tracking-wider">
              FIT EXPLANATION FACTORS
            </span>

            <div className="space-y-2">
              {factors.map((f) => (
                <div
                  key={f}
                  className="p-2.5 rounded-[10px] bg-[#FAF8FF] border border-[#E2E1EC] text-[12px] font-bold text-[#1A1B23]"
                >
                  ✔ {f} ALIGNED
                </div>
              ))}
            </div>

            <div className="p-2.5 rounded-[10px] bg-[#E8F8EE] text-[#157A55] text-[12px] font-bold">
              STRONG FIT • 94% Internal Signal
              <span className="text-[9px] font-normal block text-[#747685] mt-0.5">
                (Public Illustrative Demo)
              </span>
            </div>
          </div>

          {/* Right: Opportunity Profile (4 cols) */}
          <div className="lg:col-span-4 p-6 sm:p-8 rounded-[28px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold text-[#157A55] uppercase block">
                OPPORTUNITY PROFILE
              </span>
              <h3 className="font-heading font-bold text-[18px] text-[#1A1B23] mt-1">
                NOVA SPACE SAS
              </h3>

              <div className="space-y-1.5 pt-3 text-[12px] text-[#444654]">
                <div><strong>Sector:</strong> B2B SaaS</div>
                <div><strong>Stage:</strong> Seed</div>
                <div><strong>Country:</strong> France</div>
                <div><strong>Round:</strong> €700K</div>
                <div><strong>Structure:</strong> Equity</div>
              </div>
            </div>
            <div className="text-[10px] text-[#747685]">Matched Target</div>
          </div>
        </div>

        {/* Partial Match Example */}
        <div className="p-5 rounded-[20px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-2xs flex flex-wrap items-center justify-between gap-3 text-[12px]">
          <div>
            <strong className="text-[#1A1B23] mr-2">PARTIAL MATCH EXAMPLE:</strong>
            <span className="text-[#444654]">
              Sector ✓ • Stage ✓ — but Ticket/Geography outside primary mandate
            </span>
          </div>
          <span className="px-2.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
            PARTIAL FIT
          </span>
        </div>

        {/* Editorial Statement & Disclaimers */}
        <div className="p-6 sm:p-7 rounded-[20px] bg-[#FAF8FF] border border-[#E2E1EC] text-center shadow-xs flex flex-col gap-3">
          <h3 className="font-heading font-extrabold text-[15px] sm:text-[18px] text-[#070707] uppercase tracking-wide">
            AI CAN HELP FIND THE PATTERN.
            <br />
            THE INVESTOR SHOULD STILL BE ABLE TO SEE THE REASON.
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] font-bold text-[#747685]">
            <span>MATCHING = CRITERIA + CONTEXT + EXPLANATION</span>
            <span>•</span>
            <span className="text-[#BA1A1A]">MATCH ≠ INVESTMENT RECOMMENDATION</span>
          </div>
        </div>
      </div>
    </section>
  );
}
