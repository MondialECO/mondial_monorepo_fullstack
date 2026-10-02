'use client';

import React, { useState } from 'react';

export default function FigmaFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0); // Question 1 open by default per Figma

  const faqs = [
    {
      q: 'Can I really start with MBC for €0?',
      a: 'Yes. The Creator profile is free to start. You can access the guided Creator experience without a subscription. AI usage limits can apply.'
    },
    {
      q: 'Does €0 mean every external business cost is free?',
      a: 'Starting on MBC is €0. However, third-party administrative or government costs (such as official commercial court registry filing fees with INPI / Guichet Unique in France, or legal notice publication fees) and optional third-party professional services are set by their respective institutions.'
    },
    {
      q: 'What happens when I reach my AI usage limit?',
      a: 'You can continue browsing, editing, and downloading all of your existing project files without any restriction. If you need to generate additional high-volume AI iterations or market deep-dives, you can purchase modular credit top-ups or upgrade your plan at any time.'
    },
    {
      q: 'Can I download what I create?',
      a: 'Yes. All generated assets—including your Brand Kit SVG icons, CSS token files, 12-chapter Executive Business Plan (PDF/HTML), Financial Forecast worksheets, and one-page website code—can be exported directly to your local device.'
    },
    {
      q: 'Will MBC register my company for me?',
      a: 'MBC automates the full preparation of your formation dossier (statutes, share capital deposit certificate instructions, declaration of non-conviction, NAF/APE activity selection). You can submit the dossier yourself via the official Guichet Unique portal or connect with a partner professional in our network to file on your behalf.'
    },
    {
      q: 'What happens to my project information?',
      a: 'Your ideas, venture information, and intellectual property belong 100% to you. We strictly encrypt all stored project data and will never share, sell, or train public models on your proprietary business details.'
    },
    {
      q: 'What is the future MBC network?',
      a: 'Beyond the Creator onboarding phase, MBC will connect your structured venture directly to Verified Entrepreneurs, Angel & Venture Capital Investors, and vetted Service Providers to help fund, operate, and scale your company.'
    }
  ];

  const toggleFaq = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="w-full py-20 md:py-28 bg-white dark:bg-background border-b border-[#e8ecf2] dark:border-border">
      <div className="w-full max-w-[1440px] xl:max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
        
        {/* 2-Column Split Layout (Figma 57354:15784 - 1180px wide) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Left Column (5 cols / 450px) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Eyebrow Badge (Figma 57381:10483 - 66x33px) */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#e8eeff] text-[#1f3faf] text-xs font-bold uppercase tracking-wider font-mono shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3c61dd] shrink-0" />
              <span>FAQ</span>
            </div>

            {/* Headline (Figma 57354:15790 - Inter 600 54px lh:60) */}
            <h2 className="text-3xl sm:text-4xl lg:text-[54px] font-semibold text-[#121826] dark:text-foreground tracking-tight leading-[1.1] font-heading">
              What “start for<br className="hidden sm:inline" /> €0” really means.
            </h2>

            {/* Subline (Figma 57354:15792 - DM Sans 400 19px) */}
            <p className="text-lg sm:text-[19px] text-[#667085] dark:text-muted-foreground leading-relaxed font-sans font-normal pt-2">
              Keep the promise simple, but be clear about what is free inside MBC and what may cost money outside the platform.
            </p>
          </div>

          {/* Right Column: 7 Accordion Items (7 cols / 674px) */}
          <div className="lg:col-span-7 divide-y divide-[#e6eaf2] dark:divide-border/60">
            {faqs.map((faq, idx) => {
              const isOpen = openIndex === idx;

              return (
                <div key={idx} className="py-4.5">
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full text-left flex items-center justify-between gap-4 cursor-pointer py-2 group"
                    aria-expanded={isOpen}
                  >
                    <span className="text-base sm:text-[17px] font-semibold text-[#121826] dark:text-foreground group-hover:text-[#3c61dd] transition-colors font-heading leading-snug">
                      {faq.q}
                    </span>

                    <span className="text-2xl font-semibold text-[#3c61dd] shrink-0 pl-2">
                      {isOpen ? '–' : '+'}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="pt-2 pb-4 text-base sm:text-[16.5px] text-[#667085] dark:text-muted-foreground leading-relaxed animate-fadeIn font-sans">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
}
