'use client';

import { Search, Sparkles, ArrowRight, ArrowDown, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function DemandPathsSection() {
  const matchingFormula = [
    'SERVICE CATEGORY',
    'KEYWORDS',
    'PROVIDER CONTEXT',
    'CLIENT NEED',
  ];

  return (
    <section
      id="section-06-two-paths"
      className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#FAF8FF] border-b border-[rgba(0,0,0,0.06)] flex justify-center"
    >
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            ONE SERVICE. TWO PATHS TO DEMAND.
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Be discoverable.
            <br />
            And be matched when the need appears.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Publishing a service can make it available through both client-led Marketplace discovery and context-driven ecosystem matching.
          </p>
        </div>

        {/* Central Published Service Box */}
        <div className="p-5 sm:p-6 rounded-[22px] bg-white border-2 border-[#3C61DD] shadow-md flex flex-col items-center text-center max-w-[480px] mx-auto gap-1">
          <span className="text-[10px] font-bold text-[#3C61DD] uppercase tracking-wider">
            PUBLISHED SERVICE
          </span>
          <h3 className="font-heading font-extrabold text-[18px] sm:text-[20px] text-[#1A1B23]">
            Backend Integration for Startup MVPs
          </h3>
        </div>

        {/* Two Paths Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Path 01: Marketplace Discovery */}
          <div className="p-6 sm:p-8 rounded-[28px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-[8px] bg-[#FAF8FF] border border-[#E2E1EC] flex items-center justify-center text-[#1A47C3]">
                  <Search size={16} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#747685] uppercase block">
                    PATH 01
                  </span>
                  <h3 className="font-heading font-bold text-[18px] text-[#1A1B23]">
                    MARKETPLACE DISCOVERY
                  </h3>
                </div>
              </div>

              <p className="text-[13px] text-[#747685]">
                The client initiates the search directly through the marketplace.
              </p>

              <div className="space-y-2 text-[12px]">
                <div className="p-2.5 rounded-[10px] bg-[#FAF8FF] border border-[#E2E1EC]">
                  1. Client Browses Category
                </div>
                <div className="p-2.5 rounded-[10px] bg-[#FAF8FF] border border-[#E2E1EC]">
                  2. Compares Service Packages
                </div>
                <div className="p-2.5 rounded-[10px] bg-[#FAF8FF] border border-[#E2E1EC]">
                  3. Discovers &amp; Evaluates Provider
                </div>
              </div>
            </div>

            <div className="p-3 rounded-[12px] bg-[#F3F2FD] text-[#1A47C3] text-[11px] font-semibold">
              Example: &ldquo;Entrepreneur searches: Backend Development&rdquo;
            </div>
          </div>

          {/* Path 02: Ecosystem Matching */}
          <div className="p-6 sm:p-8 rounded-[28px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-[8px] bg-[#E8F8EE] border border-[#157A55]/30 flex items-center justify-center text-[#157A55]">
                  <Sparkles size={16} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#157A55] uppercase block">
                    PATH 02
                  </span>
                  <h3 className="font-heading font-bold text-[18px] text-[#1A1B23]">
                    ECOSYSTEM MATCHING
                  </h3>
                </div>
              </div>

              <p className="text-[13px] text-[#747685]">
                Mondial recognizes unmet skill and resource needs in real time.
              </p>

              <div className="space-y-2 text-[12px]">
                <div className="p-2.5 rounded-[10px] bg-[#FAF8FF] border border-[#E2E1EC]">
                  1. Role Journey Progression (Creator / Entrepreneur / Investor)
                </div>
                <div className="p-2.5 rounded-[10px] bg-[#FAF8FF] border border-[#E2E1EC]">
                  2. Specific Capability Gap Identified
                </div>
                <div className="p-2.5 rounded-[10px] bg-[#FAF8FF] border border-[#E2E1EC]">
                  3. Relevant Providers Surfaced Automatically
                </div>
              </div>
            </div>

            <div className="p-3 rounded-[12px] bg-[#E8F8EE] text-[#157A55] text-[11px] font-semibold">
              Example: Entrepreneur building marketplace MVP ➔ Backend need detected
            </div>
          </div>
        </div>

        {/* Convergence on Qualified Opportunity */}
        <div className="p-6 sm:p-8 rounded-[24px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col items-center gap-5 text-center">
          <span className="text-[11px] font-bold text-[#747685] uppercase tracking-wider">
            RECONNECTION
          </span>

          <div className="px-6 py-3 rounded-[12px] bg-[#1A47C3] text-white font-heading font-extrabold text-[15px] sm:text-[18px] shadow-sm">
            QUALIFIED OPPORTUNITY
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-[12px] sm:text-[13px] font-bold text-[#1A1B23] pt-2">
            {matchingFormula.map((term, idx) => (
              <span key={term} className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-[8px] bg-[#FAF8FF] border border-[#E2E1EC]">
                  {term}
                </span>
                {idx < matchingFormula.length - 1 ? (
                  <span className="text-[#3C61DD]">+</span>
                ) : (
                  <span className="text-[#3C61DD]">➔</span>
                )}
              </span>
            ))}
            <span className="px-3.5 py-1.5 rounded-[8px] bg-[#DCE1FF] text-[#1A47C3]">
              RELEVANT MATCHING
            </span>
          </div>

          <p className="text-[12px] text-[#747685] max-w-[600px]">
            *A match creates an opportunity to review, not an automatic engagement.
          </p>
        </div>

        {/* Section Statement */}
        <div className="p-6 sm:p-7 rounded-[20px] bg-white border border-[#E2E1EC] text-center shadow-xs">
          <h3 className="font-heading font-extrabold text-[15px] sm:text-[18px] text-[#070707] uppercase tracking-wide">
            YOU CAN BE FOUND WITHOUT ALWAYS HAVING TO SEARCH.
          </h3>
        </div>
      </div>
    </section>
  );
}
