'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, Building2, Layers, Users, TrendingUp, Compass, AlertCircle } from 'lucide-react';

export default function BuildExecuteHero() {
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="w-full pt-28 pb-16 sm:pt-36 sm:pb-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#F3F2FD]/50 via-white to-white flex justify-center border-b border-[rgba(0,0,0,0.06)]">
      <div className="w-full max-w-[1360px] bg-white border border-[#C4C5D6] rounded-[24px] p-6 sm:p-10 shadow-lg grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Side: Editorial (45% / 5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-8 h-full">
          <div className="flex flex-col gap-5 items-start">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F3F2FD] text-[#3C61DD] text-[12px] font-bold tracking-wider uppercase border border-[#3C61DD]/20">
              <span className="w-2 h-2 rounded-full bg-[#3C61DD]" />
              <span>ENTREPRENEURS — BUILD &amp; EXECUTE</span>
            </div>

            <h1 className="text-[36px] sm:text-[46px] lg:text-[48px] font-heading font-bold text-[#1A1B23] leading-[1.12] tracking-tight">
              Turn company structure into <span className="text-[#3C61DD]">real execution.</span>
            </h1>

            <p className="text-[16px] sm:text-[17px] text-[#444654] leading-[1.6]">
              Discover opportunities, assemble the right people and resources, manage active work and turn execution into measurable progress.
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#3C61DD] hover:bg-[#3252BF] text-white font-medium text-[15px] rounded-[10px] transition-all shadow-sm group"
              >
                <span>Start Building</span>
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <button
                type="button"
                onClick={() => scrollToSection('section-02-opportunity-discovery')}
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-white hover:bg-[#FAF8FF] border border-[#3C61DD]/30 text-[#1A47C3] font-medium text-[15px] rounded-[10px] transition-colors shadow-xs"
              >
                <span>See How Execution Works</span>
              </button>
            </div>
          </div>

          {/* Journey Tracker */}
          <div className="w-full pt-6 border-t border-[rgba(0,0,0,0.06)] flex flex-col gap-3.5">
            <span className="text-[11px] font-bold text-[#444654] uppercase tracking-wider">
              ENTREPRENEUR JOURNEY — PAGE 02 OF 4
            </span>
            <div className="flex flex-col gap-2.5 text-[13px]">
              {/* Step 1: Complete */}
              <div className="flex items-center justify-between p-2 rounded-[8px] bg-[#E8F8EE]/60 text-[#157A55]">
                <div className="flex items-center gap-2 font-medium">
                  <CheckCircle2 size={14} />
                  <span>01 COMPANY &amp; VERIFICATION</span>
                </div>
                <span className="px-2 py-0.5 rounded-[4px] bg-[#157A55] text-white text-[9px] font-bold uppercase">
                  COMPLETE
                </span>
              </div>

              {/* Step 2: Active */}
              <div className="flex items-center justify-between p-2 rounded-[8px] bg-[#F1F5FF] text-[#3C61DD] border border-[#3C61DD]/20">
                <div className="flex items-center gap-2 font-bold">
                  <span className="w-2 h-2 rounded-full bg-[#3C61DD]" />
                  <span>02 BUILD &amp; EXECUTE</span>
                </div>
                <span className="px-2 py-0.5 rounded-[4px] bg-[#3C61DD] text-white text-[9px] font-bold uppercase">
                  ACTIVE
                </span>
              </div>

              {/* Step 3: Next */}
              <div className="flex items-center justify-between p-2 rounded-[8px] bg-transparent text-[#747685]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#C4C5D6]" />
                  <span>03 EQUITY &amp; READINESS</span>
                </div>
              </div>

              {/* Step 4: Future */}
              <div className="flex items-center justify-between p-2 rounded-[8px] bg-transparent text-[#747685]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#C4C5D6]" />
                  <span>04 FUNDING &amp; DEALS</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Product UI / Command Center (55% / 7 cols) */}
        <div className="lg:col-span-7 bg-[#F3F2FD] border border-[#C4C5D6] rounded-[20px] overflow-hidden shadow-md flex flex-col">
          {/* Header */}
          <div className="p-5 sm:p-6 bg-[#FAF8FF] border-b border-[#C4C5D6] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[10px] bg-[#3C61DD] text-white flex items-center justify-center font-bold">
                NS
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#444654] uppercase block">
                  COMPANY: NOVA SPACE SAS
                </span>
                <h3 className="font-heading font-bold text-[18px] text-[#1A1B23]">
                  Build &amp; Execute Area
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] font-bold text-[#444654] uppercase block">
                  Execution Readiness
                </span>
                <span className="text-[20px] font-heading font-extrabold text-[#3C61DD]">
                  64%
                </span>
              </div>
              {/* Circular progress simulated */}
              <div className="relative w-11 h-11 flex items-center justify-center">
                <svg className="w-11 h-11 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-[#E2E1EC]"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-[#3C61DD]"
                    strokeDasharray="64, 100"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-5 sm:p-6 flex flex-col gap-5">
            <span className="px-2.5 py-1 rounded bg-[#FFB865]/20 text-[#774800] text-[10px] font-bold uppercase w-fit border border-[#FFB865]/40">
              ILLUSTRATIVE EXAMPLE
            </span>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
              {/* Main Dashboard: Metrics + Project Workspace (8 cols) */}
              <div className="md:col-span-8 flex flex-col gap-4">
                {/* 4 Metrics Grid */}
                <div className="grid grid-cols-2 gap-3 text-[12px]">
                  <div className="p-3.5 rounded-[14px] bg-[#FAF8FF] border border-[#E2E1EC] flex flex-col gap-1 shadow-2xs">
                    <span className="text-[20px] font-heading font-extrabold text-[#1A1B23]">3</span>
                    <span className="text-[11px] font-bold text-[#444654] uppercase leading-tight">
                      ACTIVE PRIORITIES
                    </span>
                  </div>
                  <div className="p-3.5 rounded-[14px] bg-[#FAF8FF] border border-[#E2E1EC] flex flex-col gap-1 shadow-2xs">
                    <span className="text-[20px] font-heading font-extrabold text-[#1A1B23]">4</span>
                    <span className="text-[11px] font-bold text-[#444654] uppercase leading-tight">
                      ACTIVE MILESTONES
                    </span>
                  </div>
                  <div className="p-3.5 rounded-[14px] bg-[#FAF8FF] border border-[#E2E1EC] flex flex-col gap-1 shadow-2xs">
                    <span className="text-[20px] font-heading font-extrabold text-[#1A1B23]">1</span>
                    <span className="text-[11px] font-bold text-[#444654] uppercase leading-tight">
                      PROJECT IN ACQUISITION
                    </span>
                  </div>
                  <div className="p-3.5 rounded-[14px] bg-[#FAF8FF] border border-[#E2E1EC] flex flex-col gap-1 shadow-2xs relative">
                    <span className="w-2 h-2 rounded-full bg-[#965F11] absolute top-3 right-3" />
                    <span className="text-[20px] font-heading font-extrabold text-[#1A1B23]">2</span>
                    <span className="text-[11px] font-bold text-[#444654] uppercase leading-tight">
                      RESOURCE GAPS
                    </span>
                  </div>
                </div>

                {/* Project Workspace Detail */}
                <div className="p-4 sm:p-5 rounded-[16px] bg-[#FAF8FF] border border-[#E2E1EC] flex flex-col gap-3 text-[12px] shadow-2xs">
                  <div className="flex items-center justify-between pb-2 border-b border-[rgba(0,0,0,0.06)]">
                    <div>
                      <span className="text-[9px] font-bold text-[#8A8B8F] uppercase block">
                        PROJECT WORKSPACE
                      </span>
                      <h4 className="font-heading font-bold text-[15px] text-[#1A1B23]">
                        MVP Marketplace
                      </h4>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-[#F1F5FF] text-[#3C61DD] text-[10px] font-bold uppercase border border-[#3C61DD]/20">
                      IN PROGRESS
                    </span>
                  </div>

                  {/* Progress Bar 42% */}
                  <div className="w-full flex flex-col gap-1">
                    <div className="flex items-center justify-between text-[11px] text-[#444654]">
                      <span>Development Progress</span>
                      <span className="font-bold text-[#3C61DD]">42%</span>
                    </div>
                    <div className="w-full h-2 bg-[#E2E1EC] rounded-full overflow-hidden">
                      <div className="h-full bg-[#3C61DD] rounded-full" style={{ width: '42%' }} />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[#444654]">Owner:</span>
                      <span className="font-medium text-[#1A1B23]">Product Team</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#444654]">Resource Need:</span>
                      <span className="px-2 py-0.5 rounded bg-amber-50 text-[#965F11] font-medium text-[11px] border border-amber-200">
                        Backend Development
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#444654]">Provider Matches:</span>
                      <span className="font-medium text-[#1A1B23]">3 potential matches found</span>
                    </div>
                    <div className="flex items-start justify-between gap-2 pt-1 border-t border-[rgba(0,0,0,0.04)]">
                      <span className="text-[#444654] shrink-0">Next Milestone:</span>
                      <span className="font-medium text-[#1A1B23] text-right">
                        Booking Flow Prototype (Upcoming)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Side Modules: Vertical List (4 cols) */}
              <div className="md:col-span-4 flex flex-col gap-2 text-[12px]">
                <div className="p-3 rounded-[12px] bg-white border-l-4 border-l-[#3C61DD] border border-[#E2E1EC] flex flex-col gap-0.5 shadow-2xs">
                  <span className="font-bold text-[#3C61DD] text-[11px]">PROJECT DISCOVERY</span>
                  <span className="text-[10px] text-[#3C61DD] font-semibold">ACTIVE</span>
                </div>

                <div className="p-3 rounded-[12px] bg-[#FAF8FF] border border-[#E2E1EC] flex items-center justify-between shadow-2xs">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-[#1A1B23] text-[11px]">TEAM &amp; RESOURCES</span>
                    <span className="text-[9px] text-[#444654]">NEEDS ATTENTION</span>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-[#965F11]" />
                </div>

                <div className="p-3 rounded-[12px] bg-[#FAF8FF] border border-[#E2E1EC] flex items-center justify-between shadow-2xs">
                  <span className="font-medium text-[#1A1B23] text-[11px]">ACTIVE PROJECTS</span>
                  <span className="px-2 py-0.5 rounded bg-[#E2E1EC] text-[#444654] font-bold text-[11px]">
                    3
                  </span>
                </div>

                <div className="p-3 rounded-[12px] bg-[#FAF8FF] border border-[#E2E1EC] flex flex-col gap-0.5 shadow-2xs">
                  <span className="font-medium text-[#1A1B23] text-[11px]">TRACTION</span>
                  <span className="text-[10px] text-[#747685] font-semibold">EARLY</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Bar */}
          <div className="p-3.5 bg-[#EEDED8]/40 border-t border-[#C4C5D6] flex items-center justify-between">
            <Link
              href="/signup"
              className="text-[#3C61DD] font-bold text-[13px] hover:underline flex items-center gap-1.5"
            >
              <span>Open Execution Workspace</span>
              <ArrowRight size={13} />
            </Link>
            <span className="text-[10px] text-[#747685] italic">Demonstration Mode</span>
          </div>
        </div>
      </div>
    </section>
  );
}
