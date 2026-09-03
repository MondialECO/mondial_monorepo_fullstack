'use client';

import { Briefcase, Building2, Coins, ShoppingBag, Cpu } from 'lucide-react';

export default function MondialDifferenceSection() {
  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#F9F9FA] border-t border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1224px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3.5 max-w-[880px]">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F1F5FF] text-[#3C61DD] text-[11px] font-semibold tracking-wider uppercase w-fit border border-[#3C61DD]/20">
            THE MONDIAL DIFFERENCE
          </div>
          <h2 className="text-[32px] sm:text-[42px] lg:text-[48px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Build once. Strengthen continuously.
          </h2>
          <p className="text-[15px] sm:text-[16px] text-[#5E5E5E] leading-[1.6]">
            Mondial is designed around the project becoming more useful as verified context is added over time. Permissions and readiness remain fully in your control; there is no automatic data exposure.
          </p>
        </div>

        {/* Central Visualization Hub */}
        <div className="w-full relative flex flex-col lg:flex-row items-center justify-between gap-8 py-8 px-4 sm:px-8 bg-white border border-[rgba(0,0,0,0.08)] rounded-[28px] shadow-sm overflow-hidden">
          {/* Left 2 Nodes */}
          <div className="flex flex-col gap-8 w-full lg:w-[220px] shrink-0">
            {/* Service Providers */}
            <div className="p-4 rounded-[16px] bg-[#F9F9FA] border border-[rgba(0,0,0,0.06)] flex items-center gap-3.5 shadow-xs">
              <div className="w-10 h-10 rounded-[10px] bg-white text-[#3C61DD] flex items-center justify-center shadow-xs shrink-0">
                <Briefcase size={18} />
              </div>
              <div>
                <h4 className="font-heading font-bold text-[13px] text-[#070707]">SERVICE PROVIDERS</h4>
                <p className="text-[11px] text-[#8A8B8F]">Skills &amp; Execution</p>
              </div>
            </div>

            {/* Marketplace */}
            <div className="p-4 rounded-[16px] bg-[#F9F9FA] border border-[rgba(0,0,0,0.06)] flex items-center gap-3.5 shadow-xs">
              <div className="w-10 h-10 rounded-[10px] bg-white text-[#3C61DD] flex items-center justify-center shadow-xs shrink-0">
                <ShoppingBag size={18} />
              </div>
              <div>
                <h4 className="font-heading font-bold text-[13px] text-[#070707]">MARKETPLACE</h4>
                <p className="text-[11px] text-[#8A8B8F]">Discovery &amp; Buyout</p>
              </div>
            </div>
          </div>

          {/* Center Concentric Core Structure */}
          <div className="relative flex items-center justify-center w-[300px] h-[300px] sm:w-[380px] sm:h-[380px] shrink-0 my-4 lg:my-0">
            {/* Outer Ring 3 */}
            <div className="absolute inset-0 rounded-full border border-dashed border-[#3C61DD]/30 flex items-center justify-center animate-[spin_60s_linear_infinite]">
              <span className="absolute -top-3 px-2.5 py-0.5 rounded-full bg-[#F1F5FF] text-[10px] font-bold text-[#3C61DD] border border-[#3C61DD]/20">
                MARKET EVIDENCE
              </span>
              <span className="absolute -bottom-3 px-2.5 py-0.5 rounded-full bg-[#F1F5FF] text-[10px] font-bold text-[#3C61DD] border border-[#3C61DD]/20">
                BUSINESS PLAN
              </span>
            </div>

            {/* Middle Ring 2 */}
            <div className="absolute inset-8 sm:inset-10 rounded-full border border-[#3C61DD]/20 flex items-center justify-center">
              <span className="absolute -left-3 px-2.5 py-0.5 rounded-full bg-white text-[10px] font-bold text-[#070707] shadow-xs border border-[rgba(0,0,0,0.06)]">
                POSITIONING
              </span>
              <span className="absolute -right-3 px-2.5 py-0.5 rounded-full bg-white text-[10px] font-bold text-[#070707] shadow-xs border border-[rgba(0,0,0,0.06)]">
                STRATEGY
              </span>
            </div>

            {/* Inner Ring 1 */}
            <div className="absolute inset-16 sm:inset-20 rounded-full border border-[rgba(0,0,0,0.08)] bg-[#F9F9FA]" />

            {/* Core Hub */}
            <div className="relative z-10 w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#3C61DD] text-white flex flex-col items-center justify-center shadow-lg gap-1">
              <Cpu size={24} />
              <span className="font-heading font-bold text-[11px] sm:text-[12px] uppercase tracking-wider text-center px-1">
                PROJECT CORE
              </span>
            </div>
          </div>

          {/* Right 2 Nodes */}
          <div className="flex flex-col gap-8 w-full lg:w-[220px] shrink-0">
            {/* Entrepreneurs */}
            <div className="p-4 rounded-[16px] bg-[#F9F9FA] border border-[rgba(0,0,0,0.06)] flex items-center gap-3.5 shadow-xs">
              <div className="w-10 h-10 rounded-[10px] bg-white text-[#3C61DD] flex items-center justify-center shadow-xs shrink-0">
                <Building2 size={18} />
              </div>
              <div>
                <h4 className="font-heading font-bold text-[13px] text-[#070707]">ENTREPRENEURS</h4>
                <p className="text-[11px] text-[#8A8B8F]">Company Building</p>
              </div>
            </div>

            {/* Investors */}
            <div className="p-4 rounded-[16px] bg-[#F9F9FA] border border-[rgba(0,0,0,0.06)] flex items-center gap-3.5 shadow-xs">
              <div className="w-10 h-10 rounded-[10px] bg-white text-[#3C61DD] flex items-center justify-center shadow-xs shrink-0">
                <Coins size={18} />
              </div>
              <div>
                <h4 className="font-heading font-bold text-[13px] text-[#070707]">INVESTORS</h4>
                <p className="text-[11px] text-[#8A8B8F]">Future Funding</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
