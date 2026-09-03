'use client';

import { Scale, DollarSign, Terminal, Palette, Compass, CheckCircle2, ArrowRight } from 'lucide-react';

export default function ContextualTrustSection() {
  return (
    <section
      id="section-02-contextual-trust"
      className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#F1F1F2]/60 border-b border-[rgba(0,0,0,0.06)] flex justify-center"
    >
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="px-3 py-1 rounded-full bg-[#DCE1FF] text-[#1A47C3] text-[11px] font-bold uppercase tracking-wider w-fit">
            PROFESSIONAL TRUST IS CONTEXTUAL
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            A lawyer should not be verified
            <br />
            like a developer.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Different professions prove expertise in different ways. Mondial adapts professional verification to the category being offered.
          </p>
        </div>

        {/* 5-Column Profession Landscape Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-stretch">
          {/* 1. Legal */}
          <div className="p-5 rounded-[22px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-5">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-[rgba(0,0,0,0.06)]">
                <h3 className="font-heading font-bold text-[16px] text-[#1A1B23]">Legal</h3>
                <Scale size={16} className="text-[#1A47C3]" />
              </div>

              <div className="flex flex-col gap-3 text-[12px]">
                <div>
                  <span className="text-[9px] font-bold text-[#747685] uppercase block">AUTHORITY</span>
                  <p className="font-medium text-[#1A1B23]">Bar registration &amp; standing</p>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-[#747685] uppercase block">DOMAIN</span>
                  <p className="font-medium text-[#1A1B23]">Jurisdiction verification</p>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-[#747685] uppercase block">ENTITY</span>
                  <p className="font-medium text-[#1A1B23]">Firm association details</p>
                </div>
              </div>
            </div>
            <div className="w-full h-1.5 rounded-full bg-[#1A1B23]" />
          </div>

          {/* 2. Finance */}
          <div className="p-5 rounded-[22px] bg-[#F3F2FD] border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-5">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-[rgba(0,0,0,0.06)]">
                <h3 className="font-heading font-bold text-[16px] text-[#1A1B23]">Finance</h3>
                <DollarSign size={16} className="text-[#875301]" />
              </div>

              <div className="flex flex-col gap-3 text-[12px]">
                <div>
                  <span className="text-[9px] font-bold text-[#747685] uppercase block">DESIGNATIONS</span>
                  <div className="flex gap-1 pt-1">
                    <span className="px-1.5 py-0.5 rounded bg-white text-[10px] font-bold">CPA</span>
                    <span className="px-1.5 py-0.5 rounded bg-white text-[10px] font-bold">CFA</span>
                    <span className="px-1.5 py-0.5 rounded bg-white text-[10px] font-bold">ACCA</span>
                  </div>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-[#747685] uppercase block">CONTEXT</span>
                  <p className="font-medium text-[#1A1B23]">Regulatory Framework</p>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-[#747685] uppercase block">METRICS</span>
                  <p className="font-medium text-[#1A1B23]">Financial Modeling</p>
                </div>
              </div>
            </div>
            <div className="w-full h-1.5 rounded-full bg-[#875301]" />
          </div>

          {/* 3. Development (Terminal Style) */}
          <div className="p-5 rounded-[22px] bg-[#2F3038] text-white shadow-md flex flex-col justify-between gap-5 font-mono">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <h3 className="font-heading font-bold text-[16px] text-white font-sans">
                  Development
                </h3>
                <Terminal size={16} className="text-[#9AF5C7]" />
              </div>

              <div className="flex flex-col gap-2 text-[11px] text-[#9AF5C7]">
                <p className="text-white/90">$ verify --target github</p>
                <div className="space-y-1 text-white/70 text-[10px]">
                  <p>✔ Validating Repos</p>
                  <p>✔ Live Products</p>
                  <p>✔ Code Integrity</p>
                </div>
              </div>
            </div>
            <div className="text-[10px] text-[#9AF5C7] font-bold">Status: Verified</div>
          </div>

          {/* 4. Design */}
          <div className="p-5 rounded-[22px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-5">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-[rgba(0,0,0,0.06)]">
                <h3 className="font-heading font-bold text-[16px] text-[#1A1B23]">Design</h3>
                <Palette size={16} className="text-[#BA1A1A]" />
              </div>

              <div className="flex flex-col gap-3 text-[12px]">
                <div>
                  <span className="text-[9px] font-bold text-[#747685] uppercase block">PORTFOLIO</span>
                  <p className="font-medium text-[#1A1B23]">Curated Portfolio</p>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-[#747685] uppercase block">PROFILES</span>
                  <p className="font-medium text-[#1A1B23]">Behance / Dribbble</p>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-[#747685] uppercase block">EVIDENCE</span>
                  <p className="font-medium text-[#1A1B23]">In-depth Case Studies</p>
                </div>
              </div>
            </div>
            <div className="w-full h-1.5 rounded-full bg-[#BA1A1A]" />
          </div>

          {/* 5. Strategy */}
          <div className="p-5 rounded-[22px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-5">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-[rgba(0,0,0,0.06)]">
                <h3 className="font-heading font-bold text-[16px] text-[#1A1B23]">Strategy</h3>
                <Compass size={16} className="text-[#157A55]" />
              </div>

              <div className="flex flex-col gap-3 text-[12px]">
                <div>
                  <span className="text-[9px] font-bold text-[#747685] uppercase block">QUALIFICATION</span>
                  <p className="font-medium text-[#1A1B23]">Relevant Credentials</p>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-[#747685] uppercase block">CONTEXT</span>
                  <p className="font-medium text-[#1A1B23]">Market Environment</p>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-[#747685] uppercase block">EVIDENCE</span>
                  <p className="font-medium text-[#1A1B23]">Case-study Impact</p>
                </div>
              </div>
            </div>
            <div className="w-full h-1.5 rounded-full bg-[#157A55]" />
          </div>
        </div>

        {/* Core Principle Banner */}
        <div className="w-full p-6 sm:p-8 rounded-[20px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col items-center gap-4 text-center">
          <h3 className="font-heading font-extrabold text-[15px] sm:text-[18px] text-[#070707] uppercase tracking-wide max-w-[840px]">
            VERIFICATION SHOULD FOLLOW THE PROFESSION. NOT FORCE EVERY PROFESSION INTO THE SAME CHECKLIST.
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] sm:text-[12px] font-bold text-[#3C61DD]">
            <span>ONE PLATFORM</span>
            <span>➔</span>
            <span>DIFFERENT PROFESSIONAL EVIDENCE</span>
            <span>➔</span>
            <span>ONE TRUST MODEL</span>
          </div>
        </div>
      </div>
    </section>
  );
}
