'use client';

import Link from 'next/link';
import { CheckCircle2, ArrowRight, RefreshCw, DollarSign, Award, Star, TrendingUp, Sparkles, ShieldCheck } from 'lucide-react';

export default function ProviderEarningsHero() {
  const journeyNav = [
    { num: '01', title: 'Verify', isComplete: true, isCurrent: false },
    { num: '02', title: 'Services', isComplete: true, isCurrent: false },
    { num: '03', title: 'Projects', isComplete: true, isCurrent: false },
    { num: '04', title: 'Earnings & Growth', isComplete: false, isCurrent: true },
  ];

  const loopNodes = [
    { label: 'APPROVED DELIVERY' },
    { label: 'PAYMENT RELEASED' },
    { label: 'PROVIDER EARNINGS' },
    { label: 'CLIENT REVIEW' },
    { label: 'MONDIAL SCORE' },
    { label: 'TIER PROGRESS' },
    { label: 'STRONGER VISIBILITY' },
    { label: 'NEW OPPORTUNITY' },
  ];

  const bottomSteps = [
    '01 DELIVER',
    '02 EARN',
    '03 REVIEW',
    '04 BUILD REPUTATION',
    '05 GROW',
    '06 MATCH AGAIN',
  ];

  return (
    <section className="w-full pt-28 pb-16 sm:pt-36 sm:pb-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#F3F2FD]/50 via-white to-white flex justify-center border-b border-[rgba(0,0,0,0.06)]">
      <div className="w-full max-w-[1280px] flex flex-col gap-12 sm:gap-16">
        {/* Journey Tracker Bar */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 p-3 rounded-full bg-white border border-[#E2E1EC] shadow-2xs max-w-fit mx-auto text-[11px] sm:text-[12px]">
          {journeyNav.map((step, idx) => (
            <div key={step.num} className="flex items-center gap-2">
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-bold transition-all ${
                  step.isCurrent
                    ? 'bg-[#3C61DD] text-white shadow-xs'
                    : 'bg-[#E8F8EE] text-[#157A55]'
                }`}
              >
                {step.isComplete ? (
                  <CheckCircle2 size={13} className="text-[#157A55]" />
                ) : (
                  <span>{step.num}</span>
                )}
                <span>{step.title}</span>
              </div>
              {idx < journeyNav.length - 1 && <span className="text-[#C4C5D6]">➔</span>}
            </div>
          ))}
        </div>

        {/* Narrative Header & Hero Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column (6 cols) */}
          <div className="lg:col-span-6 flex flex-col gap-5">
            {/* Eyebrow */}
            <div className="flex items-center gap-2">
              <span className="w-6 h-[2px] bg-[#3C61DD]" />
              <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
                SERVICE PROVIDERS — EARNINGS &amp; GROWTH
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-[40px] sm:text-[50px] lg:text-[56px] font-heading font-extrabold text-[#1A1B23] leading-[1.1] tracking-[-1.1px]">
              Turn good delivery into
              <br />
              <span className="text-[#3C61DD] relative inline-block">
                future opportunity.
                <svg
                  className="absolute left-0 -bottom-2 w-full h-[6px] text-[#3C61DD]"
                  viewBox="0 0 300 6"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1 4.5C50 1.5 150 1.5 299 4.5"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>

            {/* Description */}
            <p className="text-[16px] sm:text-[17px] text-[#444654] leading-[1.6]">
              Understand what you earn, how you get paid and how completed work can strengthen reputation, visibility and future Provider opportunities across Mondial.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/signup"
                className="px-6 py-3.5 bg-[#3C61DD] hover:bg-[#3252BF] text-white font-semibold text-[14px] rounded-[10px] transition-all shadow-sm inline-flex items-center gap-2 group"
              >
                <span>Explore Earnings &amp; Growth</span>
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
              </Link>

              <a
                href="#section-02-payment-journey"
                className="px-5 py-3.5 bg-white hover:bg-[#FAF8FF] border border-[#E2E1EC] text-[#1A1B23] font-semibold text-[14px] rounded-[10px] transition-colors inline-flex items-center gap-2"
              >
                <span>See the Growth Loop</span>
                <span>➔</span>
              </a>
            </div>

            {/* Illustrative Hero Calculation Card */}
            <div className="p-5 rounded-[22px] bg-white border border-[#E2E1EC] shadow-2xs flex flex-col gap-3 mt-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#747685] uppercase">
                  ILLUSTRATIVE EXAMPLE
                </span>
                <span className="px-2.5 py-0.5 rounded bg-[#F3F2FD] text-[#1A47C3] text-[10px] font-bold">
                  Tier 3 Provider
                </span>
              </div>

              <div className="flex items-center justify-between text-[13px] pt-1">
                <span className="text-[#444654]">PROJECT VALUE:</span>
                <span className="font-heading font-extrabold text-[#1A1B23] text-[15px]">$1,000</span>
              </div>

              <div className="flex items-center justify-between text-[13px] text-[#BA1A1A]">
                <span>PLATFORM COMMISSION (8%):</span>
                <span className="font-bold">-$80</span>
              </div>

              <div className="flex items-center justify-between text-[14px] pt-2 border-t border-[rgba(0,0,0,0.06)] text-[#157A55] font-bold">
                <span>PROVIDER AMOUNT:</span>
                <span className="text-[18px] font-heading font-extrabold">$920</span>
              </div>
            </div>
          </div>

          {/* Right Column: Provider Growth Loop Radial/Card (6 cols) */}
          <div className="lg:col-span-6 p-6 sm:p-8 rounded-[28px] bg-white border border-[#E2E1EC] shadow-sm flex flex-col items-center justify-center gap-6 text-center">
            <div className="w-20 h-20 rounded-full bg-[#F3F2FD] border-2 border-[#3C61DD] flex items-center justify-center text-[#1A47C3] font-heading font-extrabold text-[12px] p-2 leading-tight">
              PROVIDER GROWTH LOOP
            </div>

            {/* Loop Sequence Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full">
              {loopNodes.map((node, idx) => (
                <div
                  key={node.label}
                  className="p-3 rounded-[12px] bg-[#FAF8FF] border border-[#E2E1EC] flex flex-col items-center justify-center text-center gap-1"
                >
                  <span className="text-[9px] font-bold text-[#3C61DD]">0{idx + 1}</span>
                  <span className="text-[10px] font-bold text-[#1A1B23] leading-snug">
                    {node.label}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-[#747685]">
              Continuous cycle linking verified performance to reputation compounding
            </p>
          </div>
        </div>

        {/* Hero Editorial Statement */}
        <div className="p-6 sm:p-8 rounded-[20px] bg-white border border-[#E2E1EC] text-center shadow-xs flex flex-col gap-1.5">
          <h3 className="font-heading font-extrabold text-[15px] sm:text-[18px] text-[#070707] uppercase tracking-wide">
            THE VALUE OF A PROJECT DOES NOT END WHEN THE PAYMENT CLEARS.
            <br />
            GOOD DELIVERY CAN STRENGTHEN THE NEXT OPPORTUNITY.
          </h3>
        </div>

        {/* Bottom Hero Sequence */}
        <div className="p-4 sm:p-5 rounded-[20px] bg-white border border-[#E2E1EC] shadow-2xs flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-[11px] sm:text-[12px] font-bold text-[#1A1B23]">
          {bottomSteps.map((st, idx) => (
            <span key={st} className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-[8px] bg-[#FAF8FF] border border-[#E2E1EC]">
                {st}
              </span>
              {idx < bottomSteps.length - 1 && <span className="text-[#3C61DD]">➔</span>}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
