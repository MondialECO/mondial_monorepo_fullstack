'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/providers/LanguageProvider';

export default function FigmaFinalCta() {
  const { t } = useLanguage();

  return (
    <section className="w-full py-16 md:py-24 bg-white dark:bg-background">
      <div className="w-full max-w-[1440px] 2xl:max-w-[1920px] mx-auto px-4 sm:px-6 md:px-8 lg:px-[45px]">
        
        {/* Banner Container (Figma 57354:15832 - r:36 bg:gradient-blue) */}
        <div className="w-full max-w-[1360px] mx-auto rounded-[24px] sm:rounded-[36px] bg-gradient-to-r from-[#1f3faf] via-[#2a4ec4] to-[#3c61dd] text-white p-6 sm:p-10 md:p-14 lg:p-16 flex flex-col lg:flex-row items-start lg:items-end justify-between gap-8 shadow-2xl relative overflow-hidden">
          
          {/* Left Text Block (700px max width) */}
          <div className="max-w-[700px] space-y-4">
            <h2 className="text-3xl sm:text-4xl lg:text-[56px] font-semibold text-white tracking-tight leading-[1.08] font-heading">
              {t('homepage.finalCta.headline')}
            </h2>

            <p className="text-base sm:text-lg md:text-[18px] text-white/95 leading-relaxed font-sans font-normal max-w-[663px]">
              {t('homepage.finalCta.description')}
            </p>
          </div>

          {/* Right Action Button (min-w 175px, h:48px, r:13 bg:#ffffff text:#1f3faf) */}
          <div className="shrink-0 w-full sm:w-auto">
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
