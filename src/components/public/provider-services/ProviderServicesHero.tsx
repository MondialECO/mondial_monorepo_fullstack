'use client';

import Link from 'next/link';
import { CheckCircle2, ArrowRight, Server, Layers, FileText, Globe, Sparkles, Check } from 'lucide-react';

export default function ProviderServicesHero() {
  const journeyNav = [
    { num: '01', title: 'Verify & Profile', isComplete: true, isCurrent: false },
    { num: '02', title: 'Services & Opportunities', isComplete: false, isCurrent: true },
    { num: '03', title: 'Projects & Delivery', isComplete: false, isCurrent: false },
    { num: '04', title: 'Earnings & Growth', isComplete: false, isCurrent: false },
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
              SERVICE PROVIDERS — SERVICES &amp; OPPORTUNITIES
            </span>
            <span className="w-6 h-[2px] bg-[#3C61DD]" />
          </div>

          {/* Headline */}
          <h1 className="text-[40px] sm:text-[48px] lg:text-[54px] font-heading font-extrabold text-[#1A1B23] leading-[1.1] tracking-[-0.96px]">
            Turn expertise into
            <br />
            <span className="text-[#3C61DD] relative inline-block">
              clients can act on.
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
            Structure your expertise into clear services, pricing and deliverables — then let Mondial connect those services to relevant needs across Creators, Entrepreneurs and Investors.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/signup"
              className="px-6 py-3.5 bg-[#3C61DD] hover:bg-[#3252BF] text-white font-semibold text-[14px] rounded-[10px] transition-all shadow-sm inline-flex items-center gap-2 group"
            >
              <span>Explore Services &amp; Opportunities</span>
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
            </Link>

            <a
              href="#section-06-two-paths"
              className="px-5 py-3.5 bg-white hover:bg-[#FAF8FF] border border-[#E2E1EC] text-[#1A1B23] font-semibold text-[14px] rounded-[10px] transition-colors inline-flex items-center gap-2"
            >
              <span>See How Matching Works</span>
              <span>➔</span>
            </a>
          </div>
        </div>

        {/* Wide Process Map: Expertise -> Structured Service -> Clear Offer -> Visibility -> Opportunity */}
        <div className="w-full p-6 sm:p-8 rounded-[28px] bg-white border border-[#E2E1EC] shadow-sm flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-stretch">
            {/* 1. Expertise */}
            <div className="p-4 rounded-[18px] bg-[#FAF8FF] border border-[#E2E1EC] flex flex-col justify-between gap-4">
              <span className="text-[10px] font-bold text-[#747685] uppercase">EXPERTISE</span>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-[10px] bg-white border border-[#E2E1EC] flex items-center justify-center text-[#3C61DD]">
                  <Server size={18} />
                </div>
                <span className="font-heading font-extrabold text-[13px] text-[#1A1B23]">
                  Backend Engineering
                </span>
              </div>
            </div>

            {/* 2. Structured Service */}
            <div className="p-4 rounded-[18px] bg-[#FAF8FF] border border-[#E2E1EC] flex flex-col justify-between gap-2 text-[12px]">
              <span className="text-[10px] font-bold text-[#3C61DD] uppercase">
                STRUCTURED SERVICE
              </span>
              <ul className="space-y-1 text-[#444654]">
                <li className="flex items-center gap-1.5 font-medium">
                  <Check size={12} className="text-[#3C61DD]" /> Architecture
                </li>
                <li className="flex items-center gap-1.5 font-medium">
                  <Check size={12} className="text-[#3C61DD]" /> API Integration
                </li>
                <li className="flex items-center gap-1.5 font-medium">
                  <Check size={12} className="text-[#3C61DD]" /> Database Logic
                </li>
                <li className="flex items-center gap-1.5 font-medium">
                  <Check size={12} className="text-[#3C61DD]" /> Payment Sync
                </li>
              </ul>
            </div>

            {/* 3. Clear Offer */}
            <div className="p-4 rounded-[18px] bg-[#FAF8FF] border border-[#E2E1EC] flex flex-col justify-between gap-2 text-[12px]">
              <span className="text-[10px] font-bold text-[#3C61DD] uppercase">CLEAR OFFER</span>
              <ul className="space-y-1 text-[#444654]">
                <li className="flex items-center gap-1.5 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1A47C3]" /> Scope
                </li>
                <li className="flex items-center gap-1.5 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1A47C3]" /> Pricing
                </li>
                <li className="flex items-center gap-1.5 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1A47C3]" /> Timeline
                </li>
                <li className="flex items-center gap-1.5 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1A47C3]" /> Deliverables
                </li>
              </ul>
            </div>

            {/* 4. Visibility */}
            <div className="p-4 rounded-[18px] bg-[#FAF8FF] border border-[#E2E1EC] flex flex-col justify-between gap-2 text-[12px]">
              <span className="text-[10px] font-bold text-[#747685] uppercase">VISIBILITY</span>
              <div className="space-y-2">
                <div className="p-2 rounded bg-white border border-[#E2E1EC] text-[11px] font-semibold text-[#1A1B23]">
                  Marketplace Discovery
                </div>
                <div className="p-2 rounded bg-white border border-[#E2E1EC] text-[11px] font-semibold text-[#3C61DD]">
                  + Smart Matching
                </div>
              </div>
            </div>

            {/* 5. Opportunity / Real Example */}
            <div className="p-4 rounded-[18px] bg-[#E8F8EE] border border-[#157A55]/30 flex flex-col justify-between gap-2 text-[12px]">
              <span className="text-[10px] font-bold text-[#157A55] uppercase">
                REAL DEMO EXAMPLE
              </span>
              <div className="space-y-1">
                <span className="font-heading font-bold text-[#1A1B23] block text-[13px]">
                  Nova Space SAS
                </span>
                <p className="text-[11px] text-[#444654]">Need: Backend capability for MVP</p>
                <div className="p-1.5 rounded bg-white text-[10px] font-bold text-[#157A55] mt-1">
                  ✔ Matched: Backend Architecture
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Strategic Statement */}
        <div className="p-6 sm:p-8 rounded-[20px] bg-white border border-[#E2E1EC] text-center shadow-xs flex flex-col gap-1.5">
          <h3 className="font-heading font-extrabold text-[15px] sm:text-[18px] text-[#070707] uppercase tracking-wide">
            &ldquo;YOU SHOULD NOT HAVE TO START FROM ZERO EVERY TIME A CLIENT APPEARS.&rdquo;
          </h3>
          <p className="text-[13px] text-[#444654] font-medium">
            Structure the offer once. Use it wherever the right need appears.
          </p>
        </div>
      </div>
    </section>
  );
}
