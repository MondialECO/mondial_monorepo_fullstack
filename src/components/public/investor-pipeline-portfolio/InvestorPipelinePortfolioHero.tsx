'use client';

import Link from 'next/link';
import { ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';

export default function InvestorPipelinePortfolioHero() {
  const journeyNav = [
    { num: '01', title: 'PROFILE', status: 'COMPLETE', isComplete: true, isCurrent: false },
    { num: '02', title: 'MATCH', status: 'COMPLETE', isComplete: true, isCurrent: false },
    { num: '03', title: 'DILIGENCE', status: 'COMPLETE', isComplete: true, isCurrent: false },
    { num: '04', title: 'PIPELINE & PORTFOLIO', status: 'CURRENT', isComplete: false, isCurrent: true },
  ];

  const pipelineStates = [
    { label: 'IN REVIEW', active: false },
    { label: 'NDA', active: false },
    { label: 'DATA ROOM', active: false },
    { label: 'TERM SHEET', active: true },
    { label: 'NEGOTIATION', active: false },
  ];

  const journeyFlow = [
    { label: 'DISCOVER', highlight: false },
    { label: 'REVIEW', highlight: false },
    { label: 'DECIDE', highlight: false },
    { label: 'INVEST', highlight: false },
    { label: 'FOLLOW', highlight: true },
    { label: 'UNDERSTAND', highlight: true },
  ];

  return (
    <section className="w-full pt-10 sm:pt-14 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* 1. Stepper Navigation */}
        <div className="w-full flex flex-wrap items-center justify-between gap-3 pb-8 border-b border-[rgba(0,0,0,0.06)]">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {journeyNav.map((step) => (
              <div
                key={step.num}
                className={`flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-full text-[11px] sm:text-[12px] font-semibold transition-colors ${
                  step.isCurrent
                    ? 'bg-[#EBF0FF] text-[#1A47C3] border border-[#3C61DD]/30 shadow-xs'
                    : step.isComplete
                    ? 'bg-[#E8F8EE] text-[#157A55] border border-[#157A55]/20'
                    : 'bg-[#F1F1F2] text-[#747685]'
                }`}
              >
                <span>{`${step.num} ${step.title}`}</span>
                {step.isComplete && <CheckCircle2 size={13} className="text-[#157A55]" />}
                {step.isCurrent && (
                  <span className="w-2 h-2 rounded-full bg-[#3C61DD] animate-pulse" />
                )}
              </div>
            ))}
          </div>

          <div className="text-[11px] font-medium text-[#747685] tracking-wide uppercase flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#157A55]" />
            <span>Investor Journey 04 / 04</span>
          </div>
        </div>

        {/* 2. Hero Headline & CTAs */}
        <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-8">
          <div className="flex flex-col gap-4 max-w-[780px]">
            <span className="text-[12px] font-bold text-[#747685] uppercase tracking-wider">
              INVESTORS — PIPELINE &amp; PORTFOLIO
            </span>
            <h1 className="text-[40px] sm:text-[54px] lg:text-[62px] font-heading font-extrabold text-[#070707] leading-[1.08] tracking-tight">
              Track the decision.
              <br />
              <span className="text-[#3C61DD]">Stay connected after it.</span>
            </h1>
            <p className="text-[16px] sm:text-[18px] text-[#444654] leading-[1.6] max-w-[680px]">
              Mondial connects active investment opportunities with the ownership, updates and company context that continue after a deal closes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/signup"
              className="px-6 sm:px-7 py-3.5 bg-[#3C61DD] hover:bg-[#3252BF] text-white font-semibold text-[14px] rounded-[10px] transition-all shadow-sm hover:shadow inline-flex items-center gap-2 group"
            >
              <span>Explore Pipeline &amp; Portfolio</span>
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
            </Link>

            <a
              href="#complete-journey"
              className="px-5 py-3.5 bg-[#FAF8FF] hover:bg-[#F1F1F2] border border-[#E2E1EC] text-[#1A1B23] font-semibold text-[14px] rounded-[10px] transition-colors"
            >
              See Complete Journey
            </a>
          </div>
        </div>

        {/* 3. Hero Visual: Pipeline -> Decision -> Portfolio Showcase */}
        <div className="p-6 sm:p-8 lg:p-10 rounded-[28px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-xs flex flex-col gap-8">
          {/* Top labels */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pb-2 border-b border-[rgba(0,0,0,0.06)]">
            <div className="lg:col-span-6 text-[12px] font-bold text-[#747685] uppercase tracking-wider">
              WHAT AM I STILL DECIDING?
            </div>
            <div className="lg:col-span-6 text-[12px] font-bold text-[#747685] uppercase tracking-wider lg:pl-4">
              WHAT AM I ALREADY CONNECTED TO?
            </div>
          </div>

          {/* Spatial 3-part layout: Left (Active Opportunity) -> Center (Decision) -> Right (Split Paths) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left: Active Opportunity (5 cols) */}
            <div className="lg:col-span-5 p-5 sm:p-6 rounded-[20px] bg-white border border-[#E2E1EC] shadow-2xs flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[#747685] uppercase block">
                    OPPORTUNITY PIPELINE
                  </span>
                  <h3 className="font-heading font-bold text-[18px] text-[#1A1B23]">
                    Nova Space SAS
                  </h3>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#EBF0FF] text-[#1A47C3] border border-[#3C61DD]/20 text-[10px] font-bold uppercase tracking-wide">
                  ACTIVE OPPORTUNITY
                </span>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                {pipelineStates.map((st) => (
                  <div
                    key={st.label}
                    className={`px-3 py-2 rounded-[10px] text-[11px] font-bold flex items-center justify-between border ${
                      st.active
                        ? 'bg-[#1A47C3] text-white border-[#1A47C3] shadow-xs'
                        : 'bg-[#FAF8FF] text-[#444654] border-[#E2E1EC]'
                    }`}
                  >
                    <span>{st.label}</span>
                    {st.active && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-white text-[#1A47C3] uppercase">
                        CURRENT
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Center: Decision Node (2 cols) */}
            <div className="lg:col-span-2 flex flex-col items-center justify-center gap-2 py-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#1A1B23] text-white flex flex-col items-center justify-center font-heading font-extrabold text-[12px] sm:text-[13px] tracking-wider shadow-md border-4 border-white">
                <span>DECISION</span>
              </div>
              <span className="text-[10px] font-bold text-[#747685] uppercase tracking-wide">
                EVALUATION GATE
              </span>
            </div>

            {/* Right: Split Paths (Path A vs Path B) (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              {/* Path A (Not Invested) */}
              <div className="p-4 rounded-[16px] bg-white border border-[#E2E1EC] shadow-2xs flex flex-col gap-2">
                <span className="text-[10px] font-bold text-[#747685] uppercase tracking-wide">
                  PATH A (NOT INVESTED)
                </span>
                <div className="flex items-center gap-2 text-[12px] font-bold text-[#BA1A1A]">
                  <span className="px-2.5 py-1 rounded bg-[#FFDAD6]/40 border border-[#BA1A1A]/20">
                    CLOSED OPPORTUNITY
                  </span>
                  <span>➔</span>
                  <span className="text-[#444654] font-medium text-[11px]">
                    DECISION HISTORY RETAINED
                  </span>
                </div>
              </div>

              {/* Path B (Invested) - with green left accent */}
              <div className="p-4 sm:p-5 rounded-[16px] bg-white border-l-4 border-l-[#157A55] border border-[#E2E1EC] shadow-2xs flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#157A55] uppercase tracking-wider">
                    PATH B (INVESTED)
                  </span>
                  <span className="text-[10px] font-bold text-[#157A55] px-2 py-0.5 rounded bg-[#E8F8EE]">
                    PORTFOLIO COMPANY
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-[#1A1B23]">
                  <div className="p-2 rounded-[8px] bg-[#FAF8FF] border border-[#E2E1EC]">
                    OWNERSHIP
                  </div>
                  <div className="p-2 rounded-[8px] bg-[#FAF8FF] border border-[#E2E1EC]">
                    COMPANY UPDATES
                  </div>
                  <div className="p-2 rounded-[8px] bg-[#FAF8FF] border border-[#E2E1EC]">
                    METRICS
                  </div>
                  <div className="p-2 rounded-[8px] bg-[#FAF8FF] border border-[#E2E1EC]">
                    FOUNDER RELATIONSHIP
                  </div>
                </div>

                <div className="p-2 rounded-[8px] bg-[#E8F8EE] border border-[#157A55]/20 text-[11px] font-bold text-[#157A55] text-center">
                  FOLLOW-ON CONTEXT
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Relationship & Journey Sequence */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-[rgba(0,0,0,0.06)] text-[11px] font-bold">
            {/* Left: PIPELINE ➔ DECISION ➔ PORTFOLIO */}
            <div className="flex items-center gap-2 text-[#1A1B23]">
              <span className="px-3 py-1.5 rounded-[8px] bg-white border border-[#E2E1EC]">
                PIPELINE
              </span>
              <span className="text-[#3C61DD]">➔</span>
              <span className="px-3 py-1.5 rounded-[8px] bg-[#1A1B23] text-white shadow-2xs">
                DECISION
              </span>
              <span className="text-[#3C61DD]">➔</span>
              <span className="px-3 py-1.5 rounded-[8px] bg-[#157A55] text-white shadow-2xs">
                PORTFOLIO
              </span>
            </div>

            {/* Right: DISCOVER ➔ REVIEW ➔ DECIDE ➔ INVEST ➔ FOLLOW ➔ UNDERSTAND */}
            <div className="flex flex-wrap items-center gap-1.5 text-[#747685]">
              {journeyFlow.map((item, idx) => (
                <span key={item.label} className="flex items-center gap-1.5">
                  <span
                    className={`px-2.5 py-1 rounded-[6px] ${
                      item.highlight
                        ? 'bg-[#3C61DD] text-white font-extrabold shadow-2xs'
                        : 'bg-white border border-[#E2E1EC] text-[#444654]'
                    }`}
                  >
                    {item.label}
                  </span>
                  {idx < journeyFlow.length - 1 && <span className="text-[#3C61DD]">➔</span>}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
