'use client';

import { FileText, Camera, CheckCircle2, FileCheck2 } from 'lucide-react';

export default function IdentityLivenessSection() {
  const checks = [
    { name: 'Document Quality', status: 'PROCESSING' },
    { name: 'Name Match', status: 'PROCESSING' },
    { name: 'Document Validity', status: 'PROCESSING' },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#F9F9FA] border-t border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1224px] flex flex-col gap-10 sm:gap-14">
        {/* Section Header */}
        <div className="flex flex-col gap-3.5 max-w-[900px]">
          <div className="flex items-center gap-2 text-[12px] font-bold">
            <span className="text-[#8A8B8F] uppercase">SECTION 05</span>
            <span className="w-1 h-3 bg-[rgba(0,0,0,0.2)]" />
            <span className="text-[#3C61DD] uppercase">STEP 03 — IDENTITY &amp; LIVENESS</span>
          </div>
          <h2 className="text-[32px] sm:text-[42px] lg:text-[48px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Confirm the identity behind the Creator profile.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#5E5E5E] leading-[1.6]">
            Mondial uses identity and liveness checks to connect the Creator profile to a real person.
          </p>
        </div>

        {/* 2-Column Verification Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left Card: Identity Document */}
          <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-[24px] p-6 sm:p-8 flex flex-col gap-5 shadow-sm">
            <div className="flex items-center gap-3 pb-3 border-b border-[rgba(0,0,0,0.06)]">
              <div className="w-10 h-10 rounded-[10px] bg-[#F1F5FF] text-[#3C61DD] flex items-center justify-center shrink-0">
                <FileText size={20} />
              </div>
              <h3 className="font-heading font-bold text-[18px] text-[#070707]">Identity Document</h3>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[12px] font-semibold text-[#8A8B8F]">Choose Document Options:</span>
              <div className="flex flex-col gap-2">
                <div className="p-3 rounded-[10px] bg-[#F1F5FF] border border-[#3C61DD]/30 flex items-center justify-between text-[13px] font-semibold text-[#070707]">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-[#3C61DD] text-white flex items-center justify-center text-[10px]">
                      ✓
                    </span>
                    <span>Passport</span>
                  </div>
                  <span className="text-[11px] font-bold text-[#3C61DD]">Selected</span>
                </div>

                <div className="p-3 rounded-[10px] bg-white border border-[rgba(0,0,0,0.08)] flex items-center gap-2 text-[13px] text-[#5E5E5E]">
                  <span className="w-4 h-4 rounded-full border border-[rgba(0,0,0,0.2)]" />
                  <span>National Identity Card</span>
                </div>

                <div className="p-3 rounded-[10px] bg-white border border-[rgba(0,0,0,0.08)] flex items-center gap-2 text-[13px] text-[#5E5E5E]">
                  <span className="w-4 h-4 rounded-full border border-[rgba(0,0,0,0.2)]" />
                  <span>Residence Document</span>
                </div>
              </div>
            </div>

            {/* File Attachment Mockup */}
            <div className="p-3.5 rounded-[12px] bg-[#F9F9FA] border border-[rgba(0,0,0,0.06)] flex items-center justify-between gap-3 text-[13px]">
              <div className="flex items-center gap-2 font-medium text-[#070707] truncate">
                <FileCheck2 size={16} className="text-[#3C61DD] shrink-0" />
                <span className="truncate">passport-henry.pdf</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-[6px] bg-[#00A854] text-white text-[10px] font-bold uppercase tracking-wider shrink-0">
                DOCUMENT RECEIVED
              </span>
            </div>

            {/* Verification Checks Grid */}
            <div className="flex flex-col gap-2 pt-1 border-t border-[rgba(0,0,0,0.04)] text-[12px]">
              {checks.map((c) => (
                <div key={c.name} className="flex items-center justify-between py-1">
                  <span className="text-[#5E5E5E]">{c.name}</span>
                  <span className="px-2 py-0.5 rounded-[4px] bg-amber-50 text-amber-700 font-bold text-[10px] border border-amber-200">
                    {c.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Card: Liveness Check */}
          <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-[24px] p-6 sm:p-8 flex flex-col justify-between gap-6 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(0,0,0,0.06)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[10px] bg-[#F1F5FF] text-[#3C61DD] flex items-center justify-center shrink-0">
                  <Camera size={20} />
                </div>
                <h3 className="font-heading font-bold text-[18px] text-[#070707]">Liveness Check</h3>
              </div>
              <span className="px-2.5 py-1 rounded-[6px] bg-[#3C61DD] text-white text-[11px] font-bold uppercase tracking-wider">
                READY
              </span>
            </div>

            {/* Camera Step List */}
            <div className="p-4 rounded-[16px] bg-[#F9F9FA] border border-[rgba(0,0,0,0.04)] flex flex-col gap-3">
              <div className="flex items-start gap-3 text-[13px] text-[#070707]">
                <div className="w-6 h-6 rounded-full bg-white border border-[rgba(0,0,0,0.1)] flex items-center justify-center font-bold text-[11px] text-[#3C61DD] shrink-0">
                  1
                </div>
                <span>Use your camera in good lighting.</span>
              </div>
              <div className="flex items-start gap-3 text-[13px] text-[#5E5E5E]">
                <div className="w-6 h-6 rounded-full bg-white border border-[rgba(0,0,0,0.1)] flex items-center justify-center font-bold text-[11px] text-[#8A8B8F] shrink-0">
                  2
                </div>
                <span>Follow the simple on-screen motion prompts.</span>
              </div>
              <div className="flex items-start gap-3 text-[13px] text-[#5E5E5E]">
                <div className="w-6 h-6 rounded-full bg-white border border-[rgba(0,0,0,0.1)] flex items-center justify-center font-bold text-[11px] text-[#8A8B8F] shrink-0">
                  3
                </div>
                <span>Complete the verification securely in under 15 seconds.</span>
              </div>
            </div>

            {/* Result State */}
            <div className="p-4 rounded-[14px] bg-[#F1F5FF]/60 border border-[#3C61DD]/20 flex flex-col gap-2 text-[12px]">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#070707]">LIVENESS</span>
                <span className="px-2 py-0.5 rounded-[4px] bg-[#00A854] text-white font-bold text-[10px]">
                  VERIFIED
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#070707]">IDENTITY MATCH</span>
                <span className="px-2 py-0.5 rounded-[4px] bg-[#00A854] text-white font-bold text-[10px]">
                  CONFIRMED
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Confirmation Bar */}
        <div className="w-full p-4 sm:p-5 rounded-[18px] bg-white border border-[rgba(0,0,0,0.08)] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 text-[12px] font-bold">
            <span className="inline-flex items-center gap-1.5 text-[#00A854]">
              <CheckCircle2 size={16} />
              <span>LIVENESS VERIFIED</span>
            </span>
            <span className="inline-flex items-center gap-1.5 text-[#00A854]">
              <CheckCircle2 size={16} />
              <span>IDENTITY MATCH CONFIRMED</span>
            </span>
          </div>

          <span className="px-3 py-1 rounded-full bg-[#00A854] text-white text-[11px] font-bold tracking-wider uppercase shadow-xs">
            IDENTITY VERIFICATION: COMPLETE
          </span>
        </div>
      </div>
    </section>
  );
}
