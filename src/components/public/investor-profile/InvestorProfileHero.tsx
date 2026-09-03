'use client';

import Link from 'next/link';
import { ShieldCheck, ArrowRight, CheckCircle2, Sparkles, Building2, Globe, DollarSign, Layers } from 'lucide-react';

export default function InvestorProfileHero() {
  const journeyNav = [
    { num: '01', title: 'INVESTOR PROFILE & THESIS', isCurrent: true },
    { num: '02', title: 'DISCOVER & MATCH', isCurrent: false },
    { num: '03', title: 'DILIGENCE & INVEST', isCurrent: false },
    { num: '04', title: 'PIPELINE & PORTFOLIO', isCurrent: false },
  ];

  const thesisDetails = [
    { label: 'IDENTITY', value: 'Verified Investor' },
    { label: 'CAPITAL CONTEXT', value: '€250K — €1M Ticket' },
    { label: 'SECTOR FOCUS', value: 'B2B SaaS, FinTech' },
    { label: 'STAGE', value: 'Pre-Seed, Seed' },
    { label: 'DEAL PREFERENCE', value: 'Equity, SAFE' },
    { label: 'GEOGRAPHY', value: 'France, EU' },
  ];

  const bottomSteps = [
    'VERIFY',
    'DEFINE CAPITAL',
    'DEFINE THESIS',
    'BUILD PROFILE',
    'DISCOVER',
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
                    : 'bg-[#FAF8FF] text-[#747685]'
                }`}
              >
                <span>{step.num}</span>
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
                INVESTORS — PROFILE &amp; THESIS
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-[40px] sm:text-[50px] lg:text-[56px] font-heading font-extrabold text-[#1A1B23] leading-[1.1] tracking-[-1.1px]">
              Define your capital.
              <br />
              <span className="text-[#3C61DD] relative inline-block">
                Define where it belongs.
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
              Mondial connects investor identity, financial credibility and investment preferences into a structured thesis before opportunity discovery begins.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/signup"
                className="px-6 py-3.5 bg-[#3C61DD] hover:bg-[#3252BF] text-white font-semibold text-[14px] rounded-[10px] transition-all shadow-sm inline-flex items-center gap-2 group"
              >
                <span>Explore Investor Profile &amp; Thesis</span>
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
              </Link>

              <a
                href="#section-02-trust-foundations"
                className="px-5 py-3.5 bg-white hover:bg-[#FAF8FF] border border-[#E2E1EC] text-[#1A1B23] font-semibold text-[14px] rounded-[10px] transition-colors inline-flex items-center gap-2"
              >
                <span>See the Investor Journey</span>
                <span>➔</span>
              </a>
            </div>
          </div>

          {/* Right Column: Hero Investor Foundation Visual (Horizon Capital) (6 cols) */}
          <div className="lg:col-span-6 p-6 sm:p-8 rounded-[28px] bg-white border border-[#E2E1EC] shadow-sm flex flex-col gap-6">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(0,0,0,0.06)]">
              <div>
                <span className="text-[10px] font-bold text-[#747685] uppercase block">
                  ILLUSTRATIVE DEMO INVESTOR
                </span>
                <h3 className="font-heading font-extrabold text-[20px] text-[#1A1B23]">
                  HORIZON CAPITAL
                </h3>
                <p className="text-[12px] text-[#747685]">Early-Stage Venture Investor</p>
              </div>
              <div className="text-right">
                <span className="px-2.5 py-0.5 rounded bg-[#E8F8EE] text-[#157A55] text-[10px] font-bold">
                  VERIFIED ALIGNMENT
                </span>
                <p className="text-[11px] text-[#3C61DD] font-semibold mt-1">INVESTMENT THESIS</p>
              </div>
            </div>

            {/* Thesis Details Grid */}
            <div className="grid grid-cols-2 gap-3">
              {thesisDetails.map((item) => (
                <div
                  key={item.label}
                  className="p-3 rounded-[12px] bg-[#FAF8FF] border border-[#E2E1EC] flex flex-col gap-1"
                >
                  <span className="text-[9px] font-bold text-[#747685] uppercase">{item.label}</span>
                  <span className="text-[12px] font-bold text-[#1A1B23]">{item.value}</span>
                </div>
              ))}
            </div>

            {/* Discovery Logic */}
            <div className="p-3.5 rounded-[12px] bg-[#F3F2FD] border border-[#3C61DD]/20 flex items-center justify-between text-[11px] font-bold text-[#1A47C3]">
              <span>MONDIAL DISCOVERY LOGIC</span>
              <span>➔</span>
              <span>RELEVANT OPPORTUNITIES</span>
            </div>
          </div>
        </div>

        {/* Hero Editorial Statement */}
        <div className="p-6 sm:p-8 rounded-[20px] bg-white border border-[#E2E1EC] text-center shadow-xs flex flex-col gap-1.5">
          <h3 className="font-heading font-extrabold text-[15px] sm:text-[18px] text-[#070707] uppercase tracking-wide">
            GOOD DISCOVERY STARTS BEFORE THE FIRST DEAL APPEARS.
            <br />
            FIRST DEFINE WHAT FIT ACTUALLY MEANS.
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
