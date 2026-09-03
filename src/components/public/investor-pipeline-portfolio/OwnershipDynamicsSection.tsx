'use client';

export default function OwnershipDynamicsSection() {
  const scenarioPoints = [
    {
      badge: 'ENTRY',
      title: 'Before Investment',
      desc: 'Initial state prior to capital injection.',
      metricLabel: 'Investor ownership:',
      metricVal: '0%',
    },
    {
      badge: 'OWNERSHIP',
      title: 'Seed Investment',
      desc: 'Horizon Capital invests €500K.',
      metricLabel: 'Illustrative ownership:',
      metricVal: '8.0%',
      highlight: true,
    },
    {
      badge: 'COMPANY EVENT',
      title: 'Later Financing',
      desc: 'New capital enters the company, altering the cap table structure.',
      metricLabel: null,
      metricVal: null,
    },
    {
      badge: 'UPDATED CONTEXT',
      title: 'Updated Context',
      desc: 'Resulting ownership post-financing event.',
      metricLabel: 'Diluted ownership:',
      metricVal: '6.9%',
    },
  ];

  const distinctions = [
    {
      num: 'DISTINCTION 01',
      text: 'Investment Amount ≠ Current Ownership Value',
      desc: 'Historical invested capital does not equal live fair market valuation.',
    },
    {
      num: 'DISTINCTION 02',
      text: 'Original Ownership ≠ Permanent Ownership',
      desc: 'Initial percentage stake evolves with subsequent equity events and share issuances.',
    },
  ];

  const factors = [
    'New Financing',
    'Option Pool Changes',
    'Security Conversion',
    'Secondary Transactions',
    'Other Equity Events',
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#747685] uppercase tracking-wider">
            UNDERSTAND THE STAKE
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Ownership is not just
            <br />
            one percentage forever.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            A portfolio view should connect the original investment with the ownership context that results and how later company events may change that context.
          </p>
        </div>

        {/* Illustrative Scenario Card */}
        <div className="p-6 sm:p-8 lg:p-10 rounded-[28px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-xs flex flex-col gap-8">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[rgba(0,0,0,0.06)]">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-[#747685] uppercase">
                PORTFOLIO CASE STUDY
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#3C61DD]" />
              <h3 className="font-heading font-extrabold text-[18px] text-[#1A1B23]">
                NOVA SPACE SAS
              </h3>
            </div>
            <span className="px-3 py-1 rounded-full bg-white border border-[#E2E1EC] text-[10px] font-bold text-[#747685] uppercase">
              ILLUSTRATIVE SCENARIO ONLY
            </span>
          </div>

          {/* 4-Point Timeline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {scenarioPoints.map((pt) => (
              <div
                key={pt.badge}
                className={`p-6 rounded-[22px] border flex flex-col justify-between gap-4 ${
                  pt.highlight
                    ? 'bg-white border-[#3C61DD] shadow-sm'
                    : 'bg-white border-[#E2E1EC] shadow-2xs'
                }`}
              >
                <div>
                  <span className="px-2.5 py-1 rounded-[6px] bg-[#FAF8FF] border border-[#E2E1EC] text-[10px] font-extrabold text-[#3C61DD] uppercase">
                    {pt.badge}
                  </span>
                  <h4 className="font-heading font-bold text-[16px] text-[#1A1B23] mt-3">
                    {pt.title}
                  </h4>
                  <p className="text-[12px] text-[#444654] mt-1 leading-relaxed">
                    {pt.desc}
                  </p>
                </div>

                {pt.metricVal && (
                  <div className="p-3 rounded-[12px] bg-[#FAF8FF] border border-[#E2E1EC]">
                    <span className="text-[10px] text-[#747685] block">{pt.metricLabel}</span>
                    <strong className="font-heading font-extrabold text-[20px] text-[#1A1B23] mt-0.5 block">
                      {pt.metricVal}
                    </strong>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center text-[13px] font-bold text-[#1A1B23] pt-2">
            Ownership should be understood as of a point in time.
          </div>
        </div>

        {/* 2 Distinctions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {distinctions.map((d) => (
            <div
              key={d.num}
              className="p-6 sm:p-8 rounded-[24px] bg-white border border-[#E2E1EC] shadow-2xs flex flex-col justify-between gap-3"
            >
              <div>
                <span className="text-[11px] font-bold text-[#3C61DD] uppercase">
                  {d.num}
                </span>
                <h4 className="font-heading font-bold text-[17px] text-[#1A1B23] mt-1">
                  {d.text}
                </h4>
              </div>
              <p className="text-[12px] text-[#747685] leading-relaxed">
                {d.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Factors That Change Ownership Context */}
        <div className="p-6 sm:p-8 rounded-[24px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-2xs flex flex-col gap-4">
          <span className="text-[12px] font-bold text-[#747685] uppercase tracking-wider">
            Factors that change ownership context
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {factors.map((f) => (
              <div
                key={f}
                className="p-3.5 rounded-[14px] bg-white border border-[#E2E1EC] text-center text-[12px] font-bold text-[#1A1B23]"
              >
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
