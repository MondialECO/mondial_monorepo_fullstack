'use client';

import React from 'react';
import Image from 'next/image';
import { Check } from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';

export default function FinancialForecastVisual() {
  const { t } = useLanguage();

  return (
    <div
      className="w-full flex items-center justify-center overflow-visible select-none h-[340px] xs:h-[400px] sm:h-[480px] md:h-[540px] lg:h-[600px] xl:h-[640px] my-0"
      data-testid="financial-forecast-visual"
    >
      {/* ========================================================================= */}
      {/* 780x640 Fixed Coordinate Canvas — Pixel-Perfect Figma 57500:374 Mapping */}
      {/* ========================================================================= */}
      <div className="relative w-[780px] h-[640px] shrink-0 scale-[0.44] xs:scale-[0.52] sm:scale-[0.66] md:scale-[0.76] lg:scale-[0.88] xl:scale-100 origin-center pointer-events-auto">
        
        {/* ======================================================================= */}
        {/* 1. Official Figma Sparkles (Figma 57500:375) */}
        {/* ======================================================================= */}
        <svg
          className="absolute inset-0 w-[780px] h-[640px] pointer-events-none z-0 overflow-visible"
          viewBox="0 0 780 640"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M232 128C234.667 140 241.333 147.333 252 150C241.333 152.667 234.667 160 232 172C229.333 160 222.667 152.667 212 150C222.667 147.333 229.333 140 232 128Z"
            fill="#3C61DD"
          />
          <path
            d="M258 122C259.333 127.333 262 130.667 266 132C262 133.333 259.333 136.667 258 142C256.667 136.667 254 133.333 250 132C254 130.667 256.667 127.333 258 122Z"
            fill="#157A55"
          />
          <path
            d="M70 280C72.6667 294.667 80.6667 303.333 94 306C80.6667 308.667 72.6667 317.333 70 332C67.3333 317.333 59.3333 308.667 46 306C59.3333 303.333 67.3333 294.667 70 280Z"
            fill="#3C61DD"
          />
          <path
            d="M98 322C100 330 104.667 334.667 112 336C104.667 337.333 100 342 98 350C96 342 91.3333 337.333 84 336C91.3333 334.667 96 330 98 322Z"
            fill="#157A55"
          />
          <path
            d="M716 300C718.667 313.333 726 321.333 738 324C726 326.667 718.667 334.667 716 348C713.333 334.667 706 326.667 694 324C706 321.333 713.333 313.333 716 300Z"
            fill="#3C61DD"
          />
          <path
            d="M690 268C692 277.333 697.333 283 706 285C697.333 287 692 292.667 690 302C688 292.667 682.667 287 674 285C682.667 283 688 277.333 690 268Z"
            fill="#157A55"
          />
        </svg>

        {/* ======================================================================= */}
        {/* 2. Official Figma Dashed Arrows (Figma 57500:501) */}
        {/* ======================================================================= */}
        <svg
          className="absolute inset-0 w-[780px] h-[640px] pointer-events-none z-10 overflow-visible"
          viewBox="0 0 780 640"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Top-Left Arrow to Tablet */}
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

          {/* Top-Right Arrow to Break-even */}
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

          {/* Bottom-Left Arrow from Cash */}
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

          {/* Bottom-Right Arrow to Unit Economics */}
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
        {/* 3. Center Tablet (Figma 57500:382: pos 180, 170, size 420x290) */}
        {/* ======================================================================= */}
        <div
          className="absolute left-[180px] top-[170px] w-[420px] h-[290px] rounded-[28px] bg-[#111827] shadow-[0_40px_60px_-30px_rgba(17,24,39,0.40)] p-3 z-10 flex items-center justify-center transition-transform hover:scale-[1.01]"
          style={{ willChange: 'transform' }}
        >
          <div className="relative w-[396px] h-[266px] rounded-[18px] overflow-hidden bg-white dark:bg-[#0c121e]">
            <Image
              src="/wireframe_figma/financial_screen.svg"
              alt="Financial forecast dashboard on tablet"
              width={396}
              height={266}
              className="w-full h-full object-cover select-none pointer-events-none"
              priority
            />
          </div>
        </div>

        {/* ======================================================================= */}
        {/* 4. Satellite Card 1: Revenue (Figma 57500:445: 223x203, -8deg, pos 10, -8) */}
        {/* ======================================================================= */}
        <div
          className="absolute left-[10px] top-[-8px] w-[223px] rounded-[22px] bg-white dark:bg-card border border-[#e5e7eb] dark:border-border/80 shadow-[0_20px_40px_-24px_rgba(17,24,39,0.22)] p-[18px] space-y-3 z-20 transition-all hover:scale-105 hover:z-30 cursor-default"
          style={{ transform: 'rotate(-8deg)' }}
        >
          {/* Card Title (Syne 800 20px) */}
          <h3 className="font-heading font-extrabold text-[20px] leading-tight text-[#111827] dark:text-white">
            {t('homepage.wireframe.financialForecast.revenueCardTitle', 'Revenue')}
          </h3>

          {/* Revenue Box */}
          <div className="rounded-[14px] bg-[#eef2fd] dark:bg-blue-950/40 p-3 space-y-2">
            <span className="text-[13px] font-bold text-[#111827] dark:text-white block">
              Year 3 · €554,920
            </span>
            {/* 3 Bars Chart */}
            <div className="flex items-end gap-2.5 h-[65px] pt-1">
              <div className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-[#a9bbff] rounded-t-[4px] h-[25px]" />
                <span className="text-[10px] text-[#6b7280] dark:text-zinc-400 font-mono">Y1</span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-[#a9bbff] rounded-t-[4px] h-[41px]" />
                <span className="text-[10px] text-[#6b7280] dark:text-zinc-400 font-mono">Y2</span>
              </div>
              <div className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-[#3c61dd] rounded-t-[4px] h-[59px]" />
                <span className="text-[10px] text-[#3c61dd] font-bold font-mono">Y3</span>
              </div>
            </div>
          </div>

          {/* Check Badge (Figma 57500:455: 50x50, r 22, bg #157a55, border 4px white) */}
          <div
            className="absolute -top-3.5 -right-3.5 w-[50px] h-[50px] rounded-full bg-[#157a55] border-[4px] border-white dark:border-background flex items-center justify-center shadow-md select-none"
            aria-hidden="true"
          >
            <Check className="w-5 h-5 text-white stroke-[3]" />
          </div>
        </div>

        {/* ======================================================================= */}
        {/* 5. Satellite Card 2: Break-even (Figma 57500:458: 247x220, +9deg, pos 528, 10) */}
        {/* ======================================================================= */}
        <div
          className="absolute left-[528px] top-[10px] w-[247px] rounded-[22px] bg-white dark:bg-card border border-[#e5e7eb] dark:border-border/80 shadow-[0_20px_40px_-24px_rgba(17,24,39,0.22)] p-[18px] space-y-2.5 z-20 transition-all hover:scale-105 hover:z-30 cursor-default"
          style={{ transform: 'rotate(9deg)' }}
        >
          {/* Card Title */}
          <h3 className="font-heading font-extrabold text-[20px] leading-tight text-[#111827] dark:text-white">
            {t('homepage.wireframe.financialForecast.breakEvenCardTitle', 'Break-even')}
          </h3>

          {/* Month 7 Big Highlight */}
          <div className="font-heading font-extrabold text-[32px] leading-tight text-[#3c61dd]">
            {t('homepage.wireframe.financialForecast.breakEvenMonth', 'Month 7')}
          </div>

          {/* Subtext */}
          <p className="font-sans text-[13px] leading-snug text-[#6b7280] dark:text-zinc-300">
            {t(
              'homepage.wireframe.financialForecast.breakEvenSub',
              '163 subscribers cover all your costs.'
            )}
          </p>

          {/* Pill · Losses back by M12 (Figma 57500:462) */}
          <div className="pt-0.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e8f3ee] dark:bg-emerald-950/40 text-[#157a55] dark:text-emerald-300 text-[12px] font-semibold font-sans">
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              {t('homepage.wireframe.financialForecast.lossesBack', 'Losses back by M12')}
            </span>
          </div>
        </div>

        {/* ======================================================================= */}
        {/* 6. Satellite Card 3: Cash (Figma 57500:466: 239x197, -7deg, pos 0, 425) */}
        {/* ======================================================================= */}
        <div
          className="absolute left-[0px] top-[425px] w-[239px] rounded-[22px] bg-white dark:bg-card border border-[#e5e7eb] dark:border-border/80 shadow-[0_20px_40px_-24px_rgba(17,24,39,0.22)] p-[18px] space-y-1.5 z-20 transition-all hover:scale-105 hover:z-30 cursor-default"
          style={{ transform: 'rotate(-7deg)' }}
        >
          {/* Card Title */}
          <h3 className="font-heading font-extrabold text-[20px] leading-tight text-[#111827] dark:text-white">
            {t('homepage.wireframe.financialForecast.cashCardTitle', 'Cash')}
          </h3>

          {/* Amount: €34,680 */}
          <div className="font-heading font-extrabold text-[28px] leading-tight text-[#157a55]">
            {t('homepage.wireframe.financialForecast.cashAmount', '€34,680')}
          </div>

          {/* Subtext */}
          <p className="font-sans text-[12px] leading-tight text-[#6b7280] dark:text-zinc-400">
            {t('homepage.wireframe.financialForecast.cashSub', 'Lowest point, month 6')}
          </p>

          {/* Cash Bars (Figma 57500:470: 16 increasing vertical bars) */}
          <div className="flex items-end gap-1.5 h-[40px] pt-2">
            {[4, 5, 6, 8, 10, 12, 14, 16, 19, 21, 24, 27, 30, 33, 36, 40].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-[2px] bg-[#157a55] transition-transform hover:scale-y-110"
                style={{ height: `${h}px` }}
              />
            ))}
          </div>
        </div>

        {/* ======================================================================= */}
        {/* 7. Satellite Card 4: Unit economics (Figma 57500:487: 244x155, +7deg, pos 522, 486) */}
        {/* ======================================================================= */}
        <div
          className="absolute left-[522px] top-[486px] w-[244px] rounded-[22px] bg-white dark:bg-card border border-[#e5e7eb] dark:border-border/80 shadow-[0_20px_40px_-24px_rgba(17,24,39,0.22)] p-[18px] space-y-2 z-20 transition-all hover:scale-105 hover:z-30 cursor-default"
          style={{ transform: 'rotate(7deg)' }}
        >
          {/* Card Title */}
          <h3 className="font-heading font-extrabold text-[20px] leading-tight text-[#111827] dark:text-white">
            {t('homepage.wireframe.financialForecast.unitEconomicsCardTitle', 'Unit economics')}
          </h3>

          {/* Floating Pill · Fully funded (Figma 57500:496) */}
          <div
            className="absolute -top-3.5 -right-3 px-3 py-1 rounded-full bg-[#e8f3ee] dark:bg-emerald-950/60 border border-[#bfe0d1] dark:border-emerald-800 text-[#157a55] dark:text-emerald-300 text-[11px] font-bold flex items-center gap-1 shadow-sm select-none"
            style={{ transform: 'rotate(-4deg)' }}
          >
            <div className="w-3.5 h-3.5 rounded-full bg-[#157a55] flex items-center justify-center text-white">
              <Check className="w-2.5 h-2.5 stroke-[3]" />
            </div>
            <span>{t('homepage.wireframe.financialForecast.fullyFunded', 'Fully funded')}</span>
          </div>

          {/* 2 Metric Boxes Side by Side */}
          <div className="flex gap-2.5 pt-1">
            <div className="flex-1 bg-[#f4f5f7] dark:bg-zinc-800/60 rounded-[12px] p-2.5">
              <span className="text-[11px] text-[#6b7280] dark:text-zinc-400 font-medium block">
                LTV / CAC
              </span>
              <span className="text-[20px] font-extrabold text-[#157a55] block leading-tight pt-0.5">
                4.0x
              </span>
            </div>
            <div className="flex-1 bg-[#f4f5f7] dark:bg-zinc-800/60 rounded-[12px] p-2.5">
              <span className="text-[11px] text-[#6b7280] dark:text-zinc-400 font-medium block">
                Margin
              </span>
              <span className="text-[20px] font-extrabold text-[#111827] dark:text-white block leading-tight pt-0.5">
                80%
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
