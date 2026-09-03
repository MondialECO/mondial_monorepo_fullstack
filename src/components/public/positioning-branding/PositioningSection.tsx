'use client';

import { Briefcase, Shield, CheckCircle2, HelpCircle } from 'lucide-react';

export default function PositioningSection() {
  const logicSteps = [
    { label: 'WHO IS IT FOR?', value: 'Independent professionals' },
    { label: 'WHAT CATEGORY?', value: 'Flexible workspace marketplace' },
    { label: 'WHAT NEED?', value: 'Professional space on demand' },
    { label: 'WHY THIS APPROACH?', value: 'Hourly access + verified locations' },
    {
      label: 'WHAT DOES IT REPLACE?',
      value: 'Long-term office commitments, Coworking subscriptions, Unstructured alternatives.',
    },
  ];

  const statementItems = [
    { tag: 'FOR', text: 'Independent professionals' },
    { tag: 'WHO NEED', text: 'Flexible professional workspace' },
    { tag: 'NOVA SPACE IS', text: 'A verified local workspace marketplace', highlight: true },
    { tag: 'THAT ENABLES', text: 'Hourly booking without long-term commitment' },
    { tag: 'UNLIKE', text: 'Traditional office rental or fixed coworking subscriptions' },
  ];

  return (
    <section
      id="step-01-positioning"
      className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#F9F9FA] border-t border-[rgba(0,0,0,0.06)] flex justify-center"
    >
      <div className="w-full max-w-[1224px] flex flex-col gap-10 sm:gap-14">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[800px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            STEP 01 — POSITIONING
          </span>
          <h2 className="text-[32px] sm:text-[40px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Make it clear where the project belongs.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#5E5E5E] leading-[1.6]">
            Positioning connects the target customer, problem, solution and alternatives into one understandable place in the market.
          </p>
        </div>

        {/* 3-Column Positioning Architecture */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {/* Column 1: What We Already Know */}
          <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-[24px] p-6 flex flex-col gap-5 shadow-xs">
            <div className="flex items-center gap-2 pb-3 border-b border-[rgba(0,0,0,0.06)]">
              <Briefcase size={18} className="text-[#3C61DD]" />
              <h3 className="font-heading font-bold text-[16px] text-[#070707]">
                WHAT WE ALREADY KNOW
              </h3>
            </div>

            <div className="flex flex-col gap-4 text-[13px]">
              <div>
                <span className="text-[10px] font-bold text-[#8A8B8F] uppercase block">PROJECT</span>
                <p className="font-semibold text-[#070707]">Nova Space</p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-[#8A8B8F] uppercase block">TARGET CUSTOMER</span>
                <p className="font-medium text-[#070707]">Independent professionals</p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-[#8A8B8F] uppercase block">PROBLEM</span>
                <p className="text-[#5E5E5E] leading-relaxed">
                  Flexible workspace access often requires subscriptions, long commitments or inconsistent alternatives.
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-[#8A8B8F] uppercase block">SOLUTION</span>
                <p className="text-[#070707] font-medium leading-relaxed">
                  Verified local workspaces bookable by the hour.
                </p>
              </div>
            </div>
          </div>

          {/* Column 2: Positioning Logic */}
          <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-[24px] p-6 flex flex-col gap-5 shadow-xs">
            <div className="flex items-center gap-2 pb-3 border-b border-[rgba(0,0,0,0.06)]">
              <Shield size={18} className="text-[#3C61DD]" />
              <h3 className="font-heading font-bold text-[16px] text-[#070707]">
                POSITIONING LOGIC
              </h3>
            </div>

            <div className="relative flex flex-col gap-3.5 pl-5 text-[12px]">
              <div className="absolute left-[7px] top-2 bottom-2 w-[1px] bg-[#E5E7EB]" />
              {logicSteps.map((st) => (
                <div key={st.label} className="relative flex flex-col gap-0.5">
                  <div className="absolute -left-[18px] top-1.5 w-[9px] h-[9px] rounded-full bg-[#3C61DD] border-2 border-white shadow-xs" />
                  <span className="text-[10px] font-bold text-[#8A8B8F] uppercase">{st.label}</span>
                  <p className="font-medium text-[#070707]">{st.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Column 3: Positioning Statement */}
          <div className="bg-white border-2 border-[#3C61DD]/30 rounded-[24px] p-6 flex flex-col justify-between gap-5 shadow-sm">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(0,0,0,0.06)]">
                <h3 className="font-heading font-bold text-[16px] text-[#070707]">
                  POSITIONING STATEMENT
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-[#E8F8EE] text-[#00A854] text-[10px] font-bold uppercase inline-flex items-center gap-1">
                  <CheckCircle2 size={11} />
                  <span>CLEAR</span>
                </span>
              </div>

              <div className="flex flex-col gap-2.5 text-[12px]">
                {statementItems.map((item) => (
                  <div
                    key={item.tag}
                    className={`p-2.5 rounded-[10px] ${
                      item.highlight
                        ? 'bg-[#F1F5FF] border border-[#3C61DD]/30'
                        : 'bg-[#F9F9FA] border border-[rgba(0,0,0,0.04)]'
                    }`}
                  >
                    <span className="text-[10px] font-bold text-[#8A8B8F] uppercase block mb-0.5">
                      {item.tag}
                    </span>
                    <p className={`font-medium ${item.highlight ? 'text-[#3C61DD] font-semibold' : 'text-[#070707]'}`}>
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Open Question Bar */}
        <div className="w-full p-4 sm:p-5 rounded-[18px] bg-white border border-[rgba(0,0,0,0.08)] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-[13px]">
            <HelpCircle size={18} className="text-amber-600 shrink-0" />
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-[#8A8B8F] uppercase text-[11px]">OPEN QUESTION:</span>
              <span className="text-[#070707] font-medium">
                Should the initial positioning focus on workspaces only, or include meeting spaces from launch?
              </span>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-[11px] font-bold uppercase border border-amber-200">
            NEEDS DECISION
          </span>
        </div>
      </div>
    </section>
  );
}
