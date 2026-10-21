'use client';

import React from 'react';
import Image from 'next/image';
import { Check } from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';

export default function MarketResearchVisual() {
  const { t } = useLanguage();

  return (
    <div
      className="w-full flex items-center justify-center py-4 lg:py-8 overflow-visible select-none"
      data-testid="market-research-visual"
    >
      {/* ========================================================================= */}
      {/* 780x640 Fixed Coordinate Canvas — Pixel-Perfect Figma 57500:913 Mapping */}
      {/* ========================================================================= */}
      <div className="relative w-[780px] h-[640px] shrink-0 scale-[0.48] xs:scale-[0.58] sm:scale-[0.72] md:scale-[0.85] lg:scale-[0.92] xl:scale-100 origin-center my-[-155px] xs:my-[-125px] sm:my-[-80px] md:my-[-40px] lg:my-0 pointer-events-auto">
        
        {/* ======================================================================= */}
        {/* 1. Official Figma Sparkles (Figma 57500:914) */}
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
        {/* 2. Official Figma Dashed Arrows (Figma 57500:1010) */}
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
            <span className="text-2xl font-black text-[#3c61dd] font-heading block leading-none">
              {t('homepage.wireframe.marketResearch.marketSizeAmount', '€1.2B')}
            </span>
            <span className="text-[11px] text-[#6b7280] dark:text-muted-foreground block">
              {t('homepage.wireframe.marketResearch.marketSizeSub', 'addressable market')}
            </span>
            <span className="text-[10px] font-semibold text-[#111827] dark:text-white block pt-1 border-t border-blue-200/60 dark:border-blue-900/60">
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
              <span className="w-6 h-6 rounded-[8px] bg-[#3c61dd] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                01
              </span>
              <span className="font-heading font-bold text-[14px] text-[#111827] dark:text-white">
                {t('homepage.wireframe.marketResearch.segment1', 'Retailers')}
              </span>
            </div>
            <div className="flex items-center gap-2.5 p-2 rounded-[12px] bg-[#f4f5f7] dark:bg-zinc-800/60">
              <span className="w-6 h-6 rounded-[8px] bg-[#eef2fd] dark:bg-blue-950/60 text-[#3c61dd] dark:text-blue-300 text-[11px] font-bold flex items-center justify-center shrink-0">
                02
              </span>
              <span className="font-heading font-bold text-[14px] text-[#111827] dark:text-white">
                {t('homepage.wireframe.marketResearch.segment2', 'Café owners')}
              </span>
            </div>
            <div className="flex items-center gap-2.5 p-2 rounded-[12px] bg-[#f4f5f7] dark:bg-zinc-800/60">
              <span className="w-6 h-6 rounded-[8px] bg-[#eef2fd] dark:bg-blue-950/60 text-[#3c61dd] dark:text-blue-300 text-[11px] font-bold flex items-center justify-center shrink-0">
                03
              </span>
              <span className="font-heading font-bold text-[14px] text-[#111827] dark:text-white">
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
              <span className="px-2 py-0.5 rounded-full bg-[#eef2fd] dark:bg-blue-950/60 text-[#3c61dd] dark:text-blue-300 text-[10px] font-semibold">
                vs you
              </span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-[12px] bg-[#f4f5f7] dark:bg-zinc-800/60">
              <span className="font-sans font-semibold text-[13px] text-[#111827] dark:text-white">
                Sage / Cegid
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#eef2fd] dark:bg-blue-950/60 text-[#3c61dd] dark:text-blue-300 text-[10px] font-semibold">
                vs you
              </span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-[12px] bg-[#f4f5f7] dark:bg-zinc-800/60">
              <span className="font-sans font-semibold text-[13px] text-[#111827] dark:text-white">
                Excel & paper
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#eef2fd] dark:bg-blue-950/60 text-[#3c61dd] dark:text-blue-300 text-[10px] font-semibold">
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
            className="absolute -top-3.5 -right-3 px-3 py-1 rounded-full bg-[#e8f3ee] dark:bg-emerald-950/60 border border-[#bfe0d1] dark:border-emerald-800 text-[#157a55] dark:text-emerald-300 text-[14px] leading-[18px] font-semibold flex items-center gap-1.5 shadow-sm select-none"
            style={{ transform: 'rotate(-4deg)' }}
          >
            <div className="w-3.5 h-3.5 rounded-full bg-[#157a55] flex items-center justify-center text-white">
              <Check className="w-2.5 h-2.5 stroke-[3]" />
            </div>
            <span>Gap found</span>
          </div>

          {/* Big Percentage Value: 68% (Figma 57500:1003: Syne 800 32px lh 38px) */}
          <div className="font-heading font-extrabold text-[32px] leading-[38px] text-[#157a55]">
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
