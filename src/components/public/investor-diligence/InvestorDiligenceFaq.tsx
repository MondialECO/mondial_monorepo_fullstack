'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function InvestorDiligenceFaq() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      num: '01.',
      question: 'What is the scope of standard due diligence?',
      answer:
        'standard due diligence typically encompasses financial, legal, operational, and commercial reviews. it aims to evaluate the overall health, viability, and risk profile of the company.',
    },
    {
      num: '02.',
      question: 'How long does the diligence process usually take?',
      answer:
        'the duration varies significantly based on deal complexity, stage, and sector, ranging from a few weeks for early-stage rounds to several months for complex late-stage transactions.',
    },
    {
      num: '03.',
      question: 'What is a data room and how is it managed?',
      answer:
        'A data room is a secure, highly controlled digital repository where the company stores all necessary corporate documents, financial records, and legal files for investor review under strict confidentiality.',
    },
    {
      num: '04.',
      question: "How are critical gaps or 'red flags' handled?",
      answer:
        'Red flags are formally documented and communicated to the founders. depending on severity, they may lead to renegotiated terms, required remediation before closing, or termination of the investment process.',
    },
    {
      num: '05.',
      question: 'What constitutes definitive investment terms?',
      answer:
        'Definitive terms are outlined in legally binding documents such as the stock purchase agreement, investor rights agreements, and amended bylaws that finalize the rights and obligations of all parties.',
    },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1000px] flex flex-col gap-12">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <span className="text-[12px] font-bold text-[#747685] uppercase tracking-wider">
            ABOUT DILIGENCE &amp; INVESTING
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            What Investors should understand before a deal closes.
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
