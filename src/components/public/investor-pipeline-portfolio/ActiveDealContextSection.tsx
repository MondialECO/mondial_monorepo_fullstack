'use client';

export default function ActiveDealContextSection() {
  const stages = [
    {
      num: '01',
      stage: 'NEW MATCH',
      title: 'Company & Founder',
      desc: 'Initial semantic alignment and founder profile verified.',
    },
    {
      num: '02',
      stage: 'IN REVIEW',
      title: 'Investment Thesis Fit',
      desc: 'Evaluating market size, traction, and strategic alignment.',
    },
    {
      num: '03',
      stage: 'NDA SIGNED',
      title: 'Meeting & Access History',
      desc: 'Confidentiality conditions established for deeper access.',
    },
    {
      num: '04',
      stage: 'DATA ROOM',
      title: 'Diligence Questions & Docs',
      desc: 'Financials, cap table, and technical architecture under review.',
    },
    {
      num: '05',
      stage: 'TERM SHEET',
      title: 'Term Context',
      desc: 'Valuation, governance, and economics proposed.',
    },
    {
      num: '06',
      stage: 'NEGOTIATION',
      title: 'Legal & Commercial Alignment',
      desc: 'Refining definitive terms and documentation with founders.',
    },
    {
      num: '07',
      stage: 'DECISION',
      title: 'Decision Notes',
      desc: 'Final outcome rationale recorded for institutional memory.',
    },
  ];

  const equationTerms = [
    'OPPORTUNITY',
    'HISTORY',
    'CURRENT STAGE',
    'INVESTMENT CONTEXT',
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#FAF8FF] border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            ACTIVE DEAL CONTEXT
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            A deal should not become a
            <br />
            collection of forgotten conversations.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            The Investor Pipeline keeps the current stage and decision context of active opportunities connected from first match through final outcome.
          </p>
        </div>

        {/* 7-Stage Pipeline Context Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
          {stages.map((st) => (
            <div
              key={st.stage}
              className="p-4 sm:p-5 rounded-[20px] bg-white border border-[#E2E1EC] shadow-2xs flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#3C61DD]">{st.num}</span>
                  <span className="w-2 h-2 rounded-full bg-[#3C61DD]/40" />
                </div>
                <h3 className="font-heading font-extrabold text-[12px] sm:text-[13px] text-[#1A1B23] tracking-wide mt-2">
                  {st.stage}
                </h3>
              </div>

              <div className="pt-2 border-t border-[rgba(0,0,0,0.05)]">
                <span className="text-[11px] font-bold text-[#1A1B23] block">
                  {st.title}
                </span>
                <p className="text-[11px] text-[#444654] mt-1 leading-relaxed">
                  {st.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Decision Split: INVESTED vs NOT INVESTED */}
        <div className="p-6 sm:p-8 rounded-[24px] bg-white border border-[#E2E1EC] shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col gap-1 max-w-[480px]">
            <span className="text-[10px] font-bold text-[#747685] uppercase tracking-wider">
              STAGE 07 OUTCOME
            </span>
            <h4 className="font-heading font-bold text-[18px] text-[#1A1B23]">
              The Dual Outcome Gateway
            </h4>
            <p className="text-[13px] text-[#444654]">
              Every active opportunity reaches a definitive, recorded conclusion.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="px-5 py-3 rounded-[12px] bg-[#E8F8EE] border border-[#157A55]/30 text-[#157A55] font-heading font-bold text-[13px] flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#157A55]" />
              <span>INVESTED</span>
            </div>

            <span className="text-[12px] font-bold text-[#747685]">or</span>

            <div className="px-5 py-3 rounded-[12px] bg-[#FFDAD6]/40 border border-[#BA1A1A]/30 text-[#BA1A1A] font-heading font-bold text-[13px] flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#BA1A1A]" />
              <span>NOT INVESTED</span>
            </div>
          </div>
        </div>

        {/* Section Statement & Equation */}
        <div className="p-6 sm:p-8 rounded-[28px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col items-center text-center gap-4">
          <h3 className="font-heading font-extrabold text-[15px] sm:text-[18px] text-[#070707] uppercase tracking-wide">
            THE STAGE IS ONLY USEFUL IF THE CONTEXT MOVES WITH IT.
          </h3>

          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] sm:text-[12px] font-bold text-[#1A1B23]">
            {equationTerms.map((term, idx) => (
              <span key={term} className="flex items-center gap-2">
                <span className="px-3.5 py-1.5 rounded-[8px] bg-[#FAF8FF] border border-[#E2E1EC]">
                  {term}
                </span>
                {idx < equationTerms.length - 1 && <span className="text-[#3C61DD]">➔</span>}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
