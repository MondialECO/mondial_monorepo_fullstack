'use client';

export default function MarketplaceValueTypes() {
  const matrixRows = [
    {
      object: 'PROJECT',
      type: 'Business Concept',
      purpose: 'Validation & Resources',
      actions: 'Explore / Express Interest',
    },
    {
      object: 'SERVICE',
      type: 'Professional Package',
      purpose: 'Execution Support',
      actions: 'Understand / Request Proposal',
    },
    {
      object: 'COMPANY',
      type: 'Entity',
      purpose: 'Funding & Growth',
      actions: 'Review / Investor Interest',
    },
    {
      object: 'PROFILE',
      type: 'Individual',
      purpose: 'Identity & Trust',
      actions: 'Understand / Connect',
    },
  ];

  return (
    <section
      id="value-types"
      className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#FAF8FF] border-b border-[rgba(0,0,0,0.06)] flex justify-center scroll-mt-12"
    >
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            ONE MARKETPLACE. DIFFERENT TYPES OF VALUE.
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            You are not always looking for the same thing.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Mondial brings several types of structured ecosystem opportunities into one discovery layer without pretending that a project, company, service and professional profile are interchangeable.
          </p>
        </div>

        {/* 4 Marketplace Territories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Territory 01: PROJECTS */}
          <div className="p-6 sm:p-8 rounded-[28px] bg-white border border-[#E2E1EC] shadow-2xs flex flex-col justify-between gap-6">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#3C61DD] uppercase">
                  01 / PROJECTS
                </span>
                <span className="text-[10px] font-bold text-[#747685] uppercase">
                  CREATED BY: CREATORS
                </span>
              </div>
              <h3 className="font-heading font-bold text-[22px] text-[#1A1B23]">
                Structured business concepts.
              </h3>
              <div className="flex flex-wrap gap-2 pt-1 text-[11px] font-medium text-[#444654]">
                <span className="px-2.5 py-1 rounded-[6px] bg-[#FAF8FF] border border-[#E2E1EC]">
                  Project intelligence
                </span>
                <span className="px-2.5 py-1 rounded-[6px] bg-[#FAF8FF] border border-[#E2E1EC]">
                  Resource needs
                </span>
                <span className="px-2.5 py-1 rounded-[6px] bg-[#FAF8FF] border border-[#E2E1EC]">
                  Marketplace opportunity
                </span>
              </div>
            </div>

            <div className="p-4 rounded-[16px] bg-[#FAF8FF] border border-[#E2E1EC] flex flex-col gap-2">
              <span className="text-[10px] font-bold text-[#747685] uppercase">
                MVP PATHWAYS
              </span>
              <div className="flex flex-wrap gap-2 text-[12px] font-bold text-[#1A1B23]">
                <span className="px-3 py-1 rounded-[8px] bg-white border border-[#E2E1EC]">
                  FULL BUYOUT
                </span>
                <span className="px-3 py-1 rounded-[8px] bg-white border border-[#E2E1EC]">
                  CO-FOUNDER / EQUITY
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#747685] pt-1">
                <span>Example: Project Echo</span>
                <span className="font-bold text-[#3C61DD]">PHASE: DISCOVERY</span>
              </div>
            </div>
          </div>

          {/* Territory 02: COMPANIES */}
          <div className="p-6 sm:p-8 rounded-[28px] bg-white border border-[#E2E1EC] shadow-2xs flex flex-col justify-between gap-6">
            <div className="flex flex-col gap-3">
              <span className="text-[11px] font-bold text-[#157A55] uppercase">
                02 / COMPANIES
              </span>
              <h3 className="font-heading font-bold text-[22px] text-[#1A1B23]">
                Funding &amp; execution progress.
              </h3>
              <p className="text-[13px] text-[#444654] leading-relaxed">
                Verified context, traction, funding need, and investor readiness.
              </p>
            </div>

            <div className="p-4 rounded-[16px] bg-[#E8F8EE]/60 border border-[#157A55]/20 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#747685] uppercase block">
                  TRACTION
                </span>
                <span className="font-heading font-extrabold text-[22px] text-[#157A55]">
                  +124%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-[8px] bg-white border border-[#157A55]/30 text-[11px] font-bold text-[#157A55]">
                  SEED
                </span>
                <span className="px-3 py-1.5 rounded-[8px] bg-[#157A55] text-white text-[11px] font-bold">
                  READY
                </span>
              </div>
            </div>
          </div>

          {/* Territory 03: SERVICES */}
          <div className="p-6 sm:p-8 rounded-[28px] bg-white border border-[#E2E1EC] shadow-2xs flex flex-col justify-between gap-6">
            <div className="flex flex-col gap-3">
              <span className="text-[11px] font-bold text-[#8B5CF6] uppercase">
                03 / SERVICES
              </span>
              <h3 className="font-heading font-bold text-[22px] text-[#1A1B23]">
                Professional expertise, structured.
              </h3>
              <p className="text-[13px] text-[#444654] leading-relaxed">
                Scope, pricing model, packages, availability, and professional trust.
              </p>
            </div>

            <div className="p-4 rounded-[16px] bg-[#F5F3FF] border border-[#8B5CF6]/20 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#8B5CF6] uppercase">
                  FIXED SCOPE
                </span>
                <span className="text-[10px] font-bold text-[#157A55] px-2 py-0.5 rounded bg-white">
                  TRUST TIER 1
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-heading font-bold text-[15px] text-[#1A1B23]">
                  Go-to-Market Strategy
                </span>
                <span className="font-heading font-extrabold text-[16px] text-[#8B5CF6]">
                  €4.5k
                </span>
              </div>
              <div className="text-[11px] text-[#747685]">Delivery Timeline: 3 WEEKS</div>
            </div>
          </div>

          {/* Territory 04: PROFILES */}
          <div className="p-6 sm:p-8 rounded-[28px] bg-white border border-[#E2E1EC] shadow-2xs flex flex-col justify-between gap-6">
            <div className="flex flex-col gap-3">
              <span className="text-[11px] font-bold text-[#1A47C3] uppercase">
                04 / PROFILES
              </span>
              <h3 className="font-heading font-bold text-[22px] text-[#1A1B23]">
                Understand who is behind an opportunity.
              </h3>
              <p className="text-[13px] text-[#444654] leading-relaxed">
                Creators, Entrepreneurs, Service Providers, and Investors.
              </p>
            </div>

            <div className="p-4 rounded-[16px] bg-[#EBF0FF] border border-[#1A47C3]/20 flex items-center justify-between">
              <div>
                <h4 className="font-heading font-bold text-[15px] text-[#1A1B23]">
                  Alexandre Dubois
                </h4>
                <span className="text-[11px] text-[#444654]">ENTREPRENEUR · PARIS</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-[6px] bg-white text-[10px] font-bold text-[#1A47C3]">
                  FINTECH
                </span>
                <span className="px-2.5 py-1 rounded-[6px] bg-[#1A47C3] text-[10px] font-bold text-white">
                  2 EXITS
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Relationship Architecture Matrix */}
        <div className="p-6 sm:p-8 rounded-[28px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col gap-6">
          <span className="text-[11px] font-bold text-[#747685] uppercase tracking-wider">
            RELATIONSHIP ARCHITECTURE
          </span>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-[#E2E1EC] text-[11px] font-bold text-[#747685] uppercase tracking-wider">
                  <th className="pb-3 pr-4">MARKETPLACE OBJECT</th>
                  <th className="pb-3 px-4">HAS A TYPE</th>
                  <th className="pb-3 px-4">HAS A PURPOSE</th>
                  <th className="pb-3 pl-4">HAS RELEVANT ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(0,0,0,0.05)] font-medium text-[#1A1B23]">
                {matrixRows.map((r) => (
                  <tr key={r.object} className="hover:bg-[#FAF8FF] transition-colors">
                    <td className="py-3.5 pr-4 font-heading font-bold text-[#3C61DD]">
                      {r.object}
                    </td>
                    <td className="py-3.5 px-4 text-[#444654]">{r.type}</td>
                    <td className="py-3.5 px-4 text-[#444654]">{r.purpose}</td>
                    <td className="py-3.5 pl-4 font-bold text-[#1A1B23]">{r.actions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section Statement */}
        <div className="p-6 sm:p-8 rounded-[24px] bg-white border border-[#E2E1EC] shadow-xs text-center">
          <h3 className="font-heading font-extrabold text-[15px] sm:text-[18px] text-[#070707] uppercase tracking-wide leading-relaxed">
            ONE DISCOVERY LAYER DOES NOT MEAN ONE GENERIC CARD FOR EVERYTHING.
          </h3>
        </div>
      </div>
    </section>
  );
}
