'use client';

import { DollarSign, TrendingUp, PieChart, HelpCircle, ArrowRight } from 'lucide-react';

export default function FinancialReasoningSection() {
  const reasoningFlow = [
    {
      q: 'REVENUE, COSTS, CASH',
      title: 'Historical Context',
      desc: 'Evidence of past performance and existing commitments.',
    },
    {
      q: 'WHAT IS TRUE TODAY?',
      title: 'Current Position',
      desc: 'The starting line for future projections.',
    },
    {
      q: 'WHAT DOES THE COMPANY EXPECT?',
      title: 'Forecast',
      desc: 'The projected financial trajectory.',
    },
    {
      q: 'WHAT MUST HAPPEN?',
      title: 'Assumptions',
      desc: 'The required conditions for the forecast to materialize.',
    },
    {
      q: 'HOW MUCH CAPITAL IS REQUIRED?',
      title: 'Funding Need',
      desc: 'The calculated gap between cash and forecast.',
    },
    {
      q: 'WHAT DOES THE CAPITAL ENABLE?',
      title: 'Use of Funds',
      desc: 'Strategic allocation of requested capital.',
    },
    {
      q: 'WHAT SHOULD CHANGE BEFORE MORE CAPITAL?',
      title: 'Runway / Milestones',
      desc: 'Expected outcomes validating the thesis.',
    },
  ];

  const breakdown = [
    { label: 'Product', val: '€280K', pct: '40%', color: 'bg-[#3C61DD]' },
    { label: 'Growth', val: '€210K', pct: '30%', color: 'bg-[#157A55]' },
    { label: 'Operations', val: '€140K', pct: '20%', color: 'bg-[#E28905]' },
    { label: 'Contingency', val: '€70K', pct: '10%', color: 'bg-[#747685]' },
  ];

  const bottomFlow = ['NUMBER', 'ASSUMPTION', 'EVIDENCE', 'QUESTION', 'UNDERSTANDING'];

  return (
    <section
      id="section-04-financial-reasoning"
      className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#FAF8FF] border-b border-[rgba(0,0,0,0.06)] flex justify-center"
    >
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            READ BEYOND THE TOP LINE
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            The number matters.
            <br />
            So does how it was produced.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Financial diligence should connect historical evidence, forecasts, assumptions, cash requirements and the proposed use of capital.
          </p>
        </div>

        {/* Financial Flow & Specimen Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left: 7 Reasoning Steps (7 cols) */}
          <div className="lg:col-span-7 p-6 sm:p-8 rounded-[28px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-4">
            <span className="text-[11px] font-bold text-[#3C61DD] uppercase tracking-wider">
              FINANCIAL REASONING ARCHITECTURE
            </span>

            <div className="space-y-2.5">
              {reasoningFlow.map((st) => (
                <div
                  key={st.title}
                  className="p-3 rounded-[12px] bg-[#FAF8FF] border border-[#E2E1EC] text-[12px]"
                >
                  <span className="text-[9px] font-bold text-[#747685] uppercase block">{st.q}</span>
                  <strong className="text-[#1A1B23] text-[13px] block">{st.title}</strong>
                  <p className="text-[#444654] mt-0.5">{st.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Illustrative Financial Card (5 cols) */}
          <div className="lg:col-span-5 p-6 sm:p-8 rounded-[28px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-5">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(0,0,0,0.06)]">
                <div>
                  <span className="text-[10px] font-bold text-[#747685] uppercase block">
                    ILLUSTRATIVE FIGURES
                  </span>
                  <h3 className="font-heading font-bold text-[18px] text-[#1A1B23]">
                    Nova Space SAS
                  </h3>
                </div>
                <span className="px-2.5 py-0.5 rounded bg-[#E8F8EE] text-[#157A55] text-[10px] font-bold">
                  €700K SEED
                </span>
              </div>

              <div className="space-y-2 pt-3 text-[12px]">
                <div><strong>Current Position:</strong> MVP Pilot</div>
                <div><strong>Funding Ask:</strong> <strong className="text-[#157A55]">€700K</strong></div>
              </div>

              {/* Segmented Use of Funds Bar */}
              <div className="pt-4">
                <span className="text-[11px] font-bold text-[#1A1B23] block mb-1.5">
                  ILLUSTRATIVE USE BREAKDOWN:
                </span>
                <div className="w-full h-3 rounded-full bg-[#FAF8FF] border border-[#E2E1EC] overflow-hidden flex">
                  {breakdown.map((b) => (
                    <div
                      key={b.label}
                      className={`${b.color} h-full`}
                      style={{ width: b.pct }}
                      title={`${b.label}: ${b.val} (${b.pct})`}
                    />
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-3">
                  {breakdown.map((b) => (
                    <div key={b.label} className="p-2 rounded-[8px] bg-[#FAF8FF] border border-[#E2E1EC] text-[11px]">
                      <span className="text-[#747685] block">{b.label} ({b.pct})</span>
                      <strong className="text-[#1A1B23]">{b.val}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Question Chain Box */}
            <div className="p-3.5 rounded-[14px] bg-[#FAF8FF] border border-[#E2E1EC] text-[11px]">
              <strong className="text-[#3C61DD] block">FORECAST SAYS: &ldquo;Revenue increases.&rdquo;</strong>
              <p className="text-[#444654] mt-1">
                <strong>INVESTOR ASKS:</strong> From which customers? At what conversion? At what acquisition cost? Using what capacity?
              </p>
            </div>
          </div>
        </div>

        {/* Financial Statement & Bottom Flow */}
        <div className="p-6 sm:p-8 rounded-[24px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col items-center text-center gap-4">
          <h3 className="font-heading font-extrabold text-[15px] sm:text-[18px] text-[#070707] uppercase tracking-wide">
            FORECAST IS NOT EVIDENCE OF THE FUTURE.
            <br />
            IT IS: A MODEL BUILT FROM ASSUMPTIONS.
          </h3>

          <div className="flex flex-wrap items-center justify-center gap-2 text-[12px] font-bold text-[#1A1B23] pt-2">
            {bottomFlow.map((st, idx) => (
              <span key={st} className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-[8px] bg-[#FAF8FF] border border-[#E2E1EC]">
                  {st}
                </span>
                {idx < bottomFlow.length - 1 && <span className="text-[#3C61DD]">➔</span>}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
