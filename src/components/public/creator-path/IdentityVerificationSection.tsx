'use client';

import Link from 'next/link';
import { CheckCircle2, User, Sparkles, ArrowRight } from 'lucide-react';

export default function IdentityVerificationSection() {
  return (
    <section
      className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#F9F9FA] border-t border-[rgba(0,0,0,0.06)] flex justify-center"
    >
      <div className="w-full max-w-[1224px] flex flex-col gap-10 sm:gap-12">
        {/* Header */}
        <div className="flex flex-col gap-3.5 max-w-[760px]">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F1F5FF] text-[#3C61DD] text-[11px] font-semibold tracking-wider uppercase w-fit border border-[#3C61DD]/20">
            CHAPTER I — DEFINE | PHASE 01 + PHASE 02
          </div>
          <h2 className="text-[32px] sm:text-[42px] lg:text-[48px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            First build trust. Then define the project.
          </h2>
          <p className="text-[15px] sm:text-[16px] text-[#5E5E5E] leading-[1.6]">
            The project begins with a trusted person behind it.
          </p>
        </div>

        {/* Split Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Left: Creator Profile Card */}
          <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-[20px] p-6 sm:p-7 flex flex-col justify-between gap-6 shadow-sm">
            <div className="flex flex-col gap-5">
              {/* Profile Card Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[rgba(0,0,0,0.06)]">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-[#F1F5FF] text-[#3C61DD] flex items-center justify-center font-bold text-[14px]">
                    <User size={20} />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-[16px] text-[#070707]">Henry</h3>
                    <p className="text-[12px] text-[#8A8B8F]">Nova Space Creator</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-[6px] bg-amber-50 text-amber-700 font-semibold text-[11px] border border-amber-200">
                  DRAFT STATUS
                </span>
              </div>

              {/* Verification Checklist */}
              <div className="flex flex-col gap-3 text-[13px]">
                <div className="flex items-center justify-between py-1 border-b border-[rgba(0,0,0,0.04)]">
                  <span className="font-semibold text-[#5E5E5E]">Identity Verification</span>
                  <div className="flex items-center gap-1.5 text-[#00A854] font-bold text-[12px]">
                    <CheckCircle2 size={15} />
                    <span>VERIFIED</span>
                  </div>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-[rgba(0,0,0,0.04)]">
                  <span className="font-semibold text-[#5E5E5E]">Email Verification</span>
                  <div className="flex items-center gap-1.5 text-[#00A854] font-bold text-[12px]">
                    <CheckCircle2 size={15} />
                    <span>VERIFIED</span>
                  </div>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="font-semibold text-[#5E5E5E]">Phone Verification</span>
                  <div className="flex items-center gap-1.5 text-[#00A854] font-bold text-[12px]">
                    <CheckCircle2 size={15} />
                    <span>VERIFIED</span>
                  </div>
                </div>
              </div>

              {/* Profile Readiness Bar */}
              <div className="flex flex-col gap-2 pt-2 border-t border-[rgba(0,0,0,0.06)]">
                <div className="flex justify-between items-center text-[12px] font-bold">
                  <span className="text-[#070707]">Profile Readiness</span>
                  <span className="text-[#00A854]">100%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#EDEDED] overflow-hidden">
                  <div className="w-full h-full bg-[#00A854]" />
                </div>
              </div>
            </div>

            {/* Active Badge */}
            <div className="w-full py-2.5 px-4 rounded-[12px] bg-[#D4FFE5] border border-[#00A854]/30 text-center font-heading font-bold text-[12px] text-[#00A854] uppercase tracking-wider">
              VERIFIED CREATOR BADGE ACTIVE
            </div>
          </div>

          {/* Right: Project Identity Card */}
          <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-[20px] p-6 sm:p-7 flex flex-col justify-between gap-6 shadow-sm">
            <div className="flex flex-col gap-5">
              {/* Project Card Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[rgba(0,0,0,0.06)]">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-[12px] bg-[#F1F5FF] text-[#3C61DD] flex items-center justify-center">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-[16px] text-[#070707]">Project Identity</h3>
                    <p className="text-[12px] text-[#8A8B8F]">Phase 02 Setup</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-[6px] bg-[#F1F5FF] text-[#3C61DD] font-semibold text-[11px] border border-[#3C61DD]/20">
                  FLOW CREATED
                </span>
              </div>

              {/* Project Fields */}
              <div className="flex flex-col gap-2.5 text-[12px]">
                <div className="flex items-start justify-between py-1 border-b border-[rgba(0,0,0,0.04)]">
                  <span className="font-bold text-[#070707] uppercase text-[11px] shrink-0 w-36">ONE-LINE CONCEPT:</span>
                  <span className="text-[#5E5E5E] text-right">Book verified local workspaces by the hour.</span>
                </div>
                <div className="flex items-start justify-between py-1 border-b border-[rgba(0,0,0,0.04)]">
                  <span className="font-bold text-[#070707] uppercase text-[11px] shrink-0 w-36">TARGET CUSTOMER:</span>
                  <span className="text-[#5E5E5E] text-right">Independent professionals.</span>
                </div>
                <div className="flex items-start justify-between py-1 border-b border-[rgba(0,0,0,0.04)]">
                  <span className="font-bold text-[#070707] uppercase text-[11px] shrink-0 w-36">POSITIONING:</span>
                  <span className="text-[#5E5E5E] text-right">Local, Flexible, Verified.</span>
                </div>
                <div className="flex items-start justify-between py-1 border-b border-[rgba(0,0,0,0.04)]">
                  <span className="font-bold text-[#070707] uppercase text-[11px] shrink-0 w-36">PROBLEM:</span>
                  <span className="text-[#5E5E5E] text-right">Unused commercial spaces remain empty.</span>
                </div>
                <div className="flex items-start justify-between py-1 border-b border-[rgba(0,0,0,0.04)]">
                  <span className="font-bold text-[#070707] uppercase text-[11px] shrink-0 w-36">SOLUTION:</span>
                  <span className="text-[#5E5E5E] text-right">Flexible access to verified workspaces.</span>
                </div>
                <div className="flex items-start justify-between py-1">
                  <span className="font-bold text-[#070707] uppercase text-[11px] shrink-0 w-36">BRAND DIRECTION:</span>
                  <span className="text-[#5E5E5E] text-right">Professional, Accessible.</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-[rgba(0,0,0,0.06)] flex items-center justify-between text-[13px] font-semibold text-[#3C61DD]">
              <span>Defined in 6 Core Pillars</span>
              <span>100% Ready</span>
            </div>
          </div>
        </div>

        {/* Phase 01 CTA Buttons */}
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#3C61DD] hover:bg-[#3252BF] text-white font-medium text-[15px] rounded-[8px] transition-all shadow-sm"
          >
            <span>Explore Identity &amp; Verification</span>
            <ArrowRight size={16} />
          </Link>

          <Link
            href="/for-creators"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-[#F1F1F2] border border-[rgba(0,0,0,0.08)] text-[#070707] font-medium text-[15px] rounded-[8px] transition-colors shadow-sm"
          >
            <span>Explore Project Identity &amp; Concept</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
