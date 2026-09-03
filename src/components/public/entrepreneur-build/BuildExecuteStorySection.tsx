'use client';

import { Compass, Users, Link as LinkIcon, Play, BarChart3, Plus } from 'lucide-react';

export default function BuildExecuteStorySection() {
  const narrativeSteps = [
    {
      num: '01',
      title: 'DISCOVER',
      desc: 'Understand existing and new project opportunities',
      icon: Compass,
    },
    {
      num: '02',
      title: 'ASSEMBLE',
      desc: 'Identify the people and capabilities required',
      icon: Users,
    },
    {
      num: '03',
      title: 'CONNECT',
      desc: 'Bring internal teams and external expertise into context',
      icon: LinkIcon,
    },
    {
      num: '04',
      title: 'EXECUTE',
      desc: 'Turn priorities into responsibilities and milestones',
      icon: Play,
    },
    {
      num: '05',
      title: 'MEASURE',
      desc: 'Turn activity into operating evidence',
      icon: BarChart3,
    },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#FAF8FF] border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            BUILD &amp; EXECUTE
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            From business need to measurable progress.
          </h2>
        </div>

        {/* 5-Step Story Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-stretch">
          {narrativeSteps.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.num}
                className="bg-white border border-[#E2E1EC] rounded-[20px] p-6 flex flex-col justify-between gap-4 shadow-xs"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[12px] font-bold text-[#3C61DD]">
                      {s.num}
                    </span>
                    <div className="w-8 h-8 rounded-[8px] bg-[#F3F2FD] flex items-center justify-center text-[#3C61DD]">
                      <Icon size={16} />
                    </div>
                  </div>
                  <h3 className="font-heading font-bold text-[16px] text-[#1A1B23]">{s.title}</h3>
                </div>
                <p className="text-[12px] text-[#444654] leading-relaxed">{s.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Execution Equation Box */}
        <div className="bg-white border-2 border-[#3C61DD]/30 rounded-[24px] p-6 sm:p-10 flex flex-col items-center gap-6 text-center shadow-md">
          <span className="text-[11px] font-bold text-[#3C61DD] uppercase tracking-wider">
            EXECUTION EQUATION
          </span>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-[12px] sm:text-[13px] font-bold">
            <span className="px-3.5 py-1.5 rounded-[8px] bg-[#FAF8FF] border border-[#E2E1EC] text-[#1A1B23]">
              PROJECTS
            </span>
            <span className="text-[#3C61DD]">+</span>
            <span className="px-3.5 py-1.5 rounded-[8px] bg-[#FAF8FF] border border-[#E2E1EC] text-[#1A1B23]">
              PEOPLE
            </span>
            <span className="text-[#3C61DD]">+</span>
            <span className="px-3.5 py-1.5 rounded-[8px] bg-[#FAF8FF] border border-[#E2E1EC] text-[#1A1B23]">
              RESOURCES
            </span>
            <span className="text-[#3C61DD]">+</span>
            <span className="px-3.5 py-1.5 rounded-[8px] bg-[#FAF8FF] border border-[#E2E1EC] text-[#1A1B23]">
              MILESTONES
            </span>
            <span className="text-[#3C61DD]">+</span>
            <span className="px-3.5 py-1.5 rounded-[8px] bg-[#FAF8FF] border border-[#E2E1EC] text-[#1A1B23]">
              EVIDENCE
            </span>
            <span className="text-[#3C61DD]">➔</span>
            <span className="px-4 py-1.5 rounded-[8px] bg-[#3C61DD] text-white shadow-xs">
              STRUCTURED EXECUTION
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
