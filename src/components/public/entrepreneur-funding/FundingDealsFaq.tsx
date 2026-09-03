'use client';

import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

interface FaqItem {
  id: string;
  q: string;
  a: string;
}

const FAQS: FaqItem[] = [
  {
    id: '01',
    q: 'How does matching work?',
    a: "We align your company's profile, stage, and sector with the specific investment theses of our verified network to ensure high-quality, relevant introductions.",
  },
  {
    id: '02',
    q: 'Is funding guaranteed?',
    a: 'No. We provide the structural readiness, data room integrity, and network access, but the final investment decision rests solely on market forces and investor conviction.',
  },
  {
    id: '03',
    q: 'How are NDAs handled?',
    a: 'Standardized, platform-integrated Non-Disclosure Agreements are executed digitally before granular Data Room access is granted to any prospective investor.',
  },
  {
    id: '04',
    q: 'What goes in the Data Room?',
    a: 'Historical financials, cap table, corporate governance docs, material contracts, IP assignments, and detailed strategic plans, all organized per institutional standards.',
  },
  {
    id: '05',
    q: 'What is the required commitment?',
    a: 'Founders must be prepared to dedicate significant time to investor Q&A, management presentations, and rapid response to diligence inquiries over a 3–6 month period.',
  },
  {
    id: '06',
    q: 'What are the diligence steps?',
    a: 'Initial screening, business model review, technical diligence, financial audit, legal compliance check, and final investment committee approval.',
  },
  {
    id: '07',
    q: 'Who issues term sheets?',
    a: 'Lead investors construct and issue the initial Term Sheet detailing valuation, rights, and board structure. Followers generally syndicate on these terms.',
  },
  {
    id: '08',
    q: 'Are there closing guarantees?',
    a: 'A signed term sheet is generally non-binding (except for exclusivity/confidentiality). Closing depends on satisfactory completion of final confirmatory diligence.',
  },
  {
    id: '09',
    q: 'Can we have simultaneous conversations?',
    a: 'Yes, running a parallel process is standard until a term sheet with a "no-shop" (exclusivity) clause is signed with a lead investor.',
  },
  {
    id: '10',
    q: 'What happens after close?',
    a: 'Funds are wired, equity is issued, the cap table is updated, board seats are finalized, and you transition from fundraising mode back into aggressive execution mode.',
  },
];

export default function FundingDealsFaq() {
  const [openIds, setOpenIds] = useState<string[]>(['01', '02']);

  const toggleFaq = (id: string) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#FAF8FF] border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[840px] flex flex-col gap-10 sm:gap-12">
        {/* Header */}
        <div className="flex flex-col gap-3 text-center sm:text-left">
          <span className="text-[12px] font-bold text-[#747685] uppercase tracking-wider">
            ABOUT FUNDING &amp; DEALS
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-extrabold text-[#1A1B23] leading-[1.15] tracking-tight">
            Questions before you enter the investor process?
          </h2>
        </div>

        {/* Accordion List */}
        <div className="flex flex-col gap-3.5">
          {FAQS.map((faq) => {
            const isOpen = openIds.includes(faq.id);
            return (
              <div
                key={faq.id}
                className="bg-white border border-[#E2E1EC] rounded-[16px] overflow-hidden transition-all shadow-xs"
              >
                <button
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full p-5 sm:p-6 flex items-start justify-between gap-4 text-left focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-start gap-4">
                    <span className="font-heading font-bold text-[16px] text-[#8A8B8F] shrink-0 pt-0.5">
                      {faq.id}.
                    </span>
                    <span className="font-heading font-bold text-[16px] sm:text-[17px] text-[#070707] leading-snug">
                      {faq.q}
                    </span>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-[#E2E1EC] flex items-center justify-center text-[#070707] shrink-0 mt-0.5">
                    {isOpen ? <Minus size={15} /> : <Plus size={15} />}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 sm:px-6 sm:pb-6 pl-12 sm:pl-14 text-[14px] sm:text-[15px] text-[#444654] leading-[1.6] border-t border-[rgba(0,0,0,0.04)] pt-3 animate-in fade-in duration-150">
                    {faq.a}
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
