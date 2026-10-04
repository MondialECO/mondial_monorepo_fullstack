import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer
      className="relative w-full overflow-hidden bg-[#F7F9FC] dark:bg-[#070b14] text-[#101828] dark:text-foreground font-sans border-t border-[#e3e8f2] dark:border-border/80 transition-colors"
      data-testid="public-footer"
    >
      {/* Ambient subtle connector graphic watermark (Progress / Network motif - Figma 57381:10883) */}
      <div
        className="absolute right-[-60px] md:right-[40px] lg:right-[80px] top-[10px] md:top-[20px] pointer-events-none opacity-40 dark:opacity-20 z-0"
        aria-hidden="true"
      >
        <svg
          width="480"
          height="380"
          viewBox="0 0 480 380"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-[#3c61dd]"
        >
          <path
            d="M80 190C80 278.306 151.694 350 240 350C328.306 350 400 278.306 400 190C400 101.694 328.306 30 240 30C151.694 30 80 101.694 80 190V190"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeOpacity="0.12"
          />
          <path
            d="M160 190C160 234.153 195.847 270 240 270C284.153 270 320 234.153 320 190C320 145.847 284.153 110 240 110C195.847 110 160 145.847 160 190V190"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="6 6"
            strokeOpacity="0.16"
          />
          <path
            d="M345 77C345 81.4153 348.585 85 353 85C357.415 85 361 81.4153 361 77C361 72.5847 357.415 69 353 69C348.585 69 345 72.5847 345 77Z"
            fill="currentColor"
            fillOpacity="0.25"
          />
          <path
            d="M119 303C119 307.415 122.585 311 127 311C131.415 311 135 307.415 135 303C135 298.585 131.415 295 127 295C122.585 295 119 298.585 119 303Z"
            fill="currentColor"
            fillOpacity="0.25"
          />
          <path
            d="M127 303L240 190L353 77"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeOpacity="0.18"
          />
        </svg>
      </div>

      <div className="relative z-10 w-full max-w-[1280px] xl:max-w-[1360px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-14 pt-20 pb-12">

        {/* ========================================================================= */}
        {/* TOP SECTION: 5-COLUMN FOOTER GRID (Figma 57381:10891) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-8 xl:gap-10">

          {/* COLUMN 1: Brand & Socials (Col-span 4) (Figma 57381:10892) */}
          <div className="md:col-span-4 flex flex-col space-y-5">
            {/* Brand Lockup */}
            <Link
              href="/"
              className="flex flex-col gap-2 group focus:outline-none focus:ring-2 focus:ring-[#3c61dd]/40 rounded-lg self-start"
              aria-label="Mondial Business Creation Home"
            >
              <div className="w-[95px] h-[46px] rounded-[10px] p-1 overflow-hidden flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Image
                  src="/images/mbc-logo.png"
                  alt="MBC Logo"
                  width={95}
                  height={46}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="flex flex-col justify-center">
                <span className="font-semibold text-[18px] tracking-tight text-[#101828] dark:text-white font-heading leading-tight">
                  MBC
                </span>
                <span className="text-[10px] font-semibold text-[#667085] dark:text-muted-foreground tracking-wider uppercase font-mono leading-none mt-1">
                  MONDIAL BUSINESS CREATION
                </span>
              </div>
            </Link>

            {/* Supporting Copy */}
            <div className="space-y-1 pt-1">
              <div className="font-semibold text-[14px] text-[#101828] dark:text-foreground font-sans">
                Build your digital business from idea to launch.
              </div>
              <div className="font-medium text-[14px] text-[#3c61dd] dark:text-[#60a5fa] font-sans">
                Start building for €0.
              </div>
            </div>

            {/* Paragraph */}
            <p className="text-[13px] text-[#667085] dark:text-muted-foreground leading-relaxed font-sans max-w-[340px]">
              A simpler way for the next generation of founders to turn an idea into a real business project.
            </p>

            {/* Clean Minimalist Social Icons (Figma 57381:10908) */}
            <div className="flex items-center gap-3 pt-2">
              {/* LinkedIn (Figma 57381:10910) */}
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="MBC on LinkedIn"
                className="w-9 h-9 rounded-[8px] border border-[#e3e8f2] dark:border-border/80 bg-white dark:bg-card flex items-center justify-center text-[#667085] hover:text-[#3c61dd] hover:border-[#3c61dd]/40 transition-colors shadow-2xs"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.6667 2C13.4026 2 14 2.59745 14 3.33333V12.6667C14 13.4026 13.4026 14 12.6667 14H3.33333C2.59745 14 2 13.4026 2 12.6667V3.33333C2 2.59745 2.59745 2 3.33333 2H12.6667ZM12.3333 12.3333V8.8C12.3333 7.5997 11.3603 6.62667 10.16 6.62667C9.59333 6.62667 8.93333 6.97333 8.64 7.49333V6.75333H6.78V12.3333H8.64V9.04667C8.64 8.53333 9.05333 8.11333 9.56667 8.11333C10.0821 8.11333 10.5 8.5312 10.5 9.04667V12.3333H12.3333ZM4.30667 7.26667H6.16667V12.8467H4.30667V7.26667ZM5.24 4.2C4.64353 4.2 4.16 4.68353 4.16 5.28C4.16 5.87333 4.64667 6.36 5.24 6.36C5.83333 6.36 6.32 5.87333 6.32 5.28C6.32 4.68667 5.83333 4.2 5.24 4.2Z" fill="currentColor"/>
                </svg>
              </a>

              {/* Instagram (Figma 57381:10913) */}
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="MBC on Instagram"
                className="w-9 h-9 rounded-[8px] border border-[#e3e8f2] dark:border-border/80 bg-white dark:bg-card flex items-center justify-center text-[#667085] hover:text-[#3c61dd] hover:border-[#3c61dd]/40 transition-colors shadow-2xs"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4.66683 1.33301H11.3335C13.1744 1.33301 14.6668 2.82539 14.6668 4.66634V11.333C14.6668 13.174 13.1744 14.6663 11.3335 14.6663H4.66683C2.82588 14.6663 1.3335 13.174 1.3335 11.333V4.66634C1.3335 2.82539 2.82588 1.33301 4.66683 1.33301V1.33301" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10.6669 7.58032C10.8356 8.7183 10.2556 9.83622 9.22795 10.3534C8.20035 10.8707 6.9569 10.6706 6.14343 9.8571C5.32995 9.04362 5.12986 7.80017 5.64708 6.77257C6.1643 5.74497 7.28222 5.16491 8.4202 5.33365C9.58219 5.50596 10.4946 6.41834 10.6669 7.58032V7.58032" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M11.6665 4.33301H11.6732" stroke="currentColor" strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>

              {/* X / Twitter (Figma 57381:10918) */}
              <a
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="MBC on X"
                className="w-9 h-9 rounded-[8px] border border-[#e3e8f2] dark:border-border/80 bg-white dark:bg-card flex items-center justify-center text-[#667085] hover:text-[#3c61dd] hover:border-[#3c61dd]/40 transition-colors shadow-2xs"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10.6423 1.3125H12.5719L8.35619 6.13083L13.3157 12.6875H9.43244L6.39094 8.71092L2.91078 12.6875H0.979945L5.48911 7.53375L0.731445 1.3125H4.71328L7.46253 4.94725L10.6423 1.3125ZM9.96503 11.5325H11.0343L4.13228 2.40683H2.98486L9.96503 11.5325Z" fill="currentColor"/>
                </svg>
              </a>
            </div>
          </div>

          {/* COLUMN 2: PRODUCT (Col-span 2) (Figma 57381:10920) */}
          <div className="md:col-span-2 space-y-4">
            <h3 className="text-[12px] font-semibold text-[#101828] dark:text-foreground uppercase tracking-wider font-mono">
              PRODUCT
            </h3>
            <ul className="space-y-2.5 text-[14px] font-sans">
              <li>
                <Link
                  href="/for-creators"
                  className="inline-flex items-center gap-1.5 font-medium text-[#101828] dark:text-foreground hover:text-[#3c61dd] dark:hover:text-[#60a5fa] transition-colors"
                >
                  <span>Creator</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3c61dd]" />
                </Link>
              </li>
              <li>
                <Link
                  href="/#outputs"
                  className="text-[#667085] dark:text-muted-foreground hover:text-[#101828] dark:hover:text-foreground transition-colors"
                >
                  Creator Tools
                </Link>
              </li>
              <li>
                <Link
                  href="/#how-it-works"
                  className="text-[#667085] dark:text-muted-foreground hover:text-[#101828] dark:hover:text-foreground transition-colors"
                >
                  How it works
                </Link>
              </li>
              <li>
                <Link
                  href="/#outputs"
                  className="text-[#667085] dark:text-muted-foreground hover:text-[#101828] dark:hover:text-foreground transition-colors"
                >
                  What you get
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="text-[#667085] dark:text-muted-foreground hover:text-[#101828] dark:hover:text-foreground transition-colors"
                >
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* COLUMN 3: RESOURCES (Col-span 2) (Figma 57381:10934) */}
          <div className="md:col-span-2 space-y-4">
            <h3 className="text-[12px] font-semibold text-[#101828] dark:text-foreground uppercase tracking-wider font-mono">
              RESOURCES
            </h3>
            <ul className="space-y-2.5 text-[14px] font-sans">
              <li>
                <Link
                  href="/#faq"
                  className="text-[#667085] dark:text-muted-foreground hover:text-[#101828] dark:hover:text-foreground transition-colors"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/guides"
                  className="text-[#667085] dark:text-muted-foreground hover:text-[#101828] dark:hover:text-foreground transition-colors"
                >
                  Guides
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-[#667085] dark:text-muted-foreground hover:text-[#101828] dark:hover:text-foreground transition-colors"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* COLUMN 4: MBC NETWORK (Col-span 2) (Figma 57381:10944) */}
          <div className="md:col-span-2 space-y-4">
            <h3 className="text-[12px] font-semibold text-[#101828] dark:text-foreground uppercase tracking-wider font-mono">
              MBC NETWORK
            </h3>
            <ul className="space-y-3 text-[14px] font-sans">
              <li>
                <div className="inline-flex items-center gap-2 text-[#667085]/70 dark:text-muted-foreground/70">
                  <span>Entrepreneur</span>
                  <span className="px-1.5 py-0.5 rounded-[4px] bg-[#e3e8f2]/60 dark:bg-muted text-[10px] font-medium text-[#667085] dark:text-muted-foreground font-sans">
                    Coming soon
                  </span>
                </div>
              </li>
              <li>
                <div className="inline-flex items-center gap-2 text-[#667085]/70 dark:text-muted-foreground/70">
                  <span>Investor</span>
                  <span className="px-1.5 py-0.5 rounded-[4px] bg-[#e3e8f2]/60 dark:bg-muted text-[10px] font-medium text-[#667085] dark:text-muted-foreground font-sans">
                    Coming soon
                  </span>
                </div>
              </li>
              <li>
                <div className="inline-flex items-center gap-2 text-[#667085]/70 dark:text-muted-foreground/70">
                  <span className="leading-tight">Service Provider</span>
                  <span className="px-1.5 py-0.5 rounded-[4px] bg-[#e3e8f2]/60 dark:bg-muted text-[10px] font-medium text-[#667085] dark:text-muted-foreground font-sans">
                    Coming soon
                  </span>
                </div>
              </li>
            </ul>
          </div>

          {/* COLUMN 5: LEGAL (Col-span 2) (Figma 57381:10964) */}
          <div className="md:col-span-2 space-y-4">
            <h3 className="text-[12px] font-semibold text-[#101828] dark:text-foreground uppercase tracking-wider font-mono">
              LEGAL
            </h3>
            <ul className="space-y-2.5 text-[14px] font-sans">
              <li>
                <Link
                  href="/terms"
                  className="text-[#667085] dark:text-muted-foreground hover:text-[#101828] dark:hover:text-foreground transition-colors"
                >
                  Terms of Use
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-[#667085] dark:text-muted-foreground hover:text-[#101828] dark:hover:text-foreground transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy#cookies"
                  className="text-[#667085] dark:text-muted-foreground hover:text-[#101828] dark:hover:text-foreground transition-colors"
                >
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* BOTTOM BAR (Figma 57381:10974) */}
        {/* ========================================================================= */}
        <div className="border-t border-[#e3e8f2] dark:border-border/80 pt-8 mt-14 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-sans text-[#667085] dark:text-muted-foreground">
          {/* Copyright */}
          <div>
            © 2026 Mondial Business Création. All rights reserved.
          </div>

          {/* Tagline & Location */}
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <span className="flex items-center gap-1.5 font-medium text-[#101828]/80 dark:text-foreground">
              <span className="w-2 h-2 rounded-full bg-[#10b981]" />
              Made for the next generation of founders.
            </span>
            <span className="text-[#e3e8f2] dark:text-slate-700">|</span>
            <span>Paris, France</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
