'use client';

import { CheckCircle2, XCircle, ArrowRight, ShieldCheck, UserCheck, AlertTriangle } from 'lucide-react';

export default function OpportunityFitSection() {
  const fitSignals = [
    'Skills overlap',
    'Service category',
    'Availability',
    'Project context',
    'Engagement model',
    'Timing',
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#747685] uppercase tracking-wider">
            RELEVANCE BEFORE RESPONSE
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            A good opportunity should
            <br />
            make sense on both sides.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Mondial can compare service context with the client’s need to help Providers decide which opportunities are worth reviewing.
          </p>
        </div>

        {/* 3 Comparison Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {/* 1. Client Need */}
          <div className="p-6 rounded-[24px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold text-[#747685] uppercase block">
                CLIENT NEED
              </span>
              <h3 className="font-heading font-bold text-[18px] text-[#1A1B23] mt-1">
                Backend Development
              </h3>

              <div className="space-y-1.5 pt-3 text-[12px] text-[#444654]">
                <div>• API Architecture</div>
                <div>• Database Logic</div>
                <div>• Payment Integration</div>
                <div className="pt-2 text-[11px] text-[#747685]">
                  Timing: <strong className="text-[#1A1B23]">MVP Cycle</strong> • Engagement:{' '}
                  <strong className="text-[#1A1B23]">Project</strong>
                </div>
              </div>
            </div>
            <div className="p-2 rounded bg-white text-[11px] font-bold text-[#1A1B23] text-center border border-[#E2E1EC]">
              Nova Space SAS
            </div>
          </div>

          {/* 2. Fit Signals */}
          <div className="p-6 rounded-[24px] bg-white border-2 border-[#157A55] shadow-md flex flex-col justify-between gap-4 text-center">
            <div>
              <span className="px-3 py-1 rounded-full bg-[#E8F8EE] text-[#157A55] text-[11px] font-extrabold uppercase inline-block">
                FIT: HIGH
              </span>
              <h3 className="font-heading font-bold text-[16px] text-[#1A1B23] mt-2">
                Relevance Signals
              </h3>

              <div className="space-y-1.5 pt-3 text-[12px] text-[#157A55]">
                {fitSignals.map((sig) => (
                  <div key={sig} className="flex items-center justify-center gap-1.5 font-medium">
                    <CheckCircle2 size={13} />
                    <span>{sig}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="text-[11px] font-bold text-[#157A55]">Strong Mutual Alignment</div>
          </div>

          {/* 3. Provider Service */}
          <div className="p-6 rounded-[24px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold text-[#3C61DD] uppercase block">
                PROVIDER SERVICE
              </span>
              <h3 className="font-heading font-bold text-[18px] text-[#1A1B23] mt-1">
                Backend Integration for Startup MVPs
              </h3>

              <div className="space-y-1.5 pt-3 text-[12px] text-[#444654]">
                <div>• Capabilities: APIs, Databases, Payments</div>
                <div>• Availability: Available</div>
                <div>• Tier: Verified Professional</div>
              </div>
            </div>
            <div className="p-2 rounded bg-white text-[11px] font-bold text-[#1A1B23] text-center border border-[#E2E1EC]">
              Maya Rahman
            </div>
          </div>
        </div>

        {/* Reality Check: Low Fit Example */}
        <div className="p-5 sm:p-6 rounded-[20px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded bg-red-100 text-[#BA1A1A] text-[10px] font-extrabold uppercase">
              FIT: LOW
            </span>
            <span className="text-[13px] text-[#444654]">
              NEED: French corporate legal review vs PROVIDER: Backend Engineer
            </span>
          </div>
          <span className="text-[12px] font-bold text-[#747685]">
            *Verified status doesn&apos;t mean a fit for everything.
          </span>
        </div>

        {/* Interaction Flow: Match -> Review Context -> Ask / Proposal / Decline */}
        <div className="p-6 sm:p-8 rounded-[24px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col gap-6">
          <span className="text-[11px] font-bold text-[#747685] uppercase tracking-wider">
            INTERACTION FLOW
          </span>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
            <div className="p-4 rounded-[16px] bg-[#FAF8FF] border border-[#E2E1EC] flex flex-col gap-1">
              <span className="text-[10px] font-bold text-[#3C61DD] uppercase">STEP 1</span>
              <h4 className="font-heading font-bold text-[14px] text-[#1A1B23]">MATCH</h4>
              <p className="text-[12px] text-[#747685]">System identifies potential alignment</p>
            </div>

            <div className="p-4 rounded-[16px] bg-[#FAF8FF] border border-[#E2E1EC] flex flex-col gap-1">
              <span className="text-[10px] font-bold text-[#3C61DD] uppercase">STEP 2</span>
              <h4 className="font-heading font-bold text-[14px] text-[#1A1B23]">REVIEW CONTEXT</h4>
              <p className="text-[12px] text-[#747685]">Provider assesses the scope &amp; details</p>
            </div>

            <div className="p-4 rounded-[16px] bg-[#FAF8FF] border border-[#E2E1EC] flex flex-col gap-1">
              <span className="text-[10px] font-bold text-[#3C61DD] uppercase">STEP 3</span>
              <h4 className="font-heading font-bold text-[14px] text-[#1A1B23]">DECIDE</h4>
              <p className="text-[12px] text-[#747685]">Ask Question OR Prepare Proposal OR Decline</p>
            </div>
          </div>
        </div>

        {/* Core Principle Statement */}
        <div className="p-6 sm:p-7 rounded-[20px] bg-[#FAF8FF] border border-[#E2E1EC] text-center shadow-xs flex flex-col gap-1">
          <h3 className="font-heading font-extrabold text-[15px] sm:text-[18px] text-[#070707] uppercase tracking-wide">
            MATCHING SHOULD REDUCE NOISE. IT SHOULD NOT REMOVE HUMAN DECISION.
          </h3>
          <p className="text-[13px] text-[#444654] font-medium">
            The client and Provider remain responsible for deciding whether to proceed.
          </p>
        </div>
      </div>
    </section>
  );
}
