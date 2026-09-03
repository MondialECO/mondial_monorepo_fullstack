'use client';

import { CheckCircle2, Sparkles, Wand2 } from 'lucide-react';

export default function ProjectNameConceptSection() {
  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-t border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1224px] flex flex-col gap-10 sm:gap-14">
        {/* Section Header */}
        <div className="flex flex-col gap-3.5 max-w-[900px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            NAME THE PROJECT
          </span>
          <h2 className="text-[32px] sm:text-[40px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Give the idea a clear identity.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#5E5E5E] leading-[1.6]">
            A working project name and one-line concept make it easier to organise everything that follows.
          </p>
        </div>

        {/* Interface Dashboard: Left Input + Right AI Synthesis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left Card: Input & Status */}
          <div className="bg-[#F9F9FA] border border-[rgba(0,0,0,0.08)] rounded-[24px] p-6 sm:p-8 flex flex-col gap-5 shadow-xs">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-[#8A8B8F] uppercase tracking-wider">
                PROJECT NAME
              </label>
              <div className="w-full h-12 px-4 rounded-[12px] bg-white border border-[rgba(0,0,0,0.08)] flex items-center font-medium text-[15px] text-[#070707]">
                Nova Space
              </div>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-[10px] bg-[#E8F8EE] text-[#00A854] text-[12px] font-bold w-fit">
              <CheckCircle2 size={16} />
              <span>AVAILABLE AS PROJECT NAME</span>
            </div>

            <p className="text-[11px] text-[#8A8B8F] leading-relaxed">
              This is a project identity inside Mondial. It does not imply trademark or company registration.
            </p>

            <div className="flex flex-col gap-1.5 pt-3 border-t border-[rgba(0,0,0,0.06)]">
              <label className="text-[11px] font-bold text-[#8A8B8F] uppercase tracking-wider">
                ONE-LINE CONCEPT
              </label>
              <span className="text-[12px] text-[#8A8B8F]">Describe what the project does in one sentence.</span>
              <div className="w-full p-3.5 rounded-[12px] bg-white border border-[rgba(0,0,0,0.08)] text-[14px] text-[#070707]">
                “Book verified local workspaces by the hour.”
              </div>
            </div>
          </div>

          {/* Right Card: Mondial AI Structure */}
          <div className="bg-[#F9F9FA] border border-[rgba(0,0,0,0.08)] rounded-[24px] p-6 sm:p-8 flex flex-col gap-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(0,0,0,0.06)]">
              <div className="flex items-center gap-2">
                <Wand2 size={16} className="text-[#3C61DD]" />
                <h4 className="font-heading font-bold text-[15px] text-[#070707]">Mondial AI Structure</h4>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#F1F5FF] text-[#3C61DD] text-[11px] font-bold uppercase">
                PARSED CONCEPT
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[12px]">
              <div className="p-3 rounded-[10px] bg-white border border-[rgba(0,0,0,0.04)] flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-[#8A8B8F] uppercase">WHO</span>
                <span className="font-semibold text-[#070707]">Independent professionals</span>
              </div>
              <div className="p-3 rounded-[10px] bg-white border border-[rgba(0,0,0,0.04)] flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-[#8A8B8F] uppercase">WHAT</span>
                <span className="font-semibold text-[#070707]">Book workspaces</span>
              </div>
              <div className="p-3 rounded-[10px] bg-white border border-[rgba(0,0,0,0.04)] flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-[#8A8B8F] uppercase">HOW</span>
                <span className="font-semibold text-[#070707]">Hourly access</span>
              </div>
              <div className="p-3 rounded-[10px] bg-white border border-[rgba(0,0,0,0.04)] flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-[#8A8B8F] uppercase">DIFFERENTIATOR</span>
                <span className="font-semibold text-[#070707]">Verified locations</span>
              </div>
            </div>

            <div className="p-4 rounded-[14px] bg-[#F1F5FF] border border-[#3C61DD]/20 flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#3C61DD] uppercase">
                <Sparkles size={14} />
                <span>SUGGESTED SYNTHESIS</span>
              </div>
              <p className="text-[13px] text-[#070707] font-medium leading-relaxed">
                “A marketplace where independent professionals can book verified local workspaces by the hour.”
              </p>
            </div>
          </div>
        </div>

        {/* Project Identity Status Bar */}
        <div className="w-full p-4 sm:p-5 rounded-[18px] bg-[#F9F9FA] border border-[rgba(0,0,0,0.06)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 text-[13px]">
            <span className="font-bold text-[#8A8B8F] uppercase text-[11px]">PROJECT IDENTITY</span>
            <span className="text-[#8A8B8F]">|</span>
            <span className="font-bold text-[#070707]">Nova Space</span>
            <span className="text-[#8A8B8F]">|</span>
            <span className="font-semibold text-[#070707]">Marketplace</span>
            <span className="text-[#8A8B8F]">|</span>
            <span className="text-[#5E5E5E]">Flexible Workspaces</span>
          </div>
          <span className="px-3 py-1 rounded-full bg-[#00A854] text-white text-[11px] font-bold inline-flex items-center gap-1">
            <CheckCircle2 size={13} />
            <span>DEFINED</span>
          </span>
        </div>
      </div>
    </section>
  );
}
