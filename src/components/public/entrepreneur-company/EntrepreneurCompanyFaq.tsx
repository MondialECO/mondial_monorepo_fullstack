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
    q: 'Do I need to come through the Creator journey first?',
    a: 'No. Entrepreneurs with an existing company can enter directly, while relevant Creator project information can move forward for users who level up.',
  },
  {
    id: '02',
    q: 'Does company verification guarantee the business?',
    a: 'No. Verification supports company identity and documentation checks. It does not guarantee commercial performance.',
  },
  {
    id: '03',
    q: 'Is KBIS required everywhere?',
    a: 'No. KBIS is a France-specific example. Equivalent official registration documents depend on jurisdiction.',
  },
  {
    id: '04',
    q: 'Is financial information public?',
    a: 'No automatic public visibility should be implied. Financial information follows relevant access and permission rules.',
  },
  {
    id: '05',
    q: 'Do all companies need the same compliance documents?',
    a: 'No. Requirements vary by jurisdiction, activity and company situation.',
  },
  {
    id: '06',
    q: 'Is Company Readiness an official certification?',
    a: 'No. It is a Mondial product readiness view, not a government or investment certification.',
  },
  {
    id: '07',
    q: 'Can my team access the company workspace?',
    a: 'Authorized company users may have different levels of access according to their roles and permissions.',
  },
  {
    id: '08',
    q: 'What happens after Company & Verification?',
    a: 'The Entrepreneur moves into Build & Execute to discover opportunities, assemble resources, manage work and build traction.',
  },
  {
    id: '09',
    q: 'How long does company verification take?',
    a: 'Initial document intake and automated checks begin immediately upon submission. Full verification review timelines depend on official registry response times and document clarity.',
  },
];

export default function EntrepreneurCompanyFaq() {
  const [openIds, setOpenIds] = useState<string[]>(['01']);

  const toggleFaq = (id: string) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[840px] flex flex-col gap-10 sm:gap-12">
        {/* Header */}
        <div className="flex flex-col gap-3 text-center sm:text-left">
          <span className="text-[12px] font-bold text-[#747685] uppercase tracking-wider">
            TRANSITION CONTEXT
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-extrabold text-[#1A1B23] leading-[1.15] tracking-tight">
            Common questions about moving from setup to execution.
          </h2>
        </div>

        {/* Accordion List */}
        <div className="flex flex-col gap-3.5">
          {FAQS.map((faq) => {
            const isOpen = openIds.includes(faq.id);
            return (
              <div
                key={faq.id}
                className="bg-[#FAF8FF] border border-[#E2E1EC] rounded-[16px] overflow-hidden transition-all shadow-xs"
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
