'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export default function ProviderServicesNextStage() {
  const stages = [
    { num: '01. VERIFY & PROFILE', status: 'COMPLETE', isComplete: true, isCurrent: false },
    { num: '02. SERVICES & OPPORTUNITIES', status: 'CURRENT', isComplete: false, isCurrent: true },
    { num: '03. PROJECTS & DELIVERY', status: 'NEXT', isComplete: false, isCurrent: false },
    { num: '04. EARNINGS & GROWTH', status: 'FUTURE', isComplete: false, isCurrent: false },
  ];

  const breadcrumbs = [
    'OPPORTUNITY',
    'PROPOSAL',
    'DISCUSSION',
    'BOOKING',
    'CONTRACT',
    'ESCROW',
    'WORKROOM',
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#F1F1F2]/60 border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Panel: Provider Journey (4 cols) */}
          <div className="lg:col-span-4 p-6 sm:p-8 rounded-[28px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-6">
            <div className="flex flex-col gap-5">
              <span className="text-[11px] font-bold text-[#747685] uppercase tracking-wider">
                PROVIDER JOURNEY
              </span>

              <div className="space-y-4">
                {stages.map((st) => (
                  <div
                    key={st.num}
                    className={`p-4 rounded-[16px] border transition-all ${
                      st.isCurrent
                        ? 'bg-[#F3F2FD] border-[#3C61DD] shadow-xs'
                        : st.isComplete
                        ? 'bg-[#FAF8FF] border-[#E2E1EC]'
                        : 'bg-[#FAF8FF] border-[#E2E1EC]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h4
                        className={`font-heading font-bold text-[14px] ${
                          st.isCurrent ? 'text-[#1A47C3]' : 'text-[#1A1B23]'
                        }`}
                      >
                        {st.num}
                      </h4>
                      {st.isComplete && (
                        <CheckCircle2 size={16} className="text-[#157A55]" />
                      )}
                      {st.isCurrent && (
                        <span className="w-2.5 h-2.5 rounded-full bg-[#1A47C3]" />
                      )}
                    </div>
                    <span
                      className={`text-[12px] font-medium mt-0.5 block ${
                        st.isCurrent ? 'text-[#3C61DD]' : 'text-[#747685]'
                      }`}
                    >
                      {st.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel: Next Stage Transition (8 cols) */}
          <div className="lg:col-span-8 p-6 sm:p-10 rounded-[28px] bg-[#F3F2FD] border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-8">
            <div className="flex flex-col gap-4">
              <span className="px-3 py-1 rounded-full bg-[#DCE1FF] text-[#1A47C3] text-[11px] font-bold uppercase tracking-wider w-fit">
                NEXT — PROJECTS &amp; DELIVERY
              </span>

              <h3 className="text-[26px] sm:text-[36px] font-heading font-bold text-[#070707] leading-tight">
                An opportunity is only the beginning.
                <br />
                Now turn interest into an agreed project.
              </h3>

              <p className="text-[15px] sm:text-[17px] text-[#444654] leading-relaxed">
                Move from opportunity review to proposal, negotiation, contract, escrow, workroom, milestones and completed delivery.
              </p>

              {/* Breadcrumb Flow */}
              <div className="p-4 rounded-[16px] bg-white border border-[#E2E1EC] flex flex-wrap items-center justify-center gap-2 text-[11px] font-bold text-[#1A1B23] mt-2">
                {breadcrumbs.map((crumb, idx) => (
                  <span key={crumb} className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded bg-[#FAF8FF] border border-[#E2E1EC]">
                      {crumb}
                    </span>
                    {idx < breadcrumbs.length - 1 && (
                      <span className="text-[#3C61DD]">➔</span>
                    )}
                  </span>
                ))}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-3 pt-4">
                <Link
                  href="/for-service-providers/project-delivery"
                  className="px-6 py-3.5 bg-[#1A47C3] hover:bg-[#133595] text-white font-semibold text-[14px] rounded-[10px] transition-all shadow-sm inline-flex items-center gap-2 group"
                >
                  <span>Continue to Projects &amp; Delivery</span>
                  <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                </Link>

                <Link
                  href="/for-service-providers"
                  className="px-5 py-3.5 bg-white hover:bg-[#FAF8FF] border border-[#E2E1EC] text-[#1A47C3] font-semibold text-[14px] rounded-[10px] transition-colors"
                >
                  Back to Provider Journey
                </Link>
              </div>
            </div>

            {/* Bottom Metadata */}
            <div className="flex flex-wrap items-center justify-between text-[12px] text-[#747685] pt-4 border-t border-[rgba(0,0,0,0.06)]">
              <span>Service Provider Page 02 — Services &amp; Opportunities</span>
              <span className="font-semibold text-[#1A47C3]">
                NEXT: PROJECTS &amp; DELIVERY ➔
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
