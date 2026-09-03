'use client';

import { Star, CheckCircle2, ArrowRight, ArrowDown, ThumbsUp, MessageSquare } from 'lucide-react';

export default function ProviderReviewTrustSection() {
  const tags = ['Delivered On Time', 'Clear Communication', 'Strong Technical Context'];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#FAF8FF] border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            AFTER THE DELIVERY
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            A review is not decoration.
            <br />
            It becomes part of trust.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Completed work can produce structured feedback that helps future clients understand how the Provider performed in a real engagement.
          </p>
        </div>

        {/* 3-Step Project -> Review -> Reputation Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {/* Step 1: Completed Project */}
          <div className="p-6 rounded-[24px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold text-[#747685] uppercase block">
                STEP 1 — PROJECT
              </span>
              <h3 className="font-heading font-bold text-[18px] text-[#1A1B23] mt-1">
                Nova Space Backend Integration
              </h3>
              <p className="text-[12px] text-[#747685] mt-1">
                4-week milestone engagement completed.
              </p>
            </div>
            <div className="p-2.5 rounded-[10px] bg-[#E8F8EE] text-[#157A55] text-[11px] font-bold text-center">
              ✔ DELIVERY APPROVED
            </div>
          </div>

          {/* Step 2: Illustrative Review */}
          <div className="p-6 rounded-[24px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#3C61DD] uppercase">
                  STEP 2 — CLIENT FEEDBACK
                </span>
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} fill="currentColor" />
                  ))}
                </div>
              </div>
              <p className="font-serif italic text-[14px] text-[#1A1B23] mt-2">
                &ldquo;Clear communication and reliable delivery.&rdquo;
              </p>

              <div className="flex flex-wrap gap-1.5 pt-3">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 rounded bg-[#FAF8FF] border border-[#E2E1EC] text-[10px] font-bold text-[#1A1B23]"
                  >
                    ✔ {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="text-[11px] text-[#747685]">Verified Client Review</div>
          </div>

          {/* Step 3: Reputation Logic */}
          <div className="p-6 rounded-[24px] bg-white border-2 border-[#157A55] shadow-md flex flex-col justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold text-[#157A55] uppercase block">
                STEP 3 — REPUTATION SIGNAL
              </span>
              <h3 className="font-heading font-bold text-[18px] text-[#1A1B23] mt-1">
                Reputation Compounding
              </h3>

              <div className="space-y-1.5 pt-2 text-[12px] text-[#444654]">
                <div>• Public Reputation Signal</div>
                <div>• Mondial Score Input</div>
                <div>• Future Client Context</div>
              </div>
            </div>
            <div className="p-2.5 rounded-[10px] bg-[#E8F8EE] text-[#157A55] text-[11px] font-bold text-center">
              Strengthened Ecosystem Standing
            </div>
          </div>
        </div>

        {/* Reciprocal Feedback & Reputation Equation */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Reciprocal Feedback (5 cols) */}
          <div className="lg:col-span-5 p-6 rounded-[24px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-3">
            <span className="text-[11px] font-bold text-[#747685] uppercase tracking-wider">
              RECIPROCAL FEEDBACK
            </span>
            <div className="p-3 rounded-[12px] bg-[#FAF8FF] border border-[#E2E1EC] text-[12px] space-y-1">
              <div className="font-bold text-[#1A1B23]">Private Internal Feedback:</div>
              <div className="text-[#444654]">• Recommended for future work</div>
              <div className="text-[#444654]">• Strong Communication Quality</div>
              <div className="text-[#157A55] font-bold pt-1">Status: POSITIVE</div>
            </div>
          </div>

          {/* Reputation Equation (7 cols) */}
          <div className="lg:col-span-7 p-6 rounded-[24px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-3">
            <span className="text-[11px] font-bold text-[#747685] uppercase tracking-wider">
              REPUTATION EQUATION
            </span>
            <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-[12px] bg-[#FAF8FF] border border-[#E2E1EC] text-[12px] font-bold text-[#1A1B23]">
              <span>DELIVERY HISTORY</span>
              <span className="text-[#3C61DD]">+</span>
              <span>CLIENT FEEDBACK</span>
              <span className="text-[#3C61DD]">➔</span>
              <span className="px-3 py-1 rounded bg-[#1A47C3] text-white">
                STRONGER REPUTATION CONTEXT
              </span>
            </div>
          </div>
        </div>

        {/* Core Statement */}
        <div className="p-6 sm:p-7 rounded-[20px] bg-white border border-[#E2E1EC] text-center shadow-xs">
          <h3 className="font-heading font-extrabold text-[15px] sm:text-[18px] text-[#070707] uppercase tracking-wide">
            A REVIEW SHOULD BE CONNECTED TO REAL COMPLETED WORK.
            <br />
            NOT FLOAT WITHOUT CONTEXT.
          </h3>
        </div>
      </div>
    </section>
  );
}
