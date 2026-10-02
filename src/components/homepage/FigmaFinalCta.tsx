'use client';

import React from 'react';
import Link from 'next/link';

export default function FigmaFinalCta() {
  return (
    <section className="w-full py-16 md:py-24 bg-white dark:bg-background">
      <div className="w-full max-w-[1440px] xl:max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
        
        {/* Banner Container (Figma 57354:15832) */}
        <div className="w-full max-w-[1360px] mx-auto rounded-[24px] sm:rounded-[36px] bg-gradient-to-r from-[#1f3faf] via-[#2a4ec4] to-[#3c61dd] text-white p-6 sm:p-10 md:p-14 lg:p-16 flex flex-col lg:flex-row items-start lg:items-end justify-between gap-8 shadow-2xl relative overflow-hidden">
          
          {/* Left Text Block (700px max width) */}
          <div className="max-w-[700px] space-y-4">
            <h2 className="text-3xl sm:text-4xl lg:text-[56px] font-semibold text-white tracking-tight leading-[1.08] font-heading">
              Your business starts with a<br className="hidden sm:inline" /> first step.
            </h2>

            <p className="text-base sm:text-lg md:text-[18px] text-white/95 leading-relaxed font-sans font-normal max-w-[663px]">
              Create your free MBC Creator profile and start turning your idea into a structured digital business.
            </p>
          </div>

          {/* Right Action Button (175x48px r:13 bg:#ffffff text:#1f3faf) */}
          <div className="shrink-0 w-full sm:w-auto">
            <Link
              href="/signup"
              className="w-full sm:w-[175px] h-[48px] rounded-[13px] bg-white hover:bg-white/95 text-[#1f3faf] font-bold text-base flex items-center justify-center shadow-lg transition-all active:scale-[0.98] font-heading"
            >
              Start for €0 →
            </Link>
          </div>

        </div>

      </div>
    </section>
  );
}
