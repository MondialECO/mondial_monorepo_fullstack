'use client';

import { ArrowRight, CheckCircle2, XCircle, RotateCw, BarChart2, Users, Building, Terminal } from 'lucide-react';

export default function ActivityEvidenceSection() {
  const activities = [
    { num: '18', label: 'CUSTOMER INTERVIEWS', icon: Users },
    { num: '8', label: 'VERIFIED WORKSPACES', icon: Building },
    { num: 'BUILT', label: 'MARKETPLACE PROTOTYPE', icon: Terminal },
    { num: '42', label: 'EARLY USERS', icon: BarChart2 },
  ];

  const meanings = [
    'Customer understanding is improving.',
    'Initial supply is forming.',
    'Product execution is progressing.',
    'Early interest exists.',
  ];

  const doesNotProve = [
    'Product-market fit',
    'Retention',
    'Revenue validation',
    'Scalability',
    'Investment readiness',
  ];

  const loopSteps = [
    { num: '01', type: 'ACTION', title: 'Workspace outreach' },
    { num: '02', type: 'SIGNAL', title: '8 verified spaces' },
    { num: '03', type: 'EVIDENCE', title: 'Initial supply evidence' },
    { num: '04', type: 'DECISION', title: 'Continue / adjust acquisition strategy' },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#747685] uppercase tracking-wider">
            FROM ACTIVITY TO EVIDENCE
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Progress is useful when you know what it means.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Execution creates signals. Mondial helps Entrepreneurs understand which signals indicate progress and which assumptions still need stronger evidence.
          </p>
        </div>

        {/* 3-Column Editorial Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {/* Column 1: What the company did */}
          <div className="bg-[#FAF8FF] border border-[#E2E1EC] rounded-[24px] p-6 sm:p-7 flex flex-col justify-between gap-6 shadow-xs">
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="font-heading font-bold text-[18px] text-[#1A1B23]">
                  WHAT THE COMPANY DID
                </h3>
                <span className="text-[10px] font-bold text-[#747685] uppercase tracking-wider">
                  ILLUSTRATIVE EXAMPLES
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                {activities.map((act) => {
                  const Icon = act.icon;
                  return (
                    <div
                      key={act.label}
                      className="p-3.5 rounded-[14px] bg-white border border-[#E2E1EC] flex items-center gap-3.5 shadow-2xs"
                    >
                      <div className="w-10 h-10 rounded-[10px] bg-[#F1F5FF] flex items-center justify-center text-[#3C61DD] shrink-0">
                        <Icon size={18} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[20px] font-heading font-extrabold text-[#1A1B23] leading-none">
                          {act.num}
                        </span>
                        <span className="text-[10px] font-bold text-[#747685] uppercase tracking-tight mt-1">
                          {act.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <span className="text-[10px] text-[#8A8B8F] italic">
              Illustrative demo activity metrics.
            </span>
          </div>

          {/* Column 2: What the signal may mean */}
          <div className="bg-white border border-[#E2E1EC] rounded-[24px] p-6 sm:p-7 flex flex-col justify-between gap-6 shadow-xs">
            <div className="flex flex-col gap-4">
              <h3 className="font-heading font-bold text-[18px] text-[#1A1B23]">
                WHAT THE SIGNAL MAY MEAN
              </h3>

              <div className="flex flex-col gap-3 text-[13px]">
                {meanings.map((m) => (
                  <div
                    key={m}
                    className="p-3 rounded-[12px] bg-[#FAF8FF] border border-[#E2E1EC] flex items-start gap-2.5"
                  >
                    <CheckCircle2 size={16} className="text-[#3C61DD] shrink-0 mt-0.5" />
                    <span className="text-[#1A1B23] font-medium">{m}</span>
                  </div>
                ))}
              </div>
            </div>

            <span className="text-[11px] text-[#3C61DD] font-semibold">
              Signal interpretation &amp; directional indicator
            </span>
          </div>

          {/* Column 3: What it does not prove yet */}
          <div className="bg-[#FAF8FF] border border-[#E2E1EC] rounded-[24px] p-6 sm:p-7 flex flex-col justify-between gap-6 shadow-xs">
            <div className="flex flex-col gap-4">
              <h3 className="font-heading font-bold text-[18px] text-[#1A1B23]">
                WHAT IT DOES NOT PROVE YET
              </h3>

              <div className="flex flex-col gap-2.5 text-[13px]">
                {doesNotProve.map((dnp) => (
                  <div
                    key={dnp}
                    className="p-3 rounded-[12px] bg-white border border-[#E2E1EC] flex items-center justify-between shadow-2xs"
                  >
                    <span className="text-[#444654] font-medium">{dnp}</span>
                    <span className="text-[10px] text-[#747685] font-bold uppercase">
                      UNPROVEN
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <span className="text-[11px] text-[#8A8B8F] italic">
              Critical boundary between activity signals and validation claims.
            </span>
          </div>
        </div>

        {/* The Evidence Loop */}
        <div className="bg-[#FAF8FF] border border-[#E2E1EC] rounded-[24px] p-6 sm:p-8 flex flex-col gap-6 shadow-xs">
          <div>
            <span className="text-[11px] font-bold text-[#3C61DD] uppercase tracking-wider">
              THE EVIDENCE LOOP
            </span>
            <h4 className="font-heading font-bold text-[18px] text-[#070707]">
              Translating raw activity into strategic conviction.
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {loopSteps.map((s, idx) => (
              <div
                key={s.num}
                className="p-4 rounded-[16px] bg-white border border-[#E2E1EC] flex flex-col gap-2 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-bold text-[#3C61DD]">{s.num}</span>
                  <span className="px-2 py-0.5 rounded bg-[#F1F5FF] text-[#3C61DD] text-[9px] font-bold uppercase">
                    {s.type}
                  </span>
                </div>
                <span className="font-heading font-bold text-[13px] text-[#1A1B23]">{s.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Closing Banner */}
        <div className="w-full p-6 sm:p-8 rounded-[20px] bg-white border border-[#E2E1EC] text-center shadow-xs">
          <span className="font-heading font-extrabold text-[14px] sm:text-[16px] text-[#070707] uppercase tracking-wide">
            NUMBERS ARE NOT THE STORY. THEIR CONTEXT IS.
          </span>
        </div>
      </div>
    </section>
  );
}
