'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Menu, X } from 'lucide-react';

export default function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header
      className="w-full sticky top-0 z-50 bg-white/95 dark:bg-[#0b0f19]/95 backdrop-blur-md border-b border-[#e8ecf2] dark:border-border/80 transition-colors"
      data-testid="public-header-bar"
    >
      <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 h-20 flex items-center justify-between">

        {/* ========================================================================= */}
        {/* LEFT: Brand Logo & Titles (Figma 57381:10848) */}
        {/* ========================================================================= */}
        <Link
          href="/"
          className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-[#3c61dd]/40 rounded-lg p-1"
          aria-label="Mondial Business Creation - Creator Home"
        >
          {/* New MBC Logo Image (95px width, 46px height) */}
          <div className="w-[95px] h-[46px] rounded-[11px] p-1 overflow-hidden flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Image
              src="/images/mbc-logo.png"
              alt="MBC Logo"
              width={95}
              height={46}
              className="w-full h-full object-contain"
              priority
            />
          </div>

          {/* Brand Titles (Figma 57381:10854) */}
          <div className="flex flex-col justify-center space-y-1">
            <div className="flex items-center">
              <span className="px-2 py-0.5 rounded-[4px] bg-[#e8eeff] dark:bg-blue-950/70 text-[#1f3faf] dark:text-blue-300 text-[10px] font-bold font-mono tracking-wider leading-none">
                CREATOR
              </span>
            </div>
            <span className="text-[10.5px] font-semibold text-[#667085] dark:text-muted-foreground tracking-wider uppercase font-mono leading-none">
              MONDIAL BUSINESS CREATION
            </span>
          </div>
        </Link>

        {/* ========================================================================= */}
        {/* CENTER: Main Navigation Menus (Figma 57381:10863) */}
        {/* ========================================================================= */}
        <nav className="hidden md:flex items-center gap-7 lg:gap-8" aria-label="Main Navigation">
          <Link
            href="#how-it-works"
            className="text-[14.5px] font-medium text-[#101828] dark:text-foreground hover:text-[#3c61dd] dark:hover:text-[#60a5fa] transition-colors font-sans"
          >
            How it works
          </Link>

          <Link
            href="#outputs"
            className="text-[14.5px] font-medium text-[#101828] dark:text-foreground hover:text-[#3c61dd] dark:hover:text-[#60a5fa] transition-colors font-sans inline-flex items-center gap-1.5"
          >
            <span>Creator Tools</span>
            {/* Blue dot indicator (Figma 57381:10868) */}
            <span className="w-1.5 h-1.5 rounded-full bg-[#3c61dd]" />
          </Link>

          <Link
            href="#outputs"
            className="text-[14.5px] font-medium text-[#101828] dark:text-foreground hover:text-[#3c61dd] dark:hover:text-[#60a5fa] transition-colors font-sans"
          >
            What you get
          </Link>

          <Link
            href="#faq"
            className="text-[14.5px] font-medium text-[#101828] dark:text-foreground hover:text-[#3c61dd] dark:hover:text-[#60a5fa] transition-colors font-sans"
          >
            FAQ
          </Link>
        </nav>

        {/* ========================================================================= */}
        {/* RIGHT: Dual CTAs (Conversion Focused) (Figma 57381:10873) */}
        {/* ========================================================================= */}
        <div className="hidden md:flex items-center gap-4">
          {/* Secondary: Sign In (Figma 57381:10874) */}
          <Link
            href="/login"
            className="text-[14px] font-medium text-[#667085] dark:text-muted-foreground hover:text-[#101828] dark:hover:text-white px-3 py-2 transition-colors font-sans"
          >
            Sign in
          </Link>

          {/* Primary Conversion CTA: Start for €0 (Figma 57381:10876) */}
          <Link
            href="/signup"
            className="h-[42px] px-5 bg-[#3c61dd] hover:bg-[#3252be] text-white font-medium text-[14px] rounded-[8px] transition-all shadow-sm inline-flex items-center justify-center gap-2 font-sans group active:scale-[0.98]"
          >
            <span>Start for €0</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          className="md:hidden p-2 rounded-lg text-[#101828] dark:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* MOBILE MENU ACCORDION / DRAWER */}
      {/* ========================================================================= */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#e8ecf2] dark:border-border/80 bg-white dark:bg-[#0b0f19] px-6 py-5 space-y-4 shadow-lg animate-in fade-in slide-in-from-top-2 duration-150">
          <nav className="flex flex-col space-y-3 font-sans">
            <Link
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="text-[15px] font-medium text-[#101828] dark:text-foreground hover:text-[#3c61dd] py-1 transition-colors"
            >
              How it works
            </Link>

            <Link
              href="#outputs"
              onClick={() => setMobileMenuOpen(false)}
              className="text-[15px] font-medium text-[#101828] dark:text-foreground hover:text-[#3c61dd] py-1 transition-colors inline-flex items-center justify-between"
            >
              <span>Creator Tools</span>
              <span className="w-2 h-2 rounded-full bg-[#3c61dd]" />
            </Link>

            <Link
              href="#outputs"
              onClick={() => setMobileMenuOpen(false)}
              className="text-[15px] font-medium text-[#101828] dark:text-foreground hover:text-[#3c61dd] py-1 transition-colors"
            >
              What you get
            </Link>

            <Link
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="text-[15px] font-medium text-[#101828] dark:text-foreground hover:text-[#3c61dd] py-1 transition-colors"
            >
              FAQ
            </Link>
          </nav>

          <div className="pt-3 border-t border-[#e8ecf2] dark:border-border/60 flex flex-col gap-2.5">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 rounded-[8px] border border-[#e8ecf2] dark:border-border text-[14px] font-medium text-[#101828] dark:text-foreground hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors font-sans"
            >
              Sign in
            </Link>

            <Link
              href="/signup"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 rounded-[8px] bg-[#3c61dd] hover:bg-[#3252be] text-white text-[14px] font-medium shadow-sm inline-flex items-center justify-center gap-2 font-sans transition-colors"
            >
              <span>Start for €0</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
