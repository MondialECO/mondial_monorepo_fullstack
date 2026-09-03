'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, Sparkles, Plus, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function PositioningBrandingHero() {
  const steps = [
    { name: 'IDENTITY', completed: true },
    { name: 'POSITIONING', active: true },
    { name: 'VALUE PROP' },
    { name: 'DIFFERENTIATION' },
    { name: 'MESSAGE' },
    { name: 'BRAND' },
  ];

  const modules = [
    { name: 'Project Identity', status: 'COMPLETE', color: 'green' },
    { name: 'Value Proposition', status: 'IN PROGRESS', color: 'amber', active: true },
    { name: 'Differentiation', status: 'UPCOMING', color: 'gray' },
    { name: 'Audience Message' },
    { name: 'Brand Direction' },
    { name: 'Project Presentation' },
  ];

  const pillars = ['Flexibility', 'Local Access', 'Verified Information'];

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="w-full pt-28 pb-14 sm:pt-36 sm:pb-20 flex flex-col items-center">
      <div className="w-full max-w-[1224px] flex flex-col gap-10 sm:gap-14">
        {/* 12-Column Hero Top */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* Left Hero (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6 items-start">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F1F5FF] text-[#3C61DD] text-[11px] font-bold tracking-wider uppercase border border-[#3C61DD]/20">
              PHASE 02 — PROJECT IDENTITY &amp; BRANDING
            </div>

            <h1 className="text-[36px] sm:text-[44px] lg:text-[48px] font-heading font-bold text-[#070707] leading-[1.12] tracking-tight">
              Define how your project should be understood.
            </h1>

            <p className="text-[15px] sm:text-[17px] text-[#5E5E5E] leading-[1.6]">
              Turn the structured project into a clear position, value proposition and brand direction before moving into deeper business intelligence.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-1">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#3C61DD] hover:bg-[#3252BF] text-white font-medium text-[15px] rounded-[10px] transition-all shadow-sm group"
              >
                <span>Shape Your Positioning</span>
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <button
                type="button"
                onClick={() => scrollToSection('step-01-positioning')}
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-white hover:bg-[#F9F9FA] border border-[rgba(0,0,0,0.1)] text-[#070707] font-medium text-[15px] rounded-[10px] transition-colors shadow-xs"
              >
                <span>See How It Works</span>
              </button>
            </div>

            {/* Progression Pills */}
            <div className="w-full pt-4 border-t border-[rgba(0,0,0,0.06)] flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
                {steps.map((st, i) => (
                  <div key={st.name} className="flex items-center gap-1.5">
                    <span
                      className={`px-2.5 py-1 rounded-[6px] ${
                        st.completed
                          ? 'bg-[#E8F8EE] text-[#00A854]'
                          : st.active
                          ? 'bg-[#3C61DD] text-white'
                          : 'bg-[#F9F9FA] text-[#8A8B8F]'
                      }`}
                    >
                      {st.name} {st.completed && '✓'}
                    </span>
                    {i < steps.length - 1 && <span className="text-[#C4C5D6]">➔</span>}
                  </div>
                ))}
              </div>
              <span className="text-[11px] text-[#8A8B8F]">Creator Journey — Phase 02</span>
            </div>
          </div>

          {/* Right Hero: Nova Space SaaS Positioning Workspace Mockup (7 cols) */}
          <div className="lg:col-span-7 bg-white border border-[rgba(0,0,0,0.1)] rounded-[24px] shadow-lg overflow-hidden flex flex-col">
            {/* App Header */}
            <div className="px-6 py-4 bg-white border-b border-[rgba(0,0,0,0.06)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[8px] bg-[#3C61DD] text-white flex items-center justify-center font-bold text-[13px]">
                  N
                </div>
                <div>
                  <h3 className="font-heading font-bold text-[15px] text-[#070707]">NOVA SPACE</h3>
                  <span className="text-[11px] text-[#8A8B8F]">02 — PROJECT IDENTITY &amp; BRANDING</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[12px]">
                <span className="text-[#8A8B8F]">POSITIONING PROGRESS:</span>
                <span className="font-bold text-[#3C61DD]">62%</span>
              </div>
            </div>

            {/* App Body Grid: Sidebar + Main Workspace */}
            <div className="grid grid-cols-1 md:grid-cols-12">
              {/* Sidebar Modules (4 cols) */}
              <div className="md:col-span-4 bg-[#F9F9FA] border-r border-[rgba(0,0,0,0.06)] p-4 flex flex-col gap-2">
                <span className="text-[10px] font-bold text-[#8A8B8F] uppercase tracking-wider mb-1">
                  MODULES
                </span>
                {modules.map((m) => (
                  <div
                    key={m.name}
                    className={`p-2.5 rounded-[10px] flex items-center justify-between text-[12px] ${
                      m.active
                        ? 'bg-[#F1F5FF] border border-[#3C61DD]/30 font-semibold text-[#070707]'
                        : 'bg-white border border-[rgba(0,0,0,0.04)] text-[#5E5E5E]'
                    }`}
                  >
                    <span>{m.name}</span>
                    {m.status && (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-[4px] uppercase ${
                          m.color === 'green'
                            ? 'bg-[#E8F8EE] text-[#00A854]'
                            : m.color === 'amber'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-gray-100 text-[#8A8B8F]'
                        }`}
                      >
                        {m.status}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Main Workspace Detail (8 cols) */}
              <div className="md:col-span-8 p-5 flex flex-col gap-4 text-[12px]">
                <div className="flex items-center justify-between pb-2 border-b border-[rgba(0,0,0,0.04)]">
                  <div>
                    <h4 className="font-heading font-bold text-[15px] text-[#070707]">Value Proposition</h4>
                    <p className="text-[11px] text-[#8A8B8F]">
                      Define the core value delivered to your target customer.
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-[6px] bg-[#E8F8EE] text-[#00A854] text-[10px] font-bold">
                    CLARITY: Strong
                  </span>
                </div>

                <div className="flex flex-col gap-2.5">
                  <div className="p-2.5 rounded-[8px] bg-[#F9F9FA] flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold text-[#8A8B8F] uppercase">TARGET CUSTOMER</span>
                    <span className="font-semibold text-[#070707]">Independent Professionals</span>
                  </div>

                  <div className="p-2.5 rounded-[8px] bg-[#F9F9FA] flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold text-[#8A8B8F] uppercase">CORE NEED</span>
                    <span className="text-[#070707]">
                      Flexible professional workspace without long-term commitment.
                    </span>
                  </div>

                  <div className="p-2.5 rounded-[8px] bg-[#F9F9FA] flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold text-[#8A8B8F] uppercase">PROJECT PROMISE</span>
                    <span className="text-[#070707]">Book verified local workspaces by the hour.</span>
                  </div>

                  <div className="flex flex-col gap-1.5 pt-1">
                    <span className="text-[10px] font-bold text-[#8A8B8F] uppercase">
                      CORE VALUE PILLARS
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {pillars.map((pil) => (
                        <span
                          key={pil}
                          className="px-2.5 py-1 rounded-[6px] bg-[#F1F5FF] text-[#3C61DD] font-medium border border-[#3C61DD]/20"
                        >
                          {pil}
                        </span>
                      ))}
                      <button
                        type="button"
                        className="px-2 py-1 rounded-[6px] bg-white border border-dashed border-[#8A8B8F] text-[#8A8B8F] text-[11px] flex items-center gap-1"
                      >
                        <Plus size={11} />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Potential Positioning Gap Alert */}
                <div className="p-3 rounded-[12px] bg-[#FAF8FF] border border-[#3C61DD]/20 flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#3C61DD]">
                    <Sparkles size={13} />
                    <span>MONDIAL INTELLIGENCE · POTENTIAL POSITIONING GAP</span>
                  </div>
                  <p className="text-[11px] text-[#5E5E5E] leading-relaxed">
                    “Flexible workspace” is still broad. Clarify why Nova Space is preferable to coworking subscriptions or general booking marketplaces.
                  </p>
                  <button
                    type="button"
                    className="w-fit text-[11px] font-bold text-[#3C61DD] hover:underline pt-0.5"
                  >
                    Refine Promise with AI →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
