'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export default function InvestorDiligenceNextStage() {
  const journeyTimeline = [
    { num: '01', status: 'COMPLETE', title: 'Investor Profile & Thesis', isComplete: true, isCurrent: false },
    { num: '02', status: 'COMPLETE', title: 'Discover & Match', isComplete: true, isCurrent: false },
    { num: '03', status: 'CURRENT', title: 'Diligence & Invest', isComplete: false, isCurrent: true },
    { num: '04', status: 'NEXT', title: 'Pipeline & Portfolio', isComplete: false, isCurrent: false },
  ];

  const linearFlow = [
    'NEW MATCH',
    'REVIEW',
    'NDA',
    'DATA ROOM',
    'TERM SHEET',
    'NEGOTIATION',
    'DECISION',
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#F1F1F2]/60 border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Next Stage Preview Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left: Journey Timeline (4 cols) */}
          <div className="lg:col-span-4 p-6 sm:p-8 rounded-[28px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-6">
            <div>
              <span className="text-[10px] font-bold text-[#747685] uppercase tracking-wider block">
                INVESTOR JOURNEY
              </span>
              <h3 className="font-heading font-bold text-[18px] text-[#1A1B23] mt-1">
                4-Stage Investment Framework
              </h3>

              <div className="space-y-3 pt-4">
                {journeyTimeline.map((item) => (
                  <div
                    key={item.num}
                    className={`p-3 rounded-[12px] border flex items-center justify-between text-[12px] font-bold ${
                      item.isCurrent
                        ? 'bg-[#F3F2FD] border-[#3C61DD] text-[#3C61DD]'
                        : item.isComplete
                        ? 'bg-[#E8F8EE] border-[#157A55]/30 text-[#157A55]'
                        : 'bg-[#FAF8FF] border-[#E2E1EC] text-[#1A1B23]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] opacity-70">{item.num}</span>
                      <span>{item.title}</span>
                    </div>
                    {item.status && (
                      <span className="text-[9px] px-2 py-0.5 rounded bg-white font-extrabold uppercase">
                        {item.status}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <p className="text-[11px] text-[#747685]">Step 03 active. Transitioning to portfolio management.</p>
          </div>

          {/* Right: Next Stage Details (8 cols) */}
          <div className="lg:col-span-8 p-6 sm:p-10 rounded-[28px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-6">
            <div className="flex flex-col gap-4">
              <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
                NEXT STAGE ➔ PIPELINE &amp; PORTFOLIO
              </span>
              <h2 className="text-[28px] sm:text-[38px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
                The decision does not disappear
                <br />
                when the deal moves forward.
              </h2>
              <p className="text-[15px] sm:text-[16px] text-[#444654] leading-[1.6]">
                Keep every active opportunity connected to its decision history, ensuring seamless transition from negotiation to ongoing portfolio management.
              </p>

              {/* Linear Flow */}
              <div className="flex flex-wrap items-center gap-2 p-3.5 rounded-[14px] bg-[#FAF8FF] border border-[#E2E1EC] text-[11px] font-bold text-[#1A1B23] mt-2">
                {linearFlow.map((st, idx) => (
                  <span key={st} className="flex items-center gap-2">
                    <span>{st}</span>
                    {idx < linearFlow.length - 1 && <span className="text-[#3C61DD]">➔</span>}
                  </span>
                ))}
              </div>

              {/* Split Outcomes Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-[12px] bg-white border border-[#E2E1EC] text-[11px]">
                  <strong className="text-[#BA1A1A] block">NOT INVESTED</strong>
                  <span className="text-[#747685]">➔ Closed / Lost</span>
                </div>
                <div className="p-3 rounded-[12px] bg-white border border-[#E2E1EC] text-[11px]">
                  <strong className="text-[#157A55] block">INVESTED</strong>
                  <span className="text-[#747685]">➔ Portfolio ➔ Ownership ➔ Updates ➔ Relationship</span>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-[rgba(0,0,0,0.06)]">
              <Link
                href="/for-investors/pipeline-portfolio"
                className="px-6 py-3.5 bg-[#3C61DD] hover:bg-[#3252BF] text-white font-semibold text-[14px] rounded-[10px] transition-all shadow-sm inline-flex items-center gap-2 group"
              >
                <span>Continue to Pipeline &amp; Portfolio</span>
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
              </Link>

              <Link
                href="/for-investors"
                className="px-5 py-3.5 bg-white hover:bg-[#FAF8FF] border border-[#E2E1EC] text-[#1A1B23] font-semibold text-[14px] rounded-[10px] transition-colors"
              >
                Back to Investor Journey
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Metadata */}
        <div className="w-full flex flex-wrap items-center justify-between text-[12px] text-[#747685] pt-4 border-t border-[rgba(0,0,0,0.06)]">
          <span>INVESTOR PAGE 03 — DILIGENCE &amp; INVEST</span>
          <Link
            href="/for-investors/pipeline-portfolio"
            className="font-bold text-[#3C61DD] hover:underline inline-flex items-center gap-1"
          >
            <span>NEXT PIPELINE &amp; PORTFOLIO</span>
            <span>➔</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
