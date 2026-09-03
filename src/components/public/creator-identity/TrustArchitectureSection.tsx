'use client';

import { AlertCircle, CheckCircle2, User, Mail, ShieldCheck, Camera, ArrowDown } from 'lucide-react';

export default function TrustArchitectureSection() {
  const unverifiedItems = [
    'Unverified Account',
    'Unknown identity',
    'Limited profile trust',
    'No verification status',
    'Restricted readiness',
  ];

  const processSteps = [
    { name: 'ACCOUNT', icon: User },
    { name: 'CONTACT', icon: Mail },
    { name: 'IDENTITY', icon: ShieldCheck },
    { name: 'LIVENESS', icon: Camera },
    { name: 'VERIFIED STATUS', icon: CheckCircle2 },
  ];

  const verifiedItems = [
    'Verified Creator',
    'Verified identity',
    'Trusted profile status',
    'Clear Creator ownership',
    'Higher readiness',
    'Structured project access',
  ];

  return (
    <section
      id="trust-architecture"
      className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-t border-[rgba(0,0,0,0.06)] flex justify-center scroll-mt-24"
    >
      <div className="w-full max-w-[1224px] flex flex-col gap-12 sm:gap-16">
        {/* Section Header */}
        <div className="flex flex-col gap-3.5 max-w-[900px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            TRUST BEFORE VISIBILITY
          </span>
          <h2 className="text-[32px] sm:text-[42px] lg:text-[48px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            A project becomes stronger when people know who stands behind it.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#5E5E5E] leading-[1.6]">
            Identity verification creates a trusted foundation before projects become visible, matched or shared across the Mondial ecosystem.
          </p>
        </div>

        {/* Comparison Flow 3-Column Architecture */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left: Unverified Starting State (4 cols) */}
          <div className="lg:col-span-4 bg-[#F9F9FA] border border-[rgba(0,0,0,0.08)] rounded-[24px] overflow-hidden flex flex-col shadow-xs">
            <div className="p-6 bg-[#F1F1F2]/60 border-b border-[rgba(0,0,0,0.04)] flex items-center justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#CFCFCF] text-white text-[10px] font-bold tracking-wider uppercase">
                  STARTING STATE
                </span>
                <h3 className="font-heading font-bold text-[18px] text-[#070707] mt-1.5">Unverified</h3>
              </div>
            </div>
            <div className="p-6 flex flex-col gap-3 text-[13px] flex-1">
              {unverifiedItems.map((item) => (
                <div key={item} className="flex items-center gap-2.5 text-[#5E5E5E]">
                  <AlertCircle size={16} className="text-[#8A8B8F] shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Center: Process Flow (4 cols) */}
          <div className="lg:col-span-4 bg-[#FAF8FF] border border-[#3C61DD]/20 rounded-[24px] p-6 flex flex-col items-center justify-between gap-4 shadow-sm">
            <span className="text-[11px] font-bold text-[#3C61DD] uppercase tracking-wider text-center">
              MONDIAL IDENTITY &amp; VERIFICATION
            </span>

            <div className="w-full flex flex-col items-center gap-2 py-2">
              {processSteps.map((step, idx) => {
                const IconComponent = step.icon;
                return (
                  <div key={step.name} className="w-full flex flex-col items-center gap-2">
                    <div className="w-full max-w-[240px] py-2.5 px-4 bg-white border border-[rgba(0,0,0,0.06)] rounded-[12px] flex items-center gap-3 shadow-xs">
                      <div className="w-6 h-6 rounded-full bg-[#F1F5FF] text-[#3C61DD] flex items-center justify-center shrink-0">
                        <IconComponent size={13} />
                      </div>
                      <span className="font-heading font-bold text-[12px] text-[#070707]">{step.name}</span>
                    </div>
                    {idx < processSteps.length - 1 && (
                      <div className="text-[#C4C5D6]">
                        <ArrowDown size={14} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <span className="text-[10px] text-[#8A8B8F] uppercase font-bold tracking-wider">
              Automated &amp; Private Flow
            </span>
          </div>

          {/* Right: Verified Trusted State (4 cols) */}
          <div className="lg:col-span-4 bg-[#F1F5FF]/60 border-2 border-[#3C61DD]/40 rounded-[24px] overflow-hidden flex flex-col shadow-sm">
            <div className="p-6 bg-white/80 border-b border-[#3C61DD]/20 flex items-center justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#00A854] text-white text-[10px] font-bold tracking-wider uppercase">
                  TRUSTED STATE
                </span>
                <h3 className="font-heading font-bold text-[18px] text-[#3C61DD] mt-1.5">Verified</h3>
              </div>
            </div>
            <div className="p-6 flex flex-col gap-3 text-[13px] flex-1">
              {verifiedItems.map((item) => (
                <div key={item} className="flex items-center gap-2.5 text-[#070707] font-medium">
                  <CheckCircle2 size={16} className="text-[#00A854] shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Equation Bar */}
        <div className="w-full p-5 rounded-[18px] bg-[#F9F9FA] border border-[rgba(0,0,0,0.06)] flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="font-heading font-bold text-[13px] sm:text-[14px] text-[#070707] uppercase tracking-wide">
            IDENTITY + VERIFICATION + PROFILE READINESS ={' '}
            <span className="text-[#3C61DD]">TRUSTED CREATOR FOUNDATION</span>
          </div>
        </div>

        {/* Preserved Note */}
        <p className="text-[13px] text-[#8A8B8F] italic text-center max-w-[800px] mx-auto">
          Identity verification confirms the person, not the success of the project.
        </p>
      </div>
    </section>
  );
}
