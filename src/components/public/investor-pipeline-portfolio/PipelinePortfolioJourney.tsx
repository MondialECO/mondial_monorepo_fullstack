'use client';

export default function PipelinePortfolioJourney() {
  const phase1Steps = [
    { num: '01', title: 'NEW MATCH' },
    { num: '02', title: 'REVIEW' },
    { num: '03', title: 'FOUNDER' },
    { num: '04', title: 'NDA' },
    { num: '05', title: 'DATA ROOM' },
    { num: '06', title: 'DILIGENCE' },
    { num: '07', title: 'TERM SHEET' },
    { num: '08', title: 'NEGOTIATION' },
    { num: '09', title: 'DECISION' },
  ];

  const phase2Steps = [
    { num: '10', title: 'OWNERSHIP' },
    { num: '11', title: 'COMPANY UPDATES' },
    { num: '12', title: 'METRICS' },
    { num: '13', title: 'FOUNDER REPORTING' },
    { num: '14', title: 'NEW COMPANY EVENTS' },
    { num: '15', title: 'FOLLOW-ON CONTEXT' },
    { num: '16', title: 'ONGOING PORTFOLIO RELATIONSHIP' },
  ];

  const equationTerms = [
    'DECISION HISTORY',
    'OWNERSHIP',
    'COMPANY DATA',
    'ONGOING UPDATES',
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#FAF8FF] border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            PIPELINE &amp; PORTFOLIO
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Every investment has a
            <br />
            before and an after.
          </h2>
        </div>

        {/* Connected Investment Context Equation */}
        <div className="p-6 sm:p-8 rounded-[28px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col items-center text-center gap-4">
          <span className="text-[10px] font-bold text-[#747685] uppercase tracking-wider">
            CONNECTED CONTEXT FORMULA
          </span>

          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] sm:text-[12px] font-bold text-[#1A1B23]">
            {equationTerms.map((term, idx) => (
              <span key={term} className="flex items-center gap-2">
                <span className="px-3.5 py-1.5 rounded-[8px] bg-[#FAF8FF] border border-[#E2E1EC]">
                  {term}
                </span>
                {idx < equationTerms.length - 1 ? (
                  <span className="text-[#3C61DD]">+</span>
                ) : (
                  <span className="text-[#3C61DD]">➔</span>
                )}
              </span>
            ))}
            <span className="px-4 py-1.5 rounded-[8px] bg-[#1A47C3] text-white shadow-xs">
              CONNECTED INVESTMENT CONTEXT
            </span>
          </div>
        </div>

        {/* Phase 1 (Before) -> Threshold -> Phase 2 (After) */}
        <div className="flex flex-col gap-6">
          {/* Phase 1: Before */}
          <div className="p-6 sm:p-8 rounded-[28px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col gap-4">
            <span className="text-[11px] font-bold text-[#747685] uppercase tracking-wider">
              PHASE 1: BEFORE
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-2">
              {phase1Steps.map((st) => (
                <div
                  key={st.num}
                  className="p-3 rounded-[12px] bg-[#FAF8FF] border border-[#E2E1EC] flex flex-col items-center justify-center text-center gap-1"
                >
                  <span className="text-[10px] font-bold text-[#3C61DD]">{st.num}</span>
                  <span className="font-heading font-extrabold text-[11px] text-[#1A1B23]">
                    {st.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Central Threshold */}
          <div className="flex items-center justify-center py-2">
            <div className="px-6 py-3 rounded-[14px] bg-[#1A1B23] text-white font-heading font-extrabold text-[12px] uppercase tracking-wider shadow-md">
              INVESTMENT COMPLETED
            </div>
          </div>

          {/* Phase 2: After */}
          <div className="p-6 sm:p-8 rounded-[28px] bg-white border-l-4 border-l-[#157A55] border border-[#E2E1EC] shadow-xs flex flex-col gap-4">
            <span className="text-[11px] font-bold text-[#157A55] uppercase tracking-wider">
              PHASE 2: AFTER
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
              {phase2Steps.map((st) => (
                <div
                  key={st.num}
                  className="p-3 rounded-[12px] bg-[#E8F8EE]/60 border border-[#157A55]/20 flex flex-col items-center justify-center text-center gap-1"
                >
                  <span className="text-[10px] font-bold text-[#157A55]">{st.num}</span>
                  <span className="font-heading font-extrabold text-[11px] text-[#1A1B23]">
                    {st.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
