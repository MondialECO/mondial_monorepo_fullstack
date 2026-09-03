'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export default function CompleteInvestorJourney() {
  const cards = [
    {
      num: '1',
      title: 'INVESTOR PROFILE & THESIS',
      desc: 'Verify identity and financial context. Define how you invest.',
      href: '/for-investors',
      highlight: false,
    },
    {
      num: '2',
      title: 'DISCOVER & MATCH',
      desc: 'Find relevant companies. Understand why they may fit.',
      href: '/for-investors/discover-match',
      highlight: false,
    },
    {
      num: '3',
      title: 'DILIGENCE & INVEST',
      desc: 'Review the evidence. Structure the terms. Make the decision.',
      href: '/for-investors/diligence-invest',
      highlight: false,
    },
    {
      num: '4',
      title: 'PIPELINE & PORTFOLIO',
      desc: 'Track active opportunities. Stay connected after investment.',
      href: '/for-investors/pipeline-portfolio',
      highlight: true,
    },
  ];

  return (
    <section
      id="complete-journey"
      className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[rgba(0,0,0,0.06)] flex justify-center scroll-mt-12"
    >
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            THE MONDIAL INVESTOR PATH
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            From investment logic to
            <br />
            long-term context.
          </h2>
        </div>

        {/* 4 Journey Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((c) => (
            <div
              key={c.num}
              className={`p-6 sm:p-7 rounded-[26px] flex flex-col justify-between gap-6 transition-all ${
                c.highlight
                  ? 'bg-[#FAF8FF] border-2 border-[#3C61DD] shadow-sm relative overflow-hidden'
                  : 'bg-white border border-[#E2E1EC] shadow-2xs hover:shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-heading font-bold text-[13px] ${
                      c.highlight
                        ? 'bg-[#3C61DD] text-white'
                        : 'bg-[#FAF8FF] border border-[#E2E1EC] text-[#1A1B23]'
                    }`}
                  >
                    {c.num}
                  </span>
                  {c.highlight && (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#EBF0FF] text-[#1A47C3] font-bold text-[9px] uppercase tracking-wider">
                      CURRENT STAGE
                    </span>
                  )}
                </div>

                <h3 className="font-heading font-bold text-[16px] text-[#1A1B23] mt-4">
                  {c.title}
                </h3>
                <p className="text-[12px] text-[#444654] mt-2 leading-relaxed">
                  {c.desc}
                </p>
              </div>

              <Link
                href={c.href}
                className="text-[12px] font-bold text-[#3C61DD] hover:underline inline-flex items-center gap-1 group"
              >
                <span>Explore Phase</span>
                <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          ))}
        </div>

        {/* Final Investor Statement & CTAs */}
        <div className="p-6 sm:p-10 rounded-[28px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-xs flex flex-col items-center text-center gap-6">
          <h3 className="font-heading font-extrabold text-[15px] sm:text-[18px] text-[#070707] uppercase tracking-wide max-w-[880px] leading-relaxed">
            DEFINE WHAT YOU BACK. UNDERSTAND WHY IT FITS. TEST THE EVIDENCE. MAKE THE DECISION. STAY CONNECTED AFTER IT.
          </h3>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/signup"
              className="px-7 py-3.5 bg-[#3C61DD] hover:bg-[#3252BF] text-white font-semibold text-[14px] rounded-[10px] transition-all shadow-sm inline-flex items-center gap-2 group"
            >
              <span>Start as an Investor</span>
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
            </Link>

            <Link
              href="/for-investors"
              className="px-6 py-3.5 bg-white hover:bg-[#FAF8FF] border border-[#E2E1EC] text-[#1A1B23] font-semibold text-[14px] rounded-[10px] transition-colors"
            >
              Explore Investor Profile &amp; Thesis
            </Link>
          </div>
        </div>

        {/* Bottom Metadata */}
        <div className="w-full flex flex-wrap items-center justify-between text-[12px] text-[#747685] pt-4 border-t border-[rgba(0,0,0,0.06)]">
          <span>Investor Page 04 — Pipeline &amp; Portfolio</span>
          <span className="font-bold text-[#157A55]">
            INVESTOR JOURNEY 01 → 02 → 03 → 04 COMPLETE
          </span>
        </div>
      </div>
    </section>
  );
}
