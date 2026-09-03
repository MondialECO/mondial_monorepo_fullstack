'use client';

export default function MarketplaceProgressiveAccess() {
  const levels = [
    {
      level: 'LEVEL 01',
      title: 'PUBLIC DISCOVERY',
      tags: ['Opportunity Type', 'Summary', 'Sector / Category', 'Stage', 'High-Level Need'],
    },
    {
      level: 'LEVEL 02',
      title: 'INTEREST',
      desc: 'User communicates why they are interested and what relationship they want to explore.',
    },
    {
      level: 'LEVEL 03',
      title: 'OWNER DECISION',
      desc: 'Creator / Entrepreneur / Provider or owner can:',
      actions: ['CONTINUE', 'DECLINE'],
    },
    {
      level: 'LEVEL 04',
      title: 'CONTROLLED ACCESS',
      tags: ['NDA', 'Permissions', 'Private Documents', 'Deeper Business Context', 'Data Room'],
    },
  ];

  const progressionSteps = [
    'DISCOVERY',
    'INTEREST',
    'PERMISSION',
    'DEEPER CONTEXT',
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#FAF8FF] border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            PROGRESSIVE ACCESS
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Be discoverable without giving away everything.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Marketplace visibility should create enough understanding for someone to express interest while allowing sensitive project, company and personal information to remain controlled.
          </p>
        </div>

        {/* The Layered Reveal: Levels 01 to 04 */}
        <div className="p-6 sm:p-8 rounded-[28px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col gap-6">
          <div>
            <h3 className="font-heading font-bold text-[20px] text-[#1A1B23]">
              The Layered Reveal
            </h3>
            <p className="text-[13px] text-[#444654] mt-1">
              A structured approach to information disclosure, ensuring control at every step of the connection process.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {levels.map((lvl) => (
              <div
                key={lvl.level}
                className="p-5 sm:p-6 rounded-[22px] bg-[#FAF8FF] border border-[#E2E1EC] flex flex-col justify-between gap-3"
              >
                <div>
                  <span className="text-[10px] font-bold text-[#3C61DD] uppercase">
                    {lvl.level}
                  </span>
                  <h4 className="font-heading font-bold text-[15px] text-[#1A1B23] mt-1">
                    {lvl.title}
                  </h4>

                  {lvl.desc && (
                    <p className="text-[12px] text-[#444654] mt-2 leading-relaxed">
                      {lvl.desc}
                    </p>
                  )}

                  {lvl.actions && (
                    <div className="flex gap-2 mt-3 text-[11px] font-bold">
                      <span className="px-2.5 py-1 rounded bg-[#E8F8EE] text-[#157A55]">
                        {lvl.actions[0]}
                      </span>
                      <span className="px-2.5 py-1 rounded bg-[#FFDAD6]/40 text-[#BA1A1A]">
                        {lvl.actions[1]}
                      </span>
                    </div>
                  )}

                  {lvl.tags && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {lvl.tags.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded-[6px] bg-white border border-[#E2E1EC] text-[10px] font-bold text-[#1A1B23]"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Core Equation */}
          <div className="pt-4 border-t border-[rgba(0,0,0,0.06)] flex flex-col items-center gap-3 text-center">
            <div className="flex items-center gap-3 text-[14px] sm:text-[16px] font-heading font-extrabold text-[#1A1B23]">
              <span>PUBLIC DISCOVERY</span>
              <span className="text-[#BA1A1A]">≠</span>
              <span>PRIVATE ACCESS</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-bold text-[#1A1B23]">
              {progressionSteps.map((st, idx) => (
                <span key={st} className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-[8px] bg-[#FAF8FF] border border-[#E2E1EC]">
                    {st}
                  </span>
                  {idx < progressionSteps.length - 1 && <span className="text-[#3C61DD]">➔</span>}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Real-World Examples: Creator Example vs Company Example */}
        <div className="p-6 sm:p-8 rounded-[28px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col gap-6">
          <span className="text-[11px] font-bold text-[#747685] uppercase tracking-wider">
            Architectural Implementation
          </span>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Creator Example */}
            <div className="p-5 sm:p-6 rounded-[22px] bg-[#FAF8FF] border border-[#E2E1EC] flex flex-col gap-4">
              <h4 className="font-heading font-bold text-[16px] text-[#1A1B23]">
                Creator Example
              </h4>

              <div className="grid grid-cols-2 gap-3 text-[12px]">
                <div className="p-3 rounded-[12px] bg-white border border-[#E2E1EC]">
                  <strong className="text-[#157A55] block text-[10px] uppercase mb-1">PUBLIC</strong>
                  <div className="space-y-1 text-[#444654]">
                    <div>Project concept</div>
                    <div>Market context</div>
                    <div>Offer type</div>
                  </div>
                </div>

                <div className="p-3 rounded-[12px] bg-white border border-[#E2E1EC]">
                  <strong className="text-[#BA1A1A] block text-[10px] uppercase mb-1">PRIVATE</strong>
                  <div className="space-y-1 text-[#444654]">
                    <div>Full business plan</div>
                    <div>Sensitive IP detail</div>
                    <div>Detailed documents</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Company Example */}
            <div className="p-5 sm:p-6 rounded-[22px] bg-[#FAF8FF] border border-[#E2E1EC] flex flex-col gap-4">
              <h4 className="font-heading font-bold text-[16px] text-[#1A1B23]">
                Company Example
              </h4>

              <div className="grid grid-cols-2 gap-3 text-[12px]">
                <div className="p-3 rounded-[12px] bg-white border border-[#E2E1EC]">
                  <strong className="text-[#157A55] block text-[10px] uppercase mb-1">PUBLIC</strong>
                  <div className="space-y-1 text-[#444654]">
                    <div>Business summary</div>
                    <div>Stage</div>
                    <div>Funding ask</div>
                  </div>
                </div>

                <div className="p-3 rounded-[12px] bg-white border border-[#E2E1EC]">
                  <strong className="text-[#BA1A1A] block text-[10px] uppercase mb-1">PRIVATE</strong>
                  <div className="space-y-1 text-[#444654]">
                    <div>Financials</div>
                    <div>Cap table</div>
                    <div>Contracts</div>
                    <div>Legal documents</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section Statement */}
        <div className="p-6 sm:p-8 rounded-[24px] bg-white border border-[#E2E1EC] shadow-xs text-center">
          <h3 className="font-heading font-extrabold text-[15px] sm:text-[18px] text-[#070707] uppercase tracking-wide leading-relaxed">
            THE MARKETPLACE SHOULD CREATE ENOUGH CURIOSITY TO CONNECT.
            <br />
            NOT ENOUGH EXPOSURE TO LOSE CONTROL.
          </h3>
        </div>
      </div>
    </section>
  );
}
