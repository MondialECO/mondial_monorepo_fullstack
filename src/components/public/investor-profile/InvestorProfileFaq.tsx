'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function InvestorProfileFaq() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      num: '01.',
      question: 'Why does Mondial verify Investors?',
      answer:
        'To establish undeniable identity and essential financial context before engaging in deep workflows, ensuring a high-trust environment for all participants.',
    },
    {
      num: '02.',
      question: 'Does identity verification prove investment capacity?',
      answer:
        'No. Identity verification and financial capacity represent different trust layers within the platform infrastructure. Both are necessary but serve distinct structural purposes.',
    },
    {
      num: '03.',
      question: 'What is an Investment Thesis?',
      answer:
        'It is the structured framework that filters opportunities based on defined parameters: target sectors, development stages, geographical focus, typical ticket size, and structural preferences.',
    },
    {
      num: '04.',
      question: 'Why does ticket size matter?',
      answer:
        "Defining typical deployment ranges accurately aligns funding needs with the investor's structural reality, optimizing the matching algorithm for relevant velocity.",
    },
    {
      num: '05.',
      question: 'Can I invest outside my thesis?',
      answer:
        'Yes. The thesis exists to structure and guide automated discovery; it is a powerful utility, not a permanent legal restriction on your ultimate deployment decisions.',
    },
    {
      num: '06.',
      question: 'What investment structures can be represented?',
      answer:
        'The platform natively supports structural parameters for Equity, SAFE, Convertible Note, Debt, Revenue Share, and customized hybrid instruments.',
    },
    {
      num: '07.',
      question: 'Does a matched company mean Mondial recommends the investment?',
      answer:
        'No. A match indicates high relevance based purely on the structural data criteria defined in your thesis. It is not an endorsement or financial recommendation.',
    },
    {
      num: '08.',
      question: 'Is all of my financial verification information public?',
      answer:
        'No. Sensitive capacity and verification data remains entirely private within the platform infrastructure. Only the derived validation status is selectively exposed.',
    },
    {
      num: '09.',
      question: 'What happens next?',
      answer:
        'Once your foundation is established, you transition into the Discover & Match phase to test your thesis against live market opportunities.',
    },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1000px] flex flex-col gap-12">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <span className="text-[12px] font-bold text-[#747685] uppercase tracking-wider">
            ABOUT INVESTOR PROFILES &amp; THESIS
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            What Investors should understand before discovery begins.
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
