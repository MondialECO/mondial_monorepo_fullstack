'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

export default function CompleteEntrepreneurJourney() {
  const stages = [
    {
      num: '01',
      title: 'COMPANY & VERIFICATION',
      desc: 'Establishing verified identity and foundational corporate structure.',
      isHighlighted: false,
    },
    {
      num: '02',
      title: 'BUILD & EXECUTE',
      desc: 'Proving market traction, unit economics, and operational rigor.',
      isHighlighted: false,
    },
    {
      num: '03',
      title: 'EQUITY & READINESS',
      desc: 'Structuring cap tables, IP, and the institutional data room.',
      isHighlighted: false,
    },
    {
      num: '04',
      title: 'FUNDING & DEALS',
      desc: 'Translating readiness into a structured institutional capital event.',
      isHighlighted: true,
    },
  ];

  const equationTerms = [
    'COMPANY IDENTITY',
    'VERIFICATION',
    'EXECUTION',
    'TRACTION',
    'EQUITY',
    'FINANCIAL CONTEXT',
    'FUNDING ASK',
    'DEAL EVIDENCE',
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#1A1B23] text-white flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-white/10 text-[11px] font-bold text-[#DCE1FF] uppercase tracking-wider">
              THE ENTREPRENEUR PATH
            </span>
          </div>

          <h2 className="text-[32px] sm:text-[48px] font-heading font-extrabold text-white leading-[1.1] tracking-tight">
            One company.
            <br />
            Four connected stages.
          </h2>

          <p className="text-[15px] sm:text-[17px] text-[#C4C5D6] leading-[1.6]">
            BUILD THE COMPANY. UNDERSTAND THE COMPANY. FUND THE COMPANY. WITHOUT STARTING AGAIN.
          </p>
        </div>

        {/* 4 Stage Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {stages.map((st) => (
            <div
              key={st.num}
              className={`p-6 rounded-[24px] flex flex-col justify-between gap-6 transition-all ${
                st.isHighlighted
                  ? 'bg-[#3C61DD] text-white shadow-lg border-2 border-white/30'
                  : 'bg-white/5 border border-white/10 text-white/90 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[14px] font-bold opacity-80">{st.num}</span>
                {st.isHighlighted ? (
                  <span className="px-2 py-0.5 rounded bg-white text-[#3C61DD] text-[9px] font-extrabold uppercase">
                    CURRENT STAGE
                  </span>
                ) : (
                  <CheckCircle2 size={16} className="text-[#9AF5C7]" />
                )}
              </div>

              <div className="flex flex-col gap-2">
                <h3 className="font-heading font-bold text-[16px] leading-snug">{st.title}</h3>
                <p className="text-[13px] opacity-80 leading-relaxed">{st.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Accumulated Context Equation */}
        <div className="p-6 sm:p-10 rounded-[28px] bg-white/5 border border-white/10 flex flex-col items-center gap-6 text-center">
          <span className="text-[11px] font-bold text-[#DCE1FF] uppercase tracking-wider">
            ACCUMULATED CONTEXT EQUATION
          </span>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-[11px] sm:text-[12px] font-bold">
            {equationTerms.map((term, idx) => (
              <span key={term} className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-[8px] bg-white/10 border border-white/15 text-white">
                  {term}
                </span>
                {idx < equationTerms.length - 1 ? (
                  <span className="text-[#3C61DD] font-extrabold">+</span>
                ) : (
                  <span className="text-[#9AF5C7] font-extrabold">➔</span>
                )}
              </span>
            ))}
            <span className="px-4 py-1.5 rounded-[8px] bg-[#3C61DD] text-white font-extrabold shadow-sm">
              ONE CONTINUOUS COMPANY JOURNEY
            </span>
          </div>
        </div>

        {/* Final CTAs & Completed Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pt-6 border-t border-white/10">
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#3C61DD] hover:bg-[#3252BF] text-white font-medium text-[15px] rounded-[12px] transition-all shadow-md group"
            >
              <span>Start Your Entrepreneur Journey</span>
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              href="/for-entrepreneurs"
              className="inline-flex items-center gap-2 px-5 py-3.5 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-medium text-[15px] rounded-[12px] transition-colors"
            >
              <span>Explore Company &amp; Verification</span>
            </Link>
          </div>

          <div className="px-4 py-2 rounded-full bg-white/10 border border-white/15 text-[11px] font-bold text-[#DCE1FF] flex items-center gap-2 w-fit">
            <ShieldCheck size={14} className="text-[#9AF5C7]" />
            <span>ENTREPRENEUR JOURNEY 01 → 02 → 03 → 04 COMPLETE</span>
          </div>
        </div>
      </div>
    </section>
  );
}
