'use client';

import { Layers, DollarSign, Package, Globe, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

export default function ServicesOpportunitiesStory() {
  const steps = [
    { num: '1', title: 'DEFINE', desc: 'Turn expertise into a service.', icon: Layers },
    { num: '2', title: 'PRICE', desc: 'Choose the commercial model.', icon: DollarSign },
    { num: '3', title: 'PACKAGE', desc: 'Clarify scope and deliverables.', icon: Package },
    { num: '4', title: 'PUBLISH', desc: 'Make the service discoverable.', icon: Globe },
    { num: '5', title: 'MATCH', desc: 'Connect it with ecosystem needs.', icon: Sparkles },
    { num: '6', title: 'REVIEW', desc: 'Decide which opportunities deserve a response.', icon: CheckCircle2 },
  ];

  const equation = [
    'EXPERTISE',
    'STRUCTURED SERVICE',
    'VISIBILITY',
    'CLIENT CONTEXT',
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            SERVICES &amp; OPPORTUNITIES
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Structure the offer.
            <br />
            Then meet the right need.
          </h2>
        </div>

        {/* 6-Step Vertical Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-stretch">
          {steps.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.title}
                className="p-5 rounded-[22px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-2xs flex flex-col justify-between gap-4"
              >
                <div className="flex items-center justify-between">
                  <span className="w-6 h-6 rounded-full bg-white border border-[#E2E1EC] text-[11px] font-bold text-[#3C61DD] flex items-center justify-center">
                    {s.num}
                  </span>
                  <Icon size={16} className="text-[#3C61DD]" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-[14px] text-[#1A1B23]">{s.title}</h3>
                  <p className="text-[12px] text-[#747685] mt-1">{s.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Final Relevant Opportunity Equation */}
        <div className="p-6 sm:p-10 rounded-[28px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-xs flex flex-col items-center gap-6 text-center">
          <span className="text-[11px] font-bold text-[#747685] uppercase tracking-wider">
            RELEVANT OPPORTUNITY EQUATION
          </span>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-[12px] sm:text-[13px] font-bold text-[#1A1B23]">
            {equation.map((term, idx) => (
              <span key={term} className="flex items-center gap-2">
                <span className="px-3.5 py-2 rounded-[10px] bg-white border border-[#E2E1EC]">
                  {term}
                </span>
                {idx < equation.length - 1 ? (
                  <span className="text-[#3C61DD]">+</span>
                ) : (
                  <span className="text-[#3C61DD]">➔</span>
                )}
              </span>
            ))}
            <span className="px-5 py-2 rounded-[10px] bg-[#1A47C3] text-white shadow-xs">
              RELEVANT OPPORTUNITY
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
