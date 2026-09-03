'use client';

import { CheckCircle2, Clock, ShieldCheck, MessageSquare, RefreshCw, KeyRound } from 'lucide-react';

export default function ContactVerificationSection() {
  const whyMatters = [
    { title: 'Account Security', icon: ShieldCheck },
    { title: 'Important Notifications', icon: MessageSquare },
    { title: 'Recovery', icon: RefreshCw },
    { title: 'Verification Continuity', icon: KeyRound },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-t border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1224px] flex flex-col gap-10 sm:gap-14">
        {/* Section Header */}
        <div className="flex flex-col gap-3.5 max-w-[900px]">
          <div className="flex items-center gap-2 text-[12px] font-bold">
            <span className="text-[#8A8B8F] uppercase">SECTION 04</span>
            <span className="w-1 h-3 bg-[rgba(0,0,0,0.2)]" />
            <span className="text-[#3C61DD] uppercase">STEP 02 — CONFIRM YOUR CONTACT</span>
          </div>
          <h2 className="text-[32px] sm:text-[42px] lg:text-[48px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Make sure Mondial can securely reach you.
          </h2>
        </div>

        {/* Verification Panels Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Email Panel */}
          <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-[24px] p-6 sm:p-8 flex flex-col gap-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-[rgba(0,0,0,0.06)]">
              <div>
                <span className="text-[12px] text-[#8A8B8F] block">Primary Email</span>
                <h4 className="font-heading font-bold text-[18px] text-[#070707]">henry@example.com</h4>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#00A854] text-white text-[11px] font-bold inline-flex items-center gap-1.5 shadow-xs">
                <CheckCircle2 size={13} />
                <span>VERIFIED</span>
              </span>
            </div>

            {/* Timeline Flow */}
            <div className="flex items-center justify-between gap-2 pt-2">
              <div className="flex flex-col items-center gap-1.5 text-center">
                <div className="w-8 h-8 rounded-full bg-[#00A854] text-white flex items-center justify-center font-bold text-[13px]">
                  1
                </div>
                <span className="text-[11px] font-medium text-[#5E5E5E]">Email Sent</span>
              </div>
              <div className="flex-1 h-0.5 bg-[#00A854]/40" />
              <div className="flex flex-col items-center gap-1.5 text-center">
                <div className="w-8 h-8 rounded-full bg-[#00A854] text-white flex items-center justify-center font-bold text-[13px]">
                  2
                </div>
                <span className="text-[11px] font-medium text-[#5E5E5E]">6-Digit Code</span>
              </div>
              <div className="flex-1 h-0.5 bg-[#00A854]/40" />
              <div className="flex flex-col items-center gap-1.5 text-center">
                <div className="w-8 h-8 rounded-full bg-[#00A854] text-white flex items-center justify-center font-bold text-[13px]">
                  3
                </div>
                <span className="text-[11px] font-bold text-[#00A854]">Verified</span>
              </div>
            </div>
          </div>

          {/* Phone Panel */}
          <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-[24px] p-6 sm:p-8 flex flex-col gap-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-[rgba(0,0,0,0.06)]">
              <div>
                <span className="text-[12px] text-[#8A8B8F] block">Mobile Number</span>
                <h4 className="font-heading font-bold text-[18px] text-[#070707]">+33 •• •• •• ••</h4>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#3C61DD] text-white text-[11px] font-bold inline-flex items-center gap-1.5 shadow-xs">
                <Clock size={13} />
                <span>VERIFYING</span>
              </span>
            </div>

            {/* OTP Input Boxes & Controls */}
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-6 gap-2 sm:gap-3">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="h-12 sm:h-14 rounded-[10px] bg-[#F9F9FA] border border-[rgba(0,0,0,0.1)] flex items-center justify-center font-bold text-[18px] text-[#8A8B8F]"
                  >
                    _
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-[12px] pt-1">
                <div className="flex items-center gap-1.5 text-[#5E5E5E]">
                  <Clock size={14} className="text-[#3C61DD]" />
                  <span>Code expires in: <strong className="text-[#070707]">04:21</strong></span>
                </div>
                <button
                  type="button"
                  className="font-semibold text-[#3C61DD] hover:underline"
                >
                  Resend Code
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* WHY THIS MATTERS Card */}
        <div className="w-full bg-[#F9F9FA] border border-[rgba(0,0,0,0.06)] rounded-[20px] p-6 sm:p-8 flex flex-col gap-4">
          <span className="text-[12px] font-bold text-[#070707] uppercase tracking-wider">
            WHY THIS MATTERS
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
            {whyMatters.map((item) => {
              const IconComponent = item.icon;
              return (
                <div
                  key={item.title}
                  className="p-4 rounded-[12px] bg-white border border-[rgba(0,0,0,0.04)] flex items-center gap-3 shadow-xs"
                >
                  <div className="w-8 h-8 rounded-[8px] bg-[#F1F5FF] text-[#3C61DD] flex items-center justify-center shrink-0">
                    <IconComponent size={16} />
                  </div>
                  <span className="font-semibold text-[13px] text-[#070707]">{item.title}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
