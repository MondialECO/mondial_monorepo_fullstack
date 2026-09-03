'use client';

import { CheckCircle2, Clock, AlertCircle, Sparkles } from 'lucide-react';

export default function ProfileReadinessSection() {
  const readinessChecklist = [
    { name: 'Creator Account', status: 'COMPLETE', type: 'complete' },
    { name: 'Email', status: 'VERIFIED', type: 'complete' },
    { name: 'Phone', status: 'VERIFIED', type: 'complete' },
    { name: 'Identity Document', status: 'VERIFIED', type: 'complete' },
    { name: 'Liveness', status: 'VERIFIED', type: 'complete' },
    { name: 'Profile Information', status: 'PARTIAL', type: 'partial' },
    { name: 'Optional Professional Context', status: 'MISSING', type: 'optional' },
  ];

  const profileDetailItems = [
    { name: 'Full Name', done: true },
    { name: 'Country', done: true },
    { name: 'Languages', done: true },
    { name: 'Professional Context', done: false },
    { name: 'Profile Introduction', done: false },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-t border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1224px] flex flex-col gap-10 sm:gap-14">
        {/* Section Header */}
        <div className="flex flex-col gap-3.5 max-w-[900px]">
          <div className="flex items-center gap-2 text-[12px] font-bold">
            <span className="text-[#8A8B8F] uppercase">SECTION 06</span>
            <span className="w-1 h-3 bg-[rgba(0,0,0,0.2)]" />
            <span className="text-[#3C61DD] uppercase">STEP 04 — PROFILE READINESS</span>
          </div>
          <h2 className="text-[32px] sm:text-[42px] lg:text-[48px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            One place to see what still needs attention.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#5E5E5E] leading-[1.6]">
            Verification signals that identity checks are complete. It does not automatically validate every project claim.
          </p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Readiness Panel (7 cols on lg) */}
          <div className="lg:col-span-7 bg-white border border-[rgba(0,0,0,0.08)] rounded-[24px] overflow-hidden shadow-sm flex flex-col">
            {/* Header / Score Banner */}
            <div className="p-6 bg-[#F9F9FA] border-b border-[rgba(0,0,0,0.06)] flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-[#3C61DD]" />
                  <h4 className="font-heading font-bold text-[16px] text-[#070707]">Creator Henry profile</h4>
                </div>
                <span className="text-[12px] text-[#8A8B8F]">PHASE: 01 — IDENTITY &amp; VERIFICATION</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-heading font-extrabold text-[32px] text-[#3C61DD] leading-none">
                  86%
                </span>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-[#8A8B8F] uppercase">READINESS</span>
                  <div className="w-24 h-2 rounded-full bg-[#EDEDED] overflow-hidden mt-1">
                    <div className="w-[86%] h-full bg-[#3C61DD]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Checklist Table */}
            <div className="p-6 flex flex-col divide-y divide-[rgba(0,0,0,0.04)] text-[13px]">
              {readinessChecklist.map((item) => (
                <div key={item.name} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {item.type === 'complete' ? (
                      <CheckCircle2 size={16} className="text-[#00A854]" />
                    ) : item.type === 'partial' ? (
                      <Clock size={16} className="text-amber-600" />
                    ) : (
                      <AlertCircle size={16} className="text-[#8A8B8F]" />
                    )}
                    <span className="text-[#070707] font-medium">{item.name}</span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-[4px] text-[10px] font-bold uppercase ${
                      item.type === 'complete'
                        ? 'bg-[#E8F8EE] text-[#00A854]'
                        : item.type === 'partial'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-[#F1F1F2] text-[#8A8B8F]'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>

            {/* Legend Footer */}
            <div className="px-6 py-3.5 bg-[#F9F9FA] border-t border-[rgba(0,0,0,0.06)] flex flex-wrap items-center gap-4 text-[11px] text-[#5E5E5E]">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-[#00A854]" /> COMPLETE
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-[#3C61DD]" /> ACTIVE
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-600" /> NEEDS ATTENTION
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-[#8A8B8F]" /> OPTIONAL
              </span>
            </div>
          </div>

          {/* Detail Panel: Profile Information (5 cols on lg) */}
          <div className="lg:col-span-5 bg-white border border-[rgba(0,0,0,0.08)] rounded-[24px] p-6 sm:p-8 flex flex-col justify-between gap-6 shadow-sm min-h-[420px]">
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(0,0,0,0.06)]">
                <div>
                  <h4 className="font-heading font-bold text-[16px] text-[#070707]">Profile Information</h4>
                  <span className="text-[12px] text-[#5E5E5E]">Current Completion: 70%</span>
                </div>
                <div className="w-16 h-2 rounded-full bg-[#EDEDED] overflow-hidden">
                  <div className="w-[70%] h-full bg-[#3C61DD]" />
                </div>
              </div>

              <div className="flex flex-col gap-3 text-[13px]">
                {profileDetailItems.map((field) => (
                  <div key={field.name} className="flex items-center justify-between p-2.5 rounded-[10px] bg-[#F9F9FA]">
                    <span className="text-[#070707] font-medium">{field.name}</span>
                    {field.done ? (
                      <CheckCircle2 size={15} className="text-[#00A854]" />
                    ) : (
                      <span className="text-[11px] font-bold text-amber-700">Pending</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3.5 rounded-[12px] bg-[#F1F5FF] border border-[#3C61DD]/20 text-[12px] text-[#3C61DD] font-medium leading-relaxed">
              Complete your Creator introduction to finalize this section.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
