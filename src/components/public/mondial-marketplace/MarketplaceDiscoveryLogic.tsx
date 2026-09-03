'use client';

export default function MarketplaceDiscoveryLogic() {
  return (
    <section
      id="discovery-logic"
      className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[rgba(0,0,0,0.06)] flex justify-center scroll-mt-12"
    >
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#747685] uppercase tracking-wider">
            TWO WAYS TO DISCOVER
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Sometimes you search.
            <br />
            Sometimes the opportunity should find you.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Mondial combines deliberate browsing with context-driven matching so discovery can begin from either human intent or an existing ecosystem need.
          </p>
        </div>

        {/* 2 Columns: Active Discovery (Left) vs Context-Driven Matching (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Column 1: Active Discovery */}
          <div className="p-6 sm:p-8 rounded-[28px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(0,0,0,0.06)]">
                <span className="px-3 py-1 rounded-full bg-[#EBF0FF] text-[#1A47C3] font-heading font-extrabold text-[12px] uppercase">
                  ACTIVE DISCOVERY
                </span>
                <span className="text-[10px] font-bold text-[#747685] uppercase">
                  THE USER STARTS.
                </span>
              </div>

              {/* Search 1: Backend Development */}
              <div className="p-4 rounded-[16px] bg-white border border-[#E2E1EC] flex flex-col gap-2">
                <span className="text-[10px] font-bold text-[#747685] uppercase">
                  ENTREPRENEUR INTENT
                </span>
                <div className="font-heading font-bold text-[16px] text-[#1A1B23]">
                  &quot;Backend Development&quot;
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[rgba(0,0,0,0.05)] text-[11px]">
                  <div className="flex gap-1.5 text-[#747685]">
                    <span>Category</span> · <span>Location</span> · <span>Availability</span>
                  </div>
                  <span className="font-bold text-[#3C61DD]">RELEVANT PROVIDERS</span>
                </div>
              </div>

              {/* Search 2: Seed B2B SaaS */}
              <div className="p-4 rounded-[16px] bg-white border border-[#E2E1EC] flex flex-col gap-2">
                <span className="text-[10px] font-bold text-[#747685] uppercase">
                  INVESTOR INTENT
                </span>
                <div className="font-heading font-bold text-[16px] text-[#1A1B23]">
                  &quot;Seed B2B SaaS&quot;
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[rgba(0,0,0,0.05)] text-[11px]">
                  <div className="flex gap-1.5 text-[#747685]">
                    <span>France / EU</span> · <span>€250K–€1M</span>
                  </div>
                  <span className="font-bold text-[#157A55]">RELEVANT COMPANIES</span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-[12px] bg-white border border-[#E2E1EC] text-center text-[12px] font-bold text-[#1A1B23]">
              Search Answers: &quot;What am I looking for?&quot;
            </div>
          </div>

          {/* Column 2: Context-Driven Matching */}
          <div className="p-6 sm:p-8 rounded-[28px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(0,0,0,0.06)]">
                <span className="px-3 py-1 rounded-full bg-[#E8F8EE] text-[#157A55] font-heading font-extrabold text-[12px] uppercase">
                  CONTEXT-DRIVEN MATCHING
                </span>
                <span className="text-[10px] font-bold text-[#747685] uppercase">
                  THE NEED ALREADY EXISTS.
                </span>
              </div>

              {/* Matching 1: Legal/IP Gap */}
              <div className="p-4 rounded-[16px] bg-white border border-[#E2E1EC] flex flex-col gap-2">
                <span className="text-[10px] font-bold text-[#747685] uppercase">
                  PROJECT CONTEXT
                </span>
                <div className="font-heading font-bold text-[16px] text-[#1A1B23]">
                  Legal/IP Gap Detected
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[rgba(0,0,0,0.05)] text-[11px]">
                  <span className="text-[#747685]">MONDIAL RECOGNIZES NEED</span>
                  <span className="font-bold text-[#3C61DD]">RELEVANT LEGAL PROVIDERS</span>
                </div>
              </div>

              {/* Matching 2: Funding Ask <-> Investor Thesis */}
              <div className="p-4 rounded-[16px] bg-white border border-[#E2E1EC] flex flex-col gap-2">
                <span className="text-[10px] font-bold text-[#747685] uppercase">
                  ECOSYSTEM SIGNAL
                </span>
                <div className="font-heading font-bold text-[16px] text-[#1A1B23]">
                  Funding Ask ↔ Investor Thesis
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[rgba(0,0,0,0.05)] text-[11px]">
                  <span className="text-[#747685]">MONDIAL MATCHES CRITERIA</span>
                  <span className="font-bold text-[#157A55]">RELEVANT INVESTOR CONNECTION</span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-[12px] bg-white border border-[#E2E1EC] text-center text-[12px] font-bold text-[#1A1B23]">
              Matching Answers: &quot;What does this situation need?&quot;
            </div>
          </div>
        </div>

        {/* Discovery Conclusion */}
        <div className="p-6 sm:p-8 rounded-[24px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-xs flex flex-col items-center text-center gap-3">
          <span className="text-[11px] font-bold text-[#747685] uppercase tracking-wider">
            DISCOVERY WITH CONTEXT
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2 text-[14px] sm:text-[16px] font-heading font-extrabold text-[#1A1B23]">
            <span>BROWSE</span>
            <span className="text-[#3C61DD]">+</span>
            <span>MATCHING</span>
            <span className="text-[#3C61DD]">=</span>
            <span className="text-[#3C61DD]">MORE RELEVANT DISCOVERY</span>
          </div>
        </div>
      </div>
    </section>
  );
}
