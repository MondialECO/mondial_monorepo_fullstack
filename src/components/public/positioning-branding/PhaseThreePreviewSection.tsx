'use client';

import { FileText, Scan, DollarSign, AlertOctagon, ArrowRight } from 'lucide-react';

export default function PhaseThreePreviewSection() {
  const modules = [
    {
      title: 'AI BUSINESS PLAN',
      desc: 'Structure the business logic, operating models, and organizational architecture required to execute your foundation.',
      icon: FileText,
      color: '#3C61DD',
    },
    {
      title: 'MARKET INTELLIGENCE',
      desc: 'Research customers, map competitive alternatives, and gather data-driven evidence to validate your positioning.',
      icon: Scan,
      color: '#D97706',
    },
    {
      title: 'AI FINANCIAL FORECAST',
      desc: 'Model revenue streams, project operational costs, monitor cash flow burn, and calculate critical break-even thresholds.',
      icon: DollarSign,
      color: '#00A854',
    },
    {
      title: 'RISK ANALYSIS',
      desc: 'Track critical assumptions, identify evidence gaps, and formulate mitigation strategies for key existential risks.',
      icon: AlertOctagon,
      color: '#D41C1C',
    },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-t border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1224px] flex flex-col gap-10 sm:gap-14">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[800px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            MOVING FORWARD
          </span>
          <h2 className="text-[32px] sm:text-[40px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            What Phase 03 Adds
          </h2>
        </div>

        {/* Equation Banner */}
        <div className="w-full p-6 rounded-[20px] bg-[#F9F9FA] border border-[rgba(0,0,0,0.08)] shadow-xs flex flex-wrap items-center justify-between gap-4 text-[14px] sm:text-[16px] font-heading font-bold">
          <div className="text-[#5E5E5E]">STRUCTURED PROJECT FOUNDATION</div>
          <span className="text-[#3C61DD]">➔</span>
          <div className="text-[#5E5E5E]">PROJECT INTELLIGENCE</div>
          <span className="text-[#3C61DD]">➔</span>
          <div className="text-[#3C61DD]">STRONGER PROJECT CONTEXT</div>
        </div>

        {/* 4 Preview Modules Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {modules.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.title}
                className="bg-white border border-[rgba(0,0,0,0.08)] rounded-[24px] p-6 sm:p-8 flex flex-col gap-4 shadow-sm hover:border-[#3C61DD]/30 transition-all"
              >
                <div
                  className="w-12 h-12 rounded-[14px] flex items-center justify-center text-white"
                  style={{ backgroundColor: m.color }}
                >
                  <Icon size={22} />
                </div>
                <h3 className="font-heading font-bold text-[18px] text-[#070707]">{m.title}</h3>
                <p className="text-[14px] text-[#5E5E5E] leading-relaxed">{m.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
