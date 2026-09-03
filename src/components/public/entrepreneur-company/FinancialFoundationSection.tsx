'use client';

import { CreditCard, DollarSign, FileCheck, CheckCircle2, Lock, ShieldCheck } from 'lucide-react';

export default function FinancialFoundationSection() {
  const supportingRecords = [
    { name: 'Bank Certificate', status: 'VERIFIED', color: 'green' },
    { name: 'Tax Certificate', status: 'VERIFIED', color: 'green' },
    { name: 'Financial Statement', status: 'IN REVIEW', color: 'amber' },
    { name: 'Signatory Attestation', status: 'VERIFIED', color: 'green' },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#F9F9FA] border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1224px] flex flex-col gap-10 sm:gap-14">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[900px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            FINANCIAL FOUNDATION
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Connect legal identity to financial reality.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Financial foundation provides structured operating context before Investor Readiness and funding workflows begin.
          </p>
        </div>

        {/* 3-Column Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {/* Column 01: Bank Identity */}
          <div className="bg-white border border-[#E2E1EC] rounded-[24px] p-6 flex flex-col justify-between gap-5 shadow-xs text-[13px]">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 pb-3 border-b border-[rgba(0,0,0,0.06)]">
                <CreditCard size={18} className="text-[#3C61DD]" />
                <h3 className="font-heading font-bold text-[16px] text-[#1A1B23]">BANK IDENTITY</h3>
              </div>

              <div className="flex flex-col gap-3">
                <div>
                  <span className="text-[10px] font-bold text-[#8A8B8F] uppercase block">
                    ACCOUNT HOLDER
                  </span>
                  <p className="font-semibold text-[#1A1B23]">Nova Space SAS</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#8A8B8F] uppercase block">IBAN</span>
                  <div className="p-2 rounded-[6px] bg-[#F3F2FD] font-mono text-[12px] text-[#1A1B23]">
                    FR•• •••• •••• •••• •••• •••
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#8A8B8F] uppercase block">BANK</span>
                  <p className="text-[#444654]">Business Bank</p>
                </div>

                <div className="pt-2 border-t border-[rgba(0,0,0,0.06)] flex flex-col gap-1.5 text-[12px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[#8A8B8F] text-[10px] font-bold uppercase">STATUS</span>
                    <span className="px-2 py-0.5 rounded-[4px] bg-[#E8F8EE] text-[#00A854] text-[10px] font-bold">
                      VERIFIED
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#00A854] font-medium text-[11px]">
                    <CheckCircle2 size={13} />
                    <span>Company Name Match</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[#00A854] font-medium text-[11px]">
                    <CheckCircle2 size={13} />
                    <span>Account Holder Match</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Column 02: Business Financial Status */}
          <div className="bg-white border border-[#E2E1EC] rounded-[24px] p-6 flex flex-col justify-between gap-5 shadow-xs text-[13px]">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 pb-3 border-b border-[rgba(0,0,0,0.06)]">
                <DollarSign size={18} className="text-[#3C61DD]" />
                <h3 className="font-heading font-bold text-[16px] text-[#1A1B23]">
                  BUSINESS FINANCIAL STATUS
                </h3>
              </div>

              <div className="flex flex-col gap-3 text-[12px]">
                <div>
                  <span className="text-[10px] font-bold text-[#8A8B8F] uppercase block">
                    BUSINESS STAGE
                  </span>
                  <p className="font-semibold text-[#1A1B23]">Revenue Generating</p>
                </div>

                <div className="flex items-center justify-between p-2 rounded-[8px] bg-[#FAF8FF]">
                  <span className="text-[#444654]">Revenue Information</span>
                  <span className="px-2 py-0.5 rounded bg-[#E2E1EC] text-[#444654] text-[9px] font-bold uppercase flex items-center gap-1">
                    <Lock size={9} />
                    <span>PRIVATE / CONTROLLED</span>
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-[8px] bg-[#FAF8FF]">
                  <span className="text-[#444654]">Operating Costs</span>
                  <span className="px-2 py-0.5 rounded bg-[#E8E7F2] text-[#1A1B23] text-[9px] font-bold uppercase">
                    AVAILABLE
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-[8px] bg-[#FAF8FF]">
                  <span className="text-[#444654]">Cash Position</span>
                  <span className="px-2 py-0.5 rounded bg-[#E8E7F2] text-[#1A1B23] text-[9px] font-bold uppercase">
                    AVAILABLE
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-[8px] bg-[#FAF8FF]">
                  <span className="text-[#444654]">Financial History</span>
                  <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-[9px] font-bold uppercase border border-amber-200">
                    PARTIAL
                  </span>
                </div>

                <div className="pt-2 border-t border-[rgba(0,0,0,0.06)]">
                  <span className="text-[10px] font-bold text-[#8A8B8F] uppercase block">
                    ACCOUNTING PERIOD
                  </span>
                  <span className="font-medium text-[#1A1B23]">Current Year</span>
                </div>
              </div>
            </div>
          </div>

          {/* Column 03: Supporting Records */}
          <div className="bg-white border border-[#E2E1EC] rounded-[24px] p-6 flex flex-col justify-between gap-5 shadow-xs text-[13px]">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 pb-3 border-b border-[rgba(0,0,0,0.06)]">
                <FileCheck size={18} className="text-[#3C61DD]" />
                <h3 className="font-heading font-bold text-[16px] text-[#1A1B23]">
                  SUPPORTING RECORDS
                </h3>
              </div>

              <div className="flex flex-col gap-2 text-[12px]">
                {supportingRecords.map((r) => (
                  <div
                    key={r.name}
                    className="p-3 rounded-[10px] bg-[#FAF8FF] border border-[rgba(0,0,0,0.04)] flex items-center justify-between shadow-2xs"
                  >
                    <span className="font-medium text-[#1A1B23]">{r.name}</span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-[4px] uppercase ${
                        r.color === 'green'
                          ? 'bg-[#E8F8EE] text-[#00A854]'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-[10px] bg-[#F1F5FF] flex items-center justify-between text-[11px]">
              <span className="text-[#8A8B8F] uppercase font-bold">FINANCIAL READINESS</span>
              <span className="font-bold text-[#3C61DD]">78%</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
