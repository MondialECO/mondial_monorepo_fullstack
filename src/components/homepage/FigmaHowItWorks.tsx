'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  ArrowRight,
  Globe,
  LayoutGrid
} from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';

interface SpineNodeProps {
  step: number;
  activeStep: number;
  isFirst?: boolean;
  isLast?: boolean;
  onSelect: (step: number) => void;
}

function SpineNode({ step, activeStep, isFirst = false, isLast = false, onSelect }: SpineNodeProps) {
  const isCompleted = step < activeStep;
  const isActive = step === activeStep;
  const formattedStep = step < 10 ? `0${step}` : `${step}`;

  return (
    <div className="hidden md:flex flex-col items-center w-20 lg:w-24 shrink-0 relative self-stretch pt-7 select-none">
      {/* Top connector (coming from previous step) */}
      {!isFirst && (
        <div className="absolute top-0 h-7 w-[2px] bg-[#e3e8f2] z-0">
          <div
            className={`w-full h-full transition-colors duration-300 ${
              activeStep >= step ? 'bg-[#3c61dd]' : 'bg-transparent'
            }`}
          />
        </div>
      )}

      {/* Bottom connector (leading to next step + bridging the 32px space-y-8 gap) */}
      {!isLast && (
        <div className="absolute top-[76px] bottom-[-32px] w-[2px] bg-[#e3e8f2] z-0">
          <div
            className={`w-full h-full transition-colors duration-300 ${
              activeStep > step ? 'bg-[#3c61dd]' : 'bg-transparent'
            }`}
          />
        </div>
      )}

      {/* Step Circle Button */}
      <button
        type="button"
        onClick={() => onSelect(step)}
        aria-label={`Go to Phase 0${step}`}
        aria-current={isActive ? 'step' : undefined}
        className={`w-12 h-12 rounded-full font-bold text-base flex items-center justify-center relative font-mono transition-all duration-300 z-10 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3c61dd] ${
          isActive
            ? 'bg-[#3c61dd] text-white shadow-md ring-4 ring-[#3c61dd]/20 scale-105'
            : isCompleted
            ? 'bg-[#e8eeff] text-[#1f3faf] shadow-sm hover:ring-2 hover:ring-[#3c61dd]/30'
            : 'bg-white dark:bg-card border border-[#e3e8f2] dark:border-border text-[#667085] dark:text-muted-foreground shadow-2xs hover:border-[#c9d5ff] hover:text-[#101828]'
        }`}
      >
        {formattedStep}
        {isCompleted && (
          <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#00c896] border-2 border-white dark:border-background flex items-center justify-center text-white text-[9px] font-sans font-bold shadow-2xs">
            ✓
          </span>
        )}
      </button>
    </div>
  );
}

