'use client';

import { FileText, Scale, FileCheck, Lock, Play, RotateCcw, CheckCircle2, ArrowRight } from 'lucide-react';

export default function ProviderProjectJourney() {
  const steps = [
    { num: '01', title: 'PROPOSE', desc: 'Turn client need into scope', icon: FileText },
    { num: '02', title: 'ALIGN', desc: 'Clarify price & timing', icon: Scale },
    { num: '03', title: 'AGREE', desc: 'Confirm contract', icon: FileCheck },
    { num: '04', title: 'SECURE', desc: 'Fund via escrow', icon: Lock },
    { num: '05', title: 'DELIVER', desc: 'Work through milestones', icon: Play },
    { num: '06', title: 'REVIEW', desc: 'Approve or revise', icon: RotateCcw },
    { num: '07', title: 'COMPLETE', desc: 'Close agreed work', icon: CheckCircle2 },
  ];

  const equation = [
    'CLEAR SCOPE',
    'CLEAR AGREEMENT',
    'SECURED PROJECT',
    'STRUCTURED DELIVERY',
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            PROJECTS &amp; DELIVERY
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            From opportunity to completed work.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            A structured methodology ensuring clarity, accountability, and secure execution at every stage of the engagement.
          </p>
        </div>

        {/* 7-Step Horizontal Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {steps.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.title}
                className="p-4 rounded-[18px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-2xs flex flex-col justify-between gap-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#3C61DD] uppercase">
                    {s.num}
                  </span>
                  <Icon size={15} className="text-[#3C61DD]" />
                </div>
                <div>
                  <h4 className="font-heading font-bold text-[13px] text-[#1A1B23]">{s.title}</h4>
                  <p className="text-[11px] text-[#747685] mt-0.5">{s.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Trusted Project Process Equation */}
        <div className="p-6 sm:p-10 rounded-[28px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-xs flex flex-col items-center gap-6 text-center">
          <span className="text-[11px] font-bold text-[#747685] uppercase tracking-wider">
            TRUSTED PROJECT PROCESS EQUATION
          </span>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-[12px] sm:text-[13px] font-bold text-[#1A1B23]">
            {equation.map((term, idx) => (
              <span key={term} className="flex items-center gap-2">
                <span className="px-3.5 py-2 rounded-[10px] bg-white border border-[#E2E1EC]">
                  {term}
                </span>
                {idx < equation.length - 1 ? (
                  <span className="text-[#3C61DD]">+</span>
                ) : (
                  <span className="text-[#3C61DD]">➔</span>
                )}
              </span>
            ))}
            <span className="px-5 py-2 rounded-[10px] bg-[#1A47C3] text-white shadow-xs">
              TRUSTED PROJECT PROCESS
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
