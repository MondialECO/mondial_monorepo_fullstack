'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function InvestorPipelinePortfolioFaq() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      num: '01.',
      question: 'What is the Investor Pipeline?',
      answer:
        'The pipeline keeps active investment opportunities connected to their current stage and decision history from initial match through final outcome.',
    },
    {
      num: '02.',
      question: 'Does the Investor relationship end after funding?',
      answer:
        'No. completed investment can lead to an ongoing relationship around ownership, company updates, reporting, future decisions and appropriate investor involvement.',
    },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#F1F1F2] border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1000px] flex flex-col gap-12">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <span className="text-[12px] font-bold text-[#747685] uppercase tracking-wider">
            ABOUT PIPELINE &amp; PORTFOLIO
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            What Investors should understand after diligence.
          </h2>
        </div>

        {/* Accordion List */}
        <div className="flex flex-col gap-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={faq.question}
                className="rounded-[18px] border border-[#E2E1EC] bg-white overflow-hidden transition-all shadow-2xs"
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 transition-colors hover:bg-[#FAF8FF] focus:outline-none"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-heading font-bold text-[14px] text-[#3C61DD]">
                      {faq.num}
                    </span>
                    <span className="font-heading font-bold text-[16px] sm:text-[18px] text-[#1A1B23]">
                      {faq.question}
                    </span>
                  </div>
                  <ChevronDown
                    size={20}
                    className={`text-[#747685] shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-[#3C61DD]' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-0 text-[14px] sm:text-[15px] text-[#444654] leading-relaxed border-t border-[rgba(0,0,0,0.04)] mt-1">
                    <p className="pt-3">{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
