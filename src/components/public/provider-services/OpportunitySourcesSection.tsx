'use client';

import { Sparkles, FileText, Bot, Award, Clock, ArrowRight } from 'lucide-react';

export default function OpportunitySourcesSection() {
  const moments = [
    {
      num: 'MOMENT 01',
      title: 'ECOSYSTEM LEAD',
      desc: "A need appears inside another role's journey.",
      example: 'Entrepreneur needs legal review before investor preparation.',
      tags: ['Series A Prep', 'Legal Review', 'Immediate'],
      icon: Sparkles,
    },
    {
      num: 'MOMENT 02',
      title: 'CLIENT BRIEF',
      desc: 'A client actively describes the work.',
      example: '“Need a backend developer for marketplace booking logic.”',
      action: 'PROVIDER DECIDES TO RESPOND',
      icon: FileText,
    },
    {
      num: 'MOMENT 03',
      title: 'AI PUSH MATCHING',
      desc: 'Mondial detects a likely unresolved need.',
      example: 'A company stalls on financial prep ➔ Relevant Finance Providers suggested.',
      focus: 'Transparent and explainable matching, not “magic”.',
      icon: Bot,
    },
    {
      num: 'MOMENT 04',
      title: 'FEATURED PLACEMENT',
      desc: 'Strong verified Providers may gain additional visibility.',
      context: 'Earned through platform status, not simply paid promotion.',
      icon: Award,
    },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#FAF8FF] border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            OPPORTUNITY SOURCES
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Not every opportunity starts the same way.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Mondial can surface Provider opportunities through different mechanisms while preserving the context behind why the work is needed.
          </p>
        </div>

        {/* 4 Moments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {moments.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.title}
                className="p-6 sm:p-8 rounded-[28px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-5"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#747685] uppercase">{m.num}</span>
                    <Icon size={18} className="text-[#3C61DD]" />
                  </div>
                  <h3 className="font-heading font-bold text-[18px] text-[#1A1B23]">{m.title}</h3>
                  <p className="text-[13px] text-[#444654]">{m.desc}</p>
                  <p className="text-[12px] text-[#747685] font-serif italic">{m.example}</p>

                  {m.tags && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {m.tags.map((t) => (
                        <span
                          key={t}
                          className="px-2.5 py-0.5 rounded bg-[#FAF8FF] border border-[#E2E1EC] text-[10px] font-bold text-[#1A1B23]"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  {m.action && (
                    <div className="p-2 rounded-[8px] bg-[#F3F2FD] text-[#1A47C3] text-[11px] font-bold">
                      {m.action}
                    </div>
                  )}

                  {m.focus && (
                    <div className="text-[11px] text-[#747685] font-medium">{m.focus}</div>
                  )}

                  {m.context && (
                    <div className="text-[11px] text-[#747685] font-medium">{m.context}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Center Opportunity Review & Timing */}
        <div className="p-6 sm:p-8 rounded-[24px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col items-center gap-5 text-center">
          <div className="flex flex-wrap items-center justify-center gap-3 text-[13px] font-bold text-[#1A1B23]">
            <span className="px-4 py-2 rounded-[10px] bg-[#FAF8FF] border border-[#E2E1EC]">
              CONTEXT
            </span>
            <span className="text-[#3C61DD]">➔</span>
            <span className="px-4 py-2 rounded-[10px] bg-[#FAF8FF] border border-[#E2E1EC]">
              FIT
            </span>
            <span className="text-[#3C61DD]">➔</span>
            <span className="px-5 py-2 rounded-[10px] bg-[#1A47C3] text-white shadow-xs">
              DECISION
            </span>
          </div>

          <div className="flex items-center gap-2 text-[12px] text-[#747685] pt-2">
            <Clock size={14} className="text-[#3C61DD]" />
            <span>
              NEW OPPORTUNITY ➔ FAST RESPONSE (Some opportunities are time-sensitive and may expire if no action is taken)
            </span>
          </div>
        </div>

        {/* Section Statement */}
        <div className="p-6 sm:p-7 rounded-[20px] bg-white border border-[#E2E1EC] text-center shadow-xs">
          <h3 className="font-heading font-extrabold text-[15px] sm:text-[18px] text-[#070707] uppercase tracking-wide">
            THE PROVIDER SHOULD KNOW WHY THE OPPORTUNITY ARRIVED. NOT JUST THAT IT ARRIVED.
          </h3>
        </div>
      </div>
    </section>
  );
}
