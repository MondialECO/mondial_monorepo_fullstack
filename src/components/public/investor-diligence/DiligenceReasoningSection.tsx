'use client';

import { HelpCircle, FileText, CheckCircle2, ArrowRight } from 'lucide-react';

export default function DiligenceReasoningSection() {
  const reasoningSteps = [
    '1 CLAIM',
    '2 QUESTION',
    '3 EVIDENCE',
    '4 INTERPRETATION',
    '5 FOLLOW-UP',
    '6 UPDATED UNDERSTANDING',
  ];

  const examples = [
    {
      num: '01',
      title: 'CUSTOMER ACQUISITION',
      claim: 'Scale acquisition',
      q: 'Historical cost',
      ev: 'Campaign/Cohort data',
      updated: 'Commercial scalability needs validation',
    },
    {
      num: '02',
      title: 'MVP READINESS',
      claim: 'MVP ready',
      q: 'Remaining steps',
      ev: 'Backend dependency remains',
      updated: 'Execution risk exists',
    },
    {
      num: '03',
      title: 'RUNWAY',
      claim: '700K = 18 months',
      q: 'Assumptions',
      ev: 'Hiring/Op-costs',
      updated: 'Runway depends on hiring pace',
    },
    {
      num: '04',
      title: 'OWNERSHIP',
      claim: 'Clean ownership',
      q: 'Convertibles',
      ev: 'Cap Table/SAFE',
      updated: 'Dilution needs modeling',
    },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#747685] uppercase tracking-wider">
            GOOD DILIGENCE CREATES BETTER QUESTIONS
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Documents do not make the decision.
            <br />
            Understanding does.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Investors review evidence, identify gaps, ask follow-up questions and update their view of the company as new information appears.
          </p>
        </div>

        {/* 6-Step Reasoning Loop */}
        <div className="p-4 sm:p-5 rounded-[20px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-2xs flex flex-wrap items-center justify-center gap-2 text-[11px] sm:text-[12px] font-bold text-[#1A1B23]">
          {reasoningSteps.map((st, idx) => (
            <span key={st} className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-[8px] bg-white border border-[#E2E1EC]">
                {st}
              </span>
              {idx < reasoningSteps.length - 1 && <span className="text-[#3C61DD]">➔</span>}
            </span>
          ))}
        </div>

        {/* 4 Illustrative Examples Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {examples.map((ex) => (
            <div
              key={ex.num}
              className="p-6 rounded-[24px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-2xs flex flex-col justify-between gap-4"
            >
              <div>
                <span className="text-[10px] font-bold text-[#3C61DD] uppercase block">
                  {ex.num} {ex.title}
                </span>

                <div className="space-y-1.5 pt-3 text-[12px]">
                  <div><strong>Claim:</strong> {ex.claim}</div>
                  <div><strong>Question:</strong> {ex.q}</div>
                  <div><strong>Evidence:</strong> {ex.ev}</div>
                </div>
              </div>

              <div className="p-2.5 rounded-[10px] bg-white border border-[#E2E1EC] text-[11px]">
                <strong className="text-[#157A55] block">UPDATED VIEW:</strong>
                <span className="text-[#444654] mt-0.5 block">{ex.updated}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Section Statement */}
        <div className="p-6 sm:p-7 rounded-[20px] bg-[#FAF8FF] border border-[#E2E1EC] text-center shadow-xs">
          <h3 className="font-heading font-extrabold text-[15px] sm:text-[18px] text-[#070707] uppercase tracking-wide">
            DILIGENCE IS NOT A SEARCH FOR A PERFECT COMPANY.
            <br />
            IT IS A PROCESS FOR UNDERSTANDING THE REAL ONE.
          </h3>
        </div>
      </div>
    </section>
  );
}
