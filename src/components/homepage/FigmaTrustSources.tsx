'use client';

import React from 'react';
import { Scale, Coins, Building2, Check, ExternalLink, Link as LinkIcon, FileText } from 'lucide-react';

export default function FigmaTrustSources() {
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
            
            {/* Eyebrow Badge (Figma 57429:699) */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#e8eeff] dark:bg-blue-950/70 text-[#1f3faf] dark:text-blue-300 text-[12px] font-bold font-mono tracking-[1.2px] uppercase shadow-2xs self-start">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3c61dd] shrink-0" />
              <span>WHERE THE FACTS COME FROM</span>
            </div>

            {/* Headline (Figma 57424:519 - Inter 700 54px lh:60px ls:-1.92px) */}
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-bold text-[#101828] dark:text-foreground tracking-[-0.025em] leading-[1.08] font-heading">
              We don&apos;t guess.<br />
              <span className="text-[#3c61dd]">We check.</span>
            </h2>

            {/* Subline (Figma 57424:522 - DM Sans 400 18px lh:26px) */}
            <p className="text-base sm:text-lg md:text-[18px] text-[#667085] dark:text-muted-foreground leading-[1.5] font-sans font-normal max-w-[440px]">
              AI helps explain things in plain words. But the rules, the grants and the paperwork? Those come straight from official French sources.
            </p>

            {/* 4. Proof Card Wrapper with Interactive Callout (Figma 57424:524) */}
            <div className="relative pt-3 pb-2 max-w-[450px]">
              
              {/* White Proof Card (Border radius 20px, Shadow offset 0,20 radius 50 rgba(60,97,221,0.12)) */}
              <div className="w-full bg-white dark:bg-card rounded-[20px] p-6 border border-[#e3e8f2] dark:border-border shadow-[0_20px_50px_rgba(60,97,221,0.12)] space-y-3.5">
                
                {/* Overline */}
                <span className="text-[11px] font-bold uppercase tracking-[0.66px] text-[#98a2b3] font-mono block">
                  YOUR LEGAL CHECKLIST
                </span>

                {/* Checklist Title (Inter 600 17px lh:23px) */}
                <h3 className="text-[17px] font-semibold text-[#101828] dark:text-foreground font-heading">
                  Declare who owns your company
                </h3>

                {/* Checklist Description (DM Sans 400 14px lh:23px) */}
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[14px] text-[#667085] dark:text-muted-foreground leading-[1.6]">
                    You&apos;ll do this when you register. It&apos;s required for SAS and SAS-U.
                  </p>
                  <FileText className="w-4 h-4 text-[#98a2b3] shrink-0 mt-0.5" />
                </div>

                {/* Bottom Source Bar */}
                <div className="pt-3.5 border-t border-[#f2f4f7] dark:border-border/60 flex items-center justify-between flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#3c61dd] text-white text-[12px] font-medium tracking-[-0.3px] shadow-xs">
                    <LinkIcon className="w-3.5 h-3.5" />
                    Source: service-public.fr
                  </span>
                  <span className="text-[11px] font-normal text-[#98a2b3]">
                    Standard template
                  </span>
                </div>
              </div>

              {/* Hand-Drawn / Dotted Curved Annotation (Figma 57424:547) */}
              <div className="mt-3 flex items-center justify-end gap-2.5 pr-2">
                <svg
                  className="w-10 h-7 text-[#3c61dd] shrink-0"
                  viewBox="0 0 40 28"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                >
                  <path d="M4 24 C 18 24, 32 16, 36 4 M 28 8 L 36 4 L 38 12" />
                </svg>
                <div className="bg-white dark:bg-card border border-[#e8eeff] dark:border-blue-950/60 rounded-full px-3.5 py-1 text-[13.5px] italic font-medium text-[#1f3faf] dark:text-blue-300 shadow-sm">
                  See? It tells you where it got that.
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
                    <Scale className="w-4 h-4" />
                  </div>
                  <h4 className="text-[19px] sm:text-[20px] font-semibold text-[#101828] dark:text-foreground font-heading leading-tight">
                    Setting up your company
                  </h4>
                </div>
                <span className="text-[12px] font-normal text-[#98a2b3]">
                  Helps with your legal steps
                </span>
              </div>

              {/* Source Rows */}
              <div className="space-y-3.5">
                
                {/* Row 1: Service Public Entreprendre */}
                <div className="flex items-center justify-between gap-4 py-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
                    <span className="text-[15px] font-bold text-[#101828] dark:text-foreground">
                      Service Public Entreprendre
                    </span>
                    <span className="text-[14px] text-[#667085] dark:text-muted-foreground">
                      The government&apos;s own guide to the legal stuff.
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#e8eeff] dark:bg-blue-950/80 text-[#1f3faf] dark:text-blue-300 text-[11px] font-bold font-mono uppercase tracking-[0.66px] shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3c61dd]" />
                    OFFICIAL
                  </span>
                </div>

                {/* Row 2: INPI Guichet unique */}
                <div className="pt-3.5 border-t border-[#f2f4f7] dark:border-border/60 flex items-center justify-between gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
                    <span className="text-[15px] font-bold text-[#101828] dark:text-foreground">
                      INPI Guichet unique
                    </span>
                    <span className="text-[14px] text-[#667085] dark:text-muted-foreground">
                      Where you actually register your company.
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#e8eeff] dark:bg-blue-950/80 text-[#1f3faf] dark:text-blue-300 text-[11px] font-bold font-mono uppercase tracking-[0.66px] shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3c61dd]" />
                    OFFICIAL
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
                    <Coins className="w-4 h-4" />
                  </div>
                  <h4 className="text-[19px] sm:text-[20px] font-semibold text-[#101828] dark:text-foreground font-heading leading-tight">
                    Money and help you can apply for
                  </h4>
                </div>
                <span className="text-[12px] font-normal text-[#98a2b3]">
                  Helps with grants
                </span>
              </div>

              {/* Source Rows */}
              <div className="space-y-3.5">
                
                {/* Row 1 (Drawn in soft blue hover/highlight state): Aides-entreprises / data.gouv.fr */}
                <div className="flex items-center justify-between gap-4 p-3 -mx-3 rounded-[8px] bg-[#f2f5ff] dark:bg-blue-950/40 border border-[#dbe4ff] dark:border-blue-900/50">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[15px] font-bold text-[#101828] dark:text-foreground">
                        Aides-entreprises / data.gouv.fr
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 text-[#3c61dd]" />
                    </div>
                    <span className="text-[14px] text-[#667085] dark:text-muted-foreground">
                      Public grants and support, all in one list.
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#eef0f4] dark:bg-zinc-800 text-[#101828] dark:text-zinc-200 text-[11px] font-bold font-mono uppercase tracking-[0.66px] shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#667085]" />
                    OPEN DATA
                  </span>
                </div>

                {/* Row 2: Bpifrance Création */}
                <div className="pt-3.5 border-t border-[#f2f4f7] dark:border-border/60 flex items-center justify-between gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
                    <span className="text-[15px] font-bold text-[#101828] dark:text-foreground">
                      Bpifrance Création
                    </span>
                    <span className="text-[14px] text-[#667085] dark:text-muted-foreground">
                      Practical guides for starting out.
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#e8eeff] dark:bg-blue-950/80 text-[#1f3faf] dark:text-blue-300 text-[11px] font-bold font-mono uppercase tracking-[0.66px] shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3c61dd]" />
                    OFFICIAL
                  </span>
                </div>

                {/* Row 3: France Travail */}
                <div className="pt-3.5 border-t border-[#f2f4f7] dark:border-border/60 flex items-center justify-between gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
                    <span className="text-[15px] font-bold text-[#101828] dark:text-foreground">
                      France Travail
                    </span>
                    <span className="text-[14px] text-[#667085] dark:text-muted-foreground">
                      ARCE and ACRE, if you qualify.
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#e8eeff] dark:bg-blue-950/80 text-[#1f3faf] dark:text-blue-300 text-[11px] font-bold font-mono uppercase tracking-[0.66px] shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3c61dd]" />
                    OFFICIAL
                  </span>
                </div>

              </div>
            </div>

            {/* PANEL 3: Checking other companies (Figma 57424:634 - 70% opacity in Figma) */}
            <div className="bg-white dark:bg-card rounded-[20px] p-6 sm:p-7 border border-[#e3e8f2] dark:border-border shadow-[0_10px_30px_rgba(16,24,40,0.05),0_1px_2px_rgba(16,24,40,0.04)] opacity-75 hover:opacity-100 transition-opacity space-y-5">
              
              {/* Panel Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#f2f4f7] dark:border-border/60">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#e8eeff] dark:bg-blue-950/70 text-[#3c61dd] dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <h4 className="text-[19px] sm:text-[20px] font-semibold text-[#101828] dark:text-foreground font-heading leading-tight">
                    Checking other companies
                  </h4>
                </div>
                <span className="text-[12px] font-normal text-[#98a2b3]">
                  Coming later
                </span>
              </div>

              {/* Source Rows */}
              <div className="space-y-3.5">
                
                {/* Row 1: API Recherche d'entreprises */}
                <div className="flex items-center justify-between gap-4 py-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
                    <span className="text-[15px] font-bold text-[#101828] dark:text-foreground">
                      API Recherche d&apos;entreprises
                    </span>
                    <span className="text-[14px] text-[#667085] dark:text-muted-foreground">
                      Look up any French company in seconds.
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#eef0f4] dark:bg-zinc-800 text-[#101828] dark:text-zinc-200 text-[11px] font-bold font-mono uppercase tracking-[0.66px] shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#667085]" />
                    OPEN DATA
                  </span>
                </div>

                {/* Row 2: SIRENE */}
                <div className="pt-3.5 border-t border-[#f2f4f7] dark:border-border/60 flex items-center justify-between gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
                    <span className="text-[15px] font-bold text-[#101828] dark:text-foreground">
                      SIRENE
                    </span>
                    <span className="text-[14px] text-[#667085] dark:text-muted-foreground">
                      Show your company is officially registered.
                    </span>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-[6px] border border-[#e3e8f2] dark:border-border text-[#98a2b3] text-[11px] font-bold font-mono uppercase tracking-[0.66px] shrink-0">
                    COMING SOON
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
              <div className="w-5 h-5 rounded-full bg-[#00c896] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
              <span className="text-[15px] font-normal text-[#101828] dark:text-foreground leading-snug font-sans">
                You can always see where info came from.
              </span>
            </div>

            {/* Trust Point 2 */}
            <div className="flex items-center gap-3.5 md:px-6">
              <div className="w-5 h-5 rounded-full bg-[#00c896] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
              <span className="text-[15px] font-normal text-[#101828] dark:text-foreground leading-snug font-sans">
                Grants say &apos;you can apply&apos;, never &apos;you&apos;ll get it&apos;.
              </span>
            </div>

            {/* Trust Point 3 */}
            <div className="flex items-center gap-3.5 md:px-6 last:md:pr-2">
              <div className="w-5 h-5 rounded-full bg-[#00c896] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
              <span className="text-[15px] font-normal text-[#101828] dark:text-foreground leading-snug font-sans">
                Your changes stay yours. Nothing gets overwritten.
              </span>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
