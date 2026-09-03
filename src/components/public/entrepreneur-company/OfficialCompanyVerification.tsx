'use client';

import { FileCheck, ShieldCheck, CheckCircle2, Clock, AlertCircle, FileText } from 'lucide-react';

export default function OfficialCompanyVerification() {
  const checks = [
    { label: 'Legal Name Match', status: 'PASSED', color: 'green' },
    { label: 'Registration Number', status: 'PASSED', color: 'green' },
    { label: 'Legal Form', status: 'PASSED', color: 'green' },
    { label: 'Registered Address', status: 'PASSED', color: 'green' },
    { label: 'Company Status', status: 'REVIEWING', color: 'amber' },
    { label: 'Representative Match', status: 'REVIEWING', color: 'amber' },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#F9F9FA] border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1224px] flex flex-col gap-10 sm:gap-14">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[800px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            STEP 02 — VERIFY THE ORGANIZATION
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Connect the company record to official information.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Mondial structures company verification around official registration information and relevant supporting documentation.
          </p>
        </div>

        {/* 3-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {/* Column 1: Document Intake */}
          <div className="bg-white border border-[#E2E1EC] rounded-[24px] p-6 flex flex-col justify-between gap-5 shadow-xs text-[13px]">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 pb-3 border-b border-[rgba(0,0,0,0.06)]">
                <FileText size={18} className="text-[#3C61DD]" />
                <h3 className="font-heading font-bold text-[16px] text-[#1A1B23]">
                  DOCUMENT INTAKE
                </h3>
              </div>

              <div className="flex flex-col gap-3">
                <div>
                  <span className="text-[10px] font-bold text-[#8A8B8F] uppercase block">COUNTRY</span>
                  <p className="font-semibold text-[#1A1B23]">France</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#8A8B8F] uppercase block">
                    REGISTRATION TYPE
                  </span>
                  <p className="text-[#444654]">Commercial Company</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#8A8B8F] uppercase block">DOCUMENT</span>
                  <p className="text-[#444654]">KBIS / Official Registration Record</p>
                </div>
                <div className="p-3 rounded-[10px] bg-[#FAF8FF] border border-[rgba(0,0,0,0.04)] flex items-center justify-between">
                  <span className="font-mono text-[12px] text-[#1A1B23]">nova-space-kbis.pdf</span>
                  <span className="px-2 py-0.5 rounded-[4px] bg-[#F1F5FF] text-[#3C61DD] text-[10px] font-bold uppercase">
                    RECEIVED
                  </span>
                </div>
              </div>
            </div>

            <span className="text-[11px] text-[#8A8B8F] italic">
              Public demonstration only. No live file uploads.
            </span>
          </div>

          {/* Column 2: Verification Checks */}
          <div className="bg-white border border-[#E2E1EC] rounded-[24px] p-6 flex flex-col justify-between gap-5 shadow-xs text-[12px]">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 pb-3 border-b border-[rgba(0,0,0,0.06)]">
                <ShieldCheck size={18} className="text-[#3C61DD]" />
                <h3 className="font-heading font-bold text-[16px] text-[#1A1B23]">
                  VERIFICATION CHECKS
                </h3>
              </div>

              <div className="flex flex-col gap-2">
                {checks.map((c) => (
                  <div
                    key={c.label}
                    className="p-2.5 rounded-[8px] bg-[#FAF8FF] border border-[rgba(0,0,0,0.04)] flex items-center justify-between"
                  >
                    <span className="text-[#1A1B23] font-medium">{c.label}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-[4px] uppercase ${
                        c.color === 'green'
                          ? 'bg-[#E8F8EE] text-[#00A854]'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Column 3: Official Company Record */}
          <div className="bg-white border-2 border-[#3C61DD]/30 rounded-[24px] p-6 flex flex-col justify-between gap-5 shadow-sm text-[13px]">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(0,0,0,0.06)]">
                <h3 className="font-heading font-bold text-[16px] text-[#1A1B23]">
                  OFFICIAL COMPANY RECORD
                </h3>
                <span className="px-2 py-0.5 rounded-[4px] bg-amber-50 text-amber-700 text-[10px] font-bold uppercase border border-amber-200">
                  IN PROGRESS
                </span>
              </div>

              <div className="flex flex-col gap-2.5 text-[12px]">
                <div className="p-2.5 rounded-[8px] bg-[#FAF8FF]">
                  <span className="text-[10px] font-bold text-[#8A8B8F] uppercase block">LEGAL NAME</span>
                  <span className="font-bold text-[#1A1B23]">Nova Space SAS</span>
                </div>
                <div className="p-2.5 rounded-[8px] bg-[#FAF8FF]">
                  <span className="text-[10px] font-bold text-[#8A8B8F] uppercase block">REGISTRATION</span>
                  <span className="font-semibold text-[#1A1B23]">123 456 789</span>
                </div>
                <div className="p-2.5 rounded-[8px] bg-[#FAF8FF]">
                  <span className="text-[10px] font-bold text-[#8A8B8F] uppercase block">LEGAL FORM</span>
                  <span className="text-[#1A1B23]">SAS</span>
                </div>
                <div className="p-2.5 rounded-[8px] bg-[#FAF8FF]">
                  <span className="text-[10px] font-bold text-[#8A8B8F] uppercase block">REGISTERED ADDRESS</span>
                  <span className="text-[#1A1B23]">Paris, France</span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-[10px] bg-[#F1F5FF] text-[11px] font-bold text-[#3C61DD] text-center">
              VERIFICATION IN PROGRESS
            </div>
          </div>
        </div>

        {/* France-Specific Note */}
        <div className="w-full p-4 sm:p-5 rounded-[16px] bg-white border border-[#E2E1EC] flex items-center gap-3 text-[13px] text-[#444654] shadow-xs">
          <AlertCircle size={18} className="text-[#3C61DD] shrink-0" />
          <p>
            <strong className="text-[#1A1B23]">Jurisdiction context:</strong> KBIS is shown as a France-specific example. Other jurisdictions may use equivalent official registration documents.
          </p>
        </div>
      </div>
    </section>
  );
}
