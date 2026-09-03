'use client';

import { CheckCircle2, AlertCircle, Clock, ShieldCheck, ChevronRight } from 'lucide-react';

export default function CompanyReadinessSection() {
  const priorityItems = [
    { num: '01', title: 'Latest Financial Context', tag: 'MEDIUM PRIORITY', color: 'blue' },
    { num: '02', title: 'Insurance Requirement', tag: 'NEEDS REVIEW', color: 'amber' },
    { num: '03', title: 'Finance Contact', tag: 'OPTIONAL', color: 'gray' },
  ];

  const readinessBars = [
    { label: 'COMPANY IDENTITY', pct: 100, color: 'bg-[#00A854]' },
    { label: 'REGISTRATION', pct: 100, color: 'bg-[#00A854]' },
    { label: 'REPRESENTATIVES', pct: 100, color: 'bg-[#00A854]' },
    { label: 'BANK INFORMATION', pct: 100, color: 'bg-[#00A854]' },
    { label: 'FINANCIAL FOUNDATION', pct: 78, color: 'bg-[#3C61DD]' },
    { label: 'COMPLIANCE', pct: 82, color: 'bg-[#3C61DD]' },
    { label: 'PERMISSIONS', pct: 90, color: 'bg-[#3C61DD]' },
  ];

  const progressionSteps = [
    'COMPANY FOUNDATION',
    'EXECUTION',
    'EQUITY',
    'INVESTOR READINESS',
    'FUNDING',
  ];

  const supports = [
    { name: 'BUILD & EXECUTE', status: 'Ready', color: 'green' },
    { name: 'EQUITY & READINESS', status: 'Available', color: 'green' },
    { name: 'DATA ROOM', status: 'Early Prep', color: 'blue' },
    { name: 'FUNDING', status: 'Future', color: 'gray' },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1224px] flex flex-col gap-10 sm:gap-14">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[800px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            ONE VIEW OF THE FOUNDATION
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Know exactly what is ready next.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Mondial brings company identity, verification, finance, compliance and permissions into one readiness view so Entrepreneurs can understand what is complete and what still needs attention before moving forward.
          </p>
        </div>

        {/* 2-Column Readiness Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Side (40% / 5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-6">
            <div className="flex flex-col gap-5">
              {/* Summary Panel */}
              <div className="p-6 rounded-[24px] bg-[#FAF8FF] border border-[#E2E1EC] flex flex-col gap-4 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-[rgba(0,0,0,0.06)] text-[12px]">
                  <div>
                    <span className="text-[10px] font-bold text-[#8A8B8F] uppercase block">
                      COMPANY
                    </span>
                    <span className="font-heading font-bold text-[16px] text-[#1A1B23]">
                      Nova Space SAS
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-[#8A8B8F] uppercase block">
                      AREA
                    </span>
                    <span className="font-semibold text-[#1A1B23]">Company &amp; Verification</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#444654] uppercase">
                    OVERALL READINESS
                  </span>
                  <span className="text-[28px] font-heading font-bold text-[#070707]">86%</span>
                </div>

                <div className="w-full h-2 bg-[#E2E1EC] rounded-full overflow-hidden">
                  <div className="h-full bg-[#3C61DD] rounded-full" style={{ width: '86%' }} />
                </div>

                <span className="px-3 py-1 rounded-[6px] bg-[#E2E1EC] text-[#444654] text-[10px] font-bold uppercase w-fit">
                  ILLUSTRATIVE EXAMPLE
                </span>
              </div>

              {/* Priority Items */}
              <div className="flex flex-col gap-2.5">
                <span className="text-[11px] font-bold text-[#444654] uppercase tracking-wider">
                  PRIORITY ITEMS
                </span>
                {priorityItems.map((item) => (
                  <div
                    key={item.num}
                    className="p-3.5 rounded-[12px] bg-[#FAF8FF] border border-[rgba(0,0,0,0.04)] flex items-center justify-between text-[12px]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-[#8A8B8F]">{item.num}</span>
                      <span className="font-semibold text-[#1A1B23]">{item.title}</span>
                    </div>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-[4px] uppercase ${
                        item.color === 'blue'
                          ? 'bg-[#F1F5FF] text-[#3C61DD]'
                          : item.color === 'amber'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-gray-100 text-[#747685]'
                      }`}
                    >
                      {item.tag}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Progression Breadcrumb */}
            <div className="p-4 rounded-[16px] bg-[#FAF8FF] border border-[rgba(0,0,0,0.06)] flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
              {progressionSteps.map((step, idx) => (
                <div key={step} className="flex items-center gap-1.5">
                  <span className={idx === 0 ? 'text-[#3C61DD]' : 'text-[#8A8B8F]'}>{step}</span>
                  {idx < progressionSteps.length - 1 && (
                    <ChevronRight size={12} className="text-[#C4C5D6]" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right Side Dashboard UI (60% / 7 cols) */}
          <div className="lg:col-span-7 bg-[#FAF8FF] border border-[#E2E1EC] rounded-[24px] p-6 sm:p-8 flex flex-col justify-between gap-6 shadow-md">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[rgba(0,0,0,0.06)] gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[10px] bg-[#F1F5FF] flex items-center justify-center font-bold text-[#3C61DD]">
                  N
                </div>
                <div>
                  <h3 className="font-heading font-bold text-[18px] text-[#070707]">
                    NOVA SPACE SAS
                  </h3>
                  <span className="text-[12px] text-[#444654]">Company &amp; Verification Area</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded bg-[#E8E7F2] text-[#444654] text-[10px] font-bold uppercase">
                  FOUNDATION IN PROGRESS
                </span>
                <div className="text-right">
                  <span className="text-[22px] font-heading font-bold text-[#070707]">86%</span>
                  <span className="text-[10px] text-[#8A8B8F] uppercase block font-bold">READINESS</span>
                </div>
              </div>
            </div>

            {/* Readiness Bars Grid */}
            <div className="flex flex-col gap-3 text-[12px]">
              {readinessBars.map((bar) => (
                <div key={bar.label} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-[#444654]">{bar.label}</span>
                    <span className="text-[#070707]">{bar.pct}%</span>
                  </div>
                  <div className="w-full h-2 bg-[#E2E1EC] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${bar.color}`}
                      style={{ width: `${bar.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Foundation Supports Box */}
            <div className="pt-4 border-t border-[rgba(0,0,0,0.06)] flex flex-col gap-2.5 text-[12px]">
              <span className="text-[10px] font-bold text-[#8A8B8F] uppercase tracking-wider">
                FOUNDATION SUPPORTS
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                {supports.map((sup) => (
                  <div
                    key={sup.name}
                    className="p-2.5 rounded-[10px] bg-white border border-[rgba(0,0,0,0.04)] flex flex-col gap-0.5 shadow-2xs"
                  >
                    <span className="font-bold text-[10px] text-[#444654]">{sup.name}</span>
                    <span
                      className={`text-[10px] font-bold ${
                        sup.color === 'green'
                          ? 'text-[#00A854]'
                          : sup.color === 'blue'
                          ? 'text-[#3C61DD]'
                          : 'text-[#8A8B8F]'
                      }`}
                    >
                      {sup.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
