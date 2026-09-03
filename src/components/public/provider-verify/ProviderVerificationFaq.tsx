'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function ProviderVerificationFaq() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      num: '01.',
      question: 'What does the verification process entail?',
      answer:
        "Mondial's verification process is designed to establish a solid trust foundation. It involves confirming your identity, reviewing professional credentials, and validating past work evidence. This multi-step approach ensures that all providers on the platform meet our institutional standards before connecting with opportunities.",
    },
    {
      num: '02.',
      question: 'How long does verification take?',
      answer:
        'Typically, the initial automated identity checks are completed within 24 hours. Manual review of complex professional credentials or portfolios may take 2–3 business days. We prioritize thoroughness to maintain the high-trust environment our clients expect.',
    },
    {
      num: '03.',
      question: 'Is my data secure during this process?',
      answer:
        'Yes. We employ enterprise-grade encryption for all document submissions and data storage. Verification data is handled in strict compliance with international privacy regulations and is only accessible to authorized compliance personnel.',
    },
    {
      num: '04.',
      question: 'What happens if verification fails?',
      answer:
        'If a verification step cannot be completed, you will receive a detailed notification explaining the missing or invalid information. You will have the opportunity to provide additional documentation or clarify details to complete the process successfully.',
    },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1000px] flex flex-col gap-12">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <span className="text-[12px] font-bold text-[#747685] uppercase tracking-wider">
            ABOUT PROVIDER VERIFICATION
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            What professionals should understand first.
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
