'use client';

import { User, Lock, Plus, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function CreatorProfileDemo() {
  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#F9F9FA] border-t border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1224px] flex flex-col gap-10 sm:gap-14">
        {/* Section Header */}
        <div className="flex flex-col gap-3.5 max-w-[900px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            STEP 01 — CREATOR PROFILE
          </span>
          <h2 className="text-[32px] sm:text-[42px] lg:text-[48px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Start with the person behind the project.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#5E5E5E] leading-[1.6]">
            Build the basic Creator identity that will follow your work throughout the Mondial journey.
          </p>
        </div>

        {/* Layout: Sidebar + Form Mockup */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Progress Sidebar Panel (4 cols on lg) */}
          <div className="lg:col-span-4 bg-white border border-[rgba(0,0,0,0.08)] rounded-[20px] p-6 flex flex-col gap-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(0,0,0,0.06)]">
              <h4 className="font-heading font-bold text-[16px] text-[#070707]">Profile Progress</h4>
              <span className="text-[12px] font-bold text-[#3C61DD]">70%</span>
            </div>

            <div className="flex flex-col gap-3.5 text-[13px]">
              <div className="flex items-center justify-between p-3 rounded-[10px] bg-[#F1F5FF] text-[#3C61DD] font-semibold">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} />
                  <span>01. Basic Information</span>
                </div>
                <span className="text-[10px] uppercase font-bold">Active</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-[10px] bg-[#F9F9FA] text-[#8A8B8F]">
                <span>02. Contact Information</span>
                <span className="text-[10px] uppercase">Pending</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-[10px] bg-[#F9F9FA] text-[#8A8B8F]">
                <span>03. Identity Document</span>
                <span className="text-[10px] uppercase">Pending</span>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-[#8A8B8F] border-t border-[rgba(0,0,0,0.04)]">
              Demo preview · Local state only
            </div>
          </div>

          {/* Form Mockup Main Card (8 cols on lg) */}
          <div className="lg:col-span-8 bg-white border border-[rgba(0,0,0,0.08)] rounded-[24px] p-6 sm:p-8 flex flex-col gap-6 shadow-sm">
            {/* Form Header */}
            <div className="flex items-center justify-between pb-5 border-b border-[rgba(0,0,0,0.06)]">
              <div>
                <h3 className="font-heading font-bold text-[18px] text-[#070707]">Creator Profile</h3>
                <p className="text-[13px] text-[#5E5E5E]">This information is central to your identity.</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-[#3C61DD] text-white flex items-center justify-center font-heading font-bold text-[18px] shadow-sm">
                H
              </div>
            </div>

            {/* Fields Grid */}
            <div className="flex flex-col gap-4">
              {/* Full Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-[#5E5E5E]">Full Name</label>
                <div className="w-full h-11 px-3.5 rounded-[10px] bg-[#F9F9FA] border border-[rgba(0,0,0,0.08)] flex items-center gap-2.5 text-[14px] text-[#070707]">
                  <User size={15} className="text-[#8A8B8F]" />
                  <span>Henry Martin</span>
                </div>
              </div>

              {/* Country & City */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-[#5E5E5E]">Country</label>
                  <div className="w-full h-11 px-3.5 rounded-[10px] bg-[#F9F9FA] border border-[rgba(0,0,0,0.08)] flex items-center text-[14px] text-[#070707]">
                    <span>France</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-[#5E5E5E]">City</label>
                  <div className="w-full h-11 px-3.5 rounded-[10px] bg-[#F9F9FA] border border-[rgba(0,0,0,0.08)] flex items-center text-[14px] text-[#070707]">
                    <span>Paris</span>
                  </div>
                </div>
              </div>

              {/* Languages Spoken */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-[#5E5E5E]">Languages Spoken</label>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-[#F1F5FF] text-[#3C61DD] text-[12px] font-semibold border border-[#3C61DD]/20">
                    French
                  </span>
                  <span className="px-3 py-1 rounded-full bg-[#F1F5FF] text-[#3C61DD] text-[12px] font-semibold border border-[#3C61DD]/20">
                    English
                  </span>
                  <button
                    type="button"
                    className="px-3 py-1 rounded-full bg-white border border-[rgba(0,0,0,0.1)] text-[12px] font-medium text-[#5E5E5E] inline-flex items-center gap-1 hover:bg-[#F9F9FA]"
                  >
                    <Plus size={13} />
                    <span>Add Language</span>
                  </button>
                </div>
              </div>

              {/* Current Role */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-[#5E5E5E]">Current Role</label>
                <div className="w-full h-11 px-3.5 rounded-[10px] bg-[#F9F9FA] border border-[rgba(0,0,0,0.08)] flex items-center text-[14px] text-[#070707]">
                  <span>Product Designer</span>
                </div>
              </div>

              {/* Short Professional Context */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[12px]">
                  <label className="font-semibold text-[#5E5E5E]">Short Professional Context</label>
                  <span className="text-[#8A8B8F]">72/160</span>
                </div>
                <div className="w-full p-3 rounded-[10px] bg-[#F9F9FA] border border-[rgba(0,0,0,0.08)] text-[13px] text-[#070707] min-h-[64px]">
                  Building marketplace and digital workspace ecosystems with 6+ years in UX architecture.
                </div>
              </div>

              {/* Verified Contact Info */}
              <div className="flex flex-col gap-2 pt-2">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#8A8B8F] uppercase tracking-wider">
                  <ShieldCheck size={14} className="text-[#3C61DD]" />
                  <span>VERIFIED CONTACT INFO</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-[10px] bg-[#F9F9FA] border border-[rgba(0,0,0,0.06)] flex items-center justify-between text-[12px]">
                    <span className="font-semibold text-[#070707]">henry@example.com</span>
                    <CheckCircle2 size={15} className="text-[#00A854]" />
                  </div>
                  <div className="p-3 rounded-[10px] bg-[#F9F9FA] border border-[rgba(0,0,0,0.06)] flex items-center justify-between text-[12px]">
                    <span className="font-semibold text-[#070707]">+33 •• •• •• ••</span>
                    <CheckCircle2 size={15} className="text-[#00A854]" />
                  </div>
                </div>
              </div>

              {/* Visibility Note */}
              <div className="flex items-center gap-2 pt-2 text-[12px] text-[#8A8B8F]">
                <Lock size={13} />
                <span>Private during setup. Creator controls later visibility.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
