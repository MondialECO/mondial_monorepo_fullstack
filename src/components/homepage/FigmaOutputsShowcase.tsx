'use client';

import React from 'react';
import Link from 'next/link';
import { FileText, Check } from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';

export default function FigmaOutputsShowcase() {
  const { t } = useLanguage();

  return (
    <section id="outputs" className="relative z-10 w-full overflow-hidden pt-16 sm:pt-20 md:pt-24 pb-16 md:pb-24 bg-[#f7f9fc] dark:bg-background border-b border-[#e8ecf2] dark:border-border">
      <div className="w-full max-w-[1440px] xl:max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">

        {/* Section Header (Figma Frame 8 - 954x333px) */}
        <div className="flex flex-col items-center text-center max-w-[954px] mx-auto mb-16 space-y-4">

          {/* Eyebrow Badge (Figma 57381:10458 - 194x33px) */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#e8eeff] text-[#1f3faf] text-[12px] font-medium font-sans shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3c61dd] shrink-0" />
            <span>{t('homepage.outputs.eyebrow')}</span>
          </div>

          {/* Headline (Figma 57363:80916 - Inter 600 54px lh:65) */}
          <h2 className="text-3xl sm:text-4xl lg:text-[54px] font-semibold text-[#000000] dark:text-foreground tracking-tight leading-[1.12] font-heading">
            {t('homepage.outputs.headline').split('\n').map((line, i) => (
              <React.Fragment key={i}>
                {line}
                {i === 0 && <br className="hidden sm:inline" />}
              </React.Fragment>
            ))}
          </h2>

          {/* Subtitle (Figma 57363:80917 - DM Sans 400 18px) */}
          <p className="max-w-[780px] text-base sm:text-lg md:text-[18px] text-[#000000]/80 dark:text-muted-foreground leading-relaxed font-sans font-normal">
            {t('homepage.outputs.subtitle')}
          </p>

          {/* Action CTA Button (Figma 57363:80919 - 153x48px r:13 bg:#3c61dd) */}
          <div className="pt-2">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center px-6 h-[48px] rounded-[13px] bg-[#3c61dd] hover:bg-[#3252c0] text-white font-extrabold text-[16px] shadow-md transition-all active:scale-[0.98] font-heading"
            >
              {t('homepage.outputs.cta')}
            </Link>
          </div>
        </div>

        {/* 6 Outputs Grid (2 Large Anchor Previews + 4 Functional Previews) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">

          {/* ========================================================================= */}
          {/* OUTPUT 01: Brand Identity (Figma 57375:8614) */}
          {/* ========================================================================= */}
          <div className="rounded-[24px] border border-[#e8ecf2] dark:border-border bg-white dark:bg-card p-6 sm:p-8 flex flex-col justify-between shadow-sm">
            <div className="space-y-4">
              {/* Card Header */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold tracking-wider px-2.5 py-1 rounded-[6px] bg-[#eef2ff] text-[#3c61dd] font-mono">
                    {t('homepage.outputs.output01.tag')}
                  </span>
                  <span className="text-xs font-medium text-[#94a3b8] font-heading">
                    {t('homepage.outputs.output01.overline')}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-[#070707] dark:text-foreground font-heading">
                  {t('homepage.outputs.output01.title')}
                </h3>
                <p className="text-base text-[#64748b] dark:text-muted-foreground font-sans">
                  {t('homepage.outputs.output01.description')}
                </p>
              </div>

              {/* Realistic Mockup Preview */}
              <div className="rounded-[16px] border border-[#e2e8f0] dark:border-border/70 bg-[#f8fafc] dark:bg-muted/30 p-5 space-y-4">
                {/* Top bar */}
                <div className="flex items-center justify-between pb-3.5 border-b border-[#e2e8f0] dark:border-border/60">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-[8px] bg-[#3c61dd] text-white font-bold text-xs flex items-center justify-center font-mono">
                      CF
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#1e293b] dark:text-foreground">CampusFlow</div>
                      <div className="text-[10px] text-[#64748b]">Brand Guidelines v1.0</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-[#047857] bg-[#ecfdf5] border border-[#a7f3d0] px-2 py-0.5 rounded-full">
                    ● Exported SVG & Tokens
                  </span>
                </div>

                {/* Sub-modules Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Logo Sub-card */}
                  <div className="p-3.5 rounded-[12px] bg-white dark:bg-card border border-[#e2e8f0] dark:border-border/60 space-y-2">
                    <div className="text-[10px] font-bold text-[#94a3b8] tracking-wider font-heading">PROJECT LOGO</div>
                    <div className="flex items-center gap-3 py-1">
                      <div className="w-10 h-10 rounded-[12px] bg-gradient-to-br from-[#3c61dd] to-[#1f3faf] flex items-center justify-center text-white font-bold text-sm">
                        CF
                      </div>
                      <div>
                        <div className="text-sm font-bold text-[#0f172a] dark:text-foreground">CampusFlow</div>
                        <div className="text-[10px] text-[#64748b]">Vector Wordmark + Glyph</div>
                      </div>
                    </div>
                    <div className="pt-1 border-t border-[#f1f5f9] dark:border-border/50 text-[10px] text-[#94a3b8]">
                      Formats: SVG, EPS, PNG, Favicon
                    </div>
                  </div>

                  {/* Color Swatches Sub-card */}
                  <div className="p-3.5 rounded-[12px] bg-white dark:bg-card border border-[#e2e8f0] dark:border-border/60 space-y-2">
                    <div className="text-[10px] font-bold text-[#94a3b8] tracking-wider font-heading">COLOR SYSTEM</div>
                    <div className="space-y-1.5 text-[10px] font-mono">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <span className="w-3.5 h-3.5 rounded-[4px] bg-[#3c61dd] inline-block" />
                          <span className="text-[#334155] dark:text-foreground">Primary Blue</span>
                        </span>
                        <span className="text-[#64748b]">#3C61DD</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <span className="w-3.5 h-3.5 rounded-[4px] bg-[#0f172a] inline-block" />
                          <span className="text-[#334155] dark:text-foreground">Deep Slate</span>
                        </span>
                        <span className="text-[#64748b]">#0F172A</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <span className="w-3.5 h-3.5 rounded-[4px] bg-[#10b981] inline-block" />
                          <span className="text-[#334155] dark:text-foreground">Signal Mint</span>
                        </span>
                        <span className="text-[#64748b]">#10B981</span>
                      </div>
                    </div>
                    <div className="pt-1 border-t border-[#f1f5f9] dark:border-border/50 flex items-center justify-between text-[10px]">
                      <span className="text-[#94a3b8]">WCAG AAA Verified</span>
                      <span className="text-[#3c61dd] font-semibold">Tailwind tokens</span>
                    </div>
                  </div>

                  {/* Typography Sub-card */}
                  <div className="p-3.5 rounded-[12px] bg-white dark:bg-card border border-[#e2e8f0] dark:border-border/60 space-y-2">
                    <div className="text-[10px] font-bold text-[#94a3b8] tracking-wider font-heading">TYPOGRAPHY HIERARCHY</div>
                    <div className="space-y-1">
                      <div className="flex items-baseline justify-between">
                        <span className="text-sm font-bold text-[#1e293b] dark:text-foreground font-heading">Syne Display</span>
                        <span className="text-[10px] text-[#94a3b8]">Titles & H1</span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs font-semibold text-[#334155] dark:text-foreground">Plus Jakarta Sans</span>
                        <span className="text-[10px] text-[#94a3b8]">Body & Interface</span>
                      </div>
                    </div>
                  </div>

                  {/* Brand Positioning Sub-card */}
                  <div className="p-3.5 rounded-[12px] bg-gradient-to-br from-[#1e3a8a] to-[#2563eb] text-white flex flex-col justify-between space-y-2">
                    <div className="text-[9px] font-bold text-[#bfdbfe] tracking-wider font-heading">POSITIONING STATEMENT</div>
                    <p className="text-[11px] text-[#eff6ff] leading-relaxed font-normal">
                      “The decentralized logistics micro-network built specifically for student communities.”
                    </p>
                    <div className="flex items-center justify-between text-[9px] text-[#bfdbfe] pt-1">
                      <span>Audience: Universities</span>
                      <span className="bg-white/20 px-1.5 py-0.5 rounded font-bold text-white">Validated</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* OUTPUT 02: Business Plan (Figma 57375:8703) */}
          {/* ========================================================================= */}
          <div className="rounded-[24px] border border-[#e8ecf2] dark:border-border bg-white dark:bg-card p-6 sm:p-8 flex flex-col justify-between shadow-sm">
            <div className="space-y-4">
              {/* Card Header */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold tracking-wider px-2.5 py-1 rounded-[6px] bg-[#ecfdf5] text-[#047857] font-mono">
                    {t('homepage.outputs.output02.tag')}
                  </span>
                  <span className="text-xs font-semibold text-[#047857] bg-[#ecfdf5] border border-[#a7f3d0] px-2.5 py-0.5 rounded-full">
                    {t('homepage.outputs.output02.overline')}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-[#070707] dark:text-foreground font-heading">
                  {t('homepage.outputs.output02.title')}
                </h3>
                <p className="text-base text-[#64748b] dark:text-muted-foreground font-sans">
                  {t('homepage.outputs.output02.description')}
                </p>
              </div>

              {/* Realistic Document Deck Mockup */}
              <div className="rounded-[16px] border border-[#e2e8f0] dark:border-border/70 bg-[#f8fafc] dark:bg-muted/30 p-5 space-y-4">
                {/* Meta bar */}
                <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0] dark:border-border/60 text-xs">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#3c61dd]" />
                    <span className="font-bold text-[#1e293b] dark:text-foreground">CampusFlow_Business_Plan_v1.pdf</span>
                  </div>
                  <span className="text-[10px] text-[#64748b] font-mono">18 Pages · Formatted</span>
                </div>

                {/* 2-Panel Deck Layout */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-stretch">
                  {/* Left Mini Cover Page (5 cols) */}
                  <div className="sm:col-span-5 p-4 rounded-[12px] bg-white dark:bg-card border border-[#e2e8f0] dark:border-border/60 flex flex-col justify-between relative overflow-hidden">
                    <div className="w-7 h-7 rounded-[8px] bg-[#0f172a] text-white flex items-center justify-center font-bold text-xs font-mono">
                      MBC
                    </div>
                    <div className="my-4 space-y-1">
                      <div className="text-[9px] font-bold text-[#3c61dd] tracking-wider font-mono">CONFIDENTIAL DOSSIER</div>
                      <div className="text-base font-bold text-[#0f172a] dark:text-foreground font-heading">CampusFlow</div>
                      <div className="text-[10px] text-[#64748b] leading-tight">Comprehensive Investor & Banking Business Plan</div>
                    </div>
                    <div className="pt-2 border-t border-[#f1f5f9] dark:border-border/50 flex items-center justify-between text-[9px] text-[#94a3b8]">
                      <span>Prepared with MBC</span>
                      <span>2025 Ed.</span>
                    </div>
                  </div>

                  {/* Right 3 Sections Breakdown (7 cols) */}
                  <div className="sm:col-span-7 space-y-2">
                    <div className="p-3 rounded-[12px] bg-white dark:bg-card border border-[#e2e8f0] dark:border-border/60 space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-[#94a3b8] font-mono">SECTION 01</span>
                        <span className="text-[#059669] font-semibold">Complete</span>
                      </div>
                      <div className="text-xs font-bold text-[#1e293b] dark:text-foreground">Executive Summary</div>
                      <div className="text-[10px] text-[#64748b] truncate">Problem, solution hypothesis, revenue model & growth</div>
                    </div>

                    <div className="p-3 rounded-[12px] bg-white dark:bg-card border border-[#e2e8f0] dark:border-border/60 space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-[#94a3b8] font-mono">SECTION 02</span>
                        <span className="text-[#059669] font-semibold">Complete</span>
                      </div>
                      <div className="text-xs font-bold text-[#1e293b] dark:text-foreground">Market & Competitive Landscape</div>
                      <div className="text-[10px] text-[#64748b] truncate">TAM, SAM, SOM calculations and direct substitute analysis</div>
                    </div>

                    <div className="p-3 rounded-[12px] bg-white dark:bg-card border border-[#e2e8f0] dark:border-border/60 space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-[#94a3b8] font-mono">SECTION 03</span>
                        <span className="text-[#059669] font-semibold">Complete</span>
                      </div>
                      <div className="text-xs font-bold text-[#1e293b] dark:text-foreground">Business Model & Go-To-Market</div>
                      <div className="text-[10px] text-[#64748b] truncate">Commission structure, vendor onboarding and unit economics</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* OUTPUT 03: Financial Forecast (Figma 57375:8778) */}
          {/* ========================================================================= */}
          <div className="rounded-[24px] border border-[#e8ecf2] dark:border-border bg-white dark:bg-card p-6 sm:p-8 flex flex-col justify-between shadow-sm">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold tracking-wider px-2.5 py-1 rounded-[6px] bg-[#eff6ff] text-[#2563eb] font-mono">
                    {t('homepage.outputs.output03.tag')}
                  </span>
                  <span className="text-xs font-medium text-[#94a3b8] font-heading">
                    {t('homepage.outputs.output03.overline')}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-[#070707] dark:text-foreground font-heading">
                  {t('homepage.outputs.output03.title')}
                </h3>
                <p className="text-base text-[#64748b] dark:text-muted-foreground font-sans">
                  {t('homepage.outputs.output03.description')}
                </p>
              </div>

              {/* Clean Financial Dashboard Mockup */}
              <div className="rounded-[16px] border border-[#e2e8f0] dark:border-border/70 bg-[#f8fafc] dark:bg-muted/30 p-5 space-y-4">
                {/* 3 Stats Pillars */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded-[12px] bg-white dark:bg-card border border-[#e2e8f0] dark:border-border/60">
                    <div className="text-[9px] font-bold text-[#94a3b8] font-mono">MONTH 12 ARR</div>
                    <div className="text-sm font-bold text-[#0f172a] dark:text-foreground mt-0.5 font-mono">€94,200</div>
                  </div>
                  <div className="p-2.5 rounded-[12px] bg-white dark:bg-card border border-[#e2e8f0] dark:border-border/60">
                    <div className="text-[9px] font-bold text-[#94a3b8] font-mono">MO. EXPENSES</div>
                    <div className="text-sm font-bold text-[#0f172a] dark:text-foreground mt-0.5 font-mono">€3,450</div>
                  </div>
                  <div className="p-2.5 rounded-[12px] bg-[#ecfdf5] border border-[#a7f3d0]">
                    <div className="text-[9px] font-bold text-[#047857] font-mono">BREAK-EVEN</div>
                    <div className="text-sm font-bold text-[#047857] mt-0.5 font-mono">Month 14</div>
                  </div>
                </div>

                {/* Visual 12-Month Bar Chart */}
                <div className="p-3.5 rounded-[12px] bg-white dark:bg-card border border-[#e2e8f0] dark:border-border/60 space-y-3">
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1.5 text-[#475569] dark:text-muted-foreground">
                        <span className="w-2.5 h-2.5 rounded-[4px] bg-[#3c61dd]" /> Revenue
                      </span>
                      <span className="flex items-center gap-1.5 text-[#475569] dark:text-muted-foreground">
                        <span className="w-2.5 h-2.5 rounded-[4px] bg-[#cbd5e1]" /> Expenses
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-[#059669] bg-[#ecfdf5] border border-[#d1fae5] px-2 py-0.5 rounded-full">
                      Target: Positive Cashflow
                    </span>
                  </div>

                  {/* 12-Month Trajectory Stacked Chart with Break-even line */}
                  <div className="relative pt-3 pb-1">
                    {/* Horizontal Break-even Dotted Line & Pill Badge */}
                    <div className="absolute left-0 right-0 top-[52px] border-t border-dashed border-[#34d399]/80 z-10 pointer-events-none flex justify-end pr-1 sm:pr-2">
                      <span className="bg-white dark:bg-[#0f172a] border border-[#a7f3d0] dark:border-emerald-600 text-[#059669] dark:text-emerald-400 text-[9px] font-semibold px-2 py-0.5 rounded-[4px] shadow-sm -translate-y-1/2">
                        Break-even point
                      </span>
                    </div>

                    {/* 12 Columns (M1 - M12) */}
                    <div className="grid grid-cols-12 gap-1 sm:gap-2 items-end h-[104px]">
                      {[
                        { month: 'M1', rev: 12, exp: 29 },
                        { month: 'M2', rev: 17, exp: 29 },
                        { month: 'M3', rev: 24, exp: 31 },
                        { month: 'M4', rev: 31, exp: 31 },
                        { month: 'M5', rev: 38, exp: 34 },
                        { month: 'M6', rev: 43, exp: 33 },
                        { month: 'M7', rev: 45, exp: 31 },
                        { month: 'M8', rev: 48, exp: 29 },
                        { month: 'M9', rev: 49, exp: 27 },
                        { month: 'M10', rev: 50, exp: 26 },
                        { month: 'M11', rev: 51, exp: 25 },
                        { month: 'M12', rev: 54, exp: 22 },
                      ].map((item, idx) => (
                        <div key={idx} className="flex flex-col items-center justify-end h-full w-full">
                          {/* Top Block: Revenue */}
                          <div
                            className="w-full max-w-[34px] bg-[#3c61dd] rounded-t-[3px] rounded-b-[1px] transition-all hover:opacity-90"
                            style={{ height: `${item.rev}px` }}
                            title={`Revenue (${item.month})`}
                          />
                          {/* Spacing between Revenue and Expenses */}
                          <div className="h-[3px] w-full" />
                          {/* Bottom Block: Expenses */}
                          <div
                            className="w-full max-w-[34px] bg-[#e2e8f0] dark:bg-slate-600 rounded-b-[3px] rounded-t-[1px] transition-all hover:opacity-90"
                            style={{ height: `${item.exp}px` }}
                            title={`Expenses (${item.month})`}
                          />
                          {/* Month Label */}
                          <span
                            className={`text-[9px] font-mono mt-1.5 leading-none select-none ${item.month === 'M12'
                              ? 'font-bold text-[#0f172a] dark:text-foreground'
                              : 'text-[#94a3b8]'
                              }`}
                          >
                            {item.month}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* OUTPUT 04: Market Research (Figma 57375:8884) */}
          {/* ========================================================================= */}
          <div className="rounded-[24px] border border-[#e8ecf2] dark:border-border bg-white dark:bg-card p-6 sm:p-8 flex flex-col justify-between shadow-sm">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold tracking-wider px-2.5 py-1 rounded-[6px] bg-[#faf5ff] text-[#9333ea] font-mono">
                    {t('homepage.outputs.output04.tag')}
                  </span>
                  <span className="text-xs font-medium text-[#94a3b8] font-heading">
                    {t('homepage.outputs.output04.overline')}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-[#070707] dark:text-foreground font-heading">
                  {t('homepage.outputs.output04.title')}
                </h3>
                <p className="text-base text-[#64748b] dark:text-muted-foreground font-sans">
                  {t('homepage.outputs.output04.description')}
                </p>
              </div>

              {/* Market Research Preview */}
              <div className="rounded-[16px] border border-[#e2e8f0] dark:border-border/70 bg-[#f8fafc] dark:bg-muted/30 p-5 space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Customer Evidence */}
                  <div className="p-3.5 rounded-[12px] bg-white dark:bg-card border border-[#e2e8f0] dark:border-border/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#94a3b8] font-heading">CUSTOMER EVIDENCE</span>
                      <span className="text-[10px] font-bold text-[#059669]">9 INTERVIEWS</span>
                    </div>
                    <div className="space-y-1 text-[10px] text-[#334155] dark:text-foreground">
                      <div className="flex items-center gap-1 text-[#059669] font-bold">
                        <span>✓</span>
                        <span>82% pain match on intra-campus package delays</span>
                      </div>
                      <div className="flex items-center gap-1 text-[#64748b]">
                        <span>✓</span>
                        <span>Willingness to pay validated at €3.50/delivery</span>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-[#f1f5f9] dark:border-border/50 flex items-center justify-between text-[10px]">
                      <span className="text-[#64748b]">Confidence Level</span>
                      <span className="text-[#3c61dd] font-bold">High (88%)</span>
                    </div>
                  </div>

                  {/* Opportunity Gap */}
                  <div className="p-3.5 rounded-[12px] bg-white dark:bg-card border border-[#e2e8f0] dark:border-border/60 space-y-2">
                    <div className="text-[10px] font-bold text-[#94a3b8] font-heading">OPPORTUNITY GAP</div>
                    <div className="p-2 rounded-[8px] bg-[#eff6ff] border border-[#dbeafe] text-[10px] text-[#3c61dd] font-semibold leading-relaxed">
                      Unmet Need: Courier companies refuse university campus access. Peer network has zero competitor presence.
                    </div>
                    <div className="pt-1 flex items-center justify-between text-[10px]">
                      <span className="text-[#64748b]">First-Mover Window</span>
                      <span className="bg-[#f1f5f9] px-2 py-0.5 rounded font-bold text-[#334155]">9-12 Months</span>
                    </div>
                  </div>
                </div>

                {/* Competitor Differentiation Matrix */}
                <div className="p-3.5 rounded-[12px] bg-white dark:bg-card border border-[#e2e8f0] dark:border-border/60 space-y-2">
                  <div className="text-[10px] font-bold text-[#94a3b8] font-heading">COMPETITOR DIFFERENTIATION MATRIX</div>
                  <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                    <div className="p-2 rounded-[8px] bg-[#f8fafc] border border-[#f1f5f9]">
                      <div className="font-bold text-[#334155]">Legacy Couriers</div>
                      <div className="text-[#f43f5e] mt-0.5">High friction</div>
                    </div>
                    <div className="p-2 rounded-[8px] bg-[#f8fafc] border border-[#f1f5f9]">
                      <div className="font-bold text-[#334155]">Campus Mailroom</div>
                      <div className="text-[#f43f5e] mt-0.5">Static hours</div>
                    </div>
                    <div className="p-2 rounded-[8px] bg-[#ecfdf5] border border-[#a7f3d0]">
                      <div className="font-bold text-[#065f46]">CampusFlow</div>
                      <div className="text-[#065f46] font-bold mt-0.5">P2P Instant</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* OUTPUT 05: Action Roadmap (Figma 57375:8951) */}
          {/* ========================================================================= */}
          <div className="rounded-[24px] border border-[#e8ecf2] dark:border-border bg-white dark:bg-card p-6 sm:p-8 flex flex-col justify-between shadow-sm">
            <div className="space-y-4">
              {/* Card Header */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold tracking-wider px-2.5 py-1 rounded-[6px] bg-[#fff8ea] dark:bg-amber-950/40 text-[#b45309] dark:text-amber-400 font-mono">
                    {t('homepage.outputs.output05.tag')}
                  </span>
                  <span className="text-xs font-medium text-[#94a3b8] font-heading">
                    {t('homepage.outputs.output05.overline')}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-[#070707] dark:text-foreground font-heading">
                  {t('homepage.outputs.output05.title')}
                </h3>
                <p className="text-base text-[#64748b] dark:text-muted-foreground font-sans">
                  {t('homepage.outputs.output05.description')}
                </p>
              </div>

              {/* Realistic Roadmap Mockup Container (Figma 57375:8951) */}
              <div className="rounded-[20px] border border-[#e2e8f0] dark:border-border/70 bg-[#f8fafc] dark:bg-muted/30 p-4 sm:p-6 flex items-center justify-center">
                <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-3.5 items-stretch">

                  {/* Column 1: NOW (Active Blue Treatment - Figma 57375:8960) */}
                  <div className="p-4 sm:p-4.5 rounded-[16px] bg-white dark:bg-card border border-[#3c61dd] border-t-[3px] border-t-[#3c61dd] shadow-sm flex flex-col justify-between min-h-[250px]">
                    <div className="space-y-3">
                      <div className="text-xs sm:text-[13px] font-bold text-[#3c61dd] font-mono tracking-wider">
                        NOW
                      </div>
                      <div className="space-y-2.5">
                        <div className="p-3 rounded-[10px] bg-[#f0f6ff] dark:bg-blue-950/40 border border-[#dbeafe] dark:border-blue-900/60 text-[12px] sm:text-[12.5px] text-[#1e293b] dark:text-foreground font-medium leading-snug">
                          Deploy Campus landing page
                        </div>
                        <div className="p-3 rounded-[10px] bg-[#f0f6ff] dark:bg-blue-950/40 border border-[#dbeafe] dark:border-blue-900/60 text-[12px] sm:text-[12.5px] text-[#1e293b] dark:text-foreground font-medium leading-snug">
                          Collect first 50 student signups
                        </div>
                      </div>
                    </div>
                    <div className="text-[12px] font-semibold text-[#3c61dd] pt-3">
                      Priority 1
                    </div>
                  </div>

                  {/* Column 2: NEXT 30 D (Figma 57375:8974) */}
                  <div className="p-4 sm:p-4.5 rounded-[16px] bg-white dark:bg-card border border-[#e2e8f0] dark:border-border/60 shadow-2xs flex flex-col justify-between min-h-[250px]">
                    <div className="space-y-3">
                      <div className="text-xs sm:text-[13px] font-bold text-[#334155] dark:text-foreground font-mono tracking-wider">
                        NEXT 30 D
                      </div>
                      <div className="space-y-2.5">
                        <div className="p-3 rounded-[10px] bg-[#f8fafc] dark:bg-muted/40 text-[12px] sm:text-[12.5px] text-[#334155] dark:text-foreground leading-snug font-normal">
                          Pilot test with 10 student dispatchers
                        </div>
                        <div className="p-3 rounded-[10px] bg-[#f8fafc] dark:bg-muted/40 text-[12px] sm:text-[12.5px] text-[#334155] dark:text-foreground leading-snug font-normal">
                          Finalize merchant terms
                        </div>
                      </div>
                    </div>
                    <div className="text-[12px] font-normal text-[#64748b] dark:text-muted-foreground pt-3">
                      On Track
                    </div>
                  </div>

                  {/* Column 3: 30–60 D (Figma 57375:8988) */}
                  <div className="p-4 sm:p-4.5 rounded-[16px] bg-white dark:bg-card border border-[#e2e8f0] dark:border-border/60 shadow-2xs flex flex-col justify-between min-h-[250px]">
                    <div className="space-y-3">
                      <div className="text-xs sm:text-[13px] font-bold text-[#334155] dark:text-foreground font-mono tracking-wider">
                        30–60 D
                      </div>
                      <div className="space-y-2.5">
                        <div className="p-3 rounded-[10px] bg-[#f8fafc] dark:bg-muted/40 text-[12px] sm:text-[12.5px] text-[#334155] dark:text-foreground leading-snug font-normal">
                          Expand to Dormitory Cluster B
                        </div>
                        <div className="p-3 rounded-[10px] bg-[#f8fafc] dark:bg-muted/40 text-[12px] sm:text-[12.5px] text-[#334155] dark:text-foreground leading-snug font-normal">
                          Setup automated payouts
                        </div>
                      </div>
                    </div>
                    <div className="text-[12px] font-normal text-[#64748b] dark:text-muted-foreground pt-3">
                      Scheduled
                    </div>
                  </div>

                  {/* Column 4: 60–90 D (Figma 57375:9002) */}
                  <div className="p-4 sm:p-4.5 rounded-[16px] bg-white dark:bg-card border border-[#e2e8f0] dark:border-border/60 shadow-2xs flex flex-col justify-between min-h-[250px]">
                    <div className="space-y-3">
                      <div className="text-xs sm:text-[13px] font-bold text-[#334155] dark:text-foreground font-mono tracking-wider">
                        60–90 D
                      </div>
                      <div className="space-y-2.5">
                        <div className="p-3 rounded-[10px] bg-[#f8fafc] dark:bg-muted/40 text-[12px] sm:text-[12.5px] text-[#334155] dark:text-foreground leading-snug font-normal">
                          Launch second university campus
                        </div>
                        <div className="p-3 rounded-[10px] bg-[#f8fafc] dark:bg-muted/40 text-[12px] sm:text-[12.5px] text-[#334155] dark:text-foreground leading-snug font-normal">
                          Seed investment round preparation
                        </div>
                      </div>
                    </div>
                    <div className="text-[12px] font-normal text-[#64748b] dark:text-muted-foreground pt-3">
                      Future
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* OUTPUT 06: Business Setup Guide (Figma 57375:9014) */}
          {/* ========================================================================= */}
          <div className="rounded-[24px] border border-[#e8ecf2] dark:border-border bg-white dark:bg-card p-6 sm:p-8 flex flex-col justify-between shadow-sm">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold tracking-wider px-2.5 py-1 rounded-[6px] bg-[#f0fdfa] text-[#0f766e] font-mono">
                    {t('homepage.outputs.output06.tag')}
                  </span>
                  <span className="text-xs font-medium text-[#94a3b8] font-heading">
                    {t('homepage.outputs.output06.overline')}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-[#070707] dark:text-foreground font-heading">
                  {t('homepage.outputs.output06.title')}
                </h3>
                <p className="text-base text-[#64748b] dark:text-muted-foreground font-sans">
                  {t('homepage.outputs.output06.description')}
                </p>
              </div>

              {/* Checklist Preview */}
              <div className="rounded-[16px] border border-[#e2e8f0] dark:border-border/70 bg-[#f8fafc] dark:bg-muted/30 p-4 space-y-2.5">
                {/* Item 1 */}
                <div className="p-3 rounded-[12px] bg-white dark:bg-card border border-[#e2e8f0] dark:border-border/60 flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#d1fae5] flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-[#059669]" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0f172a] dark:text-foreground">Choose legal structure</span>
                      <span className="text-[9px] font-semibold text-[#059669] bg-[#ecfdf5] px-2 py-0.5 rounded">SASU Recommended</span>
                    </div>
                    <p className="text-[10px] text-[#64748b] leading-tight">Selected SASU for flexible student equity division and zero social charges on non-distributed dividends.</p>
                  </div>
                </div>

                {/* Item 2 */}
                <div className="p-3 rounded-[12px] bg-white dark:bg-card border border-[#e2e8f0] dark:border-border/60 flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#d1fae5] flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-[#059669]" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0f172a] dark:text-foreground">Prepare required information</span>
                      <span className="text-[9px] font-semibold text-[#059669] bg-[#ecfdf5] px-2 py-0.5 rounded">All Docs Ready</span>
                    </div>
                    <p className="text-[10px] text-[#64748b] leading-tight">Articles of association, shareholder identity verifications and certified office address generated.</p>
                  </div>
                </div>

                {/* Item 3 */}
                <div className="p-3 rounded-[12px] bg-[#eff6ff] border border-[#bfdbfe] flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#3c61dd] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 font-mono">
                    3
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0f172a] dark:text-foreground">Complete official registration</span>
                      <span className="text-[9px] font-semibold text-[#3c61dd] bg-[#eff6ff] px-2 py-0.5 rounded border border-[#bfdbfe]">Next Action</span>
                    </div>
                    <p className="text-[10px] text-[#64748b] leading-tight">Direct portal link to Guichet Unique with pre-filled company purpose codes (NAF/APE) provided.</p>
                  </div>
                </div>

                {/* Item 4 */}
                <div className="p-3 rounded-[12px] bg-white dark:bg-card border border-[#e2e8f0] dark:border-border/60 flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#f1f5f9] text-[#94a3b8] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 font-mono">
                    4
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#1e293b] dark:text-foreground">Open professional account</span>
                      <span className="text-[9px] text-[#94a3b8]">Step 4</span>
                    </div>
                    <p className="text-[10px] text-[#64748b] leading-tight">Pre-selected digital business banking partners with €0 deposit certificate fees.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
