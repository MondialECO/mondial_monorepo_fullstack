'use client';

import Link from 'next/link';
import { Sparkles, ArrowRight, AlertCircle } from 'lucide-react';

export default function ProjectConceptHero() {
  const steps = [
    { name: 'RAW IDEA', active: false },
    { name: 'PROJECT NAME', active: true },
    { name: 'CONCEPT', active: true },
    { name: 'PROBLEM', active: false },
    { name: 'SOLUTION', active: false },
    { name: 'TARGET CUSTOMER', active: false },
    { name: 'STRUCTURED PROJECT', active: false },
  ];

  return (
    <section className="w-full pt-28 pb-14 sm:pt-36 sm:pb-20 flex flex-col items-center">
      <div className="w-full max-w-[1224px] flex flex-col gap-10 sm:gap-14">
        {/* Two-Column Hero Top */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left: Heading & Intro (6 cols) */}
          <div className="lg:col-span-6 flex flex-col gap-6 items-start">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F1F5FF] text-[#3C61DD] text-[11px] font-bold tracking-wider uppercase border border-[#3C61DD]/20">
              PROJECT IDENTITY &amp; BRANDING
            </div>

            <h1 className="text-[36px] sm:text-[44px] lg:text-[48px] font-heading font-bold text-[#070707] leading-[1.12] tracking-tight">
              Turn the idea into a project people can understand
            </h1>

            <p className="text-[15px] sm:text-[17px] text-[#5E5E5E] leading-[1.6]">
              Mondial helps you define what the project is, what problem it solves, who it is for and how the solution should be described before deeper business planning begins.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-1">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#3C61DD] hover:bg-[#3252BF] text-white font-medium text-[15px] rounded-[10px] transition-all shadow-sm group"
              >
                <span>Define Your Project</span>
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* Right: Workspace Preview Card Mockup (6 cols) */}
          <div className="lg:col-span-6 bg-[#F9F9FA] border border-[rgba(0,0,0,0.08)] rounded-[24px] p-6 sm:p-7 flex flex-col gap-5 shadow-sm">
            {/* Mockup Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[rgba(0,0,0,0.06)]">
              <div>
                <span className="text-[10px] font-bold text-[#8A8B8F] uppercase tracking-wider block">
                  WORKSPACE PREVIEW
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-6 h-6 rounded-full bg-[#3C61DD] text-white flex items-center justify-center font-bold text-[11px]">
                    N
                  </div>
                  <h3 className="font-heading font-bold text-[16px] text-[#070707]">Nova Space</h3>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#F1F5FF] text-[#3C61DD] text-[11px] font-bold">
                64% Complete
              </span>
            </div>

            {/* Grid Content */}
            <div className="flex flex-col gap-3">
              <div className="p-3 rounded-[12px] bg-white border border-[rgba(0,0,0,0.04)] flex flex-col gap-1">
                <span className="text-[10px] font-bold text-[#8A8B8F] uppercase">ONE-LINE CONCEPT</span>
                <p className="text-[13px] text-[#070707] font-medium">
                  Book verified local workspaces by the hour.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-[12px] bg-white border border-[rgba(0,0,0,0.04)] flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-[#8A8B8F] uppercase">PROBLEM</span>
                  <p className="text-[12px] text-[#070707] leading-relaxed">
                    Unused commercial spaces remain empty while professionals need flexible places to work.
                  </p>
                </div>
                <div className="p-3 rounded-[12px] bg-white border border-[rgba(0,0,0,0.04)] flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-[#8A8B8F] uppercase">SOLUTION</span>
                  <p className="text-[12px] text-[#070707] leading-relaxed">
                    A marketplace for verified workspaces available by the hour.
                  </p>
                </div>
              </div>

              {/* Needs Attention Alert */}
              <div className="p-3 rounded-[12px] bg-[#FFF5F5] border-l-4 border-l-[#D41C1C] border-[rgba(0,0,0,0.04)] flex items-start justify-between gap-3">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#D41C1C]">
                    <AlertCircle size={13} />
                    <span>NEEDS ATTENTION • Target Customer</span>
                  </div>
                  <p className="text-[12px] text-[#070707]">Define specific demographics and pain points.</p>
                </div>
                <span className="text-[11px] font-bold text-[#3C61DD] shrink-0 mt-0.5">Clarify Customer</span>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-[rgba(0,0,0,0.04)] flex items-center justify-between text-[11px] text-[#8A8B8F]">
              <span className="flex items-center gap-1.5 font-bold text-[#3C61DD]">
                <span className="w-2 h-2 rounded-full bg-[#3C61DD]" /> IN DEVELOPMENT
              </span>
              <span>Last edited 2m ago</span>
            </div>
          </div>
        </div>

        {/* Project Methodology Sequence Bar */}
        <div className="w-full bg-[#F9F9FA] border border-[rgba(0,0,0,0.06)] rounded-[18px] p-5 flex flex-col gap-3">
          <span className="text-[11px] font-bold text-[#8A8B8F] uppercase tracking-wider">
            PROJECT METHODOLOGY SEQUENCE
          </span>
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
            {steps.map((st, i) => (
              <div key={st.name} className="flex items-center gap-2">
                <span
                  className={`px-3 py-1.5 rounded-[8px] ${
                    st.active
                      ? 'bg-[#F1F5FF] text-[#3C61DD] border border-[#3C61DD]/30'
                      : 'bg-white text-[#5E5E5E] border border-[rgba(0,0,0,0.06)]'
                  }`}
                >
                  {st.name}
                </span>
                {i < steps.length - 1 && <span className="text-[#8A8B8F]">➔</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
