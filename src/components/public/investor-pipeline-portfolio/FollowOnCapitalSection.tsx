'use client';

export default function FollowOnCapitalSection() {
  const fourQuestions = [
    {
      num: '01',
      tag: 'THESIS',
      q: '"Does the company still fit why we originally invested?"',
    },
    {
      num: '02',
      tag: 'PROGRESS',
      q: '"What changed since the last round?"',
    },
    {
      num: '03',
      tag: 'OWNERSHIP',
      q: '"How could another financing change our stake?"',
    },
    {
      num: '04',
      tag: 'CAPITAL',
      q: '"Does additional investment fit current strategy and capacity?"',
    },
  ];

  const cycleSteps = [
    { num: '01', title: 'ORIGINAL THESIS' },
    { num: '02', title: 'INITIAL INVESTMENT' },
    { num: '03', title: 'COMPANY EXECUTION' },
    { num: '04', title: 'PORTFOLIO UPDATES' },
    { num: '05', title: 'NEW FINANCING NEED' },
    { num: '06', title: 'FOLLOW-ON REVIEW' },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#FAF8FF] border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            THE NEXT CAPITAL DECISION
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Investing once does not
            <br />
            answer what to do next.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            When a portfolio company raises again, the Investor can compare current company evidence with the original thesis and investment context before considering another decision.
          </p>
        </div>

        {/* 4 Questions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {fourQuestions.map((item) => (
            <div
              key={item.num}
              className="p-6 rounded-[22px] bg-white border border-[#E2E1EC] shadow-2xs flex flex-col justify-between gap-4"
            >
              <div>
                <span className="text-[10px] font-bold text-[#3C61DD]">{item.num}</span>
                <span className="px-2 py-0.5 rounded bg-[#FAF8FF] text-[#3C61DD] text-[10px] font-bold uppercase ml-2">
                  {item.tag}
                </span>
                <p className="font-heading font-bold text-[14px] sm:text-[15px] text-[#1A1B23] mt-3 leading-snug">
                  {item.q}
                </p>
              </div>
              <div className="text-[10px] text-[#747685]">Strategic Inquiry</div>
            </div>
          ))}
        </div>

        {/* The Evaluation Cycle */}
        <div className="p-6 sm:p-8 rounded-[28px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col gap-6">
          <span className="text-[11px] font-bold text-[#747685] uppercase tracking-wider">
            The Evaluation Cycle
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {cycleSteps.map((st, idx) => (
              <div
                key={st.num}
                className="p-4 rounded-[16px] bg-[#FAF8FF] border border-[#E2E1EC] flex flex-col justify-between gap-3 text-center"
              >
                <span className="w-5 h-5 rounded-full bg-white text-[#3C61DD] font-bold text-[10px] mx-auto flex items-center justify-center border border-[#E2E1EC]">
                  {st.num}
                </span>
                <span className="font-heading font-bold text-[11px] text-[#1A1B23] leading-tight">
                  {st.title}
                </span>
                {idx < cycleSteps.length - 1 ? (
                  <span className="text-[#3C61DD] text-[12px] hidden lg:block">➔</span>
                ) : (
                  <span className="text-[#157A55] text-[12px] font-bold hidden lg:block">GATE</span>
                )}
              </div>
            ))}
          </div>

          {/* Decision Split: FOLLOW ON or DO NOT FOLLOW ON */}
          <div className="pt-4 border-t border-[rgba(0,0,0,0.06)] flex flex-col sm:flex-row items-center justify-center gap-4">
            <span className="px-5 py-2.5 rounded-[12px] bg-[#E8F8EE] border border-[#157A55]/30 text-[#157A55] font-heading font-bold text-[13px]">
              FOLLOW ON
            </span>
            <span className="text-[12px] font-bold text-[#747685]">OR</span>
            <span className="px-5 py-2.5 rounded-[12px] bg-[#FAF8FF] border border-[#E2E1EC] text-[#BA1A1A] font-heading font-bold text-[13px]">
              DO NOT FOLLOW ON
            </span>
          </div>
        </div>

        {/* Follow-on Principle & Equation */}
        <div className="p-6 sm:p-8 rounded-[28px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col items-center text-center gap-4">
          <div className="flex items-center gap-3 text-[14px] sm:text-[16px] font-heading font-extrabold text-[#1A1B23]">
            <span>PAST INVESTMENT</span>
            <span className="text-[#BA1A1A]">≠</span>
            <span>FUTURE INVESTMENT</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] sm:text-[12px] font-bold text-[#1A1B23]">
            <span className="px-3.5 py-1.5 rounded-[8px] bg-[#FAF8FF] border border-[#E2E1EC]">
              NEW INFORMATION
            </span>
            <span className="text-[#3C61DD]">+</span>
            <span className="px-3.5 py-1.5 rounded-[8px] bg-[#FAF8FF] border border-[#E2E1EC]">
              CURRENT THESIS
            </span>
            <span className="text-[#3C61DD]">+</span>
            <span className="px-3.5 py-1.5 rounded-[8px] bg-[#FAF8FF] border border-[#E2E1EC]">
              PORTFOLIO CONTEXT
            </span>
            <span className="text-[#3C61DD]">➔</span>
            <span className="px-4 py-1.5 rounded-[8px] bg-[#1A47C3] text-white shadow-xs">
              NEW DECISION
            </span>
          </div>

          <h3 className="font-heading font-extrabold text-[15px] sm:text-[18px] text-[#070707] uppercase tracking-wide pt-2">
            FOLLOW-ON CAPITAL SHOULD BE A NEW DECISION. NOT AN AUTOMATIC HABIT.
          </h3>
        </div>
      </div>
    </section>
  );
}
