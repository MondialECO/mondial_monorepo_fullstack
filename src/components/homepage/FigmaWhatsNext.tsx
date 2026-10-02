'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Building2, 
  TrendingUp, 
  UserCheck, 
  LayoutGrid, 
  Check
} from 'lucide-react';

export default function FigmaWhatsNext() {
  return (
    <section id="whats-next" className="relative w-full py-24 md:py-32 bg-[#f7f9fc] dark:bg-background overflow-hidden border-b border-[#e8ecf2] dark:border-border">
      
      {/* 48px Dot Grid Pattern & Ambient Center Glow (Figma 57381:10329 & 57381:10332) */}
      <div 
        className="absolute inset-0 opacity-40 pointer-events-none -z-0"
        style={{
          backgroundImage: 'radial-gradient(#cbd5e1 1.5px, transparent 1.5px)',
          backgroundSize: '48px 48px'
        }}
      />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-r from-[#3c61dd]/15 via-[#6f8bff]/10 to-transparent rounded-full blur-3xl pointer-events-none -z-0" />

      <div className="relative z-10 w-full max-w-[1440px] xl:max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
        
        {/* Intro Stack (Figma 57381:10334 - 760px max width) */}
        <div className="flex flex-col items-center text-center max-w-[760px] mx-auto mb-20 space-y-4">
          
          {/* Eyebrow Badge (Figma 57381:10478 - 132x30px) */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#e8eeff] text-[#1f3faf] text-xs font-bold uppercase tracking-wider font-mono shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3c61dd] shrink-0" />
            <span>WHAT&apos;S NEXT</span>
          </div>

          {/* Heading 2 (Figma 57381:10342 - Syne 700 54px lh:60) */}
          <h2 className="text-3xl sm:text-4xl lg:text-[54px] font-bold text-[#101828] dark:text-foreground tracking-tight leading-[1.1] font-heading">
            Creator is just the<br className="hidden sm:inline" /> <span className="text-[#3c61dd]">beginning.</span>
          </h2>

          {/* Subline (Figma 57381:10344 - DM Sans 400 19px) */}
          <p className="max-w-[560px] text-lg sm:text-[19px] text-[#667085] dark:text-muted-foreground leading-relaxed font-sans font-normal">
            Build your project today. Soon, MBC connects you to the people who help it grow.
          </p>
        </div>

        {/* Orbital Network Diagram Layout with Connectors (Figma 57381:10345) */}
        <div className="relative max-w-[1080px] mx-auto mb-16">
          
          {/* Desktop Curved SVG Connectors */}
          <svg 
            className="hidden lg:block absolute inset-0 w-full h-full pointer-events-none z-0" 
            viewBox="0 0 1080 380" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Top-Left Curve: Hub to Entrepreneur */}
            <path 
              d="M 370 140 C 290 140, 280 80, 240 75" 
              stroke="#8ba4f9" 
              strokeWidth="1.5" 
              strokeDasharray="none"
            />
            <circle cx="305" cy="130" r="3" fill="#3c61dd" />
            <circle cx="242" cy="75" r="3.5" fill="#3c61dd" />

            {/* Bottom-Left Curve: Hub to Investor */}
            <path 
              d="M 370 240 C 290 240, 280 300, 240 305" 
              stroke="#8ba4f9" 
              strokeWidth="1.5" 
              strokeDasharray="none"
            />
            <circle cx="305" cy="250" r="3" fill="#3c61dd" />
            <circle cx="242" cy="305" r="3.5" fill="#3c61dd" />

            {/* Top-Right Curve: Hub to Service Provider */}
            <path 
              d="M 710 140 C 790 140, 800 80, 840 75" 
              stroke="#8ba4f9" 
              strokeWidth="1.5" 
              strokeDasharray="none"
            />
            <circle cx="775" cy="130" r="3" fill="#3c61dd" />
            <circle cx="838" cy="75" r="3.5" fill="#3c61dd" />

            {/* Bottom-Right Curve: Hub to Marketplace */}
            <path 
              d="M 710 240 C 790 240, 800 300, 840 305" 
              stroke="#8ba4f9" 
              strokeWidth="1.5" 
              strokeDasharray="none"
            />
            <circle cx="775" cy="250" r="3" fill="#3c61dd" />
            <circle cx="838" cy="305" r="3.5" fill="#3c61dd" />
          </svg>

          {/* 3-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-center relative z-10">
            
            {/* Left Column (2 Satellite Cards: Entrepreneur & Investor) */}
            <div className="lg:col-span-3 space-y-6">
              {/* Top-Left: Entrepreneur Card (240x148px r:20) */}
              <div className="p-5 sm:p-6 rounded-[20px] bg-white dark:bg-card border border-[#e3e8f2] dark:border-border shadow-sm flex flex-col justify-between h-[150px] hover:border-[#3c61dd]/40 transition-all">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-[8px] bg-[#e8eeff] flex items-center justify-center text-[#3c61dd]">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <span className="px-2 py-0.5 rounded-[4px] border border-[#e3e8f2] text-[10px] font-semibold text-[#98a2b3] font-mono">
                    SOON
                  </span>
                </div>
                <div>
                  <h4 className="text-base font-bold text-[#101828] dark:text-foreground font-heading">Entrepreneur</h4>
                  <p className="text-[13px] text-[#667085] dark:text-muted-foreground mt-0.5">Run your company once it&apos;s registered.</p>
                </div>
              </div>

              {/* Bottom-Left: Investor Card (240x148px r:20) */}
              <div className="p-5 sm:p-6 rounded-[20px] bg-white dark:bg-card border border-[#e3e8f2] dark:border-border shadow-sm flex flex-col justify-between h-[150px] hover:border-[#3c61dd]/40 transition-all">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-[8px] bg-[#e8eeff] flex items-center justify-center text-[#3c61dd]">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <span className="px-2 py-0.5 rounded-[4px] border border-[#e3e8f2] text-[10px] font-semibold text-[#98a2b3] font-mono">
                    SOON
                  </span>
                </div>
                <div>
                  <h4 className="text-base font-bold text-[#101828] dark:text-foreground font-heading">Investor</h4>
                  <p className="text-[13px] text-[#667085] dark:text-muted-foreground mt-0.5">Show your project to people who fund.</p>
                </div>
              </div>
            </div>

            {/* Center Hub: Creator (Figma 57381:10408 - 340px wide r:24 bg:#3c61dd) */}
            <div className="lg:col-span-6 max-w-[340px] mx-auto w-full p-6 sm:p-7 rounded-[24px] bg-[#3c61dd] text-white shadow-2xl flex flex-col justify-between space-y-5 relative overflow-hidden">
              {/* Top Row */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-wider font-mono uppercase text-white">
                  CREATOR
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white text-[#101828] text-[11px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00c896]" />
                  <span>Available now</span>
                </span>
              </div>

              {/* Heading */}
              <h3 className="text-2xl font-bold leading-tight font-heading text-white">
                Your project starts here
              </h3>

              {/* Mini Project Preview Inset (Figma 57381:10419) */}
              <div className="p-3.5 rounded-[14px] bg-white text-[#101828] space-y-3 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-[6px] bg-[#3c61dd] text-white font-bold flex items-center justify-center text-xs font-mono">
                    CF
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#101828]">CampusFlow</div>
                    <div className="text-[10px] text-[#667085]">Student teams app</div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#667085]">Phase 3 of 6</span>
                    <span className="text-[#3c61dd] font-bold font-mono">50%</span>
                  </div>
                  <div className="w-full bg-[#f1f5f9] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#3c61dd] h-1.5 rounded-full" style={{ width: '50%' }} />
                  </div>
                </div>
              </div>

              {/* Free to start checkmark */}
              <div className="flex items-center gap-1.5 text-xs text-white/95 font-medium pt-1">
                <Check className="w-3.5 h-3.5 text-white" />
                <span>Free to start</span>
              </div>
            </div>

            {/* Right Column (2 Satellite Cards: Service Provider & Marketplace) */}
            <div className="lg:col-span-3 space-y-6">
              {/* Top-Right: Service Provider Card (240x148px r:20) */}
              <div className="p-5 sm:p-6 rounded-[20px] bg-white dark:bg-card border border-[#e3e8f2] dark:border-border shadow-sm flex flex-col justify-between h-[150px] hover:border-[#3c61dd]/40 transition-all">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-[8px] bg-[#e8eeff] flex items-center justify-center text-[#3c61dd]">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <span className="px-2 py-0.5 rounded-[4px] border border-[#e3e8f2] text-[10px] font-semibold text-[#98a2b3] font-mono">
                    SOON
                  </span>
                </div>
                <div>
                  <h4 className="text-base font-bold text-[#101828] dark:text-foreground font-heading">Service Provider</h4>
                  <p className="text-[13px] text-[#667085] dark:text-muted-foreground mt-0.5">Hire experts when you need help.</p>
                </div>
              </div>

              {/* Bottom-Right: Marketplace Card (240x148px r:20) */}
              <div className="p-5 sm:p-6 rounded-[20px] bg-white dark:bg-card border border-[#e3e8f2] dark:border-border shadow-sm flex flex-col justify-between h-[150px] hover:border-[#3c61dd]/40 transition-all">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-[8px] bg-[#e8eeff] flex items-center justify-center text-[#3c61dd]">
                    <LayoutGrid className="w-4 h-4" />
                  </div>
                  <span className="px-2 py-0.5 rounded-[4px] border border-[#e3e8f2] text-[10px] font-semibold text-[#98a2b3] font-mono">
                    SOON
                  </span>
                </div>
                <div>
                  <h4 className="text-base font-bold text-[#101828] dark:text-foreground font-heading">Marketplace</h4>
                  <p className="text-[13px] text-[#667085] dark:text-muted-foreground mt-0.5">Projects, people and services in one place.</p>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Bottom CTA Block (Figma 57381:10444) */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-center">
          <Link
            href="/signup"
            className="px-8 py-3.5 rounded-[13px] bg-[#3c61dd] hover:bg-[#3252c0] text-white font-bold text-base shadow-md transition-all active:scale-[0.98] font-heading"
          >
            Start free
          </Link>
          <span className="text-sm text-[#667085] font-sans">
            No card needed. New profiles roll out one by one.
          </span>
        </div>

      </div>
    </section>
  );
}

