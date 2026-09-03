'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, ChevronRight, PieChart, Sparkles, Building2 } from 'lucide-react';

export default function EquityReadinessHero() {
  return (
    <section className="w-full pt-28 pb-16 sm:pt-36 sm:pb-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#F3F2FD]/50 via-white to-white flex justify-center border-b border-[rgba(0,0,0,0.06)]">
      <div className="w-full max-w-[1280px] grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
        {/* Left Column: Editorial & Context (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-8">
          <div className="flex flex-col gap-5">
            {/* Eyebrow */}
            <span className="text-[12px] font-bold text-[#747685] uppercase tracking-wider">
              MONDIAL ECO — ENTREPRENEURS — EQUITY &amp; READINESS
            </span>

            {/* Headline */}
            <h1 className="text-[40px] sm:text-[54px] lg:text-[60px] font-heading font-extrabold text-[#1A1B23] leading-[1.08] tracking-[-1.28px]">
              Structure
              <br />
              ownership.
              <br />
              Prepare for
              <br />
              <span className="text-[#3C61DD]">what comes next.</span>
            </h1>

            {/* Supporting Copy */}
            <p className="text-[16px] sm:text-[18px] text-[#444654] leading-[1.6]">
              Mondial helps Entrepreneurs connect company ownership, dilution, valuation context, funding needs and execution evidence before entering the investor process.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/signup"
                className="px-5 py-3 bg-[#3C61DD] hover:bg-[#3252BF] text-white font-semibold text-[13px] rounded-[10px] transition-all shadow-sm inline-flex items-center gap-2 group"
              >
                <span>Explore Equity &amp; Readiness</span>
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
              </Link>

              <a
                href="#section-02-ownership-clarity"
                className="px-5 py-3 bg-[#FAF8FF] hover:bg-[#F3F2FD] border border-[#E2E1EC] text-[#1A1B23] font-semibold text-[13px] rounded-[10px] transition-colors"
              >
                See the Readiness Journey
              </a>
            </div>
          </div>

          {/* Editorial Statement */}
          <div className="p-5 rounded-[16px] bg-[#FAF8FF] border border-[#E2E1EC]">
            <h3 className="font-heading font-bold text-[17px] sm:text-[19px] text-[#1A1B23] leading-snug">
              Raising capital changes more than cash. It can change ownership, control and expectations.
            </h3>
          </div>

          {/* Compact 4-Stage Journey Tracker */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
            <div className="px-3 py-1.5 rounded-[8px] bg-[#FAF8FF] border border-[#E2E1EC] text-[#1A1B23] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#005F40]" />
              <span>01 COMPANY</span>
            </div>
            <div className="px-3 py-1.5 rounded-[8px] bg-[#FAF8FF] border border-[#E2E1EC] text-[#1A1B23] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#005F40]" />
              <span>02 BUILD</span>
            </div>
            <div className="px-3 py-1.5 rounded-[8px] bg-[#3C61DD] text-white flex items-center gap-1.5 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              <span>03 EQUITY</span>
            </div>
            <div className="px-3 py-1.5 rounded-[8px] bg-[#FAF8FF] border border-[#E2E1EC] text-[#747685] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C4C5D6]" />
              <span>04 FUNDING</span>
            </div>
          </div>
        </div>

        {/* Right Column: Visual Diagram (7 cols) */}
        <div className="lg:col-span-7 bg-[#F3F2FD] border border-[#E2E1EC] rounded-[24px] p-6 sm:p-8 flex flex-col gap-6 shadow-xs">
          {/* Label */}
          <div className="flex items-center justify-between pb-2 border-b border-[rgba(0,0,0,0.06)]">
            <span className="text-[11px] font-bold text-[#747685] uppercase tracking-wider">
              ILLUSTRATIVE EXAMPLE
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-white text-[#3C61DD] text-[10px] font-bold uppercase">
              CAP TABLE SIMULATION
            </span>
          </div>

          {/* Today State */}
          <div className="bg-white border border-[#E2E1EC] rounded-[18px] p-5 flex flex-col gap-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <h4 className="font-heading font-extrabold text-[17px] text-[#1A1B23]">
                NOVA SPACE SAS
              </h4>
              <span className="px-2 py-0.5 rounded bg-[#FAF8FF] border border-[#E2E1EC] text-[#747685] text-[10px] font-bold uppercase">
                TODAY
              </span>
            </div>

            {/* Segmented Bar */}
            <div className="w-full h-8 rounded-[8px] overflow-hidden flex font-mono text-[11px] font-bold text-white">
              <div
                style={{ width: '80%' }}
                className="bg-[#2C53CF] flex items-center justify-center"
              >
                80%
              </div>
              <div
                style={{ width: '10%' }}
                className="bg-[#005F40] flex items-center justify-center border-l border-white/20"
              >
                10%
              </div>
              <div
                style={{ width: '10%' }}
                className="bg-[#875301] flex items-center justify-center border-l border-white/20"
              >
                10%
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-3 text-[12px] text-[#444654]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#2C53CF]" />
                <span className="font-medium">Founder Henry Martin (80%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#005F40]" />
                <span className="font-medium">Option Pool (10%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#875301]" />
                <span className="font-medium">Early Contributor (10%)</span>
              </div>
            </div>
          </div>

          {/* Transition Box: Future Funding Round */}
          <div className="flex items-center justify-between p-4 rounded-[16px] bg-white border border-[#3C61DD]/30 shadow-xs">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-[#747685] uppercase">
                FUTURE FUNDING ROUND
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-[22px] font-heading font-extrabold text-[#1A1B23]">
                  €500K
                </span>
                <span className="text-[13px] text-[#444654]">New Investment</span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#3C61DD] text-white flex items-center justify-center font-bold">
              ➔
            </div>
          </div>

          {/* Future State: Post-Round */}
          <div className="bg-white border border-[#E2E1EC] rounded-[18px] p-5 flex flex-col gap-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="font-heading font-extrabold text-[15px] text-[#1A1B23]">
                OWNERSHIP CHANGES
              </span>
              <span className="px-2.5 py-0.5 rounded bg-[#DCE1FF] text-[#3C61DD] text-[10px] font-bold uppercase">
                POST-ROUND
              </span>
            </div>

            {/* Segmented Bar */}
            <div className="w-full h-8 rounded-[8px] overflow-hidden flex font-mono text-[11px] font-bold text-white">
              <div
                style={{ width: '64%' }}
                className="bg-[#2C53CF] flex items-center justify-center"
              >
                64%
              </div>
              <div
                style={{ width: '8%' }}
                className="bg-[#005F40] flex items-center justify-center border-l border-white/20"
              >
                8%
              </div>
              <div
                style={{ width: '8%' }}
                className="bg-[#875301] flex items-center justify-center border-l border-white/20"
              >
                8%
              </div>
              <div
                style={{ width: '20%' }}
                className="bg-[#3C61DD] flex items-center justify-center border-l border-white/20"
              >
                20% NEW
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#444654]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#2C53CF]" />
                <span>Founder (64%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#005F40]" />
                <span>Option Pool (8%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#875301]" />
                <span>Contributor (8%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#3C61DD]" />
                <span className="font-bold text-[#3C61DD]">New Investor (20%)</span>
              </div>
            </div>
          </div>

          {/* Readiness Connection Equation */}
          <div className="p-4 rounded-[16px] bg-white border border-[#E2E1EC] flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold">
              <div className="flex items-center gap-1.5 text-[#1A1B23]">
                <span>OWNERSHIP</span>
                <span className="text-[#3C61DD]">+</span>
                <span>EXECUTION EVIDENCE</span>
                <span className="text-[#3C61DD]">+</span>
                <span>FUNDING NEED</span>
                <span className="text-[#3C61DD]">➔</span>
                <span className="text-[#005F40]">INVESTOR READINESS</span>
              </div>
            </div>
            <div className="pt-2 border-t border-[rgba(0,0,0,0.06)] flex items-center justify-between text-[11px]">
              <span className="text-[#747685] font-bold uppercase">NEXT DESTINATION:</span>
              <span className="text-[#3C61DD] font-semibold">Funding &amp; Deals</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
