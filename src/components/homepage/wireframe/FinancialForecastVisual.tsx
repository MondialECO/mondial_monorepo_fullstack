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
        <div className="absolute inset-0 w-[780px] h-[640px] pointer-events-none z-0">
          <Image
            src="/wireframe_figma/sparkles.svg"
            alt=""
            width={780}
            height={640}
            className="w-full h-full object-contain pointer-events-none"
            priority
          />
        </div>

        {/* ======================================================================= */}
        {/* 2. Official Figma Dashed Arrows (Figma 57500:501) */}
        {/* ======================================================================= */}
        <div className="absolute inset-0 w-[780px] h-[640px] pointer-events-none z-10">
          <Image
            src="/wireframe_figma/arrows.svg"
            alt=""
            width={780}
            height={640}
            className="w-full h-full object-contain pointer-events-none"
            priority
          />
        </div>

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
            <span>Fully funded</span>
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
