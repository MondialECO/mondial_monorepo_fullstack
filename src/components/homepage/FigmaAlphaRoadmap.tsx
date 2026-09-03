'use client';

import { Check, Clock, Quote } from 'lucide-react';

export default function FigmaAlphaRoadmap() {
  const liveToday = [
    'Creator journey, Phases 1–6',
    'AI business plan generator',
    'AI financial forecast generator',
    'Investor readiness scoring',
    'Verified provider directory',
    'NDA-gated data rooms',
  ];

  const beingBuilt = [
    'Automated matching — introductions are human today',
    'Self-serve investor onboarding',
    'Public pricing',
    'Portfolio analytics',
    'Secondary transactions',
    'Live payments, e-signature and file scanning (currently stubbed)',
  ];

  return (
    <section className="w-full py-14 sm:py-20 px-4 sm:px-6 lg:px-8 bg-background flex justify-center border-t border-[rgba(0,0,0,0.06)]" id="roadmap">
      <div className="w-full max-w-[1280px] flex flex-col gap-8 sm:gap-12">
        {/* Header */}
        <div className="flex flex-col gap-2.5 sm:gap-3 max-w-[800px]">
          <span className="text-[12px] sm:text-[13px] font-medium text-[#3C61DD] tracking-wide uppercase">
            Where We Are
          </span>
          <h2 className="text-[28px] sm:text-[40px] md:text-[48px] font-heading font-bold text-[#070707] tracking-tight leading-[1.15]">
            We&apos;re in closed alpha. Here&apos;s what that actually means.
          </h2>
          <p className="text-[14px] sm:text-[16px] md:text-[17px] text-[#5E5E5E] leading-[1.6]">
            Honest software roadmap. Live features you can test right now, and what we&apos;re actively
            shipping next.
          </p>
        </div>

        {/* 2 Status Columns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {/* Live Today */}
          <div className="bg-[#F9F9FA] border border-[rgba(0,0,0,0.08)] rounded-[20px] p-5 sm:p-8 flex flex-col gap-5 sm:gap-6">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00C896] shrink-0" />
              <h3 className="font-heading font-bold text-[17px] sm:text-[18px] text-[#070707]">Live Today</h3>
            </div>
            <ul className="flex flex-col gap-3 text-[13px] sm:text-[14px] text-[#3E3E3E]">
              {liveToday.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 sm:gap-3">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#00C896]/15 text-[#00A854] flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={11} strokeWidth={3} />
                  </div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Being Built */}
          <div className="bg-[#F9F9FA] border border-[rgba(0,0,0,0.08)] rounded-[20px] p-5 sm:p-8 flex flex-col gap-5 sm:gap-6">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] shrink-0" />
              <h3 className="font-heading font-bold text-[17px] sm:text-[18px] text-[#070707]">Being Built</h3>
            </div>
            <ul className="flex flex-col gap-3 text-[13px] sm:text-[14px] text-[#5E5E5E]">
              {beingBuilt.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5 sm:gap-3">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#F59E0B]/15 text-[#B45309] flex items-center justify-center shrink-0 mt-0.5">
                    <Clock size={11} strokeWidth={2.5} />
                  </div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Founder Transparency Card */}
        <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-[20px] p-5 sm:p-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 sm:gap-8 shadow-sm">
          {/* Left Text */}
          <div className="flex flex-col gap-2 max-w-[420px]">
            <span className="text-[11px] sm:text-[12px] font-semibold uppercase tracking-wider text-[#8A8B8F]">
              Transparency
            </span>
            <h4 className="text-[18px] sm:text-[20px] font-heading font-bold text-[#070707]">
              No fake testimonials.
            </h4>
            <p className="text-[13px] sm:text-[14px] text-[#5E5E5E] leading-[1.6]">
              We could have bought some. We decided to build a real product and earn genuine proof
              instead.
            </p>
          </div>

          {/* Right Quote */}
          <div className="flex-1 w-full bg-[#F9F9FA] border border-[rgba(0,0,0,0.06)] rounded-[14px] p-4 sm:p-5 flex flex-col gap-3">
            <Quote size={20} className="text-[#3C61DD]" />
            <p className="text-[13px] sm:text-[15px] italic text-[#3E3E3E] leading-[1.6]">
              &ldquo;We could have bought some. We&apos;d rather show you the product and let you
              decide. Every founder in the alpha is talking directly to the people who built this —
              including me.&rdquo;
            </p>
            <div className="flex items-center gap-3 pt-2 border-t border-[rgba(0,0,0,0.06)]">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#3C61DD] text-white flex items-center justify-center font-bold text-[11px] sm:text-[12px] shrink-0">
                SM
              </div>
              <div className="text-[12px]">
                <span className="font-semibold text-[#070707] block">Sirajul</span>
                <span className="text-[#5E5E5E]">Founder, Mondial.eco</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
