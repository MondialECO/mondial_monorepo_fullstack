'use client';

import Link from 'next/link';
import { CheckCircle2, ArrowRight, ShieldCheck, FileText, Check, Lock, Sparkles, Server } from 'lucide-react';

export default function ProviderProjectDeliveryHero() {
  const journeyNav = [
    { num: '01', title: 'Verify & Profile', isComplete: true, isCurrent: false },
    { num: '02', title: 'Services & Opportunities', isComplete: true, isCurrent: false },
    { num: '03', title: 'Projects & Delivery', isComplete: false, isCurrent: true },
    { num: '04', title: 'Earnings & Growth', isComplete: false, isCurrent: false },
  ];

  const bottomFlow = [
    { name: 'OPPORTUNITY', isGreen: false },
    { name: 'PROPOSAL', isGreen: false },
    { name: 'AGREEMENT', isGreen: false },
    { name: 'ESCROW', isGreen: true },
    { name: 'WORK', isGreen: false },
    { name: 'DELIVERY', isGreen: false },
    { name: 'APPROVAL', isGreen: false },
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
                    : 'text-[#747685]'
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

        {/* Narrative Header */}
        <div className="flex flex-col items-center text-center gap-5 max-w-[860px] mx-auto">
          {/* Eyebrow */}
          <div className="flex items-center gap-2">
            <span className="w-6 h-[2px] bg-[#3C61DD]" />
            <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
              SERVICE PROVIDERS — PROJECTS &amp; DELIVERY
            </span>
            <span className="w-6 h-[2px] bg-[#3C61DD]" />
          </div>

          {/* Headline */}
          <h1 className="text-[40px] sm:text-[54px] lg:text-[64px] font-heading font-extrabold text-[#1A1B23] leading-[1.1] tracking-[-1.28px]">
            Turn interest into
            <br />
            <span className="text-[#3C61DD] relative inline-block">
              work you can deliver.
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
          <p className="text-[16px] sm:text-[18px] text-[#444654] leading-[1.6]">
            Move from opportunity to proposal, agreement, funded project and completed delivery through one structured client journey.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/signup"
              className="px-6 py-3.5 bg-[#3C61DD] hover:bg-[#3252BF] text-white font-semibold text-[14px] rounded-[10px] transition-all shadow-sm inline-flex items-center gap-2 group"
            >
              <span>Explore Projects &amp; Delivery</span>
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
            </Link>

            <a
              href="#section-07-delivery-workflow"
              className="px-5 py-3.5 bg-white hover:bg-[#FAF8FF] border border-[#E2E1EC] text-[#1A1B23] font-semibold text-[14px] rounded-[10px] transition-colors inline-flex items-center gap-2"
            >
              <span>See the Delivery Flow</span>
              <span>➔</span>
            </a>
          </div>
        </div>

        {/* 5-Node Cinematic Visual: Opportunity -> Proposal -> Agreement -> Escrow -> Delivery */}
        <div className="w-full p-6 sm:p-8 rounded-[28px] bg-white border border-[#E2E1EC] shadow-sm flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-stretch">
            {/* 1. Opportunity */}
            <div className="p-4 rounded-[18px] bg-[#FAF8FF] border border-[#E2E1EC] flex flex-col justify-between gap-3 text-[12px]">
              <span className="text-[10px] font-bold text-[#747685] uppercase">OPPORTUNITY</span>
              <div>
                <span className="font-heading font-extrabold text-[#1A1B23] block text-[13px]">
                  Nova Space SAS
                </span>
                <p className="text-[11px] text-[#444654] mt-0.5">Backend MVP</p>
              </div>
            </div>

            {/* 2. Proposal */}
            <div className="p-4 rounded-[18px] bg-[#FAF8FF] border border-[#E2E1EC] flex flex-col justify-between gap-3 text-[12px]">
              <span className="text-[10px] font-bold text-[#3C61DD] uppercase">PROPOSAL</span>
              <div>
                <span className="font-heading font-bold text-[#1A1B23] block text-[13px]">
                  Custom Scope
                </span>
                <p className="text-[11px] text-[#444654] mt-0.5">Scope, Timeline, Price</p>
              </div>
            </div>

            {/* 3. Agreement */}
            <div className="p-4 rounded-[18px] bg-[#FAF8FF] border border-[#E2E1EC] flex flex-col justify-between gap-3 text-[12px]">
              <span className="text-[10px] font-bold text-[#3C61DD] uppercase">AGREEMENT</span>
              <div>
                <span className="font-heading font-bold text-[#1A1B23] block text-[13px]">
                  Contract Active
                </span>
                <p className="text-[11px] text-[#444654] mt-0.5">Terms &amp; Signatures</p>
              </div>
            </div>

            {/* 4. Escrow (Secured) */}
            <div className="p-4 rounded-[18px] bg-[#E8F8EE] border border-[#157A55]/30 flex flex-col justify-between gap-3 text-[12px] relative">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#157A55] uppercase">ESCROW</span>
                <span className="px-2 py-0.5 rounded bg-[#157A55] text-white text-[9px] font-extrabold">
                  SECURED
                </span>
              </div>
              <div>
                <span className="font-heading font-bold text-[#157A55] block text-[13px]">
                  Funds Verified
                </span>
                <p className="text-[11px] text-[#157A55]/80 mt-0.5">Held in Process</p>
              </div>
            </div>

            {/* 5. Delivery */}
            <div className="p-4 rounded-[18px] bg-[#FAF8FF] border border-[#E2E1EC] flex flex-col justify-between gap-3 text-[12px]">
              <span className="text-[10px] font-bold text-[#747685] uppercase">DELIVERY</span>
              <div>
                <span className="font-heading font-bold text-[#1A1B23] block text-[13px]">
                  Active Workroom
                </span>
                <p className="text-[11px] text-[#444654] mt-0.5">Milestones &amp; Files</p>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Strategic Statement */}
        <div className="p-6 sm:p-8 rounded-[20px] bg-white border border-[#E2E1EC] text-center shadow-xs flex flex-col gap-1.5">
          <h3 className="font-heading font-extrabold text-[15px] sm:text-[18px] text-[#070707] uppercase tracking-wide">
            &ldquo;THE PROJECT SHOULD NOT BEGIN WITH A MESSAGE. IT SHOULD BEGIN WITH A CLEAR AGREEMENT.&rdquo;
          </h3>
        </div>

        {/* Bottom Hero Flow: Opportunity -> Proposal -> Agreement -> Escrow -> Work -> Delivery -> Approval */}
        <div className="p-4 sm:p-5 rounded-[20px] bg-white border border-[#E2E1EC] shadow-2xs flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-[11px] sm:text-[12px] font-bold text-[#1A1B23]">
          {bottomFlow.map((step, idx) => (
            <span key={step.name} className="flex items-center gap-2 sm:gap-3">
              <span
                className={`px-3 py-1.5 rounded-[8px] border transition-all ${
                  step.isGreen
                    ? 'bg-[#E8F8EE] border-[#157A55]/30 text-[#157A55]'
                    : 'bg-[#FAF8FF] border-[#E2E1EC]'
                }`}
              >
                {step.name}
              </span>
              {idx < bottomFlow.length - 1 && <span className="text-[#3C61DD]">➔</span>}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
