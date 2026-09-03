'use client';

import { Activity, Layers, DollarSign, Globe, Zap, AlertTriangle, Scale } from 'lucide-react';

export default function ValuationContextSection() {
  const nodes = [
    {
      title: 'COMPANY STAGE',
      items: ['Idea', 'MVP', 'Revenue', 'Growth'],
      icon: Layers,
      color: 'text-[#1A47C3]',
    },
    {
      title: 'TRACTION',
      items: ['User Growth', 'Engagement', 'Retention'],
      icon: Activity,
      color: 'text-[#157A55]',
    },
    {
      title: 'FINANCIAL CONTEXT',
      items: ['Burn Rate', 'Margins', 'Unit Economics'],
      icon: DollarSign,
      color: 'text-[#875301]',
    },
    {
      title: 'MARKET',
      items: ['TAM/SAM/SOM', 'Competitors', 'Timing'],
      icon: Globe,
      color: 'text-[#1A47C3]',
    },
    {
      title: 'EXECUTION',
      items: ['Team Exp.', 'Velocity', 'Partnerships'],
      icon: Zap,
      color: 'text-[#157A55]',
    },
    {
      title: 'RISK',
      items: ['Tech Risk', 'Market Risk', 'Regulatory'],
      icon: AlertTriangle,
      color: 'text-[#BA1A1A]',
    },
  ];

  const approaches = [
    {
      title: 'COMPARABLE CONTEXT',
      desc: 'How similar companies or transactions may be considered in the current market environment to establish a baseline range.',
    },
    {
      title: 'FINANCIAL CONTEXT',
      desc: 'How company economics and projections may influence discussion, focusing on path to profitability and capital efficiency.',
    },
    {
      title: 'NEGOTIATED CONTEXT',
      desc: 'How investor demand, specific terms, liquidation preferences, and perceived risk affect the actual round dynamics.',
    },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#FAF8FF] border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#747685] uppercase tracking-wider">
            UNDERSTAND THE CONTEXT
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Valuation is not one magic number.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Company stage, traction, financial context, market evidence, risk and deal structure can all affect how valuation is discussed.
          </p>
        </div>

        {/* Central Hub Architecture Diagram */}
        <div className="bg-white border border-[#E2E1EC] rounded-[24px] p-6 sm:p-10 flex flex-col items-center gap-10 shadow-xs">
          {/* Central Hub */}
          <div className="w-full max-w-[320px] p-6 rounded-[24px] bg-[#DCE1FF] border-2 border-[#1A47C3]/30 flex flex-col items-center text-center gap-2 shadow-sm">
            <span className="text-[10px] font-bold text-[#1A47C3] uppercase tracking-wider">
              VALUATION CONTEXT
            </span>
            <h3 className="font-heading font-extrabold text-[20px] text-[#001551]">
              Valuation Discussion
            </h3>
          </div>

          {/* 6 Connected Nodes Grid */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {nodes.map((node) => {
              const Icon = node.icon;
              return (
                <div
                  key={node.title}
                  className="p-5 rounded-[18px] bg-[#FAF8FF] border border-[#E2E1EC] flex flex-col gap-3 shadow-2xs"
                >
                  <div className="flex items-center gap-2 pb-2 border-b border-[rgba(0,0,0,0.06)]">
                    <Icon size={16} className={node.color} />
                    <span className="font-heading font-bold text-[13px] text-[#1A1B23]">
                      {node.title}
                    </span>
                  </div>
                  <ul className="space-y-1 text-[13px] text-[#444654]">
                    {node.items.map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-[#3C61DD]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3 Approaches */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {approaches.map((app) => (
            <div
              key={app.title}
              className="bg-white border border-[#E2E1EC] rounded-[20px] p-6 flex flex-col justify-between gap-3 shadow-xs"
            >
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold text-[#3C61DD] uppercase tracking-wider">
                  APPROACH
                </span>
                <h4 className="font-heading font-bold text-[17px] text-[#1A1B23]">{app.title}</h4>
                <p className="text-[13px] text-[#444654] leading-relaxed">{app.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Valuation Limitation Banner */}
        <div className="w-full p-6 sm:p-8 rounded-[20px] bg-white border border-[#E2E1EC] text-center shadow-xs">
          <span className="font-heading font-extrabold text-[14px] sm:text-[16px] text-[#070707] uppercase tracking-wide">
            MONDIAL CAN HELP STRUCTURE THE INPUTS. THE MARKET AND THE DEAL STILL DETERMINE THE OUTCOME.
          </span>
        </div>
      </div>
    </section>
  );
}
