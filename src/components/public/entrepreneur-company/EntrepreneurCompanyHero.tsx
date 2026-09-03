'use client';

import Link from 'next/link';
import { ArrowRight, Building2, CheckCircle2, ShieldCheck, AlertCircle, Clock, FileCheck2, User, Globe } from 'lucide-react';

export default function EntrepreneurCompanyHero() {
  const steps = [
    { label: '01 VERIFY', active: true },
    { label: '02 BUILD' },
    { label: '03 STRUCTURE' },
    { label: '04 FUND' },
  ];

  const statuses = [
    { name: 'Company Identity', status: 'COMPLETE', color: 'green' },
    { name: 'Registration', status: 'VERIFIED', color: 'green' },
    { name: 'Representatives', status: 'VERIFIED', color: 'green' },
    { name: 'Bank Information', status: 'IN REVIEW', color: 'amber' },
    { name: 'Financial Profile', status: 'IN PROGRESS', color: 'blue' },
    { name: 'Compliance', status: 'NEEDS ATTENTION', color: 'red' },
  ];

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="w-full pt-28 pb-12 sm:pt-36 sm:pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#F3F2FD]/50 to-white flex justify-center border-b border-[rgba(0,0,0,0.06)]">
      <div className="w-full max-w-[1280px] grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Side: Editorial Layout (42% / 5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6 items-start">
          <div className="flex items-center gap-2">
            <span className="w-8 h-[2px] bg-[#C4C5D6]" />
            <span className="text-[12px] font-bold text-[#444654] uppercase tracking-wider">
              ENTREPRENEURS — COMPANY &amp; VERIFICATION
            </span>
          </div>

          <h1 className="text-[38px] sm:text-[46px] lg:text-[48px] font-heading font-bold text-[#070707] leading-[1.12] tracking-tight">
            Build the company
            <br />
            on a <span className="text-[#3C61DD]">verified foundation.</span>
          </h1>

          <p className="text-[16px] sm:text-[18px] text-[#444654] leading-[1.6]">
            Mondial brings company identity, official verification, financial information and compliance into one structured foundation before execution, equity and funding begin.
          </p>

          <div className="flex flex-wrap items-center gap-3.5 pt-1">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#3C61DD] hover:bg-[#3252BF] text-white font-medium text-[15px] rounded-[10px] transition-all shadow-sm group"
            >
              <span>Verify Your Company</span>
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <button
              type="button"
              onClick={() => scrollToSection('section-02-two-ways-in')}
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-white hover:bg-[#FAF8FF] border border-[#3C61DD]/30 text-[#1A47C3] font-medium text-[15px] rounded-[10px] transition-colors shadow-xs"
            >
              <span>See How It Works</span>
            </button>
          </div>

          {/* Entrepreneur Journey Tracker */}
          <div className="w-full pt-4 border-t border-[rgba(0,0,0,0.06)] flex flex-col gap-3">
            <span className="text-[11px] font-bold text-[#444654] uppercase tracking-wider">
              ENTREPRENEUR JOURNEY — PAGE 01 OF 4
            </span>
            <div className="grid grid-cols-4 gap-2">
              {steps.map((st) => (
                <div key={st.label} className="flex flex-col gap-1.5">
                  <div
                    className={`w-full h-1 rounded-full ${st.active ? 'bg-[#3C61DD]' : 'bg-[#C4C5D6]'
                      }`}
                  />
                  <span
                    className={`text-[11px] font-bold ${st.active ? 'text-[#3C61DD]' : 'text-[#444654]'
                      }`}
                  >
                    {st.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Command Center Mockup (58% / 7 cols) */}
        <div className="lg:col-span-7 bg-[#FAF8FF] border border-[#E2E1EC] rounded-[24px] overflow-hidden shadow-xl flex flex-col">
          {/* Header */}
          <div className="px-6 py-3.5 bg-[#F3F2FD] border-b border-[#E2E1EC] flex items-center justify-between">
            <div className="flex items-center gap-2 text-[11px] font-bold text-[#444654]">
              <span className="w-2 h-2 rounded-full bg-[#3C61DD]" />
              <span>MONDIAL COMPANY FOUNDATION COMMAND CENTER</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E2E1EC]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#E2E1EC]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#E2E1EC]" />
            </div>
          </div>

          {/* Context Header */}
          <div className="p-5 sm:p-6 bg-white border-b border-[#E2E1EC] grid grid-cols-2 sm:grid-cols-4 gap-4 text-[12px]">
            <div>
              <span className="text-[10px] font-bold text-[#444654] uppercase block">COMPANY</span>
              <span className="font-heading font-bold text-[15px] text-[#1A1B23]">NOVA SPACE SAS</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#444654] uppercase block">PROJECT</span>
              <span className="font-semibold text-[#1A1B23]">NOVA SPACE</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#444654] uppercase block">ENTREPRENEUR</span>
              <span className="font-semibold text-[#1A1B23]">Henry Martin</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#444654] uppercase block">COUNTRY</span>
              <span className="font-semibold text-[#1A1B23]">France</span>
            </div>
          </div>

          {/* Dashboard Area */}
          <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Left Col: Readiness Gauge + Status List (7 cols) */}
            <div className="md:col-span-7 flex flex-col gap-4">
              {/* Readiness Card */}
              <div className="p-4 rounded-[16px] bg-white border border-[#E2E1EC] flex items-center gap-4 shadow-xs">
                <div className="flex flex-col items-center justify-center p-3 rounded-[12px] bg-[#F3F2FD] border border-[#3C61DD]/20 shrink-0">
                  <span className="text-[24px] font-heading font-extrabold text-[#1A1B23]">72%</span>
                  <span className="text-[8px] font-bold text-[#444654] uppercase tracking-wider text-center">
                    ILLUSTRATIVE EXAMPLE
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <h4 className="font-heading font-bold text-[15px] text-[#1A1B23]">
                    Foundation Readiness
                  </h4>
                  <p className="text-[11px] text-[#444654]">
                    Completion required before equity allocation.
                  </p>
                </div>
              </div>

              {/* Status List */}
              <div className="flex flex-col gap-2 text-[12px]">
                {statuses.map((s) => (
                  <div
                    key={s.name}
                    className="p-2.5 rounded-[10px] bg-white border border-[rgba(0,0,0,0.04)] flex items-center justify-between shadow-2xs"
                  >
                    <span className="font-medium text-[#1A1B23]">{s.name}</span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-[4px] uppercase ${s.color === 'green'
                        ? 'bg-[#E8F8EE] text-[#00A854]'
                        : s.color === 'amber'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : s.color === 'blue'
                            ? 'bg-[#F1F5FF] text-[#3C61DD]'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                    >
                      {s.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Col: Bank Info Detail Panel & Hero Metrics (5 cols) */}
            <div className="md:col-span-5 flex flex-col gap-4">
              <div className="p-4 rounded-[16px] bg-white border border-[#E2E1EC] flex flex-col gap-3 shadow-xs text-[12px]">
                <div className="flex items-center justify-between pb-2 border-b border-[rgba(0,0,0,0.06)]">
                  <span className="font-bold text-[11px] text-[#444654] uppercase">BANK INFORMATION</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">
                    IN REVIEW
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <div>
                    <span className="text-[9px] text-[#8A8B8F] uppercase block">ENTITY</span>
                    <span className="font-semibold text-[#1A1B23]">Nova Space SAS</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#8A8B8F] uppercase block">Bank Certificate</span>
                    <span className="text-[#00A854] font-medium flex items-center gap-1">
                      <CheckCircle2 size={12} /> Uploaded
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#8A8B8F] uppercase block">Company Name Match</span>
                    <span className="text-[#00A854] font-medium flex items-center gap-1">
                      <CheckCircle2 size={12} /> PASSED
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="w-full mt-1 py-2 px-3 rounded-[8px] bg-[#3C61DD] hover:bg-[#3252BF] text-white text-[11px] font-bold transition-all shadow-xs"
                >
                  Complete Financial Foundation →
                </button>
              </div>

              {/* Metrics Box */}
              <div className="p-3.5 rounded-[16px] bg-[#F3F2FD] border border-[#3C61DD]/20 grid grid-cols-3 gap-2 text-center text-[11px]">
                <div>
                  <span className="text-[18px] font-heading font-bold text-[#00A854] block">5</span>
                  <span className="text-[9px] text-[#444654]">Verified</span>
                </div>
                <div>
                  <span className="text-[18px] font-heading font-bold text-[#3C61DD] block">2</span>
                  <span className="text-[9px] text-[#444654]">In Progress</span>
                </div>
                <div>
                  <span className="text-[18px] font-heading font-bold text-amber-700 block">1</span>
                  <span className="text-[9px] text-[#444654]">Attention</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
