'use client';

import { Layers, ShieldAlert, Users, Globe } from 'lucide-react';

export default function FigmaWhyMondial() {
  const pillars = [
    {
      icon: Layers,
      title: 'The path is the product',
      desc: "A sequence where each phase unlocks the next — that's how readiness works.",
    },
    {
      icon: ShieldAlert,
      title: "The score can't be bought",
      desc: 'Investor access starts at Phase 6. No upgrades skip phases, adding value.',
    },
    {
      icon: Users,
      title: 'Four roles, one graph',
      desc: 'Your brand designer, investor, and AI plan all share the same system. No re-entry needed.',
    },
    {
      icon: Globe,
      title: 'Built for European reality',
      desc: 'Cross-border founders, EU formation, GDPR, and expert legal partners.',
    },
  ];

  return (
    <section className="w-full py-14 sm:py-20 px-4 sm:px-6 lg:px-8 bg-background flex justify-center border-t border-[rgba(0,0,0,0.06)]" id="why-mondial">
      <div className="w-full max-w-[1280px] flex flex-col gap-8 sm:gap-12">
        {/* Header */}
        <div className="flex flex-col gap-2.5 sm:gap-3">
          <span className="text-[12px] sm:text-[13px] font-medium text-[#3C61DD] tracking-wide uppercase">
            Why Mondial
          </span>
          <h2 className="text-[28px] sm:text-[40px] md:text-[48px] font-heading font-bold text-[#070707] tracking-tight leading-[1.15]">
            One path. Four roles. Nothing skipped.
          </h2>
        </div>

        {/* 4 Cards Grid (2x2) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {pillars.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div
                key={idx}
                className="bg-[#F9F9FA] border border-[rgba(0,0,0,0.08)] rounded-[18px] p-5 sm:p-8 flex flex-col gap-3 sm:gap-4"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[10px] bg-white border border-[rgba(0,0,0,0.06)] flex items-center justify-center text-[#3C61DD] shadow-sm shrink-0">
                  <Icon size={18} />
                </div>
                <h3 className="text-[18px] sm:text-[20px] font-heading font-bold text-[#070707]">
                  {p.title}
                </h3>
                <p className="text-[13px] sm:text-[14px] text-[#5E5E5E] leading-[1.6]">
                  {p.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
