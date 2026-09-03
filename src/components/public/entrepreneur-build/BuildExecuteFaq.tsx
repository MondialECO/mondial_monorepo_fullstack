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
    q: 'Do I need to acquire a Creator project?',
    a: 'While acquiring a Creator project can jumpstart your efforts, it is not strictly necessary. The Build & Execute workspace supports both advancing your own existing company project and acquiring strategic Creator projects.',
  },
  {
    id: '02',
    q: 'Is Mondial a project-management tool?',
    a: 'Mondial is an infrastructure platform that includes structured execution capabilities. While it features milestone and dependency tracking, its primary goal is turning activity into verified progress evidence for later equity and funding.',
  },
  {
    id: '03',
    q: 'Does Provider matching create an agreement?',
    a: 'Matching with a Provider facilitates an introduction and outlines potential scope within the platform. The Entrepreneur still controls selection, negotiation, scope alignment and final commercial agreements.',
  },
  {
    id: '04',
    q: 'Do I have to use Service Providers?',
    a: 'No. You have full autonomy to execute projects using your internal team. The Service Provider ecosystem is available when specialist expertise or temporary bandwidth is required.',
  },
  {
    id: '05',
    q: 'Does completing milestones prove business success?',
    a: 'Completing milestones proves operational capability and forward momentum—crucial evidence for stakeholders—without guaranteeing commercial or financial performance.',
  },
  {
    id: '06',
    q: 'Does traction mean product-market fit?',
    a: 'Traction indicates positive signals, such as user growth or early revenue, but it is a precursor to true product-market fit. It demonstrates direction rather than ultimate validation.',
  },
  {
    id: '07',
    q: 'Does execution information move forward?',
    a: 'Yes. The core architecture of Mondial ensures that all validated execution data—milestones, team assembly, traction signals and evidence—seamlessly informs your Equity & Readiness and Data Room phases.',
  },
  {
    id: '08',
    q: 'What comes next?',
    a: 'Once you have established operational evidence through structured execution, the natural progression is to move into Phase 03: Equity & Readiness to structure capitalization and governance.',
  },
];

export default function BuildExecuteFaq() {
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
            ABOUT BUILD &amp; EXECUTE
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-extrabold text-[#1A1B23] leading-[1.15] tracking-tight">
            What Entrepreneurs usually need to know.
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
