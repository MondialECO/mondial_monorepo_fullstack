'use client';

import { CheckCircle2, Cpu, HelpCircle } from 'lucide-react';

export default function SolutionDefinitionSection() {
  const pillars = [
    { title: 'DISCOVER', desc: 'Find nearby available spaces.' },
    { title: 'VERIFY', desc: 'View structured workspace information.' },
    { title: 'BOOK', desc: 'Access flexible time-based availability.' },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#F9F9FA] border-t border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1224px] flex flex-col gap-10 sm:gap-14">
        {/* Section Header */}
        <div className="flex flex-col gap-3.5 max-w-[900px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            SOLUTION
          </span>
          <h2 className="text-[32px] sm:text-[40px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Explain what the project actually changes.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#5E5E5E] leading-[1.6]">
            The solution should respond directly to the problem without becoming a long feature list.
          </p>
        </div>

        {/* 2-Column Solution Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Solution & Value Pillars (7 cols) */}
          <div className="lg:col-span-7 bg-white border border-[rgba(0,0,0,0.08)] rounded-[24px] p-6 sm:p-8 flex flex-col gap-6 shadow-xs">
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-bold text-[#8A8B8F] uppercase tracking-wider">
                CORE SOLUTION STATEMENT
              </span>
              <div className="p-4 rounded-[14px] bg-[#F1F5FF] border border-[#3C61DD]/20 text-[14px] sm:text-[15px] text-[#3C61DD] font-semibold leading-relaxed">
                “A platform where professionals discover and book verified local workspaces by the hour.”
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <span className="text-[11px] font-bold text-[#8A8B8F] uppercase tracking-wider">
                CORE VALUE PILLARS
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {pillars.map((p) => (
                  <div key={p.title} className="p-4 rounded-[12px] bg-[#F9F9FA] border border-[rgba(0,0,0,0.04)] flex flex-col gap-1">
                    <span className="text-[11px] font-bold text-[#3C61DD] uppercase">{p.title}</span>
                    <p className="text-[12px] text-[#070707] leading-snug">{p.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Logic Engine (5 cols) */}
          <div className="lg:col-span-5 bg-white border border-[rgba(0,0,0,0.08)] rounded-[24px] p-6 sm:p-7 flex flex-col justify-between gap-5 shadow-xs">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(0,0,0,0.06)]">
                <div className="flex items-center gap-2">
                  <Cpu size={16} className="text-[#3C61DD]" />
                  <h4 className="font-heading font-bold text-[15px] text-[#070707]">Mondial Logic Engine</h4>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#E8F8EE] text-[#00A854] text-[10px] font-bold uppercase">
                  LOGIC MATCH
                </span>
              </div>

              <div className="p-3 rounded-[12px] bg-[#F9F9FA] text-[12px] text-[#5E5E5E] leading-relaxed">
                <span className="text-[10px] font-bold text-[#8A8B8F] uppercase block mb-1">
                  RECAP PROBLEM CONTEXT
                </span>
                “Professionals need flexible workspaces without long commitments. Unused spaces remain available during parts of the day.”
              </div>

              {/* Match Flow */}
              <div className="flex flex-col items-center gap-2 pt-1">
                <div className="grid grid-cols-2 gap-2 w-full text-[11px] text-center font-medium">
                  <div className="p-2 rounded-[8px] bg-[#F9F9FA] text-[#070707]">Available Space</div>
                  <div className="p-2 rounded-[8px] bg-[#F9F9FA] text-[#070707]">Professional Demand</div>
                </div>
                <span className="text-[#3C61DD] text-[14px]">↓</span>
                <div className="w-full py-2.5 rounded-[10px] bg-[#3C61DD] text-white text-center font-bold text-[12px] tracking-wider uppercase shadow-xs">
                  VERIFIED MARKETPLACE
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Alignment Check Bar */}
        <div className="w-full p-4 sm:p-5 rounded-[18px] bg-white border border-[rgba(0,0,0,0.08)] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 text-[13px]">
            <span className="font-bold text-[#8A8B8F] uppercase text-[11px]">ALIGNMENT CHECK</span>
            <span className="text-[#8A8B8F]">|</span>
            <span className="text-[#5E5E5E]">PROBLEM: <strong className="text-[#070707]">“Flexible access is difficult.”</strong></span>
            <span className="text-[#8A8B8F]">|</span>
            <span className="text-[#5E5E5E]">SOLUTION: <strong className="text-[#070707]">“Hourly workspace marketplace.”</strong></span>
          </div>
          <span className="px-3 py-1 rounded-full bg-[#00A854] text-white text-[11px] font-bold inline-flex items-center gap-1">
            <CheckCircle2 size={13} />
            <span>STRONG</span>
          </span>
        </div>
      </div>
    </section>
  );
}
