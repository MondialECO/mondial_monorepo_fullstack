'use client';

export default function EntrepreneurMarketplaceOpportunities() {
  const engagementSteps = [
    'DISCOVER',
    'UNDERSTAND',
    'SHOW INTEREST',
    'CONNECTION',
    'SECURE ACCESS',
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#747685] uppercase tracking-wider">
            ENTREPRENEUR OPPORTUNITIES
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            A funding need should arrive with
            <br />
            company context.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Entrepreneurs can bring structured company and funding context into the ecosystem so relevant Investors can understand the opportunity before deeper review begins.
          </p>
        </div>

        {/* Company Card + Funding Ask Side-by-Side (8 / 4 Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Company Card (8 cols) */}
          <div className="lg:col-span-8 p-6 sm:p-8 rounded-[28px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[rgba(0,0,0,0.06)]">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full bg-[#E8F8EE] text-[#157A55] font-bold text-[10px] uppercase">
                    VERIFIED COMPANY
                  </span>
                  <h3 className="font-heading font-extrabold text-[22px] text-[#1A1B23]">
                    NOVA SPACE SAS
                  </h3>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
                  <span className="px-2.5 py-1 rounded bg-white border border-[#E2E1EC] text-[#444654]">
                    Seed
                  </span>
                  <span className="px-2.5 py-1 rounded bg-white border border-[#E2E1EC] text-[#444654]">
                    France
                  </span>
                  <span className="px-2.5 py-1 rounded bg-white border border-[#E2E1EC] text-[#444654]">
                    B2B Marketplace
                  </span>
                  <span className="px-2.5 py-1 rounded bg-[#EBF0FF] text-[#1A47C3]">
                    €700K Funding Need
                  </span>
                </div>
              </div>

              {/* Company Metrics & Context Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px]">
                <div className="p-3.5 rounded-[14px] bg-white border border-[#E2E1EC]">
                  <strong className="text-[#747685] block text-[10px] uppercase">COMPANY PURPOSE</strong>
                  <span className="text-[#1A1B23] font-medium mt-0.5 block">
                    Orbital intelligence for marketplace logistics.
                  </span>
                </div>
                <div className="p-3.5 rounded-[14px] bg-white border border-[#E2E1EC]">
                  <strong className="text-[#747685] block text-[10px] uppercase">HIGH-LEVEL TRACTION</strong>
                  <span className="font-heading font-extrabold text-[15px] text-[#157A55] mt-0.5 block">
                    +124% QonQ Growth
                  </span>
                </div>
                <div className="p-3.5 rounded-[14px] bg-white border border-[#E2E1EC]">
                  <strong className="text-[#747685] block text-[10px] uppercase">BUSINESS MODEL</strong>
                  <span className="text-[#1A1B23] font-medium mt-0.5 block">
                    Transaction-based SaaS.
                  </span>
                </div>
                <div className="p-3.5 rounded-[14px] bg-white border border-[#E2E1EC]">
                  <strong className="text-[#747685] block text-[10px] uppercase">EXECUTION PROGRESS</strong>
                  <span className="text-[#1A1B23] font-medium mt-0.5 block">
                    Phase 03 Complete.
                  </span>
                </div>
              </div>
            </div>

            {/* Founder Context */}
            <div className="p-4 rounded-[16px] bg-white border border-[#E2E1EC] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#1A1B23] text-white flex items-center justify-center font-heading font-bold text-[12px]">
                  AD
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#747685] uppercase block">FOUNDER CONTEXT</span>
                  <span className="font-heading font-bold text-[14px] text-[#1A1B23]">
                    Alexandre Dubois
                  </span>
                  <span className="text-[11px] text-[#747685] ml-2">Serial Entrepreneur</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] font-bold">
                <span className="px-2.5 py-1 rounded bg-[#FAF8FF] border border-[#E2E1EC] text-[#1A1B23]">
                  Data Room Prepared
                </span>
                <span className="px-2.5 py-1 rounded bg-[#E8F8EE] text-[#157A55]">
                  Verified Identity
                </span>
              </div>
            </div>
          </div>

          {/* Funding Ask Panel (4 cols) */}
          <div className="lg:col-span-4 p-6 sm:p-8 rounded-[28px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-6">
            <div className="flex flex-col gap-4">
              <div>
                <span className="text-[10px] font-bold text-[#747685] uppercase tracking-wider block">
                  Funding Ask
                </span>
                <h4 className="font-heading font-extrabold text-[36px] text-[#3C61DD] leading-none mt-1">
                  €700K
                </h4>
                <span className="text-[12px] font-medium text-[#444654] block mt-1">
                  For Series A Readiness
                </span>
              </div>

              <div className="pt-2">
                <span className="text-[10px] font-bold text-[#747685] uppercase tracking-wider block mb-2">
                  USE OF FUNDS
                </span>
                <div className="space-y-2 text-[12px]">
                  <div className="p-2.5 rounded-[10px] bg-white border border-[#E2E1EC] flex items-center justify-between">
                    <span className="text-[#1A1B23] font-medium">Product Scale</span>
                    <strong className="text-[#3C61DD]">40%</strong>
                  </div>
                  <div className="p-2.5 rounded-[10px] bg-white border border-[#E2E1EC] flex items-center justify-between">
                    <span className="text-[#1A1B23] font-medium">Team</span>
                    <strong className="text-[#3C61DD]">30%</strong>
                  </div>
                  <div className="p-2.5 rounded-[10px] bg-white border border-[#E2E1EC] flex items-center justify-between">
                    <span className="text-[#1A1B23] font-medium">GTM</span>
                    <strong className="text-[#3C61DD]">30%</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-[10px] text-[#747685] italic text-center">
              Illustrative Figma Demonstration Data
            </div>
          </div>
        </div>

        {/* Convergence of Fit */}
        <div className="p-6 sm:p-8 rounded-[28px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-xs flex flex-col gap-6">
          <span className="text-[11px] font-bold text-[#747685] uppercase tracking-wider text-center">
            Convergence of Fit
          </span>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center text-center">
            <div className="p-5 rounded-[20px] bg-white border border-[#E2E1EC]">
              <span className="text-[10px] font-bold text-[#747685] uppercase block">ENTREPRENEUR</span>
              <p className="font-heading font-bold text-[14px] text-[#1A1B23] mt-1">
                Structured Funding Context
              </p>
            </div>

            <div className="p-4 rounded-[16px] bg-[#EBF0FF] border border-[#3C61DD]/30 font-heading font-extrabold text-[14px] text-[#1A47C3]">
              POTENTIAL FIT
            </div>

            <div className="p-5 rounded-[20px] bg-white border border-[#E2E1EC]">
              <span className="text-[10px] font-bold text-[#747685] uppercase block">INVESTOR</span>
              <p className="font-heading font-bold text-[14px] text-[#1A1B23] mt-1">
                Sector, Stage, Geo, Ticket Fit
              </p>
            </div>
          </div>

          {/* Engagement Flow */}
          <div className="pt-4 border-t border-[rgba(0,0,0,0.06)] flex flex-col items-center gap-3">
            <span className="text-[10px] font-bold text-[#747685] uppercase tracking-wider">
              ENGAGEMENT FLOW
            </span>
            <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-bold text-[#1A1B23]">
              {engagementSteps.map((st, idx) => (
                <span key={st} className="flex items-center gap-2">
                  <span className="px-3.5 py-1.5 rounded-[8px] bg-white border border-[#E2E1EC]">
                    {st}
                  </span>
                  {idx < engagementSteps.length - 1 && <span className="text-[#3C61DD]">➔</span>}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Section Statements */}
        <div className="p-6 sm:p-8 rounded-[24px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-xs flex flex-col items-center text-center gap-3">
          <h3 className="font-heading font-extrabold text-[15px] sm:text-[18px] text-[#070707] uppercase tracking-wide leading-relaxed">
            THE MARKETPLACE CAN CREATE INTEREST.
            <br />
            DILIGENCE CREATES UNDERSTANDING.
          </h3>
          <span className="px-3.5 py-1 rounded-[8px] bg-white border border-[#BA1A1A]/30 text-[#BA1A1A] font-heading font-bold text-[12px] uppercase tracking-wide">
            MATCH ≠ INVESTMENT RECOMMENDATION.
          </span>
        </div>
      </div>
    </section>
  );
}
