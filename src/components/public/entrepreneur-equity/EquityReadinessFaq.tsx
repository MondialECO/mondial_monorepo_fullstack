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
    q: 'Why does ownership matter?',
    a: 'Ownership details clarify control and incentives within the company structure, vital for future investors.',
  },
  {
    id: '02',
    q: 'What is a Cap Table?',
    a: 'A capitalization table shows the total capitalization of the company and who owns what percentage.',
  },
];

export default function EquityReadinessFaq() {
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
            ABOUT EQUITY &amp; READINESS
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-extrabold text-[#1A1B23] leading-[1.15] tracking-tight">
            What founders should understand first.
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
