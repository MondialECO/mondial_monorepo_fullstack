'use client';

import { CheckCircle2, ChevronRight, Sparkles, HelpCircle, FileText, ArrowRight } from 'lucide-react';

export default function StructuredDiscoverySection() {
  const lenses = [
    { num: '01', name: 'SECTOR' },
    { num: '02', name: 'STAGE' },
    { num: '03', name: 'GEOGRAPHY' },
    { num: '04', name: 'PROJECT TYPE' },
    { num: '05', name: 'BUSINESS MODEL' },
    { num: '06', name: 'RESOURCE NEED' },
    { num: '07', name: 'OPPORTUNITY TYPE', active: true },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#747685] uppercase tracking-wider">
            STRUCTURED DISCOVERY
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Discover more than an idea.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Mondial gives Entrepreneurs enough project context to understand what an opportunity is, how developed it is and whether it deserves deeper review.
          </p>
        </div>

        {/* 3-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Column 1: Discovery Lenses (3 cols) */}
          <div className="lg:col-span-3 bg-[#FAF8FF] border border-[#E2E1EC] rounded-[20px] p-5 flex flex-col gap-3 shadow-xs">
            <span className="text-[10px] font-bold text-[#8A8B8F] uppercase tracking-wider pb-2 border-b border-[rgba(0,0,0,0.06)]">
              DISCOVERY LENSES
            </span>
            <div className="flex flex-col gap-1.5 text-[13px]">
              {lenses.map((lens) => (
                <div
                  key={lens.num}
                  className={`p-2.5 rounded-[10px] flex items-center justify-between transition-colors ${
                    lens.active
                      ? 'bg-white border border-[#3C61DD]/30 font-bold text-[#3C61DD] shadow-2xs'
                      : 'text-[#444654] hover:bg-white/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-[#8A8B8F]">{lens.num}</span>
                    <span>{lens.name}</span>
                  </div>
                  {lens.active && <span className="w-1.5 h-1.5 rounded-full bg-[#3C61DD]" />}
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: Featured Project Cards (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Primary Featured: FLEXDESK */}
            <div className="p-6 rounded-[24px] bg-white border-2 border-[#3C61DD]/40 flex flex-col gap-4 shadow-md text-[12px]">
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(0,0,0,0.06)]">
                <div>
                  <span className="text-[10px] font-bold text-[#747685] uppercase block">
                    Future of Work • France
                  </span>
                  <h3 className="font-heading font-bold text-[22px] text-[#070707]">FLEXDESK</h3>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-2.5 py-0.5 rounded bg-[#F1F5FF] text-[#3C61DD] text-[10px] font-bold uppercase">
                    FULL BUYOUT
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#E8F8EE] text-[#157A55] text-[10px] font-bold uppercase">
                    FIT: HIGH
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                <div className="p-2.5 rounded-[10px] bg-[#FAF8FF]">
                  <span className="text-[10px] font-bold text-[#8A8B8F] uppercase block">
                    Problem &amp; Solution
                  </span>
                  <p className="text-[#1A1B23]">
                    Validated B2B SaaS platform for hybrid workspace management.
                  </p>
                </div>
                <div className="p-2.5 rounded-[10px] bg-[#FAF8FF]">
                  <span className="text-[10px] font-bold text-[#8A8B8F] uppercase block">
                    Target Customer
                  </span>
                  <p className="text-[#1A1B23]">Mid-market enterprise (500–2000 employees).</p>
                </div>
                <div className="p-2.5 rounded-[10px] bg-[#FAF8FF]">
                  <span className="text-[10px] font-bold text-[#8A8B8F] uppercase block">
                    Business Plan
                  </span>
                  <p className="text-[#1A1B23]">
                    Comprehensive 3-year projection with defined CAC/LTV ratios.
                  </p>
                </div>
                <div className="p-2.5 rounded-[10px] bg-[#FAF8FF]">
                  <span className="text-[10px] font-bold text-[#8A8B8F] uppercase block">
                    Resource Needs
                  </span>
                  <p className="text-[#1A1B23]">
                    Technical lead, €150k initial operating capital.
                  </p>
                </div>
              </div>
            </div>

            {/* Other Projects Preview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px]">
              <div className="p-3.5 rounded-[16px] bg-[#FAF8FF] border border-[#E2E1EC] flex flex-col gap-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-heading font-bold text-[14px] text-[#070707]">
                    LOCALHUB
                  </span>
                  <span className="text-[9px] font-bold text-[#157A55] uppercase bg-[#E8F8EE] px-1.5 py-0.5 rounded">
                    HIGH
                  </span>
                </div>
                <span className="text-[10px] text-[#747685]">Local Services • Belgium</span>
                <span className="text-[10px] text-[#3C61DD] font-bold uppercase">
                  CO-FOUNDER / EQUITY
                </span>
              </div>

              <div className="p-3.5 rounded-[16px] bg-[#FAF8FF] border border-[#E2E1EC] flex flex-col gap-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-heading font-bold text-[14px] text-[#070707]">
                    GREENLOOP
                  </span>
                  <span className="text-[9px] font-bold text-[#747685] uppercase bg-gray-100 px-1.5 py-0.5 rounded">
                    MODERATE
                  </span>
                </div>
                <span className="text-[10px] text-[#747685]">Circular Economy • Netherlands</span>
                <span className="text-[10px] text-[#747685] font-bold uppercase">
                  PROJECT REVIEW
                </span>
              </div>
            </div>
          </div>

          {/* Column 3: Contextual Decision Area (4 cols) */}
          <div className="lg:col-span-4 bg-[#FAF8FF] border border-[#E2E1EC] rounded-[24px] p-6 flex flex-col justify-between gap-6 shadow-xs text-[12px]">
            <div className="flex flex-col gap-4">
              <span className="text-[10px] font-bold text-[#747685] uppercase pb-2 border-b border-[rgba(0,0,0,0.06)]">
                CONTEXT: FLEXDESK
              </span>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-[#3C61DD] font-bold text-[13px]">
                  <Sparkles size={15} />
                  <span>WHY IT MAY FIT</span>
                </div>
                <ul className="space-y-1.5 text-[#444654] pl-2">
                  <li className="flex items-start gap-1.5">
                    <span className="text-[#3C61DD] font-bold">•</span>
                    <span>Adjacent market to current portfolio</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-[#3C61DD] font-bold">•</span>
                    <span>Marketplace capability overlap</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-[#3C61DD] font-bold">•</span>
                    <span>Potential supply expansion</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-[#3C61DD] font-bold">•</span>
                    <span>Structured project context available</span>
                  </li>
                </ul>
              </div>

              <div className="flex flex-col gap-2 pt-3 border-t border-[rgba(0,0,0,0.06)]">
                <div className="flex items-center gap-2 text-[#070707] font-bold text-[13px]">
                  <HelpCircle size={15} />
                  <span>OPEN QUESTIONS</span>
                </div>
                <ul className="space-y-1.5 text-[#444654] pl-2">
                  <li className="flex items-start gap-1.5">
                    <span className="text-[#C4C5D6]">•</span>
                    <span>Geographic overlap friction</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-[#C4C5D6]">•</span>
                    <span>Technology duplication risks</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-[#C4C5D6]">•</span>
                    <span>Creator expectations misaligned?</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-[#C4C5D6]">•</span>
                    <span>Transferable project assets clarity</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Step Flow Footer */}
            <div className="pt-3 border-t border-[rgba(0,0,0,0.06)] flex items-center justify-between text-[11px] font-bold text-[#747685]">
              <span className="text-[#070707]">DISCOVER</span>
              <span>➔</span>
              <span>UNDERSTAND</span>
              <span>➔</span>
              <span>COMPARE</span>
              <span>➔</span>
              <span>REVIEW</span>
            </div>
          </div>
        </div>

        {/* Closing Banner */}
        <div className="w-full py-5 px-6 rounded-[18px] bg-[#FAF8FF] border border-[#E2E1EC] text-center shadow-xs">
          <span className="font-heading font-bold text-[14px] sm:text-[16px] text-[#070707] uppercase tracking-wide">
            DISCOVERY SHOULD HELP YOU DECIDE WHAT DESERVES ATTENTION. NOT JUST WHAT EXISTS.
          </span>
        </div>
      </div>
    </section>
  );
}
