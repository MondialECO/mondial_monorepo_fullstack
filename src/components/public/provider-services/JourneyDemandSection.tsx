'use client';

import { Sparkles, Users, Building, Briefcase, ArrowDown, ArrowRight } from 'lucide-react';

export default function JourneyDemandSection() {
  const streams = [
    {
      num: 'STREAM 01',
      role: 'CREATORS',
      needs: 'Brand Identity, Development, Finance, Legal Support, Marketing',
      flow: 'Project Intelligence ➔ Skill Gap Identified ➔ Provider Need',
      icon: Users,
    },
    {
      num: 'STREAM 02',
      role: 'ENTREPRENEURS',
      needs: 'Company Formation, Legal Review, Finance, Backend Development, HR & Data Room',
      flow: 'Company Execution ➔ Resource Gap ➔ Provider Need',
      icon: Building,
    },
    {
      num: 'STREAM 03',
      role: 'INVESTORS',
      needs: 'Due Diligence, Independent Legal Review, Term Sheet Review',
      flow: 'Deal Review ➔ Specialist Review Req. ➔ Deal Provider Need',
      icon: Briefcase,
    },
  ];

  const archetypes = [
    {
      num: '01',
      title: 'BUILDER PROVIDER',
      desc: 'Designer, Developer, Marketer.',
    },
    {
      num: '02',
      title: 'STRUCTURAL PROVIDER',
      desc: 'Legal, Finance, CFO, Company Formation.',
    },
    {
      num: '03',
      title: 'DEAL PROVIDER',
      desc: 'Due Diligence, Investor-Side Legal Review.',
    },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#747685] uppercase tracking-wider">
            DEMAND ALREADY EXISTS INSIDE THE JOURNEY
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            The client need can appear
            <br />
            before the search begins.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Mondial can identify professional needs while Creators, Entrepreneurs and Investors are progressing through their own company-building journeys.
          </p>
        </div>

        {/* 3 Demand Streams Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {streams.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.role}
                className="p-6 rounded-[24px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-5"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#747685] uppercase">{s.num}</span>
                    <Icon size={18} className="text-[#3C61DD]" />
                  </div>
                  <h3 className="font-heading font-bold text-[18px] text-[#1A1B23]">{s.role}</h3>
                  <div className="p-3 rounded-[12px] bg-white border border-[#E2E1EC] text-[12px]">
                    <span className="text-[9px] font-bold text-[#747685] uppercase block">
                      POTENTIAL NEEDS:
                    </span>
                    <p className="font-medium text-[#1A1B23] mt-0.5">{s.needs}</p>
                  </div>
                </div>

                <div className="p-2.5 rounded-[10px] bg-[#F3F2FD] text-[#1A47C3] text-[11px] font-bold">
                  {s.flow}
                </div>
              </div>
            );
          })}
        </div>

        {/* Convergence on Mondial Matching Layer */}
        <div className="p-6 sm:p-8 rounded-[24px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-xs flex flex-col items-center gap-4 text-center">
          <div className="px-6 py-2.5 rounded-full bg-white border border-[#3C61DD]/30 text-[#1A47C3] font-heading font-bold text-[14px] shadow-2xs">
            MONDIAL MATCHING LAYER
          </div>
          <ArrowDown size={18} className="text-[#3C61DD]" />
          <div className="px-6 py-3 rounded-[12px] bg-[#1A47C3] text-white font-heading font-extrabold text-[15px] shadow-sm">
            RELEVANT SERVICE PROVIDER
          </div>
        </div>

        {/* Provider Archetypes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {archetypes.map((arch) => (
            <div
              key={arch.title}
              className="p-5 rounded-[20px] bg-white border border-[#E2E1EC] shadow-2xs flex flex-col gap-2"
            >
              <span className="text-[10px] font-bold text-[#3C61DD] uppercase">
                ARCHETYPE {arch.num}
              </span>
              <h4 className="font-heading font-bold text-[15px] text-[#1A1B23]">{arch.title}</h4>
              <p className="text-[12px] text-[#444654]">{arch.desc}</p>
            </div>
          ))}
        </div>

        {/* Section Statement */}
        <div className="p-6 sm:p-7 rounded-[20px] bg-[#FAF8FF] border border-[#E2E1EC] text-center shadow-xs flex flex-col gap-1">
          <h3 className="font-heading font-extrabold text-[15px] sm:text-[18px] text-[#070707] uppercase tracking-wide">
            MONDIAL DOES NOT CREATE RANDOM LEADS.
          </h3>
          <p className="text-[13px] text-[#444654] font-medium">
            THE OPPORTUNITY SHOULD BEGIN WITH A REAL JOURNEY NEED.
          </p>
        </div>
      </div>
    </section>
  );
}
