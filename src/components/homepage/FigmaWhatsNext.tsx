'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Briefcase, 
  TrendingUp, 
  UserCog, 
  LayoutGrid, 
  Check,
  ArrowRight
} from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';

export default function FigmaWhatsNext() {
  const { t } = useLanguage();

  const headline = t('homepage.whatsNext.headline');
  const headlineWords = headline.split(' ');
  const mainHeadline = headlineWords.slice(0, -1).join(' ');
  const highlightWord = headlineWords.slice(-1)[0];

  return (
    <section 
      id="whats-next" 
      className="relative w-full overflow-hidden py-16 sm:py-20 lg:py-[100px] xl:py-[120px] px-4 sm:px-6 md:px-8 lg:px-[45px] bg-[#f7f9fc] dark:bg-background border-b border-[#e8ecf2] dark:border-border"
      data-testid="figma-whats-next"
    >
      
      {/* 48px Dot Grid Pattern & Ambient Center Radial Glow (Figma 57554:13449 & 57554:13452) */}
      <div 
        className="absolute inset-0 opacity-40 pointer-events-none -z-0"
        style={{
          backgroundImage: 'radial-gradient(#cbd5e1 1.5px, transparent 1.5px)',
          backgroundSize: '48px 48px'
        }}
      />
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none -z-0" 
        style={{
          background: 'radial-gradient(circle, rgba(60, 97, 221, 0.12) 0%, rgba(60, 97, 221, 0) 70%)'
        }}
      />

      <div className="relative z-10 w-full max-w-[1350px] 2xl:max-w-[1520px] mx-auto">
        
        {/* ========================================================================= */}
        {/* Intro Stack (Figma 57554:13454 - 760px max width) */}
        {/* ========================================================================= */}
        <div className="flex flex-col items-center text-center max-w-[785px] mx-auto mb-16 sm:mb-20 space-y-4">
          
          {/* Eyebrow Badge (Figma 57554:13456 - 132x30px) */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#e8eeff] dark:bg-blue-950/70 text-[#1f3faf] dark:text-blue-300 text-[12px] font-bold font-mono tracking-[1.2px] uppercase shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3c61dd] shrink-0" />
            <span>{t('homepage.whatsNext.eyebrow')}</span>
          </div>

          {/* Heading 2 (Figma 57554:13461 - Syne 700 54px lh:60px ls:-1.92px) */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-bold text-[#101828] dark:text-foreground tracking-tight leading-[1.1] font-heading">
            <span>{mainHeadline}</span>
            <br className="hidden sm:inline" />{' '}
            <span className="text-[#3c61dd]">{highlightWord}</span>
          </h2>

          {/* Subline (Figma 57554:13463 - DM Sans 400 18px lh:26px) */}
          <p className="max-w-[563px] text-base sm:text-lg md:text-[18px] text-[#667085] dark:text-muted-foreground leading-relaxed font-sans font-normal">
            {t('homepage.whatsNext.subline')}
          </p>
        </div>

        {/* ========================================================================= */}
        {/* Orbital Network Diagram Layout with Connectors (Figma 57554:13465 - 1152x478px) */}
        {/* ========================================================================= */}
        <div className="relative max-w-[1152px] mx-auto mb-16 sm:mb-20">
          
          {/* Desktop Exact Curved SVG Connectors from Figma 57554:13466 */}
          <svg 
            className="hidden lg:block absolute inset-0 w-full h-[470px] pointer-events-none z-0" 
            viewBox="0 0 1152 470" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
          >
            {/* Top-Left Curve: Hub to Entrepreneur */}
            <path 
              d="M412.8 201.4C326.4 201.4 297.6 109.24 249.6 109.24" 
              strokeWidth="1.44" 
              strokeLinecap="round" 
              stroke="url(#paint0_linear_57554_13466)"
            />
            <path 
              d="M355.2 172.6C355.2 173.659 356.061 174.52 357.12 174.52C358.18 174.52 359.04 173.659 359.04 172.6C359.04 171.54 358.18 170.68 357.12 170.68C356.061 170.68 355.2 171.54 355.2 172.6V172.6" 
              fill="#6F8BFF"
            />
            <path 
              d="M281.28 120.76C281.28 121.82 282.141 122.68 283.2 122.68C284.26 122.68 285.12 121.82 285.12 120.76C285.12 119.7 284.26 118.84 283.2 118.84C282.141 118.84 281.28 119.7 281.28 120.76V120.76" 
              fill="#6F8BFF"
            />

            {/* Bottom-Left Curve: Hub to Investor */}
            <path 
              d="M412.8 268.6C326.4 268.6 297.6 358.84 249.6 358.84" 
              strokeWidth="1.44" 
              strokeLinecap="round" 
              stroke="url(#paint1_linear_57554_13466)"
            />
            <path 
              d="M355.2 297.4C355.2 298.46 356.061 299.32 357.12 299.32C358.18 299.32 359.04 298.46 359.04 297.4C359.04 296.341 358.18 295.48 357.12 295.48C356.061 295.48 355.2 296.341 355.2 297.4V297.4" 
              fill="#6F8BFF"
            />
            <path 
              d="M281.28 347.32C281.28 348.38 282.141 349.24 283.2 349.24C284.26 349.24 285.12 348.38 285.12 347.32C285.12 346.261 284.26 345.4 283.2 345.4C282.141 345.4 281.28 346.261 281.28 347.32V347.32" 
              fill="#6F8BFF"
            />

            {/* Top-Right Curve: Hub to Service Provider */}
            <path 
              d="M739.2 201.4C825.6 201.4 854.4 109.24 902.4 109.24" 
              strokeWidth="1.44" 
              strokeLinecap="round" 
              stroke="url(#paint2_linear_57554_13466)"
            />
            <path 
              d="M792.96 172.6C792.96 173.659 793.82 174.52 794.88 174.52C795.94 174.52 796.8 173.659 796.8 172.6C796.8 171.54 795.94 170.68 794.88 170.68C793.82 170.68 792.96 171.54 792.96 172.6V172.6" 
              fill="#3C61DD"
            />
            <path 
              d="M866.88 120.76C866.88 121.82 867.74 122.68 868.8 122.68C869.86 122.68 870.72 121.82 870.72 120.76C870.72 119.7 869.86 118.84 868.8 118.84C867.74 118.84 866.88 119.7 866.88 120.76V120.76" 
              fill="#6F8BFF"
            />

            {/* Bottom-Right Curve: Hub to Marketplace */}
            <path 
              d="M739.2 268.6C825.6 268.6 854.4 358.84 902.4 358.84" 
              strokeWidth="1.44" 
              strokeLinecap="round" 
              stroke="url(#paint3_linear_57554_13466)"
            />
            <path 
              d="M792.96 297.4C792.96 298.46 793.82 299.32 794.88 299.32C795.94 299.32 796.8 298.46 796.8 297.4C796.8 296.341 795.94 295.48 794.88 295.48C793.82 295.48 792.96 296.341 792.96 297.4V297.4" 
              fill="#6F8BFF"
            />
            <path 
              d="M866.88 347.32C866.88 348.38 867.74 349.24 868.8 349.24C869.86 349.24 870.72 348.38 870.72 347.32C870.72 346.261 869.86 345.4 868.8 345.4C867.74 345.4 866.88 346.261 866.88 347.32V347.32" 
              fill="#6F8BFF"
            />

            <defs>
              <linearGradient id="paint0_linear_57554_13466" x1="412.8" y1="201.4" x2="249.6" y2="109.24" gradientUnits="userSpaceOnUse">
                <stop stopColor="#3C61DD"/>
                <stop offset="1" stopColor="#3C61DD" stopOpacity="0.15"/>
              </linearGradient>
              <linearGradient id="paint1_linear_57554_13466" x1="412.8" y1="268.6" x2="249.6" y2="358.84" gradientUnits="userSpaceOnUse">
                <stop stopColor="#3C61DD"/>
                <stop offset="1" stopColor="#3C61DD" stopOpacity="0.15"/>
              </linearGradient>
              <linearGradient id="paint2_linear_57554_13466" x1="739.2" y1="201.4" x2="902.4" y2="109.24" gradientUnits="userSpaceOnUse">
                <stop stopColor="#3C61DD"/>
                <stop offset="1" stopColor="#3C61DD" stopOpacity="0.45"/>
              </linearGradient>
              <linearGradient id="paint3_linear_57554_13466" x1="739.2" y1="268.6" x2="902.4" y2="358.84" gradientUnits="userSpaceOnUse">
                <stop stopColor="#3C61DD"/>
                <stop offset="1" stopColor="#3C61DD" stopOpacity="0.15"/>
              </linearGradient>
            </defs>
          </svg>

          {/* 3-Column Layout: Left Satellites, Center Hub, Right Satellites */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-0 relative z-10 w-full max-w-[1152px] mx-auto">
            
            {/* --------------------------------------------------------------- */}
            {/* Left Column (2 Satellite Cards: Entrepreneur & Investor) */}
            {/* --------------------------------------------------------------- */}
            <div className="w-full lg:w-[260px] flex flex-col space-y-4 lg:space-y-[115px] order-2 lg:order-1">
              
              {/* Top-Left: Entrepreneur Card (Figma 57554:13479 - 260x148px r:20) */}
              <div className="w-full p-6 rounded-[20px] bg-white dark:bg-card border border-[#e3e8f2] dark:border-border shadow-[0_1px_2px_rgba(16,24,40,0.04),0_10px_30px_rgba(16,24,40,0.05)] flex flex-col justify-between min-h-[148px] hover:border-[#3c61dd]/40 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-[10px] bg-[#e8eeff] dark:bg-blue-950/60 flex items-center justify-center text-[#3c61dd] dark:text-blue-400 group-hover:scale-105 transition-transform">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-[6px] border border-[#e3e8f2] dark:border-border text-[11px] font-semibold text-[#98a2b3] font-mono tracking-wider">
                    {t('homepage.whatsNext.soon')}
                  </span>
                </div>
                <div>
                  <h4 className="text-[20px] font-semibold text-[#101828] dark:text-foreground font-heading leading-tight">
                    {t('homepage.whatsNext.entrepreneur.title')}
                  </h4>
                  <p className="text-[14px] text-[#667085] dark:text-muted-foreground mt-1 leading-normal font-sans">
                    {t('homepage.whatsNext.entrepreneur.description')}
                  </p>
                </div>
              </div>

              {/* Bottom-Left: Investor Card (Figma 57554:13491 - 260x148px r:20) */}
              <div className="w-full p-6 rounded-[20px] bg-white dark:bg-card border border-[#e3e8f2] dark:border-border shadow-[0_1px_2px_rgba(16,24,40,0.04),0_10px_30px_rgba(16,24,40,0.05)] flex flex-col justify-between min-h-[148px] hover:border-[#3c61dd]/40 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-[10px] bg-[#e8eeff] dark:bg-blue-950/60 flex items-center justify-center text-[#3c61dd] dark:text-blue-400 group-hover:scale-105 transition-transform">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-[6px] border border-[#e3e8f2] dark:border-border text-[11px] font-semibold text-[#98a2b3] font-mono tracking-wider">
                    {t('homepage.whatsNext.soon')}
                  </span>
                </div>
                <div>
                  <h4 className="text-[20px] font-semibold text-[#101828] dark:text-foreground font-heading leading-tight">
                    {t('homepage.whatsNext.investor.title')}
                  </h4>
                  <p className="text-[14px] text-[#667085] dark:text-muted-foreground mt-1 leading-normal font-sans">
                    {t('homepage.whatsNext.investor.description')}
                  </p>
                </div>
              </div>

            </div>

            {/* --------------------------------------------------------------- */}
            {/* Center Hub: Creator (Figma 57554:13528 - 340px wide r:24 bg:#3c61dd) */}
            {/* --------------------------------------------------------------- */}
            <div className="w-full max-w-[340px] p-7 sm:p-8 rounded-[24px] bg-[#3c61dd] text-white shadow-[0_20px_50px_rgba(60,97,221,0.3)] flex flex-col justify-between relative overflow-hidden order-1 lg:order-2">
              
              {/* Top Row: CREATOR badge + Available now pill */}
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold tracking-[1.5px] font-mono uppercase text-white/95">
                  {t('homepage.whatsNext.hub.badge')}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-[#101828] text-[12px] font-medium shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00c896] shrink-0" />
                  <span>{t('homepage.whatsNext.hub.available')}</span>
                </span>
              </div>

              {/* Hub Title */}
              <h3 className="text-[24px] sm:text-[26px] font-semibold text-white leading-tight font-heading mt-4 mb-4">
                {t('homepage.whatsNext.hub.title')}
              </h3>

              {/* Mini Project Preview Inset (Figma 57554:13539 - White Box) */}
              <div className="p-4 rounded-[16px] bg-white text-[#101828] space-y-3.5 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-[8px] bg-[#3c61dd] text-white font-bold flex items-center justify-center text-[13px] font-heading shrink-0">
                    CF
                  </div>
                  <div className="min-w-0">
                    <div className="text-[15px] font-semibold text-[#101828] leading-tight truncate">
                      {t('homepage.whatsNext.hub.projectName')}
                    </div>
                    <div className="text-[13px] text-[#667085] leading-tight truncate">
                      {t('homepage.whatsNext.hub.projectDesc')}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-[#667085]">{t('homepage.whatsNext.hub.phase')}</span>
                    <span className="text-[#3c61dd] font-medium font-mono">{t('homepage.whatsNext.hub.progress')}</span>
                  </div>
                  <div className="w-full bg-[#e8eeff] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#3c61dd] h-full rounded-full" style={{ width: '50%' }} />
                  </div>
                </div>
              </div>

              {/* Bottom Row: Free to start checkmark */}
              <div className="flex items-center gap-2 text-[14px] text-white/95 font-medium mt-4">
                <Check className="w-4 h-4 text-white shrink-0" />
                <span>{t('homepage.whatsNext.hub.free')}</span>
              </div>
            </div>

            {/* --------------------------------------------------------------- */}
            {/* Right Column (2 Satellite Cards: Service Provider & Marketplace) */}
            {/* --------------------------------------------------------------- */}
            <div className="w-full lg:w-[260px] flex flex-col space-y-4 lg:space-y-[115px] order-3 lg:order-3">
              
              {/* Top-Right: Service Provider Card (Figma 57554:13503 - 260x148px r:20) */}
              <div className="w-full p-6 rounded-[20px] bg-white dark:bg-card border border-[#e3e8f2] dark:border-border shadow-[0_1px_2px_rgba(16,24,40,0.04),0_10px_30px_rgba(16,24,40,0.05)] flex flex-col justify-between min-h-[148px] hover:border-[#3c61dd]/40 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-[10px] bg-[#e8eeff] dark:bg-blue-950/60 flex items-center justify-center text-[#3c61dd] dark:text-blue-400 group-hover:scale-105 transition-transform">
                    <UserCog className="w-4 h-4" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-[6px] border border-[#e3e8f2] dark:border-border text-[11px] font-semibold text-[#98a2b3] font-mono tracking-wider">
                    {t('homepage.whatsNext.soon')}
                  </span>
                </div>
                <div>
                  <h4 className="text-[20px] font-semibold text-[#101828] dark:text-foreground font-heading leading-tight">
                    {t('homepage.whatsNext.serviceProvider.title')}
                  </h4>
                  <p className="text-[14px] text-[#667085] dark:text-muted-foreground mt-1 leading-normal font-sans">
                    {t('homepage.whatsNext.serviceProvider.description')}
                  </p>
                </div>
              </div>

              {/* Bottom-Right: Marketplace Card (Figma 57554:13516 - 260x148px r:20) */}
              <div className="w-full p-6 rounded-[20px] bg-white dark:bg-card border border-[#e3e8f2] dark:border-border shadow-[0_1px_2px_rgba(16,24,40,0.04),0_10px_30px_rgba(16,24,40,0.05)] flex flex-col justify-between min-h-[148px] hover:border-[#3c61dd]/40 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-[10px] bg-[#e8eeff] dark:bg-blue-950/60 flex items-center justify-center text-[#3c61dd] dark:text-blue-400 group-hover:scale-105 transition-transform">
                    <LayoutGrid className="w-4 h-4" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-[6px] border border-[#e3e8f2] dark:border-border text-[11px] font-semibold text-[#98a2b3] font-mono tracking-wider">
                    {t('homepage.whatsNext.soon')}
                  </span>
                </div>
                <div>
                  <h4 className="text-[20px] font-semibold text-[#101828] dark:text-foreground font-heading leading-tight">
                    {t('homepage.whatsNext.marketplace.title')}
                  </h4>
                  <p className="text-[14px] text-[#667085] dark:text-muted-foreground mt-1 leading-normal font-sans">
                    {t('homepage.whatsNext.marketplace.description')}
                  </p>
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* ========================================================================= */}
        {/* Bottom CTA Block (Figma 57554:13561) */}
        {/* ========================================================================= */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-center px-4">
          <Link
            href="/signup"
            className="w-full sm:w-auto min-w-[200px] h-[52px] px-8 rounded-[14px] bg-[#3c61dd] hover:bg-[#3252c0] text-white font-semibold text-[16px] shadow-lg shadow-blue-600/25 transition-all active:scale-[0.98] font-heading whitespace-nowrap inline-flex items-center justify-center gap-2 group"
          >
            <span>{t('homepage.whatsNext.cta.button')}</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>
          <span className="text-[14px] text-[#667085] dark:text-muted-foreground font-sans">
            {t('homepage.whatsNext.cta.helper')}
          </span>
        </div>

      </div>
    </section>
  );
}
