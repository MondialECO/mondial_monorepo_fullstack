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
    q: 'What is a project concept in Mondial?',
    a: 'A project concept structures your raw idea into five essential pillars: Name, Concept Statement, Problem, Solution, and Target Customer.',
  },
  {
    id: '02',
    q: 'Can I change the project name later?',
    a: 'Yes. Working project names in Phase 02 are flexible and can be updated as your brand identity matures.',
  },
  {
    id: '03',
    q: 'Why must the problem definition be so specific?',
    a: 'Specific problem framing prevents wasted effort by ensuring your eventual solution directly targets verifiable market demand.',
  },
  {
    id: '04',
    q: 'What if I have multiple target customer groups?',
    a: 'Mondial helps you establish an active primary customer for early traction while organizing secondary and future customer segments.',
  },
  {
    id: '05',
    q: 'Does Phase 02 replace my business plan?',
    a: 'No. Phase 02 builds the foundational identity. Full AI Business Planning and financial forecasts occur in Phase 03.',
  },
  {
    id: '06',
    q: 'What happens after completing Phase 02?',
    a: 'You progress directly to Positioning & Branding (Phase 02 Part B) and then into Project Intelligence (Phase 03).',
  },
];

export default function ProjectConceptFaq() {
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
            FREQUENTLY ASKED QUESTIONS
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-extrabold text-[#1A1B23] leading-[1.15] tracking-tight">
            Questions about Project Identity &amp; Concept?
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
