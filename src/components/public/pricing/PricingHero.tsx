'use client';

import { ArrowRight, Compass } from 'lucide-react';

export default function PricingHero() {
  return (
    <section className="w-full relative pt-12 sm:pt-20 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 bg-white flex justify-center overflow-hidden">
      {/* Decorative Subtle Background Glow Elements (Same-to-same Figma 56939:79256) */}
      <div
        className="absolute top-[-100px] left-[-100px] w-[512px] h-[512px] rounded-full bg-[#3C61DD]/5 blur-[64px] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-[-100px] right-[-100px] w-[512px] h-[512px] rounded-full bg-[#965F11]/5 blur-[64px] pointer-events-none"
        aria-hidden="true"
      />

      <div className="w-full max-w-[1240px] flex flex-col items-center text-center gap-6 sm:gap-8 relative z-10">
        {/* Eyebrow */}
        <span className="text-[12px] font-bold text-[#747685] uppercase tracking-wider">
          MONDIAL ECO — PRICING
        </span>

        {/* Headline with blue emphasis on PROFESSIONAL VALUE and BEGINS */}
        <h1 className="text-[38px] sm:text-[54px] lg:text-[64px] font-heading font-extrabold text-[#070707] leading-[1.08] tracking-tight max-w-[960px]">
          START BUILDING FOR FREE. PAY
          <br className="hidden sm:inline" />
          {' '}WHEN <span className="text-[#3C61DD]">PROFESSIONAL VALUE</span>
          <br className="hidden sm:inline" />
          {' '}<span className="text-[#3C61DD]">BEGINS.</span>
        </h1>

        {/* Supporting Copy */}
        <p className="text-[16px] sm:text-[18px] text-[#444654] leading-[1.6] max-w-[760px]">
          Mondial pricing follows your role in the ecosystem — free access for project and company building, with simple professional access for Providers and Investors.
        </p>

        {/* CTA Pair */}
        <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
          <a
            href="#role-gateway"
            className="px-7 py-3.5 bg-[#3C61DD] hover:bg-[#3252BF] text-white font-semibold text-[14px] rounded-[10px] transition-all shadow-sm hover:shadow inline-flex items-center gap-2 group"
          >
            <span>CHOOSE YOUR ROLE</span>
            <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
          </a>

          <a
            href="#quick-comparison"
            className="px-6 py-3.5 bg-[#FAF8FF] hover:bg-[#F1F1F2] border border-[#E2E1EC] text-[#1A1B23] font-semibold text-[14px] rounded-[10px] transition-colors"
          >
            SEE WHAT&apos;S INCLUDED
          </a>
        </div>
      </div>
    </section>
  );
}
