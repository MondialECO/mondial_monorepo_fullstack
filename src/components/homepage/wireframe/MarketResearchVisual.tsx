'use client';

import React from 'react';
import Image from 'next/image';
import { Check } from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';

export default function MarketResearchVisual() {
  const { t } = useLanguage();

  return (
    <div
      className="w-full flex items-center justify-center overflow-visible select-none h-[340px] xs:h-[400px] sm:h-[480px] md:h-[540px] lg:h-[600px] xl:h-[640px] my-0"
      data-testid="market-research-visual"
    >
      {/* ========================================================================= */}
      {/* 780x640 Fixed Coordinate Canvas — Pixel-Perfect Figma 57500:913 Mapping */}
      {/* ========================================================================= */}
      <div className="relative w-[780px] h-[640px] shrink-0 scale-[0.44] xs:scale-[0.52] sm:scale-[0.66] md:scale-[0.76] lg:scale-[0.88] xl:scale-100 origin-center pointer-events-auto">
        
        {/* ======================================================================= */}
        {/* 1. Official Figma Sparkles (Figma 57500:914) */}
        {/* Inlined zero-latency SVG vector paths matching Figma exact coordinates */}
        {/* ======================================================================= */}
        <svg
          className="absolute inset-0 w-[780px] h-[640px] pointer-events-none z-0 overflow-visible"
          viewBox="0 0 780 640"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Top-Left Blue Sparkle */}
          <path
            d="M232 128C234.667 140 241.333 147.333 252 150C241.333 152.667 234.667 160 232 172C229.333 160 222.667 152.667 212 150C222.667 147.333 229.333 140 232 128Z"
            fill="#3C61DD"
          />
          {/* Top-Left Green Sparkle */}
          <path
            d="M258 122C259.333 127.333 262 130.667 266 132C262 133.333 259.333 136.667 258 142C256.667 136.667 254 133.333 250 132C254 130.667 256.667 127.333 258 122Z"
            fill="#157A55"
          />
          {/* Mid-Left Blue Sparkle */}
          <path
            d="M70 280C72.6667 294.667 80.6667 303.333 94 306C80.6667 308.667 72.6667 317.333 70 332C67.3333 317.333 59.3333 308.667 46 306C59.3333 303.333 67.3333 294.667 70 280Z"
            fill="#3C61DD"
          />
          {/* Mid-Left Green Sparkle */}
          <path
            d="M98 322C100 330 104.667 334.667 112 336C104.667 337.333 100 342 98 350C96 342 91.3333 337.333 84 336C91.3333 334.667 96 330 98 322Z"
            fill="#157A55"
          />
          {/* Mid-Right Blue Sparkle */}
          <path
            d="M716 300C718.667 313.333 726 321.333 738 324C726 326.667 718.667 334.667 716 348C713.333 334.667 706 326.667 694 324C706 321.333 713.333 313.333 716 300Z"
            fill="#3C61DD"
          />
          {/* Mid-Right Green Sparkle */}
          <path
            d="M690 268C692 277.333 697.333 283 706 285C697.333 287 692 292.667 690 302C688 292.667 682.667 287 674 285C682.667 283 688 277.333 690 268Z"
            fill="#157A55"
          />
        </svg>

        {/* ======================================================================= */}
        {/* 2. Official Figma Dashed Arrows (Figma 57500:1010) */}
        {/* Inlined zero-latency SVG Bézier curves with exact dash array [9, 9] */}
        {/* ======================================================================= */}
        <svg
          className="absolute inset-0 w-[780px] h-[640px] pointer-events-none z-10 overflow-visible"
          viewBox="0 0 780 640"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Top-Left Arrow to Tablet (Blue) */}
          <path
            d="M176 300C174.366 300 172.764 299.968 171.195 299.903M108 226C108 227.624 108.025 229.226 108.075 230.805M108.723 240.388C109.071 243.666 109.547 246.827 110.153 249.867M112.545 259.168C113.55 262.303 114.729 265.276 116.085 268.082M120.944 276.346C122.81 278.976 124.888 281.403 127.186 283.619M134.683 289.587C137.295 291.292 140.112 292.798 143.141 294.097M152.224 297.199C155.193 297.982 158.326 298.604 161.624 299.062"
            strokeWidth="3.5"
            strokeLinecap="round"
            stroke="#3C61DD"
          />
          <path
            d="M96 238L108 222L121 236"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            stroke="#3C61DD"
          />

          {/* Top-Right Arrow to Target users (Green) */}
          <path
            d="M520 162C519.927 160.392 519.873 158.822 519.836 157.288M548 100C546.411 100.177 544.869 100.462 543.38 100.866M519.854 147.876C519.953 144.544 520.154 141.418 520.452 138.488M521.843 129.193C522.527 125.851 523.374 122.84 524.37 120.139M528.55 111.747C530.431 108.929 532.577 106.672 534.95 104.912"
            strokeWidth="3.5"
            strokeLinecap="round"
            stroke="#157A55"
          />
          <path
            d="M536 88L552 100L538 113"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            stroke="#157A55"
          />

          {/* Bottom-Left Arrow from Competitors (Blue) */}
          <path
            d="M176 396C174.564 396 173.153 396.015 171.767 396.045M110 434C110.12 432.566 110.303 431.168 110.553 429.806M112.998 421.727C114.136 419.142 115.587 416.733 117.366 414.509M123.41 408.618C125.536 406.983 127.923 405.498 130.58 404.167M138.404 400.96C140.941 400.116 143.659 399.376 146.561 398.743M154.891 397.289C157.566 396.928 160.371 396.641 163.307 396.431"
            strokeWidth="3.5"
            strokeLinecap="round"
            stroke="#3C61DD"
          />
          <path
            d="M98 424L110 440L123 426"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            stroke="#3C61DD"
          />

          {/* Bottom-Right Arrow to Demand (Green) */}
          <path
            d="M604 396C605.489 396 606.953 396.021 608.392 396.063M674 456C674 454.509 673.966 453.042 673.898 451.601M617.163 396.608C620.192 396.903 623.094 397.304 625.871 397.809M634.418 399.804C637.342 400.652 640.097 401.638 642.685 402.76M650.452 406.836C652.99 408.437 655.317 410.207 657.435 412.143M663.32 418.645C665.055 420.975 666.574 423.474 667.88 426.136M671.075 434.307C671.898 437.029 672.545 439.885 673.019 442.869"
            strokeWidth="3.5"
            strokeLinecap="round"
            stroke="#157A55"
          />
          <path
            d="M661 446L674 462L687 448"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            stroke="#157A55"
          />
        </svg>

        {/* ======================================================================= */}
        {/* 3. Center Tablet (Figma 57500:921: pos 180, 170, size 420x290) */}
        {/* ======================================================================= */}
        <div
          className="absolute left-[180px] top-[170px] w-[420px] h-[290px] rounded-[28px] bg-[#111827] shadow-[0_40px_60px_-30px_rgba(17,24,39,0.40)] p-3 z-10 flex items-center justify-center transition-transform hover:scale-[1.01]"
          style={{ willChange: 'transform' }}
        >
          <div className="relative w-[396px] h-[266px] rounded-[18px] overflow-hidden bg-white dark:bg-[#0c121e]">
            <Image
              src="/wireframe_figma/market_research_screen.svg"
              alt="Market research dashboard on tablet"
              width={396}
              height={266}
              className="w-full h-full object-cover select-none pointer-events-none"
              priority
            />
          </div>
        </div>

        {/* ======================================================================= */}
        {/* 4. Satellite Card 1: Market size (Figma 57500:964: 220x187, -8deg, pos 10, -8) */}
        {/* ======================================================================= */}
        <div
          className="absolute left-[10px] top-[-8px] w-[220px] rounded-[22px] bg-white dark:bg-card border border-[#e5e7eb] dark:border-border/80 shadow-[0_20px_40px_-24px_rgba(17,24,39,0.22)] p-[18px] space-y-2.5 z-20 transition-all hover:scale-105 hover:z-30 cursor-default"
          style={{ transform: 'rotate(-8deg)' }}
        >
          {/* Card Title (Syne 800 20px) */}
          <h3 className="font-heading font-extrabold text-[20px] leading-tight text-[#111827] dark:text-white">
            {t('homepage.wireframe.marketResearch.marketSizeCardTitle', 'Market size')}
          </h3>

          {/* Market Size Box */}
          <div className="rounded-[14px] bg-[#eef2fd] dark:bg-blue-950/40 p-3 space-y-1">
            <span className="text-[28px] sm:text-[30px] font-extrabold text-[#3c61dd] font-heading block leading-none tracking-tight">
              {t('homepage.wireframe.marketResearch.marketSizeAmount', '€1.2B')}
            </span>
            <span className="text-[11px] text-[#6b7280] dark:text-zinc-400 font-mono block pt-0.5">
              {t('homepage.wireframe.marketResearch.marketSizeSub', 'addressable market')}
            </span>
            <span className="text-[11px] font-bold text-[#111827] dark:text-white block pt-1.5 border-t border-[#d8e2fd] dark:border-blue-900/60 font-sans">
              {t('homepage.wireframe.marketResearch.marketSizeDetail', 'SAM €180M · SOM €4.5M')}
            </span>
          </div>

          {/* Check Badge (Figma 57500:970: 50x50, r 22, bg #157a55, border 4px white) */}
          <div
            className="absolute -top-3.5 -right-3.5 w-[50px] h-[50px] rounded-full bg-[#157a55] border-[4px] border-white dark:border-background flex items-center justify-center shadow-md select-none"
            aria-hidden="true"
          >
            <Check className="w-5 h-5 text-white stroke-[3]" />
          </div>
        </div>

        {/* ======================================================================= */}
        {/* 5. Satellite Card 2: Target users (Figma 57500:973: 247x225, +9deg, pos 528, 10) */}
        {/* ======================================================================= */}
        <div
          className="absolute left-[528px] top-[10px] w-[247px] rounded-[22px] bg-white dark:bg-card border border-[#e5e7eb] dark:border-border/80 shadow-[0_20px_40px_-24px_rgba(17,24,39,0.22)] p-[18px] space-y-2.5 z-20 transition-all hover:scale-105 hover:z-30 cursor-default"
          style={{ transform: 'rotate(9deg)' }}
        >
          {/* Card Title */}
          <h3 className="font-heading font-extrabold text-[20px] leading-tight text-[#111827] dark:text-white">
            {t('homepage.wireframe.marketResearch.targetUsersCardTitle', 'Target users')}
          </h3>

          {/* 3 User Target Segments */}
          <div className="space-y-1.5 pt-0.5">
            <div className="flex items-center gap-2.5 p-2 rounded-[12px] bg-[#f4f5f7] dark:bg-zinc-800/60">
              <span className="w-[26px] h-[26px] rounded-[9px] bg-[#3c61dd] text-white text-[11px] font-mono font-bold flex items-center justify-center shrink-0">
                01
              </span>
              <span className="font-sans font-semibold text-[14px] text-[#111827] dark:text-white">
                {t('homepage.wireframe.marketResearch.segment1', 'Retailers')}
              </span>
            </div>
            <div className="flex items-center gap-2.5 p-2 rounded-[12px] bg-[#f4f5f7] dark:bg-zinc-800/60">
              <span className="w-[26px] h-[26px] rounded-[9px] bg-[#eef2fd] dark:bg-blue-950/60 text-[#3c61dd] text-[11px] font-mono font-bold flex items-center justify-center shrink-0">
                02
              </span>
              <span className="font-sans font-semibold text-[14px] text-[#111827] dark:text-white">
                {t('homepage.wireframe.marketResearch.segment2', 'Café owners')}
              </span>
            </div>
            <div className="flex items-center gap-2.5 p-2 rounded-[12px] bg-[#f4f5f7] dark:bg-zinc-800/60">
              <span className="w-[26px] h-[26px] rounded-[9px] bg-[#eef2fd] dark:bg-blue-950/60 text-[#3c61dd] text-[11px] font-mono font-bold flex items-center justify-center shrink-0">
                03
              </span>
              <span className="font-sans font-semibold text-[14px] text-[#111827] dark:text-white">
                {t('homepage.wireframe.marketResearch.segment3', 'Market traders')}
              </span>
            </div>
          </div>
        </div>

        {/* ======================================================================= */}
        {/* 6. Satellite Card 3: Competitors (Figma 57500:987: 241x212, -7deg, pos 0, 420) */}
        {/* ======================================================================= */}
        <div
          className="absolute left-[0px] top-[420px] w-[241px] rounded-[22px] bg-white dark:bg-card border border-[#e5e7eb] dark:border-border/80 shadow-[0_20px_40px_-24px_rgba(17,24,39,0.22)] p-[18px] space-y-2.5 z-20 transition-all hover:scale-105 hover:z-30 cursor-default"
          style={{ transform: 'rotate(-7deg)' }}
        >
          {/* Card Title */}
          <h3 className="font-heading font-extrabold text-[20px] leading-tight text-[#111827] dark:text-white">
            {t('homepage.wireframe.marketResearch.competitorsCardTitle', 'Competitors')}
          </h3>

          {/* 3 Competitors Rows */}
          <div className="space-y-1.5 pt-0.5">
            <div className="flex items-center justify-between p-2 rounded-[12px] bg-[#f4f5f7] dark:bg-zinc-800/60">
              <span className="font-sans font-semibold text-[13px] text-[#111827] dark:text-white">
                Zettle / Square
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#eef2fd] dark:bg-blue-950/60 text-[#3c61dd] dark:text-blue-300 font-mono text-[10.5px] font-medium">
                vs you
              </span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-[12px] bg-[#f4f5f7] dark:bg-zinc-800/60">
              <span className="font-sans font-semibold text-[13px] text-[#111827] dark:text-white">
                Sage / Cegid
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#eef2fd] dark:bg-blue-950/60 text-[#3c61dd] dark:text-blue-300 font-mono text-[10.5px] font-medium">
                vs you
              </span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-[12px] bg-[#f4f5f7] dark:bg-zinc-800/60">
              <span className="font-sans font-semibold text-[13px] text-[#111827] dark:text-white">
                Excel & paper
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#eef2fd] dark:bg-blue-950/60 text-[#3c61dd] dark:text-blue-300 font-mono text-[10.5px] font-medium">
                vs you
              </span>
            </div>
          </div>
        </div>

        {/* ======================================================================= */}
        {/* 7. Satellite Card 4: Demand (Figma 57500:1001: 249x198, +7deg, pos 520, 468) */}
        {/* ======================================================================= */}
        <div
          className="absolute left-[520px] top-[468px] w-[249px] rounded-[22px] bg-white dark:bg-card border border-[#e5e7eb] dark:border-border/80 shadow-[0_20px_40px_-24px_rgba(17,24,39,0.22)] p-[18px] space-y-2 z-20 transition-all hover:scale-105 hover:z-30 cursor-default"
          style={{ transform: 'rotate(7deg)' }}
        >
          {/* Card Title */}
          <h3 className="font-heading font-extrabold text-[20px] leading-tight text-[#111827] dark:text-white">
            {t('homepage.wireframe.marketResearch.demandCardTitle', 'Demand')}
          </h3>

          {/* Floating Pill · Gap found (Figma 57500:1005: 122x40, DM Sans 600 14px) */}
          <div
            className="absolute -top-3.5 -right-3 px-3 py-1 rounded-full bg-[#e8f3ee] dark:bg-emerald-950/60 border border-[#bfe0d1] dark:border-emerald-800 text-[#157a55] dark:text-emerald-300 text-[13px] leading-[18px] font-semibold flex items-center gap-1.5 shadow-sm select-none"
            style={{ transform: 'rotate(-4deg)' }}
          >
            <div className="w-4 h-4 rounded-full bg-[#157a55] flex items-center justify-center text-white">
              <Check className="w-2.5 h-2.5 stroke-[3]" />
            </div>
            <span>Gap found</span>
          </div>

          {/* Big Percentage Value: 68% (Figma 57500:1003: Syne 800 32px lh 38px) */}
          <div className="font-heading font-extrabold text-[32px] sm:text-[36px] leading-[40px] text-[#157a55]">
            {t('homepage.wireframe.marketResearch.demandValue', '68%')}
          </div>

          {/* Description (Figma 57500:1004: DM Sans 500 13px lh 18px) */}
          <p className="font-sans font-medium text-[13px] leading-[18px] text-[#111827] dark:text-zinc-200">
            {t(
              'homepage.wireframe.marketResearch.demandDesc',
              'of independent retailers in France still track stock by hand.'
            )}
          </p>
        </div>

      </div>
    </div>
  );
}
