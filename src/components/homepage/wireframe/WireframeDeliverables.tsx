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
      {/* Visual on LEFT (1135px), Copy on RIGHT (464px) — Background #FFFFFF */}
      {/* ========================================================================= */}
      <section
        className="w-full bg-white dark:bg-background py-16 lg:py-[100px] px-6 sm:px-10 lg:px-16 xl:px-[100px] 2xl:px-[190px] overflow-hidden"
        data-testid="deliverable-brand-kit"
      >
        <div className="w-full max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 items-center gap-10 lg:gap-12 xl:gap-16">
          {/* Visual: Left (7 cols / 1135px in Figma) */}
          <div className="lg:col-span-7 xl:col-span-7 2xl:col-span-8 w-full flex items-center justify-center order-2 lg:order-1">
            <BrandKitVisual />
          </div>

          {/* Copy: Right (5 cols / max-w 464px in Figma, gap 20px) */}
          <div className="lg:col-span-5 xl:col-span-5 2xl:col-span-4 w-full max-w-[464px] space-y-5 order-1 lg:order-2">
            {/* Eyebrow (Figma 57500:243) */}
            <div className="inline-flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#157a55]" aria-hidden="true" />
              <span className="text-xs sm:text-[12px] font-medium uppercase tracking-[0.08em] text-[#6b7280] dark:text-muted-foreground font-sans">
                {t('homepage.wireframe.brandKit.eyebrow', 'Brand kit')}
              </span>
            </div>

            {/* Headline (Figma 57500:123: Syne 800, 54px, lh 56.7px, tracking-tight) */}
            <h2 className="text-3xl sm:text-4xl lg:text-[54px] font-extrabold text-[#111827] dark:text-white font-heading leading-tight lg:leading-[57px] tracking-[-0.025em]">
              {t('homepage.wireframe.brandKit.headline', 'Build your brand identity')}
            </h2>

            {/* Pill: Simple, fast, pro (Figma 57500:247) */}
            <div>
              <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#eef2fd] dark:bg-blue-950/60 text-[#3c61dd] dark:text-blue-300 text-sm sm:text-[16px] font-semibold font-sans">
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
      {/* Copy on LEFT (574px / max 480px), Video Player 1 on RIGHT (1263px, bleeding right) */}
      {/* ========================================================================= */}
      <section
        className="w-full bg-[#f7f9fc] dark:bg-muted/15 py-16 lg:py-[100px] overflow-hidden"
        data-testid="deliverable-business-plan"
      >
        <div className="w-full max-w-[1980px] mx-auto px-6 sm:px-10 lg:pl-16 xl:pl-[100px] 2xl:pl-[190px] lg:pr-0">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-[70px]">
            {/* Copy: Left (Figma 57500:361: width 574px, max-w 480px, gap 20px) */}
            <div className="w-full max-w-[480px] lg:w-[480px] xl:w-[574px] shrink-0 space-y-5">
              {/* Eyebrow (Figma 57500:362) */}
              <div className="inline-flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#157a55]" aria-hidden="true" />
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
                <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#eef2fd] dark:bg-blue-950/60 text-[#3c61dd] dark:text-blue-300 text-sm sm:text-[16px] font-semibold font-sans">
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

            {/* Video Player 1: Right (Figma 57500:907: fixed 1263x711, r: 24, drop shadow - overflows right) */}
            <div className="w-full lg:w-[950px] xl:w-[1150px] 2xl:w-[1263px] shrink-0 max-w-none">
              <WireframeVideoPlayer
                title="CampusFlow_Business_Plan_v1.pdf"
                badge={t('homepage.wireframe.businessPlan.videoBadge', 'Interactive Plan Video')}
                posterSrc="/wireframe_figma/deliverable_02_business_plan.png"
                videoSrc="/videos/business_plan_walkthrough.mp4"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 3: 03 · Financial forecast (Figma 57500:373) */}
      {/* Visual on LEFT (780px), Copy on RIGHT (max 480px) — Background #FFFFFF */}
      {/* ========================================================================= */}
      <section
        className="w-full bg-white dark:bg-background py-16 lg:py-[100px] px-6 sm:px-10 lg:px-16 xl:px-[100px] 2xl:px-[190px] overflow-hidden"
        data-testid="deliverable-financial-forecast"
      >
        <div className="w-full max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 items-center gap-10 lg:gap-12 xl:gap-16">
          {/* Visual: Left (7 cols) */}
          <div className="lg:col-span-7 xl:col-span-7 2xl:col-span-8 w-full flex items-center justify-center order-2 lg:order-1">
            <FinancialForecastVisual />
          </div>

          {/* Copy: Right (5 cols / max 480px, gap 20px) */}
          <div className="lg:col-span-5 xl:col-span-5 2xl:col-span-4 w-full max-w-[480px] space-y-5 order-1 lg:order-2">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#157a55]" aria-hidden="true" />
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
              <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#eef2fd] dark:bg-blue-950/60 text-[#3c61dd] dark:text-blue-300 text-sm sm:text-[16px] font-semibold font-sans">
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
      {/* Copy on LEFT (max 480px), Visual on RIGHT (839px) — Background #F7F9FC */}
      {/* ========================================================================= */}
      <section
        className="w-full bg-[#f7f9fc] dark:bg-muted/15 py-16 lg:py-[100px] px-6 sm:px-10 lg:px-16 xl:px-[100px] 2xl:px-[190px] overflow-hidden"
        data-testid="deliverable-market-research"
      >
        <div className="w-full max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 items-center gap-10 lg:gap-12 xl:gap-16">
          {/* Copy: Left (5 cols / max 480px, gap 20px) */}
          <div className="lg:col-span-5 xl:col-span-5 2xl:col-span-4 w-full max-w-[480px] space-y-5">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#157a55]" aria-hidden="true" />
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
              <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#eef2fd] dark:bg-blue-950/60 text-[#3c61dd] dark:text-blue-300 text-sm sm:text-[16px] font-semibold font-sans">
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

          {/* Visual: Right (7 cols) */}
          <div className="lg:col-span-7 xl:col-span-7 2xl:col-span-8 w-full flex items-center justify-center">
            <MarketResearchVisual />
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 5: 05 · Action roadmap (Figma 57559:14241) [VIDEO 2] */}
      {/* Video Player 2 on LEFT (1276px, bleeding left), Copy on RIGHT (597px / max 480px) — Background #FFFFFF */}
      {/* ========================================================================= */}
      <section
        className="w-full bg-white dark:bg-background py-16 lg:py-[100px] overflow-hidden"
        data-testid="deliverable-action-roadmap"
      >
        <div className="w-full max-w-[1980px] mx-auto px-6 sm:px-10 lg:pl-0 lg:pr-16 xl:pr-[100px] 2xl:pr-[190px]">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-[70px]">
            {/* Video Player 2: Left (Figma 57559:14250: 1276x718, flush/bleeding left) */}
            <div className="w-full lg:w-[950px] xl:w-[1150px] 2xl:w-[1263px] shrink-0 max-w-none order-2 lg:order-1 lg:-ml-[60px] xl:-ml-[100px] 2xl:-ml-[116px]">
              <WireframeVideoPlayer
                title="CampusFlow_90Day_Action_Roadmap.pdf"
                badge={t('homepage.wireframe.actionRoadmap.videoBadge', 'Roadmap Walkthrough Video')}
                posterSrc="/wireframe_figma/deliverable_05_action_roadmap.png"
                videoSrc="/videos/business_plan_walkthrough.mp4"
              />
            </div>

            {/* Copy: Right (Figma 57559:14242: width 597px, max-w 480px, gap 20px) */}
            <div className="w-full max-w-[480px] lg:w-[480px] xl:w-[574px] shrink-0 space-y-5 order-1 lg:order-2">
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#157a55]" aria-hidden="true" />
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
                <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#eef2fd] dark:bg-blue-950/60 text-[#3c61dd] dark:text-blue-300 text-sm sm:text-[16px] font-semibold font-sans">
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
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 6: 06 · Business setup (Figma 57559:14378) [VIDEO 3] */}
      {/* Copy on LEFT (574px / max 480px), Video Player 3 on RIGHT (1281px, bleeding right) — Background #F7F9FC */}
      {/* ========================================================================= */}
      <section
        className="w-full bg-[#f7f9fc] dark:bg-muted/15 py-16 lg:py-[100px] overflow-hidden"
        data-testid="deliverable-business-setup"
      >
        <div className="w-full max-w-[1980px] mx-auto px-6 sm:px-10 lg:pl-16 xl:pl-[100px] 2xl:pl-[190px] lg:pr-0">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-[51px]">
            {/* Copy: Left (Figma 57559:14379: width 574px, max-w 480px, gap 20px) */}
            <div className="w-full max-w-[480px] lg:w-[480px] xl:w-[574px] shrink-0 space-y-5">
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#157a55]" aria-hidden="true" />
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
                <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#eef2fd] dark:bg-blue-950/60 text-[#3c61dd] dark:text-blue-300 text-sm sm:text-[16px] font-semibold font-sans">
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

            {/* Video Player 3: Right (Figma 57559:14387: 1281x720, r: 24, drop shadow - overflows right) */}
            <div className="w-full lg:w-[950px] xl:w-[1150px] 2xl:w-[1281px] shrink-0 max-w-none">
              <WireframeVideoPlayer
                title="INPI_Guichet_Unique_Formation_Blueprint.pdf"
                badge={t('homepage.wireframe.businessSetup.videoBadge', 'Company Registration Video')}
                posterSrc="/wireframe_figma/deliverable_06_business_setup.png"
                videoSrc="/videos/launch-plan-scroll.mp4"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
