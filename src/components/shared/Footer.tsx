import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer
      className="w-full bg-white dark:bg-[#070b14] text-[#101828] dark:text-foreground font-sans border-t border-[#e8ecf2] dark:border-border/80 transition-colors"
      data-testid="public-footer"
    >
      <div className="w-full max-w-[1440px] xl:max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 pt-16 pb-12">

        {/* ========================================================================= */}
        {/* TOP SECTION: 5-COLUMN FOOTER GRID (Figma 57381:10891) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-8 xl:gap-12">

          {/* COLUMN 1: Brand & Socials (Col-span 4) (Figma 57381:10892) */}
          <div className="md:col-span-4 space-y-5">
            {/* Brand Lockup */}
            <Link
              href="/"
              className="gap-3 group focus:outline-none focus:ring-2 focus:ring-[#3c61dd]/40 rounded-lg"
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
                <span className="font-extrabold text-[18px] tracking-tight text-[#101828] dark:text-white font-heading leading-tight">
                  MBC
                </span>
                <span className="text-[10px] font-semibold text-[#667085] dark:text-muted-foreground tracking-wider uppercase font-mono leading-none mt-0.5">
                  MONDIAL BUSINESS CREATION
                </span>
              </div>
            </Link>

            {/* Supporting Copy */}
            <div className="space-y-1 mt-6">
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
            <div className="flex items-center gap-2.5 pt-1">
              {/* LinkedIn */}
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="MBC on LinkedIn"
                className="w-9 h-9 rounded-[8px] border border-[#e3e8f2] dark:border-border/80 bg-white dark:bg-card flex items-center justify-center text-[#667085] dark:text-muted-foreground hover:text-[#3c61dd] hover:border-[#3c61dd]/40 transition-colors shadow-2xs"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.45a1.6 1.6 0 0 0-1.6 1.6 1.6 1.6 0 0 0 1.6 1.6 1.6 1.6 0 0 0 1.6-1.6c0-.89-.72-1.6-1.6-1.6Z" />
                </svg>
              </a>

              {/* Instagram */}
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="MBC on Instagram"
                className="w-9 h-9 rounded-[8px] border border-[#e3e8f2] dark:border-border/80 bg-white dark:bg-card flex items-center justify-center text-[#667085] dark:text-muted-foreground hover:text-[#3c61dd] hover:border-[#3c61dd]/40 transition-colors shadow-2xs"
              >
                <svg className="w-4 h-4 stroke-current fill-none stroke-2" viewBox="0 0 24 24">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </a>

              {/* X / Twitter */}
              <a
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="MBC on X"
                className="w-9 h-9 rounded-[8px] border border-[#e3e8f2] dark:border-border/80 bg-white dark:bg-card flex items-center justify-center text-[#667085] dark:text-muted-foreground hover:text-[#3c61dd] hover:border-[#3c61dd]/40 transition-colors shadow-2xs"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>
          </div>

          {/* COLUMN 2: PRODUCT (Col-span 2) (Figma 57381:10920) */}
          <div className="md:col-span-2 space-y-3.5">
            <h3 className="text-[12px] font-bold text-[#101828] dark:text-foreground uppercase tracking-wider font-mono">
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
                  href="#outputs"
                  className="text-[#667085] dark:text-muted-foreground hover:text-[#101828] dark:hover:text-foreground transition-colors"
                >
                  Creator Tools
                </Link>
              </li>
              <li>
                <Link
                  href="#how-it-works"
                  className="text-[#667085] dark:text-muted-foreground hover:text-[#101828] dark:hover:text-foreground transition-colors"
                >
                  How it works
                </Link>
              </li>
              <li>
                <Link
                  href="#outputs"
                  className="text-[#667085] dark:text-muted-foreground hover:text-[#101828] dark:hover:text-foreground transition-colors"
                >
                  What you get
                </Link>
              </li>
            </ul>
          </div>

          {/* COLUMN 3: RESOURCES (Col-span 2) (Figma 57381:10934) */}
          <div className="md:col-span-2 space-y-3.5">
            <h3 className="text-[12px] font-bold text-[#101828] dark:text-foreground uppercase tracking-wider font-mono">
              RESOURCES
            </h3>
            <ul className="space-y-2.5 text-[14px] font-sans">
              <li>
                <Link
                  href="#faq"
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
          <div className="md:col-span-2 space-y-3.5">
            <h3 className="text-[12px] font-bold text-[#101828] dark:text-foreground uppercase tracking-wider font-mono">
              MBC NETWORK
            </h3>
            <ul className="space-y-2.5 text-[14px] font-sans">
              <li>
                <Link
                  href="/for-entrepreneurs"
                  className="inline-flex items-center gap-2 text-[#667085] dark:text-muted-foreground hover:text-[#101828] dark:hover:text-foreground transition-colors group"
                >
                  <span>Entrepreneur</span>
                  <span className="px-1.5 py-0.5 rounded-[4px] bg-[#eef0f4] dark:bg-muted text-[10px] font-medium text-[#667085] dark:text-muted-foreground font-sans">
                    Coming soon
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  href="/for-investors"
                  className="inline-flex items-center gap-2 text-[#667085] dark:text-muted-foreground hover:text-[#101828] dark:hover:text-foreground transition-colors group"
                >
                  <span>Investor</span>
                  <span className="px-1.5 py-0.5 rounded-[4px] bg-[#eef0f4] dark:bg-muted text-[10px] font-medium text-[#667085] dark:text-muted-foreground font-sans">
                    Coming soon
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  href="/for-service-providers"
                  className="inline-flex items-center gap-2 text-[#667085] dark:text-muted-foreground hover:text-[#101828] dark:hover:text-foreground transition-colors group"
                >
                  <span className="whitespace-nowrap">Service Provider</span>
                  <span className="px-1.5 py-0.5 rounded-[4px] bg-[#eef0f4] dark:bg-muted text-[10px] font-medium text-[#667085] dark:text-muted-foreground font-sans">
                    Coming soon
                  </span>
                </Link>
              </li>
            </ul>
          </div>

          {/* COLUMN 5: LEGAL (Col-span 2) (Figma 57381:10964) */}
          <div className="md:col-span-2 space-y-3.5">
            <h3 className="text-[12px] font-bold text-[#101828] dark:text-foreground uppercase tracking-wider font-mono">
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
        <div className="border-t border-[#e8ecf2] dark:border-border/80 pt-8 mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-sans text-[#667085] dark:text-muted-foreground">
          {/* Copyright */}
          <div>
            © 2026 Mondial Business Création. All rights reserved.
          </div>

          {/* Tagline & Location */}
          <div className="flex items-center gap-2.5 flex-wrap justify-center">
            <span className="flex items-center gap-1.5 font-medium text-[#101828] dark:text-foreground">
              <span className="w-2 h-2 rounded-full bg-[#10b981]" />
              Made for the next generation of founders.
            </span>
            <span className="text-[#cbd5e1] dark:text-slate-700">|</span>
            <span>Paris, France</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
