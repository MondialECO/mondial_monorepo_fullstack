'use client';

import React from 'react';
import { Scale, Coins, Building2, Check, ExternalLink, Link as LinkIcon } from 'lucide-react';

export default function FigmaTrustSources() {
  return (
    <section
      id="trust-sources"
      className="relative w-full overflow-hidden py-16 sm:py-20 md:py-24 bg-[#F7F8FC] dark:bg-background border-b border-[#e8ecf2] dark:border-border"
      data-testid="figma-trust-sources"
    >
      <div className="w-full max-w-[1440px] xl:max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
        
        {/* ========================================================================= */}
        {/* TOP GRID: 12 Columns (5 Left, 7 Right, 32px gap) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-12 items-start">

          {/* --------------------------------------------------------------------- */}
          {/* LEFT COLUMN: 5 Columns (Sticky Context & Proof Card) */}
          {/* --------------------------------------------------------------------- */}
          <div className="lg:col-span-5 flex flex-col space-y-6">
            
            {/* Eyebrow Badge (Figma 57429:699) */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#e8eeff] dark:bg-blue-950/70 text-[#1f3faf] dark:text-blue-300 text-[11.5px] font-bold font-mono tracking-wider uppercase shadow-2xs self-start">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3c61dd] shrink-0" />
              <span>WHERE THE FACTS COME FROM</span>
            </div>

            {/* Headline (Figma 57424:519) */}
            <h2 className="text-3xl sm:text-4xl xl:text-[50px] font-semibold text-[#101828] dark:text-foreground tracking-tight leading-[1.06] font-heading">
              We don&apos;t guess.<br />
              <span className="text-[#3c61dd]">We check.</span>
            </h2>

            {/* Subline (Figma 57424:522) */}
            <p className="text-base sm:text-lg text-[#667085] dark:text-muted-foreground leading-relaxed font-sans font-normal">
              AI helps explain things in plain words. But the rules, the grants and the paperwork? Those come straight from official French sources.
            </p>

            {/* Proof Card Wrapper with Callout (Figma 57424:524) */}
            <div className="relative pt-4 pb-6">
              {/* White Proof Card */}
              <div className="w-full bg-white dark:bg-card rounded-[18px] p-6 border border-[#e8ecf2] dark:border-border shadow-sm space-y-4">
                
                {/* Overline */}
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#98a2b3] font-mono block">
                  YOUR LEGAL CHECKLIST
                </span>

                {/* Checklist Title */}
                <h3 className="text-[16px] font-bold text-[#101828] dark:text-foreground font-heading">
                  Declare who owns your company
                </h3>

                {/* Checklist Description */}
                <p className="text-[13.5px] text-[#667085] dark:text-muted-foreground leading-relaxed">
                  You&apos;ll do this when you register. It&apos;s required for SAS and SAS-U.
                </p>

                {/* Bottom Source Bar */}
                <div className="pt-3 border-t border-[#f2f4f7] dark:border-border/60 flex items-center justify-between flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#3c61dd] text-white text-[12px] font-semibold shadow-xs">
                    <LinkIcon className="w-3.5 h-3.5" />
                    Source: service-public.fr
                  </span>
                  <span className="text-[12px] font-medium text-[#98a2b3]">
                    Standard template
                  </span>
                </div>
              </div>

              {/* Interactive Curved Annotation Callout (Figma 57424:547) */}
              <div className="mt-3 flex items-center justify-end gap-2 pr-2">
                <svg
                  className="w-8 h-6 text-[#3c61dd] shrink-0"
                  viewBox="0 0 32 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeDasharray="3 3"
                >
                  <path d="M4 20 C 14 20, 26 14, 28 4 M 22 7 L 28 4 L 30 10" />
                </svg>
                <div className="bg-white/95 dark:bg-card/95 backdrop-blur border border-[#e2e8f0] dark:border-border px-3.5 py-1.5 rounded-full text-[12px] italic font-medium text-[#1f3faf] dark:text-blue-300 shadow-xs">
                  See? It tells you where it got that.
                </div>
              </div>
            </div>

          </div>

          {/* --------------------------------------------------------------------- */}
          {/* RIGHT COLUMN: 7 Columns (3 Grouped Source Panels) */}
          {/* --------------------------------------------------------------------- */}
          <div className="lg:col-span-7 flex flex-col space-y-5">

            {/* PANEL 1: Setting up your company (Figma 57424:550) */}
            <div className="bg-white dark:bg-card rounded-[20px] p-6 sm:p-7 border border-[#e8ecf2] dark:border-border shadow-sm space-y-5">
              
              {/* Panel Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#f2f4f7] dark:border-border/60">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#e8eeff] dark:bg-blue-950/70 text-[#3c61dd] dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Scale className="w-5 h-5" />
                  </div>
                  <h4 className="text-[17px] font-bold text-[#101828] dark:text-foreground font-heading">
                    Setting up your company
                  </h4>
                </div>
                <span className="text-[12.5px] font-medium text-[#98a2b3]">
                  Helps with your legal steps
                </span>
              </div>

              {/* Source Rows */}
              <div className="space-y-4">
                
                {/* Row 1: Service Public Entreprendre */}
                <div className="flex items-center justify-between gap-4 p-2.5 rounded-xl hover:bg-[#f8fafd] dark:hover:bg-accent/40 transition-colors">
                  <div>
                    <span className="text-[14.5px] font-bold text-[#101828] dark:text-foreground block">
                      Service Public Entreprendre
                    </span>
                    <span className="text-[13px] text-[#667085] dark:text-muted-foreground block mt-0.5">
                      The government&apos;s own guide to the legal stuff.
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#e8eeff] dark:bg-blue-950/80 text-[#1f3faf] dark:text-blue-300 text-[10.5px] font-bold font-mono uppercase tracking-wider shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3c61dd]" />
                    OFFICIAL
                  </span>
                </div>

                {/* Row 2: INPI Guichet unique */}
                <div className="flex items-center justify-between gap-4 p-2.5 rounded-xl hover:bg-[#f8fafd] dark:hover:bg-accent/40 transition-colors">
                  <div>
                    <span className="text-[14.5px] font-bold text-[#101828] dark:text-foreground block">
                      INPI Guichet unique
                    </span>
                    <span className="text-[13px] text-[#667085] dark:text-muted-foreground block mt-0.5">
                      Where you actually register your company.
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#e8eeff] dark:bg-blue-950/80 text-[#1f3faf] dark:text-blue-300 text-[10.5px] font-bold font-mono uppercase tracking-wider shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3c61dd]" />
                    OFFICIAL
                  </span>
                </div>

              </div>
            </div>

            {/* PANEL 2: Money and help you can apply for (Figma 57424:585) */}
            <div className="bg-white dark:bg-card rounded-[20px] p-6 sm:p-7 border border-[#e8ecf2] dark:border-border shadow-sm space-y-5">
              
              {/* Panel Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#f2f4f7] dark:border-border/60">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#e8eeff] dark:bg-blue-950/70 text-[#3c61dd] dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Coins className="w-5 h-5" />
                  </div>
                  <h4 className="text-[17px] font-bold text-[#101828] dark:text-foreground font-heading">
                    Money and help you can apply for
                  </h4>
                </div>
                <span className="text-[12.5px] font-medium text-[#98a2b3]">
                  Helps with grants
                </span>
              </div>

              {/* Source Rows */}
              <div className="space-y-3">
                
                {/* Row 1 (Highlighted soft blue card): Aides-entreprises / data.gouv.fr */}
                <div className="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-[#f2f5ff] dark:bg-blue-950/40 border border-[#dbe4ff] dark:border-blue-900/50">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[14.5px] font-bold text-[#101828] dark:text-foreground">
                        Aides-entreprises / data.gouv.fr
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 text-[#3c61dd]" />
                    </div>
                    <span className="text-[13px] text-[#667085] dark:text-muted-foreground block mt-0.5">
                      Public grants and support, all in one list.
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#eef0f4] dark:bg-zinc-800 text-[#101828] dark:text-zinc-200 text-[10.5px] font-bold font-mono uppercase tracking-wider shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#667085]" />
                    OPEN DATA
                  </span>
                </div>

                {/* Row 2: Bpifrance Création */}
                <div className="flex items-center justify-between gap-4 p-2.5 rounded-xl hover:bg-[#f8fafd] dark:hover:bg-accent/40 transition-colors">
                  <div>
                    <span className="text-[14.5px] font-bold text-[#101828] dark:text-foreground block">
                      Bpifrance Création
                    </span>
                    <span className="text-[13px] text-[#667085] dark:text-muted-foreground block mt-0.5">
                      Practical guides for starting out.
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#e8eeff] dark:bg-blue-950/80 text-[#1f3faf] dark:text-blue-300 text-[10.5px] font-bold font-mono uppercase tracking-wider shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3c61dd]" />
                    OFFICIAL
                  </span>
                </div>

                {/* Row 3: France Travail */}
                <div className="flex items-center justify-between gap-4 p-2.5 rounded-xl hover:bg-[#f8fafd] dark:hover:bg-accent/40 transition-colors">
                  <div>
                    <span className="text-[14.5px] font-bold text-[#101828] dark:text-foreground block">
                      France Travail
                    </span>
                    <span className="text-[13px] text-[#667085] dark:text-muted-foreground block mt-0.5">
                      ARCE and ACRE, if you qualify.
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#e8eeff] dark:bg-blue-950/80 text-[#1f3faf] dark:text-blue-300 text-[10.5px] font-bold font-mono uppercase tracking-wider shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3c61dd]" />
                    OFFICIAL
                  </span>
                </div>

              </div>
            </div>

            {/* PANEL 3: Checking other companies (Figma 57424:634 - Coming Later) */}
            <div className="bg-white/80 dark:bg-card/80 rounded-[20px] p-6 sm:p-7 border border-[#e8ecf2] dark:border-border shadow-xs opacity-85 hover:opacity-100 transition-opacity space-y-5">
              
              {/* Panel Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#f2f4f7] dark:border-border/60">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#e8eeff] dark:bg-blue-950/70 text-[#3c61dd] dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <h4 className="text-[17px] font-bold text-[#101828] dark:text-foreground font-heading">
                    Checking other companies
                  </h4>
                </div>
                <span className="text-[12.5px] font-medium text-[#98a2b3]">
                  Coming later
                </span>
              </div>

              {/* Source Rows */}
              <div className="space-y-4">
                
                {/* Row 1: API Recherche d'entreprises */}
                <div className="flex items-center justify-between gap-4 p-2.5 rounded-xl">
                  <div>
                    <span className="text-[14.5px] font-bold text-[#101828] dark:text-foreground block">
                      API Recherche d&apos;entreprises
                    </span>
                    <span className="text-[13px] text-[#667085] dark:text-muted-foreground block mt-0.5">
                      Look up any French company in seconds.
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#eef0f4] dark:bg-zinc-800 text-[#101828] dark:text-zinc-200 text-[10.5px] font-bold font-mono uppercase tracking-wider shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#667085]" />
                    OPEN DATA
                  </span>
                </div>

                {/* Row 2: SIRENE */}
                <div className="flex items-center justify-between gap-4 p-2.5 rounded-xl">
                  <div>
                    <span className="text-[14.5px] font-bold text-[#101828] dark:text-foreground block">
                      SIRENE
                    </span>
                    <span className="text-[13px] text-[#667085] dark:text-muted-foreground block mt-0.5">
                      Show your company is officially registered.
                    </span>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full border border-[#e2e8f0] dark:border-border text-[#98a2b3] text-[10.5px] font-bold font-mono uppercase tracking-wider shrink-0">
                    COMING SOON
                  </span>
                </div>

              </div>
            </div>

          </div>

        </div>

        {/* ========================================================================= */}
        {/* BOTTOM TRUST STRIP (Figma 57424:674) */}
        {/* ========================================================================= */}
        <div className="mt-12 lg:mt-16 bg-white dark:bg-card rounded-[18px] p-6 border border-[#e8ecf2] dark:border-border shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-0 md:divide-x md:divide-[#e8ecf2] dark:md:divide-border">
            
            {/* Trust Point 1 */}
            <div className="flex items-center gap-3.5 md:px-6 first:md:pl-2">
              <div className="w-6 h-6 rounded-full bg-[#00c896]/15 text-[#00c896] flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <span className="text-[14px] font-medium text-[#101828] dark:text-foreground leading-snug">
                You can always see where info came from.
              </span>
            </div>

            {/* Trust Point 2 */}
            <div className="flex items-center gap-3.5 md:px-6">
              <div className="w-6 h-6 rounded-full bg-[#00c896]/15 text-[#00c896] flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <span className="text-[14px] font-medium text-[#101828] dark:text-foreground leading-snug">
                Grants say &apos;you can apply&apos;, never &apos;you&apos;ll get it&apos;.
              </span>
            </div>

            {/* Trust Point 3 */}
            <div className="flex items-center gap-3.5 md:px-6 last:md:pr-2">
              <div className="w-6 h-6 rounded-full bg-[#00c896]/15 text-[#00c896] flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <span className="text-[14px] font-medium text-[#101828] dark:text-foreground leading-snug">
                Your changes stay yours. Nothing gets overwritten.
              </span>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
