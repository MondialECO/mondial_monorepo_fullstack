'use client';

export default function PortfolioPerformanceSection() {
  const models = [
    {
      model: 'B2B SaaS',
      focus: 'Focus on recurring revenue efficiency and customer retention.',
      signals: ['ARR / MRR', 'Retention', 'Customer Growth', 'Gross Margin'],
      trendLabel: 'OBSERVED TREND',
      trend: 'ARR ↑ | Gross Margin ↑',
      q: '"Is growth scaling efficiently?"',
    },
    {
      model: 'Marketplace',
      focus: 'Focus on network liquidity and transaction velocity.',
      signals: ['Active Buyers', 'Active Providers', 'Transaction Volume', 'Take Rate', 'Repeat Usage'],
      trendLabel: 'OBSERVED TREND',
      trend: 'Transaction Volume ↑ | Repeat Usage →',
      q: '"Is activity growing without stronger retention?"',
    },
    {
      model: 'Early Product',
      focus: 'Focus on validation, usage, and path to commercialization.',
      signals: ['Product Completion', 'Pilot Adoption', 'User Activation', 'Commercial Validation'],
      trendLabel: 'OBSERVED TREND',
      trend: 'Product Completion 90% | Pilot Adoption 15%',
      q: '"Is the product meeting real market needs?"',
    },
  ];

  const equationTerms = [
    'METRIC',
    'TREND',
    'BUSINESS MODEL',
    'COMPANY STAGE',
    'USEFUL CONTEXT',
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#747685] uppercase tracking-wider">
            PORTFOLIO PERFORMANCE CONTEXT
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            The important metric depends on
            <br />
            the company.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Portfolio monitoring should connect company metrics to the business model, stage and investment thesis rather than forcing every company into one universal scorecard.
          </p>
        </div>

        {/* 3 Company Model Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {models.map((m) => (
            <div
              key={m.model}
              className="p-6 sm:p-8 rounded-[28px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-2xs flex flex-col justify-between gap-6"
            >
              <div className="flex flex-col gap-4">
                <div>
                  <span className="text-[10px] font-bold text-[#3C61DD] uppercase tracking-wider block">
                    COMPANY MODEL
                  </span>
                  <h3 className="font-heading font-extrabold text-[22px] text-[#1A1B23] mt-0.5">
                    {m.model}
                  </h3>
                  <p className="text-[12px] text-[#444654] mt-1 leading-relaxed">
                    {m.focus}
                  </p>
                </div>

                {/* Relevant Signals */}
                <div className="pt-2">
                  <span className="text-[10px] font-bold text-[#747685] uppercase tracking-wider block mb-2">
                    RELEVANT SIGNALS
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {m.signals.map((sig) => (
                      <span
                        key={sig}
                        className="px-2.5 py-1 rounded-[8px] bg-white border border-[#E2E1EC] text-[11px] font-bold text-[#1A1B23]"
                      >
                        {sig}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Observed Trend */}
                <div className="p-3.5 rounded-[14px] bg-white border border-[#E2E1EC]">
                  <span className="text-[10px] font-bold text-[#747685] uppercase block">
                    {m.trendLabel}
                  </span>
                  <div className="font-heading font-extrabold text-[14px] text-[#157A55] mt-0.5">
                    {m.trend}
                  </div>
                </div>
              </div>

              {/* Investor Question */}
              <div className="p-4 rounded-[14px] bg-white border border-[#3C61DD]/30">
                <span className="text-[10px] font-bold text-[#3C61DD] uppercase block">
                  INVESTOR QUESTION
                </span>
                <p className="font-heading font-bold text-[13px] text-[#1A1B23] mt-1 leading-snug">
                  {m.q}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Performance Principle & Equation */}
        <div className="p-6 sm:p-8 rounded-[28px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-xs flex flex-col items-center text-center gap-4">
          <h3 className="font-heading font-extrabold text-[15px] sm:text-[18px] text-[#070707] uppercase tracking-wide">
            A METRIC WITHOUT BUSINESS CONTEXT CAN CREATE FALSE CONFIDENCE.
          </h3>

          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] sm:text-[12px] font-bold text-[#1A1B23]">
            {equationTerms.map((term, idx) => (
              <span key={term} className="flex items-center gap-2">
                <span className="px-3.5 py-1.5 rounded-[8px] bg-white border border-[#E2E1EC]">
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
