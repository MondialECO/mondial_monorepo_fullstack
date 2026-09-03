'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, ChevronRight, Building2, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';

export default function FundingDealsHero() {
  const steps = [
    { num: '1. INVESTOR FIT', sub: 'Sector, Stage, Ticket, Geography, Thesis', active: true },
    { num: '2. CONTROLLED ACCESS', sub: 'Public Company Context, NDA, Data Room Access' },
    { num: '3. DILIGENCE', sub: 'Company, Financial, Legal, Commercial' },
    { num: '4. TERM DISCUSSION', sub: 'Economics, Ownership, Rights, Conditions' },
    { num: '5. AGREEMENT', sub: 'Final Term Sheet alignment' },
    { num: '6. DEAL EXECUTION', sub: 'Transaction & Portfolio Closing', isDone: true },
  ];

  const flow = ['READINESS', 'MATCH', 'ACCESS', 'DILIGENCE', 'TERMS', 'NEGOTIATION', 'DEAL'];

  return (
    <section className="w-full pt-28 pb-16 sm:pt-36 sm:pb-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#F3F2FD]/50 via-white to-white flex justify-center border-b border-[rgba(0,0,0,0.06)]">
      <div className="w-full max-w-[1280px] flex flex-col gap-10">
        {/* Context & Breadcrumbs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[12px] font-bold">
          <div className="flex items-center gap-2">
            <span className="text-[#747685] uppercase">ENTREPRENEURS</span>
            <span className="text-[#C4C5D6]">&gt;</span>
            <span className="text-[#3C61DD] uppercase">FUNDING &amp; DEALS</span>
          </div>

          <div className="px-3 py-1.5 rounded-full bg-[#FAF8FF] border border-[#E2E1EC] flex items-center gap-2 text-[10px] w-fit">
            <span className="text-[#747685] flex items-center gap-1">
              <CheckCircle2 size={12} className="text-[#005F40]" />
              01-03 COMPLETE
            </span>
            <span className="text-[#C4C5D6]">|</span>
            <span className="text-[#3C61DD] flex items-center gap-1 font-extrabold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3C61DD]" />
              04 CURRENT (FUNDING &amp; DEALS)
            </span>
          </div>
        </div>

        {/* Asymmetric Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Left Column: Narrative (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-8">
            <div className="flex flex-col gap-5">
              <h1 className="text-[40px] sm:text-[50px] lg:text-[56px] font-heading font-extrabold text-[#1A1B23] leading-[1.08] tracking-[-1.4px]">
                From investor
                <br />
                interest to a
                <br />
                <span className="text-[#3C61DD]">structured deal.</span>
              </h1>

              <p className="text-[16px] sm:text-[18px] text-[#444654] leading-[1.6]">
                Mondial helps Entrepreneurs move through investor discovery, controlled access, diligence, negotiation and deal progression without losing the company context built earlier.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href="/signup"
                  className="px-5 py-3.5 bg-[#3C61DD] hover:bg-[#3252BF] text-white font-semibold text-[14px] rounded-[10px] transition-all shadow-sm inline-flex items-center gap-2 group"
                >
                  <span>Explore Funding &amp; Deals</span>
                  <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                </Link>

                <a
                  href="#section-02-investor-discovery"
                  className="px-5 py-3.5 bg-white hover:bg-[#FAF8FF] border border-[#E2E1EC] text-[#3C61DD] font-semibold text-[14px] rounded-[10px] transition-colors inline-flex items-center gap-2"
                >
                  <span>See the Deal Journey</span>
                  <span>➔</span>
                </a>
              </div>
            </div>

            {/* Editorial Statement */}
            <div className="p-5 rounded-[16px] bg-[#FAF8FF] border border-[#E2E1EC]">
              <p className="font-heading font-bold text-[14px] sm:text-[15px] text-[#1A1B23] leading-relaxed uppercase tracking-wide">
                &ldquo;FUNDRAISING IS NOT ONE INTRODUCTION. IT IS A SEQUENCE OF TRUST, INFORMATION AND DECISIONS.&rdquo;
              </p>
            </div>
          </div>

          {/* Right Column: Visual Story / Sequence Map (7 cols) */}
          <div className="lg:col-span-7 bg-[#F3F2FD] border border-[#E2E1EC] rounded-[24px] p-6 sm:p-8 flex flex-col gap-6 shadow-xs">
            {/* Top Company Ask Header */}
            <div className="bg-white border border-[#E2E1EC] rounded-[18px] p-5 flex flex-col gap-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 size={16} className="text-[#3C61DD]" />
                  <span className="font-heading font-extrabold text-[15px] text-[#1A1B23]">
                    NOVA SPACE SAS
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded bg-amber-50 text-[#965F11] text-[10px] font-bold uppercase border border-amber-200">
                  ILLUSTRATIVE EXAMPLE
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-[#747685] uppercase">
                  FUNDING OBJECTIVE
                </span>
                <h3 className="font-heading font-extrabold text-[20px] text-[#1A1B23]">
                  Structured Funding Ask - €500K
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] font-medium text-[#444654]">
                <span className="px-2.5 py-1 rounded bg-[#E8E7F2]">Product</span>
                <span className="px-2.5 py-1 rounded bg-[#E8E7F2]">Growth</span>
                <span className="px-2.5 py-1 rounded bg-[#E8E7F2]">Operations</span>
                <span className="px-2.5 py-1 rounded bg-[#E8E7F2]">Runway</span>
              </div>
            </div>

            {/* Vertical Sequence Map */}
            <div className="bg-white border border-[#E2E1EC] rounded-[18px] p-5 sm:p-6 flex flex-col gap-4 shadow-2xs">
              <span className="text-[10px] font-bold text-[#747685] uppercase tracking-wider pb-2 border-b border-[rgba(0,0,0,0.06)]">
                TRANSACTION SEQUENCE
              </span>

              <div className="flex flex-col gap-3 pl-3 border-l-2 border-[#E2E1EC]">
                {steps.map((st) => (
                  <div key={st.num} className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          st.isDone
                            ? 'bg-[#005F40]'
                            : st.active
                            ? 'bg-[#3C61DD]'
                            : 'bg-[#C4C5D6]'
                        }`}
                      />
                      <span
                        className={`font-heading font-bold text-[13px] ${
                          st.isDone
                            ? 'text-[#005F40]'
                            : st.active
                            ? 'text-[#3C61DD]'
                            : 'text-[#1A1B23]'
                        }`}
                      >
                        {st.num}
                      </span>
                    </div>
                    <span className="text-[12px] text-[#747685] pl-4">{st.sub}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Context Flow */}
            <div className="p-4 rounded-[16px] bg-white border border-[#E2E1EC] flex flex-wrap items-center justify-between gap-2 text-[10px] sm:text-[11px] font-bold">
              {flow.map((fl, i) => (
                <div key={fl} className="flex items-center gap-1 sm:gap-2">
                  <span className={i === flow.length - 1 ? 'text-[#005F40]' : 'text-[#1A1B23]'}>
                    {fl}
                  </span>
                  {i < flow.length - 1 && <span className="text-[#3C61DD]">➔</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
