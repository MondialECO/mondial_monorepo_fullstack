'use client';

import { ArrowUpRight } from 'lucide-react';

export default function FigmaMetrics() {
  return (
    <section className="w-full py-14 sm:py-20 px-4 sm:px-6 lg:px-8 bg-background flex justify-center border-t border-[rgba(0,0,0,0.06)]">
      <div className="w-full max-w-[1280px] flex flex-col gap-8 sm:gap-12">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <span className="text-[12px] sm:text-[13px] font-medium text-[#3C61DD] tracking-wide uppercase">
            The system, in numbers
          </span>
          <h2 className="text-[28px] sm:text-[40px] md:text-[48px] font-heading font-bold text-[#070707] tracking-tight leading-[1.15]">
            Structure you can count.
          </h2>
        </div>

        {/* 5 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Card 1: 6 Phases */}
          <div className="bg-[#F9F9FA] border border-[rgba(0,0,0,0.08)] rounded-[16px] p-5 sm:p-6 flex flex-col justify-between min-h-[130px] sm:h-[160px]">
            <span className="text-[36px] sm:text-[44px] font-heading font-bold text-[#070707] leading-none">6</span>
            <p className="text-[13px] sm:text-[14px] text-[#5E5E5E] leading-snug">
              Phases from raw idea to Level Up
            </p>
          </div>

          {/* Card 2: 4 Profile types */}
          <div className="bg-[#F9F9FA] border border-[rgba(0,0,0,0.08)] rounded-[16px] p-5 sm:p-6 flex flex-col justify-between min-h-[130px] sm:h-[160px]">
            <span className="text-[36px] sm:text-[44px] font-heading font-bold text-[#070707] leading-none">4</span>
            <p className="text-[13px] sm:text-[14px] text-[#5E5E5E] leading-snug">
              Profile types in one connected ecosystem
            </p>
          </div>

          {/* Card 3: 100 Point readiness */}
          <div className="bg-[#F9F9FA] border border-[rgba(0,0,0,0.08)] rounded-[16px] p-5 sm:p-6 flex flex-col justify-between min-h-[130px] sm:h-[160px]">
            <span className="text-[36px] sm:text-[44px] font-heading font-bold text-[#070707] leading-none">100</span>
            <p className="text-[13px] sm:text-[14px] text-[#5E5E5E] leading-snug">
              Point readiness score, with every point explained
            </p>
          </div>

          {/* Card 4: 26 AI capabilities */}
          <div className="bg-[#F9F9FA] border border-[rgba(0,0,0,0.08)] rounded-[16px] p-5 sm:p-6 flex flex-col justify-between min-h-[130px] sm:h-[160px]">
            <span className="text-[36px] sm:text-[44px] font-heading font-bold text-[#070707] leading-none">26</span>
            <p className="text-[13px] sm:text-[14px] text-[#5E5E5E] leading-snug">
              AI capabilities across the journey
            </p>
          </div>

          {/* Large Highlighted Alpha Card */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-4 bg-[#F1F5FF] border border-[#3C61DD]/20 rounded-[16px] p-5 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-col gap-2">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#3C61DD]/10 text-[#3C61DD] text-[11px] font-semibold w-fit">
                Closed Alpha
              </div>
              <h3 className="text-[20px] sm:text-[24px] md:text-[26px] font-heading font-bold text-[#070707]">
                No user counts here.
              </h3>
              <p className="text-[13px] sm:text-[15px] text-[#5E5E5E] max-w-[680px] leading-[1.6]">
                We&apos;re in closed alpha — when the numbers are real, we&apos;ll show them.
              </p>
            </div>

            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white flex items-center justify-center text-[#3C61DD] shadow-sm shrink-0">
              <ArrowUpRight size={18} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
