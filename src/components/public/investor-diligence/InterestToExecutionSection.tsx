'use client';

import { FileText, CheckCircle2, ArrowRight, ShieldCheck, Scale, AlertCircle } from 'lucide-react';

export default function InterestToExecutionSection() {
  const termDimensions = [
    { label: 'INVESTMENT', val: '€500,000' },
    { label: 'VALUATION CONTEXT', val: 'Pre-Money / Post-Money parameters' },
    { label: 'OWNERSHIP', val: 'Resulting stake context based on final valuation' },
    { label: 'ECONOMIC RIGHTS', val: 'Relevant rights depending on investment structure (e.g., liquidation preference)' },
    { label: 'CONTROL / GOVERNANCE', val: 'Relevant voting, board representation, or consent context' },
    { label: 'CONDITIONS', val: 'Requirements before closing (e.g., regulatory approvals, final DD)' },
  ];

  const transactionFlow = [
    'DILIGENCE',
    'PROPOSED TERMS',
    'TERM SHEET',
    'FOUNDER ↔ INVESTOR NEGOTIATION',
    'AGREED COMMERCIAL TERMS',
    'LEGAL DOCUMENTATION',
    'SIGNING',
    'REQUIRED CONDITIONS',
    'CAPITAL TRANSFER',
    'INVESTMENT EXECUTION',
  ];

  const principles = [
    {
      code: 'A',
      title: 'TERM SHEET ≠ COMPLETED INVESTMENT',
      desc: 'A term sheet sets baseline commercial intent, not binding closing.',
    },
    {
      code: 'B',
      title: 'SIGNATURE MAY NOT EQUAL CLOSING',
      desc: 'Execution of primary contracts precedes satisfaction of closing conditions.',
    },
    {
      code: 'C',
      title: 'CLOSING DEPENDS ON MECHANICS',
      desc: 'Closing depends on the applicable final documentation, conditions and transaction mechanics.',
    },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            WHERE INTEREST BECOMES TERMS
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            The amount is one term.
            <br />
            <span className="text-[#3C61DD]">Not the whole deal.</span>
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Once diligence supports continued interest, the parties can move toward proposed investment terms, negotiation and final transaction documentation.
          </p>
        </div>

        {/* Proposed Investment & Transaction Flow Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left: Illustrative Proposed Investment (6 cols) */}
          <div className="lg:col-span-6 p-6 sm:p-8 rounded-[28px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(0,0,0,0.06)]">
                <div>
                  <span className="text-[10px] font-bold text-[#747685] uppercase block">
                    PROPOSED INVESTMENT
                  </span>
                  <h3 className="font-heading font-bold text-[18px] text-[#1A1B23]">
                    Illustrative Term Specimen
                  </h3>
                </div>
                <span className="px-2.5 py-0.5 rounded bg-white text-[#747685] text-[10px] font-bold">
                  ILLUSTRATIVE ONLY
                </span>
              </div>

              <div className="space-y-2 pt-3">
                {termDimensions.map((t) => (
                  <div key={t.label} className="p-2.5 rounded-[10px] bg-white border border-[#E2E1EC] text-[12px]">
                    <span className="text-[10px] font-bold text-[#3C61DD] uppercase block">{t.label}</span>
                    <strong className="text-[#1A1B23]">{t.val}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-[10px] text-[#747685]">Terms subject to definitive agreement</div>
          </div>

          {/* Right: 9-Step Transaction Flow (6 cols) */}
          <div className="lg:col-span-6 p-6 sm:p-8 rounded-[28px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-4">
            <span className="text-[11px] font-bold text-[#747685] uppercase tracking-wider">
              TRANSACTION FLOW
            </span>

            <div className="space-y-1.5">
              {transactionFlow.map((st, idx) => (
                <div
                  key={st}
                  className="p-2.5 rounded-[10px] bg-[#FAF8FF] border border-[#E2E1EC] text-[11px] font-bold text-[#1A1B23] flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-white border border-[#E2E1EC] flex items-center justify-center text-[10px] text-[#3C61DD]">
                      0{idx + 1}
                    </span>
                    <span>{st}</span>
                  </div>
                  {idx < transactionFlow.length - 1 && <span className="text-[#3C61DD]">↓</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3 Principles Panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {principles.map((p) => (
            <div
              key={p.code}
              className="p-6 rounded-[24px] bg-[#1A1B23] text-white shadow-xs flex flex-col justify-between gap-3"
            >
              <div>
                <span className="w-6 h-6 rounded-full bg-[#3C61DD] text-white font-heading font-bold text-[11px] flex items-center justify-center">
                  {p.code}
                </span>
                <h4 className="font-heading font-bold text-[14px] text-white mt-2">
                  {p.title}
                </h4>
                <p className="text-[12px] text-[#C4C5D6] mt-1 leading-relaxed">{p.desc}</p>
              </div>
              <div className="text-[10px] text-[#747685]">Institutional Discipline</div>
            </div>
          ))}
        </div>

        {/* Term Sheet Statement & Disclaimers */}
        <div className="p-6 sm:p-8 rounded-[24px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-xs flex flex-col items-center text-center gap-3">
          <h3 className="font-heading font-extrabold text-[15px] sm:text-[18px] text-[#070707] uppercase tracking-wide">
            A TERM SHEET MAKES THE CONVERSATION MORE CONCRETE.
            <br />
            IT DOES NOT, BY ITSELF, MEAN THE DEAL IS CLOSED.
          </h3>

          <p className="text-[11px] text-[#747685] max-w-[760px]">
            Disclaimer: Legal effect varies by document, terms and jurisdiction. Parties should obtain appropriate professional advice.
          </p>
        </div>
      </div>
    </section>
  );
}
