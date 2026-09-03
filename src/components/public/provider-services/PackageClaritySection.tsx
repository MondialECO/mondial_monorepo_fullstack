'use client';

import { Check, Clock, RotateCcw, Plus, Sparkles } from 'lucide-react';

export default function PackageClaritySection() {
  const packages = [
    {
      name: 'BASIC',
      price: '$299',
      desc: 'For early-stage startups needing a quick visual foundation.',
      delivery: '3 Days Delivery',
      revisions: '1 Revision',
      includes: [
        'Primary Logo Design',
        'Color Palette',
        'Typography Selection',
        'Brand Guidelines',
        'Social Media Assets',
      ],
      isPopular: false,
    },
    {
      name: 'STANDARD',
      price: '$599',
      desc: 'For growing businesses requiring a complete identity system.',
      delivery: '7 Days Delivery',
      revisions: '3 Revisions',
      includes: [
        'Everything in Basic',
        'Secondary Logo Variations',
        'Pattern / Texture Assets',
        '15-page Brand Guidelines',
        'Stationery Design',
      ],
      isPopular: true,
    },
    {
      name: 'PREMIUM',
      price: '$1,199',
      desc: 'For established brands needing expansive applications.',
      delivery: '14 Days Delivery',
      revisions: 'Unlimited Revisions',
      includes: [
        'Everything in Standard',
        'Social Media Templates (5)',
        'Business Card Design',
        'Deck / Presentation Template',
        'Source Files (AI, PSD)',
      ],
      isPopular: false,
    },
  ];

  const differentiators = ['SCOPE', 'DELIVERABLES', 'DELIVERY TIME', 'REVISIONS', 'SUPPORT'];
  const addOns = ['Rush Delivery', 'Additional Revision', 'Extra Deliverable', 'Strategy Session'];

  return (
    <section className="w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#FAF8FF] border-b border-[rgba(0,0,0,0.06)] flex justify-center">
      <div className="w-full max-w-[1240px] flex flex-col gap-12 sm:gap-16">
        {/* Header */}
        <div className="flex flex-col gap-3 max-w-[840px]">
          <span className="text-[12px] font-bold text-[#3C61DD] uppercase tracking-wider">
            WHEN PACKAGES MAKE SENSE
          </span>
          <h2 className="text-[32px] sm:text-[44px] font-heading font-bold text-[#070707] leading-[1.15] tracking-tight">
            Give clients a clearer starting point.
          </h2>
          <p className="text-[15px] sm:text-[17px] text-[#444654] leading-[1.6]">
            For fixed-price services, Providers can structure Basic, Standard and Premium options around meaningful differences in scope, delivery and output.
          </p>
        </div>

        {/* Illustrative Package Example Banner */}
        <div className="flex items-center justify-between">
          <span className="px-3 py-1 rounded bg-[#E2E1EC] text-[11px] font-extrabold uppercase text-[#1A1B23]">
            ILLUSTRATIVE EXAMPLE — STARTUP BRAND IDENTITY
          </span>
          <span className="text-[11px] text-[#747685]">All prices are illustrative demo content</span>
        </div>

        {/* 3 Package Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {packages.map((pkg) => (
            <div
              key={pkg.name}
              className={`p-6 sm:p-8 rounded-[28px] bg-white border flex flex-col justify-between gap-6 transition-all ${
                pkg.isPopular
                  ? 'border-2 border-[#3C61DD] shadow-lg relative'
                  : 'border-[#E2E1EC] shadow-xs'
              }`}
            >
              {pkg.isPopular && (
                <div className="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-[#3C61DD] text-white text-[9px] font-extrabold uppercase shadow-sm">
                  POPULAR CHOICE
                </div>
              )}

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1 pb-3 border-b border-[rgba(0,0,0,0.06)]">
                  <span className="text-[11px] font-bold text-[#747685] uppercase">
                    {pkg.name}
                  </span>
                  <div className="text-[36px] font-heading font-extrabold text-[#1A1B23] leading-none my-1">
                    {pkg.price}
                  </div>
                  <p className="text-[12px] text-[#444654]">{pkg.desc}</p>
                </div>

                <div className="flex items-center gap-4 text-[11px] font-bold text-[#1A47C3]">
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> {pkg.delivery}
                  </span>
                  <span className="flex items-center gap-1">
                    <RotateCcw size={12} /> {pkg.revisions}
                  </span>
                </div>

                <div className="space-y-2 pt-2 text-[12px]">
                  <span className="text-[10px] font-bold text-[#747685] uppercase block">
                    INCLUDES:
                  </span>
                  {pkg.includes.map((inc) => (
                    <div key={inc} className="flex items-center gap-2 text-[#1A1B23]">
                      <Check size={13} className="text-[#157A55] shrink-0" />
                      <span>{inc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Differentiators & Add-ons Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {/* Differentiators */}
          <div className="p-6 rounded-[24px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col gap-3">
            <span className="text-[11px] font-bold text-[#747685] uppercase tracking-wider">
              PACKAGES CAN DIFFER BY:
            </span>
            <div className="flex flex-wrap gap-2">
              {differentiators.map((diff) => (
                <span
                  key={diff}
                  className="px-3 py-1.5 rounded-[8px] bg-[#FAF8FF] border border-[#E2E1EC] text-[12px] font-bold text-[#1A1B23]"
                >
                  {diff}
                </span>
              ))}
            </div>
          </div>

          {/* Add-ons */}
          <div className="p-6 rounded-[24px] bg-white border border-[#E2E1EC] shadow-xs flex flex-col gap-3">
            <span className="text-[11px] font-bold text-[#747685] uppercase tracking-wider">
              OPTIONAL ADD-ONS
            </span>
            <div className="flex flex-wrap gap-2">
              {addOns.map((add) => (
                <span
                  key={add}
                  className="px-3 py-1.5 rounded-[8px] bg-[#F3F2FD] text-[12px] font-semibold text-[#1A47C3] flex items-center gap-1.5"
                >
                  <Plus size={12} /> {add}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Package Principle Statement */}
        <div className="p-6 sm:p-7 rounded-[20px] bg-white border border-[#E2E1EC] text-center shadow-xs">
          <h3 className="font-heading font-extrabold text-[15px] sm:text-[18px] text-[#070707] uppercase tracking-wide">
            PACKAGES SHOULD MAKE THE DECISION CLEARER. NOT MAKE THE SERVICE MORE CONFUSING.
          </h3>
        </div>
      </div>
    </section>
  );
}
