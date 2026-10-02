'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function FigmaHero() {
  const scrollToHowItWorks = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById('how-it-works');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative w-full overflow-hidden pt-12 pb-14 sm:pt-16 sm:pb-20 md:pt-20 md:pb-28 bg-white dark:bg-background border-b border-[#e8ecf2] dark:border-border">

      {/* Centered Hero Container */}
      <div className="w-full max-w-[1440px] xl:max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 flex flex-col items-center text-center">

        {/* Eyebrow Badge (Figma 57381:10451 - 194x33px) */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#e8eeff] text-[#1f3faf] text-[12px] font-medium font-sans shadow-2xs mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3c61dd] shrink-0" />
          <span>MBC Creator · France</span>
        </div>

        {/* Headline (Figma 57354:15961 - Inter 600 54px lh:65 - 628px width) */}
        <h1 className="max-w-[628px] text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-semibold text-[#000000] dark:text-foreground tracking-tight leading-[1.12] font-heading mb-4">
          Start your digital<br className="hidden sm:inline" /> business for €0.
        </h1>

        {/* Subtitle (Figma 57354:15962 - DM Sans 400 18px) */}
        <p className="max-w-[640px] text-base sm:text-lg md:text-[18px] text-[#000000]/80 dark:text-muted-foreground leading-relaxed font-sans font-normal mb-8 px-2">
          One idea is enough. MBC helps you build your project, generate your documents and prepare for your launch.
        </p>

        {/* Hero Actions (Figma 57354:15964 - 628px container) */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto mb-10 px-4">
          {/* Start for €0 → Button (Figma 57354:15965 - 153x48px r:13 bg:#3c61dd) */}
          <Link
            href="/signup"
            className="w-full sm:w-[153px] h-[48px] rounded-[13px] bg-[#3c61dd] hover:bg-[#3252c0] text-white font-extrabold text-[16px] flex items-center justify-center shadow-md transition-all active:scale-[0.98] font-heading"
          >
            Start for €0 →
          </Link>

          {/* See how it works Button (Figma 57354:15967 - 176x48px r:13 bg:#ffffff border:#e6eaf2) */}
          <a
            href="#how-it-works"
            onClick={scrollToHowItWorks}
            className="w-full sm:w-[176px] h-[48px] rounded-[13px] bg-white dark:bg-card border border-[#e6eaf2] dark:border-border text-[#121826] dark:text-foreground hover:bg-accent font-extrabold text-[16px] flex items-center justify-center shadow-2xs transition-all active:scale-[0.98] font-heading"
          >
            See how it works
          </a>
        </div>

        {/* Hero Visual Mockup Deck (Figma 57358:15972 3D 0€ Graphic + 57351:15342 Henry Dashboard) */}
        <div className="relative w-full max-w-[996px] mx-auto mt-2 sm:mt-4 flex flex-col items-center px-2">
          {/* 3D 0€ Atmospheric Background Graphic (996x339px) */}
          <div className="relative w-full max-w-[996px] h-auto pointer-events-none -mb-12 sm:-mb-22 md:-mb-32 z-0 flex items-center justify-center">
            <Image
              src="/homepage_figma/gemini_generated_image_ywk6ghywk6ghywk6_1_15f9ec9f.png"
              alt="Mondial 0€ 3D Graphic"
              width={996}
              height={339}
              className="w-full max-w-[996px] h-auto object-contain"
              priority
            />
          </div>

          {/* Product Dashboard Screenshot (724x507px r:14) */}
          <div className="relative z-0 w-full max-w-[724px] rounded-[14px] overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3),0_12px_24px_-8px_rgba(0,0,0,0.15)] border border-[#e2e8f0] dark:border-border bg-white dark:bg-card -mb-16 sm:-mb-20 md:-mb-24">
            <Image
              src="/homepage_figma/screenshot_2026-10-02_at_3_00_34_am_1_fde9301e.png"
              alt="Good morning, Henry - MBC Creator Platform"
              width={724}
              height={507}
              className="w-full h-auto object-cover"
              priority
            />
          </div>
        </div>

      </div>
    </section>
  );
}

