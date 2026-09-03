'use client';

import { CheckCircle2, HelpCircle, ArrowRight } from 'lucide-react';

export default function OpportunityComparisonSection() {
  const companies = [
    {
      name: 'NOVA SPACE',
      contextTitle: 'THESIS FIT',
      contextDesc: 'Very strong thesis alignment.',
      sector: 'B2B SaaS',
      stage: 'Seed',
      geo: 'France',
      need: '€700K',
      openQ: 'Commercial validation still early.',
      badgeColor: 'bg-[#E8F8EE] text-[#157A55]',
    },
    {
      name: 'FLOWBASE',
      contextTitle: 'TRACTION CONTEXT',
      contextDesc: 'More operating evidence.',
      sector: 'Future of Work',
      stage: 'Early Rev',
      geo: 'Belgium',
      need: '€500K',
      openQ: 'Sector is adjacent rather than core.',
      badgeColor: 'bg-[#F3F2FD] text-[#1A47C3]',
    },
    {
      name: 'CLOUDOPS',
      contextTitle: 'TRACTION CONTEXT',
      contextDesc: 'Strong traction.',
      sector: 'B2B SaaS',
      stage: 'Scaling',
      geo: 'Germany',
      need: '€4M',
      openQ: 'Round size exceeds preferred range.',
      badgeColor: 'bg-amber-50 text-amber-800',
    },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#747685] uppercase tracking-wider">
            PUT OPPORTUNITIES IN CONTEXT
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            The question is not &ldquo;Which company is best?&rdquo;
            <br />
            It is: &ldquo;Which opportunity fits this thesis?&rdquo;
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Mondial should help Investors compare relevant investment dimensions without pretending that one company can be objectively ranked above another.
          </p>
        </div>

        {/* Active Thesis Focus Anchor */}
        <div className="p-4 rounded-[16px] bg-[#FAF8FF] border border-[#E2E1EC] flex flex-wrap items-center justify-between gap-3 text-[12px]">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-[#3C61DD] uppercase">
              ACTIVE THESIS FOCUS:
            </span>
            <strong className="text-[#1A1B23]">
              B2B SaaS • Seed / Early Revenue • France / EU • €250K–€1M
            </strong>
          </div>
          <span className="text-[10px] font-bold text-[#747685] uppercase">
            ILLUSTRATIVE EXAMPLES
          </span>
        </div>

        {/* 3 Opportunity Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
          {companies.map((c) => (
            <div
              key={c.name}
              className="p-6 rounded-[24px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-5"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[rgba(0,0,0,0.06)]">
                  <h3 className="font-heading font-bold text-[18px] text-[#1A1B23]">{c.name}</h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${c.badgeColor}`}>
                    {c.contextTitle}
                  </span>
                </div>

                <p className="text-[12px] text-[#444654] mt-2 italic">{c.contextDesc}</p>

                <div className="space-y-1.5 pt-3 text-[12px]">
                  <div><strong>Sector:</strong> {c.sector}</div>
                  <div><strong>Stage:</strong> {c.stage}</div>
                  <div><strong>Geo:</strong> {c.geo}</div>
                  <div><strong>Funding Need:</strong> <strong className="text-[#157A55]">{c.need}</strong></div>
                </div>
              </div>

              <div className="p-3 rounded-[12px] bg-white border border-[#E2E1EC] text-[11px] text-[#747685]">
                <strong className="text-[#BA1A1A] block">Open Question:</strong>
                <p className="mt-0.5">{c.openQ}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Comparison Statement & Equation */}
        <div className="p-6 sm:p-8 rounded-[24px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-xs flex flex-col items-center text-center gap-4">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-[12px] sm:text-[13px] font-bold text-[#1A1B23]">
            <span className="px-3 py-1.5 rounded-[8px] bg-white border border-[#E2E1EC]">FIT</span>
            <span className="text-[#3C61DD]">+</span>
            <span className="px-3 py-1.5 rounded-[8px] bg-white border border-[#E2E1EC]">EVIDENCE</span>
            <span className="text-[#3C61DD]">+</span>
            <span className="px-3 py-1.5 rounded-[8px] bg-white border border-[#E2E1EC]">OPEN QUESTIONS</span>
            <span className="text-[#3C61DD]">=</span>
            <span className="px-4 py-1.5 rounded-[8px] bg-[#1A47C3] text-white shadow-xs">
              BETTER REVIEW
            </span>
          </div>

          <h3 className="font-heading font-extrabold text-[14px] sm:text-[16px] text-[#070707] uppercase tracking-wide pt-2">
            COMPARISON SHOULD CREATE BETTER QUESTIONS.
            <br />
            NOT FALSE CERTAINTY.
          </h3>
        </div>
      </div>
    </section>
  );
}
