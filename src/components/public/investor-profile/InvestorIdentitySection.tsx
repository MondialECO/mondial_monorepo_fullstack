'use client';

import { ShieldCheck, UserCheck, FileCheck, CheckCircle2, Lock, ArrowDown } from 'lucide-react';

export default function InvestorIdentitySection() {
  const steps = [
    { title: 'PERSON', desc: 'Authorized individual or entity representative' },
    { title: 'IDENTITY DOCUMENT', desc: 'Passport or National ID' },
    { title: 'IDENTITY CHECK', desc: 'Face / Liveness verification' },
    { title: 'CONTACT & ADDRESS', desc: 'Email, Phone & Address context where required' },
    { title: 'VERIFIED INVESTOR', desc: 'Account verified for platform participation' },
  ];

  const stages = [
    { num: 'STAGE 01', title: 'Verified Account', isDone: true },
    { num: 'STAGE 02', title: 'Investor Profile', isDone: true },
    { num: 'STAGE 03', title: 'Financial Verification', isDone: true },
    { num: 'STAGE 04', title: 'Investment Thesis', isDone: true },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#747685] uppercase tracking-wider">
            IDENTITY BEFORE ACCESS
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            The platform should know
            <br />
            who is behind the capital.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Identity verification helps establish a trusted Investor account before sensitive company information and investment workflows become relevant.
          </p>
        </div>

        {/* Identity Flow & Stages Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left: Vertical Identity Flow (7 cols) */}
          <div className="lg:col-span-7 p-6 sm:p-8 rounded-[28px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-6">
            <span className="text-[11px] font-bold text-[#747685] uppercase tracking-wider">
              INVESTOR IDENTITY VERIFICATION FLOW
            </span>

            <div className="space-y-3">
              {steps.map((st, idx) => (
                <div key={st.title} className="flex flex-col gap-1.5">
                  <div className="p-3.5 rounded-[14px] bg-white border border-[#E2E1EC] flex items-center justify-between">
                    <div>
                      <h4 className="font-heading font-bold text-[13px] text-[#1A1B23]">
                        {st.title}
                      </h4>
                      <p className="text-[11px] text-[#747685] mt-0.5">{st.desc}</p>
                    </div>
                    <CheckCircle2 size={16} className="text-[#3C61DD]" />
                  </div>
                  {idx < steps.length - 1 && (
                    <div className="flex justify-center text-[#3C61DD]">
                      <ArrowDown size={14} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Stages & Trust Statement (5 cols) */}
          <div className="lg:col-span-5 p-6 sm:p-8 rounded-[28px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-5">
            <div>
              <span className="text-[11px] font-bold text-[#747685] uppercase tracking-wider">
                INVESTOR FOUNDATION STAGES
              </span>

              <div className="space-y-2.5 pt-4">
                {stages.map((st) => (
                  <div
                    key={st.num}
                    className="p-3 rounded-[12px] bg-[#FAF8FF] border border-[#E2E1EC] flex items-center justify-between text-[12px]"
                  >
                    <span className="text-[10px] font-bold text-[#3C61DD]">{st.num}</span>
                    <strong className="text-[#1A1B23]">{st.title}</strong>
                    <span className="text-[#157A55] font-bold">✔</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-[16px] bg-[#FAF8FF] border border-[#E2E1EC] text-center text-[12px] text-[#BA1A1A] font-bold">
              VERIFIED ≠ PUBLIC
            </div>
          </div>
        </div>

        {/* Section Statements */}
        <div className="p-6 sm:p-7 rounded-[20px] bg-[#FAF8FF] border border-[#E2E1EC] text-center shadow-xs flex flex-col gap-2">
          <h3 className="font-heading font-extrabold text-[15px] sm:text-[18px] text-[#070707] uppercase tracking-wide">
            IDENTITY VERIFICATION IS A TRUST GATE.
            <br />
            IT IS NOT AN INVESTMENT ENDORSEMENT.
          </h3>
          <p className="text-[12px] text-[#747685]">
            TRUST SHOULD INCREASE WITHOUT EXPOSING MORE PERSONAL INFORMATION THAN NECESSARY.
          </p>
        </div>
      </div>
    </section>
  );
}
