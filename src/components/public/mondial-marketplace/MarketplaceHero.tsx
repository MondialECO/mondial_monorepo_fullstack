'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles, Compass } from 'lucide-react';

export default function MarketplaceHero() {
  const orbitRoles = [
    {
      role: 'CREATOR',
      context: 'STRUCTURED PROJECT',
      color: '#3C61DD',
      bg: '#FAF8FF',
      border: '#E2E1EC',
    },
    {
      role: 'ENTREPRENEUR',
      context: 'COMPANY CONTEXT',
      color: '#157A55',
      bg: '#E8F8EE',
      border: '#157A55]/30',
    },
    {
      role: 'SERVICE PROVIDER',
      context: 'PROFESSIONAL',
      color: '#8B5CF6',
      bg: '#F5F3FF',
      border: '#8B5CF6]/30',
    },
    {
      role: 'INVESTOR',
      context: 'CAPITAL CONTEXT',
      color: '#1A47C3',
      bg: '#EBF0FF',
      border: '#1A47C3]/30',
    },
  ];

  const miniFlow = [
    'STRUCTURE',
    'DISCOVER',
    'UNDERSTAND',
    'CONNECT',
    'MOVE FORWARD',
  ];

  return (
    <section className="w-full pt-28 pb-16 sm:pt-36 sm:pb-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#F3F2FD]/50 via-white to-white flex justify-center border-b border-[rgba(0,0,0,0.06)]">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* 1. Header & CTAs */}
        <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-8">
          <div className="flex flex-col gap-4 max-w-[780px]">
            <span className="text-[12px] font-bold text-[#747685] uppercase tracking-wider">
              MONDIAL ECO — MARKETPLACE
            </span>
            <h1 className="text-[40px] sm:text-[54px] lg:text-[62px] font-heading font-extrabold text-[#070707] leading-[1.08] tracking-tight">
              Where structured needs
              <br />
              <span className="text-[#3C61DD]">meet structured opportunities.</span>
            </h1>
            <p className="text-[16px] sm:text-[18px] text-[#444654] leading-[1.6] max-w-[680px]">
              Discover projects, companies, professional services and verified ecosystem profiles — with the business context needed to understand why a connection may matter.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <a
              href="#value-types"
              className="px-6 sm:px-7 py-3.5 bg-[#3C61DD] hover:bg-[#3252BF] text-white font-semibold text-[14px] rounded-[10px] transition-all shadow-sm hover:shadow inline-flex items-center gap-2 group"
            >
              <span>Explore the Marketplace</span>
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
            </a>

            <a
              href="#discovery-logic"
              className="px-5 py-3.5 bg-[#FAF8FF] hover:bg-[#F1F1F2] border border-[#E2E1EC] text-[#1A1B23] font-semibold text-[14px] rounded-[10px] transition-colors"
            >
              See How Discovery Works
            </a>
          </div>
        </div>

        {/* 2. 4-Role Orbit Showcase */}
        <div className="p-6 sm:p-10 rounded-[28px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-xs flex flex-col items-center gap-8">
          <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {orbitRoles.map((r) => (
              <div
                key={r.role}
                className="p-5 sm:p-6 rounded-[22px] bg-white border border-[#E2E1EC] shadow-2xs flex flex-col justify-between gap-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-heading font-bold text-[14px] text-[#1A1B23]">
                    {r.role}
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                </div>
                <div className="pt-2 border-t border-[rgba(0,0,0,0.05)]">
                  <span className="text-[11px] font-extrabold text-[#747685] tracking-wider uppercase">
                    {r.context}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Central Hub */}
          <div className="p-6 sm:p-8 rounded-[24px] bg-[#1A1B23] text-white text-center max-w-[380px] w-full flex flex-col items-center gap-2 shadow-md border-4 border-white">
            <span className="text-[10px] font-bold text-[#C4C5D6] uppercase tracking-wider">
              CENTRAL DISCOVERY LAYER
            </span>
            <h2 className="font-heading font-extrabold text-[22px] sm:text-[24px] tracking-wide">
              MONDIAL MARKETPLACE
            </h2>
            <p className="text-[12px] text-[#C4C5D6]">
              Where different ecosystem journeys converge with context
            </p>
          </div>

          {/* Bottom Mini-flow */}
          <div className="w-full flex flex-wrap items-center justify-center gap-2 pt-4 border-t border-[rgba(0,0,0,0.06)] text-[11px] sm:text-[12px] font-bold text-[#1A1B23]">
            {miniFlow.map((step, idx) => (
              <span key={step} className="flex items-center gap-2">
                <span className="px-3.5 py-1.5 rounded-[8px] bg-white border border-[#E2E1EC]">
                  {step}
                </span>
                {idx < miniFlow.length - 1 && <span className="text-[#3C61DD]">➔</span>}
              </span>
            ))}
          </div>
        </div>

        {/* 3. Hero Closing Statement */}
        <div className="p-6 sm:p-8 rounded-[24px] bg-white border border-[#E2E1EC] shadow-xs text-center">
          <h3 className="font-heading font-extrabold text-[15px] sm:text-[18px] text-[#070707] uppercase tracking-wide leading-relaxed">
            THE MARKETPLACE IS NOT THE END OF A JOURNEY.
            <br />
            IT IS WHERE DIFFERENT JOURNEYS MEET.
          </h3>
        </div>
      </div>
    </section>
  );
}
