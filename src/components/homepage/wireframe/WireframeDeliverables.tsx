'use client';

import React from 'react';
import { useLanguage } from '@/providers/LanguageProvider';
import BrandKitVisual from './BrandKitVisual';
import FinancialForecastVisual from './FinancialForecastVisual';
import MarketResearchVisual from './MarketResearchVisual';
import WireframeVideoPlayer from './WireframeVideoPlayer';

export default function WireframeDeliverables() {
  const { t } = useLanguage();

  return (
    <div className="w-full flex flex-col" data-testid="wireframe-deliverables">
      {/* ========================================================================= */}
      {/* SECTION 1: 01 · Brand kit (Figma 57500:123) */}
      {/* Visual on LEFT (862px), Copy on RIGHT (464px), Gap 20px, Padding 100px 45px — Background #FFFFFF */}
      {/* ========================================================================= */}
      <section
        className="w-full bg-white dark:bg-background py-16 lg:py-[100px] px-6 sm:px-10 lg:px-[45px] overflow-hidden"
        data-testid="deliverable-brand-kit"
      >
        <div className="w-full max-w-[1350px] mx-auto flex flex-col xl:flex-row items-center justify-between gap-10 xl:gap-[20px]">
          {/* Visual: Left (862px in Figma) */}
          <div className="w-full flex-1 min-w-0 max-w-[862px] flex items-center justify-center order-2 xl:order-1">
            <BrandKitVisual />
          </div>

          {/* Copy: Right (max-w 464px in Figma, gap 20px) */}
          <div className="w-full max-w-[464px] space-y-5 order-1 xl:order-2 shrink-0">
            {/* Eyebrow (Figma 57500:243) */}
            <div className="inline-flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#157a55]" aria-hidden="true" />
              <span className="text-xs sm:text-[12px] font-medium uppercase tracking-[0.08em] text-[#6b7280] dark:text-muted-foreground font-sans">
                {t('homepage.wireframe.brandKit.eyebrow', 'Brand kit')}
              </span>
            </div>

            {/* Headline (Figma 57500:123: Syne 800, 54px, lh 56.7px, tracking-tight) */}
            <h2 className="text-3xl sm:text-4xl lg:text-[54px] font-extrabold text-[#111827] dark:text-white font-heading leading-tight lg:leading-[57px] tracking-[-0.025em]">
              {t('homepage.wireframe.brandKit.headline', 'Build your brand identity')}
            </h2>

            {/* Pill: Simple, fast, pro (Figma 57500:247: 160x37, r 999, pad 8/18) */}
            <div>
              <span className="inline-flex items-center px-[18px] py-[8px] rounded-full bg-[#eef2fd] dark:bg-blue-950/60 text-[#3c61dd] dark:text-blue-300 text-sm sm:text-[16px] leading-[21px] font-semibold font-sans">
                {t('homepage.wireframe.brandKit.pill', 'Simple, fast, pro')}
              </span>
            </div>

            {/* Body (Figma 57500:249: DM Sans 400, 18px, lh 28.8px) */}
            <p className="text-base sm:text-[18px] text-[#4b5563] dark:text-zinc-300 font-sans leading-relaxed sm:leading-[28.8px]">
              {t(
                'homepage.wireframe.brandKit.body',
                "Answer a few questions and get your logo, colours and fonts. They're added to your business plan and landing page automatically. Download the full kit in one click."
              )}
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2: 02 · Business plan (Figma 57500:254) [VIDEO 1] */}
      {/* Copy on LEFT (526px), Video Player 1 on RIGHT (824px) — Background #F7F9FC */}
      {/* ========================================================================= */}
      <section
        className="w-full bg-[#f7f9fc] dark:bg-muted/15 py-16 lg:py-[100px] px-6 sm:px-10 lg:px-[45px] overflow-hidden"
        data-testid="deliverable-business-plan"
      >
        <div className="w-full max-w-[1350px] mx-auto flex flex-col xl:flex-row items-center justify-between gap-10 xl:gap-[20px]">
          {/* Copy: Left (Figma 57500:361: width 526px, gap 20px) */}
          <div className="w-full max-w-[480px] xl:max-w-[526px] shrink-0 space-y-5">
            {/* Eyebrow (Figma 57500:362) */}
            <div className="inline-flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#157a55]" aria-hidden="true" />
              <span className="text-xs sm:text-[12px] font-medium uppercase tracking-[0.08em] text-[#6b7280] dark:text-muted-foreground font-sans">
                {t('homepage.wireframe.businessPlan.eyebrow', 'Business plan')}
              </span>
            </div>

            {/* Headline (Figma 57500:254: Syne 800, 54px, lh 60px, tracking-tight) */}
            <h2 className="text-3xl sm:text-4xl lg:text-[54px] font-extrabold text-[#111827] dark:text-white font-heading leading-tight lg:leading-[60px] tracking-[-0.025em]">
              {t('homepage.wireframe.businessPlan.headline', 'Turn your idea into a real plan')}
            </h2>

            {/* Pill: Ready for investors (Figma 57500:366) */}
            <div>
              <span className="inline-flex items-center px-[18px] py-[8px] rounded-full bg-[#eef2fd] dark:bg-blue-950/60 text-[#3c61dd] dark:text-blue-300 text-sm sm:text-[16px] leading-[21px] font-semibold font-sans">
                {t('homepage.wireframe.businessPlan.pill', 'Ready for investors')}
              </span>
            </div>

            {/* Body (Figma 57500:368: DM Sans 400, 18px, lh 28.8px) */}
            <p className="text-base sm:text-[18px] text-[#4b5563] dark:text-zinc-300 font-sans leading-relaxed sm:leading-[28.8px]">
              {t(
                'homepage.wireframe.businessPlan.body',
                'Your answers become a clear business plan: summary, market, business model and more. Read it, edit it, and download it as a PDF in one click.'
              )}
            </p>
          </div>

          {/* Video Player 1: Right (Figma 57500:907: 824x464 in 1350px canvas) */}
          <div className="w-full flex-1 min-w-0 max-w-[824px]">
            <WireframeVideoPlayer
              title="CampusFlow_Business_Plan_v1.pdf"
              badge={t('homepage.wireframe.businessPlan.videoBadge', 'Interactive Plan Video')}
              posterSrc="/wireframe_figma/deliverable_02_business_plan.png"
              videoSrc="/videos/business_plan_walkthrough.mp4"
            />
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 3: 03 · Financial forecast (Figma 57500:373) */}
      {/* Visual on LEFT (862px), Copy on RIGHT (480px) — Background #FFFFFF */}
      {/* ========================================================================= */}
      <section
        className="w-full bg-white dark:bg-background py-16 lg:py-[100px] px-6 sm:px-10 lg:px-[45px] overflow-hidden"
        data-testid="deliverable-financial-forecast"
      >
        <div className="w-full max-w-[1350px] mx-auto flex flex-col xl:flex-row items-center justify-between gap-10 xl:gap-[20px]">
          {/* Visual: Left */}
          <div className="w-full flex-1 min-w-0 max-w-[862px] flex items-center justify-center order-2 xl:order-1">
            <FinancialForecastVisual />
          </div>

          {/* Copy: Right (max 480px, gap 20px) */}
          <div className="w-full max-w-[480px] space-y-5 order-1 xl:order-2 shrink-0">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#157a55]" aria-hidden="true" />
              <span className="text-xs sm:text-[12px] font-medium uppercase tracking-[0.08em] text-[#6b7280] dark:text-muted-foreground font-sans">
                {t('homepage.wireframe.financialForecast.eyebrow', 'Financial forecast')}
              </span>
            </div>

            {/* Headline (Figma 57500:373: Syne 800, 54px, lh 60px, tracking-tight) */}
            <h2 className="text-3xl sm:text-4xl lg:text-[54px] font-extrabold text-[#111827] dark:text-white font-heading leading-tight lg:leading-[60px] tracking-[-0.025em]">
              {t('homepage.wireframe.financialForecast.headline', 'Plan your next 3 years')}
            </h2>

            {/* Pill: Clear and honest */}
            <div>
              <span className="inline-flex items-center px-[18px] py-[8px] rounded-full bg-[#eef2fd] dark:bg-blue-950/60 text-[#3c61dd] dark:text-blue-300 text-sm sm:text-[16px] leading-[21px] font-semibold font-sans">
                {t('homepage.wireframe.financialForecast.pill', 'Clear and honest')}
              </span>
            </div>

            {/* Body */}
            <p className="text-base sm:text-[18px] text-[#4b5563] dark:text-zinc-300 font-sans leading-relaxed sm:leading-[28.8px]">
              {t(
                'homepage.wireframe.financialForecast.body',
                'Set your price, costs and budget. Get a 36-month forecast with your break-even month, cash position and unit economics, explained in plain words. No spreadsheet skills needed.'
              )}
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 4: 04 · Market research (Figma 57500:912) */}
      {/* Copy on LEFT (529px), Visual on RIGHT (774px) — Background #F7F9FC */}
      {/* ========================================================================= */}
      <section
        className="w-full bg-[#f7f9fc] dark:bg-muted/15 py-16 lg:py-[100px] px-6 sm:px-10 lg:px-[45px] overflow-hidden"
        data-testid="deliverable-market-research"
      >
        <div className="w-full max-w-[1350px] mx-auto flex flex-col xl:flex-row items-center justify-between gap-10 xl:gap-[20px]">
          {/* Copy: Left */}
          <div className="w-full max-w-[480px] xl:max-w-[529px] space-y-5 shrink-0">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#157a55]" aria-hidden="true" />
              <span className="text-xs sm:text-[12px] font-medium uppercase tracking-[0.08em] text-[#6b7280] dark:text-muted-foreground font-sans">
                {t('homepage.wireframe.marketResearch.eyebrow', 'Market research')}
              </span>
            </div>

            {/* Headline (Figma 57500:912: Syne 800, 54px, lh 60px, tracking-tight) */}
            <h2 className="text-3xl sm:text-4xl lg:text-[54px] font-extrabold text-[#111827] dark:text-white font-heading leading-tight lg:leading-[60px] tracking-[-0.025em]">
              {t('homepage.wireframe.marketResearch.headline', 'Know your market first')}
            </h2>

            {/* Pill: Real numbers, not guesses */}
            <div>
              <span className="inline-flex items-center px-[18px] py-[8px] rounded-full bg-[#eef2fd] dark:bg-blue-950/60 text-[#3c61dd] dark:text-blue-300 text-sm sm:text-[16px] leading-[21px] font-semibold font-sans">
                {t('homepage.wireframe.marketResearch.pill', 'Real numbers, not guesses')}
              </span>
            </div>

            {/* Body */}
            <p className="text-base sm:text-[18px] text-[#4b5563] dark:text-zinc-300 font-sans leading-relaxed sm:leading-[28.8px]">
              {t(
                'homepage.wireframe.marketResearch.body',
                "See how big your market really is, who to sell to first and who you're up against. We work out your TAM, SAM and SOM, then point out the gaps your idea can fill."
              )}
            </p>
          </div>

          {/* Visual: Right (774px in Figma) */}
          <div className="w-full flex-1 min-w-0 max-w-[774px] flex items-center justify-center">
            <MarketResearchVisual />
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 5: 05 · Action roadmap (Figma 57559:14241) [VIDEO 2] */}
      {/* Video Player 2 on LEFT (824px), Copy on RIGHT (526px) — Background #FFFFFF */}
      {/* ========================================================================= */}
      <section
        className="w-full bg-white dark:bg-background py-16 lg:py-[100px] px-6 sm:px-10 lg:px-[45px] overflow-hidden"
        data-testid="deliverable-action-roadmap"
      >
        <div className="w-full max-w-[1350px] mx-auto flex flex-col xl:flex-row items-center justify-between gap-10 xl:gap-[20px]">
          {/* Video Player 2: Left (824px in Figma) */}
          <div className="w-full flex-1 min-w-0 max-w-[824px] order-2 xl:order-1">
            <WireframeVideoPlayer
              title="CampusFlow_90Day_Action_Roadmap.pdf"
              badge={t('homepage.wireframe.actionRoadmap.videoBadge', 'Roadmap Walkthrough Video')}
              posterSrc="/wireframe_figma/deliverable_05_action_roadmap.png"
              videoSrc="/videos/business_plan_walkthrough.mp4"
            />
          </div>

          {/* Copy: Right (Figma 57559:14242: width 526px, gap 20px) */}
          <div className="w-full max-w-[480px] xl:max-w-[526px] shrink-0 space-y-5 order-1 xl:order-2">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#157a55]" aria-hidden="true" />
              <span className="text-xs sm:text-[12px] font-medium uppercase tracking-[0.08em] text-[#6b7280] dark:text-muted-foreground font-sans">
                {t('homepage.wireframe.actionRoadmap.eyebrow', 'Action roadmap')}
              </span>
            </div>

            {/* Headline (Figma 57559:14241: Syne 800, 54px, lh 60px, tracking-tight) */}
            <h2 className="text-3xl sm:text-4xl lg:text-[54px] font-extrabold text-[#111827] dark:text-white font-heading leading-tight lg:leading-[60px] tracking-[-0.025em]">
              {t('homepage.wireframe.actionRoadmap.headline', 'Know what to do this week')}
            </h2>

            {/* Pill: One step at a time */}
            <div>
              <span className="inline-flex items-center px-[18px] py-[8px] rounded-full bg-[#eef2fd] dark:bg-blue-950/60 text-[#3c61dd] dark:text-blue-300 text-sm sm:text-[16px] leading-[21px] font-semibold font-sans">
                {t('homepage.wireframe.actionRoadmap.pill', 'One step at a time')}
              </span>
            </div>

            {/* Body */}
            <p className="text-base sm:text-[18px] text-[#4b5563] dark:text-zinc-300 font-sans leading-relaxed sm:leading-[28.8px]">
              {t(
                'homepage.wireframe.actionRoadmap.body',
                'Your plan becomes a simple roadmap: what to do now, in the next 30 days and over the next 3 months. Every step is clear, so you always know what comes next.'
              )}
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 6: 06 · Business setup (Figma 57559:14378) [VIDEO 3] */}
      {/* Copy on LEFT (526px), Video Player 3 on RIGHT (824px) — Background #F7F9FC */}
      {/* ========================================================================= */}
      <section
        className="w-full bg-[#f7f9fc] dark:bg-muted/15 py-16 lg:py-[100px] px-6 sm:px-10 lg:px-[45px] overflow-hidden"
        data-testid="deliverable-business-setup"
      >
        <div className="w-full max-w-[1350px] mx-auto flex flex-col xl:flex-row items-center justify-between gap-10 xl:gap-[20px]">
          {/* Copy: Left (Figma 57559:14379: width 526px, gap 20px) */}
          <div className="w-full max-w-[480px] xl:max-w-[526px] shrink-0 space-y-5">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#157a55]" aria-hidden="true" />
              <span className="text-xs sm:text-[12px] font-medium uppercase tracking-[0.08em] text-[#6b7280] dark:text-muted-foreground font-sans">
                {t('homepage.wireframe.businessSetup.eyebrow', 'Business setup')}
              </span>
            </div>

            {/* Headline (Figma 57559:14378: Syne 800, 54px, lh 60px, tracking-tight) */}
            <h2 className="text-3xl sm:text-4xl lg:text-[54px] font-extrabold text-[#111827] dark:text-white font-heading leading-tight lg:leading-[60px] tracking-[-0.025em]">
              {t('homepage.wireframe.businessSetup.headline', 'Set up your company')}
            </h2>

            {/* Pill: No legal jargon */}
            <div>
              <span className="inline-flex items-center px-[18px] py-[8px] rounded-full bg-[#eef2fd] dark:bg-blue-950/60 text-[#3c61dd] dark:text-blue-300 text-sm sm:text-[16px] leading-[21px] font-semibold font-sans">
                {t('homepage.wireframe.businessSetup.pill', 'No legal jargon')}
              </span>
            </div>

            {/* Body */}
            <p className="text-base sm:text-[18px] text-[#4b5563] dark:text-zinc-300 font-sans leading-relaxed sm:leading-[28.8px]">
              {t(
                'homepage.wireframe.businessSetup.body',
                'Pick the right company type, see which documents to prepare and register step by step. We guide you until your company is official in France.'
              )}
            </p>
          </div>

          {/* Video Player 3: Right (824px in Figma) */}
          <div className="w-full flex-1 min-w-0 max-w-[824px]">
            <WireframeVideoPlayer
              title="INPI_Guichet_Unique_Formation_Blueprint.pdf"
              badge={t('homepage.wireframe.businessSetup.videoBadge', 'Company Registration Video')}
              posterSrc="/wireframe_figma/deliverable_06_business_setup.png"
              videoSrc="/videos/launch-plan-scroll.mp4"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
