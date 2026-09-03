'use client';

import { Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

export default function ValuePropositionSection() {
  const customerToday = [
    'Works from home or cafés',
    'Pays for coworking membership when needed',
    'Struggles to find reliable short-term professional space',
    'Needs flexibility',
  ];

  const enginePillars = [
    { title: 'FLEXIBLE', desc: 'Book only when needed.' },
    { title: 'LOCAL', desc: 'Find nearby professional spaces.' },
    { title: 'VERIFIED', desc: 'See structured workspace information.' },
    { title: 'SIMPLE', desc: 'Discover and book in one flow.' },
  ];

  const customerNova = [
    'Access professional workspace on demand.',
    'Avoid unnecessary long-term commitment.',
    'Choose spaces based on structured information.',
    'Use workspace when and where needed.',
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-t border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1224px] flex flex-col gap-10 sm:gap-14">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[800px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            STEP 02 — WHY SHOULD THEY CARE?
          </span>
          <h2 className="text-[32px] sm:text-[40px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Turn the solution into clear customer value.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#5E5E5E] leading-[1.6]">
            A value proposition explains what meaningful benefit the project offers to its primary customer.
          </p>
        </div>

        {/* 3-Column Engine Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Customer Today (3.5 cols) */}
          <div className="lg:col-span-4 bg-[#F9F9FA] border border-[rgba(0,0,0,0.08)] rounded-[24px] p-6 flex flex-col justify-between gap-5 shadow-xs">
            <div className="flex flex-col gap-3">
              <span className="text-[11px] font-bold text-[#8A8B8F] uppercase tracking-wider">
                CUSTOMER TODAY
              </span>
              <h3 className="font-heading font-bold text-[18px] text-[#070707]">
                Independent Professional
              </h3>
              <p className="text-[12px] text-[#5E5E5E]">Current state challenges:</p>

              <div className="flex flex-col gap-2 pt-2 text-[12px]">
                {customerToday.map((pt) => (
                  <div key={pt} className="p-2.5 rounded-[8px] bg-white border border-[rgba(0,0,0,0.04)] text-[#5E5E5E]">
                    • {pt}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Value Prop Engine (4.5 cols) */}
          <div className="lg:col-span-4 bg-[#FAF8FF] border-2 border-[#3C61DD]/30 rounded-[24px] p-6 flex flex-col justify-between gap-5 shadow-sm">
            <div className="flex flex-col gap-3">
              <span className="text-[11px] font-bold text-[#3C61DD] uppercase tracking-wider">
                NOVA SPACE VALUE PROPOSITION ENGINE
              </span>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                {enginePillars.map((pil) => (
                  <div key={pil.title} className="p-3 rounded-[12px] bg-white border border-[#3C61DD]/20 flex flex-col gap-1 shadow-xs">
                    <span className="text-[11px] font-bold text-[#3C61DD] uppercase">{pil.title}</span>
                    <span className="text-[11px] text-[#070707]">{pil.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-[12px] bg-white border border-[rgba(0,0,0,0.06)] flex items-center justify-between text-[11px] font-bold text-[#3C61DD]">
              <span>CORE VALUE DELIVERY</span>
              <span>➔</span>
            </div>
          </div>

          {/* Customer With Nova Space (4 cols) */}
          <div className="lg:col-span-4 bg-[#E8F8EE]/40 border border-[#00A854]/30 rounded-[24px] p-6 flex flex-col justify-between gap-5 shadow-xs">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#00A854] uppercase tracking-wider">
                  CUSTOMER WITH NOVA SPACE
                </span>
                <CheckCircle2 size={16} className="text-[#00A854]" />
              </div>
              <h3 className="font-heading font-bold text-[18px] text-[#070707]">
                Empowered Worker
              </h3>
              <p className="text-[12px] text-[#5E5E5E]">Realized benefits:</p>

              <div className="flex flex-col gap-2 pt-2 text-[12px]">
                {customerNova.map((pt) => (
                  <div key={pt} className="p-2.5 rounded-[8px] bg-white border border-[#00A854]/20 text-[#070707] font-medium">
                    ✓ {pt}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Final Value Proposition Statement & AI Feedback */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Statement Box (8 cols) */}
          <div className="lg:col-span-8 p-6 sm:p-8 rounded-[24px] bg-[#F1F5FF] border border-[#3C61DD]/30 flex flex-col gap-4">
            <span className="text-[11px] font-bold text-[#3C61DD] uppercase tracking-wider">
              FINAL VALUE PROPOSITION
            </span>
            <blockquote className="font-heading font-semibold text-[17px] sm:text-[19px] text-[#070707] leading-relaxed">
              “For independent professionals who need flexible professional space, Nova Space provides verified local workspaces that can be booked by the hour.”
            </blockquote>

            <div className="flex flex-wrap items-center gap-4 pt-2 text-[12px] border-t border-[#3C61DD]/20">
              <div>
                <span className="text-[10px] font-bold text-[#8A8B8F] uppercase block">CORE BENEFIT:</span>
                <span className="font-bold text-[#3C61DD]">Flexible professional access</span>
              </div>
              <div className="h-6 w-[1px] bg-[#3C61DD]/20" />
              <div>
                <span className="text-[10px] font-bold text-[#8A8B8F] uppercase block">SUPPORTING BENEFITS:</span>
                <span className="text-[#5E5E5E]">Local discovery • Verified context • Hourly use</span>
              </div>
            </div>
          </div>

          {/* AI Feedback (4 cols) */}
          <div className="lg:col-span-4 p-6 rounded-[24px] bg-[#F9F9FA] border border-[rgba(0,0,0,0.08)] flex flex-col gap-3">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#3C61DD]">
              <Sparkles size={14} />
              <span>MONDIAL AI FEEDBACK</span>
            </div>
            <p className="text-[12px] text-[#070707] leading-relaxed">
              Does the value proposition describe customer value rather than a list of features?
            </p>
            <span className="w-fit px-2.5 py-1 rounded-full bg-[#E8F8EE] text-[#00A854] text-[11px] font-bold uppercase inline-flex items-center gap-1">
              <CheckCircle2 size={13} />
              <span>GOOD FOUNDATION</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
