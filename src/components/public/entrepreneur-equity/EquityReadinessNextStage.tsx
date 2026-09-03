'use client';

import Link from 'next/link';
import { ArrowRight, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function EquityReadinessNextStage() {
  const journey = [
    { num: '01', title: 'Company & Verification', status: 'complete' },
    { num: '02', title: 'Build & Execute', status: 'complete' },
    { num: '03', title: 'Equity & Readiness', status: 'current' },
    { num: '04', title: 'Funding & Deals', status: 'next' },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white flex justify-center">
      <div className="w-full max-w-[1240px] bg-[#FAF8FF] border border-[#E2E1EC] rounded-[28px] overflow-hidden shadow-xl grid grid-cols-1 lg:grid-cols-12 items-stretch">
        {/* Left: Journey Progression (4 cols) */}
        <div className="lg:col-span-4 bg-[#F3F2FD] p-6 sm:p-8 flex flex-col justify-between gap-6 border-b lg:border-b-0 lg:border-r border-[#E2E1EC]">
          <div className="flex flex-col gap-4">
            <span className="text-[10px] font-bold text-[#747685] uppercase tracking-wider">
              ENTREPRENEUR PAGE 03 — EQUITY &amp; READINESS
            </span>

            <h3 className="font-heading font-bold text-[20px] text-[#1A1B23]">
              Readiness Progression
            </h3>

            <div className="flex flex-col gap-3 pt-2 text-[12px]">
              {journey.map((j) => (
                <div
                  key={j.num}
                  className={`p-3 rounded-[12px] flex items-center justify-between transition-colors ${
                    j.status === 'current'
                      ? 'bg-white border border-[#3C61DD]/30 text-[#3C61DD] font-bold shadow-2xs'
                      : j.status === 'complete'
                      ? 'bg-white/50 text-[#157A55]'
                      : 'bg-transparent text-[#747685]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-[11px] opacity-70">{j.num}</span>
                    <span>{j.title}</span>
                  </div>
                  {j.status === 'complete' && <CheckCircle2 size={13} className="text-[#157A55]" />}
                  {j.status === 'current' && (
                    <span className="w-2 h-2 rounded-full bg-[#3C61DD]" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <span className="text-[10px] text-[#8A8B8F] uppercase font-bold">
            STAGE TRANSITION ARCHITECTURE
          </span>
        </div>

        {/* Right: Final CTA (8 cols) */}
        <div className="lg:col-span-8 p-6 sm:p-10 flex flex-col justify-between gap-8 bg-white">
          <div className="flex flex-col gap-3">
            <span className="text-[11px] font-bold text-[#3C61DD] uppercase tracking-wider">
              NEXT — FUNDING &amp; DEALS
            </span>
            <h2 className="text-[28px] sm:text-[36px] font-heading font-extrabold text-[#1A1B23] leading-[1.15]">
              The company is structured.
              <br />
              Now enter the investor process.
            </h2>
            <p className="text-[15px] text-[#444654] leading-relaxed max-w-[640px]">
              Prepare your Data Room access, define your negotiation parameters, and begin active outreach to verified investors.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/for-entrepreneurs/funding-deals"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#3C61DD] hover:bg-[#3252BF] text-white font-medium text-[15px] rounded-[10px] transition-all shadow-sm group"
              >
                <span>Continue to Funding &amp; Deals</span>
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                href="/for-entrepreneurs"
                className="inline-flex items-center gap-2 px-5 py-3.5 bg-white hover:bg-[#FAF8FF] border border-[#E2E1EC] text-[#1A47C3] font-medium text-[15px] rounded-[10px] transition-colors shadow-xs"
              >
                <RefreshCw size={15} />
                <span>Back to Entrepreneur Journey</span>
              </Link>
            </div>

            <div className="text-[11px] text-[#747685] font-bold tracking-wider uppercase pt-2">
              NEXT: FUNDING &amp; DEALS →
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
