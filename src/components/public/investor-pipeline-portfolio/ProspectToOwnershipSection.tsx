'use client';

export default function ProspectToOwnershipSection() {
  const beforeItems = [
    'Company Context',
    'Funding Need',
    'Evidence & Traction',
    'Diligence',
    'Proposed Terms',
  ];

  const afterItems = [
    'Investment Amount',
    'Ownership',
    'Security / Share Context',
    'Entry Valuation Context',
    'Current Company Updates',
    'Operating Metrics',
    'Documents & Founder Reports',
  ];

  const phases = [
    { phase: 'PHASE 1', title: 'Deal Record' },
    { phase: 'PHASE 2', title: 'Investment Record' },
    { phase: 'PHASE 3', title: 'Ongoing Relationship' },
  ];

  const baselineCards = [
    'Opportunity Match',
    'Diligence Findings',
    'Agreed Terms',
    'Invested Capital',
    'Resulting Ownership',
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#FAF8FF] border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            FROM PROSPECT TO OWNERSHIP
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Closing the investment
            <br />
            changes the questions.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Before investment, the Investor asks whether to participate. After investment, the Investor needs to understand ownership, company progress and what changes over time.
          </p>
        </div>

        {/* Before vs Threshold vs After Spatial Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-11 gap-4 items-center">
          {/* Before Investment (5 cols) */}
          <div className="lg:col-span-5 p-6 sm:p-8 rounded-[28px] bg-white border border-[#E2E1EC] shadow-2xs flex flex-col gap-4">
            <div className="pb-3 border-b border-[rgba(0,0,0,0.06)]">
              <span className="text-[10px] font-bold text-[#747685] uppercase tracking-wider block">
                BEFORE INVESTMENT
              </span>
              <h3 className="font-heading font-bold text-[18px] text-[#1A1B23] mt-1">
                SHOULD WE INVEST?
              </h3>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              {beforeItems.map((item) => (
                <div
                  key={item}
                  className="p-3 rounded-[12px] bg-[#FAF8FF] border border-[#E2E1EC] text-[13px] font-medium text-[#1A1B23]"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Central Threshold: INVESTMENT COMPLETED (1 col) */}
          <div className="lg:col-span-1 flex flex-col items-center justify-center py-4">
            <div className="p-3 rounded-[14px] bg-[#1A1B23] text-white text-center font-heading font-extrabold text-[10px] sm:text-[11px] uppercase tracking-wider shadow-md leading-tight writing-mode-horizontal lg:writing-mode-vertical">
              INVESTMENT COMPLETED
            </div>
          </div>

          {/* After Investment (5 cols) */}
          <div className="lg:col-span-5 p-6 sm:p-8 rounded-[28px] bg-white border-l-4 border-l-[#157A55] border border-[#E2E1EC] shadow-2xs flex flex-col gap-4">
            <div className="pb-3 border-b border-[rgba(0,0,0,0.06)]">
              <span className="text-[10px] font-bold text-[#157A55] uppercase tracking-wider block">
                AFTER INVESTMENT
              </span>
              <h3 className="font-heading font-bold text-[18px] text-[#1A1B23] mt-1">
                WHAT DO WE OWN AND HOW IS THE COMPANY EVOLVING?
              </h3>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              {afterItems.map((item) => (
                <div
                  key={item}
                  className="p-2.5 rounded-[12px] bg-[#E8F8EE]/60 border border-[#157A55]/20 text-[12px] sm:text-[13px] font-medium text-[#1A1B23]"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3-Phase Journey Flow */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {phases.map((p, idx) => (
            <div
              key={p.phase}
              className="p-5 rounded-[20px] bg-white border border-[#E2E1EC] shadow-2xs flex items-center justify-between"
            >
              <div>
                <span className="text-[10px] font-bold text-[#3C61DD] uppercase block">
                  {p.phase}
                </span>
                <h4 className="font-heading font-bold text-[16px] text-[#1A1B23] mt-0.5">
                  {p.title}
                </h4>
              </div>
              {idx < phases.length - 1 && <span className="text-[#3C61DD] font-bold text-[18px]">➔</span>}
            </div>
          ))}
        </div>

        {/* Institutional Memory Note */}
        <div className="p-6 sm:p-8 rounded-[28px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h3 className="font-heading font-extrabold text-[16px] sm:text-[18px] text-[#070707] uppercase tracking-wide">
              THE INVESTMENT DATE SHOULD NOT RESET THE COMPANY CONTEXT.
            </h3>
            <p className="text-[14px] text-[#444654] leading-relaxed max-w-[800px]">
              An institutional record maintains the narrative thread. What was learned during diligence forms the baseline for evaluating future performance.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {baselineCards.map((c) => (
              <div
                key={c}
                className="p-3.5 rounded-[14px] bg-[#FAF8FF] border border-[#E2E1EC] text-center text-[12px] font-bold text-[#1A1B23]"
              >
                {c}
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-[rgba(0,0,0,0.06)] text-center text-[13px] font-bold text-[#747685]">
            Closing ends the transaction process. It starts the ownership relationship.
          </div>
        </div>
      </div>
    </section>
  );
}
