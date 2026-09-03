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
    q: 'Is my brand direction locked in forever?',
    a: 'No. Your brand direction is a living artifact. While Phase 02 establishes a solid baseline required for moving into intelligence gathering, you will likely refine your brand tone and visual narrative as you gather real market feedback in Phase 03.',
  },
  {
    id: '02',
    q: 'What is the exact difference between positioning and branding?',
    a: "Positioning is where you sit in the market relative to competitors (the space you occupy in the customer's mind). Branding is how you look, feel, and sound while occupying that space. Positioning is the strategic coordinate; branding is the flag you plant there.",
  },
  {
    id: '03',
    q: 'Do I need to file trademarks before Phase 03?',
    a: 'It is generally not necessary to file formal trademarks at this specific juncture. Phase 03 focuses on validating the business logic. We recommend consulting legal counsel for trademark strategy once the core market intelligence confirms the viability of the name and brand concept.',
  },
  {
    id: '04',
    q: 'How do I validate my differentiation in the real world?',
    a: 'Validation occurs in Phase 03 through Market Intelligence. You will test your Phase 02 assumptions against actual competitor data, search trends, and direct customer interviews to see if your proposed differentiation truly resonates.',
  },
  {
    id: '05',
    q: 'Is this the same as a traditional business plan?',
    a: 'No. Phase 02 establishes the foundational narrative and identity. The “AI Business Plan” in Phase 03 is an agile, dynamic document designed to test operational mechanics, replacing static, traditional multi-page plans with functional business logic.',
  },
  {
    id: '06',
    q: 'Can I go back and edit Phase 02 items later?',
    a: 'Yes. The platform is designed for iterative learning. If Phase 03 reveals that your initial customer targeting was too broad, you can seamlessly return to Phase 02 and tighten the Customer and Problem modules.',
  },
  {
    id: '07',
    q: 'What is the first step in Phase 03?',
    a: 'The immediate next step is initiating the AI Business Plan module. It will use the 9 components you just completed in Phase 02 as the prompt context to generate a draft structural business model for your review.',
  },
];

export default function PositioningBrandingFaq() {
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
            ABOUT POSITIONING &amp; BRANDING
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-extrabold text-[#1A1B23] leading-[1.15] tracking-tight">
            Questions before you MOVE FORWARD?
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
