'use client';

import { CheckCircle2, Clock, Lock, Camera } from 'lucide-react';

export default function IdentityHero() {
  const readinessItems = [
    { name: 'Creator Account', status: 'COMPLETE', type: 'done' },
    { name: 'Email', status: 'VERIFIED', type: 'done' },
    { name: 'Phone', status: 'VERIFIED', type: 'done' },
    { name: 'Identity', status: '(IN REVIEW)', type: 'in-review' },
    { name: 'Liveness', status: '(UPCOMING)', type: 'upcoming' },
  ];

  const sidebarModules = [
    { name: 'Account', status: 'COMPLETE', done: true },
    { name: 'Email', status: 'VERIFIED', done: true },
    { name: 'Phone', status: 'VERIFIED', done: true },
    { name: 'Identity Document', status: 'IN REVIEW', done: false, active: true },
    { name: 'Liveness Check', status: 'UPCOMING', done: false },
    { name: 'Profile', status: 'PARTIAL', done: false },
  ];

  return (
    <section className="w-full pt-28 pb-14 sm:pt-36 sm:pb-20 flex flex-col items-center">
      <div className="w-full max-w-[1224px] grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column (6 cols) */}
        <div className="lg:col-span-6 flex flex-col gap-6 items-start">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F1F5FF] text-[#3C61DD] text-[11px] font-bold tracking-wider uppercase border border-[#3C61DD]/20">
            PHASE 01 — IDENTITY &amp; VERIFICATION
          </div>

          <h1 className="text-[36px] sm:text-[44px] lg:text-[48px] font-heading font-bold text-[#070707] leading-[1.12] tracking-tight">
            Every project starts with a real person.
          </h1>

          <p className="text-[15px] sm:text-[17px] text-[#5E5E5E] leading-[1.6]">
            Create a trusted Creator identity before turning your idea into a structured project.
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-1">
            <button
              onClick={() => {
                const el = document.getElementById('trust-architecture');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center justify-center px-6 py-3 bg-[#F1F5FF] hover:bg-[#E5EDFF] text-[#3C61DD] font-semibold text-[14px] rounded-[10px] transition-colors border border-[#3C61DD]/20"
            >
              See How Verification Works
            </button>
            <span className="text-[12px] text-[#8A8B8F]">
              The first step of the Creator journey.
            </span>
          </div>

          {/* Profile Readiness Preview Box */}
          <div className="w-full bg-white border border-[rgba(0,0,0,0.08)] rounded-[18px] p-5 flex flex-col gap-4 shadow-sm mt-2">
            <div className="flex items-center justify-between">
              <span className="font-heading font-bold text-[15px] text-[#070707]">Profile Readiness</span>
              <div className="flex items-center gap-3">
                <div className="w-24 sm:w-28 h-2 rounded-full bg-[#EDEDED] overflow-hidden">
                  <div className="w-[72%] h-full bg-[#3C61DD]" />
                </div>
                <span className="font-bold text-[13px] text-[#3C61DD]">72%</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-1 border-t border-[rgba(0,0,0,0.04)] text-[13px]">
              {readinessItems.map((item) => (
                <div key={item.name} className="flex items-center justify-between py-0.5">
                  <div className="flex items-center gap-2">
                    {item.type === 'done' ? (
                      <CheckCircle2 size={15} className="text-[#00A854]" />
                    ) : item.type === 'in-review' ? (
                      <Clock size={15} className="text-amber-600" />
                    ) : (
                      <Lock size={15} className="text-[#8A8B8F]" />
                    )}
                    <span className="text-[#070707] font-medium">{item.name}</span>
                  </div>
                  <span
                    className={`text-[11px] font-bold ${
                      item.type === 'done'
                        ? 'text-[#00A854]'
                        : item.type === 'in-review'
                        ? 'text-amber-700'
                        : 'text-[#8A8B8F]'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Software Workspace Preview Mockup (6 cols) */}
        <div className="lg:col-span-6 bg-white border border-[rgba(0,0,0,0.08)] rounded-[24px] shadow-sm overflow-hidden flex flex-col">
          {/* Mockup Header */}
          <div className="px-5 py-3.5 bg-[#F9F9FA] border-b border-[rgba(0,0,0,0.06)] flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-[#3C61DD] text-white flex items-center justify-center font-bold text-[12px]">
                H
              </div>
              <span className="font-heading font-bold text-[12px] text-[#070707] uppercase tracking-wide">
                CREATOR: HENRY
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-bold">
                ● VERIFICATION: IN PROGRESS
              </span>
              <span className="font-bold text-[#3C61DD]">READINESS: 72%</span>
            </div>
          </div>

          {/* Mockup Body: Sidebar + Main Content */}
          <div className="grid grid-cols-1 sm:grid-cols-12 min-h-[380px]">
            {/* Sidebar (4 cols) */}
            <div className="sm:col-span-5 bg-[#F9F9FA]/80 p-4 border-r border-[rgba(0,0,0,0.06)] flex flex-col gap-3">
              <span className="text-[10px] font-bold text-[#8A8B8F] uppercase tracking-wider">
                VERIFICATION MODULES
              </span>
              <div className="flex flex-col gap-2">
                {sidebarModules.map((mod) => (
                  <div
                    key={mod.name}
                    className={`p-2 rounded-[8px] flex items-center justify-between text-[11px] ${
                      mod.active
                        ? 'bg-white border border-[#3C61DD]/30 shadow-xs'
                        : 'bg-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      {mod.done ? (
                        <CheckCircle2 size={13} className="text-[#00A854] shrink-0" />
                      ) : mod.active ? (
                        <Clock size={13} className="text-amber-600 shrink-0" />
                      ) : (
                        <Lock size={13} className="text-[#8A8B8F] shrink-0" />
                      )}
                      <span className="font-medium text-[#070707] truncate">{mod.name}</span>
                    </div>
                    <span
                      className={`text-[9px] font-bold ${
                        mod.done
                          ? 'text-[#00A854]'
                          : mod.active
                          ? 'text-amber-700'
                          : 'text-[#8A8B8F]'
                      }`}
                    >
                      {mod.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Main Stage (7 cols) */}
            <div className="sm:col-span-7 p-5 flex flex-col justify-between gap-4 bg-white">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-[#3C61DD] uppercase">ACTIVE CHECK</span>
                  <h4 className="font-heading font-bold text-[15px] text-[#070707]">Identity Verification</h4>
                </div>

                <div className="bg-[#F9F9FA] rounded-[12px] p-3 border border-[rgba(0,0,0,0.04)] flex flex-col gap-1.5 text-[12px]">
                  <div className="flex justify-between text-[#5E5E5E]">
                    <span>Document Type:</span>
                    <span className="font-semibold text-[#070707]">National ID / Passport</span>
                  </div>
                  <div className="flex justify-between text-[#5E5E5E]">
                    <span>Document:</span>
                    <span className="font-semibold text-[#00A854]">Uploaded (PDF)</span>
                  </div>
                  <div className="flex justify-between text-[#5E5E5E]">
                    <span>Check Status:</span>
                    <span className="font-semibold text-amber-600">Processing...</span>
                  </div>
                </div>
              </div>

              {/* Next Step Camera Liveness Preview */}
              <div className="p-3 rounded-[12px] bg-[#F1F5FF] border border-[#3C61DD]/20 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#3C61DD] text-white flex items-center justify-center shrink-0">
                  <Camera size={15} />
                </div>
                <div className="text-[11px] leading-tight">
                  <span className="font-bold text-[#3C61DD] block">Next: Complete Liveness Check</span>
                  <span className="text-[#5E5E5E]">Quick 10-second facial biometric confirmation</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
