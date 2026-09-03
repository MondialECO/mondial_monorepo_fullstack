'use client';

import { CheckCircle2, ArrowRight, Compass, Users, Play, BarChart3, AlertCircle } from 'lucide-react';

export default function CompanyFoundationCompletion() {
  const summaryRows = [
    { label: 'Company Identity', value: 'Complete' },
    { label: 'Official Registration', value: 'Verified' },
    { label: 'Representatives', value: 'Verified' },
    { label: 'Bank Identity', value: 'Verified' },
    { label: 'Financial Foundation', value: 'Ready' },
    { label: 'Compliance Context', value: 'Ready' },
    { label: 'Permissions', value: 'Configured' },
  ];

  const modules = [
    { name: 'Discover', desc: 'Access the Global Marketplace', icon: Compass },
    { name: 'Assemble', desc: 'Manage Team & Resources', icon: Users },
    { name: 'Execute', desc: 'Drive Active Projects', icon: Play },
    { name: 'Measure', desc: 'Track KPIs & Signals', icon: BarChart3 },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#FAF8FF] border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1224px] flex flex-col gap-10 sm:gap-14">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[800px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            COMPANY FOUNDATION COMPLETE
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            The foundation is ready.
            <br />
            Now put the company to work.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Your structural footprint is verified and secured. Transition from administrative setup to operational execution within the Mondial ecosystem.
          </p>
        </div>

        {/* 2-Side Composition: Foundation Summary (Left) + Page 02 Preview (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left: Foundation Summary (5 cols) */}
          <div className="lg:col-span-5 bg-white border border-[#E2E1EC] rounded-[24px] p-6 sm:p-8 flex flex-col justify-between gap-6 shadow-sm text-[13px]">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(0,0,0,0.06)]">
                <div>
                  <h3 className="font-heading font-bold text-[18px] text-[#1A1B23]">
                    NOVA SPACE SAS
                  </h3>
                  <span className="text-[12px] text-[#444654]">Henry Martin, Entrepreneur</span>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#E8F8EE] text-[#00A854] text-[10px] font-bold uppercase inline-flex items-center gap-1">
                  <CheckCircle2 size={12} />
                  <span>FOUNDATION READY</span>
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {summaryRows.map((r) => (
                  <div
                    key={r.label}
                    className="p-2.5 rounded-[8px] bg-[#FAF8FF] flex items-center justify-between"
                  >
                    <span className="text-[#444654]">{r.label}</span>
                    <span className="font-semibold text-[#00A854] flex items-center gap-1">
                      <CheckCircle2 size={12} />
                      {r.value}
                    </span>
                  </div>
                ))}

                <div className="p-3 rounded-[10px] bg-[#F1F5FF] flex items-center justify-between font-bold text-[#3C61DD] text-[12px]">
                  <span>OVERALL READINESS</span>
                  <span>86%</span>
                </div>
              </div>
            </div>

            {/* Mandatory Disclaimer */}
            <div className="p-3 rounded-[10px] bg-gray-50 border border-gray-200 text-[11px] text-[#444654] leading-relaxed">
              <p>
                <strong>Disclaimer:</strong> Readiness indicates structural preparedness within the Mondial ecosystem, not a legal or governmental certification of status.
              </p>
            </div>
          </div>

          {/* Right: Preview: Page 02 Build & Execute (7 cols) */}
          <div className="lg:col-span-7 bg-white border-2 border-[#3C61DD]/30 rounded-[24px] p-6 sm:p-8 flex flex-col justify-between gap-6 shadow-md">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(0,0,0,0.06)]">
                <span className="text-[11px] font-bold text-[#3C61DD] uppercase tracking-wider">
                  PREVIEW: PAGE 02 (BUILD &amp; EXECUTE)
                </span>
                <span className="px-2.5 py-0.5 rounded bg-[#F1F5FF] text-[#3C61DD] text-[10px] font-bold uppercase">
                  NEXT PHASE
                </span>
              </div>

              <h3 className="font-heading font-bold text-[22px] text-[#070707]">
                Turn structure into execution.
              </h3>
              <p className="text-[14px] text-[#444654] leading-relaxed">
                The Build &amp; Execute workspace is your operational command center.
              </p>

              {/* 4 Modules Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px]">
                {modules.map((m) => {
                  const Icon = m.icon;
                  return (
                    <div
                      key={m.name}
                      className="p-3.5 rounded-[12px] bg-[#FAF8FF] border border-[#E2E1EC] flex flex-col gap-1"
                    >
                      <div className="flex items-center gap-2 text-[#3C61DD] font-bold">
                        <Icon size={16} />
                        <span>{m.name}</span>
                      </div>
                      <span className="text-[11px] text-[#444654]">{m.desc}</span>
                    </div>
                  );
                })}
              </div>

              {/* Active Priorities Pipeline Box */}
              <div className="p-4 rounded-[16px] bg-[#FAF8FF] border border-[#E2E1EC] flex flex-col gap-2.5 text-[12px]">
                <span className="text-[10px] font-bold text-[#8A8B8F] uppercase tracking-wider">
                  ACTIVE PRIORITIES PIPELINE
                </span>
                <div className="flex items-center justify-between p-2 rounded bg-white">
                  <span className="font-medium text-[#1A1B23]">Marketplace Development</span>
                  <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200">
                    Resource Needed
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-white">
                  <span className="font-medium text-[#1A1B23]">Launch Operations</span>
                  <span className="px-2 py-0.5 rounded bg-gray-100 text-[#444654] text-[10px] font-bold">
                    In Planning
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 text-[11px]">
                  <span className="text-[#444654]">Active Milestone: MVP Marketplace</span>
                  <span className="font-bold text-[#3C61DD]">42%</span>
                </div>
              </div>
            </div>

            {/* Journey Progression Tracker */}
            <div className="pt-4 border-t border-[rgba(0,0,0,0.06)] flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold">
              <div className="flex items-center gap-1.5 text-[#00A854]">
                <CheckCircle2 size={13} />
                <span>01 COMPANY (COMPLETE)</span>
              </div>
              <span className="text-[#8A8B8F]">➔</span>
              <div className="flex items-center gap-1.5 text-[#3C61DD]">
                <span>02 BUILD (NEXT)</span>
              </div>
              <span className="text-[#8A8B8F]">➔</span>
              <div className="text-[#8A8B8F]">03 SCALE</div>
              <span className="text-[#8A8B8F]">➔</span>
              <div className="text-[#8A8B8F]">04 OPTIMIZE</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
