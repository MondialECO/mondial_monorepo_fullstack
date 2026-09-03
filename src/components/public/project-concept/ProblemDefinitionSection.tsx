'use client';

import { Sparkles, HelpCircle } from 'lucide-react';

export default function ProblemDefinitionSection() {
  const problemPrompts = [
    {
      num: '01',
      q: 'What is happening today?',
      a: 'Many commercial spaces remain unused during parts of the day.',
    },
    {
      num: '02',
      q: 'Who experiences the problem?',
      a: 'Independent professionals looking for flexible places to work.',
    },
    {
      num: '03',
      q: 'Why are current options difficult?',
      a: 'Coworking subscriptions can be expensive and traditional offices require longer commitments.',
    },
  ];

  const alternatives = ['Coworking memberships', 'Cafés', 'Home working', 'Traditional office rental'];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-t border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1224px] flex flex-col gap-10 sm:gap-14">
        {/* Section Header */}
        <div className="flex flex-col gap-3.5 max-w-[900px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            PROBLEM
          </span>
          <h2 className="text-[32px] sm:text-[40px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Be clear about what needs to change.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#5E5E5E] leading-[1.6]">
            A strong project starts with a specific problem experienced by a specific group of people.
          </p>
        </div>

        {/* 2-Column Problem Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: 3 Prompts (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {problemPrompts.map((p) => (
              <div
                key={p.num}
                className="p-5 sm:p-6 rounded-[20px] bg-white border border-[rgba(0,0,0,0.08)] shadow-xs flex flex-col gap-2"
              >
                <div className="flex items-center gap-3">
                  <span className="font-heading font-bold text-[18px] text-[#3C61DD]">{p.num}</span>
                  <h4 className="font-heading font-bold text-[16px] text-[#070707]">{p.q}</h4>
                </div>
                <p className="text-[14px] text-[#5E5E5E] pl-8 leading-relaxed">{p.a}</p>
              </div>
            ))}
          </div>

          {/* Right: Mondial AI Synthesis (5 cols) */}
          <div className="lg:col-span-5 bg-[#F9F9FA] border border-[rgba(0,0,0,0.08)] rounded-[24px] p-6 flex flex-col gap-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(0,0,0,0.06)]">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-[#3C61DD]" />
                <h4 className="font-heading font-bold text-[15px] text-[#070707]">Mondial AI Synthesis</h4>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#F1F5FF] text-[#3C61DD] text-[10px] font-bold uppercase">
                NEEDS EVIDENCE
              </span>
            </div>

            <div className="flex flex-col gap-3 text-[12px]">
              <div className="p-3 rounded-[12px] bg-white border border-[rgba(0,0,0,0.04)] flex flex-col gap-1">
                <span className="text-[10px] font-bold text-[#8A8B8F] uppercase">SYNTHESIZED PROBLEM</span>
                <p className="font-semibold text-[#070707] leading-relaxed">
                  Professionals need flexible workspace access, while many available commercial spaces remain underused.
                </p>
              </div>

              <div className="p-3 rounded-[12px] bg-white border border-[rgba(0,0,0,0.04)] flex flex-col gap-1">
                <span className="text-[10px] font-bold text-[#8A8B8F] uppercase">AFFECTED USER</span>
                <p className="font-semibold text-[#070707]">Independent professionals</p>
              </div>

              <div className="p-3 rounded-[12px] bg-white border border-[rgba(0,0,0,0.04)] flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-[#8A8B8F] uppercase">CURRENT ALTERNATIVES</span>
                <div className="flex flex-wrap gap-1.5">
                  {alternatives.map((alt) => (
                    <span
                      key={alt}
                      className="px-2.5 py-0.5 rounded-[6px] bg-[#F9F9FA] text-[#5E5E5E] text-[11px] border border-[rgba(0,0,0,0.04)]"
                    >
                      {alt}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-[12px] bg-[#F1F5FF] border border-[#3C61DD]/20 flex items-start gap-2 text-[#3C61DD]">
                <HelpCircle size={15} className="shrink-0 mt-0.5" />
                <div className="flex flex-col gap-0.5 text-[11px]">
                  <span className="font-bold uppercase">OPEN QUESTION</span>
                  <span className="text-[#070707]">How frequently does this problem occur?</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
