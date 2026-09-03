'use client';

import { ArrowRight, UserCheck, CheckCircle2, Sparkles, FileText, Layers, Rocket } from 'lucide-react';

export default function ProviderCaseStudiesSection() {
  const spineNodes = [
    { label: 'CONTEXT', value: 'Creator', icon: UserCheck },
    { label: 'NEED', value: 'Brand System', icon: Layers },
    { label: 'CONTRIBUTION', value: 'Strategy & Identity', icon: Sparkles, isHighlight: true },
    { label: 'DELIVERABLE', value: 'Launch Assets', icon: FileText },
    { label: 'OUTCOME', value: 'Market Readiness', icon: Rocket, isSuccess: true },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#F1F1F2]/60 border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#747685] uppercase tracking-wider">
            WORK WITH CONTEXT
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Show what you did.
            <br />
            And why it mattered.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Mondial case studies connect professional work to the real journey of the Creator, Entrepreneur or Investor who needed it.
          </p>
        </div>

        {/* Featured Case Study & Architecture Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left: Featured Case Study Details (5 cols) */}
          <div className="lg:col-span-5 p-6 sm:p-8 rounded-[28px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded bg-[#E2E1EC] text-[10px] font-extrabold uppercase text-[#1A1B23]">
                  FEATURED CASE STUDY
                </span>
              </div>

              <h3 className="font-heading font-extrabold text-[20px] text-[#1A1B23] leading-snug">
                BRAND IDENTITY FOR A CREATOR
              </h3>

              <div className="flex items-center gap-2 text-[13px] text-[#444654]">
                <span className="w-2 h-2 rounded-full bg-[#157A55]" />
                <span className="font-semibold">Provider: Maya Rahman (Tier 3 Provider)</span>
              </div>

              <div className="space-y-3 pt-2 text-[13px]">
                <div>
                  <span className="text-[10px] font-bold text-[#747685] uppercase block">
                    CLIENT CONTEXT
                  </span>
                  <p className="font-semibold text-[#1A1B23]">Creator</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#747685] uppercase block">
                    JOURNEY MOMENT
                  </span>
                  <p className="font-semibold text-[#1A1B23]">
                    Phase 02 - Project Identity &amp; Branding
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#747685] uppercase block">NEED</span>
                  <p className="font-semibold text-[#1A1B23]">
                    Create a credible startup brand system.
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#747685] uppercase block">
                    CONTRIBUTION
                  </span>
                  <p className="font-semibold text-[#1A1B23]">
                    Brand strategy, Visual identity, Launch assets.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-[16px] bg-[#FAF8FF] border border-[#E2E1EC]">
              <span className="text-[10px] font-bold text-[#747685] uppercase block">
                OUTCOME CONTEXT
              </span>
              <p className="font-heading font-bold text-[14px] text-[#1A1B23] mt-0.5">
                Project moved into structured market preparation.
              </p>
            </div>
          </div>

          {/* Right: Architectural Spine & Secondary Examples (7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-between gap-6">
            {/* Horizontal Spine Flow */}
            <div className="p-6 sm:p-8 rounded-[28px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col gap-6">
              <span className="text-[11px] font-bold text-[#747685] uppercase tracking-wider">
                CASE STUDY ARCHITECTURE
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {spineNodes.map((node, idx) => {
                  const Icon = node.icon;
                  return (
                    <div
                      key={node.label}
                      className={`p-3 rounded-[16px] border flex flex-col items-center text-center justify-between gap-2 shadow-2xs ${
                        node.isHighlight
                          ? 'bg-[#F3F2FD] border-[#3C61DD]'
                          : node.isSuccess
                          ? 'bg-[#E8F8EE] border-[#157A55]/30'
                          : 'bg-[#FAF8FF] border-[#E2E1EC]'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center ${
                          node.isHighlight
                            ? 'bg-[#3C61DD] text-white'
                            : node.isSuccess
                            ? 'bg-[#157A55] text-white'
                            : 'bg-white text-[#747685] border border-[#E2E1EC]'
                        }`}
                      >
                        <Icon size={16} />
                      </div>
                      <div>
                        <span
                          className={`text-[9px] font-extrabold uppercase block ${
                            node.isHighlight ? 'text-[#3C61DD]' : 'text-[#747685]'
                          }`}
                        >
                          {node.label}
                        </span>
                        <span className="font-heading font-bold text-[12px] text-[#1A1B23] leading-tight block mt-0.5">
                          {node.value}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Smaller Examples Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-[20px] bg-white border border-[#E2E1EC] shadow-2xs flex flex-col gap-1">
                <span className="text-[10px] font-bold text-[#747685] uppercase">
                  ENTREPRENEUR EXAMPLE
                </span>
                <h4 className="font-heading font-bold text-[14px] text-[#1A1B23]">
                  Legal formation review
                </h4>
                <span className="text-[12px] text-[#3C61DD] font-semibold">
                  ➔ Structural Provider
                </span>
              </div>

              <div className="p-5 rounded-[20px] bg-white border border-[#E2E1EC] shadow-2xs flex flex-col gap-1">
                <span className="text-[10px] font-bold text-[#747685] uppercase">
                  INVESTOR EXAMPLE
                </span>
                <h4 className="font-heading font-bold text-[14px] text-[#1A1B23]">
                  Independent due diligence
                </h4>
                <span className="text-[12px] text-[#3C61DD] font-semibold">➔ Deal Provider</span>
              </div>
            </div>
          </div>
        </div>

        {/* Core Statement */}
        <div className="w-full p-6 sm:p-8 rounded-[24px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col items-center gap-4 text-center">
          <h3 className="font-heading font-extrabold text-[15px] sm:text-[18px] text-[#070707] uppercase tracking-wide">
            A STRONG PORTFOLIO IS NOT JUST A GALLERY. IT EXPLAINS:
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-[11px] sm:text-[12px] font-bold text-[#444654]">
            <span className="px-3 py-1.5 rounded-[8px] bg-[#FAF8FF] border border-[#E2E1EC]">
              WHERE THE WORK HAPPENED
            </span>
            <span className="text-[#3C61DD]">➔</span>
            <span className="px-3 py-1.5 rounded-[8px] bg-[#FAF8FF] border border-[#E2E1EC]">
              WHAT WAS NEEDED
            </span>
            <span className="text-[#3C61DD]">➔</span>
            <span className="px-3 py-1.5 rounded-[8px] bg-[#FAF8FF] border border-[#E2E1EC]">
              WHAT THE PROVIDER CONTRIBUTED
            </span>
            <span className="text-[#3C61DD]">➔</span>
            <span className="px-3 py-1.5 rounded-[8px] bg-[#FAF8FF] border border-[#E2E1EC]">
              WHAT CHANGED NEXT
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
