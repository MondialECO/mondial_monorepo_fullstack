'use client';

import { UserCheck, Briefcase, CheckCircle2, ArrowRight, Shield } from 'lucide-react';

export default function TwoStageVerificationSection() {
  const stage1Items = [
    'Name',
    'Email / Phone',
    'Identity Document',
    'Face / Liveness Check',
  ];

  const stage2Rows = [
    { label: 'PROFESSIONAL TITLE', val: 'Data Required' },
    { label: 'FIRM / INDEPENDENT STATUS', val: 'Data Required' },
    { label: 'EXPERIENCE', val: 'Data Required' },
    { label: 'COUNTRY', val: 'Data Required' },
    { label: 'PRIMARY CATEGORY', val: 'Data Required' },
    { label: 'SUPPORTING EVIDENCE', val: 'Data Required' },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#F1F5FF]/60 border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#747685] uppercase tracking-wider">
            TWO DIFFERENT QUESTIONS
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            First verify the person.
            <br />
            Then verify the profession.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Identity verification establishes who the Provider is. Professional verification establishes the context behind what they offer.
          </p>
        </div>

        {/* Two Stage Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Stage 01: Identity */}
          <div className="p-6 sm:p-8 rounded-[28px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-6">
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-[#747685] uppercase tracking-wider">
                  01 IDENTITY
                </span>
                <h3 className="font-heading font-extrabold text-[22px] text-[#1A1B23]">
                  WHO ARE YOU?
                </h3>
              </div>

              <div className="flex flex-col gap-3 text-[14px]">
                {stage1Items.map((item) => (
                  <div
                    key={item}
                    className="p-3.5 rounded-[12px] bg-[#FAF8FF] border border-[#E2E1EC] flex items-center justify-between"
                  >
                    <span className="text-[#444654]">{item}</span>
                    <span className="w-2 h-2 rounded-full bg-[#747685]" />
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-[16px] bg-[#E8F8EE] border border-[#157A55]/30 flex items-center gap-3">
              <CheckCircle2 size={20} className="text-[#157A55]" />
              <span className="font-heading font-bold text-[15px] text-[#157A55]">
                VERIFIED IDENTITY
              </span>
            </div>
          </div>

          {/* Stage 02: Professional Identity */}
          <div className="p-6 sm:p-8 rounded-[28px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-6">
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-[#3C61DD] uppercase tracking-wider">
                  02 PROFESSIONAL IDENTITY
                </span>
                <h3 className="font-heading font-extrabold text-[20px] sm:text-[22px] text-[#1A1B23]">
                  WHAT PROFESSIONAL CAPABILITY ARE YOU REPRESENTING?
                </h3>
              </div>

              <div className="flex flex-col gap-2.5 text-[12px]">
                {stage2Rows.map((row) => (
                  <div
                    key={row.label}
                    className="p-2.5 rounded-[10px] bg-[#FAF8FF] border border-[#E2E1EC] flex items-center justify-between"
                  >
                    <span className="text-[10px] font-bold text-[#747685] uppercase">
                      {row.label}
                    </span>
                    <span className="text-[#1A1B23] font-medium">{row.val}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-[16px] bg-[#F3F2FD] border border-[#3C61DD]/30 flex items-center gap-3">
              <Briefcase size={20} className="text-[#3C61DD]" />
              <span className="font-heading font-bold text-[15px] text-[#3C61DD]">
                PROFESSIONAL CLAIM
              </span>
            </div>
          </div>
        </div>

        {/* Two-Stage Equation */}
        <div className="p-6 sm:p-8 rounded-[24px] bg-white border border-[#E2E1EC] shadow-xs flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-[12px] sm:text-[13px] font-bold text-[#1A1B23]">
          <span className="px-4 py-2 rounded-[10px] bg-[#FAF8FF] border border-[#E2E1EC]">
            VERIFIED PERSON
          </span>
          <span className="text-[#3C61DD] text-[16px]">+</span>
          <span className="px-4 py-2 rounded-[10px] bg-[#FAF8FF] border border-[#E2E1EC]">
            PROFESSIONAL EVIDENCE
          </span>
          <span className="text-[#3C61DD] text-[16px]">➔</span>
          <span className="px-5 py-2 rounded-[10px] bg-[#3C61DD] text-white shadow-xs">
            TRUSTED PROVIDER FOUNDATION
          </span>
        </div>

        {/* Editorial Statement */}
        <div className="p-6 sm:p-8 rounded-[20px] bg-white border border-[#E2E1EC] text-center shadow-xs">
          <p className="font-heading font-extrabold text-[15px] sm:text-[18px] text-[#070707] uppercase tracking-wide max-w-[800px] mx-auto">
            &ldquo;KNOWING WHO SOMEONE IS DOES NOT AUTOMATICALLY PROVE WHAT THEY CAN PROFESSIONALLY DO.&rdquo;
          </p>
        </div>
      </div>
    </section>
  );
}
