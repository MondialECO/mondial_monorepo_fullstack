'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';


export default function ServicesOpportunitiesFaq() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      num: '01.',
      question: 'Do I have to use Basic, Standard and Premium packages?',
      answer:
        'No. Packages are appropriate for fixed-price services, while Providers can also use hourly, retainer, milestone-based or custom-quote models where relevant.',
    },
    {
      num: '02.',
      question: 'Can I offer more than one service?',
      answer:
        'Yes. Providers can structure multiple services around different expertise, scopes or client needs.',
    },
    {
      num: '03.',
      question: 'What happens after I publish a service?',
      answer:
        'A published service can become visible through Marketplace discovery and may also become eligible for relevant ecosystem matching.',
    },
    {
      num: '04.',
      question: 'What is ecosystem matching?',
      answer:
        'Ecosystem matching connects relevant Provider services to needs that emerge within Creator, Entrepreneur or Investor journeys.',
    },
    {
      num: '05.',
      question: 'Do I need to search manually for every client?',
      answer:
        'No. Clients may discover Providers directly, while Mondial can also surface context-driven opportunities when relevant needs appear.',
    },
    {
      num: '06.',
      question: 'What is a Client Brief?',
      answer:
        'A Client Brief is a structured request describing work the client needs, which relevant Providers can review before deciding whether to respond.',
    },
    {
      num: '07.',
      question: 'Does a high match mean the client will hire me?',
      answer:
        'No. Matching indicates potential relevance. The client and Provider still decide whether the opportunity is a good fit.',
    },
    {
      num: '08.',
      question: 'What is Featured Placement?',
      answer:
        'Featured visibility can be associated with stronger Provider status and platform performance. It does not guarantee client selection.',
    },
    {
      num: '09.',
      question: 'What happens when I want to pursue an opportunity?',
      answer:
        'The next stage moves into proposal, discussion, agreement, contract, escrow and project delivery.',
    },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1000px] flex flex-col gap-12">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <span className="text-[12px] font-bold text-[#747685] uppercase tracking-wider">
            ABOUT SERVICES &amp; OPPORTUNITIES
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            What Providers usually need to know.
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
                    className={`text-[#747685] shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#3C61DD]' : ''
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
