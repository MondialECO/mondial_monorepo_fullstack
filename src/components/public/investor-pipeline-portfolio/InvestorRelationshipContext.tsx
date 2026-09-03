'use client';

export default function InvestorRelationshipContext() {
  const contextNodes = [
    {
      title: 'Ownership',
      desc: 'What stake does the Investor hold?',
    },
    {
      title: 'Company Performance',
      desc: 'What has changed operationally?',
    },
    {
      title: 'Founder Communication',
      desc: 'What is the Founder reporting?',
    },
    {
      title: 'Documents',
      desc: 'What new information has been shared?',
    },
  ];

  const supportExamples = [
    'Introductions',
    'Strategic Perspective',
    'Hiring Network',
    'Future Funding Context',
    'Board / Governance Participation (where applicable)',
  ];

  const loopSteps = [
    'FOUNDER UPDATE',
    'INVESTOR UNDERSTANDING',
    'QUESTION / SUPPORT',
    'COMPANY CONTEXT',
    'NEXT UPDATE',
  ];

  const bottomPrinciples = [
    'RIGHT INVESTOR',
    'RIGHT COMPANY',
    'RIGHT INFORMATION',
    'RIGHT ACCESS',
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#747685] uppercase tracking-wider">
            BEYOND OWNERSHIP
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            The Investor owns a stake.
            <br />
            The relationship still needs context.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Mondial can keep ownership, company information, founder updates and relevant requests connected throughout the investment relationship.
          </p>
        </div>

        {/* Central Portfolio Hub: Nova Space SAS (Center) + 4 Nodes */}
        <div className="p-6 sm:p-10 rounded-[28px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-xs flex flex-col items-center gap-8">
          {/* Central Hub Profile */}
          <div className="p-6 sm:p-8 rounded-[24px] bg-white border border-[#E2E1EC] shadow-sm text-center max-w-[440px] w-full flex flex-col items-center gap-3">
            <span className="text-[10px] font-bold text-[#747685] uppercase tracking-wider">
              PORTFOLIO COMPANY
            </span>
            <h3 className="font-heading font-extrabold text-[22px] sm:text-[26px] text-[#1A1B23]">
              NOVA SPACE SAS
            </h3>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-[#EBF0FF] text-[#1A47C3] font-bold text-[10px] uppercase tracking-wider">
                AEROSPACE
              </span>
              <span className="px-3 py-1 rounded-full bg-[#FAF8FF] border border-[#E2E1EC] text-[#747685] font-bold text-[10px] uppercase tracking-wider">
                SERIES A
              </span>
            </div>
          </div>

          {/* 4 Connected Context Nodes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
            {contextNodes.map((n) => (
              <div
                key={n.title}
                className="p-5 sm:p-6 rounded-[20px] bg-white border border-[#E2E1EC] shadow-2xs flex flex-col justify-between gap-3"
              >
                <div>
                  <h4 className="font-heading font-bold text-[16px] text-[#1A1B23]">
                    {n.title}
                  </h4>
                  <p className="text-[12px] text-[#444654] mt-1">
                    {n.desc}
                  </p>
                </div>
                <div className="text-[10px] text-[#747685]">Connected Context</div>
              </div>
            ))}
          </div>
        </div>

        {/* Investor Support Context */}
        <div className="p-6 sm:p-8 rounded-[28px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-2xs flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-[#747685] uppercase tracking-wider">
              DEPENDS ON THE INVESTOR RELATIONSHIP
            </span>
            <h3 className="font-heading font-bold text-[22px] text-[#1A1B23]">
              Investor Support Context
            </h3>
            <p className="text-[14px] text-[#444654]">
              Potential contextual contribution beyond capital.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {supportExamples.map((ex) => (
              <div
                key={ex}
                className="p-4 rounded-[16px] bg-white border border-[#E2E1EC] text-[12px] font-bold text-[#1A1B23] flex items-center gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#3C61DD]" />
                <span>{ex}</span>
              </div>
            ))}
          </div>
        </div>

        {/* The Contextual Loop */}
        <div className="p-6 sm:p-8 rounded-[28px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col items-center gap-4 text-center">
          <span className="text-[11px] font-bold text-[#747685] uppercase tracking-wider">
            The Contextual Loop
          </span>

          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] sm:text-[12px] font-bold text-[#1A1B23]">
            {loopSteps.map((st, idx) => (
              <span key={st} className="flex items-center gap-2">
                <span className="px-3.5 py-1.5 rounded-[8px] bg-[#FAF8FF] border border-[#E2E1EC]">
                  {st}
                </span>
                {idx < loopSteps.length - 1 ? (
                  <span className="text-[#3C61DD]">➔</span>
                ) : (
                  <span className="text-[#157A55]">↺</span>
                )}
              </span>
            ))}
          </div>

          <div className="pt-3">
            <h3 className="font-heading font-extrabold text-[15px] sm:text-[17px] text-[#070707] uppercase tracking-wide">
              PORTFOLIO MANAGEMENT IS NOT ONLY TRACKING NUMBERS.
              <br />
              IT IS MAINTAINING THE CONTEXT AROUND OWNERSHIP.
            </h3>
          </div>
        </div>

        {/* Bottom 4 Principles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {bottomPrinciples.map((pr) => (
            <div
              key={pr}
              className="p-3.5 rounded-[14px] bg-[#FAF8FF] border border-[#E2E1EC] text-center font-heading font-bold text-[11px] sm:text-[12px] text-[#1A1B23]"
            >
              {pr}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
