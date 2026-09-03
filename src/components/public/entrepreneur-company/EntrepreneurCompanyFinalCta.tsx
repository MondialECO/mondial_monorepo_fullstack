'use client';

import Link from 'next/link';
import { CheckCircle2, ArrowRight, Building2, RefreshCw } from 'lucide-react';

export default function EntrepreneurCompanyFinalCta() {
  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#FAF8FF] flex justify-center">
      <div className="w-full max-w-[1224px] bg-white border border-[#E2E1EC] rounded-[28px] overflow-hidden shadow-xl grid grid-cols-1 lg:grid-cols-12 items-stretch">
        {/* Left: Status Micro-Summary (4 cols) */}
        <div className="lg:col-span-4 bg-[#F3F2FD] p-6 sm:p-8 flex flex-col justify-between gap-6 border-b lg:border-b-0 lg:border-r border-[#E2E1EC]">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2.5 text-[11px] font-bold text-[#444654] uppercase tracking-wider">
              <Building2 size={16} className="text-[#3C61DD]" />
              <span>ENTITY PROFILE</span>
            </div>

            <h3 className="font-heading font-bold text-[22px] text-[#1A1B23]">
              NOVA SPACE SAS
            </h3>

            <div className="flex flex-col gap-3 pt-2 text-[12px]">
              <div className="flex items-center justify-between pb-2 border-b border-[rgba(0,0,0,0.06)]">
                <span className="text-[#444654]">Foundation Status</span>
                <span className="font-bold text-[#157A55] flex items-center gap-1">
                  <CheckCircle2 size={13} />
                  Verified
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#444654]">System Readiness</span>
                <span className="font-bold text-[#3C61DD]">86% Ready</span>
              </div>
            </div>
          </div>

          <span className="text-[10px] text-[#8A8B8F] uppercase font-bold">
            ILLUSTRATIVE DEMO CONTEXT
          </span>
        </div>

        {/* Right: Action (8 cols) */}
        <div className="lg:col-span-8 p-6 sm:p-10 flex flex-col justify-between gap-8 bg-white">
          <div className="flex flex-col gap-3">
            <h2 className="text-[28px] sm:text-[34px] font-heading font-bold text-[#1A1B23] leading-tight">
              Your company is structured.
              <br />
              Now start building.
            </h2>
            <p className="text-[15px] text-[#444654] leading-relaxed max-w-[640px]">
              Proceed to Phase 02 to assemble your resources, access the marketplace, and drive operational execution.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/for-entrepreneurs/build-execute"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#3C61DD] hover:bg-[#3252BF] text-white font-medium text-[15px] rounded-[10px] transition-all shadow-sm group"
            >
              <span>Continue to Build &amp; Execute</span>
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              href="/for-entrepreneurs"
              className="inline-flex items-center gap-2 px-5 py-3.5 bg-white hover:bg-[#FAF8FF] border border-[#E2E1EC] text-[#1A47C3] font-medium text-[15px] rounded-[10px] transition-colors shadow-xs"
            >
              <RefreshCw size={15} />
              <span>Review Entrepreneur Journey</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
