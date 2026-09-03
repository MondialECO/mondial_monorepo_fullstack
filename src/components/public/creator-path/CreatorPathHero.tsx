'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, Sparkles, Layers } from 'lucide-react';

export default function CreatorPathHero() {
  const steps = [
    { num: '01', title: 'Verify', active: false, done: true },
    { num: '02', title: 'Define', active: false, done: true },
    { num: '03', title: 'Intelligence', active: true, done: false },
    { num: '04', title: 'Resource Setup', active: false, done: false },
    { num: '05', title: 'License or Build', active: false, done: false },
    { num: '06', title: 'Level Up', active: false, done: false },
  ];

  return (
    <section className="w-full pt-28 pb-14 sm:pt-36 sm:pb-20 flex flex-col items-center">
      <div className="w-full max-w-[1280px] flex flex-col gap-12 sm:gap-14">
        {/* Split Hero Layout */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Creator Positioning & CTAs (7 cols) */}
          <div className="lg:col-span-6 xl:col-span-6 flex flex-col items-start gap-6">
            {/* Tag */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F1F5FF] border border-[#3C61DD]/20 text-[13px] font-semibold text-[#3C61DD]">
              <span>Creators</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-[36px] sm:text-[46px] lg:text-[52px] font-heading font-bold text-[#070707] leading-[1.12] tracking-[-0.03em]">
              Turn an idea into a project worth building
            </h1>

            {/* Body */}
            <p className="text-[15px] sm:text-[16px] text-[#5E5E5E] leading-[1.6] max-w-[620px]">
              Mondial gives Creators a structured path to verify themselves, define the project,
              challenge the business logic, identify what is needed and decide how to move forward.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2 w-full sm:w-auto">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#3C61DD] hover:bg-[#3252BF] text-white font-medium text-[15px] sm:text-[16px] rounded-[10px] transition-all shadow-sm group focus:outline-none focus:ring-2 focus:ring-[#3C61DD]/40"
              >
                <span>Start Your Creator Journey</span>
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                href="/for-creators"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white hover:bg-[#F1F1F2] border border-[rgba(0,0,0,0.08)] text-[#070707] font-medium text-[15px] sm:text-[16px] rounded-[10px] transition-colors shadow-sm"
              >
                <span>Explore The 6 Phases</span>
              </Link>
            </div>
          </div>

          {/* Right Column: NOVA SPACE Control/Workspace Preview (6 cols) */}
          <div className="lg:col-span-6 xl:col-span-6 bg-[#F9F9FA] border border-[rgba(0,0,0,0.08)] rounded-[24px] p-5 sm:p-7 shadow-sm flex flex-col gap-6">
            {/* Card Header */}
            <div className="flex items-center justify-between border-b border-[rgba(0,0,0,0.06)] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-[12px] bg-[#F1F5FF] text-[#3C61DD] flex items-center justify-center shadow-sm">
                  <Layers size={22} />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-[18px] text-[#070707]">NOVA SPACE</h3>
                  <p className="text-[12px] text-[#8A8B8F]">home / workspace</p>
                </div>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F1F5FF] text-[#3C61DD] text-[12px] font-semibold border border-[#3C61DD]/20">
                <span className="w-2 h-2 rounded-full bg-[#3C61DD] animate-pulse" />
                <span>Phase 03 Active</span>
              </div>
            </div>

            {/* Inner Panel: Current Phase & Completion Ring */}
            <div className="bg-white rounded-[16px] p-5 border border-[rgba(0,0,0,0.06)] flex flex-col gap-4 shadow-sm">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-[#8A8B8F]">
                Current Phase Focus
              </span>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[13px] font-semibold text-[#3C61DD]">
                    03 — PROJECT INTELLIGENCE
                  </span>
                  <h4 className="text-[16px] font-heading font-bold text-[#070707]">
                    Challenge the business logic with AI tools
                  </h4>
                </div>

                {/* Progress Ring Simulation */}
                <div className="flex items-center gap-3 shrink-0 bg-[#F9F9FA] px-3.5 py-2 rounded-[12px] border border-[rgba(0,0,0,0.06)]">
                  <div className="w-10 h-10 rounded-full border-4 border-[#3C61DD] border-t-transparent flex items-center justify-center font-bold text-[12px] text-[#3C61DD]">
                    58%
                  </div>
                  <div className="text-[11px] leading-tight">
                    <span className="font-semibold text-[#070707] block">Overall Completion</span>
                    <span className="text-[#8A8B8F]">Define tasks finalized</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Inner Dual Columns: Journey Steps + Outputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Journey Steps */}
              <div className="bg-white rounded-[16px] p-4 border border-[rgba(0,0,0,0.06)] flex flex-col gap-3">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-[#8A8B8F]">
                  Journey Path
                </span>
                <div className="flex flex-col gap-2 text-[12px]">
                  <div className="flex items-center gap-2 text-[#00A854]">
                    <CheckCircle2 size={14} className="shrink-0" />
                    <span>01 Identity &amp; Verification</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#00A854]">
                    <CheckCircle2 size={14} className="shrink-0" />
                    <span>02 Project Identity &amp; Branding</span>
                  </div>
                  <div className="flex items-center gap-2 px-2 py-1 rounded-[6px] bg-[#F1F5FF] text-[#3C61DD] font-semibold">
                    <Sparkles size={14} className="shrink-0" />
                    <span>03 Project Intelligence &amp; AI</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#8A8B8F]">
                    <span className="w-3.5 h-3.5 rounded-full border border-[rgba(0,0,0,0.2)] inline-block shrink-0 ml-0.5" />
                    <span>04 Offer &amp; Resource Setup</span>
                  </div>
                </div>
              </div>

              {/* Verified Outputs Preview */}
              <div className="bg-white rounded-[16px] p-4 border border-[rgba(0,0,0,0.06)] flex flex-col gap-3">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-[#8A8B8F]">
                  Active Artifacts
                </span>
                <div className="flex flex-col gap-2 text-[12px]">
                  <div className="flex justify-between items-center py-0.5 border-b border-[rgba(0,0,0,0.04)]">
                    <span className="text-[#070707]">Business Plan</span>
                    <span className="text-[#00A854] font-semibold">Complete</span>
                  </div>
                  <div className="flex justify-between items-center py-0.5 border-b border-[rgba(0,0,0,0.04)]">
                    <span className="text-[#070707]">Forecast Model</span>
                    <span className="text-[#3C61DD] font-semibold">In Progress</span>
                  </div>
                  <div className="flex justify-between items-center py-0.5 border-b border-[rgba(0,0,0,0.04)]">
                    <span className="text-[#070707]">Market Evidence</span>
                    <span className="text-[#070707] font-semibold">9 Interviews</span>
                  </div>
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-[#070707]">Readiness Score</span>
                    <span className="text-[#3C61DD] font-bold">78/100</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Horizontal Journey Timeline */}
        <div className="w-full bg-[#F9F9FA] border border-[rgba(0,0,0,0.08)] rounded-[20px] p-5 sm:p-6 shadow-sm overflow-x-auto no-scrollbar">
          <div className="min-w-[680px] flex items-center justify-between gap-4">
            {steps.map((st, i) => (
              <div key={st.num} className="flex items-center gap-3 flex-1">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 ${
                      st.active
                        ? 'bg-[#3C61DD] text-white shadow-sm'
                        : st.done
                        ? 'bg-[#00A854]/15 text-[#00A854]'
                        : 'bg-white border border-[rgba(0,0,0,0.1)] text-[#8A8B8F]'
                    }`}
                  >
                    {st.done ? '✓' : st.num}
                  </div>
                  <span
                    className={`text-[13px] whitespace-nowrap ${
                      st.active
                        ? 'font-bold text-[#3C61DD]'
                        : st.done
                        ? 'font-medium text-[#070707]'
                        : 'text-[#8A8B8F]'
                    }`}
                  >
                    {st.title}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className="flex-1 h-[1px] bg-[rgba(0,0,0,0.08)] mx-2" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
