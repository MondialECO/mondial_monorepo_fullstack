'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/providers/LanguageProvider';

export default function WireframeHero() {
  const { t } = useLanguage();

  return (
    <section
      className="w-full bg-[#f7f9fc] dark:bg-[#08090a] min-h-[560px] lg:h-[740px] flex items-center justify-center px-4 sm:px-6 relative overflow-hidden"
      data-testid="wireframe-hero"
    >
      <div className="w-full max-w-[954px] mx-auto flex flex-col items-center text-center">
        {/* Eyebrow Badge (Figma 57480:112: 194x33, gap 8, pad 6/12, radius 9999, bg #e8eeff) */}
        <div className="inline-flex items-center gap-[8px] px-[12px] py-[6px] rounded-full bg-[#e8eeff] dark:bg-blue-950/60 mb-[14px]">
          <span
            className="w-[6px] h-[6px] rounded-full bg-[#3c61dd] shrink-0"
            aria-hidden="true"
          />
          <span className="font-sans font-normal text-[12px] leading-[20px] tracking-[1.04px] uppercase text-[#1f3faf] dark:text-blue-300 select-none">
            {t('homepage.wireframe.hero.eyebrow', 'MBC Creator · France')}
          </span>
        </div>

        {/* Headline (Figma 57480:120: Inter 600, 54px, lh 65px, uppercase, #000000, max-w 954px) */}
        <h1 className="w-full max-w-[954px] text-[32px] sm:text-[44px] lg:text-[54px] font-semibold leading-[1.2] lg:leading-[65px] font-heading uppercase text-black dark:text-white tracking-normal mb-[14px]">
          {t('homepage.wireframe.hero.headline', 'Move from “I have an idea” to real business-ready outputs.')}
        </h1>

        {/* Subtitle (Figma 57480:121: DM Sans 400, 16px, lh 18px, #000000, max-w 760px) */}
        <p className="w-full max-w-[760px] text-[15px] sm:text-[16px] font-normal leading-[24px] sm:leading-[18px] font-sans text-black dark:text-zinc-300 mb-[24px]">
          {t(
            'homepage.wireframe.hero.description',
            'MBC Creator helps you create the documents and structure you need to understand your project, explain it clearly, and know what to do next.'
          )}
        </p>

        {/* CTA Action (Figma 57480:122 & 57480:123: 153x48, r 13, bg #3c61dd, Inter 800, 16px, shadow) */}
        <div className="flex items-center justify-center">
          <Link
            href="/auth/register"
            className="w-[153px] h-[48px] rounded-[13px] bg-[#3c61dd] hover:bg-[#3252c0] text-white font-heading font-extrabold text-[16px] leading-[25px] inline-flex items-center justify-center shadow-[0_10px_24px_rgba(60,97,221,0.20)] transition-all duration-150 active:scale-[0.98] select-none"
          >
            {t('homepage.wireframe.hero.cta', 'Start for €0 →')}
          </Link>
        </div>
      </div>
    </section>
  );
}

