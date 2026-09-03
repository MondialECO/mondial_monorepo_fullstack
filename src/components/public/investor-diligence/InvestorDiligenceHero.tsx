'use client';

import Link from 'next/link';
import { ShieldCheck, CheckCircle2, ArrowRight, ArrowDown, FileText, Lock, DollarSign, Users, Scale, Activity } from 'lucide-react';

export default function InvestorDiligenceHero() {
  const journeyNav = [
    { num: '01', title: 'PROFILE & THESIS', status: 'COMPLETE', isComplete: true, isCurrent: false },
    { num: '02', title: 'DISCOVER & MATCH', status: 'COMPLETE', isComplete: true, isCurrent: false },
    { num: '03', title: 'DILIGENCE & INVEST', status: 'CURRENT', isComplete: false, isCurrent: true },
    { num: '04', title: 'PIPELINE & PORTFOLIO', status: 'FUTURE', isComplete: false, isCurrent: false },
  ];

  const evidenceStreams = [
    {
      title: 'BUSINESS',
      desc: 'Business Plan, Market Logic, Business Model',
      icon: FileText,
    },
    {
      title: 'FINANCIAL',
      desc: 'Revenue Context, Forecast, Cash Requirements, Assumptions',
      icon: DollarSign,
    },
    {
      title: 'OWNERSHIP',
      desc: 'Cap Table, Founder Equity, Existing Investors',
      icon: Users,
    },
    {
      title: 'LEGAL',
      desc: 'Company Documents, Material Contracts, Context',
      icon: Scale,
    },
    {
      title: 'EXECUTION',
      desc: 'Traction, Product Evidence, Milestones',
      icon: Activity,
    },
  ];

  const bottomSteps = [
    'INTEREST',
    'ACCESS',
    'EVIDENCE',
    'QUESTIONS',
    'TERMS',
    'DECISION',
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
                INVESTORS — DILIGENCE &amp; INVEST
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-[40px] sm:text-[50px] lg:text-[56px] font-heading font-extrabold text-[#1A1B23] leading-[1.1] tracking-[-1.1px]">
              Move from the story to
              <br />
              <span className="text-[#3C61DD] relative inline-block">
                the evidence.
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
              Mondial connects controlled company access, structured diligence and investment terms so Investors can test assumptions before making a capital decision.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/signup"
                className="px-6 py-3.5 bg-[#3C61DD] hover:bg-[#3252BF] text-white font-semibold text-[14px] rounded-[10px] transition-all shadow-sm inline-flex items-center gap-2 group"
              >
                <span>Explore Diligence &amp; Invest</span>
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
              </Link>

              <a
                href="#section-04-financial-reasoning"
                className="px-5 py-3.5 bg-white hover:bg-[#FAF8FF] border border-[#E2E1EC] text-[#1A1B23] font-semibold text-[14px] rounded-[10px] transition-colors inline-flex items-center gap-2"
              >
                <span>See the Review Journey</span>
                <span>➔</span>
              </a>
            </div>
          </div>

          {/* Right Column: Story to Evidence Dual-Card (6 cols) */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Story Card */}
            <div className="p-6 rounded-[24px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold text-[#747685] uppercase block">
                  THE INVESTMENT STORY
                </span>
                <h3 className="font-heading font-bold text-[18px] text-[#1A1B23] mt-1">
                  Nova Space SAS
                </h3>
                <span className="text-[11px] text-[#3C61DD] font-bold block">
                  B2B Marketplace • Seed
                </span>

                <div className="space-y-1.5 pt-4 text-[12px] text-[#444654]">
                  <div><strong>Raise Amount:</strong> €700K</div>
                  <div><strong>Traction:</strong> Early Users</div>
                  <div><strong>Current Phase:</strong> Marketplace Pilot</div>
                </div>
              </div>
              <div className="text-[10px] text-[#747685]">Illustrative Context</div>
            </div>

            {/* Evidence Streams Card */}
            <div className="p-6 rounded-[24px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-3">
              <span className="text-[10px] font-bold text-[#157A55] uppercase block">
                EVIDENCE STREAMS
              </span>

              <div className="space-y-2">
                {evidenceStreams.map((st) => (
                  <div key={st.title} className="text-[11px]">
                    <strong className="text-[#1A1B23] block">{st.title}</strong>
                    <span className="text-[#747685] line-clamp-1">{st.desc}</span>
                  </div>
                ))}
              </div>

              <div className="p-2 rounded-[8px] bg-[#E8F8EE] text-[#157A55] text-[10px] font-bold text-center">
                MUTUAL INTEREST ➔ CONTROLLED ACCESS
              </div>
            </div>
          </div>
        </div>

        {/* Hero Editorial Statement */}
        <div className="p-6 sm:p-8 rounded-[20px] bg-white border border-[#E2E1EC] text-center shadow-xs flex flex-col gap-1.5">
          <h3 className="font-heading font-extrabold text-[15px] sm:text-[18px] text-[#070707] uppercase tracking-wide">
            &ldquo;DILIGENCE IS NOT ABOUT CONFIRMING THE ORIGINAL STORY.
            <br />
            IT IS ABOUT TESTING IT.&rdquo;
          </h3>
        </div>

        {/* Bottom Hero Sequence */}
        <div className="p-4 sm:p-5 rounded-[20px] bg-white border border-[#E2E1EC] shadow-2xs flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-[11px] sm:text-[12px] font-bold text-[#1A1B23]">
          {bottomSteps.map((st, idx) => (
            <span key={st} className="flex items-center gap-2">
              <span
                className={`px-3 py-1.5 rounded-[8px] border ${
                  st === 'EVIDENCE'
                    ? 'bg-[#3C61DD] text-white border-[#3C61DD] shadow-xs'
                    : 'bg-[#FAF8FF] border-[#E2E1EC]'
                }`}
              >
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
