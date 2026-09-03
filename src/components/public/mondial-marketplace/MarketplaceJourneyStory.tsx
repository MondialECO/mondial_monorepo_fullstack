'use client';

export default function MarketplaceJourneyStory() {
  const storySteps = [
    { num: '01', title: 'STRUCTURE', desc: 'Each role builds meaningful context.' },
    { num: '02', title: 'PUBLISH', desc: 'The appropriate opportunity becomes discoverable.' },
    { num: '03', title: 'DISCOVER', desc: 'Browse or receive relevant matches.' },
    { num: '04', title: 'UNDERSTAND', desc: 'See what the opportunity represents.' },
    { num: '05', title: 'CONNECT', desc: 'Express appropriate interest.' },
    { num: '06', title: 'CONTROL ACCESS', desc: 'Share deeper information where relevant.' },
    { num: '07', title: 'MOVE FORWARD', desc: 'Enter the correct Mondial workflow.' },
  ];

  const equationStack = [
    'STRUCTURED OPPORTUNITY',
    'TRUSTED PROFILE CONTEXT',
    'RELEVANT DISCOVERY',
    'CONTROLLED ACCESS',
    'MEANINGFUL CONNECTION',
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#FAF8FF] border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            MONDIAL MARKETPLACE
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Discover what the ecosystem
            <br />
            can become together.
          </h2>
        </div>

        {/* 7-Step Story + Value Stack Equation Side-by-Side (7 / 5 Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* 7 Steps (7 cols) */}
          <div className="lg:col-span-7 p-6 sm:p-8 rounded-[28px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col gap-3">
            <span className="text-[11px] font-bold text-[#747685] uppercase tracking-wider mb-2">
              7-STEP MARKETPLACE JOURNEY
            </span>

            <div className="space-y-2">
              {storySteps.map((st) => (
                <div
                  key={st.num}
                  className="p-3.5 rounded-[14px] bg-[#FAF8FF] border border-[#E2E1EC] flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-white text-[#3C61DD] font-heading font-bold text-[11px] flex items-center justify-center border border-[#E2E1EC]">
                      {st.num}
                    </span>
                    <span className="font-heading font-extrabold text-[13px] text-[#1A1B23]">
                      {st.title}
                    </span>
                  </div>
                  <span className="text-[12px] text-[#444654] text-right">
                    {st.desc}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Equation Stack (5 cols) */}
          <div className="lg:col-span-5 p-6 sm:p-8 rounded-[28px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-4 text-center">
            <span className="text-[11px] font-bold text-[#747685] uppercase tracking-wider">
              VALUE STACK
            </span>

            <div className="flex flex-col items-center gap-2 py-4">
              {equationStack.map((item, idx) => (
                <div key={item} className="flex flex-col items-center gap-2 w-full">
                  <div
                    className={`w-full p-3.5 rounded-[14px] text-center font-heading font-bold text-[12px] sm:text-[13px] border ${
                      idx === equationStack.length - 1
                        ? 'bg-[#3C61DD] text-white border-[#3C61DD] shadow-xs'
                        : 'bg-[#FAF8FF] text-[#1A1B23] border-[#E2E1EC]'
                    }`}
                  >
                    {item}
                  </div>
                  {idx < equationStack.length - 1 && (
                    <span className="text-[#3C61DD] font-bold text-[14px]">↓</span>
                  )}
                </div>
              ))}
            </div>

            <div className="text-[11px] text-[#747685]">
              Ecosystem connection architecture
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
