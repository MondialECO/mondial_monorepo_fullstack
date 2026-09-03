'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function ProviderEarningsFaq() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      num: '01.',
      question: 'When do earnings become available?',
      answer:
        'Conditions apply based on project approval, escrow-release and successful payment processing.',
    },
    {
      num: '02.',
      question: 'Does Mondial charge a Provider commission?',
      answer:
        'Yes, commission levels vary by tier structure to align platform incentives with provider success.',
    },
    {
      num: '03.',
      question: 'What payout methods are supported?',
      answer:
        'We support Stripe Connect, Wise, standard bank transfers (SWIFT/SEPA), and PayPal globally.',
    },
    {
      num: '04.',
      question: 'Is there a minimum payout?',
      answer: 'Yes, the minimum threshold for processing a payout is $50 USD.',
    },
    {
      num: '05.',
      question: 'Does Mondial generate invoices?',
      answer:
        'Yes, the platform automatically generates downloadable records for your tax and VAT compliance needs.',
    },
    {
      num: '06.',
      question: 'Does Mondial handle all of my taxes?',
      answer:
        'No, Providers remain fully responsible for their own local tax obligations and reporting.',
    },
    {
      num: '07.',
      question: 'How does a review affect my profile?',
      answer:
        'Client feedback directly contributes to your public reputation and overall Mondial Score algorithm.',
    },
    {
      num: '08.',
      question: 'What is a Loyalty Client?',
      answer:
        'Repeat client relationships become eligible for loyalty status, which may unlock specialized offers.',
    },
    {
      num: '09.',
      question: 'What does Analytics help me understand?',
      answer:
        'It tracks service performance, search visibility, earnings trajectory, reputation metrics, and client behavior.',
    },
    {
      num: '10.',
      question: 'Does reaching Tier 4 guarantee more work?',
      answer:
        'No, while status and platform visibility significantly improve, steady income is never guaranteed.',
    },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1000px] flex flex-col gap-12">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <span className="text-[12px] font-bold text-[#747685] uppercase tracking-wider">
            ABOUT EARNINGS &amp; GROWTH
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            What Providers should understand as they grow.
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
