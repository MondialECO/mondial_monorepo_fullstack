'use client';

export default function MarketplaceRelationshipRouting() {
  const routes = [
    {
      title: 'Creator Project',
      tag: 'IP & COLLABORATION',
      color: '#3C61DD',
      steps: ['DISCOVER', 'EXPRESS INTEREST', 'CONVERSATION', 'FULL BUYOUT OR CO-FOUNDER / EQUITY'],
    },
    {
      title: 'Service',
      tag: 'B2B VENDORS',
      color: '#8B5CF6',
      steps: ['DISCOVER', 'REQUEST PROPOSAL', 'AGREEMENT', 'CONTRACT / ESCROW', 'DELIVERY'],
    },
    {
      title: 'Company / Funding',
      tag: 'CAPITAL ALLOCATION',
      color: '#157A55',
      steps: ['DISCOVER', 'INVESTOR INTEREST', 'FOUNDER MEETING', 'ACCESS', 'DILIGENCE', 'INVESTMENT PROCESS'],
    },
    {
      title: 'Profile',
      tag: 'NETWORK TALENT',
      color: '#1A47C3',
      steps: ['DISCOVER', 'UNDERSTAND CONTEXT', 'CONNECT', 'RELEVANT ROLE WORKFLOW'],
    },
  ];

  const equationSteps = [
    'DISCOVERY',
    'RELATIONSHIP',
    'STRUCTURED PROCESS',
    'OUTCOME',
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#747685] uppercase tracking-wider">
            DISCOVERY IS ONLY THE FIRST MOVE
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Every opportunity type needs
            <br />
            a different next step.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Mondial Marketplace should route a relevant discovery into the workflow that matches the relationship being explored.
          </p>
        </div>

        {/* Central Router Hub */}
        <div className="p-6 sm:p-8 rounded-[28px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-xs flex flex-col items-center gap-6 text-center">
          <span className="text-[10px] font-bold text-[#747685] uppercase tracking-wider">
            INTO THE CORRECT MONDIAL JOURNEY
          </span>
          <div className="p-4 sm:p-5 rounded-[20px] bg-[#1A1B23] text-white font-heading font-extrabold text-[18px] sm:text-[20px] tracking-wide shadow-md">
            MARKETPLACE
          </div>
          <span className="text-[11px] font-extrabold text-[#3C61DD] uppercase tracking-wider">
            ROUTES THE CONNECTION
          </span>
        </div>

        {/* 4 Parallel Journey Lanes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {routes.map((r) => (
            <div
              key={r.title}
              className="p-6 sm:p-7 rounded-[26px] bg-white border border-[#E2E1EC] shadow-2xs flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-[rgba(0,0,0,0.05)]">
                  <h3 className="font-heading font-bold text-[18px] text-[#1A1B23]">
                    {r.title}
                  </h3>
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                    style={{ color: r.color, backgroundColor: `${r.color}15` }}
                  >
                    {r.tag}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-4 text-[10px] sm:text-[11px] font-bold text-[#1A1B23]">
                  {r.steps.map((st, idx) => (
                    <span key={st} className="flex items-center gap-1.5">
                      <span className="px-2.5 py-1 rounded bg-[#FAF8FF] border border-[#E2E1EC]">
                        {st}
                      </span>
                      {idx < r.steps.length - 1 && <span className="text-[#3C61DD]">➔</span>}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Ambient Communication Layer Note */}
        <div className="p-4 rounded-[16px] bg-[#FAF8FF] border border-[#E2E1EC] text-center text-[12px] font-medium text-[#444654]">
          Ambient communication layer connects relationships post-interest
        </div>

        {/* Section Statement & Bottom Equation */}
        <div className="p-6 sm:p-8 rounded-[28px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-xs flex flex-col items-center text-center gap-4">
          <h3 className="font-heading font-extrabold text-[15px] sm:text-[18px] text-[#070707] uppercase tracking-wide leading-relaxed">
            MONDIAL DOES NOT TRY TO COMPLETE EVERY RELATIONSHIP INSIDE A LISTING.
            <br />
            THE MARKETPLACE STARTS THE RIGHT JOURNEY.
          </h3>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-[11px] sm:text-[12px] font-bold text-[#1A1B23]">
            {equationSteps.map((st, idx) => (
              <span key={st} className="flex items-center gap-2">
                <span className="px-3.5 py-1.5 rounded-[8px] bg-white border border-[#E2E1EC]">
                  {st}
                </span>
                {idx < equationSteps.length - 1 && <span className="text-[#3C61DD]">➔</span>}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
