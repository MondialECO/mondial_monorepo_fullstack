'use client';

import { ArrowRight, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ScenarioThinkingSection() {
  const scenarios = [
    {
      name: 'SCENARIO A',
      sub: 'Smaller Round',
      amount: '€250K',
      founderPct: '72%',
      investorPct: '10%',
      barWidths: { founder: '72%', pool: '18%', investor: '10%' },
      notes: ['Lower dilution', 'Less capital available'],
      highlighted: false,
    },
    {
      name: 'SCENARIO B',
      sub: 'Balanced Round',
      amount: '€500K',
      founderPct: '64%',
      investorPct: '20%',
      barWidths: { founder: '64%', pool: '16%', investor: '20%' },
      notes: ['More runway', 'Greater dilution'],
      highlighted: true,
    },
    {
      name: 'SCENARIO C',
      sub: 'Larger Round',
      amount: '€1M',
      founderPct: '56%',
      investorPct: '30%',
      barWidths: { founder: '56%', pool: '14%', investor: '30%' },
      notes: ['More capital', 'Higher ownership impact'],
      highlighted: false,
    },
  ];

  const mapSteps = [
    'AMOUNT RAISED',
    'VALUATION',
    'OWNERSHIP SOLD',
    'DILUTION',
    'RUNWAY / USE OF FUNDS',
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#747685] uppercase tracking-wider">
            SECTION 05 — SCENARIO THINKING
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            See the ownership impact
            <br />
            before agreeing to the round.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Mondial can help Entrepreneurs compare hypothetical funding and equity scenarios so the implications are easier to understand before formal negotiations begin.
          </p>
        </div>

        {/* 3 Scenarios Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {scenarios.map((sc) => (
            <div
              key={sc.name}
              className={`rounded-[24px] p-6 sm:p-7 flex flex-col justify-between gap-6 transition-all ${
                sc.highlighted
                  ? 'bg-[#F3F2FD] border-2 border-[#3C61DD] shadow-md relative'
                  : 'bg-[#FAF8FF] border border-[#E2E1EC] shadow-xs'
              }`}
            >
              {sc.highlighted && (
                <div className="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-[#3C61DD] text-white text-[10px] font-bold uppercase tracking-wider shadow-xs">
                  BALANCED MODEL
                </div>
              )}

              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="font-heading font-extrabold text-[18px] text-[#1A1B23]">
                    {sc.name}
                  </h3>
                  <span className="text-[13px] text-[#747685] font-medium">{sc.sub}</span>
                </div>

                <div>
                  <span className="text-[32px] sm:text-[38px] font-heading font-extrabold text-[#1A1B23] leading-none block">
                    {sc.amount}
                  </span>
                  <span className="text-[12px] font-bold text-[#747685] uppercase tracking-wider">
                    Investment
                  </span>
                </div>

                {/* Bar Chart */}
                <div className="flex flex-col gap-1.5 pt-2">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-[#1A1B23]">Founder {sc.founderPct}</span>
                    <span className="text-[#3C61DD]">Investor {sc.investorPct}</span>
                  </div>
                  <div className="w-full h-2 rounded-full overflow-hidden flex bg-[#E2E1EC]">
                    <div style={{ width: sc.barWidths.founder }} className="bg-[#1A1B23]" />
                    <div style={{ width: sc.barWidths.pool }} className="bg-[#E2E1EC]" />
                    <div style={{ width: sc.barWidths.investor }} className="bg-[#3C61DD]" />
                  </div>
                </div>

                {/* Notes List */}
                <div className="flex flex-col gap-1.5 pt-3 border-t border-[rgba(0,0,0,0.06)] text-[13px] text-[#444654]">
                  {sc.notes.map((note) => (
                    <div key={note} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#3C61DD]" />
                      <span>{note}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Relationship Map */}
        <div className="bg-[#FAF8FF] border border-[#E2E1EC] rounded-[24px] p-6 sm:p-8 flex flex-col gap-5 shadow-xs">
          <span className="text-[11px] font-bold text-[#747685] uppercase tracking-wider">
            SCENARIO RELATIONSHIP MAP
          </span>

          <div className="flex flex-wrap items-center justify-between gap-3 text-[12px] sm:text-[13px] font-bold">
            {mapSteps.map((step, idx) => (
              <div key={step} className="flex items-center gap-2 sm:gap-3">
                <span className="p-3 rounded-[10px] bg-white border border-[#E2E1EC] text-[#1A1B23]">
                  {step}
                </span>
                {idx < mapSteps.length - 1 && <ArrowRight size={14} className="text-[#3C61DD]" />}
              </div>
            ))}
          </div>
        </div>

        {/* Final Statement & Disclaimer */}
        <div className="w-full p-6 sm:p-8 rounded-[20px] bg-white border border-[#E2E1EC] text-center shadow-xs flex flex-col gap-2">
          <span className="text-[10px] font-bold text-[#747685] uppercase">
            ILLUSTRATIVE SCENARIOS ONLY
          </span>
          <h3 className="font-heading font-extrabold text-[16px] sm:text-[20px] text-[#070707] uppercase tracking-wide">
            A FUNDING ROUND IS A STRUCTURAL DECISION. NOT JUST A CASH DECISION.
          </h3>
          <p className="text-[12px] sm:text-[13px] text-[#747685] max-w-[800px] mx-auto leading-relaxed">
            Actual financing terms, securities and legal effects depend on the agreed transaction and relevant professional advice.
          </p>
        </div>
      </div>
    </section>
  );
}
