'use client';

import Link from 'next/link';
import { CheckCircle2, ArrowRight, ArrowLeft, Building2 } from 'lucide-react';

export default function PositioningFinalCta() {
  const checklist = [
    'Identity Defined',
    'Concept Formed',
    'Problem Identified',
    'Solution Crafted',
    'Customer Mapped',
    'Positioning Set',
    'Value Prop Locked',
    'Brand Dir. Established',
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#F9F9FA] border-t border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1024px] bg-white border border-[rgba(0,0,0,0.08)] rounded-[28px] overflow-hidden shadow-lg grid grid-cols-1 lg:grid-cols-12 items-stretch">
        {/* Left Panel: Project Foundation (5 cols) */}
        <div className="lg:col-span-5 bg-[#F1F5FF] p-6 sm:p-8 flex flex-col justify-between gap-6 border-b lg:border-b-0 lg:border-r border-[#3C61DD]/20">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2.5 text-[12px] font-bold text-[#5E5E5E]">
              <Building2 size={18} className="text-[#3C61DD]" />
              <span className="uppercase">PROJECT FOUNDATION</span>
            </div>

            <h3 className="font-heading font-bold text-[22px] text-[#070707]">
              NOVA SPACE
            </h3>

            <div className="flex flex-col gap-2 pt-2 text-[12px]">
              {checklist.map((item) => (
                <div key={item} className="flex items-center gap-2 text-[#070707]">
                  <CheckCircle2 size={14} className="text-[#00A854] shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-[10px] bg-[#E8F8EE] text-[#00A854] text-[11px] font-bold uppercase inline-flex items-center gap-1.5 w-fit border border-[#00A854]/20">
            <span className="w-2 h-2 rounded-full bg-[#00A854]" />
            <span>READY FOR PROJECT INTELLIGENCE</span>
          </div>
        </div>

        {/* Right Panel: Next Phase Action (7 cols) */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between gap-8 bg-white">
          <div className="flex flex-col gap-3">
            <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
              NEXT — PHASE 03
            </span>
            <h3 className="text-[28px] sm:text-[34px] font-heading font-bold text-[#070707] leading-tight">
              Now test what the project assumes.
            </h3>
            <p className="text-[14px] sm:text-[15px] text-[#5E5E5E] leading-relaxed">
              Take the structured project into Business Planning, Market Intelligence, Financial Forecasting and Risk Analysis.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/for-creators/project-intelligence"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#3C61DD] hover:bg-[#3252BF] text-white font-medium text-[14px] rounded-[10px] transition-all shadow-sm group"
              >
                <span>CONTINUE TO PROJECT INTELLIGENCE</span>
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                href="/for-creators"
                className="inline-flex items-center gap-2 px-5 py-3.5 bg-white hover:bg-[#F9F9FA] border border-[rgba(0,0,0,0.1)] text-[#070707] font-medium text-[14px] rounded-[10px] transition-colors shadow-xs"
              >
                <ArrowLeft size={16} />
                <span>BACK TO CREATOR PATH</span>
              </Link>
            </div>

            <div className="flex items-center gap-2 text-[12px] text-[#8A8B8F] pt-2 border-t border-[rgba(0,0,0,0.06)]">
              <Building2 size={13} />
              <span>Creator Page 04 — Positioning &amp; Branding</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
