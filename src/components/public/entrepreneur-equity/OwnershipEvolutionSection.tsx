'use client';

import { CheckCircle2, TrendingUp, Sparkles, ArrowRight } from 'lucide-react';

export default function OwnershipEvolutionSection() {
  const stages = [
    {
      num: 'Stage 01',
      title: 'Founding',
      slices: [{ label: 'Founder', pct: '100%', bg: 'bg-[#1A47C3] text-white', h: 'h-48' }],
    },
    {
      num: 'Stage 02',
      title: 'Team Building',
      slices: [
        { label: 'Founder', pct: '90%', bg: 'bg-[#1A47C3] text-white', h: 'h-40' },
        { label: 'Pool', pct: '10%', bg: 'bg-[#E2E1EC] text-[#1A1B23]', h: 'h-10' },
      ],
    },
    {
      num: 'Stage 03',
      title: 'Early Contributor',
      slices: [
        { label: 'Founder', pct: '80%', bg: 'bg-[#1A47C3] text-white', h: 'h-32' },
        { label: 'Pool', pct: '10%', bg: 'bg-[#E2E1EC] text-[#1A1B23]', h: 'h-10' },
        { label: 'Contributor', pct: '10%', bg: 'bg-[#875301] text-white', h: 'h-10' },
      ],
    },
    {
      num: 'Stage 04',
      title: 'Funding Round',
      slices: [
        { label: 'Founder', pct: '64%', bg: 'bg-[#1A47C3] text-white', h: 'h-28' },
        { label: 'Pool', pct: '8%', bg: 'bg-[#E2E1EC] text-[#1A1B23]', h: 'h-8' },
        { label: 'Contrib.', pct: '8%', bg: 'bg-[#875301] text-white', h: 'h-8' },
        { label: 'Investor', pct: '20%', bg: 'bg-[#005F40] text-white', h: 'h-12' },
      ],
    },
  ];

  const checklist = [
    'Current ownership',
    'New shares or rights',
    'Pre-money assumptions',
    'Post-money ownership',
    'Option pool impact',
    'Existing convertible rights',
    'Possible dilution',
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#FAF8FF] border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#747685] uppercase tracking-wider">
            OWNERSHIP EVOLVES
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Every equity decision changes
            <br />
            the future picture.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Founder allocations, employee options, new investment and convertible rights can all change ownership over time.
          </p>
        </div>

        {/* Main Visual: 4-Stage Evolution */}
        <div className="bg-white border border-[#E2E1EC] rounded-[24px] p-6 sm:p-8 flex flex-col gap-8 shadow-sm">
          {/* Top Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[rgba(0,0,0,0.06)] gap-3">
            <span className="text-[11px] font-bold text-[#747685] uppercase tracking-wider">
              ILLUSTRATIVE SCENARIO
            </span>
            <div className="flex items-center gap-2 text-[#005F40] text-[12px] font-bold">
              <Sparkles size={15} />
              <span>THE COMPANY CAN GROW WHILE AN INDIVIDUAL OWNERSHIP PERCENTAGE FALLS.</span>
            </div>
          </div>

          {/* 4 Stages Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
            {stages.map((st) => (
              <div
                key={st.num}
                className="bg-[#FAF8FF] border border-[#E2E1EC] rounded-[20px] p-5 flex flex-col gap-4 shadow-2xs"
              >
                <div>
                  <span className="text-[11px] font-bold text-[#3C61DD] uppercase block">
                    {st.num}
                  </span>
                  <h4 className="font-heading font-bold text-[17px] text-[#1A1B23]">{st.title}</h4>
                </div>

                {/* Slices Column */}
                <div className="flex flex-col gap-1.5 w-full">
                  {st.slices.map((sl, i) => (
                    <div
                      key={sl.label}
                      className={`w-full p-3 rounded-[10px] flex items-center justify-between text-[12px] font-bold ${sl.bg}`}
                    >
                      <span>{sl.label}</span>
                      <span>{sl.pct}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pre-Decision Checklist */}
        <div className="bg-white border border-[#E2E1EC] rounded-[24px] p-6 sm:p-8 flex flex-col gap-6 shadow-xs">
          <span className="text-[11px] font-bold text-[#747685] uppercase tracking-wider">
            BEFORE MAKING A DECISION, THE ENTREPRENEUR SHOULD UNDERSTAND:
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-[13px]">
            {checklist.map((item) => (
              <div
                key={item}
                className="p-3.5 rounded-[12px] bg-[#FAF8FF] border border-[#E2E1EC] flex items-center gap-2.5 font-medium text-[#1A1B23]"
              >
                <CheckCircle2 size={16} className="text-[#3C61DD] shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
