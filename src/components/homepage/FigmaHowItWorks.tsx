'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Check, 
  ArrowRight,
  ExternalLink,
  Download,
  Eye,
  Globe,
  LayoutGrid
} from 'lucide-react';

export default function FigmaHowItWorks() {
  return (
    <section id="how-it-works" className="w-full py-20 md:py-28 bg-gradient-to-b from-[#ffffff] via-[#f7f9fc] to-[#ffffff] border-b border-[#e8ecf2]">
      <div className="w-full max-w-[1440px] xl:max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
        
        {/* Intro Header (Figma 57377:9706 - Max-Width 720px) */}
        <div className="flex flex-col items-center text-center max-w-[720px] mx-auto mb-20 space-y-4">
          
          {/* Eyebrow Badge (Figma 57381:10473 - 138x30px) */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#e8eeff] text-[#1f3faf] text-xs font-semibold uppercase font-mono shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3c61dd] shrink-0" />
            <span>HOW IT WORKS</span>
          </div>

          {/* Heading 1 (Figma 57377:9714 - Inter 600 54px lh:60) */}
          <h2 className="text-3xl sm:text-4xl lg:text-[54px] font-semibold text-[#101828] dark:text-foreground tracking-tight leading-[1.1] font-heading">
            From idea to<br className="hidden sm:inline" /> company in 6 steps.
          </h2>

          {/* Subline (Figma 57377:9716 - DM Sans 400 20px) */}
          <p className="text-lg sm:text-xl lg:text-[20px] text-[#667085] dark:text-muted-foreground leading-relaxed font-sans font-normal">
            Go one step at a time. Everything you make is saved and feeds the next step.
          </p>
        </div>

        {/* Continuous 6-Phase Timeline Layout (Figma 57377:9717) */}
        <div className="relative flex flex-col md:flex-row gap-6 lg:gap-10 max-w-[1360px] mx-auto">
          
          {/* Left Spine / Timeline Nodes (Figma 57377:9718 - 96px width) */}
          <div className="hidden md:flex flex-col items-center w-16 shrink-0 relative pt-7">
            {/* Connecting Vertical Track Line */}
            <div className="absolute top-12 bottom-12 w-[2px] bg-[#e3e8f2] -z-0">
              {/* Blue Active Section down to Node 03 */}
              <div className="w-full h-[850px] bg-[#3c61dd]" />
            </div>

            {/* Spine Nodes positioned alongside cards */}
            <div className="flex flex-col justify-between h-full space-y-[380px] lg:space-y-[420px] relative z-10">
              {/* Node 01 */}
              <div className="w-12 h-12 rounded-full bg-[#e8eeff] text-[#1f3faf] font-bold text-base flex items-center justify-center relative font-mono shadow-sm">
                01
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#00c896] border-2 border-white flex items-center justify-center text-white text-[9px]">✓</span>
              </div>

              {/* Node 02 */}
              <div className="w-12 h-12 rounded-full bg-[#e8eeff] text-[#1f3faf] font-bold text-base flex items-center justify-center relative font-mono shadow-sm">
                02
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#00c896] border-2 border-white flex items-center justify-center text-white text-[9px]">✓</span>
              </div>

              {/* Node 03 (Active Centerpiece) */}
              <div className="w-12 h-12 rounded-full bg-[#3c61dd] text-white font-bold text-base flex items-center justify-center font-mono shadow-md ring-4 ring-[#3c61dd]/20">
                03
              </div>

              {/* Node 04 */}
              <div className="w-12 h-12 rounded-full bg-white border border-[#e3e8f2] text-[#667085] font-bold text-base flex items-center justify-center font-mono shadow-2xs">
                04
              </div>

              {/* Node 05 */}
              <div className="w-12 h-12 rounded-full bg-white border border-[#e3e8f2] text-[#667085] font-bold text-base flex items-center justify-center font-mono shadow-2xs">
                05
              </div>

              {/* Node 06 */}
              <div className="w-12 h-12 rounded-full bg-white border border-[#e3e8f2] text-[#667085] font-bold text-base flex items-center justify-center font-mono shadow-2xs">
                06
              </div>
            </div>
          </div>

          {/* Right Cards Stack (Continuous vertical sequence) */}
          <div className="flex-1 space-y-8">
            
            {/* ===================================================================== */}
            {/* CARD 01: PHASE 01 · YOU (Figma 57377:9742) */}
            {/* ===================================================================== */}
            <div className="rounded-[24px] border border-[#e3e8f2] dark:border-border bg-white dark:bg-card p-6 sm:p-8 shadow-sm">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Left Text (5 cols) */}
                <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
                  <div className="space-y-3">
                    <div className="text-xs font-semibold text-[#667085] tracking-wider uppercase font-mono">
                      PHASE 01 · YOU
                    </div>
                    <h3 className="text-2xl sm:text-[28px] font-semibold text-[#101828] dark:text-foreground font-heading">
                      Start with you
                    </h3>
                    <p className="text-base sm:text-[17px] text-[#667085] dark:text-muted-foreground leading-relaxed font-sans font-normal">
                      Tell us what you&apos;ve done, what you&apos;re good at and how much time you have. School projects count.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#e3e8f2] flex items-center gap-2 text-sm">
                    <span className="text-[#667085]">You get:</span>
                    <span className="font-semibold text-[#101828] dark:text-foreground">Your builder profile</span>
                  </div>
                </div>

                {/* Right Preview (7 cols) */}
                <div className="lg:col-span-7 p-5 rounded-[16px] bg-[#f7f8fc] dark:bg-muted/30 border border-[#e3e8f2] space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#e3e8f2] text-xs">
                    <span className="text-[#667085]">Your builder profile</span>
                    <span className="px-2.5 py-0.5 rounded-[6px] bg-[#ecfdf5] text-[#008764] font-semibold text-[11px]">
                      Completed
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
                        <div className="text-xs text-[#667085]">Student · Lyon</div>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between py-1 border-b border-[#f1f5f9]">
                        <span className="text-[#667085]">Strengths</span>
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded bg-[#f5f5f5] text-[#101828] font-medium text-[11px]">Design</span>
                          <span className="px-2 py-0.5 rounded bg-[#f5f5f5] text-[#101828] font-medium text-[11px]">Social media</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-[#f1f5f9]">
                        <span className="text-[#667085]">Experience</span>
                        <span className="font-semibold text-[#101828] dark:text-foreground">2 school projects · 1 internship</span>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-[#f1f5f9]">
                        <span className="text-[#667085]">Weekly time</span>
                        <span className="font-bold text-[#101828] dark:text-foreground">10–20 h</span>
                      </div>
                      <div className="flex items-center justify-between py-1">
                        <span className="text-[#667085]">How you like to grow</span>
                        <span className="font-semibold text-[#101828] dark:text-foreground">Learn by doing</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-center text-[11px] text-[#667085]">
                    Your plan will be built around this.
                  </div>
                </div>
              </div>
            </div>

            {/* ===================================================================== */}
            {/* CARD 02: PHASE 02 · PROJECT & BRAND (Figma 57377:9803) */}
            {/* ===================================================================== */}
            <div className="rounded-[24px] border border-[#c9d5ff] dark:border-border bg-white dark:bg-card p-6 sm:p-8 shadow-sm">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Left Text (5 cols) */}
                <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
                  <div className="space-y-3">
                    <div className="text-xs font-semibold text-[#667085] tracking-wider uppercase font-mono">
                      PHASE 02 · PROJECT & BRAND
                    </div>
                    <h3 className="text-2xl sm:text-[28px] font-semibold text-[#101828] dark:text-foreground font-heading">
                      Shape your idea and brand
                    </h3>
                    <p className="text-base sm:text-[17px] text-[#667085] dark:text-muted-foreground leading-relaxed font-sans font-normal">
                      Answer a few questions to sharpen your idea, pick a name, then build your logo, colors and fonts.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#e3e8f2] flex items-center gap-2 text-sm">
                    <span className="text-[#667085]">You get:</span>
                    <span className="font-semibold text-[#101828] dark:text-foreground">Your project and Brand Kit</span>
                  </div>
                </div>

                {/* Right Preview Bento (7 cols) */}
                <div className="lg:col-span-7 p-5 rounded-[16px] bg-[#f7f8fc] dark:bg-muted/30 border border-[#c9d5ff] space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#e3e8f2] text-xs">
                    <span className="text-[#667085]">Brand Kit</span>
                    <span className="px-2.5 py-0.5 rounded-[6px] bg-[#ecfdf5] text-[#008764] font-semibold text-[11px]">
                      Completed
                    </span>
                  </div>

                  {/* Bento Grid */}
                  <div className="space-y-2.5">
                    {/* Top Full-Width Idea Tile */}
                    <div className="p-3.5 rounded-[12px] bg-white dark:bg-card border border-[#e3e8f2] flex items-center justify-between">
                      <div>
                        <div className="text-base font-bold text-[#101828] dark:text-foreground">CampusFlow</div>
                        <div className="text-xs text-[#667085]">Simple project management for student teams.</div>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] bg-[#fafafa] border border-[#e3e8f2] text-xs">
                        <span className="text-[#667085]">Idea clarity</span>
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
                        <div className="text-[10px] text-[#667085]">Monogram</div>
                      </div>

                      {/* Palette */}
                      <div className="p-3 rounded-[12px] bg-white dark:bg-card border border-[#e3e8f2] flex flex-col justify-between space-y-1.5">
                        <div className="text-[10px] font-bold text-[#667085] font-mono">PALETTE</div>
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
                        <div className="text-[10px] text-[#667085]">Heading · Body</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ===================================================================== */}
            {/* CARD 03: PHASE 03 · BUSINESS PLAN (CORE PHASE CENTERPIECE - Figma 57377:9876) */}
            {/* ===================================================================== */}
            <div className="rounded-[24px] border-2 border-[#3c61dd] bg-white dark:bg-card p-6 sm:p-10 shadow-lg relative overflow-hidden">
              {/* Card Top Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#e3e8f2] gap-4">
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-[#667085] tracking-wider uppercase font-mono">
                    PHASE 03 · BUSINESS PLAN
                  </div>
                  <h3 className="text-2xl sm:text-[32px] font-semibold text-[#101828] dark:text-foreground font-heading">
                    Build the business behind your idea
                  </h3>
                  <p className="text-base sm:text-[17px] text-[#667085] dark:text-muted-foreground leading-relaxed font-sans font-normal max-w-2xl">
                    Seven guided steps: your market, model, numbers, legal basics and a full business plan.
                  </p>
                  <div className="pt-2 flex items-center gap-2 text-sm">
                    <span className="text-[#667085]">You get:</span>
                    <span className="font-semibold text-[#101828] dark:text-foreground">A complete, structured business plan</span>
                  </div>
                </div>

                {/* Only Solid Blue Badge in entire section */}
                <div className="shrink-0">
                  <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#3c61dd] text-white font-bold text-xs font-mono shadow-xs tracking-wider">
                    CORE PHASE
                  </span>
                </div>
              </div>

              {/* Full-Width Dashboard Panel (Figma 57377:9898) */}
              <div className="mt-8 p-6 rounded-[16px] bg-[#f7f8fc] dark:bg-muted/30 border border-[#e3e8f2] space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-[#e3e8f2] text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#101828] dark:text-foreground font-heading">Business Plan Intelligence</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3c61dd]" />
                  </div>
                  <span className="text-[#667085] font-mono">Step 6 of 7</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Stepper (7 cols) */}
                  <div className="lg:col-span-7 space-y-2 relative">
                    {[
                      { step: '3.1', name: 'Market Intelligence', detail: '· Market size & 6 competitors mapped', status: 'Completed', completed: true },
                      { step: '3.2', name: 'Business Model', detail: '· Model canvas ready', status: 'Completed', completed: true },
                      { step: '3.3', name: 'Financial Forecast', detail: '· 36-month forecast', status: 'Completed', completed: true },
                      { step: '3.4', name: 'Legal & Compliance', detail: '· French rules checked', status: 'Completed', completed: true },
                      { step: '3.5', name: 'Formation & Team', detail: '· Suggested form: SAS-U', status: 'Completed', completed: true },
                      { step: '3.6', name: 'Executive Business Plan', detail: '· 12 sections', status: 'In progress', active: true, progress: 72 },
                      { step: '3.7', name: 'Investor Readiness', detail: '', status: 'Not started', pending: true }
                    ].map((s, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-[8px] flex items-center justify-between gap-3 text-xs transition-colors ${
                          s.active 
                            ? 'bg-[#e8eeff] border border-[#6f8bff] text-[#1f3faf]' 
                            : 'bg-white dark:bg-card border border-[#e3e8f2] text-[#101828]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={`w-3 h-3 rounded-full border-2 ${s.active ? 'border-[#3c61dd] bg-[#3c61dd]' : 'border-[#3c61dd] bg-white'} shrink-0`} />
                          <span className="font-bold font-mono text-[#667085]">{s.step}</span>
                          <span className="font-semibold text-[#101828] dark:text-foreground truncate">{s.name}</span>
                          <span className="text-[#667085] hidden sm:inline truncate">{s.detail}</span>
                        </div>

                        <span className={`px-2.5 py-0.5 rounded-[6px] text-[10px] font-semibold shrink-0 ${
                          s.completed 
                            ? 'bg-[#ecfdf5] text-[#008764]' 
                            : s.active 
                            ? 'bg-[#3c61dd] text-white' 
                            : 'bg-white border border-[#e3e8f2] text-[#667085]'
                        }`}>
                          {s.status}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Right 2 Mini Cards (5 cols) */}
                  <div className="lg:col-span-5 space-y-4">
                    {/* Mini Card 1: 3-Bar Chart */}
                    <div className="p-4 rounded-[12px] bg-white dark:bg-card border border-[#e3e8f2] space-y-3">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-[#101828] dark:text-foreground">Year 1–3 revenue</span>
                        <span className="text-[10px] text-[#667085]">From your forecast</span>
                      </div>
                      <div className="flex items-end justify-around h-20 p-2 bg-[#f8faff] rounded-[8px] border border-[#e3e8f2]">
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-10 h-8 rounded-t-[2px] bg-[#aec2fa]" />
                          <span className="text-[9px] text-[#667085]">Y1</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-10 h-12 rounded-t-[2px] bg-[#6f8bff]" />
                          <span className="text-[9px] text-[#667085]">Y2</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-10 h-16 rounded-t-[2px] bg-[#3c61dd]" />
                          <span className="text-[9px] text-[#667085]">Y3</span>
                        </div>
                      </div>
                      <div className="text-right text-[10px] text-[#667085]">Relative trajectory scale</div>
                    </div>

                    {/* Mini Card 2: Readiness Ring */}
                    <div className="p-4 rounded-[12px] bg-white dark:bg-card border border-[#e3e8f2] flex flex-col items-center text-center space-y-2">
                      <div className="w-full text-left text-[11px] font-bold text-[#101828] dark:text-foreground">Investor readiness</div>
                      <div className="w-16 h-16 rounded-full border-4 border-[#e3e8f2] border-dashed flex items-center justify-center text-lg font-bold text-[#667085]">
                        —
                      </div>
                      <div className="text-xs text-[#667085]">
                        A planning self-check. Unlocks at step 3.7.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ===================================================================== */}
            {/* CARD 04: PHASE 04 · BUILD & LAUNCH PREP (Figma 57377:10024) */}
            {/* ===================================================================== */}
            <div className="rounded-[24px] border border-[#e3e8f2] dark:border-border bg-white dark:bg-card p-6 sm:p-8 shadow-sm">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Left Text */}
                <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
                  <div className="space-y-3">
                    <div className="text-xs font-semibold text-[#667085] tracking-wider uppercase font-mono">
                      PHASE 04 · BUILD & LAUNCH PREP
                    </div>
                    <h3 className="text-2xl sm:text-[28px] font-semibold text-[#101828] dark:text-foreground font-heading">
                      Get ready to build and launch
                    </h3>
                    <p className="text-base sm:text-[17px] text-[#667085] dark:text-muted-foreground leading-relaxed font-sans font-normal">
                      A plan made for your skills and your time: what to do now, what to learn, what to hand off.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#e3e8f2] flex items-center gap-2 text-sm">
                    <span className="text-[#667085]">You get:</span>
                    <span className="font-semibold text-[#101828] dark:text-foreground">Your 90-day plan and launch website</span>
                  </div>
                </div>

                {/* Right Preview */}
                <div className="lg:col-span-7 p-5 rounded-[16px] bg-[#f7f8fc] dark:bg-muted/30 border border-[#e3e8f2] space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-[#e3e8f2] text-xs">
                    <span className="text-[#667085]">Construction & launch</span>
                    <span className="px-2.5 py-0.5 rounded-[6px] bg-[#e8eeff] text-[#1f3faf] font-semibold text-[11px]">
                      In progress
                    </span>
                  </div>

                  {/* 4 Horizon Bar */}
                  <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                    <div className="p-2 rounded-[8px] bg-white border border-[#3c61dd] text-[#101828]">
                      <div className="font-bold text-[#3c61dd] flex items-center justify-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#3c61dd]" /> NOW
                      </div>
                      <div className="font-semibold text-[10px] text-[#101828] mt-1">Talk to 5 customers</div>
                      <div className="text-[9px] text-[#667085]">Set your first price</div>
                    </div>
                    <div className="p-2 rounded-[8px] bg-white border border-[#e3e8f2] text-[#667085]">
                      <div className="font-bold text-[#667085] flex items-center justify-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#cbd5e1]" /> 30 DAYS
                      </div>
                      <div className="text-[9px] mt-1">Finalize prototype</div>
                    </div>
                    <div className="p-2 rounded-[8px] bg-white border border-[#e3e8f2] text-[#667085]">
                      <div className="font-bold text-[#667085] flex items-center justify-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#cbd5e1]" /> 60 DAYS
                      </div>
                      <div className="text-[9px] mt-1">Closed pilot group</div>
                    </div>
                    <div className="p-2 rounded-[8px] bg-white border border-[#e3e8f2] text-[#667085]">
                      <div className="font-bold text-[#667085] flex items-center justify-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#cbd5e1]" /> 90 DAYS
                      </div>
                      <div className="text-[9px] mt-1">Public opening</div>
                    </div>
                  </div>

                  {/* Skills + Support */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    <div className="p-3 rounded-[8px] bg-white border border-[#e3e8f2] space-y-1.5">
                      <div className="text-[10px] font-bold text-[#667085] font-mono">SKILLS ROADMAP</div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span>Sales basics</span>
                        <span className="px-1.5 py-0.5 rounded bg-[#f5f5f5] text-[9px] font-bold">LEARN</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span>App development</span>
                        <span className="px-1.5 py-0.5 rounded bg-[#f5f5f5] text-[9px] font-bold">DELEGATE</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span>Data protection (GDPR)</span>
                        <span className="px-1.5 py-0.5 rounded bg-[#f5f5f5] text-[9px] font-bold">VERIFY</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-[8px] bg-white border border-[#e3e8f2] space-y-1.5">
                      <div className="text-[10px] font-bold text-[#667085] font-mono">SUPPORT PROGRAMS</div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span>JEI status</span>
                        <span className="text-[#667085] text-[10px]">Needs review</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span>Bpifrance support</span>
                        <span className="text-[#667085] text-[10px]">Needs review</span>
                      </div>
                    </div>
                  </div>

                  {/* Launch Website Row (Figma 57377:10129) */}
                  <div className="p-3 rounded-[8px] bg-white border border-[#e3e8f2] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-[#eff6ff] flex items-center justify-center text-[#3c61dd]">
                        <Globe className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-semibold text-[#101828]">Launch website</span>
                      <span className="text-[#667085]">· One page</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="px-2.5 py-1 rounded-[6px] border border-[#e3e8f2] text-xs font-semibold text-[#101828] hover:bg-[#f8fafc]">
                        View
                      </button>
                      <button className="px-2.5 py-1 rounded-[6px] border border-[#e3e8f2] text-xs font-semibold text-[#101828] hover:bg-[#f8fafc]">
                        Download code
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ===================================================================== */}
            {/* CARD 05: PHASE 05 · COMPANY (Figma 57377:10141) */}
            {/* ===================================================================== */}
            <div className="rounded-[24px] border border-[#e3e8f2] dark:border-border bg-white dark:bg-card p-6 sm:p-8 shadow-sm">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Left Text */}
                <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
                  <div className="space-y-3">
                    <div className="text-xs font-semibold text-[#667085] tracking-wider uppercase font-mono">
                      PHASE 05 · COMPANY
                    </div>
                    <h3 className="text-2xl sm:text-[28px] font-semibold text-[#101828] dark:text-foreground font-heading">
                      Create your company
                    </h3>
                    <p className="text-base sm:text-[17px] text-[#667085] dark:text-muted-foreground leading-relaxed font-sans font-normal">
                      Step-by-step help to register your company in France: legal form, capital, documents.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#e3e8f2] flex items-center gap-2 text-sm">
                    <span className="text-[#667085]">You get:</span>
                    <span className="font-semibold text-[#101828] dark:text-foreground">A registration guide and progress tracker</span>
                  </div>
                </div>

                {/* Right Preview */}
                <div className="lg:col-span-7 p-5 rounded-[16px] bg-[#f7f8fc] dark:bg-muted/30 border border-[#e3e8f2] space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-[#e3e8f2] text-xs">
                    <span className="text-[#667085]">Your registration guide</span>
                    <span className="px-2.5 py-0.5 rounded-[6px] bg-[#e8eeff] text-[#1f3faf] font-semibold text-[11px]">
                      In progress
                    </span>
                  </div>

                  {/* 3 Metrics */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-3 rounded-[8px] bg-white border border-[#e3e8f2]">
                      <div className="text-[10px] text-[#667085]">Legal form</div>
                      <div className="text-sm font-bold text-[#101828] mt-0.5">SAS-U</div>
                    </div>
                    <div className="p-3 rounded-[8px] bg-white border border-[#e3e8f2]">
                      <div className="text-[10px] text-[#667085]">Share capital</div>
                      <div className="text-sm font-bold text-[#101828] mt-0.5">€1</div>
                    </div>
                    <div className="p-3 rounded-[8px] bg-white border border-[#e3e8f2]">
                      <div className="text-[10px] text-[#667085]">Documents</div>
                      <div className="text-sm font-bold text-[#101828] mt-0.5">3 of 5 ready</div>
                    </div>
                  </div>

                  {/* 4-Step Tracker */}
                  <div className="p-3 rounded-[8px] bg-white border border-[#e3e8f2] space-y-2 text-xs">
                    <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                      <div className="p-1.5 rounded bg-[#f8fafc]">
                        <div className="text-[#667085]">Company details</div>
                        <div className="text-[#008764] font-semibold mt-0.5">Completed</div>
                      </div>
                      <div className="p-1.5 rounded bg-[#f8fafc]">
                        <div className="text-[#667085]">Capital</div>
                        <div className="text-[#008764] font-semibold mt-0.5">Completed</div>
                      </div>
                      <div className="p-1.5 rounded bg-[#f8fafc]">
                        <div className="text-[#667085]">Documents</div>
                        <div className="text-[#1f3faf] font-semibold mt-0.5">In progress</div>
                      </div>
                      <div className="p-1.5 rounded bg-[#f8fafc]">
                        <div className="text-[#667085]">Registration</div>
                        <div className="text-[#667085] font-semibold mt-0.5">Not started</div>
                      </div>
                    </div>
                  </div>

                  <div className="text-center text-[10px] text-[#667085]">
                    Only SAS, SAS-U and SARL for now.
                  </div>
                </div>
              </div>
            </div>

            {/* ===================================================================== */}
            {/* CARD 06: PHASE 06 · NEXT CHAPTER (Figma 57377:10202) */}
            {/* ===================================================================== */}
            <div className="rounded-[24px] border border-[#e3e8f2] dark:border-border bg-white dark:bg-card p-6 sm:p-8 shadow-sm relative overflow-hidden">
              {/* 2px green accent line along top edge (Figma 57377:10299) */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#00c896]/60" />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Left Text */}
                <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#667085] tracking-wider uppercase font-mono">
                      <LayoutGrid className="w-4 h-4 text-[#667085]" />
                      <span>PHASE 06 · NEXT CHAPTER</span>
                    </div>
                    <h3 className="text-2xl sm:text-[28px] font-semibold text-[#101828] dark:text-foreground font-heading leading-tight">
                      See what you built, and<br className="hidden sm:inline" /> keep going
                    </h3>
                    <p className="text-base sm:text-[17px] text-[#667085] dark:text-muted-foreground leading-relaxed font-sans font-normal">
                      All your results in one place, with your next real step.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#e3e8f2] flex items-center gap-2 text-sm font-sans">
                    <span className="text-[#667085]">You get:</span>
                    <span className="font-medium text-[#101828] dark:text-foreground">Your next chapter</span>
                  </div>
                </div>

                {/* Right Product Preview (Figma 57377:10220) */}
                <div className="lg:col-span-7 p-5 sm:p-6 rounded-[16px] bg-[#f7f8fc] dark:bg-muted/30 border border-[#e3e8f2] dark:border-border/70 space-y-4">
                  {/* Top Header Row */}
                  <div className="flex items-center justify-between text-xs font-sans text-[#667085] dark:text-muted-foreground">
                    <span>Your next chapter</span>
                    <span>Calm overview</span>
                  </div>

                  {/* 2 Equal Columns (6 cols / 6 cols in Figma 57377:10227) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-start">
                    {/* Part 1: Left column - Milestones & Your Results (Figma 57377:10228) */}
                    <div className="bg-white dark:bg-card rounded-[12px] border border-[#e3e8f2] dark:border-border/60 p-3.5 sm:p-4 space-y-3 shadow-2xs">
                      {/* Milestones header */}
                      <div className="space-y-1">
                        <div className="font-bold text-[13px] text-[#101828] dark:text-foreground font-sans leading-snug">
                          You&apos;ve built your project plan
                        </div>
                        <div className="text-[12px] text-[#667085] dark:text-muted-foreground font-sans">
                          Company registration: in progress
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="border-t border-[#e3e8f2] dark:border-border/60 pt-2.5 space-y-2">
                        <div className="text-[11px] font-semibold text-[#667085] font-mono tracking-wider uppercase">
                          YOUR RESULTS
                        </div>

                        {/* 4 Deliverable Result Rows */}
                        <div className="space-y-2 text-xs font-sans">
                          <div className="flex items-center justify-between">
                            <span className="text-[#101828] dark:text-foreground text-[12px]">
                              Project &amp; brand <span className="text-[#667085] text-[11px]">(4)</span>
                            </span>
                            <span className="px-2 py-0.5 rounded-[4px] bg-[#00c896]/15 text-[#008764] dark:text-emerald-400 text-[10px] font-medium">
                              Available
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-[#101828] dark:text-foreground text-[12px]">
                              Business planning <span className="text-[#667085] text-[11px]">(4)</span>
                            </span>
                            <span className="px-2 py-0.5 rounded-[4px] bg-[#00c896]/15 text-[#008764] dark:text-emerald-400 text-[10px] font-medium">
                              Available
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-[#101828] dark:text-foreground text-[12px]">
                              Build &amp; launch <span className="text-[#667085] text-[11px]">(6)</span>
                            </span>
                            <span className="px-2 py-0.5 rounded-[4px] bg-[#eef0f4] dark:bg-muted text-[#101828] dark:text-foreground text-[10px] font-medium">
                              Draft
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-[#101828] dark:text-foreground text-[12px]">
                              Company preparation <span className="text-[#667085] text-[11px]">(2)</span>
                            </span>
                            <span className="px-2 py-0.5 rounded-[4px] bg-[#e8eeff] dark:bg-blue-950/60 text-[#1f3faf] dark:text-blue-300 text-[10px] font-medium">
                              In progress
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Part 2: Right column - Your next move (Figma 57377:10262) */}
                    <div className="space-y-2">
                      <div className="text-[11px] font-semibold text-[#667085] font-mono tracking-wider uppercase mb-1">
                        YOUR NEXT MOVE
                      </div>

                      {/* Action 1: Primary Action (Blue highlight) */}
                      <button className="w-full h-12 px-3 rounded-[12px] bg-[#e8eeff] dark:bg-blue-950/40 border border-[#c9d5ff] dark:border-blue-800/60 flex items-center justify-between text-left transition-colors hover:bg-[#dce6ff] group cursor-pointer">
                        <span className="text-[12px] font-semibold text-[#1f3faf] dark:text-blue-300 font-sans">
                          Continue company preparation
                        </span>
                        <ArrowRight className="w-4 h-4 text-[#1f3faf] dark:text-blue-300 shrink-0 transition-transform group-hover:translate-x-0.5" />
                      </button>

                      {/* Action 2 */}
                      <button className="w-full h-12 px-3 rounded-[12px] bg-white dark:bg-card border border-[#e3e8f2] dark:border-border/60 flex items-center justify-between text-left transition-colors hover:bg-[#f8fafc] group cursor-pointer">
                        <span className="text-[12px] font-medium text-[#101828] dark:text-foreground font-sans">
                          Work on your next launch task
                        </span>
                        <ArrowRight className="w-4 h-4 text-[#667085] dark:text-muted-foreground shrink-0 transition-transform group-hover:translate-x-0.5" />
                      </button>

                      {/* Action 3 */}
                      <button className="w-full h-12 px-3 rounded-[12px] bg-white dark:bg-card border border-[#e3e8f2] dark:border-border/60 flex items-center justify-between text-left transition-colors hover:bg-[#f8fafc] group cursor-pointer">
                        <span className="text-[12px] font-medium text-[#101828] dark:text-foreground font-sans">
                          Review your pricing
                        </span>
                        <ArrowRight className="w-4 h-4 text-[#667085] dark:text-muted-foreground shrink-0 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    </div>
                  </div>

                  {/* Part 3: Strip across bottom - Coming to MBC (Full width 12 cols, Figma 57377:10280) */}
                  <div className="pt-3 border-t border-[#e3e8f2] dark:border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="text-[11px] font-semibold text-[#667085] font-mono tracking-wider uppercase shrink-0">
                      COMING TO MBC
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="px-3 py-1.5 rounded-[10px] bg-white dark:bg-card border border-[#e3e8f2] dark:border-border/60 flex items-center gap-2 shadow-2xs">
                        <span className="text-[11px] text-[#101828] dark:text-foreground font-sans font-normal">
                          Entrepreneur
                        </span>
                        <span className="px-1.5 py-0.5 rounded-[4px] bg-[#eef0f4] dark:bg-muted text-[10px] text-[#667085] dark:text-muted-foreground font-sans">
                          Coming soon
                        </span>
                      </div>

                      <div className="px-3 py-1.5 rounded-[10px] bg-white dark:bg-card border border-[#e3e8f2] dark:border-border/60 flex items-center gap-2 shadow-2xs">
                        <span className="text-[11px] text-[#101828] dark:text-foreground font-sans font-normal">
                          Investor
                        </span>
                        <span className="px-1.5 py-0.5 rounded-[4px] bg-[#eef0f4] dark:bg-muted text-[10px] text-[#667085] dark:text-muted-foreground font-sans">
                          Coming soon
                        </span>
                      </div>

                      <div className="px-3 py-1.5 rounded-[10px] bg-white dark:bg-card border border-[#e3e8f2] dark:border-border/60 flex items-center gap-2 shadow-2xs">
                        <span className="text-[11px] text-[#101828] dark:text-foreground font-sans font-normal">
                          Service Provider
                        </span>
                        <span className="px-1.5 py-0.5 rounded-[4px] bg-[#eef0f4] dark:bg-muted text-[10px] text-[#667085] dark:text-muted-foreground font-sans">
                          Coming soon
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Bottom Breadcrumb Sequence (Figma 57377:10300) */}
        <div className="mt-16 pt-8 flex flex-col items-center justify-center space-y-4 text-center">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm font-semibold text-[#101828]">
            <span className="px-3 py-1.5 rounded-full bg-white border border-[#e3e8f2] shadow-2xs">You</span>
            <span className="text-[#98a2b3]">→</span>
            <span className="px-3 py-1.5 rounded-full bg-white border border-[#e3e8f2] shadow-2xs">Brand</span>
            <span className="text-[#98a2b3]">→</span>
            <span className="px-3 py-1.5 rounded-full bg-white border border-[#e3e8f2] shadow-2xs">Business plan</span>
            <span className="text-[#98a2b3]">→</span>
            <span className="px-3 py-1.5 rounded-full bg-white border border-[#e3e8f2] shadow-2xs">Launch plan</span>
            <span className="text-[#98a2b3]">→</span>
            <span className="px-3 py-1.5 rounded-full bg-white border border-[#e3e8f2] shadow-2xs">Company</span>
            <span className="text-[#98a2b3]">→</span>
            <span className="px-3 py-1.5 rounded-full bg-white border border-[#e3e8f2] shadow-2xs">Next chapter</span>
          </div>

          <p className="text-sm text-[#667085] font-sans">
            One project. Everything you build stays connected.
          </p>
        </div>

      </div>
    </section>
  );
}

