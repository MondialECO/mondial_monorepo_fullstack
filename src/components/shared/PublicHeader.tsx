'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Menu, X } from 'lucide-react';

const navItems = [
  { label: 'How it works', href: '/#how-it-works' },
  { label: 'Generators', href: '/#generators' },
  { label: 'Dashboard', href: '/#dashboard' },
  { label: 'Full toolbox', href: '/#all-tools' },
  { label: 'Pricing', href: '/pricing' },
];

export default function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  React.useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b border-[#e8ecf2] bg-white/95 backdrop-blur-md transition-all duration-200 dark:border-border/80 dark:bg-[#0b0f19]/95 ${
        isScrolled ? 'shadow-xs bg-white/98 dark:bg-[#0b0f19]/98' : ''
      }`}
      data-testid="public-header-bar"
    >
      <div className="flex h-20 w-full items-center justify-between px-4 sm:px-8 lg:px-12 xl:px-16">
        <Link
          href="/"
          className="group flex items-center gap-3 rounded-lg p-1 focus:outline-none focus:ring-2 focus:ring-[#3c61dd]/40"
          aria-label="MBC — Mondial Business Creation"
        >
          <div className="flex h-[46px] w-[95px] shrink-0 items-center justify-center overflow-hidden rounded-[11px] p-1 transition-transform group-hover:scale-105">
            <Image
              src="/images/mbc-logo.png"
              alt="MBC Logo"
              width={95}
              height={46}
              className="h-full w-full object-contain"
              priority
            />
          </div>
          <div className="hidden flex-col justify-center space-y-1 sm:flex">
            <div>
              <span className="rounded-[4px] bg-[#e8eeff] px-2 py-0.5 font-mono text-[10px] font-bold leading-none tracking-wider text-[#1f3faf] dark:bg-blue-950/70 dark:text-blue-300">
                CREATOR
              </span>
            </div>
            <span className="font-mono text-[10.5px] font-semibold uppercase leading-none tracking-wider text-[#667085] dark:text-muted-foreground">
              THE INTELLIGENT TOOLBOX
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 md:flex lg:gap-8" aria-label="Main Navigation">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="font-sans text-[14px] font-medium text-[#101828]/90 transition-colors hover:text-[#3c61dd] dark:text-foreground/90 dark:hover:text-[#60a5fa]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/login"
            className="px-3 py-2 font-sans text-[14px] font-medium text-[#667085] transition-colors hover:text-[#101828] dark:text-muted-foreground dark:hover:text-white"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="group inline-flex h-[42px] items-center justify-center gap-2 rounded-[12px] bg-[#3c61dd] px-5 font-sans text-[14px] font-medium text-white shadow-sm transition-all hover:bg-[#3252be] active:scale-[0.98]"
          >
            <span>Create Creator Profile</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <button
          className="rounded-lg p-2 text-[#101828] transition-colors hover:bg-slate-100 dark:text-foreground dark:hover:bg-slate-800 md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="animate-in fade-in slide-in-from-top-2 space-y-4 border-t border-[#e8ecf2] bg-white px-6 py-5 shadow-lg duration-150 dark:border-border/80 dark:bg-[#0b0f19] md:hidden">
          <nav className="flex flex-col space-y-3 font-sans">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 text-[15px] font-medium text-[#101828] transition-colors hover:text-[#3c61dd] dark:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex flex-col gap-2.5 border-t border-[#e8ecf2] pt-3 dark:border-border/60">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full rounded-[8px] border border-[#e8ecf2] py-2.5 text-center font-sans text-[14px] font-medium text-[#101828] transition-colors hover:bg-slate-50 dark:border-border dark:text-foreground dark:hover:bg-slate-900"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              onClick={() => setMobileMenuOpen(false)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-[8px] bg-[#3c61dd] py-2.5 font-sans text-[14px] font-medium text-white shadow-sm transition-colors hover:bg-[#3252be]"
            >
              <span>Create Creator Profile</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
