'use client';

import { ArrowRight, CheckCircle2, FileText, UserCheck, ShieldCheck, Sparkles, MessageSquare } from 'lucide-react';

export default function ProviderBriefSection() {
  const steps = ['DISCUSSION', 'SCOPE ALIGNMENT', 'AGREEMENT', 'ACTIVE PROJECT'];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            FROM NEED TO EXPERTISE
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Give Providers the context
            <br />
            behind the work.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            A company need becomes more useful when scope, required skills, expected outcomes and business impact are clear before Provider discovery begins.
          </p>
        </div>

        {/* 3-Step Cinematic Story Cards */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          {/* Step 1: Company Need (4 cols) */}
          <div className="md:col-span-4 bg-[#FAF8FF] border border-[#E2E1EC] rounded-[24px] p-6 flex flex-col justify-between gap-6 shadow-xs text-[13px]">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 pb-2 border-b border-[rgba(0,0,0,0.06)]">
                <FileText size={16} className="text-[#3C61DD]" />
                <span className="font-heading font-bold text-[14px] text-[#1A1B23] uppercase">
                  COMPANY NEED
                </span>
              </div>

              <div>
                <h3 className="font-heading font-bold text-[22px] text-[#1A1B23]">
                  Backend Integration
                </h3>
                <span className="text-[12px] font-bold text-[#3C61DD]">Nova Space MVP</span>
              </div>

              <p className="text-[#444654] italic leading-relaxed">
                &ldquo;The booking flow cannot move into transaction testing without backend infrastructure.&rdquo;
              </p>
            </div>
          </div>

          {/* Step 2: Structured Brief (4 cols) */}
          <div className="md:col-span-4 bg-white border-2 border-[#157A55]/30 rounded-[24px] p-6 flex flex-col justify-between gap-5 shadow-sm text-[12px]">
            <div className="flex flex-col gap-3.5">
              <div className="flex items-center gap-2 pb-2 border-b border-[rgba(0,0,0,0.06)]">
                <ShieldCheck size={16} className="text-[#157A55]" />
                <span className="font-heading font-bold text-[14px] text-[#1A1B23] uppercase">
                  STRUCTURED BRIEF
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-[#747685] uppercase">Scope</span>
                <p className="font-semibold text-[#1A1B23]">
                  Booking Logic, API Architecture, Database, Payment Integration
                </p>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-[#747685] uppercase">
                  Expected Outcome
                </span>
                <p className="text-[#444654]">
                  Working backend foundation for MVP testing
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[rgba(0,0,0,0.04)]">
                <div>
                  <span className="text-[9px] font-bold text-[#747685] uppercase block">
                    Engagement
                  </span>
                  <span className="font-medium text-[#1A1B23]">Project-based</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-[#747685] uppercase block">Timing</span>
                  <span className="font-medium text-[#1A1B23]">MVP cycle</span>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: Relevant Expertise (4 cols) */}
          <div className="md:col-span-4 bg-white border border-[#E2E1EC] rounded-[24px] p-6 flex flex-col justify-between gap-5 shadow-xs text-[12px]">
            <div className="flex flex-col gap-3.5">
              <div className="flex items-center gap-2 pb-2 border-b border-[rgba(0,0,0,0.06)]">
                <UserCheck size={16} className="text-[#3C61DD]" />
                <span className="font-heading font-bold text-[14px] text-[#1A1B23] uppercase">
                  RELEVANT EXPERTISE
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#E2E1EC] flex items-center justify-center font-heading font-bold text-[#3C61DD] text-[16px]">
                  MR
                </div>
                <div>
                  <h4 className="font-heading font-bold text-[18px] text-[#1A1B23]">
                    MAYA RAHMAN
                  </h4>
                  <span className="text-[12px] text-[#444654]">Backend Engineering</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-[#E8F8EE] text-[#157A55] text-[10px] font-bold uppercase inline-flex items-center gap-1">
                  <CheckCircle2 size={11} />
                  <span>VERIFIED TIER 3</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-[#FAF8FF] border border-[#E2E1EC] text-[#444654] text-[10px] font-bold">
                  APIs
                </span>
                <span className="px-2 py-0.5 rounded bg-[#FAF8FF] border border-[#E2E1EC] text-[#444654] text-[10px] font-bold">
                  Databases
                </span>
              </div>

              <div className="pt-2 border-t border-[rgba(0,0,0,0.04)] flex items-center justify-between">
                <span className="text-[10px] text-[#747685] uppercase">Status</span>
                <span className="text-[#157A55] font-bold text-[11px] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#157A55]" />
                  AVAILABLE
                </span>
              </div>
            </div>

            <span className="text-[10px] text-[#8A8B8F] italic">
              Demonstration persona. Not a real provider profile.
            </span>
          </div>
        </div>

        {/* 4-Step Process Bar */}
        <div className="bg-[#FAF8FF] border border-[#E2E1EC] rounded-[20px] p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4 text-[12px] font-bold">
          {steps.map((step, idx) => (
            <div key={step} className="flex items-center gap-3">
              <span className="text-[#1A1B23] tracking-wide">{step}</span>
              {idx < steps.length - 1 && <ArrowRight size={14} className="text-[#C4C5D6]" />}
            </div>
          ))}
        </div>

        {/* Bottom Principle Banner */}
        <div className="w-full p-6 sm:p-8 rounded-[20px] bg-white border border-[#E2E1EC] text-center shadow-xs flex flex-col gap-2">
          <p className="font-heading font-extrabold text-[16px] sm:text-[18px] text-[#070707] uppercase tracking-wide">
            BUSINESS CONTEXT FIRST. PROVIDER DISCOVERY SECOND.
          </p>
          <p className="text-[13px] text-[#444654]">
            Matching helps identify relevant expertise. The Entrepreneur still controls selection, scope and agreement.
          </p>
        </div>
      </div>
    </section>
  );
}
