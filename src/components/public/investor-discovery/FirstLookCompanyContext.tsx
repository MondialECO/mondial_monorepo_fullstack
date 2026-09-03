'use client';

import { Eye, Lock, FileText, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';

export default function FirstLookCompanyContext() {
  const publicSignals = [
    { label: 'Problem', val: 'Inefficient B2B operational sourcing' },
    { label: 'Business Model', val: 'Marketplace Transaction Fee' },
    { label: 'Market Context', val: 'Growing demand for verified supply chains' },
    { label: 'Traction', val: 'MVP Live, Early Users' },
    { label: 'Team', val: 'Experienced Founders, 5 FTEs' },
    { label: 'Funding Need', val: '€700K Seed' },
    { label: 'Execution Stage', val: 'Scaling MVP, Building Pilot Supply' },
  ];

  const controlledData = [
    'Detailed Financials',
    'Full Cap Table',
    'Legal Documents',
    'Contracts',
    'Customer Data',
  ];

  const flow = ['DISCOVERY', 'INTEREST', 'ACCESS REQUEST', 'DEEPER REVIEW'];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#FAF8FF] border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            FIRST-LOOK COMPANY CONTEXT
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Enough information to decide
            <br />
            whether deeper review is worth it.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Discovery should help an Investor understand the shape of an opportunity without exposing the full confidential company record.
          </p>
        </div>

        {/* First-Look Company Context vs Controlled Diligence Data Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left: First-Look Company Specimen (7 cols) */}
          <div className="lg:col-span-7 p-6 sm:p-8 rounded-[28px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-5">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(0,0,0,0.06)]">
                <div>
                  <span className="text-[10px] font-bold text-[#3C61DD] uppercase block">
                    FIRST-LOOK COMPANY PROFILE
                  </span>
                  <h3 className="font-heading font-bold text-[20px] text-[#1A1B23]">
                    NOVA SPACE SAS
                  </h3>
                </div>
                <span className="px-2.5 py-0.5 rounded bg-[#E8F8EE] text-[#157A55] text-[10px] font-bold">
                  SEED • €700K
                </span>
              </div>

              <p className="text-[13px] text-[#1A1B23] font-medium mt-3">
                A B2B marketplace connecting companies with verified operational providers.
              </p>

              <div className="space-y-1.5 pt-3">
                {publicSignals.map((s) => (
                  <div key={s.label} className="text-[12px] flex justify-between py-1 border-b border-[rgba(0,0,0,0.03)]">
                    <span className="text-[#747685]">{s.label}:</span>
                    <strong className="text-[#1A1B23]">{s.val}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-[11px] text-[#747685]">
              Founder: <strong>Henry Martin (Founder / CEO)</strong> • Use of Funds: Product, Growth, Operations
            </div>
          </div>

          {/* Right: Controlled Diligence Data (5 cols) */}
          <div className="lg:col-span-5 p-6 sm:p-8 rounded-[28px] bg-white border border-[#BA1A1A]/30 shadow-xs flex flex-col justify-between gap-5">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(0,0,0,0.06)]">
                <h3 className="font-heading font-bold text-[18px] text-[#1A1B23]">
                  CONTROLLED DILIGENCE DATA
                </h3>
                <span className="px-2.5 py-0.5 rounded bg-red-50 text-[#BA1A1A] text-[10px] font-bold">
                  PROTECTED
                </span>
              </div>

              <p className="text-[12px] text-[#747685] mt-2">
                Discovery context DOES NOT automatically expose:
              </p>

              <div className="space-y-2 pt-3">
                {controlledData.map((d) => (
                  <div
                    key={d}
                    className="p-2.5 rounded-[10px] bg-[#FAF8FF] border border-[#E2E1EC] text-[12px] font-medium text-[#BA1A1A] flex items-center gap-2"
                  >
                    <Lock size={13} />
                    <span>{d}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-[11px] text-[#747685]">Requires NDA &amp; Founder Access Approval</div>
          </div>
        </div>

        {/* Core Statement & Progression Flow */}
        <div className="p-6 sm:p-8 rounded-[24px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col items-center text-center gap-4">
          <h3 className="font-heading font-extrabold text-[15px] sm:text-[18px] text-[#070707] uppercase tracking-wide">
            THE FIRST VIEW SHOULD ANSWER:
            <br />
            &ldquo;IS THIS WORTH A DEEPER CONVERSATION?&rdquo;
            <br />
            NOT: &ldquo;SHOW ME EVERYTHING.&rdquo;
          </h3>

          <div className="flex flex-wrap items-center justify-center gap-2 text-[12px] font-bold text-[#1A1B23] pt-2">
            {flow.map((st, idx) => (
              <span key={st} className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-[8px] bg-[#FAF8FF] border border-[#E2E1EC]">
                  {st}
                </span>
                {idx < flow.length - 1 && <span className="text-[#3C61DD]">➔</span>}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
