'use client';

import { Eye, Lock, ShieldCheck, UserCheck, CheckCircle2, ArrowRight } from 'lucide-react';

export default function InvestorVisibilityPrivacy() {
  const publicFields = [
    'Investor Name',
    'Investor Type',
    'Bio',
    'Sector Focus',
    'Stage Focus',
    'Geography',
    'Typical Ticket Range',
    'Investment Focus',
    'Selected Portfolio Context',
    'Preferred Contact / Access Context',
  ];

  const privateFields = [
    'Identity Documents',
    'Detailed Verification Information',
    'Proof-of-Funds Evidence',
    'Source-of-Funds Information',
    'Sensitive Financial Context',
    'Internal Verification Records',
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#747685] uppercase tracking-wider">
            CONTROL WHAT FOUNDERS SEE
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            A trusted profile does not mean
            <br />
            everything becomes public.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Mondial can separate information useful for founder discovery from private verification and financial information that remains controlled.
          </p>
        </div>

        {/* Public Profile vs Private Context Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Public Profile (Left) */}
          <div className="p-6 sm:p-8 rounded-[28px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-5">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(0,0,0,0.06)]">
                <h3 className="font-heading font-bold text-[18px] text-[#1A1B23]">
                  PUBLIC INVESTOR PROFILE
                </h3>
                <span className="px-2.5 py-0.5 rounded bg-[#E8F8EE] text-[#157A55] text-[10px] font-bold">
                  FOUNDER VISIBLE
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-4">
                {publicFields.map((f) => (
                  <div key={f} className="p-2 rounded-[8px] bg-white border border-[#E2E1EC] text-[11px] font-medium text-[#1A1B23]">
                    ✔ {f}
                  </div>
                ))}
              </div>
            </div>

            <div className="text-[11px] text-[#747685]">Relevant for opportunity discovery</div>
          </div>

          {/* Private Context (Right) */}
          <div className="p-6 sm:p-8 rounded-[28px] bg-[#FAF8FF] border border-[#BA1A1A]/30 shadow-xs flex flex-col justify-between gap-5">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(0,0,0,0.06)]">
                <h3 className="font-heading font-bold text-[18px] text-[#1A1B23]">
                  PRIVATE / CONTROLLED CONTEXT
                </h3>
                <span className="px-2.5 py-0.5 rounded bg-red-50 text-[#BA1A1A] text-[10px] font-bold">
                  CONFIDENTIAL
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-4">
                {privateFields.map((f) => (
                  <div key={f} className="p-2 rounded-[8px] bg-white border border-[#E2E1EC] text-[11px] font-medium text-[#BA1A1A]">
                    🔒 {f}
                  </div>
                ))}
              </div>
            </div>

            <div className="text-[11px] text-[#747685]">Encrypted and secured within platform</div>
          </div>
        </div>

        {/* Stakeholder View (3 columns) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-[20px] bg-[#FAF8FF] border border-[#E2E1EC] text-center">
            <strong className="text-[#1A1B23] block text-[13px]">FOUNDER VIEW</strong>
            <p className="text-[11px] text-[#747685] mt-1">sees Relevant Investor Context.</p>
          </div>
          <div className="p-5 rounded-[20px] bg-[#FAF8FF] border border-[#E2E1EC] text-center">
            <strong className="text-[#1A1B23] block text-[13px]">MONDIAL TRUST LAYER</strong>
            <p className="text-[11px] text-[#747685] mt-1">knows Verification Status.</p>
          </div>
          <div className="p-5 rounded-[20px] bg-[#FAF8FF] border border-[#E2E1EC] text-center">
            <strong className="text-[#1A1B23] block text-[13px]">INVESTOR</strong>
            <p className="text-[11px] text-[#747685] mt-1">controls Visibility Preferences.</p>
          </div>
        </div>

        {/* Climax Statement */}
        <div className="p-6 sm:p-7 rounded-[20px] bg-[#FAF8FF] border border-[#E2E1EC] text-center shadow-xs flex flex-col gap-2">
          <h3 className="font-heading font-extrabold text-[15px] sm:text-[18px] text-[#070707] uppercase tracking-wide">
            CREDIBILITY DOES NOT REQUIRE TOTAL TRANSPARENCY.
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-2 text-[12px] font-bold text-[#1A47C3]">
            <span>RIGHT INFORMATION</span>
            <span>➔</span>
            <span>RIGHT PURPOSE</span>
            <span>➔</span>
            <span>RIGHT VISIBILITY LEVEL</span>
          </div>
        </div>
      </div>
    </section>
  );
}
