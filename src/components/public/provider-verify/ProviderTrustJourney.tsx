'use client';

import { UserCheck, Briefcase, FileCode, Award, User, ShieldCheck, ArrowRight, ArrowDown } from 'lucide-react';

export default function ProviderTrustJourney() {
  const steps = [
    { num: '01. IDENTITY', desc: 'Who you are', icon: UserCheck },
    { num: '02. PROFESSIONAL CONTEXT', desc: 'What you do', icon: Briefcase },
    { num: '03. EVIDENCE', desc: 'What supports the claim', icon: FileCode },
    { num: '04. VERIFICATION', desc: 'What Mondial can validate', icon: Award },
    { num: '05. PROFILE', desc: 'How clients understand you', icon: User },
    { num: '06. TRUST', desc: 'What supports future opportunities', icon: ShieldCheck },
  ];

  const terms = ['IDENTITY', 'CREDENTIALS', 'WORK EVIDENCE', 'AVAILABILITY', 'REPUTATION CONTEXT'];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#F1F1F2]/60 border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="px-3 py-1 rounded-full bg-[#DCE1FF] text-[#1A47C3] text-[11px] font-bold uppercase tracking-wider w-fit">
            VERIFY &amp; PROFILE
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Before the first opportunity,
            <br />
            build the reason to trust you.
          </h2>
        </div>

        {/* 6-Step Horizontal Narrative Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-stretch">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="p-5 rounded-[22px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-4"
              >
                <div className="w-10 h-10 rounded-[12px] bg-[#FAF8FF] border border-[#E2E1EC] flex items-center justify-center text-[#1A47C3]">
                  <Icon size={18} />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-[13px] text-[#1A1B23] leading-snug">
                    {step.num}
                  </h3>
                  <p className="text-[12px] text-[#747685] mt-1">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Premium UI Equation Summary */}
        <div className="p-6 sm:p-10 rounded-[28px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col items-center gap-6 text-center">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-[12px] sm:text-[13px] font-bold text-[#1A1B23]">
            {terms.map((term, idx) => (
              <span key={term} className="flex items-center gap-2">
                <span className="px-3.5 py-2 rounded-[10px] bg-[#FAF8FF] border border-[#E2E1EC]">
                  {term}
                </span>
                {idx < terms.length - 1 && <span className="text-[#C4C5D6] text-[16px]">+</span>}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 text-[#3C61DD]">
            <ArrowDown size={20} />
          </div>

          <div className="px-6 py-3 rounded-[12px] bg-[#1A47C3] text-white font-heading font-extrabold text-[14px] sm:text-[16px] shadow-sm">
            PROVIDER TRUST FOUNDATION
          </div>
        </div>
      </div>
    </section>
  );
}
