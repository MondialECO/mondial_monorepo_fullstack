'use client';

import Link from 'next/link';
import { Check, ArrowRight } from 'lucide-react';

export default function FigmaHero() {
  return (
    <section className="w-full pt-28 pb-12 sm:pt-36 sm:pb-16 md:pt-40 md:pb-24 px-4 sm:px-6 lg:px-8 bg-background flex justify-center">
      <div className="w-full max-w-[1280px] flex flex-col items-start gap-10 sm:gap-12">
        {/* Top Content */}
        <div className="flex flex-col items-start gap-5 sm:gap-6 max-w-[840px]">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F1F1F2] border border-[rgba(0,0,0,0.06)] text-[11px] sm:text-[12px] font-medium text-[#3E3E3E] max-w-full">
            <span className="w-2 h-2 rounded-full bg-[#00C896] animate-pulse shrink-0" />
            <span className="truncate">Closed alpha · Onboarding founders by application</span>
          </div>

          {/* Heading */}
          <h1 className="text-[32px] sm:text-[48px] md:text-[56px] lg:text-[64px] font-heading font-bold text-[#070707] leading-[1.1] sm:leading-[1.08] tracking-[-0.03em]">
            Europe&apos;s guided path from raw idea to funded company.
          </h1>

          {/* Subtitle */}
          <p className="text-[15px] sm:text-[17px] md:text-[18px] text-[#5E5E5E] leading-[1.6] max-w-[760px]">
            One platform connecting creators, entrepreneurs, service providers and investors —
            through six structured phases, an AI-generated business plan and forecast, and a
            readiness score that means something.
          </p>

          {/* Primary CTA */}
          <div className="pt-2">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-6 sm:px-7 py-3 sm:py-3.5 bg-[#3C61DD] hover:bg-[#3252BF] text-white font-medium text-[15px] sm:text-[16px] rounded-[10px] transition-all shadow-sm group focus:outline-none focus:ring-2 focus:ring-[#3C61DD]/40"
            >
              <span>Get Started Now</span>
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        {/* 4 Role Preview Mini Cards */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Card 1: Creator */}
          <div className="bg-[#F9F9FA] border border-[rgba(0,0,0,0.08)] rounded-[16px] p-5 flex flex-col justify-between min-h-[290px] h-auto transition-all hover:shadow-md">
            <div className="flex flex-col gap-3">
              <div>
                <h3 className="font-heading font-semibold text-[18px] text-[#070707]">Creator</h3>
                <p className="text-[12px] text-[#5E5E5E]">Turn an idea into proof.</p>
              </div>

              {/* Mockup Box */}
              <div className="bg-white rounded-[10px] p-3 border border-[rgba(0,0,0,0.06)] flex flex-col gap-2 mt-2">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-[#8A8B8F]">
                  Business Plan
                </span>
                <div className="flex flex-col gap-1.5 text-[11px] text-[#3E3E3E]">
                  <div className="flex items-center justify-between">
                    <span>Market analysis</span>
                    <Check size={12} className="text-[#00C896]" strokeWidth={3} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Revenue model</span>
                    <Check size={12} className="text-[#00C896]" strokeWidth={3} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Competition</span>
                    <Check size={12} className="text-[#00C896]" strokeWidth={3} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Risk register</span>
                    <Check size={12} className="text-[#00C896]" strokeWidth={3} />
                  </div>
                </div>
              </div>
            </div>

            <Link
              href="/for-creators"
              className="text-[13px] font-medium text-[#3C61DD] hover:underline inline-flex items-center gap-1 pt-4"
            >
              Explore <span aria-hidden="true">→</span>
            </Link>
          </div>

          {/* Card 2: Entrepreneur */}
          <div className="bg-[#F9F9FA] border border-[rgba(0,0,0,0.08)] rounded-[16px] p-5 flex flex-col justify-between min-h-[290px] h-auto transition-all hover:shadow-md">
            <div className="flex flex-col gap-3">
              <div>
                <h3 className="font-heading font-semibold text-[18px] text-[#070707]">Entrepreneur</h3>
                <p className="text-[12px] text-[#5E5E5E]">Launch, grow, and scale with confidence.</p>
              </div>

              {/* Mockup Box */}
              <div className="bg-white rounded-[10px] p-3 border border-[rgba(0,0,0,0.06)] flex flex-col gap-2 mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-[#8A8B8F]">
                    Growth Score
                  </span>
                  <span className="text-[12px] font-bold text-[#3C61DD]">85/100</span>
                </div>
                <div className="flex flex-col gap-1.5 text-[11px] text-[#3E3E3E]">
                  <div className="flex items-center justify-between">
                    <span>Market validation</span>
                    <span className="font-medium">22/25</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Revenue traction</span>
                    <span className="font-medium">18/25</span>
                  </div>
                </div>
              </div>
            </div>

            <Link
              href="/for-entrepreneurs"
              className="text-[13px] font-medium text-[#3C61DD] hover:underline inline-flex items-center gap-1 pt-4"
            >
              Explore <span aria-hidden="true">→</span>
            </Link>
          </div>

          {/* Card 3: Service Provider (Active Blue Card in Figma) */}
          <div className="bg-[#3C61DD] text-white rounded-[16px] p-5 flex flex-col justify-between min-h-[290px] h-auto shadow-lg transition-all hover:scale-[1.02]">
            <div className="flex flex-col gap-3">
              <div>
                <h3 className="font-heading font-semibold text-[18px] text-white">Service Provider</h3>
                <p className="text-[12px] text-white/80">Work with serious founders.</p>
              </div>

              {/* Mockup Box */}
              <div className="bg-white/10 backdrop-blur-sm rounded-[10px] p-3 border border-white/15 flex flex-col gap-2 mt-2">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-white/70">
                  Open Briefs
                </span>
                <div className="flex flex-col gap-1.5 text-[11px] text-white">
                  <div className="flex items-center justify-between">
                    <span>Brand identity · P2</span>
                    <span className="font-semibold">€1,200</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Landing page · P4</span>
                    <span className="font-semibold">€2,400</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Cap table review · P4</span>
                    <span className="font-semibold">€2,400</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Pitch design · P6</span>
                    <span className="font-semibold">€2,400</span>
                  </div>
                </div>
              </div>
            </div>

            <Link
              href="/for-service-providers"
              className="text-[13px] font-medium text-white hover:underline inline-flex items-center gap-1 pt-4"
            >
              Explore <span aria-hidden="true">→</span>
            </Link>
          </div>

          {/* Card 4: Investor */}
          <div className="bg-[#F9F9FA] border border-[rgba(0,0,0,0.08)] rounded-[16px] p-5 flex flex-col justify-between min-h-[290px] h-auto transition-all hover:shadow-md">
            <div className="flex flex-col gap-3">
              <div>
                <h3 className="font-heading font-semibold text-[18px] text-[#070707]">Investor</h3>
                <p className="text-[12px] text-[#5E5E5E]">Dealflow with homework done.</p>
              </div>

              {/* Mockup Box */}
              <div className="bg-white rounded-[10px] p-3 border border-[rgba(0,0,0,0.06)] flex flex-col gap-2 mt-2">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-[#8A8B8F]">
                  Pipeline
                </span>
                <div className="flex flex-col gap-1.5 text-[11px] text-[#3E3E3E]">
                  <div className="flex items-center justify-between">
                    <span>Introduced</span>
                    <span className="font-semibold">7</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>NDA signed</span>
                    <span className="font-semibold">4</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>In diligence</span>
                    <span className="font-semibold">2</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Term sheet</span>
                    <span className="font-semibold">1</span>
                  </div>
                </div>
              </div>
            </div>

            <Link
              href="/for-investors"
              className="text-[13px] font-medium text-[#3C61DD] hover:underline inline-flex items-center gap-1 pt-4"
            >
              Explore <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
