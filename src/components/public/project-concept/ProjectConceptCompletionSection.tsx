'use client';

import Link from 'next/link';
import { CheckCircle2, ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';

export default function ProjectConceptCompletionSection() {
  const statusLog = [
    { title: 'PROJECT NAME', value: 'Nova Space Platform' },
    { title: 'ONE-LINE CONCEPT', value: 'Unified operational mesh for remote teams.' },
    { title: 'PROBLEM', value: 'Fragmented toolchains causing data silos.' },
    { title: 'SOLUTION', value: 'Centralized API hub with predictive routing.' },
    { title: 'TARGET CUSTOMER', value: 'Mid-market SaaS operations managers.' },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-t border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1224px] flex flex-col gap-12 sm:gap-16">
        {/* Section Header */}
        <div className="flex flex-col gap-3.5 max-w-[900px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            PROJECT FOUNDATION CREATED
          </span>
          <h2 className="text-[32px] sm:text-[42px] lg:text-[48px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Now define how the project should be understood.
          </h2>
        </div>

        {/* Completion Workspace Bento */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Project Card (6 cols) */}
          <div className="lg:col-span-6 bg-white border border-[rgba(0,0,0,0.08)] rounded-[24px] p-6 sm:p-8 flex flex-col justify-between gap-6 shadow-sm">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-[14px] bg-[#3C61DD] text-white flex items-center justify-center font-bold">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#8A8B8F] uppercase block">CURRENT PROJECT</span>
                  <h3 className="font-heading font-bold text-[20px] text-[#070707]">NOVA SPACE</h3>
                </div>
              </div>

              <p className="text-[14px] text-[#5E5E5E] leading-relaxed">
                Foundation metrics logged. Initial concept parameters established and locked for Phase 1 development.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-4 border-t border-[rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between text-[12px]">
                <span className="font-bold text-[#00A854]">100% Phase 1 Complete</span>
                <span className="text-[#8A8B8F]">Identity Lock Active</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#EDEDED] overflow-hidden">
                <div className="w-full h-full bg-[#00A854]" />
              </div>
            </div>
          </div>

          {/* Status Log Checklist (6 cols) */}
          <div className="lg:col-span-6 bg-[#FAF8FF] border border-[rgba(0,0,0,0.06)] rounded-[24px] p-6 sm:p-8 flex flex-col gap-4 shadow-xs">
            <h4 className="font-heading font-bold text-[16px] text-[#070707]">Status Log</h4>
            <div className="flex flex-col gap-2.5 text-[12px]">
              {statusLog.map((item) => (
                <div key={item.title} className="p-3 rounded-[12px] bg-white border border-[rgba(0,0,0,0.04)] flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-[#00A854] shrink-0 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-[#8A8B8F] uppercase">{item.title}</span>
                    <span className="font-medium text-[#070707]">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Transition Graphic Bar */}
        <div className="w-full p-4 sm:p-5 rounded-[18px] bg-[#F9F9FA] border border-[rgba(0,0,0,0.06)] flex flex-wrap items-center justify-center sm:justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-[12px]">
            <span className="w-2 h-2 rounded-full bg-[#00A854]" />
            <span className="text-[#070707]">PROJECT IDENTITY &amp; CONCEPT</span>
          </div>
          <span className="text-[#8A8B8F]">➔</span>
          <div className="flex items-center gap-2 font-bold text-[12px]">
            <span className="w-2 h-2 rounded-full bg-[#3C61DD]" />
            <span className="text-[#3C61DD]">POSITIONING &amp; BRANDING</span>
          </div>
        </div>

        {/* Next Page Preview Card */}
        <div className="w-full bg-[#FAF8FF] border border-[rgba(0,0,0,0.06)] rounded-[24px] p-6 sm:p-10 flex flex-col gap-6 shadow-xs">
          <div className="flex flex-col gap-2">
            <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
              CREATOR PAGE 04
            </span>
            <h3 className="text-[28px] sm:text-[36px] font-heading font-bold text-[#070707]">
              Position the project. Shape how it is presented.
            </h3>
            <p className="text-[14px] sm:text-[15px] text-[#5E5E5E] max-w-[720px] leading-relaxed">
              Transition from defining what the project is, to how it exists in the market. Establish clear messaging, visual direction, and distinct value arguments.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <Link
              href="/for-creators"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-[#F1F1F2] border border-[rgba(0,0,0,0.08)] text-[#070707] font-medium text-[14px] rounded-[10px] transition-colors shadow-xs"
            >
              <ArrowLeft size={16} />
              <span>Back to Creator Path</span>
            </Link>

            <Link
              href="/for-creators/positioning-branding"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#3C61DD] hover:bg-[#3252BF] text-white font-medium text-[14px] rounded-[10px] transition-all shadow-sm group"
            >
              <span>Next: Positioning &amp; Branding</span>
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
