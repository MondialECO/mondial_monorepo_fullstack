'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/providers/LanguageProvider';

export default function FigmaFinalCta() {
  const { t } = useLanguage();

  return (
    <section 
      id="final-cta" 
      className="relative w-full overflow-hidden py-16 sm:py-20 lg:py-24 px-4 sm:px-6 md:px-8 lg:px-[45px] bg-white dark:bg-background"
      data-testid="figma-final-cta"
    >
      <div className="w-full max-w-[1350px] 2xl:max-w-[1520px] mx-auto">
        
        {/* ========================================================================= */}
        {/* Banner Container (Figma 57554:13613 - 1080x306px, r:36px, bg:gradient-blue) */}
        {/* ========================================================================= */}
        <div className="w-full rounded-[24px] sm:rounded-[36px] bg-gradient-to-br from-[#1f3faf] via-[#2445b8] to-[#3c61dd] text-white p-8 sm:p-12 lg:p-[64px] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 lg:gap-[46px] shadow-2xl relative overflow-hidden">
          
          {/* Ambient subtle decorative background glow */}
          <div 
            className="absolute -top-24 -right-24 w-96 h-96 rounded-full pointer-events-none opacity-30 blur-3xl"
            style={{ background: 'radial-gradient(circle, #6f8bff 0%, transparent 70%)' }}
          />

          {/* Left Text Block (Figma 57554:13614 - 700px max width) */}
          <div className="max-w-[700px] space-y-3 relative z-10">
            {/* Headline (Figma 57554:13615 - Inter 600 56px lh:57.12px) */}
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[56px] font-semibold text-white tracking-tight leading-[1.05] font-heading">
              {t('homepage.finalCta.headline')}
            </h2>

            {/* Description (Figma 57554:13616 - Inter 400 16px lh:24.8px) */}
            <p className="text-base sm:text-lg md:text-[16px] text-white/90 leading-relaxed font-sans font-normal pt-1 max-w-[620px]">
              {t('homepage.finalCta.description')}
            </p>
          </div>

          {/* Right Action Button (Figma 57554:13617 - min-w 175px, h:48px, r:13px bg:#ffffff text:#1f3faf) */}
          <div className="shrink-0 w-full sm:w-auto relative z-10">
            <Link
              href="/signup"
              className="w-full sm:w-auto min-w-[175px] px-6 h-[48px] rounded-[13px] bg-white hover:bg-white/95 text-[#1f3faf] font-bold text-base inline-flex items-center justify-center text-center whitespace-nowrap shadow-lg transition-all active:scale-[0.98] font-heading"
            >
              {t('homepage.finalCta.button')}
            </Link>
          </div>

        </div>

      </div>
    </section>
  );
}
