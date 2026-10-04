'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'Is exporting my files free?',
    answer: 'Yes. Downloading your documents and brand kit is always free.',
  },
  {
    question: 'Do I need a subscription?',
    answer: 'No. MBC operates on a transparent pay-as-you-go credit model. You only buy packs when you need extra revisions or additional business plans, with zero recurring charges.',
  },
  {
    question: 'What happens if I run out of credits?',
    answer: 'You can top up instantly starting from €4.90. All your existing generated assets, models, and outputs remain permanently saved and editable.',
  },
  {
    question: 'How many credits do I get for free?',
    answer: 'Every new creator receives 200 free credits upon sign-up—more than enough to complete a full 138-credit journey from raw idea to an investor-ready business plan.',
  },
];

export default function FigmaPricingView() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="w-full bg-[#F4F5F7] dark:bg-background text-[#172033] dark:text-foreground py-16 sm:py-20 md:py-24">
      <div className="w-full max-w-[1280px] xl:max-w-[1360px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 flex flex-col space-y-16 md:space-y-20">

        {/* ========================================================================= */}
        {/* SECTION 1: HERO (Figma 57424:112) */}
        {/* ========================================================================= */}
        <div className="flex flex-col items-center text-center space-y-6 pt-2">
          
          {/* Eyebrow Badge (Figma 57424:114) */}
          <div className="inline-flex items-center justify-center px-3.5 py-1 rounded-full bg-[#E9EBEF] dark:bg-muted text-[#596273] dark:text-muted-foreground text-[12px] font-medium font-sans">
            Pricing
          </div>

          {/* Heading 1 (Figma 57424:118 - 54px semibold lh:60px) */}
          <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-semibold text-[#172033] dark:text-white tracking-tight leading-[1.1] font-heading max-w-[640px]">
            Create your digital<br />
            company for €0.
          </h1>

          {/* Subline (Figma 57424:121 - 18px normal lh:29px) */}
          <p className="text-base sm:text-lg text-[#596273] dark:text-muted-foreground font-sans font-normal max-w-[460px] leading-relaxed">
            Start with 200 free credits. Buy more only<br className="hidden sm:inline" />
            when you need them. No subscription.
          </p>

          {/* Primary CTA (Figma 57424:122) */}
          <div className="pt-2">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-[#3C61DD] hover:bg-[#3252be] text-white text-[16px] font-medium font-sans transition-all shadow-sm active:scale-[0.98]"
            >
              Start free
            </Link>
          </div>

          {/* Micro-copy note (Figma 57424:126) */}
          <p className="text-[14px] text-[#596273] dark:text-muted-foreground font-sans pt-1">
            Your first business idea is covered by your free credits.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 2: FREE STARTER STRIP (Figma 57424:127) */}
        {/* ========================================================================= */}
        <div className="bg-white dark:bg-card border border-[#E5E7EB] dark:border-border rounded-[16px] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
          <div className="flex items-baseline gap-3.5">
            <span className="text-4xl sm:text-[48px] font-semibold text-[#172033] dark:text-white leading-none font-heading">
              200
            </span>
            <span className="text-[14px] text-[#596273] dark:text-muted-foreground font-sans font-normal">
              free credits when you join
            </span>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-[14px] text-[#596273] dark:text-muted-foreground font-sans">
              Enough to take your first idea from clarifier to investor-ready plan.
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#E8F5EE] dark:bg-emerald-950/60 text-[#157A55] dark:text-emerald-400 text-[12px] font-semibold font-sans shrink-0">
              Free
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 3: CREDIT PACKS (Figma 57424:136) */}
        {/* ========================================================================= */}
        <div className="space-y-6">
          <h2 className="text-2xl sm:text-[28px] font-semibold text-[#172033] dark:text-white font-heading">
            Need more credits? Pick a pack.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1: Starter top-up */}
            <div className="bg-white dark:bg-card border border-[#E5E7EB] dark:border-border rounded-[16px] p-8 flex flex-col justify-between space-y-7 shadow-sm hover:border-[#3C61DD]/40 transition-colors">
              <div className="space-y-4">
                <h3 className="text-[16px] font-semibold text-[#172033] dark:text-white font-heading">
                  Starter top-up
                </h3>

                <div className="flex items-baseline gap-2 pt-1">
                  <span className="text-[36px] font-semibold text-[#172033] dark:text-white font-heading leading-none">
                    100
                  </span>
                  <span className="text-[16px] text-[#596273] dark:text-muted-foreground font-sans">
                    credits
                  </span>
                </div>

                <div className="space-y-0.5">
                  <div className="text-[24px] font-semibold text-[#172033] dark:text-white font-heading">
                    €4.90
                  </div>
                  <div className="text-[12px] text-[#596273] dark:text-muted-foreground font-sans">
                    €0.049 per credit
                  </div>
                </div>

                <p className="text-[14px] text-[#596273] dark:text-muted-foreground font-sans pt-3">
                  Finish a phase or a few revisions
                </p>
              </div>

              <Link
                href="/signup?pack=starter"
                className="w-full text-center py-2.5 px-4 rounded-full border border-[#E5E7EB] dark:border-border text-[14px] font-medium text-[#172033] dark:text-white hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors font-sans block"
              >
                Get started
              </Link>
            </div>

            {/* Card 2: Main pack (Recommended / Most popular) */}
            <div className="relative bg-white dark:bg-card border border-[#E5E7EB] dark:border-border rounded-[16px] p-8 flex flex-col justify-between space-y-7 shadow-sm hover:border-[#3C61DD]/60 transition-colors ring-1 ring-[#3C61DD]/20">
              <div className="space-y-4">
                
                {/* Most Popular Badge */}
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#E8EEFF] dark:bg-blue-950/70 text-[#3C61DD] dark:text-blue-300 text-[12px] font-medium font-sans self-start">
                  Most popular
                </div>

                <h3 className="text-[16px] font-semibold text-[#172033] dark:text-white font-heading">
                  Main pack
                </h3>

                <div className="flex items-baseline gap-2 pt-1">
                  <span className="text-[36px] font-semibold text-[#172033] dark:text-white font-heading leading-none">
                    250
                  </span>
                  <span className="text-[16px] text-[#596273] dark:text-muted-foreground font-sans">
                    credits
                  </span>
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[24px] font-semibold text-[#172033] dark:text-white font-heading">
                      €9.90
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#E8F5EE] dark:bg-emerald-950/60 text-[#157A55] dark:text-emerald-400 text-[12px] font-semibold font-sans">
                      Save 19%
                    </span>
                  </div>
                  <div className="text-[12px] text-[#596273] dark:text-muted-foreground font-sans">
                    €0.040 per credit
                  </div>
                </div>

                <p className="text-[14px] text-[#596273] dark:text-muted-foreground font-sans pt-3">
                  About 1.8 full business journeys
                </p>
              </div>

              <Link
                href="/signup?pack=main"
                className="w-full text-center py-2.5 px-4 rounded-full border border-[#E5E7EB] dark:border-border text-[14px] font-medium text-[#172033] dark:text-white hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors font-sans block"
              >
                Get started
              </Link>
            </div>

            {/* Card 3: Heavy use */}
            <div className="bg-white dark:bg-card border border-[#E5E7EB] dark:border-border rounded-[16px] p-8 flex flex-col justify-between space-y-7 shadow-sm hover:border-[#3C61DD]/40 transition-colors">
              <div className="space-y-4">
                <h3 className="text-[16px] font-semibold text-[#172033] dark:text-white font-heading">
                  Heavy use
                </h3>

                <div className="flex items-baseline gap-2 pt-1">
                  <span className="text-[36px] font-semibold text-[#172033] dark:text-white font-heading leading-none">
                    500
                  </span>
                  <span className="text-[16px] text-[#596273] dark:text-muted-foreground font-sans">
                    credits
                  </span>
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[24px] font-semibold text-[#172033] dark:text-white font-heading">
                      €16.90
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#E8F5EE] dark:bg-emerald-950/60 text-[#157A55] dark:text-emerald-400 text-[12px] font-semibold font-sans">
                      Save 31%
                    </span>
                  </div>
                  <div className="text-[12px] text-[#596273] dark:text-muted-foreground font-sans">
                    €0.034 per credit
                  </div>
                </div>

                <p className="text-[14px] text-[#596273] dark:text-muted-foreground font-sans pt-3">
                  About 3.6 full business journeys, great for testing several ideas
                </p>
              </div>

              <Link
                href="/signup?pack=heavy"
                className="w-full text-center py-2.5 px-4 rounded-full border border-[#E5E7EB] dark:border-border text-[14px] font-medium text-[#172033] dark:text-white hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors font-sans block"
              >
                Get started
              </Link>
            </div>

          </div>

          <p className="text-center text-[12px] text-[#596273] dark:text-muted-foreground font-sans pt-2">
            One-time payment. Secure checkout by Stripe.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 4: WHAT DO CREDITS DO (Figma 57424:196) */}
        {/* ========================================================================= */}
        <div className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-[28px] font-semibold text-[#172033] dark:text-white font-heading">
              What do credits do?
            </h2>
            <p className="text-[14px] text-[#596273] dark:text-muted-foreground font-sans">
              Every AI step uses credits. You always see the cost before you click.
            </p>
          </div>

          {/* Credits Table Box */}
          <div className="bg-white dark:bg-card border border-[#E5E7EB] dark:border-border rounded-[16px] overflow-hidden shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#F0F2F5] dark:divide-border">
              
              {/* Group 1: Brand */}
              <div className="p-6 sm:p-8 space-y-4">
                <span className="text-[12px] font-semibold text-[#172033] dark:text-foreground tracking-wider uppercase font-mono block">
                  BRAND
                </span>

                <ul className="divide-y divide-[#F0F2F5] dark:divide-border text-[14px] font-sans">
                  <li className="py-3 flex items-center justify-between text-[#172033] dark:text-foreground">
                    <span>Brand direction</span>
                    <span className="text-[#596273] dark:text-muted-foreground">7 credits</span>
                  </li>
                  <li className="py-3 flex items-center justify-between text-[#172033] dark:text-foreground">
                    <span>Logo</span>
                    <span className="text-[#596273] dark:text-muted-foreground">4 credits</span>
                  </li>
                  <li className="py-3 flex items-center justify-between text-[#172033] dark:text-foreground">
                    <span>Colour palette</span>
                    <span className="text-[#596273] dark:text-muted-foreground">2 credits</span>
                  </li>
                  <li className="py-3 flex items-center justify-between text-[#172033] dark:text-foreground">
                    <span>Typography</span>
                    <span className="text-[#596273] dark:text-muted-foreground">2 credits</span>
                  </li>
                </ul>
              </div>

              {/* Group 2: Business */}
              <div className="p-6 sm:p-8 space-y-4">
                <span className="text-[12px] font-semibold text-[#172033] dark:text-foreground tracking-wider uppercase font-mono block">
                  BUSINESS
                </span>

                <ul className="divide-y divide-[#F0F2F5] dark:divide-border text-[14px] font-sans">
                  <li className="py-3 flex items-center justify-between text-[#172033] dark:text-foreground">
                    <span>Clarifier</span>
                    <span className="text-[#596273] dark:text-muted-foreground">20 credits</span>
                  </li>
                  <li className="py-3 flex items-center justify-between text-[#172033] dark:text-foreground">
                    <span>Market study</span>
                    <span className="text-[#596273] dark:text-muted-foreground">20 credits</span>
                  </li>
                  <li className="py-3 flex items-center justify-between text-[#172033] dark:text-foreground">
                    <span>Business model</span>
                    <span className="text-[#596273] dark:text-muted-foreground">18 credits</span>
                  </li>
                  <li className="py-3 flex items-center justify-between text-[#172033] dark:text-foreground">
                    <span>Financial forecast</span>
                    <span className="text-[#596273] dark:text-muted-foreground">32 credits</span>
                  </li>
                  <li className="py-3 flex items-center justify-between text-[#172033] dark:text-foreground">
                    <span>Business plan</span>
                    <span className="text-[#596273] dark:text-muted-foreground">33 credits</span>
                  </li>
                </ul>
              </div>

            </div>

            {/* Total Footer Row */}
            <div className="bg-[#F9F9FA] dark:bg-muted/40 border-t border-[#F0F2F5] dark:border-border px-6 sm:px-8 py-4 flex items-center justify-between font-sans">
              <span className="text-[15px] sm:text-[16px] font-medium text-[#172033] dark:text-white">
                A full journey, start to finish
              </span>
              <span className="text-[15px] sm:text-[16px] font-semibold text-[#172033] dark:text-white">
                138 credits
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 5: GOOD TO KNOW (FAQ Accordion - Figma 57424:261) */}
        {/* ========================================================================= */}
        <div className="space-y-6">
          <h2 className="text-2xl sm:text-[28px] font-semibold text-[#172033] dark:text-white font-heading">
            Good to know
          </h2>

          <div className="bg-white dark:bg-card border border-[#E5E7EB] dark:border-border rounded-[16px] divide-y divide-[#F0F2F5] dark:divide-border overflow-hidden shadow-sm">
            {FAQ_ITEMS.map((item, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={index} className="transition-colors">
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full px-6 sm:px-8 py-6 flex items-center justify-between gap-4 text-left focus:outline-none"
                    aria-expanded={isOpen}
                  >
                    <span className="text-[16px] font-medium text-[#172033] dark:text-white font-sans">
                      {item.question}
                    </span>
                    <span className="text-[#596273] dark:text-muted-foreground shrink-0">
                      {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-6 sm:px-8 pb-6 text-[14px] text-[#596273] dark:text-muted-foreground font-sans leading-relaxed animate-in fade-in duration-200">
                      {item.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 6: CLOSING BAND (Figma 57424:291) */}
        {/* ========================================================================= */}
        <div className="bg-white dark:bg-card border border-[#E5E7EB] dark:border-border rounded-[16px] p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-6 shadow-sm">
          <h2 className="text-2xl sm:text-[28px] font-semibold text-[#172033] dark:text-white font-heading">
            Ready to build your company?
          </h2>

          <Link
            href="/signup"
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-[#3C61DD] hover:bg-[#3252be] text-white text-[16px] font-medium font-sans transition-all shadow-sm active:scale-[0.98]"
          >
            Start free
          </Link>
        </div>

      </div>
    </div>
  );
}
