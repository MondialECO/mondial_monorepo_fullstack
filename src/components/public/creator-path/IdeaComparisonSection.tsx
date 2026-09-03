'use client';

import { XCircle, CheckCircle2, ArrowRight } from 'lucide-react';

export default function IdeaComparisonSection() {
  const sequenceTabs = [
    'Identity',
    'Project Definition',
    'Positioning',
    'Intelligence',
    'Resources',
    'Strategic Decision',
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#F9F9FA] border-t border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1224px] flex flex-col gap-10 sm:gap-12">
        {/* Header */}
        <div className="flex flex-col gap-3.5 max-w-[920px]">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F1F5FF] text-[#3C61DD] text-[11px] font-semibold tracking-wider uppercase w-fit border border-[#3C61DD]/20">
            WHY THE CREATOR PATH EXISTS
          </div>
          <h2 className="text-[32px] sm:text-[42px] lg:text-[48px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            An idea becomes useful when it becomes structured.
          </h2>
        </div>

        {/* Journey Step Tabs */}
        <div className="w-full flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {sequenceTabs.map((tab, idx) => (
            <div key={tab} className="flex items-center gap-2 shrink-0">
              <span className="px-3.5 py-1.5 rounded-[8px] bg-[#F1F5FF] text-[#3C61DD] text-[13px] font-semibold border border-[#3C61DD]/15 whitespace-nowrap">
                {tab}
              </span>
              {idx < sequenceTabs.length - 1 && (
                <ArrowRight size={14} className="text-[#8A8B8F] shrink-0" />
              )}
            </div>
          ))}
        </div>

        {/* Split Comparison Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Left Card: Raw Idea */}
          <div className="bg-[#FFFAFA] border border-red-200/60 rounded-[20px] p-6 sm:p-8 flex flex-col justify-between gap-6 shadow-sm">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                <h3 className="font-heading font-bold text-[18px] text-[#070707]">Raw Idea</h3>
              </div>

              <div className="border-t border-red-100 pt-4 flex flex-col gap-2">
                <p className="text-[16px] font-semibold text-[#070707] italic leading-snug">
                  &ldquo;I want to help professionals book unused workspaces by the hour.&rdquo;
                </p>
                <p className="text-[13px] text-[#5E5E5E] leading-[1.6]">
                  Unstructured thoughts, raw ambition, undefined mechanics, and unverified assumptions.
                </p>
              </div>

              <div className="border-t border-red-100 pt-4 flex flex-col gap-2.5">
                <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider">
                  LIMITATIONS
                </span>
                <ul className="flex flex-col gap-2 text-[13px] text-[#5E5E5E]">
                  <li className="flex items-center gap-2.5">
                    <XCircle size={15} className="text-red-500 shrink-0" />
                    <span>No data verification</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <XCircle size={15} className="text-red-500 shrink-0" />
                    <span>No target market evidence</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <XCircle size={15} className="text-red-500 shrink-0" />
                    <span>Undefined revenue streams</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <XCircle size={15} className="text-red-500 shrink-0" />
                    <span>High strategic blindspots</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Right Card: Structured Project */}
          <div className="bg-white border border-[#3C61DD]/20 rounded-[20px] p-6 sm:p-8 flex flex-col justify-between gap-6 shadow-sm">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#3C61DD]" />
                <h3 className="font-heading font-bold text-[18px] text-[#070707]">Structured Project</h3>
              </div>

              <div className="border-t border-[rgba(0,0,0,0.06)] pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px]">
                <div className="p-2.5 rounded-[10px] bg-[#F9F9FA] border border-[rgba(0,0,0,0.04)]">
                  <span className="font-bold text-[#070707] block uppercase text-[10px] text-[#8A8B8F]">Problem</span>
                  <span className="text-[#3E3E3E]">Unused commercial spaces remain empty</span>
                </div>
                <div className="p-2.5 rounded-[10px] bg-[#F9F9FA] border border-[rgba(0,0,0,0.04)]">
                  <span className="font-bold text-[#070707] block uppercase text-[10px] text-[#8A8B8F]">Target Customer</span>
                  <span className="text-[#3E3E3E]">Hybrid workers &amp; freelance teams</span>
                </div>
                <div className="p-2.5 rounded-[10px] bg-[#F9F9FA] border border-[rgba(0,0,0,0.04)]">
                  <span className="font-bold text-[#070707] block uppercase text-[10px] text-[#8A8B8F]">Solution</span>
                  <span className="text-[#3E3E3E]">Instant booking with dynamic host access</span>
                </div>
                <div className="p-2.5 rounded-[10px] bg-[#F9F9FA] border border-[rgba(0,0,0,0.04)]">
                  <span className="font-bold text-[#070707] block uppercase text-[10px] text-[#8A8B8F]">Revenue Model</span>
                  <span className="text-[#3E3E3E]">12% marketplace take-rate + subscription</span>
                </div>
              </div>

              <div className="border-t border-[rgba(0,0,0,0.06)] pt-4 flex flex-col gap-2.5">
                <span className="text-[11px] font-bold text-[#00A854] uppercase tracking-wider">
                  MONDIAL OUTPUTS
                </span>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12px] text-[#070707]">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-[#00A854] shrink-0" />
                    <span>Verified marketplace metrics</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-[#00A854] shrink-0" />
                    <span>Automated valuation metrics</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-[#00A854] shrink-0" />
                    <span>Structured risk assessment</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-[#3C61DD] shrink-0" />
                    <span className="font-semibold text-[#3C61DD]">Decide: License Or Build</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Quote Banner */}
        <div className="w-full bg-white border border-[rgba(0,0,0,0.08)] rounded-[16px] p-5 text-center shadow-sm">
          <p className="font-heading font-bold text-[14px] sm:text-[16px] tracking-wide text-[#070707] uppercase">
            &ldquo;Mondial does not replace the creator. It structures the work around the idea.&rdquo;
          </p>
        </div>
      </div>
    </section>
  );
}
