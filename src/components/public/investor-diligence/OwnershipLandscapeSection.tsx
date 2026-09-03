'use client';

import { Users, PieChart, AlertCircle, CheckCircle2, ArrowDown, ArrowRight } from 'lucide-react';

export default function OwnershipLandscapeSection() {
  const capTable = [
    { holder: 'Founder A', pct: '60%', width: '60%', color: 'bg-[#3C61DD]' },
    { holder: 'Founder B', pct: '20%', width: '20%', color: 'bg-[#157A55]' },
    { holder: 'Existing Investor', pct: '12%', width: '12%', color: 'bg-[#E28905]' },
    { holder: 'Option Pool', pct: '8%', width: '8%', color: 'bg-[#747685]' },
  ];

  const transitionSteps = [
    'CURRENT OWNERSHIP',
    'PROPOSED NEW INVESTMENT',
    'POTENTIAL DILUTION',
    'FUTURE OWNERSHIP SCENARIO',
  ];

  const questions = [
    'Who owns the company today?',
    'What securities already exist?',
    'Are options or grants outstanding?',
    'Are SAFEs or convertible instruments outstanding?',
    'What rights already exist?',
    'How could the proposed round change ownership?',
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#747685] uppercase tracking-wider">
            OWNERSHIP BEFORE INVESTMENT
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Before changing ownership,
            <br />
            understand the ownership that already exists.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            The cap table provides context around founders, existing investors, employee equity and other ownership interests before a new investment is modeled.
          </p>
        </div>

        {/* Cap Table & Dilution Logic Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left: Illustrative Cap Table (6 cols) */}
          <div className="lg:col-span-6 p-6 sm:p-8 rounded-[28px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-5">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(0,0,0,0.06)]">
                <div>
                  <span className="text-[10px] font-bold text-[#3C61DD] uppercase block">
                    CURRENT OWNERSHIP
                  </span>
                  <h3 className="font-heading font-bold text-[18px] text-[#1A1B23]">
                    NOVA SPACE SAS
                  </h3>
                </div>
                <span className="px-2.5 py-0.5 rounded bg-white text-[#747685] text-[10px] font-bold">
                  ILLUSTRATIVE ONLY
                </span>
              </div>

              {/* Ownership Bar */}
              <div className="pt-4">
                <div className="w-full h-4 rounded-full bg-white border border-[#E2E1EC] overflow-hidden flex">
                  {capTable.map((item) => (
                    <div
                      key={item.holder}
                      className={`${item.color} h-full`}
                      style={{ width: item.width }}
                      title={`${item.holder}: ${item.pct}`}
                    />
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2 pt-4">
                  {capTable.map((item) => (
                    <div key={item.holder} className="p-2.5 rounded-[10px] bg-white border border-[#E2E1EC] text-[12px]">
                      <span className="text-[#747685] block">{item.holder}</span>
                      <strong className="text-[#1A1B23]">{item.pct}</strong>
                    </div>
                  ))}
                </div>

                <div className="text-[11px] font-bold text-[#157A55] text-right mt-2">
                  Total: 100%
                </div>
              </div>
            </div>

            {/* Transition Logic */}
            <div className="p-3 rounded-[12px] bg-white border border-[#E2E1EC]">
              <span className="text-[9px] font-bold text-[#747685] uppercase block mb-1">
                TRANSITION LOGIC (HYPOTHETICAL SCENARIO)
              </span>
              <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold text-[#1A1B23]">
                {transitionSteps.map((st, idx) => (
                  <span key={st} className="flex items-center gap-1">
                    <span>{st}</span>
                    {idx < transitionSteps.length - 1 && <span className="text-[#3C61DD]">➔</span>}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right: 6 Ownership Diligence Questions (6 cols) */}
          <div className="lg:col-span-6 p-6 sm:p-8 rounded-[28px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-4">
            <span className="text-[11px] font-bold text-[#747685] uppercase tracking-wider">
              INVESTOR CAP TABLE DILIGENCE QUESTIONS
            </span>

            <div className="space-y-2">
              {questions.map((q) => (
                <div
                  key={q}
                  className="p-3 rounded-[12px] bg-[#FAF8FF] border border-[#E2E1EC] text-[12px] font-medium text-[#1A1B23]"
                >
                  ❓ {q}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Ownership Statement & Disclaimer */}
        <div className="p-6 sm:p-8 rounded-[24px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-xs flex flex-col items-center text-center gap-3">
          <h3 className="font-heading font-extrabold text-[15px] sm:text-[18px] text-[#070707] uppercase tracking-wide">
            THE CAP TABLE IS NOT JUST A LIST OF PERCENTAGES.
            <br />
            IT IS THE HISTORY OF OWNERSHIP THE NEW DEAL WILL ENTER.
          </h3>
          <p className="text-[11px] text-[#747685] max-w-[720px]">
            Note: Cap-table information reflects company-provided records and applicable documentation; it is not, by itself, a legal certification.
          </p>
        </div>
      </div>
    </section>
  );
}
