'use client';

import { Users, CheckCircle2, XCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export default function TwoSidedFitSection() {
  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#747685] uppercase tracking-wider">
            TWO-SIDED FIT
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            The Investor can be interested.
            <br />
            The Founder still has a choice.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Mondial should treat investment discovery as a two-sided relationship rather than automatic access from capital to company information.
          </p>
        </div>

        {/* 3-Column Two-Sided Fit Grid (Investor View + Mondial Engine + Entrepreneur View) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left: Investor View (5 cols) */}
          <div className="lg:col-span-5 p-6 sm:p-8 rounded-[28px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-5">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(0,0,0,0.06)]">
                <span className="text-[10px] font-bold text-[#3C61DD] uppercase">
                  INVESTOR PERSPECTIVE
                </span>
                <span className="px-2 py-0.5 rounded bg-[#E8F8EE] text-[#157A55] text-[10px] font-bold">
                  92% Match (Illustrative)
                </span>
              </div>

              <h3 className="font-heading font-bold text-[18px] text-[#1A1B23] mt-3">
                Nova Space SAS
              </h3>
              <p className="text-[12px] text-[#444654] mt-1">
                Aerospace infrastructure and sustainable launch systems.
              </p>

              <div className="space-y-1.5 pt-3 text-[12px]">
                <div><strong>Funding Need:</strong> Series A (€15M)</div>
                <div><strong>Fit:</strong> Deep Tech, ESG</div>
              </div>
            </div>

            <button
              type="button"
              className="w-full py-2.5 rounded-[10px] bg-[#3C61DD] text-white text-[12px] font-bold hover:bg-[#3252BF] transition-colors"
            >
              SHOW INTEREST
            </button>
          </div>

          {/* Center: Mutual Fit Engine (2 cols) */}
          <div className="lg:col-span-2 p-4 rounded-[20px] bg-[#FAF8FF] border border-[#E2E1EC] flex flex-col items-center justify-center text-center gap-2">
            <span className="text-[10px] font-bold text-[#747685] uppercase">MONDIAL ENGINE</span>
            <div className="w-8 h-8 rounded-full bg-white border border-[#E2E1EC] flex items-center justify-center text-[#3C61DD] font-bold text-[14px]">
              ⇄
            </div>
            <span className="text-[11px] font-bold text-[#1A1B23]">Mutual Fit Context</span>
          </div>

          {/* Right: Entrepreneur View (5 cols) */}
          <div className="lg:col-span-5 p-6 sm:p-8 rounded-[28px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-5">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(0,0,0,0.06)]">
                <span className="text-[10px] font-bold text-[#157A55] uppercase">
                  ENTREPRENEUR PERSPECTIVE
                </span>
                <span className="px-2 py-0.5 rounded bg-[#F3F2FD] text-[#1A47C3] text-[10px] font-bold">
                  Interested Investor
                </span>
              </div>

              <h3 className="font-heading font-bold text-[18px] text-[#1A1B23] mt-3">
                Horizon Capital
              </h3>
              <p className="text-[12px] text-[#444654] mt-1">
                Institutional Series A/B deep tech ventures with sustainable infrastructure impact.
              </p>

              <div className="space-y-1.5 pt-3 text-[12px]">
                <div><strong>Ticket Range:</strong> €5M - €20M</div>
                <div><strong>Relevant Focus:</strong> Aerospace Tech</div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                className="flex-1 py-2 rounded-[10px] bg-white border border-[#E2E1EC] text-[#BA1A1A] text-[12px] font-bold hover:bg-red-50 transition-colors"
              >
                DECLINE
              </button>
              <button
                type="button"
                className="flex-1 py-2 rounded-[10px] bg-[#157A55] text-white text-[12px] font-bold hover:bg-[#116345] transition-colors"
              >
                ACCEPT INTEREST
              </button>
            </div>
          </div>
        </div>

        {/* Core Principles & Equations */}
        <div className="p-6 sm:p-8 rounded-[24px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-xs flex flex-col items-center text-center gap-4">
          <h3 className="font-heading font-extrabold text-[15px] sm:text-[18px] text-[#070707] uppercase tracking-wide">
            &ldquo;CAPITAL DOES NOT AUTOMATICALLY CREATE ACCESS.&rdquo;
          </h3>

          <div className="flex flex-wrap items-center justify-center gap-3 text-[12px] font-bold text-[#1A1B23]">
            <span className="text-[#BA1A1A]">MATCH ≠ INTRODUCTION</span>
            <span>•</span>
            <span>MATCH ➔ INTEREST ➔ MUTUAL CONNECTION</span>
          </div>
        </div>
      </div>
    </section>
  );
}
