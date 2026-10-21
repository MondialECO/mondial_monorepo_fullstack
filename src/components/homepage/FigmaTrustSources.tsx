'use client';

import React from 'react';
import { useLanguage } from '@/providers/LanguageProvider';

export default function FigmaTrustSources() {
  const { t } = useLanguage();
  return (
    <section
      id="trust-sources"
      className="relative w-full overflow-hidden py-20 sm:py-24 md:py-28 bg-[#F7F9FC] dark:bg-background border-b border-[#e8ecf2] dark:border-border"
      data-testid="figma-trust-sources"
    >
      <div className="w-full max-w-[1280px] xl:max-w-[1360px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-14">

        {/* ========================================================================= */}
        {/* TOP GRID: 12 Columns (5 Left, 7 Right, 24px/32px gap) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-10 items-start">

          {/* --------------------------------------------------------------------- */}
          {/* LEFT COLUMN: 5 Columns (Sticky Context & Proof Card) */}
          {/* --------------------------------------------------------------------- */}
          <div className="lg:col-span-5 flex flex-col space-y-6">

            {/* 1. Eyebrow Badge (Figma 57429:699) */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#e8eeff] dark:bg-blue-950/70 text-[#1f3faf] dark:text-blue-300 text-[12px] font-bold font-mono tracking-[1.2px] uppercase shadow-2xs self-start">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3c61dd] shrink-0" />
              <span>{t('homepage.trustSources.eyebrow')}</span>
            </div>

            {/* 2. Headline (Figma 57424:519 - Inter 700 54px lh:60px ls:-1.92px) */}
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-bold text-[#101828] dark:text-foreground tracking-[-0.035em] leading-[1.08] font-heading">
              {t('homepage.trustSources.headline').split('\n')[0]}<br />
              <span className="text-[#3c61dd]">{t('homepage.trustSources.headline').split('\n')[1]}</span>
            </h2>

            {/* 3. Subline (Figma 57424:522 - DM Sans 400 18px lh:26px #667085) */}
            <p className="text-base sm:text-lg md:text-[18px] text-[#667085] dark:text-muted-foreground leading-[1.55] font-sans font-normal max-w-[440px]">
              {t('homepage.trustSources.subline')}
            </p>

            {/* 4. Proof Card Wrapper with Interactive Callout (Figma 57424:524) */}
            <div className="relative pt-2 pb-8 max-w-[446px]">

              {/* White Proof Card (Border radius 20px, Shadow 0 20px 50px rgba(60,97,221,0.12)) */}
              <div className="w-full bg-white dark:bg-card rounded-[20px] p-6 border border-[#e3e8f2] dark:border-border shadow-[0_20px_50px_rgba(60,97,221,0.12)] space-y-3.5">

                {/* Overline */}
                <span className="text-[11px] font-bold uppercase tracking-[0.66px] text-[#98a2b3] font-mono block">
                  {t('homepage.trustSources.proofCard.overline')}
                </span>

                {/* Checklist Title (Inter 600 17px lh:23px) */}
                <h3 className="text-[17px] font-semibold text-[#101828] dark:text-foreground font-heading">
                  {t('homepage.trustSources.proofCard.title')}
                </h3>

                {/* Checklist Description */}
                <p className="text-[14px] text-[#667085] dark:text-muted-foreground leading-[1.6]">
                  {t('homepage.trustSources.proofCard.description')}
                </p>

                {/* Bottom Source Bar */}
                <div className="pt-3.5 border-t border-[#f2f4f7] dark:border-border/60 flex items-center justify-between flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#3c61dd] text-white text-[12px] font-medium tracking-[-0.2px] shadow-xs">
                    {/* Exact Figma Link SVG (57424:536) */}
                    <svg width="14" height="14" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                      <path d="M6.29365 8.14058C6.84104 8.83377 7.6625 9.25504 8.54485 9.29505C9.4272 9.33506 10.2834 8.98987 10.8913 8.34907L12.6694 6.47538C13.7914 5.25112 13.7252 3.35354 12.5206 2.21044C11.316 1.06734 9.41756 1.10054 8.2537 2.28507L7.23412 3.35324" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M8.69599 6.85933C8.14861 6.16614 7.32714 5.74488 6.44479 5.70486C5.56245 5.66485 4.70622 6.01004 4.09835 6.65084L2.32028 8.52453C1.19829 9.74879 1.26448 11.6464 2.46906 12.7895C3.67363 13.9326 5.57208 13.8994 6.73594 12.7148L7.74944 11.6468" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {t('homepage.trustSources.proofCard.source')}
                  </span>
                  <span className="text-[11px] font-normal text-[#98a2b3]">
                    {t('homepage.trustSources.proofCard.template')}
                  </span>
                </div>
              </div>

              {/* Hand-Drawn / Dotted Curved Annotation (Figma 57424:543) */}
              <div className="absolute -bottom-4 sm:-bottom-5 right-[-4px] sm:right-[-12px] md:right-[-20px] flex items-center gap-1.5 pointer-events-none z-10">
                {/* Exact Figma Curved Arrow SVG (57424:544) */}
                <svg width="42" height="34" viewBox="0 0 42 34" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 text-[#3c61dd] -mb-1">
                  <path d="M6 30C16 32 30 25 34 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 3" />
                  <path d="M28 10L34.5 7L36 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {/* Callout Pill (57424:547) */}
                <div className="bg-white/95 dark:bg-card/95 backdrop-blur-xs border border-[#e8eeff] dark:border-blue-950/60 rounded-full px-3.5 py-1 text-[13.5px] italic font-medium text-[#1f3faf] dark:text-blue-300 shadow-[0_1px_3px_rgba(0,0,0,0.06)] pointer-events-auto">
                  {t('homepage.trustSources.proofCard.annotation')}
                </div>
              </div>

            </div>

          </div>

          {/* --------------------------------------------------------------------- */}
          {/* RIGHT COLUMN: 7 Columns (3 Grouped Source Panels, 20px gaps) */}
          {/* --------------------------------------------------------------------- */}
          <div className="lg:col-span-7 flex flex-col space-y-5">

            {/* PANEL 1: Setting up your company (Figma 57424:550) */}
            <div className="bg-white dark:bg-card rounded-[20px] p-6 sm:p-7 border border-[#e3e8f2] dark:border-border shadow-[0_10px_30px_rgba(16,24,40,0.05),0_1px_2px_rgba(16,24,40,0.04)] space-y-5">

              {/* Panel Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#f2f4f7] dark:border-border/60">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#e8eeff] dark:bg-blue-950/70 text-[#3c61dd] dark:text-blue-400 flex items-center justify-center shrink-0">
                    {/* Exact Scale SVG (57424:554) */}
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10.6665 10.6668L12.6665 5.3335L14.6665 10.6668C14.0865 11.1002 13.3865 11.3335 12.6665 11.3335C11.9465 11.3335 11.2465 11.1002 10.6665 10.6668V10.6668" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M1.3335 10.6668L3.3335 5.3335L5.3335 10.6668C4.7535 11.1002 4.0535 11.3335 3.3335 11.3335C2.6135 11.3335 1.9135 11.1002 1.3335 10.6668V10.6668" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M4.6665 14H11.3332" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M8 2V14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M2 4.66683H3.33333C4.66667 4.66683 6.66667 4.00016 8 3.3335C9.33333 4.00016 11.3333 4.66683 12.6667 4.66683H14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <h4 className="text-[19px] sm:text-[20px] font-semibold text-[#101828] dark:text-foreground font-heading leading-tight">
                    {t('homepage.trustSources.panels.legal.title')}
                  </h4>
                </div>
                <span className="text-[12px] font-normal text-[#98a2b3]">
                  {t('homepage.trustSources.panels.legal.subtitle')}
                </span>
              </div>

              {/* Source Rows */}
              <div className="space-y-3.5">

                {/* Row 1: Service Public Entreprendre */}
                <div className="flex items-center justify-between gap-4 py-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 flex-wrap">
                    <span className="text-[15px] font-bold text-[#101828] dark:text-foreground">
                      {t('homepage.trustSources.panels.legal.source1Name')}
                    </span>
                    <span className="text-[14px] text-[#667085] dark:text-muted-foreground">
                      {t('homepage.trustSources.panels.legal.source1Desc')}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#e8eeff] dark:bg-blue-950/80 text-[#1f3faf] dark:text-blue-300 text-[11px] font-bold font-mono uppercase tracking-[0.66px] shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3c61dd]" />
                    {t('homepage.trustSources.panels.legal.source1Tag')}
                  </span>
                </div>

                {/* Row 2: INPI Guichet unique */}
                <div className="pt-3.5 border-t border-[#f2f4f7] dark:border-border/60 flex items-center justify-between gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 flex-wrap">
                    <span className="text-[15px] font-bold text-[#101828] dark:text-foreground">
                      {t('homepage.trustSources.panels.legal.source2Name')}
                    </span>
                    <span className="text-[14px] text-[#667085] dark:text-muted-foreground">
                      {t('homepage.trustSources.panels.legal.source2Desc')}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#e8eeff] dark:bg-blue-950/80 text-[#1f3faf] dark:text-blue-300 text-[11px] font-bold font-mono uppercase tracking-[0.66px] shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3c61dd]" />
                    {t('homepage.trustSources.panels.legal.source2Tag')}
                  </span>
                </div>

              </div>
            </div>

            {/* PANEL 2: Money and help you can apply for (Figma 57424:585) */}
            <div className="bg-white dark:bg-card rounded-[20px] p-6 sm:p-7 border border-[#e3e8f2] dark:border-border shadow-[0_10px_30px_rgba(16,24,40,0.05),0_1px_2px_rgba(16,24,40,0.04)] space-y-5">

              {/* Panel Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#f2f4f7] dark:border-border/60">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#e8eeff] dark:bg-blue-950/70 text-[#3c61dd] dark:text-blue-400 flex items-center justify-center shrink-0">
                    {/* Exact Coins SVG (57424:589) */}
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1.3335 5.3335C1.3335 7.54116 3.12584 9.3335 5.3335 9.3335C7.54116 9.3335 9.3335 7.54116 9.3335 5.3335C9.3335 3.12584 7.54116 1.3335 5.3335 1.3335C3.12584 1.3335 1.3335 3.12584 1.3335 5.3335V5.3335" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M12.0602 6.91357C13.7972 7.56116 14.8617 9.31738 14.6321 11.1569C14.4025 12.9964 12.9391 14.4372 11.0962 14.638C9.25336 14.8389 7.51396 13.7471 6.89355 12.0002" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M4.6665 4H5.33317V6.66667" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M11.1399 9.25342L11.6066 9.72675L9.72656 11.6068" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <h4 className="text-[19px] sm:text-[20px] font-semibold text-[#101828] dark:text-foreground font-heading leading-tight">
                    {t('homepage.trustSources.panels.grants.title')}
                  </h4>
                </div>
                <span className="text-[12px] font-normal text-[#98a2b3]">
                  {t('homepage.trustSources.panels.grants.subtitle')}
                </span>
              </div>

              {/* Source Rows */}
              <div className="space-y-3.5">

                {/* Row 1 (Drawn in soft blue highlight state): Aides-entreprises / data.gouv.fr */}
                <div className="flex items-center justify-between gap-4 p-3 -mx-3 rounded-[8px] bg-[#f2f5ff] dark:bg-blue-950/40 border border-[#dbe4ff] dark:border-blue-900/50">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[15px] font-bold text-[#101828] dark:text-foreground">
                        {t('homepage.trustSources.panels.grants.source1Name')}
                      </span>
                      {/* Exact External Link SVG (57424:604) */}
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 text-[#3c61dd]">
                        <path d="M10.5 7.58333V11.0833C10.5 11.7272 9.97723 12.25 9.33333 12.25H2.91667C2.27277 12.25 1.75 11.7272 1.75 11.0833V4.66667C1.75 4.02277 2.27277 3.5 2.91667 3.5H6.41667" stroke="currentColor" strokeWidth="1.02" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M8.75 1.75H12.25V5.25" stroke="currentColor" strokeWidth="1.02" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M5.8335 8.16667L12.2502 1.75" stroke="currentColor" strokeWidth="1.02" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <span className="text-[14px] text-[#667085] dark:text-muted-foreground">
                      {t('homepage.trustSources.panels.grants.source1Desc')}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#eef0f4] dark:bg-zinc-800 text-[#101828] dark:text-zinc-200 text-[11px] font-bold font-mono uppercase tracking-[0.66px] shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#667085]" />
                    {t('homepage.trustSources.panels.grants.source1Tag')}
                  </span>
                </div>

                {/* Row 2: Bpifrance Création */}
                <div className="pt-3.5 border-t border-[#f2f4f7] dark:border-border/60 flex items-center justify-between gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 flex-wrap">
                    <span className="text-[15px] font-bold text-[#101828] dark:text-foreground">
                      {t('homepage.trustSources.panels.grants.source2Name')}
                    </span>
                    <span className="text-[14px] text-[#667085] dark:text-muted-foreground">
                      {t('homepage.trustSources.panels.grants.source2Desc')}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#e8eeff] dark:bg-blue-950/80 text-[#1f3faf] dark:text-blue-300 text-[11px] font-bold font-mono uppercase tracking-[0.66px] shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3c61dd]" />
                    {t('homepage.trustSources.panels.grants.source2Tag')}
                  </span>
                </div>

                {/* Row 3: France Travail */}
                <div className="pt-3.5 border-t border-[#f2f4f7] dark:border-border/60 flex items-center justify-between gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 flex-wrap">
                    <span className="text-[15px] font-bold text-[#101828] dark:text-foreground">
                      {t('homepage.trustSources.panels.grants.source3Name')}
                    </span>
                    <span className="text-[14px] text-[#667085] dark:text-muted-foreground">
                      {t('homepage.trustSources.panels.grants.source3Desc')}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#e8eeff] dark:bg-blue-950/80 text-[#1f3faf] dark:text-blue-300 text-[11px] font-bold font-mono uppercase tracking-[0.66px] shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3c61dd]" />
                    {t('homepage.trustSources.panels.grants.source3Tag')}
                  </span>
                </div>

              </div>
            </div>

            {/* PANEL 3: Checking other companies (Figma 57424:634 - 70% opacity in Figma) */}
            <div className="bg-white dark:bg-card rounded-[20px] p-6 sm:p-7 border border-[#e3e8f2] dark:border-border shadow-[0_10px_30px_rgba(16,24,40,0.05),0_1px_2px_rgba(16,24,40,0.04)] opacity-70 hover:opacity-100 transition-opacity duration-300 space-y-5">

              {/* Panel Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#f2f4f7] dark:border-border/60">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#e8eeff] dark:bg-blue-950/70 text-[#3c61dd] dark:text-blue-400 flex items-center justify-center shrink-0">
                    {/* Exact Building SVG (57424:638) */}
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3.99984 1.3335H11.9998C12.7357 1.3335 13.3332 1.93094 13.3332 2.66683V13.3335C13.3332 14.0694 12.7357 14.6668 11.9998 14.6668H3.99984C3.26395 14.6668 2.6665 14.0694 2.6665 13.3335V2.66683C2.6665 1.93094 3.26395 1.3335 3.99984 1.3335V1.3335" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M6 14.6667V12H10V14.6667" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M5.3335 4H5.34016" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M10.6665 4H10.6732" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M8 4H8.00667" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M8 6.6665H8.00667" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M8 9.3335H8.00667" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M10.6665 6.6665H10.6732" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M10.6665 9.3335H10.6732" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M5.3335 6.6665H5.34016" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M5.3335 9.3335H5.34016" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <h4 className="text-[19px] sm:text-[20px] font-semibold text-[#101828] dark:text-foreground font-heading leading-tight">
                    {t('homepage.trustSources.panels.companies.title')}
                  </h4>
                </div>
                <span className="text-[12px] font-normal text-[#98a2b3]">
                  {t('homepage.trustSources.panels.companies.subtitle')}
                </span>
              </div>

              {/* Source Rows */}
              <div className="space-y-3.5">

                {/* Row 1: API Recherche d'entreprises */}
                <div className="flex items-center justify-between gap-4 py-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 flex-wrap">
                    <span className="text-[15px] font-bold text-[#101828] dark:text-foreground">
                      {t('homepage.trustSources.panels.companies.source1Name')}
                    </span>
                    <span className="text-[14px] text-[#667085] dark:text-muted-foreground">
                      {t('homepage.trustSources.panels.companies.source1Desc')}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#eef0f4] dark:bg-zinc-800 text-[#101828] dark:text-zinc-200 text-[11px] font-bold font-mono uppercase tracking-[0.66px] shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#667085]" />
                    {t('homepage.trustSources.panels.companies.source1Tag')}
                  </span>
                </div>

                {/* Row 2: SIRENE */}
                <div className="pt-3.5 border-t border-[#f2f4f7] dark:border-border/60 flex items-center justify-between gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 flex-wrap">
                    <span className="text-[15px] font-bold text-[#101828] dark:text-foreground">
                      {t('homepage.trustSources.panels.companies.source2Name')}
                    </span>
                    <span className="text-[14px] text-[#667085] dark:text-muted-foreground">
                      {t('homepage.trustSources.panels.companies.source2Desc')}
                    </span>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-[6px] bg-white dark:bg-zinc-900 border border-[#e3e8f2] dark:border-border text-[#98a2b3] text-[11px] font-bold font-mono uppercase tracking-[0.66px] shrink-0">
                    {t('homepage.trustSources.panels.companies.source2Tag')}
                  </span>
                </div>

              </div>
            </div>

          </div>

        </div>

        {/* ========================================================================= */}
        {/* BOTTOM TRUST STRIP (Figma 57424:674 - 56px below columns) */}
        {/* ========================================================================= */}
        <div className="mt-14 bg-white dark:bg-card rounded-[16px] p-5 sm:p-6 border border-[#e3e8f2] dark:border-border shadow-[0_10px_30px_rgba(16,24,40,0.05),0_1px_2px_rgba(16,24,40,0.04)]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-0 md:divide-x md:divide-[#e3e8f2] dark:md:divide-border">

            {/* Trust Point 1 */}
            <div className="flex items-center gap-3.5 md:px-6 first:md:pl-2">
              <div className="w-5 h-5 rounded-full bg-[#00c896]/10 dark:bg-emerald-950/60 text-[#00c896] flex items-center justify-center shrink-0">
                {/* Exact Check SVG (57424:678) */}
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11.6668 3.5L5.25016 9.91667L2.3335 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="text-[15px] font-normal text-[#101828] dark:text-foreground leading-snug font-sans">
                {t('homepage.trustSources.trustStrip.item1')}
              </span>
            </div>

            {/* Trust Point 2 */}
            <div className="flex items-center gap-3.5 md:px-6">
              <div className="w-5 h-5 rounded-full bg-[#00c896]/10 dark:bg-emerald-950/60 text-[#00c896] flex items-center justify-center shrink-0">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11.6668 3.5L5.25016 9.91667L2.3335 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="text-[15px] font-normal text-[#101828] dark:text-foreground leading-snug font-sans">
                {t('homepage.trustSources.trustStrip.item2')}
              </span>
            </div>

            {/* Trust Point 3 */}
            <div className="flex items-center gap-3.5 md:px-6 last:md:pr-2">
              <div className="w-5 h-5 rounded-full bg-[#00c896]/10 dark:bg-emerald-950/60 text-[#00c896] flex items-center justify-center shrink-0">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11.6668 3.5L5.25016 9.91667L2.3335 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="text-[15px] font-normal text-[#101828] dark:text-foreground leading-snug font-sans">
                {t('homepage.trustSources.trustStrip.item3')}
              </span>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
