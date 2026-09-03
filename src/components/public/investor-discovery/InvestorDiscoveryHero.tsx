'use client';

import Link from 'next/link';
import { Compass, CheckCircle2, ArrowRight, Sparkles, Building2, Globe, DollarSign } from 'lucide-react';

export default function InvestorDiscoveryHero() {
  const journeyNav = [
    { num: '01', title: 'Profile & Thesis', status: 'COMPLETE', isComplete: true, isCurrent: false },
    { num: '02', title: 'Discover & Match', status: 'CURRENT', isComplete: false, isCurrent: true },
    { num: '03', title: 'Diligence & Invest', status: 'FUTURE', isComplete: false, isCurrent: false },
    { num: '04', title: 'Portfolio', status: 'FUTURE', isComplete: false, isCurrent: false },
  ];

  const thesisPills = ['B2B SaaS', 'Seed/Early', 'EU', '€250K–€1M'];

  const oppNodes = [
    {
      name: 'NOVA SPACE SAS',
      fit: 'HIGH FIT',
      desc: 'B2B SaaS • Seed • France • €700K',
      badgeColor: 'bg-[#E8F8EE] text-[#157A55]',
    },
    {
      name: 'FLOWBASE',
      fit: 'STRONG FIT',
      desc: 'Future of Work • Early • BE • €500K',
      badgeColor: 'bg-[#F3F2FD] text-[#1A47C3]',
    },
    {
      name: 'PAYGRID',
      fit: 'HIGH FIT',
      desc: 'FinTech • Seed • France • €900K',
      badgeColor: 'bg-[#E8F8EE] text-[#157A55]',
    },
  ];

  const bottomSteps = [
    'THESIS',
    'DISCOVER',
    'UNDERSTAND',
    'COMPARE',
    'CONNECT',
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
                    : step.isComplete
                    ? 'bg-[#E8F8EE] text-[#157A55]'
                    : 'bg-[#FAF8FF] text-[#747685]'
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
                INVESTORS — DISCOVER &amp; MATCH
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-[40px] sm:text-[50px] lg:text-[56px] font-heading font-extrabold text-[#1A1B23] leading-[1.1] tracking-[-1.1px]">
              Turn your thesis into
              <br />
              <span className="text-[#3C61DD] relative inline-block">
                relevant deal flow.
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
              Mondial connects your investment criteria with structured companies and projects — helping you understand why an opportunity may deserve deeper attention.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/signup"
                className="px-6 py-3.5 bg-[#3C61DD] hover:bg-[#3252BF] text-white font-semibold text-[14px] rounded-[10px] transition-all shadow-sm inline-flex items-center gap-2 group"
              >
                <span>Explore Discover &amp; Match</span>
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
              </Link>

              <a
                href="#section-03-transparent-matching"
                className="px-5 py-3.5 bg-white hover:bg-[#FAF8FF] border border-[#E2E1EC] text-[#1A1B23] font-semibold text-[14px] rounded-[10px] transition-colors inline-flex items-center gap-2"
              >
                <span>See How Matching Works</span>
                <span>➔</span>
              </a>
            </div>
          </div>

          {/* Right Column: Hero Matching Spatial Graph (6 cols) */}
          <div className="lg:col-span-6 p-6 sm:p-8 rounded-[28px] bg-white border border-[#E2E1EC] shadow-sm flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(0,0,0,0.06)]">
              <div>
                <span className="text-[10px] font-bold text-[#747685] uppercase block">
                  DEMO INVESTOR THESIS
                </span>
                <h3 className="font-heading font-extrabold text-[18px] text-[#1A1B23]">
                  HORIZON CAPITAL
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded bg-[#FAF8FF] text-[#747685] text-[10px] font-bold">
                ILLUSTRATIVE EXAMPLES
              </span>
            </div>

            {/* Thesis Context Pills */}
            <div className="flex flex-wrap gap-1.5">
              {thesisPills.map((pill) => (
                <span
                  key={pill}
                  className="px-2.5 py-1 rounded-full bg-[#FAF8FF] border border-[#E2E1EC] text-[11px] font-bold text-[#3C61DD]"
                >
                  {pill}
                </span>
              ))}
            </div>

            {/* Matched Opportunities Nodes */}
            <div className="space-y-2.5 pt-2">
              {oppNodes.map((node) => (
                <div
                  key={node.name}
                  className="p-3 rounded-[14px] bg-[#FAF8FF] border border-[#E2E1EC] flex items-center justify-between gap-3"
                >
                  <div>
                    <h4 className="font-heading font-bold text-[13px] text-[#1A1B23]">{node.name}</h4>
                    <p className="text-[11px] text-[#747685] mt-0.5">{node.desc}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${node.badgeColor}`}>
                    {node.fit}
                  </span>
                </div>
              ))}
            </div>

            {/* Discovery Equation Flow */}
            <div className="p-3 rounded-[12px] bg-[#F3F2FD] border border-[#3C61DD]/20 text-[10px] font-bold text-[#1A47C3] flex flex-wrap items-center justify-between gap-1">
              <span>THESIS</span>
              <span>➔</span>
              <span>FIT SIGNALS</span>
              <span>➔</span>
              <span>RELEVANT OPPORTUNITIES</span>
            </div>
          </div>
        </div>

        {/* Hero Editorial Statement */}
        <div className="p-6 sm:p-8 rounded-[20px] bg-white border border-[#E2E1EC] text-center shadow-xs flex flex-col gap-1.5">
          <h3 className="font-heading font-extrabold text-[15px] sm:text-[18px] text-[#070707] uppercase tracking-wide">
            &ldquo;DISCOVERY SHOULD NOT BEGIN WITH &apos;SHOW ME EVERYTHING.&apos;
            <br />
            IT SHOULD BEGIN WITH: &apos;SHOW ME WHAT FITS, AND EXPLAIN WHY.&apos;&rdquo;
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
