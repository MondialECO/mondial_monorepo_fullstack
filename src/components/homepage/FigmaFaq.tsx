'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/providers/LanguageProvider';

export default function FigmaFaq() {
  const { t } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(0); // Question 1 open by default per Figma

  const faqs = [
    { q: t('homepage.faq.q1'), a: t('homepage.faq.a1') },
    { q: t('homepage.faq.q2'), a: t('homepage.faq.a2') },
    { q: t('homepage.faq.q3'), a: t('homepage.faq.a3') },
    { q: t('homepage.faq.q4'), a: t('homepage.faq.a4') },
    { q: t('homepage.faq.q5'), a: t('homepage.faq.a5') },
    { q: t('homepage.faq.q6'), a: t('homepage.faq.a6') },
    { q: t('homepage.faq.q7'), a: t('homepage.faq.a7') },
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
              <span>{t('homepage.faq.eyebrow')}</span>
            </div>

            {/* Headline (Figma 57354:15790 - Inter 600 54px lh:60) */}
            <h2 className="text-3xl sm:text-4xl lg:text-[54px] font-semibold text-[#121826] dark:text-foreground tracking-tight leading-[1.1] font-heading">
              {t('homepage.faq.headline')}
            </h2>

            {/* Subline (Figma 57354:15792 - DM Sans 400 19px) */}
            <p className="text-lg sm:text-[19px] text-[#667085] dark:text-muted-foreground leading-relaxed font-sans font-normal pt-2">
              {t('homepage.faq.subline')}
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
