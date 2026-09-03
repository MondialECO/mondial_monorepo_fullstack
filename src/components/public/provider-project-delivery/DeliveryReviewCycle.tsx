'use client';

import { CheckCircle2, RotateCcw, ArrowRight, AlertCircle, FileText } from 'lucide-react';

export default function DeliveryReviewCycle() {
  const revisionSteps = [
    { num: 'STEP 1', title: 'Original Scope' },
    { num: 'STEP 2', title: 'Client Feedback' },
    { num: 'STEP 3', title: 'Revision Request' },
    { num: 'STEP 4', title: 'Updated Deliverable' },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#FAF8FF] border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            DELIVERY IS A REVIEW CYCLE
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Submitting the work
            <br />
            is not always the end.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Deliverables move through client review so work can be approved, clarified or revised according to the agreed project structure.
          </p>
        </div>

        {/* Path A vs Path B Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Path A: Approved */}
          <div className="p-6 sm:p-8 rounded-[28px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-6">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#157A55] uppercase">
                  PATH A
                </span>
                <CheckCircle2 size={18} className="text-[#157A55]" />
              </div>
              <h3 className="font-heading font-bold text-[18px] text-[#1A1B23]">
                DELIVERABLE APPROVED
              </h3>
              <p className="text-[13px] text-[#444654]">
                The client verifies the submission against the agreed Statement of Work.
              </p>
            </div>
            <div className="p-3 rounded-[12px] bg-[#E8F8EE] text-[#157A55] text-[12px] font-bold text-center">
              ✔ Milestone Complete ➔ Project Progresses
            </div>
          </div>

          {/* Path B: Revision */}
          <div className="p-6 sm:p-8 rounded-[28px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-6">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#3C61DD] uppercase">
                  PATH B
                </span>
                <RotateCcw size={18} className="text-[#3C61DD]" />
              </div>
              <h3 className="font-heading font-bold text-[18px] text-[#1A1B23]">
                REVISION REQUESTED
              </h3>
              <p className="text-[13px] text-[#444654]">
                Structured feedback identifying specific scope adjustments or clarification.
              </p>
            </div>
            <div className="p-3 rounded-[12px] bg-[#F3F2FD] text-[#1A47C3] text-[12px] font-bold text-center">
              Clear Feedback ➔ Updated Work ➔ Resubmit
            </div>
          </div>
        </div>

        {/* Illustrative Milestone Card */}
        <div className="p-6 sm:p-8 rounded-[28px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[rgba(0,0,0,0.06)]">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-0.5 rounded bg-[#FAF8FF] border border-[#E2E1EC] text-[10px] font-extrabold uppercase text-[#1A1B23]">
                ILLUSTRATIVE EXAMPLE
              </span>
              <h4 className="font-heading font-bold text-[15px] sm:text-[17px] text-[#1A1B23]">
                MILESTONE 02 — UI / Booking Integration
              </h4>
            </div>
            <div className="text-[11px] text-[#747685]">
              Submitted: <strong className="text-[#1A1B23]">June 18</strong> • Revision:{' '}
              <strong className="text-[#1A1B23]">1 of 3</strong>
            </div>
          </div>

          <div className="p-4 rounded-[16px] bg-[#FAF8FF] border border-[#E2E1EC] flex flex-col gap-1.5 text-[12px]">
            <span className="font-bold text-[#BA1A1A]">CLIENT RESPONSE: REVISION REQUESTED</span>
            <p className="text-[#444654]">
              Reason: Payment-state handling needs clarification based on updated requirements document.
            </p>
          </div>
        </div>

        {/* Revision Logic Grid */}
        <div className="p-6 sm:p-8 rounded-[24px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col gap-5">
          <span className="text-[11px] font-bold text-[#747685] uppercase tracking-wider">
            REVISION SHOULD CONNECT BACK TO AGREED SCOPE
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {revisionSteps.map((st) => (
              <div
                key={st.num}
                className="p-3 rounded-[12px] bg-[#FAF8FF] border border-[#E2E1EC] text-center"
              >
                <span className="text-[10px] font-bold text-[#3C61DD] uppercase block">
                  {st.num}
                </span>
                <span className="font-bold text-[12px] text-[#1A1B23]">{st.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Section Statement */}
        <div className="p-6 sm:p-7 rounded-[20px] bg-white border border-[#E2E1EC] text-center shadow-xs">
          <h3 className="font-heading font-extrabold text-[15px] sm:text-[18px] text-[#070707] uppercase tracking-wide">
            &ldquo;GOOD REVISION IS NOT &apos;DO MORE.&apos;
            <br />
            IT IS: &apos;BRING THE AGREED WORK CLOSER TO ACCEPTANCE.&apos;&rdquo;
          </h3>
        </div>
      </div>
    </section>
  );
}