export default function FigmaHowItWorks() {
  const { t } = useLanguage();
  const [activeStep, setActiveStep] = useState<number>(1);

  const scrollToStep = useCallback((stepNumber: number) => {
    const el = document.getElementById(`phase-0${stepNumber}`);
    if (el) {
      const yOffset = -100;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setActiveStep(stepNumber);
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const stepIds = ['phase-01', 'phase-02', 'phase-03', 'phase-04', 'phase-05', 'phase-06'];
      // Trigger threshold: card top enters upper 45% of viewport
      const triggerY = window.innerHeight * 0.45;

      let current = 1;
      for (let i = 0; i < stepIds.length; i++) {
        const el = document.getElementById(stepIds[i]);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= triggerY) {
            current = i + 1;
          }
        }
      }
      setActiveStep(current);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const breadcrumbs = [
    { num: 1, label: t('homepage.howItWorks.breadcrumbs.you', 'You') },
    { num: 2, label: t('homepage.howItWorks.breadcrumbs.brand', 'Brand') },
    { num: 3, label: t('homepage.howItWorks.breadcrumbs.businessPlan', 'Business plan') },
    { num: 4, label: t('homepage.howItWorks.breadcrumbs.launchPlan', 'Launch plan') },
    { num: 5, label: t('homepage.howItWorks.breadcrumbs.company', 'Company') },
    { num: 6, label: t('homepage.howItWorks.breadcrumbs.nextChapter', 'Next chapter') },
  ];

  return (
    <section 
      id="how-it-works" 
      className="relative w-full py-16 sm:py-20 lg:py-[100px] px-4 sm:px-6 md:px-8 lg:px-[45px] bg-gradient-to-b from-[#ffffff] to-[#fbfcff] dark:from-background dark:to-background border-b border-[#e8ecf2] dark:border-border overflow-hidden"
      style={{
        backgroundImage: `
          radial-gradient(circle at 88% 12%, rgba(111, 139, 255, 0.14) 0%, rgba(111, 139, 255, 0) 65%),
          linear-gradient(180deg, #FFFFFF 0%, #FBFCFF 100%)
        `,
      }}
    >
      <div className="w-full max-w-[1350px] 2xl:max-w-[1520px] mx-auto">
        
        {/* Intro Header (Figma 57554:13620 - Max-Width 720px) */}
        <div className="flex flex-col items-center text-center max-w-[720px] mx-auto mb-12 md:mb-[68px] space-y-4">
          
          {/* Eyebrow Badge (Figma 57381:10473 - 138x30px) */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#e8eeff] text-[#1f3faf] text-xs font-semibold uppercase font-mono shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3c61dd] shrink-0" />
            <span>{t('homepage.howItWorks.eyebrow')}</span>
          </div>

          {/* Heading 1 (Figma 57554:13623 - Inter 600 54px lh:60) */}
          <h2 className="text-3xl sm:text-4xl lg:text-[54px] font-semibold text-[#101828] dark:text-foreground tracking-tight leading-[1.1] font-heading">
            {t('homepage.howItWorks.headline').split('\n').map((line, i, arr) => (
              <span key={i}>{line}{i < arr.length - 1 && <br className="hidden sm:inline" />}</span>
            ))}
          </h2>

          {/* Subline (Figma 57554:13624 - DM Sans 400 19px) */}
          <p className="text-lg sm:text-xl lg:text-[19px] text-[#667085] dark:text-muted-foreground leading-relaxed font-sans font-normal max-w-[620px]">
            {t('homepage.howItWorks.subline')}
          </p>
        </div>

        {/* Continuous 6-Phase Timeline Layout (Figma 57554:13632) */}
        <div className="w-full space-y-8">
          
          {/* ===================================================================== */}
          {/* STEP 01: PHASE 01 · YOU (Figma 57554:13633) */}
          {/* ===================================================================== */}
          <div id="phase-01" className="relative flex flex-col md:flex-row gap-6 items-stretch">
            <SpineNode step={1} activeStep={activeStep} isFirst onSelect={scrollToStep} />

            <div className="flex-1 min-w-0">
              <div className={`rounded-[24px] border ${activeStep === 1 ? 'border-[#c9d5ff] ring-2 ring-[#3c61dd]/20' : 'border-[#e3e8f2]'} dark:border-border bg-white dark:bg-card p-6 sm:p-8 shadow-sm transition-all duration-300`}>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  {/* Left Text (5 cols) */}
                  <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
                    <div className="space-y-3">
                      <div className="text-xs font-semibold text-[#667085] tracking-wider uppercase font-mono">
                        {t('homepage.howItWorks.phase01.eyebrow')}
                      </div>
                      <h3 className="text-2xl sm:text-[28px] font-semibold text-[#101828] dark:text-foreground font-heading">
                        {t('homepage.howItWorks.phase01.title')}
                      </h3>
                      <p className="text-base sm:text-[17px] text-[#667085] dark:text-muted-foreground leading-relaxed font-sans font-normal">
                        {t('homepage.howItWorks.phase01.description')}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-[#e3e8f2] flex items-center gap-2 text-sm">
                      <span className="text-[#667085]">{t('homepage.howItWorks.phase01.youGet')}</span>
                      <span className="font-semibold text-[#101828] dark:text-foreground">{t('homepage.howItWorks.phase01.output')}</span>
                    </div>
                  </div>

                  {/* Right Preview (7 cols) */}
                  <div className="lg:col-span-7 p-5 rounded-[16px] bg-[#f7f8fc] dark:bg-muted/30 border border-[#e3e8f2] space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-[#e3e8f2] text-xs">
                      <span className="text-[#667085]">{t('homepage.howItWorks.phase01.output')}</span>
                      <span className="px-2.5 py-0.5 rounded-[6px] bg-[#ecfdf5] text-[#008764] font-semibold text-[11px]">
                        {t('homepage.howItWorks.common.completed', 'Completed')}
                      </span>
                    </div>

                    {/* Profile Card */}
                    <div className="p-4 rounded-[12px] bg-white dark:bg-card border border-[#e3e8f2] space-y-3">
                      <div className="flex items-center gap-3 pb-3 border-b border-[#e3e8f2]">
                        <div className="w-10 h-10 rounded-full bg-[#e8eeff] text-[#1f3faf] font-bold flex items-center justify-center font-mono">
                          Y
                        </div>
                        <div>
                          <div className="text-sm font-bold text-[#101828] dark:text-foreground">Yanis</div>
                          <div className="text-xs text-[#667085]">{t('homepage.howItWorks.phase01.preview.role', 'Student · Lyon')}</div>
                        </div>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between py-1 border-b border-[#f1f5f9]">
                          <span className="text-[#667085]">{t('homepage.howItWorks.phase01.preview.strengths', 'Strengths')}</span>
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded bg-[#f5f5f5] text-[#101828] font-medium text-[11px]">
                              {t('homepage.howItWorks.phase01.preview.design', 'Design')}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-[#f5f5f5] text-[#101828] font-medium text-[11px]">
                              {t('homepage.howItWorks.phase01.preview.socialMedia', 'Social media')}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between py-1 border-b border-[#f1f5f9]">
                          <span className="text-[#667085]">{t('homepage.howItWorks.phase01.preview.experience', 'Experience')}</span>
                          <span className="font-semibold text-[#101828] dark:text-foreground">
                            {t('homepage.howItWorks.phase01.preview.experienceValue', '2 school projects · 1 internship')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-1 border-b border-[#f1f5f9]">
                          <span className="text-[#667085]">{t('homepage.howItWorks.phase01.preview.weeklyTime', 'Weekly time')}</span>
                          <span className="font-bold text-[#101828] dark:text-foreground">10–20 h</span>
                        </div>
                        <div className="flex items-center justify-between py-1">
                          <span className="text-[#667085]">{t('homepage.howItWorks.phase01.preview.howYouLikeToGrow', 'How you like to grow')}</span>
                          <span className="font-semibold text-[#101828] dark:text-foreground">
                            {t('homepage.howItWorks.phase01.preview.learnByDoing', 'Learn by doing')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-center text-[11px] text-[#667085]">
                      {t('homepage.howItWorks.phase01.preview.bottomNote', 'Your plan will be built around this.')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* STEP 02: PHASE 02 · PROJECT & BRAND (Figma 57554:13693) */}
          {/* ===================================================================== */}
          <div id="phase-02" className="relative flex flex-col md:flex-row gap-6 items-stretch">
            <SpineNode step={2} activeStep={activeStep} onSelect={scrollToStep} />

            <div className="flex-1 min-w-0">
              <div className={`rounded-[24px] border ${activeStep === 2 ? 'border-[#3c61dd] ring-2 ring-[#3c61dd]/20' : 'border-[#c9d5ff]'} dark:border-border bg-white dark:bg-card p-6 sm:p-8 shadow-sm transition-all duration-300`}>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  {/* Left Text (5 cols) */}
                  <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
                    <div className="space-y-3">
                      <div className="text-xs font-semibold text-[#667085] tracking-wider uppercase font-mono">
                        {t('homepage.howItWorks.phase02.eyebrow')}
                      </div>
                      <h3 className="text-2xl sm:text-[28px] font-semibold text-[#101828] dark:text-foreground font-heading">
                        {t('homepage.howItWorks.phase02.title')}
                      </h3>
                      <p className="text-base sm:text-[17px] text-[#667085] dark:text-muted-foreground leading-relaxed font-sans font-normal">
                        {t('homepage.howItWorks.phase02.description')}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-[#e3e8f2] flex items-center gap-2 text-sm">
                      <span className="text-[#667085]">{t('homepage.howItWorks.phase02.youGet')}</span>
                      <span className="font-semibold text-[#101828] dark:text-foreground">{t('homepage.howItWorks.phase02.output')}</span>
                    </div>
                  </div>

                  {/* Right Preview Bento (7 cols) */}
                  <div className="lg:col-span-7 p-5 rounded-[16px] bg-[#f7f8fc] dark:bg-muted/30 border border-[#c9d5ff] space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-[#e3e8f2] text-xs">
                      <span className="text-[#667085]">{t('homepage.howItWorks.phase02.preview.brandKit', 'Brand Kit')}</span>
                      <span className="px-2.5 py-0.5 rounded-[6px] bg-[#ecfdf5] text-[#008764] font-semibold text-[11px]">
                        {t('homepage.howItWorks.common.completed', 'Completed')}
                      </span>
                    </div>

                    {/* Bento Grid */}
                    <div className="space-y-2.5">
                      {/* Top Full-Width Idea Tile */}
                      <div className="p-3.5 rounded-[12px] bg-white dark:bg-card border border-[#e3e8f2] flex items-center justify-between">
                        <div>
                          <div className="text-base font-bold text-[#101828] dark:text-foreground">CampusFlow</div>
                          <div className="text-xs text-[#667085]">
                            {t('homepage.howItWorks.phase02.preview.tagline', 'Simple project management for student teams.')}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] bg-[#fafafa] border border-[#e3e8f2] text-xs">
                          <span className="text-[#667085]">{t('homepage.howItWorks.phase02.preview.ideaClarity', 'Idea clarity')}</span>
                          <span className="font-bold text-[#101828]">82</span>
                        </div>
                      </div>

                      {/* Bottom 3 Mini Bento Tiles */}
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        {/* Monogram */}
                        <div className="p-3 rounded-[12px] bg-white dark:bg-card border border-[#e3e8f2] flex flex-col items-center justify-center space-y-1">
                          <div className="w-8 h-8 rounded-[8px] bg-[#e8eeff] border border-[#e3e8f2] flex items-center justify-center font-bold text-xs text-[#3c61dd] font-heading">
                            CF
                          </div>
                          <div className="text-[10px] text-[#667085]">{t('homepage.howItWorks.phase02.preview.monogram', 'Monogram')}</div>
                        </div>

                        {/* Palette */}
                        <div className="p-3 rounded-[12px] bg-white dark:bg-card border border-[#e3e8f2] flex flex-col justify-between space-y-1.5">
                          <div className="text-[10px] font-bold text-[#667085] font-mono">{t('homepage.howItWorks.phase02.preview.palette', 'PALETTE')}</div>
                          <div className="flex items-center justify-center gap-1">
                            <span className="w-3 h-5 rounded-[2px] bg-[#3c61dd]" />
                            <span className="w-3 h-5 rounded-[2px] bg-[#1f3faf]" />
                            <span className="w-3 h-5 rounded-[2px] bg-[#6f8bff]" />
                            <span className="w-3 h-5 rounded-[2px] bg-[#101828]" />
                          </div>
                        </div>

                        {/* Typography */}
                        <div className="p-3 rounded-[12px] bg-white dark:bg-card border border-[#e3e8f2] flex flex-col items-center justify-center space-y-1">
                          <div className="text-xl font-bold text-[#101828] dark:text-foreground font-heading">Aa</div>
                          <div className="text-[10px] text-[#667085]">{t('homepage.howItWorks.phase02.preview.typography', 'Heading · Body')}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* STEP 03: PHASE 03 · BUSINESS PLAN (CORE PHASE CENTERPIECE - Figma 57554:13752) */}
          {/* ===================================================================== */}
          <div id="phase-03" className="relative flex flex-col md:flex-row gap-6 items-stretch">
            <SpineNode step={3} activeStep={activeStep} onSelect={scrollToStep} />

            <div className="flex-1 min-w-0">
              <div className={`rounded-[24px] border-2 border-[#3c61dd] bg-white dark:bg-card p-6 sm:p-10 ${activeStep === 3 ? 'shadow-xl ring-2 ring-[#3c61dd]/30' : 'shadow-lg'} relative overflow-hidden transition-all duration-300`}>
                {/* Card Top Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#e3e8f2] gap-4">
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-[#667085] tracking-wider uppercase font-mono">
                      {t('homepage.howItWorks.phase03.eyebrow')}
                    </div>
                    <h3 className="text-2xl sm:text-[32px] font-semibold text-[#101828] dark:text-foreground font-heading">
                      {t('homepage.howItWorks.phase03.title')}
                    </h3>
                    <p className="text-base sm:text-[17px] text-[#667085] dark:text-muted-foreground leading-relaxed font-sans font-normal max-w-2xl">
                      {t('homepage.howItWorks.phase03.description')}
                    </p>
                  </div>

                  {/* Core Phase Badge (Figma 57554:13768) */}
                  <div className="shrink-0">
                    <span className="px-3 py-1 rounded-full bg-[#3c61dd] text-white text-xs font-bold uppercase tracking-wider font-mono">
                      {t('homepage.howItWorks.phase03.badge')}
                    </span>
                  </div>
                </div>

                <div className="py-4 flex items-center gap-2 text-sm">
                  <span className="text-[#667085]">{t('homepage.howItWorks.phase03.youGet')}</span>
                  <span className="font-semibold text-[#101828] dark:text-foreground">{t('homepage.howItWorks.phase03.output')}</span>
                </div>

                {/* Centerpiece Full-Width Panel (Figma 57554:13774) */}
                <div className="mt-4 p-5 sm:p-7 rounded-[18px] bg-[#f7f8fc] dark:bg-muted/30 border border-[#c9d5ff] space-y-6">
                  {/* Panel Top Row */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#e3e8f2] text-xs">
                    <div className="flex items-center gap-2 font-bold text-[#101828] dark:text-foreground">
                      <span>{t('homepage.howItWorks.phase03.preview.headerIntelligence', 'Business Plan Intelligence')}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#3c61dd]" />
                    </div>
                    <div className="text-[#667085] font-mono">{t('homepage.howItWorks.phase03.preview.stepOf', 'Step 6 of 7')}</div>
                  </div>

                  {/* Two-Column Content Inside Dashboard */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left 7 Steps Checklist (7 cols) */}
                    <div className="lg:col-span-7 space-y-2.5">
                      {/* Step 3.1 */}
                      <div className="p-3 rounded-[10px] bg-white dark:bg-card border border-[#e3e8f2] flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <span className="w-2.5 h-2.5 rounded-full border-2 border-[#3c61dd]" />
                          <span className="font-semibold text-[#101828] dark:text-foreground">
                            {t('homepage.howItWorks.phase03.preview.step1Title', '3.1 Market Intelligence')}
                          </span>
                          <span className="text-[#667085]">
                            · {t('homepage.howItWorks.phase03.preview.step1Desc', 'Market size & 6 competitors mapped')}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-[4px] bg-[#ecfdf5] text-[#008764] font-semibold text-[10px]">
                          {t('homepage.howItWorks.common.completed', 'Completed')}
                        </span>
                      </div>

                      {/* Step 3.2 */}
                      <div className="p-3 rounded-[10px] bg-white dark:bg-card border border-[#e3e8f2] flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <span className="w-2.5 h-2.5 rounded-full border-2 border-[#3c61dd]" />
                          <span className="font-semibold text-[#101828] dark:text-foreground">
                            {t('homepage.howItWorks.phase03.preview.step2Title', '3.2 Business Model')}
                          </span>
                          <span className="text-[#667085]">
                            · {t('homepage.howItWorks.phase03.preview.step2Desc', 'Model canvas ready')}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-[4px] bg-[#ecfdf5] text-[#008764] font-semibold text-[10px]">
                          {t('homepage.howItWorks.common.completed', 'Completed')}
                        </span>
                      </div>

                      {/* Step 3.3 */}
                      <div className="p-3 rounded-[10px] bg-white dark:bg-card border border-[#e3e8f2] flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <span className="w-2.5 h-2.5 rounded-full border-2 border-[#3c61dd]" />
                          <span className="font-semibold text-[#101828] dark:text-foreground">
                            {t('homepage.howItWorks.phase03.preview.step3Title', '3.3 Financial Forecast')}
                          </span>
                          <span className="text-[#667085]">
                            · {t('homepage.howItWorks.phase03.preview.step3Desc', '36-month forecast')}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-[4px] bg-[#ecfdf5] text-[#008764] font-semibold text-[10px]">
                          {t('homepage.howItWorks.common.completed', 'Completed')}
                        </span>
                      </div>

                      {/* Step 3.4 */}
                      <div className="p-3 rounded-[10px] bg-white dark:bg-card border border-[#e3e8f2] flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <span className="w-2.5 h-2.5 rounded-full border-2 border-[#3c61dd]" />
                          <span className="font-semibold text-[#101828] dark:text-foreground">
                            {t('homepage.howItWorks.phase03.preview.step4Title', '3.4 Legal & Compliance')}
                          </span>
                          <span className="text-[#667085]">
                            · {t('homepage.howItWorks.phase03.preview.step4Desc', 'French rules checked')}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-[4px] bg-[#ecfdf5] text-[#008764] font-semibold text-[10px]">
                          {t('homepage.howItWorks.common.completed', 'Completed')}
                        </span>
                      </div>

                      {/* Step 3.5 */}
                      <div className="p-3 rounded-[10px] bg-white dark:bg-card border border-[#e3e8f2] flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <span className="w-2.5 h-2.5 rounded-full border-2 border-[#3c61dd]" />
                          <span className="font-semibold text-[#101828] dark:text-foreground">
                            {t('homepage.howItWorks.phase03.preview.step5Title', '3.5 Formation & Team')}
                          </span>
                          <span className="text-[#667085]">
                            · {t('homepage.howItWorks.phase03.preview.step5Desc', 'Suggested form: SAS-U')}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-[4px] bg-[#ecfdf5] text-[#008764] font-semibold text-[10px]">
                          {t('homepage.howItWorks.common.completed', 'Completed')}
                        </span>
                      </div>

                      {/* Step 3.6 (Current Active Step) */}
                      <div className="p-3 rounded-[10px] bg-[#e8eeff] border border-[#3c61dd] flex items-center justify-between text-xs font-semibold shadow-2xs">
                        <div className="flex items-center gap-2.5 text-[#1f3faf]">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#3c61dd]" />
                          <span>{t('homepage.howItWorks.phase03.preview.step6Title', '3.6 Executive Business Plan')}</span>
                          <span className="font-normal text-[#1f3faf]/80">
                            · {t('homepage.howItWorks.phase03.preview.step6Desc', '12 sections')}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-[4px] bg-[#3c61dd] text-white text-[10px] font-bold">
                          {t('homepage.howItWorks.common.inProgress', 'In progress')}
                        </span>
                      </div>

                      {/* Step 3.7 */}
                      <div className="p-3 rounded-[10px] bg-white dark:bg-card border border-[#e3e8f2] flex items-center justify-between text-xs opacity-75">
                        <div className="flex items-center gap-2.5 text-[#667085]">
                          <span className="w-2.5 h-2.5 rounded-full border-2 border-[#cbd5e1]" />
                          <span>{t('homepage.howItWorks.phase03.preview.step7Title', '3.7 Investor Readiness')}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-[4px] bg-[#f1f5f9] text-[#667085] text-[10px]">
                          {t('homepage.howItWorks.common.notStarted', 'Not started')}
                        </span>
                      </div>
                    </div>

                    {/* Right 2 Output Cards (5 cols) */}
                    <div className="lg:col-span-5 space-y-4">
                      {/* Top Output: Year 1-3 Revenue Bar Chart */}
                      <div className="p-4 rounded-[12px] bg-white dark:bg-card border border-[#e3e8f2] space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-[#101828] dark:text-foreground">
                            {t('homepage.howItWorks.phase03.preview.revenueTitle', 'Year 1–3 revenue')}
                          </span>
                          <span className="text-[11px] text-[#667085]">
                            {t('homepage.howItWorks.phase03.preview.fromForecast', 'From your forecast')}
                          </span>
                        </div>

                        {/* Bar Chart Mockup */}
                        <div className="h-28 flex items-end justify-between gap-3 px-4 pt-4 border-b border-[#f1f5f9]">
                          <div className="flex-1 flex flex-col items-center gap-1.5">
                            <div className="w-full bg-[#99b5ff] rounded-t-[4px] h-12" />
                            <span className="text-[10px] text-[#667085]">Y1</span>
                          </div>
                          <div className="flex-1 flex flex-col items-center gap-1.5">
                            <div className="w-full bg-[#638fff] rounded-t-[4px] h-20" />
                            <span className="text-[10px] text-[#667085]">Y2</span>
                          </div>
                          <div className="flex-1 flex flex-col items-center gap-1.5">
                            <div className="w-full bg-[#3c61dd] rounded-t-[4px] h-28" />
                            <span className="text-[10px] text-[#667085]">Y3</span>
                          </div>
                        </div>

                        <div className="text-[11px] text-right text-[#667085]">
                          {t('homepage.howItWorks.phase03.preview.trajectoryScale', 'Relative trajectory scale')}
                        </div>
                      </div>

                      {/* Bottom Output: Investor Readiness Dial / Score */}
                      <div className="p-4 rounded-[12px] bg-white dark:bg-card border border-[#e3e8f2] space-y-2 text-center">
                        <div className="text-left text-xs font-semibold text-[#101828] dark:text-foreground">
                          {t('homepage.howItWorks.phase03.preview.investorReadiness', 'Investor readiness')}
                        </div>
                        <div className="py-2 flex items-center justify-center">
                          <div className="w-16 h-16 rounded-full border-4 border-dashed border-[#cbd5e1] flex items-center justify-center text-lg font-bold text-[#667085]">
                            —
                          </div>
                        </div>
                        <div className="text-[11px] text-[#667085]">
                          {t('homepage.howItWorks.phase03.preview.investorUnlock', 'A planning self-check. Unlocks at step 3.7.')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* STEP 04: PHASE 04 · BUILD & LAUNCH PREP (Figma 57554:13900) */}
          {/* ===================================================================== */}
          <div id="phase-04" className="relative flex flex-col md:flex-row gap-6 items-stretch">
            <SpineNode step={4} activeStep={activeStep} onSelect={scrollToStep} />

            <div className="flex-1 min-w-0">
              <div className={`rounded-[24px] border ${activeStep === 4 ? 'border-[#3c61dd] ring-2 ring-[#3c61dd]/20' : 'border-[#e3e8f2]'} dark:border-border bg-white dark:bg-card p-6 sm:p-8 shadow-sm transition-all duration-300`}>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  {/* Left Text */}
                  <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
                    <div className="space-y-3">
                      <div className="text-xs font-semibold text-[#667085] tracking-wider uppercase font-mono">
                        {t('homepage.howItWorks.phase04.eyebrow')}
                      </div>
                      <h3 className="text-2xl sm:text-[28px] font-semibold text-[#101828] dark:text-foreground font-heading">
                        {t('homepage.howItWorks.phase04.title')}
                      </h3>
                      <p className="text-base sm:text-[17px] text-[#667085] dark:text-muted-foreground leading-relaxed font-sans font-normal">
                        {t('homepage.howItWorks.phase04.description')}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-[#e3e8f2] flex items-center gap-2 text-sm">
                      <span className="text-[#667085]">{t('homepage.howItWorks.phase04.youGet')}</span>
                      <span className="font-semibold text-[#101828] dark:text-foreground">{t('homepage.howItWorks.phase04.output')}</span>
                    </div>
                  </div>

                  {/* Right Preview */}
                  <div className="lg:col-span-7 p-5 rounded-[16px] bg-[#f7f8fc] dark:bg-muted/30 border border-[#e3e8f2] space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-[#e3e8f2] text-xs">
                      <span className="text-[#667085]">{t('homepage.howItWorks.phase04.preview.headerTitle', 'Construction & launch')}</span>
                      <span className="px-2.5 py-0.5 rounded-[6px] bg-[#e8eeff] text-[#1f3faf] font-semibold text-[11px]">
                        {t('homepage.howItWorks.common.inProgress', 'In progress')}
                      </span>
                    </div>

                    {/* 4 Horizon Bar */}
                    <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                      <div className="p-2 rounded-[8px] bg-white border border-[#3c61dd] text-[#101828]">
                        <div className="font-bold text-[#3c61dd] flex items-center justify-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#3c61dd]" /> {t('homepage.howItWorks.phase04.preview.nowTitle', 'NOW')}
                        </div>
                        <div className="font-semibold text-[10px] text-[#101828] mt-1">
                          {t('homepage.howItWorks.phase04.preview.nowTask', 'Talk to 5 customers')}
                        </div>
                        <div className="text-[9px] text-[#667085]">
                          {t('homepage.howItWorks.phase04.preview.nowTaskSub', 'Set your first price')}
                        </div>
                      </div>
                      <div className="p-2 rounded-[8px] bg-white border border-[#e3e8f2] text-[#667085]">
                        <div className="font-bold text-[#667085] flex items-center justify-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#cbd5e1]" /> {t('homepage.howItWorks.phase04.preview.thirtyDays', '30 DAYS')}
                        </div>
                        <div className="text-[9px] mt-1">
                          {t('homepage.howItWorks.phase04.preview.thirtyDaysTask', 'Finalize prototype')}
                        </div>
                      </div>
                      <div className="p-2 rounded-[8px] bg-white border border-[#e3e8f2] text-[#667085]">
                        <div className="font-bold text-[#667085] flex items-center justify-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#cbd5e1]" /> {t('homepage.howItWorks.phase04.preview.sixtyDays', '60 DAYS')}
                        </div>
                        <div className="text-[9px] mt-1">
                          {t('homepage.howItWorks.phase04.preview.sixtyDaysTask', 'Closed pilot group')}
                        </div>
                      </div>
                      <div className="p-2 rounded-[8px] bg-white border border-[#e3e8f2] text-[#667085]">
                        <div className="font-bold text-[#667085] flex items-center justify-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#cbd5e1]" /> {t('homepage.howItWorks.phase04.preview.ninetyDays', '90 DAYS')}
                        </div>
                        <div className="text-[9px] mt-1">
                          {t('homepage.howItWorks.phase04.preview.ninetyDaysTask', 'Public opening')}
                        </div>
                      </div>
                    </div>

                    {/* Skills + Support */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      <div className="p-3 rounded-[8px] bg-white border border-[#e3e8f2] space-y-1.5">
                        <div className="text-[10px] font-bold text-[#667085] font-mono">
                          {t('homepage.howItWorks.phase04.preview.skillsRoadmap', 'SKILLS ROADMAP')}
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span>{t('homepage.howItWorks.phase04.preview.salesBasics', 'Sales basics')}</span>
                          <span className="px-1.5 py-0.5 rounded bg-[#f5f5f5] text-[9px] font-bold">
                            {t('homepage.howItWorks.phase04.preview.learnBadge', 'LEARN')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span>{t('homepage.howItWorks.phase04.preview.appDev', 'App development')}</span>
                          <span className="px-1.5 py-0.5 rounded bg-[#f5f5f5] text-[9px] font-bold">
                            {t('homepage.howItWorks.phase04.preview.delegateBadge', 'DELEGATE')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span>{t('homepage.howItWorks.phase04.preview.gdpr', 'Data protection (GDPR)')}</span>
                          <span className="px-1.5 py-0.5 rounded bg-[#f5f5f5] text-[9px] font-bold">
                            {t('homepage.howItWorks.phase04.preview.verifyBadge', 'VERIFY')}
                          </span>
                        </div>
                      </div>

                      <div className="p-3 rounded-[8px] bg-white border border-[#e3e8f2] space-y-1.5">
                        <div className="text-[10px] font-bold text-[#667085] font-mono">
                          {t('homepage.howItWorks.phase04.preview.supportPrograms', 'SUPPORT PROGRAMS')}
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span>{t('homepage.howItWorks.phase04.preview.jeiStatus', 'JEI status')}</span>
                          <span className="text-[#667085] text-[10px]">
                            {t('homepage.howItWorks.phase04.preview.needsReview', 'Needs review')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span>{t('homepage.howItWorks.phase04.preview.bpifrance', 'Bpifrance support')}</span>
                          <span className="text-[#667085] text-[10px]">
                            {t('homepage.howItWorks.phase04.preview.needsReview', 'Needs review')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Launch Website Row (Figma 57554:14005) */}
                    <div className="p-3 rounded-[8px] bg-white border border-[#e3e8f2] flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-[#eff6ff] flex items-center justify-center text-[#3c61dd]">
                          <Globe className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-semibold text-[#101828]">
                          {t('homepage.howItWorks.phase04.preview.launchWebsite', 'Launch website')}
                        </span>
                        <span className="text-[#667085]">
                          · {t('homepage.howItWorks.phase04.preview.onePage', 'One page')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="px-2.5 py-1 rounded-[6px] border border-[#e3e8f2] text-xs font-semibold text-[#101828] hover:bg-[#f8fafc] cursor-pointer">
                          {t('homepage.howItWorks.phase04.preview.viewBtn', 'View')}
                        </button>
                        <button className="px-2.5 py-1 rounded-[6px] border border-[#e3e8f2] text-xs font-semibold text-[#101828] hover:bg-[#f8fafc] cursor-pointer">
                          {t('homepage.howItWorks.phase04.preview.downloadCodeBtn', 'Download code')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* STEP 05: PHASE 05 · COMPANY (Figma 57554:14017) */}
          {/* ===================================================================== */}
          <div id="phase-05" className="relative flex flex-col md:flex-row gap-6 items-stretch">
            <SpineNode step={5} activeStep={activeStep} onSelect={scrollToStep} />

            <div className="flex-1 min-w-0">
              <div className={`rounded-[24px] border ${activeStep === 5 ? 'border-[#3c61dd] ring-2 ring-[#3c61dd]/20' : 'border-[#e3e8f2]'} dark:border-border bg-white dark:bg-card p-6 sm:p-8 shadow-sm transition-all duration-300`}>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  {/* Left Text */}
                  <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
                    <div className="space-y-3">
                      <div className="text-xs font-semibold text-[#667085] tracking-wider uppercase font-mono">
                        {t('homepage.howItWorks.phase05.eyebrow')}
                      </div>
                      <h3 className="text-2xl sm:text-[28px] font-semibold text-[#101828] dark:text-foreground font-heading">
                        {t('homepage.howItWorks.phase05.title')}
                      </h3>
                      <p className="text-base sm:text-[17px] text-[#667085] dark:text-muted-foreground leading-relaxed font-sans font-normal">
                        {t('homepage.howItWorks.phase05.description')}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-[#e3e8f2] flex items-center gap-2 text-sm">
                      <span className="text-[#667085]">{t('homepage.howItWorks.phase05.youGet')}</span>
                      <span className="font-semibold text-[#101828] dark:text-foreground">{t('homepage.howItWorks.phase05.output')}</span>
                    </div>
                  </div>

                  {/* Right Preview */}
                  <div className="lg:col-span-7 p-5 rounded-[16px] bg-[#f7f8fc] dark:bg-muted/30 border border-[#e3e8f2] space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-[#e3e8f2] text-xs">
                      <span className="text-[#667085]">{t('homepage.howItWorks.phase05.preview.headerTitle', 'Your registration guide')}</span>
                      <span className="px-2.5 py-0.5 rounded-[6px] bg-[#e8eeff] text-[#1f3faf] font-semibold text-[11px]">
                        {t('homepage.howItWorks.common.inProgress', 'In progress')}
                      </span>
                    </div>

                    {/* 3 Metrics */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-3 rounded-[8px] bg-white border border-[#e3e8f2]">
                        <div className="text-[10px] text-[#667085]">{t('homepage.howItWorks.phase05.preview.legalForm', 'Legal form')}</div>
                        <div className="text-sm font-bold text-[#101828] mt-0.5">{t('homepage.howItWorks.phase05.preview.legalFormVal', 'SAS-U')}</div>
                      </div>
                      <div className="p-3 rounded-[8px] bg-white border border-[#e3e8f2]">
                        <div className="text-[10px] text-[#667085]">{t('homepage.howItWorks.phase05.preview.shareCapital', 'Share capital')}</div>
                        <div className="text-sm font-bold text-[#101828] mt-0.5">{t('homepage.howItWorks.phase05.preview.shareCapitalVal', '€1')}</div>
                      </div>
                      <div className="p-3 rounded-[8px] bg-white border border-[#e3e8f2]">
                        <div className="text-[10px] text-[#667085]">{t('homepage.howItWorks.phase05.preview.documents', 'Documents')}</div>
                        <div className="text-sm font-bold text-[#101828] mt-0.5">{t('homepage.howItWorks.phase05.preview.documentsVal', '3 of 5 ready')}</div>
                      </div>
                    </div>

                    {/* 4-Step Tracker */}
                    <div className="p-3 rounded-[8px] bg-white border border-[#e3e8f2] space-y-2 text-xs">
                      <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                        <div className="p-1.5 rounded bg-[#f8fafc]">
                          <div className="text-[#667085]">{t('homepage.howItWorks.phase05.preview.companyDetails', 'Company details')}</div>
                          <div className="text-[#008764] font-semibold mt-0.5">{t('homepage.howItWorks.common.completed', 'Completed')}</div>
                        </div>
                        <div className="p-1.5 rounded bg-[#f8fafc]">
                          <div className="text-[#667085]">{t('homepage.howItWorks.phase05.preview.capital', 'Capital')}</div>
                          <div className="text-[#008764] font-semibold mt-0.5">{t('homepage.howItWorks.common.completed', 'Completed')}</div>
                        </div>
                        <div className="p-1.5 rounded bg-[#f8fafc]">
                          <div className="text-[#667085]">{t('homepage.howItWorks.phase05.preview.documents', 'Documents')}</div>
                          <div className="text-[#1f3faf] font-semibold mt-0.5">{t('homepage.howItWorks.common.inProgress', 'In progress')}</div>
                        </div>
                        <div className="p-1.5 rounded bg-[#f8fafc]">
                          <div className="text-[#667085]">{t('homepage.howItWorks.phase05.preview.registration', 'Registration')}</div>
                          <div className="text-[#667085] font-semibold mt-0.5">{t('homepage.howItWorks.common.notStarted', 'Not started')}</div>
                        </div>
                      </div>
                    </div>

                    <div className="text-center text-[10px] text-[#667085]">
                      {t('homepage.howItWorks.phase05.preview.footerNote', 'Only SAS, SAS-U and SARL for now.')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* STEP 06: PHASE 06 · NEXT CHAPTER (Figma 57554:14078) */}
          {/* ===================================================================== */}
          <div id="phase-06" className="relative flex flex-col md:flex-row gap-6 items-stretch">
            <SpineNode step={6} activeStep={activeStep} isLast onSelect={scrollToStep} />

            <div className="flex-1 min-w-0">
              <div className={`rounded-[24px] border ${activeStep === 6 ? 'border-[#3c61dd] ring-2 ring-[#3c61dd]/20' : 'border-[#e3e8f2]'} dark:border-border bg-white dark:bg-card p-6 sm:p-8 shadow-sm relative overflow-hidden transition-all duration-300`}>
                {/* 2px green accent line along top edge (Figma 57554:14175) */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#00c896]/60" />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  {/* Left Text */}
                  <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-[#667085] tracking-wider uppercase font-mono">
                        <LayoutGrid className="w-4 h-4 text-[#667085]" />
                        <span>{t('homepage.howItWorks.phase06.eyebrow')}</span>
                      </div>
                      <h3 className="text-2xl sm:text-[28px] font-semibold text-[#101828] dark:text-foreground font-heading leading-tight">
                        {t('homepage.howItWorks.phase06.title')}
                      </h3>
                      <p className="text-base sm:text-[17px] text-[#667085] dark:text-muted-foreground leading-relaxed font-sans font-normal">
                        {t('homepage.howItWorks.phase06.description')}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-[#e3e8f2] flex items-center gap-2 text-sm font-sans">
                      <span className="text-[#667085]">{t('homepage.howItWorks.phase06.youGet')}</span>
                      <span className="font-medium text-[#101828] dark:text-foreground">{t('homepage.howItWorks.phase06.output')}</span>
                    </div>
                  </div>

                  {/* Right Product Preview (Figma 57554:14096) */}
                  <div className="lg:col-span-7 p-5 sm:p-6 rounded-[16px] bg-[#f7f8fc] dark:bg-muted/30 border border-[#e3e8f2] dark:border-border/70 space-y-4">
                    {/* Top Header Row */}
                    <div className="flex items-center justify-between text-xs font-sans text-[#667085] dark:text-muted-foreground">
                      <span>{t('homepage.howItWorks.phase06.preview.headerTitle', 'Your next chapter')}</span>
                      <span>{t('homepage.howItWorks.phase06.preview.calmOverview', 'Calm overview')}</span>
                    </div>

                    {/* 2 Equal Columns (6 cols / 6 cols in Figma 57554:14103) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-start">
                      {/* Part 1: Left column - Milestones & Your Results (Figma 57554:14104) */}
                      <div className="bg-white dark:bg-card rounded-[12px] border border-[#e3e8f2] dark:border-border/60 p-3.5 sm:p-4 space-y-3 shadow-2xs">
                        {/* Milestones header */}
                        <div className="space-y-1">
                          <div className="font-bold text-[13px] text-[#101828] dark:text-foreground font-sans leading-snug">
                            {t('homepage.howItWorks.phase06.preview.milestone1', "You've built your project plan")}
                          </div>
                          <div className="text-[12px] text-[#667085] dark:text-muted-foreground font-sans">
                            {t('homepage.howItWorks.phase06.preview.milestone2', 'Company registration: in progress')}
                          </div>
                        </div>

                        {/* Divider */}
                        <div className="border-t border-[#e3e8f2] dark:border-border/60 pt-2.5 space-y-2">
                          <div className="text-[11px] font-semibold text-[#667085] font-mono tracking-wider uppercase">
                            {t('homepage.howItWorks.phase06.preview.yourResults', 'YOUR RESULTS')}
                          </div>

                          {/* 4 Deliverable Result Rows */}
                          <div className="space-y-2 text-xs font-sans">
                            <div className="flex items-center justify-between">
                              <span className="text-[#101828] dark:text-foreground text-[12px]">
                                {t('homepage.howItWorks.phase06.preview.projectBrand', 'Project & brand')} <span className="text-[#667085] text-[11px]">(4)</span>
                              </span>
                              <span className="px-2 py-0.5 rounded-[4px] bg-[#00c896]/15 text-[#008764] dark:text-emerald-400 text-[10px] font-medium">
                                {t('homepage.howItWorks.common.available', 'Available')}
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-[#101828] dark:text-foreground text-[12px]">
                                {t('homepage.howItWorks.phase06.preview.businessPlanning', 'Business planning')} <span className="text-[#667085] text-[11px]">(4)</span>
                              </span>
                              <span className="px-2 py-0.5 rounded-[4px] bg-[#00c896]/15 text-[#008764] dark:text-emerald-400 text-[10px] font-medium">
                                {t('homepage.howItWorks.common.available', 'Available')}
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-[#101828] dark:text-foreground text-[12px]">
                                {t('homepage.howItWorks.phase06.preview.buildLaunch', 'Build & launch')} <span className="text-[#667085] text-[11px]">(6)</span>
                              </span>
                              <span className="px-2 py-0.5 rounded-[4px] bg-[#eef0f4] dark:bg-muted text-[#101828] dark:text-foreground text-[10px] font-medium">
                                {t('homepage.howItWorks.common.draft', 'Draft')}
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-[#101828] dark:text-foreground text-[12px]">
                                {t('homepage.howItWorks.phase06.preview.companyPrep', 'Company preparation')} <span className="text-[#667085] text-[11px]">(2)</span>
                              </span>
                              <span className="px-2 py-0.5 rounded-[4px] bg-[#e8eeff] dark:bg-blue-950/60 text-[#1f3faf] dark:text-blue-300 text-[10px] font-medium">
                                {t('homepage.howItWorks.common.inProgress', 'In progress')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Part 2: Right column - Your next move (Figma 57554:14138) */}
                      <div className="space-y-2">
                        <div className="text-[11px] font-semibold text-[#667085] font-mono tracking-wider uppercase mb-1">
                          {t('homepage.howItWorks.phase06.preview.yourNextMove', 'YOUR NEXT MOVE')}
                        </div>

                        {/* Action 1: Primary Action (Blue highlight) */}
                        <button className="w-full h-12 px-3 rounded-[12px] bg-[#e8eeff] dark:bg-blue-950/40 border border-[#c9d5ff] dark:border-blue-800/60 flex items-center justify-between text-left transition-colors hover:bg-[#dce6ff] group cursor-pointer">
                          <span className="text-[12px] font-semibold text-[#1f3faf] dark:text-blue-300 font-sans">
                            {t('homepage.howItWorks.phase06.preview.continuePrep', 'Continue company preparation')}
                          </span>
                          <ArrowRight className="w-4 h-4 text-[#1f3faf] dark:text-blue-300 shrink-0 transition-transform group-hover:translate-x-0.5" />
                        </button>

                        {/* Action 2 */}
                        <button className="w-full h-12 px-3 rounded-[12px] bg-white dark:bg-card border border-[#e3e8f2] dark:border-border/60 flex items-center justify-between text-left transition-colors hover:bg-[#f8fafc] group cursor-pointer">
                          <span className="text-[12px] font-medium text-[#101828] dark:text-foreground font-sans">
                            {t('homepage.howItWorks.phase06.preview.workLaunch', 'Work on your next launch task')}
                          </span>
                          <ArrowRight className="w-4 h-4 text-[#667085] dark:text-muted-foreground shrink-0 transition-transform group-hover:translate-x-0.5" />
                        </button>

                        {/* Action 3 */}
                        <button className="w-full h-12 px-3 rounded-[12px] bg-white dark:bg-card border border-[#e3e8f2] dark:border-border/60 flex items-center justify-between text-left transition-colors hover:bg-[#f8fafc] group cursor-pointer">
                          <span className="text-[12px] font-medium text-[#101828] dark:text-foreground font-sans">
                            {t('homepage.howItWorks.phase06.preview.reviewPricing', 'Review your pricing')}
                          </span>
                          <ArrowRight className="w-4 h-4 text-[#667085] dark:text-muted-foreground shrink-0 transition-transform group-hover:translate-x-0.5" />
                        </button>
                      </div>
                    </div>

                    {/* Part 3: Strip across bottom - Coming to MBC (Full width 12 cols, Figma 57554:14156) */}
                    <div className="pt-3 border-t border-[#e3e8f2] dark:border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="text-[11px] font-semibold text-[#667085] font-mono tracking-wider uppercase shrink-0">
                        {t('homepage.howItWorks.phase06.preview.comingToMbc', 'COMING TO MBC')}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="px-3 py-1.5 rounded-[10px] bg-white dark:bg-card border border-[#e3e8f2] dark:border-border/60 flex items-center gap-2 shadow-2xs">
                          <span className="text-[11px] text-[#101828] dark:text-foreground font-sans font-normal">
                            {t('homepage.howItWorks.phase06.preview.entrepreneur', 'Entrepreneur')}
                          </span>
                          <span className="px-1.5 py-0.5 rounded-[4px] bg-[#eef0f4] dark:bg-muted text-[10px] text-[#667085] dark:text-muted-foreground font-sans">
                            {t('homepage.howItWorks.common.comingSoon', 'Coming soon')}
                          </span>
                        </div>

                        <div className="px-3 py-1.5 rounded-[10px] bg-white dark:bg-card border border-[#e3e8f2] dark:border-border/60 flex items-center gap-2 shadow-2xs">
                          <span className="text-[11px] text-[#101828] dark:text-foreground font-sans font-normal">
                            {t('homepage.howItWorks.phase06.preview.investor', 'Investor')}
                          </span>
                          <span className="px-1.5 py-0.5 rounded-[4px] bg-[#eef0f4] dark:bg-muted text-[10px] text-[#667085] dark:text-muted-foreground font-sans">
                            {t('homepage.howItWorks.common.comingSoon', 'Coming soon')}
                          </span>
                        </div>

                        <div className="px-3 py-1.5 rounded-[10px] bg-white dark:bg-card border border-[#e3e8f2] dark:border-border/60 flex items-center gap-2 shadow-2xs">
                          <span className="text-[11px] text-[#101828] dark:text-foreground font-sans font-normal">
                            {t('homepage.howItWorks.phase06.preview.serviceProvider', 'Service Provider')}
                          </span>
                          <span className="px-1.5 py-0.5 rounded-[4px] bg-[#eef0f4] dark:bg-muted text-[10px] text-[#667085] dark:text-muted-foreground font-sans">
                            {t('homepage.howItWorks.common.comingSoon', 'Coming soon')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Breadcrumb Sequence (Figma 57554:14214) */}
        <div className="mt-12 md:mt-[68px] flex flex-col items-center justify-center space-y-4 text-center">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm font-semibold text-[#101828]">
            {breadcrumbs.map((b, idx, arr) => (
              <React.Fragment key={b.num}>
                <button
                  type="button"
                  onClick={() => scrollToStep(b.num)}
                  aria-label={`Jump to Phase 0${b.num}: ${b.label}`}
                  className={`px-3 py-1.5 rounded-full border transition-all cursor-pointer font-sans focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3c61dd] whitespace-nowrap shrink-0 ${
                    activeStep === b.num
                      ? 'bg-[#e8eeff] text-[#1f3faf] border-[#3c61dd] shadow-xs ring-1 ring-[#3c61dd]/30'
                      : activeStep > b.num
                      ? 'bg-white text-[#101828] border-[#00c896]/50 shadow-2xs hover:border-[#00c896]'
                      : 'bg-white border-[#e3e8f2] text-[#667085] shadow-2xs hover:border-[#c9d5ff] hover:text-[#101828]'
                  }`}
                >
                  {b.label}
                </button>
                {idx < arr.length - 1 && <span className="text-[#98a2b3]">→</span>}
              </React.Fragment>
            ))}
          </div>

          <p className="text-sm text-[#667085] font-sans">
            {t('homepage.howItWorks.connectedLabels')}
          </p>
        </div>

      </div>
    </section>
  );
}
