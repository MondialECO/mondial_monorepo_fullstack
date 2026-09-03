'use client';

import { DollarSign, Clock, Layers, Calendar, FileText, ArrowRight, ArrowDown } from 'lucide-react';

export default function ProviderPricingSection() {
  const models = [
    {
      title: 'Fixed Price',
      desc: 'Best for clearly defined outcomes.',
      example: 'Startup Brand Identity',
      icon: DollarSign,
    },
    {
      title: 'Hourly',
      desc: 'Best for flexible specialist time.',
      example: 'Development Support',
      icon: Clock,
    },
    {
      title: 'Milestone-Based',
      desc: 'Best for projects with defined stages.',
      example: 'MVP Development',
      icon: Layers,
    },
    {
      title: 'Monthly Retainer',
      desc: 'Best for ongoing professional support.',
      example: 'Fractional CFO',
      icon: Calendar,
    },
    {
      title: 'Custom Quote',
      desc: 'Best for complex or context-specific work.',
      example: 'Investor-Side Due Diligence',
      icon: FileText,
    },
  ];

  const archetypes = [
    { title: 'Builder Provider', fit: 'Fixed / Hourly / Milestone' },
    { title: 'Structural Provider', fit: 'Retainer / Custom Quote' },
    { title: 'Deal Provider', fit: 'Custom Quote / Milestone' },
  ];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#747685] uppercase tracking-wider">
            Price the Way the Work Actually Works
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Not Every Service Belongs in a Package.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            Different services require different commercial structures. Align the pricing model with the predictability and scope of the engagement.
          </p>
        </div>

        {/* 5-Column Pricing Spectrum */}
        <div className="flex flex-col gap-3">
          <div className="flex justify-between text-[11px] font-bold text-[#747685] uppercase px-1">
            <span>← More Predictable</span>
            <span>More Customized →</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-stretch">
            {models.map((m) => {
              const Icon = m.icon;
              return (
                <div
                  key={m.title}
                  className="p-5 rounded-[22px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-2xs flex flex-col justify-between gap-4"
                >
                  <div className="flex flex-col gap-3">
                    <div className="w-9 h-9 rounded-[10px] bg-white border border-[#E2E1EC] flex items-center justify-center text-[#3C61DD]">
                      <Icon size={16} />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-[15px] text-[#1A1B23]">
                        {m.title}
                      </h3>
                      <p className="text-[12px] text-[#444654] mt-1">{m.desc}</p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-[10px] bg-white border border-[#E2E1EC] text-[11px]">
                    <span className="text-[9px] font-bold text-[#747685] uppercase block">
                      EXAMPLE
                    </span>
                    <span className="font-semibold text-[#1A1B23]">{m.example}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pricing Principle & Archetype Alignment Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left: Pricing Principle (6 cols) */}
          <div className="lg:col-span-6 p-6 sm:p-8 rounded-[24px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-5">
            <span className="text-[11px] font-bold text-[#747685] uppercase tracking-wider">
              PRICING PRINCIPLE
            </span>

            <div className="flex items-center justify-between text-[12px] font-bold text-[#1A1B23] p-3 rounded-[12px] bg-white border border-[#E2E1EC]">
              <span>Work Shape</span>
              <span className="text-[#3C61DD]">➔</span>
              <span>Pricing Model</span>
              <span className="text-[#3C61DD]">➔</span>
              <span>Client Expectation</span>
            </div>

            <p className="font-serif italic text-[16px] text-[#444654] leading-relaxed">
              &ldquo;The Pricing Model Should Follow the Service. Not the Other Way Around.&rdquo;
            </p>
          </div>

          {/* Right: Archetype Alignment (6 cols) */}
          <div className="lg:col-span-6 p-6 sm:p-8 rounded-[24px] bg-[#FAF8FF] border border-[#E2E1EC] shadow-xs flex flex-col justify-between gap-4">
            <span className="text-[11px] font-bold text-[#747685] uppercase tracking-wider">
              PROVIDER ARCHETYPE ALIGNMENT
            </span>

            <div className="space-y-2.5">
              {archetypes.map((arch) => (
                <div
                  key={arch.title}
                  className="p-3 rounded-[12px] bg-white border border-[#E2E1EC] flex items-center justify-between text-[12px]"
                >
                  <span className="font-bold text-[#1A1B23]">{arch.title}</span>
                  <span className="text-[#3C61DD] font-semibold">{arch.fit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Final Equation */}
        <div className="p-5 sm:p-6 rounded-[20px] bg-white border border-[#E2E1EC] shadow-xs flex flex-wrap items-center justify-center gap-3 text-[13px] font-bold text-[#1A1B23]">
          <span className="px-4 py-2 rounded-[10px] bg-[#FAF8FF] border border-[#E2E1EC]">
            Clear Scope
          </span>
          <span className="text-[#3C61DD] text-[16px]">+</span>
          <span className="px-4 py-2 rounded-[10px] bg-[#FAF8FF] border border-[#E2E1EC]">
            Right Pricing Model
          </span>
          <span className="text-[#3C61DD] text-[16px]">➔</span>
          <span className="px-5 py-2 rounded-[10px] bg-[#1A47C3] text-white shadow-xs">
            Clearer Commercial Expectation
          </span>
        </div>
      </div>
    </section>
  );
}
