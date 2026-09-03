'use client';

import { FileText, Download, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';

export default function FinancialRecordsSection() {
  const steps = [
    'PROJECT COMPLETED',
    'PAYMENT RELEASED',
    'INVOICE GENERATED',
    'PDF RECORD',
    'TAX / VAT CONTEXT',
    'YEAR-END EXPORT',
  ];

  const capabilities = ['AUTO-INVOICE', 'PDF DOWNLOAD', 'VAT CONTEXT', 'YEAR-END EXPORT'];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#747685] uppercase tracking-wider">
            KEEP THE FINANCIAL RECORD CONNECTED
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            A completed project should
            <br />
            leave more than a payment.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Mondial can connect completed work to invoices, transaction records and relevant tax or VAT context so Providers have a clearer record of platform earnings.
          </p>
        </div>

        {/* 6-Step Financial Document Journey Banner */}
        <div className="p-4 sm:p-5 rounded-[20px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-2xs flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-[11px] sm:text-[12px] font-bold text-[#1A1B23]">
          {steps.map((st, idx) => (
            <span key={st} className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-[8px] bg-white border border-[#E2E1EC]">
                {st}
              </span>
              {idx < steps.length - 1 && <span className="text-[#3C61DD]">➔</span>}
            </span>
          ))}
        </div>

        {/* Illustrative Invoice & Regional Context Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left: Illustrative Invoice Card (7 cols) */}
          <div className="lg:col-span-7 p-6 sm:p-8 rounded-[28px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(0,0,0,0.06)]">
                <div>
                  <span className="text-[10px] font-bold text-[#747685] uppercase block">
                    INVOICE SPECIMEN
                  </span>
                  <h3 className="font-heading font-bold text-[18px] text-[#1A1B23]">
                    Nova Space Backend Integration
                  </h3>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-0.5 rounded bg-[#E8F8EE] text-[#157A55] text-[10px] font-bold">
                    PAID
                  </span>
                  <p className="text-[11px] text-[#747685] mt-1">Oct 24, 2023</p>
                </div>
              </div>

              <div className="space-y-2 text-[13px]">
                <div className="flex justify-between">
                  <span className="text-[#444654]">Gross Project Amount:</span>
                  <span className="font-bold text-[#1A1B23]">$1,000.00</span>
                </div>
                <div className="flex justify-between text-[#BA1A1A]">
                  <span>Platform Fee (8%):</span>
                  <span className="font-bold">-$80.00</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[rgba(0,0,0,0.06)] font-bold text-[#157A55] text-[15px]">
                  <span>Provider Amount:</span>
                  <span>$920.00</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {capabilities.map((c) => (
                <span
                  key={c}
                  className="px-2.5 py-1 rounded bg-white border border-[#E2E1EC] text-[10px] font-bold text-[#1A47C3]"
                >
                  ✔ {c}
                </span>
              ))}
            </div>
          </div>

          {/* Right: Regional Context & Tax Rules (5 cols) */}
          <div className="lg:col-span-5 p-6 sm:p-8 rounded-[28px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-5">
            <div className="flex flex-col gap-4">
              <span className="text-[11px] font-bold text-[#747685] uppercase tracking-wider">
                REGIONAL COMPLIANCE CONTEXT
              </span>

              <div className="space-y-3 text-[12px]">
                <div className="p-3 rounded-[12px] bg-[#FAF8FF] border border-[#E2E1EC]">
                  <strong className="text-[#1A1B23] block">EU CONTEXT</strong>
                  <p className="text-[#444654] mt-0.5">
                    VAT handling may apply according to relevant transaction context based on Provider and Client domicile.
                  </p>
                </div>

                <div className="p-3 rounded-[12px] bg-[#FAF8FF] border border-[#E2E1EC]">
                  <strong className="text-[#1A1B23] block">INTERNATIONAL CONTEXT</strong>
                  <p className="text-[#444654] mt-0.5">
                    Tax treatment can vary significantly by Provider location and established legal entity status.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mandatory Tax Disclaimer */}
        <div className="p-4 rounded-[16px] bg-[#FAF8FF] border border-[#E2E1EC] text-center text-[12px] text-[#747685]">
          *MONDIAL CAN HELP STRUCTURE PLATFORM RECORDS. IT DOES NOT REPLACE THE PROVIDER&apos;S OWN TAX OBLIGATIONS OR PROFESSIONAL TAX ADVICE.
        </div>
      </div>
    </section>
  );
}
