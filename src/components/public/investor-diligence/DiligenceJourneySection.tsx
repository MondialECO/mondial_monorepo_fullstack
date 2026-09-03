'use client';

import Link from 'next/link';
import { ShieldCheck, Eye, HelpCircle, Layers, FileSignature, CheckCircle2, ArrowRight } from 'lucide-react';

export default function DiligenceJourneySection() {
  const bentoSteps = [
    {
      title: 'ACCESS',
      desc: 'Enter controlled company information securely.',
      icon: ShieldCheck,
    },
    {
      title: 'REVIEW',
      desc: 'Understand the business and evaluate the evidence presented.',
      icon: Eye,
    },
    {
      title: 'QUESTION',
      desc: 'Challenge assumptions and identify critical gaps.',
      icon: HelpCircle,
    },
    {
      title: 'STRUCTURE',
      desc: 'Determine whether the investment structure fits your thesis.',
      icon: Layers,
    },
    {
      title: 'PROPOSE',
      desc: 'Move toward definitive investment terms.',
      icon: FileSignature,
    },
    {
      title: 'EXECUTE & NEGOTIATE',
      desc: 'Align the parties and complete the applicable transaction process efficiently.',
      icon: CheckCircle2,
    },
  ];

  const equationTerms = [
    'CONTROLLED ACCESS',
    'STRUCTURED EVIDENCE',
    'CRITICAL QUESTIONS',
    'CLEAR TERMS',
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#FAF8FF] border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            DILIGENCE &amp; INVEST
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            From initial evidence to an
            <br />
            informed investment decision.
          </h2>
        </div>

        {/* 6 Bento Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {bentoSteps.map((b) => {
            const Icon = b.icon;
            return (
              <div
                key={b.title}
                className="p-6 rounded-[24px] bg-white border border-[#E2E1EC] shadow-2xs flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="w-10 h-10 rounded-[12px] bg-[#FAF8FF] border border-[#E2E1EC] flex items-center justify-center text-[#3C61DD] mb-3">
                    <Icon size={20} />
                  </div>
                  <h3 className="font-heading font-bold text-[18px] text-[#1A1B23]">{b.title}</h3>
                  <p className="text-[12px] text-[#444654] mt-1 leading-relaxed">{b.desc}</p>
                </div>
                <div className="text-[10px] text-[#747685]">Process Phase</div>
              </div>
            );
          })}
        </div>

        {/* Begin Process Callout & Final Equation */}
        <div className="p-6 sm:p-10 rounded-[28px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col items-center gap-6 text-center">
          <Link
            href="/signup"
            className="px-8 py-3.5 bg-[#3C61DD] hover:bg-[#3252BF] text-white font-semibold text-[14px] rounded-[10px] transition-all shadow-sm inline-flex items-center gap-2 group"
          >
            <span>Begin Process</span>
            <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
          </Link>

          <span className="text-[11px] font-bold text-[#747685] uppercase tracking-wider">
            DILIGENCE &amp; INVEST EQUATION
          </span>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-[11px] sm:text-[12px] font-bold text-[#1A1B23]">
            {equationTerms.map((term, idx) => (
              <span key={term} className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-[8px] bg-[#FAF8FF] border border-[#E2E1EC]">
                  {term}
                </span>
                {idx < equationTerms.length - 1 ? (
                  <span className="text-[#3C61DD]">+</span>
                ) : (
                  <span className="text-[#3C61DD]">➔</span>
                )}
              </span>
            ))}
            <span className="px-4 py-1.5 rounded-[8px] bg-[#1A47C3] text-white shadow-xs">
              BETTER-INFORMED INVESTMENT PROCESS
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

