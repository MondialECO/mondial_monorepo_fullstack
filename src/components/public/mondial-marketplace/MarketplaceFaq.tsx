'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function MarketplaceFaq() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      num: '01.',
      question: 'What can I discover in the Mondial Marketplace?',
      answer:
        'The Marketplace can surface structured Creator projects, Entrepreneur company and funding opportunities, Service Provider services and relevant ecosystem profiles.',
    },
    {
      num: '02.',
      question: 'Is the Marketplace only for buying projects?',
      answer:
        'No. Project acquisition is one possible Creator pathway. The Marketplace also supports co-founder discovery, professional-service discovery, company and funding opportunity discovery, and relevant profile connections.',
    },
    {
      num: '03.',
      question: 'What Creator offers are available in the current MVP?',
      answer:
        'The current Creator Marketplace MVP supports Full Buyout and Co-founder / Equity opportunities.',
    },
    {
      num: '04.',
      question: 'Does Full Buyout mean licensing?',
      answer:
        'No. Full Buyout represents an acquisition and ownership-transfer pathway, subject to the applicable agreement.',
    },
    {
      num: '05.',
      question: 'Can I find Service Providers through the Marketplace?',
      answer:
        'Yes. Providers can publish structured services, while relevant professional needs can also generate matching opportunities across the ecosystem.',
    },
    {
      num: '06.',
      question: 'Can Investors find companies here?',
      answer:
        'Yes. Relevant company and funding context can support Investor discovery, with deeper review moving into the dedicated Investor access and diligence journey.',
    },
    {
      num: '07.',
      question: 'Does a match mean the other person must connect with me?',
      answer:
        'No. Matching indicates potential relevance. The appropriate parties still decide whether to continue.',
    },
    {
      num: '08.',
      question: 'Can everyone see every project or company document?',
      answer:
        'No. Public discovery and controlled information access are separate. Sensitive information can require permission, confidentiality steps or another appropriate access process.',
    },
    {
      num: '09.',
      question: 'Is Marketplace the same as Messenger?',
      answer:
        'No. Marketplace supports discovery. Messenger supports communication and related actions once an appropriate relationship begins.',
    },
    {
      num: '10.',
      question: 'What happens after I find something relevant?',
      answer:
        'Mondial routes the connection into the appropriate project, provider, entrepreneur or investor workflow rather than treating discovery as the final outcome.',
    },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1000px] flex flex-col gap-12">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <span className="text-[12px] font-bold text-[#747685] uppercase tracking-wider">
            ABOUT THE MARKETPLACE
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            What the ecosystem should understand before connecting.
          </h2>
        </div>

        {/* Accordion List (10 Items) */}
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
