'use client';

import { Lock, Eye, Sliders, ShieldCheck, ChevronRight } from 'lucide-react';

export default function PrivacyControlSection() {
  const privateItems = [
    {
      title: 'Identity Document',
      desc: 'Uploaded passports or ID cards are encrypted and hidden.',
    },
    {
      title: 'Liveness Result',
      desc: 'Biometric video scan signatures are parsed and deleted.',
    },
    {
      title: 'Verification Status',
      desc: 'Check details remain visible only to administrators.',
    },
    {
      title: 'Contact Verification',
      desc: 'Secured email and phone number tokens are shielded.',
    },
  ];

  const publicItems = [
    {
      title: 'Creator Name',
      desc: 'Verified display name is searchable inside the workspace.',
    },
    {
      title: 'Professional Context',
      desc: 'Experience and language filters are shared with teams.',
    },
    {
      title: 'Verified Status',
      desc: 'Green trust check is badged next to public profile.',
    },
    {
      title: 'Project Information',
      desc: 'Foundational project concepts are discoverable.',
    },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#F9F9FA] border-t border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1224px] flex flex-col gap-12 sm:gap-16">
        {/* Section Header */}
        <div className="flex flex-col gap-3.5 max-w-[900px]">
          <div className="flex items-center gap-2 text-[12px] font-bold">
            <span className="text-[#8A8B8F] uppercase">SECTION 07</span>
            <span className="w-1 h-3 bg-[rgba(0,0,0,0.2)]" />
            <span className="text-[#3C61DD] uppercase">PRIVACY &amp; CONTROL</span>
          </div>
          <h2 className="text-[32px] sm:text-[42px] lg:text-[48px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Verification should build trust without making everything public.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#5E5E5E] leading-[1.6]">
            Verification information and public profile information serve different purposes. The Creator should understand what is used for verification and what may later become visible.
          </p>
        </div>

        {/* 3-Column Composition */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Column 1: Private Verification Data (4 cols) */}
          <div className="lg:col-span-4 bg-white border border-[rgba(0,0,0,0.08)] rounded-[24px] p-6 sm:p-7 flex flex-col gap-5 shadow-sm">
            <div className="flex flex-col gap-2 pb-4 border-b border-[rgba(0,0,0,0.06)]">
              <div className="flex items-center gap-2 text-[#070707]">
                <Lock size={16} className="text-[#8A8B8F]" />
                <h3 className="font-heading font-bold text-[16px]">Verification Information</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-[6px] bg-[#F1F1F2] text-[#5E5E5E] text-[10px] font-bold tracking-wider uppercase w-fit">
                PRIVATE VERIFICATION DATA
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {privateItems.map((item) => (
                <div key={item.title} className="p-3.5 rounded-[12px] bg-[#F9F9FA] flex flex-col gap-1 text-[12px]">
                  <span className="font-bold text-[#070707]">{item.title}</span>
                  <p className="text-[#5E5E5E] leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: Public / Shared Context (4 cols) */}
          <div className="lg:col-span-4 bg-white border border-[rgba(0,0,0,0.08)] rounded-[24px] p-6 sm:p-7 flex flex-col gap-5 shadow-sm">
            <div className="flex flex-col gap-2 pb-4 border-b border-[rgba(0,0,0,0.06)]">
              <div className="flex items-center gap-2 text-[#070707]">
                <Eye size={16} className="text-[#00A854]" />
                <h3 className="font-heading font-bold text-[16px]">Public / Shared Context</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-[6px] bg-[#E8F8EE] text-[#00A854] text-[10px] font-bold tracking-wider uppercase w-fit">
                Only when relevant and permitted
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {publicItems.map((item) => (
                <div key={item.title} className="p-3.5 rounded-[12px] bg-[#F1F5FF]/60 flex flex-col gap-1 text-[12px]">
                  <span className="font-bold text-[#070707]">{item.title}</span>
                  <p className="text-[#5E5E5E] leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Column 3: Creator Controls (4 cols) */}
          <div className="lg:col-span-4 bg-white border border-[rgba(0,0,0,0.08)] rounded-[24px] p-6 sm:p-7 flex flex-col justify-between gap-5 shadow-sm">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1 pb-4 border-b border-[rgba(0,0,0,0.06)]">
                <div className="flex items-center gap-2 text-[#3C61DD]">
                  <Sliders size={16} />
                  <h3 className="font-heading font-bold text-[16px]">Creator Controls</h3>
                </div>
                <p className="text-[12px] text-[#5E5E5E]">
                  Manage the bridge between private data and public context.
                </p>
              </div>

              {/* Toggles */}
              <div className="flex flex-col gap-3">
                <div className="p-3.5 rounded-[12px] bg-[#F9F9FA] flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-bold text-[13px] text-[#070707]">Profile Visibility</span>
                    <span className="text-[11px] text-[#5E5E5E]">Public view enabled</span>
                  </div>
                  <div className="w-10 h-6 rounded-full bg-[#3C61DD] flex items-center justify-end px-1 cursor-pointer">
                    <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                  </div>
                </div>

                <div className="p-3.5 rounded-[12px] bg-[#F9F9FA] flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-bold text-[13px] text-[#070707]">Project Visibility</span>
                    <span className="text-[11px] text-[#5E5E5E]">Verified users only</span>
                  </div>
                  <div className="w-10 h-6 rounded-full bg-[#3C61DD] flex items-center justify-end px-1 cursor-pointer">
                    <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                  </div>
                </div>

                <div className="p-3.5 rounded-[12px] bg-[#F9F9FA] flex items-center justify-between text-[13px] font-semibold text-[#070707] cursor-pointer hover:bg-[#F1F1F2]">
                  <span>Sharing Permissions</span>
                  <ChevronRight size={16} className="text-[#8A8B8F]" />
                </div>

                <div className="p-3.5 rounded-[12px] bg-[#F9F9FA] flex items-center justify-between text-[13px] font-semibold text-[#070707] cursor-pointer hover:bg-[#F1F1F2]">
                  <span>Access Requests</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#FF5C00]/10 text-[#FF5C00] font-bold text-[11px]">
                    2
                  </span>
                </div>
              </div>
            </div>

            <span className="text-[10px] text-[#8A8B8F] text-center pt-2">
              Demonstration UI · No live mutation
            </span>
          </div>
        </div>

        {/* Strategic Rule Callout Banner */}
        <div className="w-full py-8 px-6 sm:px-10 rounded-[20px] bg-white border border-[rgba(0,0,0,0.08)] shadow-xs text-center flex items-center justify-center">
          <h3 className="font-heading font-bold text-[20px] sm:text-[24px] text-[#070707] uppercase tracking-wide">
            VERIFIED DOES NOT MEAN EVERYTHING IS PUBLIC.
          </h3>
        </div>

        {/* Verified Creator Trust Card */}
        <div className="w-full p-6 sm:p-8 rounded-[20px] bg-[#F1F1F2]/70 border border-[rgba(0,0,0,0.06)] flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="w-12 h-12 rounded-[14px] bg-[#3C61DD] text-white flex items-center justify-center shrink-0 shadow-sm">
            <ShieldCheck size={24} />
          </div>
          <div className="flex flex-col gap-1">
            <h4 className="font-heading font-bold text-[18px] text-[#070707]">Verified Creator</h4>
            <p className="text-[14px] text-[#5E5E5E] leading-relaxed">
              Verification signals that identity checks are complete. It does not automatically validate every project claim or business model.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
