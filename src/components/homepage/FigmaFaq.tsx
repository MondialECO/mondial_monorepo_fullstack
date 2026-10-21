'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/providers/LanguageProvider';

export default function FigmaFaq() {
  const { t } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(0); // Question 1 open by default per Figma 57554:13570

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
    <section 
      id="faq" 
      className="relative w-full overflow-hidden py-16 sm:py-20 lg:py-[92px] px-4 sm:px-6 md:px-8 lg:px-[45px] bg-white dark:bg-background border-b border-[#e8ecf2] dark:border-border"
      data-testid="figma-faq"
    >
      <div className="w-full max-w-[1350px] 2xl:max-w-[1520px] mx-auto">
        
        {/* ========================================================================= */}
        {/* 2-Column Split Layout (Figma 57554:13571 - 1180px wide) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          
          {/* --------------------------------------------------------------------- */}
          {/* Left Column (5 cols / max 450px) */}
          {/* --------------------------------------------------------------------- */}
          <div className="lg:col-span-5 space-y-4 max-w-[450px]">
            {/* Eyebrow Badge (Figma 57554:13573 - 66x33px) */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#e8eeff] dark:bg-blue-950/70 text-[#1f3faf] dark:text-blue-300 text-[12px] font-bold font-mono tracking-[1.2px] uppercase shadow-2xs self-start">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3c61dd] shrink-0" />
              <span>{t('homepage.faq.eyebrow')}</span>
            </div>

            {/* Headline (Figma 57554:13577 - Inter 600 54px lh:60px) */}
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-semibold text-[#121826] dark:text-foreground tracking-[-0.03em] leading-[1.1] font-heading">
              {t('homepage.faq.headline')}
            </h2>

            {/* Subline (Figma 57554:13579 - DM Sans 400 18px lh:26px) */}
            <p className="text-base sm:text-lg md:text-[18px] text-[#667085] dark:text-muted-foreground leading-relaxed font-sans font-normal pt-2">
              {t('homepage.faq.subline')}
            </p>
          </div>

          {/* --------------------------------------------------------------------- */}
          {/* Right Column: 7 Accordion Items (7 cols / max 674px) */}
          {/* --------------------------------------------------------------------- */}
          <div className="lg:col-span-7 divide-y divide-[#e6eaf2] dark:divide-border/60 w-full lg:max-w-[674px] lg:ml-auto">
            {faqs.map((faq, idx) => {
              const isOpen = openIndex === idx;

              return (
                <div key={idx} className="py-[18px]">
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full text-left flex items-center justify-between gap-4 cursor-pointer group"
                    aria-expanded={isOpen}
                    data-testid={`faq-toggle-${idx}`}
                  >
                    <span className="text-base sm:text-[17px] font-semibold text-[#121826] dark:text-foreground group-hover:text-[#3c61dd] transition-colors font-heading leading-snug">
                      {faq.q}
                    </span>

                    <span 
                      className="text-2xl font-semibold text-[#3c61dd] shrink-0 pl-3 select-none leading-none w-6 text-center"
                      aria-hidden="true"
                    >
                      {isOpen ? '–' : '+'}
                    </span>
                  </button>

                  {isOpen && (
                    <div 
                      className="pt-3 pb-1 text-[16px] text-[#667085] dark:text-muted-foreground leading-[1.55] font-sans animate-fadeIn"
                      data-testid={`faq-answer-${idx}`}
                    >
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
