'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function InvestorDiscoveryFaq() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      num: '01.',
      question: 'How Mondial identifies opportunities',
      answer:
        'We use a combination of structured data matching against your defined thesis parameters and contextual analysis of market signals to surface relevant opportunities.',
    },
    {
      num: '02.',
      question: 'Match recommendations',
      answer:
        'Recommendations are scored based on thesis alignment, with specific indicators showing exactly which criteria are met and which fall outside your core parameters.',
    },
    {
      num: '03.',
      question: 'Opportunity types',
      answer:
        'The platform surfaces direct equity investments, secondary opportunities, and structured debt across early to growth stages, strictly filtered by your mandate.',
    },
    {
      num: '04.',
      question: 'Partial matches',
      answer:
        'When a company meets most but not all criteria, it is flagged as a partial match with clear explanations of the variance, allowing for strategic exceptions.',
    },
    {
      num: '05.',
      question: 'Comparison',
      answer:
        'Compare key metrics, structural terms, and market positioning across multiple opportunities side-by-side within a standardized framework.',
    },
    {
      num: '06.',
      question: 'Founder context',
      answer:
        'Access verified background information, track records, and qualitative insights on founding teams prior to initiating direct contact.',
    },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1000px] flex flex-col gap-12">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <span className="text-[12px] font-bold text-[#747685] uppercase tracking-wider">
            ABOUT DISCOVERY &amp; MATCHING
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            What Investors should understand before going deeper.
          </h2>
        </div>

        {/* Accordion list */}
        <div className="flex flex-col gap-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={faq.question}
                className="rounded-[18px] border border-[#E2E1EC] bg-[#FAF8FF] overflow-hidden transition-all shadow-2xs"
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 transition-colors hover:bg-white focus:outline-none"
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
