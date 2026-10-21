'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';

export default function BrandKitVisual() {
  const { t } = useLanguage();

  return (
    <div
      className="w-full flex items-center justify-center py-4 lg:py-8 overflow-visible select-none"
      data-testid="brand-kit-visual"
    >
      {/* ========================================================================= */}
      {/* 780x640 Fixed Coordinate Canvas — Pixel-Perfect Figma 57500:124 Mapping */}
      {/* ========================================================================= */}
      <div className="relative w-[780px] h-[640px] shrink-0 scale-[0.48] xs:scale-[0.58] sm:scale-[0.72] md:scale-[0.85] lg:scale-[0.92] xl:scale-100 origin-center my-[-155px] xs:my-[-125px] sm:my-[-80px] md:my-[-40px] lg:my-0 pointer-events-auto">
        
        {/* ======================================================================= */}
        {/* 1. Official Figma Sparkles (Figma 57500:125 - Exported directly from API) */}
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
        {/* 2. Official Figma Dashed Arrows (Figma 57500:233 - Exported directly) */}
        {/* ======================================================================= */}
        <svg
          className="absolute inset-0 w-[780px] h-[640px] pointer-events-none z-5 overflow-visible"
          viewBox="0 0 780 640"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Arrow 1: Top-Left (Logo to Tablet - Blue Dashed Bézier) */}
          <path
            d="M176 300C174.366 300 172.764 299.968 171.195 299.903M108 226C108 227.624 108.025 229.226 108.075 230.805M108.723 240.388C109.071 243.666 109.547 246.827 110.153 249.867M112.545 259.168C113.55 262.303 114.729 265.276 116.085 268.082M120.944 276.346C122.81 278.976 124.888 281.403 127.186 283.619M134.683 289.587C137.295 291.292 140.112 292.798 143.141 294.097M152.224 297.199C155.193 297.982 158.326 298.604 161.624 299.062"
            stroke="#3C61DD"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Arrowhead 1 */}
          <path
            d="M96 238L108 222L121 236"
            stroke="#3C61DD"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Arrow 2: Top-Right (Colours to Tablet - Green Dashed Bézier) */}
          <path
            d="M520 162C519.927 160.392 519.873 158.822 519.836 157.288M548 100C546.411 100.177 544.869 100.462 543.38 100.866M519.854 147.876C519.953 144.544 520.154 141.418 520.452 138.488M521.843 129.193C522.527 125.851 523.374 122.84 524.37 120.139M528.55 111.747C530.431 108.929 532.577 106.672 534.95 104.912"
            stroke="#157A55"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Arrowhead 2 */}
          <path
            d="M536 88L552 100L538 113"
            stroke="#157A55"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Arrow 3: Bottom-Left (Typography to Tablet - Blue Dashed Bézier) */}
          <path
            d="M176 396C174.564 396 173.153 396.015 171.767 396.045M110 434C110.12 432.566 110.303 431.168 110.553 429.806M112.998 421.727C114.136 419.142 115.587 416.733 117.366 414.509M123.41 408.618C125.536 406.983 127.923 405.498 130.58 404.167M138.404 400.96C140.941 400.116 143.659 399.376 146.561 398.743M154.891 397.289C157.566 396.928 160.371 396.641 163.307 396.431"
            stroke="#3C61DD"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Arrowhead 3 */}
          <path
            d="M98 424L110 440L123 426"
            stroke="#3C61DD"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Arrow 4: Bottom-Right (Tablet to Brand Kit - Green Dashed Bézier) */}
          <path
            d="M604 396C605.489 396 606.953 396.021 608.392 396.063M674 456C674 454.509 673.966 453.042 673.898 451.601M617.163 396.608C620.192 396.903 623.094 397.304 625.871 397.809M634.418 399.804C637.342 400.652 640.097 401.638 642.685 402.76M650.452 406.836C652.99 408.437 655.317 410.207 657.435 412.143M663.32 418.645C665.055 420.975 666.574 423.474 667.88 426.136M671.075 434.307C671.898 437.029 672.545 439.885 673.019 442.869"
            stroke="#157A55"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Arrowhead 4 */}
          <path
            d="M661 446L674 462L687 448"
            stroke="#157A55"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* ======================================================================= */}
        {/* 3. Central Tablet: AutoInvoice Studio (Figma 57500:132 & 133: x: 180, y: 170, w: 420, h: 290) */}
        {/* ======================================================================= */}
        <div
          className="absolute z-10 w-[420px] h-[290px] rounded-[28px] p-[12px] bg-[#111827] dark:bg-[#08090a] border border-zinc-700/50 shadow-[0_40px_60px_rgba(17,24,39,0.40)] flex items-center justify-center"
          style={{ left: 180, top: 170 }}
        >
          <div className="w-[396px] h-[266px] rounded-[18px] bg-white dark:bg-[#111214] p-[14px] flex flex-col justify-between overflow-hidden border border-zinc-200/80 dark:border-zinc-800">
            {/* Tablet Header Bar */}
            <div className="flex items-center justify-between pb-2 border-b border-[#eef0f3] dark:border-border/60">
              <div className="flex items-center gap-2">
                <div className="w-[22px] h-[22px] rounded-[5px] bg-[#3c61dd] text-white font-bold text-[9px] flex items-center justify-center font-mono">
                  AI
                </div>
                <div>
                  <div className="text-[12px] font-bold text-[#111827] dark:text-foreground leading-none">
                    AutoInvoice
                  </div>
                  <div className="text-[8px] text-[#9ca3af] leading-none mt-0.5">
                    FinTech SaaS · Brand Kit
                  </div>
                </div>
              </div>

              {/* Status pill + action buttons */}
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-full bg-[#e8f3ee] text-[#157a55] text-[8.5px] font-semibold">
                  All six steps complete
                </span>
                <span className="px-2 py-0.5 rounded-[5px] border border-zinc-200 dark:border-zinc-700 text-[8.5px] font-medium text-zinc-600 dark:text-zinc-300">
                  Edit in Studio
                </span>
                <span className="px-2 py-0.5 rounded-[5px] bg-[#3c61dd] text-white text-[8.5px] font-semibold">
                  ↓ Download Brand Kit
                </span>
              </div>
            </div>

            {/* Section 1: Logo Showcase (Figma 57500:148) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-bold text-[#111827] dark:text-foreground">Logo</span>
                <span className="text-[#9ca3af] font-mono text-[8px]">
                  7 VARIATIONS · Open in Studio
                </span>
              </div>

              {/* Main Banner */}
              <div className="h-[44px] rounded-[8px] bg-[#f8f9fb] dark:bg-muted/30 border border-[#eef0f3] dark:border-border/60 flex items-center justify-center gap-2">
                <div className="w-5 h-5 rounded-[5px] bg-[#3c61dd] text-white font-bold text-[8px] flex items-center justify-center font-mono">
                  AI
                </div>
                <span className="text-xs font-bold text-[#111827] dark:text-foreground font-heading">
                  AutoInvoice
                </span>
              </div>

              {/* 6 Variations */}
              <div className="grid grid-cols-6 gap-1">
                {['#ffffff', '#ffffff', '#ffffff', '#ffffff', '#111827', '#ffffff'].map((bg, i) => (
                  <div
                    key={i}
                    className="h-5 rounded-[4px] border border-zinc-200 dark:border-border/60 flex items-center justify-center"
                    style={{ backgroundColor: bg }}
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-[2px] flex items-center justify-center"
                      style={{ backgroundColor: bg === '#111827' ? '#3c61dd' : '#111827' }}
                    >
                      <span className="text-[5px] text-white font-mono font-bold leading-none">
                        •
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 2: Colour Swatches (Figma 57500:184) */}
            <div className="space-y-1 pt-0.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-bold text-[#111827] dark:text-foreground">Colour</span>
                <span className="text-[#157a55] font-semibold text-[8px]">
                  ✓ Contrast checked
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {[
                  { c: '#3c61dd' },
                  { c: '#111827' },
                  { c: '#6366f1' },
                  { c: '#f4f5f7' },
                  { c: '#0a0a0a' },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="h-[30px] rounded-[5px] border border-black/5 dark:border-white/10"
                    style={{ backgroundColor: item.c }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================================= */}
        {/* 4. Card · Logo (Figma 57500:191: x: 10, y: 0, w: 223, h: 206, rot: -8deg) */}
        {/* ======================================================================= */}
        <div
          className="absolute z-20 w-[223px] h-[206px] p-[18px] rounded-[22px] bg-white dark:bg-[#111214] border border-[#e5e7eb] dark:border-border/70 shadow-[0_20px_40px_rgba(17,24,39,0.22)] flex flex-col justify-between hover:scale-105 transition-all duration-300"
          style={{
            left: 10,
            top: 0,
            transform: 'rotate(-8deg)',
            willChange: 'transform',
          }}
        >
          <span className="text-[20px] font-extrabold text-[#111827] dark:text-foreground font-heading leading-none">
            {t('homepage.wireframe.brandKit.logoCardTitle', 'Logo')}
          </span>

          <div className="w-full h-[132px] rounded-[14px] bg-[#eef2fd] dark:bg-blue-950/40 flex items-center justify-center">
            <span className="text-[40px] leading-[48px] font-extrabold text-[#3c61dd] tracking-tight font-heading">
              MBC
            </span>
          </div>

          {/* Green Check Badge (Figma 57500:195: 50x50, r: 22, bg: #157a55, border: 4px white) */}
          <div className="absolute -top-[16px] -right-[16px] w-[50px] h-[50px] rounded-[22px] bg-[#157a55] border-[4px] border-white dark:border-[#111214] text-white flex items-center justify-center shadow-lg z-30">
            <Check className="w-5 h-5 stroke-[3.5]" />
          </div>
        </div>

        {/* ======================================================================= */}
        {/* 5. Card · Colours (Figma 57500:198: x: 537, y: 10, w: 240, h: 180, rot: +9deg) */}
        {/* ======================================================================= */}
        <div
          className="absolute z-20 w-[240px] h-[180px] p-[18px] rounded-[22px] bg-white dark:bg-[#111214] border border-[#e5e7eb] dark:border-border/70 shadow-[0_20px_40px_rgba(17,24,39,0.22)] flex flex-col justify-between hover:scale-105 transition-all duration-300"
          style={{
            left: 537,
            top: 10,
            transform: 'rotate(9deg)',
            willChange: 'transform',
          }}
        >
          <span className="text-[20px] font-extrabold text-[#111827] dark:text-foreground font-heading leading-none">
            {t('homepage.wireframe.brandKit.coloursCardTitle', 'Colours')}
          </span>

          <div className="flex items-center justify-between gap-3 pt-2">
            {/* Swatch 1: Royal Blue */}
            <div className="flex flex-col items-center gap-2 flex-1">
              <div className="w-full h-[68px] rounded-[12px] bg-[#3c61dd]" />
              <span className="w-4 h-4 rounded-full bg-[#3c61dd]" />
            </div>
            {/* Swatch 2: Charcoal Black */}
            <div className="flex flex-col items-center gap-2 flex-1">
              <div className="w-full h-[68px] rounded-[12px] bg-[#111827]" />
              <span className="w-4 h-4 rounded-full bg-[#111827]" />
            </div>
            {/* Swatch 3: Deep Green */}
            <div className="flex flex-col items-center gap-2 flex-1">
              <div className="w-full h-[68px] rounded-[12px] bg-[#157a55]" />
              <span className="w-4 h-4 rounded-full bg-[#157a55]" />
            </div>
          </div>
        </div>

        {/* ======================================================================= */}
        {/* 6. Card · Typography (Figma 57500:210: x: 0, y: 417, w: 239, h: 192, rot: -7deg) */}
        {/* ======================================================================= */}
        <div
          className="absolute z-20 w-[239px] h-[192px] p-[18px] rounded-[22px] bg-white dark:bg-[#111214] border border-[#e5e7eb] dark:border-border/70 shadow-[0_20px_40px_rgba(17,24,39,0.22)] flex flex-col justify-between hover:scale-105 transition-all duration-300"
          style={{
            left: 0,
            top: 417,
            transform: 'rotate(-7deg)',
            willChange: 'transform',
          }}
        >
          <span className="text-[20px] font-extrabold text-[#111827] dark:text-foreground font-heading leading-none">
            {t('homepage.wireframe.brandKit.typographyCardTitle', 'Typography')}
          </span>

          <div className="grid grid-cols-2 gap-3 pt-2">
            {/* Left Box: Bold Inter / Syne Aa (Figma 57500:214: Syne 800 40px) */}
            <div className="p-3 rounded-[14px] bg-[#f4f5f7] dark:bg-muted/40 text-center space-y-1 flex flex-col items-center justify-center">
              <span className="text-[40px] leading-[48px] font-extrabold text-[#111827] dark:text-foreground font-heading">
                Aa
              </span>
              <div className="w-8 h-1 bg-[#3c61dd] rounded-full mx-auto" />
            </div>
            {/* Right Box: Regular DM Sans Aa (Figma 57500:217: DM Sans 400 40px) */}
            <div className="p-3 rounded-[14px] bg-[#f4f5f7] dark:bg-muted/40 text-center space-y-1 flex flex-col items-center justify-center">
              <span className="text-[40px] leading-[52px] font-normal text-[#9ca3af] font-sans">
                Aa
              </span>
              <div className="w-8 h-1 bg-[#d1d5db] rounded-full mx-auto" />
            </div>
          </div>
        </div>

        {/* ======================================================================= */}
        {/* 7. Card · Brand kit (Figma 57500:219: x: 520, y: 468, w: 248, h: 189, rot: +7deg) */}
        {/* ======================================================================= */}
        <div
          className="absolute z-20 w-[248px] h-[189px] p-[18px] rounded-[22px] bg-white dark:bg-[#111214] border border-[#e5e7eb] dark:border-border/70 shadow-[0_20px_40px_rgba(17,24,39,0.22)] flex flex-col justify-between hover:scale-105 transition-all duration-300"
          style={{
            left: 520,
            top: 468,
            transform: 'rotate(7deg)',
            willChange: 'transform',
          }}
        >
          {/* Top Row: Title */}
          <div className="flex items-center justify-between">
            <span className="text-[20px] font-extrabold text-[#111827] dark:text-foreground font-heading leading-none">
              {t('homepage.wireframe.brandKit.brandKitCardTitle', 'Brand kit')}
            </span>
          </div>

          {/* Kit Ready Pill (Figma 57500:228: 112x40, DM Sans 600 14px) */}
          <div className="absolute -top-[16px] right-[14px] px-[12px] py-[6px] rounded-full bg-[#e8f3ee] border border-[#bfe0d1] text-[#157a55] text-[14px] leading-[18px] font-semibold flex items-center gap-1.5 shadow-sm z-30">
            <span>✓</span>
            <span>{t('homepage.wireframe.brandKit.kitReady', 'Kit ready')}</span>
          </div>

          {/* Inner Content Frame (Figma 57500:221) */}
          <div className="flex items-center gap-3 p-3 rounded-[14px] bg-[#f4f5f7] dark:bg-muted/40">
            <div className="w-[42px] h-[42px] rounded-[10px] bg-[#3c61dd] text-white font-extrabold flex items-center justify-center text-[14px] leading-[17px] font-heading shrink-0 shadow-xs">
              MBC
            </div>
            <div className="space-y-1.5 flex-1">
              <div className="h-3 w-16 bg-[#eef2fd] dark:bg-blue-900/60 rounded" />
              <div className="h-2 w-10 bg-zinc-200 dark:bg-zinc-700 rounded" />
            </div>
            <div className="w-[36px] h-[36px] rounded-[8px] bg-[#3c61dd]/20 border border-[#3c61dd]/40 shrink-0" />
          </div>
        </div>

      </div>
    </div>
  );
}
