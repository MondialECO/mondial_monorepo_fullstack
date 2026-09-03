'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export default function InvestorDiscoveryNextStage() {
  const journeyTimeline = [
    { num: '01', status: 'COMPLETE', title: 'Profile & Thesis', isComplete: true, isCurrent: false },
    { num: '02', status: 'CURRENT', title: 'Discover & Match', isComplete: false, isCurrent: true },
    { num: '03', status: 'NEXT', title: 'Diligence & Invest', isComplete: false, isCurrent: false },
    { num: '04', status: 'FUTURE', title: 'Pipeline & Portfolio', isComplete: false, isCurrent: false },
  ];

  const nextFlow = [
    'MATCH',
    'MUTUAL INTEREST',
    'REQUEST ACCESS',
    'NDA WHEN RELEVANT',
    'DATA ROOM',
    'DILIGENCE',
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

            <p className="text-[11px] text-[#747685]">Step 02 active. Transitioning to diligence.</p>
          </div>

          {/* Right: Next Stage Details (8 cols) */}
          <div className="lg:col-span-8 p-6 sm:p-10 rounded-[28px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-6">
            <div className="flex flex-col gap-4">
              <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
                NEXT ➔ DILIGENCE &amp; INVEST
              </span>
              <h2 className="text-[28px] sm:text-[38px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
                The opportunity looks relevant.
                <br />
                Now test the company against the evidence.
              </h2>
              <p className="text-[15px] sm:text-[16px] text-[#444654] leading-[1.6]">
                Move from mutual interest into controlled information access, Data Room review, diligence questions, proposed investment terms and negotiation.
              </p>

              {/* Next-Stage Flow */}
              <div className="flex flex-wrap items-center gap-2 p-3.5 rounded-[14px] bg-[#FAF8FF] border border-[#E2E1EC] text-[11px] font-bold text-[#1A1B23] mt-2">
                {nextFlow.map((st, idx) => (
                  <span key={st} className="flex items-center gap-2">
                    <span>{st}</span>
                    {idx < nextFlow.length - 1 && <span className="text-[#3C61DD]">➔</span>}
                  </span>
                ))}
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-[rgba(0,0,0,0.06)]">
              <Link
                href="/for-investors/diligence-invest"
                className="px-6 py-3.5 bg-[#3C61DD] hover:bg-[#3252BF] text-white font-semibold text-[14px] rounded-[10px] transition-all shadow-sm inline-flex items-center gap-2 group"
              >
                <span>Continue to Diligence &amp; Invest</span>
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
          <span>Investor Page 02 — Discover &amp; Match</span>
          <Link
            href="/for-investors/diligence-invest"
            className="font-bold text-[#3C61DD] hover:underline inline-flex items-center gap-1"
          >
            <span>NEXT DILIGENCE &amp; INVEST</span>
            <span>➔</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
