'use client';

import { Lock, Shield, ArrowRight } from 'lucide-react';

export default function FullBuyoutSection() {
  const journeyStages = [
    'BUYER INTEREST',
    'ACCESS REQUEST',
    'PROJECT REVIEW',
    'NEGOTIATION',
    'AGREEMENT',
    'OWNERSHIP TRANSFER',
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#F9F9FA] border-t border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1224px] flex flex-col gap-10 sm:gap-12">
        {/* Header */}
        <div className="flex flex-col gap-3.5 max-w-[840px]">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F1F5FF] text-[#3C61DD] text-[11px] font-semibold tracking-wider uppercase w-fit border border-[#3C61DD]/20">
            PROJECT ACQUISITION
          </div>
          <h2 className="text-[32px] sm:text-[42px] lg:text-[48px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            A structured project can become an acquisition opportunity.
          </h2>
          <p className="text-[15px] sm:text-[16px] text-[#5E5E5E] leading-[1.6]">
            The Creator can present a structured project as a Full Buyout opportunity while keeping
            control over access and negotiation.
          </p>
        </div>

        {/* Cards Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
          {/* Left Opportunity Card (8 cols) */}
          <div className="lg:col-span-8 bg-white border border-[rgba(0,0,0,0.08)] rounded-[24px] p-6 sm:p-8 flex flex-col gap-6 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4 border-b border-[rgba(0,0,0,0.06)] pb-4">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-semibold text-[#8A8B8F]">
                  PROJECT OPPORTUNITY PREVIEW
                </span>
                <h3 className="font-heading font-bold text-[24px] text-[#070707]">NOVA SPACE</h3>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#D4FFE5] text-[#00A854] text-[12px] font-bold">
                <span className="w-2 h-2 rounded-full bg-[#00A854] animate-pulse" />
                <span>AVAILABLE FOR FULL BUYOUT</span>
              </div>
            </div>

            {/* 8 Field Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-[13px]">
              <div className="flex flex-col gap-1 p-3 rounded-[12px] bg-[#F9F9FA] border border-[rgba(0,0,0,0.03)]">
                <span className="font-bold text-[#070707] text-[11px] uppercase text-[#8A8B8F]">Project Summary</span>
                <span className="text-[#3E3E3E] leading-snug">AI-driven architectural planning tool for sustainable urban development.</span>
              </div>
              <div className="flex flex-col gap-1 p-3 rounded-[12px] bg-[#F9F9FA] border border-[rgba(0,0,0,0.03)]">
                <span className="font-bold text-[#070707] text-[11px] uppercase text-[#8A8B8F]">Problem &amp; Solution</span>
                <span className="text-[#3E3E3E] leading-snug">Reduces planning cycles by 40% using generative predictive models.</span>
              </div>
              <div className="flex flex-col gap-1 p-3 rounded-[12px] bg-[#F9F9FA] border border-[rgba(0,0,0,0.03)]">
                <span className="font-bold text-[#070707] text-[11px] uppercase text-[#8A8B8F]">Market Context</span>
                <span className="text-[#3E3E3E] leading-snug">$2.4B SAM in North America and EU.</span>
              </div>
              <div className="flex flex-col gap-1 p-3 rounded-[12px] bg-[#F9F9FA] border border-[rgba(0,0,0,0.03)]">
                <span className="font-bold text-[#070707] text-[11px] uppercase text-[#8A8B8F]">Business Model</span>
                <span className="text-[#3E3E3E] leading-snug">B2B Enterprise SaaS.</span>
              </div>
              <div className="flex flex-col gap-1 p-3 rounded-[12px] bg-[#F9F9FA] border border-[rgba(0,0,0,0.03)]">
                <span className="font-bold text-[#070707] text-[11px] uppercase text-[#8A8B8F]">Evidence</span>
                <span className="text-[#3E3E3E] leading-snug">3 pilot programs completed. 15k MRR.</span>
              </div>
              <div className="flex flex-col gap-1 p-3 rounded-[12px] bg-[#F9F9FA] border border-[rgba(0,0,0,0.03)]">
                <span className="font-bold text-[#070707] text-[11px] uppercase text-[#8A8B8F]">Financial Context</span>
                <span className="text-[#3E3E3E] leading-snug">Runway: 18 months. Burn: $45k/mo.</span>
              </div>
              <div className="flex flex-col gap-1 p-3 rounded-[12px] bg-[#F9F9FA] border border-[rgba(0,0,0,0.03)]">
                <span className="font-bold text-[#070707] text-[11px] uppercase text-[#8A8B8F]">Resource Requirements</span>
                <span className="text-[#3E3E3E] leading-snug">Needs 2x Senior ML Engineers for scaling.</span>
              </div>
              <div className="flex flex-col gap-1 p-3 rounded-[12px] bg-[#F9F9FA] border border-[rgba(0,0,0,0.03)]">
                <span className="font-bold text-[#070707] text-[11px] uppercase text-[#8A8B8F]">Risk Summary</span>
                <span className="text-[#3E3E3E] leading-snug">Regulatory compliance in EU data storage.</span>
              </div>
            </div>
          </div>

          {/* Right Sidebar: What Creator Controls (4 cols) */}
          <div className="lg:col-span-4 bg-white border border-[rgba(0,0,0,0.08)] rounded-[24px] p-6 sm:p-7 flex flex-col justify-between gap-5 shadow-sm">
            <div className="flex flex-col gap-4">
              <h4 className="font-heading font-bold text-[16px] text-[#070707] border-b border-[rgba(0,0,0,0.06)] pb-3 uppercase tracking-wide">
                WHAT THE CREATOR CONTROLS
              </h4>

              <div className="flex flex-col gap-3.5 text-[13px]">
                <div className="flex items-center justify-between py-1.5 border-b border-[rgba(0,0,0,0.04)]">
                  <div>
                    <span className="font-semibold text-[#070707] block">Project Visibility</span>
                    <span className="text-[11px] text-[#8A8B8F]">Listed on marketplace</span>
                  </div>
                  <span className="w-9 h-5 rounded-full bg-[#3C61DD] flex items-center justify-end px-0.5">
                    <span className="w-4 h-4 rounded-full bg-white shadow-xs" />
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-[rgba(0,0,0,0.04)]">
                  <div>
                    <span className="font-semibold text-[#070707] block">Who Can Request Access</span>
                    <span className="text-[11px] text-[#8A8B8F]">Verified Buyers Only</span>
                  </div>
                  <span className="w-9 h-5 rounded-full bg-[#3C61DD] flex items-center justify-end px-0.5">
                    <span className="w-4 h-4 rounded-full bg-white shadow-xs" />
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-[rgba(0,0,0,0.04)]">
                  <div>
                    <span className="font-semibold text-[#070707] block">Information Shared</span>
                    <span className="text-[11px] text-[#8A8B8F]">Tier 1 Data (Public)</span>
                  </div>
                  <Lock size={16} className="text-[#3C61DD]" />
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <div>
                    <span className="font-semibold text-[#070707] block">Discussions Continue</span>
                    <span className="text-[11px] text-[#8A8B8F]">Creator Discretion</span>
                  </div>
                  <Shield size={16} className="text-[#3C61DD]" />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[rgba(0,0,0,0.06)]">
              <span className="text-[12px] font-bold text-[#3C61DD]">100% Creator Governed</span>
            </div>
          </div>
        </div>

        {/* Full Buyout Process Timeline */}
        <div className="w-full bg-white border border-[rgba(0,0,0,0.08)] rounded-[20px] p-5 sm:p-6 shadow-sm overflow-x-auto no-scrollbar">
          <div className="min-w-[720px] flex items-center justify-between gap-3">
            {journeyStages.map((stage, idx) => (
              <div key={stage} className="flex items-center gap-2 flex-1">
                <span className="px-3 py-1.5 rounded-[8px] bg-[#F1F5FF] text-[#3C61DD] text-[11px] sm:text-[12px] font-bold tracking-wide whitespace-nowrap border border-[#3C61DD]/15">
                  {stage}
                </span>
                {idx < journeyStages.length - 1 && (
                  <ArrowRight size={14} className="text-[#8A8B8F] shrink-0 mx-auto" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
