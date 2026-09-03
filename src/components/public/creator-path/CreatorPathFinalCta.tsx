'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function CreatorPathFinalCta() {
  const phases = [
    { title: 'IDEA (You are here)', current: true },
    { title: 'VERIFY', current: false },
    { title: 'DEFINE', current: false },
    { title: 'VALIDATE', current: false },
    { title: 'PREPARE', current: false },
    { title: 'DECIDE / LEVEL UP', current: false },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-t border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1224px] grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
        {/* Left: Journey Progress List (4 cols) */}
        <div className="lg:col-span-5 bg-[#FAF8FF] border border-[rgba(0,0,0,0.06)] rounded-[24px] p-6 sm:p-8 flex flex-col gap-5 shadow-xs">
          <span className="text-[12px] font-bold text-[#747685] uppercase tracking-wider">
            CREATOR PATH | 6 PHASES
          </span>
          <div className="flex flex-col gap-3">
            {phases.map((p) => (
              <div key={p.title} className="flex items-center gap-3">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    p.current ? 'bg-[#3C61DD]' : 'bg-[#C4C5D6]'
                  }`}
                />
                <span
                  className={`text-[13px] ${
                    p.current ? 'font-bold text-[#3C61DD]' : 'font-medium text-[#444654]'
                  }`}
                >
                  {p.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Final Call To Action (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="flex flex-col gap-2.5">
            <span className="text-[12px] font-bold text-[#747685] uppercase tracking-wider">
              START WITH WHAT YOU HAVE
            </span>
            <h2 className="text-[32px] sm:text-[40px] font-heading font-extrabold text-[#1A1B23] leading-[1.15] tracking-tight">
              Your idea does not need to be finished.
            </h2>
            <p className="text-[15px] sm:text-[16px] text-[#444654] leading-[1.6]">
              Start with the idea. Mondial will help you turn it into a structured project ready for validation, funding, or buyout.
            </p>
          </div>

          <div>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-[#3C61DD] hover:bg-[#3252BF] text-white font-medium text-[16px] rounded-[10px] transition-all shadow-sm group focus:outline-none focus:ring-2 focus:ring-[#3C61DD]/40"
            >
              <span>Get Started Now</span>
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
