'use client';

import { ArrowRight, CheckCircle2, MessageSquare, RefreshCw, Scale } from 'lucide-react';

export default function AlignmentNegotiationSection() {
  const steps = ['PROPOSAL', 'QUESTION', 'COUNTER', 'CLARIFICATION', 'AGREED COMMERCIAL SCOPE'];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#747685] uppercase tracking-wider">
            ALIGN BEFORE YOU COMMIT
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            A good negotiation makes expectations clearer.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Clients and Providers may need to adjust price, timeline, scope or milestones before both sides are ready to proceed.
          </p>
        </div>

        {/* Negotiation Flow Banner */}
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

        {/* Provider Proposal vs Counter vs Agreed Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {/* 1. Provider Proposal */}
          <div className="p-6 rounded-[24px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold text-[#3C61DD] uppercase block">
                INITIAL PROPOSAL
              </span>
              <h3 className="font-heading font-bold text-[18px] text-[#1A1B23] mt-1">
                Provider Offer
              </h3>

              <div className="space-y-2 pt-3 text-[12px] text-[#444654]">
                <div>• Price: <strong className="text-[#1A1B23]">€3,000</strong></div>
                <div>• Timeline: <strong className="text-[#1A1B23]">4 weeks</strong></div>
                <div>• Structure: <strong className="text-[#1A1B23]">3 milestones</strong></div>
                <div>• Scope: <strong className="text-[#1A1B23]">Backend + Payment Integration</strong></div>
              </div>
            </div>
          </div>

          {/* 2. Client Counter */}
          <div className="p-6 rounded-[24px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold text-[#747685] uppercase block">
                CLIENT COUNTER
              </span>
              <h3 className="font-heading font-bold text-[18px] text-[#1A1B23] mt-1">
                Client Adjustment
              </h3>

              <div className="space-y-2 pt-3 text-[12px] text-[#444654]">
                <div>• Price: <strong className="text-[#1A1B23]">€2,500</strong></div>
                <div>• Timeline: <strong className="text-[#1A1B23]">Same deadline</strong></div>
                <div>• Structure: <strong className="text-[#1A1B23]">Reduced first milestone</strong></div>
                <div>• Scope: <strong className="text-[#1A1B23]">Payment feature moved later</strong></div>
              </div>
            </div>
          </div>

          {/* 3. Agreed Scope */}
          <div className="p-6 rounded-[24px] bg-white border-2 border-[#157A55] shadow-md flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#157A55] uppercase block">
                  AGREED SCOPE
                </span>
                <span className="px-2 py-0.5 rounded bg-[#E8F8EE] text-[#157A55] text-[9px] font-extrabold uppercase">
                  ILLUSTRATIVE EXAMPLE
                </span>
              </div>
              <h3 className="font-heading font-bold text-[18px] text-[#1A1B23] mt-1">
                Final Commercial Agreement
              </h3>

              <div className="space-y-2 pt-3 text-[12px] text-[#157A55]">
                <div>• Final Price: <strong className="text-[#1A1B23]">€2,700</strong></div>
                <div>• Final Timeline: <strong className="text-[#1A1B23]">4 weeks</strong></div>
                <div className="pt-1 font-semibold text-[#1A1B23]">Revised Milestones:</div>
                <div className="text-[11px] text-[#444654] pl-2 space-y-0.5">
                  <div>01 Architecture</div>
                  <div>02 Booking Backend</div>
                  <div>03 Payment + Testing</div>
                </div>
              </div>
            </div>
            <div className="text-[11px] font-bold text-[#157A55] text-center p-2 rounded bg-[#E8F8EE]">
              ✔ Mutually Confirmed
            </div>
          </div>
        </div>

        {/* Section Statement */}
        <div className="p-6 sm:p-7 rounded-[20px] bg-[#FAF8FF] border border-[#E2E1EC] text-center shadow-xs flex flex-col gap-1.5">
          <h3 className="font-heading font-extrabold text-[15px] sm:text-[18px] text-[#070707] uppercase tracking-wide">
            NEGOTIATION SHOULD CHANGE THE AGREEMENT. NOT CREATE AN UNRECORDED PROMISE.
          </h3>
          <p className="text-[13px] text-[#444654] font-medium">
            An agreed proposal still needs to move through the applicable booking, contract and payment process before work begins.
          </p>
        </div>
      </div>
    </section>
  );
}
