'use client';

import { FileCheck, Shield, CheckCircle2, HelpCircle, ArrowRight } from 'lucide-react';

export default function ClaimEvidenceSection() {
  const stream1 = [
    'Company Registration',
    'Relevant Governance Documents',
    'Material Legal Agreements',
    'IP Context',
    'Regulatory Context (where relevant)',
  ];

  const stream2 = [
    'Material Customer Contracts',
    'Partnership Agreements',
    'Revenue Evidence',
    'Commercial Commitments',
  ];

  const stream3 = [
    'Product Evidence',
    'Pilot Results',
    'Traction',
    'Operating Milestones',
    'Team Execution Context',
  ];

  const evidenceTags = [
    'Customer Interviews',
    'Signed Pilots',
    'Active Users',
    'Revenue',
    'Contracts',
    'Pipeline Context',
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#FAF8FF] border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            TEST THE CLAIM AGAINST THE RECORD
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            A company can say what it has built.
            <br />
            Diligence asks: what supports that claim?
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Mondial can bring company documents, commercial evidence and execution signals into the same review context so Investors can connect claims with supporting material.
          </p>
        </div>

        {/* 3 Evidence Streams Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
          {/* Stream 1 */}
          <div className="p-6 rounded-[24px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold text-[#3C61DD] uppercase block">STREAM 01</span>
              <h3 className="font-heading font-bold text-[18px] text-[#1A1B23] mt-1">COMPANY &amp; LEGAL</h3>
              <div className="space-y-1.5 pt-3 text-[12px] text-[#444654]">
                {stream1.map((it) => (
                  <div key={it}>• {it}</div>
                ))}
              </div>
            </div>
            <div className="text-[10px] text-[#747685]">Corporate Foundation</div>
          </div>

          {/* Stream 2 */}
          <div className="p-6 rounded-[24px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold text-[#157A55] uppercase block">STREAM 02</span>
              <h3 className="font-heading font-bold text-[18px] text-[#1A1B23] mt-1">COMMERCIAL</h3>
              <div className="space-y-1.5 pt-3 text-[12px] text-[#444654]">
                {stream2.map((it) => (
                  <div key={it}>• {it}</div>
                ))}
              </div>
            </div>
            <div className="text-[10px] text-[#747685]">Market Validation</div>
          </div>

          {/* Stream 3 */}
          <div className="p-6 rounded-[24px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold text-[#3C61DD] uppercase block">STREAM 03</span>
              <h3 className="font-heading font-bold text-[18px] text-[#1A1B23] mt-1">EXECUTION</h3>
              <div className="space-y-1.5 pt-3 text-[12px] text-[#444654]">
                {stream3.map((it) => (
                  <div key={it}>• {it}</div>
                ))}
              </div>
            </div>
            <div className="text-[10px] text-[#747685]">Operating Signals</div>
          </div>
        </div>

        {/* Central Claim & Logic Paths */}
        <div className="p-6 sm:p-8 rounded-[28px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[rgba(0,0,0,0.06)]">
            <div>
              <span className="text-[10px] font-bold text-[#747685] uppercase block">
                COMPANY CLAIM SPECIMEN
              </span>
              <h4 className="font-heading font-bold text-[18px] text-[#1A1B23] mt-0.5">
                &ldquo;We have strong early demand.&rdquo;
              </h4>
            </div>
            <span className="px-3 py-1 rounded bg-[#F3F2FD] text-[#1A47C3] text-[11px] font-bold max-w-fit">
              SUPPORTING EVIDENCE FILTERED
            </span>
          </div>

          {/* Evidence Tags */}
          <div className="flex flex-wrap gap-2">
            {evidenceTags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1.5 rounded-full bg-[#FAF8FF] border border-[#E2E1EC] text-[12px] font-medium text-[#1A1B23]"
              >
                ✔ {tag}
              </span>
            ))}
          </div>

          {/* Logic Paths A & B */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-[16px] bg-[#E8F8EE] border border-[#157A55]/20 text-[12px]">
              <strong className="text-[#157A55] block">LOGIC PATH A:</strong>
              <p className="text-[#1A1B23] mt-1">
                CLAIM + SUPPORTING EVIDENCE ➔ <strong>INVESTOR UNDERSTANDING</strong>
              </p>
            </div>
            <div className="p-4 rounded-[16px] bg-[#FAF8FF] border border-[#E2E1EC] text-[12px]">
              <strong className="text-[#3C61DD] block">LOGIC PATH B:</strong>
              <p className="text-[#1A1B23] mt-1">
                MISSING EVIDENCE ➔ <strong>FOLLOW-UP QUESTION</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Section Statement */}
        <div className="p-6 sm:p-7 rounded-[20px] bg-white border border-[#E2E1EC] text-center shadow-xs flex flex-col gap-2">
          <h3 className="font-heading font-extrabold text-[15px] sm:text-[18px] text-[#070707] uppercase tracking-wide">
            DILIGENCE SHOULD CONNECT WHAT THE COMPANY SAYS WITH WHAT THE RECORD SUPPORTS.
          </h3>
          <p className="text-[12px] text-[#747685]">
            Required evidence depends on stage, business model, jurisdiction and deal context.
          </p>
        </div>
      </div>
    </section>
  );
}
