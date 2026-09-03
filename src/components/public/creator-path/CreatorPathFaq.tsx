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
    q: 'Do I need a registered company to become a Creator?',
    a: 'No. The Creator journey begins before company incorporation.',
  },
  {
    id: '02',
    q: 'Do I need a complete business plan before joining?',
    a: 'No. Business planning is part of the Project Intelligence journey.',
  },
  {
    id: '03',
    q: 'Does Mondial build the project for me?',
    a: 'No. Mondial structures the process, provides tools and helps connect the project with relevant people and resources.',
  },
  {
    id: '04',
    q: 'Does AI decide whether my idea is good?',
    a: 'No. AI helps structure information, identify assumptions and surface areas that may require evidence or review.',
  },
  {
    id: '05',
    q: 'Can I sell the project?',
    a: 'Phase 05 can support a Full Buyout path where ownership may be transferred through an agreed acquisition process.',
  },
  {
    id: '06',
    q: 'Can I find a co-founder?',
    a: 'The Co-founder / Equity path can support matching and founder discussions. Matching does not automatically create an equity agreement.',
  },
  {
    id: '07',
    q: 'Can I keep the project and build it myself?',
    a: 'Yes. Build Yourself leads toward Verified Entrepreneur Level Up and the Entrepreneur journey.',
  },
  {
    id: '08',
    q: 'Do I lose the work I completed as a Creator?',
    a: 'No. Relevant structured project information carries forward into the Entrepreneur modules.',
  },
];

export default function CreatorPathFaq() {
  const [openIds, setOpenIds] = useState<string[]>(['01']);

  const toggleFaq = (id: string) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#FAF8FF] border-t border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[840px] flex flex-col gap-10 sm:gap-12">
        {/* Header */}
        <div className="flex flex-col gap-3 text-center sm:text-left">
          <span className="text-[12px] font-bold text-[#747685] uppercase tracking-wider">
            ABOUT THE CREATOR PATH
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-extrabold text-[#1A1B23] leading-[1.15] tracking-tight">
            Questions before you start?
          </h2>
        </div>

        {/* Accordion List */}
        <div className="flex flex-col gap-3.5">
          {FAQS.map((faq) => {
            const isOpen = openIds.includes(faq.id);
            return (
              <div
                key={faq.id}
                className="bg-white border border-[rgba(0,0,0,0.06)] rounded-[16px] overflow-hidden transition-all shadow-xs"
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
                  <div className="w-7 h-7 rounded-full bg-[#F1F1F2] flex items-center justify-center text-[#070707] shrink-0 mt-0.5">
                    {isOpen ? <Minus size={15} /> : <Plus size={15} />}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 sm:px-6 sm:pb-6 pl-12 sm:pl-14 text-[14px] sm:text-[15px] text-[#5E5E5E] leading-[1.6] border-t border-[rgba(0,0,0,0.04)] pt-3 animate-in fade-in duration-150">
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
