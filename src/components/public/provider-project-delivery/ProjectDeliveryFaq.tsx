'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function ProjectDeliveryFaq() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      num: '01.',
      question: 'How is project scope defined and agreed upon?',
      answer:
        'Scope is documented in detail during the PROPOSE and ALIGN phases. Both parties must digitally sign off on the final Statement of Work before the project moves to SECURE.',
    },
    {
      num: '02.',
      question: 'What happens if the client requests changes after agreement?',
      answer:
        'Scope changes require a formal Change Order, which is negotiated and agreed upon. This may adjust timeline and pricing, and must be approved before work on new scope begins.',
    },
    {
      num: '03.',
      question: 'How does the escrow system protect my earnings?',
      answer:
        'Funds are deposited by the client into a secure escrow account during the SECURE phase. They are released upon milestone completion and client approval.',
    },
    {
      num: '04.',
      question: 'Can I set milestone-based payments instead of lump sum?',
      answer:
        'Yes. Complex projects often utilize milestone-based delivery, where specific deliverables trigger partial payment releases from escrow.',
    },
    {
      num: '05.',
      question: 'What is the standard timeline for client review?',
      answer:
        'Clients typically have 5 business days to review submitted work. If no action is taken, the milestone may auto-approve depending on contract terms.',
    },
    {
      num: '06.',
      question: 'How are disputes handled if the client rejects the work?',
      answer:
        'If a revision request cannot be resolved, Mondial Flex offers a structured mediation process to ensure fair assessment against the original agreed scope.',
    },
    {
      num: '07.',
      question: 'Are platform fees deducted before or after escrow release?',
      answer:
        'Platform fees are automatically deducted at the time of funds release from escrow, before the final payout reaches your account.',
    },
    {
      num: '08.',
      question: 'Can I use external tools for project management?',
      answer:
        'While delivery can happen anywhere, all formal communication, milestone submissions, and approvals must occur on-platform for protection.',
    },
    {
      num: '09.',
      question: 'What happens if a project is cancelled mid-delivery?',
      answer:
        'Cancellation policies are defined in the agreement. Typically, providers are compensated for milestones completed and approved up to the cancellation date.',
    },
    {
      num: '10.',
      question: 'How does completion impact my Mondial Score?',
      answer:
        'Successfully completed projects, adherence to timelines, and positive client reviews directly contribute to improving your Tier Status and visibility.',
    },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1000px] flex flex-col gap-12">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <span className="text-[12px] font-bold text-[#747685] uppercase tracking-wider">
            ABOUT PROJECTS &amp; DELIVERY
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            What Providers should know before work begins.
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
