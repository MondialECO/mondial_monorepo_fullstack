'use client';

export default function DecisionOutcomeSection() {
  const preDecisionFlow = [
    'RELEVANT MATCH',
    'DISCOVERY',
    'FOUNDER MEETING',
    'DILIGENCE',
    'TERMS DISCUSSION',
    'DECISION',
  ];

  const doNotInvestReasons = [
    'Thesis changed',
    'Evidence insufficient',
    'Terms did not align',
    'Round no longer fits',
    'Timing changed',
    'Founder and Investor chose not to proceed',
  ];

  const investReasons = [
    'Thesis Alignment',
    'Evidence Reviewed',
    'Terms Agreed',
    'Investment Decision',
  ];

  const memoryCards = [
    {
      title: 'Decision History',
      desc: 'Complete timeline of stages, interactions, and milestones reached prior to closing.',
    },
    {
      title: 'Relevant Notes',
      desc: 'Institutional rationale, diligence findings, and key takeaways for future reference.',
    },
    {
      title: 'Relationship Context',
      desc: 'Preserved founder connection for potential future rounds or strategic alignment.',
    },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#747685] uppercase tracking-wider">
            DECISION IS THE OUTCOME
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            A disciplined “no” can be as
            <br />
            important as a confident “yes.”
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            The purpose of the investment process is not to push every matched opportunity toward funding. It is to create enough understanding to make a clearer decision.
          </p>
        </div>

        {/* Linear Decision Flow */}
        <div className="p-4 sm:p-5 rounded-[20px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-2xs flex flex-wrap items-center justify-center gap-2 text-[11px] sm:text-[12px] font-bold text-[#1A1B23]">
          {preDecisionFlow.map((st, idx) => (
            <span key={st} className="flex items-center gap-2">
              <span className={`px-3 py-1.5 rounded-[8px] border ${
                st === 'DECISION'
                  ? 'bg-[#1A1B23] text-white border-[#1A1B23] shadow-xs'
                  : 'bg-white border-[#E2E1EC]'
              }`}>
                {st}
              </span>
              {idx < preDecisionFlow.length - 1 && <span className="text-[#3C61DD]">➔</span>}
            </span>
          ))}
        </div>

        {/* Split Outcomes: Path A (Do Not Invest) vs Path B (Invest) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {/* Path A: DO NOT INVEST */}
          <div className="p-6 sm:p-8 rounded-[28px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(0,0,0,0.06)]">
                <span className="px-3 py-1 rounded-full bg-[#FFDAD6]/50 text-[#BA1A1A] font-heading font-extrabold text-[12px] uppercase">
                  DO NOT INVEST
                </span>
                <span className="text-[10px] font-bold text-[#747685] uppercase">
                  PATH A
                </span>
              </div>

              <div>
                <span className="text-[11px] font-bold text-[#747685] uppercase tracking-wider block mb-3">
                  REASONS INCLUDE:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12px] font-medium text-[#1A1B23]">
                  {doNotInvestReasons.map((r) => (
                    <div key={r} className="p-2.5 rounded-[10px] bg-white border border-[#E2E1EC] flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#BA1A1A]" />
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[rgba(0,0,0,0.06)] flex items-center justify-between">
              <span className="text-[12px] font-bold text-[#444654]">Outcome:</span>
              <span className="px-3.5 py-1.5 rounded-[8px] bg-white border border-[#E2E1EC] text-[#BA1A1A] font-heading font-bold text-[12px] shadow-2xs">
                CLOSED OPPORTUNITY
              </span>
            </div>
          </div>

          {/* Path B: INVEST */}
          <div className="p-6 sm:p-8 rounded-[28px] bg-white border border-[#157A55]/30 shadow-xs flex flex-col justify-between gap-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#157A55]" />
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(0,0,0,0.06)]">
                <span className="px-3 py-1 rounded-full bg-[#E8F8EE] text-[#157A55] font-heading font-extrabold text-[12px] uppercase">
                  INVEST
                </span>
                <span className="text-[10px] font-bold text-[#157A55] uppercase">
                  PATH B
                </span>
              </div>

              <div>
                <span className="text-[11px] font-bold text-[#747685] uppercase tracking-wider block mb-3">
                  REASONING SUPPORTED BY:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12px] font-medium text-[#1A1B23]">
                  {investReasons.map((r) => (
                    <div key={r} className="p-2.5 rounded-[10px] bg-[#FAF8FF] border border-[#E2E1EC] flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#157A55]" />
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[rgba(0,0,0,0.06)] flex items-center justify-between">
              <span className="text-[12px] font-bold text-[#444654]">Outcome:</span>
              <span className="px-3.5 py-1.5 rounded-[8px] bg-[#157A55] text-white font-heading font-bold text-[12px] shadow-2xs">
                PORTFOLIO COMPANY
              </span>
            </div>
          </div>
        </div>

        {/* Section Statement */}
        <div className="p-6 sm:p-8 rounded-[24px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-xs text-center">
          <h3 className="font-heading font-extrabold text-[15px] sm:text-[18px] text-[#070707] uppercase tracking-wide leading-relaxed">
            THE GOAL OF A PIPELINE IS NOT TO MAXIMIZE THE NUMBER OF CLOSED DEALS.
            <br />
            IT IS TO IMPROVE THE QUALITY OF DECISIONS.
          </h3>
        </div>

        {/* Institutional Memory Module */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold text-[#3C61DD] uppercase tracking-wider">
              INSTITUTIONAL MEMORY
            </span>
            <h4 className="font-heading font-bold text-[22px] text-[#1A1B23]">
              Closed without investment still retains critical organizational intelligence.
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {memoryCards.map((card) => (
              <div
                key={card.title}
                className="p-6 rounded-[22px] bg-white border border-[#E2E1EC] shadow-2xs flex flex-col gap-2"
              >
                <h5 className="font-heading font-bold text-[16px] text-[#1A1B23]">
                  {card.title}
                </h5>
                <p className="text-[13px] text-[#444654] leading-relaxed">
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
