import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer
      className="relative w-full overflow-hidden border-t border-[#e3e8f2] bg-[#f7f9fc] text-[#101828] dark:border-border/80 dark:bg-[#070b14] dark:text-foreground"
      data-testid="public-footer"
    >
      <div className="pointer-events-none absolute right-[-80px] top-[-70px] h-[340px] w-[340px] rounded-full border border-[#3c61dd]/10" />
      <div className="pointer-events-none absolute right-[40px] top-[40px] h-[180px] w-[180px] rounded-full border border-dashed border-[#3c61dd]/15" />

      <div className="relative z-10 mx-auto w-full max-w-[1340px] px-5 pb-10 pt-16 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <Link href="/" className="inline-flex items-center gap-3">
              <Image src="/images/mbc-logo.png" alt="MBC Logo" width={95} height={46} className="h-[46px] w-[95px] object-contain" />
              <div>
                <div className="font-heading text-[18px] font-semibold">MBC</div>
                <div className="mt-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#667085]">
                  Mondial Business Creation
                </div>
              </div>
            </Link>
            <h2 className="mt-6 max-w-[520px] font-heading text-[24px] font-semibold tracking-tight text-[#101828] dark:text-white">
              The intelligent toolbox for creators building real projects.
            </h2>
            <p className="mt-3 max-w-[520px] text-[13px] leading-6 text-[#667085] dark:text-muted-foreground">
              One Creator Profile, one dashboard and connected generators for your business plan, finances, brand, digital CV, website, roadmap and more.
            </p>
          </div>

          <div className="md:col-span-2">
            <h3 className="font-mono text-[11px] font-semibold uppercase tracking-wider">Product</h3>
            <ul className="mt-4 space-y-3 text-[14px] text-[#667085]">
              <li><Link href="/#generators" className="hover:text-[#3c61dd]">Generators</Link></li>
              <li><Link href="/#dashboard" className="hover:text-[#3c61dd]">Dashboard</Link></li>
              <li><Link href="/#how-it-works" className="hover:text-[#3c61dd]">How it works</Link></li>
              <li><Link href="/#all-tools" className="hover:text-[#3c61dd]">Full toolbox</Link></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h3 className="font-mono text-[11px] font-semibold uppercase tracking-wider">Account</h3>
            <ul className="mt-4 space-y-3 text-[14px] text-[#667085]">
              <li><Link href="/signup" className="hover:text-[#3c61dd]">Create Creator Profile</Link></li>
              <li><Link href="/login" className="hover:text-[#3c61dd]">Sign in</Link></li>
              <li><Link href="/pricing" className="hover:text-[#3c61dd]">Pricing</Link></li>
              <li><Link href="/contact" className="hover:text-[#3c61dd]">Contact</Link></li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <h3 className="font-mono text-[11px] font-semibold uppercase tracking-wider">MBC Network</h3>
            <div className="mt-4 space-y-3 text-[14px] text-[#667085]">
              {['Entrepreneur', 'Investor', 'Service Provider'].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <span>{item}</span>
                  <span className="rounded bg-[#e8ecf4] px-1.5 py-0.5 text-[9px] font-medium">Coming soon</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-[#e3e8f2] pt-7 text-[12px] text-[#667085] sm:flex-row sm:items-center sm:justify-between">
          <div>© 2026 Mondial Business Création. All rights reserved.</div>
          <div className="flex flex-wrap gap-4">
            <Link href="/terms" className="hover:text-[#3c61dd]">Terms</Link>
            <Link href="/privacy" className="hover:text-[#3c61dd]">Privacy</Link>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#10b981]" />
              Built for the next generation of creators.
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
